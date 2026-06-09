# SD Generate Orchestrator Reroute

**Date:** 2026-06-06

## Context

The SillyTavern `SD Generate` button was still failing through the public n8n `sd-agent` workflow with a webhook handling error. The public SD orchestrator on CT210 was healthy and returns the exact image payload the panel can render.

## Decision

Reroute the `SD Generate` button to the public SD orchestrator endpoint at `https://sd-orchestrator.gamedesign.152.53.117.246.sslip.io/generate`.

## Rationale

- The orchestrator already returns `images`, `seed`, `model`, and prompt metadata.
- The browser button needs a stable direct path more than it needs the n8n workflow in the middle.
- This avoids the broken webhook path while keeping the public browser flow intact.

## Challenges

- The orchestrator is slower than the scene-worker path, so the browser timeout had to be increased.
- The prompt payload had to be trimmed to keep the generation request lightweight.

## Implementation Notes

- Added `sd-orchestrator.gamedesign.152.53.117.246.sslip.io` to CT201 Caddy.
- Updated `vps-architecture/sillytavern-image-action/index.js` to use the new public orchestrator URL.
- Increased the SD fetch timeout to 180s and reduced the default generation settings to 512x512 at 8 steps.
- Updated the live CT215 extension bundle and restarted SillyTavern.

## Follow-up

1. Keep the broken n8n `sd-agent` webhook documented as unused until the workflow is repaired or removed.
2. Re-test `SD Generate` in the browser on a full live chat excerpt.
