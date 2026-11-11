# reading_games – project context

Reading games for young children, built with vanilla JS + Vite (no framework).
`index.html` → `main.js` (hub + parent word setup) → games loaded on demand.

## Three strands

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
3. **Robot Stories** (`stories/`): short illustrated page-turning robot stories (Torch, Clunk,
   Hook, Airlift vs Darkstorm) written around the learner's school weak spots. Opened from the
   “Robot Stories” banner in the Year 1 section of the hub.

## Year 1 reference documents (read before changing Year 1 games)

- `docs/year1-game-design-guidelines.md`: developmental psychology basis and the rules every
  Year 1 game must follow (audio-first, zero-failure penalty, 3–5 interaction rounds,
  10–15 s feedback loops, variable rewards, errorless hints), plus the spec for all 6 games.
- `docs/curriculum/*.md`: curriculum content per school term, as given by the school.
  - `docs/curriculum/year1-autumn-term-1.md`: Autumn 1 revised/new Phase 5 sounds with
    catchphrases, the Phase 2 & 3 GPC tracker, HRSWs and spelling words.
  - `docs/curriculum/year1-oa-read-and-write.md`: the 'oa' Read and Write homework sheet
    (goat, boat, coat…), broken down into read / write / check tasks.
  - `docs/curriculum/year1-common-exception-words.md`: the full Year 1 common exception
    words list (words already in Autumn 1 are reused, not duplicated).
  - `docs/curriculum/year1-focus-weak-spots.md`: the learner's weak spots from school
    (15 GPCs + 48 HRSWs not yet secure), mapped to existing curriculum item ids.
- `docs/robot-stories-design.md`: design for **Robot Stories** (read before changing stories):
  short illustrated, page-turning robot stories written around the focus weak spots.
  Story rules, cast, art direction, reader UX, technical plan and open questions.

- `docs/torch-quest-design.md`: design for **Torch Quest** (not built yet): a side-scrolling
  platform adventure with hearts, a world map, bosses and per-word mastery. It deliberately
  replaces the zero-failure rule so that guessing cannot win. Read before building it.

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
| `games/year1/mech-builder.js` | Game 5 – drag the word plate into the gap in a sentence, mixed tricky words. |
| `games/year1/goat-boat.js` | Game 6 – 'oa' words: read the word → tap its picture, then write it (picture → letters round `oa`). |
| `test-year1.js` | jsdom tests (`npm test`). |

### Robot Stories code map

| File | Role |
| --- | --- |
| `stories/index.js` | `STORIES` in reading order (each unlocks the next). |
| `stories/episodes/*.js` | One story each: targets, star words, crew, pages (sentences + scene + alt), quiz. |
| `stories/decodable.js` | Focus lists (15 GPCs, 55 words) and the word checker (`unreadableWords`, `gpcHits`, `findGpc`). |
| `stories/robots.js` | SVG cast: `robotSVG(id, { mode: 'robot' | 'vehicle', holding })`. |
| `stories/reader.js` | `initRobotStories(container, words, onBack)`: shelf, meet page, reader, quiz, reward, progress (`y1Stories`). Background list `BACKGROUNDS`. |
| `public/stories/bg/*.webp` | AI-generated backgrounds (no characters or text). |
| `test-stories.js` | Content rules + reader tests (part of `npm test`). |

### Adding a Robot Story

1. Pick 2–5 GPCs from `FOCUS_GPC_IDS` and 4–8 words from `FOCUS_WORDS` (`stories/decodable.js`).
2. Copy an episode in `stories/episodes/`, write 10–20 sentences (1–4 per page, 3–10 words each),
   following the narrative shape in `docs/robot-stories-design.md` §3. Include one
   `interaction: { type: 'transform', robot }` page. Names go in `starWords`.
3. Each page's `scene` uses a background id from `BACKGROUNDS` and robots from `ROBOTS`. For a new
   background, generate it with the prompt pattern in the design doc §6, save it at 1200×800 webp in
   `public/stories/bg/`, and add it to `BACKGROUNDS`.
4. Add the story to `STORIES` and run `npm test`: the checker lists any word he can't read yet and
   any target used fewer than 3 times.

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
- `npm test`: Year 1 + Robot Stories test suites (`node test-year1.js && node test-stories.js`)
- `node test-runner.js`, `node test-bubble.js`: older word-game tests

## Agent skills

`agents/skills/*` holds project skills (game planner, mechanics validator, tester,
a11y, asset creator). `.agent/plan.md` holds the current feature plan.
