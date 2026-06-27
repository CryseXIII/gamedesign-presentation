# Portal Launcher Mixed-Content Guard

## Context
The portal status panel still depended on a launcher URL that could be set to plain HTTP, which fails inside the HTTPS portal because browsers block mixed-content fetches.

## Decision
Keep launcher configuration env-only, but make the portal detect insecure launcher URLs and show a clear blocking message instead of attempting the fetch.

## Rationale
- The portal should fail fast with an actionable message when the launcher endpoint is not HTTPS-safe.
- Runtime editing was not needed for this fix; the build-time env path stays simpler.
- A1111 and ComfyUI portal defaults should point at the public HTTPS hostnames instead of raw tailnet HTTP IPs.

## Challenges
- The browser error happens before the fetch completes, so the UI needs to detect the mismatch first.
- The status panel still needs to remain useful when the launcher token is missing.

## Implementation Notes
- Added a mixed-content check in `PortalScreen` that blocks status polling and actions when the page is HTTPS and `VITE_LAUNCHER_URL` is HTTP.
- Rendered an explicit service-status message explaining which launcher URL is blocked.
- Kept launcher config env-only, with no runtime URL/token editor.
- Updated `portalTargets.js` defaults for A1111 and ComfyUI to HTTPS portal hostnames.
- Verified the app with `npm run build`.

## Follow-Up
- Point `VITE_LAUNCHER_URL` at a secure HTTPS endpoint in the deployed environment if live launcher status is needed on the public portal.
