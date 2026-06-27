# Project Memory

Last updated: 2026-06-27 23:06 UTC (workbench upload-analysis copy flow)

## Project Objective

Create a portal-first browser app that exposes Gameron as a subpage, teaches game design principles through gameplay, and also provides a snapshot maintenance console for the hardened Proxmox/LXC VPS stack.

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

- `ImageWorkbench` now auto-analyzes uploaded main images through `/vision/analyze`, fills the source / SD / ChatGPT / Gemini prompt fields from that result, exposes copy buttons for each prompt plus a copy-bundle action, and removes the old prompt snapshot / workflow-note clutter
- Prompt generation now also carries cutout zoom, selection coordinates, and per-edit-area bounds into the copied bundle so the downstream prompts stay precise
- Portal launcher status is now env-only and explicitly blocks mixed-content fetches on the HTTPS portal, so HTTP launcher URLs fail fast with a clear warning instead of a browser fetch error
- `portalTargets.js` now defaults A1111 and ComfyUI links to the public HTTPS hostnames, matching the current tailnet/public split better than the old raw HTTP IP links
- `GameEngine` now registers all scenes directly in the Phaser config, removing the `ready`-callback scene-add race that could leave the first level unavailable after character select
- `K` now fires the diamond-shot gate deactivation globally once the speedup is unlocked, and the time gate is stretched to full scene height so it actually blocks the route until removed
- Zone 2 copper-stich portraits are now sized as tall portrait cards instead of square blocks, the brown intro underlay rectangles were removed, and the Scene 1 exit now uses a delayed fallback start so the transition is less fragile
- Scene 1 now uses a single full-width intro backdrop instead of a clipped steppe/widow image chain; the speedup succubus and time barrier now occupy the old widow zone, the speedup dialog is player-initiated, and the Widow encounter is reserved for a later screen
- Run animation now builds frame textures for both genders from the shared `gm_main_male_run.png` strip, so left/right movement animates even when the selected hero is female
- The intro now has an invisible safety floor, a hard vertical ground clamp, and a slightly higher spawn so the player can stay grounded, reach the speedup waifu, and continue to the next screen with WASD; the unlocked speed boost now also increases movement speed
- The speedup waifu asset was further cut down to `512x512` so the first intro load is a bit lighter
- The speedup waifu is now a real scene asset: `wb_speedup_succubus.png` was imported from Downloads, keyed out to transparent green-screen cutout, resized to `512x512`, added to the manifest, and placed in `WorldBuildingScene` as a floor-anchored image so it no longer falls through the ground
- Scene 1 camera framing is tightened with a 1.08 zoom, round-pixel rendering, and a deadzone so the intro reads more grounded in-browser; the rain emitter now follows camera Y as well as X
- Workbench scrolling is restored, the edit-map export now keeps the stamped cutout as the background, the default orchestrator URL now uses the public HTTPS route, and `App` now preserves the resolved route on first load so `/workbench` and the Vision subpage no longer flicker through the portal first
- `gm_main_male_run.png` is now wired into the hero state machine as the new `run` animation, with chroma-key green removed at preload and the sprite display forced to a stable 128×128 size so the old sheet can stay in place for the other animations while they are phased out
- `wb_bg_intro.png` is now the renamed wide first-screen backdrop, the Scene 1 flow now includes a blue speedup succubus, a diamond burst power-up on `K`, and a dark-blue time barrier that hides for 5 seconds before reappearing; the barrier timer counts down from 01:00 and the non-exception PNGs are still an open optimization pass because the quick resave test inflated several files
- `PlayerController` now tolerates missing animation frames at startup by falling back to frame 0 instead of crashing on `play`, which fixes the loading-screen hang on CT205 when the player sheets are still incomplete or stale
- Image Workbench build is now live on CT205: rebuilt `dist/` was streamed into `/root/gamedesign-app/dist`, `gamedesign-prod.service` was restarted, and the public portal still returns `200 OK`
- Image Workbench rebuilt around the requested workflow: main tab now has drag/drop base loading, a pan/zoom/right-drag cutout viewport with minimap, a FontAwesome stamp button, a modal cutout editor with color-by-stroke paint, right-click continuation, whole-stroke erase, undo/redo, save/close, edit-target generation, output gallery, and checkpoint zip export/import/restore; grid mode is now isolated into its own tab
- The cutout editor now only advances the color wheel on left-click paint strokes, and edit areas can now be deleted from the target cards so colors and targets stay in sync after erasing
- The workbench header no longer shows the sample button, the duplicated main-image select card is gone, and the job log now lives in the right column while the gallery gets the full output width
- React error #62 on `#/workbench` was caused by an accidental string `style` attribute in the orchestrator URL label; it was changed back to a proper JSX style object and the build passed again
- `#/workbench` now scrolls again via a route-specific body class, and the layout was tightened so the center workspace stays dominant while the side columns remain narrower
- CT215 SillyTavern `SD Generate` now works again from the browser: CT201 Caddy adds CORS preflight/response headers on `sd-orchestrator.gamedesign.152.53.117.246.sslip.io`, the stale duplicate `orchestrator.service` on CT210 was disabled, and the browser now receives `POST /generate/planned` `200` responses with returned image data
- Vision Portal restored as a dedicated multi-image upload page that POSTs to `/vision/analyze`; the dedicated `vision.gamedesign.152.53.117.246.sslip.io` host now exists again, is locked to Tailscale source ranges in Caddy, and is live on CT205/CT201
- Portal now exposes Vision Portal, A1111, and ComfyUI links on the public portal too; Vision opens the same served app route in a new tab, and A1111/ComfyUI use direct Tailnet HTTP targets
- Workbench now uses a cooler slate/blue theme, actually scrolls again, and spans a near full-width three-column workspace
- Asset integration: all WorldBuildingScene and CharacterSelect image assets placed and wired
- CharacterSelect now shows real portrait images with `onError` fallback to sword placeholder
- App.jsx now routes `#/portal`, `#/gameron`, and `#/snapshots`
- PortalScreen now provides portal URLs, Gameron/Snapshot launchers, Jellyfin HTTPS, and service cards
- Portal now includes a direct Raw Chat link to the laptop's Oobabooga UI at port 1338
- Portal now exposes Shoko via `VITE_SHOKO_URL` when deployed
- Portal labels now split Oobabooga into Chat UI and API endpoint
- Portal now includes an env-driven Shoko entry for Jellyfin when deployed
- Portal Oobabooga/Shoko links can now be pointed at future public hostnames through `VITE_OOBA_CHAT_URL`, `VITE_OOBA_API_URL`, and `VITE_SHOKO_URL`
- Portal defaults now point at public hostnames: `ooba.gamedesign.152.53.117.246.sslip.io`, `ooba-api.gamedesign.152.53.117.246.sslip.io`, and `shoko.gamedesign.152.53.117.246.sslip.io`
- Oobabooga portal link now targets `/v1/models` instead of the GET-incompatible API root
- Portal now also supports an optional `VITE_SILLYTAVERN_URL` card and labels the raw chat entry explicitly
- Public portal bundle was rebuilt and deployed; the old HTTPS-only defaults that triggered `Secure Connection Failed` were replaced with HTTP/Tailnet targets
- Laptop launcher now exposes ComfyUI lifecycle/wait endpoints for the `sd-webui-comfyui` extension on port 8189, and the deployed daemon now uses a dedicated `ComfyUI\venv` with `torch 2.5.1+cu121`, `torchvision 0.20.1+cu121`, `torchaudio 2.5.1+cu121`, and `transformers 5.10.2`; the shared A1111 venv was the root cause, not a circular dependency. Browser verification passed: `http://127.0.0.1:8189/` returns `200` and the log shows `Starting server` with the isolated venv packages loaded
- `a1111` and `comfyui` are tailnet-only; public portal entries are disabled and the Caddy proxy should not expose them on the public internet
- Scene worker now validates requested checkpoints against the live ComfyUI model list and falls back to Pony/Juggernaut/Albedo if a stale default is configured; the provisioning script now seeds Pony as the default checkpoint
- The SD orchestrator now prefers the installed Pony/Juggernaut/Albedo checkpoints over the stale DreamShaper default when it plans image jobs
- CivitAI Browser+ preview/download paths now have explicit request timeouts on the remaining blocking HTTP calls, and preview-image failures are logged instead of being swallowed silently
- CivitAI Browser+ now also persists the visible download queue snapshot in `sessionStorage` across refreshes, so the browser UI can recover the queue panel after a page reload
- CivitAI Browser+ now also exposes an active-download snapshot and polls it after refresh, so a running aria2 job can reattach its visible progress state
- ComfyUI on Windows was crashing on `tqdm` progress output because the logger wrapper inherited `cp1252`; `app/logger.py` now defaults to UTF-8 with `errors='replace'` so the progress bar cannot abort sampling
- The A1111 launcher now also sets `PYTHONUTF8=1` and `PYTHONIOENCODING=utf-8` so ComfyUI and child Python processes inherit UTF-8 mode from process start
- The launcher stack was restarted through `POST /restart/sd` and `GET /wait/comfyui?timeout=600` confirmed ComfyUI is reachable again; final status shows `sd.api_ready=true` and `comfyui.api_ready=true`
- `comfyui-manager` is now installed into the dedicated ComfyUI venv and `--enable-manager` is saved in `comfyui_additional_args`; the startup log shows `ComfyUI-Manager` loading successfully
- The SillyTavern scene render button now submits a queued `/render/from-excerpt/submit` job and polls `/render/status/{job_id}` instead of waiting on the slow inline extract call; the extension also uses a 30s fetch timeout guard
- CT201 Caddy now also includes a public `sd-orchestrator.gamedesign.152.53.117.246.sslip.io` reverse proxy to CT210:8766 so SillyTavern's `SD Generate` button can bypass the broken n8n webhook and hit the image generator directly; the browser timeout was increased to 180s and the default SD request was trimmed to 512x512 at 8 steps
- The SillyTavern extension now auto-migrates stale n8n `sd-agent` URLs to the SD orchestrator and falls back from queued scene submit to the older direct render endpoint on HTTP 422
- `vps-architecture/sillytavern-image-action/` now provides a browser extension that posts the latest RP excerpt to the public scene-worker host and displays returned image artifacts
- `vps-architecture/sillytavern-image-action/` now also includes an `SD Generate` button that posts the latest excerpt to the public SD orchestrator and renders the returned image payload
- The image-action prompt path now forwards active cast, `nsfw_level`, `continuity_notes`, and `lorebook_context` so generated images stay aligned with the current scene
- CT215 is now reserved as the small SillyTavern LXC (`10.10.10.63`, `:8000`)
- `vps-architecture/provisioning/provision-sillytavern-lxc.sh` now provisions the SillyTavern container with Node 22 and a systemd service
- CT215 is now live and the browser extension is installed under `public/scripts/extensions/third-party/scene-image-action/`
- The extension now auto-generates a Gameron RP pack from the current scene and lorebook context, persists it in chat metadata / preset extension data, and injects it into generation prompts so the user does not need to hand-fill the frontend
- New `#/workbench` page added to the React app: model selector, crop selection, cutout/mask editor, grid mode, checkpoint history, and approval/merge buttons
- Workbench can load the live checkpoint and LoRA inventory from the orchestrator, or fall back to the local three-model inventory if the API is unavailable
- Workbench now mirrors progress updates to a configurable webhook so Telegram workflows can report repeated status without blocking the main job
- CT212 `Private Videos`, `Uploads`, and `Animated` libraries now have actual source paths set; `/mnt/media/private` root perms were corrected so `jellyfin` can traverse the tree
- `Animated` refresh is currently active after the path fix; the library now points at `/mnt/media/private/Bilder/Porn/Animated`
- `vps-architecture/provisioning/provision-sillytavern-lxc.sh` now seeds CT215 with `main_api=openai`, `chat_completion_source=custom`, `custom_url=http://100.109.133.95:5000/v1`, and `custom_model=mythomax-l2-13b\\mythomax-l2-13b.Q5_K_M.gguf`; the live CT215 `settings.json` was also restored from `mars.chub.ai` to the local Mythomax backend
- The SillyTavern scene render button now uses the fast `/scene/extract` -> `/scene/plan` -> `/render/submit` -> `/render/status/{job_id}` flow to avoid browser timeout/network errors from the long blocking endpoint
- `docs/stable-diffusion-extension-guide.md` now clarifies A1111 extension access vs runtime activation and the OpenPose workflow
- `docs/vision-grid-pipeline.md` now documents the existing global + overlapping detail crop vision pass structure
- SnapshotCenter now provides a manual snapshot / restore dashboard with progress and ETA
- CreditsScene now branches on `GameState.isGachaDemon()`:
  - Good ending: "DU HAST WIDERSTANDEN — und die Lektion verstanden."
  - Bad ending:  "DU BIST GEFALLEN — und wurdest, was du bekämpfst." + Gacha-Score readout
