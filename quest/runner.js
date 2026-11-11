// Torch Quest runner: the side-scrolling part. Torch runs on his own, one tap jumps.
// Bumps and falls only spill bolts; hearts are decided by the word gates (run.js).
import { GROUND_Y } from './level.js';

export const VIEW = { w: 400, h: 225 };
const SPEED = 110;
const GRAVITY = 720;
const JUMP_V = -265;
const GATE_STOP = 52;   // Torch stops this far in front of a gate
const COYOTE = 0.09;    // seconds after running off an edge when a jump still counts
const BUFFER = 0.14;    // a tap just before landing still jumps

// 12×16 pixel maps. R red, D dark red, Y yellow, B visor, K dark, G grey.
const BODY = [
    '...RRRRRR...',
    '..RRRRRRRR..',
    '..RBBBBBBR..',
    '..RBKBBKBR..',
    '..RRRRRRRR..',
    '...GGGGGG...',
    '.YRRRRRRRRY.',
    'YYRRRYYRRRYY',
    'G.RRRYYRRR.G',
    'G.RRRRRRRR.G',
    '..RRRRRRRR..',
    '..DDDDDDDD..'
];
const LEGS = {
    stand: ['..GG....GG..', '..GG....GG..', '.KKK....KKK.', '.KKK....KKK.'],
    runA: ['..GG...GG...', '.GG.....GG..', 'KKK.....KKK.', '............'],
    runB: ['...GG..GG...', '...GG..GG...', '..KKK..KKK..', '..KKK..KKK..'],
    jump: ['..GG....GG..', '.KKK....KKK.', '............', '............']
};
const COLORS = { R: '#e8402f', D: '#9c1f1a', Y: '#ffd23f', B: '#7fe3ff', K: '#1d2433', G: '#9aa5b1' };

function drawSprite(ctx, rows, x, y, scale = 2) {
    rows.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
            const col = COLORS[row[c]];
            if (!col) continue;
            ctx.fillStyle = col;
            ctx.fillRect(x + c * scale, y + r * scale, scale, scale);
        }
    });
}

const hash = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

