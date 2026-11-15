# Torch Quest – Design Document

Status: **all five worlds built** (25 levels and 5 bosses), with Training Bay and the Gold
sentence gate. Code: `quest/`, tests: `test-quest.js`. What is built and what is not is listed
in §11. The parent's decisions are in §12.

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
| 1 Scrap | **Hear it, find it** | Radio says the word. The other plates start the same and are as long, but differ a lot after the first letter (*buses / bells / barks*). | Linking the spoken word to its print. |
| 2 Copper | **Look-alikes** | Same, but the other plates are near-misses (*buses / boxes / bikes*, *rail / real / reel*). | Reading the whole word, not the first letter. |
| 3 Silver | **Flash and find** | No voice. The word shows on a screen for 1.5 s, then hides. Then 3 look-alike plates. | Holding the spelling in memory. This is the memorising step. |
| 4 Gold | **Read it cold** | No voice. A sentence with a gap and a picture (“a ___ with a red door” 🏠). (*Build it* from letter blocks: not built yet.) | Reading for meaning. |

The number of plates comes from the world (3 in Worlds 1–2, 4 from World 3, §8a).

GPC gates work the same way with decodable words: the radio says “chomp”, the plates are
*chomp / chimp / champ*. At tier 4 the gap sentence comes from the item's clue in the curriculum;
decodable words have no clue sentence, so at Gold they stay flash-and-find.

**Fair plates.** A hear-it gate never shows a word that sounds the same as the target
(*to / too*, *there / their*, *would / wood*): he cannot tell those apart by ear, so it would be
a coin toss. A sentence gate is the opposite: there the sound-alike is the best test of all, so
*there* is always tested against *their* (“the cat is over ___”) and the other way round.
Sentence gates never use another tricky word as a wrong plate, because many would also fit the
gap (*his / her / my* in “___ dog is big”).

**Two kinds of words.** Keep them apart in every future change:

| | Target words | Wrong-plate words |
| --- | --- | --- |
| What they are | What he is learning | Words that are never the answer |
| Where they come from | **Only** the school lists: focus words and focus sounds (`docs/curriculum/year1-focus-weak-spots.md`), each sound practised through decodable example words | Chosen by hand for this game, **not** from school, each checked as decodable |
| Where they live | `WORLDS` in `quest/content.js` (157 different words across 5 worlds) | `WORD_BANK` in `quest/wordbank.js` (~600) and the older `DISTRACTOR_WORDS` in `quest/content.js`; target words also serve as wrong plates for each other |
| Spoken, tested, scored, made into blocks | Yes | Never |
| Change them when | The school's list changes | A gate lacks fair wrong plates (§5a) |

Wrong plates are picked by code, not written per gate, following the rules in §5a. Bank words
must be real, everyday words a 5-year-old might meet, decodable, nothing rude, scary or adult,
not a sound-alike of a target (add the pair to `HOMOPHONES` in `quest/content.js`), and in lower
case. Adding a word to the bank never changes what he learns. Pruning it is safe: the tests
report any target left without enough partners.

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

### 5a. No shortcuts: first letter and length

**What he found.** Guessing was solved, so he found two smarter shortcuts. Hearing “buses”, he
tapped the only plate starting with *b*. Or he tapped the plate whose length matched how long
the word sounded (*buses* among *be / we*). Both show he is reading a little, which is good, but
neither needs the whole word, so the word was not being learned. His screenshot showed both at
once: *be / thump / we*, where first letter or length alone gives the answer.

**The rules.** Every gate, in every world and tier, now follows four rules (`quest/gates.js`):

1. **Same start.** Every wrong plate starts with the target's first letter: *buses / bells /
   barks*, *thump / thank / think*, *children / chickens / cheering*. Two-letter words are the
   exception: there every plate has two letters and at least one starts the same (*to / ta /
   so*), because the two letters together *are* the reading.
2. **Same length.** Plates are exactly as long as the target whenever real words allow, never
   more than one letter off, and at least one wrong plate is always exactly as long.
