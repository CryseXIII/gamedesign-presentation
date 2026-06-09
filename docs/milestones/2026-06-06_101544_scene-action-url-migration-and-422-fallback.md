# Scene Action URL Migration And 422 Fallback

**Date:** 2026-06-06

## Context

After deploying the browser-side fixes, the live SillyTavern panel still showed stale state in some sessions: `SD Generate` could still target the old n8n webhook URL, and the queued scene render path could still reject a payload with HTTP 422.

## Decision

Add two guardrails in the extension:

1. Auto-migrate legacy n8n `sd-agent` URLs to the public SD orchestrator URL.
2. Fall back from queued scene submit to the older direct render endpoint when the queue route returns 422.

## Rationale

- Browser state can survive code deploys, so stale localStorage values must be handled in code.
- The direct render endpoint is slower, but it is already deployed and provides a useful fallback when the queue validator rejects input.

## Challenges

- Open tabs can keep old extension state until refresh.
- The live buttons need to keep working even when users have an old URL saved in their profile.

## Implementation Notes

- `getSdAgentUrl()` now rewrites old `bot.152.53.117.246.sslip.io/webhook/sd-agent` values to the public SD orchestrator URL.
- The scene render submit path now retries `/render/from-excerpt` when `/render/from-excerpt/submit` responds with HTTP 422.
- The live CT215 extension bundle was updated and SillyTavern restarted.

## Follow-up

1. Ask the user to refresh the panel or hard reload the SillyTavern tab so the new JS actually runs.
2. If 422 still happens after reload, inspect the exact request body in the browser network tab.
