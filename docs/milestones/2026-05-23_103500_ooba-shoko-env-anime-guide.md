# Milestone: Oobabooga, Shoko, and Anime Layout

**Date**: 2026-05-23 10:35 UTC

---

## Context

The user wanted the portal to reach Oobabooga and Shoko cleanly, with the option to point those services at public hostnames later. They also wanted a practical guide for organizing anime so Jellyfin and Shoko can work together.

---

## Decision

1. Make the Oobabooga and Shoko portal URLs env-driven.
2. Add a concrete anime folder layout guide for Jellyfin and Shoko.
3. Keep the portal labels explicit so chat UI, API, and metadata sidecar are not confused.

---

## Rationale

- Env-driven URLs let the same portal point either at Tailnet IPs or at future public hostnames.
- Shoko works best when each series lives in its own folder and Jellyfin sees a clean TV library.
- The portal should show exactly what each link does.

---

## Challenges

- Public exposure of the services still depends on infra-level routing outside the React app.
- Shoko is a metadata sidecar, not a replacement for Jellyfin playback.

---

## Implementation Notes

- Added `VITE_OOBA_CHAT_URL`, `VITE_OOBA_API_URL`, and `VITE_SHOKO_URL` support in `src/config/portalTargets.js`.
- Added the same env-driven URLs to `vps-architecture/orchestrator/openwebui_tool.py`.
- Added `docs/jellyfin-shoko-anime-guide.md`.

---

## Follow-up Items

1. Set the env vars to public hostnames if you expose those services later.
2. If Shoko gets deployed, wire its real URL into the portal env.
3. Use the guide to normalize the anime library tree before the next full scan.
