// Episode 3. Rules: docs/robot-stories-design.md §3. Checked by test-stories.js.
export default {
    id: 'airlift-fair',
    episode: 3,
    title: 'Airlift to the Rescue',
    cover: { bg: 'fair-day', cast: [{ id: 'airlift', x: 50, size: 80 }] },
    targets: {
        gpcs: ['air', 'ear', 'ure', 'ur', 'er'],
        words: ['children', 'the', 'said', 'some', 'was']
    },
    starWords: [
        { word: 'Airlift', robot: 'airlift' },
        { word: 'Gear', robot: 'gear' },
        { word: 'Turbo Charger', robot: 'turbo' },
        { word: 'Darkstorm', robot: 'darkstorm' },
        { word: 'Mrs Moon', emoji: '👩‍🏫' }
    ],
    crew: ['airlift', 'gear', 'turbo'],
    pages: [
        {
            sentences: ['It was the fair at Thorn Park.', 'Mrs Moon took the children to the big chair ride.'],
            scene: { bg: 'fair-day', fx: ['sparkle'], cast: [{ id: 'gear', x: 24, size: 30, anim: 'jump' }] },
            alt: 'A fun fair with a giant chair swing ride. Gear, a robot dog, bounces.'
        },
        {
            sentences: ['Up went the chairs, high into the air.', 'The children were having fun.'],
            scene: { bg: 'fair-day', cast: [{ id: 'gear', x: 74, size: 30, anim: 'bob' }] },
            alt: 'The chairs swing high in the air.'
        },
        {
            sentences: ['Gear the robot dog ran round and round with his red ball.', 'Woof! Woof!'],
            scene: { bg: 'fair-day', cast: [{ id: 'gear', x: 50, size: 40, anim: 'run', holding: 'ball' }] },
            alt: 'Gear the robot dog runs with a red ball.'
        },
        {
            sentences: ['When Darkstorm came back, he was still cross about the Pure Core.', 'His wind was so hard that the ride got stuck!'],
            scene: { bg: 'fair-storm', fx: ['rain', 'lightning'], cast: [{ id: 'darkstorm', x: 64, y: 40, size: 70, anim: 'loom' }] },
            alt: 'Darkstorm flies over the fair and blows a storm. The ride is stuck.'
        },
        {
            sentences: ['"Help! We are stuck!" said the children.', 'Gear ran faster than a mouse to ask Airlift for some help.'],
            scene: { bg: 'fair-storm', fx: ['rain', 'speed'], cast: [{ id: 'gear', x: 46, size: 34, anim: 'run' }] },
            alt: 'The children call for help. Gear races off.'
        },
        {
            sentences: ['"I can hear you, my pal!" said Airlift.', '"Have no fear, I am coming!"'],
            scene: { bg: 'moon-port', cast: [{ id: 'gear', x: 26, size: 32, anim: 'jump' }, { id: 'airlift', x: 64, size: 80 }] },
            alt: 'Gear reaches Airlift, a white and orange robot with a rotor on her back.'
        },
        {
            sentences: ['Airlift ran out of her house on the hill.', '"Airlift, transform!"'],
            scene: { bg: 'moon-port', cast: [{ id: 'airlift', x: 50, size: 84 }] },
            interaction: { type: 'transform', robot: 'airlift', label: 'Tap to transform!' },
            alt: 'Airlift is ready to transform into a helicopter.'
        },
        {
            sentences: ['Whirr! Her rotor spun, and she flew up under the chairs.', 'She got all the children down, safe and secure.'],
            scene: { bg: 'fair-storm', fx: ['rain'], cast: [{ id: 'airlift', mode: 'vehicle', x: 50, y: 46, size: 42, anim: 'hover' }] },
            alt: 'Airlift the helicopter lifts the children safely down.'
        },
        {
            sentences: ['Then Turbo Charger zoomed in with a burst of speed.', '"Go away, Darkstorm!" he said, and Darkstorm turned and shot off.'],
            scene: { bg: 'fair-storm', fx: ['speed'], cast: [{ id: 'turbo', mode: 'vehicle', x: 30, size: 40, anim: 'drive' }, { id: 'darkstorm', x: 82, y: 45, size: 50, anim: 'flyoff' }] },
            alt: 'Turbo Charger, a racing car, zooms in. Darkstorm flies away.'
        },
        {
            sentences: ['"Would you like some pure, cool water?" asked Mrs Moon.', '"Yes, and some oil for your robots!" said the children.'],
            scene: { bg: 'fair-day', fx: ['sparkle'], cast: [{ id: 'airlift', x: 22, size: 74, anim: 'bob' }, { id: 'turbo', x: 54, size: 72 }, { id: 'gear', x: 84, size: 32, anim: 'jump' }] },
            alt: 'Airlift, Turbo Charger and Gear celebrate at the fair.'
        }
    ],
    quiz: { question: 'Who got the children down?', answer: 'airlift', options: ['darkstorm', 'airlift', 'gear'] }
};
