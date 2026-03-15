---
name: "game-mechanics-validator"
description: "Verifies game logic through unit tests and automated gameplay simulations."
version: "1.0.0"
---

# Game Mechanics Validator Skill

## The Validation Loop
1. **Read the Plan:** Load `.agent/plan.md` to find the "Definition of Done".
2. **Write a Failing Test:** Create a Vitest or Playwright test that simulates the player's action.
3. **Analyze Implementation:** Check the game's `useEffect` and event handlers.
4. **Verify Playability:** Run the test. If it fails, you must fix the code, not the test.

## Automated Gameplay Simulation
- Use scripts to simulate "Speed-Playing" (running 100 turns in 1 second) to check for race conditions or state desyncs.
- Confirm that the "Play Again" button resets the state to exactly the initial values.