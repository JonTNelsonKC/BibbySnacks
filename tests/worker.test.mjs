import assert from "node:assert/strict";
import worker from "../src/worker.js";

async function readJson(response) {
  return response.json();
}

async function testOrderRoute() {
  const response = await worker.fetch(
    new Request("https://example.com/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ name: "Tea", quantity: 1 }] }),
    }),
    {},
    {},
  );

  const body = await readJson(response);
  assert.equal(response.status, 200);
  assert.equal(body.notification, "not_configured");
}

async function testAssetPassthrough() {
  const response = await worker.fetch(
    new Request("https://example.com/"),
    {
      ASSETS: {
        fetch: async () => new Response("asset-ok", { status: 200 }),
      },
    },
    {},
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset-ok");
}

await testOrderRoute();
await testAssetPassthrough();
console.log("All worker wrapper tests passed.");
