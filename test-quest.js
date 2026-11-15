// Torch Quest tests: run with `node test-quest.js` (part of `npm test`).
// Rules come from docs/torch-quest-design.md.
import { JSDOM } from 'jsdom';
import assert from 'assert';

const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, { url: 'http://localhost/', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.localStorage = dom.window.localStorage;
global.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 16);
global.cancelAnimationFrame = id => clearTimeout(id);
dom.window.HTMLCanvasElement.prototype.getContext = () => null; // no canvas in jsdom

const { LEVELS, WORLDS, ALL_ITEMS, DISTRACTOR_WORDS, soundsSame, worldItems } = await import('./quest/content.js');
const m = await import('./quest/mastery.js');
const g = await import('./quest/gates.js');
const { WORD_BANK } = await import('./quest/wordbank.js');
const { letterDiff } = await import('./quest/index.js');
const { createRun, createTapGuard, CHECKPOINT_AFTER, TURBO_STREAK } = await import('./quest/run.js');
const { rollCrate } = await import('./quest/rewards.js');
const { buildCourse, mulberry32, GROUND_Y } = await import('./quest/level.js');
const { createGame, RESPAWN_BACK } = await import('./quest/runner.js');
const { initTorchQuest } = await import('./quest/index.js');
const { findItem } = await import('./phonics/curriculum.js');
const d = await import('./stories/decodable.js');

let failures = 0;
async function test(name, fn) {
    localStorage.clear();
    document.body.innerHTML = '';
    try {
        await fn();
        console.log(`✅ ${name}`);
    } catch (e) {
        failures++;
        console.log(`❌ ${name}\n   ${e.message}`);
    }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
// After the flag: hammer any forge blocks, open the mystery crate, then the results screen.
async function throughRewards(el) {
    for (let guard = 0; guard < 20 && el.querySelector('#tq-hammer, #tq-forged, #tq-crate, #tq-continue'); guard++) {
        const btn = el.querySelector('#tq-hammer, #tq-forged, #tq-crate, #tq-continue');
        btn.click();
        await sleep(2);
    }
}
const fresh = () => ({ items: {}, levels: {}, bolts: 0 });
const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 0, 5, 10).getTime();

// ---------- Content ----------

await test('content: every item comes from the curriculum and is on the focus list', () => {
    for (const l of LEVELS) {
        const ids = l.items.map(i => i.id);
        assert.strictEqual(new Set(ids).size, ids.length, `${l.id}: item ids are unique`);
    }
    assert.strictEqual(new Set(LEVELS.map(l => l.id)).size, LEVELS.length, 'level ids are unique');
    // Shipped level ids are saved progress: they must never change.
    assert.deepStrictEqual(LEVELS.slice(0, 3).map(l => l.id), ['1-1', '1-2', '1-3']);
    assert.deepStrictEqual(LEVELS[0].items.map(i => i.id), ['w-the', 'w-to', 'w-go', 'ch:chop', 'ch:chip', 'ch:rich', 'ch:much']);
    for (const item of ALL_ITEMS) {
        if (item.kind === 'tricky') {
            assert.ok(findItem(item.id), `${item.id} is not a curriculum item`);
            assert.ok(d.FOCUS_WORDS.includes(item.word.toLowerCase()), `${item.word} is not a focus word`);
        } else {
            assert.ok(d.FOCUS_GPC_IDS.includes(item.gpc), `${item.gpc} is not a focus GPC`);
            assert.strictEqual(d.whyReadable(item.word), 'decodable', `${item.word} is not decodable`);
            assert.ok(d.findGpc(item.word, item.gpc), `${item.word} does not carry ${item.gpc}`);
        }
    }
});

await test('content: the five worlds cover every focus word and every focus sound', () => {
    assert.strictEqual(WORLDS.length, 5);
    for (const w of WORLDS) assert.strictEqual(w.levels.length, 5, `${w.name} has 5 levels`);
    assert.strictEqual(LEVELS.length, 30, '25 levels + 5 bosses');
    const words = new Set(ALL_ITEMS.filter(i => i.kind === 'tricky').map(i => i.word.toLowerCase()));
    assert.deepStrictEqual(d.FOCUS_WORDS.filter(w => !words.has(w)), [], 'focus words missing');
    const gpcs = new Set(ALL_ITEMS.filter(i => i.kind === 'gpc').map(i => i.gpc));
    assert.deepStrictEqual(d.FOCUS_GPC_IDS.filter(g => !gpcs.has(g)), [], 'focus sounds missing');
    for (const l of LEVELS.filter(l => !l.boss)) assert.ok(l.items.length >= 5, `${l.id} has only ${l.items.length} items`);
    for (const l of LEVELS.filter(l => l.boss)) {
        assert.deepStrictEqual(new Set(l.items.map(i => i.id)), new Set(worldItems(l.worldIndex).map(i => i.id)), `${l.id} tests the whole world`);
    }
});

await test('content: the skill ladder never gets easier from one world to the next', () => {
    for (let i = 1; i < WORLDS.length; i++) {
        const a = WORLDS[i - 1], b = WORLDS[i];
        assert.ok(b.plates >= a.plates && b.minTier >= a.minTier, `${b.name} plates / gate floor`);
        assert.ok(!(b.checkpoint && !a.checkpoint), `${b.name} flag`);
        assert.ok(b.obstacles.gapW[1] >= a.obstacles.gapW[1] && b.obstacles.tall >= a.obstacles.tall, `${b.name} obstacles`);
        assert.ok(b.boss.seconds <= a.boss.seconds, `${b.name} boss fuse`);
        assert.ok(b.boss.needBlocks.tier >= a.boss.needBlocks.tier, `${b.name} boss door`);
    }
    assert.ok(WORLDS[0].checkpoint && WORLDS[1].checkpoint && !WORLDS[2].checkpoint, 'flag in the early worlds only');
});

await test('content: every wrong plate is a real word he can read', () => {
    const bad = [...DISTRACTOR_WORDS, ...WORD_BANK].filter(w => !d.whyReadable(w));
    assert.deepStrictEqual(bad, []);
});

// ---------- Gates ----------

await test('gates: exactly one right plate, no duplicates, right word in the stated place', () => {
    const rng = mulberry32(1);
    for (const item of ALL_ITEMS) {
        for (const tier of [0, 1, 2, 3]) {
            for (const n of [3, 4]) {
                const gate = g.buildGate(item, tier, rng, -1, n);
                assert.strictEqual(gate.plates.length, n, `${item.word} tier ${tier}: ${gate.plates}`);
                assert.strictEqual(new Set(gate.plates).size, n, `duplicate plate for ${item.word}: ${gate.plates}`);
                assert.strictEqual(gate.plates[gate.correctIndex], item.word);
                assert.strictEqual(gate.plates.filter(w => w === item.word).length, 1);
                assert.strictEqual(gate.mode, tier >= 3 && item.clue ? 'sentence' : tier >= 2 ? 'flash' : 'hear');
            }
        }
    }
});

