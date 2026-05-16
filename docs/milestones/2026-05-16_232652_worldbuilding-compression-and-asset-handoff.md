# WorldBuilding compression, encounter flow update, and session handoff docs

Date: 2026-05-16
Related commits: `095e85a`, `f9e35c8`

## Context

Scene 1 had already been rebuilt with the widow encounter and React overlay flow, but two follow-up direction changes were requested:

1. The level should be further compressed for tighter pacing.
2. On-screen zone titles should be removed.

In parallel, we needed durable documentation so a new session can continue work without reconstructing context, including a complete asset generation list that now also includes a replacement main character sprite sheet.

## Decision

1. Compress `WorldBuildingScene` from `W * 11` to `W * 7` total width.
2. Remove zone title UI from the scene.
3. Keep the updated encounter flow:
   - Overlay options are Kaufen / Abbrechen only.
   - Abbrechen returns control to scene combat via J-prompt.
4. Store a canonical asset specification in a dedicated doc (`docs/worldbuilding-asset-spec.md`) including:
   - New hero sprite sheet specification
   - CharacterSelect portraits
   - Scene backgrounds
   - Backstory portrait set
   - FOMO Widow sprite
   - Audio assets
5. Refresh `docs/project-memory.md` so another session can resume directly.

## Rationale

- Compression improves rhythm and reduces dead travel time before core teaching moments.
- Removing title overlays keeps the scene cinematic and avoids UI clutter.
- The cancel-to-combat encounter flow better supports the design goal of player agency under manipulation pressure.
- A dedicated asset spec prevents prompt drift and keeps art production consistent across sessions/tools.
- Updating project memory after gameplay and pacing changes avoids stale docs and reduces onboarding cost for future sessions.

## Challenges

- Compressed portrait spacing required reducing portrait fade radius so overlays do not stack too heavily.
- Existing manifest still contains legacy background keys (`wb_bg_storm`, `wb_bg_widow`) that are no longer required by runtime after compression, so docs needed to explicitly flag this mismatch for cleanup.

## Implementation notes

- `src/game/scenes/WorldBuildingScene.js`
  - Zone constants now: `Z1:0`, `Z2:1.5`, `WIDOW:5`, `END:7`
  - Widow anchor moved to `WIDOW_X_FACTOR = 6`
  - Portrait stations now: `[2, 3.2, 4.4]`
  - Portrait fade radius reduced to `W * 0.8`
  - Zone label creation and update logic removed
  - Zone 1 ambient glow recentered to match new compressed bounds
- `docs/project-memory.md`
  - Rewritten to reflect latest architecture, encounter behavior, compression, and next actions
  - Added explicit reference to `docs/worldbuilding-asset-spec.md`
- `docs/worldbuilding-asset-spec.md`
  - Added complete generation and integration checklist for image/audio assets

## Follow-up items

1. Generate assets per `docs/worldbuilding-asset-spec.md`.
2. Replace CharacterSelect placeholders with real portrait assets.
3. Replace hero sheet with new one (or update `animConfig.js` if layout deviates).
4. Clean `src/game/assets/manifest.js` to remove or repurpose legacy unused keys.
5. Wire `GameState.isGachaDemon()` to `CreditsScene` branching ending logic.
6. Verify gd-prod visual pacing with compressed Scene 1 and adjust trigger distances if needed.
