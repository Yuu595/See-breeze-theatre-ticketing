"use strict";

const Cart = (function () {
  let seatIds = [];

  function has(id) {
    return seatIds.includes(id);
  }

  function add(id) {
    if (has(id)) return false;
    seatIds.push(id);
    return true;
  }

  function remove(id) {
    if (!has(id)) return false;
    seatIds = seatIds.filter((seatId) => seatId !== id);
    return true;
  }

  function clear() {
    const removed = seatIds;
    seatIds = [];
    return removed;
  }

  function items() {
    return seatIds.slice();
  }

  return { has, add, remove, clear, items };
})();