3. **Same ending where possible.** As many wrong plates as possible also end like the target
   (*buses / boxes / bikes*), so first letter + last letter + length still leaves him needing
   the middle of the word.
4. **No odd-one-in.** When every wrong plate is built to look like the target, the target can
   end up the plate that looks most like all the others, which is a shortcut of its own. The
   picker avoids that; a test bot that always picks the most typical plate scores below random.

Plates also give nothing away on screen: every plate in a gate is the same size and uses the
same font size (set by the longest word), so a long word does not get a bigger or smaller box.

**Alien words.** Where there are not enough real words (only two-letter words such as *to*, *go*,
*we*), one made-up word fills in, like the “alien words” in the Year 1 phonics screening check:
*ta*, *ti* for *to*. At most one per gate. They are built so they can never sound like the
target (a consonant is swapped, never a vowel or a digraph; two-letter words avoid vowels that
could say the same sound), they use only letter patterns found in real words, and a rude-word
filter checks them.

**Learning from a miss.** After a wrong answer, the two words are shown side by side with the
letters that differ underlined (✗ *bells* / ✓ *buses*), and the right word is said. The lesson
is “look past the first letter”, shown rather than told.

**Proof.** `test-quest.js` plays every stage with shortcut players that only know how the word
starts, how long it sounds and how it ends. Per gate, on words of 3+ letters:

| Shortcut player | Right first time | Finishes a stage |
| --- | --- | --- |
| Random tapping | 30% | 2.5% |
| First letter | 31% | 2.8% |
| Length | 30% | 2.5% |
| First letter + length | 31% | 2.8% |
| Most typical plate (odd-one-in) | 25% | 1.1% |
| First + last letter + length | 41% | 10.5% |

The first four are no better than random, which is the goal. The last player is already doing
most of the reading (first letter, last letter and length), and a few targets (*you*, *was*,
*her*) have no real word that starts, ends and measures the same; it still has to read the
middle of most words. The tests fail if any shortcut drifts above these limits.

**Layout.** On an upright phone the word gate now sits in the empty space below the game
instead of on top of it, with big full-width plates, so it no longer covers Torch or the
progress bar. Long words never spill out of their plate.

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
- **Fall down a hole:** a bump or fall never costs a heart. After a fall Torch comes back
  about 140 px (roughly 3 cm on a phone) before the hole, never on top of an earlier obstacle,
  and stands still for half a second so he can see the hole coming. Two falls into the same
  hole and Clunk lays a plank over it.
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
`docs/curriculum/year1-focus-weak-spots.md`: 15 GPCs and 55 words (a test checks nothing is
missing). Levels 1–4 of a world introduce 2–4 new tricky words and one or two sounds; level 5 is
a sound-only review level, which gives a breather before the boss. Every level also mixes in
3 review words from anywhere earlier in the game, weakest and rustiest first.

| Level | 1 | 2 | 3 | 4 | 5 (sounds review) |
| --- | --- | --- | --- | --- | --- |
| **World 1 Scrap Yard** | the, to, go · ch | into, of, put · th | pull, push, he · nk | we, me, be · ch, th | nk, th, ch |
| **World 2 Rain Rail** | was, her, my · ai | you, they, all · igh | are, ball, tall · oo (spoon) | his, buses · ai | igh, oo (spoon) |
| **World 3 Dark Park** | when, what, said · ar | so, have, were · ur | out, like · oo (book) | some, come · or | ar, ur, oo (book) |
| **World 4 Oil Port** | there, little, one · oi | do, children, love · ear | oh, their, people · air | oi, ear | air, oi, ear |
| **World 5 Storm Tower** | Mr, Mrs, your · er | ask, asked, should · ure, er | would, could, house · er | mouse, water, want, very · ure | er, ure |

Sounds are practised through 2–5 decodable words each, mostly from the “story word ideas”
column of the focus list (ch: *chop, chip, rich, much*), all checked with the `whyReadable`
checker. Level ids (`1-1`…`5-5`, `1-boss`…) are saved progress and must never be renumbered.

### 8a. The skill ladder: what gets harder, world by world

