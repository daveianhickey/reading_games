# Game Plan: Bubble Pop Mechanics

## 1. The Goal
Ensure bubbles spawn correctly and animate upwards across the screen without vanishing or failing to render. Validate the animation loop logic.

## 2. Feature Breakdown
- **Bubble Entity Configuration:** Bubbles should be added to `#game-area` with valid starting coordinates (`bottom: -150px`).
- **Animation Loop:** The `requestAnimationFrame` loop correctly computes `deltaTime` and updates the `bottom` and `left` CSS properties.
- **Garbage Collection:** Bubbles that exceed `areaHeight + 150` are removed from the DOM and state array.

## 3. State Schema
- `lastTime`: `number` (Timestamp from requestAnimationFrame)
- `bubbleSpawnTimer`: `number` (Accumulator to spawn every 1.5s)
- `bubbles`: `Array<{popped: boolean, speed: number, wobble: number, wobbleSpeed: number, style: CSSStyleDeclaration}>`

## 4. Definition of Done
- A Vitest/JSDOM test runs the `initBubblePop` function.
- We simulate `requestAnimationFrame` ticks.
- The test asserts that bubbles are created and attached to the `#game-area` DOM element.
- The test asserts that after 1 second, the `bottom` string has increased.

---

# Game Plan: Year 1 Phonics Games

## 1. The Goal
A Year 1 learner (5–6, ADHD) practises Phase 2–5 GPCs and tricky words in five short-loop games.
Design rules: `docs/year1-game-design-guidelines.md`. Content: `docs/curriculum/`.

## 2. Feature Breakdown
- Practice selector (`phonics/selector.js`): choose sounds/words; the choice persists and every game uses it.
- Shared engine (`phonics/engine.js`): shell, speech, sfx, hints, rewards, stickers.
- Games: Iron Rig, Rocket Bay, Bot Snap, Orbit Defender, Mech Builder (`games/year1/`).

## 3. State Schema (localStorage)
- `y1Selection`: `string[]` of item ids
- `y1Progress`: `{ [itemId]: { correct: number, tries: number, last: number } }`
- `y1Stickers`: `string[]`; `y1RoundsWithoutSticker`: `number`
- `y1Garage`: `Array<{ main, trim, name }>` (built mechs)

## 4. Definition of Done
- [x] Each game completes a round in 3–5 correct interactions and shows a varied reward.
- [x] Wrong answers only wiggle/boing; no score loss or game over.
- [x] Games use the learner's selection, falling back to per-game defaults.
- [x] `npm test` passes; all five games play through in Chromium at tablet and phone sizes.
