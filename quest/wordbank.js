// Torch Quest wrong-plate word bank. These words are NEVER the answer: they are not taught,
// not spoken as targets, not scored and not from the school's lists. Target words (what he
// learns) come only from the curriculum, in WORLDS in quest/content.js. See
// docs/torch-quest-design.md §4 "Two kinds of words" and §5a.
//
// The bank exists so every wrong plate can start like the target and be the same length
// (and end the same where possible). Rules for adding a word: a real, everyday word a
// 5-year-old might meet; decodable (every word must pass whyReadable in stories/decodable.js,
// checked by test-quest.js); nothing rude, scary or adult; not a sound-alike of a target (add
// the pair to HOMOPHONES); lower case. Add words when a target has too few partners: the tests
// list any 3+ letter target that has to borrow alien words. Removing words is safe too.
export const WORD_BANK = [
    // a
    'am', 'an', 'as', 'at', 'add', 'and', 'ant', 'arm', 'art', 'acted', 'added', 'aimed',
    // b
    'by', 'bad', 'bag', 'bat', 'bed', 'bet', 'bib', 'big', 'bin', 'bit', 'box', 'bud', 'bug', 'bun',
    'band', 'bang', 'bank', 'bark', 'barn', 'bash', 'bath', 'beds', 'beef', 'been', 'beep', 'bees',
    'bell', 'belt', 'bend', 'bent', 'best', 'bill', 'bird', 'boat', 'book', 'boot', 'bull', 'bump',
    'bunk', 'burn', 'bush', 'bangs', 'barks', 'bells', 'bench', 'bikes', 'bites', 'boats', 'bones',
    'books', 'boots', 'boxes', 'brick', 'brush', 'bumps', 'bunch', 'bunks', 'batter', 'bitter',
    'branch', 'bricks', 'brings', 'brunch', 'butter', 'button', 'blaster', 'blister', 'bouncer',
    // c
    'can', 'cap', 'cat', 'cob', 'cog', 'cot', 'cub', 'cup', 'cake', 'camp', 'cane', 'cape', 'cash',
    'chap', 'chat', 'chin', 'chip', 'chug', 'chum', 'cone', 'cube', 'cute', 'champ', 'charm', 'chart',
    'check', 'cheek', 'cheer', 'chess', 'chick', 'chill', 'chimp', 'clock', 'cloud', 'count', 'crowd',
    'carpet', 'charms', 'chests', 'chirps', 'chunks', 'clutch', 'cooker', 'copper', 'cotton', 'crunch',
    'cutter', 'chatting', 'checking', 'cheering', 'chickens', 'chomping', 'chopping',
    // d
    'dad', 'den', 'did', 'dig', 'dim', 'dip', 'dog', 'dot', 'dug', 'damp', 'dart', 'deep', 'dent',
    'desk', 'dirt', 'dish', 'dock', 'drip', 'drop', 'drum', 'duck', 'dusk', 'drank', 'dress', 'drift',
    'drill',
    // f
    'fan', 'fat', 'fed', 'fig', 'fin', 'fit', 'fog', 'fox', 'fun', 'farm', 'film', 'fish', 'fist',
    'foam', 'fool', 'flash', 'flock', 'fluff', 'fresh', 'frost', 'farmer', 'fatter', 'fender',
    'filler', 'finger',
    // g
    'gap', 'gas', 'get', 'got', 'gum', 'gun', 'gasp', 'gift', 'glad', 'goal', 'goat', 'golf', 'grab',
    'grin', 'gull', 'gulp',
    // h
    'ham', 'hat', 'hen', 'hip', 'hit', 'hop', 'hot', 'hug', 'hum', 'hut', 'hand', 'help', 'hike',
    'hill', 'hint', 'hole', 'home', 'hoot', 'hope', 'hose', 'hunt', 'hush', 'hands', 'harsh', 'hills',
    'hoops', 'hunts', 'hutch', 'hamper', 'hitter', 'hopper', 'hotter', 'hunter',
    // i
    'if', 'in', 'is', 'it', 'imps', 'inch', 'inks', 'itch',
    // j
    'jam', 'jar', 'jet', 'jog', 'jug', 'jail', 'jams', 'jump', 'junk',
    // l
    'lap', 'leg', 'let', 'lid', 'lip', 'lit', 'log', 'lot', 'lake', 'lamp', 'lane', 'lend', 'lick',
    'lift', 'lime', 'line', 'lock', 'long', 'loop', 'lost', 'lots', 'luck', 'lump', 'lands', 'latch',
    'later', 'lemon', 'lever', 'licks', 'lifts', 'liner', 'lucky', 'lumps', 'ladder', 'lesson',
    'letter', 'lifted', 'litter',
    // m
    'man', 'map', 'mat', 'met', 'mix', 'mop', 'mud', 'mug', 'mash', 'melt', 'mess', 'milk', 'mint',
    'mist', 'moon', 'moss', 'march', 'marsh', 'match', 'mists', 'mount', 'mouth', 'mulch',
    // n
    'no', 'nap', 'net', 'nip', 'nod', 'nut', 'nail', 'neck', 'nest', 'next', 'noon', 'nails', 'nests',
    'north', 'notch',
    // o
    'on', 'or', 'ox', 'oak', 'odd', 'off', 'owl', 'own',
    // p
    'pad', 'pan', 'pat', 'pen', 'pet', 'pig', 'pin', 'pit', 'pod', 'pot', 'pup', 'pain', 'park',
    'pass', 'pill', 'pine', 'pink', 'pipe', 'plum', 'pole', 'pond', 'puff', 'pump', 'paper', 'pinch',
    'plant', 'pouch', 'pound', 'print', 'proud', 'punch', 'pepper', 'pickle', 'pillow', 'puddle',
    'purple',
    // r
    'rag', 'ram', 'rat', 'red', 'rip', 'rob', 'rot', 'rug', 'run', 'raft', 'rail', 'rest', 'ring',
    'rock', 'rush', 'rings', 'roast', 'rocks', 'rusty',
    // s
    'sad', 'sat', 'sip', 'sit', 'sob', 'sun', 'sack', 'sand', 'sang', 'sent', 'sing', 'slip', 'slug',
    'soap', 'sock', 'song', 'soon', 'spot', 'step', 'stop', 'swim', 'shark', 'shelf', 'shift', 'shock',
    'smell', 'snack', 'sniff', 'snore', 'spell', 'spill', 'stamp', 'stick', 'sting', 'stock', 'stuck',
    'shrimp', 'shrunk', 'silver', 'sister', 'splash', 'sprint', 'stamps', 'starts', 'stings', 'stitch',
    'string', 'summit', 'sunset', 'supper',
    // t
    'tag', 'tan', 'tap', 'ten', 'tin', 'tip', 'top', 'tub', 'tug', 'tell', 'tent', 'them', 'tick',
    'tilt', 'torn', 'toss', 'tram', 'tuck', 'tusk', 'thank', 'theft', 'thick', 'thing', 'tiger',
    'timer', 'toast', 'track', 'trick', 'trunk', 'twist',
    // u
    'up', 'us', 'unfit', 'unzip', 'upset',
    // v
    'van', 'vent', 'vest', 'vets',
    // w
    'wag', 'wax', 'web', 'wet', 'wig', 'win', 'went', 'west', 'whip', 'whiz', 'wind', 'wink', 'wish',
    'with', 'wafer', 'wells', 'whisk', 'wider', 'wings', 'winks', 'wiser', 'witch',
    // y
    'yak', 'yam', 'yap', 'yes', 'yet', 'yaks', 'yarn', 'yell', 'yelp',
    // z
    'zaps', 'zest', 'zinc', 'zips', 'zone',
    // Same start, length and last letter as a target (buses / boxes), so first + last letter
    // + length is not a shortcut either.
    'tie', 'toe', 'tips', 'tubs', 'tins', 'taps', 'tops', 'tags', 'tugs', 'tens', 'toad', 'tend', 'pool',
    'peel', 'week', 'wick', 'leash', 'lurch', 'tramp', 'tulip', 'ruin', 'tidy', 'tiny', 'tray', 'least',
    'hash', 'moist', 'ape', 'ace', 'age', 'axe', 'moan', 'mean', 'beam', 'clean', 'crown', 'reel',
    'real', 'token', 'bucket', 'basket', 'feast', 'fleet', 'robot', 'reef', 'fond', 'feed', 'worn',
    'warn', 'stir', 'pick', 'pack', 'pork', 'wide', 'wipe', 'wave', 'self', 'oat', 'grid',
    'weed', 'wand', 'side', 'safe', 'save', 'steam', 'teach', 'trash', 'sheep', 'sleep', 'strap', 'cork',
    'tribe', 'trade', 'corn', 'peer', 'sell', 'seal', 'poker', 'upper', 'usher', 'ark', 'strand',
    'hedge', 'hinge', 'mince'
];
