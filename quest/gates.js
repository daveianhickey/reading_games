// Torch Quest word gates (pure logic). See docs/torch-quest-design.md §4.
//   tier 0 Scrap:  hear it, find it among clearly different words
//   tier 1 Copper: hear it, find it among look-alikes
//   tier 2+ Silver/Gold: flash and find (no voice) among look-alikes
// (The Gold "read it cold / build it" gate is not built yet.)
import { ALL_ITEMS, DISTRACTOR_WORDS } from './content.js';

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

const sortedLetters = w => w.split('').sort().join('');

// Higher = more easily mistaken for the target.
export function similarity(target, other) {
    return -2 * lev(target, other)
        + (target[0] === other[0] ? 2 : 0)
        + (target[target.length - 1] === other[other.length - 1] ? 1 : 0)
        + (sortedLetters(target) === sortedLetters(other) ? 3 : 0)
        - Math.abs(target.length - other.length);
}

const LEXICON = [...new Set([...ALL_ITEMS.map(i => i.word), ...DISTRACTOR_WORDS])];

function sample(list, n, rng) {
    const pool = [...list], out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    return out;
}

// Rankings depend only on the word, so they are worked out once.
const nearCache = new Map(), farCache = new Map();

export function lookAlikes(word, n, rng = Math.random) {
    if (!nearCache.has(word)) {
        nearCache.set(word, LEXICON.filter(w => w !== word).sort((a, b) => similarity(word, b) - similarity(word, a)));
    }
    return sample(nearCache.get(word).slice(0, n + 3), n, rng);
}

export function unlikeWords(word, n, rng = Math.random) {
    if (!farCache.has(word)) {
        farCache.set(word, [...new Set(ALL_ITEMS.map(i => i.word))]
            .filter(w => w !== word && w[0] !== word[0] && sortedLetters(w) !== sortedLetters(word))
            .sort((a, b) => similarity(word, a) - similarity(word, b)));
    }
    return sample(farCache.get(word).slice(0, n + 5), n, rng);
}

// avoidIndex: a plate position the right answer must not take (it was there twice running).
export function buildGate(item, tier, rng = Math.random, avoidIndex = -1) {
    const mode = tier >= 2 ? 'flash' : 'hear';
    const wrong = tier >= 1 ? lookAlikes(item.word, PLATES - 1, rng) : unlikeWords(item.word, PLATES - 1, rng);
    let correctIndex = Math.floor(rng() * PLATES);
    if (correctIndex === avoidIndex) correctIndex = (correctIndex + 1 + Math.floor(rng() * (PLATES - 1))) % PLATES;
    const plates = [...wrong];
    plates.splice(correctIndex, 0, item.word);
    return { item, word: item.word, tier, mode, plates, correctIndex };
}
