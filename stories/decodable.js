// Word checker for Robot Stories: can a Year 1 learner read every word in a story?
// A word passes if it is a curriculum tricky word, one of the story's star words
// (names, taught on the "Meet the robots" page), or can be sounded out with the
// GPCs he has been taught (Phase 2 & 3 plus Autumn 1 Phase 5). Focus GPCs from the
// school weak-spots sheet count as taught: reading them is the practice.
// See docs/robot-stories-design.md §3.
import { TERMS, allItems } from '../phonics/curriculum.js';

// Graphemes taught by the end of Year 1 Autumn 1, longest first so 'igh' wins over 'i'.
const MULTI = [
    'igh', 'ear', 'air', 'ure',
    'ch', 'sh', 'th', 'ng', 'nk', 'ck', 'qu', 'wh', 'ph',
    'ai', 'ee', 'oa', 'oo', 'ar', 'or', 'ur', 'ow', 'oi', 'er',
    'ay', 'ou', 'ie', 'ea', 'oy', 'ir', 'ue', 'aw', 'ew', 'oe', 'au', 'ey',
    'ff', 'll', 'ss', 'zz', 'bb', 'dd', 'gg', 'mm', 'nn', 'pp', 'rr', 'tt'
];
const SINGLE = 'abcdefghijklmnopqrstuvwxyz'.split('');
export const TAUGHT_GRAPHEMES = [...MULTI, ...SINGLE];

// Words that split into taught graphemes but are not said that way. Never allowed
// unless they are on the tricky-word list or the story's star words.
const IRREGULAR = new Set([
    'eyes', 'eye', 'friend', 'friends', 'because', 'laugh', 'laughed', 'once', 'two', 'who',
    'where', 'any', 'many', 'again', 'move', 'moved', 'does', 'done', 'gone', 'give', 'live',
    'other', 'mother', 'brother', 'father', 'pretty', 'busy', 'climb', 'know', 'knew',
    'build', 'great', 'break', 'sure', 'whole', 'shoe', 'eight', 'any', 'both', 'old',
    'cold', 'told', 'most', 'kind', 'find', 'mind', 'wild', 'every', 'everyone', 'only',
    'door', 'floor', 'poor', 'though', 'through', 'thought', 'bought', 'ocean', 'heart'
]);

// Curriculum word items (tricky words, spelling words, 'oa' words…): allowed as whole words.
export const CURRICULUM_WORDS = new Set(
    allItems().filter(i => i.kind === 'word').map(i => i.word.toLowerCase())
);

// The school weak-spots lists. Item ids from phonics/curriculum.js.
export const FOCUS_GPC_IDS = ['ch', 'th', 'nk', 'ai', 'igh', 'oo-spoon', 'ar', 'ur', 'oo-book', 'or', 'oi', 'ear', 'air', 'ure', 'er'];
export const FOCUS_WORDS = [
    'the', 'put', 'of', 'to', 'go', 'into', 'pull', 'his', 'he', 'buses', 'we', 'me', 'be', 'push',
    'was', 'her', 'my', 'you', 'they', 'all', 'are', 'ball', 'tall', 'when', 'what', 'said', 'so',
    'have', 'were', 'out', 'like', 'some', 'come', 'there', 'little', 'one', 'do', 'children', 'love',
    'oh', 'their', 'people', 'mr', 'mrs', 'your', 'ask', 'should', 'would',
    // Also on the sheet (confirmed by parent): faint row at the top.
    'could', 'asked', 'house', 'mouse', 'water', 'want', 'very'
];

// Split words into lower-case word tokens: "Torch's" -> "torch", "Oh!" -> "oh".
export function wordsIn(text) {
    return (text.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g) || [])
        .map(w => w.toLowerCase().replace(/['’]s$/, '').replace(/['’]/g, ''));
}

// Split a word into taught graphemes, or return null if it can't be done.
// Split digraphs (a-e, i-e, o-e, u-e, e-e) are handled by letting a final 'e' (or 'es'/'ed')
// after vowel+consonant ride along silently.
export function segment(word) {
    const w = word.toLowerCase();
    const split = w.match(/^(.*[aeiou][b-df-hj-np-tv-z])e(s|d)?$/);
    const attempts = [w];
    if (split) attempts.unshift(split[1] + (split[2] || ''));
    for (const attempt of attempts) {
        const parts = splitGraphemes(attempt);
        if (parts) return parts;
    }
    return null;
}

