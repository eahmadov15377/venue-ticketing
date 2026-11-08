"use strict";

const CART_STORAGE_KEY = "grandAda.cart.v1";

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    return true;
  } catch (error) {
    return false;
  }
}

function readSavedCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved === null) return { ids: [], isValid: true };

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? { ids: parsed, isValid: true } : { ids: [], isValid: false };
  } catch (error) {
    return { ids: [], isValid: false };
  }
}

function loadCart() {
  const savedCart = readSavedCart();
  const restoredIds = [];

  savedCart.ids.forEach((seatId) => {
    const seat = typeof seatId === "string" ? state.seats.get(seatId) : undefined;
    if (!seat || seat.status !== SEAT_STATUS.AVAILABLE) return;

    seat.status = SEAT_STATUS.IN_CART;
    restoredIds.push(seat.id);
    updateSeatElement(seat, seat.id === state.inspectedId);
  });

  state.cart = restoredIds;

  if (!savedCart.isValid || restoredIds.length !== savedCart.ids.length) {
    saveCart();
  }
}
