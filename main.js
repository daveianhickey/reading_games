import './style.css';

// App State
let words = JSON.parse(localStorage.getItem('readingWords')) || [];
let appContainer;

function initApp() {
  appContainer = document.querySelector('#app');
  renderScreen();
}

function renderScreen() {
  if (words.length < 3) {
    renderParentSetup();
  } else {
    renderGameHub();
  }
}

function renderParentSetup() {
  appContainer.innerHTML = `
    <div class="glass-card" style="max-width: 600px; margin: 2rem auto; animation: popIn 0.5s ease-out;">
      <h1 class="title-bounce">Fun Words!</h1>
      <p style="text-align: center; font-size: 1.2rem; margin-bottom: 2rem; font-weight: 600;">
        Parents: Enter 3 to 10 words for your child to learn and play with!
      </p>
      
      <div id="word-list" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `
          <input type="text" 
                 class="word-input" 
                 id="word-${i}" 
                 placeholder="Word ${i + 1}"
                 value="${words[i] || ''}"
                 style="display: ${i < 3 || (words[i] || words[i-1]) ? 'block' : 'none'};"
          >
        `).join('')}
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-secondary" id="add-word-btn" style="${words.length >= 10 ? 'display: none;' : ''}">+ Add Word</button>
        <button class="btn" id="save-words-btn">Start Playing! 🚀</button>
      </div>
    </div>
  `;

  setupParentEventListeners();
}

function setupParentEventListeners() {
   const inputs = document.querySelectorAll('.word-input');
   const addBtn = document.getElementById('add-word-btn');
   const saveBtn = document.getElementById('save-words-btn');

   let visibleCount = Math.max(3, words.length + (words.length < 10 ? 1 : 0));

   addBtn.addEventListener('click', () => {
     if (visibleCount < 10) {
       document.getElementById(`word-${visibleCount}`).style.display = 'block';
       visibleCount++;
       if (visibleCount >= 10) addBtn.style.display = 'none';
     }
   });

   saveBtn.addEventListener('click', () => {
     const newWords = Array.from(inputs)
       .map(input => input.value.trim().toLowerCase())
       .filter(w => w.length > 0);

     if (newWords.length < 3) {
       alert("Parents! Please enter at least 3 words to start.");
       return;
     }
     if (newWords.length > 10) {
       alert("Maximum 10 words allowed.");
       return;
     }

     words = newWords;
     localStorage.setItem('readingWords', JSON.stringify(words));
     renderScreen(); 
   });
}

function renderGameHub() {
  appContainer.innerHTML = `
    <h1 style="margin-top: 1rem;" class="title-bounce">Game Hub</h1>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: var(--glass-bg); padding: 1rem 2rem; border-radius: 50px; backdrop-filter: blur(10px);">
        <p style="font-size: 1.2rem; font-weight: 800; margin: 0;">My Words: <span style="color: var(--primary);">${words.join(', ')}</span></p>
        <button class="btn btn-secondary" id="edit-words-btn" style="padding: 0.5rem 1.5rem; font-size: 1rem; box-shadow: 0 4px 0 #0ABDE3;">Edit</button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
      
      <!-- Bubble Pop Game Card -->
      <div class="glass-card" style="text-align: center; cursor: pointer; animation: popIn 0.5s ease-out 0.1s both; display: flex; flex-direction: column; align-items: center;" id="game-bubble-pop">
        <div style="font-size: 5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite;">🫧</div>
        <h2>Bubble Pop</h2>
        <p style="font-size: 1.2rem; margin-bottom: 1.5rem; font-weight: 600;">Find the right word and POP it!</p>
        <button class="btn" style="width: 100%;">Play Now</button>
      </div>

      <!-- Memory Match Game Card -->
      <div class="glass-card" style="text-align: center; cursor: pointer; animation: popIn 0.5s ease-out 0.2s both; display: flex; flex-direction: column; align-items: center;" id="game-memory-match">
        <div style="font-size: 5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite 1s;">🃏</div>
        <h2 style="color: var(--primary);">Memory Match</h2>
        <p style="font-size: 1.2rem; margin-bottom: 1.5rem; font-weight: 600;">Flip cards and match the words!</p>
        <button class="btn btn-secondary" style="width: 100%;">Play Now</button>
      </div>

      <!-- Rocket Game Card -->
      <div class="glass-card" style="text-align: center; cursor: pointer; animation: popIn 0.5s ease-out 0.3s both; display: flex; flex-direction: column; align-items: center;" id="game-rocket-race">
        <div style="font-size: 5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite 2s;">🚀</div>
        <h2 style="color: #FFE66D; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">Rocket Race</h2>
        <p style="font-size: 1.2rem; margin-bottom: 1.5rem; font-weight: 600;">Blast the correct words to space!</p>
        <button class="btn btn-secondary" style="width: 100%; border-color: #FFE66D; box-shadow: 0 4px 0 #F39C12;">Play Now</button>
      </div>

    </div>
  `;

  document.getElementById('edit-words-btn').addEventListener('click', () => {
    // Clear words internally to force setup render but preserve input values
    renderParentSetup();
  });
  
  document.getElementById('game-bubble-pop').addEventListener('click', () => {
      startBubblePop();
  });
  
  document.getElementById('game-memory-match').addEventListener('click', () => {
      startMemoryMatch();
  });
  
  document.getElementById('game-rocket-race').addEventListener('click', () => {
      startRocketRace();
  });
}

function startBubblePop() {
    import('./games/bubble-pop.js').then(module => {
        module.initBubblePop(appContainer, words, renderGameHub);
    }).catch(err => {
        console.error("Failed to load game", err);
        alert("Game is still being built!");
    });
}

function startMemoryMatch() {
    import('./games/memory-match.js').then(module => {
        module.initMemoryMatch(appContainer, words, renderGameHub);
    }).catch(err => {
        console.error("Failed to load game", err);
        alert("Game is still being built!");
    });
}

function startRocketRace() {
    import('./games/rocket-race.js').then(module => {
        module.initRocketRace(appContainer, words, renderGameHub);
    }).catch(err => {
        console.error("Failed to load game", err);
        alert("Game is still being built!");
    });
}

// Start
initApp();
