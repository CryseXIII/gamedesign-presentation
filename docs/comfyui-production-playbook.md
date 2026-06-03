# ComfyUI Production Playbook

## Goal

Make one ComfyUI core graph do the heavy lifting for complex stills, then keep short video as a separate follow-up test path.

## Multi-Person Still Graph

Recommended node flow:

```text
Load Checkpoint
  -> CLIP Text Encode (positive)
  -> CLIP Text Encode (negative)
  -> Empty Latent Image
  -> KSampler (layout pass)
  -> VAE Decode
  -> Save/Preview
```

Then branch into character-specific cleanup:

```text
Rendered Layout
  -> Mask per character / region
  -> Inpaint branch for each person
  -> Merge back with Latent Composite or image composite
  -> Final style pass
  -> Upscale / Save
```

Practical rules:

1. Lock pose and camera first.
2. Keep one seed while testing composition.
3. Inpaint one problem region at a time.
4. Apply style harmonization only after the layout is stable.
5. Use the same checkpoint unless a character style absolutely requires a different one.

## 3-Second Video Test

Concrete first test:

1. Keep the shot simple and mostly static.
2. Treat 3 seconds as a frame budget, not a movie.
3. Use 12 fps for the first pass: 36 frames.
4. Start with 3 keyframes: start, middle, end.
5. Only add motion after the frames are visually correct.

If the current TemporalKit/depth-map stack is still broken on this machine, stop at the frame pipeline and do not waste time forcing the extension chain.

## Loadable Workflow File

Use `docs/comfyui-multi-person-workflow.json` as the actual drag-and-drop ComfyUI workflow export.

Use `docs/comfyui-multi-person-prompt.json` only when you want the bare API prompt payload.

Use `docs/comfyui-inpaint-workflow.json` for inpaint cleanup runs.

## Raw Chat Meaning

Raw chat means the direct Oobabooga UI at port `1338`:

- no portal planner
- no extra wrapper logic
- less Open WebUI polish
- better for blunt, fast local chat
