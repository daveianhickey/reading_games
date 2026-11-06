// Robot Stories tests: run with `node test-stories.js` (part of `npm test`).
// Content rules come from docs/robot-stories-design.md §3.
import { JSDOM } from 'jsdom';
import assert from 'assert';
import fs from 'fs';

const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.localStorage = dom.window.localStorage;
global.requestAnimationFrame = cb => setTimeout(() => cb(Date.now()), 16);
global.cancelAnimationFrame = id => clearTimeout(id);

const { STORIES } = await import('./stories/index.js');
const d = await import('./stories/decodable.js');
const { ROBOTS, robotSVG } = await import('./stories/robots.js');
const reader = await import('./stories/reader.js');
const { allItems } = await import('./phonics/curriculum.js');

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
const click = el => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

// ---------- Word checker ----------

await test('checker: decodes words with taught GPCs, rejects irregular ones', () => {
    assert.deepStrictEqual(d.segment('night'), ['n', 'igh', 't']);
    assert.deepStrictEqual(d.segment('chain'), ['ch', 'ai', 'n']);
    assert.ok(d.segment('came'), 'split digraph a-e');
    assert.strictEqual(d.whyReadable('torch'), 'decodable');
    assert.strictEqual(d.whyReadable('said'), 'tricky');
    assert.strictEqual(d.whyReadable('pulled'), 'tricky');
    assert.strictEqual(d.whyReadable('eyes'), null);
    assert.strictEqual(d.whyReadable('who'), null);
    assert.strictEqual(d.whyReadable('Clunk'), 'decodable');
    assert.strictEqual(d.whyReadable('Core', ['core']), 'star');
});

await test('checker: finds the right sound for each focus GPC', () => {
    assert.deepStrictEqual(d.findGpc('hook', 'oo-book'), [1, 3]);
    assert.strictEqual(d.findGpc('hook', 'oo-spoon'), null);
    assert.deepStrictEqual(d.findGpc('zoom', 'oo-spoon'), [1, 3]);
    assert.strictEqual(d.findGpc('pure', 'ur'), null, "'ur' in pure is the ure sound");
    assert.deepStrictEqual(d.findGpc('pure', 'ure'), [1, 4]);
    assert.strictEqual(d.findGpc('hear', 'ar'), null, "'ar' in hear is the ear sound");
    assert.strictEqual(d.findGpc('air', 'ai'), null);
    assert.deepStrictEqual(d.findGpc('charger', 'er'), [5, 7]);
});

await test('weak-spots list: all 15 GPCs and 55 words exist in the curriculum', () => {
    const items = allItems();
    assert.strictEqual(d.FOCUS_GPC_IDS.length, 15);
    d.FOCUS_GPC_IDS.forEach(id => assert.ok(items.find(i => i.id === id), `missing GPC ${id}`));
    assert.strictEqual(d.FOCUS_WORDS.length, 55);
    d.FOCUS_WORDS.forEach(w => assert.ok(items.find(i => i.kind === 'word' && i.word.toLowerCase() === w), `missing word ${w}`));
});

// ---------- Story content rules ----------

for (const story of STORIES) {
    await test(`${story.title}: 10–20 sentences, 1–4 per page`, () => {
        const n = d.storySentences(story).length;
        assert.ok(n >= 10 && n <= 20, `${n} sentences`);
        story.pages.forEach((p, i) => assert.ok(p.sentences.length >= 1 && p.sentences.length <= 4, `page ${i + 1} has ${p.sentences.length}`));
    });

    await test(`${story.title}: every word is decodable, a tricky word or a star word`, () => {
        assert.deepStrictEqual(d.unreadableWords(story), []);
    });

    await test(`${story.title}: each target sound and word appears at least 3 times`, () => {
        assert.ok(story.targets.gpcs.length >= 2, 'at least 2 target GPCs');
        story.targets.gpcs.forEach(g => {
            assert.ok(d.FOCUS_GPC_IDS.includes(g), `${g} is not a focus GPC`);
            const hits = d.gpcHits(story, g).length;
            assert.ok(hits >= 3, `${g} appears ${hits}×`);
        });
        story.targets.words.forEach(w => {
            assert.ok(d.FOCUS_WORDS.includes(w), `${w} is not a focus word`);
            const hits = d.wordHits(story, w);
            assert.ok(hits >= 3, `${w} appears ${hits}×`);
        });
    });

    await test(`${story.title}: every page has a scene, alt text and known robots/backgrounds`, () => {
        [story.cover, ...story.pages.map(p => p.scene)].forEach((scene, i) => {
            assert.ok(reader.BACKGROUND_IDS.includes(scene.bg), `unknown background ${scene.bg}`);
            scene.cast.forEach(c => assert.ok(ROBOTS[c.id], `unknown robot ${c.id} on page ${i}`));
        });
        story.pages.forEach((p, i) => assert.ok(p.alt && p.alt.length > 10, `page ${i + 1} alt text`));
        assert.ok(story.pages.some(p => p.interaction?.type === 'transform'), 'has a transform moment');
        story.starWords.forEach(s => assert.ok(!s.robot || ROBOTS[s.robot], `star word robot ${s.robot}`));
        assert.ok(story.quiz.options.includes(story.quiz.answer));
    });
}