- manifest.js cleaned: legacy `wb_bg_storm` + `wb_bg_widow` removed; all present image assets set to `loaded`
- New GameScene future assets registered in manifest (`gm_bg_training_arena`, `gm_enemy_autoplay_lady`)
- **Group chat automation fully working** (2026-06-03):
  - `group-chat-autorun.js` on CT203 now reliably selects the group via `.group_select` CSS class using `page.evaluate` direct click
  - Fresh chat per run: uses `GET /csrf-token` + `POST /api/chats/group/delete` + `POST /api/groups/edit` + full page reload — group config `chat_id` is updated each run so ST generates a new scenario
  - AI message counting (not total) prevents trigger user messages from short-circuiting `waitForNewMessage`
  - Name prefix cleanup (`cleanText()`) strips accumulated `Name: Name:` prefixes from transcript
  - `persistTranscript()` called after every round so partial results survive failures
  - `playwright-runner.service` now uses `StandardOutput=append:/var/log/pr.log` for persistent logging
  - ST model set to `mythomax-l2-13b` (roleplay), `stream_openai=false`, `always_force_name2=false`
  - Verified end-to-end: 10-round run completes in ~3 min, clean transcript, Makoto/Rachel/Noel in character
- **Mythomax sampling tuned** (2026-06-03): `temp=0.87, freq_pen=0.1, rep_pen=1.1, top_k=40, top_p=0.95, min_p=0.05` applied to CT215 `oai_settings`
- **Makoto / Rachel / Noel cards overhauled** (2026-06-03): multi-state mental model (vanilla/aroused/consumed for Makoto; composed/cracking/surrendered for Rachel; flustered/willing/overcome for Noel), NSFW escalation guidance, three-stage example messages — written back to PNG on CT215
- **blazblue_universe lorebook** now has two new constant entries (uid 42 + 43): NSFW system directive and post-mission apartment scenario seed; group `description` and `scenario` fields also set
- **Model safeguard** added to `group-chat-autorun.js`: checks Oobabooga `/v1/models` before browser launch; aborts if `mythomax` not loaded
- **Results endpoints** added to `playwright-runner.js` (CT203): `GET /results` lists all on-disk report dirs; `GET /results/:id/transcript` returns plain-text transcript; `GET /results/:id/transcript.json` and `/results/:id/report.json` also available

