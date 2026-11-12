// Torch Quest word mastery (pure logic). See docs/torch-quest-design.md §6.
// Saved in localStorage under `y1Quest` (this browser on this device only).
import { LEVELS, WORLDS, worldItems } from './content.js';

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

// The gate items for a stage. A level: mostly its new words, up to 3 from earlier levels
// (weakest and rustiest first). A boss: the world's weakest words, every one at least once
// if there is room.
export function pickGateItems(levelIndex, state, rng = Math.random, now = Date.now()) {
    const lvl = LEVELS[levelIndex];
    const count = lvl.gates || GATES_PER_LEVEL;
    const fresh = lvl.items;
    const freshIds = new Set(fresh.map(i => i.id));
    let review = [];
    if (!lvl.boss) {
        const seen = new Set(freshIds);
        const earlier = LEVELS.slice(0, levelIndex).flatMap(l => l.items).filter(i => !seen.has(i.id) && seen.add(i.id));
        review = shuffled(earlier, rng).sort(weakness(state, now)).slice(0, 3);
    }
    const need = count - review.length;
    // Each new word at least once where there is room, then the weakest again.
    const chosen = shuffled(fresh, rng).sort(weakness(state, now)).slice(0, need);
    const byWeakness = [...chosen];
    while (chosen.length < need) chosen.push(byWeakness[(chosen.length - byWeakness.length) % byWeakness.length]);
    // No word twice in a row: reshuffle until that holds (a handful of tries at most).
    let all = shuffled([...chosen, ...review], rng);
    for (let tries = 0; tries < 200 && all.some((x, i) => i && x.id === all[i - 1].id); tries++) {
        all = shuffled(all, rng);
    }
    return all;
}

const stars = (state, id) => state.levels[id]?.stars || 0;

export function totalStars(state) {
    return LEVELS.reduce((n, l) => n + stars(state, l.id), 0);
}

// Stars from a world's five levels (the boss's stars are not counted towards its own door).
export function worldStars(state, worldIndex) {
    return LEVELS.filter(l => l.worldIndex === worldIndex && !l.boss).reduce((n, l) => n + stars(state, l.id), 0);
}

export function blocksAtTier(state, worldIndex, tier) {
    return worldItems(worldIndex).filter(i => itemState(state, i.id).tier >= tier).length;
}

export function bossLevelIndex(worldIndex) {
    return LEVELS.findIndex(l => l.worldIndex === worldIndex && l.boss);
}

export function isWorldUnlocked(worldIndex, state) {
    return worldIndex === 0 || stars(state, LEVELS[bossLevelIndex(worldIndex - 1)].id) >= 1;
}

// What the boss door asks for, and how far he has got.
export function bossDoor(state, worldIndex) {
    const boss = WORLDS[worldIndex].boss;
    const levels = LEVELS.filter(l => l.worldIndex === worldIndex && !l.boss);
    const door = {
        levelsDone: levels.filter(l => stars(state, l.id) >= 1).length,
        levels: levels.length,
        stars: worldStars(state, worldIndex),
        needStars: boss.needStars,
        blocks: blocksAtTier(state, worldIndex, boss.needBlocks.tier),
        needBlocks: boss.needBlocks.count,
        tier: boss.needBlocks.tier
    };
    door.open = door.levelsDone === door.levels && door.stars >= door.needStars && door.blocks >= door.needBlocks;
    return door;
}

export function isLevelUnlocked(levelIndex, state) {
    const lvl = LEVELS[levelIndex];
    if (!isWorldUnlocked(lvl.worldIndex, state)) return false;
    // Once beaten, a boss stays open even if a block later slips back a step.
    if (lvl.boss) return stars(state, lvl.id) >= 1 || bossDoor(state, lvl.worldIndex).open;
    const prev = LEVELS[levelIndex - 1];
    if (!prev || prev.worldIndex !== lvl.worldIndex) return true;
    return stars(state, prev.id) >= 1 && worldStars(state, lvl.worldIndex) >= lvl.needStars;
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
