# SillyTavern + Oobabooga Setup

Use SillyTavern as the frontend and Oobabooga as the backend.

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
