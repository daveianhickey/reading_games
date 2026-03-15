---
name: "kid-safe-a11y"
description: "Ensures the game is accessible to children with diverse needs."
version: "1.0.0"
---

# Kid-Safe Accessibility Skill

## Core Requirements
- **Focus Indicators:** Interactive game elements must have a thick, high-contrast focus ring (min 4px).
- **Screen Readers:** Every game object (e.g., "The Blue Apple") must have a descriptive `aria-label`.
- **Keyboard Play:** The entire game must be playable using only the `Spacebar` and `Arrow Keys`.
- **Motion:** Respect `prefers-reduced-motion` settings for sensitive users.

## Checklist
- [ ] Are buttons large enough for "fat finger" touch? (Min 48px)
- [ ] Is the contrast ratio for text at least 4.5:1?