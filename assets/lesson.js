/* Общий код уроков. Подключать обычным <script src="/assets/lesson.js"></script> ДО скрипта урока.
   Даёт: $, NS, f2, rng, gauss — мелочи; frame, grid, pathOf — графики в SVG;
   initLesson({topics, md}) (md можно не передавать, если в уроке есть <script type="text/markdown" id="md">) — верхняя навигация на localhost, галочки тем (карточки .topic-check и список #topics,
   на сервере через /api/tree, Obsidian их показывает) и кнопка «Скопировать конспект» (#bCopy). */
const NS="http://www.w3.org/2000/svg";
const $=id=>document.getElementById(id);
const f2=v=>Math.abs(v)>=100?v.toFixed(0):Math.abs(v)>=10?v.toFixed(1):v.toFixed(2);
const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
/* Уроки английского (/lessons/eNN-…) отмечают темы в плане английского, уроки ML — в дереве. */
const TREE_API=/^\/lessons\/e\d/.test(location.pathname)?"/api/en/tree":"/api/tree";
const MARK_HINT=TREE_API==="/api/tree"?"отметка в дереве":"отметка в плане";

/* ---------- случайность с зерном: картинка одинаковая при каждом открытии ---------- */
function rng(seed){let a=seed>>>0;return function(){a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(r){let u=0;while(!u)u=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r())}

/* ---------- графики ---------- */
function frame(W,H,m,xr,yr){
  const sx=x=>m.l+(x-xr[0])/(xr[1]-xr[0])*(W-m.l-m.r);
  const sy=y=>H-m.b-(y-yr[0])/(yr[1]-yr[0])*(H-m.t-m.b);
  const ix=px=>xr[0]+(px-m.l)/(W-m.l-m.r)*(xr[1]-xr[0]);
  const iy=py=>yr[0]+(H-m.b-py)/(H-m.t-m.b)*(yr[1]-yr[0]);
  return {W,H,m,xr,yr,sx,sy,ix,iy,x0:m.l,x1:W-m.r,y0:m.t,y1:H-m.b};
}
function grid(F,xt,yt,xfmt=v=>v,yfmt=v=>v,xl="",yl=""){
  let s="";
  yt.forEach(v=>{const y=F.sy(v);s+=`<line class="ax" x1="${F.x0}" x2="${F.x1}" y1="${y}" y2="${y}"/><text class="tk" x="${F.x0-6}" y="${y+4}" text-anchor="end">${yfmt(v)}</text>`});
  xt.forEach(v=>{const x=F.sx(v);s+=`<text class="tk" x="${x}" y="${F.y1+16}" text-anchor="middle">${xfmt(v)}</text>`});
  if(xl)s+=`<text class="lbl" x="${F.x1}" y="${F.y1-6}" text-anchor="end">${xl}</text>`;
  if(yl)s+=`<text class="lbl" x="${F.x0+6}" y="${F.y0+12}">${yl}</text>`;
  return s;
}
function pathOf(F,xs,fn,clampY){
  let d="",pen=false;
  xs.forEach(x=>{let y=fn(x);if(!isFinite(y)){pen=false;return}
    y=Math.max(clampY[0],Math.min(clampY[1],y));
    d+=(pen?"L":"M")+F.sx(x).toFixed(1)+","+F.sy(y).toFixed(1);pen=true});
  return d;
}
/* Перевод координат указателя (мышь, палец) в координаты viewBox у SVG. */
function svgPoint(svg,e){const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return {x:(e.clientX-r.left)/r.width*vb.width+vb.x,y:(e.clientY-r.top)/r.height*vb.height+vb.y}}
/* Перетаскивание точки в SVG: onMove(x,y) получает координаты viewBox. */
function draggable(svg,hit,onMove){
  let on=false;
  svg.style.touchAction="none";  /* на телефоне палец тянет точку, а не листает страницу */
  svg.addEventListener("pointerdown",e=>{if(!hit(svgPoint(svg,e)))return;on=true;svg.setPointerCapture(e.pointerId);e.preventDefault()});
  svg.addEventListener("pointermove",e=>{if(on){const p=svgPoint(svg,e);onMove(p.x,p.y)}});
  const stop=()=>{on=false};svg.addEventListener("pointerup",stop);svg.addEventListener("pointercancel",stop);
}

/* ---------- галочки тем и конспект ---------- */
function initLesson({topics,md}){
  const TOPICS=topics;
  if(md===undefined&&$("md"))md=$("md").textContent.trim()+"\n";
  if(LOCAL&&$("topnav"))$("topnav").hidden=false;
  const box=$("topicList"),note=$("topicNote");
  if(box)box.innerHTML=TOPICS.map(([id,t])=>`<li><label class="tp"><input type="checkbox" id="tp-${id}" data-id="${id}" ${LOCAL?"":"disabled"}><span class="bx" aria-hidden="true"></span><span>${t}</span></label></li>`).join("");
  document.querySelectorAll(".topic-check input[data-id]").forEach(cb=>{cb.disabled=!LOCAL});
  if($("bCopy"))$("bCopy").onclick=()=>{
    const ta=$("mdArea"),fb=()=>{ta.hidden=false;ta.value=md;ta.focus();ta.select();$("copyMsg").textContent="Текст выделен, нажми Cmd+C"};
    try{navigator.clipboard.writeText(md).then(()=>$("copyMsg").textContent="Скопировано",fb)}catch(e){fb()}
  };
  if(!LOCAL){
    if(note)note.textContent="Отметки сохраняются, когда урок открыт с компьютера (localhost:8765).";
    document.querySelectorAll(".topic-check .note").forEach(el=>{el.textContent="только на localhost"});
    return;
  }
  const day=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  const fmt=iso=>{const [,m,d]=(iso||"").split("-");return d&&m?`${d}.${m}`:""};
  let DONE={};
  function apply(d){
    DONE=d;
    TOPICS.forEach(([id])=>{
      const on=!!d[id];
      document.querySelectorAll(`input[data-id="${id}"]`).forEach(cb=>{cb.checked=on});
      const dt=on?fmt(d[id]):"";
      document.querySelectorAll(`[data-d="${id}"]`).forEach(el=>{el.textContent=on?(dt?`✓ пройдено ${dt}`:"✓ пройдено"):MARK_HINT});
    });
    document.querySelectorAll(".topic-check").forEach(card=>{
      const ids=(card.dataset.for||"").split(",").map(s=>s.trim()).filter(Boolean);
      const cnt=ids.filter(id=>!!d[id]).length, all=ids.length>0&&cnt===ids.length;
      card.classList.toggle("is-done",all);
      const h=card.querySelector(".topic-check-h .note");
      if(h)h.textContent=all?"✓ все темы пройдены":(cnt?`${cnt} из ${ids.length} пройдено`:"");
    });
  }
  /* оценка «насколько понял» 1–10 и заметка к теме — рядом с каждой галочкой (в карточках тем и в списке в конце урока) */
  const NOTES={};
  const rateHTML=id=>`<div class="tr" data-r="${id}"><span class="tr-l">понял</span><span class="tr-s">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button type="button" data-n="${n}" aria-label="Понял на ${n} из 10">${n}</button>`).join("")}</span><button type="button" class="tr-nb">заметка</button><textarea class="tr-t" rows="3" placeholder="Что понял, что неясно, что повторить" hidden></textarea><span class="tr-m" aria-live="polite"></span></div>`;
  if(box)box.querySelectorAll("li").forEach(li=>{const id=li.querySelector("input[data-id]").dataset.id;li.insertAdjacentHTML("beforeend",rateHTML(id))});
  document.querySelectorAll(".topic-check label.tp").forEach(lb=>{const cb=lb.querySelector("input[data-id]");if(cb)lb.parentElement.insertAdjacentHTML("beforeend",rateHTML(cb.dataset.id))});
  function showNotes(){
    document.querySelectorAll(".tr[data-r]").forEach(w=>{
      const n=NOTES[w.dataset.r]||{},sc=n.score||0,ta=w.querySelector(".tr-t");
      w.querySelectorAll(".tr-s button").forEach(b=>{const v=+b.dataset.n;b.classList.toggle("on",v<=sc);b.classList.toggle("cur",v===sc)});
      w.classList.toggle("lo",sc>0&&sc<=4);w.classList.toggle("mid",sc>=5&&sc<=7);w.classList.toggle("hi",sc>=8);
      w.querySelector(".tr-l").textContent=sc?`понял ${sc}/10`:"понял";
      if(document.activeElement!==ta)ta.value=n.text||"";
      if((n.text||DONE[w.dataset.r])&&ta.hidden&&!w.dataset.closed)ta.hidden=false;  /* тема пройдена — поле заметки сразу открыто */
      w.querySelector(".tr-nb").classList.toggle("has",!!n.text);
    });
  }
  async function saveNote(id,patch,w){
    const m=w&&w.querySelector(".tr-m");
    try{
      const r=await fetch(TREE_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes_set:{[id]:patch}})});
      if(!r.ok)throw 0;
      Object.keys(NOTES).forEach(k=>delete NOTES[k]);Object.assign(NOTES,(await r.json()).notes||{});
      showNotes();
      if(m){m.textContent="сохранено";clearTimeout(m._t);m._t=setTimeout(()=>{m.textContent=""},1500)}
    }catch(err){if(m)m.textContent="не сохранилось: сервер не отвечает"}
  }
  document.addEventListener("click",e=>{
    const w=e.target.closest(".tr[data-r]");if(!w)return;
    const id=w.dataset.r,b=e.target.closest(".tr-s button");
    if(b){const v=+b.dataset.n,cur=(NOTES[id]||{}).score;NOTES[id]={...(NOTES[id]||{}),score:cur===v?null:v};showNotes();saveNote(id,{score:cur===v?null:v},w);return}
    if(e.target.closest(".tr-nb")){const ta=w.querySelector(".tr-t");ta.hidden=!ta.hidden;w.dataset.closed=ta.hidden?"1":"";if(!ta.hidden)ta.focus()}
  });
  const timers={};
  document.addEventListener("input",e=>{
    const ta=e.target;if(!ta.matches||!ta.matches(".tr-t"))return;
    const w=ta.closest(".tr"),id=w.dataset.r;
    document.querySelectorAll(`.tr[data-r="${id}"] .tr-t`).forEach(t=>{if(t!==ta)t.value=ta.value});
    clearTimeout(timers[id]);timers[id]=setTimeout(()=>saveNote(id,{text:ta.value},w),900);
  });
  document.addEventListener("focusout",e=>{
    const ta=e.target;if(!ta.matches||!ta.matches(".tr-t"))return;
    const w=ta.closest(".tr"),id=w.dataset.r;
    if(timers[id]){clearTimeout(timers[id]);timers[id]=0;saveNote(id,{text:ta.value},w)}
  });
  fetch(TREE_API).then(r=>r.json()).then(j=>{apply(j.done||{});Object.assign(NOTES,j.notes||{});showNotes()}).catch(()=>{if(note)note.textContent="Сервер не отвечает: запусти «Тренажёр и дерево»."});
  document.addEventListener("change",async e=>{
    const cb=e.target;
    if(!cb||!cb.matches("input[data-id]"))return;
    const id=cb.dataset.id, checked=cb.checked;
    document.querySelectorAll(`input[data-id="${id}"]`).forEach(c=>{c.checked=checked});
    try{
      const r=await fetch(TREE_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(checked?{set:{[id]:day()}}:{unset:[id]})});
      if(!r.ok)throw 0;
      apply((await r.json()).done||{});
      showNotes();
      if(note)note.textContent="Сохранено — видно и в файле недели в Obsidian";
    }catch(err){
      document.querySelectorAll(`input[data-id="${id}"]`).forEach(c=>{c.checked=!checked});
      if(note)note.textContent="Не сохранилось: сервер не отвечает. Запусти «Тренажёр и дерево».";
    }
  });
}
