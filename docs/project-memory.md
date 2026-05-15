# Project Memory

Last updated: 2026-05-16 01:55:00 +02:00

## Project Objective

Create an **interactive browser-based 2D game** ("Gameron") that teaches game design principles
through gameplay, centered on a Dark Souls case study and dark-pattern critique.
Hosted on a secure Proxmox/LXC VPS infrastructure.

---

## Gameron — World & Narrative

- **World**: Gameron — a land of good games corrupted by "Gacha Gals" (demonic anime succubus
  symbols of predatory game design dark patterns)
- **Player**: grief-driven warrior (gender chosen at start) seeking revenge for their destroyed village
- **Tone**: dark fantasy gothic; Soulslike aesthetic (DS3); copper/amber palette
- **Arc**: 8 scenes, each teaching a game design principle by having the player face a dark-pattern
  obstacle. Final outcome (good/bad ending) depends on `GameState.gachaScore`.

### Game Flow

```
[CharacterSelect]  ← two DS3-style cards: male / female warrior
      ↓
[WorldBuildingScene]  ← Scene 1: burning village, steppe portraits, storm, FOMO Widow
      ↓
[PlayerGuidanceScene] ← Scene 2: torch puzzle (player guidance / level design)
      ↓
[GalleryScene]        ← Scene 3: painting gallery + media overlay
      ↓
[CreditsScene]        ← Scene 4: rolling credits, end music
```

### Scene Design Principles

| Scene                 | Concept                          | Dark pattern obstacle             |
|-----------------------|----------------------------------|-----------------------------------|
| WorldBuildingScene    | Freedom of movement              | FOMO Widow (pay or fight)         |
| PlayerGuidanceScene   | Player guidance / level design   | Torch puzzle (no handholding)     |
| GalleryScene          | Multimedia exhibit               | Gallery locked until E-interact   |
| CreditsScene          | Credits / attribution            | —                                 |

---

## Current Code State

### Completed (Phase 4 — commit `546c61f`)

- `CharacterSelect.jsx` + `characterselect.css`: DS3 two-card gender selection
- `GameState.js`: singleton `{ gender, gachaScore, recordChoice(), isGachaDemon(), reset() }`
- `WorldBuildingScene.js`: 4-zone scrolling world (W×14); fire particles, portrait fade,
  rain+lightning, FOMO Widow encounter trigger
- `EncounterOverlay.jsx` + `encounter.css`: React fight/pay modal
- `GachaStoreOverlay.jsx` + `gacha.css`: parody diamond shop (timer, FOMO nudge, bundles)
- `manifest.js`: full asset registry; all worldbuilding assets currently `'missing'` → placeholders
- `GameEngine.js`: `pixelArt: true`; registers WorldBuildingScene; writes gender to GameState
- `PlayerController.js`: MOVE_SPEED 380, setOffset(45,40), SPAWN_Y_OFFSET 60
- `index.html`: capture-phase contextmenu listener (right-click fix on canvas)
- `App.jsx`: CharacterSelect → GameScreen with gender state
- `GameScreen.jsx`: gender prop → createGame; encounter event listeners
- `PreloadScene.js`: starts WorldBuildingScene; loads wb_ assets from manifest when 'loaded'

### Previous (Phase 3 — commit `5801470`)

- `animConfig.js`: HERO_ATLAS, HERO_ANIMS (19 states), registerAnimations()
- `PlayerController.js`: full state machine (idle/run/jump/fall/land/doubleJump/light1-3/heavy/airLight)
  3-hit combo, double-jump, interactJustDown getter, halt(), destroy()
- `PreloadScene.js`, `GameScene.js`, `PlayerGuidanceScene.js`, `GalleryScene.js`, `CreditsScene.js`
- `public/assets/dark_fantasy_hero_sprite_sheet.png` (1024×1536, 8×12, 128×128 frames)

---

## Rendering & Feel — Fixes Applied (Phase 4)

| Issue                     | Fix                                                     |
|---------------------------|---------------------------------------------------------|
| Halo/transparency artifacts | `render: { pixelArt: true, antialias: false }` in GameEngine |
| Body offset / foot placement | setOffset(45,40), SPAWN_Y_OFFSET=60                  |
| Sluggish movement          | MOVE_SPEED 220 → 380                                   |
| Browser right-click on canvas | Capture-phase contextmenu listener in index.html   |

---

## Asset System

All assets tracked in `src/game/assets/manifest.js`.

- Status `'loaded'`: file in `public/assets/`, PreloadScene loads it
- Status `'missing'`: file not yet generated; scenes show colored placeholder rect + `"missing_id:<key>"` text

**To add a new asset**: drop file → update status to `'loaded'` in manifest → rebuild.

### Asset folders

```
public/assets/                    global (hero sheet, audio, logo)
public/assets/scenes/wb/          WorldBuildingScene
public/assets/scenes/guidance/    PlayerGuidanceScene (future)
public/assets/scenes/gallery/     GalleryScene (future)
```

### Missing (need AI generation)

