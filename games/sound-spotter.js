export function initSoundSpotter(container, wordsList, onBack) {
    // 1. Static Reference Data from Phonics Briefing
    const sentences = [
        "I can see a ship and a chip.",
        "The king is with the queen.",
        "The rain is on the green tree.",
        "The light is bright at night.",
        "The goat is in the moon boot.",
        "The fork is in the dark car.",
        "I can hear the owl in the air."
    ];

    const TRICKY_WORDS = [
        "the", "to", "i", "no", "put", "of", "is", "go", "into", "pull", 
        "as", "his", "he", "she", "buses", "me", "be", "push", "was", "her", 
        "my", "you", " તેઓ", "they", "all", "are", "ball", "tall", "when", "what", 
        "said", "so", "have", "were", "out", "like", "some", "come", "there", 
        "little", "one", "do", "children", "love", "oh", "their", "a", "people", 
        "mr", "mrs", "your", "ask", "should", "would", "could", "asked", "house", 
        "mouse", "water", "want", "very"
    ];

    const DIGRAPHS = ["ck", "ss", "ff", "ll", "zz", "qu", "ch", "sh", "th", "ng", "nk", "ai", "ee", "oa", "oo", "ar", "ur", "or", "ow", "oi", "er", "ure"];
    const TRIGRAPHS = ["igh", "ear", "air"];
    
    // Sort so trigraphs are searched first, preventing 'ig' inside 'igh' bugs.
    const PHONICS = [...TRIGRAPHS, ...DIGRAPHS];

    // 2. Game State
    let currentSentenceIndex = 0;
    let currentSentence = "";
    let wordsData = []; // Mapped representation of the sentence logic
    let gameState = "TRICKY"; // Phases: TRICKY -> DIGRAPHS -> DONE

    let trickyFound = 0, trickyTotal = 0;
    let phonicsFound = 0, phonicsTotal = 0;

    // 3. UI Scaffolding
    container.innerHTML = `
        <style>
            .spotter-board {
                position: relative; height: 70vh; overflow: hidden; 
                background: #2C3E50; border-radius: 30px; 
                box-shadow: inset 0 0 50px rgba(0,0,0,0.8); 
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                border: 12px solid #8E44AD;
            }
            .spotter-word {
                display: inline-block;
                margin: 1rem 1.5rem;
                cursor: pointer;
                font-size: 5rem;
                font-weight: 800;
                color: #ECF0F1;
                transition: transform 0.2s, background 0.3s;
                border-radius: 12px;
                user-select: none;
            }
            .spotter-chunk {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                padding: 0 4px;
                vertical-align: top;
            }
            .spotter-marker-box {
                height: 20px;
                width: 100%;
                margin-top: -5px;
                display: flex;
                justify-content: center;
                transition: all 0.2s ease-out;
            }
            @media (max-width: 768px) {
                .spotter-word { font-size: 3rem; margin: 0.5rem 0.5rem; }
                .spotter-board { padding: 1rem; border-width: 6px; }
                #counter-widget { font-size: 2.5rem !important; padding: 0.8rem 2rem !important; }
                #objective-msg { font-size: 1.2rem !important; }
            }
        </style>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0.8rem; background: var(--glass-bg); border-radius: 50px; backdrop-filter: blur(10px); gap: 1rem;">
            <button class="btn btn-secondary" id="back-btn" style="padding: 0.5rem 1.5rem; text-transform: lowercase; flex-shrink: 0;">← back</button>
            <h2 id="objective-msg" style="margin: 0; flex-grow: 1; text-align: center; color: var(--text-dark); text-transform: lowercase; font-size: 1.8rem;">Loading...</h2>
        </div>
        
        <div style="display: flex; justify-content: center; margin-bottom: -40px; position: relative; z-index: 10;">
            <div id="counter-widget" style="display: none; color: white; padding: 1rem 3rem; border-radius: 50px; font-size: 4rem; font-weight: 900; transition: background 0.3s;">
                <span id="counter-current">0</span> / <span id="counter-total">3</span> ⭐️
            </div>
        </div>
        
        <div class="spotter-board" id="chalkboard">
            <div id="sentence-board" style="text-align: center; width: 95%; line-height: 1.6;"></div>
            
            <button id="next-btn" class="btn" style="display:none; position:absolute; bottom:20px; font-size: 1.5rem; padding: 1rem 3rem;">Next Sentence ➡</button>
        </div>
    `;

    document.getElementById('back-btn').addEventListener('click', onBack);
    document.getElementById('next-btn').addEventListener('click', () => {
        document.getElementById('next-btn').style.display = 'none';
        currentSentenceIndex = (currentSentenceIndex + 1) % sentences.length;
        initRound();
    });

    const board = document.getElementById('sentence-board');
    const msgEl = document.getElementById('objective-msg');
    
    // Dynamic Score Tracker Widget
    const counterWidget = document.getElementById('counter-widget');
    const counterCurrent = document.getElementById('counter-current');
    const counterTotal = document.getElementById('counter-total');

    function updateCounterUI(current, total, color, shadowColor, show) {
        if (!show) {
            counterWidget.style.display = 'none';
            return;
        }
        counterWidget.style.display = 'block';
        counterWidget.style.background = color;
        counterWidget.style.boxShadow = `0 8px 0 ${shadowColor}, 0 15px 30px rgba(0,0,0,0.3)`;
        counterCurrent.innerText = current;
        counterTotal.innerText = total;
        
        // Excite the counter automatically when the number strictly ticks up
        counterWidget.style.animation = 'none';
        void counterWidget.offsetWidth;
        counterWidget.style.animation = 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    // 4. Audio Engine
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
                osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.1);
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
            } else if (type === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
                osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.4);
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
                gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.4);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.6);
            }
        } catch(e) { console.warn("Audio disabled"); }
    };

    // 5. Visual Confetti
    function createConfetti(x, y) {
        for (let i = 0; i < 40; i++) {
            const conf = document.createElement('div');
            conf.style.position = 'fixed';
            conf.style.left = `${x}px`;
            conf.style.top = `${y}px`;
            conf.style.width = '12px';
            conf.style.height = '12px';
            conf.style.background = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#3498DB', '#9B59B6'][Math.floor(Math.random() * 5)];
            conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '20%';
            conf.style.pointerEvents = 'none';
            conf.style.zIndex = '1000';
            document.body.appendChild(conf);

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 15 + 5;
            let vx = Math.cos(angle) * velocity;
            let vy = Math.sin(angle) * velocity - 10;
            let tick = 0;

            function animateConf() {
                tick++;
                vx *= 0.95;
                vy += 0.4;
                let curLeft = parseFloat(conf.style.left);
                let curTop = parseFloat(conf.style.top);
                conf.style.left = `${curLeft + vx}px`;
                conf.style.top = `${curTop + vy}px`;
                conf.style.transform = `rotate(${tick * 25}deg) scale(${1 - tick/80})`;

                if (tick < 80) requestAnimationFrame(animateConf);
                else conf.parentNode && conf.parentNode.removeChild(conf);
            }
            requestAnimationFrame(animateConf);
        }
    }

    // 6. Sentence Parsing Logic
    function parseSentence(sentenceText) {
        const rawWords = sentenceText.split(' ');
        let parsed = [];
        trickyTotal = 0; phonicsTotal = 0;
        trickyFound = 0; phonicsFound = 0;

        for (let w of rawWords) {
            const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
            const isTricky = TRICKY_WORDS.includes(cleanWord);
            
            let obj = {
                original: w,
                isTricky: isTricky,
                isFound: false,
                chunks: []
            };

            if (isTricky) {
                trickyTotal++;
                obj.chunks.push({ text: w, isPhoneme: false, isSingle: false, isFound: false });
            } else {
                let i = 0;
                while (i < w.length) {
                    let matched = false;
                    for (let p of PHONICS) {
                        if (w.toLowerCase().substring(i, i + p.length) === p) {
                            obj.chunks.push({ text: w.substring(i, i + p.length), isPhoneme: true, isSingle: false, isFound: false });
                            i += p.length;
                            matched = true;
                            phonicsTotal++;
                            break;
                        }
                    }
                    if (!matched) {
                        let char = w[i];
                        let isLetter = /[a-z]/i.test(char);
                        // We flag single sounds as naturally "found" already since there's no interactive phase for them
                        obj.chunks.push({ text: char, isPhoneme: false, isSingle: isLetter, isFound: true }); 
                        i++;
                    }
                }
            }
            parsed.push(obj);
        }
        return parsed;
    }

    function transitionState(newState) {
        gameState = newState;
        msgEl.style.animation = 'none';
        void msgEl.offsetWidth;
        
        if (newState === 'DIGRAPHS') {
            if (phonicsTotal === 0) return transitionState('DONE');
            msgEl.innerHTML = 'Phase 2: Spot the <span style="color:#E74C3C">Digraphs & Trigraphs</span>! <span style="font-family: monospace;">"_"</span>';
            msgEl.style.animation = 'popIn 0.5s';
            updateCounterUI(0, phonicsTotal, '#E74C3C', '#C0392B', true);
        } else if (newState === 'DONE') {
            updateCounterUI(0, 0, '', '', false);
            msgEl.innerHTML = 'Phase 3: <span style="color:#2ECC71">Read the sentence!</span>';
            msgEl.style.animation = 'bounce 1s infinite alternate';
            createConfetti(window.innerWidth/2, window.innerHeight/2);
            playSound('success');
            
            // Provide sound button dots automatically for all standard single sounds now that the interaction is over
            document.querySelectorAll('.spotter-marker-box.single-sound-marker').forEach(markerBox => {
                 markerBox.innerHTML = '<div style="width:12px; height:12px; background:#3498DB; border-radius:50%; margin-top:2px;"></div>';
                 markerBox.parentElement.style.animation = 'popIn 0.5s ease-out';
            });
            
            const nextBtn = document.getElementById('next-btn');
            nextBtn.style.display = 'block';
            nextBtn.style.animation = 'popIn 0.5s both';
        }
    }

    // 7. Interaction Logic
    function handleWordClick(wordObj, wordEl) {
        if (gameState === 'TRICKY') {
            if (wordObj.isTricky && !wordObj.isFound) {
                wordObj.isFound = true;
                trickyFound++;
                wordEl.style.background = 'rgba(241, 196, 15, 0.9)'; // Gold Tricky color
                wordEl.style.color = '#2C3E50';
                wordEl.style.transform = 'scale(1.1)';
                playSound('bing');
                
                updateCounterUI(trickyFound, trickyTotal, '#F1C40F', '#D4AC0D', true);
                
                if (trickyFound >= trickyTotal) {
                    setTimeout(() => {
                        Array.from(document.querySelectorAll('.spotter-word')).forEach(el => el.style.transform = 'scale(1)');
                        transitionState('DIGRAPHS');
                    }, 800);
                }
            } else if (!wordObj.isTricky) {
                playSound('buzz');
                wordEl.style.animation = 'none'; void wordEl.offsetWidth;
                wordEl.style.animation = 'shake 0.3s';
            }
        }
    }

    function handleChunkClick(chunk, chunkEl, wordObj, wordEl) {
        if (gameState === 'TRICKY') {
            handleWordClick(wordObj, wordEl);
        } else if (gameState === 'DIGRAPHS') {
            if (chunk.isPhoneme && !chunk.isFound) {
                chunk.isFound = true;
                phonicsFound++;
                playSound('bing');
                
                chunkEl.querySelector('.spotter-marker-box').style.borderBottom = '8px solid #E74C3C';
                chunkEl.style.transform = 'translateY(-5px)';
                
                updateCounterUI(phonicsFound, phonicsTotal, '#E74C3C', '#C0392B', true);
                
                if (phonicsFound >= phonicsTotal) setTimeout(() => transitionState('DONE'), 800);
            } else if (!chunk.isFound && chunk.isSingle) {
                playSound('buzz');
                chunkEl.style.animation = 'none'; void chunkEl.offsetWidth;
                chunkEl.style.animation = 'shake 0.3s';
            }
        }
    }

    function renderBoard() {
        board.innerHTML = '';
        wordsData.forEach((wordObj) => {
            let wEl = document.createElement('div');
            wEl.className = 'spotter-word';
            wEl.style.padding = wordObj.isTricky ? '0 10px' : '0';
            
            if (wordObj.isTricky) {
                wEl.innerText = wordObj.original;
                wEl.addEventListener('click', () => handleWordClick(wordObj, wEl));
            } else {
                wordObj.chunks.forEach(chunk => {
                    let cEl = document.createElement('span');
                    cEl.className = 'spotter-chunk';
                    
                    let textSpan = document.createElement('span');
                    textSpan.innerText = chunk.text;
                    cEl.appendChild(textSpan);

                    let markerBox = document.createElement('div');
                    markerBox.className = 'spotter-marker-box' + (chunk.isSingle ? ' single-sound-marker' : '');
                    cEl.appendChild(markerBox);

                    cEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        handleChunkClick(chunk, cEl, wordObj, wEl);
                    });
                    wEl.appendChild(cEl);
                });
            }
            board.appendChild(wEl);
        });
    }

    function initRound() {
        currentSentence = sentences[currentSentenceIndex];
        wordsData = parseSentence(currentSentence);
        renderBoard();

        if (trickyTotal > 0) {
            gameState = 'TRICKY';
            msgEl.innerHTML = 'Phase 1: Spot the <span style="color:#F1C40F">Tricky Words</span>!';
            updateCounterUI(0, trickyTotal, '#F1C40F', '#D4AC0D', true);
        } else if (phonicsTotal > 0) {
            transitionState('DIGRAPHS');
        } else {
            transitionState('DONE');
        }
    }

    // Start
    initRound();
}
