/* Кружок «спрашивают на отборах» у тем дерева, плана и уроков.
   Пустой кружок — тема из тех, что обычно спрашивают на отборах (◎ в плане).
   Кружок с цифрой — сколько раз тема уже встретилась в разборах собеседований и условиях стажировок (раздел «Отборы»).
   Страница ставит заготовку <span class="qd key" data-q="ID"></span> перед названием темы (key — тема ключевая).
   Если заготовки нет, а тему спрашивали, скрипт сам вставит кружок в подпись галочки input[data-id].
   Подключение: <script src="/assets/asks.js" defer></script>. Работает только с сервером. */
(function () {
  const CSS = `
.qd{display:none;place-items:center;flex:none;width:15px;height:15px;margin-right:6px;border-radius:50%;vertical-align:-2px;
  border:1.6px solid var(--warm,var(--key));color:var(--warm,var(--key));font:700 9.5px/1 var(--f-mono,ui-monospace,monospace);
  font-variant-numeric:tabular-nums;cursor:pointer;transition:transform .15s,background-color .15s}
.qd.key,.qd.has{display:inline-grid}
.qd.has{width:19px;height:19px;background:color-mix(in srgb,var(--warm,var(--key)) 16%,transparent);vertical-align:-4px}
.qd:hover{transform:scale(1.15);background:color-mix(in srgb,var(--warm,var(--key)) 28%,transparent)}
.qd:focus-visible{outline:2px solid var(--warm,var(--key));outline-offset:2px}
.ask-tip{position:fixed;z-index:50;max-width:300px;padding:10px 12px;border-radius:10px;background:var(--ink);color:var(--bg);
  font:13px/1.45 var(--f-body,system-ui,sans-serif);box-shadow:0 8px 24px -8px rgba(0,0,0,.35);pointer-events:none;opacity:0;transform:translateY(4px);transition:opacity .12s,transform .12s}
.ask-tip.on{opacity:1;transform:none}
.ask-tip b{display:block;font:600 11px var(--f-mono,ui-monospace,monospace);letter-spacing:.05em;text-transform:uppercase;opacity:.75;margin-bottom:4px}
.ask-tip ul{margin:0;padding-left:16px}
.ask-tip .more{opacity:.7;margin-top:4px}
@media (prefers-reduced-motion:reduce){.qd,.ask-tip{transition:none}}`;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  const times = n => { const a = n % 10, b = n % 100; return a >= 2 && a <= 4 && (b < 12 || b > 14) ? "раза" : "раз"; };
  let BY = {}, tip = null;

  function show(el) {
    if (!tip) { tip = document.createElement("div"); tip.className = "ask-tip"; tip.setAttribute("role", "tooltip"); document.body.appendChild(tip); }
    const t = BY[el.dataset.q];
    if (t) {
      const srcs = [...new Set(t.asks.map(a => a.source))];
      tip.innerHTML = `<b>Спрашивали ${t.count} ${times(t.count)}</b><ul>${t.asks.slice(0, 3).map(a => `<li>${esc(a.what)}</li>`).join("")}</ul>`
        + `<div class="more">${esc(srcs.slice(0, 2).join(", "))}${srcs.length > 2 ? " и др." : ""}${t.asks.length > 3 ? ` · ещё ${t.asks.length - 3}` : ""} · нажми — в «Отборы»</div>`;
    } else {
      tip.innerHTML = `<b>Спрашивают на отборах</b>Эту тему обычно проверяют на стажировках в ML. В твоих разборах собеседований пока не встречалась.`;
    }
    const r = el.getBoundingClientRect(), w = Math.min(300, innerWidth - 24);
    tip.style.left = Math.max(12, Math.min(r.left - 8, innerWidth - w - 12)) + "px";
    tip.classList.add("on");
    tip.style.top = (r.bottom + 8 + tip.offsetHeight > innerHeight ? r.top - 8 - tip.offsetHeight : r.bottom + 8) + "px";
  }
  function hide() { if (tip) tip.classList.remove("on"); }

  function arm(q) {
    if (q.dataset.armed) return;
    q.dataset.armed = "1";
    q.setAttribute("role", "link"); q.tabIndex = 0;
    const go = e => { e.preventDefault(); e.stopPropagation(); location.href = BY[q.dataset.q] ? "/hire#t-" + q.dataset.q : "/hire"; };
    q.addEventListener("click", go);
    q.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") go(e); });
    q.addEventListener("mouseenter", () => show(q)); q.addEventListener("focus", () => show(q));
    q.addEventListener("mouseleave", hide); q.addEventListener("blur", hide);
  }
  function paint(q) {
    const t = BY[q.dataset.q];
    q.classList.toggle("has", !!t);
    const v = t ? String(t.count) : "";
    if (q.textContent !== v) q.textContent = v;  /* без лишних изменений DOM — иначе наблюдатель зациклится */
    q.setAttribute("aria-label", t ? `Спрашивали на отборах ${t.count} ${times(t.count)} — открыть «Отборы»` : "Спрашивают на отборах — открыть «Отборы»");
    if (t) { const it = q.closest(".it,.tp"); if (it) it.classList.add("asked"); }
    arm(q);
  }
  function decorate() {
    document.querySelectorAll("input[data-id]").forEach(cb => {
      const lab = cb.closest("label"); if (!lab || lab.querySelector("[data-q]") || !BY[cb.dataset.id]) return;
      const host = lab.querySelector(".tx .t") || [...lab.children].filter(x => x.tagName === "SPAN" && !x.classList.contains("bx") && !x.classList.contains("box")).pop();
      if (!host) return;
      const q = document.createElement("span"); q.className = "qd"; q.dataset.q = cb.dataset.id;
      host.prepend(q);
    });
    document.querySelectorAll("[data-q]").forEach(paint);
  }

  const start = () => {
    decorate();
    let pending = 0;
    new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; decorate(); }); })
      .observe(document.body, {childList: true, subtree: true});
    addEventListener("scroll", hide, {passive: true});
  };
  if (!LOCAL) return start();
  fetch("/api/hire").then(r => r.ok ? r.json() : null).then(j => { if (j) BY = Object.fromEntries(j.topics.map(t => [t.id, t])); start(); }).catch(start);
})();
