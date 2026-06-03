# Shoko queue consistency observation

## Context
- The user wanted a short live observation to see whether the Shoko queue is consistently consuming work.
- The active queue had a large backlog with both waiting and blocked jobs.

## Decision
- Observe the live queue for five minutes and compare the counts before and after.

## Rationale
- A single snapshot is not enough to judge queue health.
- A short delta shows whether work is progressing or stalling.

## Challenges
- `Waiting` and `Blocked` can move independently, so a flat or rising blocked count does not always mean the system is stuck.

## Implementation Notes
- Starting state: `Waiting=588`, `Blocked=7348`, `Total=7940`, `ThreadCount=4`.
- Ending state after five minutes: `Waiting=573`, `Blocked=7361`, `Total=7938`, `ThreadCount=4`.
- Active jobs kept changing, but the thread pool stayed busy.

## Follow-up
- Keep watching the queue if the user wants a longer trend line.
- If `Total` stops falling over multiple samples, inspect the blocked dependencies rather than restarting Shoko.
