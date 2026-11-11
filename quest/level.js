// Torch Quest course generator: where the gaps, crates, bolts and gates are.
// Units are canvas pixels in the 400×225 view (see runner.js).
export const GROUND_Y = 180;

export function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function buildCourse(seed, gateCount = 8, checkpointAfter = 4) {
    const rng = mulberry32(seed);
    const gaps = [], crates = [], bolts = [], gates = [];
    const bolt = (x, y) => bolts.push({ x, y, taken: false });
    let x = 240;
    let checkpointX = null;
    for (let g = 0; g < gateCount; g++) {
        const features = 3 + (rng() < 0.5 ? 1 : 0);
        for (let f = 0; f < features; f++) {
            x += 150 + rng() * 70;
            const r = rng();
            if (r < 0.3) {
                gaps.push({ x, w: 30 });
                bolt(x - 4, GROUND_Y - 34); bolt(x + 15, GROUND_Y - 46); bolt(x + 34, GROUND_Y - 34);
                x += 30;
            } else if (r < 0.6) {
                crates.push({ x });
                bolt(x + 8, GROUND_Y - 46);
                x += 16;
            } else if (r < 0.8) {
                for (let i = 0; i < 4; i++) bolt(x + i * 18, GROUND_Y - 10);
                x += 72;
            } else {
                for (let i = 0; i < 3; i++) bolt(x + i * 18, GROUND_Y - 42);
                x += 54;
            }
        }
        x += 190; // flat run-up so he is on the ground when the gate arrives
        gates.push({ x, open: false });
        x += 60;
        if (g + 1 === checkpointAfter) { checkpointX = x + 40; x += 80; }
    }
    const flagX = x + 160;
    return { gaps, crates, bolts, gates, checkpointX, flagX, length: flagX + 240 };
}
