# Jellyfin Route Exposed

## Context

The portal hub needed a real Jellyfin link, but the service was only reachable on the VPS bridge network at first.

## Decision

Expose Jellyfin through a Tailscale-only DNAT on the VPS host and wire the portal to the working URL.

## Rationale

The user wanted Jellyfin reachable from the portal without guessing container IPs, and keeping the route on the Tailnet avoids unnecessary public exposure.

## Challenges

- Jellyfin was running in CT212 on `10.10.10.60:8096`, which was not reachable directly from the local browser.
- The portal needed a stable URL that would work immediately from the Tailnet.

## Implementation Notes

- Confirmed CT212 `jellyfin` is running and listening on `0.0.0.0:8096`.
- Added a `tailscale0` DNAT rule on the VPS host: `100.118.216.77:8096 -> 10.10.10.60:8096`.
- Verified `http://100.118.216.77:8096/web/` returns the Jellyfin login page.
- Updated `src/config/portalTargets.js` so the Jellyfin card defaults to the working Tailnet URL.
- Updated repo-local memory so the portal docs no longer claim Jellyfin is missing.

## Follow-up Items

- Decide later whether Jellyfin should also get a friendly public Caddy hostname.
