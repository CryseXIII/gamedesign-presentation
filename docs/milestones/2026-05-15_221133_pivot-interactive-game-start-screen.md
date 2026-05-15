# Milestone: Pivot to Interactive 2D Game + Start Screen Redesign

**Date:** 2026-05-15 22:11 +02:00

## Context

The presentation was previously a React slide-based system (SlideEngine, chapter/content slides, sidebar). The user decided to replace this entirely with an interactive browser-based 2D game that teaches game design principles through gameplay rather than slides.

## Decisions

### 1. Presentation format: slides → interactive 2D game

The final product is a playable side-scrolling browser game. The audience at the school display participates as a player, not as a passive viewer. The game teaches game design principles by having the player experience them directly.

### 2. Tech stack: Phaser 3 + React hybrid

- **React** handles UI screens (StartScreen, CharacterCreate, video overlays)
- **Phaser 3** handles the game world (2D rooms, player movement, camera, tilemaps)
- The existing React shell stays; Phaser mounts inside it when the game starts

### 3. Start Screen redesign (implemented)

- Font changed from "Press Start 2P" to **Cinzel** (closest Google Font match to DS3 serif)
- Layout: large logo image (image 2, "Game Design" art) at top → "PRESS START" below
- DS3-style **oval glow** behind the button text (always visible, brightens on hover)
- Button is no longer a box — it is styled text with an oval pseudo-element, matching DS3
- **Any key** triggers start (not just Enter/Space), matching game convention
- **Xbox controller**: HTML5 Gamepad API polling added — any button press triggers start
- Sound effect hook in place (`/assets/menu-sfx.mp3`, file to be provided)
- Font sizes use `clamp()` for responsive scaling — readable from distance on school display

### 4. Narrative concept

Player is an ex-soldier. Lost family to the "demonic gacha army from the east" — enemies depicted as anime pixel girls, as a satirical commentary on gacha game aesthetics.

### 5. Game room concept

- Player physically walks left/right to rooms, triggering transitions at screen edges
- Player Guidance Room: two exits (torch = correct, no torch = loops back) — demonstrates guidance design
- Gallery Room: paintings + pedestals, press button to show image or play video
- Credits: rolling end credits with sources and end credit music

## Challenges

- Local Windows machine does not have node_modules installed for the app — build is verified only on gd-prod via git watcher
- Cinzel font fallback chain: `'Cinzel', 'Georgia', serif` — renders reasonably even if Google Fonts fails

## Assets Still Missing

| File                       | Purpose                     |
|----------------------------|-----------------------------|
| `public/assets/logo.jpg`   | Image 2 as title screen logo |
| `public/assets/menu-sfx.mp3` | DS3 confirm SFX            |
| `public/assets/menu-ost.mp3` | Title screen BGM           |

## Follow-up Items

1. User provides `logo.jpg`, `menu-sfx.mp3`, `menu-ost.mp3` → drop into `public/assets/`, push to GitHub
2. Install Phaser 3 (`npm install phaser`)
3. Build CharacterCreate screen (React + canvas, pixel art, 3 colors, gender)
4. Build basic player movement + camera (Phaser scene)
5. Build Player Guidance Room (torch puzzle)
6. Build Gallery Room (paintings + media overlay)
7. Build Narrative Intro + Credits
