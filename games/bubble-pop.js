export function initBubblePop(container, words, onBack) {
    let score = 0;
    let targetWord = getRandomWord(words);
    let bubbles = [];
    let animationId;
    let isPlaying = true;
    let lastTime = 0;
    let bubbleSpawnTimer = 0;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 0.5rem; background: var(--glass-bg); border-radius: 50px; backdrop-filter: blur(10px);">
            <button class="btn btn-secondary" id="back-btn" style="padding: 0.5rem 1.5rem;">← Back</button>
            <h2 style="margin: 0; padding-right: 1.5rem; color: var(--text-dark);">Score: <span id="score" style="color: var(--primary);">${score}</span></h2>
        </div>
        <div class="glass-card" style="position: relative; height: 65vh; overflow: hidden; background: linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%); border-radius: 30px; box-shadow: inset 0 0 30px rgba(0,0,0,0.1);" id="game-area">
            <div style="position: absolute; top: 20px; width: 100%; text-align: center; z-index: 10; left: 0;">
                <h1 style="font-size: 2.5rem; text-shadow: 2px 2px white; margin: 0; animation: none;">Pop the word: <br><span style="color: var(--primary); font-size: 4rem; display: inline-block; animation: bounce 2s infinite;" id="target-word">${targetWord}</span></h1>
            </div>
        </div>
    `;

    document.getElementById('back-btn').addEventListener('click', () => {
        isPlaying = false;
        cancelAnimationFrame(animationId);
        onBack();
    });

    const gameArea = document.getElementById('game-area');

    function createBubble() {
        if (!isPlaying || !gameArea) return;
        const bubble = document.createElement('div');
        const isTarget = Math.random() > 0.6; // 40% chance of target word
        const wordText = isTarget ? targetWord : getRandomWord(words);
        
        const size = Math.random() * 50 + 90; // 90 to 140px
        const left = Math.random() * (gameArea.clientWidth - size);
        
        bubble.className = 'bubble';
        bubble.style.position = 'absolute';
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}px`;
        bubble.style.bottom = '-150px';
        bubble.style.borderRadius = '50%';
        bubble.style.background = 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.5) 60%, rgba(255, 255, 255, 0.2) 100%)';
        bubble.style.boxShadow = 'inset 0 0 20px rgba(255,255,255,0.8), 0 0 15px rgba(255,255,255,0.4)';
        bubble.style.border = '2px solid rgba(255,255,255,0.8)';
        bubble.style.display = 'flex';
        bubble.style.justifyContent = 'center';
        bubble.style.alignItems = 'center';
        bubble.style.cursor = 'pointer';
        bubble.style.fontSize = `${Math.min(size / 3.5, 30)}px`;
        bubble.style.fontWeight = '800';
        bubble.style.color = '#2F3542';
        bubble.style.textShadow = '0px 0px 8px white, 0px 0px 4px white';
        bubble.style.backdropFilter = 'blur(4px)';
        bubble.innerText = wordText;
        bubble.style.userSelect = 'none';
        bubble.style.transition = 'transform 0.1s';

        bubble.speed = (Math.random() * 1.5 + 1.5); // pixels per frame
        bubble.wobble = Math.random() * Math.PI * 2;
        bubble.wobbleSpeed = Math.random() * 0.05 + 0.02;

        const handlePop = (e) => {
            e.preventDefault();
            popBubble(bubble, wordText === targetWord, e.clientX, e.clientY);
        };

        bubble.addEventListener('mousedown', handlePop);
        bubble.addEventListener('touchstart', handlePop, {passive: false});

        gameArea.appendChild(bubble);
        bubbles.push(bubble);
    }

    function popBubble(bubble, correct, clientX, clientY) {
        if (bubble.popped) return;
        bubble.popped = true;

        bubble.style.transform = 'scale(1.5)';
        bubble.style.opacity = '0';
        bubble.style.transition = 'all 0.15s ease-out';
        
        setTimeout(() => {
            if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
        }, 150);

        if (correct) {
            score += 10;
            document.getElementById('score').innerText = score;
            document.getElementById('score').style.animation = 'popIn 0.3s ease-out';
            setTimeout(() => document.getElementById('score').style.animation = 'none', 300);

            let rect = bubble.getBoundingClientRect();
            createConfetti(clientX || (rect.left + rect.width/2), clientY || (rect.top + rect.height/2));
            
            targetWord = getRandomWord(words);
            const targetEl = document.getElementById('target-word');
            targetEl.innerText = targetWord;
            
            // Impactful change animation: remove animation, re-trigger popIn & bounce
            targetEl.style.animation = 'none';
            void targetEl.offsetWidth; // force browser reflow
            targetEl.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), bounce 2s infinite 0.5s';
            targetEl.style.color = 'var(--secondary)'; // Flash to bright teal
            targetEl.style.transform = 'scale(1.2)';
            
            setTimeout(() => {
                targetEl.style.color = 'var(--primary)'; // Restore coral red
                targetEl.style.transform = 'scale(1)';
            }, 500);
            
            // Success flash
            gameArea.style.boxShadow = 'inset 0 0 80px rgba(78, 205, 196, 0.8)';
            setTimeout(() => gameArea.style.boxShadow = 'inset 0 0 30px rgba(0,0,0,0.1)', 300);
        } else {
            score = Math.max(0, score - 5);
            document.getElementById('score').innerText = score;
            
            // Error shake
            gameArea.style.transform = 'translate(-10px, 0)';
            setTimeout(() => gameArea.style.transform = 'translate(10px, 0)', 50);
            setTimeout(() => gameArea.style.transform = 'translate(-10px, 0)', 100);
            setTimeout(() => gameArea.style.transform = 'translate(0, 0)', 150);
            
            gameArea.style.boxShadow = 'inset 0 0 80px rgba(255, 107, 107, 0.8)';
            setTimeout(() => gameArea.style.boxShadow = 'inset 0 0 30px rgba(0,0,0,0.1)', 300);
        }
    }

    function animate(currentTime) {
        if (!isPlaying) return;
        
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        bubbleSpawnTimer += deltaTime;
        if (bubbleSpawnTimer > 1500) { // Spawn every 1.5s
            createBubble();
            bubbleSpawnTimer = 0;
        }

        const areaHeight = gameArea.clientHeight;

        for (let i = bubbles.length - 1; i >= 0; i--) {
            let b = bubbles[i];
            if (b.popped) {
                bubbles.splice(i, 1);
                continue;
            }

            let bottom = parseFloat(b.style.bottom);
            // Normalize speed by deltaTime
            bottom += b.speed * (deltaTime / 16);
            
            b.wobble += b.wobbleSpeed * (deltaTime / 16);
            const xOffset = Math.sin(b.wobble) * 2;
            let left = parseFloat(b.style.left) + xOffset;
            
            b.style.bottom = `${bottom}px`;
            b.style.left = `${left}px`;

            if (bottom > areaHeight + 150) {
                b.parentNode.removeChild(b);
                bubbles.splice(i, 1);
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    function createConfetti(x, y) {
        for (let i = 0; i < 30; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'fixed';
            conf.style.left = `${x}px`;
            conf.style.top = `${y}px`;
            conf.style.width = '12px';
            conf.style.height = '12px';
            conf.style.background = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FFF'][Math.floor(Math.random() * 4)];
            conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '20%';
            conf.style.pointerEvents = 'none';
            conf.style.zIndex = '1000';
            document.body.appendChild(conf);

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 8 + 4;
            let vx = Math.cos(angle) * velocity;
            let vy = Math.sin(angle) * velocity - 4;

            let tick = 0;
            function animateConf() {
                tick++;
                vx *= 0.95;
                vy += 0.3; // gravity
                let curLeft = parseFloat(conf.style.left);
                let curTop = parseFloat(conf.style.top);
                conf.style.left = `${curLeft + vx}px`;
                conf.style.top = `${curTop + vy}px`;
                conf.style.transform = `rotate(${tick * 15}deg) scale(${1 - tick/60})`;

                if (tick < 60) {
                    requestAnimationFrame(animateConf);
                } else {
                    conf.parentNode && conf.parentNode.removeChild(conf);
                }
            }
            requestAnimationFrame(animateConf);
        }
    }

    // Start
    requestAnimationFrame((t) => {
        lastTime = t;
        createBubble();
        animate(t);
    });
}

function getRandomWord(words) {
    return words[Math.floor(Math.random() * words.length)];
}
