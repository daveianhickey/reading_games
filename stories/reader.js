// Robot Stories: story shelf + page reader. Design: docs/robot-stories-design.md §7.
// Entry point follows the game module contract: initRobotStories(container, words, onBack).
import { STORIES } from './index.js';
import { ROBOTS, CREW, robotSVG, ROBOT_CSS } from './robots.js';
import { wordsIn, whyReadable, starWordList, findGpc } from './decodable.js';
import { say, sfx, animate, burstAt, wiggle, glow, unlockSticker, reducedMotion } from '../phonics/engine.js';

// Background images (public/stories/bg). Some scenes reuse a picture with a colour tint.
const BACKGROUNDS = {
    'park-day': { src: 'park-day' },
    'park-storm': { src: 'park-storm' },
    'park-sunrise': { src: 'park-sunrise' },
    'road-night': { src: 'road-night' },
    'road-mud': { src: 'road-mud' },
    'tower-night': { src: 'tower-night' },
    'fair-day': { src: 'fair-day' },
    'fair-storm': { src: 'fair-day', tint: 'storm' },
    'moon-port': { src: 'park-day', tint: 'dusk' }
};
export const BACKGROUND_IDS = Object.keys(BACKGROUNDS);
export const BACKGROUND_FILES = [...new Set(Object.values(BACKGROUNDS).map(b => b.src))];

const PROGRESS_KEY = 'y1Stories';
const DEFAULT_DELAY = 1200; // ms per sentence before the page can turn (anti-skimming, no penalty)

// ---------- Progress ----------

export function getStoryProgress() {
    try {
        const p = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
        return { reads: p.reads || {}, crew: p.crew || [], unlockAll: Boolean(p.unlockAll) };
    } catch (e) {
        return { reads: {}, crew: [], unlockAll: false };
    }
}
function saveProgress(p) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) { /* ignore */ }
}
export function isUnlocked(index, progress = getStoryProgress()) {
    return index === 0 || progress.unlockAll || (progress.reads[STORIES[index - 1].id] || 0) > 0;
}
// Mark a story as finished. Returns the robots that newly joined the crew.
export function finishStory(story) {
    const p = getStoryProgress();
    p.reads[story.id] = (p.reads[story.id] || 0) + 1;
    const fresh = (story.crew || []).filter(id => !p.crew.includes(id));
    p.crew = [...p.crew, ...fresh];
    saveProgress(p);
    return fresh;
}

// ---------- Text with focus highlights ----------

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Letter ranges of the story's focus sounds inside a word (non-overlapping).
function gpcRanges(word, story) {
    const ranges = [];
    for (const id of story.targets.gpcs) {
        const r = findGpc(word, id);
        if (r && !ranges.some(([a, b]) => r[0] < b && a < r[1])) ranges.push(r);
    }
    return ranges.sort((a, b) => a[0] - b[0]);
}

