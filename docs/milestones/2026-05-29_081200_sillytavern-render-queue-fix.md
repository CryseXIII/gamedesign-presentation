# SillyTavern render queue fix

## Context
The SillyTavern `Render latest excerpt` action was failing in the browser with `NetworkError when attempting to fetch resource`. The public scene worker was reachable, so the likely issue was the long blocking render call timing out or being reset before completion.

## Decision
Switch the SillyTavern scene render action from the single long `POST /render/from-excerpt` call to the worker's fast queue-based chain: `POST /scene/extract` -> `POST /scene/plan` -> `POST /render/submit` -> `GET /render/status/{job_id}` polling.

## Rationale
- The queue path returns quickly, which avoids browser/proxy timeouts.
- The worker already exposes the extract/plan/submit/status API, so this uses the intended API instead of a shortcut that can stall.
- Polling gives progress visibility instead of a silent fetch failure.

## Challenges
- The browser extension had to keep the rendering UI responsive while polling.
- The extension needed a clean way to assemble the scene payload from the extract response before submitting the job.

## Implementation Notes
- `vps-architecture/sillytavern-image-action/index.js` now calls the worker's extract, plan, and submit endpoints directly, then polls `/render/status/{job_id}` until completion.
- The result panel still renders returned artifact thumbnails, but it now receives them from the completed job status object.
- A 10-minute polling timeout was added so the UI can fail clearly instead of hanging forever.

## Follow-up
- Re-test `Render latest excerpt` in the live SillyTavern session.
- If the public worker still resets under heavy load, add a same-origin proxy on the SillyTavern host or shorten the render job itself.
