// Game 2: "Rocket Assembly Bay" — send the pod that matches the catchphrase / spoken word to the rocket.
import { label, gapSegments } from '../../phonics/curriculum.js';
import { buildPool, pickDistractors, targetSequence, shuffle, recordResult } from '../../phonics/practice.js';
import { createShell, sayItem, say, sfx, wiggle, burstAt, glow, pick, animate, makeDraggable } from '../../phonics/engine.js';

const PARTS = 4;
const DEFAULTS = ['a-e', 'e-e', 'i-e', 'o-e', 'u-e', 'w-house', 'w-mouse', 'w-water', 'w-want', 'w-very'];
const DESTINATIONS = [
    { id: 'moon', emoji: '🌕', text: 'To the Moon!' },
    { id: 'mars', emoji: '🔴', text: 'Off to Mars!' },
    { id: 'loop', emoji: '🌀', text: 'Loop the loop!' },
    { id: 'asteroids', emoji: '☄️', text: 'Asteroid blaster!' }
];

export function initRocketBay(container, words, onBack) {
    const { items: pool, usingDefaults } = buildPool({ words, accepts: () => true, defaults: DEFAULTS });
    const targets = targetSequence(pool, PARTS);
    let step = 0;
    let misses = 0;
    let busy = false;
    let current = null;

    const shell = createShell(container, {
        theme: 'space', title: 'Rocket Assembly Bay', goal: PARTS, onBack,
        practising: pool, usingDefaults,
        onSpeak: () => current && sayItem(current, { withClue: true })
    });

    shell.stage.innerHTML = `
        <style>
            .bay { display: flex; flex-direction: column; align-items: center; height: 100%; gap: 0.5rem; }
            .bay-field { position: relative; width: 100%; display: flex; justify-content: space-evenly; align-items: center; min-height: 170px; }
            .bay-pod { position: relative; width: clamp(96px, 24vw, 150px); height: clamp(96px, 24vw, 150px); border-radius: 50%; border: 5px solid #9be7ff;
                background: radial-gradient(circle at 35% 30%, #ffffff 0%, #c9d6ff 35%, #6c7ae0 100%); color: #1b1f3b; font-family: inherit;
                font-size: clamp(1.8rem, 5vw, 2.8rem); font-weight: 800; cursor: grab; box-shadow: 0 0 20px rgba(155,231,255,0.6);
                animation: podDrift 3.2s ease-in-out infinite; }
            .bay-pod:nth-child(2) { animation-delay: -1.1s; animation-duration: 3.8s; }
            .bay-pod:nth-child(3) { animation-delay: -2.2s; animation-duration: 3.5s; }
            .bay-pod.dim { opacity: 0.45; }
            @keyframes podDrift { 0%,100% { transform: translate(-14px, 0) rotate(-4deg); } 50% { transform: translate(14px, -16px) rotate(4deg); } }
            @keyframes podDriftSmall { 0%,100% { transform: translate(-4px, 0) rotate(-4deg); } 50% { transform: translate(4px, -12px) rotate(4deg); } }
            @media (max-width: 600px) { .bay-pod { width: 84px; height: 84px; font-size: 1.7rem; animation-name: podDriftSmall; } }
            .bay-pad { position: relative; width: 240px; height: 290px; }
            .bay-rocket { position: absolute; inset: 0; }
            .bay-rocket svg { width: 100%; height: 100%; overflow: visible; }
            .bay-rocket .part { transition: fill 0.3s; transform-box: fill-box; transform-origin: center; }
            .bay-rocket .ghost { fill: rgba(255,255,255,0.05); stroke: #9be7ff; stroke-width: 3; stroke-dasharray: 8 6; }
            .bay-rocket .flame { opacity: 0; transform-box: fill-box; transform-origin: top center; }
            .bay-rocket.firing .flame { opacity: 1; animation: flicker 0.12s infinite alternate; }
            @keyframes flicker { from { transform: scaleY(0.8); } to { transform: scaleY(1.25); } }
            .bay-ground { position: absolute; bottom: -8px; left: -30px; right: -30px; height: 16px; background: #7f8c8d; border-radius: 8px; }
            .bay-prompt { display: inline-flex; align-items: center; gap: 0.6rem; background: rgba(255,255,255,0.15); padding: 0.3rem 1.2rem; border-radius: 40px; }
            .bay-prompt .em { font-size: 2.6rem; }
            /* Gaps are all the same width so their size never gives away how many letters go in. */
            .bay-gap { display: inline-block; min-width: 1.6em; height: 1.15em; margin: 0 0.06em; vertical-align: -0.12em; border-radius: 8px;
                border: 3px dashed #FFE66D; background: rgba(255,230,109,0.12); text-align: center; line-height: 1; }
            .bay-word { white-space: nowrap; }
            .bay-gap.filled { min-width: 0; height: auto; vertical-align: baseline; border: none; background: none; color: #FFE66D; padding: 0 0.04em; text-shadow: 0 0 12px rgba(255,230,109,0.8); }
            .bay-count { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 9rem; font-weight: 900; color: #FFE66D; text-shadow: 0 0 30px #F39C12; pointer-events: none; z-index: 20; }
            .bay-dest { position: absolute; top: 5%; right: 10%; font-size: 6rem; opacity: 0; }
        </style>
        <div class="bay">
            <div class="bay-field" id="bay-field"></div>
            <div class="bay-pad" id="bay-pad" aria-label="Rocket launch pad">
                <div class="bay-rocket" id="bay-rocket">
                    <svg viewBox="0 0 200 320" aria-hidden="true">
                        <path class="flame" d="M80 262 Q100 330 120 262 Z" fill="#F39C12"/>
                        <path class="flame" d="M88 262 Q100 305 112 262 Z" fill="#FFE66D"/>
                        <path class="part ghost" data-part="2" d="M70 190 L30 255 L72 242 Z"/>
                        <path class="part ghost" data-part="2" d="M130 190 L170 255 L128 242 Z"/>
                        <rect x="70" y="86" width="60" height="160" rx="18" fill="#dfe6e9" stroke="#b2bec3" stroke-width="3"/>
                        <path class="part ghost" data-part="0" d="M70 96 Q100 0 130 96 Z"/>
                        <circle class="part ghost" data-part="1" cx="100" cy="140" r="20"/>
                        <rect class="part ghost" data-part="3" x="78" y="244" width="44" height="20" rx="4"/>
                    </svg>
                </div>
                <div class="bay-ground"></div>
            </div>
            <div class="bay-dest" id="bay-dest"></div>
        </div>`;

    const field = shell.stage.querySelector('#bay-field');
    const pad = shell.stage.querySelector('#bay-pad');
    const rocket = shell.stage.querySelector('#bay-rocket');
    const PART_COLOURS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#a29bfe'];

    nextTarget();

    // GPC prompts blank out the sound's letters (h▢ for "hair"), so the child chooses the spelling
    // that makes the sound they hear instead of spotting matching letters.
    function renderPrompt(item) {
        const text = item.kind === 'gpc'
            ? gappedHTML(item)
            : (item.clue ? item.clue.replace('___', '<u>&nbsp;?&nbsp;</u>') : 'Listen… 👂');
        shell.prompt.innerHTML = `<span class="bay-prompt"><span class="em">${item.emoji || '🔊'}</span><span>${text}</span></span>`;
    }

    // Each word is kept on one line so a gap never wraps away from the rest of its word.
    function gappedHTML(item) {
        const words = [''];
        for (const seg of gapSegments(item)) {
            if (seg.gap !== undefined) {
                words[words.length - 1] += `<span class="bay-gap" data-fill="${seg.gap}" aria-label="gap"></span>`;
                continue;
            }
            seg.text.split(' ').forEach((part, i) => {
                if (i > 0) words.push('');
                words[words.length - 1] += part;
            });
        }
        return words.map(w => `<span class="bay-word">${w}</span>`).join(' ');
    }

    // On a correct answer the letters drop into the gaps, highlighted, linking sound to spelling.
    function fillGaps() {
        shell.prompt.querySelectorAll('.bay-gap').forEach(gap => {
            gap.textContent = gap.dataset.fill;
            gap.classList.add('filled');
            gap.removeAttribute('aria-label');
            animate(gap, [{ transform: 'translateY(-0.6em) scale(1.4)', opacity: 0 }, { transform: 'translateY(0) scale(1)', opacity: 1 }], { duration: 300, easing: 'ease-out' });
        });
    }

    function nextTarget() {
        current = targets[step];
        misses = 0;
        busy = false;
        renderPrompt(current);
        sayItem(current, { withClue: true });
        const options = shuffle([current, ...pickDistractors(current, pool, 2, words)]);
        field.innerHTML = '';
        options.forEach(item => {
            const pod = document.createElement('button');
            pod.className = 'bay-pod';
            pod.textContent = label(item);
            pod.setAttribute('aria-label', `Pod ${label(item)}`);
            field.appendChild(pod);
            makeDraggable(pod, { dropTarget: pad, onSelect: () => choose(pod, item) });
        });
        shell.setHint(() => glow(podFor(current)));
    }

    function podFor(item) {
        return [...field.children].find(p => p.textContent === label(item));
    }

    async function choose(pod, item) {
        if (busy || pod.classList.contains('dim')) return;
        if (label(item) !== label(current)) {
            sfx.boing();
            wiggle(pod);
            pod.classList.add('dim');
            if (misses === 0) recordResult(current.id, false);
            misses++;
            if (misses >= 2) glow(podFor(current));
            return;
        }
        busy = true;
        shell.clearHint();
        if (misses === 0) recordResult(current.id, true);
        fillGaps();
        sayItem(item);
        const slot = rocket.querySelector(`[data-part="${step}"]`);
        const from = pod.getBoundingClientRect();
        const to = slot.getBoundingClientRect();
        pod.style.animation = 'none';
        await animate(pod, [
            { transform: 'translate(0,0) scale(1)' },
            { transform: `translate(${to.left + to.width / 2 - from.left - from.width / 2}px, ${to.top + to.height / 2 - from.top - from.height / 2}px) scale(0.3)`, opacity: 0.2 }
        ], { duration: 550, easing: 'ease-in' });
        if (!shell.alive) return;
        pod.remove();
        sfx.lock();
        rocket.querySelectorAll(`[data-part="${step}"]`).forEach(p => {
            p.classList.remove('ghost');
            p.style.fill = PART_COLOURS[step];
            p.style.stroke = '#fff';
            animate(p, [{ transform: 'scale(0.2) rotate(-40deg)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'ease-out' });
        });
        burstAt(slot, { colors: ['#FFE66D', '#9be7ff', '#fff'], count: 14 });
        step++;
        shell.setProgress(step);
        await shell.wait(900);
        if (step < PARTS) nextTarget(); else launch();
    }

    async function launch() {
        field.innerHTML = '';
        shell.prompt.textContent = 'Ready for launch! 🚀';
        const count = document.createElement('div');
        count.className = 'bay-count';
        shell.stage.appendChild(count);
        for (const n of ['3', '2', '1']) {
            count.textContent = n;
            say(n === '3' ? 'three' : n === '2' ? 'two' : 'one', { rate: 1 });
            sfx.tick();
            animate(count, [{ transform: 'scale(1.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], 400);
            await shell.wait(900);
        }
        count.textContent = '';
        rocket.classList.add('firing');
        sfx.whoosh();
        const dest = pick(DESTINATIONS);
        say(`Blast off! ${dest.text}`);
        shell.prompt.textContent = dest.text;
        const destEl = shell.stage.querySelector('#bay-dest');
        destEl.textContent = dest.emoji;
        animate(destEl, [{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 800, delay: 400 });

        const flights = {
            moon: [{ transform: 'translate(0,0)' }, { transform: 'translate(0,-40px)', offset: 0.2 }, { transform: 'translate(40vw,-70vh) rotate(35deg) scale(0.4)' }],
            mars: [{ transform: 'translate(0,0)' }, { transform: 'translate(0,-40px)', offset: 0.2 }, { transform: 'translate(40vw,-60vh) rotate(60deg) scale(0.3)' }],
            loop: [
                { transform: 'translate(0,0) rotate(0deg)' }, { transform: 'translate(0,-200px) rotate(0deg)', offset: 0.25 },
                { transform: 'translate(120px,-300px) rotate(90deg)', offset: 0.45 }, { transform: 'translate(0,-400px) rotate(180deg)', offset: 0.6 },
                { transform: 'translate(-120px,-300px) rotate(270deg)', offset: 0.75 }, { transform: 'translate(0,-250px) rotate(360deg)', offset: 0.85 },
                { transform: 'translate(0,-90vh) rotate(360deg)' }
            ],
            asteroids: [{ transform: 'translate(0,0)' }, { transform: 'translate(-60px,-35vh) rotate(-15deg)', offset: 0.45 }, { transform: 'translate(60px,-55vh) rotate(15deg)', offset: 0.7 }, { transform: 'translate(0,-95vh)' }]
        };
        if (dest.id === 'asteroids') {
            for (let i = 0; i < 5; i++) {
                shell.later(() => {
                    const rock = document.createElement('div');
                    rock.textContent = '☄️';
                    rock.style.cssText = `position:absolute;font-size:3rem;left:${10 + Math.random() * 75}%;top:${5 + Math.random() * 40}%;`;
                    shell.stage.appendChild(rock);
                    shell.later(() => { sfx.zap(); burstAt(rock, { colors: ['#F39C12', '#FFE66D', '#fff'] }); rock.remove(); }, 450);
                }, 300 + i * 450);
            }
        }
        const lastFrame = flights[dest.id][flights[dest.id].length - 1];
        await animate(rocket, flights[dest.id], { duration: dest.id === 'loop' ? 3200 : 2600, easing: 'ease-in' });
        if (!shell.alive) return;
        rocket.style.transform = lastFrame.transform;
        burstAt(destEl, { chars: ['⭐', '✨'], count: 14 });
        await shell.wait(400);
        shell.showReward({ emoji: dest.emoji, title: dest.text, onAgain: () => initRocketBay(container, words, onBack) });
    }
}