// ---------- Fair plates (design §5a): no first-letter or length shortcut ----------

await test('fair plates: every gate, every tier: same start, same length, target not the odd one in', () => {
    const rng = mulberry32(2);
    let gates = 0;
    const problems = [];
    for (const item of ALL_ITEMS) {
        for (const tier of [0, 1, 2, 3]) {
            for (const n of [3, 4]) {
                for (let k = 0; k < 8; k++) {
                    const gate = g.buildGate(item, tier, rng, -1, n);
                    gates++;
                    for (const p of g.fairnessProblems(gate.plates, item.word, gate.mode)) problems.push(`${gate.plates.join('/')}: ${p}`);
                }
            }
        }
    }
    // First letter and length are the shortcuts he really used: never. Odd-one-in is rare and
    // tested by the shortcut players below.
    const hard = problems.filter(p => !/odd one in/.test(p));
    assert.deepStrictEqual(hard.slice(0, 5), [], `${hard.length} of ${gates} gates give the word away`);
    const odd = problems.length - hard.length;
    assert.ok(odd / gates < 0.05, `${odd} of ${gates} gates have the target as the odd one in`);
    console.log('   e.g. ' + ['buses', 'be', 'thump', 'children', 'said', 'to'].map(w => g.buildGate(ALL_ITEMS.find(i => i.word === w), 1, rng, -1, 3).plates.join('/')).join(', '));
});

await test('fair plates: the bad gate from the screenshot (be / thump / we) can no longer happen', () => {
    const rng = mulberry32(3);
    for (const w of ['be', 'we', 'buses', 'thump']) {
        const item = ALL_ITEMS.find(i => i.word === w);
        for (let k = 0; k < 200; k++) {
            const { plates } = g.buildGate(item, k % 4, rng, -1, 3 + (k % 2));
            assert.ok(plates.every(p => Math.abs(p.length - w.length) <= 1 || (w.length <= 2 && p.length === 2)), `${w}: ${plates}`);
            if (w.length > 2) assert.ok(plates.every(p => p[0] === w[0]), `${w}: ${plates}`);
            else assert.ok(plates.some(p => p !== w && p[0] === w[0]), `${w}: ${plates}`);
        }
    }
});

await test('fair plates: alien words only when real words run out, at most one, never a sound-alike or rude', () => {
    const rng = mulberry32(4);
    const needAliens = new Set();
    for (const item of ALL_ITEMS) {
        for (let k = 0; k < 40; k++) {
            const gate = g.buildGate(item, k % 4, rng, -1, 3 + (k % 2));
            const aliens = gate.plates.filter(w => w !== item.word && g.isAlien(w));
            assert.ok(aliens.length <= 1, `${item.word}: ${gate.plates}`);
            if (aliens.length) needAliens.add(item.word);
            for (const a of aliens) {
                assert.ok(!soundsSame(a, item.word), a);
                assert.ok(d.whyReadable(a), `${a} must be decodable`);
            }
        }
    }
    // Only two-letter words (to, go, we…) have no real same-start partner. Any other word on
    // this list needs more real words in quest/wordbank.js.
    const long = [...needAliens].filter(w => w.length > 2);
    assert.deepStrictEqual(long, [], 'add real words to quest/wordbank.js for these');
    console.log(`   alien words used only for: ${[...needAliens].join(', ')} (e.g. to → ${g.alienWords('to').join(', ')})`);
    for (const item of ALL_ITEMS) for (const a of g.alienWords(item.word)) assert.ok(a[0] === item.word[0].toLowerCase() && a.length === item.word.length, a);
});

await test('fair plates: a miss shows which letters differ', () => {
    assert.deepStrictEqual(letterDiff('boxes', 'buses'), [[true, false, false, true, true], [true, false, false, true, true]]);
    const [a, b] = letterDiff('bunk', 'buses');
    assert.deepStrictEqual(a, [true, true, false, false]);
    assert.strictEqual(b.filter(x => !x).length, 3);
});

await test('gates: a hear-it gate never shows a sound-alike (to / too, there / their)', () => {
    const rng = mulberry32(21);
    for (const item of ALL_ITEMS) {
        for (const tier of [0, 1, 2]) {
            for (let k = 0; k < 5; k++) {
                const gate = g.buildGate(item, tier, rng, -1, 4);
                for (let a = 0; a < gate.plates.length; a++) for (let b = a + 1; b < gate.plates.length; b++) {
                    assert.ok(!soundsSame(gate.plates[a], gate.plates[b]), `${gate.plates[a]} / ${gate.plates[b]}`);
                }
            }
        }
    }
});

await test('gates: a sentence gate has no other word that fits the gap, except there / their', () => {
    const rng = mulberry32(22);
    const tricky = new Set(ALL_ITEMS.filter(i => i.kind === 'tricky').map(i => i.word.toLowerCase()));
    for (const item of ALL_ITEMS.filter(i => i.clue)) {
        const gate = g.buildGate(item, 3, rng, -1, 4);
        assert.strictEqual(gate.mode, 'sentence');
        assert.ok(gate.clue.includes('___'));
        const others = gate.plates.filter(w => w !== item.word);
        const partner = { there: 'their', their: 'there' }[item.word];
        // Mr has no same-start word that is not tricky; my / me cannot fit "___ Smith".
        const allowed = [partner, ...(item.word === 'Mr' ? ['my', 'me'] : [])];
        for (const w of others) assert.ok(!tricky.has(w.toLowerCase()) || allowed.includes(w), `${item.word}: ${w} could fit “${item.clue}”`);
        if (partner) assert.ok(others.includes(partner), `${item.word} is tested against ${partner}`);
    }
});

await test('gates: the right plate is never in the same place three times running', () => {
    const rng = mulberry32(3);
    for (let n = 0; n < 200; n++) {
        const run = createRun({ levelIndex: 0, state: fresh(), rng, now: () => T0 });
        const seen = [];
        while (run.status === 'running') { const gate = run.currentGate(); seen.push(gate.correctIndex); run.answer(gate.correctIndex); }
        for (let i = 2; i < seen.length; i++) assert.ok(!(seen[i] === seen[i - 1] && seen[i] === seen[i - 2]), seen.join(''));
    }
});

// ---------- Mastery ----------

