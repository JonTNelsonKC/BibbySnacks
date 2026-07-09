# BibbySnacks

A tiny Cloudflare Pages app for choosing afternoon snacks, reviewing checkout, and sending a push/webhook notification.

## Cloudflare Pages

This repository is meant to deploy with the default Cloudflare Pages Git integration. Do not manually deploy with Wrangler from the Pages build.

Use these Cloudflare Pages settings:

- Framework preset: `None`
- Build command: leave blank, or use `exit 0`
- Build output directory: `.`
- Root directory: repository root
- Functions directory: `functions`
- Deploy command: leave blank

For this no-framework static app, Cloudflare's own docs say to leave the Build command blank, or use `exit 0` if a command is required. After the build exits successfully, Pages uploads the configured output directory. The app files live at the repository root, so the output directory is `.`.

If the dashboard still insists on running `npm run deploy`, that script is intentionally a no-op that exits successfully. It does not call Wrangler and does not need a Cloudflare API token.

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

Set `ORDER_PIN` as a Pages secret. The checkout passcode field is only enforced when that secret exists.

## Edit the menu

Update the `SNACKS` array at the top of `app.js`.

## Local checks

```sh
npm test
python3 -m http.server 8788
```
