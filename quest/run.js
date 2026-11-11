// One attempt at a Torch Quest level (pure logic): hearts, gates, checkpoint, stars.
// See docs/torch-quest-design.md §5 and §7. The canvas runner (runner.js) only decides
// *when* a gate is reached; everything that decides winning or losing is here.
import { buildGate } from './gates.js';
import { itemState, recordAnswer, pickGateItems, GATES_PER_LEVEL } from './mastery.js';

export const MAX_HEARTS = 3;
export const HEAL_STREAK = 5;
export const CHECKPOINT_AFTER = GATES_PER_LEVEL / 2;
const CHECKPOINT_MIN_HEARTS = 2;

export function createRun({ levelIndex, state, rng = Math.random, now = () => Date.now(), checkpoint = true }) {
    const items = pickGateItems(levelIndex, state, rng, now());
    const positions = []; // last correct plate positions, to stop "always the middle one"
    let gate = null;

    const run = {
        hearts: MAX_HEARTS,
        gateIndex: 0,
        streak: 0,
        status: 'running', // 'running' | 'down' | 'done'
        stars: 0,
        usedCheckpoint: false,
        checkpointHearts: 0,
        missed: [],   // words answered wrong this attempt
        promoted: [], // { word, tier }
        results: [],  // true / false per gate, for the progress pips
        total: GATES_PER_LEVEL,

        currentGate() {
            if (!gate && run.status === 'running') {
                const item = items[run.gateIndex];
                const n = positions.length;
                const avoid = n >= 2 && positions[n - 1] === positions[n - 2] ? positions[n - 1] : -1;
                gate = buildGate(item, itemState(state, item.id).tier, rng, avoid);
                positions.push(gate.correctIndex);
            }
            return gate;
        },

        // One answer per gate: right or wrong, the gate is finished.
        answer(index) {
            const g = run.currentGate();
            if (!g) return null;
            const correct = index === g.correctIndex;
            const rec = recordAnswer(state, g.item.id, correct, now());
            const out = { correct, correctIndex: g.correctIndex, word: g.word, healed: false, promoted: rec.promoted, demoted: rec.demoted, tier: rec.tier };
            run.results[run.gateIndex] = correct;
            if (correct) {
                run.streak++;
                if (rec.promoted) run.promoted.push({ word: g.word, tier: rec.tier });
                if (run.streak % HEAL_STREAK === 0 && run.hearts < MAX_HEARTS) { run.hearts++; out.healed = true; }
            } else {
                run.streak = 0;
                run.hearts--;
                if (!run.missed.includes(g.word)) run.missed.push(g.word);
                // The missed word comes back two gates later, with new plates.
                const back = run.gateIndex + 2;
                if (back < items.length && items[back - 1].id !== g.item.id) items[back] = g.item;
            }
            gate = null;
            run.gateIndex++;
            if (run.hearts <= 0) {
                run.status = 'down';
            } else if (run.gateIndex >= items.length) {
                run.status = 'done';
                run.stars = run.usedCheckpoint ? 1 : run.hearts;
            } else if (run.gateIndex === CHECKPOINT_AFTER) {
                run.checkpointHearts = run.hearts;
            }
            out.down = run.status === 'down';
            out.done = run.status === 'done';
            out.hearts = run.hearts;
            return out;
        },

        // After powering down past the mid-level flag, he may go back to it once per attempt.
        canContinue() {
            return checkpoint && run.status === 'down' && !run.usedCheckpoint && run.gateIndex > CHECKPOINT_AFTER;
        },

        continueFromCheckpoint() {
            if (!run.canContinue()) return false;
            run.usedCheckpoint = true;
            run.hearts = Math.max(run.checkpointHearts, CHECKPOINT_MIN_HEARTS);
            run.gateIndex = CHECKPOINT_AFTER;
            run.results.length = CHECKPOINT_AFTER;
            run.streak = 0;
            run.status = 'running';
            gate = null;
            return true;
        }
    };
    return run;
}

// "Overheat": spots hammering. Three taps while the plates are locked, or two answers in a
// row faster than anyone can read, makes Torch stop and cool down.
export const TOO_FAST_MS = 400;
export function createTapGuard() {
    let fastInARow = 0;
    return {
        check(lockedTaps, msAfterUnlock) {
            fastInARow = msAfterUnlock < TOO_FAST_MS ? fastInARow + 1 : 0;
            if (lockedTaps >= 3 || fastInARow >= 2) { fastInARow = 0; return true; }
            return false;
        }
    };
}