### Core systems in place

- `GameState.js`: `gender`, `gachaScore`, `recordChoice()`, `isGachaDemon()`, `reset()`
- `CharacterSelect.jsx`: DS3-style male/female selection, real portraits, keyboard + gamepad
- `PortalScreen.jsx`: VPS control menu with portal URLs, launchers, and service cards
- `SnapshotCenter.jsx`: maintenance dashboard for snapshots and playback
- `WorldBuildingScene.js`: compressed layout, portrait fade, storm/rain/lightning, widow encounter
- `docs/comfyui-production-playbook.md`: concrete multi-person ComfyUI node-flow and 3-second video test notes
- `docs/comfyui-multi-person-prompt.json`: ready-to-queue multi-person ComfyUI API prompt
- `docs/comfyui-multi-person-workflow.json`: loadable ComfyUI workflow export for multi-person stills
- `docs/comfyui-inpaint-workflow.json`: loadable ComfyUI workflow export for inpaint cleanup
- All ComfyUI workflow exports now default to `ponyDiffusionV6XL_v6StartWithThisOne.safetensors`, and the SD orchestrator can still select among the installed checkpoints via `preferred_model_title`
- `docs/architecture-map.svg`: presentation-style system interaction diagram
- `docs/remote-control-map.md`: remote entry points and function list
- `docs/jellyfin-shoko-anime-guide.md`: folder and metadata rules for anime in Jellyfin + Shoko
- `docs/jellyfin-shoko-anime-guide.md`: now includes click-path steps and SSL error note for Shoko
- `vps-architecture/operations/shoko-rollout.md`: end-to-end host rollout for CT213 Shoko and Shokofin
- `vps-architecture/provisioning/gd-proxy/Caddyfile`: public hostnames for Oobabooga chat/API, Shoko, and Jellyfin
- `vps-architecture/provisioning/provision-shoko-lxc.sh`: host-side LXC provisioning script for CT213 Shoko
- `vps-architecture/agents/ct213-shoko/CONTEXT.md`: container context for the new Shoko LXC
- Host `/mnt/nas-serien` now uses a single NFSv4.1 mount to the QNAP root export; CT213 sees the NFS root again after reboot
- CT213 now watches `/srv/shoko/serien-clean/Serien` for anime imports so Shoko ignores exact cache folders but keeps `@` in legitimate series names
- CT213 currently has `AniDb.AVDumpKey` unset, so `POST AVDump/DumpFiles` fails with `400` until that key is provided
- The 47 orphaned `Unrecognized` entries were removed directly from Shoko's SQLite DB while the queue was still running
- The remaining 698 `Unrecognized` records were deleted via `DELETE /api/v3/File/{id}?removeFiles=false&removeFolder=false`; `include_only=Unrecognized` now returns `Total=0`
- CT213 Shoko queue was safely paused, cleared, and resumed through `/api/v3/Queue`; the backlog dropped from `7232` blocked jobs to `4` total jobs, with only two long-running `Hash File` jobs left active (`Yu Yu Hakusho` E112 and E051)
- The Shoko API key can be minted from local auth via `/api/auth`; the queue endpoint itself requires the `apikey` header
- CT213 SQLite `AuthTokens` exposes the stored login tokens; the `TheGoodHunterXIII` token restores live access to Shoko dashboard and queue endpoints
- Live Shoko snapshot after auth recovery: `FileCount=143`, `SeriesCount=10`, `GroupCount=10`, `UnrecognizedFiles=84`, `WaitingCount=727`, `BlockedCount=7212`, `TotalCount=7943`, `ThreadCount=4`
- The current active queue jobs are `Bleach` hashing `S15E20` and `S16E21`, plus two `Gintama` preprocessing jobs
- Five-minute queue observation stayed consistent: `WaitingCount=588 -> 573`, `BlockedCount=7348 -> 7361`, `TotalCount=7940 -> 7938`; the 4 threads kept cycling jobs and the total backlog fell by 2
- Latest live Shoko re-check after `shokoserver` restart plus another five minutes: `FileCount=143`, `SeriesCount=10`, `GroupCount=10`, `UnrecognizedFiles=710`, `MissingEpisodes=339`, `EpisodesWithMultipleFiles=3`, `WaitingCount=0`, `BlockedCount=7216`, `TotalCount=7218`, `ThreadCount=4`
- Current active queue jobs are `Yu Yu Hakusho` hashing `E068` and `E065`
- The restart did not break the queue; it resumed hashing, but the last five-minute window stayed flat on `Blocked` and `Total`
- `findmnt` shows `/mnt/nas-serien` is a CIFS mount to the QNAP share `//100.122.166.11/Serien`; the hashing bottleneck is storage/network I/O, not Shoko CPU
- Best mitigations are local SSD staging for active imports or lower hash concurrency, since ED2K hashing still needs a full file read
- CT213 now has AVDump3 unpacked under `/opt/avdump3` with a `/usr/local/bin/avdump3` wrapper that uses `DOTNET_ROLL_FORWARD=Major`
- `AniDb.AVDumpKey` is now populated in live Shoko settings so AVDump flows can authenticate against AniDB
- Single-file AVDump verification succeeded on `Tawawa.on.Monday.S01E02...` via Shoko's AVDump file path; `LastAVDumped` updated and `LastAVDumpVersion` became `8294`
- Queue stayed clean throughout the test: `WaitingCount=0`, `BlockedCount=0`, `TotalCount=0`
- CT212 Jellyfin now has a populated Shokofin `ApiKey` and was restarted so the plugin can actually talk to Shoko
- CT212 Jellyfin media-filter overlay now forces `/mnt/media/serien` and `/mnt/media/musik` to `0755` via a systemd drop-in so the `jellyfin` user can traverse the mount roots again
- Jellyfin startup permission errors for `/mnt/media/serien` are gone after the mount-root fix; the remaining warning is the empty `/mnt/media/musik` library
- CT212 `Serien` library was rebuilt with `EnableInternetProviders=true`, `EnableAutomaticSeriesGrouping=true`, and Shoko-enabled Series/Season/Episode metadata fetchers
- The library reset queued per-folder full refreshes for 171 top-level series folders, but `IncludeItemTypes=Series` is still empty so the remaining blocker is grouping/matching, not stale library cache
- Laptop Launcher Daemon now starts the local A1111 instance via `D:\Tools\StableDiffusion\webui\webui.bat` with `--enable-insecure-extension-access`, and the launch script now sets `git config --global --add safe.directory "*"` so extension updates can run under the SYSTEM service context
- The local SD model set currently includes `albedobaseXL_v13`, `ponyDiffusionV6XL_v6StartWithThisOne`, and `Juggernaut-XL_v9_RunDiffusionPhoto_v2`; all LyCORIS files were removed to reclaim disk space, and the set is expected to grow with motion modules and other checkpoints
- `docs/godmode.md` is now the canonical always-on prompt for OpenCode and the reusable text for other providers
- `D:\Repositories\LLM\Oobabooga\text-generation-webui\user_data\characters\Code Pilot.yaml` now provides a concise code-first Oobabooga character card for the laptop instance
- Best installed coding model in the current Oobabooga model set: `qwen2.5-coder-14b-instruct-q4_k_m.gguf`
- CT210 now also has `/opt/gamedesign` checked out from `CryseXIII/gamedesign-presentation` for orchestrator-side repo access
- CT210 now also auto-syncs `/opt/gamedesign` every 5 minutes via `gamedesign-git-watcher.timer`
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

