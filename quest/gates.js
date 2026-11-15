// Torch Quest word gates (pure logic). See docs/torch-quest-design.md §4 and §5a.
//   tier 0 Scrap:  hear it, find it among words that start the same but differ a lot after that
//   tier 1 Copper: hear it, find it among look-alikes (one or two letters different)
//   tier 2 Silver: flash and find (no voice) among look-alikes
//   tier 3 Gold:   read it cold: a sentence with a gap and a picture, no voice
//                  (words with no clue sentence get flash and find)
//
// Fair plates (§5a). He found two shortcuts that skip reading: tap the plate with the right
// first letter, or tap the plate whose length matches how long the word sounds. So every gate:
//   1. Same start: every wrong plate starts with the target's first letter.
//      Two-letter words are the exception: there every plate has two letters instead
//      (to / so / go / do), because the first letter is half of the reading.
//   2. Same length: every plate is within one letter of the target, and at least one wrong
//      plate is exactly as long as the target, so length never singles it out.
//   3. No odd-one-in: the target is never the plate most like all the others.
//   4. Fair to the ear: no sound-alikes (to / too) in hear-it gates.
// Real words come first. If there are not enough, an "alien word" (a made-up word he can
// decode, like the ones in the Year 1 phonics check) fills in: at most one per gate.
import { ALL_ITEMS, DISTRACTOR_WORDS, HOMOPHONES, soundsSame } from './content.js';
import { WORD_BANK } from './wordbank.js';
import { segment } from '../stories/decodable.js';

export const PLATES = 3;

export function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
    }
    return d[a.length][b.length];
}

const low = w => w.toLowerCase();
const sortedLetters = w => low(w).split('').sort().join('');

// Higher = more easily mistaken for the target.
export function similarity(target, other) {
    const t = low(target), o = low(other);
    return -2 * lev(t, o)
        + (t[0] === o[0] ? 2 : 0)
        + (t[t.length - 1] === o[o.length - 1] ? 1 : 0)
        + (sortedLetters(t) === sortedLetters(o) ? 3 : 0)
        - Math.abs(t.length - o.length);
}

const TARGET_WORDS = [...new Set(ALL_ITEMS.map(i => i.word))];
const TRICKY_WORDS = new Set(ALL_ITEMS.filter(i => i.kind === 'tricky').map(i => low(i.word)));
export const LEXICON = [...new Set([...TARGET_WORDS, ...DISTRACTOR_WORDS, ...WORD_BANK])];
// Titles (Mr, Mrs) are capitalised, so as a wrong plate they would stand out.
const PLATE_LEXICON = LEXICON.filter(w => w === low(w));
const LEXICON_SET = new Set(LEXICON.map(low));
// Sentence gates: other tricky words often fit the same gap ("___ dog is big": his/her/my),
// so their wrong plates come only from words that are not tricky targets.
const SENTENCE_LEXICON = PLATE_LEXICON.filter(w => !TRICKY_WORDS.has(low(w)));

// ---------- The fairness rules (also used by the tests) ----------

export function sameStart(target, w) {
    return low(w)[0] === low(target)[0];
}

export function closeLength(target, w) {
    return target.length <= 2 ? w.length === 2 : Math.abs(w.length - target.length) <= 1;
}

// How alike a plate is to the rest of the gate. The target must not be the clear winner,
// or "pick the one that looks most like the others" would find it.
function centrality(plates, i) {
    return plates.reduce((n, w, j) => n + (j === i ? 0 : similarity(plates[i], w)), 0);
}
export function isOddOneIn(plates, target) {
    const i = plates.indexOf(target);
    const mine = centrality(plates, i);
    return plates.every((_, j) => j === i || centrality(plates, j) < mine);
}

