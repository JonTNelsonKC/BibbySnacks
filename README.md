# BibbySnacks

A tiny Cloudflare Pages app for choosing afternoon snacks, reviewing checkout, and sending an order notification.

## Edit the menu

Update the `SNACKS` array at the top of `app.js`.

## Cloudflare Pages

Use these settings for a Pages project connected to this GitHub repository:

- Framework preset: `None`
- Build command: leave blank, or use `exit 0` if Cloudflare requires a command
- Build output directory: `.`
- Root directory: repository root
- Functions directory: `functions`
- Deploy command: leave blank. If the dashboard currently runs `npm run deploy`, that script is intentionally a no-op so Git-connected Pages can finish without a Wrangler API token.

Do not use `npx wrangler deploy` as the Pages deploy command. That command deploys Workers, not Pages. If a Cloudflare build log says `Executing user deploy command: npx wrangler deploy`, the Cloudflare dashboard setting is still overriding the Pages flow.

If a Cloudflare build log says `Authentication error [code: 10000]` while running `wrangler pages deploy`, the build is trying to do a manual Wrangler deploy from inside Cloudflare. Remove the custom deploy command and let Git-connected Pages deploy automatically. If you truly need manual Wrangler deploys, use `npm run deploy:pages` locally or in CI with a Cloudflare API token that has Pages write access.

Only `/api/order` invokes a Pages Function. Static files are served as static assets.

## Worker fallback

The repo also includes `src/worker.js` and `wrangler.worker.toml` so `npm run deploy:worker` has a valid Worker entry point and static asset directory. This is a fallback if you want to deploy as a Worker with Static Assets, not as a normal Pages deployment.

For this fallback path, `/api/order` is handled by the same order code used by the Pages Function, and all other requests are served from the static assets binding.

## Notifications

This app does not send email. It only sends webhook-style notifications.

Recommended phone push setup: use `ntfy`.

1. Install the ntfy app or open the ntfy web app.
2. Subscribe to a hard-to-guess topic, for example `bibby-snacks-8f4c2b7a`.
3. In Cloudflare Pages environment variables, set:

```text
WEBHOOK_URL=https://ntfy.sh/bibby-snacks-8f4c2b7a
WEBHOOK_KIND=ntfy
```

The public `ntfy.sh` service treats the topic like a password, so do not use an obvious topic name. A private/self-hosted ntfy server also works; set `WEBHOOK_URL` to that topic URL.

Other supported webhook kinds are `generic`, `discord`, and `slack`.

## Optional passcode

Set `ORDER_PIN` as a Pages or Workers secret. The checkout passcode field is only enforced when that secret exists.

## Local checks

```sh
npm test
python3 -m http.server 8788
```
