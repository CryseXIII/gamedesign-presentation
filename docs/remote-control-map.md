# Remote Control Map

## What You Can Control Remotely

### Browser UIs

- Portal hub: `https://gamedesign.152.53.117.246.sslip.io/#/portal`
- Open WebUI: `http://100.118.216.77:8080`
- Oobabooga Chat: `https://ooba.gamedesign.152.53.117.246.sslip.io/`
- Shoko: `https://shoko.gamedesign.152.53.117.246.sslip.io/`
- Scene Worker: `https://scene-worker.gamedesign.152.53.117.246.sslip.io/`
- ComfyUI: `http://100.109.133.95:8189`

### Useful API Endpoints

- Oobabooga models: `https://ooba-api.gamedesign.152.53.117.246.sslip.io/v1/models`
- Oobabooga chat: `POST https://ooba-api.gamedesign.152.53.117.246.sslip.io/v1/chat/completions`
- Oobabooga completions: `POST https://ooba-api.gamedesign.152.53.117.246.sslip.io/v1/completions`
- Oobabooga Chat UI: `https://ooba.gamedesign.152.53.117.246.sslip.io/`
- Orchestrator generate: `POST http://127.0.0.1:8766/generate` (internal, via Open WebUI tools or inside the stack)
- Orchestrator planned generate: `POST http://127.0.0.1:8766/generate/planned` (internal)
- Orchestrator inpaint: `POST http://127.0.0.1:8766/inpaint` (internal)
- Orchestrator vision: `POST http://127.0.0.1:8766/vision/analyze` (internal)
- Orchestrator models: `GET http://127.0.0.1:8766/models` (internal)
- Orchestrator jellyfin status: `GET http://127.0.0.1:8766/jellyfin/status` (internal)

## Current Function Set

### LLM / Chat

- `GET /v1/models`
- `POST /v1/chat/completions`
- `POST /v1/completions`
- `GET /llm/status`
- `POST /llm/start`
- `POST /llm/stop`
- `POST /switch_model`

### Image Generation

- `POST /generate`
- `POST /generate/planned`
- `POST /img2img`
- `POST /inpaint`
- `GET /models`
- `GET /models/current`
- `POST /models/switch`
- `GET /loras`
- `GET /samplers`
- `GET /upscalers`
- `POST /civitai/search`
- `POST /civitai/download`

### Vision and Media

- `POST /vision/analyze`
- `POST /vision/download`
- `GET /vision/download/{model_key}`
- `GET /jellyfin/public`
- `GET /jellyfin/info`
- `GET /jellyfin/config`
- `GET /jellyfin/sessions`
- `GET /jellyfin/status`

## Rule Of Thumb

- Use the portal for navigation.
- Use Open WebUI for normal chat.
- Use the raw chat UI when you want fewer wrappers.
- Use the orchestrator API when you want to script or chain services.
- The portal Oobabooga and Shoko links are env-driven, and the defaults now point at public hostnames.
- Use Shoko later as the anime metadata sidecar for Jellyfin.
