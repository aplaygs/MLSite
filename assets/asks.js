/* Метки «◎ N — спрашивают на отборах» у тем дерева и уроков.
   Подключение: <script src="/assets/asks.js" defer></script>. Скрипт сам находит галочки тем
   (input[data-id]) и ставит рядом ссылку в раздел «Отборы» (/hire#t-<id>). Работает только с сервером. */
(function () {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  const CSS = `
.ask-b{display:inline-flex;align-items:center;gap:3px;margin-left:6px;padding:0 6px;height:18px;border-radius:999px;
  font:600 10.5px/1 var(--f-mono,ui-monospace,monospace);color:var(--warm,var(--key));text-decoration:none;white-space:nowrap;
  border:1px solid color-mix(in srgb,var(--warm,var(--key)) 45%,transparent);background:color-mix(in srgb,var(--warm,var(--key)) 10%,transparent);
  vertical-align:1px;position:relative;transition:background-color .15s,border-color .15s,transform .15s}
.ask-b:hover{background:color-mix(in srgb,var(--warm,var(--key)) 22%,transparent);border-color:var(--warm,var(--key));transform:translateY(-1px)}
.ask-b:focus-visible{outline:2px solid var(--warm,var(--key));outline-offset:2px}
.ask-tip{position:fixed;z-index:50;max-width:300px;padding:10px 12px;border-radius:10px;background:var(--ink);color:var(--bg);
  font:13px/1.45 var(--f-body,system-ui,sans-serif);box-shadow:0 8px 24px -8px rgba(0,0,0,.35);pointer-events:none;opacity:0;transform:translateY(4px);transition:opacity .12s,transform .12s}
.ask-tip.on{opacity:1;transform:none}
.ask-tip b{display:block;font:600 11px var(--f-mono,ui-monospace,monospace);letter-spacing:.05em;text-transform:uppercase;opacity:.75;margin-bottom:4px}
.ask-tip ul{margin:0;padding-left:16px}
.ask-tip .more{opacity:.7;margin-top:4px}
@media (prefers-reduced-motion:reduce){.ask-b,.ask-tip{transition:none}}`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
  let BY = null, tip = null;

  function word(n) { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? "источнике" : "источниках"; }

  function badge(t) {
    const a = document.createElement("a");
    a.className = "ask-b";
    a.href = "/hire#t-" + t.id;
    a.textContent = "◎ " + t.count;
    a.setAttribute("aria-label", `Спрашивают на отборах: в ${t.count} ${word(t.count)}. Открыть раздел «Отборы»`);
    a.addEventListener("click", e => e.stopPropagation());
    a.addEventListener("mouseenter", () => show(a, t));
    a.addEventListener("focus", () => show(a, t));
    a.addEventListener("mouseleave", hide);
    a.addEventListener("blur", hide);
    return a;
  }

  function show(el, t) {
    if (!tip) { tip = document.createElement("div"); tip.className = "ask-tip"; tip.setAttribute("role", "tooltip"); document.body.appendChild(tip); }
    const srcs = [...new Set(t.asks.map(a => a.source))];
    tip.innerHTML = `<b>Спрашивают на отборах · ${t.count}</b><ul>${t.asks.slice(0, 3).map(a => `<li>${esc(a.what)}</li>`).join("")}</ul>`
      + `<div class="more">${esc(srcs.slice(0, 2).join(", "))}${srcs.length > 2 ? " и др." : ""}${t.asks.length > 3 ? ` · ещё ${t.asks.length - 3}` : ""}</div>`;
    const r = el.getBoundingClientRect(), w = Math.min(300, innerWidth - 24);
    tip.style.left = Math.max(12, Math.min(r.left, innerWidth - w - 12)) + "px";
    tip.style.top = (r.bottom + 8 + 120 > innerHeight ? r.top - 8 - tip.offsetHeight : r.bottom + 8) + "px";
    tip.classList.add("on");
  }
  function hide() { if (tip) tip.classList.remove("on"); }

  function decorate() {
    if (!BY) return;
    document.querySelectorAll("input[data-id]").forEach(cb => {
      const t = BY[cb.dataset.id], lab = cb.closest("label");
      if (!t || !lab || lab.querySelector(".ask-b")) return;
      const host = lab.querySelector(".tx .t") || [...lab.children].filter(x => x.tagName === "SPAN" && !x.classList.contains("bx") && !x.classList.contains("box")).pop() || lab;
      const d = host.querySelector(".d");
      d ? host.insertBefore(badge(t), d) : host.appendChild(badge(t));
    });
  }

  fetch("/api/hire").then(r => r.ok ? r.json() : null).then(j => {
    if (!j) return;
    BY = Object.fromEntries(j.topics.map(t => [t.id, t]));
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    decorate();
    let pending = 0;
    new MutationObserver(() => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; decorate(); }); })
      .observe(document.body, {childList: true, subtree: true});
    addEventListener("scroll", hide, {passive: true});
  }).catch(() => {});
})();
