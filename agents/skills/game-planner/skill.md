---
name: "game-planner"
description: "Breaks down high-level game ideas into technical specifications and a feature roadmap."
version: "1.0.0"
---

# Game Planner Skill

## The Planning Workflow (STRICT)
Before writing any code, you MUST create or update a `.agent/plan.md` file with:
1. **The Goal:** What does the player need to learn/do?
2. **Feature Breakdown:** List specific components (e.g., "ScoreBoard", "DraggableLetter").
3. **State Schema:** Define every variable in the game state (e.g., `isDragging: boolean`).
4. **Definition of Done:** A checklist of what "working" looks like for this feature.

## Rules
- **No Orphan Features:** Every feature must have a corresponding test case in the plan.
- **Dependency Mapping:** If a feature depends on an asset (sound/image), flag it for the `asset-concierge`.