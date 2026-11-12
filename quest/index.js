// Torch Quest: screens (map, level, power-down, flag) and the word-gate plates.
// Design: docs/torch-quest-design.md. Rules live in run.js / mastery.js / gates.js;
// the scrolling game is runner.js. Plates are real buttons laid over the canvas.
import { say, sfx } from '../phonics/engine.js';
import { LEVELS, WORLDS, worldItems } from './content.js';
import { loadState, saveState, itemState, isRusty, inForge, isLevelUnlocked, isWorldUnlocked, bossDoor, worldStars, totalStars, finishLevel, failLevel, TIERS, TICKS_TO_PROMOTE } from './mastery.js';
import { unlikeWords } from './gates.js';
import { createRun, createTapGuard, MAX_HEARTS, CHECKPOINT_AFTER } from './run.js';
import { buildCourse } from './level.js';
import { createGame, VIEW } from './runner.js';

const TIER_EMOJI = ['⚙️', '🟫', '⬜', '🟨'];

const CSS = `
.tq-root { position: fixed; inset: 0; z-index: 50; background: #141826; color: #fff; font-family: 'Outfit', sans-serif;
  display: flex; align-items: center; justify-content: center; overflow: auto; touch-action: manipulation; user-select: none; -webkit-user-select: none; }
.tq-stage { position: relative; width: min(100vw, calc(100vh * 16 / 9)); aspect-ratio: 16 / 9; container-type: inline-size; overflow: hidden; background: #2b3a67; }
.tq-canvas { width: 100%; height: 100%; display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
.tq-hud { position: absolute; top: 0; left: 0; right: 0; display: flex; align-items: center; gap: 2cqw; padding: 1.5cqw 2cqw; font-size: 4cqw; font-weight: 800; pointer-events: none; text-shadow: 0 2px 0 rgba(0,0,0,.5); }
.tq-hud button { pointer-events: auto; }
.tq-x { width: 7cqw; height: 7cqw; min-width: 40px; min-height: 40px; border-radius: 1.5cqw; border: 0; background: rgba(0,0,0,.45); color: #fff; font-size: 3.5cqw; font-weight: 800; cursor: pointer; }
.tq-hearts span { display: inline-block; transition: transform .2s; }
.tq-hearts .lost { filter: grayscale(1) brightness(.5); transform: scale(.8); }
.tq-pips { flex: 1; display: flex; justify-content: center; align-items: center; gap: 1cqw; }
.tq-pip { width: 3cqw; height: 3cqw; border-radius: .6cqw; background: rgba(255,255,255,.25); border: .4cqw solid rgba(0,0,0,.35); }
.tq-pip.ok { background: #7CFC8A; } .tq-pip.no { background: #ff5d5d; } .tq-pip.now { background: #ffd23f; }
.tq-pipflag { font-size: 3cqw; }
.tq-gate { position: absolute; inset: 11% 0 auto 0; display: flex; flex-direction: column; align-items: center; gap: 2cqw; }
.tq-gate[hidden], .tq-overlay[hidden] { display: none; }
.tq-prompt { min-height: 11cqw; display: flex; align-items: center; justify-content: center; }
.tq-speak { width: 10cqw; height: 10cqw; min-width: 64px; min-height: 64px; border-radius: 50%; border: .6cqw solid #1d2433; background: #ffd23f; font-size: 5cqw; cursor: pointer; box-shadow: 0 .8cqw 0 #b8860b; }
.tq-flash { background: #0d1b12; color: #7CFC8A; border: .8cqw solid #59627a; border-radius: 2cqw; padding: 0 6cqw; font: 700 8cqw 'Andika', 'Outfit', sans-serif; min-width: 30cqw; text-align: center; }
.tq-plates { display: flex; gap: 3cqw; justify-content: center; width: 92%; }
.tq-plates .tq-plate { flex: 0 1 26cqw; min-width: 0; }
.tq-plates.long .tq-plate { font-size: 6cqw; }
.tq-plate { min-width: 24cqw; min-height: max(72px, 13cqw); padding: 0 3cqw; border-radius: 2cqw; border: .7cqw solid #1d2433; background: #f4f1e8; color: #1d2433;
  font: 700 7.5cqw 'Andika', 'Outfit', sans-serif; cursor: pointer; box-shadow: 0 1.2cqw 0 #8d8a80; transition: transform .15s, opacity .2s, background .2s; }
.tq-plate.locked { opacity: .55; }
.tq-plate.right, .tq-plate.reveal { background: #7CFC8A; transform: scale(1.08); }
.tq-plate.wrong { background: #ff8a80; transform: translateY(40%) rotate(8deg); opacity: .35; }
.tq-msg { font-size: 4.5cqw; font-weight: 800; min-height: 6cqw; text-shadow: 0 2px 0 rgba(0,0,0,.6); }
.tq-overlay { position: absolute; inset: 0; background: rgba(13,16,28,.88); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2cqw; padding: 3cqw; text-align: center; overflow: auto; }
.tq-overlay h2 { font-size: 6cqw; margin: 0; color: #ffd23f; }
.tq-overlay p { font-size: 3cqw; margin: 0; font-weight: 600; }
.tq-stars { font-size: 9cqw; letter-spacing: 1cqw; }
.tq-row { display: flex; gap: 2cqw; flex-wrap: wrap; justify-content: center; }
.tq-btn { min-height: max(56px, 9cqw); padding: 0 4cqw; border-radius: 2cqw; border: .5cqw solid #1d2433; background: #ffd23f; color: #1d2433; font: 800 3.6cqw 'Outfit', sans-serif; cursor: pointer; box-shadow: 0 .9cqw 0 #b8860b; }
.tq-btn.alt { background: #aab3c5; box-shadow: 0 .9cqw 0 #59627a; }
.tq-word { min-height: max(56px, 8cqw); padding: 0 3cqw; border-radius: 1.5cqw; border: .5cqw solid #1d2433; background: #f4f1e8; color: #1d2433; font: 700 5cqw 'Andika', 'Outfit', sans-serif; cursor: pointer; }
.tq-map { width: min(100vw, 900px); padding: 16px; margin: auto; }
.tq-map h1 { font-size: clamp(28px, 6vw, 48px); margin: 0; color: #ffd23f; text-shadow: 0 4px 0 #9c1f1a; }
.tq-map h2 { font-size: clamp(18px, 3.5vw, 26px); margin: 4px 0 16px; color: #aab3c5; }
.tq-top { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.tq-top .tq-btn, .tq-map .tq-btn { font-size: 18px; min-height: 56px; padding: 0 20px; border-width: 3px; border-radius: 12px; box-shadow: 0 5px 0 #59627a; }
.tq-tally { margin-left: auto; font-size: 22px; font-weight: 800; }
.tq-levels { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; margin-bottom: 20px; }
.tq-level { width: 150px; min-height: 130px; border-radius: 14px; border: 4px solid #1d2433; background: #e8402f; color: #fff; font: 800 22px 'Outfit', sans-serif; cursor: pointer; box-shadow: 0 6px 0 #9c1f1a; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; }
.tq-level[disabled] { background: #59627a; box-shadow: 0 6px 0 #2a2d48; cursor: default; }
.tq-level small { font-size: 15px; font-weight: 600; }
.tq-path { color: #59627a; font-size: 28px; }
.tq-wall { display: flex; flex-wrap: wrap; gap: 8px; }
.tq-block { position: relative; min-width: 76px; padding: 10px 12px; border-radius: 6px; border: 3px solid rgba(0,0,0,.45); font: 700 22px 'Andika', 'Outfit', sans-serif; color: #1d2433; text-align: center; }
.tq-block small { display: block; font: 600 11px 'Outfit', sans-serif; opacity: .8; }
.tq-block.t0 { background: #8a8f9c; } .tq-block.t1 { background: #d98b4a; } .tq-block.t2 { background: #dfe6ee; } .tq-block.t3 { background: #ffd23f; box-shadow: 0 0 10px #ffd23f; }
.tq-block.new { background: #2a2d48; color: #59627a; }
.tq-block.rusty::after { content: ''; position: absolute; inset: 0; border-radius: 3px; background: repeating-linear-gradient(45deg, rgba(139,69,19,.55) 0 6px, transparent 6px 14px); }
.tq-note { font-size: 15px; color: #aab3c5; margin-top: 14px; font-weight: 600; }
.tq-plates.four { gap: 2cqw; } .tq-plates.four .tq-plate { flex-basis: 21cqw; padding: 0 1cqw; font-size: 6cqw; }
.tq-plates.four.long .tq-plate { font-size: 4.8cqw; }
.tq-sentence { background: #f4f1e8; color: #1d2433; border: .7cqw solid #1d2433; border-radius: 2cqw; padding: 1cqw 3cqw; font: 700 5.5cqw 'Andika', 'Outfit', sans-serif; display: flex; align-items: center; gap: 2cqw; }
.tq-sentence .gap { display: inline-block; min-width: 14cqw; border-bottom: .8cqw solid #e8402f; margin: 0 1cqw; }
.tq-fuse { position: absolute; left: 20%; right: 20%; top: 12.5cqw; height: 1.6cqw; border-radius: 1cqw; background: rgba(0,0,0,.4); overflow: hidden; }
.tq-fuse[hidden] { display: none; }
.tq-fuse span { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #ff5d5d, #ffd23f); transform-origin: left; }
.tq-bosshp { display: flex; align-items: center; gap: .6cqw; font-size: 3cqw; }
.tq-bosshp i { width: 2cqw; height: 3cqw; background: #6c3fb5; border: .3cqw solid #1d2433; border-radius: .4cqw; }
.tq-bosshp i.gone { background: rgba(255,255,255,.15); }
.tq-world { border-radius: 18px; padding: 14px 16px 18px; margin-bottom: 16px; border: 4px solid rgba(255,255,255,.12); }
.tq-world.locked { opacity: .55; }
.tq-world h2 { margin: 0 0 10px; color: #fff; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.tq-world h2 small { font-size: 15px; font-weight: 600; color: #e9edf5; opacity: .85; }
.tq-world .tq-levels { gap: 10px; margin-bottom: 6px; }
.tq-world .tq-level { width: 96px; min-height: 92px; font-size: 18px; }
.tq-world .tq-level span:last-child { font-size: 15px; }
.tq-world .tq-level.boss { width: 132px; background: #3b2170; box-shadow: 0 6px 0 #1c112e; }
.tq-world .tq-level.boss[disabled] { background: #2a2d48; }
.tq-world .tq-path { font-size: 20px; }
.tq-door { font-size: 15px; font-weight: 700; color: #e9edf5; margin: 6px 0 0; }
.tq-door b { color: #ffd23f; }
.tq-w-scrap { background: linear-gradient(120deg, #2b3a67, #8d4a2a); } .tq-w-rain { background: linear-gradient(120deg, #3d4650, #5f7d95); }
.tq-w-park { background: linear-gradient(120deg, #0b1026, #1f3a24); } .tq-w-port { background: linear-gradient(120deg, #1f6f8b, #52524f); }
.tq-w-storm { background: linear-gradient(120deg, #1a0f2e, #5d318a); }
.tq-learn { font: 700 14cqw 'Andika', 'Outfit', sans-serif; color: #fff; }
.tq-plate.hint { box-shadow: 0 0 0 1cqw #ffd23f, 0 1.2cqw 0 #8d8a80; }
.tq-turn { display: none; }
@media (orientation: portrait) { .tq-turn { display: block; } }
@media (prefers-reduced-motion: reduce) { .tq-plate, .tq-hearts span { transition: none; } }
`;

