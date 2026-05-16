# Project Memory

Last updated: 2026-05-17 00:00:00 +02:00

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

### Latest delivered changes

- Asset integration: all WorldBuildingScene and CharacterSelect image assets placed and wired
- CharacterSelect now shows real portrait images with `onError` fallback to sword placeholder
- CreditsScene now branches on `GameState.isGachaDemon()`:
  - Good ending: "DU HAST WIDERSTANDEN — und die Lektion verstanden."
  - Bad ending:  "DU BIST GEFALLEN — und wurdest, was du bekämpfst." + Gacha-Score readout
- manifest.js cleaned: legacy `wb_bg_storm` + `wb_bg_widow` removed; all present image assets set to `loaded`
- New GameScene future assets registered in manifest (`gm_bg_training_arena`, `gm_enemy_autoplay_lady`)

### Core systems in place

- `GameState.js`: `gender`, `gachaScore`, `recordChoice()`, `isGachaDemon()`, `reset()`
- `CharacterSelect.jsx`: DS3-style male/female selection, real portraits, keyboard + gamepad
- `WorldBuildingScene.js`: compressed layout, portrait fade, storm/rain/lightning, widow encounter
- `EncounterOverlay.jsx` + `GachaStoreOverlay.jsx`: overlay decision flow
- `PlayerController.js`: movement/jump/combo/heavy/air attacks
- `GameEngine.js`: `pixelArt: true`, `antialias: false`, gender forwarded to `GameState`
- `PreloadScene.js`: manifest-driven asset loading for `status: 'loaded'`
- `CreditsScene.js`: scrolling credits with branching good/bad ending

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

| Asset | Path | Status |
|-------|------|--------|
| `hero_sheet` | `/assets/dark_fantasy_hero_sprite_sheet.png` | loaded |
| `charsel_portrait_male` | `/assets/charsel_portrait_male.png` | loaded |
| `charsel_portrait_female` | `/assets/charsel_portrait_female.png` | loaded (center-cropped from landscape) |
| `wb_bg_village` | `/assets/scenes/wb/bg_village.png` | loaded |
| `wb_bg_steppe` | `/assets/scenes/wb/bg_steppe.png` | loaded |
| `wb_portrait_male_1..3` | `/assets/scenes/wb/portrait_male_*.png` | loaded |
| `wb_portrait_female_1..3` | `/assets/scenes/wb/portrait_female_*.png` | loaded |
| `wb_fomo_widow` | `/assets/scenes/wb/fomo_widow.png` | loaded |
| `gm_bg_training_arena` | `/assets/gm_bg_training_arena.png` | loaded (not wired yet) |
| `gm_enemy_autoplay_lady` | `/assets/gm_enemy_autoplay_lady.png` | loaded (not wired yet) |
| `wb_fire_sfx` | `/assets/scenes/wb/fire_sfx.mp3` | **missing** |
| `wb_rain_sfx` | `/assets/scenes/wb/rain_sfx.mp3` | **missing** |
| `wb_widow_music` | `/assets/scenes/wb/widow_music.mp3` | **missing** |

Removed legacy keys: `wb_bg_storm`, `wb_bg_widow` (not used after scene compression)

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

1. Generate and import audio assets (`wb_fire_sfx`, `wb_rain_sfx`, `wb_widow_music`)
2. Wire `gm_bg_training_arena` + `gm_enemy_autoplay_lady` into GameScene
3. Verify visual pacing on gd-prod with all new assets active
4. Wire gd-test and gd-build containers into deployment workflow
5. Buy/attach production domain (`crysiscreations.de`)
6. Portrait review: female CharacterSelect portrait was landscape-cropped; re-generate if result unsatisfactory
