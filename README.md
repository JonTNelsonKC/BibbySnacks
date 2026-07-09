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

Do not use `npx wrangler deploy` as the Pages build or deploy command. That command deploys Workers and expects a Worker entry point or `[assets]` directory. For this repo, Cloudflare Pages should upload the static files directly and discover `functions/api/order.js` as a Pages Function.

If you are doing a manual Wrangler deploy instead of Git-connected Pages, use:

```sh
npm run deploy
```

That script runs `wrangler pages deploy . --project-name bibby-snacks`.

Only `/api/order` invokes a Pages Function. Static files are served as static assets.

## Notifications

Use at least one of these options in Pages project settings.

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

Set `ORDER_PIN` as a Pages secret. The checkout passcode field is only enforced when that secret exists.

## Local checks

```sh
npm test
python3 -m http.server 8788
```
