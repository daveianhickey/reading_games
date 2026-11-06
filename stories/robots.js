// Robot Stories cast, drawn as SVG so every robot looks the same on every page and can
// really transform (robot mode <-> vehicle mode). Backgrounds are images; robots sit on top.
// Original characters. Style: chunky, rounded, one main colour each, glowing eyes and core.

export const ROBOTS = {
    torch: { name: 'Torch', main: '#E53935', dark: '#8E1B1B', trim: '#ECEFF1', glow: '#4FC3F7', eye: '#4FC3F7', head: 'crest', chest: 'windows', extras: ['lightbar', 'wheels'], vehicle: 'car' },
    clunk: { name: 'Clunk', main: '#FFC107', dark: '#B07800', trim: '#37474F', glow: '#FF7043', eye: '#00E5FF', head: 'round', chest: 'grille', extras: ['bucket'], vehicle: 'digger' },
    hook: { name: 'Hook', main: '#1E6FD9', dark: '#0D3C7A', trim: '#FFB300', glow: '#FFB300', eye: '#FFEB3B', head: 'square', chest: 'grille', extras: ['hook', 'beacon'], vehicle: 'tow' },
    airlift: { name: 'Airlift', main: '#F5F5F5', dark: '#90A4AE', trim: '#FF6D00', glow: '#00E5FF', eye: '#00B0FF', head: 'crest', chest: 'windows', extras: ['rotor'], vehicle: 'heli' },
    turbo: { name: 'Turbo Charger', main: '#CFD8DC', dark: '#546E7A', trim: '#E53935', glow: '#FF1744', eye: '#FF1744', head: 'crest', chest: 'stripe', extras: ['spoiler', 'wheels'], vehicle: 'racer' },
    darkstorm: { name: 'Darkstorm', main: '#5E1F9E', dark: '#1A0033', trim: '#212121', glow: '#76FF03', eye: '#76FF03', head: 'horns', chest: 'vents', extras: ['wings', 'claws'], vehicle: 'jet', mood: 'cross' },
    boiler: { name: 'Boiler', main: '#558B2F', dark: '#2E4A1A', trim: '#8D6E63', glow: '#FF9800', eye: '#FF9800', head: 'square', chest: 'vents', extras: ['chimneys'], vehicle: 'tank', mood: 'cross' },
    gear: { name: 'Gear', main: '#26C6DA', dark: '#00838F', trim: '#FFCA28', glow: '#FFCA28', eye: '#FFEB3B', kind: 'dog' },
    bus: { name: 'bus', main: '#E53935', dark: '#8E1B1B', kind: 'bus' }
};

// Robots the learner can collect (the Robot Crew).
export const CREW = ['torch', 'clunk', 'hook', 'boiler', 'airlift', 'gear', 'turbo'];

export function hasVehicle(id) {
    return Boolean(ROBOTS[id]?.vehicle);
}

let uid = 0;
const JOINT = '#37474F';
const GLASS = '#B3E5FC';

