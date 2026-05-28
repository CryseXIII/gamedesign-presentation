# n8n SD Agent — Image Generation Fixed via toolCode

**Date:** 2026-05-28  
**Session UTC:** 13:00

---

## Context

The SD AI Agent workflow (`naEoakKBq5icz4NR`) on CT211 (n8n v2.20.9) had an unresolved blocker:  
the `Generate_Image` tool always failed with HTTP 422 from the CT210 orchestrator.

Previous session had patched the `@langchain/classic` `outputParser.js` and slimmed the `/models` and `/loras` endpoints to fix context overflow. The "list models" path worked end-to-end (exec 142 success). Image generation remained broken.

---

## Decision

Replace the `toolHttpRequest` Generate_Image node with a `toolCode` (JavaScript Code tool) node.

---

## Rationale

### Root cause investigation

1. **Multi-`$fromAI()` body error** — old `jsonBody` used an object literal  
   `={{ { "prompt": $fromAI("prompt", ...), "steps": $fromAI("steps", ...) } }}`.  
   n8n evaluated this to a JS object and string-coerced it → `"[object Object]"` → 422.

2. **Single `$fromAI("input", "json", {})` patch** — body arrived at orchestrator as **0 bytes**.  
   Root cause: in the ConversationalChatAgent (ReAct) format the model sends  
   `action_input: '{"prompt":"..."}'` as an unnamed string. `$fromAI("input")` looks for  
   a *named* parameter `"input"` in a structured function call schema. None exists, so  
   it returns `null`/undefined → n8n sends empty body → orchestrator returns 422/500.

3. **Confirmed via raw-body logging** — patched `/generate` to capture `request.body()`  
   before Pydantic parsing; file was always 0 bytes regardless of `$fromAI()` type.

### Fix

`toolCode` (JS) exposes the model's `action_input` directly as the `query` variable.  
No `$fromAI()` plumbing needed:

```javascript
let params = typeof query === 'string' ? JSON.parse(query) : query;
const resp = await fetch('http://10.10.10.40:8766/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(params)
});
// Return compact summary — omit base64 to keep context short
```

Result summary returned: `{seed, model, steps, width, height, image_count, first_image_prefix}`.

---

## Implementation Notes

- Workflow `naEoakKBq5icz4NR` updated via n8n REST API (`PUT /api/v1/workflows/{id}`).
- Node `aaaaaaaa-0004-0004-0004-000000000004` type changed from  
  `@n8n/n8n-nodes-langchain.toolHttpRequest` → `@n8n/n8n-nodes-langchain.toolCode`.
- Remaining tools (List_Models, List_LoRAs, Switch_Model) stay as toolHttpRequest — GET  
  requests with no body work fine since `$fromAI()` is not involved.
- Debug request logger removed from CT210 orchestrator `/v1/chat/completions` handler.
- Orchestrator `/echo` diagnostic endpoint and `/generate` raw-body logging patch  
  reverted; orchestrator is clean.

### Verified execution (exec ~148)

```
Tool called:   Generate_Image
action_input:  {"prompt":"dark fantasy castle at sunset, atmospheric, detailed","steps":20,"width":512,"height":512}
Tool response: {"seed":3342825456,"model":"ponyDiffusionV6XL_v6StartWithThisOne","steps":20,"width":512,"height":512,"image_count":1,"first_image_prefix":"iVBORw0KGgoAAAANSUhEUgAAAgAAAA..."}
```

Image was generated successfully. Model's *Final Answer* text hallucinated a fake URL —  
this is model quality, not a tool execution issue.

---

## Challenges

- PowerShell heredoc + SSH quote mangling made inline Python/curl unreliable; adopted  
  `Write heredoc to file → pct push → pct exec` pattern throughout.
- `pct exec CT -- bash -c '...'` still mangled single-quoted args; short Python scripts  
  pushed as files were the reliable path.
- `$fromAI()` limitations in ReAct mode were not documented; required binary-search  
  debugging with 0-byte body capture to confirm.

---

## Open Items / Follow-up

1. **SillyTavern trigger** — STscript or extension to POST RP excerpt to `/webhook/sd-agent`.
2. **Final Answer quality** — model sometimes fabricates results instead of quoting the  
   tool response. May improve with a stronger system prompt or a better model.
3. **ComfyUI** — endpoints not yet in orchestrator; launcher doesn't start ComfyUI.
4. **Audio assets** — `wb_fire_sfx`, `wb_rain_sfx`, `wb_widow_music` still missing.
5. **GameScene wiring** — `gm_bg_training_arena` + `gm_enemy_autoplay_lady` not yet active.
6. **Domain** — `crysiscreations.de` not yet attached.
