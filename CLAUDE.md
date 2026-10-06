# reading_games – project context

Reading games for young children, built with vanilla JS + Vite (no framework).
`index.html` → `main.js` (hub + parent word setup) → games loaded on demand.

## Two families of games

1. **Word games** (`games/*.js`: Bubble Pop, Memory Match, Rocket Race, Sound Spotter).
   A grown-up types 3–10 words (stored in `localStorage.readingWords`); these games use those words.
   Memory Match says each card's word as it flips (and again on a match), and turns one card
   per round into a 🔊 sound card (says its word, shows no text),
   so matching it needs actual reading rather than shape-matching. It's a favourite, so keep
   changes to it small.
2. **Year 1 phonics games** (`games/year1/*.js`) for a Year 1 learner (age 5–6) with ADHD.
   They practise GPCs (grapheme–phoneme correspondences) and tricky words from the school
   curriculum, and don't need typed words. The learner picks what to practise on the
   **“What shall we practise?”** screen (`phonics/selector.js`, opened from the hub).

## Year 1 reference documents (read before changing Year 1 games)

- `docs/year1-game-design-guidelines.md`: developmental psychology basis and the rules every
  Year 1 game must follow (audio-first, zero-failure penalty, 3–5 interaction rounds,
  10–15 s feedback loops, variable rewards, errorless hints), plus the spec for all 5 games.
- `docs/curriculum/*.md`: curriculum content per school term, as given by the school.
  - `docs/curriculum/year1-autumn-term-1.md`: Autumn 1 revised/new Phase 5 sounds with
    catchphrases, the Phase 2 & 3 GPC tracker, HRSWs and spelling words.
  - `docs/curriculum/year1-common-exception-words.md`: the full Year 1 common exception
    words list (words already in Autumn 1 are reused, not duplicated).

## Year 1 code map

| File | Role |
| --- | --- |
| `phonics/curriculum.js` | Runtime copy of the curriculum (`TERMS` → sets → items). Single source for games. |
| `phonics/practice.js` | Educational layer: saved selection (`y1Selection`), `buildPool` (selection → game targets, falls back to game defaults), distractors, target sequencing, progress (`y1Progress`). |
| `phonics/engine.js` | Engagement layer: `createShell` (top bar, pips, 🔊, hints, reward overlay, timer cleanup), speech (`say`/`sayItem`), Web Audio `sfx`, particles, drag-and-drop, sticker collection. |
| `phonics/selector.js` | “What shall we practise?” picker. |
| `games/year1/iron-rig.js` | Game 1 – memory snap, Phase 2/3 GPCs. |
| `games/year1/rocket-bay.js` | Game 2 – catchphrase → pod, split digraphs + HRSWs. |
| `games/year1/bot-snap.js` | Game 3 – conveyor snap, spelling words. |
| `games/year1/orbit-defense.js` | Game 4 – shield ring, Phase 5 alternative spellings. |
| `games/year1/mech-builder.js` | Game 5 – press the right word plate, mixed tricky words. |
| `test-year1.js` | jsdom tests (`npm test`). |

Game module contract: `init<Name>(container, words, onBack)`. The game is registered in
`YEAR1_GAMES` in `main.js`.

## Adding a new term (e.g. Autumn 2)

1. Save the school’s list as `docs/curriculum/year1-<term>.md`, using the same layout as
   `year1-autumn-term-1.md` and noting a set id beside each section heading.
2. Add a new entry to `TERMS` in `phonics/curriculum.js`:
   - `{ id: 'y1-autumn-2', title: 'Year 1 · Autumn 2', doc: 'docs/curriculum/…', sets: [...] }`
   - GPCs: `gpc('grapheme', 'catchphrase', 'emoji')` (add `{ split: true }` for split digraphs
     such as `a-e`). Tracker-style GPCs with no catchphrase use
     `tracker(id, grapheme, exampleWord, emoji)`.
   - Rocket Bay blanks the sound's letters out of the phrase or example word automatically
     (`gapSegments`). Check the gaps are right (the curriculum tests list every prompt). Where
     the letters also appear without making the sound, mark the gaps by hand with
     `{ gaps: '[c]ycle in the [c]ity' }`. Avoid example words that are only the grapheme
     itself (e.g. use *hear* for `ear`), or the prompt is just a gap.
   - Words: `word('word', 'emoji', 'clue sentence with ___ for the gap')`.
   - **Item ids must be unique across all terms.** If a grapheme repeats with a different sound, use
     `grapheme-example` (e.g. `oo-book`). If a term re-lists an item from an earlier term,
     reuse the earlier item rather than defining it twice.
3. The new sets appear in the selector automatically. If a game should use the new content
   by default, update that game’s `DEFAULTS` list.
4. Update the counts in the curriculum test in `test-year1.js` and run `npm test`.

Optional per item: `audio: '/audio/ay.mp3'` plays a recorded clip instead of speech synthesis.
This is useful for pure phoneme sounds, which browser text-to-speech can’t say reliably.

## Commands

- `npm run dev`: Vite dev server
- `npm run build`: production build to `dist/` (served by `npm start` / Docker, deployed to Cloud Run)
- `npm test`: Year 1 test suite (`node test-year1.js`)
- `node test-runner.js`, `node test-bubble.js`: older word-game tests

## Agent skills

`agents/skills/*` holds project skills (game planner, mechanics validator, tester,
a11y, asset creator). `.agent/plan.md` holds the current feature plan.
