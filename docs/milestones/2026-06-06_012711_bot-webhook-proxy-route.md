# Bot Webhook Proxy Route

**Date:** 2026-06-06

## Context

The SillyTavern `SD Generate` button was failing against the public n8n webhook host. The repo Caddy proxy config did not include the `bot` webhook route, so the browser had no reliable HTTPS target for the webhook request.

## Decision

Add the public `bot.152.53.117.246.sslip.io` reverse proxy route to CT201's Caddy config.

## Rationale

- The extension already posts to `https://bot.152.53.117.246.sslip.io/webhook/sd-agent`.
- The webhook needs a reachable public HTTPS host because SillyTavern runs in the browser.
- This is the smallest proxy-side fix that matches the current extension default.

## Challenges

- The live n8n host still needs the normal proxy reload / deployment cycle to pick up the new route.
- The scene-worker render flow is a separate stale-deploy issue and still needs its own refresh.

## Implementation Notes

- Added `bot.152.53.117.246.sslip.io` to `vps-architecture/provisioning/gd-proxy/Caddyfile`.
- The route reverse proxies to CT211 `10.10.10.50:5678`.

## Follow-up

1. Reload the CT201 Caddy config so the route becomes active.
2. Re-test `SD Generate` from SillyTavern.
3. Re-deploy or restart CT214 so `/render/from-excerpt/submit` is live for the scene-render button.
