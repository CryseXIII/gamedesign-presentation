# Milestone: Public Oobabooga and Shoko Caddy Routes

**Date**: 2026-05-23 23:45 UTC

---

## Context

The user wanted the portal and service links to work as public entries, not just Tailnet shortcuts. Oobabooga should be reachable as both chat UI and API, and Shoko should have a public hostname so it can sit alongside Jellyfin.

---

## Decision

1. Point the portal defaults at public hostnames for Oobabooga chat/API and Shoko.
2. Add matching public virtual hosts in the gd-proxy Caddyfile.
3. Keep the anime guide as the usage reference for Jellyfin + Shoko.

---

## Rationale

- The public portal should not depend on Tailnet-only addresses for core service links.
- Caddy is the correct place to expose the public hostnames.
- Separate hostnames for chat UI and API keep the interface clear.

---

## Challenges

- The chat UI and API live on different ports on the laptop, so they need separate public hostnames.
- Shoko still depends on a real service being present on the target host/port.

---

## Implementation Notes

- Updated `src/config/portalTargets.js` defaults to public hostnames.
- Updated `vps-architecture/orchestrator/openwebui_tool.py` defaults to public hostnames.
- Added `ooba.gamedesign.152.53.117.246.sslip.io`, `ooba-api.gamedesign.152.53.117.246.sslip.io`, and `shoko.gamedesign.152.53.117.246.sslip.io` to `vps-architecture/provisioning/gd-proxy/Caddyfile`.
- Updated `docs/remote-control-map.md` and `docs/project-memory.md`.

---

## Follow-up Items

1. Load the updated Caddyfile on the proxy host.
2. Verify the Oobabooga chat and API hostnames resolve externally.
3. Bring up Shoko on the configured target so the new hostname serves a live UI.
