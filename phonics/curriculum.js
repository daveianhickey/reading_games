// Year 1 phonics content. Human-readable source: docs/curriculum/*.md
// To add a term: add a markdown file in docs/curriculum and a new entry in TERMS (see CLAUDE.md).
//
// Item fields:
//   id       unique across ALL terms (used for selection + progress storage)
//   kind     'gpc' (a grapheme) or 'word'
//   grapheme (gpc)  text shown on tiles, e.g. 'ay', 'a-e'
//   word     (word) the word itself
//   phrase   school mnemonic / catchphrase (spoken + shown as the dual-coding prompt)
//   example  example word (spoken when there is no phrase)
//   emoji    picture for dual coding
//   clue     (word) sentence with ___ for the gap, shown as a reading clue
//   say      optional override for what speech synthesis says
//   audio    optional path to a recorded clip (played instead of speech synthesis)

const gpc = (grapheme, phrase, emoji, extra = {}) => ({ id: grapheme, kind: 'gpc', grapheme, phrase, emoji, ...extra });
const tracker = (id, grapheme, example, emoji) => ({ id, kind: 'gpc', grapheme, example, emoji });
const word = (w, emoji, clue) => ({ id: `w-${w}`, kind: 'word', word: w, emoji, clue });

export const TERMS = [
    {
        id: 'y1-autumn-1',
        title: 'Year 1 · Autumn 1',
        doc: 'docs/curriculum/year1-autumn-term-1.md',
        sets: [
            {
                id: 'y1a1-revised',
                title: 'Revised sounds',
                subtitle: 'Phase 5 sounds',
                items: [
                    gpc('ay', 'play all day', '🎮'),
                    gpc('ou', 'proud cloud', '☁️'),
                    gpc('ie', 'pie on my tie', '🥧'),
                    gpc('ea', 'each have a treat', '🍬'),
                    gpc('oy', 'the boy cries ahoy', '⛵'),
                    gpc('ir', 'a quirky shirt', '👕'),
                    gpc('ue', 'true the sky is blue', '🌤️'),
                    gpc('aw', 'fawn on the lawn', '🦌'),
                    gpc('wh', 'whip with a whisk', '🥣'),
                    gpc('ph', 'photo on a phone', '📱'),
                    gpc('ew', 'the crew flew', '✈️'),
                    gpc('oe', 'tiptoe past the doe', '🩰'),
                    gpc('au', 'pause the launch', '🚀'),
                    gpc('ey', 'use money to buy honey', '🍯'),
                    gpc('a-e', 'cake by the lake', '🎂', { split: true })
                ]
            },
            {
                id: 'y1a1-new',
                title: 'New sounds',
                subtitle: 'Split digraphs & soft c',
                items: [
                    gpc('e-e', 'the athletes compete', '🏃', { split: true }),
                    gpc('i-e', 'time to shine', '✨', { split: true }),
                    gpc('o-e', 'note in an envelope', '✉️', { split: true }),
                    gpc('u-e', 'tune on a flute', '🎵', { split: true }),
                    gpc('c', 'cycle in the city', '🚲')
                ]
            },
            {
                id: 'phase23',
                title: 'Phase 2 & 3 sounds',
                subtitle: 'Tracker review',
                items: [
                    tracker('ck', 'ck', 'duck', '🦆'),
                    tracker('qu', 'qu', 'queen', '👑'),
                    tracker('ch', 'ch', 'chip', '🍟'),
                    tracker('th', 'th', 'thumb', '👍'),
                    tracker('ng', 'ng', 'ring', '💍'),
                    tracker('nk', 'nk', 'wink', '😉'),
                    tracker('ai', 'ai', 'rain', '🌧️'),
                    tracker('igh', 'igh', 'night', '🌙'),
                    tracker('oa', 'oa', 'goat', '🐐'),
                    tracker('oo-spoon', 'oo', 'spoon', '🥄'),
                    tracker('ar', 'ar', 'car', '🚗'),
                    tracker('ur', 'ur', 'turtle', '🐢'),
                    tracker('oo-book', 'oo', 'book', '📖'),
                    tracker('or', 'or', 'fork', '🍴'),
                    tracker('ow-growl', 'ow', 'cow', '🐄'),
                    tracker('oi', 'oi', 'coin', '🪙'),
                    tracker('ear', 'ear', 'ear', '👂'),
                    tracker('air', 'air', 'hair', '💇'),
                    tracker('ure', 'ure', 'cure', '🩹'),
                    tracker('er', 'er', 'hammer', '🔨'),
                    tracker('ow-snow', 'ow', 'snow', '❄️')
                ]
            },
            {
                id: 'y1a1-hrsw',
                title: 'Tricky words to read',
                subtitle: 'Harder to read & spell',
                items: [
                    word('house', '🏠', 'a ___ with a red door'),
                    word('mouse', '🐭', 'a little grey ___'),
                    word('water', '💧', 'a drink of ___'),
                    word('want', '🎂', 'I ___ a cake'),
                    word('very', '🐘', 'a ___ big elephant')
                ]
            },
            {
                id: 'y1a1-spelling',
                title: 'Tricky words to spell',
                subtitle: 'Independent writing',
                items: [
                    word('the', '🐱', '___ cat sat down'),
                    word('to', '🏫', 'go ___ school'),
                    word('no', '🙅', 'yes or ___'),
                    word('go', '🏁', 'ready, steady, ___!'),
                    word('put', '🧥', '___ on your coat'),
                    word('into', '🏊', 'jump ___ the pool'),
                    word('of', '☕', 'a cup ___ tea'),
                    word('pull', '🚪', 'push and ___'),
                    word('is', '☀️', 'it ___ hot'),
                    word('as', '🏎️', 'as fast ___ a car')
                ]
            }
        ]
    }
];

export const MY_WORDS_SET_ID = 'my-words';

// The learner's own typed words (from the original word games) as practice items.
export function customWordItems(words = []) {
    return words.map(w => ({ id: `my-${w}`, kind: 'word', word: w, emoji: '⭐', mine: true }));
}

export function allSets(words = []) {
    const sets = TERMS.flatMap(t => t.sets);
    if (words.length) {
        sets.push({ id: MY_WORDS_SET_ID, title: 'My words', subtitle: 'Typed in by a grown-up', items: customWordItems(words) });
    }
    return sets;
}

export function allItems(words = []) {
    return allSets(words).flatMap(s => s.items);
}

export function findItem(id, words = []) {
    return allItems(words).find(i => i.id === id) || null;
}

// Text shown on a tile.
export function label(item) {
    return item.kind === 'gpc' ? item.grapheme : item.word;
}