function splitGraphemes(w) {
    // Dynamic programming: fewest graphemes wins.
    const best = new Array(w.length + 1).fill(null);
    best[0] = [];
    for (let i = 0; i < w.length; i++) {
        if (!best[i]) continue;
        for (const g of TAUGHT_GRAPHEMES) {
            if (w.startsWith(g, i)) {
                const next = [...best[i], g];
                const j = i + g.length;
                if (!best[j] || best[j].length > next.length) best[j] = next;
            }
        }
    }
    return best[w.length];
}

// Why a word is readable: 'tricky', 'star', 'decodable', or null if it isn't.
export function whyReadable(word, starWords = []) {
    const w = word.toLowerCase();
    if (CURRICULUM_WORDS.has(w) || FOCUS_WORDS.includes(w)) return 'tricky';
    if (starWords.map(s => s.toLowerCase()).includes(w)) return 'star';
    if (IRREGULAR.has(w)) return null;
    // Plurals and -ed / -ing of tricky words (pulled, pushing, buses).
    for (const suffix of ['s', 'es', 'ed', 'ing']) {
        if (w.endsWith(suffix) && CURRICULUM_WORDS.has(w.slice(0, -suffix.length))) return 'tricky';
    }
    return segment(w) ? 'decodable' : null;
}

// Star words are written as names ("Thorn Park"); return their single words.
export function starWordList(story) {
    return (story.starWords || []).flatMap(s => wordsIn(s.word));
}

// Every sentence of a story, in order.
export function storySentences(story) {
    return story.pages.flatMap(p => p.sentences);
}

// Words in a story that a learner could not read. Empty array = story passes.
export function unreadableWords(story) {
    const stars = starWordList(story);
    const bad = new Set();
    storySentences(story).forEach(s => wordsIn(s).forEach(w => { if (!whyReadable(w, stars)) bad.add(w); }));
    return [...bad];
}

// Grapheme letters for a GPC item id (oo-spoon -> 'oo').
export function graphemeOf(id) {
    const item = allItems().find(i => i.id === id);
    return item ? item.grapheme : id;
}

// 'oo' makes two sounds; tell them apart by word.
const OO_BOOK = new Set(['hook', 'hooks', 'look', 'looked', 'looks', 'good', 'took', 'book', 'books', 'wood', 'stood', 'foot', 'cook', 'woof', 'shook', 'hood']);

// Where a focus GPC sits in a word: [start, end] letter positions, or null.
// Used for counting practice and for underlining the sound in the reader.
export function findGpc(word, gpcId) {
    const w = word.toLowerCase();
    const g = graphemeOf(gpcId);
    if (gpcId === 'oo-book' && !OO_BOOK.has(w)) return null;
    if (gpcId === 'oo-spoon' && OO_BOOK.has(w)) return null;
    let from = 0;
    while (true) {
        const i = w.indexOf(g, from);
        if (i < 0) return null;
        const before = w[i - 1] || '';
        const after = w[i + g.length] || '';
        let ok = true;
        // r-controlled vowels followed by 'e' (pure, here, core) or part of a longer grapheme.
        if (['ar', 'or', 'ur', 'er'].includes(g) && after === 'e') ok = false;
        if (g === 'er' && before === 'e') ok = false;            // cheer, steer
        if (['ar', 'er'].includes(g) && before === 'e') ok = false; // hear, near (ear)
        if (g === 'ai' && after === 'r') ok = false;            // air
        if (ok) return [i, i + g.length];
        from = i + 1;
    }
}

// Words in the story that carry a focus GPC (ignoring tricky words, whose spelling is irregular).
export function gpcHits(story, gpcId) {
    const stars = starWordList(story);
    return storySentences(story).flatMap(wordsIn).filter(w =>
        findGpc(w, gpcId) && whyReadable(w, stars) !== 'tricky');
}

// How many times a tricky word appears in the story.
export function wordHits(story, word) {
    return storySentences(story).flatMap(wordsIn).filter(w => w === word.toLowerCase()).length;
}

export { TERMS };
