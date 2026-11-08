"use strict";

const state = {
  seats: new Map(),
  inspectedId: null,
  cart: []
};

const dom = {};

function init() {
  dom.canvas = document.getElementById("venueCanvas");
  dom.details = document.getElementById("seatDetails");
  dom.cartList = document.getElementById("cartList");
  dom.cartCount = document.getElementById("cartCount");
  dom.cartTotal = document.getElementById("cartTotal");
  dom.cartEmpty = document.getElementById("cartEmpty");
  dom.cartClear = document.getElementById("cartClear");
  dom.cartHeading = document.getElementById("cartHeading");

  state.seats = buildSeatModel(VENUE);
  renderVenue(dom.canvas, VENUE, state.seats);
  loadCart();
  renderDetails();
  renderCart();
  initNavigation();

  dom.canvas.addEventListener("click", onSeatClick);
  dom.details.addEventListener("click", onDetailsClick);
  dom.cartList.addEventListener("click", onCartListClick);
  dom.cartClear.addEventListener("click", onClearCartClick);
  document.addEventListener("keydown", onKeyDown);
}

function onSeatClick(event) {
  const button = event.target.closest(".seat");
  if (!button) return;
  inspectSeat(button.dataset.seatId);
}

function onDetailsClick(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  if (actionButton.dataset.action === "add") {
    addToCart(state.inspectedId);
  } else if (actionButton.dataset.action === "clear") {
    clearInspection();
  }
}

function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) return;

  if (event.key === "Escape") {
    clearInspection();
    return;
  }

  const navAction = NAV_SHORTCUTS[event.key];
  if (!navAction) return;

  event.preventDefault();
  runNavAction(navAction);
}

function isEditableTarget(target) {
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function focusWithoutScroll(element) {
  if (element) element.focus({ preventScroll: true });
}

function inspectSeat(seatId) {
  const seat = state.seats.get(seatId);
  if (!seat) return;

  const previous = state.seats.get(state.inspectedId);
  state.inspectedId = seat.id;

  if (previous) updateSeatElement(previous, false);
  updateSeatElement(seat, true);
  renderDetails();
}

function clearInspection() {
  const previous = state.seats.get(state.inspectedId);
  if (!previous) return;

  const hadFocusInDetails = dom.details.contains(document.activeElement);
  state.inspectedId = null;
  updateSeatElement(previous, false);
  renderDetails();

  if (hadFocusInDetails) focusWithoutScroll(previous.element);
}

const STATUS_NOTE = {
  [SEAT_STATUS.AVAILABLE]: "This seat is free to book.",
  [SEAT_STATUS.IN_CART]: "This seat is already in your cart.",
  [SEAT_STATUS.UNAVAILABLE]: "This seat has already been sold and cannot be booked."
};

function getAddButtonText(seat) {
  if (seat.status === SEAT_STATUS.IN_CART) return "Already in cart";
  if (seat.status === SEAT_STATUS.UNAVAILABLE) return "Unavailable";
  return `Add to cart: ${formatPrice(seat.price)}`;
}

function renderDetails() {
  const seat = state.seats.get(state.inspectedId);
  const focusedAction = dom.details.contains(document.activeElement)
    ? document.activeElement.dataset.action
    : null;
  dom.details.innerHTML = "";

  if (!seat) {
    const placeholder = document.createElement("p");
    placeholder.className = "placeholder";
    placeholder.textContent = "Select a seat on the map to see its details and price.";
    dom.details.appendChild(placeholder);
    return;
  }

  const card = document.createElement("div");
  card.className = `ticket-card section--${seat.sectionId}`;

  const eyebrow = document.createElement("p");
  eyebrow.className = "ticket-eyebrow";
  eyebrow.textContent = seat.sectionName;

  const title = document.createElement("p");
  title.className = "ticket-title";
  title.textContent = `Row ${seat.row} · Seat ${seat.number}`;

  const price = document.createElement("p");
  price.className = "ticket-price";
  price.textContent = formatPrice(seat.price);

  const list = document.createElement("dl");
  list.className = "ticket-facts";
  [
    ["Seat ID", seat.id],
    ["Section", seat.sectionName],
    ["Block", seat.block],
    ["Row", seat.row],
    ["Seat", seat.number],
    ["Status", STATUS_TEXT[seat.status]]
  ].forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    if (label === "Status") dd.className = `status status--${seat.status}`;
    list.append(dt, dd);
  });

  card.append(eyebrow, title, price, list);

  const note = document.createElement("p");
  note.className = `status-note status-note--${seat.status}`;
  note.textContent = STATUS_NOTE[seat.status];

  const add = document.createElement("button");
  add.type = "button";
  add.className = "btn btn--primary";
  add.dataset.action = "add";
  add.textContent = getAddButtonText(seat);
  add.disabled = seat.status !== SEAT_STATUS.AVAILABLE;

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "btn btn--ghost";
  clear.dataset.action = "clear";
  clear.textContent = "Clear selection";

  const actions = document.createElement("div");
  actions.className = "details-actions";
  actions.append(add, clear);

  dom.details.append(card, note, actions);

  if (focusedAction) restoreDetailsFocus(focusedAction);
}

function restoreDetailsFocus(action) {
  const sameButton = dom.details.querySelector(`[data-action='${action}']:not(:disabled)`);
  focusWithoutScroll(sameButton || dom.details.querySelector("[data-action='clear']"));
}

function formatPrice(amount) {
  return `${amount} ${VENUE.currency}`;
}

document.addEventListener("DOMContentLoaded", init);
