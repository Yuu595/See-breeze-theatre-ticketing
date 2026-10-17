"use strict";

const CATEGORIES = {
  vip:      { id: "vip",      label: "VIP Box",  price: 150, color: "#f2b544" },
  premium:  { id: "premium",  label: "Premium",  price: 90,  color: "#ff7a59" },
  standard: { id: "standard", label: "Standard", price: 60,  color: "#22b3c4" },
  economy:  { id: "economy",  label: "Economy",  price: 30,  color: "#8b93f5" },
};

function createBoxes(side, x, rotate) {
  const boxes = [];
  for (let n = 1; n <= 4; n++) {
    boxes.push({
      id: `B${side}${n}`,
      name: `Box ${side}${n}`,
      type: "box",
      category: "vip",
      rows: ["A", "B"],
      seatsPerRow: 2,
      x: x,
      y: 190 + (n - 1) * 92,
      rotate: rotate,
    });
  }
  return boxes;
}

const VENUE = {
  name: "Sea Breeze Theatre",
  event: "Sunset Symphony Night",
  date: "Sat 19 Dec 2026 · 19:00",
  currency: "AZN",

  width: 1200,
  height: 1000,

  stage: { x: 600, y: 34, width: 540, height: 96, label: "STAGE" },

  soldSeats: [
    "SC-A-2", "SC-A-9", "SC-B-5", "SC-B-11", "SC-C-3", "SC-C-8", "SC-C-13", "SC-E-6",
    "SC-E-12", "SC-F-2", "SC-F-15", "SC-G-9", "SC-G-10", "SC-H-1", "SC-H-17",
    "SL-A-3", "SL-B-6", "SL-D-2", "SL-E-5", "SL-G-1", "SL-H-7",
    "SR-A-5", "SR-C-4", "SR-D-7", "SR-F-2", "SR-G-5", "SR-H-3",
    "BL1-B-2", "BR3-A-1",
    "DC-J-4", "DC-J-15", "DC-K-9", "DC-K-20", "DC-L-1", "DC-L-13", "DC-M-6", "DC-M-18", "DC-M-24",
    "BA-N-10", "BA-N-22", "BA-P-3", "BA-P-16", "BA-Q-7", "BA-Q-19", "BA-R-12", "BA-R-25",
    "BA-S-4", "BA-S-14", "BA-T-9", "BA-T-20",
  ],
  soldOutSections: ["BR2"],

  sections: [
    {
      id: "SC", name: "Stalls Centre", type: "block", category: "premium",
      rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
      seatsPerRow: 12, rowGrowth: 1,
      x: 600, y: 168, rotate: 0,
    },
    {
      id: "SL", name: "Stalls Left", type: "block", category: "standard",
      rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
      seatsPerRow: 7,
      x: 258, y: 190, rotate: 12,
    },
    {
      id: "SR", name: "Stalls Right", type: "block", category: "standard",
      rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
      seatsPerRow: 7,
      x: 942, y: 190, rotate: -12,
    },
    ...createBoxes("L", 72, 14),
    ...createBoxes("R", 1128, -14),
    {
      id: "DC", name: "Dress Circle", type: "block", category: "standard",
      rows: ["J", "K", "L", "M"],
      seatsPerRow: 24, aisles: [6, 18],
      x: 600, y: 520, rotate: 0,
    },
    {
      id: "BA", name: "Balcony", type: "block", category: "economy",
      rows: ["N", "P", "Q", "R", "S", "T"],
      seatsPerRow: 26, aisles: [7, 19],
      x: 600, y: 700, rotate: 0,
    },
  ],

  features: [
    { type: "label", text: "Orchestra pit", x: 600, y: 140 },
    { type: "label", text: "Cross aisle", x: 600, y: 488 },
    { type: "label", text: "Balcony walkway", x: 600, y: 672 },
    { type: "block", text: "Sound & light booth", x: 600, y: 936, width: 220, height: 40 },
    { type: "door", text: "Entrance A", x: 120, y: 950 },
    { type: "door", text: "Entrance B", x: 1080, y: 950 },
  ],
};

function seatsInRow(section, rowIndex) {
  const extraSeats = rowIndex * (section.rowGrowth || 0);
  return section.seatsPerRow + extraSeats;
}

function buildVenueModel(venue) {
  const seatIndex = new Map();

  const sections = venue.sections.map((config) => {
    const section = { ...config, aisles: config.aisles || [], seatRows: [] };
    const category = CATEGORIES[section.category];

    section.rows.forEach((rowLabel, rowIndex) => {
      const seats = [];
      const count = seatsInRow(section, rowIndex);

      for (let number = 1; number <= count; number++) {
        const id = `${section.id}-${rowLabel}-${number}`;
        const seat = {
          id: id,
          section: section,
          row: rowLabel,
          number: number,
          category: category,
          price: category.price,
          unavailable: venue.soldOutSections.includes(section.id) || venue.soldSeats.includes(id),
        };
        seats.push(seat);
        seatIndex.set(id, seat);
      }
      section.seatRows.push({ label: rowLabel, seats: seats });
    });

    return section;
  });

  return { sections: sections, seatIndex: seatIndex, totalSeats: seatIndex.size };
}

const VENUE_MODEL = buildVenueModel(VENUE);
