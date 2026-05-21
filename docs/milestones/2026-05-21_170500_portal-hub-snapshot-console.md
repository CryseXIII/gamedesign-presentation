# Portal Hub And Snapshot Console

## Context

The presentation app needed to become a real portal hub with Gameron as a subpage and a maintenance screen for snapshots.

## Decision

Make the app portal-first, add hash routes, and add a dedicated snapshot console with progress and restore UI.

## Rationale

The user wants a single place to reach the game, system tools, and maintenance controls, instead of keeping the game title screen as the primary landing page.

## Challenges

- The snapshot backend is not yet deployed, so the UI had to be useful in demo mode and ready for a live API later.

## Implementation Notes

- `src/App.jsx` now routes `#/portal`, `#/gameron`, and `#/snapshots`.
- `src/components/PortalScreen.jsx` now shows the portal URLs, subpage launchers, Jellyfin, and service cards.
- `src/components/SnapshotCenter.jsx` now shows progress, ETA, history, and storage routing.
- `src/config/portalTargets.js` centralizes the portal links and snapshot policy.
- `src/styles/portal.css` and `src/styles/snapshot.css` were updated for the new hub layout.
- `npm run build` passed after the changes.

## Follow-up Items

- Connect the snapshot console to the actual backend service.
