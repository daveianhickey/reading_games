import './style.css';
import { renderSelector } from './phonics/selector.js';
import { getSelectedItems } from './phonics/practice.js';
import { label } from './phonics/curriculum.js';
import { getStickers } from './phonics/engine.js';

// Year 1 phonics games (see docs/year1-game-design-guidelines.md). They don't need typed words.
const YEAR1_GAMES = [
  { id: 'iron-rig', load: () => import('./games/year1/iron-rig.js'), init: 'initIronRig', icon: '🏋️', name: 'Iron Rig', blurb: 'Match sounds to power up the robot!', color: '#E67E22' },
  { id: 'rocket-bay', load: () => import('./games/year1/rocket-bay.js'), init: 'initRocketBay', icon: '🚀', name: 'Rocket Bay', blurb: 'Build a rocket and blast off!', color: '#3867d6' },
  { id: 'bot-snap', load: () => import('./games/year1/bot-snap.js'), init: 'initBotSnap', icon: '🤖', name: 'Bot Snap', blurb: 'SNAP the words to fix the robot!', color: '#20bf6b' },
  { id: 'orbit', load: () => import('./games/year1/orbit-defense.js'), init: 'initOrbitDefense', icon: '🛡️', name: 'Orbit Defender', blurb: 'Shield the moon base!', color: '#8854d0' },
  { id: 'mech', load: () => import('./games/year1/mech-builder.js'), init: 'initMechBuilder', icon: '🦾', name: 'Mech Builder', blurb: 'Forge armour for your mech!', color: '#c0392b' }
];

// App State
let words = JSON.parse(localStorage.getItem('readingWords')) || [];
let appContainer;

function initApp() {
  appContainer = document.querySelector('#app');
  renderScreen();
}