Two things make the game harder. Each **word** gets harder as its block climbs (§4, §6). The
**worlds** also ask more as he goes, so a later world is harder even for a word he has just met:

| | W1 Scrap Yard | W2 Rain Rail | W3 Dark Park | W4 Oil Port | W5 Storm Tower |
| --- | --- | --- | --- | --- | --- |
| Plates per gate | 3 | 3 | **4** | 4 | 4 |
| Easiest gate | hear it | hear it | **look-alikes** | look-alikes | look-alikes |
| Mid-level flag | yes | yes | **no, full level** | no | no |
| Jumps | small gaps | wider gaps | **double crates** | more of both | widest |
| Boss fuse | 12 s | 11 s | 10 s | 9 s | 9 s (12 balls) |
| Boss door | 6 Copper blocks | 10 Copper | **4 Silver** | 8 Silver | **4 Gold** |

Why these steps:
- **4 plates from World 3** cut lucky guessing from about 1 in 3 to 1 in 4 per gate. Measured
  over 1,000 bot runs per stage, a pure guesser finishes a World 3–5 level under 1% of the time
  (World 1–2: about 6% with the flag, 2% without).
- **Look-alike floor from World 3.** New words no longer get the easy “clearly different” plates:
  by then he has had two worlds of practice at telling *was* from *saw*.
- **The flag goes at World 3**, as the parent decided: mid-level in the early worlds, the full
  level later.
- **Boss doors need mastered blocks, not just stars.** Stars show he can finish levels; blocks
  show he can read the words *on different days*. Silver needs at least 2 days and Gold at least
  3 (one step per day), so Worlds 3–5 cannot be rushed in one sitting. This is the long
  incentive to memorise.
- **Jumping stays forgiving.** Gaps widen and crates stack, so the running part keeps some
  challenge, but a bump never costs a heart and an obstacle gives way after two bumps. Reading
  stays the only thing that decides a level.

### 8b. Bosses

Each world ends with a boss: one of Darkstorm's drones (Grabber, Drizzle, Shade, Gusher) and
finally Darkstorm himself. The drone hovers above the course and drops spiky scrap balls. Each
ball is a gate: pick the right word to zap it back up and knock a bar off the drone's health.

- 10 balls (12 for Darkstorm), drawn from **every** word of the world, weakest first.
- 3 hearts, no flag.
- **A fuse**: once the plates unlock, a bar burns down (12 s in World 1, 9 s in World 5).
  Letting it burn out counts as a wrong answer. This is the only time pressure in the game,
  and it is generous: a careful reader needs 2–4 s. It exists so bosses test words he knows
  quickly, not words he can puzzle out slowly.
- Beating a boss opens the next world. The drone flies off covered in oil, never hurt.
- A beaten boss stays open on the map, even if a block later slips back a step.

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
| `quest/gates.js` | Pure logic: build a gate for an item at a tier with the fair-plate rules (§5a), plate positions, alien words. |
| `quest/wordbank.js` | Wrong-plate words only (§4, “Two kinds of words”). |
| `quest/level.js` | Level generator: strings terrain segments and gates together from a seed. |
| `quest/runner.js` | Canvas 2D game loop (fixed timestep), Torch physics, collisions, camera, sprites. |
| `quest/index.js` | DOM layer over the canvas: plates (real buttons, so they are crisp and accessible), hearts, map, boss fuse, Training Bay. |
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
   look-alike gates (Copper), flash-and-find gates (Silver), hearts, the mid-level flag, stars
   that unlock levels, overheat, mastery with the one-tier-a-day rule and rust, the block wall,
   a "words on this run" card before each level, and the guessing-bot test. He loved it.
2. **Five worlds (built):** all 25 levels and 5 bosses (§8), the skill ladder (§8a), a world
   look each (scrap yard at sunset, rainy railway, night park, harbour, purple storm), boss
   drones with a fuse (§8b), the map with boss-door requirements, the Training Bay (§7), the
   Gold *read it in a sentence* gate (§4), no sound-alike plates in hear-it gates, and the
   respawn after a fall moved further back (about 3 cm on a phone, with a short pause).
