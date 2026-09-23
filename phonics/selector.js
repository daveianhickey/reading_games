// "What shall we practise?" screen: the learner (or a grown-up) taps sounds and words to practise.
import { TERMS, MY_WORDS_SET_ID, customWordItems, label } from './curriculum.js';
import { getSelection, setSelection, getProgress } from './practice.js';
import { say, spokenText } from './engine.js';

export function renderSelector(container, words, onDone) {
    const selected = new Set(getSelection());
    const progress = getProgress();
    const mySet = words.length
        ? [{ id: MY_WORDS_SET_ID, title: 'My words', subtitle: 'Typed in by a grown-up', items: customWordItems(words) }]
        : [];

    container.innerHTML = `
        <style>
            .sel-wrap { animation: popIn 0.4s ease-out; }
            .sel-head { display: flex; align-items: center; gap: 1rem; background: var(--glass-bg); border-radius: 50px; padding: 0.6rem; margin-bottom: 1rem; backdrop-filter: blur(10px); }
            .sel-head h1 { font-size: 2rem; margin: 0; flex: 1; letter-spacing: 0; }
            .sel-term { margin-bottom: 1.5rem; }
            .sel-term > h2 { font-size: 1.6rem; margin-bottom: 0.8rem; color: var(--text-dark); }
            .sel-set { margin-bottom: 1.2rem; padding: 1.2rem; }
            .sel-set-head { display: flex; align-items: baseline; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 0.8rem; }
            .sel-set-head h3 { font-size: 1.4rem; margin: 0; }
            .sel-set-head small { opacity: 0.7; font-weight: 600; flex: 1; }
            .sel-mini { border: none; border-radius: 30px; padding: 0.5rem 1rem; font-family: inherit; font-weight: 800; cursor: pointer; background: #fff; box-shadow: 0 3px 0 #ccc; min-height: 44px; }
            .sel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 0.7rem; }
            .sel-chip { position: relative; border: 4px solid transparent; background: #fff; border-radius: 20px; padding: 0.6rem 0.4rem; cursor: pointer; font-family: inherit; text-align: center; box-shadow: 0 4px 0 #d9d9d9; min-height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem; transition: transform 0.15s; }
            .sel-chip:active { transform: translateY(3px); }
            .sel-chip:focus-visible { outline: 5px solid var(--secondary); outline-offset: 2px; }
            .sel-chip .g { font-size: 2rem; font-weight: 800; color: var(--text-dark); line-height: 1.1; }
            .sel-chip .e { font-size: 1.6rem; }
            .sel-chip .p { font-size: 0.8rem; font-weight: 600; color: #666; line-height: 1.1; }
            .sel-chip .stars { position: absolute; top: 4px; left: 8px; font-size: 0.75rem; font-weight: 800; color: #F39C12; }
            .sel-chip[aria-pressed="true"] { border-color: var(--secondary); background: #e3fbf8; box-shadow: 0 4px 0 #0ABDE3; }
            .sel-chip[aria-pressed="true"]::after { content: '✔'; position: absolute; top: 4px; right: 8px; color: #0ABDE3; font-weight: 900; }
            .sel-foot { position: sticky; bottom: 0.5rem; display: flex; gap: 1rem; align-items: center; justify-content: center; flex-wrap: wrap; background: var(--glass-bg); backdrop-filter: blur(10px); padding: 0.8rem; border-radius: 50px; box-shadow: var(--shadow-md); }
            .sel-foot .count { font-weight: 800; font-size: 1.2rem; }
        </style>
        <div class="sel-wrap">
            <div class="sel-head">
                <button class="btn btn-secondary" id="sel-back" style="padding: 0.5rem 1.2rem;">←</button>
                <h1>What shall we practise? 🎯</h1>
            </div>
            <p style="font-weight: 600; margin: 0 0 1rem 0.5rem;">Tap sounds and words to choose them. Tap again to hear them. Nothing chosen? Each game picks its own starter set.</p>
            ${TERMS.map(term => renderGroup(term.title, term.sets)).join('')}
            ${mySet.length ? renderGroup('My words', mySet) : ''}
            <div class="sel-foot">
                <span class="count" id="sel-count"></span>
                <button class="sel-mini" id="sel-clear">Clear all</button>
                <button class="btn" id="sel-done">Let's play! 🚀</button>
            </div>
        </div>`;

    function renderGroup(title, sets) {
        return `
            <section class="sel-term">
                <h2>${title}</h2>
                ${sets.map(set => `
                    <div class="glass-card sel-set" data-set="${set.id}">
                        <div class="sel-set-head">
                            <h3>${set.title}</h3><small>${set.subtitle || ''}</small>
                            <button class="sel-mini" data-all="${set.id}">Choose all</button>
                            <button class="sel-mini" data-none="${set.id}">None</button>
                        </div>
                        <div class="sel-grid">
                            ${set.items.map(item => `
                                <button class="sel-chip" data-id="${item.id}" aria-pressed="${selected.has(item.id)}"
                                        aria-label="${label(item)}${item.phrase ? ', ' + item.phrase : ''}">
                                    ${progress[item.id]?.correct ? `<span class="stars">⭐${progress[item.id].correct}</span>` : ''}
                                    <span class="g">${label(item)}</span>
                                    <span class="e">${item.emoji || ''}</span>
                                    <span class="p">${item.phrase || item.example || ''}</span>
                                </button>`).join('')}
                        </div>
                    </div>`).join('')}
            </section>`;
    }

    const allSets = [...TERMS.flatMap(t => t.sets), ...mySet];
    const itemsById = new Map(allSets.flatMap(s => s.items).map(i => [i.id, i]));
    const countEl = container.querySelector('#sel-count');

    function refresh() {
        container.querySelectorAll('.sel-chip').forEach(chip => chip.setAttribute('aria-pressed', selected.has(chip.dataset.id)));
        countEl.textContent = selected.size ? `${selected.size} chosen` : 'Starter sets';
    }

    container.querySelectorAll('.sel-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.dataset.id;
            if (selected.has(id)) selected.delete(id); else selected.add(id);
            say(spokenText(itemsById.get(id)));
            refresh();
        });
    });
    container.querySelectorAll('[data-all]').forEach(btn => btn.addEventListener('click', () => {
        allSets.find(s => s.id === btn.dataset.all).items.forEach(i => selected.add(i.id));
        refresh();
    }));
    container.querySelectorAll('[data-none]').forEach(btn => btn.addEventListener('click', () => {
        allSets.find(s => s.id === btn.dataset.none).items.forEach(i => selected.delete(i.id));
        refresh();
    }));
    container.querySelector('#sel-clear').addEventListener('click', () => { selected.clear(); refresh(); });

    const finish = () => {
        // Drop ids that no longer exist (e.g. a removed custom word).
        setSelection([...selected].filter(id => itemsById.has(id)));
        onDone();
    };
    container.querySelector('#sel-done').addEventListener('click', finish);
    container.querySelector('#sel-back').addEventListener('click', finish);
    refresh();
}
