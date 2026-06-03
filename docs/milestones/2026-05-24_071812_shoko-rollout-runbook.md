# Milestone: Shoko Rollout Runbook

**Date**: 2026-05-24 07:18 UTC

---

## Context

The user wanted the Shoko setup completed end-to-end without back-and-forth. The public hostname was still failing because the backend container did not exist yet, so the next step was to capture the exact rollout sequence for provisioning, proxying, and Jellyfin integration.

---

## Decision

1. Add a single host-side Shoko rollout runbook.
2. Include provisioning, proxy reload, and Jellyfin plugin integration in one place.
3. Keep the anime folder example centered on the existing `Serien/Attack on Titan` NAS tree.

---

## Rationale

- The user needs one sequence to follow, not scattered notes.
- Shoko requires both a live server and a Jellyfin plugin to be useful.
- The runbook should explain the expected failures clearly, especially the TLS error seen on the public hostname.

---

## Challenges

- The Shoko host must be provisioned on the Proxmox side before the public hostname can work.
- Jellyfin metadata sync depends on the Shokofin plugin being installed and configured.

---

## Implementation Notes

- Added `vps-architecture/operations/shoko-rollout.md`.
- Updated the project memory with the rollout runbook.
- Kept the existing Shoko provisioning script and CT213 context as the backing implementation.

---

## Follow-up Items

1. Execute the rollout steps on the Proxmox host.
2. Install and configure Shokofin in Jellyfin.
3. Match `Attack on Titan` and verify metadata appears in Jellyfin.