await test('mastery: 3 right answers go up a tier, but only one tier per day', () => {
    const st = fresh();
    assert.strictEqual(m.recordAnswer(st, 'w-the', true, T0).promoted, false);
    assert.strictEqual(m.recordAnswer(st, 'w-the', true, T0).promoted, false);
    assert.strictEqual(m.recordAnswer(st, 'w-the', true, T0).promoted, true);
    assert.strictEqual(st.items['w-the'].tier, 1);
    for (let i = 0; i < 5; i++) assert.strictEqual(m.recordAnswer(st, 'w-the', true, T0 + i * 1000).promoted, false, 'second tier on the same day');
    assert.strictEqual(st.items['w-the'].tier, 1);
    assert.ok(m.inForge(st, 'w-the', T0));
    assert.strictEqual(m.recordAnswer(st, 'w-the', true, T0 + DAY).promoted, true, 'next day it comes out of the forge');
    assert.strictEqual(st.items['w-the'].tier, 2);
    // Gold needs at least three different days.
    for (let i = 0; i < 3; i++) m.recordAnswer(st, 'w-the', true, T0 + 2 * DAY);
    assert.strictEqual(st.items['w-the'].tier, 3);
    for (let i = 0; i < 3; i++) m.recordAnswer(st, 'w-the', true, T0 + 3 * DAY);
    assert.strictEqual(st.items['w-the'].tier, 3, 'Gold is the top');
});

await test('mastery: a miss removes a tick, two misses in a day drop a tier, never below Scrap', () => {
    const st = fresh();
    for (let i = 0; i < 3; i++) m.recordAnswer(st, 'w-to', true, T0);
    m.recordAnswer(st, 'w-to', true, T0 + DAY);
    m.recordAnswer(st, 'w-to', true, T0 + DAY);
    assert.strictEqual(st.items['w-to'].ticks, 2);
    assert.strictEqual(m.recordAnswer(st, 'w-to', false, T0 + DAY).demoted, false);
    assert.strictEqual(st.items['w-to'].ticks, 1);
    assert.strictEqual(m.recordAnswer(st, 'w-to', false, T0 + DAY).demoted, true);
    assert.strictEqual(st.items['w-to'].tier, 0);
    m.recordAnswer(st, 'w-to', false, T0 + DAY);
    m.recordAnswer(st, 'w-to', false, T0 + DAY);
    assert.strictEqual(st.items['w-to'].tier, 0);
    // Misses on different days do not add up.
    for (let i = 0; i < 3; i++) m.recordAnswer(st, 'w-go', true, T0);
    m.recordAnswer(st, 'w-go', false, T0 + DAY);
    m.recordAnswer(st, 'w-go', false, T0 + 2 * DAY);
    assert.strictEqual(st.items['w-go'].tier, 1);
});

await test('mastery: words go rusty after a week away and are picked first', () => {
    const st = fresh();
    for (const item of LEVELS[0].items) for (let i = 0; i < 3; i++) m.recordAnswer(st, item.id, true, T0 + 9 * DAY);
    for (let i = 0; i < 3; i++) m.recordAnswer(st, 'w-go', true, T0);
    st.items['w-go'].last = T0;
    assert.ok(m.isRusty(st, 'w-go', T0 + 10 * DAY));
    assert.ok(!m.isRusty(st, 'w-the', T0 + 10 * DAY));
    const picked = m.pickGateItems(1, st, mulberry32(4), T0 + 10 * DAY);
    assert.ok(picked.some(i => i.id === 'w-go'), 'rusty word is in the review slots');
});

await test('mastery: a level has 8 gates, every new word, 3 review words; a boss tests its world', () => {
    for (let li = 0; li < LEVELS.length; li++) {
        const lvl = LEVELS[li];
        for (let seed = 0; seed < 30; seed++) {
            const picked = m.pickGateItems(li, fresh(), mulberry32(seed), T0);
            assert.strictEqual(picked.length, lvl.boss ? lvl.world.boss.gates : 8);
            const own = new Set(lvl.items.map(i => i.id));
            const review = picked.filter(i => !own.has(i.id));
            assert.strictEqual(review.length, li === 0 || lvl.boss ? 0 : 3);
            const expected = Math.min(own.size, picked.length - review.length);
            assert.strictEqual(new Set(picked.filter(i => own.has(i.id)).map(i => i.id)).size, expected);
            for (let i = 1; i < picked.length; i++) assert.notStrictEqual(picked[i].id, picked[i - 1].id, `seed ${seed}`);
        }
    }
});

await test('mastery: boss door needs all 5 levels, 10 stars and enough blocks; the boss opens the next world', () => {
    const st = fresh();
    const boss1 = m.bossLevelIndex(0);
    assert.strictEqual(LEVELS[boss1].id, '1-boss');
    for (const id of ['1-1', '1-2', '1-3', '1-4', '1-5']) m.finishLevel(st, id, 2);
    assert.ok(!m.isLevelUnlocked(boss1, st), 'no Copper blocks yet');
    let door = m.bossDoor(st, 0);
    assert.deepStrictEqual([door.levelsDone, door.stars, door.blocks, door.needBlocks], [5, 10, 0, 6]);
    for (const item of worldItems(0).slice(0, 6)) for (let i = 0; i < 3; i++) m.recordAnswer(st, item.id, true, T0);
    assert.ok(m.isLevelUnlocked(boss1, st));
    assert.ok(!m.isWorldUnlocked(1, st));
    assert.ok(!m.isLevelUnlocked(boss1 + 1, st), 'world 2 waits for the boss');
    m.finishLevel(st, '1-boss', 1);
    assert.ok(m.isWorldUnlocked(1, st));
    for (const item of worldItems(0).slice(0, 6)) { m.recordAnswer(st, item.id, false, T0); m.recordAnswer(st, item.id, false, T0); }
    assert.ok(m.isLevelUnlocked(boss1, st), 'a beaten boss stays open after blocks slip back');
    assert.ok(m.isLevelUnlocked(boss1 + 1, st), 'world 2 level 1 opens');
    assert.ok(!m.isLevelUnlocked(boss1 + 2, st));
    // World 3's door needs Silver blocks: at least two days of play.
    const st3 = fresh();
    for (const id of ['3-1', '3-2', '3-3', '3-4', '3-5']) m.finishLevel(st3, id, 3);
    const w3 = worldItems(2).slice(0, 4);
    for (const item of w3) for (let i = 0; i < 6; i++) m.recordAnswer(st3, item.id, true, T0);
    assert.strictEqual(m.bossDoor(st3, 2).blocks, 0, 'one day is not enough for Silver');
    for (const item of w3) for (let i = 0; i < 3; i++) m.recordAnswer(st3, item.id, true, T0 + DAY);
    assert.strictEqual(m.bossDoor(st3, 2).blocks, 4);
    assert.ok(m.bossDoor(st3, 2).open);
});

await test('mastery: levels unlock with stars; state survives a save and load', () => {
    const st = fresh();
    assert.ok(m.isLevelUnlocked(0, st));
    assert.ok(!m.isLevelUnlocked(1, st));
    m.finishLevel(st, '1-1', 1, 12);
    assert.ok(m.isLevelUnlocked(1, st));
    m.finishLevel(st, '1-2', 1, 5);
    assert.ok(!m.isLevelUnlocked(2, st), 'two scraped levels (2 stars) do not open level 3');
    m.finishLevel(st, '1-1', 3, 0);
    assert.ok(m.isLevelUnlocked(2, st));
    m.finishLevel(st, '1-1', 1, 0);
    assert.strictEqual(st.levels['1-1'].stars, 3, 'best stars are kept');
    m.saveState(st);
    assert.deepStrictEqual(m.loadState(), st);
    assert.strictEqual(m.loadState().bolts, 17);
});

