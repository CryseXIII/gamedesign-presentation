# Milestone: Shokofin Library Reset

## Context
The Jellyfin `Serien` library was only showing folder entries, not stable series metadata, and `ProviderIds` stayed empty after the earlier refreshes.

## Decision
Recreate the `Serien` virtual library with Shoko metadata fetchers enabled, `EnableInternetProviders=true`, and `EnableAutomaticSeriesGrouping=true`, then queue full refreshes for the top-level series folders.

## Rationale
Shokofin needs Jellyfin's series library metadata pipeline active to populate provider IDs and series pages. Rebuilding the library was the cleanest way to reset stale metadata state without touching the media files.

## Challenges
- The first API update attempt created a duplicate `Serien2` library, which had to be removed.
- Even after the reset, Jellyfin still did not materialize `Series` items immediately, so the remaining blocker may be folder naming/grouping rather than cached metadata.
- The library refresh is asynchronous, so verification had to be repeated after the queue started.

## Implementation Notes
- Deleted the duplicate `Serien2` entry.
- Recreated `Serien` with `EnableInternetProviders=true`.
- Enabled Shoko metadata fetchers for `Series`, `Season`, and `Episode`.
- Turned on `EnableAutomaticSeriesGrouping=true`.
- Queued full refreshes for 171 top-level `/mnt/media/serien/*` folders.

## Follow-Up
- If Jellyfin still shows only folder items, inspect the naming/grouping rules for the series folders.
- Do not keep re-resetting Shokofin if the remaining problem is the library layout itself.
