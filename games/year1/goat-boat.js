// Game 6: "Goat Boat" — read and write 'oa' words to sail the goat across the moat to the castle.
// Rounds take turns: READ (word shown, tap its picture) and WRITE (picture shown, add the letters round 'oa').
import { label, findItem } from '../../phonics/curriculum.js';
import { buildPool, targetSequence, shuffle, recordResult } from '../../phonics/practice.js';
import { createShell, sayItem, say, sfx, wiggle, burstAt, glow, pick, animate } from '../../phonics/engine.js';

const ROUNDS = 4;
const SOUND = 'oa';
const DEFAULTS = ['w-goat', 'w-boat', 'w-coat', 'w-road', 'w-soap', 'w-loaf', 'w-toad', 'w-coal', 'w-goal', 'w-foam', 'w-moat'];
const LETTERS = 'bcdfglmprst';
const FINALES = [
    { id: 'bridge', text: 'The drawbridge is down!', emoji: '🏰' },
    { id: 'fireworks', text: 'Castle fireworks!', emoji: '🎆' },
    { id: 'toad', text: 'Toad jumped aboard!', emoji: '🐸' },
    { id: 'splash', text: 'Big splash!', emoji: '💦' }
];

// 'goat' → ['g', 'oa', 't']: the sound stays one tile, every other letter is its own tile.
export function wordTiles(text) {
    return text.split(new RegExp(`(${SOUND})`)).filter(Boolean).flatMap(part => part === SOUND ? [part] : [...part]);
}

