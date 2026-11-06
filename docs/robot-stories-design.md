# Robot Stories – Design Document

Status: **first release built** (3 episodes). Decisions are recorded in §10. Code: `stories/`,
tests: `test-stories.js`.

A new strand of the app: short, illustrated, page-turning **robot stories** that a Year 1
learner (age 5–6, ADHD) reads himself. The stories are written around his school
weak spots (`docs/curriculum/year1-focus-weak-spots.md`) so that reading a story he wants
to finish is the practice.

It sits beside the two existing families (word games and Year 1 phonics games) and
follows the same rules as `docs/year1-game-design-guidelines.md` wherever they apply.

---

## 1. Goals

1. **Practise the weak spots in connected text.** The games drill single sounds and words.
   Stories make him use the same sounds and words in sentences, which is the step school
   is working towards (fluency and comprehension).
2. **Make him want the next page.** For a 5-year-old with ADHD the hard part is not the
   reading, it is staying with it. Every design choice below is aimed at that.
3. **Be honest reading.** Words must be decodable or on his focus list. No guessing from
   pictures, no passive listening.

Non-goals (for now): writing/spelling, free-form story creation by the child, voice
recognition of his reading.

---

## 2. Research basis (ADHD + early reading + digital storybooks)

| Finding | What we do about it |
| --- | --- |
| **Working memory holds 2–3 chunks at age 5–6**, less under ADHD. Long pages overload it. | 1–4 short sentences per page; big text; one image; no clutter. |
| **Short feedback loops keep children with ADHD in flow** (see the game guidelines: 10–15 s loops). | One page ≈ one loop: read → tap → *something happens* (page whoosh, sound, small animation). |
| **Novelty and variable rewards hold attention**; predictable rewards fade. | Each story ends in a different payoff (transform, new robot unlocked, badge, sticker). Small surprises on some pages, not all. |
| **Digital storybooks help when the extras match the story, and distract when they don’t** (Takacs, Swart & Bus 2015 meta-analysis; Bus et al. on “hotspots”). | Animations only show what the sentence says (“Torch turned into a car” → he transforms). No games-within-pages, no random tappable objects. |
| **Decodable text builds independent reading**; text with words he can’t decode teaches guessing from pictures. | Every word is checked against his secure GPCs + focus words (automatic test). Pictures support meaning but never give away a word. |
| **Repetition across a text builds automatic word recognition** (orthographic mapping needs several exposures). | Each focus GPC/word appears ≥ 3 times per story. Stories in a series reuse the same names and words. |
| **Agency and ownership motivate** (self-determination theory). | He chooses the story and, at key moments, chooses what happens (tap *which* robot helps). Robots he “meets” are collected. |
| **Children with ADHD respond strongly to characters, humour and action** — boys in this age group in particular to vehicles, robots, “good guys vs bad guys”. | Transforming robot heroes, a clumsy funny sidekick, a not-too-scary villain, a clear win every time. |
| **Zero-failure** (from the game guidelines). | No tests that can be failed. Help is always one tap away. |

---

## 3. Story rules (for every story, enforced by tests where possible)

**Length**
- **10–20 sentences** per story.
- **1–4 sentences per page**, so about 6–12 pages. Aim for 2 on most pages.
- Sentences of **3–10 words**. Dialogue is good (short, punchy, easy to act out).

**Words**
- Each story names **2–5 focus GPCs** and **4–8 focus HRSWs** as its targets (the first three
  episodes use 5 GPCs each so the series covers all 15 weak sounds).
- Each target appears **≥ 3 times**. Across the series, **every** focus word appears at least once.
- Every word is either:
  1. decodable with the GPCs taught so far (Phase 2 & 3 plus Autumn 1 Phase 5), or
  2. decodable with a **focus** GPC (that is the practice), or
  3. a common exception word / HRSW from the curriculum, or
  4. on the story’s small **“star words”** list (names and 1–2 special words like *robot*),
     which are taught on a title-page “Meet the robots” spread before reading.
