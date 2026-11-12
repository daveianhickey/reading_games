// Torch Quest word gates (pure logic). See docs/torch-quest-design.md §4.
//   tier 0 Scrap:  hear it, find it among clearly different words
//   tier 1 Copper: hear it, find it among look-alikes
//   tier 2 Silver: flash and find (no voice) among look-alikes
//   tier 3 Gold:   read it cold: a sentence with a gap and a picture, no voice
//                  (words with no clue sentence get flash and find)
import { ALL_ITEMS, DISTRACTOR_WORDS, HOMOPHONES, soundsSame } from './content.js';

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

const sortedLetters = w => w.toLowerCase().split('').sort().join('');

// Higher = more easily mistaken for the target.
export function similarity(target, other) {
    const t = target.toLowerCase(), o = other.toLowerCase();
    return -2 * lev(t, o)
        + (t[0] === o[0] ? 2 : 0)
        + (t[t.length - 1] === o[o.length - 1] ? 1 : 0)
        + (sortedLetters(t) === sortedLetters(o) ? 3 : 0)
        - Math.abs(t.length - o.length);
}

const TARGET_WORDS = [...new Set(ALL_ITEMS.map(i => i.word))];
const TRICKY_WORDS = new Set(ALL_ITEMS.filter(i => i.kind === 'tricky').map(i => i.word.toLowerCase()));
const LEXICON = [...new Set([...TARGET_WORDS, ...DISTRACTOR_WORDS])];
// Sentence gates: other tricky words often fit the same gap ("___ dog is big": his/her/my),
// so their wrong plates come only from words that are not tricky targets.
const SENTENCE_LEXICON = LEXICON.filter(w => !TRICKY_WORDS.has(w.toLowerCase()));

function sample(list, n, rng) {
    const pool = [...list], out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return out;
}

// Rankings depend only on the word, so they are worked out once.
const cache = new Map();
function ranked(key, make) {
    if (!cache.has(key)) cache.set(key, make());
    return cache.get(key);
}

// Never two plates that sound the same, and never the target's sound-alike in a hear-it gate.
const okWith = (word, chosen) => w => !soundsSame(w, word) && !chosen.some(c => soundsSame(c, w));

function pickFrom(list, word, n, rng, spread) {
    const out = [];
    const pool = list.filter(okWith(word, out));
    while (out.length < n && pool.length) {
        const i = Math.floor(rng() * Math.min(pool.length, n + spread));
        const w = pool.splice(i, 1)[0];
        if (okWith(word, out)(w)) out.push(w);
    }
    return out;
}

export function lookAlikes(word, n, rng = Math.random) {
    const list = ranked(`near:${word}`, () => LEXICON.filter(w => w !== word).sort((a, b) => similarity(word, b) - similarity(word, a)));
    return pickFrom(list, word, n, rng, 3);
}

export function unlikeWords(word, n, rng = Math.random) {
    const list = ranked(`far:${word}`, () => TARGET_WORDS
        .filter(w => w !== word && w[0].toLowerCase() !== word[0].toLowerCase() && sortedLetters(w) !== sortedLetters(word))
        .sort((a, b) => similarity(word, a) - similarity(word, b)));
    return pickFrom(list, word, n, rng, 5);
}

export function sentenceWrongs(word, n, rng = Math.random) {
    // A tricky sound-alike that is spelt differently (there / their) is the best test of all.
    const partner = HOMOPHONES.find(g => g.includes(word.toLowerCase()))
        ?.find(w => w !== word.toLowerCase() && TRICKY_WORDS.has(w));
    const list = ranked(`sent:${word}`, () => SENTENCE_LEXICON.filter(w => w !== word).sort((a, b) => similarity(word, b) - similarity(word, a)));
    const out = partner ? [partner] : [];
    for (const w of list) {
        if (out.length >= n + 2) break;
        if (!soundsSame(w, word) && !out.includes(w)) out.push(w);
    }
    return partner ? [partner, ...sample(out.slice(1), n - 1, rng)] : sample(out, n, rng);
}

export function gateMode(item, tier) {
    if (tier >= 3 && item.clue) return 'sentence';
    if (tier >= 2) return 'flash';
    return 'hear';
}

// avoidIndex: a plate position the right answer must not take (it was there twice running).
export function buildGate(item, tier, rng = Math.random, avoidIndex = -1, plates = PLATES) {
    const mode = gateMode(item, tier);
    const n = plates - 1;
    const wrong = mode === 'sentence' ? sentenceWrongs(item.word, n, rng)
        : tier >= 1 ? lookAlikes(item.word, n, rng) : unlikeWords(item.word, n, rng);
    let correctIndex = Math.floor(rng() * plates);
    if (correctIndex === avoidIndex) correctIndex = (correctIndex + 1 + Math.floor(rng() * (plates - 1))) % plates;
    const list = [...wrong];
    list.splice(correctIndex, 0, item.word);
    const gate = { item, word: item.word, tier, mode, plates: list, correctIndex };
    if (mode === 'sentence') gate.clue = item.clue;
    return gate;
}
