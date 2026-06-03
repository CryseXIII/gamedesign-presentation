# Milestone: Jellyfin Media Root Fix

## Context
Jellyfin kept logging `UnauthorizedAccessException` for `/mnt/media/serien` and could not traverse the media root, even though the underlying series mounts existed.

## Decision
Add a systemd drop-in for `jellyfin-media-filter.service` that forces `/mnt/media/serien` and `/mnt/media/musik` to `0755` after the overlay is rebuilt, then restart Jellyfin and re-run the library refresh.

## Rationale
The filter service was recreating the mount root with the default `0700` temp-directory mode. That blocked the `jellyfin` user from listing the series root, which stopped scanning before Shoko-backed items could be indexed.

## Challenges
- The live mount view and the Jellyfin service namespace had to be checked separately.
- The series root was visible to `root` but not to `jellyfin` until the overlay permissions were corrected.
- The music library remains empty, so Jellyfin still logs one empty-folder warning there.

## Implementation Notes
- Restarted `jellyfin-media-filter.service` to rebuild the mount tree.
- Added `/etc/systemd/system/jellyfin-media-filter.service.d/override.conf` with `ExecStartPost=/bin/chmod 755 /mnt/media/serien /mnt/media/musik`.
- Restarted Jellyfin after the filter service settled.
- Verified `runuser -u jellyfin -- stat` now reports `755` on both media roots.
- Confirmed the `Serien` path no longer emits permission errors during Jellyfin startup.

## Follow-Up
- Decide whether the empty `/mnt/media/musik` library should stay configured or be removed.
- If Jellyfin still appears empty after a longer scan, inspect the library mapping rather than the filesystem permissions.
