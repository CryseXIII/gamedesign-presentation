# Jellyfin Private Path Fix

**Date:** 2026-06-04

## Context

The new Jellyfin `Animated` library looked empty even after a manual scan. Log inspection showed two separate issues: the library had no configured source path, and the `jellyfin` user could not traverse `/mnt/media/private` because the root directory was still `0700`.

## Decision

1. Keep the new private libraries, but set their real source paths explicitly.
2. Fix `/mnt/media/private` permissions to `0755` in the Jellyfin media-filter service drop-in.
3. Trigger a fresh Jellyfin library refresh after the path fix.

## Rationale

- Jellyfin logged `The path does not exist` when trying to add `Animated`.
- `runuser -u jellyfin -- stat` confirmed the private root was not traversable.
- After the permission fix, Jellyfin accepted the path update and started the refresh.

## Challenges

- The first API attempts failed because the path was invisible to the Jellyfin service user.
- The scan had been cancelled/failed before the path was fixed, so earlier logs were noisy and misleading.

## Implementation Notes

- Updated `/etc/systemd/system/jellyfin-media-filter.service.d/override.conf` to chmod `/mnt/media/private` as well as the existing roots.
- Verified `/mnt/media/private/Bilder/Porn/Animated` is readable by `jellyfin`.
- Set Jellyfin paths for:
  - `Animated` -> `/mnt/media/private/Bilder/Porn/Animated`
  - `Private Videos` -> `/mnt/media/private/Videos/Porn`
  - `Uploads` -> `/mnt/media/private/Videos/Uploads`
- Triggered `POST /Library/Refresh`.
- `Animated` refresh is now active.

## Follow-up

1. Wait for the `Animated` scan to complete and confirm items appear.
2. If the library stays empty, check whether Jellyfin recognizes the media extensions or whether the files are nested deeper than expected.
