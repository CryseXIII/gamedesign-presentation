# Shoko auth token recovery

## Context
- The live Shoko dashboard and queue endpoints were returning `401` without auth.
- The API-key label in the UI was visible, but the actual token value was not.

## Decision
- Read the stored auth tokens directly from CT213's Shoko SQLite database.
- Use the recovered token to validate live dashboard and queue access.

## Rationale
- The UI only shows token labels after creation, not the secret value.
- The database is the source of truth, so it is the cleanest recovery path.

## Challenges
- `sqlite3` was not installed in CT213.
- The token lookup had to be done with Python's built-in `sqlite3` module over SSH.

## Implementation Notes
- Connected to Proxmox over SSH and entered CT213 with `pct exec`.
- Queried `JMMUser` and `AuthTokens` from `JMMServer.db3`.
- Recovered the token tied to `TheGoodHunterXIII` and used it against `/api/v3/Dashboard/Stats` and `/api/v3/Queue`.

## Follow-up
- Keep using the recovered token for live checks until the key is rotated.
- If the key is rotated later, update the workspace notes with the new active label only, not the secret value.
