"use strict";

(function () {
  const { sections, seatIndex, totalSeats } = VENUE_MODEL;

  const els = {
    world: document.getElementById("map-world"),
    priceLegend: document.getElementById("price-legend"),
    seatCount: document.getElementById("seat-count"),

    detailsPanel: document.getElementById("details-panel"),
    detailsEmpty: document.getElementById("details-empty"),
    detailsBody: document.getElementById("details-body"),
    dChip: document.getElementById("d-chip"),
    dCategory: document.getElementById("d-category"),
    dSection: document.getElementById("d-section"),
    dRow: document.getElementById("d-row"),
    dSeat: document.getElementById("d-seat"),
    dId: document.getElementById("d-id"),
    dStatus: document.getElementById("d-status"),
    dPrice: document.getElementById("d-price"),
    dNote: document.getElementById("d-note"),
    addButton: document.getElementById("add-to-cart"),

    cartList: document.getElementById("cart-list"),
    cartEmpty: document.getElementById("cart-empty"),
    cartTotal: document.getElementById("cart-total"),
    cartCount: document.getElementById("cart-count"),
  };

  const seatButtons = new Map();
  let inspectedId = null;

  const STATUS_TEXT = {
    available: "Available",
    "in-cart": "In your cart",
    unavailable: "Unavailable — already sold",
  };

  function formatPrice(amount) {
    return `${amount} ${VENUE.currency}`;
  }

  function getStatus(seat) {
    if (seat.unavailable) return "unavailable";
    if (Cart.has(seat.id)) return "in-cart";
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
    const inspected = id === inspectedId;

    button.dataset.status = status;
    button.classList.toggle("is-inspected", inspected);
    button.setAttribute("aria-pressed", String(inspected));
  }

  function inspectSeat(id) {
    if (!seatIndex.has(id)) return;
    const previous = inspectedId;
    inspectedId = id;
    if (previous && previous !== id) updateSeatButton(previous);
    updateSeatButton(id);
    renderDetails();
  }

  function renderDetails() {
    const seat = inspectedId ? seatIndex.get(inspectedId) : null;
    els.detailsPanel.classList.toggle("has-seat", Boolean(seat));
    els.detailsEmpty.hidden = Boolean(seat);
    els.detailsBody.hidden = !seat;
    if (!seat) return;

    const status = getStatus(seat);
    els.dChip.style.background = seat.category.color;
    els.dCategory.textContent = seat.category.label;
    els.dSection.textContent = seat.section.name;
    els.dRow.textContent = seat.row;
    els.dSeat.textContent = seat.number;
    els.dId.textContent = seat.id;
    els.dStatus.textContent = STATUS_TEXT[status];
    els.dStatus.dataset.status = status;
    els.dPrice.textContent = formatPrice(seat.price);

    els.addButton.disabled = status !== "available";

    if (status === "available") {
      els.addButton.textContent = "Add to cart";
      els.dNote.textContent = "Not in your cart yet. Press Add to cart to book this seat.";
    } else if (status === "in-cart") {
      els.addButton.textContent = "Already in cart ✓";
      els.dNote.textContent = "This seat is already in your cart. Each seat can only be added once.";
    } else {
      els.addButton.textContent = "Unavailable";
      els.dNote.textContent = "This seat has already been sold, so it cannot be added to the cart.";
    }
  }

  function addInspectedToCart() {
    const seat = inspectedId ? seatIndex.get(inspectedId) : null;
    if (!seat) return;
    if (seat.unavailable || !Cart.add(seat.id)) return;

    updateSeatButton(seat.id);
    renderDetails();
    renderCart();
  }

  function renderCart() {
    const ids = Cart.items();
    const seats = ids.map((id) => seatIndex.get(id));

    let total = 0;
    for (const seat of seats) {
      total += seat.price;
    }

    els.cartList.replaceChildren(...seats.map(createCartItem));
    els.cartEmpty.hidden = seats.length > 0;

    const countText = `${seats.length} ticket${seats.length === 1 ? "" : "s"}`;
    els.cartCount.textContent = countText;
    els.cartTotal.textContent = formatPrice(total);
  }

  function createCartItem(seat) {
    const item = el("li", "cart-item");

    const chip = el("span", "chip");
    chip.style.background = seat.category.color;

    const info = el("div", "cart-item-info");
    info.append(
      el("span", "cart-item-title", seat.section.name),
      el("span", "cart-item-meta", `Row ${seat.row} · Seat ${seat.number} · ${seat.category.label}`)
    );

    const side = el("div", "cart-item-side");
    const price = el("span", "cart-item-price", formatPrice(seat.price));
    side.append(price);

    item.append(chip, info, side);
    return item;
  }

  function bindEvents() {
    els.world.addEventListener("click", (event) => {
      const button = event.target.closest(".seat");
      if (button) inspectSeat(button.dataset.id);
    });

    els.addButton.addEventListener("click", addInspectedToCart);
  }

  function init() {
    renderLegend();
    renderVenue();

    seatIndex.forEach((seat, id) => updateSeatButton(id));
    renderCart();
    renderDetails();

    bindEvents();
  }

  init();
})();
