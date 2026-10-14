/* Упражнения уроков английского. Подключать после lesson.js: <script src="/assets/en.js"></script>.
   Всё строится из данных — урок только описывает задания:
     say(text)                      — прочитать фразу голосом браузера (британский, если есть). Любой элемент с data-say
                                      (или класс .say) читается по клику; пустой data-say — читается его текст.
     exGap(el, items, {pick})        — пропуски: {s:"I ___ from Russia.", a:["'m","am"], ru?, why?, opts?}.
                                      opts → выбрать из вариантов, иначе впечатать. ___ — место пропуска.
                                      say → кнопка 🔊 перед заданием (диктант), full → что показать и прочитать после ответа,
                                      exact → важен регистр первой буквы (English, Monday, I).
     exBuild(el, items)              — собрать фразу из плиток: {ru:"Она не замужем.", w:"She isn't married .", alt?:[…], extra?:["not"]}.
     exSpot(el, items)               — найди ошибку: {s:"She are from Spain.", bad:1, fix:"is", why}. bad — номер слова (с 0), -1 — ошибки нет;
                                      n — сколько слов заменить (по умолчанию 1), also — другие номера, которые тоже засчитываются; fix:"" — слово лишнее.
     exStress(el, items)             — ударный слог: {w:"Japanese", syl:["Ja","pa","nese"], s:2}.
     exSort(el, {groups, items})     — разложить по группам: groups [{k, label}], items [{w, g, say?, why?}] — по одной карточке.
                                      Первую карточку слушают кликом по слову (при загрузке страницы звука нет), дальше — само (auto:false — выключить).
     wordCards(el, words)            — карточки слов: {en, ipa?, ru, ex?, exRu?}; клик — перевернуть, 🔊 — послушать.
     takeAway(el, {lesson, words, rules}) — блок «В повторение»: слова (формат wordCards) и правила урока
                                      {id, q, a, ex?:[…], wrong?, right?} с галочками → колоды /words и /rules (/api/decks).
   У каждого упражнения — счёт «3 / 6», кнопки «Проверить» и «Заново». Ответы сравниваются без учёта регистра, ’ и точки в конце. */
