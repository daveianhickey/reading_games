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

const { LEVELS, ALL_ITEMS, DISTRACTOR_WORDS } = await import('./quest/content.js');
const m = await import('./quest/mastery.js');
const g = await import('./quest/gates.js');
const { createRun, createTapGuard, CHECKPOINT_AFTER } = await import('./quest/run.js');
const { buildCourse, mulberry32 } = await import('./quest/level.js');
const { createGame } = await import('./quest/runner.js');
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
const fresh = () => ({ items: {}, levels: {}, bolts: 0 });
const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 0, 5, 10).getTime();

// ---------- Content ----------

await test('content: every item comes from the curriculum and is on the focus list', () => {
    const ids = ALL_ITEMS.map(i => i.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'item ids are unique');
    for (const item of ALL_ITEMS) {
        if (item.kind === 'tricky') {
            assert.ok(findItem(item.id), `${item.id} is not a curriculum item`);
            assert.ok(d.FOCUS_WORDS.includes(item.word), `${item.word} is not a focus word`);
        } else {
            assert.ok(d.FOCUS_GPC_IDS.includes(item.gpc), `${item.gpc} is not a focus GPC`);
            assert.strictEqual(d.whyReadable(item.word), 'decodable', `${item.word} is not decodable`);
            assert.ok(d.findGpc(item.word, item.gpc), `${item.word} does not carry ${item.gpc}`);
        }
    }
});

await test('content: every wrong plate is a real word he can read', () => {
    const bad = DISTRACTOR_WORDS.filter(w => !d.whyReadable(w));
    assert.deepStrictEqual(bad, []);
});

// ---------- Gates ----------

await test('gates: exactly one right plate, no duplicates, right word in the stated place', () => {
    const rng = mulberry32(1);
    for (const item of ALL_ITEMS) {
        for (const tier of [0, 1, 2, 3]) {
            const gate = g.buildGate(item, tier, rng);
            assert.strictEqual(gate.plates.length, 3);
            assert.strictEqual(new Set(gate.plates).size, 3, `duplicate plate for ${item.word}: ${gate.plates}`);
            assert.strictEqual(gate.plates[gate.correctIndex], item.word);
            assert.strictEqual(gate.plates.filter(w => w === item.word).length, 1);
            assert.strictEqual(gate.mode, tier >= 2 ? 'flash' : 'hear');
        }
    }
});

await test('gates: Scrap plates look different, Copper plates are look-alikes', () => {
    const rng = mulberry32(2);
    for (const item of ALL_ITEMS) {
        for (const w of g.unlikeWords(item.word, 2, rng)) assert.notStrictEqual(w[0], item.word[0], `${w} starts like ${item.word}`);
        const near = g.lookAlikes(item.word, 2, rng);
        const far = g.unlikeWords(item.word, 2, rng);
        const avg = list => list.reduce((n, w) => n + g.similarity(item.word, w), 0) / list.length;
        assert.ok(avg(near) > avg(far), `${item.word}: look-alikes ${near} are no closer than ${far}`);
    }
    console.log('   e.g. ' + ['the', 'of', 'put', 'chop', 'tank'].map(w => `${w} ~ ${g.lookAlikes(w, 2, rng).join('/')}`).join(', '));
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

await test('mastery: a level has 8 gates, every new word, up to 3 review words, no word twice running', () => {
    for (let li = 0; li < LEVELS.length; li++) {
        for (let seed = 0; seed < 50; seed++) {
            const picked = m.pickGateItems(li, fresh(), mulberry32(seed), T0);
            assert.strictEqual(picked.length, 8);
            const own = new Set(LEVELS[li].items.map(i => i.id));
            const review = picked.filter(i => !own.has(i.id));
            assert.strictEqual(review.length, li === 0 ? 0 : 3);
            const expected = Math.min(own.size, 8 - review.length);
            assert.strictEqual(new Set(picked.filter(i => own.has(i.id)).map(i => i.id)).size, expected);
            for (let i = 1; i < picked.length; i++) assert.notStrictEqual(picked[i].id, picked[i - 1].id, `seed ${seed}`);
        }
    }
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

function play(levelIndex, rng, knows, checkpoint) {
    // knows: chance that he really knows each gate's word; otherwise he taps at random.
    const run = createRun({ levelIndex, state: fresh(), rng, now: () => T0, checkpoint });
    for (;;) {
        while (run.status === 'running') {
            const gate = run.currentGate();
            run.answer(rng() < knows ? gate.correctIndex : Math.floor(rng() * 3));
        }
        if (run.status === 'done') return run.stars;
        if (!run.canContinue()) return 0;
        run.continueFromCheckpoint();
    }
}

await test('guessing: a random tapper almost never finishes a level; a reader always does', () => {
    const N = 2000;
    const pct = n => `${(100 * n / N).toFixed(1)}%`;
    for (let li = 0; li < LEVELS.length; li++) {
        for (const checkpoint of [true, false]) {
            const rng = mulberry32(100 + li);
            let done = 0, twoPlus = 0, perfect = 0, half = 0, most = 0;
            for (let i = 0; i < N; i++) {
                const stars = play(li, rng, 0, checkpoint);
                if (stars) done++;
                if (stars >= 2) twoPlus++;
                if (play(li, rng, 1, checkpoint) === 3) perfect++;
                if (play(li, rng, 0.5, checkpoint)) half++;
                if (play(li, rng, 0.85, checkpoint)) most++;
            }
            console.log(`   ${LEVELS[li].id} ${checkpoint ? 'with flag' : 'no flag  '}: guessing finishes ${pct(done)} (2+ stars ${pct(twoPlus)}), knows half ${pct(half)}, knows most ${pct(most)}`);
            assert.strictEqual(perfect, N, 'a perfect reader always gets 3 stars');
            assert.ok(done / N < (checkpoint ? 0.1 : 0.04), `guessing finished ${pct(done)}`);
            assert.ok(twoPlus / N < 0.03, `guessing got 2+ stars ${pct(twoPlus)}`);
            assert.ok(most / N > 0.9, `a child who knows most words finished only ${pct(most)}`);
        }
    }
});

// ---------- Runner ----------

await test('runner: every course can be run to the flag; gates stop Torch until answered', () => {
    for (let seed = 1; seed <= 30; seed++) {
        const course = buildCourse(seed);
        assert.strictEqual(course.gates.length, 8);
        for (const gate of course.gates) {
            for (const o of [...course.gaps, ...course.crates]) assert.ok(o.x + 30 < gate.x - 120 || o.x > gate.x + 30, `obstacle too close to a gate (seed ${seed})`);
        }
        let gatesHit = 0, bumps = 0, finished = false;
        const game = createGame({ course, canvas: null, autoJump: true, hooks: { onGate: () => gatesHit++, onBump: () => bumps++, onFinish: () => { finished = true; } } });
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
    assert.strictEqual(el.querySelectorAll('.tq-level').length, LEVELS.length);
    assert.strictEqual(el.querySelectorAll('.tq-level[disabled]').length, LEVELS.length - 1);
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

console.log(failures ? `\n${failures} Torch Quest test(s) failed` : '\nAll Torch Quest tests passed');
process.exit(failures ? 1 : 0);