| Key                        | Description                                        |
|----------------------------|----------------------------------------------------|
| `wb_bg_village`            | Zone 1 burning village BG, dark fantasy, fire glow |
| `wb_bg_steppe`             | Zone 2 barren steppe at dusk, copper tones         |
| `wb_bg_storm`              | Zone 3 stormy plain with lightning sky             |
| `wb_bg_widow`              | Zone 4 ruined shrine, lavender glow                |
| `wb_portrait_male_1/2/3`   | Male backstory portraits, copper engraving style   |
| `wb_portrait_female_1/2/3` | Female backstory portraits, copper engraving style |
| `wb_fomo_widow`            | FOMO Widow sprite; demonic anime succubus, lavender |
| `wb_fire_sfx`              | Ambient fire crackle loop MP3                      |
| `wb_rain_sfx`              | Rain + thunder ambient loop MP3                    |
| `wb_widow_music`           | Boss encounter music MP3                           |
| CharacterSelect portraits  | Male / female warrior portrait cards               |

---

## Encounter System

`game:encounterChoice { id, hp }` → React `EncounterOverlay`:
- **KÄMPFEN** → `GameState.recordChoice('fight')` → widow fades → game continues
- **DIAMANTEN ZAHLEN** → `GachaStoreOverlay` (parody shop) → on close:
  `GameState.recordChoice('gacha')` → `game:encounterDecision { decision: 'pay' }` → game continues

`game:encounterDecision` received by `WorldBuildingScene._onEncounterDecision()`.

**gachaScore threshold**: `>= 5` → `GameState.isGachaDemon()` returns true → triggers bad ending
(not yet wired to CreditsScene — follow-up item).

---

## Infrastructure

- netcup VPS `152.53.117.246`, Proxmox VE 9.1 on Debian trixie
- SSH key-only (`id_ed25519` for `viktor@Stealth-17-VP`)
- Proxmox web `:8006` locked to Tailscale IPs
- `fail2ban`: sshd + proxmox jails
- Tailscale on VPS, Surface, Laptop. Tailnet `tail484da1.ts.net`
- `vmbr1` bridge `10.10.10.1/24`; NAT/DNAT via `presentation-nat.service`
- DNAT rules use `iifname "vmbr0"` — never remove

### Tailnet

| Device         | Tailscale IP      |
|----------------|-------------------|
| VPS            | `100.118.216.77`  |
| Surface-Viktor | `100.65.232.37`   |
| Stealth-17-VP  | `100.109.133.95`  |

### Container Map

| CT ID | Name     | IP           | Role                                      | Status  |
|-------|----------|--------------|-------------------------------------------|---------|
| 201   | gd-proxy | 10.10.10.10  | Caddy reverse proxy (public HTTPS)        | Active  |
| 202   | gd-dev   | 10.10.10.21  | Dev server (Vite, port 3000)              | Active  |
| 203   | gd-test  | 10.10.10.22  | Testing / CI (not yet configured)         | Standby |
| 204   | gd-build | 10.10.10.23  | Build pipeline (not yet configured)       | Standby |
| 205   | gd-prod  | 10.10.10.24  | Production (vite preview, port 4173)      | Active  |

All containers: Debian 13, Node v22.22.2, npm 10.9.7

### Public Entry Point

- **Current URL**: `https://gamedesign.152.53.117.246.sslip.io`
- Caddy (CT 201) → `10.10.10.24:4173` (gd-prod, production build)
- Target domain: `crysiscreations.de` (not yet purchased)

### Deploy Pipeline

```
GitHub main branch (canonical)
  ├─ gd-dev  (CT 202): git-watcher every 5min → pull → npm install → restart Vite dev :3000
  └─ gd-prod (CT 205): git-watcher every 5min → pull → npm install → npm run build → restart vite preview :4173
```

---

## Working Conventions

- Milestone logs: `docs/milestones/YYYY-MM-DD_HHMMSS_short-title.md`
- Context7 MCP before any library/framework code
- Snapshots only on explicit "mach einen snapshot"
- SSH heredocs over PowerShell unreliable — use `scp`/`pct push`
- `pct exec` with `nohup &` drops jobs — use `systemd-run` or service units

## Critical Config

- Vite 8 requires `allowedHosts: true` behind reverse proxy
- `iifname "vmbr0"` DNAT rules — do not remove
- `/etc/caddy/Caddyfile` on CT 201: `reverse_proxy 10.10.10.24:4173`
- GitHub CLI authenticated as `CryseXIII`
- `pixelArt: true` in Phaser config is critical — without it, sprite edges have halo artifacts

---

## Open / Blocked Items

- No real domain yet; using `sslip.io`
- All worldbuilding art assets missing (need AI generation)
- CharacterSelect portrait cards: emoji placeholder until art generated
- FOMO Widow fight combat: instant defeat — real combat (4 hits × 25 dmg) not yet implemented
- Bad ending in CreditsScene not yet wired to `GameState.isGachaDemon()`
- gd-test and gd-build not wired into pipeline
- Telegram bot not implemented
- StableDiffusion / ComfyUI not set up

## Next Steps

1. Generate art assets: backgrounds (4), portraits (6), FOMO Widow sprite — output full AI prompt
2. Generate audio: fire crackle, rain/thunder, widow music
3. Once assets ready: place in `public/assets/scenes/wb/`, update manifest status, rebuild
4. Implement real combat in FOMO Widow encounter (J-key attacks deal 25 HP each)
5. Wire `GameState.isGachaDemon()` into CreditsScene for bad vs. good ending
6. Add CharacterSelect portrait images once generated
7. Consider zone ambient music (fire crackle auto-play in zone 1, rain in zone 3)
8. gd-test / gd-build pipeline wiring
