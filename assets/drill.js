/* Активные задания для уроков ML и English: объяснить своими словами, предсказать вывод, найти баг, собрать код из строк.
   Подключать после lesson.js (и ml.js / en.js): <script src="/assets/drill.js"></script>.
     explain(el, items, {title, lang})   — «Объясни своими словами» / «Перескажи»: {q, model, points:[…], hint?}.
                                         Пишешь ответ (или говоришь вслух — таймер 60 с), потом «Сравнить с эталоном»:
                                         открываются эталон и ключевые мысли, отмечаешь, какие назвал. Засчитано — если назвал ≥ 70%.
     predict(el, items, {title})         — «Что выведет код?» с вводом: {code, a: "строка" | ["варианты"], why}.
                                         Пробелы и вид кавычек не важны.
     findBug(el, items, {title})         — «Найди строку с ошибкой»: {code, bug: номер строки (с 0), fix, why}. Считается первый клик.
     parsons(el, items, {title})         — «Собери код из строк»: {task, lines: [в верном порядке], extra?: [лишние строки], why?}.
   Элемент может быть пустым <div id> (ML) или .ex с готовой шапкой .ex-h (English) — шапка сохранится.
   Ответы сохраняются (work.js, ключ ex:<id>), счёт «k / n» входит в «сделано упражнений» урока. */
(function () {
  const CSS = `
.dr{display:grid;gap:12px}
.dr-it{display:grid;gap:8px}
.dr-it+.dr-it{border-top:1px dashed var(--line);padding-top:12px}
.dr-q{font-weight:500}
.dr-q code{overflow-wrap:anywhere}
.dr textarea{width:100%;min-height:110px;font:15px/1.55 var(--f-body);padding:10px 12px;border-radius:10px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);resize:vertical;box-sizing:border-box}
.dr textarea:focus,.dr input:focus{outline:none;border-color:var(--accent)}
.dr input.dr-in{font:15px var(--f-mono);padding:8px 12px;border-radius:10px;border:1.5px solid var(--line);background:var(--bg);color:var(--ink);width:100%;box-sizing:border-box}
.dr input.ok{border-color:var(--accent)} .dr input.no{border-color:var(--red)}
.dr-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.dr-timer{font:600 13px var(--f-mono);color:var(--muted);font-variant-numeric:tabular-nums}
.dr-model{background:color-mix(in srgb,var(--accent) 8%,var(--surface));border:1px solid color-mix(in srgb,var(--accent) 30%,var(--line));border-radius:12px;padding:10px 14px;display:grid;gap:8px;font-size:15px;line-height:1.6}
.dr-model b.h{font:600 11px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.dr-pts{display:grid;gap:4px;margin:0;padding:0;list-style:none}
.dr-pts label{display:flex;gap:8px;align-items:baseline;cursor:pointer;font-size:14.5px}
.dr-fb{font-size:14.5px;color:var(--muted)}
.dr-fb b{color:var(--ink)}
.dr-code{font:13.5px/1.65 var(--f-mono);background:var(--soft);border-radius:10px;padding:8px 0;margin:0;overflow-x:auto;white-space:pre}
.dr-code .ln{display:block;padding:0 12px;border-left:3px solid transparent}
.dr-code button.ln{all:unset;display:block;padding:0 12px;border-left:3px solid transparent;cursor:pointer;white-space:pre;box-sizing:border-box;width:100%}
.dr-code button.ln:hover{background:color-mix(in srgb,var(--accent) 10%,transparent)}
.dr-code button.ln:focus-visible{outline:2px solid var(--accent)}
.dr-code .ln.hit{background:color-mix(in srgb,var(--accent) 18%,transparent);border-left-color:var(--accent)}
.dr-code .ln.miss{background:color-mix(in srgb,var(--red) 16%,transparent);border-left-color:var(--red)}
.dr-code .ln.bug{border-left-color:var(--accent)}
.dr-pool,.dr-ans{display:grid;gap:5px}
.dr-ans{min-height:44px;background:var(--soft);border-radius:10px;padding:6px}
.dr-ln{all:unset;font:13.5px var(--f-mono);white-space:pre;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:5px 10px;cursor:pointer;overflow-x:auto}
.dr-ln:hover{border-color:var(--accent)}
.dr-ln.ok{border-color:var(--accent)} .dr-ln.no{border-color:var(--red)}
.dr-sub{font:500 11px var(--f-mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}`;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
})();
const drEsc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const drShuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const drSave = (id, v) => { if (typeof WORK !== "undefined") WORK.put("ex:" + id, v); };
const drLoad = id => typeof WORK !== "undefined" ? WORK.get("ex:" + id) : null;
const drReady = f => typeof WORK !== "undefined" ? WORK.ready(f) : f();

