// Torch Quest content: worlds → levels → items. See docs/torch-quest-design.md §8.
// Tricky words reuse curriculum item ids (w-the). Each focus GPC is practised through
// a few decodable words that carry it (ch:chop). Level ids are saved progress: never
// renumber a level that has shipped.
import { findItem } from '../phonics/curriculum.js';

const tricky = w => {
    const item = findItem(`w-${w.toLowerCase()}`);
    return { id: item.id, word: item.word, kind: 'tricky', clue: item.clue, emoji: item.emoji };
};
const sound = (gpc, w) => ({ id: `${gpc}:${w}`, word: w, kind: 'gpc', gpc });

// level(id, needStars, tricky words, { gpc: [decodable words] })
// needStars: stars needed in this world before the level opens.
function level(id, needStars, words, sounds = {}) {
    const items = [...words.map(tricky), ...Object.entries(sounds).flatMap(([gpc, ws]) => ws.map(w => sound(gpc, w)))];
    return { id, name: `Level ${id.split('-')[1]}`, needStars, items, gpcs: Object.keys(sounds) };
}

// The skill ladder: each world asks a little more of his reading (design §8a).
//   plates      plates per gate (more plates, less lucky guessing)
//   minTier     every gate is at least this hard (1 = look-alike plates even for new words)
//   checkpoint  mid-level flag (parent: "mid-level in the early worlds, full level later")
//   obstacles   what the runner puts between gates
//   boss        boss stage: gates, seconds per gate, and what opens its door
export const WORLDS = [
    {
        id: 'w1', name: 'Scrap Yard', emoji: '🔩', theme: 'scrap',
        plates: 3, minTier: 0, checkpoint: true,
        obstacles: { gapW: [30, 30], tall: 0 },
        levels: [
            level('1-1', 0, ['the', 'to', 'go'], { ch: ['chop', 'chip', 'rich', 'much'] }),
            level('1-2', 1, ['into', 'of', 'put'], { th: ['this', 'that', 'thud', 'moth'] }),
            level('1-3', 3, ['pull', 'push', 'he'], { nk: ['tank', 'honk', 'clank', 'wink'] }),
            level('1-4', 5, ['we', 'me', 'be'], { ch: ['chomp', 'munch', 'lunch'], th: ['thin', 'with'] }),
            level('1-5', 7, [], { nk: ['think', 'bunk', 'drink'], th: ['bath', 'thump'], ch: ['chest'] })
        ],
        boss: { name: 'Grabber', gates: 10, seconds: 12, needStars: 10, needBlocks: { tier: 1, count: 6 } }
    },
    {
        id: 'w2', name: 'Rain Rail', emoji: '🌧️', theme: 'rain',
        plates: 3, minTier: 0, checkpoint: true,
        obstacles: { gapW: [30, 38], tall: 0 },
        levels: [
            level('2-1', 0, ['was', 'her', 'my'], { ai: ['rain', 'tail', 'wait', 'paint'] }),
            level('2-2', 1, ['you', 'they', 'all'], { igh: ['night', 'light', 'high', 'might'] }),
            level('2-3', 3, ['are', 'ball', 'tall'], { 'oo-spoon': ['zoom', 'moon', 'cool', 'boom'] }),
            level('2-4', 5, ['his', 'buses'], { ai: ['chain', 'rail', 'train', 'snail'] }),
            level('2-5', 7, [], { igh: ['bright', 'fight', 'right'], 'oo-spoon': ['roof', 'tool', 'food'] })
        ],
        boss: { name: 'Drizzle', gates: 10, seconds: 11, needStars: 10, needBlocks: { tier: 1, count: 10 } }
    },
    {
        id: 'w3', name: 'Dark Park', emoji: '🌙', theme: 'park',
        plates: 4, minTier: 1, checkpoint: false,
        obstacles: { gapW: [32, 40], tall: 0.25 },
        levels: [
            level('3-1', 0, ['when', 'what', 'said'], { ar: ['car', 'star', 'dark', 'park'] }),
            level('3-2', 1, ['so', 'have', 'were'], { ur: ['turn', 'burn', 'hurt', 'surf'] }),
            level('3-3', 3, ['out', 'like'], { 'oo-book': ['look', 'hook', 'took', 'good', 'wood'] }),
            level('3-4', 5, ['some', 'come'], { or: ['storm', 'torch', 'horn', 'fork', 'sort'] }),
            level('3-5', 7, [], { ar: ['spark', 'sharp'], ur: ['curl', 'church'], 'oo-book': ['foot', 'cook'] })
        ],
        boss: { name: 'Shade', gates: 10, seconds: 10, needStars: 10, needBlocks: { tier: 2, count: 4 } }
    },
    {
        id: 'w4', name: 'Oil Port', emoji: '⚓', theme: 'port',
        plates: 4, minTier: 1, checkpoint: false,
        obstacles: { gapW: [34, 42], tall: 0.3 },
        levels: [
            level('4-1', 0, ['there', 'little', 'one'], { oi: ['oil', 'coin', 'foil', 'boil'] }),
            level('4-2', 1, ['do', 'children', 'love'], { ear: ['gear', 'near', 'hear', 'clear'] }),
            level('4-3', 3, ['oh', 'their', 'people'], { air: ['air', 'chair', 'fair', 'pair'] }),
            level('4-4', 5, [], { oi: ['join', 'point', 'soil'], ear: ['fear', 'year', 'dear'] }),
            level('4-5', 7, [], { air: ['hair', 'stairs', 'chair'], oi: ['coin', 'point'], ear: ['gear', 'clear'] })
        ],
        boss: { name: 'Gusher', gates: 10, seconds: 9, needStars: 10, needBlocks: { tier: 2, count: 8 } }
    },
    {
        id: 'w5', name: 'Storm Tower', emoji: '⚡', theme: 'storm',
        plates: 4, minTier: 1, checkpoint: false,
        obstacles: { gapW: [36, 44], tall: 0.35 },
        levels: [
            level('5-1', 0, ['Mr', 'Mrs', 'your'], { er: ['tower', 'power', 'under', 'hammer'] }),
            level('5-2', 1, ['ask', 'asked', 'should'], { ure: ['pure', 'cure'], er: ['faster', 'laser'] }),
            level('5-3', 3, ['would', 'could', 'house'], { er: ['booster', 'letter', 'better', 'summer'] }),
            level('5-4', 5, ['mouse', 'water', 'want', 'very'], { ure: ['pure', 'cure'] }),
            level('5-5', 7, [], { er: ['corner', 'power', 'tower'], ure: ['cure', 'pure'] })
        ],
        boss: { name: 'Darkstorm', gates: 12, seconds: 9, needStars: 10, needBlocks: { tier: 3, count: 4 } }
    }
];

