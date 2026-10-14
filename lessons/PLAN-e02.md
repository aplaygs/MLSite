# План недели 2 английского · Unit 2 «Work and study»

Задание для агента, который будет делать уроки. Неделя 19–25.10.2026. Делать строго по [`STYLE-EN.md`](STYLE-EN.md), образец — неделя 1 (`e01-*.html`). Темы и id — из `.agents/data/en_plan.json`, записи уроков уже есть в `.agents/data/en_lessons.json` со `"status": "planned"`: когда урок готов, убери `status`.

Главное в неделе — **present simple** и вечная путаница русскоговорящих **be или do**. Его Влад будет использовать постоянно (о работе, учёбе, привычках), поэтому грамматику — глубоко, упражнений больше, чем в неделе 1.

Что уже пройдено с репетитором (не повторять как новое, но использовать): 2A — present simple +/−, 19 профессий в словаре (actor … tour guide, `слова.csv`, unit 2A), правило в `65_Английский/Правила.md` → Unit 2. 2B–2D ещё не пройдены.

---

## Урок 2.1 «Present simple: что я делаю всегда» · `e02-1.html`

> ✅ Готов 14.10.2026 (Claude). Когда будет готов урок 2.2 — поменять в `e02-1.html` правую ссылку `topnav` и кнопку в конце (сейчас ведут на `/en#w-2`) на `/lessons/e02-2.html`.
Темы: `en.02.1.1` (Present simple: + и −, -s у he/she/it), `en.02.1.2` (профессии и место работы).

