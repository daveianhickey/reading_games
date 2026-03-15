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