// ---------- A run: hearts, checkpoint, stars ----------

await test('run: 3 misses power Torch down; a missed word comes back; 5 in a row repairs a heart', () => {
    const rng = mulberry32(5);
    const run = createRun({ levelIndex: 0, state: fresh(), rng, now: () => T0 });
    const wrong = () => { const gate = run.currentGate(); return run.answer((gate.correctIndex + 1) % 3); };
    const right = () => run.answer(run.currentGate().correctIndex);
    const missedWord = run.currentGate().word;
    assert.strictEqual(wrong().hearts, 2);
    right();
    assert.strictEqual(run.currentGate().word, missedWord, 'missed word returns two gates later');
    for (let i = 0; i < 3; i++) right();
    assert.strictEqual(run.hearts, 2);
    assert.strictEqual(right().healed, true);
    assert.strictEqual(run.hearts, 3);
    right();
    assert.strictEqual(right().done, true);
    assert.strictEqual(run.stars, 3);

    const run2 = createRun({ levelIndex: 0, state: fresh(), rng, now: () => T0, checkpoint: true });
    const wrong2 = () => { const gate = run2.currentGate(); return run2.answer((gate.correctIndex + 1) % 3); };
    wrong2(); wrong2();
    assert.strictEqual(wrong2().down, true);
    assert.strictEqual(run2.currentGate(), null);
    assert.ok(!run2.canContinue(), 'no flag restart before reaching the flag');
});

await test('run: the mid-level flag can be used once, gives at least 2 hearts and caps the level at 1 star', () => {
    const rng = mulberry32(6);
    const run = createRun({ levelIndex: 0, state: fresh(), rng, now: () => T0, checkpoint: true });
    const wrong = () => { const gate = run.currentGate(); return run.answer((gate.correctIndex + 1) % 3); };
    const right = () => run.answer(run.currentGate().correctIndex);
    wrong(); wrong(); right(); right();            // at the flag with 1 heart
    assert.strictEqual(run.gateIndex, CHECKPOINT_AFTER);
    right();
    assert.strictEqual(wrong().down, true);
    assert.ok(run.canContinue());
    run.continueFromCheckpoint();
    assert.strictEqual(run.hearts, 2);
    assert.strictEqual(run.gateIndex, CHECKPOINT_AFTER);
    wrong(); 
    assert.strictEqual(wrong().down, true);
    assert.ok(!run.canContinue(), 'only one flag restart per try');

    const run2 = createRun({ levelIndex: 0, state: fresh(), rng, now: () => T0, checkpoint: true });
    const r2 = () => run2.answer(run2.currentGate().correctIndex);
    const w2 = () => { const gate = run2.currentGate(); return run2.answer((gate.correctIndex + 1) % 3); };
    for (let i = 0; i < 4; i++) r2();
    w2(); w2(); w2();
    run2.continueFromCheckpoint();
    assert.strictEqual(run2.hearts, 3);
    for (let i = 0; i < 4; i++) r2();
    assert.strictEqual(run2.status, 'done');
    assert.strictEqual(run2.stars, 1);

    const noFlag = createRun({ levelIndex: 0, state: fresh(), rng, now: () => T0, checkpoint: false });
    for (let i = 0; i < 5; i++) noFlag.answer(noFlag.currentGate().correctIndex);
    for (let i = 0; i < 3; i++) { const gate = noFlag.currentGate(); noFlag.answer((gate.correctIndex + 1) % 3); }
    assert.ok(!noFlag.canContinue(), 'later worlds restart the whole level');
});

await test('run: hammering trips the overheat guard, careful play does not', () => {
    const guard = createTapGuard();
    assert.strictEqual(guard.check(3, 2000), true, '3 taps while locked');
    assert.strictEqual(guard.check(0, 100), false);
    assert.strictEqual(guard.check(0, 100), true, 'two instant answers in a row');
    const calm = createTapGuard();
    for (let i = 0; i < 20; i++) assert.strictEqual(calm.check(i % 2, 900 + i), false);
});

// ---------- Guessing cannot win (design §5) ----------

// Shortcut players: they know only how the word starts and how long it sounds, never the
// whole word. Each picks at random among the plates its shortcut leaves.
const pickAmong = (plates, keep, rng) => {
    const idx = plates.map((_, i) => i).filter(i => keep(plates[i]));
    const from = idx.length ? idx : plates.map((_, i) => i);
    return from[Math.floor(rng() * from.length)];
};
const centre = plates => plates.map((w, i) => plates.reduce((n, o, j) => n + (i === j ? 0 : g.similarity(w, o)), 0));
const SHORTCUTS = {
    random: (gate, rng) => Math.floor(rng() * gate.plates.length),
    firstLetter: (gate, rng) => pickAmong(gate.plates, w => w[0].toLowerCase() === gate.word[0].toLowerCase(), rng),
    length: (gate, rng) => pickAmong(gate.plates, w => w.length === gate.word.length, rng),
    firstAndLength: (gate, rng) => pickAmong(gate.plates, w => w[0].toLowerCase() === gate.word[0].toLowerCase() && w.length === gate.word.length, rng),
    firstLengthLast: (gate, rng) => pickAmong(gate.plates, w => w[0].toLowerCase() === gate.word[0].toLowerCase() && w.length === gate.word.length && w.at(-1) === gate.word.at(-1), rng),
    oddOneIn: (gate, rng) => { const c = centre(gate.plates); const top = Math.max(...c); return pickAmong(gate.plates, w => c[gate.plates.indexOf(w)] === top, rng); }
};

function play(levelIndex, rng, knows, shortcut = SHORTCUTS.random) {
    // knows: chance that he really knows each gate's word; otherwise he uses the shortcut.
    const run = createRun({ levelIndex, state: fresh(), rng, now: () => T0 });
    for (;;) {
        while (run.status === 'running') {
            const gate = run.currentGate();
            run.answer(rng() < knows ? gate.correctIndex : shortcut(gate, rng));
        }
        if (run.status === 'done') return run.stars;
        if (!run.canContinue()) return 0;
        run.continueFromCheckpoint();
    }
}

