# ComfyUI Windows Logger UTF-8 Fix

**Date:** 2026-06-05

## Context

ComfyUI was crashing during sampling on Windows with `UnicodeEncodeError` when `tqdm` emitted a progress character (`\u258e`) through the logger wrapper.

## Decision

1. Patch the ComfyUI logger wrapper to use UTF-8 with replacement errors.
2. Keep the fix local to `app/logger.py` so normal runtime behavior is unchanged except for the encoding safety.

## Rationale

- The failure is a Windows console encoding problem, not a checkpoint or torch problem.
- The logger wrapper was the exact point where `cp1252` encoding was being enforced.
- Using replacement errors prevents the progress bar from aborting the whole run.

## Challenges

- The crash happens deep inside `tqdm`, so the visible error looks like a sampler/model issue until the traceback is read carefully.
- Preserving readable logs while avoiding hard failures is better than stripping all progress output.

## Implementation Notes

- Changed `LogInterceptor` in `ComfyUI/app/logger.py` to default to UTF-8 and `errors='replace'`.
- Verified the file with `python -m py_compile`.

## Follow-up

1. Re-run the same workflow and confirm sampling no longer aborts on Windows progress-bar output.
2. If any other console path still emits bad encoding, patch that path too, but only if it surfaces in a real traceback.
