"use strict";

const state = {
  seats: new Map(),
  inspectedId: null
};

const dom = {};

function init() {
  dom.canvas = document.getElementById("venueCanvas");
  dom.details = document.getElementById("seatDetails");

  state.seats = buildSeatModel(VENUE);
  renderVenue(dom.canvas, VENUE, state.seats);
  renderDetails();
  initNavigation();

  dom.canvas.addEventListener("click", onSeatClick);
  dom.details.addEventListener("click", onDetailsClick);
  document.addEventListener("keydown", onKeyDown);
}

function onSeatClick(event) {
  const button = event.target.closest(".seat");
  if (!button) return;
  inspectSeat(button.dataset.seatId);
}

function onDetailsClick(event) {
  if (event.target.closest("[data-action='clear']")) {
    clearInspection();
  }
}

function onKeyDown(event) {
  if (event.key === "Escape") {
    clearInspection();
  }
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

  state.inspectedId = null;
  updateSeatElement(previous, false);
  renderDetails();
}

const STATUS_TEXT = {
  [SEAT_STATUS.AVAILABLE]: "Available",
  [SEAT_STATUS.IN_CART]: "In your cart",
  [SEAT_STATUS.UNAVAILABLE]: "Unavailable"
};

const STATUS_NOTE = {
  [SEAT_STATUS.AVAILABLE]: "This seat is free to book.",
  [SEAT_STATUS.IN_CART]: "This seat is already in your cart.",
  [SEAT_STATUS.UNAVAILABLE]: "This seat has already been sold and cannot be booked."
};

function renderDetails() {
  const seat = state.seats.get(state.inspectedId);
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

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "btn btn--ghost";
  clear.dataset.action = "clear";
  clear.textContent = "Clear selection";

  dom.details.append(card, note, clear);
}

function formatPrice(amount) {
  return `${amount} ${VENUE.currency}`;
}

document.addEventListener("DOMContentLoaded", init);