function gradient(id, r) {
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="${r.main}" stop-opacity="1"/><stop offset="0.15" stop-color="${r.main}"/>
        <stop offset="1" stop-color="${r.dark}"/></linearGradient>
        <radialGradient id="${id}-glow"><stop offset="0" stop-color="#fff"/><stop offset="0.35" stop-color="${r.glow}"/><stop offset="1" stop-color="${r.glow}" stop-opacity="0"/></radialGradient>`;
}

function prop(kind, x, y) {
    if (kind === 'core') return `<g class="rb-prop" transform="translate(${x} ${y})"><circle r="22" fill="#00E5FF" opacity="0.35"/><path d="M0 -16 L12 0 L0 16 L-12 0Z" fill="#80DEEA" stroke="#fff" stroke-width="2"/><path d="M0 -16 L4 0 L0 16" fill="#E0F7FA" opacity="0.8"/></g>`;
    if (kind === 'oil') return `<g class="rb-prop" transform="translate(${x} ${y})"><rect x="-10" y="-14" width="20" height="28" rx="4" fill="#FF7043" stroke="#BF360C" stroke-width="2"/><rect x="-10" y="-4" width="20" height="8" fill="#FFE082"/><rect x="-3" y="-19" width="6" height="6" fill="#9E9E9E"/></g>`;
    if (kind === 'ball') return `<g class="rb-prop" transform="translate(${x} ${y})"><circle r="13" fill="#E53935" stroke="#8E1B1B" stroke-width="2"/><path d="M-9 -6 Q0 2 9 -6" stroke="#fff" stroke-width="2" fill="none"/></g>`;
    return '';
}

// ---------- Robot mode ----------

function humanoid(r, g, holding) {
    const back = [];
    const front = [];
    const ex = r.extras || [];
    if (ex.includes('wings')) back.push(`<path d="M52 98 L-34 34 L-14 124 L44 134Z" fill="${r.dark}" stroke="${r.glow}" stroke-width="2.5"/><path d="M148 98 L234 34 L214 124 L156 134Z" fill="${r.dark}" stroke="${r.glow}" stroke-width="2.5"/>`);
    if (ex.includes('rotor')) back.push(`<rect x="96" y="-6" width="8" height="32" fill="${JOINT}"/><g class="rb-rotor"><rect x="-30" y="-12" width="260" height="9" rx="4.5" fill="#455A64"/></g>`);
    if (ex.includes('spoiler')) back.push(`<rect x="70" y="62" width="8" height="24" fill="${JOINT}"/><rect x="122" y="62" width="8" height="24" fill="${JOINT}"/><rect x="14" y="54" width="172" height="12" rx="5" fill="${r.trim}" stroke="${r.dark}" stroke-width="2"/>`);
    if (ex.includes('chimneys')) back.push(`<rect x="22" y="44" width="16" height="44" rx="3" fill="#424242"/><rect x="162" y="44" width="16" height="44" rx="3" fill="#424242"/><g class="rb-steam"><circle cx="30" cy="36" r="9" fill="#ECEFF1" opacity="0.8"/><circle cx="170" cy="30" r="11" fill="#ECEFF1" opacity="0.7"/></g>`);

    const claws = ex.includes('claws');
    const fist = (cx) => claws
        ? `<path d="M${cx - 12} 170 l-6 22 l9 -8 l3 15 l6 -14 l7 10 l-1 -25z" fill="${r.trim}" stroke="${r.glow}" stroke-width="2"/>`
        : `<circle cx="${cx}" cy="178" r="13" fill="${r.dark}" stroke="${JOINT}" stroke-width="2"/>`;

    const chest = {
        windows: `<path d="M62 96 H96 V122 H66 Z" fill="${GLASS}" opacity="0.9"/><path d="M104 96 H138 L134 122 H104 Z" fill="${GLASS}" opacity="0.9"/><path d="M68 100 L80 100 L72 116" fill="#fff" opacity="0.6"/>`,
        grille: `<rect x="68" y="96" width="64" height="28" rx="6" fill="${r.dark}"/>${[80, 92, 104, 116].map(x => `<rect x="${x}" y="100" width="5" height="20" rx="2" fill="${r.trim}"/>`).join('')}`,
        stripe: `<rect x="90" y="86" width="20" height="80" fill="${r.trim}"/><path d="M62 98 H86 V118 H66Z" fill="${GLASS}"/><path d="M114 98 H138 L134 118 H114Z" fill="${GLASS}"/>`,
        vents: [100, 112, 124].map(y => `<path d="M72 ${y - 6} L100 ${y + 2} L128 ${y - 6}" stroke="${r.glow}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('')
    }[r.chest] || '';

    const headR = { round: 30, square: 10, crest: 22, horns: 18 }[r.head] ?? 20;
    let headTop = '';
    if (r.head === 'crest') headTop = `<path d="M90 26 L100 2 L110 26 Z" fill="${r.trim}" stroke="${r.dark}" stroke-width="2"/>`;
    if (r.head === 'horns') headTop = `<path d="M72 32 L54 0 L88 26Z" fill="${r.dark}" stroke="${r.glow}" stroke-width="2"/><path d="M128 32 L146 0 L112 26Z" fill="${r.dark}" stroke="${r.glow}" stroke-width="2"/>`;
    if (r.head === 'round') headTop = `<rect x="97" y="6" width="6" height="18" fill="${JOINT}"/><circle cx="100" cy="6" r="6" fill="${r.glow}" class="rb-blink"/>`;
    if (ex.includes('lightbar')) front.push(`<g class="rb-blink"><rect x="78" y="10" width="22" height="12" rx="4" fill="#FF1744"/></g><g class="rb-blink rb-blink-alt"><rect x="100" y="10" width="22" height="12" rx="4" fill="#2979FF"/></g>`);
    if (ex.includes('beacon')) front.push(`<path d="M88 26 a12 12 0 0 1 24 0z" fill="#FFB300" class="rb-blink"/>`);

    const cross = r.mood === 'cross';
    const eyes = cross
        ? `<path d="M76 50 L98 56 L96 62 L78 60Z" fill="${r.eye}"/><path d="M124 50 L102 56 L104 62 L122 60Z" fill="${r.eye}"/>`
        : `<ellipse cx="87" cy="55" rx="8.5" ry="10" fill="${r.eye}"/><ellipse cx="113" cy="55" rx="8.5" ry="10" fill="${r.eye}"/><circle cx="90" cy="51" r="3" fill="#fff"/><circle cx="116" cy="51" r="3" fill="#fff"/>`;
    const mouth = cross
        ? `<path d="M88 76 Q100 70 112 76" stroke="${r.eye}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
        : `<path d="M88 72 Q100 80 112 72" stroke="${r.eye}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;

    if (ex.includes('bucket')) front.push(`<path d="M146 166 h40 l-7 28 h-28z" fill="${JOINT}" stroke="#263238" stroke-width="2"/><path d="M152 194 l4 7 l4 -7 l4 7 l4 -7 l4 7 l4 -7" stroke="#B0BEC5" stroke-width="3" fill="none"/>`);
    if (ex.includes('hook')) front.push(`<path d="M38 188 V206 a12 12 0 1 0 12 12" stroke="${r.trim}" stroke-width="7" fill="none" stroke-linecap="round"/>`);

    return `
        ${back.join('')}
        <rect x="58" y="178" width="32" height="62" rx="9" fill="${JOINT}"/><rect x="110" y="178" width="32" height="62" rx="9" fill="${JOINT}"/>
        <rect x="54" y="194" width="40" height="22" rx="8" fill="url(#${g})" stroke="${r.dark}" stroke-width="2"/><rect x="106" y="194" width="40" height="22" rx="8" fill="url(#${g})" stroke="${r.dark}" stroke-width="2"/>
        <rect x="48" y="236" width="50" height="18" rx="8" fill="${r.dark}"/><rect x="102" y="236" width="50" height="18" rx="8" fill="${r.dark}"/>
        <rect x="62" y="158" width="76" height="28" rx="10" fill="${JOINT}"/>
        <path d="M44 92 Q44 82 54 82 H146 Q156 82 156 92 L146 160 Q144 170 134 170 H66 Q56 170 54 160 Z" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
        ${chest}
        <circle cx="100" cy="144" r="18" fill="url(#${g}-glow)" class="rb-core"/><circle cx="100" cy="144" r="8" fill="${r.glow}"/>
        <rect x="26" y="104" width="24" height="36" rx="10" fill="${JOINT}"/><rect x="150" y="104" width="24" height="36" rx="10" fill="${JOINT}"/>
        <rect x="21" y="134" width="34" height="38" rx="11" fill="url(#${g})" stroke="${r.dark}" stroke-width="2"/><rect x="145" y="134" width="34" height="38" rx="11" fill="url(#${g})" stroke="${r.dark}" stroke-width="2"/>
        ${fist(38)}${fist(162)}
        <circle cx="38" cy="98" r="23" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/><circle cx="162" cy="98" r="23" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
        ${ex.includes('wheels') ? `<circle cx="38" cy="98" r="13" fill="#212121"/><circle cx="38" cy="98" r="6" fill="#B0BEC5"/><circle cx="162" cy="98" r="13" fill="#212121"/><circle cx="162" cy="98" r="6" fill="#B0BEC5"/>` : ''}
        <rect x="88" y="74" width="24" height="14" fill="${JOINT}"/>
        ${headTop}
        <rect x="62" y="22" width="76" height="60" rx="${headR}" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
        <rect x="70" y="40" width="60" height="28" rx="14" fill="#102027"/>
        ${eyes}${mouth}
        ${front.join('')}
        ${prop(holding, 162, 168)}`;
}

