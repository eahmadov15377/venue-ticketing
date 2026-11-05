"use strict";

const SEAT_STATUS = {
  AVAILABLE: "available",
  IN_CART: "in-cart",
  UNAVAILABLE: "unavailable"
};

function buildSeatModel(venue) {
  const seats = new Map();
  const unavailable = new Set(venue.unavailable);

  venue.sections.forEach((section) => {
    section.rows.forEach((row) => {
      let number = 1;

      section.blocks.forEach((blockSize, blockIndex) => {
        for (let i = 0; i < blockSize; i++) {
          const id = `${row}${number}`;

          seats.set(id, {
            id,
            row,
            number,
            sectionId: section.id,
            sectionName: section.name,
            block: venue.blockNames[blockIndex],
            price: section.price,
            status: unavailable.has(id) ? SEAT_STATUS.UNAVAILABLE : SEAT_STATUS.AVAILABLE,
            element: null
          });

          number++;
        }
      });
    });
  });

  return seats;
}

function renderVenue(container, venue, seats) {
  container.innerHTML = "";

  const stage = document.createElement("div");
  stage.className = "stage";
  stage.textContent = "Stage";
  container.appendChild(stage);

  venue.sections.forEach((section) => {
    container.appendChild(createSection(section, venue, seats));
  });

  container.appendChild(createEntrances());
}

function createSection(section, venue, seats) {
  const wrapper = document.createElement("section");
  wrapper.className = `venue-section section--${section.id}`;
  wrapper.setAttribute("aria-label", `${section.name}, ${section.price} ${venue.currency}`);

  const label = document.createElement("h3");
  label.className = "section-label";
  label.innerHTML = `${section.name} <span>${section.price} ${venue.currency}</span>`;
  wrapper.appendChild(label);

  const seatsPerRow = section.blocks.reduce((sum, n) => sum + n, 0);

  section.rows.forEach((row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "seat-row";
    rowEl.appendChild(createRowLabel(row));

    let number = 1;
    section.blocks.forEach((blockSize, blockIndex) => {
      if (blockIndex > 0) {
        const aisle = document.createElement("span");
        aisle.className = "aisle";
        aisle.setAttribute("aria-hidden", "true");
        rowEl.appendChild(aisle);
      }

      const blockEl = document.createElement("div");
      blockEl.className = "seat-block";

      for (let i = 0; i < blockSize; i++) {
        const seat = seats.get(`${row}${number}`);
        blockEl.appendChild(createSeatButton(seat, number, seatsPerRow, venue.currency));
        number++;
      }

      rowEl.appendChild(blockEl);
    });

    rowEl.appendChild(createRowLabel(row));
    wrapper.appendChild(rowEl);
  });

  return wrapper;
}

function createRowLabel(row) {
  const label = document.createElement("span");
  label.className = "row-label";
  label.textContent = row;
  label.setAttribute("aria-hidden", "true");
  return label;
}

function createSeatButton(seat, number, seatsPerRow, currency) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "seat";
  button.dataset.seatId = seat.id;
  button.textContent = seat.number;
  button.setAttribute(
    "aria-label",
    `${seat.sectionName}, row ${seat.row}, seat ${seat.number}, ${seat.price} ${currency}`
  );

  const middle = (seatsPerRow + 1) / 2;
  const t = (number - middle) / (middle - 1);
  button.style.setProperty("--curve", `${(-10 * t * t).toFixed(1)}px`);

  seat.element = button;
  updateSeatElement(seat);
  return button;
}

function updateSeatElement(seat, isInspected = false) {
  const el = seat.element;
  if (!el) return;

  el.classList.toggle("seat--available", seat.status === SEAT_STATUS.AVAILABLE);
  el.classList.toggle("seat--in-cart", seat.status === SEAT_STATUS.IN_CART);
  el.classList.toggle("seat--unavailable", seat.status === SEAT_STATUS.UNAVAILABLE);
  el.classList.toggle("seat--inspected", isInspected);

  el.setAttribute("aria-pressed", String(isInspected));
  el.setAttribute("aria-disabled", String(seat.status === SEAT_STATUS.UNAVAILABLE));
}

function createEntrances() {
  const footer = document.createElement("div");
  footer.className = "entrances";
  footer.innerHTML = `
    <span class="entrance">⇩ Entrance</span>
    <span class="entrance">⇩ Main Entrance</span>
    <span class="entrance">⇩ Entrance</span>
  `;
  footer.setAttribute("aria-hidden", "true");
  return footer;
}
