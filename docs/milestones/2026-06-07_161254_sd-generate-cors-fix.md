# SD Generate CORS Fix

## Context
The SillyTavern `SD Generate` browser action was reaching `sd-orchestrator`, but the browser request never completed because the cross-origin preflight failed. The backend also had a stale duplicate `orchestrator.service` that was colliding on port `8766`.

## Decision
Keep the public `sd-orchestrator` hostname and make it browser-safe at the edge with Caddy CORS handling. Disable the stale `orchestrator.service` so only `sd-orchestrator.service` owns the port.

## Rationale
- The browser needs a valid `OPTIONS` response before it can send the JSON `POST`.
- Fixing CORS at Caddy is minimal and keeps the backend unchanged.
- Removing the duplicate systemd unit avoids port noise and future confusion.

## Challenges
- The route was returning `405` on `OPTIONS /generate/planned`.
- `@preflight` had to be preserved correctly in the Caddyfile edit.
- The response body is large, so the browser flow needed a long verification window.

## Implementation Notes
- Added CORS headers and an `OPTIONS` 204 response for `sd-orchestrator.gamedesign.152.53.117.246.sslip.io` in CT201 Caddy.
- Disabled the stale `orchestrator.service` on CT210.
- Verified the browser flow against Rachel Alucard in SillyTavern.
- Confirmed `POST /generate/planned` returns `200` and the browser loads returned image data.

## Follow-Up
- Keep an eye on response time for `SD Generate`.
- Consider whether the image-action flow should move to a queued progress UI later.
