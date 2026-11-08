"use strict";

const NAV_CONFIG = {
  zoomFactor: 1.2,
  panStep: 80,
  maxScale: 3,
  minScaleRatio: 0.8,
  fitPadding: 16,
  minVisiblePixels: 80,
  revealMargin: 24,
  resizeDebounceMs: 150,
  wheelZoomSpeed: 0.0015,
  pinchZoomSpeed: 0.01,
  maxWheelDelta: 200,
  wheelLineHeight: 16,
  dragThreshold: 5
};

const NAV_ACTIONS = {
  "zoom-in": () => zoomBy(NAV_CONFIG.zoomFactor),
  "zoom-out": () => zoomBy(1 / NAV_CONFIG.zoomFactor),
  "move-up": () => panBy(0, NAV_CONFIG.panStep),
  "move-down": () => panBy(0, -NAV_CONFIG.panStep),
  "move-left": () => panBy(NAV_CONFIG.panStep, 0),
  "move-right": () => panBy(-NAV_CONFIG.panStep, 0),
  reset: () => resetView()
};

const NAV_SHORTCUTS = {
  "+": "zoom-in",
  "=": "zoom-in",
  "-": "zoom-out",
  "_": "zoom-out",
  ArrowUp: "move-up",
  ArrowDown: "move-down",
  ArrowLeft: "move-left",
  ArrowRight: "move-right",
  "0": "reset"
};

const view = {
  scale: 1,
  x: 0,
  y: 0,
  minScale: 1,
  hasUserMoved: false
};

const navDom = {};

const drag = {
  pointerId: null,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  isDragging: false,
  suppressNextClick: false
};

function initNavigation() {
  navDom.viewport = document.getElementById("viewport");
  navDom.canvas = document.getElementById("venueCanvas");
  navDom.toolbar = document.getElementById("mapToolbar");
  navDom.zoomLevel = document.getElementById("zoomLevel");
  navDom.zoomIn = navDom.toolbar.querySelector("[data-nav='zoom-in']");
  navDom.zoomOut = navDom.toolbar.querySelector("[data-nav='zoom-out']");

  navDom.toolbar.addEventListener("click", onToolbarClick);
  navDom.canvas.addEventListener("focusin", revealFocusedSeat);
  navDom.viewport.addEventListener("wheel", onViewportWheel, { passive: false });
  navDom.viewport.addEventListener("pointerdown", onDragStart);
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
  navDom.viewport.addEventListener("click", suppressClickAfterDrag, true);
  window.addEventListener("resize", debounce(onWindowResize, NAV_CONFIG.resizeDebounceMs));

  resetView();
}

function onToolbarClick(event) {
  const button = event.target.closest("[data-nav]");
  if (!button) return;
  runNavAction(button.dataset.nav);
}

function runNavAction(actionName) {
  const action = NAV_ACTIONS[actionName];
  if (action) runAnimated(action);
}

function onWindowResize() {
  setAnimated(false);

  if (!view.hasUserMoved) {
    resetView();
    return;
  }

  view.minScale = computeFitScale() * NAV_CONFIG.minScaleRatio;
  view.scale = clampScale(view.scale);
  applyView();
}

function onViewportWheel(event) {
  event.preventDefault();
  setAnimated(false);

  const deltaX = wheelDeltaInPixels(event.deltaX, event.deltaMode);
  const deltaY = wheelDeltaInPixels(event.deltaY, event.deltaMode);

  if (!event.ctrlKey && Math.abs(deltaX) > Math.abs(deltaY)) {
    panBy(-deltaX, 0);
    return;
  }

  const speed = event.ctrlKey ? NAV_CONFIG.pinchZoomSpeed : NAV_CONFIG.wheelZoomSpeed;
  const limitedDelta = Math.max(-NAV_CONFIG.maxWheelDelta, Math.min(NAV_CONFIG.maxWheelDelta, deltaY));
  const origin = toViewportPoint(event.clientX, event.clientY);
  zoomBy(Math.exp(-limitedDelta * speed), origin.x, origin.y);
}

function onDragStart(event) {
  if (event.button !== 0 || drag.pointerId !== null) return;

  drag.pointerId = event.pointerId;
  drag.startX = event.clientX;
  drag.startY = event.clientY;
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
  drag.isDragging = false;
  drag.suppressNextClick = false;
}

function onDragMove(event) {
  if (event.pointerId !== drag.pointerId) return;

  if (!drag.isDragging) {
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance < NAV_CONFIG.dragThreshold) return;

    drag.isDragging = true;
    navDom.viewport.setPointerCapture(event.pointerId);
    navDom.viewport.classList.add("viewport--dragging");
    setAnimated(false);
  }

  panBy(event.clientX - drag.lastX, event.clientY - drag.lastY);
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
}

function onDragEnd(event) {
  if (event.pointerId !== drag.pointerId) return;

  if (drag.isDragging) {
    drag.suppressNextClick = true;
    navDom.viewport.classList.remove("viewport--dragging");
    if (navDom.viewport.hasPointerCapture(event.pointerId)) {
      navDom.viewport.releasePointerCapture(event.pointerId);
    }
  }

  drag.pointerId = null;
  drag.isDragging = false;
}

