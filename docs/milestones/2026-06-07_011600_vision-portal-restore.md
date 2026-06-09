# 2026-06-07 — Vision Portal Restore

## Context

The `vision.gamedesign.152.53.117.246.sslip.io` site started failing with a browser TLS error instead of loading the image-description portal. The underlying vision pipeline still existed in the orchestrator at `/vision/analyze`, but the user-facing entry point was no longer reachable.

## Decision

Restore a dedicated Vision Portal page in the React app and re-add the `vision` hostname in CT201 Caddy with a Tailscale-only source allowlist.

## Rationale

- The browser error was caused by the host/path route disappearing, not by the image data itself.
- The actual analysis backend was still healthy, so the fix belonged in routing and UI wiring.
- The portal should stay private to the tailnet instead of being exposed on the public portal.

## Challenges

- The public portal and the vision portal share the same frontend bundle, so the vision page must be gated by hostname to avoid exposing it on the public portal host.
- The new page has to support multiple uploaded images and return per-image results from the batch analyzer.

## Implementation Notes

- Added `VisionPortal` to `src/components/VisionPortal.jsx` with multi-image upload, prompt entry, batch POST to `/vision/analyze`, and result rendering.
- Wired `#/vision` into `src/App.jsx` and made the dedicated `vision.` hostname default to that page.
- Added the vision portal to `src/config/portalTargets.js`, but only on allowed hosts.
- Reintroduced `vision.gamedesign.152.53.117.246.sslip.io` in `vps-architecture/provisioning/gd-proxy/Caddyfile` and restricted it to Tailscale/private source ranges.
- Verified the React app builds cleanly with `vite build`.

## Follow-Up Items

1. If you want the restore to survive the next CT205 git-watcher cycle, push the same source changes to GitHub.
2. Test the portal from a Tailscale client with a small batch of mixed images.