export function sentenceHTML(sentence, story) {
    const stars = starWordList(story);
    const targetWords = story.targets.words.map(w => w.toLowerCase());
    return sentence.split(/([A-Za-z]+(?:['’][A-Za-z]+)?)/).map((part, i) => {
        if (i % 2 === 0) return esc(part);
        const key = wordsIn(part)[0] || part.toLowerCase();
        let inner = esc(part);
        let cls = 'sr-word';
        if (targetWords.includes(key)) cls += ' sr-tricky';
        else if (whyReadable(key, stars) !== 'tricky') {
            const ranges = gpcRanges(part, story);
            if (ranges.length) {
                let out = '';
                let at = 0;
                ranges.forEach(([a, b]) => { out += esc(part.slice(at, a)) + `<span class="sr-gpc">${esc(part.slice(a, b))}</span>`; at = b; });
                inner = out + esc(part.slice(at));
            }
        }
        return `<button type="button" class="${cls}" data-word="${esc(part)}">${inner}</button>`;
    }).join('');
}

// ---------- Scene rendering ----------

function sceneHTML(scene) {
    const bg = BACKGROUNDS[scene.bg] || BACKGROUNDS['park-day'];
    const fx = scene.fx || [];
    const cast = (scene.cast || []).map((c, i) => {
        const vehicle = c.mode === 'vehicle';
        const cls = ['sr-actor', vehicle ? 'is-vehicle' : '', c.anim ? `sr-anim-${c.anim}` : ''].join(' ');
        return `<div class="${cls}" data-id="${c.id}" data-index="${i}" style="left:${c.x ?? 50}%; bottom:${c.y ?? 6}%; height:${c.size ?? 70}%; animation-delay:${i * 0.12}s">
            <div class="sr-actor-inner">${robotSVG(c.id, { mode: c.mode || 'robot', holding: c.holding })}</div></div>`;
    }).join('');
    return `
        <div class="sr-bg" style="background-image:url('/stories/bg/${bg.src}.webp')"></div>
        ${bg.tint ? `<div class="sr-tint sr-tint-${bg.tint}"></div>` : ''}
        ${scene.chain ? '<div class="sr-chain"></div>' : ''}
        <div class="sr-cast">${cast}</div>
        ${fx.map(f => `<div class="sr-fx sr-fx-${f}">${f === 'sparkle' ? '<span>✨</span><span>⭐</span><span>✨</span><span>⭐</span><span>✨</span>' : ''}</div>`).join('')}`;
}

// ---------- Entry point ----------

export function initRobotStories(container, words, onBack, opts = {}) {
    ensureStyles();
    const pageDelay = opts.pageDelay ?? DEFAULT_DELAY;
    const timers = new Set();
    let keyHandler = null;
    let alive = true;

    const later = (fn, ms) => {
        const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, ms);
        timers.add(id);
        return id;
    };
    const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };
    function onKey(e) { if (alive && keyHandler) keyHandler(e); }
    document.addEventListener('keydown', onKey);
    function leave() {
        alive = false;
        clearTimers();
        document.removeEventListener('keydown', onKey);
        try { window.speechSynthesis?.cancel(); } catch (e) { /* ignore */ }
        onBack();
    }

    function frame(title, { pips = 0, done = 0, backLabel = 'Back' } = {}) {
        container.innerHTML = `
            <div class="sr-root">
                <div class="sr-top">
                    <button class="sr-round sr-back" aria-label="${backLabel}">←</button>
                    <div class="sr-title">${title}</div>
                    <div class="sr-pips" aria-label="Page ${done} of ${pips}">${Array.from({ length: pips }, (_, i) =>
                        `<span class="sr-pip${i < done ? ' on' : ''}${i === done ? ' now' : ''}"></span>`).join('')}</div>
                </div>
                <div class="sr-body"></div>
            </div>`;
        return container.querySelector('.sr-body');
    }

    // ----- Shelf -----
    function showShelf() {
        clearTimers();
        keyHandler = null;
        const progress = getStoryProgress();
        const body = frame('Robot Stories 📖', { backLabel: 'Back to games' });
        container.querySelector('.sr-back').addEventListener('click', leave);
        body.innerHTML = `
            <div class="sr-shelf">
                ${STORIES.map((s, i) => {
                    const open = isUnlocked(i, progress);
                    const reads = progress.reads[s.id] || 0;
                    return `<button class="sr-cover${open ? '' : ' locked'}" data-index="${i}" ${open ? '' : 'aria-disabled="true"'}
                                aria-label="Episode ${s.episode}: ${esc(s.title)}${open ? '' : ' (locked)'}">
                        <div class="sr-cover-art">${sceneHTML(s.cover)}</div>
                        <div class="sr-cover-info">
                            <span class="sr-ep">Episode ${s.episode}</span>
                            <strong>${esc(s.title)}</strong>
                            <span class="sr-badge">${!open ? '🔒 Read the one before first' : reads ? `⭐ Read ${reads}×` : '✨ New!'}</span>
                        </div>
                    </button>`;
                }).join('')}
            </div>
            <div class="sr-crew-strip">
                <strong>My Robot Crew</strong>
                <div class="sr-crew">${CREW.map(id => {
                    const got = progress.crew.includes(id);
                    return `<div class="sr-crew-bot${got ? '' : ' missing'}" title="${got ? ROBOTS[id].name : '?'}">
                        <div class="sr-crew-pic">${robotSVG(id, { title: got })}</div><span>${got ? ROBOTS[id].name : '?'}</span></div>`;
                }).join('')}</div>
            </div>
            ${progress.unlockAll || STORIES.every((_, i) => isUnlocked(i, progress)) ? '' : '<button class="sr-unlock-all">Grown-ups: unlock all stories</button>'}`;
        body.querySelectorAll('.sr-cover').forEach(btn => btn.addEventListener('click', () => {
            const i = Number(btn.dataset.index);
            if (!isUnlocked(i)) { sfx.boing(); wiggle(btn); say('Read the story before this one first!'); return; }
            showMeet(STORIES[i]);
        }));
        body.querySelector('.sr-unlock-all')?.addEventListener('click', () => {
            const p = getStoryProgress();
            p.unlockAll = true;
            saveProgress(p);
            showShelf();
        });
        say('Robot Stories! Pick a story.');
    }

    // ----- Meet the robots (star words) -----
    function showMeet(story) {
        clearTimers();
        const body = frame(`Episode ${story.episode}: ${esc(story.title)}`, { backLabel: 'Back to stories' });
        container.querySelector('.sr-back').addEventListener('click', showShelf);
        body.innerHTML = `
            <div class="sr-meet">
                <h2>Meet the robots!</h2>
                <p class="sr-meet-tip">Tap a word to hear it.</p>
                <div class="sr-meet-grid">${story.starWords.map(s => `
                    <button class="sr-star" data-word="${esc(s.word)}">
                        <div class="sr-star-pic">${s.robot ? robotSVG(s.robot) : `<span class="sr-emoji">${s.emoji || '⭐'}</span>`}</div>
                        <span class="sr-star-word">${esc(s.word)}</span>
                    </button>`).join('')}</div>
                <button class="btn sr-start">Start the story ▶</button>
            </div>`;
        body.querySelectorAll('.sr-star').forEach(b => b.addEventListener('click', () => {
            say(b.dataset.word);
            animate(b.querySelector('.sr-star-pic'), [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], 350);
        }));
        body.querySelector('.sr-start').addEventListener('click', () => showPage(story, 0));
        keyHandler = e => { if (e.key === 'ArrowRight') showPage(story, 0); };
        say('Meet the robots! Tap a word to hear it.');
    }

    // ----- A story page -----
    function showPage(story, index, direction = 1) {
        clearTimers();
        const page = story.pages[index];
        const body = frame(esc(story.title), { pips: story.pages.length, done: index, backLabel: 'Back to stories' });
        container.querySelector('.sr-back').addEventListener('click', showShelf);
        const needsTap = page.interaction?.type === 'transform';
        body.innerHTML = `
            <div class="sr-page">
                <div class="sr-stage" role="img" aria-label="${esc(page.alt || '')}">
                    ${sceneHTML(page.scene)}
                    ${needsTap ? `<button class="sr-transform">⚡ ${esc(page.interaction.label || 'Tap to transform!')}</button>` : ''}
                </div>
                <div class="sr-textbox">
                    <div class="sr-text" aria-live="polite">${page.sentences.map(s => `<p class="sr-sentence">${sentenceHTML(s, story)}</p>`).join('')}</div>
                    <div class="sr-nav">
                        <button class="sr-round sr-prev" aria-label="Previous page" ${index === 0 ? 'disabled' : ''}>◀</button>
                        <button class="sr-round sr-next waiting" aria-label="Next page" disabled><span class="sr-next-fill"></span><span class="sr-next-icon">▶</span></button>
                    </div>
                </div>
            </div>`;

        const pageEl = body.querySelector('.sr-page');
        const stage = body.querySelector('.sr-stage');
        const next = body.querySelector('.sr-next');
        const prev = body.querySelector('.sr-prev');
        let canTurn = false;
        let transformed = !needsTap;

        animate(pageEl, [{ transform: `translateX(${direction * 40}px)`, opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], 280);
        if (index > 0) sfx.flip();
        if (page.scene.fx?.includes('lightning')) later(() => sfx.roar(), 500);

        const delay = pageDelay * page.sentences.length;
        next.style.setProperty('--wait', `${delay}ms`);
        const allowTurn = () => {
            if (!transformed) return;
            canTurn = true;
            next.disabled = false;
            next.classList.remove('waiting');
            next.classList.add('ready');
        };
        let delayDone = delay === 0;
        if (delay > 0) later(() => { delayDone = true; allowTurn(); }, delay); else allowTurn();

        const goNext = () => {
            if (!canTurn) { if (!transformed) glow(body.querySelector('.sr-transform')); return; }
            sfx.whoosh();
            if (index + 1 < story.pages.length) showPage(story, index + 1, 1);
            else if (story.quiz) showQuiz(story);
            else showEnd(story);
        };
        const goPrev = () => { if (index > 0) showPage(story, index - 1, -1); };
        next.addEventListener('click', goNext);
        prev.addEventListener('click', goPrev);
        stage.addEventListener('click', e => { if (!e.target.closest('.sr-transform')) goNext(); });

        // Swipe to turn.
        let startX = null;
        pageEl.addEventListener('pointerdown', e => { startX = e.clientX; });
        pageEl.addEventListener('pointerup', e => {
            if (startX === null) return;
            const dx = e.clientX - startX;
            startX = null;
            if (dx < -70) goNext(); else if (dx > 70) goPrev();
        });

        body.querySelectorAll('.sr-word').forEach(w => w.addEventListener('click', e => {
            e.stopPropagation();
            say(w.dataset.word);
            w.classList.remove('said');
            void w.offsetWidth;
            w.classList.add('said');
        }));

        if (needsTap) {
            const btn = body.querySelector('.sr-transform');
            later(() => glow(btn), 9000);
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                btn.disabled = true;
                btn.classList.add('used');
                await transformActor(stage, page.interaction.robot);
                if (!alive) return;
                transformed = true;
                if (delayDone) allowTurn();
            });
        }

        keyHandler = e => {
            if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
            if (e.key === 'ArrowLeft') goPrev();
        };
    }

    // Robot -> vehicle with flash, sound and sparks.
    async function transformActor(stage, robotId) {
        const actor = stage.querySelector(`.sr-actor[data-id="${robotId}"]`);
        if (!actor) return;
        sfx.powerUp();
        stage.classList.add('flash');
        actor.classList.add('sr-transforming');
        await new Promise(r => later(r, reducedMotion() ? 50 : 500));
        actor.querySelector('.sr-actor-inner').innerHTML = robotSVG(robotId, { mode: 'vehicle' });
        actor.classList.add('is-vehicle');
        actor.style.height = `${parseFloat(actor.style.height) * 0.52}%`;
        actor.classList.remove('sr-transforming');
        stage.classList.remove('flash');
        sfx.zap();
        burstAt(actor, { chars: ['⚡', '✨', '⭐'], count: 16 });
        animate(actor, [{ transform: 'translateX(-50%) scale(0.6)' }, { transform: 'translateX(-50%) scale(1.12)' }, { transform: 'translateX(-50%) scale(1)' }], 450);
    }

    // ----- "Who did it?" (no-fail recap) -----
    function showQuiz(story) {
        clearTimers();
        keyHandler = null;
        const q = story.quiz;
        const body = frame(esc(story.title), { pips: story.pages.length, done: story.pages.length, backLabel: 'Back to stories' });
        container.querySelector('.sr-back').addEventListener('click', showShelf);
        body.innerHTML = `
            <div class="sr-quiz">
                <h2>${esc(q.question)}</h2>
                <div class="sr-quiz-options">${q.options.map(id => `
                    <button class="sr-quiz-option" data-id="${id}" aria-label="${ROBOTS[id].name}">
                        <div class="sr-quiz-pic">${robotSVG(id)}</div><span>${ROBOTS[id].name}</span>
                    </button>`).join('')}</div>
            </div>`;
        say(q.question);
        let misses = 0;
        body.querySelectorAll('.sr-quiz-option').forEach(b => b.addEventListener('click', () => {
            if (b.dataset.id === q.answer) {
                sfx.clink();
                b.classList.add('right');
                burstAt(b, { chars: ['⭐', '✨'], count: 14 });
                say(`Yes! ${ROBOTS[q.answer].name}!`);
                later(() => showEnd(story), 1300);
            } else {
                sfx.boing();
                wiggle(b);
                say(ROBOTS[b.dataset.id].name);
                if (++misses >= 2) glow(body.querySelector(`.sr-quiz-option[data-id="${q.answer}"]`));
            }
        }));
    }

    // ----- End of story reward -----
    function showEnd(story) {
        clearTimers();
        keyHandler = null;
        const fresh = finishStory(story);
        const sticker = unlockSticker();
        const i = STORIES.indexOf(story);
        const nextStory = STORIES[i + 1];
        const body = frame(esc(story.title), { backLabel: 'Back to stories' });
        container.querySelector('.sr-back').addEventListener('click', showShelf);
        body.innerHTML = `
            <div class="sr-end">
                <h2>You read the whole story! ⭐</h2>
                ${fresh.length ? `<p class="sr-end-sub">New for your Robot Crew:</p>
                <div class="sr-end-crew">${fresh.map(id => `<div class="sr-end-bot"><div class="sr-end-pic">${robotSVG(id)}</div><strong>${ROBOTS[id].name}</strong></div>`).join('')}</div>`
                : `<div class="sr-end-crew">${story.crew.map(id => `<div class="sr-end-bot"><div class="sr-end-pic sr-anim-jump">${robotSVG(id)}</div></div>`).join('')}</div>`}
                ${sticker ? `<div class="sr-end-sticker">New sticker! <span>${sticker}</span></div>` : ''}
                <div class="sr-end-buttons">
                    <button class="btn sr-again">Read again 🔁</button>
                    ${nextStory ? `<button class="btn sr-next-story">Next story ▶</button>` : ''}
                    <button class="btn btn-secondary sr-shelf-btn">Stories 📚</button>
                </div>
            </div>`;
        sfx.fanfare();
        say(fresh.length ? `Brilliant reading! ${fresh.map(id => ROBOTS[id].name).join(' and ')} joined your crew!` : 'Brilliant reading!');
        body.querySelectorAll('.sr-end-bot').forEach((el, n) => later(() => burstAt(el, { chars: ['⭐', '✨', '⚡'], count: 14 }), 300 + n * 250));
        body.querySelector('.sr-again').addEventListener('click', () => showMeet(story));
        body.querySelector('.sr-next-story')?.addEventListener('click', () => showMeet(nextStory));
        body.querySelector('.sr-shelf-btn').addEventListener('click', showShelf);
        body.querySelector('.sr-again').focus();
    }

    const start = opts.storyId ? STORIES.find(s => s.id === opts.storyId) : null;
    if (start) showMeet(start); else showShelf();
    return { dispose: () => { alive = false; clearTimers(); document.removeEventListener('keydown', onKey); } };
}

