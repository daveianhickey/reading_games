// Engagement layer shared by the Year 1 games: speech, sound effects, game shell,
// hints, particles, rewards and the sticker collection.
import { label } from './curriculum.js';

// ---------- Environment helpers ----------

export function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

// Web Animations wrapper that resolves even where animate() is unsupported (tests, old browsers).
export function animate(el, keyframes, options) {
    if (!el || typeof el.animate !== 'function') return Promise.resolve();
    const opts = typeof options === 'number' ? { duration: options } : { ...options };
    if (reducedMotion()) opts.duration = Math.min(opts.duration || 0, 150);
    try {
        const anim = el.animate(keyframes, { fill: 'forwards', ...opts });
        return anim.finished.catch(() => {});
    } catch (e) {
        return Promise.resolve();
    }
}

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// ---------- Speech (audio-first) ----------

let voice = null;
function chooseVoice() {
    try {
        const voices = window.speechSynthesis.getVoices();
        voice = voices.find(v => /en[-_]GB/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || null;
    } catch (e) { voice = null; }
}
try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        chooseVoice();
        window.speechSynthesis.addEventListener?.('voiceschanged', chooseVoice);
    }
} catch (e) { /* no speech */ }

export function say(text, { rate = 0.85 } = {}) {
    try {
        if (!text || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        if (!voice) chooseVoice();
        if (voice) u.voice = voice;
        u.lang = voice ? voice.lang : 'en-GB';
        u.rate = rate;
        u.pitch = 1.1;
        window.speechSynthesis.speak(u);
    } catch (e) { /* speech unavailable */ }
}

// What to say for an item: its recorded clip, else its catchphrase / example / word.
export function spokenText(item, { withClue = false } = {}) {
    if (item.say) return item.say;
    if (item.kind === 'gpc') return item.phrase || item.example || item.grapheme;
    if (withClue && item.clue) return `${item.word}. ${item.clue.replace('___', item.word)}`;
    return item.word;
}

export function sayItem(item, opts) {
    if (item.audio) {
        try {
            const clip = new Audio(item.audio);
            clip.play().catch(() => say(spokenText(item, opts)));
            return;
        } catch (e) { /* fall through to speech */ }
    }
    say(spokenText(item, opts));
}

// ---------- Sound effects (Web Audio, no files needed) ----------

let audioCtx = null;
function ctx() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    } catch (e) { return null; }
}

function tone(freq, duration, { type = 'sine', volume = 0.25, slideTo = null, delay = 0 } = {}) {
    const ac = ctx();
    if (!ac) return;
    try {
        const t = ac.currentTime + delay;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t);
        osc.stop(t + duration + 0.05);
    } catch (e) { /* ignore */ }
}

function noise(duration, { volume = 0.3, delay = 0, lowpass = 1200 } = {}) {
    const ac = ctx();
    if (!ac) return;
    try {
        const t = ac.currentTime + delay;
        const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * duration), ac.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = ac.createBufferSource();
        src.buffer = buffer;
        const filter = ac.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = lowpass;
        const gain = ac.createGain();
        gain.gain.value = volume;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);
        src.start(t);
    } catch (e) { /* ignore */ }
}

