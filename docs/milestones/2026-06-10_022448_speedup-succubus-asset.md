# Speedup Succubus Asset

## Context
The intro scene still used a drawn blue placeholder for the speedup waifu. The user provided a finished PNG in Downloads, and the character was still visually sinking into the floor when placed naively.

## Decision
Import the image as a new scene asset named `wb_speedup_succubus.png`, cut out the green background, shrink it to a smaller square version, and replace the placeholder drawing in `WorldBuildingScene` with the real image anchored to the floor line.

## Rationale
- The new art should be the actual scene object, not just a local download.
- A smaller asset reduces bundle weight and keeps the intro leaner.
- Anchoring the sprite at the floor avoids the “falls through the floor” look.

## Challenges
- The source image had no transparent border, so simple bottom-origin placement was enough to reveal the floor issue but not enough to compress it meaningfully.
- The scene originally used a hand-drawn graphics placeholder, so the text and glow positions had to be re-tuned for the real image.

## Implementation Notes
- Copied `D:\Downloads\ChatGPT Image Jun 10, 2026, 02_16_27 AM.png` into `public/assets/scenes/wb/wb_speedup_succubus.png`.
- Keyed out the green background and resized the image to `640x640` for a smaller repo asset.
- Added `wb_speedup_succubus` to the manifest so `PreloadScene` loads it automatically.
- Replaced the placeholder graphics in `WorldBuildingScene` with the PNG, using bottom origin and floor-aligned positioning.

## Follow-up
- Verify the speedup waifu sits correctly in the browser and still reads as a separate interactive beat.
- If the pose feels too high or too low, adjust only the `y` anchor in `WorldBuildingScene`.
