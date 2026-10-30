/* Карточки для Quizlet. Влад учит слова и правила в Quizlet (годовая подписка). Открытого API для создания наборов
   у Quizlet нет, поэтому путь — его «Импорт»: строки «термин ⇥ определение», по карточке на строку.
     QZ.words(cards)  — строки из слов {word, translation}: термин — английское, определение — перевод
     QZ.rules(cards)  — строки из правил {q, a, examples, wrong, right}: «вопрос → правило» и, если есть, «Исправь: ошибка → как верно»
     QZ.copy(text)    — скопировать сразу, в том же нажатии (Safari не даёт копировать после ожидания сервера)
     QZ.howto(kind)   — короткая инструкция импорта (kind: "words" | "rules")
     QZ.URL           — создать набор в Quizlet
   Используют: блок «В Quizlet» в конце урока (en.js, takeAway) и страницы /words, /rules (deck.html). */
const QZ = (() => {
  const one = s => String(s ?? "").replace(/\*([^*]+)\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/[\t\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
  const exText = ex => (ex || []).map(e => one(typeof e === "string" ? e : e.en)).filter(Boolean);
  const words = cards => cards.filter(c => c.word && c.translation).map(c => `${one(c.word)}\t${one(c.translation)}`);
  const rules = cards => cards.flatMap(c => {
    const ex = exText(c.examples), out = [];
    if (c.q && c.a) out.push(`${one(c.q)}\t${one(c.a)}${ex.length ? " Например: " + ex.join(" · ") : ""}`);
    if (c.wrong && c.right) out.push(`Исправь: ${one(c.wrong)}\t${one(c.right)}`);
    return out;
  });
  function copy(text) {
    try { if (navigator.clipboard && window.isSecureContext !== false) { navigator.clipboard.writeText(text).catch(() => fallback(text)); return true; } } catch (e) {}
    return fallback(text);
  }
  function fallback(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove(); return ok;
  }
  const howto = kind => `<ol class="qz-how">
    <li>Открой <a href="${URL}" target="_blank" rel="noopener">Quizlet → новый набор ↗</a> или свой набор недели → «Редактировать».</li>
    <li>Нажми <b>«+ Импорт»</b> и вставь (<kbd>Cmd</kbd>+<kbd>V</kbd>).</li>
    <li>Между термином и определением — <b>Tab</b>, между карточками — <b>Новая строка</b>. Нажми «Импортировать».</li>
    <li>Язык: ${kind === "words" ? "термин — <b>English</b>, определение — <b>Russian</b> (так Quizlet правильно озвучит слово)" : "термин и определение — <b>Russian</b>"}.</li>
    <li>Название — например «English A2 · неделя 2 · ${kind === "words" ? "слова" : "правила"}». Учи в режиме <b>Заучивание</b> (Learn), 10–15 минут в день.</li>
  </ol>`;
  const URL = "https://quizlet.com/create-set";
  const st = document.createElement("style");
  st.textContent = `.qz-how{margin:8px 0 0;padding-left:20px;display:grid;gap:5px;font-size:14.5px;line-height:1.45}
.qz-how kbd{font:500 12px var(--f-mono,monospace);border:1px solid var(--line);border-radius:5px;padding:0 5px;background:var(--bg)}`;
  document.head.append(st);
  return {words, rules, copy, howto, URL};
})();
