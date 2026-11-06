"use strict";

function addToCart(seatId) {
  const seat = state.seats.get(seatId);
  if (!seat || seat.status !== SEAT_STATUS.AVAILABLE || state.cart.includes(seat.id)) {
    return false;
  }

  seat.status = SEAT_STATUS.IN_CART;
  state.cart.push(seat.id);
  updateSeatElement(seat, seat.id === state.inspectedId);
  renderCart();
  renderDetails();
  return true;
}

function renderCart() {
  const cartSeats = state.cart.map((seatId) => state.seats.get(seatId));
  const total = cartSeats.reduce((sum, seat) => sum + seat.price, 0);

  dom.cartList.replaceChildren(...cartSeats.map(createCartItem));
  dom.cartCount.textContent = String(cartSeats.length);
  dom.cartTotal.textContent = formatPrice(total);
  dom.cartEmpty.hidden = cartSeats.length > 0;
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

  item.append(marker, info, price);
  return item;
}

function onCartListClick(event) {
  const inspectButton = event.target.closest("[data-action='inspect']");
  if (inspectButton) {
    inspectSeat(inspectButton.dataset.seatId);
  }
}
