# Jellyfin + Shoko Anime Guide

## Goal

Watch anime in Jellyfin and let Shoko handle the metadata matching.

Shoko is intended to run in CT213 at `10.10.10.61`, with the public hostname `https://shoko.gamedesign.152.53.117.246.sslip.io/` pointing at it once the container is live.

## Recommended Folder Layout

Keep one series in one top-level folder.

Example:

```text
/mnt/media/serien/
  /Attack on Titan/
    /Season 01/
      Attack on Titan - S01E01 - To You, 2000 Years in the Future.mkv
      Attack on Titan - S01E02 - That Day.mkv
  /Fullmetal Alchemist Brotherhood/
    /Season 01/
      Fullmetal Alchemist Brotherhood - S01E01 - Fullmetal Alchemist.mkv
```

## Naming Rules

1. One show per folder.
2. Optional season subfolders, but keep them consistent.
3. Use `Show Name - S01E01 - Episode Title.ext` for files.
4. Avoid putting multiple series into one folder.
5. Avoid random mixed dumps if you want clean metadata matching.

## Jellyfin Setup

1. Create or keep the library as `TV Shows`.
2. Point the library at the anime root folder.
3. Keep the library read-only from Jellyfin's point of view.
4. Disable writeback exports if the source tree is managed elsewhere.

## Shoko Setup

1. Open the Shoko web UI at `https://shoko.gamedesign.152.53.117.246.sslip.io/`.
2. Go to the folder/file management area.
3. Add your NAS anime root folder, for example `/mnt/nas-serien` or the equivalent mounted path.
4. Start a full scan/import.
5. Open the unrecognized or unmatched files view if anything does not auto-match.
6. Select the series, then run the auto-match / match action.
7. Keep the matched series in Shoko so it can sync metadata to Jellyfin.
8. Expose the Shoko UI on `https://shoko.gamedesign.152.53.117.246.sslip.io/` once the service is live.

## What To Click In Practice

For your `Serien -> Attack on Titan -> Episode 1 - 60` tree:

1. Click `Files` or `File Management` in Shoko.
2. Add the `Serien` root folder.
3. Run `Scan` or `Import`.
4. Open `Unrecognized` if `Attack on Titan` does not appear yet.
5. Select the files for `Attack on Titan`.
6. Click `Auto Match` or `Match to Series`.
7. Confirm the AniDB series entry.
8. Save and let Shoko sync the metadata.

If the series is already matched by hash, you only need the scan step.

## Why This Structure Matters

- Jellyfin indexes one clean series tree instead of a flat episode dump.
- Shoko can match anime episodes more reliably when folder names are stable.
- Each series gets its own page, poster, seasons, and episode list.

## If You Already Have Messy Files

1. Group files by series first.
2. Rename the folders before importing.
3. Then rescan Jellyfin and resync Shoko.

## About The SSL Error

`SSL_ERROR_INTERNAL_ERROR_ALERT` on `shoko.gamedesign.152.53.117.246.sslip.io` means the public TLS route is not healthy yet.
Use Jellyfin now, and only use the Shoko hostname after the service and proxy are both live.
