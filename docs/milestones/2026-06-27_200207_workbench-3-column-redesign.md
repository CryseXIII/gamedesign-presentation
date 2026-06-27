## Context
`#/workbench` had reverted away from the intended layout and the live site was showing a broken-looking black workbench page.

## Decision
Rebuild `ImageWorkbench` into a true three-column desktop layout without changing backend endpoints or the existing data flow.

## Rationale
The workbench needs a stable left-to-right workflow: source input and prompt seed on the left, editing and generation in the center, and live prompt cards on the right.

## Challenges
The component was already large and had to keep the existing stamp, editor, edit map, generation, checkpoint, and grid flows intact while the layout changed.

## Implementation Notes
- Added a three-column shell in `src/components/ImageWorkbench.jsx`
- Moved source context fields and compact prompt snapshots into the left column
- Kept the workspace controls and the four main cards in the center column
- Moved live Stable Diffusion, ChatGPT, and Gemini prompt cards into the right column
- Updated `src/styles/workbench.css` for the new layout and responsive collapse points

## Follow-Up Items
- Verify the layout visually in a browser
- Watch for any spacing issues in the center column on narrower desktop widths
