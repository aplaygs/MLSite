/* Тест недели. Страница теста вызывает initQuiz({week, title, intro, minutes, lessons, questions}).
   lessons: [{n, file, title, cover}] — уроки недели (для ссылок «повторить» и итога по урокам).
   Вопрос: {lesson, topic, ref, refTitle, type, q, code?, opts?, ans, tol?, explain, points?, model?}
     type "one"  — один ответ, ans — индекс верного варианта;
          "many" — несколько, ans — массив индексов (засчитывается полностью только точный набор, частично — доля);
          "num"  — число, ans — число, tol — допуск;
          "open" — ответ своими словами: после ответа показывается эталон (model) и пункты (points), их отмечаешь сам;
          "text" — впечатать слово или фразу (английский): ans — массив верных вариантов, регистр, ’ и точка в конце не важны.
   say: "фраза" — у вопроса кнопка 🔊, фразу читает голос браузера (аудирование в английском).
   section: "en" — тест раздела English: свой ключ в браузере и свои результаты (/api/en/tests). howto — свой текст «Как проходить».
   Порядок вариантов перемешивается на каждой попытке. Прогресс хранится в браузере, итог — на сервере (/api/tests). */
function initQuiz(cfg) {
  const root = document.getElementById("qz"), Q = cfg.questions, N = Q.length;
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname), EN = cfg.section === "en";
  const KEY = (EN ? "quiz-en-w" : "quiz-w") + cfg.week, API = EN ? "/api/en/tests" : "/api/tests";
  const norm = s => String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/[.!?,;:]+$/g, "").replace(/\s+/g, " ").trim();
  const speak = t => { if (typeof say === "function") return say(t); /* en.js подключён — его голос */ try { const u = new SpeechSynthesisUtterance(t), v = speechSynthesis.getVoices();
    u.voice = v.find(x => x.lang === "en-GB") || v.find(x => /Samantha|Karen|Daniel/.test(x.name)) || null; u.lang = "en-GB"; u.rate = 0.92;
    speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const LET = "ABCDEFGH";
  let S = null;  /* {list: [индексы вопросов], i, res: {qi: {score, pick}}, order: {qi: [перестановка]}, retry} */

  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} },
    del() { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
  const shuffle = n => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const lessonOf = q => cfg.lessons.find(l => l.n === q.lesson);
  const refLink = q => { const l = lessonOf(q); return `/lessons/${l.file}${q.ref || ""}`; };
  const plural = (n, a, b, c) => { const x = n % 10, y = n % 100; return x === 1 && y !== 11 ? a : x >= 2 && x <= 4 && (y < 12 || y > 14) ? b : c; };
  const top = () => window.scrollTo({top: root.getBoundingClientRect().top + scrollY - 80, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"});

  function start(list, retry) {
    S = {list, i: 0, res: {}, order: {}, retry: !!retry};
    list.forEach(qi => { const q = Q[qi]; if (q.opts) S.order[qi] = shuffle(q.opts.length); });
    if (!retry) store.set(S);
    renderQ(); top();
  }

  /* ---------- стартовый экран ---------- */
  function intro() {
    const saved = store.get();
    const can = saved && saved.list && Object.keys(saved.res).length && Object.keys(saved.res).length < saved.list.length;
    root.innerHTML = `<div class="qz-hero">
      <div class="eyebrow">Неделя ${cfg.week} · тест после трёх уроков</div>
      <h1>${esc(cfg.title)}</h1>
      <p class="muted" style="max-width:66ch">${cfg.intro}</p>
      <div class="qz-meta"><span>${N} ${plural(N, "вопрос", "вопроса", "вопросов")}</span><span>~${cfg.minutes} минут</span><span>без подсказок и без ИИ</span></div>
      <div class="qz-lessons">${cfg.lessons.map(l => `<a href="/lessons/${l.file}"><span class="n">Урок ${cfg.week}.${l.n} · ${Q.filter(q => q.lesson === l.n).length} ${plural(Q.filter(q => q.lesson === l.n).length, "вопрос", "вопроса", "вопросов")}</span><b>${esc(l.title)}</b><span class="c">${esc(l.cover)}</span></a>`).join("")}</div>
      <div class="callout feel"><b class="h">Как проходить</b><p>${cfg.howto || `Отвечай по памяти, как на собеседовании: не открывай уроки, пока не увидишь итог. В открытых вопросах сначала напиши или проговори свой ответ, потом сверяйся с эталоном и честно отмечай, что назвал. После каждого ответа — короткий разбор и ссылка на место в уроке. Клавиши: <code>1</code>–<code>5</code> — выбрать вариант, <code>Enter</code> — проверить и дальше.`}</p></div>
      <div class="qz-start"><button class="qz-btn" id="qzGo">${can ? "Начать заново" : "Начать тест"}</button>${can ? `<button class="qz-btn ghost" id="qzCont">Продолжить с вопроса ${Object.keys(saved.res).length + 1}</button>` : ""}<span class="qz-hist" id="qzHist"></span></div>
    </div>`;
    document.getElementById("qzGo").onclick = () => start([...Array(N).keys()]);
    if (can) document.getElementById("qzCont").onclick = () => { S = saved; S.i = Object.keys(S.res).length; renderQ(); top(); };
    if (LOCAL) fetch(API).then(r => r.json()).then(j => {
      const h = (j.history || []).filter(r => r.week === cfg.week);
      if (h.length) document.getElementById("qzHist").textContent = `Попыток: ${h.length} · лучший результат ${Math.max(...h.map(r => r.score))}% · последний ${h[h.length - 1].score}%`;
    }).catch(() => {});
  }

  /* ---------- вопрос ---------- */
  function renderQ() {
    const qi = S.list[S.i], q = Q[qi], l = lessonOf(q), done = S.res[qi];
    const dots = S.list.map((x, k) => { const r = S.res[x]; return `<i class="${k === S.i ? "cur" : r ? (r.score >= 0.999 ? "ok" : r.score > 0 ? "half" : "bad") : ""}"></i>`; }).join("");
    let body = "";
    if (q.type === "one" || q.type === "many") {
      const ord = S.order[qi];
      body = `<div class="qz-opts" role="group" aria-label="Варианты ответа">${ord.map((oi, k) => `<button class="qz-opt" data-o="${oi}" aria-pressed="false"><span class="l">${LET[k]}</span><span>${q.opts[oi]}</span></button>`).join("")}</div>
        ${q.type === "many" ? `<p class="qz-hint">Верных вариантов может быть несколько.</p>` : ""}`;
    } else if (q.type === "num") {
      body = `<div class="qz-num"><input id="qzNum" type="text" inputmode="decimal" autocomplete="off" aria-label="Ответ числом" placeholder="число">${q.unit ? `<span class="muted">${esc(q.unit)}</span>` : ""}</div>`;
    } else if (q.type === "text") {
      body = `<div class="qz-num qz-text"><input id="qzNum" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Ответ" placeholder="впиши ответ"></div>`;
    } else if (q.type === "open") {
      body = `<div class="qz-open"><textarea id="qzOpen" placeholder="Ответь своими словами — можно коротко, по пунктам. Или проговори вслух и нажми «Сверить»."></textarea></div><div id="qzPoints"></div>`;
    }
    root.innerHTML = `<div class="qz-top"><div class="qz-row"><span>Вопрос ${S.i + 1} из ${S.list.length}${S.retry ? " · работа над ошибками" : ""}</span><span>${Object.keys(S.res).length} ${plural(Object.keys(S.res).length, "ответ", "ответа", "ответов")}</span></div><div class="qz-dots" style="--n:${S.list.length}">${dots}</div></div>
      <div class="qz-card">
        <div class="qz-tag"><span>Урок ${cfg.week}.${l.n}</span><span class="k">${esc(q.refTitle)}</span><span>${{one: "один ответ", many: "несколько ответов", num: "числом", open: "своими словами", text: "впиши ответ"}[q.type]}</span></div>
        <div class="qz-q">${q.q}</div>
        ${q.say ? `<button class="qz-say" id="qzSay" type="button">🔊 Послушать</button>` : ""}
        ${q.code ? `<pre>${esc(q.code)}</pre>` : ""}
        ${body}
        <div id="qzRes"></div>
        <div class="qz-actions"><span class="qz-keys">${q.type === "one" || q.type === "many" ? "1–" + q.opts.length + " выбрать · Enter проверить" : "Enter проверить"}</span><button class="qz-btn" id="qzAct" ${q.type === "one" || q.type === "many" ? "disabled" : ""}>${q.type === "open" ? "Сверить с эталоном" : "Проверить"}</button></div>
      </div>`;
    const act = document.getElementById("qzAct");
    if (q.opts) root.querySelectorAll(".qz-opt").forEach(b => b.onclick = () => {
      if (S.res[qi]) return;
      if (q.type === "one") root.querySelectorAll(".qz-opt").forEach(x => x.setAttribute("aria-pressed", x === b));
      else b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
      act.disabled = !root.querySelector('.qz-opt[aria-pressed="true"]');
    });
    act.onclick = () => (S.res[qi] ? next() : check());
    if (q.say) { document.getElementById("qzSay").onclick = () => speak(q.say); if (!done) setTimeout(() => speak(q.say), 250); }
    if (done) showResult(true);
    const inp = document.getElementById("qzNum"); if (inp && !done) inp.focus();
  }

  function check() {
    const qi = S.list[S.i], q = Q[qi];
    let score = 0, pick = null;
    if (q.type === "one") { pick = +root.querySelector('.qz-opt[aria-pressed="true"]').dataset.o; score = pick === q.ans ? 1 : 0; }
    else if (q.type === "many") {
      pick = [...root.querySelectorAll('.qz-opt[aria-pressed="true"]')].map(b => +b.dataset.o);
      const right = pick.filter(x => q.ans.includes(x)).length, wrong = pick.length - right;
      score = Math.max(0, (right - wrong) / q.ans.length); if (right === q.ans.length && !wrong) score = 1;
    } else if (q.type === "num") {
      const v = parseFloat(String(document.getElementById("qzNum").value).replace(",", ".").replace(/\s/g, ""));
      if (!isFinite(v)) { document.getElementById("qzNum").focus(); return; }
      pick = v; score = Math.abs(v - q.ans) <= (q.tol || 1e-9) ? 1 : 0;
    } else if (q.type === "text") {
      const v = document.getElementById("qzNum").value;
      if (!v.trim()) { document.getElementById("qzNum").focus(); return; }
      pick = v; score = [].concat(q.ans).some(a => norm(a) === norm(v)) ? 1 : 0;
    } else if (q.type === "open") {
      pick = document.getElementById("qzOpen").value;
      S.res[qi] = {score: 0, pick, pending: true}; showResult(false); return;
    }
    S.res[qi] = {score, pick};
    if (!S.retry) store.set(S);
    showResult(false);
  }

  function showResult(replay) {
    const qi = S.list[S.i], q = Q[qi], r = S.res[qi], box = document.getElementById("qzRes"), act = document.getElementById("qzAct");
    const link = `<a href="${refLink(q)}" target="_blank" rel="noopener">Повторить в уроке: ${esc(q.refTitle)} ↗</a>`;
    if (q.type === "one" || q.type === "many") {
      const ans = [].concat(q.ans);
      root.querySelectorAll(".qz-opt").forEach(b => { const o = +b.dataset.o, picked = [].concat(r.pick).includes(o);
        b.disabled = true; b.setAttribute("aria-pressed", picked);
        if (ans.includes(o)) b.classList.add(picked ? "right" : "missed"); else if (picked) b.classList.add("wrong"); });
    }
    if (q.type === "num" || q.type === "text") { const i = document.getElementById("qzNum"); i.value = r.pick; i.disabled = true; i.classList.add(r.score ? "right" : "wrong"); }
    if (q.type === "open") {
      const t = document.getElementById("qzOpen"); t.value = r.pick || ""; t.disabled = true;
      const pts = document.getElementById("qzPoints");
      pts.innerHTML = `<div class="qz-res half"><b class="h">Эталон</b><p>${q.model}</p></div>
        <p class="qz-hint">Отметь, что из этого было в твоём ответе — честно, как оценил бы интервьюер:</p>
        <div class="qz-check">${q.points.map((p, k) => `<label><input type="checkbox" data-p="${k}" ${r.marks && r.marks.includes(k) ? "checked" : ""} ${r.pending ? "" : "disabled"}><span>${p}</span></label>`).join("")}</div>`;
      if (r.pending) {
        act.textContent = "Засчитать"; act.disabled = false;
        act.onclick = () => {
          const marks = [...pts.querySelectorAll("input:checked")].map(x => +x.dataset.p);
          S.res[qi] = {score: marks.length / q.points.length, pick: r.pick, marks};
          if (!S.retry) store.set(S);
          renderQ();
        };
        box.innerHTML = ""; return;
      }
    }
    const sc = r.score, cls = sc >= 0.999 ? "ok" : sc > 0 ? "half" : "bad";
    const head = q.type === "open" ? `Засчитано ${Math.round(sc * 100)}%` : sc >= 0.999 ? "Верно" : sc > 0 ? "Частично" : "Неверно";
    const right = q.type === "text" && sc < 0.999 ? ` Правильно: <b>${esc([].concat(q.ans)[0])}</b>.` : q.type === "num" ? ` Правильный ответ: <b>${q.ans}</b>${q.unit ? " " + esc(q.unit) : ""}.` : "";
    box.innerHTML = `<div class="qz-res ${cls}"><b class="h">${head}</b><p>${q.explain || ""}${right}</p>${sc < 0.999 ? link : ""}</div>`;
    act.disabled = false; act.textContent = S.i < S.list.length - 1 ? "Дальше →" : "К итогам →";
    act.onclick = next;
    if (!replay) act.focus({preventScroll: true});
  }

  function next() {
    if (S.i < S.list.length - 1) { S.i++; if (!S.retry) store.set(S); renderQ(); top(); }
    else final();
  }

  /* ---------- итог ---------- */
  function final() {
    const list = S.list, total = list.reduce((s, qi) => s + (S.res[qi] ? S.res[qi].score : 0), 0), pct = Math.round(total / list.length * 100);
    const byL = cfg.lessons.map(l => { const qs = list.filter(qi => Q[qi].lesson === l.n); const s = qs.reduce((a, qi) => a + (S.res[qi] ? S.res[qi].score : 0), 0);
      return {l, n: qs.length, pct: qs.length ? Math.round(s / qs.length * 100) : null}; }).filter(x => x.n);
    const miss = list.filter(qi => !S.res[qi] || S.res[qi].score < 0.999);
    const weakTopics = [...new Set(miss.map(qi => Q[qi].topic))];
    const grade = pct >= 85 ? ["Неделя усвоена", "Знания держатся. Можно идти дальше, а ошибки ниже — повторить точечно."]
      : pct >= 60 ? ["Почти", "Основа есть, но есть дыры. Повтори темы из списка ниже и пройди «работу над ошибками»."]
      : ["Вернись к урокам", "Пока больше половины — не по памяти. Перечитай уроки, сделай «Проверку без ИИ» в конце каждого и попробуй снова через день-два."];
    const C = 2 * Math.PI * 70, col = pct >= 85 ? "var(--accent)" : pct >= 60 ? "var(--warm)" : "var(--red)";
    root.innerHTML = `<div class="qz-card">
      <div class="qz-final">
        <svg class="qz-ring" viewBox="0 0 180 180" role="img" aria-label="Результат ${pct} процентов"><circle cx="90" cy="90" r="70" fill="none" stroke="var(--soft)" stroke-width="14"/>
          <circle id="qzArc" cx="90" cy="90" r="70" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 90 90)" style="transition:stroke-dashoffset .8s ease"/>
          <text x="90" y="98" text-anchor="middle" font-size="38" font-weight="700" fill="var(--ink)">${pct}%</text>
          <text x="90" y="122" text-anchor="middle" font-size="11" fill="var(--muted)" style="font-family:var(--f-mono)">${Math.round(total * 10) / 10} из ${list.length}</text></svg>
        <div class="qz-grade"><span class="eyebrow">${S.retry ? "Работа над ошибками" : "Итог теста недели " + cfg.week}</span><h2>${grade[0]}</h2><p class="muted">${grade[1]}</p>
          <div class="qz-bars">${byL.map(x => `<div class="qz-bar"><span>Урок ${cfg.week}.${x.l.n} · ${esc(x.l.title)}</span><span class="t"><i data-w="${x.pct}" style="width:0;background:${x.pct >= 85 ? "var(--accent)" : x.pct >= 60 ? "var(--warm)" : "var(--red)"}"></i></span><span class="v">${x.pct}%</span></div>`).join("")}</div></div>
      </div></div>
      ${miss.length ? `<section style="display:grid;gap:10px"><div class="eyebrow">Что повторить · ${miss.length} ${plural(miss.length, "вопрос", "вопроса", "вопросов")}</div>
        <div class="qz-miss">${miss.map(qi => { const q = Q[qi], r = S.res[qi]; return `<a href="${refLink(q)}"><span><b>${esc(q.refTitle)}</b> · урок ${cfg.week}.${q.lesson}<br><span class="s">${q.q.replace(/<[^>]+>/g, "").slice(0, 110)}${q.q.length > 110 ? "…" : ""}${r && r.score > 0 ? ` · засчитано ${Math.round(r.score * 100)}%` : ""}</span></span><span class="go">повторить →</span></a>`; }).join("")}</div></section>` : `<div class="callout feel"><b class="h">Без ошибок</b><p>Все ответы верные. Через неделю пройди тест ещё раз — проверить, что знания держатся.</p></div>`}
      <div class="qz-start">${miss.length ? `<button class="qz-btn" id="qzRetry">Работа над ошибками (${miss.length})</button>` : ""}<button class="qz-btn ghost" id="qzAgain">Пройти тест заново</button><button class="qz-btn ghost" id="qzCopy">Скопировать итог в Obsidian</button><span class="qz-hist" id="qzSaved"></span></div>`;
    requestAnimationFrame(() => { document.getElementById("qzArc").style.strokeDashoffset = C * (1 - pct / 100);
      root.querySelectorAll(".qz-bar i").forEach(i => i.style.width = i.dataset.w + "%"); });
    if (miss.length) document.getElementById("qzRetry").onclick = () => start(miss, true);
    document.getElementById("qzAgain").onclick = () => { store.del(); start([...Array(N).keys()]); };
    document.getElementById("qzCopy").onclick = () => {
      const d = new Date(), date = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
      const md = `### Тест недели ${cfg.week} · ${date} · ${pct}%\n` + byL.map(x => `- Урок ${cfg.week}.${x.l.n} «${x.l.title}»: ${x.pct}%`).join("\n")
        + (miss.length ? `\n\nПовторить:\n` + miss.map(qi => `- ${Q[qi].refTitle} (урок ${cfg.week}.${Q[qi].lesson})`).join("\n") : "") + "\n";
      const done = () => document.getElementById("qzSaved").textContent = "Скопировано";
      try { navigator.clipboard.writeText(md).then(done, () => prompt("Скопируй:", md)); } catch (e) { prompt("Скопируй:", md); }
    };
    if (!S.retry) {
      store.del();
      if (LOCAL) fetch(API, {method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({week: cfg.week, score: pct, right: Math.round(total * 10) / 10, total: list.length, weak: weakTopics,
          by_lesson: Object.fromEntries(byL.map(x => [x.l.n, x.pct]))})})
        .then(r => r.json()).then(j => { document.getElementById("qzSaved").textContent = `Сохранено · лучший результат недели ${j.summary.best}%`; })
        .catch(() => { document.getElementById("qzSaved").textContent = "Не сохранилось: сервер не отвечает"; });
    }
    top();
  }

  /* ---------- клавиши ---------- */
  document.addEventListener("keydown", e => {
    if (!S || !root.querySelector(".qz-card") || e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON" || e.target.tagName === "A") return;  /* у кнопок Enter срабатывает сам */
    const q = Q[S.list[S.i]];
    if (/^[1-8]$/.test(e.key) && q && q.opts) { const b = root.querySelectorAll(".qz-opt")[+e.key - 1]; if (b && !b.disabled) b.click(); }
    if (e.key === "Enter") { const a = document.getElementById("qzAct"); if (a && !a.disabled) { e.preventDefault(); a.click(); } }
  });

  if (LOCAL && document.getElementById("topnav")) document.getElementById("topnav").hidden = false;
  intro();
}