const EN_NORM=s=>String(s).toLowerCase().replace(/[’‘`´]/g,"'").replace(/\s+([.,!?])/g,"$1").replace(/[.!?]+$/,"").replace(/\s+/g," ").trim();
const enEsc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const enShuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

const EN_SPK_SVG='<svg class="ico-spk" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';

/* ---------- голос ---------- */
let EN_VOICE=null;
function enPickVoice(){
  if(!("speechSynthesis" in window))return;
  /* В macOS среди английских голосов есть «шуточные» (Bells, Bad News, Zarvox…) — их пропускаем. */
  const FUN=/Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Fred|Kathy|Princess|Deranged|Hysterical|Pipe|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley/i;
  const v=speechSynthesis.getVoices().filter(x=>/^en[-_]/.test(x.lang)&&!FUN.test(x.name));
  EN_VOICE=v.find(x=>x.lang==="en-GB"&&/natural|neural|premium|enhanced/i.test(x.name))
    ||v.find(x=>x.lang==="en-GB"&&/google uk|serena|oliver|stephanie|martha/i.test(x.name))
    ||v.find(x=>x.lang==="en-GB"&&/daniel|kate|george/i.test(x.name))
    ||v.find(x=>x.lang==="en-GB")
    ||v.find(x=>/natural|neural|premium|enhanced/i.test(x.name)&&/^en[-_]/.test(x.lang))
    ||v.find(x=>/google us|samantha|ava|allison|tom|moira|tessa/i.test(x.name))
    ||v[0]||null;
}
if("speechSynthesis" in window){enPickVoice();speechSynthesis.onvoiceschanged=enPickVoice}
function say(text,rate=0.9){
  if(!("speechSynthesis" in window))return false;
  const u=new SpeechSynthesisUtterance(String(text).replace(/_+/g," "));
  if(!EN_VOICE)enPickVoice();
  if(EN_VOICE)u.voice=EN_VOICE; u.lang=EN_VOICE?EN_VOICE.lang:"en-GB"; u.rate=rate;
  speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
}
/* Клик по фразе с data-say: первый раз — обычная скорость, повторный в течение 3 секунд — медленно. */
let enLast={t:"",at:0};
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-say],.say"); if(!el)return;
  const t=el.dataset.say||el.textContent.trim(), now=Date.now(), slow=enLast.t===t&&now-enLast.at<3000;
  say(t,slow?0.62:0.9); enLast={t:slow?"":t,at:now};
  el.classList.add("playing"); setTimeout(()=>el.classList.remove("playing"),600);
});

/* ---------- общий каркас упражнения ---------- */
function enBox(el,total,{check,reset,extra=""}={}){
  el.classList.add("ex");
  el.insertAdjacentHTML("beforeend",`<div class="ex-foot"><span class="ex-score" aria-live="polite">0 / ${total}</span>${extra}
    ${check?'<button class="btn ex-check" type="button">Проверить</button>':""}<button class="btn ex-reset" type="button">Заново</button></div>`);
  const sc=el.querySelector(".ex-score");
  if(check)el.querySelector(".ex-check").onclick=check;
  el.querySelector(".ex-reset").onclick=reset;
  return k=>{sc.textContent=`${k} / ${total}`;el.classList.toggle("ex-done",k===total);sc.classList.toggle("full",k===total)};
}

/* ---------- пропуски ---------- */
function exGap(el,items,opt={}){
  const body=document.createElement("ol"); body.className="gaps"; el.append(body);
  let done={};
  function draw(){
    done={};
    body.innerHTML=items.map((it,i)=>{
      const [a,b]=it.s.split(/_{3,}/);
      const slot=it.opts?`<span class="gchips" role="group">${(opt.keep?it.opts:enShuffle(it.opts)).map(o=>`<button type="button" class="gchip" data-i="${i}" data-v="${enEsc(o)}">${enEsc(o)}</button>`).join("")}</span>`
        :`<input class="gin" data-i="${i}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Пропуск ${i+1}" size="${Math.max(4,...[].concat(it.a).map(x=>x.length))}">`;
      return `<li data-i="${i}"><div class="gl">${it.say?`<button type="button" class="stsay" data-say="${enEsc(it.say)}" aria-label="Послушать">${EN_SPK_SVG}</button> `:""}${enEsc(a)}${it.opts?'<span class="gslot">___</span>':slot}${enEsc(b??"")}${it.ru?`<span class="gru">${enEsc(it.ru)}</span>`:""}</div>${it.opts?slot:""}<div class="gwhy" hidden></div></li>`;
    }).join("");
    upd(0);
  }
  function judge(i,v){
    const it=items[i], li=body.querySelector(`li[data-i="${i}"]`);
    const same=it.exact?(x,y)=>EN_NORM(x)===EN_NORM(y)&&x.trim()[0]===y.trim()[0]:(x,y)=>EN_NORM(x)===EN_NORM(y);
    const ok=[].concat(it.a).some(x=>same(x,v));
    li.classList.remove("ok","bad"); li.classList.add(ok?"ok":"bad");
    const full=it.full||it.s.replace(/_{3,}/,[].concat(it.a)[0]);
    const why=li.querySelector(".gwhy"); why.hidden=false;
    why.innerHTML=`${ok?"✓":"✗ Правильно:"} <span class="say" data-say="${enEsc(full)}">${enEsc(full)}</span>${it.why?` — ${it.why}`:""}`;
    const slot=li.querySelector(".gslot"); if(slot){slot.textContent=v;slot.classList.add("filled")}
    if(ok)say(full);
    done[i]=ok; upd(Object.values(done).filter(Boolean).length);
  }
  body.addEventListener("click",e=>{const b=e.target.closest(".gchip");if(!b)return;const i=+b.dataset.i;
    if(done[i]!==undefined)return;
    b.parentElement.querySelectorAll(".gchip").forEach(x=>{x.disabled=true;x.classList.toggle("pick",x===b)});judge(i,b.dataset.v)});
  body.addEventListener("keydown",e=>{const inp=e.target.closest(".gin");if(!inp||e.key!=="Enter")return;e.preventDefault();
    if(inp.value.trim()){judge(+inp.dataset.i,inp.value);const nx=body.querySelectorAll(".gin")[[...body.querySelectorAll(".gin")].indexOf(inp)+1];if(nx)nx.focus()}});
  const upd=enBox(el,items.length,{check:items.some(x=>!x.opts)?()=>body.querySelectorAll(".gin").forEach(inp=>{if(inp.value.trim())judge(+inp.dataset.i,inp.value)}):null,reset:draw});
  draw();
}

/* ---------- собрать фразу ---------- */
function exBuild(el,items){
  const body=document.createElement("div"); body.className="builds"; el.append(body);
  const ok={};
  function draw(){
    Object.keys(ok).forEach(k=>delete ok[k]);
    body.innerHTML=items.map((it,i)=>{
      const tiles=enShuffle(it.w.split(" ").concat(it.extra||[]));
      return `<div class="bd" data-i="${i}"><div class="bru">${enEsc(it.ru)}</div><div class="bline" aria-label="Твоя фраза"></div>
        <div class="btiles">${tiles.map((t,k)=>`<button type="button" class="tile" data-k="${k}">${enEsc(t)}</button>`).join("")}</div>
        <div class="bact"><button type="button" class="btn bcheck">Проверить</button><button type="button" class="btn bshow">Ответ</button><span class="bmsg"></span></div></div>`}).join("");
    upd(0);
  }
  body.addEventListener("click",e=>{
    const bd=e.target.closest(".bd"); if(!bd)return; const i=+bd.dataset.i, it=items[i];
    const line=bd.querySelector(".bline"), tiles=bd.querySelector(".btiles"), msg=bd.querySelector(".bmsg");
    const t=e.target.closest(".tile");
    if(t&&!bd.classList.contains("ok")){(t.parentElement===tiles?line:tiles).append(t);bd.classList.remove("bad");msg.textContent="";return}
    const phrase=()=>[...line.querySelectorAll(".tile")].map(x=>x.textContent).join(" ");
    if(e.target.closest(".bcheck")){
      const v=EN_NORM(phrase()), good=[it.w,...(it.alt||[])].some(x=>EN_NORM(x)===v);
      bd.classList.toggle("ok",good); bd.classList.toggle("bad",!good);
      msg.textContent=good?"✓ Верно":(line.children.length?"Не так. Посмотри на порядок слов и лишние плитки.":"Нажимай на слова, чтобы собрать фразу.");
      if(good){say(it.w.replace(/ ([.,!?])/g,"$1"));ok[i]=1;upd(Object.keys(ok).length)}
    }
    if(e.target.closest(".bshow")){
      msg.innerHTML=`Ответ: <span class="say" data-say="${enEsc(it.w.replace(/ ([.,!?])/g,"$1"))}">${enEsc(it.w.replace(/ ([.,!?])/g,"$1"))}</span>${it.why?` — ${it.why}`:""}`;
    }
  });
  const upd=enBox(el,items.length,{reset:draw});
  draw();
}

/* ---------- найди ошибку ---------- */
function exSpot(el,items){
  const body=document.createElement("ol"); body.className="spots"; el.append(body);
  let done={};
  function draw(){
    done={};
    body.innerHTML=items.map((it,i)=>`<li data-i="${i}"><div class="sw">${it.s.split(" ").map((w,k)=>`<button type="button" class="sword" data-k="${k}">${enEsc(w)}</button>`).join(" ")}
      ${items.some(x=>x.bad===-1)?'<button type="button" class="sword none" data-k="-1">ошибки нет</button>':""}</div><div class="gwhy" hidden></div></li>`).join("");
    upd(0);
  }
  body.addEventListener("click",e=>{
    const b=e.target.closest(".sword"); if(!b)return; const li=b.closest("li"), i=+li.dataset.i, it=items[i];
    if(done[i]!==undefined)return;
    const k=+b.dataset.k, ok=k===it.bad||(it.also||[]).includes(k); done[i]=ok;
    li.classList.add(ok?"ok":"bad"); b.classList.add(ok?"right":"wrong");
    if(it.bad>=0)li.querySelector(`.sword[data-k="${it.bad}"]`).classList.add("right");
    const words=it.s.split(" "); if(it.bad>=0)words.splice(it.bad,it.n||1,it.fix); const fixed=words.filter(Boolean).join(" ");
    const why=li.querySelector(".gwhy"); why.hidden=false;
    why.innerHTML=`${ok?"✓":"✗"} ${it.bad>=0?`Правильно: <span class="say" data-say="${enEsc(fixed)}">${enEsc(fixed)}</span>`:"Здесь всё верно."}${it.why?` — ${it.why}`:""}`;
    upd(Object.values(done).filter(Boolean).length);
  });
  const upd=enBox(el,items.length,{reset:draw});
  draw();
}

/* ---------- ударение ---------- */
function exStress(el,items){
  const body=document.createElement("div"); body.className="stress"; el.append(body);
  let done={};
  function draw(){
    done={};
    body.innerHTML=items.map((it,i)=>`<div class="st" data-i="${i}"><button type="button" class="stsay" data-say="${enEsc(it.w)}" aria-label="Послушать ${enEsc(it.w)}">${EN_SPK_SVG}</button>
      <span class="syls">${it.syl.map((s,k)=>`<button type="button" class="syl" data-k="${k}">${enEsc(s)}</button>`).join("")}</span><span class="stm"></span></div>`).join("");
    upd(0);
  }
  body.addEventListener("click",e=>{
    const b=e.target.closest(".syl"); if(!b)return; const st=b.closest(".st"), i=+st.dataset.i, it=items[i];
    if(done[i]!==undefined)return;
    const ok=+b.dataset.k===it.s; done[i]=ok; st.classList.add(ok?"ok":"bad");
    st.querySelectorAll(".syl").forEach((x,k)=>{x.disabled=true;if(k===it.s)x.classList.add("on")});
    st.querySelector(".stm").textContent=ok?"✓":"✗ ударение — "+it.syl[it.s].toUpperCase();
    say(it.w); upd(Object.values(done).filter(Boolean).length);
  });
  const upd=enBox(el,items.length,{reset:draw});
  draw();
}

/* ---------- разложить по группам: по одной карточке ---------- */
function exSort(el,{groups,items,auto=true}){
  const body=document.createElement("div"); body.className="sorter"; el.append(body);
  let order=[],i=0,right=0,log=[],started=false;
  function draw(){order=enShuffle(items.map((_,k)=>k));i=0;right=0;log=[];started=false;render();upd(0)}
  function render(){
    if(i>=order.length){body.innerHTML=`<div class="srt-end">Готово: ${right} из ${items.length}. ${right===items.length?"Без ошибок.":"Ошибки — ниже, нажми, чтобы послушать."}</div>${lg()}`;return}
    const it=items[order[i]];
    body.innerHTML=`<div class="srt-card"><span class="srt-n">${i+1} / ${items.length}</span><button type="button" class="srt-w" data-say="${enEsc(it.say||it.w)}">${enEsc(it.w)} ${EN_SPK_SVG}</button>
      <div class="srt-g">${groups.map((g,k)=>`<button type="button" class="btn srt-b" data-g="${k}">${g.label}</button>`).join("")}</div></div>${lg()}`;
    if(auto&&started)setTimeout(()=>say(it.say||it.w),150);
  }
  const lg=()=>log.length?`<div class="srt-log">${log.map(x=>`<span class="say ${x.ok?"ok":"bad"}" data-say="${enEsc(x.it.say||x.it.w)}" title="${enEsc(x.it.why||"")}">${enEsc(x.it.w)} → ${groups[x.it.g].label.replace(/<[^>]+>/g,"")}</span>`).join("")}</div>`:"";
  body.addEventListener("click",e=>{const b=e.target.closest(".srt-b");if(!b)return;const it=items[order[i]],ok=+b.dataset.g===it.g;
    started=true;
    if(ok)right++; log.unshift({it,ok}); i++; upd(right); render()});
  const upd=enBox(el,items.length,{reset:draw});
  draw();
}

/* ---------- карточки слов ---------- */
function wordCards(el,words){
  el.classList.add("wcards-box");
  el.insertAdjacentHTML("beforeend",`<div class="btns wc-mode" role="group" aria-label="Режим карточек">
    <button class="btn" type="button" data-m="all" aria-pressed="true">Всё видно</button><button class="btn" type="button" data-m="en">Вспомни перевод</button><button class="btn" type="button" data-m="ru">Вспомни английское</button></div>
    <div class="wcards">${words.map(w=>`<div class="wc" tabindex="0" role="button" aria-label="${enEsc(w.en)}">
      <div class="wc-en"><b>${enEsc(w.en)}</b><button type="button" class="wc-say" data-say="${enEsc(w.en)}" aria-label="Послушать">${EN_SPK_SVG}</button></div>
      ${w.ipa?`<div class="wc-ipa">/${enEsc(w.ipa)}/</div>`:""}<div class="wc-ru">${enEsc(w.ru)}</div>
      ${w.ex?`<div class="wc-ex"><span class="say" data-say="${enEsc(w.ex)}">${enEsc(w.ex)}</span>${w.exRu?`<span class="muted"> — ${enEsc(w.exRu)}</span>`:""}</div>`:""}</div>`).join("")}</div>`);
  const box=el.querySelector(".wcards");
  el.querySelectorAll(".wc-mode .btn").forEach(b=>b.onclick=()=>{el.querySelectorAll(".wc-mode .btn").forEach(x=>x.setAttribute("aria-pressed",x===b));
    box.dataset.m=b.dataset.m; box.querySelectorAll(".wc").forEach(c=>c.classList.remove("open"))});
  box.addEventListener("click",e=>{if(e.target.closest("[data-say],.say"))return;const c=e.target.closest(".wc");if(c)c.classList.toggle("open")});
  box.addEventListener("keydown",e=>{const c=e.target.closest(".wc");if(c&&(e.key==="Enter"||e.key===" ")){e.preventDefault();c.classList.toggle("open")}});
}

/* ---------- в повторение: Влад сам выбирает, что из урока пойдёт в колоды ---------- */
function takeAway(el,{lesson,words=[],rules=[]}){
  const LOCAL=/^(localhost|127\.0\.0\.1)$/.test(location.hostname), src=`урок ${lesson}`;
  const W=words.map(w=>({key:w.en.toLowerCase(),item:{word:w.en,ipa:w.ipa||"",translation:w.ru,example:w.ex||"",example_ru:w.exRu||"",source:src},
    t:`${enEsc(w.en)}<small>${enEsc(w.ru)}</small>`}));
  const R=rules.map(r=>({key:r.id,item:{id:r.id,q:r.q,a:r.a,examples:r.ex||[],wrong:r.wrong||"",right:r.right||"",source:src},
    t:`${enEsc(r.q)}<small>${enEsc(r.a)}</small>`}));
  el.insertAdjacentHTML("beforeend",`<div class="tk">${[["words","Слова",W],["rules","Правила",R]].filter(x=>x[2].length).map(([d,h,L])=>`
    <div class="tk-col" data-d="${d}"><div class="tk-h"><b>${h} · ${L.length}</b><button class="btn tk-all" type="button">выбрать новые</button></div>
    <ul>${L.map((x,i)=>`<li data-i="${i}"><label><input type="checkbox" data-i="${i}"><span class="t">${x.t}</span><span class="tk-st"></span></label></li>`).join("")}</ul></div>`).join("")}</div>
    <div class="tk-foot"><button class="btn go tk-go" type="button" disabled>Добавить выбранное</button><span class="tk-msg" role="status"></span></div>`);
  const L={words:W,rules:R}, msg=el.querySelector(".tk-msg"), go=el.querySelector(".tk-go");
  let state={words:{},rules:{}};  /* ключ → "in" (в колоде) | "ar" (в архиве) */
  const count=()=>el.querySelectorAll(".tk-col input:checked:not(:disabled)").length;
  const upd=()=>{const n=count();go.disabled=!n||!LOCAL;go.textContent=n?`Добавить выбранное · ${n}`:"Добавить выбранное"};
  function paint(){
    for(const d of ["words","rules"])el.querySelectorAll(`.tk-col[data-d="${d}"] li`).forEach(li=>{
      const x=L[d][+li.dataset.i], s=state[d][x.key], inp=li.querySelector("input"), st=li.querySelector(".tk-st");
      li.classList.toggle("have",s==="in"); inp.disabled=s==="in"||!LOCAL; if(s==="in")inp.checked=true;
      st.className="tk-st"+(s?" "+s:""); st.textContent=s==="in"?"в колоде":s==="ar"?"в архиве":"";
    });
    el.querySelectorAll(".tk ul").forEach(ul=>ul.append(...[...ul.children].filter(li=>li.classList.contains("have"))));  /* новое — сверху */
    upd();
  }
  async function load(){
    for(const d of ["words","rules"]){if(!L[d].length)continue;
      const r=await fetch("/api/decks/"+d).then(r=>r.json());
      state[d]=Object.fromEntries(r.cards.map(c=>[d==="words"?c.word.toLowerCase():c.id,c.archived?"ar":"in"]));}
    paint();
  }
  el.addEventListener("change",upd);
  el.querySelectorAll(".tk-all").forEach(b=>b.onclick=()=>{const col=b.closest(".tk-col");
    const boxes=[...col.querySelectorAll("input:not(:disabled)")], on=boxes.some(i=>!i.checked);boxes.forEach(i=>i.checked=on);upd()});
  go.onclick=async()=>{
    go.disabled=true; let added=0,back=0;
    try{for(const d of ["words","rules"]){
        const items=[...el.querySelectorAll(`.tk-col[data-d="${d}"] input:checked:not(:disabled)`)].map(i=>L[d][+i.dataset.i].item);
        if(!items.length)continue;
        const r=await fetch("/api/decks/"+d,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({op:"add",items})}).then(r=>{if(!r.ok)throw new Error("сервер");return r.json()});
        added+=r.added.length; back+=r.restored.length;}
      await load();
      msg.innerHTML=`Готово: ${added?`добавлено ${added}`:""}${added&&back?", ":""}${back?`возвращено из архива ${back}`:""}. Повторять — <a href="/words">слова</a> и <a href="/rules">правила</a>.`;
    }catch(e){msg.textContent="Не получилось сохранить: сервер не отвечает.";upd()}
  };
  if(!LOCAL){msg.textContent="Добавлять в колоды можно на компьютере, где запущен сервер.";paint();return}
  load().catch(()=>{msg.textContent="Нет связи с сервером — колоды недоступны.";});
}

/* Нет голоса в браузере — честно говорим об этом один раз. */
document.addEventListener("DOMContentLoaded",()=>{
  if(!("speechSynthesis" in window))document.querySelectorAll(".audio-note").forEach(n=>{n.hidden=false;n.textContent="Этот браузер не умеет читать вслух — открой урок в Safari или Chrome."});
});