// Checks a finished gate against rules 1–4. Returns a list of problems (empty = fair).
export function fairnessProblems(plates, target, mode = 'hear') {
    const problems = [];
    const others = plates.filter(w => w !== target);
    // Two-letter words: plates may start differently (so / go / do for "to"), because both
    // letters together are the reading, but at least one must start the same.
    const short = target.length <= 2;
    if (short && !others.some(w => sameStart(target, w))) problems.push(`no other plate starts like ${target}`);
    for (const w of others) {
        if (!short && !sameStart(target, w)) problems.push(`${w}: starts differently from ${target}`);
        if (!closeLength(target, w)) problems.push(`${w}: length gives ${target} away`);
        if (mode !== 'sentence' && soundsSame(w, target)) problems.push(`${w}: sounds like ${target}`);
    }
    if (!others.some(w => w.length === target.length)) problems.push(`${target} is the only plate of its length`);
    if (plates.length >= 3 && isOddOneIn(plates, target)) problems.push(`${target} is the odd one in`);
    return problems;
}

// ---------- Alien words ----------

const CONSONANTS = 'bdfgklmnprstv'.split('');
const VOWELS_FOR = { o: ['a', 'i'], e: ['a', 'u'], y: ['a', 'u'], r: [] };
const RUDE = /fuc|shit|cun|twat|wank|cock|dick|piss|crap|arse|tits|slut|fart|porn|sex|nob|knob|poo|bum|damn|hell|kil|die|gay/;
// Letter patterns that appear in real words he reads: an alien word may only use these,
// so it looks like a word (bunk → bulk-ish), never like a typo (woubd).
const TRIGRAMS = new Set(PLATE_LEXICON.flatMap(w => { const p = `^${low(w)}$`; return Array.from({ length: p.length - 2 }, (_, i) => p.slice(i, i + 3)); }));
const looksLikeAWord = w => { const p = `^${w}$`; for (let i = 0; i + 3 <= p.length; i++) if (!TRIGRAMS.has(p.slice(i, i + 3))) return false; return true; };

// Made-up words built from the target: same first letter, same length, one single-letter
// consonant swapped (never a digraph like ch, never a vowel), so they can never sound like it.
// Two-letter words swap the vowel instead (to → ta, ti), avoiding vowels that could say the same.
export function alienWords(target) {
    const t = low(target);
    const out = new Set();
    const add = w => { if (!LEXICON_SET.has(w) && !RUDE.test(w) && !soundsSame(w, t) && (t.length === 2 || looksLikeAWord(w))) out.add(w); };
    if (t.length === 2) {
        for (const v of VOWELS_FOR[t[1]] || []) add(t[0] + v);
        return [...out];
    }
    const parts = segment(t) || [...t];
    let at = 0;
    parts.forEach((g, k) => {
        if (k > 0 && g.length === 1 && !/[aeiouy]/.test(g)) {
            for (const c of CONSONANTS) if (c !== g) add(t.slice(0, at) + c + t.slice(at + 1));
        }
        at += g.length;
    });
    return [...out];
}

// ---------- Picking the wrong plates ----------

function shuffle(list, rng) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const cache = new Map();
// Real words that pass rules 1, 2 and 4 for this target, best first for the tier.
function fairPool(word, near, sentence) {
    const key = `${word}|${near}|${sentence}`;
    if (!cache.has(key)) {
        const lex = sentence ? SENTENCE_LEXICON : PLATE_LEXICON;
        const pool = lex.filter(w => w !== word && sameStart(word, w) && closeLength(word, w) && !soundsSame(w, word));
        // Copper and up: look-alikes first. Scrap: words that differ a lot after the first letter.
        pool.sort((a, b) => near ? similarity(word, b) - similarity(word, a) : similarity(word, a) - similarity(word, b));
        cache.set(key, pool);
    }
    return cache.get(key);
}

