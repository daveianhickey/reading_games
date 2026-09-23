// Game 5: "Cyber-Lift Mech Builder" — load the right word plate into the press to forge mech armour.
import { label } from '../../phonics/curriculum.js';
import { buildPool, pickDistractors, targetSequence, shuffle, recordResult } from '../../phonics/practice.js';
import { createShell, sayItem, say, sfx, wiggle, burstAt, glow, pick, animate, makeDraggable } from '../../phonics/engine.js';

const PIECES = 3;
const DEFAULTS = ['w-house', 'w-mouse', 'w-water', 'w-want', 'w-very', 'w-the', 'w-to', 'w-no', 'w-go', 'w-put', 'w-into', 'w-of', 'w-pull', 'w-is', 'w-as'];
const PIECE_NAMES = ['Mech helmet', 'Chest armour', 'Shoulder guards'];
const SCHEMES = [
    { main: '#e74c3c', trim: '#f1c40f', name: 'Red Blaze' },
    { main: '#3498db', trim: '#ecf0f1', name: 'Blue Thunder' },
    { main: '#2ecc71', trim: '#2c3e50', name: 'Green Titan' },
    { main: '#9b59b6', trim: '#FFE66D', name: 'Purple Power' },
    { main: '#f39c12', trim: '#34495e', name: 'Gold Crusher' },
    { main: '#1abc9c', trim: '#ff6b6b', name: 'Turbo Teal' }
];
const GARAGE_KEY = 'y1Garage';

function loadGarage() {
    try { return JSON.parse(localStorage.getItem(GARAGE_KEY)) || []; } catch (e) { return []; }
}

