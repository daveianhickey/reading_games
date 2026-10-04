# Year 1 Phonics Games – Design Guidelines

Audience: a Year 1 learner (age 5–6) with ADHD. Every Year 1 game in `games/year1/`
must follow these guidelines. They sit alongside (not instead of) the original
word games (Bubble Pop, Memory Match, Rocket Race, Sound Spotter).

## Developmental & Psychological Foundations

- **Cognitive load & working memory.** At this age working memory holds 2–3 chunks
  at once. Segmenting a word into graphemes (e.g. ch–i–p) uses much of that
  capacity, so game controls must stay lightweight: effort goes into decoding the
  GPC (Grapheme–Phoneme Correspondence), not into navigating the game.
- **Operant conditioning & micro-feedback loops.** Short loops build intrinsically
  motivated repetition: *Action → Immediate audio-visual reaction → Micro-reward →
  Reset.* Keep each loop under 10–15 seconds to prevent frustration and hold flow.
- **Dual-coding theory (Paivio).** Pair the written grapheme with a visual and/or
  auditory prompt (e.g. `a-e` with “cake by the lake” and a cake picture). This
  strengthens retention more than text-only drills.
- **Variable ratio reinforcement.** Predictable rewards lose excitement. Keep the
  progression loop short (3–5 matches) but vary the thematic payoff (the rocket
  sometimes flies to Mars, sometimes loops-the-loop, sometimes unlocks a new part).

## Implementation Rules

| Rule | What it means in code |
| --- | --- |
| **Audio-first** | Every grapheme/word tile speaks when touched or flipped (`sayItem`). A 🔊 button always replays the current prompt. |
| **Zero-failure penalty** | No game-over, no lives, no score loss, no harsh error sounds. A wrong answer gets a gentle “boing” + wiggle and the child simply tries again. |
| **Short sessions** | Each round needs 3–5 correct interactions, then a 3–5 s reward animation and a big “Again!” button. |
| **Thinking beats guessing** | Never punish a wrong answer, but make the considered answer pay better than tapping everything: first-try answers get the biggest feedback, and guessing costs a little time. (Added after the learner found Orbit Defender could be won by tapping every option.) |
| **Errorless scaffolding** | After two misses on the same prompt, or ~9 s of inactivity, the correct answer gently glows. |
| **One goal on screen** | Minimal text, large touch targets (≥ 64 px), progress pips instead of numbers. |
| **Accessibility** | Keyboard playable, visible focus rings, `aria-label`s on game objects, `prefers-reduced-motion` respected. |
| **Practice selection** | Games read the learner’s chosen items (the “What shall we practise?” screen). If nothing suitable is chosen, they fall back to the game’s default target content and show what is being practised. |

Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       Game Loop Engine                      │
├──────────────────────────┬──────────────────────────────────┤
│    Educational Layer     │         Engagement Layer         │
│  - GPC Target Selection  │  - Theme Mechanics (Space/Robot) │
│  - Audio Prompt System   │  - Visual / FX Feedback          │
│  - Progress Tracking     │  - Reward Animations             │
└──────────────┬───────────┴─────────────────┬────────────────┘
               └──────────────┬──────────────┘
                              ▼
                  10–15 s Micro-Feedback Loop
