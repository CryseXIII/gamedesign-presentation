# Milestone: Deploy Pipeline + Git Watchers Live

**Date:** 2026-05-15 19:52 +02:00

## Context

The React presentation app was already built and running on `gd-dev` (CT 202) with a Vite dev server, and the GitHub repo `CryseXIII/gamedesign-presentation` had been created with the initial commit pushed. Caddy on `gd-proxy` was pointing to `gd-dev:3000` as a temporary preview. The next goal was to establish an automated deploy pipeline and switch public traffic to a production build.

## Decisions

1. **Two-container pipeline (dev + prod)** rather than all four containers at once.
   - gd-test and gd-build are provisioned but not yet wired in — add them when there are actual tests to run.
   - Avoids over-engineering before content is finalized.

2. **`vite preview` for gd-prod** instead of a separate static server (nginx, Caddy on CT 205, etc.).
   - Zero extra dependencies; `vite preview` ships with Vite and serves the `dist/` output correctly.
   - Port 4173 is the Vite preview default.

3. **Git watcher as a systemd timer** (oneshot service + 5min timer) on both gd-dev and gd-prod.
   - Follows the architecture defined in `AGENTS.md`.
   - On gd-dev: pull → `npm install` → restart `gamedesign-dev.service`.
   - On gd-prod: pull → `npm install` → `npm run build` → restart `gamedesign-prod.service`.

4. **GitHub is the canonical source** — both containers pull from `origin/main`.
   - Push to GitHub → both containers auto-update within 5 minutes.
   - No manual SSH required for routine content updates.

## Rationale

- Keeping gd-dev on a hot Vite dev server is useful for debugging (HMR, source maps).
- gd-prod runs a static production build served by `vite preview` — faster, no source maps exposed publicly.
- The git watcher pattern is token-efficient (no persistent AI process; just a shell script + timer).

## Challenges

- gd-dev had committed `node_modules/` into git (365 files) because `.gitignore` was not present when `git init` ran. Fixed with `git reset --hard origin/main` followed by `npm install`.
- Heredoc syntax over SSH+PowerShell is unreliable for multi-line file writes. All files were written locally and pushed via `scp` + `pct push`.

## Implementation Notes

- `gamedesign-prod.service` (CT 205): `ExecStart` calls `vite preview --host 0.0.0.0 --port 4173`.
- `git-watcher` script at `/usr/local/bin/git-watcher` on CT 202 and CT 205 (different content per container).
- `git-watcher.timer` fires `OnBootSec=2min` then every `OnUnitActiveSec=5min`.
- Caddy (`/etc/caddy/Caddyfile` on CT 201) updated from `10.10.10.21:3000` to `10.10.10.24:4173`.
- End-to-end verified: `https://gamedesign.152.53.117.246.sslip.io` returns HTTP 200 from gd-prod.

## Follow-up Items

- Wire gd-test and gd-build into the pipeline (requires deciding on test strategy).
- Add real assets (`bg.jpg`, `menu-sfx.mp3`, `menu-ost.mp3`, `loader.gif`) — push to GitHub and the pipeline handles the rest.
- Purchase `crysiscreations.de` and update Caddyfile.
- Install OpenCode CLI on containers for SSH subagent capability.
