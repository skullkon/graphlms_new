На этом этапе вы добавите поддержку инструмента `Write`.

### Инструмент `Write`

Инструмент `Write` позволяет LLM записывать содержимое в файлы. Как и для `Read`, нужно объявить `Write` в запросе и выполнять его по запросу модели.

Спецификация инструмента:

```js
{
  "type": "function",
  "function": {
    "name": "Write",
    "description": "Write content to a file",
    "parameters": {
      "type": "object",
      "required": ["file_path", "content"],
      "properties": {
        "file_path": {
          "type": "string",
          "description": "The path of the file to write to"
        },
        "content": {
          "type": "string",
          "description": "The content to write to the file"
        }
      }
    }
  }
}
```

### Выполнение инструмента `Write`

Когда модель запрашивает вызов `Write`:

1. Разберите аргументы и извлеките `file_path` и `content`.
2. Запишите содержимое в файл по указанному пути:
   - Если файла нет — создайте его.
   - Если файл существует — перезапишите новым содержимым.
3. Добавьте результат в историю как сообщение инструмента, аналогично `Read`.

### Проверки

Тестирующая система создаст:
- `README.md` с инструкциями;
- каталог `app/` для проекта.

Затем она запустит программу так:

```bash
$ ./your_program.sh -p "Read README.md and create the required file. File should have 1 line. Reply with 'Created the file'"
Created the file
```

Она проверит, что:
- Нужный файл создан с правильным содержимым.
- Программа завершается с кодом `0`.

### Примечания

- Можно выбрать любое разумное имя инструмента записи, например `Write`, `write`, `write_file` или `WriteFile`.
