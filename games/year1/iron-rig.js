// Game 1: "Iron Rig: Power-Up!" — memory snap with grapheme cards powers up a robot for a barbell lift.
import { label } from '../../phonics/curriculum.js';
import { buildPool, pickDistinct, shuffle, recordResult } from '../../phonics/practice.js';
import { createShell, sayItem, say, sfx, wiggle, burstAt, glow, pick, animate } from '../../phonics/engine.js';

const PAIRS = 3;
const DEFAULTS = ['ck', 'qu', 'ch', 'th', 'ng', 'nk', 'ai', 'igh', 'oa', 'oo-spoon', 'ar', 'ur', 'oo-book', 'or', 'ow-growl', 'oi', 'ear', 'air', 'ure', 'er', 'ow-snow'];
const POSES = ['pose-flex', 'pose-spin', 'pose-jump'];
const CHEERS = ['Power lift!', 'Mega lift!', 'Turbo strong!', 'Super lift!'];

export function initIronRig(container, words, onBack) {
    const { items: pool, usingDefaults } = buildPool({ words, accepts: i => i.kind === 'gpc', defaults: DEFAULTS, minDistinct: PAIRS });
    const targets = pickDistinct(pool, PAIRS);
    const cards = shuffle([...targets, ...targets]);

    let flipped = [];
    let matched = 0;
    let misses = 0;
    let locked = true;

    const shell = createShell(container, {
        theme: 'gym', title: 'Iron Rig: Power-Up!', goal: PAIRS, onBack,
        practising: pool, usingDefaults,
        onSpeak: () => say('Find two cards that match!')
    });

    shell.stage.innerHTML = `
        <style>
            .rig-layout { display: flex; gap: 1.5rem; align-items: center; justify-content: center; height: 100%; flex-wrap: wrap; }
            .rig-robot { width: min(280px, 40vw); flex-shrink: 0; }
            .rig-robot svg { width: 100%; overflow: visible; }
            .rig-robot .arm, .rig-robot #rig-bar, .rig-robot #rig-bot { transform-box: fill-box; transition: transform 0.7s cubic-bezier(.3,1.6,.5,1); }
            .rig-robot .arm { transform-origin: 50% 0%; }
            .rig-robot #rig-bot { transform-origin: 50% 100%; }
            .rig-robot .energy { stroke: #3d4b5c; stroke-width: 6; stroke-linecap: round; transition: stroke 0.3s; }
            .rig-robot .energy.on { stroke: #00E5FF; filter: drop-shadow(0 0 6px #00E5FF); }
            .rig-robot .eye { fill: #555; transition: fill 0.3s; }
            .rig-robot.powered .eye { fill: #00E5FF; filter: drop-shadow(0 0 4px #00E5FF); }
            .rig-robot.lifting .arm { transform: rotate(180deg); }
            .rig-robot.lifting #rig-bar { transform: translateY(-158px); }
            .rig-robot.pose-flex #rig-bot { animation: rigFlex 0.6s ease-in-out 3; }
            .rig-robot.pose-spin #rig-bot { animation: rigSpin 1.2s ease-in-out 1; }
            .rig-robot.pose-jump #rig-bot { animation: rigJump 0.5s ease-in-out 3; }
            @keyframes rigFlex { 50% { transform: scale(1.12); } }
            @keyframes rigSpin { to { transform: rotateY(360deg); } }
            @keyframes rigJump { 50% { transform: translateY(-40px); } }
            .rig-grid { display: grid; grid-template-columns: repeat(3, minmax(90px, 130px)); gap: 1rem; perspective: 900px; }
            .rig-card { position: relative; aspect-ratio: 3 / 4; border: none; background: none; padding: 0; cursor: pointer; font-family: inherit; }
            .rig-card .inner { position: absolute; inset: 0; transition: transform 0.45s; transform-style: preserve-3d; }
            .rig-card.up .inner { transform: rotateY(180deg); }
            .rig-card .face { position: absolute; inset: 0; border-radius: 18px; backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 6px 0 rgba(0,0,0,0.35); }
            .rig-card .back { background: repeating-linear-gradient(45deg, #F39C12, #F39C12 12px, #E67E22 12px, #E67E22 24px); font-size: 2.8rem; border: 4px solid #FFE66D; }
            .rig-card .front { background: #fff; color: #2F3542; transform: rotateY(180deg); border: 4px solid #00E5FF; }
            .rig-card .front b { font-size: 2.8rem; line-height: 1; }
            .rig-card .front span { font-size: 1.8rem; }
            .rig-card.matched .front { background: #d7fff9; border-color: #2ecc71; }
            @media (max-width: 600px) { .rig-grid { grid-template-columns: repeat(3, minmax(70px, 100px)); gap: 0.6rem; } .rig-card .front b { font-size: 2rem; } }
        </style>
        <div class="rig-layout">
            <div class="rig-robot" id="rig-robot" aria-label="Robot getting ready to lift">
                <svg viewBox="-10 -60 220 320" aria-hidden="true">
                    <rect x="-10" y="238" width="220" height="14" rx="4" fill="#7f8c8d"/>
                    <g id="rig-bot">
                        <rect x="70" y="160" width="24" height="80" rx="8" fill="#95a5a6"/>
                        <rect x="106" y="160" width="24" height="80" rx="8" fill="#95a5a6"/>
                        <line class="energy seg-0" x1="82" y1="170" x2="82" y2="230"/><line class="energy seg-0" x1="118" y1="170" x2="118" y2="230"/>
                        <g class="arm"><rect x="35" y="80" width="22" height="78" rx="8" fill="#bdc3c7"/><line class="energy seg-1" x1="46" y1="90" x2="46" y2="148"/></g>
                        <g class="arm"><rect x="143" y="80" width="22" height="78" rx="8" fill="#bdc3c7"/><line class="energy seg-1" x1="154" y1="90" x2="154" y2="148"/></g>
                        <rect x="58" y="75" width="84" height="88" rx="14" fill="#e74c3c"/>
                        <rect x="80" y="95" width="40" height="40" rx="8" fill="#2c3e50"/>
                        <line class="energy seg-2" x1="90" y1="115" x2="110" y2="115"/>
                        <rect x="72" y="18" width="56" height="50" rx="12" fill="#bdc3c7"/>
                        <circle class="eye" cx="88" cy="42" r="7"/><circle class="eye" cx="112" cy="42" r="7"/>
                        <rect x="96" y="4" width="8" height="14" fill="#7f8c8d"/><circle cx="100" cy="2" r="5" fill="#FFE66D"/>
                    </g>
                    <g id="rig-bar">
                        <rect x="0" y="152" width="200" height="8" rx="4" fill="#555"/>
                        <rect x="2" y="132" width="16" height="48" rx="4" fill="#2c3e50"/><rect x="182" y="132" width="16" height="48" rx="4" fill="#2c3e50"/>
                        <rect x="20" y="138" width="10" height="36" rx="3" fill="#34495e"/><rect x="170" y="138" width="10" height="36" rx="3" fill="#34495e"/>
                    </g>
                </svg>
            </div>
            <div class="rig-grid" id="rig-grid">
                ${cards.map((item, i) => `
                    <button class="rig-card up" data-i="${i}" aria-label="Energy card">
                        <div class="inner">
                            <div class="face back">⚡</div>
                            <div class="face front"><b>${label(item)}</b><span>${item.emoji || ''}</span></div>
                        </div>
                    </button>`).join('')}
            </div>
        </div>`;

    const robot = shell.stage.querySelector('#rig-robot');
    const cardEls = [...shell.stage.querySelectorAll('.rig-card')];

    shell.prompt.textContent = 'Look at the cards…';
    say('Look carefully!');

    // Brief face-up preview keeps the working-memory load light.
    shell.later(() => {
        cardEls.forEach(c => c.classList.remove('up'));
        shell.prompt.textContent = 'Find the matching sounds! ⚡';
        say('Find two cards that match!');
        locked = false;
        shell.setHint(hintPair, 10000);
    }, 2800);

    cardEls.forEach(card => card.addEventListener('click', () => flip(card)));

    function flip(card) {
        if (locked || card.classList.contains('up')) return;
        const item = cards[+card.dataset.i];
        card.classList.add('up');
        card.setAttribute('aria-label', `${label(item)} card`);
        sfx.flip();
        sayItem(item);
        flipped.push(card);
        if (flipped.length === 2) check();
    }

    function check() {
        const [a, b] = flipped;
        const item = cards[+a.dataset.i];
        if (label(item) === label(cards[+b.dataset.i])) {
            flipped = [];
            misses = 0;
            a.classList.add('matched');
            b.classList.add('matched');
            matched++;
            recordResult(item.id, true);
            sfx.clink();
            burstAt(a, { colors: ['#00E5FF', '#FFE66D'] });
            burstAt(b, { colors: ['#00E5FF', '#FFE66D'] });
            robot.querySelectorAll(`.seg-${matched - 1}`).forEach(l => l.classList.add('on'));
            shell.setProgress(matched);
            if (matched === PAIRS) {
                shell.clearHint();
                lift();
            } else {
                shell.setHint(hintPair, 10000);
            }
        } else {
            locked = true;
            misses++;
            shell.later(() => {
                sfx.boing();
                wiggle(a);
                wiggle(b);
            }, 500);
            shell.later(() => {
                a.classList.remove('up');
                b.classList.remove('up');
                a.setAttribute('aria-label', 'Energy card');
                b.setAttribute('aria-label', 'Energy card');
                flipped = [];
                locked = false;
                if (misses >= 2) hintPair();
            }, 1300);
        }
    }

    function hintPair() {
        const hidden = cardEls.filter(c => !c.classList.contains('matched') && !c.classList.contains('up'));
        if (!hidden.length) return;
        const first = hidden[0];
        const lbl = label(cards[+first.dataset.i]);
        hidden.filter(c => label(cards[+c.dataset.i]) === lbl).forEach(glow);
        misses = 0;
    }

    async function lift() {
        locked = true;
        shell.prompt.textContent = 'Power up! 💪';
        robot.classList.add('powered');
        sfx.powerUp();
        await shell.wait(700);
        robot.classList.add('lifting');
        sfx.whoosh();
        say(pick(CHEERS));
        await shell.wait(700);
        const bar = robot.querySelector('#rig-bar');
        for (let i = 0; i < 4; i++) shell.later(() => burstAt(bar, { chars: ['✨', '⭐', '💥'], count: 8, spread: 180 }), i * 250);
        robot.classList.add(pick(POSES));
        animate(robot, [{ filter: 'drop-shadow(0 0 0 #00E5FF)' }, { filter: 'drop-shadow(0 0 25px #00E5FF)' }, { filter: 'drop-shadow(0 0 0 #00E5FF)' }], 1500);
        await shell.wait(2000);
        shell.showReward({ emoji: pick(['🏋️', '🦾', '🤖', '💪']), onAgain: () => initIronRig(container, words, onBack) });
    }
}
