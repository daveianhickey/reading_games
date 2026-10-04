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
//   gaps     (gpc) optional: the phrase/example with [ ] round the letters that make the sound,
//            e.g. '[c]ycle in the [c]ity'. Only needed when automatic gap-finding gets it wrong.
//   say      optional override for what speech synthesis says
//   audio    optional path to a recorded clip (played instead of speech synthesis)

const gpc = (grapheme, phrase, emoji, extra = {}) => ({ id: grapheme, kind: 'gpc', grapheme, phrase, emoji, ...extra });
const tracker = (id, grapheme, example, emoji) => ({ id, kind: 'gpc', grapheme, example, emoji });
const word = (w, emoji, clue) => ({ id: `w-${w.toLowerCase()}`, kind: 'word', word: w, emoji, clue });

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
                    gpc('c', 'cycle in the city', '🚲', { gaps: '[c]ycle in the [c]ity' })
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
                    tracker('ear', 'ear', 'hear', '👂'),
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
    },
    {
        id: 'y1-common-exception',
        title: 'Year 1 · Common exception words',
        doc: 'docs/curriculum/year1-common-exception-words.md',
        sets: [
            {
                id: 'y1-cew',
                title: 'Common exception words',
                subtitle: 'Year 1 list (words already above are not repeated)',
                items: [
                    word('his', '🎩', '___ hat is red'),
                    word('he', '👨', '___ is my dad'),
                    word('buses', '🚌', 'two red ___'),
                    word('we', '🧒', '___ can play'),
                    word('me', '👀', 'look at ___'),
                    word('be', '😇', 'I will ___ good'),
                    word('push', '🛒', '___ the trolley'),
                    word('was', '🎉', 'it ___ fun'),
                    word('her', '👧', '___ dog is big'),
                    word('my', '🧸', 'this is ___ teddy'),
                    word('you', '🫵', 'I can see ___'),
                    word('they', '👫', '___ go home'),
                    word('all', '👏', 'we ___ clap'),
                    word('are', '😊', 'we ___ happy'),
                    word('ball', '⚽', 'kick the ___'),
                    word('tall', '🦒', 'a ___ giraffe'),
                    word('when', '⏰', '___ is lunch?'),
                    word('what', '❓', '___ is that?'),
                    word('said', '💬', 'Mum ___ hello'),
                    word('so', '🥳', 'I am ___ happy'),
                    word('have', '🐶', 'I ___ a dog'),
                    word('were', '🛝', 'we ___ at the park'),
                    word('out', '🌳', 'go ___ to play'),
                    word('like', '🍦', 'I ___ ice cream'),
                    word('some', '🍭', '___ sweets for me'),
                    word('come', '🤗', '___ and play'),
                    word('there', '👉', 'the cat is over ___'),
                    word('little', '🐣', 'a ___ chick'),
                    word('one', '👃', 'I have ___ nose'),
                    word('do', '🤸', 'what can you ___?'),
                    word('children', '🏫', 'the ___ play'),
                    word('love', '❤️', 'I ___ my mum'),
                    word('oh', '😮', '___ no!'),
                    word('their', '🏡', '___ house is big'),
                    word('people', '👥', 'lots of ___'),
                    word('Mr', '👨‍🏫', '___ Smith'),
                    word('Mrs', '👩‍🏫', '___ Jones'),
                    word('your', '🙌', 'wash ___ hands'),
                    word('ask', '🙋', '___ a question'),
                    word('should', '🛏️', 'you ___ go to bed'),
                    word('would', '🧁', '___ you like a cake?'),
                    word('could', '🤝', '___ you help me?'),
                    word('asked', '🥤', 'she ___ for a drink')
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

// The prompt text for a GPC, split into plain text and gaps where the sound's letters go.
// Returns [{ text }, { gap: 'letters' }, ...]. Split digraphs give one gap per letter (c▢k▢).
export function gapSegments(item) {
    const marked = item.gaps || autoGaps(item.phrase || item.example || '', item.grapheme);
    return marked.split(/(\[[^\]]+\])/).filter(Boolean).map(part =>
        part.startsWith('[') ? { gap: part.slice(1, -1) } : { text: part });
}

function autoGaps(text, grapheme) {
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (/^[a-z]-e$/.test(grapheme)) {
        const vowel = grapheme[0];
        return text.replace(new RegExp(`${esc(vowel)}([^aeiou\\s])e`, 'g'), `[${vowel}]$1[e]`);
    }
    return text.replace(new RegExp(esc(grapheme), 'g'), `[${grapheme}]`);
}
