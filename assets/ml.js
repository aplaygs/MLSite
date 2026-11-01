/* Короткие уроки ML: быстрые проверки, тренажёр терминала и план шагов. Подключать после lesson.js.
     mlCheck(el, items)   — вопросы с вариантами, ответ сразу: {q, opts:[…], a: номер верного, why}.
     termSim(el, cfg)     — тренажёр терминала: {start: "~/projects/oulad-risk", prep: ["команда", …], tasks: [{t, hint, ok(state)}]}.
                            Есть git: init, status, add, commit, log, branch, switch, merge, remote, push, pull, clone
                            (cfg.cloneRepo — [{msg, snap}] для clone; служебная «git __colleague {json}» — коллега пушит коммит).
                            Файлы — общие для всех тренажёров урока (TERM_FS), у каждого тренажёра своя копия.
                            state: {cwd, fs, venv, pkgs, cmd, out, git — репозиторий текущей папки, repos} — проверка задания смотрит на него после каждой команды.
     mlSort(el, {groups:[{k,label}], items:[{w, g, why?, hint?}], title?}) — разложить по группам, карточки по одной.
     mlSteps()            — план урока в шапке (.steps a[href="#sN"]): шаг пройден, когда все его упражнения решены.
   Ответы и сделанные задания сохраняются (work.js, ключ ex:<id>): открыл урок снова — счёт на месте. */

function mlSave(id, val) { if (typeof WORK !== "undefined") WORK.put("ex:" + id, val); }
function mlLoad(id) { return typeof WORK !== "undefined" ? WORK.get("ex:" + id) : null; }
function mlReady(fn) { if (typeof WORK !== "undefined") WORK.ready(fn); else fn(); }
const mlEsc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));

function mlScore(el, n, t) {
  const sc = el.querySelector(".ex-score");
  sc.textContent = `${n} / ${t}`; sc.classList.toggle("full", n === t);
  el.classList.toggle("ex-done", n === t);
  mlSteps();
}

/* ---------- быстрые проверки ---------- */
function mlCheck(el, items) {
  el.classList.add("ex");
  const id = el.id;
  el.innerHTML = `<div class="ex-h"><span class="eyebrow">Проверь себя</span></div>` +
    items.map((it, i) => `<div class="chk" data-i="${i}"><div class="q">${it.q}</div><div class="opts">${it.opts.map((o, k) =>
      `<button class="opt" data-k="${k}">${o}</button>`).join("")}</div><p class="fb" hidden></p></div>`).join("") +
    `<div class="ex-foot"><span class="ex-score">0 / ${items.length}</span><button class="btn" data-reset>Заново</button></div>`;
  let ans = {};
  function show() {
    el.querySelectorAll(".chk").forEach(c => {
      const i = +c.dataset.i, it = items[i], a = ans[i], fb = c.querySelector(".fb");
      c.querySelectorAll(".opt").forEach(b => {
        const k = +b.dataset.k;
        b.disabled = a !== undefined;
        b.classList.toggle("right", a !== undefined && k === it.a);
        b.classList.toggle("wrong", a !== undefined && k === a && a !== it.a);
      });
      fb.hidden = a === undefined;
      if (a !== undefined) fb.innerHTML = `<b>${a === it.a ? "Верно." : "Не совсем."}</b> ${it.why}`;
    });
    mlScore(el, items.filter((it, i) => ans[i] === it.a).length, items.length);
  }
  el.addEventListener("click", e => {
    const b = e.target.closest(".opt");
    if (b) { const i = +b.closest(".chk").dataset.i; if (ans[i] === undefined) { ans[i] = +b.dataset.k; mlSave(id, {a: ans, n: items.filter((it, j) => ans[j] === it.a).length, t: items.length}); show(); } }
    if (e.target.closest("[data-reset]")) { ans = {}; mlSave(id, null); show(); }
  });
  mlReady(() => { const s = mlLoad(id); if (s && s.a) ans = s.a; show(); });
}

