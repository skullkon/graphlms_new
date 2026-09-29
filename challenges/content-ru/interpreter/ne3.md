На этом этапе вы добавите поддержку инструкции `if` в свой интерпретатор. Инструкция `if` используется для условного выполнения инструкций на основе логического условия.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 9.2: Условное выполнение](https://craftinginterpreters.com/control-flow.html#conditional-execution).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с инструкциями `if`.

Например, если `test.lox` содержит следующее

```
if (true) print "good";
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
good
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
if (true) print "bar";
```

Ожидаемый вывод:

```
bar
```

Тестовый случай 2:

Входные данные:

```
if (true) {
  print "block body";
}
```

Ожидаемый вывод:

```
block body
```

Тестовый случай 3:

Входные данные:

```
var a = false;
if (a = true) {
  print (a == true);
}
```

Ожидаемый вывод:

```
true
```

Тестовый случай 4:

Входные данные:

```
var stage = "unknown";
var age = 50;
if (age < 18) { stage = "child"; }
if (age >= 18) { stage = "adult"; }
print stage;

var isAdult = age >= 18;
if (isAdult) { print "eligible for voting: true"; }
if (!isAdult) { print "eligible for voting: false"; }
```

Ожидаемый вывод:

```
adult
eligible for voting: true
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/if/if.lox)