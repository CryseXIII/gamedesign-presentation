# Portal New-Tab Fix

**Date:** 2026-06-07

## Context

The public portal still sent the user into dead or certificate-broken targets when clicking Vision Portal, A1111, or ComfyUI.

## Decision

Expose those links on the public portal with served targets that do not depend on fragile HTTPS sslip.io defaults.

## Rationale

- The user wanted the portal click path to work end-to-end in a browser.
- Vision is already a route inside the same served SPA, so it can open in a new tab without leaving the app.
- A1111 and ComfyUI are reachable over Tailnet HTTP and should not rely on a public TLS hostname.

## Challenges

- The first Vision link target pointed at a dead `8080` endpoint instead of the served portal route.
- `canOpenVision()` was still blocking the route on the public portal host.
- The live bundle had to be rebuilt on CT205, not just changed in the workspace.

## Implementation Notes

- Changed `src/config/portalTargets.js` so Vision/A1111/ComfyUI links are always present, and Vision points to `https://gamedesign.152.53.117.246.sslip.io/#/vision`.
- Changed `src/App.jsx` so the Vision route is not blocked by hostname.
- Rebuilt and restarted CT205 `gamedesign-prod.service`.
- Verified `https://gamedesign.152.53.117.246.sslip.io/` returns `200` and the deployed bundle contains the new Vision/A1111/ComfyUI targets.
- Verified `http://100.109.133.95:7860/` and `http://100.109.133.95:8189/` both return `200`.

## Follow-up

1. Keep the public portal links on the HTTP/Tailnet defaults unless a real TLS certificate is provisioned for those services.
2. If the browser still caches old assets, hard-refresh the portal tab once.
