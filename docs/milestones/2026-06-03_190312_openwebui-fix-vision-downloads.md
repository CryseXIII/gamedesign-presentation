# 2026-06-03 — Open WebUI Fix + Vision Model Downloads

## Context

Continuing from previous session where Open WebUI 0.9.6 was crashing on CT210 (ai-chat).
The crash was blocking access to the AI chat interface. Three GGUF vision models also needed
to be downloaded to replace the non-functional HF-format stubs in Oobabooga.

## Decisions

### Open WebUI crash root cause

`RAG_EMBEDDING_ENGINE` was unset (empty string = local SentenceTransformer mode). On startup,
Open WebUI 0.9.6 calls `get_embedding_function()` which raises `ValueError` if no local model
is loaded and `HF_HUB_OFFLINE=1` blocks the download. The service crashed every ~16s in a
restart loop at 1.1-1.3 GB peak memory.

**Fix applied:** set `RAG_EMBEDDING_ENGINE=openai` with `RAG_OPENAI_API_BASE_URL` pointing
to Oobabooga. This skips local SentenceTransformer loading entirely. RAG embeddings will
use the Oobabooga `/v1/embeddings` endpoint when invoked (Oobabooga llama.cpp may not
support embeddings, but this only fails at RAG query time, not at startup).

Also cleaned up `/etc/open-webui/env` on CT210 — previous session left garbage lines
(`EOF`, `nnn RAG_EMBEDDING_ENGINE=...` as a single line) from failed shell heredoc
injections. Rewrote the file via Python to deduplicate keys and strip junk.

### Vision model downloads

Prior download state was lost when the Launcher Daemon restarted. The `/vision/download/{key}`
status endpoint returns `{"status": "not_found"}` after restart since state is in-memory only.
Re-initiated all three downloads. `huggingface_hub` resumes partial files, so re-triggering is
always safe.

## Implementation Notes

- `/etc/open-webui/env` on CT210 now has: `HF_HUB_OFFLINE=1`, `HF_DATASETS_OFFLINE=1`,
  `TRANSFORMERS_OFFLINE=1`, `RAG_EMBEDDING_ENGINE=openai`,
  `RAG_OPENAI_API_BASE_URL=http://100.109.133.95:5000/v1`, `RAG_OPENAI_API_KEY=placeholder`
- Open WebUI serving HTTP 200 on CT210:8080 as of 2026-06-03 ~17:00 UTC
- Vision downloads kicked off via `POST /vision/download` on Launcher Daemon:
  - `InternVL3-8B-Instruct-GGUF` → `unsloth/InternVL3-8B-Instruct-GGUF`, ~0.2% at check time
  - `gemma-3-12b-it-GGUF` → `unsloth/gemma-3-12b-it-GGUF`, ~0.2% at check time
  - `MiniCPM-V-4.6-gguf` → `openbmb/MiniCPM-V-4.6-gguf`, ~1.5% at check time
  - Files land in `D:\Repositories\LLM\Oobabooga\text-generation-webui\user_data\models\<key>\`

## Challenges

- Shell heredoc injection via `pct exec` + SSH doesn't work for multiline content due to
  PowerShell parsing and `pct exec` argument quoting. Workaround: write Python script to
  temp file, `scp` to VPS, `pct push` to container, `pct exec python3`.
- The `COMFYUI_WORKFLOW` env var contains raw JSON — any shell-based line-by-line approach
  to editing the env file corrupts it. Python file rewrite is the reliable method.

## Follow-Up Items

1. Poll `/vision/download/{key}` to confirm all three downloads complete without error
2. After downloads: test `POST /switch_model {"model": "InternVL3-8B-Instruct-GGUF"}` to
   verify the new model loads and vision works
3. SillyTavern lorebook activation is manual: World Info → Load → `blazblue_universe.json`
   → enable globally or attach to group chat
4. If Oobabooga's llama.cpp doesn't serve `/v1/embeddings`, set `ENABLE_RAG_WEB_SEARCH=False`
   in Open WebUI env to avoid silent embedding failures during RAG queries
5. Monitor whether `albedobaseXL_v13` and `Juggernaut-XL` SD checkpoints on laptop need to
   be removed to free disk space for the three new GGUF downloads (~5-7 GB each)