await test('series: all 15 focus sounds are practised and every focus word is used', () => {
    const practised = new Set(STORIES.flatMap(s => s.targets.gpcs));
    assert.deepStrictEqual(d.FOCUS_GPC_IDS.filter(g => !practised.has(g)), []);
    const used = new Set(STORIES.flatMap(s => d.storySentences(s).flatMap(d.wordsIn)));
    assert.deepStrictEqual(d.FOCUS_WORDS.filter(w => !used.has(w)), []);
});

await test('background image files exist', () => {
    reader.BACKGROUND_FILES.forEach(f => assert.ok(fs.existsSync(`public/stories/bg/${f}.webp`), `${f}.webp`));
});

await test('robots: every robot draws in both modes', () => {
    Object.keys(ROBOTS).forEach(id => {
        assert.ok(robotSVG(id).startsWith('<svg'), id);
        if (ROBOTS[id].vehicle) assert.notStrictEqual(robotSVG(id, { mode: 'vehicle' }), robotSVG(id));
    });
});

// ---------- Reader ----------

await test('reader: text highlights focus sounds and tricky words, and words are tappable', () => {
    const html = reader.sentenceHTML('Torch said it was dark.', STORIES[0]);
    const div = document.createElement('div');
    div.innerHTML = html;
    assert.strictEqual(div.querySelectorAll('.sr-word').length, 5);
    assert.ok(div.querySelector('.sr-tricky').textContent === 'said');
    assert.deepStrictEqual([...div.querySelectorAll('.sr-gpc')].map(s => s.textContent), ['or', 'ch', 'ar']);
});

await test('reader: shelf shows episodes, later ones locked until the one before is read', () => {
    const c = container();
    reader.initRobotStories(c, [], () => {}, { pageDelay: 0 });
    const covers = c.querySelectorAll('.sr-cover');
    assert.strictEqual(covers.length, STORIES.length);
    assert.ok(!covers[0].classList.contains('locked'));
    assert.ok(covers[1].classList.contains('locked'));
    click(covers[1]);
    assert.ok(c.querySelector('.sr-shelf'), 'locked story does not open');
});

await test('reader: read a whole story by clicking — meet, pages, transform, quiz, reward', async () => {
    const c = container();
    let back = false;
    const story = STORIES[0];
    reader.initRobotStories(c, [], () => { back = true; }, { pageDelay: 0 });
    click(c.querySelector('.sr-cover'));
    assert.strictEqual(c.querySelectorAll('.sr-star').length, story.starWords.length);
    click(c.querySelector('.sr-start'));
    for (let i = 0; i < story.pages.length; i++) {
        assert.strictEqual(c.querySelectorAll('.sr-sentence').length, story.pages[i].sentences.length, `page ${i + 1}`);
        const transform = c.querySelector('.sr-transform');
        if (transform) {
            assert.ok(c.querySelector('.sr-next').disabled, 'must transform before turning');
            click(c.querySelector('.sr-next'));
            assert.strictEqual(c.querySelectorAll('.sr-sentence').length, story.pages[i].sentences.length, 'still on transform page');
            click(transform);
            await sleep(700);
            assert.ok(c.querySelector('.sr-actor.is-vehicle'), 'robot became a vehicle');
        }
        assert.ok(!c.querySelector('.sr-next').disabled, `next enabled on page ${i + 1}`);
        click(c.querySelector('.sr-next'));
    }
    // Quiz: a wrong answer is fine, the right one moves on.
    const wrong = [...c.querySelectorAll('.sr-quiz-option')].find(b => b.dataset.id !== story.quiz.answer);
    click(wrong);
    assert.ok(c.querySelector('.sr-quiz'), 'no penalty, still on quiz');
    click(c.querySelector(`.sr-quiz-option[data-id="${story.quiz.answer}"]`));
    await sleep(1400);
    assert.ok(c.querySelector('.sr-end'), 'reward screen');
    assert.strictEqual(c.querySelectorAll('.sr-end-bot').length, story.crew.length);
    const p = reader.getStoryProgress();
    assert.strictEqual(p.reads[story.id], 1);
    assert.deepStrictEqual(p.crew, story.crew);
    assert.ok(reader.isUnlocked(1), 'next episode unlocked');
    click(c.querySelector('.sr-shelf-btn'));
    click(c.querySelector('.sr-back'));
    assert.ok(back, 'back to hub');
});

await test('reader: next page waits a little per sentence (no skimming), arrow keys turn pages', async () => {
    const c = container();
    reader.initRobotStories(c, [], () => {}, { pageDelay: 40, storyId: STORIES[1].id });
    click(c.querySelector('.sr-start'));
    assert.ok(c.querySelector('.sr-next').disabled, 'waits before turning');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    assert.strictEqual(c.querySelector('.sr-pip.now'), c.querySelectorAll('.sr-pip')[0], 'still on page 1');
    await sleep(150);
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    assert.strictEqual(c.querySelector('.sr-pip.now'), c.querySelectorAll('.sr-pip')[1], 'on page 2');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    assert.strictEqual(c.querySelector('.sr-pip.now'), c.querySelectorAll('.sr-pip')[0], 'back to page 1');
});

console.log(failures ? `\n${failures} test(s) failed` : '\nAll Robot Stories tests passed');
process.exit(failures ? 1 : 0);
