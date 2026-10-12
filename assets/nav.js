/* Верхняя навигация сайта: Дерево · План · Отборы и кнопка текущей недели.
   Подключение: <script src="/assets/nav.js"></script> в начале <body> (или с defer — тогда появится после загрузки).
   Высота панели — CSS-переменная --navh; прилипающие элементы страницы ставят top: var(--navh). */
(function () {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  const CSS = `
:root{--navh:52px}
html{scroll-padding-top:calc(var(--navh) + 8px)}
.sitenav{position:sticky;top:0;z-index:30;margin-inline:-16px;padding-inline:16px;background:color-mix(in srgb,var(--bg) 86%,transparent);
  -webkit-backdrop-filter:saturate(1.4) blur(10px);backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
.sitenav .in{max-width:1180px;margin:0 auto;height:var(--navh);display:flex;align-items:center;gap:6px}
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
  const cur = path === "/plan" || path.startsWith("/lessons/") ? "/plan" : path === "/hire" ? "/hire" : path === "/tree" ? "/tree" : "";
  const nav = document.createElement("nav");
  nav.className = "sitenav"; nav.setAttribute("aria-label", "Разделы сайта");
  nav.innerHTML = `<div class="in"><a class="brand" href="/tree"><i aria-hidden="true"></i><span>ML-дерево</span></a>`
    + [["/tree", "Дерево"], ["/plan", "План"], ["/hire", "Отборы"]].map(([h, t]) => `<a class="lk" href="${h}"${h === cur ? ' aria-current="page"' : ""}>${t}</a>`).join("")
    + `<a class="wk" id="navWeek" href="/plan" hidden>Неделя</a></div>`;
  /* панель встаёт первой в <body>; в уроках скрипт стоит ещё в <head> — тогда ждём, пока появится body */
  const fit = () => { const w = document.querySelector(".wrap"); if (w) nav.querySelector(".in").style.maxWidth = getComputedStyle(w).maxWidth; };
  const mount = () => { document.body.prepend(nav); fit(); };
  if (document.body) { mount(); if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fit); }
  else document.addEventListener("DOMContentLoaded", mount);
  fetch("/api/plan").then(r => r.json()).then(p => {
    const d = new Date(), t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const w = (p.weeks || []).find(x => x.start <= t && t <= x.end); if (!w) return;
    const a = document.getElementById("navWeek"); a.hidden = false; a.href = `/plan#w-${w.n}`; a.textContent = `Неделя ${w.n} →`;
    a.title = w.focus || "";
  }).catch(() => {});
})();
