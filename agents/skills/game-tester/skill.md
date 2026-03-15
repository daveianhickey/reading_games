---
name: "game-tester"
description: "Use to create and run automated tests for game mechanics using Playwright."
version: "1.1.0"
---

# Game Tester Skill

## Testing Workflow
1. **Visual Check:** Use `page.screenshot()` to verify game elements are visible and not overlapping.
2. **Interaction Test:** Simulate clicks on game targets.
3. **Win Condition:** Verify that achieving the game goal triggers the "Success" state/animation.
4. **Logic Check:** Ensure the score increases by exactly 1 per correct action.

## Rules
- Always run `npx playwright test` after changing game code.
- If a test fails, do not ask for help immediately; use the "Healer" pattern to inspect the DOM and fix the selector.