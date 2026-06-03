# Oobabooga programmer card

## Context
- The user wanted a code-focused Oobabooga character card added directly to the local laptop instance.
- They also wanted a model recommendation for better code output.

## Decision
- Add a minimal, code-first character card to Oobabooga's `user_data/characters` directory.
- Recommend the installed coder-specific model for the best code output.

## Rationale
- Oobabooga already stores reusable character YAML files in `user_data/characters`.
- The smallest useful card is easier to reason about than a large prompt blob.
- A coder-tuned model should outperform general-purpose chat models on code tasks.

## Challenges
- The character directory existed under `user_data`, not at the root install path.
- The existing cards were YAML-based, so the new card had to match that format.

## Implementation Notes
- Wrote `D:\Repositories\LLM\Oobabooga\text-generation-webui\user_data\characters\Code Pilot.yaml`.
- The card keeps the assistant terse, minimal, and code-first.
- Recommended runtime model: `qwen2.5-coder-14b-instruct-q4_k_m.gguf`.

## Follow-up
- If the user wants, mirror the same card into any second Oobabooga profile on the laptop.
- If the coder model underperforms, test the next-best installed model against the same card.
