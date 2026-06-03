# Milestone: Env-Driven Oobabooga and Shoko

**Date**: 2026-05-23 23:38 UTC

---

## Context

The user wanted the portal to reach Oobabooga and Shoko in a way that can later be pointed at public hostnames, and also wanted Jellyfin + Shoko guidance for anime organized by series folders.

---

## Decision

1. Make Oobabooga chat/API URLs env-driven in the portal and tool menu.
2. Keep Shoko env-driven in the portal and tool menu as a metadata sidecar for Jellyfin.
3. Add a concrete Jellyfin + Shoko anime folder guide.

---

## Rationale

- Env-driven URLs let the same UI work on Tailnet IPs now and on future public hostnames later.
- Jellyfin needs a clean per-series tree to show proper TV navigation.
- Shoko works best as metadata plumbing, not as a player.

---

## Challenges

- Public exposure still requires infra-level routing decisions outside the repo.
- The portal had to stay explicit about what is chat UI, what is API, and what is metadata sidecar.

---

## Implementation Notes

- `src/config/portalTargets.js` now reads `VITE_OOBA_CHAT_URL`, `VITE_OOBA_API_URL`, and `VITE_SHOKO_URL`.
- `vps-architecture/orchestrator/openwebui_tool.py` now reads `OOBA_CHAT_URL`, `OOBA_API_URL`, and `SHOKO_URL`.
- Added `docs/jellyfin-shoko-anime-guide.md`.

---

## Follow-up Items

1. If public exposure is desired later, set the env vars to the new public hostnames and wire the reverse proxy.
2. Move the anime library folders into the per-series structure before the next full Jellyfin scan.
