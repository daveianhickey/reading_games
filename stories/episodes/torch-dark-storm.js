// Episode 1. Rules: docs/robot-stories-design.md §3. Checked by test-stories.js.
// Scene: bg = background image id (public/stories/bg/<id>.webp); cast = robots drawn in SVG
// on top (x/y = % of stage from left/bottom, size = % of stage height, mode robot|vehicle);
// fx = overlay effects (rain, lightning, speed, zap, sparkle, night).
export default {
    id: 'torch-dark-storm',
    episode: 1,
    title: 'Torch and the Dark Storm',
    cover: { bg: 'park-storm', cast: [{ id: 'torch', x: 50, size: 78 }] },
    targets: {
        gpcs: ['ar', 'or', 'igh', 'ch', 'nk'],
        words: ['the', 'was', 'said', 'he', 'out', 'of']
    },
    starWords: [
        { word: 'Torch', robot: 'torch' },
        { word: 'Clunk', robot: 'clunk' },
        { word: 'Darkstorm', robot: 'darkstorm' },
        { word: 'robot', emoji: '🤖' },
        { word: 'Thorn Park', emoji: '🏙️' },
        { word: 'Pure Core', emoji: '💎' }
    ],
    crew: ['torch', 'clunk'],
    pages: [
        {
            sentences: ['This is Torch.', 'He is a robot, and he can turn into a red car!'],
            scene: { bg: 'park-day', cast: [{ id: 'torch', x: 50, size: 80, anim: 'bob' }] },
            alt: 'Torch, a big red robot, waves in a sunny park.'
        },
        {
            sentences: ['His pal is Clunk.', 'He is little, but he is very strong.'],
            scene: { bg: 'park-day', cast: [{ id: 'torch', x: 30, size: 76 }, { id: 'clunk', x: 68, size: 52, anim: 'jump' }] },
            alt: 'Torch stands next to Clunk, a little yellow robot, who jumps up and down.'
        },
        {
            sentences: ['One night, a dark storm came to Thorn Park with hard rain and loud wind.'],
            scene: { bg: 'park-storm', fx: ['rain', 'lightning'], cast: [{ id: 'torch', x: 28, size: 72 }, { id: 'clunk', x: 62, size: 50, anim: 'shake' }] },
            alt: 'Rain and lightning over the park at night. Clunk is shaking.'
        },
        {
            sentences: ['It was Darkstorm, with sharp claws and bright green lights!'],
            scene: { bg: 'park-storm', fx: ['rain', 'lightning'], cast: [{ id: 'darkstorm', x: 50, size: 88, anim: 'loom' }] },
            alt: 'Darkstorm, a purple and black robot with claws and green eyes, looms in the storm.'
        },
        {
            sentences: ['"I want all the power!" said Darkstorm.', 'He shot out into the night with the Pure Core.'],
            scene: { bg: 'park-storm', fx: ['rain'], cast: [{ id: 'darkstorm', x: 70, size: 70, anim: 'flyoff', holding: 'core' }, { id: 'clunk', x: 24, size: 48, anim: 'shake' }] },
            alt: 'Darkstorm flies away holding a glowing blue crystal.'
        },
        {
            sentences: ['"Oh no!" said Clunk.', '"What should we do, Torch?"'],
            scene: { bg: 'park-storm', fx: ['rain'], cast: [{ id: 'clunk', x: 40, size: 56, anim: 'shake' }, { id: 'torch', x: 72, size: 76 }] },
            alt: 'Clunk looks worried. Torch stands next to him.'
        },
        {
            sentences: ['Torch stood up tall.', '"Torch, transform!"'],
            scene: { bg: 'park-storm', fx: ['rain'], cast: [{ id: 'torch', x: 50, size: 84 }] },
            interaction: { type: 'transform', robot: 'torch', label: 'Tap to transform!' },
            alt: 'Torch stands tall, ready to transform into a car.'
        },
        {
            sentences: ['Zoom! Torch shot out of the park as fast as the wind.'],
            scene: { bg: 'road-night', fx: ['speed', 'rain'], cast: [{ id: 'torch', mode: 'vehicle', x: 50, size: 44, anim: 'drive' }] },
            alt: 'Torch is a red car with flashing lights, racing along a road.'
        },
        {
            sentences: ['Darkstorm was on top of the tower.', '"You cannot get me!" he said.'],
            scene: { bg: 'tower-night', fx: ['lightning'], cast: [{ id: 'darkstorm', x: 58, size: 86, anim: 'loom', holding: 'core' }, { id: 'torch', mode: 'vehicle', x: 18, size: 30 }] },
            alt: 'Darkstorm stands on top of a tall tower, holding the crystal. Torch the car is far below.'
        },
        {
            sentences: ['Zap! Torch shot a beam of light, and Darkstorm fell with a clank.'],
            scene: { bg: 'tower-night', fx: ['zap'], cast: [{ id: 'torch', x: 22, size: 72 }, { id: 'darkstorm', x: 72, size: 74, anim: 'fall' }] },
            alt: 'Torch fires a beam of light. Darkstorm tumbles over.'
        },
        {
            sentences: ['He let go of the Pure Core, and Clunk got it back.', '"You are the best!" said Clunk.'],
            scene: { bg: 'park-sunrise', fx: ['sparkle'], cast: [{ id: 'clunk', x: 36, size: 54, anim: 'jump', holding: 'core' }, { id: 'torch', x: 70, size: 78 }] },
            alt: 'Clunk jumps for joy holding the crystal. Torch smiles.'
        },
        {
            sentences: ['The children came out to play.', 'But far off in the dark, Darkstorm was making a new plan…'],
            scene: { bg: 'park-sunrise', cast: [{ id: 'torch', x: 30, size: 74, anim: 'bob' }, { id: 'clunk', x: 58, size: 50 }, { id: 'darkstorm', x: 90, y: 55, size: 22, anim: 'lurk' }] },
            alt: 'The heroes in the park at sunrise. Far away, Darkstorm peeks out.'
        }
    ],
    quiz: { question: 'Who took the Pure Core?', answer: 'darkstorm', options: ['torch', 'darkstorm', 'clunk'] }
};