**Тема 1. Present simple: утверждение и отрицание**
- Зачем: то, что бывает регулярно, всегда, факты (*I work in IT. Water boils at 100 degrees.*). Не «сейчас» — это будет present continuous (неделя 5), здесь одна строка-предупреждение.
- Формула: I / you / we / they + глагол; he / she / it + глагол**-s**. Отрицание: **don't / doesn't** + глагол без -s.
- Правила -s (таблица): +s (works, likes) · -s, -sh, -ch, -x, -o → -es (watches, goes, does) · согласная + y → -ies (studies), гласная + y → -s (plays) · have → has.
- Ошибки русскоговорящих: ~~He work~~, ~~She doesn't works~~, ~~I am work~~ / ~~I'm working every day~~, ~~He don't~~, ~~My parents lives~~, ~~Anna and Ilya works~~.
- Связь с неделей 1: **be** — когда нет глагола, **do/does** — когда глагол есть. Выноска «Как запомнить»: «-s одна на предложение: либо у глагола (*works*), либо у does (*doesn't work*)».
- **Лаборатория «Машина -s»**: выбираешь подлежащее (I, you, he, she, it, we, they, Vlad, my parents) и глагол (work, watch, study, play, go, do, have, fix, finish, live) и форму (+ / −). Вывод — фраза с раскраской и строка «сработало правило: согласная + y → -ies». Для noun-подлежащих показывать, почему he или they.
- Упражнения: exGap выбор (work / works) ×8 · exGap ввод формы глагола ×8 (включая has, goes, does, studies, plays) · exGap отрицание don't / doesn't ×6 · exSpot ×7 · exBuild перевод ×5.

**Тема 2. Профессии и место работы**
- Слова уже в словаре — wordCards с ними же (повторение, не новые). Новые связки: *work in an office / from home / for a big company / with people / as a developer / long hours / part-time / full-time*; *What do you do?* = «Кем работаешь?» (не «Что ты делаешь сейчас?»), ответ *I'm a… / I work as…*.
- Ошибки: ~~I work like a developer~~ (as, не like), ~~I am developer~~ (a/an — неделя 1), ~~I work on a company~~ (for).
- Упражнения: exGap предлоги in / for / as / with / from ×8 · exSort «где работает» (office, hospital, school, home, restaurant…) или «кто это» по описанию ×10 · exBuild ×4.

Практика: «Мой обычный день» 6 фраз про себя и 4 про друга (he / she — следить за -s); образец под details.

## Урок 2.2 «Вопросы с do/does, учёба и звук -s» · `e02-2.html`
Темы: `en.02.2.1`, `en.02.2.2`, `en.02.2.3`.

**Тема 1. Вопросы с do/does и короткие ответы**
- Формула: Do / Does + подлежащее + глагол без -s? Вопрос со словом: *Where do you live? What does she do? When do you study?*
- Короткие ответы: *Yes, I do. / No, I don't. Yes, she does. / No, she doesn't.*
- Ошибки: ~~Does she works?~~, ~~Do he live…?~~, ~~Where you live?~~, ~~Are you work?~~, ~~What you do?~~, ~~Yes, I am~~ на вопрос с do.
- **Лаборатория «Перевёртыш 2»**: утверждение → вопрос; FLIP-анимация, при этом **-s «перепрыгивает»** с глагола на does (*She works* → *Does she work?*), а для I / you появляется do. Тот же код, что в уроке 1.2 (`flipLab`), плюс отдельный летящий элемент «-s».
- Упражнения: exBuild вопросы ×6 · exGap короткие ответы (выбор) ×7 · exGap вопросительное слово + do / does ×6 · exSpot ×6 · интервью на слух (как в 1.2) — 8 вопросов о работе и учёбе.

**Тема 2. Учёба и время**
- Слова (новые, для тренажёра — после «да» Влада): *study, revise (for an exam), take an exam, pass, fail, homework, lecture, timetable, term, degree, subject, course, notes*; время: *in the morning / afternoon / evening, at night, at the weekend, on Mondays, every day, after class*.
- Ловушки: *study* vs *learn* (учиться где-то / выучить что-то), *pass an exam* = сдать (не «пройти»), ~~make homework~~ → *do homework*, ~~in the night~~ → *at night*, *on Monday(s)* но *at the weekend* (брит.).
- Упражнения: wordCards · exGap in / on / at ×8 · exGap study / learn, do / make ×6.

**Тема 3. Произношение -s и слитное do you**
- /s/ после глухих (works, stops), /z/ после звонких и гласных (lives, plays), /ɪz/ после s, sh, ch, x, ge (watches, finishes, changes). То же правило у множественного числа (неделя 1) — сказать.
- *Do you…?* в речи — /djə/, *Does he…?* — /dʌz iː/ почти слитно; ударение в вопросе — на смысловом глаголе.
- Упражнения: exSort /s/ /z/ /ɪz/ ×14 (с озвучкой) · exStress «где ударение во фразе» — можно через exStress по словам фразы ×6.

Практика: опрос «учебные привычки» (8 вопросов с do / does, ответы вслух) + рассказать про друга с does.

## Урок 2.3 «Живой английский: просьбы, анкета, be или do» · `e02-3.html`
Темы: `en.02.3.1`, `en.02.3.2`, `en.02.3.3`.

**Тема 1. Попросить что-то и ответить**
- *Can I have…, please? / Could I have…? / Can I get… (US)*; ответы *Sure. / Here you are. / Of course. / Sorry, we don't have…*; *Anything else? — No, that's all, thanks.*; *How much is it? — It's…*.
- Вежливость: please обязательно, *I want…* звучит грубо, *Give me…* — тем более.
- Диалог в кафе и в офисе (`.dlg`, озвучка ролей, кнопка «Скрыть реплики B» — как в 1.3).
- Упражнения: exGap «что сказать в ситуации» ×6 · exBuild ×4.

**Тема 2. Заполнить анкету**
- Поля: *first name, surname / last name, date of birth, nationality, address, postcode, email, phone number, occupation, signature*. Даты: брит. 13/10/2026 = 13 October 2026, амер. 10/13/2026 — ловушка. Адрес: номер дома перед улицей.
- Правописание: заглавные (неделя 1), двойные буквы в частых словах (address, occupation, really), месяцы по буквам.
- **Лаборатория «Анкета»**: форма регистрации на курс; Влад заполняет своими данными, проверка подсказывает (заглавные, формат даты, email), и кнопка «Скопировать в Obsidian». Без отправки куда-либо, данные только в браузере.
- Упражнения: exGap правописание ×8 (exact) · exGap дата словами ×4.

**Тема 3. Повторение: be против do/does**
- Дерево решения: есть смысловой глагол? → do / does; нет → am / is / are. Таблица пар: *Are you a student? / Do you study? · Is he at work? / Does he work? · I'm not tired. / I don't sleep.*
- **Лаборатория «Двухкнопочный выбор»**: фраза с пропуском в начале, кнопки Am / Is / Are / Do / Does, быстро, 20 фраз, счёт и время — тренировка автоматизма.
- Упражнения: exSpot «ошибки недели» ×8 (смешанные be / do) · exBuild перевод ×6 · exGap смешанный ×10.

Практика: ролевая игра «первый день на стажировке» — знакомство, что ты делаешь, где учишься, вопросы коллеге.

## Тест недели 2 · `e02-test.html`
- 24 вопроса, `section: "en"`, `week: 2`. По урокам: 2.1 — 8, 2.2 — 8, 2.3 — 4, **повторение недели 1 — 4** (be, a/an, his/her, вопросы со словом) — привязать `lesson` к 3 или добавить в `lessons` строку «Повторение» с файлом `e01-3.html`.
- Типы: one ×9, many ×3, text ×8 (формы глаголов, вопросы целиком, перевод), на слух `say` ×4 (вопрос с do / does, диктовка даты, окончание -s).

## Слова в тренажёр (показать Владу, добавить после «да»)
Учёба и время из урока 2.2 (≈ 15) и фразы-связки работы из 2.1 (≈ 6). Профессии уже в словаре — не дублировать.

## После уроков
- Убрать `status` в `en_lessons.json`, `enplan.py build` (конспекты в `65_Английский/Уроки`).
- Прогнать в браузере каждое упражнение и тест (результат теста не сохранять), галочку темы — поставить и снять.
- Тесты, `lint`, журнал изменений, `system.py commit`, `apps.py publish`.
- В `Курс Empower A2.md` галочки 2B–2D не ставить — это для занятий с репетитором; уроки сайта отмечаются в плане.