- Tests check this word by word and report anything that breaks the rule.

**Narrative shape** (a mini hero’s journey in 6–12 pages)
1. **Meet** – the hero and where they are (1 page).
2. **Trouble** – something goes wrong, the villain or a problem appears (1–2 pages).
3. **Try** – the heroes try, it doesn’t work yet; the funny sidekick helps or bumbles (2–3 pages).
4. **Transform!** – the big moment: the hero transforms / powers up. This is the page he taps
   to trigger (2 pages).
5. **Win** – the problem is fixed, the villain flees (never hurt) (1–2 pages).
6. **Reward** – a warm, funny ending and a tease of the next episode (1 page).

**Tone**
- Heroes are brave, kind and a bit funny. Friends help each other.
- Villains are cheeky or grumpy rather than scary; they lose, run off, and come back later.
- Lots of sound words (*Zoom! Clank! Thud!*): short, decodable, fun to read aloud,
  and they carry focus GPCs (*zoom*, *clank*, *thud*).

---

## 4. Characters (proposal)

Original characters, *inspired by* the look and feel of modern transforming-robot cartoons
(like Transformers: EarthSpark). We do **not** use real franchise names, logos, characters or
factions (no Autobots, Optimus, Bumblebee, Cybertron…). Every name is built from his focus
GPCs, so reading the cast list is practice.

| Name | Focus sounds | Turns into | Role |
| --- | --- | --- | --- |
| **Torch** | or, ch | red rescue car with a light bar | Hero. Brave, a bit too fast. |
| **Clunk** | nk | little yellow digger | Funny sidekick. Clumsy, very strong, loves oil drinks. |
| **Starlight** | ar, igh | silver jet | Scout. Clever, sees things from the sky. |
| **Hook** | oo (book) | tow truck | Big gentle helper. *Push* and *pull* jobs. |
| **Turbo Charger** | ur, ar, er, ch | racing car | Speedy friend, show-off, good heart. |
| **Airlift** | air | helicopter | Rescues people from high places. |
| **Gear** | ear | robot dog | Pet robot of the Thorn Park kids. |
| **Darkstorm** | ar, or | thunder-cloud jet | Cheeky villain. Wants all the power for himself. |
| **Boiler** | oi, er | steam tank | Darkstorm’s grumpy helper. |

Places and objects: **Thorn Park** (th, or) – the robots’ town; **the Pure Core** (ure, or) –
the glowing power cell everyone wants; **Mrs Gear’s** workshop and **Mr Bolt’s** bus stop
(Mr / Mrs and *buses* practice); the **Moon Port** (oo, or).

---

## 5. Example story (draft, to show the tone and density)

**Episode 1: Torch and the Dark Storm** — targets: GPCs *ar, or, igh*; HRSWs *the, said,
was, you, what, all, one, out*.

| Page | Text |
| --- | --- |
| 1 | This is Torch. Torch is a robot. He can turn into a red car! |
| 2 | Torch has a pal. His name is Clunk. Clunk is little, but he is strong. |
| 3 | One night, a dark storm came to Thorn Park. The rain was hard and the wind was loud. |
| 4 | The storm was Darkstorm! He had sharp claws and bright red lights. |
| 5 | “I want all the power!” said Darkstorm. He took the Pure Core. |
| 6 | “Oh no!” said Clunk. “What should we do?” |
| 7 | Torch stood up tall. “Torch… transform!” *(child taps to transform)* |
| 8 | Torch turned into a car. Zoom! He shot out of the park. |
| 9 | Darkstorm was on top of the tower. He was so big! |
| 10 | Torch shot a beam of light. Zap! Darkstorm fell with a big clank. |
| 11 | He let go of the Pure Core. Clunk got it back. |
| 12 | “You are my hero,” said Clunk. The children came out to play. |
| 13 | Torch and Clunk had a cool oil drink. But far off, in the dark, Darkstorm was making a plan… |

