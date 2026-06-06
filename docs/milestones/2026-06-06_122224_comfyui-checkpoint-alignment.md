# ComfyUI Checkpoint Alignment

**Date:** 2026-06-06

## Context

The live ComfyUI node rejected a prompt with HTTP 400 because the workflow requested `dreamshaperXL_turboDpmppSDE.safetensors`, but the installed checkpoint list only exposed the Pony checkpoint.

## Decision

Align every checked-in ComfyUI workflow export with the actual installed model name on the live node.

## Rationale

- ComfyUI validates `ckpt_name` against the node's installed model list.
- A stale checkpoint string breaks `/prompt` before generation starts.
- The live node already uses Pony elsewhere, so the workflow exports should match that baseline.

## Challenges

- The error surfaced in a prompt validation layer, not a sampler or render step.
- Multiple workflow exports had the same stale checkpoint string.

## Implementation Notes

- Updated `docs/comfyui-multi-person-prompt.json` to use `ponyDiffusionV6XL_v6StartWithThisOne.safetensors`.
- Updated `docs/comfyui-multi-person-workflow.json` to use the same checkpoint in the loader node.
- Updated `docs/comfyui-inpaint-workflow.json` the same way.

## Follow-up

1. Re-import the workflow exports if any external ComfyUI setup was built from the old files.
2. If another checkpoint mismatch appears, pull the exact allowed names from the live node before editing the export.
