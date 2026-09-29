Первая задача интерпретатора — превратить исходный текст программы в токены (минимальные значимые единицы кода). На этом этапе вы обработаете простейшие входные данные: пустой файл .lox.

### Команда `tokenize`

Команда `tokenize` разбивает программу Lox на токены и выводит их в stdout. Мы будем использовать её для проверки
всех этапов главы [Лексический анализ](https://craftinginterpreters.com/scanning.html).

Если есть файл с именем `test.lox` и следующим содержимым:

```
var language = "lox";
```

Команда `tokenize` вернёт следующее:

```
$ ./your_program.sh tokenize test.lox
VAR var null
IDENTIFIER language null
EQUAL = null
STRING "lox" lox
SEMICOLON ; null
EOF  null
```

Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/tree/01e6f5b8f3e5dfa65674c2f9cf4700d73ab41cf8/test/scanning).

Каждая строка соответствует токену в файле (изображение из [раздела 4.2: Лексемы и токены](https://craftinginterpreters.com/scanning.html#lexemes-and-tokens)):

![изображение](https://craftinginterpreters.com/image/scanning/lexemes.png)

Формат каждой строки:

```
<token_type> <lexeme> <literal>
```

- `<token_type>`: тип токена.
  - Примеры: `VAR`, `IDENTIFIER`, `STRING`, `EOF` и т. д.
- `<lexeme>`: фактическая последовательность символов, образовавшая токен.
  - Примеры: `var`, `breakfast`, `"bagels"` и т. д.
  - Для токена `EOF` лексема — пустая строка.
- `<literal>`: значение литерала токена.
  - Для большинства токенов это `null`.
  - Для токенов `STRING`/`NUMBER` здесь хранится значение строки/числа.

Токен `EOF` — специальный токен, обозначающий конец файла. Все вызовы `tokenize` будут включать токен `EOF` в конце.

### Проверки

Тестирующая система создаст пустой файл `test.lox`. Затем она запустит вашу программу следующим образом:

```
$ ./your_program.sh tokenize test.lox
EOF  null
```

Поскольку файл пуст, в выводе ожидается только один токен: `EOF`. Тестирующая система проверит, что в stdout напечатано `EOF<space><space>null`.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/tree/01e6f5b8f3e5dfa65674c2f9cf4700d73ab41cf8/test/scanning)
- Между `EOF` и `null` находятся два пробела. Это связано с тем, что часть `<lexeme>` для токена `EOF` — пустая строка.
- На этом этапе лексическому анализатору достаточно обрабатывать только пустые файлы. На следующих этапах вы постепенно расширите его возможности.
