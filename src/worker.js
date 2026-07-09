import {
  onRequestGet,
  onRequestOptions,
  onRequestPost,
} from "../functions/api/order.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/order") {
      const context = {
        request,
        env,
        waitUntil: ctx?.waitUntil?.bind(ctx) || (() => {}),
      };

      if (request.method === "POST") return onRequestPost(context);
      if (request.method === "OPTIONS") return onRequestOptions(context);
      if (request.method === "GET") return onRequestGet(context);

      return json({ ok: false, error: "Method not allowed." }, 405);
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
