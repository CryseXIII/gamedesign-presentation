# Scene Worker Checkpoint Guard

**Date:** 2026-06-07

## Context

CT214 scene renders failed because the worker could still request `dreamshaperXL_turboDpmppSDE.safetensors`, but the live ComfyUI node only exposes installed checkpoints like Pony, Juggernaut, and Albedo.

## Decision

Make checkpoint selection runtime-safe and align the provisioning default with an installed model.

## Rationale

- A stale default checkpoint should not be able to break `/prompt`.
- The worker already has a clear local-first fallback path, so it should prefer known-installed models instead of inventing names.
- Pony is the safest baseline for the current RP image flow.

## Challenges

- The bad checkpoint could come from either the worker default or the LLM-planned asset plan.
- The live CT214 container was not reachable from the workspace, so the fix had to be made in code and provisioning first.

## Implementation Notes

- Updated `vps-architecture/scene-worker/scene_worker.py` to query ComfyUI's checkpoint list and rewrite unsupported plans to a safe fallback.
- Replaced the fallback catalog with the currently installed model set: Pony, Juggernaut, and Albedo.
- Updated the plan prompt to only choose from `available_checkpoints`.
- Updated `vps-architecture/provisioning/provision-scene-worker-lxc.sh` to seed Pony as the default checkpoint.

## Follow-up

1. Roll the updated env file/service into CT214 so the live container picks up the Pony default immediately.
2. Verify a fresh scene render path no longer submits `dreamshaperXL_turboDpmppSDE.safetensors`.
