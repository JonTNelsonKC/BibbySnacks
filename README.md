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
- Deploy command: leave blank for normal Pages Git deployments, or use `npm run deploy` for a manual Pages deploy command

Do not use `npx wrangler deploy` as the Pages deploy command. That command deploys Workers, not Pages. If a Cloudflare build log still says `Executing user deploy command: npx wrangler deploy`, the Cloudflare dashboard setting is still overriding the repo scripts.

If you are doing a manual Wrangler deploy to Pages instead of Git-connected Pages, use:

```sh
npm run deploy
```

That script runs `wrangler pages deploy . --project-name bibby-snacks`.

Only `/api/order` invokes a Pages Function. Static files are served as static assets.

## Worker fallback

The repo also includes `src/worker.js` and an `[assets]` section in `wrangler.toml` so `npx wrangler deploy` has a valid Worker entry point and static asset directory. This is a fallback for the current Cloudflare dashboard command; it deploys as a Worker with Static Assets, not as a normal Pages deployment.

For this fallback path, `/api/order` is handled by the same order code used by the Pages Function, and all other requests are served from the static assets binding.

## Notifications

Use at least one of these options in Pages or Workers environment settings.

### Webhook

Set:

- `WEBHOOK_URL`
- `WEBHOOK_KIND`: `generic`, `discord`, `slack`, or `ntfy`

### Cloudflare Email Service REST API

Set:

- `CF_ACCOUNT_ID`
- `CF_EMAIL_API_TOKEN` as a secret
- `ORDER_TO_EMAIL`
- `ORDER_FROM_EMAIL`

On the Workers Free plan, Cloudflare Email Service can send free messages to verified destination addresses. Sending to arbitrary recipients requires Workers Paid.

## Optional passcode

Set `ORDER_PIN` as a Pages or Workers secret. The checkout passcode field is only enforced when that secret exists.

## Local checks

```sh
npm test
python3 -m http.server 8788
```
