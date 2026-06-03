# SD model prune and AnimateDiff path

## Context
- The local A1111 setup needed disk space back, and the current model folder had many old checkpoints plus a large LoRA pile.
- The user also wanted a practical way to animate a single downloaded still with AnimateDiff.

## Decision
- Keep one main checkpoint for the current workflow: `ponyDiffusionV6XL_v6StartWithThisOne`.
- Remove the old checkpoint junk and clear the LyCORIS folder entirely.
- Keep only a slim LoRA set that still helps with detail/NSFW rendering.

## Rationale
- For this use case, the checkpoint should be the stable base and LoRAs should be added only when they materially improve the result.
- Most of the freed space comes from checkpoints, so removing extra bases gives the highest payoff.

## Challenges
- Some LoRAs are useful for specific characters, so the cleanup had to keep a small general-purpose set instead of deleting everything blindly.
- AnimateDiff on A1111 is still sensitive to model family and motion-module compatibility.

## Implementation Notes
- Deleted all checkpoints except Pony.
- Removed the entire `models/LyCORIS` folder contents.
- Kept only a small set of LoRAs for detail and common NSFW effects.
- Verified A1111 still starts and now exposes `enable_insecure_extension_access=true`.

## Follow-up
- For a single-image animation, use `img2img` with a low denoise, enable AnimateDiff, and start with a short clip length before upscaling/interpolating to ~5 seconds.
- If a specific character matters later, re-download that LoRA on demand instead of keeping it all resident.
