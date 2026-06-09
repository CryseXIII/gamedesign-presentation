# Jellyfin PrivateViktor Libraries + CIFS nosharesock Fix

**Date:** 2026-06-04

## Context

CT212 Jellyfin had an existing Serien library backed by per-series CIFS bind mounts via `jellyfin-media-filter.sh`. The NAS `PrivateViktor` share needed to be added as 3 new libraries (Videos/Porn, Videos/Uploads, Bilder/Porn/Animated). A restricted guest user for Serien-only access was also requested.

## Decisions

1. **`nosharesock` added to all CIFS fstab entries.** Kernel CIFS reuses sessions by default; after a lazy umount the stale session caused all new mount attempts to hang in D-state. `nosharesock` forces a fresh TCP connection per mount, eliminating this failure mode.

2. **`build_view_shallow` for all three shares (Serien, Musik, Private).** The original `build_view` does a full recursive `find` to filter nested QNAP dirs. Over CIFS with 200+ series this took several minutes, blocking the systemd `Type=oneshot` service. Switching to the new shallow variant (top-level filtering only) brings service startup from minutes to seconds. Jellyfin ignores `@eaDir` directories inside series folders natively.

3. **Musik (PrivateViktor) skipped.** `/mnt/media/private/Musik/` contains only `@Recently-Snapshot`. No library created.

4. **`homevideos` collection type for all private libraries.** Avoids internet metadata lookups (TMDB etc.) for personal/adult content. Jellyfin treats the folders as plain file stores.

## Implementation Notes

- Proxmox host `/etc/fstab`: all three CIFS entries (Serien, Musik, Download) updated to `soft,nofail,nosharesock,_netdev`; PrivateViktor entry added.
- CT212 LXC config: `mp4: /mnt/nas-private,mp=/mnt/media/private,ro=1` added via `pct set`.
- `jellyfin-media-filter.sh` rewritten: `build_view_shallow` function added; all three `build_view` calls replaced with shallow variant.
- `jellyfin-media-filter.service` `RequiresMountsFor` updated to include `/mnt/media/private`.
- Service enabled and running; `jellyfin-media-filter` and `jellyfin` both active.
- Libraries created: **Private Videos** (`/mnt/media/private/Videos/Porn`), **Uploads** (`/mnt/media/private/Videos/Uploads`), **Animated** (`/mnt/media/private/Bilder/Porn/Animated`).
- Guest user **guest** (password: `guest123`) created with `EnableAllFolders: false`, `EnabledFolders: [Serien ID]`.

## Challenges

- `pct restart` does not exist; use `pct shutdown && pct start`.
- CT212 processes went into D-state when CIFS mounts became stale after `umount -l`. Recovery: kill D-state `mount.cifs` processes (possible because they were TASK_KILLABLE), then remount with `nosharesock`.
- Proxmox `pct stop` itself hung because its staged-mount teardown process (`/var/lib/lxc/.pve-staged-mounts/mp1`) was in D-state waiting on the stale Musik CIFS. After fresh Musik remount, the staged-mount umount unblocked and CT212 stopped cleanly.
- `build_view_shallow` needed because PowerShell mangles `@` in heredocs; script was written via local `Write` tool and `scp`+`pct push`.

## Follow-up

- Trigger a Jellyfin library scan for the 3 new private libraries.
- Confirm content appears in Jellyfin UI for the admin account.
- Confirm guest user can only see Serien.
- Consider adding `@Recently-Snapshot` filtering inside Musik subdir (currently visible but harmless).