// ---------- Vehicle mode ----------

const wheel = (cx, cy, r = 24) => `<g class="rb-wheel" style="transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#212121"/><circle cx="${cx}" cy="${cy}" r="${r * 0.5}" fill="#B0BEC5"/><rect x="${cx - 2}" y="${cy - r * 0.5}" width="4" height="${r}" fill="#607D8B"/></g>`;

function vehicle(r, g) {
    switch (r.vehicle) {
        case 'car': return `
            <path d="M20 122 Q20 94 50 90 L102 86 L132 56 Q140 48 152 48 H220 Q236 48 246 62 L268 88 Q300 92 302 114 V128 Q302 138 292 138 H30 Q20 138 20 128Z" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
            <path d="M140 60 L120 86 H180 V60Z" fill="${GLASS}"/><path d="M190 60 V86 H254 L238 64 Q234 60 228 60Z" fill="${GLASS}"/>
            <path d="M40 112 H292" stroke="${r.trim}" stroke-width="4"/>
            <ellipse cx="292" cy="104" rx="8" ry="6" fill="#FFF59D"/><rect x="20" y="100" width="8" height="10" fill="#FF1744"/>
            <g class="rb-blink"><rect x="164" y="36" width="24" height="12" rx="4" fill="#FF1744"/></g><g class="rb-blink rb-blink-alt"><rect x="188" y="36" width="24" height="12" rx="4" fill="#2979FF"/></g>
            ${wheel(82, 138, 26)}${wheel(248, 138, 26)}`;
        case 'racer': return `
            <rect x="8" y="78" width="54" height="10" rx="4" fill="${r.trim}"/><rect x="28" y="86" width="8" height="22" fill="${JOINT}"/>
            <path d="M14 128 Q14 108 40 104 L120 96 Q140 74 170 74 H200 Q222 74 236 92 L296 104 Q312 108 312 122 V134 H14Z" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
            <path d="M146 80 Q170 78 196 80 L214 96 H134Z" fill="${GLASS}"/>
            <path d="M30 116 H300" stroke="${r.trim}" stroke-width="6"/><path d="M30 124 H300" stroke="${r.trim}" stroke-width="3"/>
            <ellipse cx="304" cy="114" rx="6" ry="5" fill="#FFF59D"/>
            ${wheel(76, 136, 24)}${wheel(252, 136, 24)}`;
        case 'digger': return `
            <rect x="60" y="122" width="180" height="40" rx="20" fill="${JOINT}"/>${[80, 115, 150, 185, 220].map(x => `<circle cx="${x}" cy="142" r="11" fill="#78909C"/>`).join('')}
            <rect x="80" y="74" width="130" height="52" rx="10" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
            <rect x="146" y="34" width="60" height="48" rx="8" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/><rect x="154" y="42" width="44" height="28" rx="4" fill="${GLASS}"/>
            <circle cx="176" cy="30" r="6" fill="${r.glow}" class="rb-blink"/>
            <path d="M90 84 L46 40 L24 92" stroke="${r.dark}" stroke-width="12" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="M6 88 h38 l-7 30 h-26z" fill="${JOINT}"/><path d="M12 118 l4 7 l4 -7 l4 7 l4 -7 l4 7" stroke="#B0BEC5" stroke-width="3" fill="none"/>`;
        case 'tow': return `
            <rect x="24" y="98" width="164" height="34" rx="6" fill="${r.dark}"/>
            <path d="M62 98 L118 40" stroke="${r.trim}" stroke-width="10" stroke-linecap="round"/>
            <path d="M118 40 V70 a10 10 0 1 1 -12 10" stroke="#FFB300" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M180 62 Q180 46 196 46 H250 Q266 46 274 62 L292 92 Q302 96 302 110 V134 H180Z" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
            <path d="M196 56 H248 L266 88 H196Z" fill="${GLASS}"/>
            <path d="M224 46 a10 10 0 0 1 20 0z" fill="#FFB300" class="rb-blink"/>
            <ellipse cx="296" cy="112" rx="6" ry="6" fill="#FFF59D"/>
            ${wheel(64, 136)}${wheel(136, 136)}${wheel(250, 136)}`;
        case 'heli': return `
            <path d="M88 88 L14 80 L14 98 L88 114Z" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
            <path d="M10 56 L26 56 L30 96 L10 96Z" fill="${r.trim}"/>
            <ellipse cx="164" cy="98" rx="82" ry="46" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
            <path d="M196 62 Q240 66 244 100 L196 100 Z" fill="${GLASS}"/>
            <path d="M90 112 H240" stroke="${r.trim}" stroke-width="6"/>
            <path d="M120 140 L112 156 M210 140 L218 156 M96 156 H236" stroke="${JOINT}" stroke-width="6" stroke-linecap="round"/>
            <rect x="158" y="40" width="12" height="16" fill="${JOINT}"/>
            <g class="rb-rotor" style="transform-origin:164px 38px"><rect x="20" y="33" width="288" height="9" rx="4.5" fill="#455A64"/></g>`;
        case 'jet': return `
            <path d="M120 96 L176 22 L206 22 L182 96Z" fill="${r.dark}" stroke="${r.glow}" stroke-width="2.5"/>
            <path d="M24 96 L4 58 L34 58 L56 92Z" fill="${r.dark}" stroke="${r.glow}" stroke-width="2"/>
            <path d="M10 100 L60 84 L240 80 Q300 84 316 100 Q300 116 240 120 L60 116Z" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
            <path d="M228 86 Q270 88 288 100 L228 100Z" fill="${r.glow}" opacity="0.75"/>
            <path d="M120 104 L176 176 L206 176 L182 104Z" fill="${r.dark}" stroke="${r.glow}" stroke-width="2.5"/>
            <circle cx="10" cy="100" r="11" fill="url(#${g}-glow)" class="rb-core"/>`;
        case 'tank': return `
            <rect x="214" y="10" width="20" height="44" rx="3" fill="#424242"/><g class="rb-steam"><circle cx="224" cy="4" r="11" fill="#ECEFF1" opacity="0.8"/></g>
            <rect x="30" y="118" width="252" height="44" rx="22" fill="${JOINT}"/>${[56, 100, 144, 188, 232, 260].map(x => `<circle cx="${x}" cy="140" r="12" fill="#78909C"/>`).join('')}
            <path d="M48 122 L70 78 H244 L264 122Z" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
            <rect x="104" y="44" width="104" height="42" rx="16" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
            <path d="M126 58 L150 66 L126 70Z" fill="${r.eye}"/><path d="M186 58 L162 66 L186 70Z" fill="${r.eye}"/>`;
        default: return '';
    }
}

