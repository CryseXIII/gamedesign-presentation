# CivitAI Timeout Hardening

**Date:** 2026-06-05

## Context

The CivitAI Browser+ preview and download paths still had blocking remote calls without explicit timeouts. That made the UI more likely to stall or feel stuck when the browser session disconnected or CivitAI was slow.

## Decision

1. Add explicit request timeouts to the remaining preview and download HTTP calls.
2. Log preview fetch failures instead of silently swallowing them.
3. Keep the change minimal and local to the extension.

## Rationale

- The existing API helper already had timeouts, but other paths still did not.
- A fail-fast request is better than a frozen browser action.
- Logging the failure makes the next diagnosis cheaper.

## Challenges

- The extension has a lot of queue/state logic, so the smallest safe fix was preferable to a broader refactor.
- Some failure paths intentionally swallow exceptions, which makes behavior harder to observe.

## Implementation Notes

- Added a `(60, 30)` timeout to preview image fetches in `civitai_api.py`.
- Added a `(60, 30)` timeout to the initial download-link lookup in `civitai_download.py`.
- Added `timeout=10` to aria2 JSON-RPC calls in `civitai_download.py`.
- Added a `(60, 30)` timeout to preview image saving in `civitai_file_manage.py`.
- Verified the touched files with `python -m py_compile`.

## Follow-up

1. Watch for any remaining no-timeout network calls in the extension.
2. If the browser still loses visible queue state on refresh, consider a small persistence layer for the queue UI only.
