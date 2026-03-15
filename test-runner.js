import { JSDOM } from 'jsdom';
import assert from 'assert';

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;

// Mock requestAnimationFrame for confetti logic
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);

import { initMemoryMatch } from './games/memory-match.js';

function runTests() {
    let container = document.createElement('div');
    document.body.appendChild(container);

    console.log("TEST: Score and Flip Mechanics");
    initMemoryMatch(container, ['apple', 'banana', 'cherry'], () => {});
    
    // 1. Initial State
    let score = container.querySelector('#score');
    assert.strictEqual(score.textContent, '0', "Score should start at 0");
    
    let cards = container.querySelectorAll('.memory-card');
    assert.strictEqual(cards.length, 12, "Should create 12 cards (6 pairs)");

    // 2. Test Mismatch
    let card1 = cards[0];
    let card2 = Array.from(cards).find(c => c.getAttribute('data-word') !== card1.getAttribute('data-word'));
    
    card1.click();
    card2.click();
    
    assert.strictEqual(score.textContent, '0', "Score shouldn't drop below 0");
    
    // 3. Test Match
    let card3 = Array.from(cards).find(c => c !== card1 && c.getAttribute('data-word') === card1.getAttribute('data-word'));
    
    // Fast-forward to unlock board
    setTimeout(() => {
        card1.click();
        card3.click();
        
        try {
            console.log("Expected score 20, got:", score.textContent);
            assert.strictEqual(score.textContent, '20', "Score should be 20 after match");
            console.log("✅ Scoring Logic tests passed!");
        } catch(e) {
            console.error("❌ Scoring Logic failed", e.message);
        }

        // Test display word mechanism
        console.log("TEST: Card Display Mechanics");
        const front = card1.querySelector('.card-front');
        
        try {
            assert.ok(front.textContent.includes('apple') || front.textContent.includes('banana') || front.textContent.includes('cherry'), "Front should contain a word");
            
            // Check for correct visibility properties backface-visibility
            assert.ok(front.style.backfaceVisibility === 'hidden', "Card front MUST have backface visibility explicitly hidden");
            
            // Critical Safari Fix checks
            assert.ok(card1.getAttribute('style').includes('-webkit-transform-style: preserve-3d'), "memory-card MUST have -webkit-transform-style for iOS");
            assert.ok(front.getAttribute('style').includes('-webkit-transform: rotateY(180deg)'), "card-front MUST have -webkit-transform matching its transform");
            console.log("✅ Safari/ios 3D rendering test passed!");
            
            console.log("✅ Display Mechanics fixed/passed!");
        } catch(e) {
            console.error("❌ Display mechanics test failed:", e.message);
        }

        process.exit(0);

    }, 1100);

}

runTests();
