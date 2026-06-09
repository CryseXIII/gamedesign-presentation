# SillyTavern Scene Context Sync

**Date:** 2026-06-05

## Context

The SillyTavern image-action pipeline was extended beyond a single excerpt. The current scene now needs active cast, NSFW level, continuity notes, and lorebook context to keep generated images aligned with the chat state.

## Decision

1. Record the prompt-payload expansion in project memory.
2. Treat the image-action path as current-session aware, not Makoto-only.

## Rationale

- Scene images drift when they only see the latest line of dialogue.
- Explicit context fields make multi-character scenes and continuity constraints easier to preserve.

## Challenges

- The live browser flow is still the final verification point, so the change is documented before end-to-end confirmation here.

## Implementation Notes

- Updated `docs/project-memory.md` with the new image-action payload fields.
- Kept the existing ComfyUI/Jellyfin notes intact.
- The sibling `vps-architecture/sillytavern-image-action/index.js` already forwards `participants`, `nsfw_level`, `continuity_notes`, and `lorebook_context`.

## Follow-up

1. Verify the SillyTavern button against a live chat with multiple characters.
2. Confirm the NSFW score and continuity notes show up in the generated image request as expected.
3. Continue monitoring the Jellyfin `Animated` scan until the nested content appears.