await test('guessing: a random tapper almost never finishes a stage; a reader always does', () => {
    if (process.env.QUICK) return; // QUICK=1 skips this slow test while editing
    const N = 1000;
    const pct = n => `${(100 * n / N).toFixed(1)}%`;
    for (let li = 0; li < LEVELS.length; li++) {
        const lvl = LEVELS[li];
        const flag = lvl.world.checkpoint && !lvl.boss;
        const rng = mulberry32(100 + li);
        let done = 0, twoPlus = 0, perfect = 0, half = 0, most = 0;
        for (let i = 0; i < N; i++) {
            const stars = play(li, rng, 0);
            if (stars) done++;
            if (stars >= 2) twoPlus++;
            if (play(li, rng, 1) === 3) perfect++;
            if (play(li, rng, 0.5)) half++;
            if (play(li, rng, 0.85)) most++;
        }
        console.log(`   ${lvl.id.padEnd(6)} ${lvl.world.plates} plates${flag ? ', flag' : '       '}: guessing ${pct(done).padStart(5)} (2+ stars ${pct(twoPlus)}), knows half ${pct(half).padStart(5)}, knows most ${pct(most)}`);
        assert.strictEqual(perfect, N, 'a perfect reader always gets 3 stars');
        assert.ok(done / N < (flag ? 0.1 : 0.04), `guessing finished ${pct(done)}`);
        assert.ok(twoPlus / N < 0.03, `guessing got 2+ stars ${pct(twoPlus)}`);
        assert.ok(most / N > 0.85, `a child who knows most words finished only ${pct(most)}`);
    }
});

// ---------- Runner ----------

await test('runner: every course can be run to the flag; gates stop Torch until answered', () => {
    for (let seed = 1; seed <= 40; seed++) {
        const world = WORLDS[seed % WORLDS.length];
        const course = buildCourse(seed, 8, 4, world.obstacles);
        assert.strictEqual(course.gates.length, 8);
        for (const gate of course.gates) {
            for (const o of [...course.gaps, ...course.crates]) assert.ok(o.x + 30 < gate.x - 120 || o.x > gate.x + 30, `obstacle too close to a gate (seed ${seed})`);
        }
        let gatesHit = 0, bumps = 0, finished = false;
        const game = createGame({ course, canvas: null, autoJump: true, theme: world.theme, hooks: { onGate: () => gatesHit++, onBump: () => bumps++, onFinish: () => { finished = true; } } });
        for (let i = 0; i < 120 * 400 && !finished; i++) {
            game.step(1 / 120);
            if (game.mode === 'gate') {
                const x = game.torch.x;
                for (let k = 0; k < 60; k++) game.step(1 / 120);
                assert.strictEqual(game.torch.x, x, 'Torch waits at a closed gate');
                game.openGate();
            }
        }
        assert.ok(finished, `seed ${seed} did not reach the flag`);
        assert.strictEqual(gatesHit, 8);
        assert.strictEqual(bumps, 0, `seed ${seed}: a well-timed jump should clear everything`);
        assert.ok(game.bolts > 0);
    }
});

await test('runner: after a fall he comes back well before the hole and pauses', () => {
    let checked = 0;
    for (let seed = 1; seed <= 30; seed++) {
        const course = buildCourse(seed, 8, 4, WORLDS[4].obstacles);
        const gap = course.gaps.find(g => g.x > 400);
        if (!gap) continue;
        const game = createGame({ course, canvas: null });
        // Put him just short of the hole, never jumping.
        Object.assign(game.torch, { x: gap.x - 20, y: GROUND_Y, vy: 0, grounded: true });
        course.gates.forEach(g => { if (g.x < gap.x) g.open = true; });
        let fell = false;
        for (let i = 0; i < 600 && !fell; i++) { game.step(1 / 120); if (game.torch.y === GROUND_Y && game.torch.x < gap.x - 30) fell = true; }
        assert.ok(fell, `seed ${seed}: did not fall`);
        const back = gap.x - game.torch.x;
        assert.ok(back >= 100, `seed ${seed}: only ${back.toFixed(0)}px before the hole (was 55)`);
        assert.ok(back <= RESPAWN_BACK, 'not further than needed');
        for (const o of [...course.gaps, ...course.crates]) {
            if (o === gap) continue;
            assert.ok(!(game.torch.x > o.x - 8 && game.torch.x < o.x + (o.w || 16) + 8), `seed ${seed}: respawned on an obstacle`);
        }
        const x = game.torch.x;
        for (let i = 0; i < 30; i++) game.step(1 / 120);
        assert.strictEqual(game.torch.x, x, 'stands still for a moment first');
        checked++;
    }
    assert.ok(checked > 10);
});

await test('runner: never jumping costs bolts but never stops him reaching the gates', () => {
    const course = buildCourse(7);
    let bumps = 0, finished = false;
    const game = createGame({ course, canvas: null, hooks: { onBump: () => bumps++, onFinish: () => { finished = true; } } });
    for (let i = 0; i < 120 * 300 && game.mode !== 'gate'; i++) game.step(1 / 120);
    assert.ok(bumps > 0, 'he bumps into things');
    assert.strictEqual(game.mode, 'gate', 'obstacles give way after two bumps, so he still reaches the gate');
    assert.ok(course.crates.some(c => c.broken) || course.gaps.some(g => g.bridged));
    assert.ok(!finished);
});

// ---------- Screens ----------

await test('screens: map → words → level → gate → plates locked, then one answer only', async () => {
    const el = document.body.appendChild(document.createElement('div'));
    let back = false;
    const quest = initTorchQuest(el, [], () => { back = true; }, { lockMs: 30, feedbackMs: 20, autoStart: false, autoJump: true, rng: mulberry32(9), seed: 3 });
    assert.strictEqual(el.querySelectorAll('.tq-level').length, 6, 'world 1: 5 levels and a boss');
    assert.strictEqual(el.querySelectorAll('.tq-level[disabled]').length, 5);
    assert.strictEqual(el.querySelectorAll('.tq-world.locked').length, 4, 'worlds 2–5 are locked');
    assert.ok(/Boss door/.test(el.textContent));
    el.querySelector('.tq-level').click();
    assert.strictEqual(el.querySelectorAll('.tq-word').length, LEVELS[0].items.length);
    el.querySelector('#tq-go').click();
    assert.ok(el.querySelector('.tq-gate').hidden);
    assert.strictEqual(el.querySelectorAll('.tq-hearts span:not(.lost)').length, 3);

    const { game, run } = quest.startLevel(0);
    while (game.mode === 'run') game.step(1 / 120);
    assert.strictEqual(game.mode, 'gate');
    const gate = run.currentGate();
    const plates = () => [...el.querySelectorAll('.tq-plate')];
    assert.deepStrictEqual(plates().map(p => p.textContent), gate.plates);
    assert.ok(el.querySelector('.tq-speak'), 'a hear-it gate has a 🔊 button');
    plates()[(gate.correctIndex + 1) % 3].click();          // tapped while locked: dropped
    assert.strictEqual(run.gateIndex, 0);
    await sleep(60);
    plates()[(gate.correctIndex + 1) % 3].click();          // wrong
    plates()[gate.correctIndex].click();                    // second tap is ignored
    assert.strictEqual(run.hearts, 2);
    assert.strictEqual(run.gateIndex, 1);
    assert.ok(plates()[gate.correctIndex].classList.contains('reveal'));
    assert.strictEqual(el.querySelectorAll('.tq-hearts span:not(.lost)').length, 2);
    await sleep(60);
    assert.ok(el.querySelector('.tq-gate').hidden);
    assert.strictEqual(game.mode, 'run');
    assert.ok(JSON.parse(localStorage.getItem('y1Quest')).items[gate.item.id], 'answers are saved as they happen');
    el.querySelector('.tq-x').click();
    el.querySelector('#tq-back').click();
    assert.ok(back);
});

