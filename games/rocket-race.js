export function initRocketRace(container, words, onBack) {
    let progress = 0;
    const MAX_PROGRESS = 5;
    let lastWord = "";
    let currentTarget = "";
    let options = [];

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 0.5rem; background: var(--glass-bg); border-radius: 50px; backdrop-filter: blur(10px);">
            <button class="btn btn-secondary" id="back-btn" style="padding: 0.5rem 1.5rem; text-transform: lowercase;">← back</button>
            <h2 style="margin: 0; padding-right: 1.5rem; color: var(--text-dark); text-transform: lowercase;">mission: <span id="progress-text" style="color: var(--primary);">0/${MAX_PROGRESS}</span></h2>
        </div>
        
        <div class="glass-card" style="position: relative; height: 65vh; overflow: hidden; background: linear-gradient(180deg, #0b0f19 0%, #1a2a6c 50%, #b21f1f 100%); border-radius: 30px; box-shadow: inset 0 0 40px rgba(0,0,0,0.5); display: flex;" id="game-area">
            
            <!-- Stars background -->
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(2px 2px at 20px 30px, #eee, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0,0,0,0)); background-size: 200px 200px; opacity: 0.5; z-index: 0;"></div>
            
            <!-- Rocket Track Area (Left) -->
            <div style="width: 30%; height: 100%; position: relative; border-right: 2px dashed rgba(255,255,255,0.2); z-index: 1;">
                
                <!-- Destination Planet -->
                <div id="planet" style="position: absolute; top: 5%; left: 50%; transform: translateX(-50%); font-size: 6rem; filter: drop-shadow(0 0 20px rgba(255,255,255,0.5));">🌕</div>
                
                <!-- Waypoints -->
                <div style="position: absolute; bottom: 25%; left: 50%; transform: translateX(-50%); color: white; opacity: 0.5;">⭐</div>
                <div style="position: absolute; bottom: 40%; left: 50%; transform: translateX(-50%); color: white; opacity: 0.5;">⭐</div>
                <div style="position: absolute; bottom: 55%; left: 50%; transform: translateX(-50%); color: white; opacity: 0.5;">⭐</div>
                <div style="position: absolute; bottom: 70%; left: 50%; transform: translateX(-50%); color: white; opacity: 0.5;">⭐</div>
                
                <!-- The Rocket -->
                <div id="player-rocket" style="position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); transition: bottom 1s cubic-bezier(0.34, 1.56, 0.64, 1); display: flex; flex-direction: column; align-items: center;">
                    <div style="font-size: 5rem; line-height: 1; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));">🚀</div>
                    <div id="rocket-flame" style="font-size: 3rem; margin-top: -15px; animation: bounce 0.5s infinite alternate;">🔥</div>
                </div>

            </div>

            <!-- Dashboard Area (Right) -->
            <div style="width: 70%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 2rem; z-index: 1;">
                
                <div id="mission-panel" style="text-align: center; width: 100%;">
                    <h2 style="color: white; font-size: 1.8rem; margin-bottom: 1rem; opacity: 0.9; text-transform: lowercase;">fuel the rocket with:</h2>
                    <div id="target-word" style="background: rgba(255,255,255,0.1); border: 4px solid var(--primary); padding: 1rem 3rem; border-radius: 20px; font-size: 4rem; font-weight: 800; color: #FFE66D; display: inline-block; margin-bottom: 3rem; box-shadow: 0 0 30px rgba(255, 107, 107, 0.4); backdrop-filter: blur(5px); text-transform: lowercase;">
                        ${currentTarget}
                    </div>

                    <div id="options-rack" style="display: flex; gap: 1.5rem; justify-content: center; width: 100%; flex-wrap: wrap; text-transform: lowercase;">
                        <!-- Options injected here -->
                    </div>
                </div>

                <div id="win-panel" style="display: none; text-align: center; flex-direction: column; align-items: center; z-index: 10;">
                    <h1 style="font-size: 4rem; color: #FFE66D; text-shadow: 0 0 20px rgba(255, 230, 109, 0.8); margin-bottom: 1rem; text-transform: lowercase;">mission success!</h1>
                    <p style="font-size: 1.5rem; color: white; margin-bottom: 2rem; text-transform: lowercase;">the rocket made it to the moon!</p>
                    <button class="btn" id="play-again-btn" style="font-size: 1.5rem; padding: 1rem 3rem; text-transform: lowercase;">play again 🚀</button>
                </div>

            </div>
        </div>
    `;

    document.getElementById('back-btn').addEventListener('click', () => {
        onBack();
    });

    const rocketEl = document.getElementById('player-rocket');
    const flameEl = document.getElementById('rocket-flame');
    const targetWordEl = document.getElementById('target-word');
    const optionsRack = document.getElementById('options-rack');
    const progressText = document.getElementById('progress-text');
    const planetEl = document.getElementById('planet');

    const playSound = (type) => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            if (type === 'bing') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            } else if (type === 'buzz') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, audioCtx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            } else if (type === 'crazy') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(300, audioCtx.currentTime);
                for (let i = 0; i < 10; i++) {
                    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + i * 0.3 + 0.15);
                    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + i * 0.3 + 0.3);
                }
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.2);
                gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 2.8);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 3.0);
                osc.start();
                osc.stop(audioCtx.currentTime + 3.0);
            }
        } catch(e) { console.warn("Audio not initialized"); }
    };

    function renderRound() {
        if (progress >= MAX_PROGRESS) {
            triggerWin();
            return;
        }

        currentTarget = getRandomWord(words);
        let failsafe = 20;
        while (currentTarget === lastWord && words.length > 1 && failsafe > 0) {
            currentTarget = getRandomWord(words);
            failsafe--;
        }
        lastWord = currentTarget;

        targetWordEl.textContent = currentTarget;
        targetWordEl.style.animation = 'none';
        void targetWordEl.offsetWidth;
        targetWordEl.style.animation = 'popIn 0.5s ease-out';

        // Generate 3 unique options
        options = [currentTarget];
        let attempts = 0;
        while (options.length < 3 && attempts < 50) {
            attempts++;
            let random = getRandomWord(words);
            if (!options.includes(random)) {
                options.push(random);
            }
        }
        
        // If not enough words available to make 3 unique, fill with duplicates (fail safe)
        while (options.length < 3) {
            options.push(words[Math.floor(Math.random() * words.length)]);
        }

        // Shuffle options
        options.sort(() => Math.random() - 0.5);

        optionsRack.innerHTML = '';
        options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.style.background = 'rgba(255,255,255,0.9)';
            btn.style.color = '#2F3542';
            btn.style.border = '4px solid #4ECDC4';
            btn.style.fontSize = '2rem';
            btn.style.padding = '1rem 2rem';
            btn.style.minWidth = '150px';
            btn.style.boxShadow = '0 8px 0 #3baba3';
            btn.style.transform = 'translateY(0)';
            btn.style.transition = 'all 0.1s';
            btn.style.textTransform = 'lowercase';
            btn.textContent = opt.toLowerCase();

            btn.addEventListener('click', () => handleChoice(opt, btn));
            
            // Staggered entry animation
            btn.style.animation = `popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${idx * 0.1}s both`;
            
            optionsRack.appendChild(btn);
        });
    }

    function handleChoice(chosenWord, btnEl) {
        // Disable all buttons temporarily
        Array.from(optionsRack.children).forEach(b => b.style.pointerEvents = 'none');

        if (chosenWord === currentTarget) {
            // Correct!
            playSound('bing');
            btnEl.style.background = '#4ECDC4';
            btnEl.style.color = 'white';
            btnEl.style.boxShadow = '0 0 0 #3baba3';
            btnEl.style.transform = 'translateY(8px)';
            
            progress++;
            progressText.textContent = `${progress}/${MAX_PROGRESS}`;
            
            // Animate rocket up
            const stepPercent = 10 + (progress * 15); // 10, 25, 40, 55, 70, 85
            rocketEl.style.bottom = `${stepPercent}%`;
            flameEl.style.fontSize = '5rem';
            setTimeout(() => flameEl.style.fontSize = '3rem', 1000);

            setTimeout(() => {
                renderRound();
            }, 1200);

        } else {
            // Incorrect
            playSound('buzz');
            btnEl.style.background = '#FF6B6B';
            btnEl.style.color = 'white';
            btnEl.style.borderColor = '#FF6B6B';
            btnEl.style.boxShadow = '0 0 0 #d95353';
            btnEl.style.transform = 'translateY(8px)';

            // Shake rocket
            rocketEl.style.animation = 'none';
            void rocketEl.offsetWidth;
            rocketEl.style.animation = 'shake 0.4s';
            
            // Drop down one progress point
            progress = Math.max(0, progress - 1);
            progressText.textContent = `${progress}/${MAX_PROGRESS}`;
            const stepPercent = 10 + (progress * 15);
            rocketEl.style.bottom = `${stepPercent}%`;
            
            // Add shake animation to css dynamically if not exists
            if (!document.getElementById('shake-anim')) {
                const style = document.createElement('style');
                style.id = 'shake-anim';
                style.innerHTML = `
                    @keyframes shake {
                        0%, 100% { transform: translateX(-50%) rotate(0deg); }
                        25% { transform: translateX(-50%) rotate(-10deg); }
                        75% { transform: translateX(-50%) rotate(10deg); }
                    }
                `;
                document.head.appendChild(style);
            }

            setTimeout(() => {
                // Re-enable others, reset this one
                btnEl.style.background = 'rgba(255,255,255,0.9)';
                btnEl.style.color = '#2F3542';
                btnEl.style.borderColor = '#4ECDC4';
                btnEl.style.boxShadow = '0 8px 0 #3baba3';
                btnEl.style.transform = 'translateY(0)';
                
                Array.from(optionsRack.children).forEach(b => b.style.pointerEvents = 'auto');
            }, 800);
        }
    }

    function triggerWin() {
        document.getElementById('mission-panel').style.display = 'none';
        const winPanel = document.getElementById('win-panel');
        winPanel.style.display = 'flex';
        winPanel.style.animation = 'popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        planetEl.style.filter = 'drop-shadow(0 0 50px rgba(255, 230, 109, 1))';
        planetEl.textContent = '🥳';
        
        // Crazy flight animation!
        if (!document.getElementById('crazy-fly-anim')) {
            const style = document.createElement('style');
            style.id = 'crazy-fly-anim';
            style.innerHTML = `
                @keyframes crazyFly {
                    0% { transform: translate(-50%, 0) rotate(0deg) scale(1.5); }
                    15% { transform: translate(150px, -200px) rotate(45deg) scale(2.5); }
                    30% { transform: translate(300px, 150px) rotate(135deg) scale(2); }
                    45% { transform: translate(-100px, 200px) rotate(-45deg) scale(3); }
                    60% { transform: translate(-300px, -150px) rotate(-135deg) scale(2); }
                    75% { transform: translate(100px, -350px) rotate(90deg) scale(4); }
                    90% { transform: translate(-150px, 100px) rotate(270deg) scale(2.5); }
                    100% { transform: translate(-50%, 0) rotate(720deg) scale(1.5); }
                }
            `;
            document.head.appendChild(style);
        }
        
        rocketEl.style.transition = 'none';
        rocketEl.style.zIndex = '100';
        rocketEl.style.bottom = '50%';
        rocketEl.style.animation = 'crazyFly 3s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite';
        flameEl.style.fontSize = '8rem';
        flameEl.style.display = 'block';
        
        playSound('crazy');

        document.getElementById('play-again-btn').onclick = () => {
            progress = 0;
            progressText.textContent = `0/${MAX_PROGRESS}`;
            
            winPanel.style.display = 'none';
            document.getElementById('mission-panel').style.display = 'block';
            
            planetEl.style.filter = 'drop-shadow(0 0 20px rgba(255,255,255,0.5))';
            planetEl.textContent = '🌕';
            
            rocketEl.style.animation = 'none';
            rocketEl.style.transition = 'bottom 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
            rocketEl.style.bottom = '10%';
            rocketEl.style.zIndex = '1';
            flameEl.style.fontSize = '3rem';

            renderRound();
        };
    }

    // Start
    renderRound();
}

function getRandomWord(words) {
    if (!words || words.length === 0) return "Word";
    return words[Math.floor(Math.random() * words.length)];
}