export const sfx = {
    flip: () => tone(700, 0.08, { type: 'triangle', volume: 0.15 }),
    clink: () => { tone(1800, 0.08, { type: 'square', volume: 0.12 }); tone(2400, 0.12, { type: 'square', volume: 0.1, delay: 0.07 }); },
    lock: () => { noise(0.06, { volume: 0.4, lowpass: 4000 }); tone(180, 0.15, { type: 'square', volume: 0.2, delay: 0.03 }); tone(1400, 0.1, { type: 'triangle', volume: 0.12, delay: 0.1 }); },
    // Gentle "try again" sound: soft and bouncy, never harsh.
    boing: () => { tone(320, 0.12, { type: 'sine', volume: 0.2, slideTo: 180 }); tone(260, 0.18, { type: 'sine', volume: 0.15, slideTo: 330, delay: 0.12 }); },
    zap: () => { tone(1200, 0.25, { type: 'sawtooth', volume: 0.12, slideTo: 90 }); noise(0.25, { volume: 0.3, lowpass: 3000 }); },
    spark: () => { noise(0.15, { volume: 0.25, lowpass: 6000 }); tone(2600, 0.05, { type: 'square', volume: 0.08, delay: 0.05 }); },
    slam: () => { tone(90, 0.35, { type: 'triangle', volume: 0.5, slideTo: 40 }); noise(0.3, { volume: 0.5, lowpass: 500 }); },
    whoosh: () => noise(0.8, { volume: 0.35, lowpass: 900 }),
    tick: () => tone(880, 0.1, { type: 'square', volume: 0.12 }),
    roar: () => { tone(110, 0.8, { type: 'sawtooth', volume: 0.2, slideTo: 70 }); noise(0.8, { volume: 0.25, lowpass: 700 }); },
    powerUp: () => [0, 1, 2, 3, 4].forEach(i => tone(300 + i * 150, 0.12, { type: 'square', volume: 0.1, delay: i * 0.06 })),
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.5 : 0.18, { type: 'triangle', volume: 0.2, delay: i * 0.15 }))
};

// ---------- Visual helpers ----------

export function wiggle(el) {
    if (!el) return;
    el.classList.remove('y1-wiggle');
    void el.offsetWidth;
    el.classList.add('y1-wiggle');
    setTimeout(() => el.classList.remove('y1-wiggle'), 600);
}