(This was the first draft. The shipped text, trimmed to 20 sentences and checked word by word,
is in `stories/episodes/torch-dark-storm.js`.)

---

## 6. Art direction

**Style:** modern, stylised, bold — the feel of current CG robot cartoons.
- Chunky, rounded robots with big friendly eyes / visors; clean panel lines.
- Strong silhouettes and one main colour per robot (Torch red, Clunk yellow, Starlight silver-blue,
  Darkstorm purple-black with green lights), so he can tell them apart instantly.
- Bright, saturated palette; soft cel-shading; simple backgrounds with depth (sky, town, tower).
- Dynamic angles for action pages, calm wide shots for “meet” pages.
- Pictures show the sentence’s *meaning* but **never contain the words** (no labels, no speech
  bubbles with text), so he still has to read.

**Consistency** is the hard part with illustrations: the same robot must look the same on every
page. Plan:
1. A **character sheet** per robot (front, side, vehicle mode) fixed first.
2. Every page image is made from a fixed character description + the page’s scene, using the same
   style prompt (if AI-generated) or the same SVG parts (if drawn in code).
3. Optional small animation layers on top (lights blink, wheels spin, transform flash), done in CSS
   so they can respect `prefers-reduced-motion`.

**Decision: C (mix).** Backgrounds are AI-generated stills (Z-Image Turbo), no characters or
text in them, saved as `public/stories/bg/<id>.webp` (1200×800, ~50 KB each). Robots are SVG
(`stories/robots.js`), layered on top, so they are identical on every page and transform for real.
Scenes that had no image yet reuse one with a colour tint (`fair-storm` = fair + storm tint,
`moon-port` = park + dusk tint; see `BACKGROUNDS` in `stories/reader.js`). Prompt pattern used:
*“Background art for a modern 3D CG animated TV series, stylised, bold saturated colours,
cinematic lighting: <scene>. Empty scene, no characters, no people, no text, no letters”*.
Don't put the word “robot” in a background prompt (the model draws one).

The options that were considered:
- **A. AI-generated stills** (e.g. via an image model), checked and curated by a grown-up,
  saved as `.webp` in `public/stories/<story-id>/`. Richest look; consistency needs care.
- **B. Robots drawn in code (SVG)** from reusable parts. Perfectly consistent and animatable
  (real transform animations!), simpler, more “flat” look.
- **C. Mix:** AI-generated backgrounds + SVG robots layered on top.

---

## 7. Reader UX

**Story shelf** (from the hub, a new “Robot Stories” card)
- Big cover cards, one per episode, showing the hero. Locked/unread/read states
  (new episodes unlock one at a time — a collectable reward). A small “Grown-ups: unlock all
  stories” link opens everything.
- **My Robot Crew** strip: silhouettes that fill in as each story's robots join the crew.

**Before reading: “Meet the robots” page**
- Shows the story’s star words (names) with pictures; tap each to hear it. Keeps the hard
  names from blocking the story.

**Reading a page**
- Layout: **image on top (~60%)**, text below in large Year 1-friendly print (Andika / Sassoon-like,
  ~40px, generous spacing). Landscape tablets: image left, text right.
- **Turn the page by tapping** a big ▶ button on the right edge (also: tap the right half,
  swipe, or → / Space). ◀ to go back. Page-turn whoosh + slide animation.
- Progress shown as robot-head pips, not page numbers.
- **Tap any word to hear it** (audio-first, errorless help).
- **Focus highlights:** the letters of the story's focus sounds are underlined in orange
  (T<u>or</u><u>ch</u>), and its target tricky words get a dotted purple underline.
- **No whole-page read-aloud.** He reads; single words are one tap away.
- **Interaction pages** (1–2 per story, at the “Transform!” moment): a big glowing button
  (“Tap to transform!”) that plays the transform animation and sound before the page can be
  turned. This is the story’s reward beat, tied to what the text says.
