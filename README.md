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
- Deploy command: leave blank for normal Pages Git deployments, or use `npm run deploy` only for a manual Wrangler Pages deploy command

Do not use `npx wrangler deploy` as the Pages deploy command. That command deploys Workers, not Pages. If a Cloudflare build log says `Executing user deploy command: npx wrangler deploy`, the Cloudflare dashboard setting is still overriding the repo scripts.

If a Cloudflare build log says `sh: 1: wrangler: not found`, the deploy script is being run before Wrangler is available. This repo pins Wrangler in `devDependencies` and the deploy scripts call `npx wrangler@4.109.0` so Cloudflare can install and run it in the build image.

If a Cloudflare build log says `Authentication error [code: 10000]` while running `wrangler pages deploy`, the `CLOUDFLARE_API_TOKEN` in the build environment does not have permission to deploy Pages. Either remove the custom deploy command and let Git-connected Pages deploy automatically, or update the token with Pages edit/write access for the correct account.

If you are doing a manual Wrangler deploy to Pages instead of Git-connected Pages, use:

```sh
npm run deploy
```

That script runs `npx wrangler@4.109.0 pages deploy . --project-name bibby-snacks`.

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
