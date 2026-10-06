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

const { TERMS, allItems, findItem, label, gapSegments } = await import('./phonics/curriculum.js');
const practice = await import('./phonics/practice.js');
const { renderSelector } = await import('./phonics/selector.js');
const { initMemoryMatch } = await import('./games/memory-match.js');
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

await test('curriculum: common exception words list is complete with no duplicates', () => {
    const given = 'the put of to go into pull his he buses we me be push was her my you they all are ball tall when what said so have were out like some come there little one do children love oh their people Mr Mrs your ask should would could asked'.split(' ');
    const words = allItems().filter(i => i.kind === 'word').map(i => i.word);
    given.forEach(w => assert.ok(words.includes(w), `${w} missing`));
    assert.strictEqual(new Set(words.map(w => w.toLowerCase())).size, words.length);
    assert.strictEqual(TERMS.find(t => t.id === 'y1-common-exception').sets[0].items.length, 43);
});

await test('curriculum: every item can be spoken and pictured', () => {
    for (const item of allItems()) {
        assert.ok(item.emoji, `${item.id} needs an emoji`);
        if (item.kind === 'gpc') assert.ok(item.phrase || item.example, `${item.id} needs a phrase or example`);
        else assert.ok(item.clue, `${item.id} needs a clue`);
    }
});

await test('curriculum: every sound has a gap, and filling the gaps rebuilds the prompt', () => {
    for (const item of allItems().filter(i => i.kind === 'gpc')) {
        const segs = gapSegments(item);
        const gaps = segs.filter(x => x.gap !== undefined);
        assert.ok(gaps.length, `${item.id} has no gap`);
        assert.strictEqual(segs.map(x => x.gap ?? x.text).join(''), item.phrase || item.example, item.id);
        const allowed = item.split ? item.grapheme.split('-') : [item.grapheme];
        gaps.forEach(g => assert.ok(allowed.includes(g.gap), `${item.id}: unexpected gap "${g.gap}"`));
    }
});

await test('curriculum: gaps hide the sound (hair → h▢, cake → c▢k▢, soft c only)', () => {
    const show = id => gapSegments(findItem(id)).map(x => x.gap !== undefined ? '▢' : x.text).join('');
    assert.strictEqual(show('air'), 'h▢');
    assert.strictEqual(show('a-e'), 'c▢k▢ by the l▢k▢');
    assert.strictEqual(show('c'), '▢ycle in the ▢ity');
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
    assert.strictEqual(c.querySelector('.y1-prompt').textContent.replace(/\s+/g, ''), '🎂ckbythelk', 'letters for the sound are hidden');
    assert.strictEqual(c.querySelectorAll('.bay-gap').length, 4);
    const wrong = [...c.querySelectorAll('.bay-pod')].find(p => p.textContent !== 'a-e');
    wrong.click();
    assert.ok(wrong.classList.contains('dim'));
    assert.strictEqual(c.querySelectorAll('.y1-pip.on').length, 0);
    assert.strictEqual(c.querySelectorAll('.bay-gap.filled').length, 0, 'a wrong answer leaves the gaps empty');
    [...c.querySelectorAll('.bay-pod')].find(p => p.textContent === 'a-e').click();
    assert.deepStrictEqual([...c.querySelectorAll('.bay-gap.filled')].map(g => g.textContent), ['a', 'e', 'a', 'e']);
    c.querySelector('.y1-back').click();
});

await test('orbit: first try earns gold; a guess triggers a recharge and only earns silver', async () => {
    const c = container();
    practice.setSelection(['ir']);
    games.orbit(c, [], () => {});
    const node = text => [...c.querySelectorAll('.orb-node')].find(n => n.textContent === text);
    const wrongNode = () => [...c.querySelectorAll('.orb-node')].find(n => n.textContent !== 'ir');
    const pips = () => [...c.querySelectorAll('.y1-pip.on')];
    await sleep(20);

    node('ir').click();
    await sleep(550);
    assert.strictEqual(pips().length, 1);
    assert.ok(!pips()[0].classList.contains('silver'), 'first try is gold');

    await sleep(1000); // next asteroid
    wrongNode().click();
    await sleep(550);
    assert.ok(c.querySelector('.orb').classList.contains('recharging'), 'shield recharges after a wrong hit');
    node('ir').click(); // tapping straight away is ignored while recharging
    await sleep(600);
    assert.strictEqual(pips().length, 1, 'no progress while recharging');
    await sleep(600);
    assert.ok(!c.querySelector('.orb').classList.contains('recharging'));
    node('ir').click();
    await sleep(550);
    assert.strictEqual(pips().length, 2);
    assert.ok(pips()[1].classList.contains('silver'), 'found after a guess is silver');
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

await test('memoryMatch: one sound card per round, revealed when matched with its written word', async () => {
    const c = container();
    initMemoryMatch(c, ['said', 'was', 'the', 'you', 'they', 'come'], () => {});
    const cards = [...c.querySelectorAll('.memory-card')];
    const sound = cards.filter(card => card.dataset.sound);
    assert.strictEqual(sound.length, 1, 'exactly one sound card');
    const word = sound[0].dataset.word;
    assert.ok(!sound[0].querySelector('.card-front').textContent.includes(word), 'sound card hides its word');
    assert.ok(sound[0].querySelector('.card-front').textContent.includes('🔊'));
    sound[0].click();
    cards.find(card => card !== sound[0] && card.dataset.word === word).click();
    assert.ok(sound[0].classList.contains('matched'));
    assert.strictEqual(sound[0].querySelector('.card-front').textContent, word, 'word shown once matched');
    await sleep(700); // let the delayed "say it again" finish before the next test
});

await test('memoryMatch: every card says its word when flipped, and again on a match', async () => {
    const spoken = [];
    window.speechSynthesis = { cancel() {}, getVoices: () => [], speak: u => spoken.push(u.text) };
    global.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    try {
        const c = container();
        initMemoryMatch(c, ['said', 'was', 'the', 'you', 'they', 'come'], () => {});
        const cards = [...c.querySelectorAll('.memory-card')];
        const first = cards.find(card => !card.dataset.sound);
        first.click();
        assert.deepStrictEqual(spoken, [first.dataset.word], 'flip speaks the word');
        cards.find(card => card !== first && card.dataset.word === first.dataset.word).click();
        await sleep(700);
        assert.deepStrictEqual(spoken, [first.dataset.word, first.dataset.word, first.dataset.word], 'second flip and the match both speak');
        // Flipping the next card straight after a match must not be talked over by the repeat.
        spoken.length = 0;
        const a = cards.find(card => !card.classList.contains('matched') && card.dataset.word !== first.dataset.word);
        const b = cards.find(card => card !== a && card.dataset.word === a.dataset.word);
        a.click(); b.click();
        const next = cards.find(card => !card.classList.contains('matched'));
        next.click();
        await sleep(700);
        assert.strictEqual(spoken[spoken.length - 1], next.dataset.word, 'the new card is the last word heard');
    } finally {
        delete window.speechSynthesis;
        delete global.SpeechSynthesisUtterance;
    }
});

console.log(failures ? `\n${failures} test(s) failed` : '\nAll Year 1 tests passed');
process.exit(failures ? 1 : 0);
