# Project Memory

Last updated: 2026-05-15 20:30:00 +02:00

## Project Objective

Create an **interactive browser-based 2D game** that teaches game design principles through gameplay, centered on a Dark Souls case study, hosted on a secure Proxmox/LXC VPS infrastructure.

---

## Presentation Direction — PIVOT: Interactive Game

The presentation is no longer slide-based. It is a **playable 2D game running in the browser**.

### Game Flow

```
[Title Screen]
     ↓ PRESS START
[Character Creation]  ← 3 slots (head/body/legs) + gender + 3 colors
     ↓
[Narrative Intro]     ← ex-soldier, lost family to "demonic gacha army from the east"
     ↓
[Game Rooms]          ← side-scrolling 2D rooms, left→right progression
     ↓
[Credits]             ← rolling end credits + sources + thank you
```

### Game Mechanics

- **Input**: Keyboard+Mouse or Xbox Controller (HTML5 Gamepad API)
- **Navigation**: Player physically walks to screen edges to trigger scene transition
- **Camera**: Follows player; rooms can be wider than the viewport (scrolling)
- **Room transitions**: Always at left/right edges; general progression left→right (3D sections excepted)

### Planned Rooms

| Room                  | Concept demonstrated         | Notes                                          |
|-----------------------|------------------------------|------------------------------------------------|
| Player Guidance Room  | Player guidance / level design | Two exits right (one with torch=correct, one without=loops back) |
| Gallery Room          | Multimedia exhibit           | 3 paintings + pedestals; press button → image or video (e.g. Banjo-Kazooie music notes video) |
| (more TBD)            | Other design principles      | Each room teaches one design concept           |

### Character Creation

- 3 body part slots: head, body, legs
- Gender selector (female adds breast pixels — intentional gag)
- 3 color choices (palette swap)
- Character is then controlled through the game

### Narrative

- Player is an ex-soldier
- Lost family to the "demonic gacha army from the east" (represented as attractive anime pixel girls)
- Short intro sequence after character creation

### Credits

- Rolling end credits (bottom to top), game-style
- Lists sources / citations
- Thank you message to audience for playing
- End credit music

---

## Planned Tech Stack — Game Engine

| Layer               | Technology                        | Reason                                               |
|---------------------|-----------------------------------|------------------------------------------------------|
| Game world / rooms  | **Phaser 3** (latest)             | 2D rendering, physics, camera, gamepad, tilemaps     |
| UI screens          | **React** (existing)              | CharacterCreate, StartScreen, video overlays, dialogs|
| Pixel character     | Canvas (inside React)             | Small pixel sprite grid, color palette swap          |
| 3D sections (future)| **Three.js** (optional)           | Only if 3D scenes are added later                    |
| Styling             | Cinzel / CSS (existing)           | DS3 aesthetic                                        |

### Architecture

```
App.jsx
├── StartScreen          (React) — current, Cinzel font, DS3 oval glow
├── CharacterCreate      (React + canvas) — pixel art character builder
├── GameScreen           (Phaser 3 canvas, full screen)
│   ├── BootScene        — asset loading
│   ├── IntroScene       — narrative cutscene
│   ├── RoomGuidance     — torch puzzle (player guidance room)
│   ├── RoomGallery      — paintings + media pedestal
│   └── CreditsScene     — rolling credits
└── VideoOverlay         (React DOM over Phaser canvas) — media player
```

### Implementation Phases

1. **Phase 1 (now/next):** Start Screen done. Add Phaser 3. Build CharacterCreate screen.
2. **Phase 2:** Basic player movement + camera in one room. Room transition at edges.
3. **Phase 3:** Player Guidance Room (torch puzzle). Gallery Room + media overlay.
4. **Phase 4:** Narrative intro. Credits. Sound/music. Polish.
5. **Phase 5 (optional):** 3D scene via Three.js.

---

## Current Infrastructure State

- netcup VPS, `152.53.117.246`, Proxmox VE 9.1 on Debian trixie, KVM guest
- SSH: key-only (`id_ed25519` for `viktor@Stealth-17-VP`). Password auth disabled.
- Proxmox web UI `:8006` restricted to Tailscale IPs via `/etc/default/pveproxy`
- `fail2ban`: sshd + proxmox jails, 10 retries / 1h ban
- Tailscale on VPS, Surface, Laptop. MagicDNS active on `tail484da1.ts.net`
- Internal bridge `vmbr1` (`10.10.10.1/24`) with IPv4 forwarding
- Host NAT/DNAT via `presentation-nat.service`: `80/443` → `10.10.10.10`, `iifname "vmbr0"` restricted