- Anti-skimming: the ▶ button appears after a short delay that scales with the page length
  (e.g. ~1.5 s per sentence), so he can’t rattle through without reading. No penalty, just a pause.

**End of story**
- Reward sequence (varies per story): robot transforms and drives off, a new robot joins
  his **Robot Crew** collection, a sticker (shared with the games’ sticker collection).
- Optional quick, no-fail **“Who did it?”** recap: one picture question (“Who took the Pure
  Core?” → tap the robot). Comprehension practice without a test.
- “Read again” and “Next episode” buttons.

**Accessibility:** keyboard playable, focus rings, `aria-live` page text, alt text per image,
`prefers-reduced-motion` respected, touch targets ≥ 64 px (same as the games).

---

## 8. Technical plan

Fits the existing vanilla JS + Vite setup; no framework.

| File | Role |
| --- | --- |
| `stories/episodes/*.js` | One module per story: `{ id, title, episode, targets: { gpcs: [ids], words: [ids] }, starWords: [], pages: [{ sentences: [], image, alt, interaction? }] }`. Target ids reuse `phonics/curriculum.js` ids. |
| `stories/index.js` | The list of stories (order, unlock rules). |
| `stories/decodable.js` | Word checker: splits each word into taught graphemes, allows tricky words and star words, rejects known irregular words; `findGpc` locates a focus sound in a word (telling *oo* in *hook* from *zoom*, *ur* from *ure*…). Also holds the focus lists. |
| `stories/robots.js` | The cast as SVG (robot + vehicle mode), props, blink/rotor/steam CSS. |
| `stories/reader.js` | `initRobotStories`: shelf, “Meet the robots”, page reader (page turning, tap-to-hear, transform, highlights), quiz, end reward, progress. Reuses `phonics/engine.js` (`say`, `sfx`, particles, stickers). |
| `public/stories/bg/<id>.webp` | Background images. |
| `test-stories.js` | jsdom tests: every story has 10–20 sentences, 1–4 per page, each target ≥ 3 times, every word passes the decodable check, every page has an image + alt, reader turns pages by click/keyboard. Added to `npm test`. |

`main.js` gets a “Robot Stories” card on the hub (same pattern as `YEAR1_GAMES`).
Progress (stories read, robots collected) saved in `localStorage.y1Stories`.

**Adding a story** (will become a section in `CLAUDE.md`): write the text → run the checker →
generate/draw pages → add to `stories/index.js` → `npm test`.

---

## 9. First release scope (proposal)

- 3 episodes of one series (Torch & Clunk vs Darkstorm), together covering all 15 focus GPCs
  and all 55 focus words:
  1. *Torch and the Dark Storm* — ar, or, igh, ch, nk.
  2. *Hook and the Stuck Bus* — oo (book), oo (spoon), ai, th, oi.
  3. *Airlift to the Rescue* — air, ear, ure, ur, er.
- Shelf, reader, tap-to-hear, transform interaction, end reward, tests.
- Later: more episodes, branching choice pages, parent-written stories via a template,
  recorded voice for focus sounds.

---

## 10. Decisions (answered by the parent)

1. **Images:** mix — AI-generated backgrounds + robots drawn in code.
2. **Highlight focus words:** yes.
3. **Read-to-me:** no whole-page reading; tap-a-word help only.
4. **Creating stories:** we write them, so he can re-read them (repetition is the point).
5. **Characters:** cast approved. He likes red, so the hero Torch is red.
6. **Faint words** (*could, asked, house, mouse, water, want, very*): also on his focus list.
7. **Which sounds count as taught** for the word check: Phase 2 & 3 plus Autumn 1 Phase 5.
   The check needs *some* list to know whether a word is readable; this is what school has
   taught so far. Tighten it in `stories/decodable.js` if he finds Phase 5 words hard.
8. **First release:** 3 episodes, one series with a recurring villain.
