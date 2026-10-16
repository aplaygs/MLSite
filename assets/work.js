/* Работа в уроке не теряется: ответы в упражнениях, поля лабораторий, отметки «Сделал» у практики.
   Подключать в каждом уроке сразу после nav.js: <script src="/assets/work.js"></script>.
   На localhost — сохраняется в хранилище (/api/work/<урок>, work.py), копия — в браузере; без сервера — только в браузере.
     WORK.ready(fn)        — fn вызовется, когда сохранённое загружено (упражнения восстанавливают ответы в нём)
     WORK.get(key) / WORK.put(key, value | null) — ключи ex:<id>, lab:<id>, task:<i>
   Сам находит:
     .lab с полями (input, textarea, select с id) — запоминает их значения, при открытии ставит обратно и
       «шевелит» событиями input/change, чтобы лаборатория перерисовалась; кнопка «↺ сбросить» в шапке.
       Не трогает лаборатории с data-local (у них своё хранение) и галочки тем (input[data-id]).
     .task (практика) — внизу галочка «Сделал», с датой. */
const WORK = (() => {
  const m = location.pathname.match(/\/lessons\/([a-z0-9-]+)\.html/), id = m && m[1];
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname), LS = "work:" + id;
  let items = {}, loaded = false;
  const waiters = [], timers = {};
  const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS) || "{}"); } catch (e) { return {}; } };
  const lsSet = () => { try { localStorage.setItem(LS, JSON.stringify(items)); } catch (e) {} };
  function done(d) { items = d || {}; loaded = true; lsSet(); waiters.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } }); }
  if (!id || /-test$/.test(id)) done({});
  else if (local) fetch("/api/work/" + id).then(r => { if (!r.ok) throw 0; return r.json(); }).then(j => done(j.items)).catch(() => done(lsGet()));
  else done(lsGet());
  const totals = () => ({ex: document.querySelectorAll(".ex .ex-score").length, task: document.querySelectorAll(".task").length});
  function send(key) {
    fetch("/api/work/" + id, {method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({key, value: key in items ? items[key] : null, totals: totals()})}).catch(() => {});
  }
  function put(key, value) {
    if (!id) return;
    if (value == null) delete items[key]; else items[key] = value;
    lsSet();
    if (local) { clearTimeout(timers[key]); timers[key] = setTimeout(() => send(key), 500); }
  }
  /* Ушёл со страницы раньше, чем сработал таймер, — отправить сразу. */
  addEventListener("pagehide", () => { if (local) Object.keys(timers).forEach(k => { clearTimeout(timers[k]); delete timers[k];
    navigator.sendBeacon && navigator.sendBeacon("/api/work/" + id, new Blob([JSON.stringify({key: k, value: k in items ? items[k] : null, totals: totals()})], {type: "application/json"})); }); });
  const api = {id, ready: f => (loaded ? f() : waiters.push(f)), get: k => items[k], put};

  /* ---------- лаборатории ---------- */
  function labs() {
    document.querySelectorAll(".lab").forEach((lab, li) => {
      if (lab.closest("[data-local]")) return;
      const ctrls = [...lab.querySelectorAll("input[id],textarea[id],select[id]")]
        .filter(c => !c.dataset.id && !/^(button|submit|file|hidden)$/.test(c.type) && !c.readOnly);
      if (!ctrls.length) return;
      const key = "lab:" + (lab.id || li);
      const val = c => (c.type === "checkbox" || c.type === "radio" ? c.checked : c.value);
      const defaults = Object.fromEntries(ctrls.map(c => [c.id, val(c)]));
      const setAll = st => ctrls.forEach(c => {
        if (!(c.id in st) || val(c) === st[c.id]) return;
        if (c.type === "checkbox" || c.type === "radio") c.checked = !!st[c.id]; else c.value = st[c.id];
        c.dispatchEvent(new Event("input", {bubbles: true})); c.dispatchEvent(new Event("change", {bubbles: true}));
      });
      let restoring = false;
      const saved = api.get(key);
      if (saved) { restoring = true; setAll(saved); restoring = false; }
      const head = lab.querySelector(".lab-h");
      if (head) {
        const b = document.createElement("button");
        b.type = "button"; b.className = "work-reset"; b.textContent = "↺ сбросить"; b.title = "Вернуть поля лаборатории как было";
        b.onclick = () => { restoring = true; setAll(defaults); restoring = false; put(key, null); };
        head.append(b);
      }
      const save = e => { if (!restoring && ctrls.includes(e.target)) put(key, Object.fromEntries(ctrls.map(c => [c.id, val(c)]))); };
      lab.addEventListener("input", save); lab.addEventListener("change", save);
    });
  }

  /* ---------- практика: «Сделал» ---------- */
  function tasks() {
    const fmt = iso => { const [, mo, d] = (iso || "").split("-"); return d ? `${d}.${mo}` : ""; };
    const day = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
    document.querySelectorAll(".task").forEach((t, i) => {
      const key = "task:" + i;
      t.insertAdjacentHTML("beforeend", `<label class="work-done"><input type="checkbox"><span></span></label>`);
      const cb = t.querySelector(".work-done input"), txt = t.querySelector(".work-done span");
      const show = () => { const v = api.get(key); cb.checked = !!v; txt.textContent = v ? `Сделано ${fmt(v)}` : "Сделал"; t.classList.toggle("is-done", !!v); };
      cb.onchange = () => { put(key, cb.checked ? day() : null); show(); };
      show();
    });
  }

  const st = document.createElement("style");
  st.textContent = `.work-reset{margin-left:auto;font:500 11px var(--f-mono);letter-spacing:.04em;color:var(--muted);background:none;border:0;cursor:pointer;padding:2px 4px;border-radius:6px}
.work-reset:hover{color:var(--accent);background:var(--accent-soft)}
.work-done{display:inline-flex;align-items:center;gap:8px;margin-top:6px;font-size:14px;color:var(--muted);cursor:pointer;user-select:none}
.work-done input{width:17px;height:17px;accent-color:var(--accent);cursor:pointer}
.task.is-done .work-done{color:var(--accent);font-weight:500}`;
  document.head.append(st);
  document.addEventListener("DOMContentLoaded", () => api.ready(() => { labs(); tasks(); }));
  return api;
})();