export function createGame({ course, canvas, hooks = {}, autoJump = false }) {
    let ctx = null;
    try { ctx = canvas?.getContext?.('2d') || null; } catch (e) { ctx = null; }
    const torch = { x: 60, y: GROUND_Y, vy: 0, grounded: true };
    let mode = 'run'; // 'run' | 'gate' | 'finish'
    let gateI = 0, time = 0, knock = 0, blink = 0, sinceGround = 0, jumpBuffer = 0;
    let raf = null, last = 0;

    const game = {
        bolts: 0,
        torch,
        get mode() { return mode; },
        get gateIndex() { return gateI; },

        jump() { if (mode === 'run') jumpBuffer = BUFFER; },

        // Called once the gate's question is over (right or wrong): the door opens.
        openGate() {
            if (course.gates[gateI]) course.gates[gateI].open = true;
            gateI++;
            if (mode === 'gate') mode = 'run';
        },

        toCheckpoint(checkpointAfter) {
            gateI = checkpointAfter;
            course.gates.forEach((g, i) => { g.open = i < checkpointAfter; });
            Object.assign(torch, { x: course.checkpointX, y: GROUND_Y, vy: 0, grounded: true });
            knock = 0; blink = 1; mode = 'run';
        },

        step(dt) {
            time += dt;
            if (mode !== 'run') return;
            blink = Math.max(0, blink - dt);
            jumpBuffer = Math.max(0, jumpBuffer - dt);
            if (knock > 0) { knock -= dt; torch.x -= 90 * dt; } else torch.x += SPEED * dt;

            if (autoJump && torch.grounded) {
                const ahead = torch.x + 14;
                if (course.gaps.some(g => !g.bridged && ahead > g.x && torch.x < g.x) || course.crates.some(c => !c.broken && ahead + 8 > c.x && torch.x < c.x)) jumpBuffer = BUFFER;
            }
            if (jumpBuffer > 0 && (torch.grounded || sinceGround < COYOTE) && torch.vy >= 0) {
                torch.vy = JUMP_V; torch.grounded = false; sinceGround = COYOTE; jumpBuffer = 0;
                hooks.onJump?.();
            }

            const prevY = torch.y;
            torch.vy += GRAVITY * dt;
            torch.y += torch.vy * dt;
            const gap = course.gaps.find(g => !g.bridged && torch.x > g.x + 3 && torch.x < g.x + g.w - 3);
            if (torch.y >= GROUND_Y) {
                if (!gap && prevY <= GROUND_Y + 1) {
                    torch.y = GROUND_Y; torch.vy = 0; torch.grounded = true; sinceGround = 0;
                } else {
                    torch.grounded = false;
                    if (gap) torch.x = Math.min(torch.x, gap.x + gap.w - 4);
                    if (torch.y > VIEW.h + 40) {
                        const g = gap || course.gaps.reduce((a, b) => (Math.abs(b.x - torch.x) < Math.abs(a.x - torch.x) ? b : a));
                        Object.assign(torch, { x: g.x - 55, y: GROUND_Y, vy: 0, grounded: true });
                        blink = 1;
                        spill(3);
                        // Two falls and Clunk drops a plank over it: jumping never blocks the reading.
                        g.falls = (g.falls || 0) + 1;
                        if (g.falls >= 2) g.bridged = true;
                    }
                }
            } else {
                torch.grounded = false;
                sinceGround += dt;
            }

            for (const c of course.crates) {
                if (c.broken || torch.x + 7 <= c.x || torch.x - 7 >= c.x + 16 || torch.y <= GROUND_Y - 16) continue;
                if (torch.vy > 0 && prevY <= GROUND_Y - 13) {
                    torch.y = GROUND_Y - 16; torch.vy = -170; // hop off the top
                } else if (knock <= 0) {
                    knock = 0.35;
                    spill(2);
                    c.hits = (c.hits || 0) + 1;
                    if (c.hits >= 2) c.broken = true; // second bump smashes it
                }
            }

            for (const b of course.bolts) {
                if (b.taken || Math.abs(b.x - torch.x) > 13 || Math.abs(b.y - (torch.y - 14)) > 17) continue;
                b.taken = true;
                game.bolts++;
                hooks.onBolt?.(game.bolts);
            }

            const gate = course.gates[gateI];
            if (gate && !gate.open && torch.x >= gate.x - GATE_STOP) {
                torch.x = gate.x - GATE_STOP;
                if (torch.grounded) { mode = 'gate'; hooks.onGate?.(gateI); }
            }
            if (torch.x >= course.flagX) { mode = 'finish'; hooks.onFinish?.(); }
        },

        render() {
            if (!ctx) return;
            const cam = Math.max(0, torch.x - 90);
            ctx.imageSmoothingEnabled = false;
            // Sky
            const bands = ['#2b3a67', '#3f5490', '#6a7fb5', '#f2a65a', '#f7c98b'];
            bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * 36, VIEW.w, 36); });
            ctx.fillStyle = '#ffe9a8'; ctx.fillRect(300, 96, 28, 28);
            // Far scrap heaps and near cranes (parallax)
            layer(cam * 0.2, 46, '#3b3f63', 20, 70);
            layer(cam * 0.5, 34, '#2a2d48', 12, 46);
            // Ground
            ctx.fillStyle = '#4a3b35'; ctx.fillRect(0, GROUND_Y, VIEW.w, VIEW.h - GROUND_Y);
            ctx.fillStyle = '#8d6e52'; ctx.fillRect(0, GROUND_Y, VIEW.w, 4);
            ctx.fillStyle = '#3a2e2a';
            for (let x = -(cam % 16); x < VIEW.w; x += 16) ctx.fillRect(Math.floor(x), GROUND_Y + 4, 1, VIEW.h);
            for (const g of course.gaps) {
                const x = Math.floor(g.x - cam);
                if (x > VIEW.w || x + g.w < 0) continue;
                if (g.bridged) { ctx.fillStyle = '#141826'; ctx.fillRect(x, GROUND_Y + 3, g.w, VIEW.h); ctx.fillStyle = '#b5793a'; ctx.fillRect(x - 2, GROUND_Y, g.w + 4, 3); continue; }
                ctx.fillStyle = '#141826'; ctx.fillRect(x, GROUND_Y, g.w, VIEW.h - GROUND_Y);
                ctx.fillStyle = '#f2a65a'; ctx.fillRect(x - 2, GROUND_Y, 2, 4); ctx.fillRect(x + g.w, GROUND_Y, 2, 4);
            }
            for (const c of course.crates) {
                const x = Math.floor(c.x - cam);
                if (c.broken || x > VIEW.w || x < -16) continue;
                ctx.fillStyle = '#b5793a'; ctx.fillRect(x, GROUND_Y - 16, 16, 16);
                ctx.fillStyle = '#6e4520';
                ctx.fillRect(x, GROUND_Y - 16, 16, 2); ctx.fillRect(x, GROUND_Y - 2, 16, 2);
                ctx.fillRect(x, GROUND_Y - 16, 2, 16); ctx.fillRect(x + 14, GROUND_Y - 16, 2, 16);
                for (let i = 0; i < 10; i++) { ctx.fillRect(x + 3 + i, GROUND_Y - 13 + i, 1, 1); ctx.fillRect(x + 12 - i, GROUND_Y - 13 + i, 1, 1); }
            }
            for (const b of course.bolts) {
                const x = Math.floor(b.x - cam);
                if (b.taken || x > VIEW.w || x < -8) continue;
                const y = Math.floor(b.y + Math.sin(time * 5 + b.x) * 2);
                ctx.fillStyle = '#ffd23f'; ctx.fillRect(x - 4, y - 2, 8, 5); ctx.fillRect(x - 2, y - 4, 5, 9);
                ctx.fillStyle = '#b8860b'; ctx.fillRect(x - 1, y - 1, 3, 3);
            }
            if (course.checkpointX !== null) flag(course.checkpointX - cam, 30, '#4fd1ff');
            flag(course.flagX - cam + 10, 56, '#7CFC8A');
            course.gates.forEach(g => {
                const x = Math.floor(g.x - cam);
                if (x > VIEW.w + 20 || x < -30) return;
                g.lift = Math.min(64, (g.lift || 0) + (g.open ? 3 : 0));
                ctx.fillStyle = '#59627a'; ctx.fillRect(x - 3, GROUND_Y - 80, 4, 80); ctx.fillRect(x + 15, GROUND_Y - 80, 4, 80);
                ctx.fillRect(x - 3, GROUND_Y - 84, 22, 6);
                ctx.fillStyle = g.open ? '#7CFC8A' : '#ff5d5d'; ctx.fillRect(x + 5, GROUND_Y - 83, 6, 4);
                const top = GROUND_Y - 74 - g.lift, h = 74 - Math.max(0, g.lift - 10);
                ctx.fillStyle = '#aab3c5'; ctx.fillRect(x + 1, top, 14, h);
                ctx.fillStyle = '#ffd23f';
                for (let y = top + 6; y < top + h - 4; y += 12) ctx.fillRect(x + 1, y, 14, 4);
                ctx.fillStyle = '#59627a'; ctx.fillRect(x + 1, top, 14, 2);
            });
            // Torch
            if (blink <= 0 || Math.floor(time * 12) % 2) {
                const legs = !torch.grounded ? LEGS.jump : mode !== 'run' ? LEGS.stand : Math.floor(time * 10) % 2 ? LEGS.runA : LEGS.runB;
                drawSprite(ctx, [...BODY, ...legs], Math.floor(torch.x - cam - 12), Math.floor(torch.y - 32));
            }
        },

        start() {
            const loop = now => {
                const dt = Math.min(0.05, (now - last) / 1000 || 0);
                last = now;
                // Fixed small steps keep the physics the same on slow phones.
                for (let left = dt; left > 0; left -= 1 / 120) game.step(Math.min(left, 1 / 120));
                game.render();
                raf = requestAnimationFrame(loop);
            };
            last = typeof performance !== 'undefined' ? performance.now() : 0;
            raf = requestAnimationFrame(loop);
        },

        stop() { if (raf !== null) cancelAnimationFrame(raf); raf = null; }
    };

    function spill(n) {
        const lost = Math.min(n, game.bolts);
        game.bolts -= lost;
        hooks.onBump?.(lost);
    }

    function layer(offset, step, color, minH, maxH) {
        ctx.fillStyle = color;
        const first = Math.floor(offset / step);
        for (let i = first - 1; i < first + VIEW.w / step + 2; i++) {
            const h = minH + hash(i * 3.1 + step) * (maxH - minH);
            const w = step * (0.5 + hash(i * 7.7) * 0.6);
            ctx.fillRect(Math.floor(i * step - offset), Math.floor(GROUND_Y - h), Math.ceil(w), Math.ceil(h));
            if (hash(i * 13.3 + step) > 0.8) ctx.fillRect(Math.floor(i * step - offset + w / 2), Math.floor(GROUND_Y - h - 14), 2, 14);
        }
    }

    function flag(sx, height, color) {
        const x = Math.floor(sx);
        if (x > VIEW.w + 20 || x < -30) return;
        ctx.fillStyle = '#e9edf5'; ctx.fillRect(x, GROUND_Y - height, 2, height);
        ctx.fillStyle = color; ctx.fillRect(x + 2, GROUND_Y - height, 16, 10);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 2, GROUND_Y - height + 7, 16, 3);
    }

    return game;
}
