# Project Memory

Last updated: 2026-05-16 23:26:52 +02:00

## Project Objective

Create an interactive browser-based 2D game ("Gameron") that teaches game design principles through gameplay, centered on a Dark Souls case study and dark-pattern critique, hosted on a hardened Proxmox/LXC VPS.

---

## Current Narrative Direction

- World: Gameron, a land corrupted by "Gacha Gals" (dark-pattern demons)
- Player: grief-driven warrior, gender selected at start
- Tone: dark fantasy gothic, Soulslike atmosphere
- Arc: player resists manipulation mechanics; cumulative gacha-friendly choices feed `GameState.gachaScore`

### Active Game Flow

```
[CharacterSelect]
      ->
[WorldBuildingScene]
      ->
[PlayerGuidanceScene]
      ->
[GalleryScene]
      ->
[CreditsScene]
```

---

## Current Code State

### Latest delivered gameplay changes

- Commit `095e85a`: WorldBuildingScene rewrite for encounter flow and organic combat
  - Storm overlaid on steppe progression
  - EncounterOverlay aligned to two choices only: Kaufen / Abbrechen
  - Abbrechen now transitions to in-world combat prompt `[ J ] ANGREIFEN`
  - Widow damage model implemented: 25 HP per registered attack-state transition, 4 hits total
- Commit `f9e35c8`: scene compression + title removal
  - World width compressed to `W * 7`
  - Zone layout now:
    - Zone 1: `0 -> W*1.5`
    - Zone 2 (steppe + storm overlay): `W*1.5 -> W*5`
    - Widow area: `W*5 -> W*7`
  - Portrait stations: `[2, 3.2, 4.4]` in `W` units, reduced fade radius for tighter spacing
  - On-screen zone title text removed completely

### Core systems in place

- `GameState.js`: `gender`, `gachaScore`, `recordChoice()`, `isGachaDemon()`, `reset()`
- `CharacterSelect.jsx`: DS3-style male/female selection with keyboard and gamepad input
- `WorldBuildingScene.js`: compressed layout, portrait fade, storm/rain/lightning, widow encounter
- `EncounterOverlay.jsx` + `GachaStoreOverlay.jsx`: overlay decision flow
- `PlayerController.js`: movement/jump/combo/heavy/air attacks
- `GameEngine.js`: `pixelArt: true`, `antialias: false`, gender forwarded to `GameState`
- `PreloadScene.js`: manifest-driven asset loading for `status: 'loaded'`

---

## Encounter Logic (Current)

- Phaser dispatches `game:encounterChoice { id: 'fomo_widow', hp: 100 }`
- React overlay presents:
  - Kaufen -> Gacha overlay -> `decision: 'pay'` -> `recordChoice('gacha')`
  - Abbrechen -> `decision: 'cancel'` -> return to world, show J prompt near widow
- If player attacks near widow after cancel:
  - Attack-state edge detection (`light1|light2|light3|heavy`) applies 25 HP each
  - At 0 HP -> `recordChoice('fight')` and widow defeated
- If player walks past without engaging further, no additional score change

---

## Asset Status

- Manifest file remains the source of truth: `src/game/assets/manifest.js`
- Most worldbuilding assets still `missing`
- Full generation spec (including new hero sheet and CharacterSelect portraits) documented in:
  - `docs/worldbuilding-asset-spec.md`

Notes:
- Runtime currently only uses two world backgrounds (`wb_bg_village`, `wb_bg_steppe`) after compression
- Manifest still contains legacy `wb_bg_storm` and `wb_bg_widow` entries that should be pruned or repurposed in a cleanup pass

---

## Infrastructure Snapshot

- VPS: `152.53.117.246`, Proxmox VE 9.1
- Proxmox GUI `:8006` restricted to Tailscale IPs
- Public traffic: `80/443` -> CT 201 Caddy -> CT 205 production app
- Public URL: `https://gamedesign.152.53.117.246.sslip.io`
- Deploy: git-watcher timers on gd-dev (202) and gd-prod (205), 5-minute pull/build/restart

Container map:

| CT ID | Name     | IP           | Role                                 |
|-------|----------|--------------|--------------------------------------|
| 201   | gd-proxy | 10.10.10.10  | Caddy reverse proxy                  |
| 202   | gd-dev   | 10.10.10.21  | Dev server                           |
| 203   | gd-test  | 10.10.10.22  | Test/CI (standby)                    |
| 204   | gd-build | 10.10.10.23  | Build pipeline (standby)             |
| 205   | gd-prod  | 10.10.10.24  | Production (vite preview :4173)      |

---

## Rules and Constraints (Still Active)

- Snapshots only on explicit "mach einen snapshot"
- Context7 first for framework/library/tooling usage
- Security-first VPS changes before adding public services
- Preserve `iifname "vmbr0"` filter in NAT/DNAT rules

---

## Open Items / Next Steps

1. Generate and import assets from `docs/worldbuilding-asset-spec.md`
2. Update CharacterSelect to use real portrait images (remove emoji placeholder)
3. Replace hero sprite sheet with newly generated one (same grid spec or update anim map)
4. Wire `GameState.isGachaDemon()` into `CreditsScene` for good/bad ending branch
5. Clean up `manifest.js` to match compressed scene asset usage
6. Wire gd-test and gd-build containers into deployment workflow
7. Buy/attach production domain (`crysiscreations.de`)
