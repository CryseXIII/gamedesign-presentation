# SillyTavern Oobabooga default seed

## Context
CT215 was already running SillyTavern with the intended Oobabooga backend in the live instance, but the provisioning script still relied on manual backend setup.

## Decision
Seed SillyTavern's OpenAI-compatible chat settings during CT215 provisioning so the Oobabooga connection comes up by default on fresh installs.

## Rationale
- Removes one manual UI step from the rollout path.
- Keeps the live backend target consistent with the documented Oobabooga API URL.
- Makes re-provisioning reproducible instead of depending on browser-local state.

## Challenges
- SillyTavern stores the connection state in its user data, so the seed had to write the live settings file instead of only changing docs.
- The provisioning script needed to stay shell-safe while still writing the nested JSON payload.

## Implementation Notes
- `vps-architecture/provisioning/provision-sillytavern-lxc.sh` now writes `/opt/sillytavern/data/default-user/settings.json` with `main_api=openai`, `chat_completion_source=custom`, the Oobabooga `/v1` URL, and the `mythomax-l2-13b` model ID.
- The rollout doc and CT215 context now describe the seed step explicitly.
- The project memory was updated to reflect the provisioning default.

## Follow-up
- Re-run the CT215 rollout once to confirm the seeded settings survive a restart.
- Check whether the same pattern should be applied to any future SillyTavern LXC clones.
