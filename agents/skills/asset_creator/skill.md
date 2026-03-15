---
name: "asset-creator"
description: "Generates and manages assets and creates detailed prompts for external AI image/audio generators."
version: "1.0.0"
---

# Asset Creator Skill

## 1. SVG Generation (Direct Action)
- **Style:** Flat, vibrant, and "chunky" (rounded corners, thick strokes).
- **Optimization:** Always use `viewBox` and clean IDs.
- **Animation:** Use CSS keyframes for "idle" animations (e.g., a floating star or a bouncing button).

## 2. Image Prompt Engineering (External)
When the user needs a complex character or background:
- **Format:** Generate a detailed prompt in a code block for the user to copy-paste into an image generator.
- **Kid-Friendly Aesthetic:** Use keywords like "claymation style," "high-quality 2D vector art," "soft lighting," and "vibrant educational colors."
- **Consistency:** Reference a "Style Guide" so all generated images look like they belong in the same game.

## 3. Audio Synthesis Prompts
- Provide descriptions for UI sounds: "Short, high-pitched wooden 'pop' for button clicks" or "Sparkling synth chime for winning."

## asset management
- **Path Verification:** Before writing an `<img>` or `new Audio()` tag, run `ls public/assets` to verify the file exists.
- **Sound Logic:** Use small `.mp3` or `.ogg` files. Ensure sounds are preloaded.
- **Image Handling:** Prefer SVGs for icons to ensure they stay crisp on high-resolution tablets.

## Tasks
- "Audit assets": Generate a `references/asset-manifest.json` listing all available files and their dimensions/durations.

## Example Task
"Agent, I need a 'Gold Star' for the victory screen."
- *Action:* The agent will write the React SVG component directly into `src/components/Star.tsx` with a spinning animation.