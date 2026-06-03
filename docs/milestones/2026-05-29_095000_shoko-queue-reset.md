# Milestone: Shoko Queue Reset

## Context
CT213 Shoko had a huge blocked import backlog and two `Hash File` jobs that looked stale from the queue UI.

## Decision
Use the Shoko API to inspect the queue, then pause and clear the queue before resuming it.

## Rationale
The service was still alive, but the blocked queue count was preventing useful progress. A queue reset is safer than restarting Jellyfin or Shokofin, and it keeps the metadata sidecar isolated.

## Challenges
- The queue endpoint required a valid `apikey` header.
- The on-disk SQLite path under `/opt/shoko/config` was empty; the real database lived under `/var/lib/shoko/.shoko/Shoko.CLI/SQLite/JMMServer.db3`.
- One running hash job had already updated its DB record while the queue UI still showed an old start time.

## Implementation Notes
- Minted a Shoko API key from local auth.
- Queried `/api/v3/Queue` and `/api/v3/Queue/Items`.
- Paused the queue, cleared it, then resumed it.
- Queue state dropped from `7232` blocked jobs to `4` total jobs.
- Remaining active jobs are the two long-running Yu Yu Hakusho hash jobs for E112 and E051.

## Follow-Up
- Watch whether the two remaining hash jobs complete.
- If they stay stale, restart `shokoserver` only.
- Keep `AniDB_AVDumpKey` unset unless AV dump submission is actually needed.