function suppressClickAfterDrag(event) {
  if (!drag.suppressNextClick) return;

  drag.suppressNextClick = false;
  event.stopPropagation();
  event.preventDefault();
}

function wheelDeltaInPixels(delta, deltaMode) {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) return delta * NAV_CONFIG.wheelLineHeight;
  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) return delta * navDom.viewport.clientHeight;
  return delta;
}

function toViewportPoint(clientX, clientY) {
  const box = navDom.viewport.getBoundingClientRect();
  return {
    x: clientX - box.left - navDom.viewport.clientLeft,
    y: clientY - box.top - navDom.viewport.clientTop
  };
}

function revealFocusedSeat(event) {
  if (!event.target.matches(".seat:focus-visible")) return;
  revealElement(event.target);
}

function revealElement(element) {
  const seatBox = element.getBoundingClientRect();
  const canvasBox = navDom.canvas.getBoundingClientRect();
  const renderedScale = canvasBox.width / navDom.canvas.offsetWidth;
  const targetRatio = view.scale / renderedScale;

  const left = view.x + (seatBox.left - canvasBox.left) * targetRatio;
  const right = view.x + (seatBox.right - canvasBox.left) * targetRatio;
  const top = view.y + (seatBox.top - canvasBox.top) * targetRatio;
  const bottom = view.y + (seatBox.bottom - canvasBox.top) * targetRatio;

  const dx = distanceIntoRange(left, right, 0, navDom.viewport.clientWidth);
  const dy = distanceIntoRange(top, bottom, 0, navDom.viewport.clientHeight);

  if (dx !== 0 || dy !== 0) {
    runAnimated(() => panBy(dx, dy));
  }
}

function distanceIntoRange(start, end, rangeStart, rangeEnd) {
  const margin = NAV_CONFIG.revealMargin;
  if (start < rangeStart + margin) return rangeStart + margin - start;
  if (end > rangeEnd - margin) return rangeEnd - margin - end;
  return 0;
}

function zoomBy(
  factor,
  originX = navDom.viewport.clientWidth / 2,
  originY = navDom.viewport.clientHeight / 2
) {
  const nextScale = clampScale(view.scale * factor);
  const appliedFactor = nextScale / view.scale;

  view.x = originX - (originX - view.x) * appliedFactor;
  view.y = originY - (originY - view.y) * appliedFactor;
  view.scale = nextScale;
  view.hasUserMoved = true;
  applyView();
}

function panBy(dx, dy) {
  view.x += dx;
  view.y += dy;
  view.hasUserMoved = true;
  applyView();
}

function resetView() {
  const fitScale = computeFitScale();

  view.minScale = fitScale * NAV_CONFIG.minScaleRatio;
  view.scale = fitScale;
  view.x = (navDom.viewport.clientWidth - navDom.canvas.offsetWidth * fitScale) / 2;
  view.y = (navDom.viewport.clientHeight - navDom.canvas.offsetHeight * fitScale) / 2;
  view.hasUserMoved = false;
  applyView();
}

function applyView() {
  view.x = clampOffset(view.x, navDom.canvas.offsetWidth, navDom.viewport.clientWidth);
  view.y = clampOffset(view.y, navDom.canvas.offsetHeight, navDom.viewport.clientHeight);
  navDom.canvas.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  updateNavControls();
}

function updateNavControls() {
  const isZoomInLimit = view.scale >= NAV_CONFIG.maxScale;
  const isZoomOutLimit = view.scale <= view.minScale;
  const focusedButton = document.activeElement;
  const losesFocus =
    (isZoomInLimit && focusedButton === navDom.zoomIn) ||
    (isZoomOutLimit && focusedButton === navDom.zoomOut);

  navDom.zoomLevel.textContent = `${Math.round(view.scale * 100)}%`;
  navDom.zoomIn.disabled = isZoomInLimit;
  navDom.zoomOut.disabled = isZoomOutLimit;

  if (losesFocus) {
    const otherZoomButton = focusedButton === navDom.zoomIn ? navDom.zoomOut : navDom.zoomIn;
    otherZoomButton.focus({ preventScroll: true });
  }
}

function computeFitScale() {
  const padding = NAV_CONFIG.fitPadding * 2;
  const widthRatio = (navDom.viewport.clientWidth - padding) / navDom.canvas.offsetWidth;
  const heightRatio = (navDom.viewport.clientHeight - padding) / navDom.canvas.offsetHeight;
  return Math.min(widthRatio, heightRatio, 1);
}

function clampScale(scale) {
  return Math.min(NAV_CONFIG.maxScale, Math.max(view.minScale, scale));
}

function clampOffset(offset, canvasSize, viewportSize) {
  const scaledSize = canvasSize * view.scale;
  const visiblePixels = Math.min(NAV_CONFIG.minVisiblePixels, scaledSize, viewportSize);
  return Math.min(viewportSize - visiblePixels, Math.max(visiblePixels - scaledSize, offset));
}

function runAnimated(action) {
  setAnimated(true);
  action();
}

function setAnimated(isAnimated) {
  navDom.canvas.classList.toggle("venue-canvas--animated", isAnimated);
}

function debounce(callback, delayMs) {
  let timerId = null;
  return () => {
    clearTimeout(timerId);
    timerId = setTimeout(callback, delayMs);
  };
}
