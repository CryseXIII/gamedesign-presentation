# Workbench Scroll Layout Fix

## Context
The workbench layout was closer, but the page still did not scroll properly and the side columns still felt too wide compared to the intended sketch.

## Decision
Keep the existing 3-column workbench structure, remove the redundant outer control stack, and make the workbench scroll at the page level again.

## Rationale
- The workbench should scroll as a normal page instead of trapping content inside a hidden root.
- The center workspace should remain dominant, with narrower left and right columns.
- The current layout logic was already correct enough; the fix needed to be structural and CSS-level, not a backend change.

## Challenges
- Global app styles still forced `overflow: hidden` on `html`, `body`, and `#root`.
- The workbench file still had some duplicate control sections that made the layout feel heavier than intended.

## Implementation Notes
- Added a route-specific body class from `ImageWorkbench` so the workbench page can scroll.
- Overrode the global root/body overflow rules for the workbench route.
- Removed the duplicated outer model-control and tab strip from above the 3-column shell.
- Narrowed the side columns and widened the center workspace.
- Rebuilt successfully with `npm run build`.

## Follow-Up
- Verify the scroll behavior and spacing on the live VPS once the push lands.