/* ---------- разложить по группам: карточки по одной ---------- */
function mlSort(el, {groups, items, title}) {
  el.classList.add("ex");
  const id = el.id;
  el.innerHTML = `<div class="ex-h"><span class="eyebrow">${title || "Разложи по местам"}</span></div><div class="srt"></div>
    <div class="ex-foot"><span class="ex-score">0 / ${items.length}</span><button class="btn" data-reset>Заново</button></div>`;
  const box = el.querySelector(".srt");
  let ans = {};
  function show() {
    const i = items.findIndex((_, k) => ans[k] === undefined);
    const done = items.map((it, k) => ans[k] !== undefined ? `<div class="srt-done ${ans[k] === it.g ? "ok" : "no"}"><code>${mlEsc(it.w)}</code> → ${mlEsc(groups.find(g => g.k === ans[k]).label)}${ans[k] === it.g ? "" : ` · правильно: <b>${mlEsc(groups.find(g => g.k === it.g).label)}</b>`}${it.why ? `<span>${it.why}</span>` : ""}</div>` : "").join("");
    box.innerHTML = (i >= 0 ? `<div class="srt-card"><span class="muted">Куда это?</span><code class="srt-w">${mlEsc(items[i].w)}</code>${items[i].hint ? `<span class="muted" style="font-size:13.5px">${items[i].hint}</span>` : ""}<div class="btns">${groups.map(g => `<button class="btn" data-g="${g.k}" data-i="${i}">${mlEsc(g.label)}</button>`).join("")}</div></div>` : "") + `<div class="srt-list">${done}</div>`;
    mlScore(el, items.filter((it, k) => ans[k] === it.g).length, items.length);
  }
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-g]");
    if (b) { ans[+b.dataset.i] = b.dataset.g; mlSave(id, {a: ans, n: items.filter((it, k) => ans[k] === it.g).length, t: items.length}); show(); }
    if (e.target.closest("[data-reset]")) { ans = {}; mlSave(id, null); show(); }
  });
  mlReady(() => { const s = mlLoad(id); if (s && s.a) ans = s.a; show(); });
}

/* ---------- тренажёр терминала ---------- */
const TERM_HOME = "/Users/vlad";
const TERM_FS = {
  Desktop: {},
  Downloads: {"studentInfo.csv": "code_module,code_presentation,id_student,final_result\nAAA,2013J,11391,Pass\n", "courses.csv": "code_module,code_presentation,length\nAAA,2013J,268\n", "photo.jpg": "(картинка)"},
  projects: {
    "oulad-risk": {
      "README.md": "# oulad-risk\nПрогноз: какие студенты рискуют не закончить курс.\n",
      src: {"load.py": "import pandas as pd\n\ndef load_students():\n    return pd.read_csv(\"data/raw/studentInfo.csv\")\n", "train.py": "from load import load_students\n\nstudents = load_students()\nprint(len(students))\n"},
      notebooks: {"01_eda.ipynb": "df = pd.read_csv(\"../data/raw/studentInfo.csv\")\ndf.head()\n"},
      data: {raw: {"assessments.csv": "id_assessment,code_module,weight\n1752,AAA,10\n"}}
    },
    "old-homework": {"task1.py": "print(\"hello\")\n"}
  }
};
const TERM_PANDAS = {"pandas": "2.2.3", "numpy": "2.1.3", "python-dateutil": "2.9.0.post0", "pytz": "2024.2", "six": "1.16.0", "tzdata": "2024.2"};

