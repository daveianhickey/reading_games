// Torch Quest content: worlds → levels → items. See docs/torch-quest-design.md §8.
// Tricky words reuse curriculum item ids (w-the). Each focus GPC is practised through
// a few decodable words that carry it (ch:chop).

const tricky = w => ({ id: `w-${w}`, word: w, kind: 'tricky' });
const sound = (gpc, w) => ({ id: `${gpc}:${w}`, word: w, kind: 'gpc', gpc });

function level(id, name, needStars, words, gpc, decodable) {
    return { id, name, needStars, gpc, items: [...words.map(tricky), ...decodable.map(w => sound(gpc, w))] };
}

export const WORLDS = [
    {
        id: 'w1',
        name: 'Scrap Yard',
        checkpoint: true, // early worlds restart from the mid-level flag (once per try)
        levels: [
            level('1-1', 'Level 1', 0, ['the', 'to', 'go'], 'ch', ['chop', 'chip', 'rich', 'much']),
            level('1-2', 'Level 2', 1, ['into', 'of', 'put'], 'th', ['this', 'that', 'thud', 'moth']),
            level('1-3', 'Level 3', 3, ['pull', 'push', 'he'], 'nk', ['tank', 'honk', 'clank', 'wink'])
        ]
    }
];

export const LEVELS = WORLDS.flatMap(w => w.levels.map(l => ({ ...l, world: w })));
export const ALL_ITEMS = LEVELS.flatMap(l => l.items);

// Extra real, readable words used only as wrong plates (look-alikes of the targets).
export const DISTRACTOR_WORDS = [
    'they', 'then', 'them', 'ten', 'too', 'top', 'got', 'no', 'so', 'dog', 'on', 'in', 'it', 'tin', 'not',
    'off', 'for', 'if', 'pat', 'but', 'pot', 'pit', 'pill', 'bull', 'full', 'bush', 'rush', 'posh', 'her',
    'we', 'me', 'be', 'bed', 'hen', 'shop', 'ship', 'chap', 'chat', 'chin', 'such', 'rash', 'with', 'thin',
    'than', 'bath', 'path', 'mash', 'moss', 'thump', 'shut', 'hat', 'hut', 'sank', 'bank', 'hunk', 'think',
    'clunk', 'clink', 'plank', 'wing', 'sink', 'pink', 'link', 'tack', 'hook', 'tang', 'much', 'mush'
];
