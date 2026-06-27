# Workbench React Style Crash Fix

## Context
The new Image Workbench layout still rendered as a black screen on the live site. Browser console output showed React minified error #62 during mount.

## Decision
Fix the render-time React style prop mistake in `ImageWorkbench` and redeploy the unchanged workbench layout.

## Rationale
- React error #62 maps to a `style` prop receiving a string instead of an object.
- The layout itself was already valid; the page was crashing before any UI could mount.
- The safest fix was to correct the offending JSX attribute and keep the rest of the workbench intact.

## Challenges
- The live bundle had already been rebuilt, so the issue had to be diagnosed from the browser console and source code rather than from the build output.
- The workbench component is large, so the bad string-style attribute had to be located without disturbing the layout refactor.

## Implementation Notes
- Replaced the string `style` attribute in the orchestrator URL label with a React style object.
- Rebuilt the app to confirm the fix did not break production output.

## Follow-Up
- Verify `#/workbench` visually again after the VPS pulls the pushed commit.