await test('screens: power down shows the missed words; the flag saves stars and bolts', async () => {
    let clock = T0;
    const el = document.body.appendChild(document.createElement('div'));
    const quest = initTorchQuest(el, [], () => {}, { lockMs: 0, feedbackMs: 0, autoStart: false, autoJump: true, rng: mulberry32(11), seed: 5, now: () => (clock += 1000) });
    let { game, run } = quest.startLevel(0);
    const toGate = () => { for (let i = 0; i < 120 * 60 && game.mode === 'run'; i++) game.step(1 / 120); };
    const answer = async right => {
        toGate();
        await sleep(5);
        const gate = run.currentGate();
        el.querySelectorAll('.tq-plate')[right ? gate.correctIndex : (gate.correctIndex + 1) % 3].click();
        await sleep(5);
    };
    for (let i = 0; i < 3; i++) await answer(false);
    assert.ok(!el.querySelector('.tq-overlay').hidden);
    assert.strictEqual(el.querySelectorAll('.tq-overlay .tq-word').length, run.missed.length);
    assert.ok(el.querySelector('#tq-again'), 'before the flag: start again');
    el.querySelector('#tq-again').click();
    assert.strictEqual(JSON.parse(localStorage.getItem('y1Quest')).levels['1-1'].fails, 1);

    ({ game, run } = quest.startLevel(0));
    for (let i = 0; i < 8; i++) await answer(true);
    toGate();
    assert.strictEqual(game.mode, 'finish');
    assert.ok(el.querySelector('#tq-crate'), 'a mystery crate at the flag');
    await throughRewards(el);
    assert.ok(el.querySelector('.tq-stars').textContent.includes('★★★'));
    const saved = JSON.parse(localStorage.getItem('y1Quest'));
    assert.strictEqual(saved.levels['1-1'].stars, 3);
    assert.ok(saved.bolts > 0);
    assert.ok(el.querySelector('#tq-next'), 'level 2 is now open');
});

await test('screens: two instant answers in a row make Torch overheat (time, not a heart)', async () => {
    const el = document.body.appendChild(document.createElement('div'));
    const quest = initTorchQuest(el, [], () => {}, { lockMs: 0, feedbackMs: 0, overheatMs: 40, autoStart: false, autoJump: true, rng: mulberry32(13), seed: 5, now: () => T0 });
    const { game, run } = quest.startLevel(0);
    for (let n = 0; n < 2; n++) {
        while (game.mode === 'run') game.step(1 / 120);
        await sleep(5);
        el.querySelectorAll('.tq-plate')[run.currentGate().correctIndex].click();
        await sleep(10);
    }
    assert.ok(/Too fast/.test(el.querySelector('.tq-msg').textContent));
    assert.strictEqual(game.mode, 'gate', 'he waits while Torch cools down');
    assert.strictEqual(run.hearts, 3);
    await sleep(60);
    assert.strictEqual(game.mode, 'run');
});

await test('screens: a Silver word gets a flash-and-find gate with no voice button', async () => {
    const st = fresh();
    for (const item of LEVELS[0].items) st.items[item.id] = { tier: 2, ticks: 0, promoDay: null, missDay: null, misses: 0, last: T0 };
    m.saveState(st);
    const el = document.body.appendChild(document.createElement('div'));
    const quest = initTorchQuest(el, [], () => {}, { lockMs: 0, flashMs: 40, feedbackMs: 0, autoStart: false, autoJump: true, rng: mulberry32(12), seed: 5, now: () => T0 });
    const { game, run } = quest.startLevel(0);
    while (game.mode === 'run') game.step(1 / 120);
    assert.strictEqual(el.querySelector('.tq-flash').textContent, run.currentGate().word);
    assert.ok(!el.querySelector('.tq-speak'));
    el.querySelectorAll('.tq-plate')[run.currentGate().correctIndex].click();
    assert.strictEqual(run.gateIndex, 0, 'plates are locked while the word is showing');
    await sleep(70);
    assert.notStrictEqual(el.querySelector('.tq-flash').textContent, run.currentGate().word, 'the word is hidden before he answers');
    el.querySelectorAll('.tq-plate')[run.currentGate().correctIndex].click();
    assert.strictEqual(run.gateIndex, 1);
});

await test('screens: a Gold word is read in a sentence, with no voice', async () => {
    const st = fresh();
    for (const item of LEVELS[0].items) st.items[item.id] = { tier: 3, ticks: 0, promoDay: null, missDay: null, misses: 0, last: T0 };
    m.saveState(st);
    const el = document.body.appendChild(document.createElement('div'));
    const quest = initTorchQuest(el, [], () => {}, { lockMs: 0, sentenceLockMs: 0, feedbackMs: 0, autoStart: false, autoJump: true, rng: mulberry32(31), seed: 5, now: () => T0 });
    const { game, run } = quest.startLevel(0);
    let sentences = 0;
    for (let n = 0; n < 8 && run.status === 'running'; n++) {
        while (game.mode === 'run') game.step(1 / 120);
        await sleep(5);
        const gate = run.currentGate();
        if (gate.mode === 'sentence') {
            sentences++;
            assert.ok(el.querySelector('.tq-sentence'));
            assert.ok(!el.querySelector('.tq-speak'));
            assert.ok(!el.querySelector('.tq-sentence').textContent.includes(gate.word), 'the sentence does not give the word away');
        }
        el.querySelectorAll('.tq-plate')[gate.correctIndex].click();
        await sleep(15);
    }
    assert.ok(sentences > 0);
});

