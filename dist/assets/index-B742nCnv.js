(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))a(e);new MutationObserver(e=>{for(const n of e)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&a(r)}).observe(document,{childList:!0,subtree:!0});function c(e){const n={};return e.integrity&&(n.integrity=e.integrity),e.referrerPolicy&&(n.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?n.credentials="include":e.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(e){if(e.ep)return;e.ep=!0;const n=c(e);fetch(e.href,n)}})();const E="modulepreload",P=function(t){return"/"+t},f={},y=function(s,c,a){let e=Promise.resolve();if(c&&c.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),i=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));e=Promise.allSettled(c.map(l=>{if(l=P(l),l in f)return;f[l]=!0;const u=l.endsWith(".css"),h=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${h}`))return;const d=document.createElement("link");if(d.rel=u?"stylesheet":E,u||(d.as="script"),d.crossOrigin="",d.href=l,i&&d.setAttribute("nonce",i),document.head.appendChild(d),u)return new Promise((v,w)=>{d.addEventListener("load",v),d.addEventListener("error",()=>w(new Error(`Unable to preload CSS for ${l}`)))})}))}function n(r){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=r,window.dispatchEvent(i),!i.defaultPrevented)throw r}return e.then(r=>{for(const i of r||[])i.status==="rejected"&&n(i.reason);return s().catch(n)})};let o=JSON.parse(localStorage.getItem("readingWords"))||[],m;function x(){m=document.querySelector("#app"),g()}function g(){o.length<3?b():p()}function b(){m.innerHTML=`
    <div class="glass-card" style="max-width: 600px; margin: 2rem auto; animation: popIn 0.5s ease-out;">
      <h1 class="title-bounce">Fun Words!</h1>
      <p style="text-align: center; font-size: 1.2rem; margin-bottom: 2rem; font-weight: 600;">
        Parents: Enter 3 to 10 words for your child to learn and play with!
      </p>
      
      <div id="word-list" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
        ${[0,1,2,3,4,5,6,7,8,9].map(t=>`
          <input type="text" 
                 class="word-input" 
                 id="word-${t}" 
                 placeholder="Word ${t+1}"
                 value="${o[t]||""}"
                 style="display: ${t<3||o[t]||o[t-1]?"block":"none"};"
          >
        `).join("")}
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <button class="btn btn-secondary" id="add-word-btn" style="${o.length>=10?"display: none;":""}">+ Add Word</button>
        <button class="btn" id="save-words-btn">Start Playing! 🚀</button>
      </div>
    </div>
  `,L()}function L(){const t=document.querySelectorAll(".word-input"),s=document.getElementById("add-word-btn"),c=document.getElementById("save-words-btn");let a=Math.max(3,o.length+(o.length<10?1:0));s.addEventListener("click",()=>{a<10&&(document.getElementById(`word-${a}`).style.display="block",a++,a>=10&&(s.style.display="none"))}),c.addEventListener("click",()=>{const e=Array.from(t).map(n=>n.value.trim().toLowerCase()).filter(n=>n.length>0);if(e.length<3){alert("Parents! Please enter at least 3 words to start.");return}if(e.length>10){alert("Maximum 10 words allowed.");return}o=e,localStorage.setItem("readingWords",JSON.stringify(o)),g()})}function p(){m.innerHTML=`
    <h1 style="margin-top: 1rem;" class="title-bounce">Game Hub</h1>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; background: var(--glass-bg); padding: 1rem 2rem; border-radius: 50px; backdrop-filter: blur(10px);">
        <p style="font-size: 1.2rem; font-weight: 800; margin: 0;">My Words: <span style="color: var(--primary);">${o.join(", ")}</span></p>
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

    </div>
  `,document.getElementById("edit-words-btn").addEventListener("click",()=>{b()}),document.getElementById("game-bubble-pop").addEventListener("click",()=>{S()}),document.getElementById("game-memory-match").addEventListener("click",()=>{B()})}function S(){y(()=>import("./bubble-pop-f7e4FaGf.js"),[]).then(t=>{t.initBubblePop(m,o,p)}).catch(t=>{console.error("Failed to load game",t),alert("Game is still being built!")})}function B(){y(()=>import("./memory-match-CwnuLPQ4.js"),[]).then(t=>{t.initMemoryMatch(m,o,p)}).catch(t=>{console.error("Failed to load game",t),alert("Game is still being built!")})}x();
