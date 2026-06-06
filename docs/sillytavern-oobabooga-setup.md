# SillyTavern + Oobabooga Setup

Use SillyTavern as the frontend and Oobabooga as the backend.

Planned deployment: small VPS LXC for SillyTavern, with Oobabooga staying the chat backend.
RP-to-image should flow through compact scene JSON first, then a ComfyUI workflow translation step.

## Oobabooga API

- Base URL: `https://ooba-api.gamedesign.152.53.117.246.sslip.io/v1`
- Chat endpoint: `/chat/completions`
- Models endpoint: `/models`

## SillyTavern Settings

1. Open SillyTavern settings.
2. Select the OpenAI-compatible / Chat Completions backend.
3. Set the API base URL to the Oobabooga API URL above.
4. Use a placeholder API key if the UI requires one.
5. Pick the model exposed by Oobabooga.

## Notes

- Do not use OpenRouter unless you want an external paid or quota-limited relay.
- Local Oobabooga keeps the chat path under your control.
- If SillyTavern gets a public or Tailscale URL later, wire it into `VITE_SILLYTAVERN_URL` for the portal.
- If SillyTavern says `Not connected to API!`, confirm Oobabooga is running with `--api` and that `http://100.109.133.95:5000/v1/models` returns JSON.
- If the UI wants an API key, use a dummy placeholder for the custom OpenAI-compatible connection and keep the server URL on the `/v1` base.
- For RP-to-image, first produce a scene brief that captures prior events, the current action, participants, pose cues, and cinematic style.
- If needed, emit a structured ComfyUI workflow/JSON payload from the same scene brief so the image can be loaded without manual node setup.
- Keep the scene parser content-preserving and non-judgmental; it should not rewrite or moralize the RP text before translation.
- The actual image step is ComfyUI: translate the scene JSON into a workflow, submit it to ComfyUI `/prompt`, wait for completion, then read back the generated image URL.
- Use n8n or Node-RED only as orchestration around that core render worker, not as the place where the whole scene model lives.
- SillyTavern can call `https://scene-worker.gamedesign.152.53.117.246.sslip.io/render/from-excerpt/submit` from a browser extension; the worker queues the job and the extension polls status.
- The same extension now also has an `SD Generate` button that posts the latest excerpt to the public SD orchestrator and shows the returned image.
- The SD path prefers storyboard-style output for multi-beat scenes; leave `Preferred Model` blank to let the orchestrator pick from the installed checkpoints, or pin one when needed.
- The repo now includes `vps-architecture/sillytavern-image-action/`; copy it into SillyTavern's `extensions/third-party/scene-image-action/` folder.
- CT215 provisioning now seeds SillyTavern's OpenAI-compatible Oobabooga connection automatically.
- The scene render button now uses the worker's queued submit + poll API instead of one long blocking render call.
