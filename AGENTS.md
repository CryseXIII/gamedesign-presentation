# Project Instructions

## Scope

This repo (`game-design-presentation`) is the primary workspace. It covers two connected workstreams:

- `src/` — the interactive browser-based 2D game presentation (React + Phaser).
- `docs/` — durable memory, milestone logs, decision rationale, and templates.
- The VPS / Proxmox infrastructure (netcup, Proxmox VE 9.1) supports online hosting of this presentation.

## Working Rules

- Treat the presentation and VPS as one project. Architecture decisions should support secure online publishing of presentation material.
- After each significant milestone, create a new timestamped file under `docs/milestones/`.
- Use the filename format `YYYY-MM-DD_HHMMSS_short-title.md`.
- Each milestone log must include: context, decision, rationale, challenges, implementation notes, and follow-up items.
- Update `docs/project-memory.md` whenever goals, assumptions, architecture, or next steps materially change.
- Prefer security-first VPS changes. Reduce public attack surface before adding services.
- Prefer prepared media over risky live demos for the presentation unless a live demo has a clear advantage and a fallback plan.
- Do not rewrite or delete old milestone logs. Add new logs instead.

## Snapshots

**Only create Proxmox snapshots when the user explicitly says "mach einen snapshot" or similar explicit instruction.**
Do not snapshot automatically during deploys, upgrades, or any other automated process.
Command when needed: `pct snapshot <id> <name>` or `qm snapshot <id> <name>`.

## Documentation Expectations

- Keep decisions explicit.
- Record why a path was chosen, not only what changed.
- Capture blockers and open questions so future chats can continue without reconstruction.

## Current Focus

- Build the presentation around a Dark Souls tutorial walkthrough, preferably recorded.
- Harden the Proxmox host before exposing any new service to the internet.

## Coding Instructions — Context7

Whenever working with external libraries, frameworks, SDKs, CLI tools, build tools, APIs, or package configuration, use Context7 first before writing code or commands.

This especially applies to:
- React
- Vite
- Tailwind CSS
- Framer Motion
- shadcn/ui
- TypeScript
- Node.js
- deployment tooling
- package manager commands

Do not rely only on training data for library syntax, configuration, setup steps, or breaking changes. First check Context7, then implement.

## Version Standards

All new projects and containers must use these minimum versions unless a specific reason requires otherwise:

- **Node.js**: v22.22.0+ (LTS) — currently v22.22.2
- **npm**: latest bundled with Node 22
- **React**: 19.x (latest stable)
- **Vite**: 8.x (latest stable)
- **Python**: 3.12+ with `venv` for isolation
- **Git**: system package (latest available in distro repo)

When setting up a new environment, install Node via NodeSource `setup_22.x` script.

## Agent Architecture — Per-Container Subagents

The main OpenCode instance (running locally or on the Proxmox host) acts as the orchestrator.
Each LXC container can function as a subagent target via SSH.

**Communication model:**
- Main instance SSHes into containers and executes tasks on demand (token-efficient: no persistent AI process)
- Each container with a git repo runs a `git-watcher` systemd timer that auto-pulls and restarts on new commits
- Telegram bot (future): routes mobile messages to the main OpenCode instance, which dispatches to containers

**Container map:**

| CT ID | Name     | IP           | Role                        |
|-------|----------|--------------|-----------------------------|
| 201   | gd-proxy | 10.10.10.10  | Caddy reverse proxy (public)|
| 202   | gd-dev   | 10.10.10.21  | Development / hot reload    |
| 203   | gd-test  | 10.10.10.22  | Testing / CI                |
| 204   | gd-build | 10.10.10.23  | Production build            |
| 205   | gd-prod  | 10.10.10.24  | Production (served to web)  |

**Git watcher rule:** If a container hosts an app with a git remote, it must run a systemd timer
that checks for new commits every 5 minutes. On update: pull → build → restart service.

## GitHub

Every project gets its own GitHub repository under the `CryseXIII` account.
- Repo created at project start, before first commit
- `main` branch is protected (no force push)
- Each container that clones a repo must set the GitHub remote as the canonical source

## Context Sync — Multi-Device OpenCode Sessions

OpenCode instances run on multiple devices (laptop, VPS, tablet). Context is shared via git:

**Session start (every device):**
1. Run `git pull` to fetch updates from other sessions
2. Read `docs/project-memory.md`
3. Read the 3 most recent files from `docs/milestones/` (sorted by name descending)
4. Read `docs/archive/` summaries if referenced by project-memory

**After edits (VPS instances only):**
1. `git add -A && git commit -m "docs: auto-sync $(date -u +%Y-%m-%d_%H%M%S)"`
2. `git push`

**Laptop instances:** Only pull (no auto-push). Commit manually when ready.

**Milestone aging:**
- Milestones older than 14 days are candidates for compression
- A summarization script (`scripts/summarize-memory.sh`) consolidates old milestones into `docs/archive/YYYY-MM_summary.md`
- Compressed milestones get a header in the archive file and are deleted from `docs/milestones/`
- `docs/project-memory.md` is updated to reference the archive

## Future Integrations (planned, not yet implemented)

- **Telegram bot** on Proxmox host: receives messages → forwards to main OpenCode → dispatches to containers
- **StableDiffusion / ComfyUI** on local laptop (GPU): invoked by the main AI instance for image generation tasks, running in unrestricted local mode