function drBox(el, title, hint, total) {
  el.classList.add("ex");
  if (!el.querySelector(".ex-h")) el.insertAdjacentHTML("afterbegin", `<div class="ex-h"><span class="eyebrow">${title}</span>${hint ? `<p>${hint}</p>` : ""}</div>`);
  el.insertAdjacentHTML("beforeend", `<div class="dr"></div><div class="ex-foot"><span class="ex-score" aria-live="polite">0 / ${total}</span><button class="btn dr-reset" type="button">Заново</button></div>`);
  const sc = el.querySelector(".ex-score");
  return {body: el.querySelector(".dr"), reset: el.querySelector(".dr-reset"),
    score(k) { sc.textContent = `${k} / ${total}`; sc.classList.toggle("full", k === total); el.classList.toggle("ex-done", k === total); if (typeof mlSteps === "function") mlSteps(); }};
}

/* ---------- объясни своими словами / перескажи ---------- */
function explain(el, items, {title = "Объясни своими словами", lang = "ru"} = {}) {
  const box = drBox(el, title, "Представь, что объясняешь другу, который этого не знает. Напиши ответ или скажи вслух — потом сравни с эталоном и честно отметь, что назвал.", items.length);
  let S = {};  /* i → {text, said, shown, ticks:[…]} */
  const need = it => Math.max(1, Math.ceil(it.points.length * 0.7));
  const done = i => { const s = S[i]; return !!(s && s.shown && (s.ticks || []).filter(Boolean).length >= need(items[i])); };
  function save() { drSave(el.id, {a: S, n: items.filter((_, i) => done(i)).length, t: items.length}); }
  const fbText = i => done(i) ? "<b>Засчитано.</b> Через пару дней расскажи ещё раз — уже без подсказки." : `Нужно назвать хотя бы ${need(items[i])} из ${items[i].points.length}. Не хватило — перечитай эталон, закрой его и расскажи снова.`;
  function draw() {
    box.body.innerHTML = items.map((it, i) => { const s = S[i] || {};
      return `<div class="dr-it" data-i="${i}"><div class="dr-q">${it.q}</div>${it.hint ? `<div class="dr-fb">Подсказка: ${it.hint}</div>` : ""}
        <textarea data-t="${i}" lang="${lang === "en" ? "en" : "ru"}" spellcheck="${lang === "en"}" placeholder="${lang === "en" ? "Write it in English…" : "Своими словами…"}">${drEsc(s.text || "")}</textarea>
        <div class="dr-row"><button class="btn" type="button" data-say="${i}">⏱ Сказать вслух · 60 с</button><span class="dr-timer" data-tm="${i}">${s.said ? "сказал вслух ✓" : ""}</span>
        <button class="btn" type="button" data-cmp="${i}">Сравнить с эталоном</button></div>
        ${s.shown ? `<div class="dr-model"><b class="h">Эталон</b><div>${it.model}</div><b class="h">Ключевые мысли — отметь, что назвал</b>
          <ul class="dr-pts">${it.points.map((p, k) => `<li><label><input type="checkbox" data-pt="${i}:${k}"${(s.ticks || [])[k] ? " checked" : ""}> ${p}</label></li>`).join("")}</ul>
          <div class="dr-fb">${fbText(i)}</div></div>` : ""}</div>`; }).join("");
    box.score(items.filter((_, i) => done(i)).length);
  }
  let timer = null;
  el.addEventListener("input", e => { const t = e.target.closest("[data-t]"); if (t) { const i = +t.dataset.t; S[i] = {...(S[i] || {}), text: t.value}; save(); } });
  el.addEventListener("change", e => { const c = e.target.closest("[data-pt]"); if (!c) return; const [i, k] = c.dataset.pt.split(":").map(Number);
    const s = S[i]; s.ticks = s.ticks || []; s.ticks[k] = c.checked; save();
    const fb = el.querySelector(`.dr-it[data-i="${i}"] .dr-model .dr-fb`); if (fb) fb.innerHTML = fbText(i);
    box.score(items.filter((_, j) => done(j)).length); });
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.say !== undefined) { const i = +b.dataset.say, tm = el.querySelector(`[data-tm="${i}"]`); clearInterval(timer); let left = 60;
      tm.textContent = `говори… ${left} с`; timer = setInterval(() => { left--; tm.textContent = left > 0 ? `говори… ${left} с` : "сказал вслух ✓"; if (left <= 0) { clearInterval(timer); S[i] = {...(S[i] || {}), said: true}; save(); } }, 1000);
      b.textContent = "⏱ Заново · 60 с"; }
    if (b.dataset.cmp !== undefined) { const i = +b.dataset.cmp, s = S[i] || {};
      if (!s.said && (s.text || "").trim().length < 20) { el.querySelector(`[data-tm="${i}"]`).textContent = "сначала напиши ответ или скажи вслух"; return; }
      S[i] = {...s, shown: true}; save(); draw(); }
  });
  box.reset.onclick = () => { S = {}; drSave(el.id, null); draw(); };
  drReady(() => { const v = drLoad(el.id); if (v && v.a) S = v.a; draw(); });
}

