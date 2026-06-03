# SillyTavern fallback and vision docs

## Context
The SillyTavern RP bootstrap was still surfacing the fallback pack as an error, and the requested A1111 / vision-grid behavior needed to be documented against the actual pipeline already present in the orchestrator.

## Decision
Make the SillyTavern bootstrap return the fallback pack cleanly instead of throwing, and add explicit docs for A1111 extension access plus the global + overlapping crop vision path.

## Rationale
- The user needs the chat side to stay usable even when the generated bootstrap pack is incomplete.
- The A1111 assertion is a management lock, not proof that runtime extensions are inactive.
- The vision stack already has the requested global/detail crop structure, so the missing piece was surfacing it clearly.

## Challenges
- The generated RP pack can still be incomplete, so the fallback path must not fail loudly.
- The actual installed A1111 extension list is not available from this workspace, so only the behavior and usage pattern can be documented here.

## Implementation Notes
- `vps-architecture/sillytavern-image-action/index.js` now returns the built-in fallback pack without throwing when generation fails.
- Added `docs/stable-diffusion-extension-guide.md` for A1111 extension access, `Apply and restart`, and OpenPose usage.
- Added `docs/vision-grid-pipeline.md` to document the existing global view + overlapping detail crop pipeline in the orchestrator.
- Updated the SillyTavern/Oobabooga setup notes with the `--api` and dummy API key troubleshooting.

## Follow-up
- Re-test the live SillyTavern session so the bootstrap no longer surfaces the incomplete-pack error.
- If a literal visual minimap UI is still desired, add it as a separate presentation layer on top of the existing analysis pipeline.
