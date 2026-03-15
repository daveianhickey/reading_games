export function initMemoryMatch(container, words, onBack) {
    let score = 0;
    let flippedCards = [];
    let matchedPairs = 0;
    let lockBoard = false;

    // Generate pairs for the grid
    let gameWords = [...words];
    // Need an even number of pairs, e.g. 12 cards (6 pairs)
    const targetPairs = 6;
    let pairs = [];
    
    // Fill up to targetPairs
    for(let i=0; i<targetPairs; i++) {
        pairs.push(gameWords[i % gameWords.length]);
    }
    
    // Duplicate to make cards
    let cards = [...pairs, ...pairs];
    
    // Shuffle
    cards.sort(() => Math.random() - 0.5);

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 0.5rem; background: var(--glass-bg); border-radius: 50px; backdrop-filter: blur(10px);">
            <button class="btn btn-secondary" id="back-btn" style="padding: 0.5rem 1.5rem;">← Back</button>
            <h2 style="margin: 0; padding-right: 1.5rem; color: var(--text-dark);">Score: <span id="score" style="color: var(--primary);">${score}</span></h2>
        </div>
        
        <div id="win-message" style="display: none; text-align: center; margin-bottom: 2rem; animation: popIn 0.5s ease-out;">
            <h1 class="title-bounce" style="font-size: 4rem;">You Won! 🎉</h1>
            <button class="btn" id="play-again-btn">Play Again</button>
        </div>

        <div class="glass-card" style="background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);">
            <div id="card-grid" style="
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
                gap: 1.5rem; 
                perspective: 1000px;
                max-width: 800px;
                margin: 0 auto;
            ">
                ${cards.map((word, index) => `
                    <div class="memory-card" data-word="${word}" style="
                        width: 100%; 
                        aspect-ratio: 1/1; 
                        position: relative; 
                        transform-style: preserve-3d; 
                        -webkit-transform-style: preserve-3d;
                        transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), -webkit-transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        cursor: pointer;
                    ">
                        <!-- Front (Hidden side) -->
                        <div class="card-front" style="
                            position: absolute; 
                            width: 100%; 
                            height: 100%; 
                            -webkit-backface-visibility: hidden;
                            backface-visibility: hidden; 
                            background: var(--background);
                            border: 3px solid var(--secondary);
                            border-radius: 20px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            font-size: 1.8rem;
                            font-weight: 800;
                            color: var(--text-dark);
                            transform: rotateY(180deg);
                            -webkit-transform: rotateY(180deg);
                            box-shadow: var(--shadow-sm);
                        ">
                            ${word}
                        </div>
                        <!-- Back (Visible side initially) -->
                        <div class="card-back" style="
                            position: absolute; 
                            width: 100%; 
                            height: 100%; 
                            -webkit-backface-visibility: hidden;
                            backface-visibility: hidden; 
                            background: var(--primary);
                            background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);
                            border-radius: 20px;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            font-size: 3rem;
                            transform: rotateY(0deg);
                            -webkit-transform: rotateY(0deg);
                            box-shadow: var(--shadow-md);
                        ">
                            ⭐
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('back-btn').addEventListener('click', onBack);

    const cardElements = document.querySelectorAll('.memory-card');

    document.getElementById('play-again-btn')?.addEventListener('click', () => {
        initMemoryMatch(container, words, onBack);
    });

    cardElements.forEach(card => {
        card.addEventListener('click', flipCard);
    });

    function flipCard() {
        if (lockBoard) return;
        if (this === flippedCards[0]) return;
        if (this.classList.contains('matched')) return;

        this.style.transform = 'rotateY(180deg)';
        this.style.webkitTransform = 'rotateY(180deg)';
        
        flippedCards.push(this);

        if (flippedCards.length === 2) {
            checkForMatch();
        }
    }

    function checkForMatch() {
        let isMatch = flippedCards[0].dataset.word === flippedCards[1].dataset.word;

        if (isMatch) {
            disableCards();
            updateScore(20);
            matchedPairs++;
            
            // Win condition
            if (matchedPairs === targetPairs) {
                setTimeout(() => {
                    document.getElementById('win-message').style.display = 'block';
                    createConfetti();
                }, 500);
            }
        } else {
            unflipCards();
            updateScore(-5);
        }
    }

    function disableCards() {
        flippedCards[0].classList.add('matched');
        flippedCards[1].classList.add('matched');
        
        // Add popping animation to matched cards
        flippedCards[0].querySelector('.card-front').style.background = '#e2f0cb';
        flippedCards[1].querySelector('.card-front').style.background = '#e2f0cb';
        
        createConfettiBurst(flippedCards[0]);
        createConfettiBurst(flippedCards[1]);

        resetBoard();
    }

    function unflipCards() {
        lockBoard = true;

        setTimeout(() => {
            flippedCards[0].style.transform = 'rotateY(0deg)';
            flippedCards[0].style.webkitTransform = 'rotateY(0deg)';
            flippedCards[1].style.transform = 'rotateY(0deg)';
            flippedCards[1].style.webkitTransform = 'rotateY(0deg)';

            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        [flippedCards, lockBoard] = [[], false];
    }

    function updateScore(points) {
        score = Math.max(0, score + points);
        document.getElementById('score').textContent = score;
        document.getElementById('score').style.animation = 'popIn 0.3s ease-out';
        setTimeout(() => document.getElementById('score').style.animation = 'none', 300);
    }

    function createConfettiBurst(card) {
        const rect = card.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        for (let i = 0; i < 15; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'fixed';
            conf.style.left = `\${x}px`;
            conf.style.top = `\${y}px`;
            conf.style.width = '8px';
            conf.style.height = '8px';
            conf.style.background = ['#FF6B6B', '#4ECDC4', '#FFE66D'][Math.floor(Math.random() * 3)];
            conf.style.borderRadius = '50%';
            conf.style.pointerEvents = 'none';
            conf.style.zIndex = '1000';
            document.body.appendChild(conf);

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 6 + 2;
            let vx = Math.cos(angle) * velocity;
            let vy = Math.sin(angle) * velocity;

            let tick = 0;
            function animateConf() {
                tick++;
                conf.style.left = `\${parseFloat(conf.style.left) + vx}px`;
                conf.style.top = `\${parseFloat(conf.style.top) + vy}px`;
                conf.style.opacity = 1 - (tick / 30);

                if (tick < 30) {
                    requestAnimationFrame(animateConf);
                } else {
                    conf.parentNode && conf.parentNode.removeChild(conf);
                }
            }
            requestAnimationFrame(animateConf);
        }
    }

    function createConfetti() {
        for (let i = 0; i < 100; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'fixed';
            conf.style.left = `\${Math.random() * window.innerWidth}px`;
            conf.style.top = `\${-10}px`;
            conf.style.width = '10px';
            conf.style.height = '10px';
            conf.style.background = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FFF', '#a1c4fd'][Math.floor(Math.random() * 5)];
            conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            conf.style.pointerEvents = 'none';
            conf.style.zIndex = '1000';
            document.body.appendChild(conf);

            const velocity = Math.random() * 5 + 2;
            let vy = velocity;
            let vx = (Math.random() - 0.5) * 4;

            let tick = 0;
            function animateConf() {
                tick++;
                vy += 0.1; // gravity
                let curLeft = parseFloat(conf.style.left);
                let curTop = parseFloat(conf.style.top);
                conf.style.left = `\${curLeft + vx + Math.sin(tick*0.1)*2}px`;
                conf.style.top = `\${curTop + vy}px`;
                conf.style.transform = `rotate(\${tick * 5}deg)`;

                if (curTop < window.innerHeight) {
                    requestAnimationFrame(animateConf);
                } else {
                    conf.parentNode && conf.parentNode.removeChild(conf);
                }
            }
            requestAnimationFrame(animateConf);
        }
    }
}
