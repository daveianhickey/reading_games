// Robot Stories, in reading order. Each episode unlocks when the one before it is finished.
// To add a story: see "Adding a Robot Story" in CLAUDE.md.
import torchDarkStorm from './episodes/torch-dark-storm.js';
import hookStuckBus from './episodes/hook-stuck-bus.js';
import airliftFair from './episodes/airlift-fair.js';

export const STORIES = [torchDarkStorm, hookStuckBus, airliftFair];
