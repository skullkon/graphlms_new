На этом этапе вы добавите поддержку навыков, содержащих исполняемый скрипт.

### Третий уровень загрузки

Папка навыка может содержать не только `SKILL.md`. В [стандарте Agent Skills](https://agentskills.io/specification#optional-directories) приняты три подкаталога:

- `scripts/` — исполняемый код;
- `references/` — документация, которую модель читает по необходимости;
- `assets/` — шаблоны и данные.

Все три относятся к третьему уровню загрузки: модель загружает их только по указанию основного текста. На этом этапе рассматривается `scripts/`.

Именно это превращает навыки в нечто большее, чем сохранённые запросы. Основной текст из двух строк может ссылаться на скрипт из двухсот строк; до запуска ни скрипт, ни его вывод не занимают контекст.

Навык со скриптом выглядит так:

```
.claude/
└── skills/
    └── apple/
        ├── SKILL.md
        ├── data.txt
        └── scripts/
            └── checksum.sh
```

### Ссылка на скрипт

Навык не должен жёстко задавать собственное расположение: он может быть установлен в проекте, домашнем каталоге пользователя или где-либо ещё. Поэтому основной текст ссылается на свои файлы через [пути относительно папки навыка](https://agentskills.io/specification#file-references):

```markdown
---
name: apple
description: Reports the checksum of the project data file.
---

Run `scripts/checksum.sh` using the Bash tool.

Respond with only the value it prints, and nothing else.
```

Сам по себе этот путь никуда не ведёт: программа работает из корня проекта, а скрипт находится в `.claude/skills/apple/scripts/checksum.sh`.

Программа уже загружает основной текст навыка в `messages` при вызове пользователем. Теперь нужно сообщить модели, что путь следует понимать относительно папки навыка. Один из способов — указать эту папку рядом с инструкциями:

```
Skill: apple (located at .claude/skills/apple)
Paths in the instructions below are relative to that folder.

Run `scripts/checksum.sh` using the Bash tool.

Respond with only the value it prints, and nothing else.
```

Тогда массив `messages` при вызове `/apple` будет таким:

```js
[
  { "role": "system", "content": "You have access to the following skills:\n\n- apple: ..." },
  { "role": "user", "content": "Skill: apple (located at .claude/skills/apple)\nPaths in the instructions below are relative to that folder.\n\nRun `scripts/checksum.sh` using the Bash tool.\n\nRespond with only the value it prints, and nothing else." }
]
```

Теперь у модели есть обе части: папка из вашего сообщения и относительный путь из основного текста. Модель объединяет их и вызывает инструмент `Bash`, созданный на базовых этапах, с путём `.claude/skills/apple/scripts/checksum.sh`. Цикл агента возвращает вывод модели, чтобы она сообщила результат.

### Проверки

Тестирующая система создаст файл со случайным содержимым в папке навыка.

```bash
$ cat .claude/skills/apple/scripts/checksum.sh
#!/usr/bin/env bash
cd "$(dirname "$0")/.." && sha256sum data.txt | cut -c1-8
```

Затем вызовет навык:

```bash
$ ./your_program.sh -p "/apple"
9f2b4c1a
```

Она проверит, что:

- Программа выводит восьмисимвольную контрольную сумму созданного файла.

### Примечания

- Здесь достаточно пути относительно проекта, например `.claude/skills/apple`, поскольку инструмент `Bash` работает из корня проекта.
- Навыки также могут [содержать](https://agentskills.io/specification#optional-directories) `references/` и `assets/` рядом с `scripts/`. Основной текст ссылается на них так же, но в этом расширении мы их не рассматриваем.
