import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { initMemoryMatch } from './memory-match.js';

describe('Memory Match Mechanics', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        vi.useFakeTimers();
    });

    afterEach(() => {
        document.body.removeChild(container);
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('creates appropriate number of cards and validates initial score', () => {
        initMemoryMatch(container, ['apple', 'banana', 'cherry'], () => {});
        const scoreElement = container.querySelector('#score');
        expect(scoreElement.textContent).toBe('0');
        
        const cards = container.querySelectorAll('.memory-card');
        expect(cards.length).toBe(12); // targetPairs is 6, so cards len = 12
    });

    it('updates score by +20 on match', () => {
        initMemoryMatch(container, ['apple', 'banana', 'cherry'], () => {});
        const cards = container.querySelectorAll('.memory-card');
        
        const searchWord = cards[0].getAttribute('data-word');
        const matchCards = Array.from(cards).filter(c => c.getAttribute('data-word') === searchWord);
        
        // Flip the first pair
        matchCards[0].click();
        matchCards[1].click();

        const scoreElement = container.querySelector('#score');
        expect(scoreElement.textContent).toBe('20');
        expect(matchCards[0].classList.contains('matched')).toBe(true);
    });

    it('updates score by -5 on mismatch, never going below 0', () => {
        initMemoryMatch(container, ['apple', 'banana', 'cherry'], () => {});
        const cards = container.querySelectorAll('.memory-card');

        // Initial score is 0, mismatch should keep it at 0
        const card1 = cards[0];
        const card2 = Array.from(cards).find(c => c.getAttribute('data-word') !== card1.getAttribute('data-word'));
        
        card1.click();
        card2.click();
        
        let scoreElement = container.querySelector('#score');
        expect(scoreElement.textContent).toBe('0');
        
        // Match a pair to get 20 points
        const card3 = Array.from(cards).find(c => c !== card1 && c.getAttribute('data-word') === card1.getAttribute('data-word'));
        // clear board lock
        vi.advanceTimersByTime(1000);
        
        card1.click();
        card3.click();
        expect(scoreElement.textContent).toBe('20');
        
        vi.advanceTimersByTime(1000);
        
        // Mismatch another pair to check deduction
        const remainingUnmatched = Array.from(cards).filter(c => !c.classList.contains('matched'));
        const miss1 = remainingUnmatched[0];
        const miss2 = remainingUnmatched.find(c => c.getAttribute('data-word') !== miss1.getAttribute('data-word'));
        
        miss1.click();
        miss2.click();
        
        expect(scoreElement.textContent).toBe('15'); // 20 - 5
    });

    it('displays the word on the turned card correctly (DOM check)', () => {
        initMemoryMatch(container, ['apple'], () => {});
        const card = container.querySelector('.memory-card');
        const front = card.querySelector('.card-front');
        const back = card.querySelector('.card-back');
        
        // Verify structure 
        expect(front.textContent.trim()).toBe('apple');
        expect(front.style.transform).toContain('rotateY(180deg)');
        
        // Now flip it
        card.click();
        expect(card.style.transform).toContain('rotateY(180deg)');
        
        // Check for CSS property that ensures visibility in all browsers
        expect(front.style.WebkitBackfaceVisibility).toBe('hidden');
        expect(front.style.backfaceVisibility).toBe('hidden');
    });
});