await test('screens: a boss has a fuse; letting it burn out costs a heart; right answers hit the boss', async () => {
    const st = fresh();
    for (const id of ['1-1', '1-2', '1-3', '1-4', '1-5']) m.finishLevel(st, id, 3);
    for (const item of worldItems(0).slice(0, 6)) for (let i = 0; i < 3; i++) m.recordAnswer(st, item.id, true, T0 - DAY);
    m.saveState(st);
    const el = document.body.appendChild(document.createElement('div'));
    const quest = initTorchQuest(el, [], () => {}, { lockMs: 0, feedbackMs: 0, bossMs: 60, autoStart: false, autoJump: true, rng: mulberry32(32), seed: 5, now: () => T0 });
    const boss = m.bossLevelIndex(0);
    assert.ok(!el.querySelector(`.tq-level[data-level="${boss}"]`).disabled, 'boss door is open');
    const { game, run } = quest.startLevel(boss);
    assert.strictEqual(run.total, 10);
    assert.ok(!run.checkpoint, 'no flag on a boss');
    assert.ok(el.querySelector('.tq-bosshp'));
    while (game.mode === 'run') game.step(1 / 120);
    await sleep(5);
    assert.ok(!el.querySelector('.tq-fuse').hidden, 'the fuse is burning');
    await sleep(100);
    assert.strictEqual(run.hearts, 2, 'too slow costs a heart');
    assert.ok(/Too slow/.test(el.querySelector('.tq-msg').textContent));
    await sleep(10);
    while (game.mode === 'run') game.step(1 / 120);
    await sleep(5);
    el.querySelectorAll('.tq-plate')[run.currentGate().correctIndex].click();
    assert.strictEqual(game.bossHp, 9);
});

await test('screens: powering down twice on a level opens the Training Bay, then back to the level', async () => {
    const el = document.body.appendChild(document.createElement('div'));
    let clock = T0;
    const quest = initTorchQuest(el, [], () => {}, { lockMs: 0, feedbackMs: 0, autoStart: false, autoJump: true, rng: mulberry32(33), seed: 5, now: () => (clock += 1000) });
    const loseAll = async () => {
        const { game, run } = quest.startLevel(0);
        for (let n = 0; n < 3; n++) {
            while (game.mode === 'run') game.step(1 / 120);
            await sleep(5);
            const gate = run.currentGate();
            const plates = el.querySelectorAll('.tq-plate');
            assert.ok(plates.length, `no plates at gate ${n}: ${el.textContent.slice(0, 100)}`);
            plates[(gate.correctIndex + 1) % 3].click();
            await sleep(5);
        }
        return run;
    };
    await loseAll();
    assert.ok(!el.querySelector('#tq-train'), 'not after the first power-down');
    el.querySelector('#tq-again').click();
    const run = await loseAll();
    assert.ok(el.querySelector('#tq-train'));
    el.querySelector('#tq-train').click();
    for (const word of run.missed.slice(0, 3)) {
        assert.ok(el.querySelector('.tq-learn'), `no word card: ${el.textContent.slice(0, 120)}`);
        assert.strictEqual(el.querySelector('.tq-learn').textContent, word);
        el.querySelector('#tq-ready').click();
        const plates = [...el.querySelectorAll('.tq-plate')];
        const wrong = plates.find(p => p.textContent !== word);
        wrong.click();
        assert.ok(plates.find(p => p.textContent === word).classList.contains('hint'), 'a wrong tap makes the right one glow');
        plates.find(p => p.textContent === word).click();
        await sleep(5);
    }
    assert.ok(/Training done/.test(el.textContent));
    el.querySelector('#tq-go').click();
    assert.ok(el.querySelector('.tq-canvas'), 'back in the level');
});

await test('shortcuts: first letter, length, both, and odd-one-in do no better than tapping at random', () => {
    if (process.env.QUICK) return; // QUICK=1 skips this slow test while editing
    const N = 300;
    const rows = [];
    for (const [name, shortcut] of Object.entries(SHORTCUTS)) {
        let done = 0, right = 0, gates = 0;
        for (let li = 0; li < LEVELS.length; li++) {
            const rng = mulberry32(500 + li);
            for (let i = 0; i < N; i++) if (play(li, rng, 0, shortcut)) done++;
            // Per-gate hit rate, over every stage's gates.
            for (let i = 0; i < 40; i++) {
                const run = createRun({ levelIndex: li, state: fresh(), rng, now: () => T0 });
                const gate = run.currentGate();
                // Two-letter words: first + last letter is the whole word, so that is reading.
                if (gate.word.length <= 2) continue;
                gates++;
                if (shortcut(gate, rng) === gate.correctIndex) right++;
            }
        }
        rows.push({ name, finish: done / (N * LEVELS.length), hit: right / gates });
    }
    for (const r of rows) console.log(`   ${r.name.padEnd(16)} right first time ${(100 * r.hit).toFixed(0).padStart(3)}% of gates, finishes ${(100 * r.finish).toFixed(1)}% of stages`);
    const random = rows.find(r => r.name === 'random');
    for (const r of rows) {
        // A two-letter word is read by its two letters, so a first-and-last-letter player
        // gets those right; that is reading, and they are a small share of gates.
        // First + last letter + length: some words have no same-ending partner, so this player does
        // a little better; it still has to look at the middle of most words.
        const slack = r.name === 'firstLengthLast' ? 0.15 : 0.06;
        assert.ok(r.hit <= random.hit + slack, `${r.name} beats random: ${(100 * r.hit).toFixed(0)}% vs ${(100 * random.hit).toFixed(0)}%`);
        assert.ok(r.finish < (r.name === 'firstLengthLast' ? 0.2 : 0.05), `${r.name} finishes ${(100 * r.finish).toFixed(1)}% of stages`);
    }
});

// ---------- Keeping him keen (design §13): Turbo, the Forge, mystery crates ----------

await test('turbo: 3 right in a row turns it on, a miss turns it off, and it never changes the plates', () => {
    const rng = mulberry32(41);
    const run = createRun({ levelIndex: 0, state: fresh(), rng, now: () => T0 });
    const right = () => run.answer(run.currentGate().correctIndex);
    const wrong = () => { const gate = run.currentGate(); return run.answer((gate.correctIndex + 1) % gate.plates.length); };
    assert.strictEqual(TURBO_STREAK, 3);
    assert.ok(!right().turboOn && !run.turbo);
    assert.ok(!right().turboOn);
    assert.strictEqual(right().turboOn, true);
    assert.ok(run.turbo);
    assert.ok(!right().turboOn, 'only announced once');
    assert.ok(run.turbo, 'stays on while he keeps reading right');
    assert.strictEqual(wrong().turboOff, true);
    assert.ok(!run.turbo);
    // Same seed, same plates whether or not Turbo is on: it is a running reward only.
    const a = createRun({ levelIndex: 2, state: fresh(), rng: mulberry32(9), now: () => T0 });
    const b = createRun({ levelIndex: 2, state: fresh(), rng: mulberry32(9), now: () => T0 });
    for (let i = 0; i < 8; i++) {
        assert.deepStrictEqual(a.currentGate().plates, b.currentGate().plates);
        a.answer(a.currentGate().correctIndex);
        b.answer(b.currentGate().correctIndex);
    }
});

