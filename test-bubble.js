import { JSDOM } from 'jsdom';
import assert from 'assert';

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;

// Mock requestAnimationFrame for animation loop testing
let rAFCallbacks = [];
global.requestAnimationFrame = (cb) => {
    rAFCallbacks.push(cb);
    return rAFCallbacks.length;
};
global.cancelAnimationFrame = () => {};

import { initBubblePop } from './games/bubble-pop.js';

function runTests() {
    let container = document.createElement('div');
    document.body.appendChild(container);

    console.log("TEST: Bubble Creation and Animation");
    
    // Stub offset and client height for JSDOM
    Object.defineProperty(global.window.HTMLElement.prototype, 'clientWidth', { value: 800 });
    Object.defineProperty(global.window.HTMLElement.prototype, 'clientHeight', { value: 600 });
    
    initBubblePop(container, ['apple', 'banana', 'cherry'], () => {});
    
    // Execute the FIRST rAF which calls createBubble()
    let tick1 = rAFCallbacks.shift();
    let time = 1000;
    if (tick1) tick1(time);

    let gameArea = container.querySelector('#game-area');
    assert.ok(gameArea, "Game area should exist");

    let bubbles = gameArea.querySelectorAll('.bubble');
    try {
        assert.strictEqual(bubbles.length, 1, "There should be 1 bubble created on start");
        console.log("✅ Initial bubble spawned correctly");
    } catch (e) {
        console.error("❌ Initial generation failed: " + e.message + " (Found " + bubbles.length + ")");
    }

    if (bubbles.length > 0) {
        let initialBottom = bubbles[0].style.bottom;
        try {
            assert.strictEqual(initialBottom, '-150px', "Bubble should start at -150px bottom");
            console.log("✅ Initial position set properly");
        } catch (e) {
            console.error("❌ Initial position failed: " + e.message);
        }

        // Second frame, animate! (with a deltaTime of 16ms)
        time += 16;
        let tick2 = rAFCallbacks.shift();
        
        console.log("DELTA TEST:", bubbles[0].style.bottom, bubbles[0].speed);
        if (tick2) tick2(time);
        
        let newBottom = bubbles[0].style.bottom;
        console.log("DELTA POST:", newBottom, bubbles[0].style.bottom);

        try {
            assert.notStrictEqual(initialBottom, newBottom, "Bubble bottom should have changed");
            assert.ok(parseFloat(newBottom) > parseFloat(initialBottom), "Bubble should be moving up");
            console.log("✅ Bubble animation loop works!");
        } catch (e) {
            console.error("❌ Animation logic failed: " + e.message + " | Initial: " + initialBottom + ", New: " + newBottom);
        }
    } else {
        console.error("❌ Cannot verify bubble animation because none were created!");
    }

    process.exit(0);
}

runTests();