## Tailnet

| Device         | Tailscale IP      |
|----------------|-------------------|
| VPS            | `100.118.216.77`  |
| Surface-Viktor | `100.65.232.37`   |
| Stealth-17-VP  | `100.109.133.95`  |

## Container Map

| CT ID | Name     | IP           | Role                                      | Status     |
|-------|----------|--------------|-------------------------------------------|------------|
| 201   | gd-proxy | 10.10.10.10  | Caddy reverse proxy (public HTTPS)        | Active     |
| 202   | gd-dev   | 10.10.10.21  | Dev server (Vite, port 3000)              | Active     |
| 203   | gd-test  | 10.10.10.22  | Testing / CI (not yet configured)         | Standby    |
| 204   | gd-build | 10.10.10.23  | Build pipeline (not yet configured)       | Standby    |
| 205   | gd-prod  | 10.10.10.24  | Production (vite preview, port 4173)      | Active     |

All containers: Debian 13, Node v22.22.2, npm 10.9.7, Python 3.13.5, git 2.47.3

## Public Entry Point

- **Current URL**: `https://gamedesign.152.53.117.246.sslip.io`
- Caddy (CT 201) → `10.10.10.24:4173` (gd-prod, production build)
- Temporary until domain `crysiscreations.de` is purchased

## Deploy Pipeline

```
GitHub main branch (canonical source)
  ├─ gd-dev  (CT 202): git-watcher every 5min → pull → npm install → restart gamedesign-dev.service (Vite dev :3000)
  └─ gd-prod (CT 205): git-watcher every 5min → pull → npm install → npm run build → restart gamedesign-prod.service (vite preview :4173)
```

## Current App State (React)

- `src/components/StartScreen.jsx` — Cinzel font, DS3 oval glow, logo image, any-key/gamepad support
- Old slide system (`SlideEngine`, `slides.js`, etc.) still present — will be removed when game is built
- `public/assets/logo.jpg` — **MISSING, must be added** (image 2 — the "Game Design" artwork)
- `public/assets/menu-sfx.mp3` — **MISSING, must be added** (DS3 menu sound effect)
- `public/assets/menu-ost.mp3` — **MISSING** (background music for title screen)

## Assets Required

| File                          | Description                              | Status  |
|-------------------------------|------------------------------------------|---------|
| `public/assets/logo.jpg`      | Image 2 ("Game Design" art) — the logo   | MISSING |
| `public/assets/menu-sfx.mp3`  | DS3 menu confirm SFX                     | MISSING |
| `public/assets/menu-ost.mp3`  | Title screen background music            | MISSING |
| `public/assets/bg.jpg`        | Background image (if separate from logo) | MISSING |
| End credit music              | Credits scene music                      | MISSING |

## Open / Blocked Items

- No real domain yet; using `sslip.io`
- Asset files missing (logo, SFX, OST)
- Phaser 3 not yet installed
- Character creation not yet built
- Game rooms not yet built
- Old slide system still in codebase (to be removed)
- gd-test and gd-build not wired into pipeline
- OpenCode CLI not on containers
- Telegram bot not implemented
- StableDiffusion / ComfyUI not set up

## Working Conventions

- Workspace: `docs/`, `game-design-presentation/`, `vps-architecture/`
- Milestone logs under `docs/milestones/` with `YYYY-MM-DD_HHMMSS_short-title.md`
- Context7 MCP before any library/framework code
- Snapshots only on explicit "mach einen snapshot"
- Heredocs over SSH+PowerShell unreliable — use `scp`/`pct push`
- `pct exec` with `nohup &` drops jobs — use `systemd-run` or service units

## Critical Config

- Vite 8 requires `allowedHosts: true` behind reverse proxy
- DNAT rules use `iifname "vmbr0"` — do not remove
- `/etc/caddy/Caddyfile` on CT 201: `reverse_proxy 10.10.10.24:4173`
- GitHub CLI authenticated as `CryseXIII`

## Open Questions

- What exact rooms / design principles will be covered (beyond guidance + gallery)?
- Is the narrative intro text-box style (RPG) or animated cutscene?
- Should character creation use custom pixel art sprites, or placeholder colored shapes first?
- Which 3D scenes are planned, and what engine (Three.js / CSS 3D / pure Phaser 2.5D)?