export function burst(x, y, { colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#fff'], count = 18, spread = 140, size = 10, chars = null } = {}) {
    if (reducedMotion()) count = Math.min(count, 6);
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'y1-particle';
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        if (chars) {
            p.textContent = pick(chars);
            p.style.fontSize = `${size * 2}px`;
        } else {
            p.style.width = p.style.height = `${size}px`;
            p.style.background = pick(colors);
        }
        document.body.appendChild(p);
        const angle = Math.random() * Math.PI * 2;
        const dist = spread * (0.4 + Math.random() * 0.6);
        animate(p, [
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0.3)`, opacity: 0 }
        ], { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' }).then(() => p.remove());
        setTimeout(() => p.remove(), 1500);
    }
}

export function burstAt(el, opts) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, opts);
}

// Pointer drag with tap fallback. `onSelect` fires on tap/click/Enter, or when dropped on `dropTarget`.
// Pass `onTap` to make a pointer tap do something else (e.g. say the word) so that only a drag chooses;
// keyboard activation (Enter/Space) still calls `onSelect` so the game stays keyboard-playable.
export function makeDraggable(el, { dropTarget, onSelect, onTap }) {
    let start = null;
    let dragging = false;
    let justDragged = false;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', e => {
        start = { x: e.clientX, y: e.clientY };
        dragging = false;
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    el.addEventListener('pointermove', e => {
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (!dragging && Math.hypot(dx, dy) > 12) {
            dragging = true;
            el.classList.add('y1-dragging');
        }
        if (dragging) el.style.translate = `${dx}px ${dy}px`;
    });
    const finish = e => {
        if (!start) return;
        if (dragging) {
            justDragged = true;
            el.classList.remove('y1-dragging');
            el.style.translate = '';
            const r = dropTarget.getBoundingClientRect();
            const pad = 40;
            if (e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad) onSelect();
        }
        start = null;
        dragging = false;
    };
    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', () => {
        start = null;
        dragging = false;
        el.classList.remove('y1-dragging');
        el.style.translate = '';
    });
    el.addEventListener('click', e => {
        if (justDragged) { justDragged = false; return; }
        if (onTap && e.detail > 0) onTap(); else onSelect();
    });
}

// ---------- Sticker collection (variable-ratio bonus reward) ----------

const STICKERS = ['🦾', '🛸', '🪐', '🤖', '🚀', '🌟', '🛰️', '⚙️', '🔋', '🏋️', '🦿', '☄️', '🌙', '🔧', '🧲', '👾', '🏆', '🌈'];
const STICKER_KEY = 'y1Stickers';
const DRY_KEY = 'y1RoundsWithoutSticker';

function store(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; }
}
function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}

export function getStickers() {
    return store(STICKER_KEY, []);
}

// Roughly 1 in 3 rounds unlocks a sticker, guaranteed after 3 dry rounds.
// `force` guarantees one (used to reward careful play, e.g. Orbit Defender's first-try bonus).
function maybeUnlockSticker(force = false) {
    const owned = getStickers();
    const missing = STICKERS.filter(s => !owned.includes(s));
    const dry = store(DRY_KEY, 0);
    if (!missing.length || (!force && Math.random() > 0.35 && dry < 3)) {
        save(DRY_KEY, dry + 1);
        return null;
    }
    const sticker = pick(missing);
    save(STICKER_KEY, [...owned, sticker]);
    save(DRY_KEY, 0);
    return sticker;
}

// ---------- Game shell ----------

const PRAISE = ['Amazing!', 'Super star!', 'Brilliant!', 'You did it!', 'Awesome!', 'Fantastic!'];

export function createShell(container, { theme = 'space', title, goal, onBack, onSpeak, practising = [], usingDefaults = false }) {
    ensureStyles();
    const timers = new Set();
    const frames = new Set();
    let hintTimer = null;
    let hintFn = null;

    container.innerHTML = `
        <div class="y1-game y1-theme-${theme}">
            <div class="y1-topbar">
                <button class="y1-round-btn y1-back" aria-label="Back to games">←</button>
                <div class="y1-title">${title}</div>
                <div class="y1-pips" aria-label="Progress">${Array.from({ length: goal }, () => '<span class="y1-pip"></span>').join('')}</div>
                <button class="y1-round-btn y1-speak" aria-label="Hear it again">🔊</button>
            </div>
            <div class="y1-prompt" aria-live="polite"></div>
            <div class="y1-stage"></div>
            <div class="y1-practising">${usingDefaults ? 'Starter set: ' : 'Practising: '}${[...new Set(practising.map(label))].join(' · ')}</div>
        </div>`;

    const root = container.querySelector('.y1-game');
    const shell = {
        root,
        alive: true,
        prompt: root.querySelector('.y1-prompt'),
        stage: root.querySelector('.y1-stage'),
        pips: [...root.querySelectorAll('.y1-pip')],
        later(fn, ms) {
            const id = setTimeout(() => { timers.delete(id); if (shell.alive) fn(); }, ms);
            timers.add(id);
            return id;
        },
        wait(ms) {
            return new Promise(resolve => shell.later(resolve, ms));
        },
        loop(fn) {
            let last = null;
            const step = t => {
                if (!shell.alive) return;
                const dt = last === null ? 0 : Math.min(0.05, (t - last) / 1000);
                last = t;
                if (fn(dt) === false) return;
                const id = requestAnimationFrame(step);
                frames.add(id);
            };
            frames.add(requestAnimationFrame(step));
        },
        setProgress(n) {
            shell.pips.forEach((p, i) => {
                const on = i < n;
                if (on && !p.classList.contains('on')) animate(p, [{ transform: 'scale(1.8)' }, { transform: 'scale(1)' }], 350);
                p.classList.toggle('on', on);
            });
        },
        // Errorless scaffolding: run `fn` (e.g. glow the right answer) after a pause without interaction.
        setHint(fn, ms = 9000) {
            hintFn = fn;
            restartHint(ms);
        },
        clearHint() {
            hintFn = null;
            clearTimeout(hintTimer);
        },
        dispose() {
            shell.alive = false;
            timers.forEach(clearTimeout);
            frames.forEach(id => cancelAnimationFrame(id));
            clearTimeout(hintTimer);
            try { window.speechSynthesis?.cancel(); } catch (e) { /* ignore */ }
            document.removeEventListener('keydown', onKey);
            shell.onKey = null;
        },
        onKey: null,
        // End-of-round overlay with "Again" and "Games" buttons, plus the occasional sticker unlock.
        showReward({ emoji = '🏆', title: rewardTitle = pick(PRAISE), subtitle = '', forceSticker = false, onAgain }) {
            shell.clearHint();
            sfx.fanfare();
            say(rewardTitle);
            const sticker = maybeUnlockSticker(forceSticker);
            const overlay = document.createElement('div');
            overlay.className = 'y1-reward';
            overlay.innerHTML = `
                <div class="y1-reward-card">
                    <div class="y1-reward-emoji">${emoji}</div>
                    <h2>${rewardTitle}</h2>
                    ${subtitle ? `<div class="y1-reward-sub">${subtitle}</div>` : ''}
                    ${sticker ? `<div class="y1-sticker-unlock">New sticker! <span>${sticker}</span></div>` : ''}
                    <div class="y1-reward-buttons">
                        <button class="btn y1-again">Again! ▶</button>
                        <button class="btn btn-secondary y1-home">Games 🏠</button>
                    </div>
                </div>`;
            root.appendChild(overlay);
            if (sticker) shell.later(() => burstAt(overlay.querySelector('.y1-sticker-unlock span'), { chars: ['⭐', '✨'], count: 12 }), 400);
            overlay.querySelector('.y1-again').addEventListener('click', () => { shell.dispose(); onAgain(); });
            overlay.querySelector('.y1-home').addEventListener('click', () => { shell.dispose(); onBack(); });
            overlay.querySelector('.y1-again').focus();
        }
    };

    function restartHint(ms = 9000) {
        clearTimeout(hintTimer);
        if (!hintFn) return;
        hintTimer = setTimeout(() => { if (shell.alive && hintFn) hintFn(); }, ms);
    }
    root.addEventListener('pointerdown', () => restartHint());

    function onKey(e) {
        if (!shell.alive) return;
        restartHint();
        if (shell.onKey) shell.onKey(e);
    }
    document.addEventListener('keydown', onKey);

    root.querySelector('.y1-back').addEventListener('click', () => { shell.dispose(); onBack(); });
    root.querySelector('.y1-speak').addEventListener('click', () => onSpeak && onSpeak());
    return shell;
}

// Glow an element as a hint (errorless learning).
export function glow(el) {
    if (!el) return;
    el.classList.add('y1-hint');
    setTimeout(() => el.classList.remove('y1-hint'), 2600);
}

// ---------- Shared styles ----------

function ensureStyles() {
    if (document.getElementById('y1-styles')) return;
    const style = document.createElement('style');
    style.id = 'y1-styles';
    style.textContent = `
        .y1-game { position: relative; display: flex; flex-direction: column; gap: 0.8rem; min-height: calc(100vh - 4rem); border-radius: 28px; padding: 0.8rem; overflow: hidden; }
        .y1-theme-space { background: radial-gradient(ellipse at top, #1b2a6b 0%, #0b1033 60%, #05061a 100%); color: #fff; }
        .y1-theme-gym { background: linear-gradient(180deg, #34495e 0%, #2c3e50 70%, #1c2833 100%); color: #fff; }
        .y1-theme-cyber { background: linear-gradient(160deg, #0f2027 0%, #203a43 50%, #2c5364 100%); color: #fff; }
        .y1-theme-forge { background: linear-gradient(180deg, #2d1b12 0%, #4a2c1a 60%, #1e120b 100%); color: #fff; }
        .y1-theme-space::before { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.7;
            background-image: radial-gradient(2px 2px at 20% 30%, #fff, transparent), radial-gradient(2px 2px at 70% 20%, #fff, transparent),
            radial-gradient(1px 1px at 40% 70%, #fff, transparent), radial-gradient(2px 2px at 85% 60%, #fff, transparent),
            radial-gradient(1px 1px at 10% 85%, #fff, transparent), radial-gradient(1px 1px at 55% 45%, #fff, transparent); }
        .y1-topbar { position: relative; z-index: 2; display: flex; align-items: center; gap: 0.8rem; background: rgba(255,255,255,0.12); border-radius: 50px; padding: 0.4rem; }
        .y1-title { font-weight: 800; font-size: 1.3rem; flex: 1; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .y1-round-btn { width: 64px; height: 64px; min-width: 64px; border-radius: 50%; border: none; font-size: 1.8rem; cursor: pointer; background: #fff; color: #2F3542; box-shadow: 0 5px 0 rgba(0,0,0,0.3); font-family: inherit; font-weight: 800; }
        .y1-round-btn:active { transform: translateY(4px); box-shadow: 0 1px 0 rgba(0,0,0,0.3); }
        .y1-speak { background: #FFE66D; }
        .y1-pips { display: flex; gap: 8px; }
        .y1-pip { width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,0.25); border: 3px solid rgba(255,255,255,0.6); transition: background 0.2s; }
        .y1-pip.on { background: #FFE66D; border-color: #fff; box-shadow: 0 0 12px #FFE66D; }
        .y1-pip.on.silver { background: #dfe6e9; border-color: #95a5a6; box-shadow: 0 0 6px rgba(255,255,255,0.5); }
        .y1-prompt { position: relative; z-index: 2; min-height: 3rem; text-align: center; font-weight: 800; font-size: 2rem; }
        .y1-stage { position: relative; flex: 1; min-height: 420px; }
        .y1-practising { position: relative; z-index: 2; text-align: center; font-size: 0.95rem; opacity: 0.75; font-weight: 600; }
        .y1-game button:focus-visible, .y1-game [tabindex]:focus-visible { outline: 5px solid #FFE66D; outline-offset: 3px; }
        .y1-wiggle { animation: y1wiggle 0.5s ease; }
        @keyframes y1wiggle { 0%,100% { rotate: 0deg; } 20% { rotate: -10deg; } 40% { rotate: 9deg; } 60% { rotate: -6deg; } 80% { rotate: 4deg; } }
        .y1-hint { animation: y1glow 0.8s ease-in-out 3; }
        @keyframes y1glow { 0%,100% { filter: drop-shadow(0 0 0 #FFE66D); scale: 1; } 50% { filter: drop-shadow(0 0 18px #FFE66D) brightness(1.2); scale: 1.08; } }
        .y1-particle { position: fixed; z-index: 9999; pointer-events: none; border-radius: 50%; transform: translate(-50%, -50%); }
        .y1-dragging { z-index: 50 !important; cursor: grabbing; filter: drop-shadow(0 10px 12px rgba(0,0,0,0.5)); }
        .y1-reward { position: absolute; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.45); animation: popIn 0.4s ease-out; }
        .y1-reward-card { background: #fff; color: #2F3542; border-radius: 30px; padding: 2rem 2.5rem; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.4); max-width: 90%; }
        .y1-reward-card h2 { color: #FF6B6B; margin: 0.5rem 0 1rem; }
        .y1-reward-emoji { font-size: 5rem; animation: bounce 1.5s infinite; }
        .y1-reward-sub { font-size: 1.4rem; font-weight: 800; margin: -0.5rem 0 1rem; }
        .y1-sticker-unlock { font-size: 1.4rem; font-weight: 800; margin-bottom: 1rem; color: #8E44AD; }
        .y1-sticker-unlock span { font-size: 3rem; display: inline-block; animation: float 2s ease-in-out infinite; }
        .y1-reward-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .y1-reward-buttons .btn { font-size: 1.5rem; padding: 1rem 2rem; }
        @media (max-width: 600px) {
            .y1-title { display: none; }
            .y1-round-btn { width: 56px; height: 56px; min-width: 56px; font-size: 1.5rem; }
            .y1-prompt { font-size: 1.5rem; }
            .y1-pip { width: 16px; height: 16px; }
        }
        @media (prefers-reduced-motion: reduce) {
            .y1-game *, .y1-game *::before, .y1-game *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.05s !important; }
        }
    `;
    document.head.appendChild(style);
}