3. **Not built yet:** the Gold *build it from letters* gate, the quiet word swap after four
   fails, mystery crates, Torch's Workshop (bolts are collected but cannot be spent yet),
   music, the grown-up's progress page.

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

Still open: jumping gets a little harder in later worlds (wider gaps, stacked crates) but
never costs a heart. If he finds the jumping frustrating or too easy, say so: it is one
setting per world (`obstacles` in `quest/content.js`).

---

## 13. Keeping him keen (partly built)

The fair-plate rules (§5a) made the gates honest, which also made them harder. He needs more
reason to push through the harder reading, and more fun around it. Three asks from the parent:
a hint tool, more exciting Copper / Silver / Gold, and richer gameplay.

**The golden rule for everything below:** fun is *earned by reading* or *neutral to it*. Nothing
may make a gate easier to guess, and the shortcut-player tests (§5a) must stay green with every
new feature switched on. Today bolts are collected but cannot be spent, and word tiers are only
a label on the map; most ideas below give those two things a purpose.

### 13a. Hint tool: Clunk's Scanner

A scanner button beside the 🔊, run by Clunk. It helps him *decode*, never tells him the answer.
Hints cost bolts, which gives the running and jumping a point. Three steps, each a separate tap:

| Step | What it does | Cost | Why it is not a shortcut |
| --- | --- | --- | --- |
| 1. Slow-mo | Says the word again, slowly. | Free | Same information as 🔊. |
| 2. Chunk | Splits every plate into its sound chunks with gaps and colours: *b·u·s·e·s*, *ch·o·p*, *n·igh·t*. Digraphs stay together and glow. | 5 bolts | It helps him sound out every plate equally; he still has to match one to the word he heard. |
| 3. Zap one | Clunk zaps one wrong plate off the board. | 15 bolts, once per level | Leaves two or three plates, which all still follow the fair-plate rules. |

- **A hinted answer keeps his heart but does not tick the word's block** (no progress towards
  Copper, Silver or Gold). Hints are a rescue, not a route to mastery.
- No hints in Gold sentence gates, or on boss stages after the fuse starts (bosses test
  speed).
- The Training Bay (§7) stays the free, no-cost way to learn a word he keeps missing.

### 13b. Copper, Silver and Gold that feel like treasure

**The Forge.** At the flag, any word that went up a tier goes into the forge instead of a line
of text. He taps to hammer it (3 taps, sparks, clang), the block glows and is said aloud, and it
pops out in its new metal. It is short, physical and celebratory, and it repeats the word once
more. Silver and Gold get bigger effects (Gold: fireworks and a fanfare).

**Each tier unlocks something real**, so a block is worth chasing:

| Tier | What he gets |
| --- | --- |
| Copper | The block can be used in Torch's Workshop (§13d). |
| Silver | A **Torch part**: each 5 Silver blocks unlocks a new look (silver visor, chrome arms, jet boots, tail lights…). |
| Gold | Gold blocks shine in the Workshop, and a world with all its words at Gold earns that world's **trophy** and a sticker. |

**Morning delivery.** The one-step-a-day rule (§6) is currently invisible. Make it a moment: a
word that hit its 3 ticks waits in the forge overnight, and the next day Torch Quest opens on a
**delivery screen** where the new Silver and Gold blocks roll off a conveyor. It turns waiting
into something to look forward to and brings him back the next day. There is no streak to lose.

**Mystery crate at every flag** (already in §9, not built): bolts, a sticker or a Workshop part,
at random. Variable rewards are what keep ADHD attention (design guidelines).

### 13c. Gameplay that is more fun

Keep the core rule (bumps never cost hearts; reading decides the level), and make the running
part worth playing:

1. **Reading powers Torch up (Turbo).** Three first-try right answers in a row fill a power bar,
   and Torch **transforms into his car** for the next stretch: faster, smashes crates, pulls
   bolts in like a magnet, and leaves flames. A wrong answer ends it. This links good reading to
   the most fun moment of the game, and uses the robot-to-car transform from the stories.
2. **Hold to jump higher.** A quick tap is a hop and a held tap a big jump. It is a small
   timing skill that makes the platforming feel like a real game, and still uses one thumb.
