const MAX_ITEMS = 20;
const MAX_QUANTITY = 9;

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  try {
    const order = await parseOrder(context.request);

    if (order.website) {
      return json({ ok: true, notification: "ignored" });
    }

    const normalized = normalizeOrder(order);
    if (context.env.ORDER_PIN && normalized.pin !== context.env.ORDER_PIN) {
      return json({ ok: false, error: "That passcode did not match." }, 401);
    }

    if (normalized.items.length === 0) {
      return json({ ok: false, error: "Choose at least one snack." }, 400);
    }

    const notification = buildNotification(normalized);
    const results = await sendNotifications(context.env, notification, normalized);

    if (results.length === 0) {
      return json({ ok: true, notification: "not_configured" });
    }

    const failed = results.find((result) => !result.ok);
    if (failed) {
      return json(
        { ok: false, error: `Notification failed through ${failed.channel}.` },
        502,
      );
    }

    return json({
      ok: true,
      notification: results.map((result) => result.channel).join(","),
    });
  } catch (error) {
    return json({ ok: false, error: error.message || "Invalid order." }, 400);
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: "Use POST to place an order." }, 405);
}

async function parseOrder(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Orders must be sent as JSON.");
  }

  return request.json();
}

export function normalizeOrder(order) {
  const rawItems = Array.isArray(order.items) ? order.items : [];
  const items = rawItems.slice(0, MAX_ITEMS).map(normalizeItem).filter(Boolean);

  return {
    items,
    note: truncate(cleanString(order.note), 180),
    pin: cleanString(order.pin),
    website: cleanString(order.website),
    placedAt: cleanString(order.placedAt) || new Date().toISOString(),
  };
}

function normalizeItem(item) {
  const name = truncate(cleanString(item.name), 90);
  const quantity = clampQuantity(item.quantity);
  if (!name || quantity < 1) return null;

  return {
    id: truncate(cleanString(item.id), 60),
    name,
    quantity,
    custom: Boolean(item.custom),
  };
}

function clampQuantity(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(MAX_QUANTITY, Math.max(0, parsed));
}

function cleanString(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function truncate(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

export function buildNotification(order) {
  const lines = [
    "Afternoon snack order",
    "",
    ...order.items.map((item) => `${item.quantity}x ${item.custom ? "Custom: " : ""}${item.name}`),
  ];

  if (order.note) {
    lines.push("", `Note: ${order.note}`);
  }

  lines.push("", `Placed: ${formatPlacedAt(order.placedAt)}`);
  const text = lines.join("\n");

  return {
    subject: `Snack order: ${order.items.length} item${order.items.length === 1 ? "" : "s"}`,
    text,
    html: `<h1>Afternoon snack order</h1>${order.items
      .map((item) => `<p><strong>${item.quantity}x</strong> ${escapeHtml(item.custom ? `Custom: ${item.name}` : item.name)}</p>`)
      .join("")}${order.note ? `<p><strong>Note:</strong> ${escapeHtml(order.note)}</p>` : ""}<p><small>Placed: ${escapeHtml(formatPlacedAt(order.placedAt))}</small></p>`,
  };
}

function formatPlacedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(date);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendNotifications(env, notification, order) {
  const jobs = [];

  if (env.WEBHOOK_URL) {
    jobs.push(sendWebhook(env, notification, order));
  }

  if (
    env.CF_ACCOUNT_ID &&
    env.CF_EMAIL_API_TOKEN &&
    env.ORDER_TO_EMAIL &&
    env.ORDER_FROM_EMAIL
  ) {
    jobs.push(sendCloudflareEmail(env, notification));
  }

  return Promise.all(jobs);
}

async function sendWebhook(env, notification, order) {
  const kind = (env.WEBHOOK_KIND || "generic").toLowerCase();
  const init = webhookRequest(kind, notification, order);
  const response = await fetch(env.WEBHOOK_URL, init);

  return {
    channel: `webhook:${kind}`,
    ok: response.ok,
    status: response.status,
  };
}

function webhookRequest(kind, notification, order) {
  if (kind === "discord") {
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: truncate(notification.text, 1900) }),
    };
  }

  if (kind === "slack") {
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: notification.text }),
    };
  }

  if (kind === "ntfy") {
    return {
      method: "POST",
      headers: {
        Title: notification.subject,
        Priority: "4",
        Tags: "food",
      },
      body: notification.text,
    };
  }

  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: notification.subject,
      text: notification.text,
      order,
    }),
  };
}

async function sendCloudflareEmail(env, notification) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CF_EMAIL_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: env.ORDER_TO_EMAIL,
      from: env.ORDER_FROM_EMAIL,
      subject: notification.subject,
      html: notification.html,
      text: notification.text,
    }),
  });

  return {
    channel: "cloudflare-email",
    ok: response.ok,
    status: response.status,
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
