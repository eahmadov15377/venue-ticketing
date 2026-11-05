"use strict";

const state = {
  seats: new Map()
};

function init() {
  state.seats = buildSeatModel(VENUE);
  renderVenue(document.getElementById("venueCanvas"), VENUE, state.seats);
}

document.addEventListener("DOMContentLoaded", init);
