// Torch Quest word mastery (pure logic). See docs/torch-quest-design.md §6.
// Saved in localStorage under `y1Quest` (this browser on this device only).
import { LEVELS } from './content.js';

const KEY = 'y1Quest';
export const TIERS = ['Scrap', 'Copper', 'Silver', 'Gold'];
export const TICKS_TO_PROMOTE = 3;
export const GATES_PER_LEVEL = 8;
const RUST_MS = 7 * 24 * 60 * 60 * 1000;

export function loadState() {
    try {
        const s = JSON.parse(localStorage.getItem(KEY));
        if (s && typeof s === 'object') return { items: {}, levels: {}, bolts: 0, ...s };
    } catch (e) { /* fall through */ }
    return { items: {}, levels: {}, bolts: 0 };
}

export function saveState(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
}

export function dayOf(now = Date.now()) {
    const d = new Date(now);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function itemState(state, id) {
    return state.items[id] || { tier: 0, ticks: 0, promoDay: null, missDay: null, misses: 0, last: 0 };
}

export function isRusty(state, id, now = Date.now()) {
    const it = state.items[id];
    return !!it && it.tier > 0 && now - it.last > RUST_MS;
}

// A word is waiting in the forge when it has its 3 ticks but already went up a tier today.
export function inForge(state, id, now = Date.now()) {
    const it = itemState(state, id);
    return it.ticks >= TICKS_TO_PROMOTE && it.tier < TIERS.length - 1 && it.promoDay === dayOf(now);
}

// Record one gate answer. Returns { promoted, demoted, tier }.
export function recordAnswer(state, id, correct, now = Date.now()) {
    const it = state.items[id] = { ...itemState(state, id) };
    const today = dayOf(now);
    const out = { promoted: false, demoted: false };
    if (it.missDay !== today) { it.missDay = today; it.misses = 0; }
    if (correct) {
        it.ticks = Math.min(TICKS_TO_PROMOTE, it.ticks + 1);
        // Only one tier per word per day: "blocks need a night in the forge".
        if (it.ticks >= TICKS_TO_PROMOTE && it.tier < TIERS.length - 1 && it.promoDay !== today) {
            it.tier++;
            it.ticks = 0;
            it.promoDay = today;
            out.promoted = true;
        }
    } else {
        it.ticks = Math.max(0, it.ticks - 1);
        it.misses++;
        if (it.misses >= 2 && it.tier > 0) {
            it.tier--;
            it.ticks = 0;
            it.misses = 0;
            out.demoted = true;
        }
    }
    it.last = now;
    out.tier = it.tier;
    return out;
}

// Weakest first: rusty, then lowest tier, then fewest ticks, then longest unseen.
function weakness(state, now) {
    return (a, b) => {
        const A = itemState(state, a.id), B = itemState(state, b.id);
        return (isRusty(state, b.id, now) - isRusty(state, a.id, now)) || (A.tier - B.tier) || (A.ticks - B.ticks) || (A.last - B.last);
    };
}

function shuffled(list, rng) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// The 8 gate items for a level: mostly its new words, up to 3 from earlier levels (weakest first).
export function pickGateItems(levelIndex, state, rng = Math.random, now = Date.now()) {
    const fresh = LEVELS[levelIndex].items;
    const earlier = LEVELS.slice(0, levelIndex).flatMap(l => l.items);
    const review = shuffled(earlier, rng).sort(weakness(state, now)).slice(0, 3);
    const need = GATES_PER_LEVEL - review.length;
    // Each new word at least once where there is room, then the weakest again.
    let chosen = shuffled(fresh, rng).sort(weakness(state, now)).slice(0, need);
    const byWeakness = [...chosen];
    while (chosen.length < need) chosen.push(byWeakness[(chosen.length - byWeakness.length) % byWeakness.length]);
    // No word twice in a row: reshuffle until that holds (a handful of tries at most).
    let all = shuffled([...chosen, ...review], rng);
    for (let tries = 0; tries < 200 && all.some((x, i) => i && x.id === all[i - 1].id); tries++) {
        all = shuffled(all, rng);
    }
    return all;
}

export function totalStars(state) {
    return LEVELS.reduce((n, l) => n + (state.levels[l.id]?.stars || 0), 0);
}

export function isLevelUnlocked(levelIndex, state) {
    if (levelIndex === 0) return true;
    const prev = LEVELS[levelIndex - 1];
    return (state.levels[prev.id]?.stars || 0) >= 1 && totalStars(state) >= LEVELS[levelIndex].needStars;
}

export function finishLevel(state, levelId, stars, bolts = 0) {
    const l = state.levels[levelId] = { stars: 0, fails: 0, ...state.levels[levelId] };
    l.stars = Math.max(l.stars, stars);
    state.bolts = (state.bolts || 0) + bolts;
    return l;
}

export function failLevel(state, levelId) {
    const l = state.levels[levelId] = { stars: 0, fails: 0, ...state.levels[levelId] };
    l.fails++;
    return l;
}
