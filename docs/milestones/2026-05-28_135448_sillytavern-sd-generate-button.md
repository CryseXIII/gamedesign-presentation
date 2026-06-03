# SillyTavern SD Generate button

## Context
The scene-worker browser bridge already handled RP excerpt rendering, and the n8n SD agent workflow was updated live to return `output`, `image_base64`, `seed`, and `model`. The missing piece was a direct SillyTavern trigger for that workflow.

## Decision
Add an `SD Generate` button to the SillyTavern extension so the browser can post the latest RP excerpt to the n8n `sd-agent` webhook and render the returned image payload inline.

## Rationale
- Keeps the RP-to-image path inside the existing SillyTavern panel.
- Uses the existing latest-excerpt selection logic, so the user does not have to duplicate context.
- Renders the base64 image directly, which is the simplest end-to-end verification path.

## Challenges
- The extension needed a second endpoint without breaking the scene-worker render flow.
- The SD webhook response is richer than the scene-worker response, so the panel needed separate rendering for `output`, `seed`, `model`, and `image_base64`.
- The n8n webhook is public-facing, so the browser-side default had to be reachable without extra proxy work.

## Implementation Notes
- Added a stored `SD Agent URL` field to `vps-architecture/sillytavern-image-action/index.js`.
- Added the `SD Generate` button next to the existing scene render button.
- The extension now posts the latest non-empty chat message as `prompt` to `https://bot.152.53.117.246.sslip.io/webhook/sd-agent` by default.
- The response panel now shows the SD metadata plus the returned base64 image.
- Bumped the extension manifest version to `1.1.0`.

## Follow-up
- Verify the live SillyTavern install has the updated extension bundle.
- Decide whether to add a small retry/fallback path if the n8n webhook is unreachable.
