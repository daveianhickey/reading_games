// Torch Quest rewards (pure logic): the mystery crate at the flag. See design §13b.
// Variable rewards keep ADHD attention: usually bolts, sometimes a lot, sometimes a sticker.
// Bosses always give a sticker (or a big bolt pile once every sticker is owned).

export function rollCrate({ stars = 1, boss = false, rng = Math.random } = {}) {
    if (boss) return { kind: 'sticker' };
    const r = rng();
    const stickerChance = stars >= 3 ? 0.3 : 0.15; // careful play pays better
    if (r < stickerChance) return { kind: 'sticker' };
    if (r < stickerChance + 0.15) return { kind: 'bolts', amount: 25, big: true };
    if (r < stickerChance + 0.5) return { kind: 'bolts', amount: 10 };
    return { kind: 'bolts', amount: 5 };
}

// What a sticker crate gives when every sticker is already owned.
export const STICKER_FALLBACK_BOLTS = 30;