await test('turbo: the car is faster, smashes crates for a bolt, and pulls bolts in', () => {
    const course = buildCourse(3, 8, 4, WORLDS[2].obstacles);
    const walk = turbo => {
        const game = createGame({ course: structuredClone(course), canvas: null });
        game.setTurbo(turbo);
        const x = game.torch.x;
        for (let i = 0; i < 60; i++) game.step(1 / 120);
        return game.torch.x - x;
    };
    assert.ok(walk(true) > walk(false) * 1.4, 'faster in car mode');
    const c = structuredClone(course);
    const crate = c.crates.find(k => k.x > 200);
    let smashed = 0, bumps = 0;
    const game = createGame({ course: c, canvas: null, hooks: { onSmash: () => smashed++, onBump: () => bumps++ } });
    game.setTurbo(true);
    c.gates.forEach(g => { g.open = true; });
    Object.assign(game.torch, { x: crate.x - 30 });
    for (let i = 0; i < 120; i++) game.step(1 / 120);
    assert.ok(crate.broken && smashed >= 1, 'crate smashed');
    assert.strictEqual(bumps, 0, 'no bump, no lost bolts');
    // Magnet: a bolt 30px away is collected in car mode.
    const m = structuredClone(course);
    m.gates.forEach(g => { g.open = true; });
    m.crates.length = 0; m.gaps.length = 0;
    m.bolts = [{ x: 200, y: GROUND_Y - 45, taken: false }];
    const g2 = createGame({ course: m, canvas: null });
    g2.setTurbo(true);
    Object.assign(g2.torch, { x: 150 });
    for (let i = 0; i < 60; i++) g2.step(1 / 120);
    assert.strictEqual(g2.bolts, 1, 'car pulls in a bolt it would have run under');
});

await test('turbo: every course can still be run in car mode without falling', () => {
    for (let seed = 1; seed <= 40; seed++) {
        const world = WORLDS[seed % WORLDS.length];
        const course = buildCourse(seed, 8, 4, world.obstacles);
        let falls = 0, finished = false;
        const game = createGame({ course, canvas: null, autoJump: true, hooks: { onBump: () => falls++, onFinish: () => { finished = true; } } });
        game.setTurbo(true);
        for (let i = 0; i < 120 * 300 && !finished; i++) { game.step(1 / 120); if (game.mode === 'gate') game.openGate(); }
        assert.ok(finished, `seed ${seed}`);
        assert.strictEqual(falls, 0, `seed ${seed}: a well-timed jump clears every gap at car speed`);
    }
});

await test('screens: Turbo shows on the meter after 3 right answers and switches off on a miss', async () => {
    const el = document.body.appendChild(document.createElement('div'));
    let clock = T0;
    const quest = initTorchQuest(el, [], () => {}, { lockMs: 0, feedbackMs: 0, autoStart: false, autoJump: true, rng: mulberry32(42), seed: 5, now: () => (clock += 1000) });
    const { game, run } = quest.startLevel(0);
    const answer = async right => {
        while (game.mode === 'run') game.step(1 / 120);
        await sleep(3);
        const gate = run.currentGate();
        el.querySelectorAll('.tq-plate')[right ? gate.correctIndex : (gate.correctIndex + 1) % gate.plates.length].click();
        await sleep(3);
    };
    await answer(true); await answer(true);
    assert.strictEqual(el.querySelectorAll('.tq-turbo i.on').length, 2);
    assert.ok(!game.turbo);
    await answer(true);
    assert.ok(game.turbo, 'car mode');
    assert.ok(el.querySelector('.tq-turbo').classList.contains('go'));
    await answer(false);
    assert.ok(!game.turbo, 'a miss ends Turbo');
    assert.strictEqual(el.querySelectorAll('.tq-turbo i.on').length, 0);
});

await test('screens: a block that goes up is hammered in the Forge, then the crate, then results', async () => {
    const st = fresh();
    // Every word on 2 ticks: the first right answer for each goes up to Copper.
    for (const item of LEVELS[0].items) st.items[item.id] = { tier: 0, ticks: 2, promoDay: null, missDay: null, misses: 0, last: T0 - DAY };
    m.saveState(st);
    const el = document.body.appendChild(document.createElement('div'));
    let clock = T0;
    const quest = initTorchQuest(el, [], () => {}, { lockMs: 0, feedbackMs: 0, autoStart: false, autoJump: true, rng: mulberry32(43), seed: 5, now: () => (clock += 1000) });
    const { game, run } = quest.startLevel(0);
    for (let i = 0; i < 8; i++) {
        while (game.mode === 'run') game.step(1 / 120);
        await sleep(3);
        el.querySelectorAll('.tq-plate')[run.currentGate().correctIndex].click();
        await sleep(3);
    }
    while (game.mode === 'run') game.step(1 / 120);
    assert.strictEqual(game.mode, 'finish');
    const promoted = new Set(run.promoted.map(p => p.word));
    assert.ok(promoted.size >= 5);
    for (let k = 0; k < promoted.size; k++) {
        assert.ok(el.querySelector('#tq-hammer'), `forge screen ${k + 1}`);
        const block = el.querySelector('.tq-anvil .tq-block');
        assert.ok(block.classList.contains('t0'), 'starts as Scrap');
        assert.ok(promoted.has(block.textContent));
        el.querySelector('#tq-hammer').click();
        el.querySelector('#tq-hammer').click();
        assert.ok(!el.querySelector('#tq-forged'), 'needs three hits');
        el.querySelector('#tq-hammer').click();
        assert.ok(block.classList.contains('t1'), 'comes out Copper');
        assert.ok(/is Copper/.test(el.querySelector('h2').textContent));
        el.querySelector('#tq-forged').click();
    }
    assert.ok(el.querySelector('#tq-crate'), 'then the mystery crate');
    const before = JSON.parse(localStorage.getItem('y1Quest')).bolts;
    el.querySelector('#tq-crate').click();
    const after = JSON.parse(localStorage.getItem('y1Quest')).bolts;
    const stickers = JSON.parse(localStorage.getItem('y1Stickers') || '[]');
    assert.ok(after > before || stickers.length === 1, 'the crate gave bolts or a sticker');
    el.querySelector('#tq-continue').click();
    assert.ok(el.querySelector('.tq-stars'), 'then the results');
});

await test('rewards: crates are varied, careful play pays better, and bosses always give a sticker', () => {
    const tally = (stars, n = 4000) => {
        const rng = mulberry32(stars);
        const t = { sticker: 0, big: 0, small: 0 };
        for (let i = 0; i < n; i++) { const p = rollCrate({ stars, rng }); p.kind === 'sticker' ? t.sticker++ : p.big ? t.big++ : t.small++; }
        return t;
    };
    const one = tally(1), three = tally(3);
    assert.ok(three.sticker > one.sticker * 1.5, '3 stars: better odds of a sticker');
    for (const t of [one, three]) assert.ok(t.sticker > 0 && t.big > 0 && t.small > 0, 'every kind of prize happens');
    assert.strictEqual(rollCrate({ boss: true }).kind, 'sticker');
});

console.log(failures ? `\n${failures} Torch Quest test(s) failed` : '\nAll Torch Quest tests passed');
process.exit(failures ? 1 : 0);
