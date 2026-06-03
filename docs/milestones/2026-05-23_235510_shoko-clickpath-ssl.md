# Milestone: Shoko Click Path And SSL Error

**Date**: 2026-05-23 23:55 UTC

---

## Context

The user hit an `SSL_ERROR_INTERNAL_ERROR_ALERT` on the Shoko hostname and still needed a concrete click path for configuring Shoko so it can match anime folders and feed Jellyfin metadata.

---

## Decision

1. Expand the Shoko guide with actual UI steps.
2. Document the SSL error as a sign that the public Shoko route is not healthy yet.
3. Keep the anime example centered on the existing `Serien -> Attack on Titan` NAS tree.

---

## Rationale

- The user needs actionable clicks, not only architectural wording.
- The error is consistent with a public route that is not fully live yet.
- The existing NAS tree should be used as the example path to reduce guesswork.

---

## Challenges

- Shoko's folder and match UI labels can vary slightly by build.
- The public hostname only works once the backend and proxy are both healthy.

---

## Implementation Notes

- Updated `docs/jellyfin-shoko-anime-guide.md` with click-path steps, match flow, and SSL note.
- Updated `docs/project-memory.md` to reflect the new guidance.

---

## Follow-up Items

1. If the Shoko host is deployed later, verify the TLS route and then test the guide against the live UI.
2. If the UI labels differ, map them to the same sequence: add folder, scan, unrecognized, auto-match, sync.