// Every stage in play order. A boss stage tests the whole world's items.
export const LEVELS = WORLDS.flatMap((w, wi) => [
    ...w.levels.map(l => ({ ...l, world: w, worldIndex: wi, boss: false, gates: 8 })),
    {
        id: `${wi + 1}-boss`, name: w.boss.name, world: w, worldIndex: wi, boss: true,
        gates: w.boss.gates, needStars: w.boss.needStars, gpcs: [],
        items: dedupe(w.levels.flatMap(l => l.items))
    }
]);

function dedupe(items) {
    const seen = new Set();
    return items.filter(i => !seen.has(i.id) && seen.add(i.id));
}

// Every item once (a word can be reviewed in more than one level of a world).
export const ALL_ITEMS = dedupe(LEVELS.flatMap(l => l.items));

export function worldItems(worldIndex) {
    return dedupe(LEVELS.filter(l => l.worldIndex === worldIndex).flatMap(l => l.items));
}

// Words that sound the same. A hear-it gate never shows one as a wrong plate, because
// he cannot tell them apart by ear. A read-it gate (sentence) may: that is the skill.
export const HOMOPHONES = [
    ['to', 'too', 'two'], ['there', 'their'], ['one', 'won'], ['some', 'sum'], ['be', 'bee'],
    ['we', 'wee'], ['so', 'sew'], ['oh', 'owe'], ['hear', 'here'], ['for', 'four'], ['right', 'write'],
    ['tail', 'tale'], ['night', 'knight'], ['pair', 'pear'], ['fair', 'fare'], ['hair', 'hare'],
    ['sight', 'site'], ['would', 'wood'], ['your', 'yore'], ['dear', 'deer'], ['main', 'mane'],
    ['rain', 'rein'], ['wait', 'weight'], ['might', 'mite'], ['made', 'maid'], ['road', 'rode']
];
export function soundsSame(a, b) {
    const x = a.toLowerCase(), y = b.toLowerCase();
    return x === y || HOMOPHONES.some(g => g.includes(x) && g.includes(y));
}

// Extra real, readable words used only as wrong plates (look-alikes of the targets).
export const DISTRACTOR_WORDS = [
    'they', 'then', 'them', 'ten', 'top', 'got', 'no', 'dog', 'on', 'in', 'it', 'tin', 'not',
    'off', 'if', 'pat', 'but', 'pot', 'pit', 'pill', 'bull', 'full', 'bush', 'rush', 'posh',
    'bed', 'hen', 'shop', 'ship', 'chap', 'chin', 'such', 'rash', 'than', 'path', 'mash', 'moss',
    'shut', 'hat', 'hut', 'bank', 'hunk', 'clunk', 'clink', 'plank', 'wing', 'sink', 'link', 'tack',
    'tang', 'mush',
    // Worlds 2–5
    'saw', 'wag', 'wash', 'hers', 'try', 'yes', 'yell', 'bell', 'fall', 'hall', 'tell', 'wall', 'call',
    'ill', 'him', 'is', 'has', 'bus', 'bun', 'whip', 'sad', 'sit', 'sip', 'see', 'hive', 'wet', 'our',
    'lake', 'lick', 'sun', 'cone', 'came', 'home', 'three', 'tree', 'lit', 'lift', 'owe', 'dot', 'dove',
    'lot', 'ho', 'peep', 'pole', 'sour', 'yours', 'asks', 'shed', 'hold', 'hose', 'horse', 'moose',
    'winter', 'went', 'vet', 'ferry', 'berry', 'rail', 'ran', 'tin', 'tight', 'sigh', 'fight', 'nigh',
    'boot', 'cool', 'room', 'loom', 'bar', 'jar', 'tar', 'burp', 'turf', 'lock', 'hock', 'fort', 'form',
    'cord', 'coil', 'join', 'fool', 'gear', 'near', 'chain', 'fail', 'pain', 'fern', 'term', 'tow', 'cut'
];