3. **New things on the course**, one or two per world so each world feels new:
   - Springs that launch him to a high route with extra bolts.
   - Drones he can bounce on (stomp, boing, bolts).
   - Moving platforms, rails to slide along (Rain Rail) and oil slicks (Oil Port).
   - A secret bonus door per level, only reachable in Turbo.

   None of these can cost a heart. A miss costs bolts or time.
4. **Rescue a friend.** Each level has a trapped robot friend at the flag. Every right answer
   powers the rescue beam, and with all gates done the friend is freed and joins the crew
   picture on the map.
5. **Bolt rain bonus.** After a 3-star level, 10 seconds of bolts falling from the sky to catch:
   pure fun and a cheap, exciting reward.
6. **Better bosses.** Bosses get 3 phases (the drone changes colour and moves faster) and a
   proper defeat animation.

### 13d. Torch's Workshop (the long goal)

A small grid where he builds a base out of his word blocks (Minecraft-style) plus parts from
crates and the shop. Placing a block says its word. No reading test and no failure: it is his
space, and it is why he wants more blocks and better metals. Gold blocks shine and some parts
need Gold (a rocket pad needs 3 Gold blocks).

### 13e. A shop for bolts

Bolts finally buy things:
- Hints (13a).
- Torch paint jobs and decorations.
- **Helpers that make running easier but never reading:** a bolt magnet, a one-bump shield and
  a longer Turbo.

Prices are tuned so a good level buys one small thing.

### 13f. What is built (parent's choice: Turbo, and Forge + mystery crates)

- **Turbo (13c.1), built.**
  - Three right answers in a row fill the ⚡ meter in the HUD, and Torch transforms into his car (pixel car with a flame trail, an engine roar and “⚡ TURBO!”).
  - In car mode he runs about 60% faster, smashes crates for a bolt instead of bouncing off, and pulls in bolts from about three times as far.
  - The next wrong answer, or going back to the flag, ends it.
  - It never touches the gates: the same seed gives the same plates with or without Turbo (tested), and every course can be cleared at car speed (tested).
  - Code: `TURBO_STREAK` and `run.turbo` in `quest/run.js`; `setTurbo` in `quest/runner.js`.
- **The Forge (13b), built.**
  - At the flag, each word that went up a tier this run gets a forge screen: the block sits on an anvil in its old metal, and he taps 🔨 three times (sparks, clangs).
  - It comes out in its new metal with a glow, and the word is said aloud.
  - Gold gets bigger sparks, the slam sound and a fanfare.
- **Mystery crate (13b), built.**
  - After the forge, a wobbling crate: tap to open. Usually 5 or 10 bolts, sometimes a 25-bolt pile, sometimes a sticker from the hub's sticker collection.
  - A 3-star level doubles the sticker chance (30% instead of 15%); a boss always gives a sticker, or 30 bolts if he owns them all.
  - Code: `quest/rewards.js`.
- **Not built yet:** hints (13a), Silver Torch parts and the morning delivery (13b), course elements and bolt rain (13c.2–6), the Workshop and shop (13d, 13e).

### 13g. Suggested build order

1. **First (biggest effect for the effort):**
   - Turbo transform for a 3-in-a-row reading streak (13c.1).
   - Clunk's Scanner hints paid in bolts (13a).
   - The Forge ceremony at the flag (13b).
   - Mystery crates (13b).

   Together these give bolts a use, reward reading streaks with the most fun moment, and make
   tier-ups feel big. Then watch him play.
2. **Next:**
   - Hold to jump, springs and stompable drones (13c.2–3).
   - Torch parts for Silver and the morning delivery (13b).
   - Bolt rain (13c.5).
3. **Later:**
   - The Workshop and shop (13d, 13e).
   - Rescue a friend (13c.4).
   - Boss phases (13c.6).

Tests to add with each step:
- The shortcut players still do no better than random with hints and Turbo switched on.
- A hinted answer never ticks a block.
- No new course element can cost a heart.
- Every course is still finishable without jumping well.
