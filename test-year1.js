// Year 1 phonics tests: run with `node test-year1.js` (or `npm test`).
import { JSDOM } from 'jsdom';
import assert from 'assert';

const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.localStorage = dom.window.localStorage;
global.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 16);
global.cancelAnimationFrame = id => clearTimeout(id);

const { TERMS, allItems, findItem, label } = await import('./phonics/curriculum.js');
const practice = await import('./phonics/practice.js');
const { renderSelector } = await import('./phonics/selector.js');
const games = {
    ironRig: (await import('./games/year1/iron-rig.js')).initIronRig,
    rocketBay: (await import('./games/year1/rocket-bay.js')).initRocketBay,
    botSnap: (await import('./games/year1/bot-snap.js')).initBotSnap,
    orbit: (await import('./games/year1/orbit-defense.js')).initOrbitDefense,
    mech: (await import('./games/year1/mech-builder.js')).initMechBuilder
};

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
const container = () => document.body.appendChild(document.createElement('div'));

await test('curriculum: item ids are unique across all terms', () => {
    const ids = allItems().map(i => i.id);
    assert.strictEqual(new Set(ids).size, ids.length);
});

await test('curriculum: autumn term 1 has all brief content', () => {
    const term = TERMS.find(t => t.id === 'y1-autumn-1');
    const count = id => term.sets.find(s => s.id === id).items.length;
    assert.strictEqual(count('y1a1-revised'), 15);
    assert.strictEqual(count('y1a1-new'), 5);
    assert.strictEqual(count('phase23'), 21);
    assert.strictEqual(count('y1a1-hrsw'), 5);
    assert.strictEqual(count('y1a1-spelling'), 10);
    assert.strictEqual(findItem('a-e').phrase, 'cake by the lake');
});

await test('curriculum: every item can be spoken and pictured', () => {
    for (const item of allItems()) {
        assert.ok(item.emoji, `${item.id} needs an emoji`);
        if (item.kind === 'gpc') assert.ok(item.phrase || item.example, `${item.id} needs a phrase or example`);
        else assert.ok(item.clue, `${item.id} needs a clue`);
    }
});

await test('practice: no selection falls back to game defaults', () => {
    const pool = practice.buildPool({ accepts: i => i.kind === 'gpc', defaults: ['ay', 'ou'] });
    assert.ok(pool.usingDefaults);
    assert.deepStrictEqual(pool.items.map(i => i.id), ['ay', 'ou']);
});

await test('practice: selection is used and filtered by what the game accepts', () => {
    practice.setSelection(['ay', 'w-house', 'ir']);
    const pool = practice.buildPool({ accepts: i => i.kind === 'gpc', defaults: ['ou'] });
    assert.ok(!pool.usingDefaults);
    assert.deepStrictEqual(pool.items.map(i => i.id).sort(), ['ay', 'ir']);
});

await test('practice: minDistinct tops up a small selection', () => {
    practice.setSelection(['ch']);
    const pool = practice.buildPool({ accepts: i => i.kind === 'gpc', defaults: ['ck', 'qu', 'th'], minDistinct: 3 });
    assert.strictEqual(new Set(pool.items.map(label)).size, 3);
    assert.ok(pool.items.some(i => i.id === 'ch'));
});

await test("practice: learner's own typed words can be selected", () => {
    practice.setSelection(['my-dinosaur']);
    const pool = practice.buildPool({ words: ['dinosaur'], accepts: i => i.kind === 'word', defaults: ['w-the'] });
    assert.deepStrictEqual(pool.items.map(label), ['dinosaur']);
});

await test('practice: pickDistinct never repeats a grapheme (oo / ow duplicates)', () => {
    const pool = ['oo-spoon', 'oo-book', 'ow-growl', 'ow-snow'].map(id => findItem(id));
    for (let i = 0; i < 20; i++) {
        const picked = practice.pickDistinct(pool, 4);
        assert.strictEqual(new Set(picked.map(label)).size, picked.length);
    }
});