// n wrong plates for a word. near: look-alikes (Copper+) or clearly different (Scrap).
export function wrongPlates(word, n, rng = Math.random, { near = true, sentence = false } = {}) {
    let pool = fairPool(word, near, sentence);
    const partner = sentence ? HOMOPHONES.find(g => g.includes(low(word)))?.find(w => w !== low(word) && TRICKY_WORDS.has(w)) : null;
    const aliens = alienWords(word);
    let best = null;
    for (let attempt = 0; attempt < 30; attempt++) {
        // A random pick from the best few keeps gates varied without losing their character.
        const chosen = partner ? [partner] : [];
        const fresh = w => !chosen.includes(w) && !chosen.some(c => soundsSame(c, w));
        const bestOf = list => shuffle(list.slice(0, Math.max(3, Math.ceil(list.length / 2))), rng);
        // Exactly the same length whenever there are enough real words, so length tells him nothing.
        const sameLens = pool.filter(w => w.length === word.length);
        // And one that also ends the same (buses / boxes), so first + last letter + length is not
        // enough either: only the middle letters tell them apart.
        // As many of those as there are, so that shortcut is down to a coin toss or worse.
        for (const w of bestOf(sameLens.filter(w => low(w).at(-1) === low(word).at(-1)))) { if (chosen.length >= n) break; if (fresh(w)) chosen.push(w); }
        for (const w of bestOf(sameLens)) { if (chosen.length >= n) break; if (fresh(w)) chosen.push(w); }
        const top = shuffle(pool.slice(0, Math.max(n + 4, Math.ceil(pool.length / 2))), rng);
        // Two-letter words: one plate that starts the same (by, my, or an alien word like ta).
        if (word.length <= 2 && !chosen.some(w => sameStart(word, w))) {
            // (Mr: no alien works, so a sentence gate borrows my / me, which cannot fit "___ Smith".)
            const starts = shuffle(pool.filter(w => sameStart(word, w)), rng)[0] || aliens[Math.floor(rng() * aliens.length)]
                || shuffle(PLATE_LEXICON.filter(w => w !== word && w.length === 2 && sameStart(word, w)), rng)[0];
            if (starts) chosen.unshift(starts);
        }
        for (const w of top) {
            if (chosen.length >= n) break;
            if (fresh(w)) chosen.push(w);
        }
        // Not enough real words: one alien word, as long as the target.
        if (chosen.length < n && aliens.length && !chosen.some(isAlien)) chosen.push(aliens[Math.floor(rng() * aliens.length)]);
        // Still short (should not happen; the tests check): borrow any close-length word.
        if (chosen.length < n) {
            for (const w of shuffle((sentence ? SENTENCE_LEXICON : PLATE_LEXICON).filter(w => closeLength(word, w) && w !== word && !soundsSame(w, word)), rng)) {
                if (chosen.length >= n) break;
                if (!chosen.includes(w)) chosen.push(w);
            }
        }
        const plates = [word, ...chosen.slice(0, n)];
        // Length and first letter are the shortcuts he really used, so they weigh most.
        const problems = fairnessProblems(plates, word, sentence ? 'sentence' : 'hear')
            .reduce((sum, p) => sum + (/odd one in/.test(p) ? 1 : 3), 0);
        if (!best || problems < best.problems) best = { plates, problems };
        if (!problems) break;
    }
    return best.plates.slice(1);
}

export function isAlien(w) {
    return !LEXICON_SET.has(low(w));
}

// Kept for the Training Bay, where the job is to learn the word, not to be tested on it:
// clearly different words with different first letters.
export function unlikeWords(word, n, rng = Math.random) {
    const list = TARGET_WORDS
        .filter(w => w !== word && low(w)[0] !== low(word)[0] && sortedLetters(w) !== sortedLetters(word))
        .sort((a, b) => similarity(word, a) - similarity(word, b));
    return shuffle([...new Set(list)].slice(0, n + 5), rng).slice(0, n);
}

export function gateMode(item, tier) {
    if (tier >= 3 && item.clue) return 'sentence';
    if (tier >= 2) return 'flash';
    return 'hear';
}

// avoidIndex: a plate position the right answer must not take (it was there twice running).
export function buildGate(item, tier, rng = Math.random, avoidIndex = -1, plates = PLATES) {
    const mode = gateMode(item, tier);
    const wrong = wrongPlates(item.word, plates - 1, rng, { near: tier >= 1, sentence: mode === 'sentence' });
    let correctIndex = Math.floor(rng() * plates);
    if (correctIndex === avoidIndex) correctIndex = (correctIndex + 1 + Math.floor(rng() * (plates - 1))) % plates;
    const list = [...wrong];
    list.splice(correctIndex, 0, item.word);
    const gate = { item, word: item.word, tier, mode, plates: list, correctIndex };
    if (mode === 'sentence') gate.clue = item.clue;
    return gate;
}
