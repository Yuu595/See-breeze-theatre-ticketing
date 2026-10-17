"use strict";

(function () {
  const { sections, seatIndex, totalSeats } = VENUE_MODEL;

  const els = {
    world: document.getElementById("map-world"),
    priceLegend: document.getElementById("price-legend"),
    seatCount: document.getElementById("seat-count"),
  };

  const seatButtons = new Map();

  const STATUS_TEXT = {
    available: "Available",
    unavailable: "Unavailable — already sold",
  };

  function formatPrice(amount) {
    return `${amount} ${VENUE.currency}`;
  }

  function getStatus(seat) {
    if (seat.unavailable) return "unavailable";
    return "available";
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderLegend() {
    Object.values(CATEGORIES).forEach((category) => {
      const item = el("li", "legend-item");
      const chip = el("span", "chip");
      chip.style.background = category.color;
      item.append(chip, el("span", "", `${category.label} `), el("strong", "", formatPrice(category.price)));
      els.priceLegend.append(item);
    });
  }

  function renderStage() {
    const { x, y, width, height, label } = VENUE.stage;
    const stage = el("div", "stage", label);
    Object.assign(stage.style, {
      left: `${x - width / 2}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
    els.world.append(stage);
  }

  function renderFeatures() {
    VENUE.features.forEach((feature) => {
      const node = el("div", `feature feature--${feature.type}`, feature.text);
      node.style.left = `${feature.x}px`;
      node.style.top = `${feature.y}px`;
      if (feature.width) node.style.width = `${feature.width}px`;
      if (feature.height) node.style.height = `${feature.height}px`;
      els.world.append(node);
    });
  }

  function createSeatButton(seat) {
    const button = el("button", "seat", String(seat.number));
    button.type = "button";
    button.dataset.id = seat.id;
    button.style.setProperty("--cat", seat.category.color);
    seatButtons.set(seat.id, button);
    return button;
  }

  function renderSection(section) {
    const category = CATEGORIES[section.category];
    const node = el("section", `venue-section venue-section--${section.type}`);
    node.style.left = `${section.x}px`;
    node.style.top = `${section.y}px`;
    node.style.transform = `translateX(-50%) rotate(${section.rotate || 0}deg)`;

    const title = el("h3", "section-title", section.name);
    if (section.type !== "box") {
      title.append(el("span", "section-price", ` · ${formatPrice(category.price)}`));
    }
    node.append(title);

    section.seatRows.forEach((row) => {
      const rowNode = el("div", "seat-row");
      const showLabels = section.type !== "box";
      if (showLabels) rowNode.append(el("span", "row-label", row.label));

      row.seats.forEach((seat) => {
        rowNode.append(createSeatButton(seat));
        if (section.aisles.includes(seat.number)) rowNode.append(el("span", "aisle"));
      });

      if (showLabels) rowNode.append(el("span", "row-label", row.label));
      node.append(rowNode);
    });

    return node;
  }

  function renderVenue() {
    els.world.style.width = `${VENUE.width}px`;
    els.world.style.height = `${VENUE.height}px`;
    renderStage();
    renderFeatures();
    const fragment = document.createDocumentFragment();
    sections.forEach((section) => fragment.append(renderSection(section)));
    els.world.append(fragment);
    els.seatCount.textContent = String(totalSeats);
  }

  function updateSeatButton(id) {
    const seat = seatIndex.get(id);
    const button = seatButtons.get(id);
    if (!seat || !button) return;

    const status = getStatus(seat);

    button.dataset.status = status;
  }

  function init() {
    renderLegend();
    renderVenue();

    seatIndex.forEach((seat, id) => updateSeatButton(id));
  }

  init();
})();