export function initGoatBoat(container, words, onBack) {
    // Only words with the sound and a real picture (typed words only have a ⭐).
    const { items: pool, usingDefaults } = buildPool({
        words, accepts: i => i.kind === 'word' && i.word.includes(SOUND) && !i.mine, defaults: DEFAULTS, minDistinct: 3
    });
    const targets = targetSequence(pool, ROUNDS);
    const spares = DEFAULTS.map(id => findItem(id)).filter(Boolean);
    let step = 0;
    let misses = 0;
    let firstTries = 0;
    let busy = true;
    let current = null;
    let mode = 'read';

    const shell = createShell(container, {
        theme: 'moat', title: 'Goat Boat', goal: ROUNDS, onBack,
        practising: pool, usingDefaults,
        onSpeak: () => current && speakPrompt()
    });

    shell.stage.innerHTML = `
        <style>
            .gb { display: flex; flex-direction: column; align-items: center; gap: 1rem; height: 100%; }
            .gb-river { position: relative; width: 100%; max-width: 760px; height: clamp(90px, 16vh, 130px); border-radius: 24px; overflow: hidden;
                background: repeating-linear-gradient(100deg, #1e88e5 0 28px, #2196f3 28px 56px); box-shadow: inset 0 6px 18px rgba(0,0,0,0.35); }
            .gb-stop { position: absolute; bottom: 10%; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: #fff; opacity: 0.5; }
            .gb-stop.passed { background: #FFE66D; opacity: 1; box-shadow: 0 0 10px #FFE66D; }
            .gb-castle { position: absolute; right: 2%; bottom: 8%; font-size: clamp(3rem, 11vw, 4.6rem); transform-origin: bottom center; }
            .gb-boat { position: absolute; left: 4%; bottom: 6%; font-size: clamp(2.6rem, 9vw, 3.8rem); transition: left 1s cubic-bezier(.4,1.3,.5,1); animation: gbBob 2.4s ease-in-out infinite; white-space: nowrap; }
            .gb-boat .rider { font-size: 0.6em; position: relative; left: -0.6em; top: -0.3em; }
            @keyframes gbBob { 0%,100% { translate: 0 0; rotate: -2deg; } 50% { translate: 0 -6px; rotate: 2deg; } }
            .gb-card { width: 100%; max-width: 760px; box-sizing: border-box; padding: 1rem; border-radius: 24px; background: rgba(255,255,255,0.92); color: #2F3542;
                box-shadow: 0 8px 0 rgba(0,0,0,0.2); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
            .gb-sign { font-size: clamp(3rem, 14vw, 5rem); font-weight: 900; letter-spacing: 0.04em; padding: 0.1rem 1.4rem; border-radius: 20px; background: #fff8dc; border: 5px solid #8d6e63; }
            .gb-oa { color: #e17055; text-decoration: underline; text-decoration-thickness: 0.08em; text-underline-offset: 0.12em; }
            .gb-sign.done, .gb-slots.done { box-shadow: 0 0 0 6px #FFE66D, 0 0 30px #FFE66D; }
            .gb-row { display: flex; gap: clamp(0.6rem, 3vw, 1.4rem); justify-content: center; flex-wrap: wrap; }
            .gb-pic { width: clamp(96px, 26vw, 140px); aspect-ratio: 1; border-radius: 26px; border: 5px solid #74b9ff; background: #eaf4ff; font-size: clamp(3.4rem, 12vw, 5rem);
                cursor: pointer; box-shadow: 0 7px 0 #0984e3; font-family: inherit; }
            .gb-pic:active, .gb-tile:active { transform: translateY(4px); box-shadow: 0 2px 0 #0984e3; }
            .gb-pic.dim, .gb-tile.dim { opacity: 0.35; }
            .gb-picture { font-size: clamp(4rem, 16vw, 6rem); line-height: 1; cursor: pointer; background: none; border: none; }
            .gb-slots { display: flex; gap: 0.4rem; padding: 0.4rem; border-radius: 18px; }
            .gb-slot { min-width: 1.4em; height: 1.5em; padding: 0 0.1em; border-bottom: 6px solid #2F3542; font-size: clamp(2.8rem, 12vw, 4.4rem); font-weight: 900; text-align: center; line-height: 1.4; }
            .gb-slot.oa { color: #e17055; border-bottom-color: #e17055; }
            .gb-slot.next { border-bottom-color: #0984e3; background: rgba(116,185,255,0.25); border-radius: 10px 10px 0 0; }
            .gb-tile { width: clamp(72px, 18vw, 92px); aspect-ratio: 1; border-radius: 20px; border: 5px solid #74b9ff; background: #fff; color: #2F3542; font-family: inherit;
                font-size: clamp(2.4rem, 9vw, 3.2rem); font-weight: 900; cursor: pointer; box-shadow: 0 7px 0 #0984e3; }
            .gb-pop { font-weight: 900; font-size: clamp(1.2rem, 4.5vw, 1.6rem); color: #e17055; min-height: 1.6em; }
            .gb-toad { position: absolute; left: 30%; top: -10%; font-size: 2.6rem; }
        </style>
        <div class="gb">
            <div class="gb-river" id="gb-river" aria-label="The moat">
                ${Array.from({ length: ROUNDS }, (_, i) => `<span class="gb-stop" style="left:${stopLeft(i + 1) + 6}%"></span>`).join('')}
                <span class="gb-castle" id="gb-castle" aria-hidden="true">🏰</span>
                <span class="gb-boat" id="gb-boat" aria-label="Goat in a boat">⛵<span class="rider">🐐</span></span>
            </div>
            <div class="gb-card" id="gb-card"></div>
        </div>`;

    const river = shell.stage.querySelector('#gb-river');
    const boat = shell.stage.querySelector('#gb-boat');
    const castle = shell.stage.querySelector('#gb-castle');
    const card = shell.stage.querySelector('#gb-card');

    nextRound();

    function stopLeft(n) {
        return 4 + n * (70 / ROUNDS);
    }

    // The word with its 'oa' marked, built with DOM nodes so typed text is never treated as HTML.
    function markSound(el, text) {
        text.split(new RegExp(`(${SOUND})`)).filter(Boolean).forEach(part => {
            if (part === SOUND) {
                const s = document.createElement('span');
                s.className = 'gb-oa';
                s.textContent = part;
                el.appendChild(s);
            } else el.appendChild(document.createTextNode(part));
        });
    }

    // READ rounds never say the word (that would skip the reading); WRITE rounds say it, as the worksheet's picture does.
    function speakPrompt() {
        if (mode === 'read') say('Read the word. Find its picture!');
        else sayItem(current);
    }

    function nextRound() {
        current = targets[step];
        mode = step % 2 === 0 ? 'read' : 'write';
        misses = 0;
        card.innerHTML = '';
        if (mode === 'read') buildRead(); else buildWrite();
        speakPrompt();
        animate(card, [{ transform: 'scale(0.9)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, fill: 'none' });
        busy = false;
    }

    // Two other pictures, from 'oa' words where possible, so only reading the whole word tells them apart.
    function otherPictures() {
        const out = [];
        for (const item of [...shuffle(pool), ...shuffle(spares)]) {
            if (out.length >= 2) break;
            if (label(item) === label(current) || item.emoji === current.emoji) continue;
            if (!out.some(o => label(o) === label(item) || o.emoji === item.emoji)) out.push(item);
        }
        return out;
    }

    // READ: the word is on a sign; tap the picture that goes with it.
    function buildRead() {
        shell.prompt.textContent = 'Read it 👀 Find the picture';
        const sign = document.createElement('div');
        sign.className = 'gb-sign';
        sign.setAttribute('aria-label', 'Word to read');
        markSound(sign, label(current));
        const row = document.createElement('div');
        row.className = 'gb-row';
        card.append(sign, row);
        const pop = document.createElement('div');
        pop.className = 'gb-pop';
        card.appendChild(pop);
        shuffle([current, ...otherPictures()]).forEach((item, i) => {
            const pic = document.createElement('button');
            pic.className = 'gb-pic';
            pic.textContent = item.emoji;
            pic.dataset.word = label(item);
            pic.setAttribute('aria-label', `Picture ${i + 1}`);
            pic.addEventListener('click', () => choosePicture(pic, item, sign, pop));
            row.appendChild(pic);
        });
        shell.setHint(() => glow(row.querySelector(`[data-word="${label(current)}"]`)));
    }

    async function choosePicture(pic, item, sign, pop) {
        if (busy || pic.classList.contains('dim')) return;
        if (label(item) !== label(current)) {
            // Name the picture they picked so they hear it isn't the word on the sign. No penalty.
            sfx.boing();
            wiggle(pic);
            pic.classList.add('dim');
            say(label(item));
            pop.textContent = `That's ${label(item)}. Read the sign again!`;
            missed();
            if (misses >= 2) glow(card.querySelector(`[data-word="${label(current)}"]`));
            return;
        }
        busy = true;
        shell.clearHint();
        pop.textContent = '';
        sign.classList.add('done');
        burstAt(pic, { chars: [current.emoji, '✨'], count: 10 });
        await win(sign);
    }

    // WRITE: the picture is shown and spoken; 'oa' is already in place, add the other letters in order.
    function buildWrite() {
        shell.prompt.textContent = 'Write it ✏️ Fill in the letters';
        const picture = document.createElement('button');
        picture.className = 'gb-picture';
        picture.textContent = current.emoji;
        picture.setAttribute('aria-label', 'Hear the word');
        picture.addEventListener('click', () => sayItem(current));
        const slots = document.createElement('div');
        slots.className = 'gb-slots';
        slots.setAttribute('aria-label', 'Letters of the word');
        const parts = wordTiles(label(current));
        parts.forEach(part => {
            const slot = document.createElement('span');
            slot.className = 'gb-slot';
            slot.dataset.want = part;
            if (part === SOUND) { slot.textContent = part; slot.classList.add('oa', 'filled'); }
            slots.appendChild(slot);
        });
        const row = document.createElement('div');
        row.className = 'gb-row';
        card.append(picture, slots, row);

        const needed = parts.filter(p => p !== SOUND);
        const decoys = shuffle([...LETTERS].filter(l => !needed.includes(l))).slice(0, 2);
        shuffle([...needed, ...decoys]).forEach(letter => {
            const tile = document.createElement('button');
            tile.className = 'gb-tile';
            tile.textContent = letter;
            tile.setAttribute('aria-label', `Letter ${letter}`);
            tile.addEventListener('click', () => placeLetter(tile, slots));
            row.appendChild(tile);
        });
        markNext(slots);
        shell.setHint(() => glow(tileFor(slots)));
    }

    function nextSlot(slots) {
        return slots.querySelector('.gb-slot:not(.filled)');
    }

    function markNext(slots) {
        slots.querySelectorAll('.gb-slot').forEach(s => s.classList.remove('next'));
        nextSlot(slots)?.classList.add('next');
    }

    function tileFor(slots) {
        const want = nextSlot(slots)?.dataset.want;
        return [...card.querySelectorAll('.gb-tile')].find(t => t.style.visibility !== 'hidden' && t.textContent === want);
    }

    async function placeLetter(tile, slots) {
        const slot = nextSlot(slots);
        if (busy || !slot || tile.style.visibility === 'hidden') return;
        if (tile.textContent !== slot.dataset.want) {
            // The letter may belong in a later slot, so it wiggles back rather than being dimmed.
            sfx.boing();
            wiggle(tile);
            wiggle(slot);
            missed();
            if (misses >= 2) glow(tileFor(slots));
            return;
        }
        sfx.clink();
        slot.textContent = tile.textContent;
        slot.classList.add('filled');
        tile.style.visibility = 'hidden';
        animate(slot, [{ transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 250, fill: 'none' });
        markNext(slots);
        if (nextSlot(slots)) return;
        busy = true;
        shell.clearHint();
        slots.classList.add('done');
        await win(slots);
    }

    function missed() {
        if (misses === 0) recordResult(current.id, false);
        misses++;
    }

    // Read it again to check: the finished word is said while it glows, then the boat sails on.
    async function win(wordEl) {
        if (misses === 0) { recordResult(current.id, true); firstTries++; }
        sfx.lock();
        sayItem(current);
        burstAt(wordEl, { colors: ['#FFE66D', '#e17055', '#fff'], count: 16 });
        step++;
        shell.setProgress(step);
        if (misses > 0) shell.pips[step - 1].classList.add('silver');
        await shell.wait(700);
        sfx.whoosh();
        boat.style.left = `${stopLeft(step)}%`;
        river.querySelectorAll('.gb-stop').forEach((s, i) => s.classList.toggle('passed', i < step));
        await shell.wait(1300);
        if (step < ROUNDS) nextRound(); else complete();
    }

    async function complete() {
        card.innerHTML = '';
        const finale = pick(FINALES);
        shell.prompt.textContent = finale.text;
        sfx.powerUp();
        if (finale.id === 'bridge') {
            await animate(castle, [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1.25)' }], 900);
            sfx.slam();
        } else if (finale.id === 'fireworks') {
            for (let i = 0; i < 3; i++) {
                burstAt(castle, { chars: ['🎆', '✨', '🎇'], count: 10, spread: 180 });
                sfx.spark();
                await shell.wait(450);
            }
        } else if (finale.id === 'toad') {
            const toad = document.createElement('span');
            toad.className = 'gb-toad';
            toad.textContent = '🐸';
            boat.appendChild(toad);
            await animate(toad, [{ transform: 'translate(160px, -40px)' }, { transform: 'translate(80px, -110px)' }, { transform: 'translate(0, 0)' }], { duration: 900, easing: 'ease-out' });
        } else {
            burstAt(boat, { chars: ['💦', '💧'], count: 18, spread: 160 });
            await animate(boat, [{ transform: 'translateY(0)' }, { transform: 'translateY(-40px) rotate(-10deg)' }, { transform: 'translateY(0)' }], 800);
        }
        say(finale.text);
        await shell.wait(1200);
        if (!shell.alive) return;
        shell.showReward({
            emoji: finale.emoji,
            title: finale.text,
            subtitle: firstTries ? '⭐'.repeat(firstTries) : '',
            forceSticker: firstTries === ROUNDS,
            onAgain: () => initGoatBoat(container, words, onBack)
        });
    }
}