// ---------- Special shapes ----------

function dog(r, g, holding) {
    return `
        <path d="M44 74 Q24 60 18 38" stroke="${JOINT}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="18" cy="36" r="8" fill="${r.glow}" class="rb-blink"/>
        ${[54, 80, 118, 142].map(x => `<rect x="${x}" y="100" width="18" height="44" rx="8" fill="${JOINT}"/><rect x="${x - 3}" y="136" width="24" height="12" rx="6" fill="${r.dark}"/>`).join('')}
        <rect x="40" y="62" width="124" height="52" rx="24" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
        <circle cx="100" cy="88" r="12" fill="url(#${g}-glow)" class="rb-core"/>
        <rect x="132" y="56" width="18" height="16" rx="4" fill="${r.trim}"/>
        <g transform="translate(174 22)"><circle r="10" fill="${r.trim}"/>${[0, 60, 120, 180, 240, 300].map(a => `<rect x="-3" y="-15" width="6" height="8" fill="${r.trim}" transform="rotate(${a})"/>`).join('')}</g>
        <rect x="130" y="18" width="68" height="54" rx="22" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
        <g transform="translate(140 18)"><circle r="10" fill="${r.trim}"/>${[0, 60, 120, 180, 240, 300].map(a => `<rect x="-3" y="-15" width="6" height="8" fill="${r.trim}" transform="rotate(${a})"/>`).join('')}</g>
        <rect x="140" y="32" width="50" height="22" rx="11" fill="#102027"/>
        <ellipse cx="155" cy="43" rx="6" ry="7" fill="${r.eye}"/><ellipse cx="176" cy="43" rx="6" ry="7" fill="${r.eye}"/>
        <path d="M156 60 Q166 66 178 60" stroke="${r.eye}" stroke-width="3" fill="none" stroke-linecap="round"/>
        ${prop(holding, 196, 66)}`;
}

