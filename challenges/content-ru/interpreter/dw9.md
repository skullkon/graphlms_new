На этом этапе вы добавите поддержку повторного объявления переменных с помощью инструкции `var`.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 8.2: Глобальные переменные](https://craftinginterpreters.com/statements-and-state.html#global-variables).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими инструкцию `var`.

Например, если `test.lox` содержит следующее

```
var a = 1;
var a = 2;
print a;
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
2
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
var baz = "before";
print baz;
var baz = "after";
print baz;
```

Ожидаемый вывод:

```
before
after
```

Тестовый случай 2:

Входные данные:

```
var hello = "after";
var hello = "before";
var hello = hello;
print hello;
```

Ожидаемый вывод:

```
before
```

Тестовый случай 3:

Входные данные:

```
var world = 2;
print world;
var world = 3;
print world;
var hello = 5;
print hello;
var world = hello;
print world;
```

Ожидаемый вывод:

```
2
3
5
5
```

Тестовый случай 4:

Входные данные:

```
var baz = bar;
```

Ожидаемый вывод:

```
Undefined variable 'bar'.
[line 1]
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/01e6f5b8f3e5dfa65674c2f9cf4700d73ab41cf8/test/variable/in_nested_block.lox)