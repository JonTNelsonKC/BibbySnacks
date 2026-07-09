import assert from "node:assert/strict";
import { onRequestPost, buildNotification, normalizeOrder } from "../functions/api/order.js";

const originalFetch = globalThis.fetch;

function request(body) {
  return new Request("https://example.com/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readJson(response) {
  return response.json();
}

async function testRejectsEmptyOrders() {
  const response = await onRequestPost({
    request: request({ items: [] }),
    env: {},
  });

  assert.equal(response.status, 400);
  assert.equal((await readJson(response)).ok, false);
}

async function testRequiresPinWhenConfigured() {
  const response = await onRequestPost({
    request: request({ items: [{ name: "Tea", quantity: 1 }], pin: "nope" }),
    env: { ORDER_PIN: "1234" },
  });

  assert.equal(response.status, 401);
  assert.match((await readJson(response)).error, /passcode/);
}

async function testSendsWebhook() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response("ok", { status: 200 });
  };

  const response = await onRequestPost({
    request: request({
      items: [{ name: "Popcorn", quantity: 2 }],
      note: "Extra salt",
      pin: "1234",
    }),
    env: {
      ORDER_PIN: "1234",
      WEBHOOK_URL: "https://hooks.example.test/snack",
      WEBHOOK_KIND: "slack",
    },
  });

  const body = await readJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://hooks.example.test/snack");
  assert.match(calls[0].init.body, /Popcorn/);
}

async function testSendsNtfyWebhook() {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response("ok", { status: 200 });
  };

  const response = await onRequestPost({
    request: request({
      items: [{ name: "Tea", quantity: 1 }],
    }),
    env: {
      WEBHOOK_URL: "https://ntfy.sh/bibby-snacks-private-topic",
      WEBHOOK_KIND: "ntfy",
    },
  });

  const body = await readJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.notification, "webhook:ntfy");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.Title, "Snack order: 1 item");
  assert.equal(calls[0].init.headers.Priority, "4");
  assert.match(calls[0].init.body, /1x Tea/);
}

async function testDryRunWhenUnconfigured() {
  const response = await onRequestPost({
    request: request({ items: [{ name: "Chocolate", quantity: 1 }] }),
    env: {},
  });

  const body = await readJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.notification, "not_configured");
}

function testNormalization() {
  const order = normalizeOrder({
    items: [{ name: "Chocolate", quantity: 99 }],
    note: "  please   chill it  ",
  });

  assert.equal(order.items[0].quantity, 9);
  assert.equal(order.note, "please chill it");
}

function testNotificationText() {
  const notification = buildNotification({
    items: [{ name: "Tea", quantity: 1, custom: false }],
    note: "Hot",
    placedAt: "2026-07-09T18:30:00.000Z",
  });

  assert.match(notification.text, /1x Tea/);
  assert.match(notification.text, /Note: Hot/);
}

try {
  await testRejectsEmptyOrders();
  await testRequiresPinWhenConfigured();
  await testSendsWebhook();
  await testSendsNtfyWebhook();
  await testDryRunWhenUnconfigured();
  testNormalization();
  testNotificationText();
  console.log("All order function tests passed.");
} finally {
  globalThis.fetch = originalFetch;
}