function termSim(el, cfg) {
  el.classList.add("ex");
  const id = el.id, tasks = cfg.tasks;
  el.innerHTML = `<div class="ex-h"><span class="eyebrow">Тренажёр терминала · печатай команды</span></div>
    <div class="tsim"><div class="scr" role="log" aria-live="polite"><div class="out"></div><div class="inp"><span class="pr"></span><input aria-label="Команда" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>
    <ol class="tasks"></ol></div>
    <div class="ex-foot"><span class="ex-score">0 / ${tasks.length}</span><button class="btn" data-reset>Начать заново</button></div>`;
  const out = el.querySelector(".out"), inp = el.querySelector("input"), scr = el.querySelector(".scr"), list = el.querySelector(".tasks");
  let S, done = new Set(), hist = [], hi = 0;

  const clone = o => JSON.parse(JSON.stringify(o));
  const short = p => p === TERM_HOME ? "~" : p.startsWith(TERM_HOME + "/") ? "~" + p.slice(TERM_HOME.length) : p;
  const prompt = () => `${S.venv ? "(.venv) " : ""}vlad@mac ${S.cwd === TERM_HOME ? "~" : S.cwd.split("/").pop()} %`;
  function resolve(p) {
    if (!p || p === "~") return TERM_HOME;
    let parts = p.startsWith("/") ? [] : p.startsWith("~") ? TERM_HOME.split("/").filter(Boolean) : S.cwd.split("/").filter(Boolean);
    (p.startsWith("~") ? p.slice(1) : p).split("/").forEach(x => { if (!x || x === ".") return; if (x === "..") parts.pop(); else parts.push(x); });
    return "/" + parts.join("/");
  }
  function node(path) { /* объект папки, строка файла или undefined */
    if (path === "/" ) return null;
    if (!path.startsWith(TERM_HOME)) return path === "/Users" ? {vlad: S.fs} : undefined;
    let n = S.fs; for (const x of path.slice(TERM_HOME.length).split("/").filter(Boolean)) { if (n === undefined || typeof n !== "object") return undefined; n = n[x]; }
    return n;
  }
  function parent(path) { const i = path.lastIndexOf("/"); return [node(path.slice(0, i) || "/"), path.slice(i + 1)]; }
  const isDir = n => n && typeof n === "object";
  function walk(path, n, fn) { fn(path, n); if (isDir(n)) Object.keys(n).sort().forEach(k => walk(path + "/" + k, n[k], fn)); }
  const glob = g => new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
  const rel = (p, base) => p === base ? "." : p.startsWith(base + "/") ? "./" + p.slice(base.length + 1) : short(p);

  function run(line) {
    const redirect = line.match(/^(.*?)\s*(>>?)\s*(\S+)$/);
    const stages = (redirect ? redirect[1] : line).split(/\s+\|\s+/);  /* пайп: вывод одной команды — вход следующей */
    let res = {text: ""}, stdin = null;
    for (const st of stages) {
      res = exec1(st, stdin);
      if (res.err || res.silent) return res;
      stdin = typeof res.text === "string" ? res.text : res.html ? res.html.replace(/<[^>]+>/g, "") : "";
    }
    if (redirect) {
      const text = stdin || "";
      const [par, name] = parent(resolve(redirect[3]));
      if (!isDir(par)) return {err: `zsh: no such file or directory: ${redirect[3]}`};
      const add = text + (text ? "\n" : "");
      par[name] = redirect[2] === ">>" && typeof par[name] === "string" ? par[name] + add : add; return {text: ""};
    }
    return res;
  }

  function exec1(cmdline, stdin) {
    const a = cmdline.trim().split(/\s+/).map(x => x.replace(/^["']|["']$/g, "")), c = a[0];
    const err = m => ({err: m});
    const input = (f, name) => { if (f) { const n = node(resolve(f)); if (typeof n !== "string") return err(`${name}: ${f}: ${n === undefined ? "No such file or directory" : "Is a directory"}`); return n.replace(/\n$/, ""); }
      return stdin !== null ? stdin : err(`${name}: укажи файл (или передай вывод через |)`); };
    let res;
    switch (c) {
      case "pwd": res = S.cwd; break;
      case "ls": {
        const all = a.includes("-a") || a.includes("-la") || a.includes("-al"), long = a.some(x => /^-.*l/.test(x));
        const target = a.slice(1).find(x => !x.startsWith("-")), p = resolve(target || "."), n = node(p);
        if (n === undefined) return err(`ls: ${target}: No such file or directory`);
        if (!isDir(n)) return {html: mlEsc(target)};
        const names = Object.keys(n).filter(k => all || !k.startsWith(".")).sort();
        res = {html: names.map(k => isDir(n[k]) ? `<span class="dir">${mlEsc(k)}</span>` : mlEsc(k)).join(long ? "\n" : "   ") || ""};
        break;
      }
      case "cd": {
        const p = resolve(a[1]), n = node(p);
        if (!isDir(n)) return err(`cd: ${n === undefined ? "no such file or directory" : "not a directory"}: ${a[1]}`);
        S.cwd = p; res = ""; break;
      }
      case "mkdir": {
        const target = a.slice(1).find(x => !x.startsWith("-")); if (!target) return err("usage: mkdir папка");
        const p = resolve(target), [par, name] = parent(p);
        if (!isDir(par)) return err(`mkdir: ${target}: No such file or directory`);
        if (par[name] !== undefined) return err(`mkdir: ${target}: File exists`);
        par[name] = {}; res = ""; break;
      }
      case "touch": { const p = resolve(a[1]), [par, name] = parent(p); if (!isDir(par)) return err(`touch: ${a[1]}: No such file or directory`); if (par[name] === undefined) par[name] = ""; res = ""; break; }
      case "cp": case "mv": {
        const args = a.slice(1).filter(x => !x.startsWith("-")), rec = a.includes("-r") || a.includes("-R");
        if (args.length < 2) return err(`usage: ${c} откуда куда`);
        const src = resolve(args[0]), n = node(src);
        if (n === undefined) return err(`${c}: ${args[0]}: No such file or directory`);
        if (c === "cp" && isDir(n) && !rec) return err(`cp: ${args[0]} is a directory (not copied). Для папки нужен cp -r`);
        let dst = resolve(args[1]); const dn = node(dst);
        if (isDir(dn)) dst = dst + "/" + src.split("/").pop();
        const [par, name] = parent(dst);
        if (!isDir(par)) return err(`${c}: ${args[1]}: No such file or directory`);
        par[name] = clone(n);
        if (c === "mv") { const [sp, sn] = parent(src); delete sp[sn]; }
        res = ""; break;
      }
      case "rm": {
        const rec = a.some(x => /^-.*r/i.test(x)), target = a.slice(1).find(x => !x.startsWith("-"));
        if (!target) return err("usage: rm файл");
        const p = resolve(target), n = node(p);
        if (n === undefined) return err(`rm: ${target}: No such file or directory`);
        if (isDir(n) && !rec) return err(`rm: ${target}: is a directory. Для папки нужен rm -r`);
        const [par, name] = parent(p); delete par[name]; res = ""; break;
      }
      case "cat": case "head": case "tail": {
        const ni = a.indexOf("-n"), k = ni > 0 ? +a[ni + 1] : +((a.find(x => /^-\d+$/.test(x)) || "-10").slice(1));
        const f = a.slice(1).find((x, i) => !x.startsWith("-") && !(ni > 0 && i === ni));  /* не число после -n */
        const txt = input(f, c); if (typeof txt !== "string") return txt;
        const L = txt.split("\n"); res = c === "cat" ? txt : (c === "head" ? L.slice(0, k) : L.slice(-k)).join("\n"); break;
      }
      case "wc": { const f = a.slice(1).find(x => !x.startsWith("-")), txt = input(f, "wc"); if (typeof txt !== "string") return txt;
        const n = txt === "" ? 0 : txt.split("\n").length; res = a.includes("-l") ? (f ? `${n} ${f}` : String(n)) : `${n} ${txt.split(/\s+/).filter(Boolean).length} ${txt.length + 1}${f ? " " + f : ""}`; break; }
      case "sort": { const f = a.slice(1).find(x => !x.startsWith("-")), txt = input(f, "sort"); if (typeof txt !== "string") return txt;
        let L = txt.split("\n"); L = a.includes("-n") ? L.sort((x, y) => parseFloat(x) - parseFloat(y)) : L.sort(); if (a.includes("-r")) L.reverse(); res = L.join("\n"); break; }
      case "uniq": { const f = a.slice(1).find(x => !x.startsWith("-")), txt = input(f, "uniq"); if (typeof txt !== "string") return txt;
        const g = []; txt.split("\n").forEach(l => { if (g.length && g.at(-1)[0] === l) g.at(-1)[1]++; else g.push([l, 1]); });
        res = g.map(([l, n]) => a.includes("-c") ? `${String(n).padStart(4)} ${l}` : l).join("\n"); break; }
      case "cut": { const d = (a.find(x => x.startsWith("-d")) || "-d,").slice(2) || ",", fi = a.indexOf("-f"), fs = (fi > 0 ? a[fi + 1] : (a.find(x => /^-f\d/.test(x)) || "-f1").slice(2)).split(",").map(Number);
        const f = a.slice(1).find((x, i) => !x.startsWith("-") && a[i] !== "-f"), txt = input(f, "cut"); if (typeof txt !== "string") return txt;
        res = txt.split("\n").map(l => fs.map(k => l.split(d)[k - 1] ?? "").join(d)).join("\n"); break; }
      case "find": {
        const start = a[1] && !a[1].startsWith("-") ? a[1] : ".", i = a.indexOf("-name"), base = resolve(start), n = node(base);
        if (n === undefined) return err(`find: ${start}: No such file or directory`);
        const re = i > 0 && a[i + 1] ? glob(a[i + 1]) : null, found = [];
        walk(base, n, (p) => { const nm = p.split("/").pop(); if (!re || re.test(nm)) found.push(start === "." ? rel(p, base) : short(p)); });
        res = found.join("\n"); break;
      }
      case "grep": {
        const flags = a.slice(1).filter(x => x.startsWith("-")).join(""), args = a.slice(1).filter(x => !x.startsWith("-"));
        const pat = args[0], target = args[1] || (flags.includes("r") ? "." : null);
        if (pat && !target && stdin !== null) { const hit = l => (flags.includes("i") ? l.toLowerCase().includes(pat.toLowerCase()) : l.includes(pat)) !== flags.includes("v");
          const L = stdin.split("\n").filter(hit); res = flags.includes("c") ? String(L.length) : L.join("\n"); break; }
        if (!pat || !target) return err("usage: grep -rn что_ищем папка");
        const base = resolve(target), n = node(base), lines = [], ic = flags.includes("i");
        if (n === undefined) return err(`grep: ${target}: No such file or directory`);
        if (isDir(n) && !flags.includes("r")) return err(`grep: ${target}: Is a directory (для папки нужен -r)`);
        walk(base, n, (p, f) => { if (typeof f !== "string" || p.includes("/.venv/")) return; f.split("\n").forEach((l, k) => {
          if ((ic ? l.toLowerCase().includes(pat.toLowerCase()) : l.includes(pat))) lines.push(`${isDir(n) ? rel(p, base) + ":" : ""}${flags.includes("n") ? (k + 1) + ":" : ""}${l}`); }); });
        res = lines.join("\n"); break;
      }
      case "python3": case "python":
        if (a[1] === "-m" && a[2] === "venv" && a[3]) { const [par, name] = parent(resolve(a[3])); par[name] = {bin: {activate: "# скрипт включения"}, lib: {}}; res = ""; break; }
        if (a[1] === "--version") { res = "Python 3.12.7"; break; }
        return err("В тренажёре python3 умеет только: python3 -m venv .venv");
      case "source": case ".": {
        const p = resolve(a[1] || ""); if (!/\/bin\/activate$/.test(p) || node(p) === undefined) return err(`source: no such file or directory: ${a[1] || ""}`);
        S.venv = p.replace(/\/bin\/activate$/, ""); res = ""; break;
      }
      case "deactivate": if (!S.venv) return err("deactivate: command not found"); S.venv = null; res = ""; break;
      case "pip": case "pip3": {
        if (a[1] === "install" && a[2] === "-r") {
          const n = node(resolve(a[3] || "")); if (typeof n !== "string") return err(`ERROR: Could not open requirements file: ${a[3] || ""}`);
          const pk = n.split("\n").filter(Boolean).map(x => x.split("=="));
          pk.forEach(([k, v]) => { S.pkgs[k] = v; }); res = `Successfully installed ${pk.map(([k, v]) => `${k}-${v}`).join(" ")}`;
          if (!S.venv) res += "\n⚠ Окружение не включено — всё поставилось в общий Python.";
          break;
        }
        if (a[1] === "install" && a[2]) {
          const [k, v] = a[2].split("==");
          const add = k === "pandas" ? {...TERM_PANDAS, ...(v ? {pandas: v} : {})} : {[k]: v || "1.0.0"};
          Object.assign(S.pkgs, add);
          res = `Collecting ${k}\nSuccessfully installed ${Object.entries(add).map(([x, y]) => `${x}-${y}`).join(" ")}` + (S.venv ? "" : "\n⚠ Окружение не включено — библиотека встала в общий Python, а не в проект.");
          break;
        }
        if (a[1] === "freeze") { res = Object.keys(S.pkgs).sort().map(k => `${k}==${S.pkgs[k]}`).join("\n"); break; }
        if (a[1] === "list") { res = "Package    Version\n" + Object.keys(S.pkgs).sort().map(k => `${k.padEnd(10)} ${S.pkgs[k]}`).join("\n"); break; }
        return err("В тренажёре pip умеет: install, install -r, freeze, list");
      }
      case "echo": res = cmdline.trim().slice(4).trim().replace(/^["']|["']$/g, ""); break;
      case "git": { const g = gitCmd(a, cmdline); if (g.err) return g; res = g.text; break; }
      case "code": res = ""; break;
      case "clear": out.innerHTML = ""; return {silent: true};
      case "help": res = "Команды тренажёра: pwd, ls [-a], cd, mkdir, touch, cp [-r], mv, rm [-r], cat, head / tail -n 5, wc -l, sort, uniq -c, cut -d, -f 2, пайп |, echo \"текст\" >> файл, find . -name \"*.csv\", grep -rn текст ., python3 -m venv .venv, source .venv/bin/activate, deactivate, pip install / freeze / list, git (init, status, add, commit, log, branch, switch, merge, remote, push, pull, clone), clear"; break;
      case "": return {silent: true};
      default: return err(`zsh: command not found: ${c}`);
    }
    return typeof res === "string" ? {text: res} : res;
  }

  /* ---------- git в тренажёре: коммиты — снимки файлов, ветки — указатели, remote — копия указателей ---------- */
  function ignoreRules(root) { const gi = node(root + "/.gitignore"); return typeof gi === "string" ? gi.split("\n").map(x => x.trim()).filter(x => x && !x.startsWith("#")) : []; }
  function ignored(rel, rules) { /* упрощённый .gitignore: «папка/», «*.csv», «.env», «data/raw/» */
    return rules.some(r => { const dir = r.endsWith("/"), pat = r.replace(/^\//, "").replace(/\/$/, ""), re = new RegExp("^" + pat.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*") + "$");
      const parts = rel.split("/"); if (dir) return parts.slice(0, -1).some((_, i) => re.test(parts.slice(0, i + 1).join("/")) || re.test(parts[i]));
      return re.test(rel) || re.test(parts.at(-1)) || parts.slice(0, -1).some((_, i) => re.test(parts.slice(0, i + 1).join("/"))); }); }
  function files(root, all) { const o = {}, n = node(root), rules = all ? [] : ignoreRules(root); walk(root, n, (p, f) => { const rel = p.slice(root.length + 1);
    if (typeof f === "string" && !/\/\.git(\/|$)/.test(p.slice(root.length)) && !ignored(rel, rules)) o[rel] = f; }); return o; }
  function repo() { return S.repos.find(r => S.cwd === r.root || S.cwd.startsWith(r.root + "/")) || null; }
  const snap = (G, b) => { const id = G.heads[b ?? G.branch]; return id ? JSON.parse(JSON.stringify(G.commits[id].snap)) : {}; };
  const same = (x, y) => JSON.stringify(Object.entries(x).sort()) === JSON.stringify(Object.entries(y).sort());
  function mkCommit(G, msg, sn, parent) { G.n = (G.n || 0) + 1; const id = ((G.n * 2654435761) >>> 0).toString(16).padStart(8, "0").slice(0, 7); G.commits[id] = {msg, snap: sn, parent}; return id; }
  function chain(G, id) { const o = []; while (id) { o.push(id); id = G.commits[id].parent; } return o; }
  function setWork(G, sn) { const old = files(G.root); Object.keys(old).forEach(k => { const [par, nm] = parent(G.root + "/" + k); if (par) delete par[nm]; });
    Object.entries(sn).forEach(([k, v]) => { const parts = k.split("/"); let d = node(G.root); parts.slice(0, -1).forEach(x => { d[x] = isDir(d[x]) ? d[x] : {}; d = d[x]; }); d[parts.at(-1)] = v; }); }
  function gitCmd(a, line) {
    const sub = a[1], G = repo(), err = m => ({err: m});
    if (sub === "init") { if (repo() && repo().root === S.cwd) return {text: `Reinitialized existing Git repository in ${short(S.cwd)}/.git/`};
      const r = node(S.cwd); r[".git"] = {}; S.repos.push({root: S.cwd, index: {}, commits: {}, heads: {main: null}, branch: "main", remote: null}); return {text: `Initialized empty Git repository in ${short(S.cwd)}/.git/`}; }
    if (sub === "clone") { const url = a[2] || "", name = url.split("/").pop().replace(/\.git$/, ""); if (!name) return err("usage: git clone адрес");
      const R = cfg.cloneRepo; if (!R) return err(`fatal: repository '${url}' not found`);
      const root = S.cwd + "/" + name; node(S.cwd)[name] = {".git": {}};
      const G2 = {root, index: {}, commits: {}, heads: {main: null}, branch: "main", remote: {url, heads: {}}};
      let id = null; R.forEach(c => { id = mkCommit(G2, c.msg, c.snap, id); }); G2.heads.main = id; G2.remote.heads.main = id; G2.index = snap(G2);
      S.repos.push(G2); setWork(G2, snap(G2)); return {text: `Cloning into '${name}'...\ndone.`}; }
    if (!G) return err("fatal: not a git repository (or any of the parent directories): .git");
    const work = () => files(G.root), head = () => snap(G);
    switch (sub) {
      case "status": {
        const w = work(), h = head(), ix = G.index, st = [], ns = [], un = [];
        new Set([...Object.keys(ix), ...Object.keys(h)]).forEach(k => { if (ix[k] !== h[k]) st.push(`\t${!(k in h) ? "new file" : !(k in ix) ? "deleted" : "modified"}:   ${k}`); });
        new Set([...Object.keys(w), ...Object.keys(ix)]).forEach(k => { if (k in ix && w[k] !== ix[k]) ns.push(`\t${k in w ? "modified" : "deleted"}:   ${k}`); else if (!(k in ix) && k in w) un.push(`\t${k}`); });
        let o = `On branch ${G.branch}`;
        if (st.length) o += "\nChanges to be committed:\n" + st.join("\n");
        if (ns.length) o += "\nChanges not staged for commit:\n" + ns.join("\n");
        if (un.length) o += "\nUntracked files:\n" + un.join("\n");
        if (!st.length && !ns.length && !un.length) o += "\nnothing to commit, working tree clean";
        return {text: o};
      }
      case "add": { const p = a[2]; if (!p) return err("Nothing specified, nothing added."); const w = work(), pre = p === "." || p === "-A" ? "" : resolve(p).slice(G.root.length + 1);
        const hit = k => !pre || k === pre || k.startsWith(pre + "/"); let any = false;
        Object.keys(w).forEach(k => { if (hit(k)) { G.index[k] = w[k]; any = true; } });
        Object.keys(G.index).forEach(k => { if (hit(k) && !(k in w)) { delete G.index[k]; any = true; } });
        return any ? {text: ""} : err(`fatal: pathspec '${p}' did not match any files`); }
      case "commit": { const m = line.match(/-m\s+["'](.+?)["']\s*$/) || line.match(/-m\s+(\S+)/); if (!m) return err("Нужно сообщение: git commit -m \"что сделал\"");
        if (same(G.index, head())) return {text: `On branch ${G.branch}\nnothing to commit, working tree clean`};
        const id = mkCommit(G, m[1], JSON.parse(JSON.stringify(G.index)), G.heads[G.branch]); G.heads[G.branch] = id;
        return {text: `[${G.branch} ${id}] ${m[1]}`}; }
      case "log": { const ids = chain(G, G.heads[G.branch]); if (!ids.length) return err(`fatal: your current branch '${G.branch}' does not have any commits yet`);
        return {text: ids.map(id => `${id} ${G.commits[id].msg}` + (G.remote && G.remote.heads[G.branch] === id && id !== G.heads[G.branch] ? " (origin/" + G.branch + ")" : "")).join("\n")}; }
      case "branch": return {text: Object.keys(G.heads).sort().map(b => (b === G.branch ? "* " : "  ") + b).join("\n")};
      case "switch": case "checkout": {
        const create = a.includes("-c") || a.includes("-b"), name = a.slice(2).find(x => !x.startsWith("-"));
        if (!name) return err("usage: git switch ветка");
        if (create) { if (name in G.heads) return err(`fatal: a branch named '${name}' already exists`); G.heads[name] = G.heads[G.branch]; G.branch = name; return {text: `Switched to a new branch '${name}'`}; }
        if (!(name in G.heads)) return err(`fatal: invalid reference: ${name}`);
        if (!same(work(), G.index) || !same(G.index, head())) return err("error: Your local changes would be overwritten. Сначала закоммить изменения.");
        G.branch = name; G.index = head(); setWork(G, head()); return {text: `Switched to branch '${name}'`};
      }
      case "merge": { const name = a[2]; if (!(name in G.heads)) return err(`merge: ${name} - not something we can merge`);
        const mine = G.heads[G.branch], theirs = G.heads[name];
        if (chain(G, mine).includes(theirs)) return {text: "Already up to date."};
        if (!mine || chain(G, theirs).includes(mine)) { G.heads[G.branch] = theirs; G.index = head(); setWork(G, head()); return {text: `Updating ${mine || "0000000"}..${theirs}\nFast-forward`}; }
        const sn = {...snap(G, G.branch), ...snap(G, name)}, id = mkCommit(G, `Merge branch '${name}'`, sn, mine); G.heads[G.branch] = id; G.index = head(); setWork(G, head());
        return {text: "Merge made by the 'ort' strategy."}; }
      case "remote": if (a[2] === "add" && a[4]) { G.remote = {url: a[4], heads: {}}; return {text: ""}; } return {text: G.remote ? `origin\t${G.remote.url} (fetch)\norigin\t${G.remote.url} (push)` : ""};
      case "push": { if (!G.remote) return err("fatal: No configured push destination. Сначала git remote add origin адрес");
        const r = G.remote.heads[G.branch], mine = G.heads[G.branch];
        if (r && !chain(G, mine).includes(r)) return err("! [rejected] (fetch first) — на GitHub есть коммиты, которых у тебя нет. Сначала git pull.");
        G.remote.heads[G.branch] = mine; return {text: `To ${G.remote.url}\n   ${(r || "0000000")}..${mine}  ${G.branch} -> ${G.branch}`}; }
      case "pull": { if (!G.remote) return err("fatal: no remote"); const r = G.remote.heads[G.branch], mine = G.heads[G.branch];
        if (!r || chain(G, mine).includes(r)) return {text: "Already up to date."};
        if (!same(work(), G.index) || !same(G.index, head())) return err("error: сначала закоммить свои изменения");
        G.heads[G.branch] = r; G.index = head(); setWork(G, head()); return {text: `Updating ${mine}..${r}\nFast-forward`}; }
      case "__colleague": { /* служебная: коллега запушил коммит на GitHub */ const js = line.indexOf("{"), sn = {...snap(G, G.branch), ...JSON.parse(js >= 0 ? line.slice(js) : "{}")};
        const id = mkCommit(G, cfg.colleagueMsg || "docs: коллега обновил README", sn, G.remote.heads[G.branch] || G.heads[G.branch]); G.remote.heads[G.branch] = id; return {text: ""}; }
      default: return err(`git: '${sub}' — в тренажёре есть init, status, add, commit, log, branch, switch, merge, remote, push, pull, clone`);
    }
  }

  function print(html, cls) { const d = document.createElement("div"); d.className = "ln" + (cls ? " " + cls : ""); d.innerHTML = html; out.appendChild(d); }
  function drawTasks() {
    const cur = tasks.findIndex((t, i) => !done.has(i));
    list.innerHTML = tasks.map((t, i) => `<li class="${done.has(i) ? "ok" : i === cur ? "cur" : ""}"><i aria-hidden="true"></i><span>${t.t}</span>${i === cur && t.hint ? `<span class="hint"><button data-hint="${i}">подсказка</button></span>` : ""}</li>`).join("");
    el.querySelector(".pr").textContent = prompt();
    mlScore(el, done.size, tasks.length);
  }
  function exec(line) {
    print(`<span class="pr">${mlEsc(prompt())}</span> ${mlEsc(line)}`);
    const r = run(line);
    if (r.err) print(mlEsc(r.err), "er");
    else if (r.html !== undefined) { if (r.html) print(r.html); }
    else if (r.text) print(mlEsc(r.text));
    S.cmd = line.trim(); S.out = r.text || r.html || ""; S.git = repo();
    tasks.forEach((t, i) => { if (!done.has(i)) { try { if (t.ok(S)) done.add(i); } catch (e) {} } });
    mlSave(id, {done: [...done], n: done.size, t: tasks.length});
    drawTasks(); scr.scrollTop = scr.scrollHeight;
  }
  function reset(keep) {
    S = {cwd: TERM_HOME, fs: clone(TERM_FS), venv: null, pkgs: {}, cmd: "", out: "", git: null, repos: []};
    (cfg.prep || []).forEach(l => run(l));
    if (cfg.start) S.cwd = resolve(cfg.start);
    S.git = repo();
    if (!keep) done = new Set();
    out.innerHTML = ""; print("Тренажёр: файлы ненастоящие, сломать ничего нельзя. help — список команд.", "mt");
    drawTasks();
  }
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") { const v = inp.value; inp.value = ""; if (v.trim()) { hist.push(v); hi = hist.length; } exec(v); }
    else if (e.key === "ArrowUp" && hi > 0) { inp.value = hist[--hi]; e.preventDefault(); }
    else if (e.key === "ArrowDown") { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ""; e.preventDefault(); }
  });
  scr.addEventListener("click", () => { if (!getSelection().toString()) inp.focus({preventScroll: true}); });
  el.addEventListener("click", e => {
    const h = e.target.closest("[data-hint]"); if (h) { inp.value = tasks[+h.dataset.hint].hint; inp.focus(); }
    if (e.target.closest("[data-reset]")) { mlSave(id, null); reset(false); }
  });
  reset(false);
  mlReady(() => { const s = mlLoad(id); if (s && s.done) { done = new Set(s.done); drawTasks(); } });
}

/* ---------- план урока в шапке ---------- */
function mlSteps() {
  document.querySelectorAll(".steps a[href^='#']").forEach(a => {
    const sec = document.querySelector(a.getAttribute("href"));
    if (!sec) return;
    const ex = sec.querySelectorAll(".ex"), checks = sec.querySelectorAll(".topic-check input[data-id]");
    const exOk = ex.length && [...ex].every(x => x.classList.contains("ex-done"));
    const topicsOk = checks.length && [...checks].every(c => c.checked);
    a.classList.toggle("done", !!(exOk || topicsOk));
  });
}
document.addEventListener("change", e => { if (e.target.matches && e.target.matches("input[data-id]")) setTimeout(mlSteps, 50); });
