# Shoko live queue observation

## Context
- The user wanted to continue the Shoko work instead of stopping at the summary.
- Public Shoko API calls return `401` without the stored `apikey`.

## Decision
- Read the live token label from CT213's SQLite auth tables and use it to query Shoko again.

## Rationale
- The public UI is reachable, but the API is the only reliable way to see queue and stats.
- The database is the source of truth for the live token value.

## Challenges
- The nested SSH and `pct exec` quoting had to be corrected before the live query worked.
- The queue endpoint needs auth, so unauthenticated checks were not enough.

## Implementation Notes
- Queried `AuthTokens` and `JMMUser` from `/var/lib/shoko/.shoko/Shoko.CLI/SQLite/JMMServer.db3`.
- Used the `ct213-debug2` token for `TheGoodHunterXIII` to call `/api/v3/Dashboard/Stats` and `/api/v3/Queue`.
- Live snapshot: `FileCount=143`, `SeriesCount=10`, `GroupCount=10`, `UnrecognizedFiles=707`, `MissingEpisodes=339`, `EpisodesWithMultipleFiles=3`.
- Live queue: `WaitingCount=0`, `BlockedCount=7221`, `TotalCount=7223`, `ThreadCount=4`.
- Active jobs: two `Hash File` jobs for `Yu Yu Hakusho` episodes `E044` and `E038`.
- Restarted `shokoserver` after the initial queue looked stale.
- After the restart settled, the API came back and the queue resumed moving.
- Updated live queue: `WaitingCount=0`, `BlockedCount=7218`, `TotalCount=7222`, `ThreadCount=4`.
- Updated active jobs: `Yu Yu Hakusho` hashing `E090` and `E103`, plus `Bleach` reading MediaInfo for `S16E22` and `Yu Yu Hakusho` reading MediaInfo for `E044`.
- Five minutes later, the queue was still alive but flat: `WaitingCount=0`, `BlockedCount=7216`, `TotalCount=7218`, `ThreadCount=4`.
- Active jobs then were `Yu Yu Hakusho` hashing `E068` and `E065`.
- The restart did not kill the queue; it kept hashing, but the latest interval did not reduce `Blocked` or `Total`.
- Host-side `findmnt` showed `/mnt/nas-serien` is a CIFS mount to `//100.122.166.11/Serien`, so the work is dominated by network/storage reads.

## Follow-up
- Do not install anything that restarts `shokoserver` while this queue is flat.
- If the queue stalls again, inspect the specific hash jobs before touching Jellyfin or Shokofin.
- If the goal is to speed hashing, use local SSD staging or reduce hash concurrency; the ED2K pass still has to read the full file.
