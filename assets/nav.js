/* Верхняя навигация сайта: переключатель ML · English, ссылки раздела и кнопка текущей недели.
   Подключение: <script src="/assets/nav.js"></script> в начале <body> (или с defer — тогда появится после загрузки).
   Высота панели — CSS-переменная --navh; прилипающие элементы страницы ставят top: var(--navh). */
/* Плавность без задержек: страница сразу показывается и коротко проявляется (0.18 с, ничего не ждёт);
   переход на место (#w-2, #t-…) — плавная прокрутка, её делает сама страница. window.siteReady оставлен для совместимости. */
(function () {
  const st0 = document.createElement("style");
  st0.textContent = `@keyframes pagein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.wrap{animation:pagein .18s ease-out both}
@media (prefers-reduced-motion:reduce){.wrap{animation:none}}`;
  document.head.appendChild(st0);
  window.siteReady = () => {};
})();
(function () {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  const CSS = `
:root{--navh:52px}
html{scroll-padding-top:calc(var(--navh) + 8px)}
.sitenav{position:sticky;top:0;z-index:30;margin-inline:-16px;padding-inline:16px;background:color-mix(in srgb,var(--bg) 86%,transparent);
  -webkit-backdrop-filter:saturate(1.4) blur(10px);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
.sitenav .in{max-width:1180px;margin:0 auto;height:var(--navh);display:flex;align-items:center;gap:6px}
/* Переключатель разделов ML · English */
.sitenav .sw{display:flex;padding:3px;margin-right:10px;border-radius:999px;background:var(--soft);border:1px solid var(--line)}
.sitenav .sw a{font:600 12.5px var(--f-body,system-ui);color:var(--muted);text-decoration:none;padding:5px 12px;border-radius:999px;transition:background-color .18s,color .18s}
.sitenav .sw a:hover{color:var(--ink)}
.sitenav .sw a[aria-current="true"]{background:var(--accent);color:var(--surface,#fff)}
/* Английский — синий акцент вместо зелёного: всё, что берёт var(--accent), перекрашивается само */
:root[data-section="en"]{--accent:#2F5FD0;--accent-soft:rgba(47,95,208,.15);--accent-ink:#FFFFFF}
@media (prefers-color-scheme:dark){:root[data-section="en"]:not([data-theme="light"]){--accent:#7EA6F8;--accent-soft:rgba(126,166,248,.18);--accent-ink:#0B1530}}
:root[data-section="en"][data-theme="dark"]{--accent:#7EA6F8;--accent-soft:rgba(126,166,248,.18);--accent-ink:#0B1530}
.sitenav .brand{display:flex;align-items:center;gap:8px;margin-right:10px;text-decoration:none;color:var(--ink);font:700 14px var(--f-display,system-ui);letter-spacing:-.01em;white-space:nowrap}
.sitenav .brand i{width:12px;height:12px;border-radius:50% 0;background:var(--accent);transform:rotate(-45deg)}
.sitenav .lk{position:relative;text-decoration:none;color:var(--muted);font:500 14px var(--f-body,system-ui);padding:7px 12px;border-radius:999px;transition:color .15s,background-color .15s}
.sitenav .lk:hover{color:var(--ink);background:var(--soft)}
.sitenav .lk[aria-current="page"]{color:var(--ink);background:var(--surface);box-shadow:0 0 0 1px var(--line) inset}
.sitenav .lk[aria-current="page"]::after{content:"";position:absolute;left:12px;right:12px;bottom:3px;height:2px;border-radius:2px;background:var(--accent)}
.sitenav .wk{margin-left:auto;text-decoration:none;font:500 12.5px var(--f-mono,ui-monospace);color:var(--surface);background:var(--accent);padding:6px 12px;border-radius:999px;white-space:nowrap;transition:filter .15s,transform .15s}
.sitenav .wk:hover{filter:brightness(1.08)} .sitenav .wk:active{transform:scale(.97)}
@media (max-width:560px){.sitenav .brand span{display:none}.sitenav .lk{padding:7px 9px;font-size:13.5px}.sitenav .wk{padding:6px 10px}}
@media (prefers-reduced-motion:reduce){.sitenav *{transition:none!important}}`;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  const path = location.pathname.replace(/\/$/, "");
  /* Раздел: ML или English. Английский — /en…, тренажёр /words и уроки английского /lessons/e… */
  const EN = path === "/en" || path.startsWith("/en/") || path === "/words" || /^\/lessons\/e\d/.test(path);
  document.documentElement.dataset.section = EN ? "en" : "ml";
  const LINKS = EN ? [["/en", "Обзор"], ["/words", "Слова"]] : [["/tree", "Дерево"], ["/plan", "План"], ["/hire", "Отборы"]];
  const cur = EN ? (path === "/words" ? "/words" : "/en")
    : path === "/plan" || path.startsWith("/lessons/") ? "/plan" : path === "/hire" ? "/hire" : path === "/tree" ? "/tree" : "";
  const nav = document.createElement("nav");
  nav.className = "sitenav"; nav.setAttribute("aria-label", "Разделы сайта");
  nav.innerHTML = `<div class="in"><div class="sw" role="group" aria-label="Раздел"><a href="/tree"${EN ? "" : ' aria-current="true"'}>ML</a><a href="/en"${EN ? ' aria-current="true"' : ""}>English</a></div>`
    + LINKS.map(([h, t]) => `<a class="lk" href="${h}"${h === cur ? ' aria-current="page"' : ""}>${t}</a>`).join("")
    + `<a class="wk" id="navWeek" href="/plan" hidden>Неделя</a></div>`;
  /* панель встаёт первой в <body>; в уроках скрипт стоит ещё в <head> — тогда ждём, пока появится body */
  const fit = () => { const w = document.querySelector(".wrap"); if (w) nav.querySelector(".in").style.maxWidth = getComputedStyle(w).maxWidth; };
  const mount = () => { document.body.prepend(nav); fit(); };
  if (document.body) { mount(); if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fit); }
  else document.addEventListener("DOMContentLoaded", mount);
  fetch(EN ? "/api/en/plan" : "/api/plan").then(r => r.json()).then(p => {
    const d = new Date(), t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const w = (p.weeks || []).find(x => x.start <= t && t <= x.end); if (!w) return;
    const a = document.getElementById("navWeek"); a.hidden = false; a.href = `${EN ? "/en" : "/plan"}#w-${w.n}`; a.textContent = `Неделя ${w.n} →`;
    a.title = EN ? w.title : (w.focus || "");
  }).catch(() => {});
})();
