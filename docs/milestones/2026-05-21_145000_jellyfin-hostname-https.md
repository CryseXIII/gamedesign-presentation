# Jellyfin Hostname And HTTPS

## Context

The Jellyfin container was reachable, but the portal needed a clean HTTPS hostname instead of a raw IP:port link.

## Decision

Expose Jellyfin through Caddy on a dedicated `sslip.io` hostname and point the portal card at that HTTPS URL.

## Rationale

This keeps the access path simple for the browser and makes the portal feel like a real hub instead of a list of technical endpoints.

## Challenges

- The proxy container needed to confirm it could reach the Jellyfin container on the internal bridge first.

## Implementation Notes

- Added `jellyfin.gamedesign.152.53.117.246.sslip.io` to the Caddy site config on CT201.
- Verified the new hostname returns the Jellyfin login page.
- Updated the portal link to `https://jellyfin.gamedesign.152.53.117.246.sslip.io/web/`.
- Updated repo-local memory to reference the HTTPS hostname.

## Follow-up Items

- Keep the portal and hostname docs aligned if the route changes again.