- VPS: `152.53.117.246`, Proxmox VE 9.1.9, Kernel 7.0.0-3-pve
- Tailscale IP (host): `100.118.216.77`
- Proxmox GUI `:8006` restricted to Tailscale IPs via nftables `proxmox-access` table (allowlist: `100.64.0.0/10`, `10.10.10.0/24`, `127.0.0.0/8`)
- Public traffic: host nginx (L4 TCP stream) → CT201 Caddy → target containers
- DNAT via nftables `pve_nat`: `80/443 → CT201`, Tailscale-only: `8080→CT210`, `5678→CT211`, `8766→CT210`, `8096→CT212`
- Public URL: `https://gamedesign.152.53.117.246.sslip.io`
- Deploy: git-watcher timers on CT202 (dev) and CT205 (prod), 5-minute pull/build/restart
- All containers on last boot: Fri 2026-05-29, all healthy

### Container map (full)

| CT ID | Name         | IP           | Role                                        | Key Services |
|-------|--------------|--------------|---------------------------------------------|-------------|
| 201   | gd-proxy     | 10.10.10.10  | Caddy reverse proxy                         | Caddy :80/:443 |
| 202   | gd-dev       | 10.10.10.21  | Dev server + opencode-runner                | Vite dev :3000 |
| 203   | gd-test      | 10.10.10.22  | Test/CI + opencode-runner                   | Playwright :8768 |
| 204   | gd-build     | 10.10.10.23  | Build pipeline + opencode-runner            | — |
| 205   | gd-prod      | 10.10.10.24  | Production + opencode-runner                | Vite preview :4173 |
| 210   | ai-chat      | 10.10.10.40  | Open WebUI + SD Orchestrator                | :8080 / :8766 |
| 211   | n8n          | 10.10.10.50  | n8n workflow automation + Telegram bot      | :5678 |
| 212   | jellyfin     | 10.10.10.60  | Jellyfin media server                       | :8096 |
| 213   | shoko        | 10.10.10.61  | Shoko anime metadata server                 | :8111 |
| 214   | scene-worker | 10.10.10.62  | RP→image FastAPI pipeline (hostname ugly)   | :8770 |
| 215   | sillytavern  | 10.10.10.63  | SillyTavern + scene-image-action extension  | :8000 |

