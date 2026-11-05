"use strict";

function init() {
  const seatCount = VENUE.sections.reduce((total, section) => {
    const perRow = section.blocks.reduce((sum, n) => sum + n, 0);
    return total + perRow * section.rows.length;
  }, 0);

  console.log(`${VENUE.name}: ${VENUE.sections.length} sections, ${seatCount} seats`);
}

document.addEventListener("DOMContentLoaded", init);
