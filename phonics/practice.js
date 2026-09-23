// Educational layer: what the learner has chosen to practise, target pools for games, progress tracking.
import { allItems, findItem, label } from './curriculum.js';

const SELECTION_KEY = 'y1Selection';
const PROGRESS_KEY = 'y1Progress';

function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
        return fallback;
    }
}

function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
}

export function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function getSelection() {
    return readJSON(SELECTION_KEY, []);
}

export function setSelection(ids) {
    writeJSON(SELECTION_KEY, [...new Set(ids)]);
}

export function getSelectedItems(words = []) {
    return getSelection().map(id => findItem(id, words)).filter(Boolean);
}

// Items a game should practise: the learner's chosen items that the game accepts,
// otherwise the game's defaults. `accepts` filters items; `defaults` is a list of item ids.
// `minDistinct` tops the pool up from defaults when a game needs several different tiles (e.g. memory pairs).
export function buildPool({ words = [], accepts, defaults, minDistinct = 1 }) {
    const chosen = getSelectedItems(words).filter(accepts);
    const fallback = defaults.map(id => findItem(id, words)).filter(Boolean);
    if (!chosen.length) return { items: fallback, usingDefaults: true };

    const items = [...chosen];
    for (const item of shuffle(fallback)) {
        if (distinctLabels(items) >= minDistinct) break;
        if (!items.some(i => label(i) === label(item))) items.push(item);
    }
    return { items, usingDefaults: false };
}

function distinctLabels(items) {
    return new Set(items.map(label)).size;
}

// Pick `count` items with different tile labels (so e.g. oo-spoon and oo-book never share a board).
export function pickDistinct(pool, count) {
    const picked = [];
    for (const item of shuffle(pool)) {
        if (picked.length >= count) break;
        if (!picked.some(p => label(p) === label(item))) picked.push(item);
    }
    return picked;
}

// Wrong answers for a target: same kind, different label; prefer the practice pool, then the whole curriculum.
export function pickDistractors(target, pool, count, words = []) {
    const sameKind = i => i.kind === target.kind && label(i) !== label(target) && !!i.split === !!target.split;
    const out = [];
    const add = candidates => {
        for (const item of shuffle(candidates)) {
            if (out.length >= count) return;
            if (!out.some(o => label(o) === label(item))) out.push(item);
        }
    };
    add(pool.filter(sameKind));
    add(allItems(words).filter(sameKind));
    if (out.length < count) add(allItems(words).filter(i => i.kind === target.kind && label(i) !== label(target)));
    return out;
}

// Round targets: cycle through the pool in shuffled order, avoiding immediate repeats.
export function targetSequence(pool, count) {
    const seq = [];
    let bag = [];
    while (seq.length < count) {
        if (!bag.length) bag = shuffle(pool);
        const next = bag.shift();
        if (pool.length > 1 && seq.length && label(seq[seq.length - 1]) === label(next)) {
            bag.push(next);
            continue;
        }
        seq.push(next);
    }
    return seq;
}

export function recordResult(itemId, correct) {
    const progress = readJSON(PROGRESS_KEY, {});
    const entry = progress[itemId] || { correct: 0, tries: 0 };
    entry.tries++;
    if (correct) entry.correct++;
    entry.last = Date.now();
    progress[itemId] = entry;
    writeJSON(PROGRESS_KEY, progress);
}

export function getProgress() {
    return readJSON(PROGRESS_KEY, {});
}
