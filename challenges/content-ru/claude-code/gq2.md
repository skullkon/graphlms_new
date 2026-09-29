На этом этапе вы добавите самостоятельный выбор навыка моделью.

### Навыки, вызываемые моделью

До сих пор каждый навык запускался вводом `/name` пользователем. Теперь [агент будет решать сам](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill), когда вызвать навык.

Пользователь описывает задачу обычным языком, модель сопоставляет её с описаниями в контексте и загружает подходящий навык.

Описания уже доступны с предыдущих этапов. Не хватает способа запросить основной текст навыка.

### Как дать модели доступ

Инструмент `Skill` позволяет LLM вызвать навык. Как и для инструментов `Read`, `Write` и `Bash`, нужно объявить `Skill` в запросе и выполнять его по запросу модели.

Спецификация инструмента:

```json
{
    "type": "function",
    "function": {
      "name": "Skill",
      "description": "Load a skill's instructions into the conversation",
      "parameters": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": { "type": "string", "description": "The name of the skill to use" },
          "args": { "type": "string", "description": "Optional arguments for the skill" }
        }
      }
    }
  }
```

Добавив его в список инструментов, обновите системный запрос, чтобы он указывал на этот инструмент:

```
You have access to the following skills:

- apple: Use this skill when the user asks for the database migration status.
- grape: Use this skill when the user asks to format source code.

If a skill matches the user's request, call the Skill tool with its name
and follow the instructions it returns.
```

Программа ищет имя среди обнаруженных навыков и возвращает основной текст найденного навыка как результат инструмента.

```bash
$ ./your_program.sh -p "What is the database migration status?"
```

Модель сопоставляет запрос с описанием `apple`, вызывает инструмент `Skill` с `"apple"` и выполняет полученные инструкции.

Обратите внимание: описания объясняют, **когда** использовать навык, а не только что он делает. Описание «Утилиты для базы данных» для навыка `apple` не даёт модели оснований сопоставить его с запросом.

### Проверки

Тестирующая система создаст два навыка с явно различающимися описаниями, затем отправит запрос, подходящий ровно одному из них, не называя его:

```bash
$ ./your_program.sh -p "What is the database migration status?"
blueberry
```

Она проверит, что:

- Программа выводит слово из основного текста подходящего навыка.
- Программа завершается с кодом `0`.

### Примечания

- Второй навык — отвлекающий: его описание не подходит к запросу, а основной текст содержит другое слово. Загрузка обоих навыков приведёт к провалу проверки.