### Caddy routes (CT201 /etc/caddy/Caddyfile)

| Subdomain | Target | Auth |
|-----------|--------|------|
| `gamedesign.*` | CT205:4173 | — |
| `ooba.*` | laptop:1338 | — |
| `ooba-api.*` | laptop:5000 | — |
| `shoko.*` | CT213:8111 | — |
| `jellyfin.*` | CT212:8096 | — |
| `scene-worker.*` | CT214:8770 | — |
| `sillytavern.*` | CT215:8000 | — |
| `a1111.*` | laptop:7860 | — |
| `comfyui.*` | laptop:8189 | — |
| `sd-agent.*` | CT211:5678 | basic_auth (user: sdagent, pass: sdagent2026) |
| `bot.*` | CT211:5678 | — (Telegram webhook needs no auth) |

All subdomains under `152.53.117.246.sslip.io`.

### AI/ML services (laptop, Tailscale 100.109.133.95)

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| Oobabooga UI | :1338 | ✅ running | — |
| Oobabooga API | :5000 | ✅ running | Models: dolphin-12b, llama-3.1-8b, mythomax-13b, qwen2.5-14b-coder, qwen2.5-vl-7b, gemma-3-12b, internvl3-8b, minicpm-v |
| A1111 | :7860 | ✅ running (idle) | Checkpoint: ponyDiffusionV6XL |
| ComfyUI | :8189 | ✅ running via `sd-webui-comfyui` | A1111 extension, not a separate standalone install |
| Launcher Daemon | :8765 | ✅ running | Starts/stops SD via SD Orchestrator |

