"use strict";

const MapView = (function () {
  const ZOOM_STEP = 0.5;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 6;
  const MOVE_STEP = 150;

  let viewport = null;
  let world = null;
  let venueWidth = 0;
  let venueHeight = 0;
  let onChange = function () {};

  const view = { zoom: 1, x: 0, y: 0 };

  function limit(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function fitScale() {
    const scaleX = viewport.clientWidth / venueWidth;
    const scaleY = viewport.clientHeight / venueHeight;
    return Math.min(scaleX, scaleY) * 0.96;
  }

  function currentScale() {
    return fitScale() * view.zoom;
  }

  function keepInside() {
    view.x = limit(view.x, -venueWidth / 2, venueWidth / 2);
    view.y = limit(view.y, -venueHeight / 2, venueHeight / 2);
  }

  function getState() {
    return {
      zoomPercent: Math.round(view.zoom * 100),
      canZoomIn: view.zoom < MAX_ZOOM,
      canZoomOut: view.zoom > MIN_ZOOM,
      canMoveUp: view.y < venueHeight / 2,
      canMoveDown: view.y > -venueHeight / 2,
      canMoveLeft: view.x < venueWidth / 2,
      canMoveRight: view.x > -venueWidth / 2,
    };
  }

  function apply(animate) {
    world.classList.toggle("is-animated", Boolean(animate));
    world.style.transform =
      `translate(-50%, -50%) scale(${currentScale()}) translate(${view.x}px, ${view.y}px)`;
    onChange(getState());
  }

  function setZoom(zoom) {
    view.zoom = limit(zoom, MIN_ZOOM, MAX_ZOOM);
    apply(true);
  }

  function zoomIn() {
    setZoom(view.zoom + ZOOM_STEP);
  }

  function zoomOut() {
    setZoom(view.zoom - ZOOM_STEP);
  }

  function move(direction) {
    const step = MOVE_STEP / view.zoom;
    if (direction === "up") view.y += step;
    if (direction === "down") view.y -= step;
    if (direction === "left") view.x += step;
    if (direction === "right") view.x -= step;
    keepInside();
    apply(true);
  }

  function reset(animate = true) {
    view.zoom = 1;
    view.x = 0;
    view.y = 0;
    apply(animate);
  }

  function focusOn(element) {
    const seatBox = element.getBoundingClientRect();
    const mapBox = viewport.getBoundingClientRect();

    const distanceX = (seatBox.left + seatBox.width / 2) - (mapBox.left + mapBox.width / 2);
    const distanceY = (seatBox.top + seatBox.height / 2) - (mapBox.top + mapBox.height / 2);

    view.x -= distanceX / currentScale();
    view.y -= distanceY / currentScale();
    keepInside();
    setZoom(Math.max(view.zoom, 2));
  }

  function enableKeyboard() {
    viewport.addEventListener("keydown", (event) => {
      const actions = {
        ArrowUp: () => move("up"),
        ArrowDown: () => move("down"),
        ArrowLeft: () => move("left"),
        ArrowRight: () => move("right"),
        "+": zoomIn,
        "=": zoomIn,
        "-": zoomOut,
        "_": zoomOut,
        "0": () => reset(true),
      };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    });
  }

  function init(options) {
    viewport = options.viewport;
    world = options.world;
    venueWidth = options.width;
    venueHeight = options.height;
    onChange = options.onChange || onChange;

    world.style.width = `${venueWidth}px`;
    world.style.height = `${venueHeight}px`;

    enableKeyboard();

    new ResizeObserver(() => apply(false)).observe(viewport);

    reset(false);
  }

  return { init, zoomIn, zoomOut, move, reset, focusOn };
})();
