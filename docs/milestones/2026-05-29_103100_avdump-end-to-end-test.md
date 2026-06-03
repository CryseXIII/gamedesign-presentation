# Milestone: AVDump End-to-End Test

## Context
After setting `AniDb.AVDumpKey` and installing AVDump3 on CT213, the user wanted a safe verification path that would not lock up the queue again.

## Decision
Run a single-file AVDump through Shoko's file controller using `immediate=true`, then confirm the file record updated and the queue stayed empty.

## Rationale
This verifies the live Shoko integration, AniDB UDP key, and AVDump3 runtime without triggering a bulk import or queue backlog.

## Challenges
- The AVDump route was not exposed in swagger, so the path had to be recovered from the compiled assembly strings.
- The client-side HTTP request timed out while the server session was still running.

## Implementation Notes
- Used `Tawawa.on.Monday.S01E02...` as the test file (`VideoLocalID=472`).
- Hit Shoko's file AVDump path directly with `immediate=true`.
- Confirmed `AVDumpHelper` started session `id 1`.
- Verified `LastAVDumped` and `LastAVDumpVersion` updated to `8294`.
- Confirmed the queue remained empty before and after the run.
- Verified Jellyfin stayed `active` and Shokofin config still points at Shoko.

## Follow-Up
- Use the same route sparingly for further spot checks.
- Keep bulk AVDump or import jobs out of the queue unless you intentionally want to process the library.