### CT210 service config

- Open WebUI: `OPENAI_API_BASE_URLS=http://100.109.133.95:5000/v1` (Oobabooga), `COMFYUI_BASE_URL=http://100.109.133.95:8189`
- SD Orchestrator: `launcher_url=http://100.109.133.95:8765`, `a1111_url=http://100.109.133.95:7860`
- Open WebUI only accessible via Tailscale DNAT (:8080) — intentionally not in Caddy (no public access)

### CT211 n8n Telegram bot

- Token configured in `/etc/n8n/env`
- `WEBHOOK_URL=https://bot.152.53.117.246.sslip.io/`
- Caddy entry `bot.152.53.117.246.sslip.io → CT211:5678` active as of 2026-06-03
- Telegram workflows must be configured in n8n UI to receive/send messages
- Long-running jobs should be able to report progress repeatedly without blocking the main process: percent, ETA, KB/s, `X/Y`, queue depth, and explicit wait reasons like `waiting on process XYZ`

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
7. Decide whether to remove the unused n8n `sd-agent` workflow; `SD Generate` now points at the public SD orchestrator and stale URLs auto-migrate
8. Test A1111 extension updates from the UI now that the launcher forces insecure extension access and trusts the repo tree for SYSTEM
9. Watch the active Shoko import queue drain; if it stalls, restart `shokoserver` rather than clearing Jellyfin/Shokofin again
10. Decide whether the empty `/mnt/media/musik` library should stay configured in Jellyfin or be removed to avoid the recurring empty-folder warning
11. If Jellyfin still does not materialize `Series` items, inspect folder naming/grouping instead of resetting Shokofin again
12. Configure n8n Telegram workflows in n8n UI to actually receive/process messages (webhook endpoint now reachable)
13. CT214 hostname still `v2202605355759456797` — decide whether to rename to `scene-worker`
14. Build Telegram → n8n → Open WebUI/Oobabooga/SillyTavern pipeline for mobile AI interaction
15. Verify the Jellyfin `Animated` library finishes scanning and actually shows nested content
16. Verify the new `/start/comfyui` and `/wait/comfyui` launcher routes against the A1111 extension
17. ComfyUI routes are live again in the daemon’s `/openapi.json`
18. Investigate why ComfyUI stalls after `Starting server` even though the safe-directory fix is in place
19. Inspect `sd-webui-comfyui/scripts/comfyui.py` and the xformers attention path if ComfyUI still does not bind on `8189`
20. Verify the CivitAI active-download reconnect flow in a real browser refresh while a job is running
21. Design a non-blocking progress-notification path for image jobs, with Telegram updates that can repeat until approval or completion
22. Watch the `SD Generate` browser flow for latency regressions now that CORS is fixed at the edge
23. Verify the new Image Workbench editor, minimap, checkpoint import/export, and grid tab in a live browser session
24. Confirm the live workbench in a browser later, once interaction testing is wanted again
25. Watch `POST /inpaint` latency if the live banana-edit workflow stays slow under larger images
26. Verify the new wide intro backdrop, speedup succubus, and time-barrier flow in a live browser session
27. Decide whether the remaining non-exception PNGs should get a real lossless optimizer pass instead of a plain resave
