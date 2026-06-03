# Project Memory

Last updated: 2026-06-03 10:40 UTC (Full VPS audit + security hardening round)

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
- Public portal is still serving the older bundle until the source change is pushed and rebuilt; live bundle still shows the old internal Oobabooga card
- `vps-architecture/sillytavern-image-action/` now provides a browser extension that posts the latest RP excerpt to the public scene-worker host and displays returned image artifacts
- `vps-architecture/sillytavern-image-action/` now also includes an `SD Generate` button that posts the latest excerpt to the n8n `sd-agent` webhook and renders the returned image payload
- CT215 is now reserved as the small SillyTavern LXC (`10.10.10.63`, `:8000`)
- `vps-architecture/provisioning/provision-sillytavern-lxc.sh` now provisions the SillyTavern container with Node 22 and a systemd service
- CT215 is now live and the browser extension is installed under `public/scripts/extensions/third-party/scene-image-action/`
- The extension now auto-generates a Gameron RP pack from the setting seed, persists it in chat metadata / preset extension data, and injects it into generation prompts so the user does not need to hand-fill the frontend
- `vps-architecture/provisioning/provision-sillytavern-lxc.sh` now seeds CT215 with `main_api=openai`, `chat_completion_source=custom`, `custom_url=http://100.109.133.95:5000/v1`, and `custom_model=mythomax-l2-13b\\mythomax-l2-13b.Q5_K_M.gguf`
- The SillyTavern scene render button now uses the fast `/scene/extract` -> `/scene/plan` -> `/render/submit` -> `/render/status/{job_id}` flow to avoid browser timeout/network errors from the long blocking endpoint
- `docs/stable-diffusion-extension-guide.md` now clarifies A1111 extension access vs runtime activation and the OpenPose workflow
- `docs/vision-grid-pipeline.md` now documents the existing global + overlapping detail crop vision pass structure
- SnapshotCenter now provides a manual snapshot / restore dashboard with progress and ETA
- CreditsScene now branches on `GameState.isGachaDemon()`:
  - Good ending: "DU HAST WIDERSTANDEN — und die Lektion verstanden."
  - Bad ending:  "DU BIST GEFALLEN — und wurdest, was du bekämpfst." + Gacha-Score readout
- manifest.js cleaned: legacy `wb_bg_storm` + `wb_bg_widow` removed; all present image assets set to `loaded`
- New GameScene future assets registered in manifest (`gm_bg_training_arena`, `gm_enemy_autoplay_lady`)

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
- The local SD model set was pruned to one main checkpoint (`ponyDiffusionV6XL_v6StartWithThisOne`) plus a slim LoRA set for details/NSFW, and all LyCORIS files were removed to reclaim disk space
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
| `comfyui.*` | laptop:8188 | — |
| `sd-agent.*` | CT211:5678 | basic_auth (user: sdagent, pass: sdagent2026) |
| `bot.*` | CT211:5678 | — (Telegram webhook needs no auth) |

All subdomains under `152.53.117.246.sslip.io`.

### AI/ML services (laptop, Tailscale 100.109.133.95)

| Service | Port | Status | Notes |
|---------|------|--------|-------|
| Oobabooga UI | :1338 | ✅ running | — |
| Oobabooga API | :5000 | ✅ running | Models: dolphin-12b, llama-3.1-8b, mythomax-13b, qwen2.5-14b-coder, qwen2.5-vl-7b, gemma-3-12b, internvl3-8b, minicpm-v |
| A1111 | :7860 | ✅ running (idle) | Checkpoint: ponyDiffusionV6XL |
| ComfyUI | :8188 | ❌ offline (intentional) | Standard port, consistent with CT210 env and Caddy |
| Launcher Daemon | :8765 | ✅ running | Starts/stops SD via SD Orchestrator |

### CT210 service config

- Open WebUI: `OPENAI_API_BASE_URLS=http://100.109.133.95:5000/v1` (Oobabooga), `COMFYUI_BASE_URL=http://100.109.133.95:8188`
- SD Orchestrator: `launcher_url=http://100.109.133.95:8765`, `a1111_url=http://100.109.133.95:7860`
- Open WebUI only accessible via Tailscale DNAT (:8080) — intentionally not in Caddy (no public access)

### CT211 n8n Telegram bot

- Token configured in `/etc/n8n/env`
- `WEBHOOK_URL=https://bot.152.53.117.246.sslip.io/`
- Caddy entry `bot.152.53.117.246.sslip.io → CT211:5678` active as of 2026-06-03
- Telegram workflows must be configured in n8n UI to receive/send messages

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
7. Verify the new SillyTavern `SD Generate` button end-to-end against the live n8n webhook and tune the image/result rendering if needed
8. Test A1111 extension updates from the UI now that the launcher forces insecure extension access and trusts the repo tree for SYSTEM
9. Watch the active Shoko import queue drain; if it stalls, restart `shokoserver` rather than clearing Jellyfin/Shokofin again
10. Decide whether the empty `/mnt/media/musik` library should stay configured in Jellyfin or be removed to avoid the recurring empty-folder warning
11. If Jellyfin still does not materialize `Series` items, inspect folder naming/grouping instead of resetting Shokofin again
12. Configure n8n Telegram workflows in n8n UI to actually receive/process messages (webhook endpoint now reachable)
13. CT214 hostname still `v2202605355759456797` — decide whether to rename to `scene-worker`
14. Build Telegram → n8n → Open WebUI/Oobabooga/SillyTavern pipeline for mobile AI interaction
