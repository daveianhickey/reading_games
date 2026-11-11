# Torch Quest – Design Document

Status: **first slice built** (World 1, levels 1–3, Scrap/Copper/Silver gates). Code: `quest/`,
tests: `test-quest.js`. What is built and what is not is listed in §11. The parent's decisions are in §12.

A fourth strand of the app: an old-school, side-scrolling platform adventure for a phone, with
a world map, hearts, bosses and a workshop to build. It is an original game in the platformer
genre, set in the Robot Stories world (Torch, Clunk, Hook, Airlift vs Darkstorm).

It exists because the current games have a ceiling. They are good ten-minute supplements, but:

- **They can be beaten by hammering.** Wrong answers cost nothing, so tapping everything is a
  winning strategy. We have patched this game by game (Orbit Defender's recharge, Mech
  Builder's drag), and each patch only slows it down.
- **Nothing lasts.** A round is 3–5 answers and then resets. There is no reason to *remember*
  a word tomorrow, so there is no pull towards memorising it.

Torch Quest fixes both with one rule:

> **Reading is the only way forward, and misreading is the only way to fail.**

---

## 1. Goals

1. **Skill is required.** A level cannot be passed by guessing (see the numbers in §5).
2. **Memory is rewarded over weeks.** Each word has its own mastery level that only rises when
   he reads it right on different days. Mastered words are what unlock the map and the workshop.
3. **Real progression and real failure**, in a form a five-year-old understands: hearts, a map
   with a path, a flag at the end, a boss at the top.
4. **Still built for ADHD.** Short loops, instant feedback, novelty, agency and no shaming. What
   changes is that mistakes now have a small, fair, visible cost.

Non-goals: free-roaming platforming that needs fast thumbs, voice recognition, new curriculum
content (everything comes from `phonics/curriculum.js`).

---

## 2. What changes from the Year 1 game rules

`docs/year1-game-design-guidelines.md` still governs the six Year 1 games. Torch Quest keeps
most of it and deliberately breaks one rule.

| Guideline | In Torch Quest |
| --- | --- |
| Audio-first | **Kept, but controlled.** The game speaks the target. Answer plates do *not* speak when touched, because that lets him listen instead of read. |
| 10–15 s feedback loops | **Kept.** A word gate arrives every 10–15 s of running. |
| Short sessions | **Kept.** A level is 8 gates, about 3 minutes. Losing costs at most those 3 minutes (half that in the early worlds, which have a mid-level flag). |
| Variable rewards | **Kept.** Mystery crates, different boss, new workshop parts. |
| One goal on screen, big targets | **Kept.** One gate at a time, plates ≥ 72 px, hearts and a progress bar instead of numbers. |
| Thinking beats guessing | **Made strict.** One answer per gate. A wrong answer is final for that gate. |
| Errorless scaffolding (glowing hints) | **Moved.** No hints inside a level. Teaching happens in the Training Bay (§7), which he is sent to after failing. |
| **Zero-failure penalty** | **Replaced** by small, fair failure: 3 hearts per level, lose them all and the level restarts. No harsh sounds, no lost progress on the map, no lost collection. |

Why failure is safe here: it is short (≤ 3 minutes lost), it is explained (“you lost a heart
because that plate said *was*, not *saw*”), it is followed at once by help, and nothing he has
earned is ever taken away.

---

## 3. The game in one minute

Torch runs from left to right on his own through a pixel-art level. **One thumb plays the whole
game.**

- **Tap anywhere** to jump (over gaps, crates and Darkstorm's grumpy drones). This is the light
  “video game” layer. Bumping into something bounces Torch back and spills a few bolts (the
  coin). It never costs a heart, and an obstacle gives way after two bumps (the crate smashes,
  a plank drops over the gap), so jumping can never stop him reaching the next word.
- Every 10–15 seconds the path is blocked by a **word gate**. Time slows, Torch's radio says a
  word, and three plates slide in. He taps the plate with that word. Right: the gate opens and
  he runs on. Wrong: the plate crumbles and he **loses a heart**.
- 8 gates, then the flag. Hearts left at the flag become **stars** (3 hearts = 3 stars).
- Stars open the path on the **world map**. Each world ends with a **boss**. Mastered words
  become **blocks** he builds with in **Torch's Workshop**.

```
 ♥ ♥ ♡        ▓▓▓▓▓▓▓▓░░░░░░░░ ⚑            🔩 42
┌───────────────────────────────────────────────────┐
│                        🔊 “was”                   │
│                                                   │
│              ┌─────┐  ┌─────┐  ┌─────┐            │
│              │ saw │  │ was │  │ wag │            │
│              └─────┘  └─────┘  └─────┘            │
│      🤖 ➜                                 ║gate║  │
│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀│
└───────────────────────────────────────────────────┘
```

Why an auto-runner and not free movement with a d-pad: on-screen d-pads are hard for small
hands, and a d-pad game would test thumbs. Here the only skill that decides the level is reading.

---

## 4. Word gates: four kinds, getting harder

Each gate tests one item (a tricky word, or a decodable word carrying a focus GPC). Which kind
of gate he gets depends on that word's mastery tier (§6), so the game gets harder word by word.

| Tier | Gate | What he does | What it trains |
| --- | --- | --- | --- |
| 1 Scrap | **Hear it, find it** | Radio says the word. 3 plates with clearly different words (*was / the / go*). | Linking the spoken word to its print. |
| 2 Copper | **Look-alikes** | Same, but the other plates are near-misses (*was / saw / wag*, *there / their / three*). | Reading the whole word, not the first letter. |
| 3 Silver | **Flash and find** | No voice. The word shows on a screen for 1.5 s, then hides. Then 3 look-alike plates. | Holding the spelling in memory. This is the memorising step. |
| 4 Gold | **Read it cold** | No voice. A sentence with a gap and a picture (“a ___ with a red door” 🏠), 4 plates. Or: **build it** from letter blocks with 2 decoys. | Reading for meaning and spelling from memory. |

GPC gates work the same way with decodable words: the radio says “chomp”, the plates are
*chomp / shop / thump*. At tier 4 the gap sentence comes from the item's clue in the curriculum.

Look-alike distractors are generated, not hand-written: same first letter, same length ± 1,
letters swapped or reversed (*was/saw*, *of/off*, *her/here*), drawn from curriculum words so
every plate is a real word.

---

## 5. Why hammering does not work

Rules that make guessing lose:

1. **One answer per gate.** There is no second tap. A wrong plate ends that gate, costs a heart,
   and the word comes back later in the level with new plates in new positions.
2. **Look first.** Plates are locked while the word is spoken (about 0.8 s). Taps during the
   lock are dropped, not queued.
3. **No free information.** Plates don't speak when touched, don't glow, and the right plate
   is never in the same position three times in a row.
4. **Overheat.** Three or more taps during a lock, or an answer faster than a human can read
   (< 0.4 s after unlock) twice in a row, makes Torch overheat: steam, a 2 s pause, and Clunk
   says “Slow down. Look.” It costs time, not a heart; the guessing itself costs the hearts.
5. **Stars gate the map, not level completion.** A lucky scrape through with one heart earns one
   star. The boss door needs most of the world's stars.

The numbers, for a level of 8 gates and 3 hearts with 3 plates per gate, measured by playing
each level 2,000 times with a bot (`test-quest.js`):

| Player | Finishes, full level | Finishes, with the mid-level flag |
| --- | --- | --- |
| Pure guessing | **about 2%** | about 6%, almost always with 1 star (2+ stars: under 1%) |
| Knows half the words, guesses the rest | about 48% | about 72% |
| Knows most (85%) | about 96% | over 99% |
| Knows them all | 100%, 3 stars | 100%, 3 stars |

The flag makes scraping through easier, which is why a run that used it earns only 1 star and
why stars, not finished levels, open the map: two 1-star levels do not open level 3.
The test fails if guessing ever finishes more than 10% (4% without the flag), so the property
cannot quietly regress.

---

## 6. Word mastery: the long game

Every item has a tier, shown as the material of its block: **Scrap → Copper → Silver → Gold**.

- A word moves **up** a tier after **3 first-try correct answers** at that tier.
- **Only one tier per word per day.** To reach Gold a word must be read right on at least three
  different days. This is spaced repetition, and it is what turns “got it right once” into
  “knows it”. In the game it is explained as: *blocks need a night in the forge*.
- A miss removes one of the 3 ticks. Two misses on the same word in one day drop it one tier
  (never below Scrap). Nothing else is ever taken away.
- Words not seen for a while go **rusty** (a visible rust patch on the block). Rusty words are
  put into the next levels first; one correct answer polishes them.

Each level's 8 gates are filled from: about 5 from that level's new words, 3 from earlier
words, weakest and rustiest first. So old words keep coming back for as long as he plays.

What mastery buys:

- **The map.** The boss door of each world needs most of its stars, and the next world also
  needs a number of **Copper** words. Later worlds need Silver.
- **The workshop.** Every block he owns can be placed. Gold blocks build the best things.
- **A page he can show a grown-up:** the block wall, with every word and its material.

---

## 7. Failing, and what happens next

- **3 hearts per level.** Five correct in a row repairs one heart (never more than 3).
- **A wrong answer:** the plate crumbles with a soft thud, a heart cracks, and the right plate
  lights up for a moment while the word is said: “That one is *was*.” Then he runs on.
  Feedback is information, not punishment.
- **No hearts left:** Torch powers down and the screen shows the words that tripped him, to tap
  and hear. The map, stars and blocks are untouched.
  - *Early worlds (World 1–2):* there is a **flag after gate 4**. If he powers down past it he
    may go back to the flag **once per try**, with the hearts he had there (at least 2). A run
    that used the flag earns 1 star at most.
  - *Later worlds:* back to the start of the level.
- **Fail the same level twice:** the retry button becomes **Training Bay**. This is a calm room
  with no hearts where the 2–3 words that beat him are taught the old way: said aloud, shown,
  tapped, hints allowed. About one minute, then straight back to the level. This is where the
  errorless scaffolding from the Year 1 rules lives now.
- **Fail four times:** the level quietly swaps one new word for an older one. He is never told.

Bosses (one per world, Darkstorm himself in the last): the boss sits at the top of a girder
tower and rolls **word barrels** down at Torch. Each barrel shows a word; three junction levers
are labelled; pull the lever with the same word the radio calls to send the barrel back up.
10 barrels drawn from the whole world, 3 hearts, barrels slowly speed up. It is the same gate
skill with gentle time pressure, used only here. Villains are never hurt: Darkstorm gets
covered in oil and flies off grumbling, as in the stories.

---

## 8. Worlds and content

Five worlds, each 5 levels and a boss (30 stages). Together they cover exactly the focus list in
`docs/curriculum/year1-focus-weak-spots.md`: 15 GPCs and 55 words. A level introduces 3–4 items.

| World | Focus GPCs | Focus words |
| --- | --- | --- |
| 1 Scrap Yard | ch, th, nk | the, to, go, into, of, put, pull, push, he, we, me, be |
| 2 Rain Rail | ai, igh, oo (spoon) | was, her, my, you, they, all, are, ball, tall, his, buses |
| 3 Dark Park | ar, ur, oo (book), or | when, what, said, so, have, were, out, like, some, come |
| 4 Oil Port | oi, ear, air | there, little, one, do, children, love, oh, their, people |
| 5 Storm Tower | ure, er | Mr, Mrs, your, ask, should, would, could, asked, house, mouse, water, want, very |

GPC items use 3–4 decodable words each, taken from the “story word ideas” column of the focus
list (ch: *chop, chomp, rich, munch*), and checked with the existing `whyReadable` checker.

With one tier per day, reaching Gold on a whole world takes at least a week of short sessions,
and the full game is a term's worth of play. Later: a bonus world built from the grown-up's
typed words, and new worlds as each school term's list arrives.

---

## 9. Look, sound, rewards

- **Look:** chunky 16-px pixel art, scaled up crisp; parallax backgrounds in the palette of the
  existing story backgrounds; the story cast as sprites. Torch can transform to car mode for
  speed-boost stretches.
- **Words are never in a pixel font.** Plates use the app's clear rounded typeface at ≥ 32 px,
  with school-style letter shapes (single-storey *a* and *g*). The game is retro; the print is not.
- **Sound:** chiptune loops and effects from Web Audio (extending `sfx` in `phonics/engine.js`).
  Speech uses the existing `say`/`sayItem`, including recorded clips where an item has `audio`.
- **Rewards:** bolts along the path (jump to grab them); a mystery crate at each flag (bolts, a
  sticker from the existing collection, or a workshop part); a new robot friend after each boss.
- **Torch's Workshop:** a small side-on grid where he places his word blocks and bought parts to
  build a base. Free building, no failure, no reading test. This is his space, and the reason
  to want Gold blocks.
- **Session shape:** after 4 levels in one sitting Torch needs a recharge and the game suggests
  the workshop or a story. This keeps sessions to about 12–15 minutes without a hard lock.
- **Accessibility:** Space/Enter jump, 1–2–3 keys pick plates, `prefers-reduced-motion` drops
  parallax and screen shake, landscape layout with a “turn your phone” prompt in portrait.

---

## 10. Technical plan

Vanilla JS and Vite like the rest of the app, no new dependencies.

| File | Role |
| --- | --- |
| `quest/content.js` | Worlds → levels → item ids (from `phonics/curriculum.js`), decodable words per GPC. |
| `quest/mastery.js` | Pure logic: tiers, ticks, one-tier-per-day, rust, picking a level's 8 gate items. Storage key `y1Quest`. |
| `quest/gates.js` | Pure logic: build a gate for an item at a tier, look-alike distractors, plate positions. |
| `quest/level.js` | Level generator: strings terrain segments and gates together from a seed. |
| `quest/runner.js` | Canvas 2D game loop (fixed timestep), Torch physics, collisions, camera, sprites. |
| `quest/ui.js` | DOM layer over the canvas: plates (real buttons, so they are crisp and accessible), hearts, map, Training Bay, workshop. |
| `quest/index.js` | `initTorchQuest(container, words, onBack)`, opened from a banner on the hub like Robot Stories. |
| `test-quest.js` | Added to `npm test`. |

Tests: mastery rules (including the day rule with a fake clock); every item in every world
exists in the curriculum; every decodable word passes `whyReadable`; every gate has exactly one
right plate and only real words; **a random-tapping bot finishes under 5% of 2,000 runs of each
level and a perfect bot finishes all of them**; a jsdom smoke test of start → gate → flag.

Sprites are drawn from small pixel maps in code for the first slice (no asset pipeline). If
that looks too plain, generate sprite sheets the way the story backgrounds were made.

---

## 11. Build order

1. **Slice (built):** World 1, levels 1–3. Running and jumping, hear-it gates (Scrap),
   look-alike gates (Copper), flash-and-find gates (Silver and, for now, Gold), hearts, the
   mid-level flag, stars that unlock levels, overheat, mastery with the one-tier-a-day rule
   and rust, the block wall on the map, a "words on this run" card before each level, and
   the guessing-bot test. **Now watch him play it** before building more. The questions that
   matter: does he slow down at gates, does losing a heart upset or motivate him, is 3
   minutes right, is the jumping too hard or too easy.
2. **Full loop (not built):** levels 4–5 and the boss of World 1, Training Bay, the Gold
   gate (read it cold / build it), the quiet word swap after four fails, mystery crates.
3. **Depth (not built):** worlds 2–5, workshop, drones, music, grown-up's progress page.

---

## 12. Decisions (from the parent)

1. **Failing:** a mid-level flag in the early worlds, the full level later (§7).
2. **Landscape only** is fine. The slice still plays in portrait, just smaller.
3. **One tier per word per day** is accepted.
4. **Voice:** browser speech for now; the parent may record the words later (an item's
   `audio` field already supports this).

Where progress lives: `localStorage` key `y1Quest`, in the browser on that one device. It
survives closing the tab, but not clearing site data, and it does not follow him to another
phone. Syncing across devices would need accounts and a server, which the app does not have.

Still open: should jumping get harder in later worlds, or stay simple so reading is the only
real test?