await test('practice: distractors match kind, split-ness, and differ from target', () => {
    for (let i = 0; i < 20; i++) {
        const target = findItem('i-e');
        const d = practice.pickDistractors(target, [target], 2);
        assert.strictEqual(d.length, 2);
        d.forEach(x => { assert.ok(x.split); assert.notStrictEqual(label(x), 'i-e'); });
        const word = findItem('w-pull');
        practice.pickDistractors(word, [word], 3).forEach(x => assert.strictEqual(x.kind, 'word'));
    }
});

await test('practice: target sequence avoids back-to-back repeats', () => {
    const pool = ['ay', 'ou', 'ie'].map(id => findItem(id));
    const seq = practice.targetSequence(pool, 12);
    for (let i = 1; i < seq.length; i++) assert.notStrictEqual(seq[i].id, seq[i - 1].id);
});

await test('practice: results are recorded', () => {
    practice.recordResult('ay', true);
    practice.recordResult('ay', false);
    assert.deepStrictEqual({ ...practice.getProgress().ay, last: 0 }, { correct: 1, tries: 2, last: 0 });
});

await test('selector: tapping chips and pressing play saves the selection', () => {
    const c = container();
    let done = false;
    renderSelector(c, ['cat'], () => { done = true; });
    c.querySelector('[data-id="ay"]').click();
    c.querySelector('[data-id="my-cat"]').click();
    c.querySelector('[data-id="ay"]').click();
    c.querySelector('[data-all="y1a1-hrsw"]').click();
    c.querySelector('#sel-done').click();
    assert.ok(done);
    assert.deepStrictEqual(practice.getSelection().sort(), ['my-cat', 'w-house', 'w-mouse', 'w-very', 'w-want', 'w-water']);
});

for (const [name, init] of Object.entries(games)) {
    await test(`${name}: renders, shows progress pips and returns to hub cleanly`, async () => {
        const c = container();
        let back = 0;
        init(c, [], () => back++);
        assert.ok(c.querySelector('.y1-game'), 'shell rendered');
        assert.ok(c.querySelectorAll('.y1-pip').length >= 3, 'progress pips');
        assert.ok(c.querySelector('.y1-practising').textContent.startsWith('Starter set'));
        await sleep(50);
        c.querySelector('.y1-back').click();
        assert.strictEqual(back, 1);
        await sleep(50);
    });
}

await test('ironRig: matching a pair fills a pip and records progress', async () => {
    const c = container();
    games.ironRig(c, [], () => {});
    await sleep(2900); // face-up preview
    const cards = [...c.querySelectorAll('.rig-card')];
    const first = cards[0];
    const twin = cards.find(x => x !== first && x.querySelector('b').textContent === first.querySelector('b').textContent);
    first.click();
    twin.click();
    assert.strictEqual(c.querySelectorAll('.y1-pip.on').length, 1);
    assert.strictEqual(Object.keys(practice.getProgress()).length, 1);
    c.querySelector('.y1-back').click();
});

await test('rocketBay: a wrong pod is dimmed, never penalised', async () => {
    const c = container();
    practice.setSelection(['a-e']);
    games.rocketBay(c, [], () => {});
    assert.ok(c.querySelector('.y1-prompt').textContent.includes('cake by the lake'));
    const wrong = [...c.querySelectorAll('.bay-pod')].find(p => p.textContent !== 'a-e');
    wrong.click();
    assert.ok(wrong.classList.contains('dim'));
    assert.strictEqual(c.querySelectorAll('.y1-pip.on').length, 0);
    c.querySelector('.y1-back').click();
});

await test('botSnap: snapping with nothing matching just wiggles', async () => {
    const c = container();
    games.botSnap(c, [], () => {});
    await sleep(30);
    const scan = c.querySelector('#snap-scan b').textContent;
    const targetWord = c.querySelector('#snap-target b').textContent;
    c.querySelector('#snap-btn').click();
    if (scan !== targetWord) assert.strictEqual(c.querySelectorAll('.y1-pip.on').length, 0);
    c.querySelector('.y1-back').click();
});

console.log(failures ? `\n${failures} test(s) failed` : '\nAll Year 1 tests passed');
process.exit(failures ? 1 : 0);