function mechIcon(scheme, size = 44) {
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><rect x="12" y="4" width="16" height="12" rx="3" fill="${scheme.main}"/><rect x="9" y="17" width="22" height="14" rx="3" fill="${scheme.main}"/><rect x="6" y="17" width="6" height="6" rx="2" fill="${scheme.trim}"/><rect x="28" y="17" width="6" height="6" rx="2" fill="${scheme.trim}"/><rect x="12" y="31" width="6" height="8" fill="#7f8c8d"/><rect x="22" y="31" width="6" height="8" fill="#7f8c8d"/><rect x="15" y="8" width="10" height="3" fill="${scheme.trim}"/></svg>`;
}

export function initMechBuilder(container, words, onBack) {
    const { items: pool, usingDefaults } = buildPool({ words, accepts: i => i.kind === 'word', defaults: DEFAULTS });
    const targets = targetSequence(pool, PIECES);
    const scheme = pick(SCHEMES);
    let step = 0;
    let misses = 0;
    let busy = true;
    let current = null;

    const shell = createShell(container, {
        theme: 'forge', title: 'Mech Builder', goal: PIECES, onBack,
        practising: pool, usingDefaults,
        onSpeak: () => current && sayItem(current, { withClue: true })
    });

    shell.stage.innerHTML = `
        <style>
            .forge { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; height: 100%; }
            .forge-top { display: flex; align-items: flex-end; justify-content: center; gap: clamp(1rem, 5vw, 3rem); width: 100%; }
            .forge-mech { width: clamp(140px, 30vw, 210px); transform-origin: bottom center; transform: scale(0.9) translateY(12px); transition: transform 0.6s cubic-bezier(.3,1.6,.5,1); }
            .forge-mech svg { width: 100%; overflow: visible; }
            .forge-mech.standing { transform: scale(1.05); }
            .forge-mech .ghost { fill: rgba(255,255,255,0.06); stroke: #FFE66D; stroke-width: 3; stroke-dasharray: 7 5; }
            .forge-mech .armor { transform-box: fill-box; transform-origin: center; }
            .forge-press { position: relative; width: clamp(150px, 32vw, 220px); height: 250px; }
            .forge-frame { position: absolute; inset: 0 8px 30px; border: 10px solid #555; border-bottom: none; border-radius: 12px 12px 0 0; }
            .forge-ram { position: absolute; left: 22%; right: 22%; top: 10px; height: 70px; background: linear-gradient(#95a5a6, #636e72); border-radius: 6px; border-bottom: 10px solid #2d3436; z-index: 2; }
            .forge-ram::before { content: ''; position: absolute; left: 40%; right: 40%; top: -10px; height: 12px; background: #7f8c8d; }
            .forge-anvil { position: absolute; left: 12%; right: 12%; bottom: 0; height: 60px; background: linear-gradient(#636e72, #2d3436); border-radius: 10px 10px 4px 4px; }
            .forge-glow { position: absolute; left: 50%; bottom: 62px; transform: translateX(-50%); font-size: 3rem; opacity: 0; filter: drop-shadow(0 0 14px #F39C12); }
            .forge-plates { display: flex; gap: clamp(0.6rem, 3vw, 1.5rem); justify-content: center; flex-wrap: wrap; }
            .forge-plate { width: clamp(100px, 26vw, 140px); aspect-ratio: 1; border-radius: 50%; border: 8px solid #2d3436; background: radial-gradient(circle, #636e72 0 18%, #2d3436 19% 24%, #4b5559 25%);
                color: #fff; font-family: inherit; font-size: clamp(1.6rem, 5vw, 2.3rem); font-weight: 800; cursor: grab; box-shadow: 0 8px 0 #111; text-shadow: 0 2px 4px #000; }
            .forge-plate.dim { opacity: 0.4; }
            .forge-clue { display: inline-flex; gap: 0.6rem; align-items: center; background: rgba(255,255,255,0.15); border-radius: 40px; padding: 0.3rem 1.2rem; }
            .forge-roar { position: absolute; top: -10px; left: 55%; background: #fff; color: #e74c3c; font-weight: 900; font-size: 2rem; padding: 0.3rem 0.8rem; border-radius: 20px; opacity: 0; }
            .forge-garage { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; align-items: center; }
        </style>
        <div class="forge" id="forge">
            <div class="forge-top">
                <div class="forge-mech" id="forge-mech" style="position: relative;" aria-label="Your mech">
                    <div class="forge-roar" id="forge-roar">ROAR!</div>
                    <svg viewBox="0 0 200 280" aria-hidden="true">
                        <rect x="62" y="190" width="30" height="80" rx="8" fill="#7f8c8d"/><rect x="108" y="190" width="30" height="80" rx="8" fill="#7f8c8d"/>
                        <rect x="24" y="100" width="26" height="90" rx="10" fill="#95a5a6"/><rect x="150" y="100" width="26" height="90" rx="10" fill="#95a5a6"/>
                        <rect x="55" y="92" width="90" height="100" rx="16" fill="#95a5a6"/>
                        <rect x="72" y="30" width="56" height="54" rx="12" fill="#bdc3c7"/>
                        <rect x="82" y="50" width="36" height="10" rx="5" fill="#00E5FF"/>
                        <path class="armor ghost" data-part="0" d="M64 60 Q64 12 100 12 Q136 12 136 60 L128 60 L128 44 L72 44 L72 60 Z"/>
                        <rect class="armor ghost" data-part="1" x="62" y="100" width="76" height="80" rx="12"/>
                        <rect class="armor ghost" data-part="2" x="14" y="88" width="46" height="34" rx="12"/>
                        <rect class="armor ghost" data-part="2" x="140" y="88" width="46" height="34" rx="12"/>
                    </svg>
                </div>
                <div class="forge-press" id="forge-press" aria-label="Hydraulic press">
                    <div class="forge-frame"></div>
                    <div class="forge-ram" id="forge-ram"></div>
                    <div class="forge-glow" id="forge-glow"></div>
                    <div class="forge-anvil"></div>
                </div>
            </div>
            <div class="forge-plates" id="forge-plates"></div>
        </div>`;

    const mech = shell.stage.querySelector('#forge-mech');
    const press = shell.stage.querySelector('#forge-press');
    const ram = shell.stage.querySelector('#forge-ram');
    const glowEl = shell.stage.querySelector('#forge-glow');
    const platesEl = shell.stage.querySelector('#forge-plates');

    nextWord();

    function nextWord() {
        current = targets[step];
        misses = 0;
        const clue = current.clue ? current.clue.replace('___', '<u>&nbsp;?&nbsp;</u>') : 'Listen… 👂';
        shell.prompt.innerHTML = `<span class="forge-clue"><span style="font-size:2.4rem">${current.emoji || '🔊'}</span>${clue}</span>`;
        sayItem(current, { withClue: true });
        platesEl.innerHTML = '';
        const options = shuffle([current, ...pickDistractors(current, pool, 2, words)]);
        options.forEach((item, i) => {
            const plate = document.createElement('button');
            plate.className = 'forge-plate';
            plate.textContent = label(item);
            plate.setAttribute('aria-label', `Weight plate ${label(item)}`);
            platesEl.appendChild(plate);
            makeDraggable(plate, { dropTarget: press, onSelect: () => choose(plate, item) });
            // Plates drop down from above with a thud.
            animate(plate, [{ transform: 'translateY(-200px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: 0.7 }, { transform: 'translateY(-12px)', offset: 0.85 }, { transform: 'translateY(0)' }], { duration: 600, delay: i * 120, easing: 'ease-in', fill: 'none' });
        });
        busy = false;
        shell.setHint(() => glow(plateFor(current)));
    }

    function plateFor(item) {
        return [...platesEl.children].find(p => p.textContent === label(item));
    }

    async function choose(plate, item) {
        if (busy || plate.classList.contains('dim')) return;
        if (label(item) !== label(current)) {
            sfx.boing();
            wiggle(plate);
            plate.classList.add('dim');
            sayItem(item);
            if (misses === 0) recordResult(current.id, false);
            misses++;
            if (misses >= 2) glow(plateFor(current));
            return;
        }
        busy = true;
        shell.clearHint();
        if (misses === 0) recordResult(current.id, true);
        sayItem(item);

        // Load the plate onto the press.
        const from = plate.getBoundingClientRect();
        const to = press.getBoundingClientRect();
        await animate(plate, [
            { transform: 'translate(0,0) scale(1)' },
            { transform: `translate(${to.left + to.width / 2 - from.left - from.width / 2}px, ${to.bottom - 70 - from.top - from.height / 2}px) scale(0.6)` }
        ], { duration: 450, easing: 'ease-in-out' });
        if (!shell.alive) return;
        plate.style.visibility = 'hidden';

        // Slam!
        await animate(ram, [{ transform: 'translateY(0)' }, { transform: 'translateY(95px)' }], { duration: 160, easing: 'ease-in' });
        sfx.slam();
        animate(shell.root, [{ transform: 'translate(0,0)' }, { transform: 'translate(-8px,5px)' }, { transform: 'translate(7px,-4px)' }, { transform: 'translate(-4px,3px)' }, { transform: 'translate(0,0)' }], { duration: 300, fill: 'none' });
        burstAt(press, { colors: ['#F39C12', '#FFE66D', '#fff'], count: 20 });
        glowEl.textContent = ['🪖', '🛡️', '⚙️'][step];
        glowEl.style.opacity = '1';
        await animate(ram, [{ transform: 'translateY(95px)' }, { transform: 'translateY(0)' }], { duration: 400, easing: 'ease-out' });
        if (!shell.alive) return;

        // Armour piece flies onto the mech.
        const part = mech.querySelector(`[data-part="${step}"]`);
        const g = glowEl.getBoundingClientRect();
        const p = part.getBoundingClientRect();
        await animate(glowEl, [
            { transform: 'translateX(-50%)', opacity: 1 },
            { transform: `translate(calc(-50% + ${p.left + p.width / 2 - g.left - g.width / 2}px), ${p.top + p.height / 2 - g.top - g.height / 2}px) scale(0.5)`, opacity: 0.2 }
        ], { duration: 500, easing: 'ease-in', fill: 'none' });
        if (!shell.alive) return;
        glowEl.style.opacity = '0';
        sfx.lock();
        mech.querySelectorAll(`[data-part="${step}"]`).forEach(el => {
            el.classList.remove('ghost');
            el.style.fill = step === 1 ? scheme.main : scheme.trim;
            el.style.stroke = step === 1 ? scheme.trim : scheme.main;
            el.style.strokeWidth = '4';
            if (step === 0) el.style.fill = scheme.main;
            animate(el, [{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' });
        });
        burstAt(part, { chars: ['✨'], count: 6, spread: 80 });
        shell.prompt.textContent = `${PIECE_NAMES[step]}! 🔧`;
        step++;
        shell.setProgress(step);
        await shell.wait(900);
        if (step < PIECES) nextWord(); else complete();
    }

    async function complete() {
        platesEl.innerHTML = '';
        mech.classList.add('standing');
        sfx.powerUp();
        await shell.wait(700);
        const roar = shell.stage.querySelector('#forge-roar');
        sfx.roar();
        animate(roar, [{ opacity: 0, transform: 'scale(0.3)' }, { opacity: 1, transform: 'scale(1.2)' }, { opacity: 1, transform: 'scale(1)' }], 500);
        await shell.wait(900);
        say(`${scheme.name} is ready!`);
        await animate(mech, [{ transform: 'scale(1.05)' }, { transform: 'scale(1.15) rotate(-5deg)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1.15) rotate(5deg)' }, { transform: 'scale(1.05)' }], { duration: 1200, fill: 'none' });
        if (!shell.alive) return;

        const garage = [...loadGarage(), { main: scheme.main, trim: scheme.trim, name: scheme.name }].slice(-24);
        try { localStorage.setItem(GARAGE_KEY, JSON.stringify(garage)); } catch (e) { /* ignore */ }
        shell.prompt.innerHTML = `<div class="forge-garage"><span style="font-size:1.1rem">My garage:</span>${garage.map(m => mechIcon(m, 36)).join('')}</div>`;
        await shell.wait(600);
        shell.showReward({ emoji: mechIcon(scheme, 110), title: `${scheme.name} built!`, onAgain: () => initMechBuilder(container, words, onBack) });
    }
}