// ---------- Styles ----------

function ensureStyles() {
    if (document.getElementById('sr-styles')) return;
    const style = document.createElement('style');
    style.id = 'sr-styles';
    style.textContent = ROBOT_CSS + `
        .sr-root { display: flex; flex-direction: column; gap: 0.8rem; min-height: calc(100vh - 4rem); border-radius: 28px; padding: 0.8rem;
            background: linear-gradient(160deg, #141e30 0%, #243b55 100%); color: #fff; font-family: 'Outfit', sans-serif; }
        .sr-root button { font-family: inherit; }
        .sr-root button:focus-visible { outline: 5px solid #FFE66D; outline-offset: 3px; }
        .sr-top { display: flex; align-items: center; gap: 0.8rem; background: rgba(255,255,255,0.12); border-radius: 50px; padding: 0.4rem; }
        .sr-title { flex: 1; text-align: center; font-weight: 800; font-size: 1.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sr-round { width: 64px; height: 64px; min-width: 64px; border-radius: 50%; border: none; font-size: 1.8rem; font-weight: 800; cursor: pointer;
            background: #fff; color: #2F3542; box-shadow: 0 5px 0 rgba(0,0,0,0.3); position: relative; overflow: hidden; }
        .sr-round:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 1px 0 rgba(0,0,0,0.3); }
        .sr-round:disabled { opacity: 0.35; cursor: default; }
        .sr-pips { display: flex; gap: 6px; padding-right: 0.6rem; flex-wrap: wrap; max-width: 45%; }
        .sr-pip { width: 18px; height: 18px; flex: none; border-radius: 6px; background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.5); }
        .sr-pip.on { background: #E53935; border-color: #fff; }
        .sr-pip.now { background: #FFE66D; border-color: #fff; box-shadow: 0 0 10px #FFE66D; }
        @media (max-width: 600px) { .sr-pip { width: 12px; height: 12px; border-radius: 4px; } .sr-title { font-size: 1rem; } }
        .sr-body { flex: 1; display: flex; flex-direction: column; }

        /* Shelf */
        .sr-shelf { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.2rem; }
        .sr-cover { border: none; padding: 0; border-radius: 24px; overflow: hidden; cursor: pointer; background: #fff; color: #2F3542; text-align: left;
            box-shadow: 0 8px 0 rgba(0,0,0,0.3); transition: transform 0.15s; }
        .sr-cover:hover { transform: translateY(-4px) rotate(-0.5deg); }
        .sr-cover.locked .sr-cover-art { filter: grayscale(1) brightness(0.5); }
        .sr-cover-art { position: relative; aspect-ratio: 3 / 2; overflow: hidden; }
        .sr-cover-info { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.8rem 1rem 1rem; }
        .sr-cover-info strong { font-size: 1.4rem; }
        .sr-ep { font-weight: 800; color: #E53935; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.08em; }
        .sr-badge { font-weight: 700; opacity: 0.8; }
        .sr-crew-strip { margin-top: 1.4rem; background: rgba(255,255,255,0.1); border-radius: 24px; padding: 1rem; text-align: center; }
        .sr-crew-strip strong { font-size: 1.2rem; }
        .sr-crew { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.8rem; margin-top: 0.6rem; }
        .sr-crew-bot { display: flex; flex-direction: column; align-items: center; font-weight: 700; width: 80px; }
        .sr-crew-pic { height: 80px; width: 80px; }
        .sr-crew-bot.missing .sr-crew-pic { filter: brightness(0); opacity: 0.35; }
        .sr-unlock-all { margin: 1rem auto 0; display: block; background: none; border: none; color: rgba(255,255,255,0.5); text-decoration: underline; cursor: pointer; font-size: 0.9rem; }

        /* Meet the robots */
        .sr-meet, .sr-quiz, .sr-end { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1rem; }
        .sr-meet h2, .sr-quiz h2, .sr-end h2 { font-size: clamp(1.8rem, 5vw, 2.8rem); margin: 0; }
        .sr-meet-tip { margin: 0; font-size: 1.2rem; opacity: 0.85; }
        .sr-meet-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; }
        .sr-star { width: 170px; border: none; border-radius: 22px; background: #fff; color: #2F3542; padding: 0.8rem; cursor: pointer; box-shadow: 0 6px 0 rgba(0,0,0,0.3); }
        .sr-star-pic { height: 120px; display: flex; align-items: center; justify-content: center; }
        .sr-emoji { font-size: 4.5rem; }
        .sr-star-word, .sr-text, .sr-quiz-option span, .sr-end-bot strong { font-family: 'Andika', 'Outfit', sans-serif; }
        .sr-star-word { display: block; font-size: 1.7rem; font-weight: 700; margin-top: 0.4rem; }
        .sr-start { font-size: 1.6rem; padding: 1rem 2.4rem; }

        /* Page */
        .sr-page { flex: 1; display: grid; gap: 0.8rem; grid-template-columns: 1fr; align-content: start; touch-action: pan-y; }
        @media (orientation: landscape) and (min-width: 820px) { .sr-page { grid-template-columns: minmax(0, 1.55fr) minmax(300px, 1fr); align-items: stretch; } }
        .sr-stage { position: relative; aspect-ratio: 3 / 2; width: 100%; border-radius: 24px; overflow: hidden; cursor: pointer; background: #0b1033; box-shadow: 0 8px 0 rgba(0,0,0,0.35); }
        .sr-bg, .sr-tint, .sr-fx, .sr-cast { position: absolute; inset: 0; }
        .sr-bg { background-size: cover; background-position: center bottom; }
        .sr-tint-storm { background: linear-gradient(180deg, rgba(40,10,90,0.72), rgba(20,20,60,0.55)); }
        .sr-tint-dusk { background: linear-gradient(180deg, rgba(255,120,60,0.35), rgba(50,20,110,0.55)); }
        .sr-stage.flash::after { content: ''; position: absolute; inset: 0; background: #fff; animation: srFlash 0.5s ease-out; pointer-events: none; }
        .sr-actor { position: absolute; transform: translateX(-50%); aspect-ratio: 280 / 276; animation: srEnter 0.45s cubic-bezier(.3,1.6,.6,1) both; }
        .sr-actor.is-vehicle { aspect-ratio: 320 / 190; }
        .sr-actor[data-id="gear"] { aspect-ratio: 210 / 160; }
        .sr-actor[data-id="bus"] { aspect-ratio: 320 / 170; }
        .sr-actor-inner { width: 100%; height: 100%; filter: drop-shadow(0 10px 8px rgba(0,0,0,0.45)); }
        .sr-transforming .sr-actor-inner { animation: srSpin 0.5s ease-in; }
        .sr-chain { position: absolute; left: 40%; width: 22%; bottom: 20%; height: 8px; background: repeating-linear-gradient(90deg, #B0BEC5 0 10px, #546E7A 10px 14px); border-radius: 4px; }
        .sr-transform { position: absolute; left: 50%; bottom: 6%; transform: translateX(-50%); border: none; border-radius: 40px; padding: 1rem 2rem;
            font-size: clamp(1.3rem, 3vw, 2rem); font-weight: 800; color: #2F3542; background: #FFE66D; cursor: pointer;
            box-shadow: 0 6px 0 #c9a227, 0 0 30px #FFE66D; animation: srPulse 1.2s ease-in-out infinite; z-index: 3; }
        .sr-transform.used { opacity: 0; pointer-events: none; transition: opacity 0.3s; }
        .sr-transform.y1-hint, .sr-quiz-option.y1-hint { outline: 6px solid #fff; }
        .sr-textbox { display: flex; flex-direction: column; justify-content: space-between; gap: 0.8rem; background: #FFFDF5; color: #2F3542; border-radius: 24px; padding: 1.2rem 1.4rem; box-shadow: 0 8px 0 rgba(0,0,0,0.35); }
        .sr-text { font-size: clamp(1.6rem, 4.2vw, 2.5rem); line-height: 1.55; }
        .sr-sentence { margin: 0 0 0.5rem; }
        .sr-word { border: none; background: none; padding: 0 0.04em; margin: 0; font: inherit; color: inherit; cursor: pointer; border-radius: 8px; }
        .sr-word:hover { background: #FFF3C4; }
        .sr-word.said { animation: srSaid 0.6s ease; }
        .sr-gpc { text-decoration: underline; text-decoration-color: #F39C12; text-decoration-thickness: 0.14em; text-underline-offset: 0.16em; color: #C0392B; }
        .sr-gpc + .sr-gpc { margin-left: 0.08em; }
        .sr-tricky { text-decoration: underline dotted #8E44AD; text-decoration-thickness: 0.12em; text-underline-offset: 0.18em; color: #6C3483; }
        .sr-nav { display: flex; justify-content: space-between; align-items: center; }
        .sr-next { width: 88px; height: 88px; font-size: 2.4rem; background: #E0E0E0; }
        .sr-next-fill { position: absolute; inset: 0; background: #2ECC71; transform-origin: left; transform: scaleX(0); }
        .sr-next.waiting .sr-next-fill { animation: srFill var(--wait, 1s) linear forwards; }
        .sr-next.ready { background: #2ECC71; color: #fff; animation: srPulse 1.4s ease-in-out infinite; }
        .sr-next.ready .sr-next-fill { transform: scaleX(1); }
        .sr-next-icon { position: relative; }

        /* Quiz + end */
        .sr-quiz-options, .sr-end-crew { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; }
        .sr-quiz-option { width: 180px; border: none; border-radius: 22px; background: #fff; color: #2F3542; padding: 0.8rem; cursor: pointer; box-shadow: 0 6px 0 rgba(0,0,0,0.3); font-size: 1.5rem; font-weight: 700; }
        .sr-quiz-option.right { background: #2ECC71; color: #fff; }
        .sr-quiz-pic, .sr-end-pic { height: 150px; }
        .sr-end-sub { font-size: 1.4rem; margin: 0; font-weight: 700; }
        .sr-end-bot { display: flex; flex-direction: column; align-items: center; font-size: 1.6rem; }
        .sr-end-pic { width: 160px; animation: srEnter 0.6s cubic-bezier(.3,1.6,.6,1) both; }
        .sr-end-sticker { font-size: 1.4rem; font-weight: 800; color: #FFE66D; }
        .sr-end-sticker span { font-size: 3rem; display: inline-block; animation: float 2s ease-in-out infinite; }
        .sr-end-buttons { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; }
        .sr-end-buttons .btn { font-size: 1.4rem; padding: 0.9rem 1.8rem; }

        /* Effects */
        .sr-fx { pointer-events: none; }
        .sr-fx-rain { background: repeating-linear-gradient(105deg, transparent 0 18px, rgba(200,220,255,0.18) 18px 19.5px); background-size: 200% 200%; animation: srRain 0.5s linear infinite; }
        .sr-fx-lightning { background: rgba(255,255,255,0.85); opacity: 0; animation: srLightning 4s infinite; }
        .sr-fx-speed { background: repeating-linear-gradient(0deg, transparent 0 26px, rgba(255,255,255,0.4) 26px 29px); mask-image: linear-gradient(90deg, #000, transparent 70%); -webkit-mask-image: linear-gradient(90deg, #000, transparent 70%); animation: srSpeed 0.3s linear infinite; }
        .sr-fx-zap::before { content: ''; position: absolute; left: 26%; right: 26%; top: 44%; height: 14px; border-radius: 8px; background: linear-gradient(90deg, #4FC3F7, #fff, #4FC3F7); box-shadow: 0 0 30px #4FC3F7, 0 0 60px #fff; animation: srZap 1.2s ease-in-out infinite; }
        .sr-fx-sparkle span { position: absolute; font-size: 2rem; animation: srTwinkle 1.6s ease-in-out infinite; }
        .sr-fx-sparkle span:nth-child(1) { left: 10%; top: 15%; } .sr-fx-sparkle span:nth-child(2) { left: 80%; top: 12%; animation-delay: .3s; }
        .sr-fx-sparkle span:nth-child(3) { left: 45%; top: 8%; animation-delay: .6s; } .sr-fx-sparkle span:nth-child(4) { left: 25%; top: 40%; animation-delay: .9s; }
        .sr-fx-sparkle span:nth-child(5) { left: 70%; top: 38%; animation-delay: 1.2s; }

        /* Actor animations (on the inner element so positioning stays put) */
        .sr-anim-bob .sr-actor-inner { animation: srBob 2.4s ease-in-out infinite; }
        .sr-anim-jump .sr-actor-inner, .sr-anim-jump.sr-end-pic { animation: srJump 0.9s ease-in-out infinite; }
        .sr-anim-shake .sr-actor-inner { animation: srShake 0.4s linear infinite; }
        .sr-anim-loom .sr-actor-inner { animation: srLoom 3s ease-in-out infinite; }
        .sr-anim-flyoff .sr-actor-inner { animation: srFlyoff 3s ease-in infinite; }
        .sr-anim-drive .sr-actor-inner { animation: srDrive 0.5s ease-in-out infinite; }
        .sr-anim-drive .rb-wheel, .sr-anim-pull .rb-wheel { animation: srWheel 0.4s linear infinite; }
        .sr-anim-fall .sr-actor-inner { animation: srFall 1.2s ease-in forwards; transform-origin: bottom center; }
        .sr-anim-lurk .sr-actor-inner { animation: srLurk 3s ease-in-out infinite; }
        .sr-anim-push .sr-actor-inner { animation: srPush 0.8s ease-in-out infinite; transform-origin: bottom center; }
        .sr-anim-pull .sr-actor-inner { animation: srPull 0.7s ease-in-out infinite; }
        .sr-anim-stuck .sr-actor-inner { animation: srStuck 1.6s ease-in-out infinite; }
        .sr-anim-pop .sr-actor-inner { animation: srPop 0.9s cubic-bezier(.3,1.6,.6,1) both; }
        .sr-anim-run .sr-actor-inner { animation: srRun 0.35s ease-in-out infinite; }
        .sr-anim-hover .sr-actor-inner { animation: srHover 2s ease-in-out infinite; }

        @keyframes srEnter { from { opacity: 0; scale: 0.6; } to { opacity: 1; scale: 1; } }
        @keyframes srFlash { from { opacity: 1; } to { opacity: 0; } }
        @keyframes srSpin { 0% { transform: rotateY(0) scale(1); } 100% { transform: rotateY(720deg) scale(0.4); filter: brightness(3); } }
        @keyframes srPulse { 50% { scale: 1.06; } }
        @keyframes srFill { to { transform: scaleX(1); } }
        @keyframes srSaid { 30% { background: #FFE66D; transform: translateY(-6px); } }
        @keyframes srRain { to { background-position: -40px 120px; } }
        @keyframes srLightning { 0%, 88%, 92%, 96%, 100% { opacity: 0; } 90%, 94% { opacity: 0.8; } }
        @keyframes srSpeed { to { background-position: -60px 0; } }
        @keyframes srZap { 0%, 100% { opacity: 0.4; transform: scaleX(0.6); } 50% { opacity: 1; transform: scaleX(1); } }
        @keyframes srTwinkle { 50% { transform: scale(1.5) rotate(20deg); opacity: 0.4; } }
        @keyframes srBob { 50% { transform: translateY(-4%); } }
        @keyframes srJump { 0%, 100% { transform: translateY(0); } 40% { transform: translateY(-18%); } }
        @keyframes srShake { 25% { transform: translateX(-2%) rotate(-2deg); } 75% { transform: translateX(2%) rotate(2deg); } }
        @keyframes srLoom { 50% { transform: scale(1.06) translateY(-3%); } }
        @keyframes srFlyoff { 0% { transform: translate(0, 0); } 70% { transform: translate(30%, -40%) scale(0.7); opacity: 1; } 100% { transform: translate(40%, -55%) scale(0.5); opacity: 0; } }
        @keyframes srDrive { 50% { transform: translateY(-2%) translateX(1%); } }
        @keyframes srWheel { to { transform: rotate(360deg); } }
        @keyframes srFall { 0% { transform: rotate(0); } 40% { transform: rotate(-12deg); } 100% { transform: rotate(80deg) translateY(10%); } }
        @keyframes srLurk { 0%, 100% { transform: translateY(20%); opacity: 0.6; } 50% { transform: translateY(0); opacity: 1; } }
        @keyframes srPush { 50% { transform: rotate(-8deg) translateX(-4%); } }
        @keyframes srPull { 50% { transform: translateX(3%); } }
        @keyframes srStuck { 25% { transform: rotate(-2deg); } 75% { transform: rotate(2deg); } }
        @keyframes srPop { 0% { transform: translateY(20%); } 60% { transform: translateY(-25%); } 100% { transform: translateY(0); } }
        @keyframes srRun { 50% { transform: translateY(-8%) rotate(-3deg); } }
        @keyframes srHover { 50% { transform: translateY(-6%); } }
        @media (prefers-reduced-motion: reduce) {
            .sr-root *, .sr-root *::before, .sr-root *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
    `;
    document.head.appendChild(style);
}
