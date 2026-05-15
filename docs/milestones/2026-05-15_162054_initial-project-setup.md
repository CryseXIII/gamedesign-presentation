# Initial Project Setup

Timestamp: 2026-05-15 16:20:54 +02:00

## Context

The project needed a durable workspace structure that supports both the game design presentation and the VPS / Proxmox build-out. The user also wanted persistent instructions for future chats and milestone-based documentation.

## Decision

- Split the workspace into `docs/`, `game-design-presentation/`, and `vps-architecture/`.
- Add persistent project instructions in `AGENTS.md`.
- Configure OpenCode to auto-load `AGENTS.md` and `docs/project-memory.md` via `opencode.json`.
- Start the VPS security work with a documented audit-and-harden approach instead of making blind changes first.

## Rationale

- The project has two tightly linked tracks: presentation work and secure hosting architecture.
- Persistent instructions reduce context loss across future chats.
- Timestamped milestone logs create an audit trail of decisions, tradeoffs, and blockers.
- Security should be approached methodically: observe first, then harden, then expose services.

## Challenges

- The workspace started empty, so structure and process had to be created from scratch.
- No direct server output was available in the current session, so the first security pass needed to be documented as a runbook rather than executed live.
- The instruction mechanism had to be set up in a way that future OpenCode sessions can automatically re-load it.

## Implementation Notes

- Added root project docs: `README.md`, `AGENTS.md`, and `opencode.json`.
- Added durable memory: `docs/project-memory.md`.
- Added milestone process support: `docs/milestones/` and `docs/templates/milestone-template.md`.
- Added presentation and VPS structure placeholders for future work.

## Follow-up

- Review Proxmox auth logs and SSH auth logs on the server.
- Configure fail2ban for Proxmox and SSH with a 10-attempt / 1-hour ban policy.
- Decide how tightly Proxmox web access should be restricted before hosting public content.
- Continue refining the presentation structure and asset plan.
