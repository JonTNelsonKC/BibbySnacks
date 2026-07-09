const SNACKS = [
  {
    id: "apple-peanut-butter",
    name: "Apple + peanut butter",
    detail: "Crisp slices, generous dip.",
  },
  {
    id: "cheese-crackers",
    name: "Cheese + crackers",
    detail: "A little salty, a little crunchy.",
  },
  {
    id: "yogurt-berries",
    name: "Yogurt + berries",
    detail: "Cold, sweet, and respectable.",
  },
  {
    id: "popcorn",
    name: "Popcorn",
    detail: "Buttered, salted, snackable.",
  },
  {
    id: "tea",
    name: "Tea",
    detail: "Hot mug, calm afternoon.",
  },
  {
    id: "chocolate",
    name: "Chocolate",
    detail: "Small square, major morale.",
  },
];

const state = new Map(SNACKS.map((snack) => [snack.id, 0]));
const savedPin = localStorage.getItem("snackOrderPin") || "";

const snackGrid = document.querySelector("#snack-grid");
const template = document.querySelector("#snack-card-template");
const itemCount = document.querySelector("#item-count");
const summaryEmpty = document.querySelector("#summary-empty");
const summaryList = document.querySelector("#summary-list");
const customName = document.querySelector("#custom-name");
const customQuantity = document.querySelector("#custom-quantity");
const orderNote = document.querySelector("#order-note");
const pinInput = document.querySelector("#pin");
const rememberPin = document.querySelector("#remember-pin");
const placeOrderButton = document.querySelector("#place-order");
const clearOrderButton = document.querySelector("#clear-order");
const orderMessage = document.querySelector("#order-message");
const honeypot = document.querySelector("#website");

pinInput.value = savedPin;
rememberPin.checked = Boolean(savedPin);

function clampQuantity(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(9, Math.max(0, parsed));
}

function getCustomItem() {
  const name = customName.value.trim();
  if (!name) return null;

  return {
    id: "custom",
    name,
    detail: "Custom request",
    quantity: Math.max(1, clampQuantity(customQuantity.value || 1)),
    custom: true,
  };
}

function getSelectedItems() {
  const usualItems = SNACKS.map((snack) => ({
    ...snack,
    quantity: state.get(snack.id) || 0,
  })).filter((snack) => snack.quantity > 0);

  const customItem = getCustomItem();
  return customItem ? [...usualItems, customItem] : usualItems;
}

function getTotalQuantity(items = getSelectedItems()) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function updateSnackCard(card, snackId) {
  const quantity = state.get(snackId) || 0;
  card.classList.toggle("is-selected", quantity > 0);
  card.querySelector("output").value = String(quantity);
  card.querySelector(".decrement").disabled = quantity === 0;
}

function renderSummary() {
  const items = getSelectedItems();
  const total = getTotalQuantity(items);

  itemCount.textContent = String(total);
  summaryEmpty.hidden = items.length > 0;
  summaryList.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("li");
    row.className = "summary-item";

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.name;
    const detail = document.createElement("span");
    detail.textContent = item.custom ? "Custom" : item.detail;
    copy.append(title, detail);

    const quantity = document.createElement("div");
    quantity.className = "summary-quantity";
    quantity.textContent = `x${item.quantity}`;

    row.append(copy, quantity);
    summaryList.append(row);
  });

  placeOrderButton.disabled = items.length === 0;
  clearOrderButton.disabled = items.length === 0 && !orderNote.value.trim();
}

function renderSnackCards() {
  SNACKS.forEach((snack) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.snackId = snack.id;
    card.querySelector("h3").textContent = snack.name;
    card.querySelector("p").textContent = snack.detail;

    const decrement = card.querySelector(".decrement");
    const increment = card.querySelector(".increment");
    decrement.setAttribute("aria-label", `Remove one ${snack.name}`);
    increment.setAttribute("aria-label", `Add one ${snack.name}`);

    decrement.addEventListener("click", () => {
      state.set(snack.id, Math.max(0, (state.get(snack.id) || 0) - 1));
      updateSnackCard(card, snack.id);
      renderSummary();
    });

    increment.addEventListener("click", () => {
      state.set(snack.id, Math.min(9, (state.get(snack.id) || 0) + 1));
      updateSnackCard(card, snack.id);
      renderSummary();
    });

    updateSnackCard(card, snack.id);
    snackGrid.append(card);
  });
}

function setMessage(text, type = "") {
  orderMessage.textContent = text;
  orderMessage.className = `order-message ${type ? `is-${type}` : ""}`.trim();
}

function clearOrder() {
  state.forEach((_, snackId) => state.set(snackId, 0));
  document.querySelectorAll(".snack-card").forEach((card) => {
    updateSnackCard(card, card.dataset.snackId);
  });
  customName.value = "";
  customQuantity.value = "1";
  orderNote.value = "";
  setMessage("");
  renderSummary();
}

async function placeOrder() {
  const items = getSelectedItems();
  if (!items.length) return;

  placeOrderButton.disabled = true;
  clearOrderButton.disabled = true;
  setMessage("Sending order...");

  if (rememberPin.checked) {
    localStorage.setItem("snackOrderPin", pinInput.value);
  } else {
    localStorage.removeItem("snackOrderPin");
  }

  const payload = {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      custom: Boolean(item.custom),
    })),
    note: orderNote.value.trim(),
    pin: pinInput.value,
    website: honeypot.value,
    placedAt: new Date().toISOString(),
  };

  try {
    const response = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Order could not be sent.");
    }

    if (result.notification === "not_configured") {
      setMessage("Order received here, but notifications are not configured yet.", "error");
      renderSummary();
      return;
    }

    clearOrder();
    setMessage("Order placed. Snack operations have begun.", "success");
  } catch (error) {
    setMessage(error.message || "Order could not be sent.", "error");
    renderSummary();
  }
}

customName.addEventListener("input", renderSummary);
customQuantity.addEventListener("input", () => {
  customQuantity.value = Math.max(1, clampQuantity(customQuantity.value || 1));
  renderSummary();
});
orderNote.addEventListener("input", renderSummary);
placeOrderButton.addEventListener("click", placeOrder);
clearOrderButton.addEventListener("click", clearOrder);

renderSnackCards();
renderSummary();
