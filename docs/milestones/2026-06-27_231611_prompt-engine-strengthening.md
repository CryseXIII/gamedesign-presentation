# Prompt Engine Strengthening

## Context
The workbench already auto-analyzed uploaded main images and copied prompt bundles, but the generated prompts were still too generic for precise image-edit work.

## Decision
Strengthen the prompt templates with clearer image-edit language, more explicit crop and zoom metadata, and per-target bounds derived from the painted edit areas.

## Rationale
- The prompts should describe exactly what to change and what to preserve.
- ChatGPT and Gemini prompts should be strict natural-language briefs, not noisy tool descriptions.
- Edit areas are much more useful when they include their actual geometry, not just a color label.

## Challenges
- The prompt bundle needs to stay readable even when the edit map has many targets.
- The stricter wording still has to remain safe and non-evasive.

## Implementation Notes
- Added bounds aggregation for paint strokes so each edit target can carry its own geometry.
- Included target bounds and stroke count in the copied bundle and job spec.
- Tightened the Stable Diffusion prompt to include explicit preserve/edit constraints.
- Rewrote the ChatGPT and Gemini prompts as strict natural-language editing briefs without checkpoint/tooling noise.
- Added the SD seed back into the text prompts as visual guidance.
- Verified the app with `npm run build`.

## Follow-Up
- If the prompt wording still feels too soft, tune the language further without adding jailbreak or bypass behavior.
