"use strict";

(function () {
  const { sections, seatIndex, totalSeats } = VENUE_MODEL;

  const els = {
    viewport: document.getElementById("map-viewport"),
    world: document.getElementById("map-world"),
    priceLegend: document.getElementById("price-legend"),
    controls: document.getElementById("map-controls"),
    zoomLevel: document.getElementById("zoom-level"),
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
    detailsRemove: document.getElementById("details-remove"),
    detailsClose: document.getElementById("details-close"),

    cartList: document.getElementById("cart-list"),
    cartEmpty: document.getElementById("cart-empty"),
    cartTotal: document.getElementById("cart-total"),
    cartCount: document.getElementById("cart-count"),
    clearCart: document.getElementById("clear-cart"),
    headerCount: document.getElementById("header-cart-count"),
    headerTotal: document.getElementById("header-cart-total"),

    toastRegion: document.getElementById("toast-region"),
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

  function seatTitle(seat) {
    return `${seat.section.name} · Row ${seat.row}, Seat ${seat.number}`;
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
      node.setAttribute("aria-hidden", "true");
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
    node.setAttribute("aria-label", `${section.name}, ${category.label}, ${formatPrice(category.price)} per seat`);
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
    button.setAttribute(
      "aria-label",
      `${seat.section.name}, row ${seat.row}, seat ${seat.number}, ${seat.category.label}, ${formatPrice(seat.price)}, ${STATUS_TEXT[status]}`
    );
    button.title = `${seatTitle(seat)} — ${formatPrice(seat.price)} (${STATUS_TEXT[status]})`;
  }

  function inspectSeat(id) {
    if (!seatIndex.has(id)) return;
    const previous = inspectedId;
    inspectedId = id;
    if (previous && previous !== id) updateSeatButton(previous);
    updateSeatButton(id);
    renderDetails();
  }

  function clearInspection() {
    const previous = inspectedId;
    inspectedId = null;
    if (previous) updateSeatButton(previous);
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
    els.detailsRemove.hidden = status !== "in-cart";

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

    if (seat.unavailable) {
      toast("This seat is unavailable and cannot be added.", "error");
      return;
    }
    if (!Cart.add(seat.id)) {
      toast("This seat is already in your cart.", "warn");
      return;
    }

    updateSeatButton(seat.id);
    renderDetails();
    renderCart();
    toast(`Added ${seatTitle(seat)} — ${formatPrice(seat.price)}`, "success");
  }

  function removeFromCart(id) {
    const seat = seatIndex.get(id);
    if (!seat || !Cart.remove(id)) return;
    updateSeatButton(id);
    renderDetails();
    renderCart();
    toast(`Removed ${seatTitle(seat)}`, "info");
  }

  function clearCart() {
    const removed = Cart.clear();
    if (removed.length === 0) return;
    removed.forEach(updateSeatButton);
    renderDetails();
    renderCart();
    toast(`Removed ${removed.length} ticket${removed.length === 1 ? "" : "s"} from your cart`, "info");
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
    els.clearCart.hidden = seats.length === 0;

    const countText = `${seats.length} ticket${seats.length === 1 ? "" : "s"}`;
    els.cartCount.textContent = countText;
    els.cartTotal.textContent = formatPrice(total);
    els.headerCount.textContent = countText;
    els.headerTotal.textContent = formatPrice(total);
  }

  function createCartItem(seat) {
    const item = el("li", "cart-item");

    const chip = el("span", "chip");
    chip.style.background = seat.category.color;

    const info = el("button", "cart-item-info");
    info.type = "button";
    info.dataset.locate = seat.id;
    info.title = "Show this seat on the map";
    info.append(
      el("span", "cart-item-title", seat.section.name),
      el("span", "cart-item-meta", `Row ${seat.row} · Seat ${seat.number} · ${seat.category.label}`)
    );

    const side = el("div", "cart-item-side");
    const price = el("span", "cart-item-price", formatPrice(seat.price));
    const remove = el("button", "btn btn-remove", "Remove");
    remove.type = "button";
    remove.dataset.remove = seat.id;
    remove.setAttribute("aria-label", `Remove ${seatTitle(seat)} from cart`);
    side.append(price, remove);

    item.append(chip, info, side);
    return item;
  }

  function toast(message, type = "info") {
    const node = el("div", `toast toast--${type}`, message);
    els.toastRegion.append(node);
    while (els.toastRegion.children.length > 3) els.toastRegion.firstElementChild.remove();
    setTimeout(() => node.classList.add("is-leaving"), 2400);
    setTimeout(() => node.remove(), 2800);
  }

  function updateControls(state) {
    els.zoomLevel.textContent = `${state.zoomPercent}%`;
    const disabled = {
      "zoom-in": !state.canZoomIn,
      "zoom-out": !state.canZoomOut,
      up: !state.canMoveUp,
      down: !state.canMoveDown,
      left: !state.canMoveLeft,
      right: !state.canMoveRight,
    };
    els.controls.querySelectorAll("button[data-action]").forEach((button) => {
      button.disabled = Boolean(disabled[button.dataset.action]);
    });
  }

  function handleControl(action) {
    const actions = {
      "zoom-in": MapView.zoomIn,
      "zoom-out": MapView.zoomOut,
      up: () => MapView.move("up"),
      down: () => MapView.move("down"),
      left: () => MapView.move("left"),
      right: () => MapView.move("right"),
      reset: () => MapView.reset(true),
    };
    if (actions[action]) actions[action]();
  }

  function bindEvents() {
    els.world.addEventListener("click", (event) => {
      const button = event.target.closest(".seat");
      if (button) inspectSeat(button.dataset.id);
    });

    els.addButton.addEventListener("click", addInspectedToCart);
    els.detailsRemove.addEventListener("click", () => removeFromCart(inspectedId));
    els.detailsClose.addEventListener("click", clearInspection);
    els.clearCart.addEventListener("click", clearCart);

    els.cartList.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-remove]");
      if (removeButton) {
        removeFromCart(removeButton.dataset.remove);
        return;
      }
      const locateButton = event.target.closest("[data-locate]");
      if (locateButton) {
        const id = locateButton.dataset.locate;
        inspectSeat(id);
        MapView.focusOn(seatButtons.get(id));
      }
    });

    els.controls.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (button) handleControl(button.dataset.action);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && inspectedId) clearInspection();
    });
  }

  function init() {
    renderLegend();
    renderVenue();

    Cart.load((id) => seatIndex.has(id) && !seatIndex.get(id).unavailable);
    seatIndex.forEach((seat, id) => updateSeatButton(id));
    renderCart();
    renderDetails();

    MapView.init({
      viewport: els.viewport,
      world: els.world,
      width: VENUE.width,
      height: VENUE.height,
      onChange: updateControls,
    });

    bindEvents();
  }

  init();
})();