```

In this repo: the educational layer is `phonics/curriculum.js` (content) and
`phonics/practice.js` (selection, target pools, progress). The engagement layer is
`phonics/engine.js` (shell, speech, sound effects, hints, rewards, sticker
collection) plus each game’s own theme code.

## The Five Games

### Game 1 – “Iron Rig: Power-Up!” (Transformers / Gym) — `games/year1/iron-rig.js`
- **Loop:** match grapheme cards to power up a robot before it lifts a barbell.
- **Content (default):** Phase 2/3 GPC review (ck, qu, ch, th, ng, nk, …).
- **Mechanic:** memory snap with 6 face-down energy cards (3 pairs). Cards are
  previewed face-up briefly at the start to keep working-memory load low. Each
  card speaks its example word when flipped.
- **Micro-feedback:** a mechanical clink and an energy line fills on the robot.
- **Reward:** after 3 matches the robot lifts the barbell with particle trails and
  a random victory pose.

### Game 2 – “Rocket Assembly Bay” (Space / Transformer) — `games/year1/rocket-bay.js`
- **Loop:** tap (or drag) the correct pod to attach rocket parts.
- **Content (default):** Phase 5 split digraphs (a-e, e-e, i-e, o-e, u-e) and
  Harder to Read & Spell words (house, mouse, water, want, very).
- **Mechanic:** a spoken phrase or word plus a picture, with the target sound's letters
  blanked out of the written prompt (“c▢k▢ by the l▢k▢” 🎂, “h▢” 💇 for *hair*). Three
  debris pods drift in space; the child sends the spelling that fills the gaps to the
  rocket. All gaps are the same width, so a gap's size never shows how many letters go in.
  Because the letters are hidden, the child has to choose the spelling for the sound they
  hear (*air* vs *ir* vs *ar*) instead of matching letters by sight. Word rounds use a
  sentence clue with a gap (“a ___ with a red door”).
- **On a correct answer:** the letters drop into the gaps, highlighted, and the word or
  phrase is spoken again, which links the sound to its spelling.
- **Micro-feedback:** metallic lock sound; the rocket part snaps in and deploys.
- **Reward:** 4 parts → 3-2-1 countdown and blast-off to a random destination
  (Moon, Mars, loop-the-loop, asteroid blasting).

### Game 3 – “Bot Repair Snap” (Robot / Cyber) — `games/year1/bot-snap.js`
- **Loop:** snap when the chip under the scanner matches the target word.
- **Content (default):** high-frequency spelling words (the, to, no, go, put,
  into, of, pull, is, as). The learner’s own words can be chosen too.
- **Mechanic:** two screens — target word (left) and scanner (right). Chips ride
  a conveyor belt; the belt slows while a chip is in the scanner. Big green SNAP
  button (or Space).
- **Micro-feedback:** sparks, electric arc, the robot’s face lights up.
- **Reward:** 4 snaps reboot the robot: breakdance, hover-car or rocket boots.

### Game 4 – “Orbit Defender: GPC Defence” (Space / Galaxy) — `games/year1/orbit-defense.js`
- **Loop:** rotate the shield ring so the matching grapheme meets the asteroid.
- **Content (default):** Phase 5 alternative spellings (ay, ou, ie, ea, oy, ir, aw, ph, ew).
- **Mechanic:** a moon base with a 3-grapheme shield ring. An asteroid carries a
  catchphrase and picture (“a quirky shirt” 👕). Tap a grapheme (or ←/→ then
  Space) to swing it to the top; the asteroid then hits the shield. Asteroids
  never hit the base.
- **Micro-feedback:** the asteroid vaporises into star-dust with a punchy zap.
- **Thinking pays (anti-guessing):**
  - *First try:* full star-dust blast, a gold pip and a “⭐ First try!” pop, plus
    “🔥 N in a row!” for streaks.
  - *Wrong shield:* the asteroid bounces back (still no penalty), but the shield
    **recharges** for about 1.5 s (ring greys out, taps ignored) before the phrase is
    replayed. Tapping every option becomes the slow way to win: in testing, a round took
    about 17 s with careful play and about 45–75 s by tapping everything.
  - *Found after a guess:* the asteroid still clears but only fizzles, and the pip is silver.
- **Reward:** 5 asteroids → laser-grid wave clear and a finale. The end card shows ⭐ per
  first-try hit. **4+ first-try hits** earns the *Super Defender* finale (every effect at
  once) and a guaranteed sticker; otherwise a random hyper-drive / fireworks / rainbow finale.

### Game 5 – “Cyber-Lift Mech Builder” (Transformer / Gym / Mech) — `games/year1/mech-builder.js`
- **Loop:** load the correct weight plate into the hydraulic press to forge armour.
- **Content (default):** mixed tricky words (HRSWs + spelling words).
- **Mechanic:** the app speaks a word and shows a clue (picture or sentence with a
  gap). Three weight plates drop down; tap or drag the right one onto the press.
- **Micro-feedback:** the press slams, the screen shakes and a glowing armour piece
  snaps onto the mech avatar.
- **Reward:** 3 plates complete the mech (random colour scheme); it stands, roars,
  flexes and is parked in the garage gallery.

## Adding a new game
1. Put it in `games/year1/<name>.js` exporting `init<Name>(container, words, onBack)`.
2. Use `createShell` from `phonics/engine.js` and `buildPool` from `phonics/practice.js`.
3. Register it in the `YEAR1_GAMES` list in `main.js`.
4. Add a smoke test to `test-year1.js`.
