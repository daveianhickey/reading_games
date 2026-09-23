// Game 3: "Bot Repair Snap" — press SNAP when the chip in the scanner matches the target word.
import { label } from '../../phonics/curriculum.js';
import { buildPool, pickDistractors, targetSequence, recordResult, shuffle } from '../../phonics/practice.js';
import { createShell, sayItem, say, sfx, wiggle, burstAt, glow, pick, animate } from '../../phonics/engine.js';

const SNAPS = 4;
const DEFAULTS = ['w-the', 'w-to', 'w-no', 'w-go', 'w-put', 'w-into', 'w-of', 'w-pull', 'w-is', 'w-as'];
const FINALES = [
    { id: 'dance', face: '😎', text: 'Robot breakdance!' },
    { id: 'car', face: '🏎️', text: 'Hover-car mode!' },
    { id: 'boots', face: '🤩', text: 'Rocket boots!' }
];

export function initBotSnap(container, words, onBack) {
    const { items: pool, usingDefaults } = buildPool({ words, accepts: i => i.kind === 'word', defaults: DEFAULTS });
    const targets = targetSequence(pool, SNAPS);
    let snaps = 0;
    let target = targets[0];
    let missedPasses = 0;
    let missedThisTarget = false;
    let chipsSinceTarget = 0;
    let distractors = [];
    let finished = false;
    const chips = [];

    const shell = createShell(container, {
        theme: 'cyber', title: 'Bot Repair Snap', goal: SNAPS, onBack,
        practising: pool, usingDefaults,
        onSpeak: () => sayItem(target)
    });

    shell.stage.innerHTML = `
        <style>
            .snap { display: flex; flex-direction: column; align-items: center; gap: 1rem; height: 100%; }
            .snap-bot { position: relative; display: flex; flex-direction: column; align-items: center; }
            .snap-head { width: 120px; height: 90px; border-radius: 22px; background: #bdc3c7; border: 5px solid #7f8c8d; display: flex; align-items: center; justify-content: center; font-size: 3.4rem; transition: background 0.3s, box-shadow 0.3s; }
            .snap-head.lit { background: #d6fffb; box-shadow: 0 0 30px #00E5FF; }
            .snap-chest { display: flex; gap: 0.8rem; padding: 0.8rem; background: #95a5a6; border: 5px solid #7f8c8d; border-radius: 22px; margin-top: 6px; }
            .snap-screen { width: clamp(130px, 30vw, 200px); height: 100px; border-radius: 14px; background: #06141b; border: 4px solid #34495e; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #00E5FF; font-weight: 800; }
            .snap-screen small { font-size: 0.8rem; letter-spacing: 2px; opacity: 0.7; }
            .snap-screen b { font-size: clamp(2rem, 6vw, 3rem); line-height: 1.1; }
            .snap-screen.match { border-color: #2ecc71; }
            .snap-belt { position: relative; width: 100%; height: 120px; background: repeating-linear-gradient(90deg, #2d3436 0 30px, #3d4648 30px 60px); border-top: 8px solid #636e72; border-bottom: 8px solid #636e72; overflow: hidden; animation: belt 1s linear infinite; }
            @keyframes belt { to { background-position: -60px 0; } }
            .snap-scanner { position: absolute; top: 0; bottom: 0; left: 50%; width: 160px; transform: translateX(-50%); border: 5px solid #FFE66D; border-radius: 12px; box-shadow: 0 0 20px rgba(255,230,109,0.6), inset 0 0 20px rgba(255,230,109,0.3); z-index: 2; pointer-events: none; }
            .snap-chip { position: absolute; top: 14px; width: 130px; height: 76px; border-radius: 12px; background: #27ae60; border: 4px solid #1e8449; color: #fff; font-size: 2rem; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 0 4px rgba(255,255,255,0.15); }
            .snap-chip::before, .snap-chip::after { content: ''; position: absolute; left: 12px; right: 12px; height: 6px; background: repeating-linear-gradient(90deg, #f1c40f 0 6px, transparent 6px 12px); }
            .snap-chip::before { top: -10px; } .snap-chip::after { bottom: -10px; }
            .snap-btn { width: min(320px, 80vw); height: 110px; border-radius: 60px; border: none; background: #2ecc71; box-shadow: 0 10px 0 #1e8449; color: #fff; font-family: inherit; font-size: 3rem; font-weight: 900; letter-spacing: 3px; cursor: pointer; }
            .snap-btn:active { transform: translateY(8px); box-shadow: 0 2px 0 #1e8449; }
            .snap-arc { position: absolute; left: 50%; top: 40%; width: 220px; height: 80px; transform: translateX(-50%); pointer-events: none; opacity: 0; }
        </style>
        <div class="snap">
            <div class="snap-bot" id="snap-bot">
                <div class="snap-head" id="snap-head">😴</div>
                <div class="snap-chest">
                    <div class="snap-screen" id="snap-target"><small>FIX</small><b></b></div>
                    <div class="snap-screen" id="snap-scan"><small>SCANNER</small><b>· · ·</b></div>
                </div>
                <svg class="snap-arc" id="snap-arc" viewBox="0 0 220 80" aria-hidden="true"><polyline points="0,40 30,10 55,60 85,15 110,65 140,12 165,58 190,20 220,40" fill="none" stroke="#00E5FF" stroke-width="6" stroke-linejoin="round"/></svg>
            </div>
            <div class="snap-belt" id="snap-belt" aria-label="Conveyor belt"><div class="snap-scanner" id="snap-scanner"></div></div>
            <button class="snap-btn" id="snap-btn">SNAP!</button>
        </div>`;

    const belt = shell.stage.querySelector('#snap-belt');
    const scanner = shell.stage.querySelector('#snap-scanner');
    const scanWord = shell.stage.querySelector('#snap-scan b');
    const scanScreen = shell.stage.querySelector('#snap-scan');
    const targetWord = shell.stage.querySelector('#snap-target b');
    const head = shell.stage.querySelector('#snap-head');
    const snapBtn = shell.stage.querySelector('#snap-btn');

    snapBtn.addEventListener('click', snap);
    shell.onKey = e => {
        if ((e.key === ' ' || e.key === 'Enter') && e.target !== snapBtn && !e.target.closest?.('.y1-reward')) {
            e.preventDefault();
            snap();
        }
    };
    snapBtn.focus();
    setTarget(target);
    shell.prompt.textContent = 'Snap when the words match! ⚡';

    function setTarget(item) {
        target = item;
        missedThisTarget = false;
        missedPasses = 0;
        chipsSinceTarget = 0;
        distractors = pickDistractors(item, pool, 4, words);
        targetWord.textContent = label(item);
        animate(targetWord, [{ transform: 'scale(0.3)' }, { transform: 'scale(1)' }], 300);
        sayItem(item);
    }

    function nextChipItem() {
        if (chipsSinceTarget >= 2 || Math.random() < 0.4) {
            chipsSinceTarget = 0;
            return target;
        }
        chipsSinceTarget++;
        return pick(shuffle(distractors));
    }

    function spawnChip(x) {
        const item = nextChipItem();
        const el = document.createElement('div');
        el.className = 'snap-chip';
        el.textContent = label(item);
        belt.appendChild(el);
        chips.push({ el, item, x, scanned: false });
    }

    function scannerSpan() {
        const w = belt.clientWidth || 800;
        const sw = scanner.offsetWidth || 160;
        return { centre: w / 2, half: sw / 2 + 20, width: w };
    }

    function chipInScanner() {
        const { centre, half } = scannerSpan();
        return chips.find(c => Math.abs(c.x + 65 - centre) < half) || null;
    }

    // Conveyor loop: belt slows while a chip is under the scanner so there is time to read and decide.
    shell.loop(dt => {
        if (finished) return false;
        const { centre, width } = scannerSpan();
        const inScan = chipInScanner();
        // Fixed minimum pace keeps a target in reach every few seconds even on narrow phone screens.
        const speed = Math.max(width / 7, 110) * (inScan ? 0.4 : 1);
        const last = chips[chips.length - 1];
        if (!last || last.x < width - Math.min(260, Math.max(190, width * 0.4))) spawnChip(width + 10);
        for (let i = chips.length - 1; i >= 0; i--) {
            const c = chips[i];
            c.x -= speed * dt;
            c.el.style.left = `${c.x}px`;
            // A target chip leaving the scanner un-snapped: no penalty, but scaffold with a hint after two passes.
            if (!c.scanned && c.x + 65 < centre - 100) {
                c.scanned = true;
                if (label(c.item) === label(target)) missedPasses++;
            }
            if (c.x < -150) {
                c.el.remove();
                chips.splice(i, 1);
            }
        }
        const current = chipInScanner();
        scanWord.textContent = current ? label(current.item) : '· · ·';
        const isMatch = current && label(current.item) === label(target);
        scanScreen.classList.toggle('match', !!isMatch && missedPasses >= 2);
        if (isMatch && missedPasses >= 2 && !snapBtn.classList.contains('y1-hint')) glow(snapBtn);
    });

    function snap() {
        if (finished) return;
        const c = chipInScanner();
        if (!c || label(c.item) !== label(target)) {
            sfx.boing();
            wiggle(snapBtn);
            if (c && !missedThisTarget) {
                recordResult(target.id, false);
                missedThisTarget = true;
            }
            return;
        }
        if (!missedThisTarget) recordResult(target.id, true);
        chips.splice(chips.indexOf(c), 1);
        animate(c.el, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'translateY(-120px) scale(0.4)', opacity: 0 }], 400).then(() => c.el.remove());
        sfx.spark();
        sfx.clink();
        burstAt(scanner, { colors: ['#00E5FF', '#FFE66D', '#fff'], count: 20 });
        const arc = shell.stage.querySelector('#snap-arc');
        animate(arc, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }, { opacity: 1 }, { opacity: 0 }], 500);
        head.textContent = '😄';
        head.classList.add('lit');
        snaps++;
        shell.setProgress(snaps);
        if (snaps >= SNAPS) {
            reboot();
            return;
        }
        shell.later(() => { head.textContent = '🙂'; head.classList.remove('lit'); }, 900);
        shell.later(() => setTarget(targets[snaps]), 700);
    }

    async function reboot() {
        finished = true;
        const finale = pick(FINALES);
        shell.prompt.textContent = 'Robot fixed! ✨';
        sfx.powerUp();
        say(finale.text);
        head.textContent = finale.face;
        const bot = shell.stage.querySelector('#snap-bot');
        const moves = {
            dance: [{ transform: 'rotate(0)' }, { transform: 'rotate(-15deg) translateY(-10px)' }, { transform: 'rotate(15deg)' }, { transform: 'rotate(-15deg) translateY(-10px)' }, { transform: 'rotate(360deg)' }],
            car: [{ transform: 'translateX(0)' }, { transform: 'translateX(-30px) scaleX(1.1)', offset: 0.3 }, { transform: 'translateX(120vw)' }],
            boots: [{ transform: 'translateY(0)' }, { transform: 'translateY(20px) scaleY(0.9)', offset: 0.25 }, { transform: 'translateY(-110vh)' }]
        };
        for (let i = 0; i < 5; i++) shell.later(() => burstAt(bot, { chars: finale.id === 'dance' ? ['🎵', '🎶', '✨'] : ['💨', '✨', '⭐'], count: 6, spread: 160 }), i * 300);
        await animate(bot, moves[finale.id], { duration: 2000, easing: 'ease-in-out' });
        await shell.wait(300);
        shell.showReward({ emoji: finale.id === 'car' ? '🏎️' : '🤖', title: finale.text, onAgain: () => initBotSnap(container, words, onBack) });
    }
}
