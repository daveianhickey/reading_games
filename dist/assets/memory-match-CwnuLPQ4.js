function M(l,c,m){var v;let n=0,a=[],p=0,o=!1,y=[...c];const f=6;let s=[];for(let r=0;r<f;r++)s.push(y[r%y.length]);let u=[...s,...s];u.sort(()=>Math.random()-.5),l.innerHTML=`
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 0.5rem; background: var(--glass-bg); border-radius: 50px; backdrop-filter: blur(10px);">
            <button class="btn btn-secondary" id="back-btn" style="padding: 0.5rem 1.5rem;">← Back</button>
            <h2 style="margin: 0; padding-right: 1.5rem; color: var(--text-dark);">Score: <span id="score" style="color: var(--primary);">${n}</span></h2>
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
                ${u.map((r,e)=>`
                    <div class="memory-card" data-word="${r}" style="
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
                            ${r}
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
                `).join("")}
            </div>
        </div>
    `,document.getElementById("back-btn").addEventListener("click",m);const k=document.querySelectorAll(".memory-card");(v=document.getElementById("play-again-btn"))==null||v.addEventListener("click",()=>{M(l,c,m)}),k.forEach(r=>{r.addEventListener("click",w)});function w(){o||this!==a[0]&&(this.classList.contains("matched")||(this.style.transform="rotateY(180deg)",this.style.webkitTransform="rotateY(180deg)",a.push(this),a.length===2&&F()))}function F(){a[0].dataset.word===a[1].dataset.word?(E(),g(20),p++,p===f&&setTimeout(()=>{document.getElementById("win-message").style.display="block",B()},500)):(C(),g(-5))}function E(){a[0].classList.add("matched"),a[1].classList.add("matched"),a[0].querySelector(".card-front").style.background="#e2f0cb",a[1].querySelector(".card-front").style.background="#e2f0cb",h(a[0]),h(a[1]),b()}function C(){o=!0,setTimeout(()=>{a[0].style.transform="rotateY(0deg)",a[0].style.webkitTransform="rotateY(0deg)",a[1].style.transform="rotateY(0deg)",a[1].style.webkitTransform="rotateY(0deg)",b()},1e3)}function b(){[a,o]=[[],!1]}function g(r){n=Math.max(0,n+r),document.getElementById("score").textContent=n,document.getElementById("score").style.animation="popIn 0.3s ease-out",setTimeout(()=>document.getElementById("score").style.animation="none",300)}function h(r){const e=r.getBoundingClientRect();e.left+e.width/2,e.top+e.height/2;for(let i=0;i<15;i++){let x=function(){d++,t.style.left="${parseFloat(conf.style.left) + vx}px",t.style.top="${parseFloat(conf.style.top) + vy}px",t.style.opacity=1-d/30,d<30?requestAnimationFrame(x):t.parentNode&&t.parentNode.removeChild(t)};const t=document.createElement("div");t.style.position="fixed",t.style.left="${x}px",t.style.top="${y}px",t.style.width="8px",t.style.height="8px",t.style.background=["#FF6B6B","#4ECDC4","#FFE66D"][Math.floor(Math.random()*3)],t.style.borderRadius="50%",t.style.pointerEvents="none",t.style.zIndex="1000",document.body.appendChild(t);let d=0;requestAnimationFrame(x)}}function B(){for(let r=0;r<100;r++){let i=function(){parseFloat(e.style.left);let t=parseFloat(e.style.top);e.style.left="${curLeft + vx + Math.sin(tick*0.1)*2}px",e.style.top="${curTop + vy}px",e.style.transform="rotate(${tick * 5}deg)",t<window.innerHeight?requestAnimationFrame(i):e.parentNode&&e.parentNode.removeChild(e)};const e=document.createElement("div");e.style.position="fixed",e.style.left="${Math.random() * window.innerWidth}px",e.style.top="${-10}px",e.style.width="10px",e.style.height="10px",e.style.background=["#FF6B6B","#4ECDC4","#FFE66D","#FFF","#a1c4fd"][Math.floor(Math.random()*5)],e.style.borderRadius=Math.random()>.5?"50%":"0",e.style.pointerEvents="none",e.style.zIndex="1000",document.body.appendChild(e),requestAnimationFrame(i)}}}export{M as initMemoryMatch};
