// Episode 2. Rules: docs/robot-stories-design.md §3. Checked by test-stories.js.
export default {
    id: 'hook-stuck-bus',
    episode: 2,
    title: 'Hook and the Stuck Bus',
    cover: { bg: 'road-mud', cast: [{ id: 'hook', x: 50, size: 80 }] },
    targets: {
        gpcs: ['oo-book', 'oo-spoon', 'ai', 'th', 'oi'],
        words: ['buses', 'push', 'pull', 'people', 'the', 'his']
    },
    starWords: [
        { word: 'Hook', robot: 'hook' },
        { word: 'Clunk', robot: 'clunk' },
        { word: 'Boiler', robot: 'boiler' },
        { word: 'Mr Bolt', emoji: '🧑‍✈️' },
        { word: 'Thorn Park', emoji: '🏙️' }
    ],
    crew: ['hook', 'boiler'],
    pages: [
        {
            sentences: ['This is Hook.', 'He can pull cars, vans and buses with his big hook.'],
            scene: { bg: 'park-day', cast: [{ id: 'hook', x: 50, size: 82, anim: 'bob' }] },
            alt: 'Hook, a big blue robot with a crane hook on his arm, in a sunny town.'
        },
        {
            sentences: ['Mr Bolt has three red buses.', 'The people love their buses.'],
            scene: { bg: 'park-day', cast: [{ id: 'bus', x: 34, size: 40, anim: 'drive' }, { id: 'hook', x: 78, size: 70 }] },
            alt: 'A red bus drives through the park. Hook watches.'
        },
        {
            sentences: ['One day, it rained and rained, and a bus got stuck in thick mud.'],
            scene: { bg: 'road-mud', fx: ['rain'], cast: [{ id: 'bus', x: 48, size: 40, anim: 'stuck' }] },
            alt: 'The red bus is stuck in deep mud on a rainy road.'
        },
        {
            sentences: ['The people in the bus could not get out.', '"Help!" they shouted.', '"Pull us out!"'],
            scene: { bg: 'road-mud', fx: ['rain'], cast: [{ id: 'bus', x: 48, size: 40, anim: 'stuck' }] },
            alt: 'People wave from the windows of the stuck bus.'
        },
        {
            sentences: ['Boiler sat on a rock and looked down.', '"Ha! That bus will be stuck there for good!" he said.'],
            scene: { bg: 'road-mud', fx: ['rain'], cast: [{ id: 'boiler', x: 76, y: 22, size: 58, anim: 'bob' }, { id: 'bus', x: 30, size: 36, anim: 'stuck' }] },
            alt: 'Boiler, a grumpy green steam-tank robot, laughs from a rock.'
        },
        {
            sentences: ['"Come on, Clunk, push!" said Hook.', 'Clunk did push and push, but the bus was still stuck.'],
            scene: { bg: 'road-mud', fx: ['rain'], cast: [{ id: 'bus', x: 42, size: 36, anim: 'stuck' }, { id: 'clunk', x: 74, size: 46, anim: 'push' }, { id: 'hook', x: 90, size: 64 }] },
            alt: 'Clunk pushes the bus with all his might. It does not move.'
        },
        {
            sentences: ['Hook had a good plan.', '"Hook, transform!"'],
            scene: { bg: 'road-mud', fx: ['rain'], cast: [{ id: 'hook', x: 50, size: 84 }] },
            interaction: { type: 'transform', robot: 'hook', label: 'Tap to transform!' },
            alt: 'Hook is ready to transform into a tow truck.'
        },
        {
            sentences: ['Zoom! Hook put his chain on the bus.', '"Pull, pull, pull!" said the people.'],
            scene: { bg: 'road-mud', fx: ['rain'], cast: [{ id: 'hook', mode: 'vehicle', x: 72, size: 42, anim: 'pull' }, { id: 'bus', x: 30, size: 36, anim: 'stuck' }], chain: true },
            alt: 'Hook the tow truck pulls the bus with a chain.'
        },
        {
            sentences: ['Boom! The bus shot out of the mud.', 'Boiler was so cross that he fell off his rock. Splat!'],
            scene: { bg: 'road-mud', fx: ['sparkle'], cast: [{ id: 'bus', x: 36, size: 38, anim: 'pop' }, { id: 'boiler', x: 80, size: 50, anim: 'fall' }] },
            alt: 'The bus pops out of the mud. Boiler falls into a puddle.'
        },
        {
            sentences: ['"Thank you, Hook!" they said.', 'Then Hook and Clunk had a cool oil drink.'],
            scene: { bg: 'park-sunrise', fx: ['sparkle'], cast: [{ id: 'hook', x: 34, size: 76, anim: 'bob', holding: 'oil' }, { id: 'clunk', x: 66, size: 50, anim: 'jump', holding: 'oil' }] },
            alt: 'Hook and Clunk cheer with cans of oil.'
        }
    ],
    quiz: { question: 'Who pulled the bus out of the mud?', answer: 'hook', options: ['boiler', 'clunk', 'hook'] }
};
