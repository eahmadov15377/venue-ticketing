"use strict";

const NAV_CONFIG = {
  zoomFactor: 1.2,
  panStep: 80,
  maxScale: 3,
  minScaleRatio: 0.8,
  fitPadding: 16,
  minVisiblePixels: 80,
  revealMargin: 24,
  resizeDebounceMs: 150
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

const view = {
  scale: 1,
  x: 0,
  y: 0,
  minScale: 1,
  hasUserMoved: false
};

const navDom = {};

function initNavigation() {
  navDom.viewport = document.getElementById("viewport");
  navDom.canvas = document.getElementById("venueCanvas");
  navDom.toolbar = document.getElementById("mapToolbar");
  navDom.zoomLevel = document.getElementById("zoomLevel");
  navDom.zoomIn = navDom.toolbar.querySelector("[data-nav='zoom-in']");
  navDom.zoomOut = navDom.toolbar.querySelector("[data-nav='zoom-out']");

  navDom.toolbar.addEventListener("click", onToolbarClick);
  navDom.canvas.addEventListener("focusin", revealFocusedSeat);
  window.addEventListener("resize", debounce(onWindowResize, NAV_CONFIG.resizeDebounceMs));

  resetView();
}

function onToolbarClick(event) {
  const button = event.target.closest("[data-nav]");
  if (!button) return;
  runAnimated(NAV_ACTIONS[button.dataset.nav]);
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

function revealFocusedSeat(event) {
  if (!event.target.matches(".seat:focus-visible")) return;

  const seatBox = event.target.getBoundingClientRect();
  const viewportBox = navDom.viewport.getBoundingClientRect();
  const dx = distanceIntoRange(seatBox.left, seatBox.right, viewportBox.left, viewportBox.right);
  const dy = distanceIntoRange(seatBox.top, seatBox.bottom, viewportBox.top, viewportBox.bottom);

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
  navDom.zoomLevel.textContent = `${Math.round(view.scale * 100)}%`;
  navDom.zoomIn.disabled = view.scale >= NAV_CONFIG.maxScale;
  navDom.zoomOut.disabled = view.scale <= view.minScale;
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
