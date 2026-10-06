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
        onSpeak: () => current && readSentence(current)
    });

    shell.stage.innerHTML = `
        <style>
            .forge { display: flex; flex-direction: column; align-items: center; gap: 0.8rem; height: 100%; }
            /* The sentence is the mould: big, central, and the place the word plate is dragged to. */
            .forge-mould { width: 100%; max-width: 760px; box-sizing: border-box; padding: 1rem 1.2rem; border-radius: 22px;
                background: linear-gradient(#636e72, #2d3436); border: 6px solid #4b5559; box-shadow: inset 0 0 24px rgba(0,0,0,0.6), 0 8px 0 #111;
                display: flex; align-items: center; justify-content: center; gap: 0.8rem; flex-wrap: wrap; transition: box-shadow 0.2s; }
            .forge-mould.ready { box-shadow: inset 0 0 24px rgba(0,0,0,0.6), 0 8px 0 #111, 0 0 0 4px #FFE66D; }
            .forge-mould .em { font-size: clamp(2.4rem, 8vw, 3.4rem); }
            .forge-sentence { font-size: clamp(1.9rem, 6.5vw, 3rem); font-weight: 800; line-height: 1.5; text-align: center; color: #fff; }
            .forge-gap { display: inline-block; width: 3.4em; height: 1.35em; white-space: nowrap; overflow: visible; padding: 0 0.15em; margin: 0 0.1em; border-radius: 14px; border: 4px dashed #FFE66D;
                background: rgba(255,230,109,0.12); text-align: center; line-height: 1.35; vertical-align: middle; box-sizing: content-box; }
            .forge-gap.filled { border-style: solid; color: #FFE66D; background: rgba(243,156,18,0.25); text-shadow: 0 0 14px rgba(255,230,109,0.9); }
            .forge-gap.wrong { border-style: solid; border-color: #e17055; color: #fab1a0; background: rgba(225,112,85,0.2); }
            .forge-row { display: flex; align-items: flex-end; justify-content: center; width: 100%; flex: 1; min-height: 0; }
            .forge-mech { width: min(clamp(120px, 26vw, 190px), 21vh); transform-origin: bottom center; transform: scale(0.9) translateY(12px); transition: transform 0.6s cubic-bezier(.3,1.6,.5,1); }
            .forge-mech svg { width: 100%; overflow: visible; }
            .forge-mech.standing { transform: scale(1.05); }
            .forge-mech .ghost { fill: rgba(255,255,255,0.06); stroke: #FFE66D; stroke-width: 3; stroke-dasharray: 7 5; }
            .forge-mech .armor { transform-box: fill-box; transform-origin: center; }
            .forge-piece { position: fixed; z-index: 60; font-size: 3rem; pointer-events: none; filter: drop-shadow(0 0 14px #F39C12); transform: translate(-50%, -50%); }
            .forge-plates { display: flex; gap: clamp(0.6rem, 3vw, 1.5rem); justify-content: center; flex-wrap: wrap; }
            .forge-plate { width: clamp(96px, 25vw, 136px); aspect-ratio: 1; border-radius: 50%; border: 8px solid #2d3436; background: radial-gradient(circle, #636e72 0 18%, #2d3436 19% 24%, #4b5559 25%);
                color: #fff; font-family: inherit; font-size: clamp(1.6rem, 5vw, 2.3rem); font-weight: 800; cursor: grab; box-shadow: 0 8px 0 #111; text-shadow: 0 2px 4px #000; }
            .forge-plate.dim { opacity: 0.4; }
            .forge-roar { position: absolute; top: -10px; left: 55%; background: #fff; color: #e74c3c; font-weight: 900; font-size: 2rem; padding: 0.3rem 0.8rem; border-radius: 20px; opacity: 0; }
            .forge-garage { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; align-items: center; }
        </style>
        <div class="forge" id="forge">
            <div class="forge-mould" id="forge-mould" aria-label="Sentence"></div>
            <div class="forge-row">
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
            </div>
            <div class="forge-plates" id="forge-plates"></div>
        </div>`;

    const mech = shell.stage.querySelector('#forge-mech');
    const mould = shell.stage.querySelector('#forge-mould');
    const platesEl = shell.stage.querySelector('#forge-plates');

    nextWord();

    // The sentence isn't read out automatically, so he reads it himself. 🔊 reads it with "blank" in the gap.
    // Words with no clue sentence (e.g. the learner's own typed words) are just a gap, so those are spoken.
    function readSentence(item) {
        if (item.clue) say(item.clue.replace('___', 'blank'));
        else sayItem(item);
    }

    function nextWord() {
        current = targets[step];
        misses = 0;
        const parts = (current.clue || '___').split('___');
        mould.innerHTML = `<span class="em" aria-hidden="true">${current.emoji || '🔊'}</span>
            <span class="forge-sentence">${parts[0]}<span class="forge-gap" id="forge-gap" aria-label="gap"></span>${parts[1] || ''}</span>`;
        mould.classList.remove('ready');
        shell.prompt.textContent = 'Drag the word that fits 👆';
        if (!current.clue) sayItem(current);
        platesEl.innerHTML = '';
        const options = shuffle([current, ...pickDistractors(current, pool, 2, words)]);
        options.forEach((item, i) => {
            const plate = document.createElement('button');
            plate.className = 'forge-plate';
            plate.textContent = label(item);
            plate.setAttribute('aria-label', `Weight plate ${label(item)}`);
            platesEl.appendChild(plate);
            // Tapping a plate says its word; dragging it into the sentence chooses it.
            makeDraggable(plate, {
                dropTarget: mould,
                onSelect: () => choose(plate, item),
                onTap: () => { sayItem(item); animate(plate, [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { duration: 300, fill: 'none' }); }
            });
            plate.addEventListener('pointerdown', () => mould.classList.add('ready'));
            plate.addEventListener('pointerup', () => mould.classList.remove('ready'));
            // Plates drop down from above with a thud.
            animate(plate, [{ transform: 'translateY(-200px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: 0.7 }, { transform: 'translateY(-12px)', offset: 0.85 }, { transform: 'translateY(0)' }], { duration: 600, delay: i * 120, easing: 'ease-in', fill: 'none' });
        });
        busy = false;
        // Hint ladder: first read the sentence aloud, then glow the right plate.
        let hints = 0;
        const hint = () => {
            hints++;
            if (hints === 1) { readSentence(current); shell.setHint(hint); } else glow(plateFor(current));
        };
        shell.setHint(hint);
    }

    // Put a word in the gap, shrinking long words so the gap (and the sentence) keeps its size.
    function setGapWord(gap, text) {
        gap.textContent = text;
        gap.style.fontSize = text.length > 4 ? `${(4 / text.length).toFixed(2)}em` : '';
        gap.style.width = gap.style.height = gap.style.lineHeight = '';
        if (text.length > 4) {
            const k = text.length / 4;
            gap.style.width = `${(3.4 * k).toFixed(2)}em`;
            gap.style.height = gap.style.lineHeight = `${(1.35 * k).toFixed(2)}em`;
        }
    }

    function plateFor(item) {
        return [...platesEl.children].find(p => p.textContent === label(item));
    }

    async function choose(plate, item) {
        if (busy || plate.classList.contains('dim')) return;
        const gap = mould.querySelector('#forge-gap');
        if (label(item) !== label(current)) {
            // Show the wrong word in the sentence for a moment so it can be read and heard not to fit.
            busy = true;
            sfx.boing();
            setGapWord(gap, label(item));
            gap.classList.add('wrong');
            wiggle(gap);
            wiggle(plate);
            plate.classList.add('dim');
            if (misses === 0) recordResult(current.id, false);
            misses++;
            await shell.wait(800);
            if (!shell.alive) return;
            setGapWord(gap, '');
            gap.classList.remove('wrong');
            busy = false;
            if (misses >= 2) glow(plateFor(current));
            return;
        }
        busy = true;
        shell.clearHint();
        if (misses === 0) recordResult(current.id, true);

        // The plate drops into the gap and the sentence is forged: slam, shake, sparks.
        plate.style.visibility = 'hidden';
        setGapWord(gap, label(current));
        gap.removeAttribute('aria-label');
        gap.classList.add('filled');
        sfx.slam();
        animate(gap, [{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 250, easing: 'ease-in', fill: 'none' });
        animate(shell.root, [{ transform: 'translate(0,0)' }, { transform: 'translate(-8px,5px)' }, { transform: 'translate(7px,-4px)' }, { transform: 'translate(-4px,3px)' }, { transform: 'translate(0,0)' }], { duration: 300, fill: 'none' });
        burstAt(gap, { colors: ['#F39C12', '#FFE66D', '#fff'], count: 20 });
        // Now read the whole sentence aloud, with the word in place.
        const sentence = current.clue ? current.clue.replace('___', label(current)) : label(current);
        say(sentence);

        // An armour piece pops out of the gap and flies onto the mech.
        const part = mech.querySelector(`[data-part="${step}"]`);
        const g = gap.getBoundingClientRect();
        const p = part.getBoundingClientRect();
        const piece = document.createElement('div');
        piece.className = 'forge-piece';
        piece.textContent = ['🪖', '🛡️', '⚙️'][step];
        piece.style.left = `${g.left + g.width / 2}px`;
        piece.style.top = `${g.top + g.height / 2}px`;
        document.body.appendChild(piece);
        piece.style.opacity = '0';
        await animate(piece, [
            { transform: 'translate(-50%, -110%) scale(0.4)', opacity: 0 },
            { transform: 'translate(-50%, -170%) scale(1.2)', opacity: 1, offset: 0.3 },
            { transform: `translate(calc(-50% + ${p.left + p.width / 2 - g.left - g.width / 2}px), calc(-50% + ${p.top + p.height / 2 - g.top - g.height / 2}px)) scale(0.5)`, opacity: 0.3 }
        ], { duration: 750, delay: 350, easing: 'ease-in' });
        piece.remove();
        if (!shell.alive) return;
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
        // Leave time for the sentence to be heard before the next one appears.
        await shell.wait(Math.min(1800, 500 + sentence.length * 55));
        if (step < PIECES) nextWord(); else complete();
    }

    async function complete() {
        platesEl.innerHTML = '';
        mould.style.display = 'none';
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
