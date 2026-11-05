"use strict";

const VENUE = {
  name: "Grand Aurora Theatre",
  currency: "AZN",

  blockNames: ["Left", "Centre", "Right"],

  sections: [
    {
      id: "premium",
      name: "Premium Stalls",
      price: 75,
      rows: ["A", "B", "C", "D"],
      blocks: [6, 12, 6]
    },
    {
      id: "standard",
      name: "Standard Stalls",
      price: 45,
      rows: ["E", "F", "G", "H", "I", "J", "K"],
      blocks: [8, 14, 8]
    },
    {
      id: "balcony",
      name: "Balcony",
      price: 25,
      rows: ["L", "M", "N", "O"],
      blocks: [9, 16, 9]
    }
  ],

  unavailable: [
    "A9", "A10", "A11",
    "B3", "B15", "B16",
    "C20", "D1", "D2",
    "E12", "E13", "F5",
    "G18", "G19", "G20", "H27",
    "I10", "J2", "J3", "K15",
    "L17", "L18", "M1", "M33",
    "N9", "N22", "O16", "O17"
  ]
};