/* ---------- что выведет код ---------- */
function predict(el, items, {title = "Что выведет код? Впиши сам"} = {}) {
  const box = drBox(el, title, "Сначала подумай, потом впиши ответ точно так, как его напечатает Python. Пробелы и вид кавычек не важны. Enter — проверить.", items.length);
  const norm = s => String(s).replace(/[“”«»"]/g, "'").replace(/\s+/g, "");
  let S = {};
  const ok = (it, v) => [].concat(it.a).some(a => norm(a) === norm(v));
  function save() { drSave(el.id, {a: S, n: items.filter((it, i) => S[i] && ok(it, S[i])).length, t: items.length}); }
  function draw() {
    box.body.innerHTML = items.map((it, i) => { const v = S[i], has = v !== undefined, good = has && ok(it, v);
      return `<div class="dr-it"><pre class="dr-code">${drEsc(it.code)}</pre>
        <div class="dr-row"><input class="dr-in ${has ? (good ? "ok" : "no") : ""}" data-i="${i}" value="${drEsc(v ?? "")}" placeholder="вывод…" autocomplete="off" spellcheck="false" aria-label="Вывод кода"${has ? " readonly" : ""}></div>
        ${has ? `<div class="dr-fb"><b>${good ? "Верно." : `Нет. Правильно: <code>${drEsc([].concat(it.a)[0])}</code>.`}</b> ${it.why || ""}</div>` : ""}</div>`; }).join("");
    box.score(items.filter((it, i) => S[i] !== undefined && ok(it, S[i])).length);
  }
  el.addEventListener("keydown", e => { const t = e.target.closest("input[data-i]"); if (t && e.key === "Enter" && t.value.trim() && !t.readOnly) { S[+t.dataset.i] = t.value.trim(); save(); draw();
    const next = el.querySelector(`input[data-i="${+t.dataset.i + 1}"]`); if (next) next.focus(); } });
  box.reset.onclick = () => { S = {}; drSave(el.id, null); draw(); };
  drReady(() => { const v = drLoad(el.id); if (v && v.a) S = v.a; draw(); });
}

/* ---------- найди строку с ошибкой ---------- */
function findBug(el, items, {title = "Найди строку с ошибкой"} = {}) {
  const box = drBox(el, title, "Нажми на строку, где ошибка. Считается первый клик — подумай перед ним.", items.length);
  let S = {};
  function save() { drSave(el.id, {a: S, n: items.filter((it, i) => S[i] === it.bug).length, t: items.length}); }
  function draw() {
    box.body.innerHTML = items.map((it, i) => { const v = S[i], has = v !== undefined;
      return `<div class="dr-it">${it.task ? `<div class="dr-q">${it.task}</div>` : ""}<div class="dr-code">${it.code.split("\n").map((l, k) => has
        ? `<span class="ln ${k === it.bug ? "hit" : k === v ? "miss" : ""}">${drEsc(l) || " "}</span>`
        : `<button class="ln" type="button" data-i="${i}" data-k="${k}">${drEsc(l) || " "}</button>`).join("")}</div>
        ${has ? `<div class="dr-fb"><b>${v === it.bug ? "Верно." : "Не эта строка."}</b> Исправление: <code>${drEsc(it.fix)}</code>. ${it.why}</div>` : ""}</div>`; }).join("");
    box.score(items.filter((it, i) => S[i] === it.bug).length);
  }
  el.addEventListener("click", e => { const b = e.target.closest("button.ln"); if (b) { S[+b.dataset.i] = +b.dataset.k; save(); draw(); } });
  box.reset.onclick = () => { S = {}; drSave(el.id, null); draw(); };
  drReady(() => { const v = drLoad(el.id); if (v && v.a) S = v.a; draw(); });
}

/* ---------- собери код из строк ---------- */
function parsons(el, items, {title = "Собери код из строк"} = {}) {
  const box = drBox(el, title, "Нажимай строки по порядку — они встанут в ответ. Нажал не ту — нажми её в ответе, она вернётся. Лишние строки не бери. Отступы уже на месте.", items.length);
  let S = {};  /* i → {pick:[индексы], solved} */
  const pool = items.map(it => drShuffle([...it.lines.map((l, k) => ({l, k})), ...(it.extra || []).map((l, k) => ({l, k: -1 - k}))]));
  const solved = i => !!(S[i] && S[i].solved);
  function save() { drSave(el.id, {a: S, n: items.filter((_, i) => solved(i)).length, t: items.length}); }
  function draw() {
    box.body.innerHTML = items.map((it, i) => { const s = S[i] || {pick: []}, pick = s.pick || [], used = new Set(pick);
      const byK = k => pool[i].find(x => x.k === k);
      return `<div class="dr-it"><div class="dr-q">${it.task}</div>
        <span class="dr-sub">Твой код</span><div class="dr-ans">${pick.map((k, p) => `<button class="dr-ln ${s.checked ? (k === p ? "ok" : "no") : ""}" type="button" data-i="${i}" data-out="${p}"${s.solved ? " disabled" : ""}>${drEsc(byK(k).l)}</button>`).join("")}</div>
        ${s.solved ? "" : `<span class="dr-sub">Строки</span><div class="dr-pool">${pool[i].filter(x => !used.has(x.k)).map(x => `<button class="dr-ln" type="button" data-i="${i}" data-in="${x.k}">${drEsc(x.l)}</button>`).join("")}</div>
        <div class="dr-row"><button class="btn" type="button" data-chk="${i}">Проверить</button></div>`}
        ${s.checked ? `<div class="dr-fb">${s.solved ? `<b>Верно.</b> ${it.why || ""}` : "<b>Пока не так.</b> Зелёные строки стоят на своих местах, красные — нет. Верни красные и попробуй снова."}</div>` : ""}</div>`; }).join("");
    box.score(items.filter((_, i) => solved(i)).length);
  }
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b || b.dataset.i === undefined && b.dataset.chk === undefined) return;
    if (b.dataset.in !== undefined) { const i = +b.dataset.i, s = S[i] = S[i] || {pick: []}; s.pick = [...(s.pick || []), +b.dataset.in]; s.checked = false; save(); draw(); }
    else if (b.dataset.out !== undefined) { const i = +b.dataset.i, s = S[i]; s.pick.splice(+b.dataset.out, 1); s.checked = false; save(); draw(); }
    else if (b.dataset.chk !== undefined) { const i = +b.dataset.chk, s = S[i] = S[i] || {pick: []}, it = items[i];
      s.checked = true; s.solved = s.pick.length === it.lines.length && s.pick.every((k, p) => k === p); save(); draw(); }
  });
  box.reset.onclick = () => { S = {}; drSave(el.id, null); draw(); };
  drReady(() => { const v = drLoad(el.id); if (v && v.a) S = v.a; draw(); });
}
