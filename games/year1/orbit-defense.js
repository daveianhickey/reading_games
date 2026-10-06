// Game 4: "Orbit Defender: GPC Defence" — swing the matching grapheme on the shield ring into the asteroid's path.
import { label, gapSegments, keyWord } from '../../phonics/curriculum.js';
import { buildPool, pickDistractors, targetSequence, shuffle, recordResult } from '../../phonics/practice.js';
import { createShell, sayItem, say, sfx, wiggle, burstAt, glow, pick, animate } from '../../phonics/engine.js';

const ASTEROIDS = 5;
const NODES = 3;
const SUPER_AT = 4;
const DEFAULTS = ['ay', 'ou', 'ie', 'ea', 'oy', 'ir', 'aw', 'ph', 'ew'];
const FINALES = [
    { id: 'hyper', text: 'Hyper-drive!' },
    { id: 'fireworks', text: 'Space fireworks!' },
    { id: 'rainbow', text: 'Rainbow shield!' }
];

export function initOrbitDefense(container, words, onBack) {
    const { items: pool, usingDefaults } = buildPool({ words, accepts: i => i.kind === 'gpc', defaults: DEFAULTS });
    const targets = targetSequence(pool, ASTEROIDS);
    let cleared = 0;
    let current = null;
    let nodeItems = [];
    let ringAngle = 0;
    let busy = true;
    let misses = 0;
    let firstTries = 0;
    let streak = 0;

    const shell = createShell(container, {
        theme: 'space', title: 'Orbit Defender', goal: ASTEROIDS, onBack,
        practising: pool, usingDefaults,
        onSpeak: () => current && sayItem(current)
    });

    shell.stage.innerHTML = `
        <style>
            .orb { position: relative; width: min(92vw, 480px, 62vh); aspect-ratio: 1; margin: 0 auto; }
            .orb-base { position: absolute; left: 50%; top: 64%; width: 24%; aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%;
                background: radial-gradient(circle at 35% 35%, #fdfdfd, #b8c2cc 60%, #7f8c8d); box-shadow: 0 0 40px rgba(155,231,255,0.5); display: flex; align-items: center; justify-content: center; font-size: 2.6rem; }
            .orb-ring { position: absolute; left: 50%; top: 64%; width: 60%; aspect-ratio: 1; transform: translate(-50%, -50%) rotate(0deg); border-radius: 50%;
                border: 6px dashed rgba(155,231,255,0.45); transition: transform 0.45s cubic-bezier(.3,1.4,.5,1); }
            .orb-node { position: absolute; width: 30%; aspect-ratio: 1; margin: -15% 0 0 -15%; border-radius: 50%; border: 5px solid #9be7ff; background: #1b2a6b;
                color: #fff; font-family: inherit; font-weight: 800; font-size: clamp(1.6rem, 6vw, 2.6rem); cursor: pointer; box-shadow: 0 0 18px rgba(155,231,255,0.7); transition: transform 0.45s cubic-bezier(.3,1.4,.5,1), background 0.2s; }
            .orb-node.top { background: #2d4fd6; border-color: #FFE66D; box-shadow: 0 0 24px #FFE66D; }
            .orb-lane { position: absolute; left: 50%; top: 0; height: 30%; width: 0; border-left: 4px dotted rgba(255,230,109,0.4); }
            .orb-rock { position: absolute; left: 50%; top: 0; width: 22%; aspect-ratio: 1; margin-left: -11%; border-radius: 45% 55% 50% 50%; background: radial-gradient(circle at 30% 30%, #a1887f, #6d4c41 70%);
                display: flex; align-items: center; justify-content: center; font-size: clamp(2rem, 8vw, 3.2rem); box-shadow: 0 0 20px rgba(255,120,0,0.5); z-index: 3; }
            .orb-phrase { display: inline-flex; gap: 0.6rem; align-items: center; background: rgba(255,255,255,0.15); border-radius: 40px; padding: 0.3rem 1.2rem; }
            /* The letters that make the sound are underlined in the shield colour, to match against the ring. */
            .orb-sound { text-decoration: underline; text-decoration-color: #FFE66D; text-decoration-thickness: 0.14em; text-underline-offset: 0.18em; color: #FFE66D; }
            .orb-sound.lit { text-shadow: 0 0 14px #FFE66D, 0 0 4px #fff; }
            .orb-streak { position: absolute; left: 50%; top: 64%; width: 3px; height: 40px; background: linear-gradient(#fff, transparent); transform-origin: top center; pointer-events: none; }
            .orb.rainbow .orb-ring { border-style: solid; border-color: #ff6b6b #ffe66d #4ecdc4 #a29bfe; animation: spinRing 0.6s linear 4; }
            @keyframes spinRing { to { transform: translate(-50%, -50%) rotate(360deg); } }
            /* After a wrong hit the shield recharges briefly: guessing every option is slower than thinking. */
            .orb.recharging .orb-ring { opacity: 0.35; filter: grayscale(1); transition: opacity 0.2s; }
            .orb.recharging .orb-node { cursor: wait; }
            .orb-pop { position: absolute; left: 50%; top: 8%; transform: translateX(-50%); z-index: 5; pointer-events: none; white-space: nowrap;
                font-weight: 900; font-size: clamp(1.4rem, 5vw, 2rem); color: #FFE66D; text-shadow: 0 0 14px rgba(255,230,109,0.9), 0 2px 0 #000; }
            .orb-pop.plain { color: #dfe6e9; text-shadow: 0 2px 0 #000; font-size: clamp(1.1rem, 4vw, 1.5rem); }
        </style>
        <div class="orb" id="orb">
            <div class="orb-lane"></div>
            <div class="orb-ring" id="orb-ring">
                ${Array.from({ length: NODES }, (_, i) => {
                    const a = (i * 360 / NODES) * Math.PI / 180;
                    return `<button class="orb-node" data-i="${i}" style="left:${50 + 50 * Math.sin(a)}%; top:${50 - 50 * Math.cos(a)}%;"></button>`;
                }).join('')}
            </div>
            <div class="orb-base" aria-label="Moon base">🏠</div>
            <div class="orb-rock" id="orb-rock" aria-hidden="true"></div>
        </div>`;

    const orb = shell.stage.querySelector('#orb');
    const ring = shell.stage.querySelector('#orb-ring');
    const rock = shell.stage.querySelector('#orb-rock');
    const nodes = [...shell.stage.querySelectorAll('.orb-node')];

    nodes.forEach((node, i) => node.addEventListener('click', () => {
        if (busy) return;
        busy = true;
        rotateTo(i);
        shell.later(() => { busy = false; fire(); }, 480);
    }));
    shell.onKey = e => {
        if (busy) return;
        if (e.key === 'ArrowLeft') rotateBy(1);
        else if (e.key === 'ArrowRight') rotateBy(-1);
        else if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest?.('button')) { e.preventDefault(); fire(); }
    };

    nextAsteroid();

    function topIndex() {
        const steps = Math.round(-ringAngle / (360 / NODES));
        return ((steps % NODES) + NODES) % NODES;
    }

    function applyRing() {
        ring.style.transform = `translate(-50%, -50%) rotate(${ringAngle}deg)`;
        const top = topIndex();
        nodes.forEach((n, i) => {
            n.style.transform = `rotate(${-ringAngle}deg)`;
            n.classList.toggle('top', i === top);
        });
    }

    function rotateBy(dir) {
        ringAngle += dir * 360 / NODES;
        sfx.flip();
        applyRing();
        sayItem(nodeItems[topIndex()]);
    }

    function rotateTo(i) {
        // Shortest turn that brings node i to the top.
        const want = -i * 360 / NODES;
        let delta = ((want - ringAngle) % 360 + 540) % 360 - 180;
        ringAngle += delta;
        if (delta !== 0) sfx.flip();
        applyRing();
    }

    async function nextAsteroid() {
        current = targets[cleared];
        misses = 0;
        busy = true;
        // Place the target away from the top so the ring has to move.
        const others = pickDistractors(current, pool, NODES - 1, words);
        const top = topIndex();
        const slots = shuffle([...Array(NODES).keys()].filter(i => i !== top));
        nodeItems = [];
        nodeItems[slots[0]] = current;
        [top, ...slots.slice(1)].forEach((slot, k) => { nodeItems[slot] = others[k]; });
        nodes.forEach((n, i) => {
            n.textContent = label(nodeItems[i]);
            n.setAttribute('aria-label', `Shield ${label(nodeItems[i])}`);
        });
        applyRing();

        rock.textContent = current.emoji || '☄️';
        const phrase = gapSegments(current).map(seg => seg.gap !== undefined ? `<span class="orb-sound">${seg.gap}</span>` : seg.text).join('');
        shell.prompt.innerHTML = `<span class="orb-phrase"><span style="font-size:2.4rem">${current.emoji || '☄️'}</span><span>${phrase}</span></span>`;
        await animate(rock, [{ transform: 'translateY(-120%) rotate(-30deg)', opacity: 0 }, { transform: 'translateY(0) rotate(0deg)', opacity: 1 }], { duration: 900, easing: 'ease-out' });
        if (!shell.alive) return;
        sayItem(current);
        busy = false;
        shell.setHint(() => glow(nodes[nodeItems.indexOf(current)]));
    }

    async function fire() {
        if (busy) return;
        busy = true;
        shell.clearHint();
        const hit = nodeItems[topIndex()];
        const impact = [{ transform: 'translateY(0)' }, { transform: 'translateY(80%)' }];
        await animate(rock, impact, { duration: 300, easing: 'ease-in' });
        if (!shell.alive) return;
        if (label(hit) === label(current)) {
            cleared++;
            shell.setProgress(cleared);
            if (misses === 0) {
                // First try: the full blast, a gold pip and a streak — thinking it through pays best.
                recordResult(current.id, true);
                firstTries++;
                streak++;
                sfx.zap();
                burstAt(rock, { colors: ['#FFE66D', '#fff', '#9be7ff', '#F39C12'], count: 26, spread: 180 });
                burstAt(rock, { chars: ['✨', '⭐'], count: 8, spread: 120 });
                popText(streak >= 2 ? `⭐ First try! 🔥 ${streak} in a row!` : '⭐ First try!');
            } else {
                // Found after a guess: the asteroid still goes, but only fizzles, and the pip is silver.
                streak = 0;
                shell.pips[cleared - 1].classList.add('silver');
                sfx.zap();
                burstAt(rock, { colors: ['#95a5a6', '#bdc3c7'], count: 8, spread: 70, size: 7 });
                popText('Got it!', true);
            }
            animate(rock, [{ transform: 'translateY(80%) scale(1)', opacity: 1 }, { transform: 'translateY(80%) scale(1.8)', opacity: 0 }], 250);
            // Say the key word that carries the sound ("shirt!") while its underlined letters light up.
            say(keyWord(current));
            shell.prompt.querySelectorAll('.orb-sound').forEach(el => {
                el.classList.add('lit');
                animate(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 500, fill: 'none' });
            });
            await shell.wait(1200);
            if (cleared >= ASTEROIDS) finale(); else nextAsteroid();
        } else {
            if (misses === 0) recordResult(current.id, false);
            misses++;
            streak = 0;
            sfx.boing();
            wiggle(nodes[topIndex()]);
            orb.classList.add('recharging');
            await animate(rock, [{ transform: 'translateY(80%)' }, { transform: 'translateY(-10%)' }, { transform: 'translateY(0)' }], { duration: 500, easing: 'ease-out' });
            await shell.wait(1000);
            if (!shell.alive) return;
            orb.classList.remove('recharging');
            busy = false;
            sayItem(current);
            if (misses >= 2) glow(nodes[nodeItems.indexOf(current)]);
            shell.setHint(() => glow(nodes[nodeItems.indexOf(current)]));
        }
    }

    function popText(text, plain = false) {
        const el = document.createElement('div');
        el.className = `orb-pop${plain ? ' plain' : ''}`;
        el.textContent = text;
        orb.appendChild(el);
        animate(el, [{ transform: 'translate(-50%, 20px) scale(0.6)', opacity: 0 }, { transform: 'translate(-50%, 0) scale(1.1)', opacity: 1, offset: 0.25 },
            { transform: 'translate(-50%, -10px) scale(1)', opacity: 1, offset: 0.75 }, { transform: 'translate(-50%, -30px)', opacity: 0 }], { duration: 1100 }).then(() => el.remove());
        shell.later(() => el.remove(), 1300);
    }

    async function finale() {
        busy = true;
        // Four or more first-try hits earns the super finale (every effect) and a guaranteed sticker.
        const superRound = firstTries >= SUPER_AT;
        const f = superRound ? { id: 'super', text: 'Super Defender!' } : pick(FINALES);
        shell.prompt.textContent = `${f.text} 🌟`;
        say(`Wave cleared! ${f.text}`);
        sfx.powerUp();
        // Laser defence grid sweep.
        for (let i = 0; i < 12; i++) {
            const beam = document.createElement('div');
            beam.className = 'orb-streak';
            beam.style.background = 'linear-gradient(#FF6B6B, transparent)';
            beam.style.height = '60%';
            orb.appendChild(beam);
            animate(beam, [{ transform: `rotate(${i * 30}deg) scaleY(0)`, opacity: 1 }, { transform: `rotate(${i * 30 + 60}deg) scaleY(1)`, opacity: 0 }], { duration: 900, delay: i * 40 });
        }
        await shell.wait(900);
        if (f.id === 'rainbow' || f.id === 'super') {
            orb.classList.add('rainbow');
            sfx.fanfare();
        }
        if (f.id === 'fireworks' || f.id === 'super') {
            for (let i = 0; i < 6; i++) shell.later(() => {
                const r = orb.getBoundingClientRect();
                burstAt({ getBoundingClientRect: () => ({ left: r.left + Math.random() * r.width, top: r.top + Math.random() * r.height * 0.6, width: 0, height: 0 }) }, { count: 24, spread: 120 });
                sfx.spark();
            }, i * 280);
        }
        if (f.id === 'hyper' || f.id === 'super') {
            sfx.whoosh();
            for (let i = 0; i < 40; i++) {
                const s = document.createElement('div');
                s.className = 'orb-streak';
                orb.appendChild(s);
                const angle = Math.random() * 360;
                animate(s, [{ transform: `rotate(${angle}deg) translateY(0) scaleY(0.2)`, opacity: 0 }, { transform: `rotate(${angle}deg) translateY(260px) scaleY(3)`, opacity: 1 }], { duration: 600, delay: Math.random() * 1200, easing: 'ease-in' });
            }
        }
        await shell.wait(2000);
        shell.showReward({
            emoji: superRound ? '🏅' : '🛡️',
            title: f.text,
            subtitle: `${'⭐'.repeat(firstTries)}${'☆'.repeat(ASTEROIDS - firstTries)}<br><small>${firstTries} first-try hit${firstTries === 1 ? '' : 's'}${superRound ? '' : ` · get ${SUPER_AT} for a Super finale!`}</small>`,
            forceSticker: superRound,
            onAgain: () => initOrbitDefense(container, words, onBack)
        });
    }
}
