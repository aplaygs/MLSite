/* Верхняя навигация сайта: переключатель ML · English, ссылки раздела и кнопка текущей недели.
   Подключение: <script src="/assets/nav.js"></script> в начале <body> (или с defer — тогда появится после загрузки).
   Высота панели — CSS-переменная --navh; прилипающие элементы страницы ставят top: var(--navh). */
/* Плавность без задержек: страница сразу показывается и коротко проявляется (0.18 с, ничего не ждёт);
   переход на место (#w-2, #t-…) — плавная прокрутка, её делает сама страница. window.siteReady оставлен для совместимости. */
(function () {
  const st0 = document.createElement("style");
  /* View Transitions не используем (GUIDE: давали задержку при переходе) */
  st0.textContent = `@keyframes pageIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.wrap{animation:pageIn .18s cubic-bezier(0.16,1,0.3,1) both}
@media (prefers-reduced-motion:reduce){.wrap{animation:none}html{scroll-behavior:auto!important}}`;
  /* Раздел English: пастельная тема — голубая основа и бледно-абрикосовый акцент (--sun: подсветки, --warm: ключевое).
     Все страницы берут цвета из токенов, поэтому перекрашиваются сами — и уроки, и тренажёр слов. */
  const path = location.pathname;
  const EN = path === "/en" || path.startsWith("/en/") || path === "/words" || path === "/rules" || /^\/lessons\/e\d/.test(path);
  const HUB = path === "/" || path === "";  /* «Сегодня» — своя тональность, цвета задаёт сама страница */
  document.documentElement.dataset.section = HUB ? "hub" : EN ? "en" : "ml";
  st0.textContent += `
:root[data-section="en"]{--bg:#EEF3FA;--surface:#FFFFFF;--ink:#1A2335;--muted:#5D6982;--line:#D7E0EE;--soft:#E3EBF7;--accent:#3A6AD4;--accent-soft:rgba(58,106,212,.13);--accent-ink:#FFFFFF;--warm:#C9802A;--sun:#FBE6C4;--sun-soft:#FDF3E3;--sun-ink:#8A520E;--miss:#C9802A;--miss-soft:#FBE6C4}
@media (prefers-color-scheme:dark){:root[data-section="en"]:not([data-theme="light"]){--bg:#0F1522;--surface:#161E2E;--ink:#E4EAF5;--muted:#98A3BA;--line:#283349;--soft:#1D2739;--accent:#8EB0F7;--accent-soft:rgba(142,176,247,.16);--accent-ink:#0C1528;--warm:#F2BE78;--sun:rgba(242,190,120,.2);--sun-soft:rgba(242,190,120,.09);--sun-ink:#F5CF97;--miss:#F2BE78;--miss-soft:rgba(242,190,120,.2)}}
:root[data-section="en"][data-theme="dark"]{--bg:#0F1522;--surface:#161E2E;--ink:#E4EAF5;--muted:#98A3BA;--line:#283349;--soft:#1D2739;--accent:#8EB0F7;--accent-soft:rgba(142,176,247,.16);--accent-ink:#0C1528;--warm:#F2BE78;--sun:rgba(242,190,120,.2);--sun-soft:rgba(242,190,120,.09);--sun-ink:#F5CF97;--miss:#F2BE78;--miss-soft:rgba(242,190,120,.2)}`;
  document.head.appendChild(st0);
  window.siteReady = () => {};
})();
(function () {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  const CSS = `
:root{--navh:52px}
html{scroll-padding-top:calc(var(--navh) + 8px);scroll-behavior:smooth}
.sitenav{position:sticky;top:0;z-index:30;margin-inline:-16px;padding-inline:16px;background:color-mix(in srgb,var(--bg) 86%,transparent);
  -webkit-backdrop-filter:saturate(1.4) blur(10px);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
.sitenav .in{max-width:1180px;margin:0 auto;height:var(--navh);display:flex;align-items:center;gap:6px}
/* Переключатель разделов ML · English */
.sitenav .home{display:inline-grid;place-items:center;width:34px;height:34px;flex:none;border-radius:50%;color:var(--muted);border:1px solid var(--line);background:var(--surface,#fff);transition:color .15s,border-color .15s}
.sitenav .home:hover{color:var(--accent);border-color:var(--accent)}
.sitenav .home[aria-current="page"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink,#fff)}
.sitenav .sw{display:flex;padding:3px;margin-right:10px;border-radius:999px;background:var(--soft);border:1px solid var(--line)}
.sitenav .sw a{font:600 12.5px var(--f-body,system-ui);color:var(--muted);text-decoration:none;padding:5px 12px;border-radius:999px;display:inline-flex;align-items:center;transition:background-color .18s cubic-bezier(0.16,1,0.3,1),color .18s,transform .12s,box-shadow .18s}
.sitenav .sw a:hover{color:var(--ink)}
.sitenav .sw a:active{transform:scale(.94)}
.sitenav .sw a[aria-current="true"]{background:var(--accent);color:var(--surface,#fff);box-shadow:0 1px 4px rgba(0,0,0,.08);animation:swPop .22s cubic-bezier(0.16,1,0.3,1) both}
@keyframes swPop{from{transform:scale(0.92);opacity:.85}to{transform:none;opacity:1}}
.sitenav .brand{display:flex;align-items:center;gap:8px;margin-right:10px;text-decoration:none;color:var(--ink);font:700 14px var(--f-display,system-ui);letter-spacing:-.01em;white-space:nowrap}
.sitenav .brand i{width:12px;height:12px;border-radius:50% 0;background:var(--accent);transform:rotate(-45deg)}
.sitenav .lk{position:relative;text-decoration:none;color:var(--muted);font:500 14px var(--f-body,system-ui);padding:7px 12px;border-radius:999px;display:inline-flex;align-items:center;transition:color .15s,background-color .15s,transform .12s}
.sitenav .lk:hover{color:var(--ink);background:var(--soft)}
.sitenav .lk:active{transform:scale(.94)}
.sitenav .lk[aria-current="page"]{color:var(--ink);background:var(--surface);box-shadow:0 0 0 1px var(--line) inset}
.sitenav .lk[aria-current="page"]::after{content:"";position:absolute;left:12px;right:12px;bottom:3px;height:2px;border-radius:2px;background:var(--accent);transition:all .18s ease}
.sitenav .nav-wk, .sitenav .wk{margin:0 0 0 auto!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;text-decoration:none;font:500 12.5px var(--f-mono,ui-monospace);color:var(--surface,#fff)!important;background:var(--accent)!important;border:0!important;box-shadow:none!important;height:32px;padding:0 14px;border-radius:999px;white-space:nowrap;line-height:1;box-sizing:border-box;transition:filter .15s,transform .15s}
.sitenav .nav-wk:hover, .sitenav .wk:hover{filter:brightness(1.08)} .sitenav .nav-wk:active, .sitenav .wk:active{transform:scale(.96)}
@media (max-width:560px){.sitenav .brand span{display:none}.sitenav .lk{padding:7px 9px;font-size:13.5px}.sitenav .nav-wk, .sitenav .wk{padding:0 10px;height:30px;font-size:12px}}
@media (max-width:440px){.sitenav .nav-wk{display:none!important}.sitenav .in{gap:2px}.sitenav .home{width:30px;height:30px;margin-right:4px}.sitenav .sw{margin-right:4px}.sitenav .sw a{padding:5px 9px;font-size:12px}.sitenav .lk{padding:6px 7px;font-size:13px}}
@media (prefers-reduced-motion:reduce){.sitenav *{transition:none!important}}`;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  const path = location.pathname.replace(/\/$/, "");
  /* Раздел: ML или English. Английский — /en…, колоды /words и /rules и уроки английского /lessons/e… */
  const EN = document.documentElement.dataset.section === "en", HUB = document.documentElement.dataset.section === "hub";
  const LINKS = HUB ? [["/words", "Слова"], ["/rules", "Правила"]] : EN ? [["/en", "Обзор"], ["/words", "Слова"], ["/rules", "Правила"]] : [["/tree", "Дерево"], ["/plan", "План"], ["/hire", "Отборы"]];
  const cur = EN ? (path === "/words" || path === "/rules" ? path : "/en")
    : path === "/plan" || path.startsWith("/lessons/") ? "/plan" : path === "/hire" ? "/hire" : path === "/tree" ? "/tree" : "";
  const nav = document.createElement("nav");
  nav.className = "sitenav"; nav.setAttribute("aria-label", "Разделы сайта");
  nav.innerHTML = `<div class="in"><a class="home" href="/" title="Сегодня — план на день" aria-label="Сегодня"${HUB ? ' aria-current="page"' : ""}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg></a><div class="sw" role="group" aria-label="Раздел"><a href="/tree"${EN || HUB ? "" : ' aria-current="true"'}>ML</a><a href="/en"${EN ? ' aria-current="true"' : ""}>English</a></div>`
    + LINKS.map(([h, t]) => `<a class="lk" href="${h}"${h === cur ? ' aria-current="page"' : ""}>${t}</a>`).join("")
    + (HUB ? "" : `<a class="nav-wk" id="navWeek" href="/plan" hidden>Неделя</a>`) + `</div>`;
  /* панель встаёт первой в <body>; в уроках скрипт стоит ещё в <head> — тогда ждём, пока появится body */
  const mount = () => { document.body.prepend(nav); };
  if (document.body) { mount(); }
  else document.addEventListener("DOMContentLoaded", mount);

  /* Для кнопки недели: если уже на этой же странице — плавно прокручиваем без перезагрузки */
  nav.addEventListener("click", e => {
    const a = e.target.closest("a#navWeek");
    if (!a) return;
    const curPath = location.pathname.replace(/\/$/, "");
    const aPath = a.pathname.replace(/\/$/, "");
    if (aPath === curPath && a.hash) {
      const m = a.hash.match(/^#w-(\d+)$/);
      if (m && typeof window.goWeek === "function") {
        e.preventDefault();
        window.goWeek(+m[1]);
        history.pushState(null, "", a.hash);
      }
    }
  });



  if (!HUB) fetch(EN ? "/api/en/plan" : "/api/plan").then(r => r.json()).then(p => {
    const d = new Date(), t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const w = (p.weeks || []).find(x => x.start <= t && t <= x.end); if (!w) return;
    const a = document.getElementById("navWeek"); a.hidden = false; a.href = `${EN ? "/en" : "/plan"}#w-${w.n}`; a.textContent = `Неделя ${w.n} →`;
    a.title = EN ? w.title : (w.focus || "");
  }).catch(() => {});
})();
