# Shoko unrecognized cleanup

## Context
- Shoko still reported 698 `Unrecognized` file records after the earlier queue reset and AVDump verification work.
- A direct `DELETE /api/v3/File/401` test showed the endpoint exists, but it defaults to deleting the physical file and fails on permission-denied paths.

## Decision
- Use `DELETE /api/v3/File/{id}?removeFiles=false&removeFolder=false` for every unrecognized record.
- Fetch IDs in 100-item pages first, then delete from the saved list.

## Rationale
- This removes stale Shoko DB records without touching the media files on disk.
- Paging first avoids offset-skip issues while deleting.

## Challenges
- `pageSize=1000` hung on the API, so the cleanup had to be done in 100-item pages.
- PowerShell quoting around remote shell commands was fragile, so the fetch/delete flow had to avoid shell variables where possible.

## Implementation Notes
- Fetched seven pages of unrecognized IDs into `/tmp/unrec.ids` on CT213.
- Deleted all 698 records with `removeFiles=false&removeFolder=false`.
- Verified `GET /api/v3/File?include_only=Unrecognized&pageSize=1&page=1` now returns `Total=0` and an empty list.
- After cleanup, Shoko started queueing fresh import work again for `/srv/shoko/serien-clean/Serien`.

## Follow-up
- Let the current import queue drain.
- Recheck whether Jellyfin materializes `Series` items once Shoko settles.
- If needed, inspect folder naming/grouping next instead of resetting Shokofin again.
