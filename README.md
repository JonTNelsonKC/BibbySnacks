# BibbySnacks

A tiny Cloudflare Pages app for choosing afternoon snacks, reviewing checkout, and sending an order notification.

## Edit the menu

Update the `SNACKS` array at the top of `app.js`.

## Cloudflare Pages

- Build command: leave blank
- Build output directory: `.`
- Functions directory: `functions`

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