function bus(r, g) {
    const faces = ['#FFCC80', '#8D6E63', '#FFE0B2', '#A1887F'];
    return `
        <rect x="10" y="26" width="300" height="114" rx="22" fill="url(#${g})" stroke="${r.dark}" stroke-width="3"/>
        ${[30, 86, 142, 198].map((x, i) => `<rect x="${x}" y="44" width="46" height="38" rx="7" fill="${GLASS}"/><circle cx="${x + 23}" cy="70" r="9" fill="${faces[i]}"/><path d="M${x + 13} 82 a10 9 0 0 1 20 0" fill="${['#42A5F5', '#66BB6A', '#AB47BC', '#FFA726'][i]}"/>`).join('')}
        <rect x="256" y="44" width="40" height="78" rx="6" fill="${GLASS}" stroke="${r.dark}" stroke-width="2"/>
        <path d="M14 100 H250" stroke="#FFEB3B" stroke-width="5"/>
        <ellipse cx="302" cy="118" rx="6" ry="6" fill="#FFF59D"/>
        ${wheel(76, 140, 22)}${wheel(232, 140, 22)}`;
}

// SVG markup for a robot. mode: 'robot' | 'vehicle'. holding: 'core' | 'oil' | 'ball'.
export function robotSVG(id, { mode = 'robot', holding = null, title = true } = {}) {
    const r = ROBOTS[id];
    if (!r) return '';
    const g = `rb${++uid}`;
    let body;
    let viewBox;
    if (r.kind === 'dog') { body = dog(r, g, holding); viewBox = '0 0 210 160'; }
    else if (r.kind === 'bus') { body = bus(r, g); viewBox = '0 0 320 170'; }
    else if (mode === 'vehicle' && r.vehicle) { body = vehicle(r, g); viewBox = '0 -10 320 190'; }
    else { body = humanoid(r, g, holding); viewBox = '-40 -16 280 276'; }
    return `<svg class="rb-svg rb-${r.kind || mode}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${r.name}">
        ${title ? `<title>${r.name}</title>` : ''}<defs>${gradient(g, r)}</defs>${body}</svg>`;
}

// Shared CSS for robot animations (blinking lights, spinning rotor, steam).
export const ROBOT_CSS = `
    .rb-svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .rb-blink { animation: rbBlink 1s steps(2, start) infinite; }
    .rb-blink-alt { animation-delay: 0.5s; }
    .rb-rotor { transform-box: fill-box; transform-origin: center; animation: rbRotor 0.25s linear infinite; }
    .rb-steam { animation: rbSteam 1.6s ease-out infinite; transform-box: fill-box; transform-origin: center; }
    .rb-core { animation: rbPulse 1.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes rbBlink { to { opacity: 0.25; } }
    @keyframes rbRotor { 0% { transform: scaleX(1); } 50% { transform: scaleX(0.15); } 100% { transform: scaleX(1); } }
    @keyframes rbSteam { 0% { transform: translateY(0) scale(0.6); opacity: 0.9; } 100% { transform: translateY(-18px) scale(1.4); opacity: 0; } }
    @keyframes rbPulse { 50% { transform: scale(1.25); } }
    @media (prefers-reduced-motion: reduce) { .rb-blink, .rb-rotor, .rb-steam, .rb-core { animation: none; } }
`;