function renderScreen() {
  if (words.length < 3 && localStorage.getItem('skipWordSetup') !== '1') {
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
      <div style="text-align: center; margin-top: 1.5rem;">
        <button class="btn btn-secondary" id="year1-skip-btn" style="font-size: 1rem;">Year 1 Phonics games →</button>
      </div>
    </div>
  `;

  setupParentEventListeners();
}

function setupParentEventListeners() {
   const inputs = document.querySelectorAll('.word-input');
   const addBtn = document.getElementById('add-word-btn');
   const saveBtn = document.getElementById('save-words-btn');
   document.getElementById('year1-skip-btn').addEventListener('click', () => {
     localStorage.setItem('skipWordSetup', '1');
     renderGameHub();
   });

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
    ${words.length < 3 ? renderYear1Section() : ''}
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: var(--glass-bg); padding: 1rem 2rem; border-radius: 50px; backdrop-filter: blur(10px);">
        <p style="font-size: 1.2rem; font-weight: 800; margin: 0;">My Words: <span style="color: var(--primary);">${words.length ? words.join(', ') : 'none yet'}</span></p>
        <button class="btn btn-secondary" id="edit-words-btn" style="padding: 0.5rem 1.5rem; font-size: 1rem; box-shadow: 0 4px 0 #0ABDE3;">${words.length ? 'Edit' : 'Add'}</button>
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

      <!-- Sound Spotter Game Card -->
      <div class="glass-card" style="text-align: center; cursor: pointer; animation: popIn 0.5s ease-out 0.4s both; display: flex; flex-direction: column; align-items: center;" id="game-sound-spotter">
        <div style="font-size: 5rem; margin-bottom: 1rem; animation: float 3s ease-in-out infinite 1.5s;">🕵️</div>
        <h2 style="color: #8E44AD; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Sound Spotter</h2>
        <p style="font-size: 1.2rem; margin-bottom: 1.5rem; font-weight: 600;">Find digraphs & trigraphs in sentences!</p>
        <button class="btn" style="width: 100%; background: #9B59B6; box-shadow: 0 8px 0 #8E44AD;">Play Now</button>
      </div>

    </div>

    ${words.length >= 3 ? renderYear1Section() : ''}
  `;

  setupYear1Listeners();

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
  
  document.getElementById('game-sound-spotter').addEventListener('click', () => {
      startSoundSpotter();
  });
}

function startBubblePop() {
    if (words.length < 3) return renderParentSetup();
    import('./games/bubble-pop.js').then(module => {
        module.initBubblePop(appContainer, words, renderGameHub);
    }).catch(err => {
        console.error("Failed to load game", err);
        alert("Game is still being built!");
    });
}

function startMemoryMatch() {
    if (words.length < 3) return renderParentSetup();
    import('./games/memory-match.js').then(module => {
        module.initMemoryMatch(appContainer, words, renderGameHub);
    }).catch(err => {
        console.error("Failed to load game", err);
        alert("Game is still being built!");
    });
}

function startRocketRace() {
    if (words.length < 3) return renderParentSetup();
    import('./games/rocket-race.js').then(module => {
        module.initRocketRace(appContainer, words, renderGameHub);
    }).catch(err => {
        console.error("Failed to load game", err);
        alert("Game is still being built!");
    });
}

function startSoundSpotter() {
    if (words.length < 3) return renderParentSetup();
    import('./games/sound-spotter.js').then(module => {
        module.initSoundSpotter(appContainer, words, renderGameHub);
    }).catch(err => {
        console.error("Failed to load game", err);
        alert("Game is still being built!");
    });
}

function renderYear1Section() {
  const chosen = getSelectedItems(words);
  const stickers = getStickers();
  return `
    <section style="margin-top: 3rem;">
      <h1 class="title-bounce" style="font-size: 2.8rem; margin-bottom: 1rem;">Year 1 Phonics 🚀</h1>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; background: var(--glass-bg); padding: 1rem 2rem; border-radius: 30px; backdrop-filter: blur(10px);">
        <p style="font-size: 1.1rem; font-weight: 800; margin: 0; flex: 1;">
          Practising: <span style="color: var(--primary);">${chosen.length ? [...new Set(chosen.map(label))].join(' · ') : 'each game\'s starter set'}</span>
        </p>
        <button class="btn" id="year1-choose-btn" style="padding: 0.6rem 1.5rem; font-size: 1rem;">Choose sounds 🎯</button>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;">
        ${YEAR1_GAMES.map((g, i) => `
          <button class="glass-card year1-card" data-game="${g.id}" style="text-align: center; cursor: pointer; border: none; font-family: inherit; padding: 1.5rem; animation: popIn 0.5s ease-out ${0.1 * i}s both; display: flex; flex-direction: column; align-items: center;">
            <div style="font-size: 4rem; animation: float 3s ease-in-out infinite ${i * 0.5}s;">${g.icon}</div>
            <h2 style="font-size: 1.8rem; margin: 0.5rem 0; color: ${g.color};">${g.name}</h2>
            <p style="font-size: 1.05rem; font-weight: 600; margin: 0;">${g.blurb}</p>
          </button>
        `).join('')}
      </div>
      ${stickers.length ? `
        <div class="glass-card" style="margin-top: 1.5rem; padding: 1rem 1.5rem; text-align: center;">
          <strong style="font-size: 1.1rem;">My stickers:</strong>
          <span style="font-size: 2rem; letter-spacing: 0.3rem;">${stickers.join('')}</span>
        </div>` : ''}
    </section>
  `;
}

function setupYear1Listeners() {
  document.getElementById('year1-choose-btn').addEventListener('click', () => {
    renderSelector(appContainer, words, renderGameHub);
    window.scrollTo(0, 0);
  });
  document.querySelectorAll('.year1-card').forEach(card => {
    card.addEventListener('click', () => startYear1Game(YEAR1_GAMES.find(g => g.id === card.dataset.game)));
  });
}

function startYear1Game(game) {
    game.load().then(module => {
        window.scrollTo(0, 0);
        module[game.init](appContainer, words, renderGameHub);
    }).catch(err => {
        console.error("Failed to load game", err);
        alert("Game is still being built!");
    });
}

// Start
initApp();
