# BibbySnacks

A tiny Cloudflare Worker app for choosing afternoon snacks, reviewing checkout, and sending a push/webhook notification.

## Production Deployment

The production route `bibbysnacks.jontnelsonkc.workers.dev` is a Cloudflare Workers route. This repo deploys as a Worker with Static Assets:

- `wrangler.toml` sets `main = "src/worker.js"`
- `[assets]` serves the static app files from the repository root
- `run_worker_first = ["/api/*"]` routes `/api/order` through the Worker before static assets
- `src/worker.js` passes `/api/order` to `functions/api/order.js` and serves all other routes from `ASSETS`

Cloudflare deploy command:

```sh
npx wrangler deploy
```

If the dashboard runs `npm run deploy`, that script runs the same Wrangler deploy command.

## Notifications

This app does not send email. It only sends webhook-style notifications.

Recommended phone push setup: use `ntfy`.

1. Install the ntfy app or open the ntfy web app.
2. Subscribe to a hard-to-guess topic, for example `bibby-snacks-8f4c2b7a`.
3. In Cloudflare Workers environment variables, set:

```text
WEBHOOK_URL=https://ntfy.sh/bibby-snacks-8f4c2b7a
WEBHOOK_KIND=ntfy
```

The public `ntfy.sh` service treats the topic like a password, so do not use an obvious topic name. A private/self-hosted ntfy server also works; set `WEBHOOK_URL` to that topic URL.

Other supported webhook kinds are `generic`, `discord`, and `slack`.

## Optional passcode

Set `ORDER_PIN` as a Worker secret. The checkout passcode field is only enforced when that secret exists.

## Edit the menu

Update the `SNACKS` array at the top of `app.js`.

## Local checks

```sh
npm test
python3 -m http.server 8788
```