function ensureStyles() {
    if (document.getElementById('tq-styles')) return;
    const style = document.createElement('style');
    style.id = 'tq-styles';
    style.textContent = CSS;
    document.head.appendChild(style);
}

const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

// opts (tests): lockMs, flashMs, feedbackMs, autoJump, rng, now, autoStart
export function initTorchQuest(container, words, onBack, opts = {}) {
    ensureStyles();
    const lockMs = opts.lockMs ?? 800;
    const flashMs = opts.flashMs ?? 1500;
    const feedbackMs = opts.feedbackMs ?? 1400;
    const rng = opts.rng || Math.random;
    const now = opts.now || (() => Date.now());
    const state = loadState();
    const timers = new Set();
    let alive = true;
    let game = null;
    let keyHandler = null;

    const later = (fn, ms) => {
        const id = setTimeout(() => { timers.delete(id); if (alive) fn(); }, ms);
        timers.add(id);
    };
    const stopLevel = () => { timers.forEach(clearTimeout); timers.clear(); game?.stop(); game = null; keyHandler = null; };
    const onKey = e => { if (alive && keyHandler) keyHandler(e); };
    document.addEventListener('keydown', onKey);
    function leave() {
        stopLevel();
        alive = false;
        document.removeEventListener('keydown', onKey);
        try { window.speechSynthesis?.cancel(); } catch (e) { /* ignore */ }
        onBack();
    }

    // ---------- Map ----------

    function blockHTML(item) {
        const met = !!state.items[item.id];
        const it = itemState(state, item.id);
        return `<div class="tq-block ${met ? `t${it.tier}` : 'new'} ${isRusty(state, item.id, now()) ? 'rusty' : ''}">
            ${met ? item.word : '?'}<small>${met ? `${TIERS[it.tier]}${inForge(state, item.id, now()) ? ' · in the forge' : ` ${'●'.repeat(it.ticks)}${'○'.repeat(TICKS_TO_PROMOTE - it.ticks)}`}` : '&nbsp;'}</small>
        </div>`;
    }

    function worldHTML(world, wi) {
        if (!isWorldUnlocked(wi, state)) {
            return `<section class="tq-world locked tq-w-${world.theme}"><h2>🔒 World ${wi + 1} · ${world.name} <small>Beat ${WORLDS[wi - 1].boss.name} to open</small></h2></section>`;
        }
        const door = bossDoor(state, wi);
        const stages = LEVELS.map((l, i) => ({ l, i })).filter(({ l }) => l.worldIndex === wi);
        return `<section class="tq-world tq-w-${world.theme}" data-world="${wi}">
            <h2>${world.emoji} World ${wi + 1} · ${world.name} <small>⭐ ${worldStars(state, wi)}</small></h2>
            <div class="tq-levels">
                ${stages.map(({ l, i }, k) => {
                    const open = isLevelUnlocked(i, state);
                    const stars = state.levels[l.id]?.stars || 0;
                    const label = l.boss ? `👾 ${l.name}` : l.name.replace('Level ', '');
                    return `${k ? '<span class="tq-path">➜</span>' : ''}
                    <button class="tq-level ${l.boss ? 'boss' : ''}" data-level="${i}" ${open ? '' : 'disabled'} aria-label="${l.boss ? `Boss ${l.name}` : l.name}${open ? `, ${stars} stars` : ', locked'}">
                        ${open ? `<span>${label}</span><span>${starText(stars)}</span>` : l.boss ? `<span>🔒 ${l.name}</span>` : `<span>🔒</span><small>${l.needStars} ⭐</small>`}
                    </button>`;
                }).join('')}
            </div>
            ${door.open || (state.levels[LEVELS[stages.at(-1).i].id]?.stars) ? '' : `<p class="tq-door">Boss door: finish all 5 levels (${door.levelsDone}/5) · <b>${door.stars}/${door.needStars} ⭐</b> · <b>${Math.min(door.blocks, door.needBlocks)}/${door.needBlocks} ${TIER_EMOJI[door.tier]} ${TIERS[door.tier]} blocks</b></p>`}
        </section>`;
    }

    function showMap() {
        stopLevel();
        const openWorlds = WORLDS.map((w, i) => i).filter(i => isWorldUnlocked(i, state));
        container.innerHTML = `
            <div class="tq-root"><div class="tq-map">
                <div class="tq-top">
                    <button class="tq-btn alt" id="tq-back">← Back</button>
                    <span class="tq-tally" aria-label="${totalStars(state)} stars, ${state.bolts || 0} bolts">⭐ ${totalStars(state)} &nbsp; 🔩 ${state.bolts || 0}</span>
                </div>
                <h1>Torch Quest</h1>
                ${WORLDS.map(worldHTML).join('')}
                <h2>My word blocks</h2>
                ${openWorlds.map(wi => `<div class="tq-wall" style="margin-bottom: 10px">${worldItems(wi).map(blockHTML).join('')}</div>`).join('')}
                <p class="tq-note">Grown-ups: a block goes up one step after 3 right answers, and only once a day. Each boss door needs blocks at a certain step, so the later worlds take several days of short play. Progress is saved in this browser on this device.</p>
                <p class="tq-note tq-turn">↻ Turn the phone sideways for a bigger game.</p>
            </div></div>`;
        container.querySelector('#tq-back').addEventListener('click', leave);
        container.querySelectorAll('.tq-level:not([disabled])').forEach(b =>
            b.addEventListener('click', () => showIntro(Number(b.dataset.level))));
        // Start at the newest open world.
        const newest = container.querySelector(`[data-world="${openWorlds.at(-1)}"]`);
        if (openWorlds.length > 1) newest?.scrollIntoView?.({ block: 'start' });
    }

    // ---------- Level intro: meet the new words (teaching happens outside the test) ----------

    function showIntro(levelIndex) {
        stopLevel();
        const level = LEVELS[levelIndex];
        container.innerHTML = `
            <div class="tq-root"><div class="tq-stage"><div class="tq-overlay">
                <h2>${level.boss ? `👾 Boss: ${level.name}` : `World ${level.worldIndex + 1} · ${level.name}`}</h2>
                <p>${level.boss ? `${level.name} drops scrap balls. Pick the right word to zap each one back! Be quick: the fuse is burning.` : 'Words on this run. Tap one to hear it.'}</p>
                <div class="tq-row">${level.items.map(i => `<button class="tq-word" data-word="${i.word}">${i.word}</button>`).join('')}</div>
                <div class="tq-row"><button class="tq-btn alt" id="tq-map">Map</button><button class="tq-btn" id="tq-go">Go! ▶</button></div>
            </div></div></div>`;
        container.querySelectorAll('.tq-word').forEach(b => b.addEventListener('click', () => say(b.dataset.word)));
        container.querySelector('#tq-map').addEventListener('click', showMap);
        container.querySelector('#tq-go').addEventListener('click', () => startLevel(levelIndex));
    }

    // ---------- Training Bay: calm practice of the words that beat him, no hearts ----------

    function showTraining(levelIndex, missed) {
        stopLevel();
        let k = 0;
        container.innerHTML = `<div class="tq-root"><div class="tq-stage"><div class="tq-overlay" id="tq-bay"></div></div></div>`;
        const bay = container.querySelector('#tq-bay');
        const step = () => {
            if (k >= missed.length) {
                bay.innerHTML = `<h2>🛠️ Training done!</h2><p>Torch is fixed up. Ready?</p>
                    <div class="tq-row"><button class="tq-btn alt" id="tq-map">Map</button><button class="tq-btn" id="tq-go">Back to the level ▶</button></div>`;
                bay.querySelector('#tq-map').addEventListener('click', showMap);
                bay.querySelector('#tq-go').addEventListener('click', () => startLevel(levelIndex));
                return;
            }
            const word = missed[k];
            // 1. Look and listen.
            bay.innerHTML = `<h2>🛠️ Training Bay</h2><div class="tq-learn">${word}</div>
                <div class="tq-row"><button class="tq-btn alt" id="tq-hear">🔊 Hear it</button><button class="tq-btn" id="tq-ready">I've got it ▶</button></div>`;
            say(word);
            bay.querySelector('#tq-hear').addEventListener('click', () => say(word));
            bay.querySelector('#tq-ready').addEventListener('click', () => {
                // 2. Find it, with help: a wrong tap says its own word and the right one glows.
                const plates = [...unlikeWords(word, 2, rng)];
                const at = Math.floor(rng() * 3);
                plates.splice(at, 0, word);
                bay.innerHTML = `<h2>Find “${word}”</h2><button class="tq-speak" aria-label="Say the word again">🔊</button>
                    <div class="tq-plates">${plates.map((w, i) => `<button class="tq-plate" data-i="${i}">${w}</button>`).join('')}</div>`;
                bay.querySelector('.tq-speak').addEventListener('click', () => say(word));
                say(word);
                bay.querySelectorAll('.tq-plate').forEach(b => b.addEventListener('click', () => {
                    const i = Number(b.dataset.i);
                    if (i !== at) {
                        sfx.boing(); say(plates[i]); b.disabled = true; b.style.opacity = '.4';
                        bay.querySelectorAll('.tq-plate')[at].classList.add('hint');
                        return;
                    }
                    b.classList.add('right'); sfx.lock(); say(word);
                    k++;
                    later(step, opts.feedbackMs ?? 900);
                }));
            });
        };
        step();
    }

    // ---------- Level ----------

    function startLevel(levelIndex) {
        stopLevel();
        const level = LEVELS[levelIndex];
        const run = createRun({ levelIndex, state, rng, now });
        const guard = createTapGuard();
        const course = buildCourse(opts.seed ?? Math.floor(rng() * 1e9), run.total, run.checkpoint ? CHECKPOINT_AFTER : -1, level.world.obstacles);
        const bossMs = opts.bossMs ?? (level.boss ? level.world.boss.seconds * 1000 : 0);

        container.innerHTML = `
            <div class="tq-root"><div class="tq-stage">
                <canvas class="tq-canvas" width="${VIEW.w}" height="${VIEW.h}" aria-label="Torch runs through ${level.world.name}. Tap to jump."></canvas>
                <div class="tq-hud">
                    <button class="tq-x" aria-label="Back to the map">✕</button>
                    <div class="tq-hearts" role="img"></div>
                    <div class="tq-pips" aria-hidden="true"></div>
                    ${level.boss ? '<div class="tq-bosshp" role="img"></div>' : ''}
                    <div class="tq-bolts">🔩 0</div>
                </div>
                <div class="tq-fuse" hidden><span></span></div>
                <div class="tq-gate" hidden><div class="tq-prompt"></div><div class="tq-plates"></div><div class="tq-msg" aria-live="polite"></div></div>
                <div class="tq-overlay" hidden></div>
            </div></div>`;
        const $ = sel => container.querySelector(sel);
        const stage = $('.tq-stage'), gateEl = $('.tq-gate'), overlay = $('.tq-overlay');
        let locked = true, answered = true, lockedTaps = 0, unlockAt = 0;

        function hud() {
            $('.tq-hearts').innerHTML = Array.from({ length: MAX_HEARTS }, (_, i) => `<span class="${i < run.hearts ? '' : 'lost'}">❤️</span>`).join('');
            $('.tq-hearts').setAttribute('aria-label', `${run.hearts} hearts`);
            $('.tq-pips').innerHTML = Array.from({ length: run.total }, (_, i) =>
                `<span class="tq-pip ${run.results[i] === true ? 'ok' : run.results[i] === false ? 'no' : i === run.gateIndex ? 'now' : ''}"></span>${run.checkpoint && i === CHECKPOINT_AFTER - 1 ? '<span class="tq-pipflag">🚩</span>' : ''}`).join('') + '<span class="tq-pipflag">🏁</span>';
            $('.tq-bolts').textContent = `🔩 ${game ? game.bolts : 0}`;
            if (level.boss && game) {
                $('.tq-bosshp').innerHTML = `👾 ${Array.from({ length: run.total }, (_, i) => `<i class="${i < game.bossHp ? '' : 'gone'}"></i>`).join('')}`;
                $('.tq-bosshp').setAttribute('aria-label', `${level.name}: ${game.bossHp} hits left`);
            }
        }

        game = createGame({
            course,
            canvas: $('.tq-canvas'),
            autoJump: !!opts.autoJump,
            theme: level.world.theme,
            boss: level.boss ? { hp: run.total } : null,
            hooks: {
                onJump: () => sfx.jump(),
                onBolt: () => { sfx.coin(); hud(); },
                onBump: () => { sfx.boing(); hud(); },
                onGate: showGate,
                onFinish: showFinish
            }
        });

        function showGate() {
            const gate = run.currentGate();
            locked = true; answered = false; lockedTaps = 0;
            gateEl.hidden = false;
            $('.tq-msg').textContent = '';
            $('.tq-plates').innerHTML = gate.plates.map((w, i) => `<button class="tq-plate locked" data-i="${i}">${w}</button>`).join('');
            $('.tq-plates').classList.toggle('four', gate.plates.length > 3);
            $('.tq-plates').classList.toggle('long', Math.max(...gate.plates.map(w => w.length)) >= 6);
            $('.tq-plates').querySelectorAll('.tq-plate').forEach(b => b.addEventListener('click', () => choose(Number(b.dataset.i))));
            const unlock = () => {
                locked = false;
                unlockAt = now();
                $('.tq-plates').querySelectorAll('.tq-plate').forEach(b => b.classList.remove('locked'));
                startFuse();
            };
            if (gate.mode === 'flash') {
                // Look, cover, find: the word shows, then hides, then the plates unlock.
                $('.tq-prompt').innerHTML = `<div class="tq-flash">${gate.word}</div>`;
                later(() => { $('.tq-prompt').innerHTML = '<div class="tq-flash" aria-label="hidden">？</div>'; unlock(); }, flashMs);
            } else if (gate.mode === 'sentence') {
                // Read it cold: no voice. He reads the sentence and finds the word that fits.
                const [a, b] = gate.clue.split('___');
                $('.tq-prompt').innerHTML = `<div class="tq-sentence"><span>${gate.item.emoji || ''}</span><span>${a}<span class="gap" aria-label="gap"></span>${b}</span></div>`;
                later(unlock, Math.max(lockMs, opts.sentenceLockMs ?? 1500));
            } else {
                $('.tq-prompt').innerHTML = '<button class="tq-speak" aria-label="Say the word again">🔊</button>';
                $('.tq-speak').addEventListener('click', () => say(gate.word));
                say(gate.word);
                later(unlock, lockMs);
            }
        }

        // Boss gates only: a fuse that burns down once the plates unlock. Gentle, but real.
        let fuseTimer = null;
        function startFuse() {
            if (!bossMs) return;
            const fuse = $('.tq-fuse');
            fuse.hidden = false;
            const bar = fuse.querySelector('span');
            bar.style.transition = 'none';
            bar.style.transform = 'scaleX(1)';
            void bar.offsetWidth;
            bar.style.transition = `transform ${bossMs}ms linear`;
            bar.style.transform = 'scaleX(0)';
            const myGate = run.gateIndex;
            fuseTimer = myGate;
            later(() => { if (fuseTimer === myGate && !answered) choose(-1); }, bossMs);
        }

        function choose(index) {
            if (answered) return;
            if (locked) { lockedTaps++; return; } // taps while the word is being said are dropped
            answered = true;
            fuseTimer = null;
            $('.tq-fuse').hidden = true;
            const overheat = guard.check(lockedTaps, now() - unlockAt);
            const res = run.answer(index);
            saveState(state);
            const plates = [...$('.tq-plates').querySelectorAll('.tq-plate')];
            if (res.correct) {
                plates[index].classList.add('right');
                sfx.lock();
                if (level.boss) { game.hitBoss(); sfx.zap(); }
                $('.tq-msg').textContent = res.healed ? '❤️ Heart repaired!' : res.promoted ? `New block: ${res.word} is ${TIERS[res.tier]}!` : '';
                if (res.healed || res.promoted) sfx.powerUp();
            } else {
                plates[index]?.classList.add('wrong');
                plates[res.correctIndex].classList.add('reveal');
                sfx.thud();
                $('.tq-msg').textContent = index < 0 ? `Too slow! It was “${res.word}”.` : `This one is “${res.word}”.`;
                say(res.word);
            }
            hud();
            const next = () => {
                if (res.down) return showDown();
                gateEl.hidden = true;
                game.openGate();
                hud();
            };
            later(() => {
                if (!overheat) return next();
                // Hammering: Torch overheats. It costs time, not a heart.
                $('.tq-plates').innerHTML = '';
                $('.tq-prompt').innerHTML = '<div class="tq-flash">♨️</div>';
                $('.tq-msg').textContent = 'Too fast! Slow down and look.';
                say('Slow down. Look.');
                later(next, opts.overheatMs ?? 2500);
            }, res.correct ? Math.min(feedbackMs, 700) : feedbackMs);
        }

        function showDown() {
            gateEl.hidden = true;
            $('.tq-fuse').hidden = true;
            sfx.powerDown();
            const canContinue = run.canContinue();
            // A second power-down on the same level opens the Training Bay (design §7).
            const fails = (state.levels[level.id]?.fails || 0) + 1;
            const train = !canContinue && fails >= 2 && run.missed.length > 0;
            overlay.hidden = false;
            overlay.innerHTML = `
                <h2>Torch powered down!</h2>
                <p>These words tripped him up. Tap to hear them.</p>
                <div class="tq-row">${run.missed.map(w => `<button class="tq-word" data-word="${w}">${w}</button>`).join('')}</div>
                <div class="tq-row">
                    <button class="tq-btn alt" id="tq-map">Map</button>
                    ${canContinue ? '<button class="tq-btn" id="tq-flag">🚩 Back to the flag</button>'
                        : train ? '<button class="tq-btn alt" id="tq-again">↻ Start again</button><button class="tq-btn" id="tq-train">🛠️ Training Bay</button>'
                        : '<button class="tq-btn" id="tq-again">↻ Start again</button>'}
                </div>`;
            const failed = () => { failLevel(state, level.id); saveState(state); };
            overlay.querySelectorAll('.tq-word').forEach(b => b.addEventListener('click', () => say(b.dataset.word)));
            overlay.querySelector('#tq-map').addEventListener('click', () => { failed(); showMap(); });
            overlay.querySelector('#tq-again')?.addEventListener('click', () => { failed(); startLevel(levelIndex); });
            overlay.querySelector('#tq-train')?.addEventListener('click', () => { failed(); showTraining(levelIndex, run.missed.slice(0, 3)); });
            overlay.querySelector('#tq-flag')?.addEventListener('click', () => {
                run.continueFromCheckpoint();
                overlay.hidden = true;
                game.toCheckpoint(CHECKPOINT_AFTER);
                hud();
            });
        }

        function showFinish() {
            game.stop();
            finishLevel(state, level.id, run.stars, game.bolts);
            saveState(state);
            sfx.fanfare();
            const forge = [...new Set(level.items.filter(i => inForge(state, i.id, now())).map(i => i.word))];
            const nextOpen = levelIndex + 1 < LEVELS.length && isLevelUnlocked(levelIndex + 1, state);
            overlay.hidden = false;
            const door = !nextOpen && levelIndex + 1 < LEVELS.length && LEVELS[levelIndex + 1].boss ? bossDoor(state, level.worldIndex) : null;
            overlay.innerHTML = `
                <h2>${level.boss ? `${level.name} flew off, covered in oil!` : 'You made it!'}</h2>
                ${level.boss && levelIndex + 1 < LEVELS.length ? `<p>🗺️ World ${level.worldIndex + 2} · ${LEVELS[levelIndex + 1].world.name} is open!</p>` : ''}
                ${level.boss && levelIndex + 1 >= LEVELS.length ? '<p>🏆 Darkstorm is beaten. You finished Torch Quest!</p>' : ''}
                ${door ? `<p>Boss door: ${door.levelsDone}/5 levels · ${door.stars}/${door.needStars} ⭐ · ${Math.min(door.blocks, door.needBlocks)}/${door.needBlocks} ${TIERS[door.tier]} blocks</p>` : ''}
                <div class="tq-stars" aria-label="${run.stars} stars">${starText(run.stars)}</div>
                <p>🔩 ${game.bolts} bolts${run.usedCheckpoint ? ' · No flag restart next time for more stars!' : run.stars < 3 ? ' · Keep all 3 hearts for 3 stars!' : ''}</p>
                ${run.promoted.length ? `<p>New blocks: ${run.promoted.map(p => `<b>${p.word}</b> → ${TIERS[p.tier]}`).join(', ')}</p>` : ''}
                ${forge.length ? `<p>In the forge until tomorrow: ${forge.join(', ')}</p>` : ''}
                <div class="tq-row">
                    <button class="tq-btn alt" id="tq-map">Map</button>
                    <button class="tq-btn alt" id="tq-again">↻ Again</button>
                    ${nextOpen ? '<button class="tq-btn" id="tq-next">Next level ▶</button>' : ''}
                </div>`;
            overlay.querySelector('#tq-map').addEventListener('click', showMap);
            overlay.querySelector('#tq-again').addEventListener('click', () => showIntro(levelIndex));
            overlay.querySelector('#tq-next')?.addEventListener('click', () => showIntro(levelIndex + 1));
        }

        $('.tq-x').addEventListener('click', showMap);
        stage.addEventListener('pointerdown', e => { if (!e.target.closest('button')) game?.jump(); });
        keyHandler = e => {
            if (e.key === ' ' || e.key === 'ArrowUp') { if (game?.mode === 'run') { e.preventDefault(); game.jump(); } }
            else if (/^[1-3]$/.test(e.key) && !gateEl.hidden) choose(Number(e.key) - 1);
        };
        hud();
        game.render();
        if (opts.autoStart !== false) game.start();
        return { game, run };
    }

    showMap();
    return { startLevel, showMap, state };
}
