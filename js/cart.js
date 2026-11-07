"use strict";

function addToCart(seatId) {
  const seat = state.seats.get(seatId);
  if (!seat || seat.status !== SEAT_STATUS.AVAILABLE || state.cart.includes(seat.id)) {
    return false;
  }

  seat.status = SEAT_STATUS.IN_CART;
  state.cart.push(seat.id);
  saveCart();
  refreshUI([seat]);
  return true;
}

function removeFromCart(seatId) {
  if (!state.cart.includes(seatId)) return false;

  const seat = state.seats.get(seatId);
  seat.status = SEAT_STATUS.AVAILABLE;
  state.cart = state.cart.filter((id) => id !== seatId);
  saveCart();
  refreshUI([seat]);
  return true;
}

function clearCart() {
  const removedSeats = state.cart.map((seatId) => state.seats.get(seatId));

  removedSeats.forEach((seat) => {
    seat.status = SEAT_STATUS.AVAILABLE;
  });
  state.cart = [];
  saveCart();
  refreshUI(removedSeats);
}

function refreshUI(changedSeats) {
  changedSeats.forEach((seat) => {
    updateSeatElement(seat, seat.id === state.inspectedId);
  });
  renderCart();
  renderDetails();
}

function renderCart() {
  const cartSeats = state.cart.map((seatId) => state.seats.get(seatId));
  const total = cartSeats.reduce((sum, seat) => sum + seat.price, 0);

  dom.cartList.replaceChildren(...cartSeats.map(createCartItem));
  dom.cartCount.textContent = String(cartSeats.length);
  dom.cartTotal.textContent = formatPrice(total);
  dom.cartEmpty.hidden = cartSeats.length > 0;
  dom.cartClear.hidden = cartSeats.length === 0;
}

function createCartItem(seat) {
  const item = document.createElement("li");
  item.className = `cart-item section--${seat.sectionId}`;

  const marker = document.createElement("span");
  marker.className = "cart-item-marker";
  marker.setAttribute("aria-hidden", "true");

  const info = document.createElement("button");
  info.type = "button";
  info.className = "cart-item-info";
  info.dataset.action = "inspect";
  info.dataset.seatId = seat.id;
  info.title = "Show this seat on the map";

  const title = document.createElement("span");
  title.className = "cart-item-title";
  title.textContent = `Row ${seat.row} · Seat ${seat.number}`;

  const section = document.createElement("span");
  section.className = "cart-item-section";
  section.textContent = seat.sectionName;

  info.append(title, section);

  const price = document.createElement("span");
  price.className = "cart-item-price";
  price.textContent = formatPrice(seat.price);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn btn--ghost btn--small";
  remove.dataset.action = "remove";
  remove.dataset.seatId = seat.id;
  remove.setAttribute("aria-label", `Remove row ${seat.row} seat ${seat.number}`);
  remove.textContent = "Remove";

  item.append(marker, info, price, remove);
  return item;
}

function onCartListClick(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const seatId = actionButton.dataset.seatId;

  if (actionButton.dataset.action === "remove") {
    const removeButtons = [...dom.cartList.querySelectorAll("[data-action='remove']")];
    const removedIndex = removeButtons.indexOf(actionButton);
    if (removeFromCart(seatId)) focusAfterRemoval(removedIndex);
  } else if (actionButton.dataset.action === "inspect") {
    inspectSeat(seatId);
    revealElement(state.seats.get(seatId).element);
  }
}

function onClearCartClick() {
  clearCart();
  focusWithoutScroll(dom.cartHeading);
}

function focusAfterRemoval(removedIndex) {
  const remainingButtons = dom.cartList.querySelectorAll("[data-action='remove']");
  const nextButton = remainingButtons[Math.min(removedIndex, remainingButtons.length - 1)];
  focusWithoutScroll(nextButton || dom.cartHeading);
}
