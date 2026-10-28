"use strict";

const Cart = (function () {
  const STORAGE_KEY = "sea-breeze-theatre-cart-v1";
  let seatIds = [];

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seatIds));
    } catch (err) {
      console.warn("Could not save the cart to localStorage:", err);
    }
  }

  function load(isValid) {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (err) {
      saved = [];
    }
    if (!Array.isArray(saved)) saved = [];

    const unique = [...new Set(saved)];
    seatIds = unique.filter((id) => typeof id === "string" && isValid(id));

    if (seatIds.length !== saved.length) save();
    return seatIds.slice();
  }

  function has(id) {
    return seatIds.includes(id);
  }

  function add(id) {
    if (has(id)) return false;
    seatIds.push(id);
    save();
    return true;
  }

  function remove(id) {
    if (!has(id)) return false;
    seatIds = seatIds.filter((seatId) => seatId !== id);
    save();
    return true;
  }

  function clear() {
    const removed = seatIds;
    seatIds = [];
    save();
    return removed;
  }

  function items() {
    return seatIds.slice();
  }

  return { load, has, add, remove, clear, items };
})();
