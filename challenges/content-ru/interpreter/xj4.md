На этом этапе вы добавите поддержку вложенных инструкций `if` в свой интерпретатор. Вложенные инструкции `if` — это инструкции `if`, находящиеся внутри тела другой инструкции `if`.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 9.2: Условное выполнение](https://craftinginterpreters.com/control-flow.html#conditional-execution).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с инструкциями `if`.

Например, если `test.lox` содержит следующее

```
if (true) if (true) print "nested true";
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
nested true
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
if (true) if (true) print "nested true";
```

Ожидаемый вывод:

```
nested true
```

Тестовый случай 2:

Входные данные:

```
if (true) {
  if (false) print "quz"; else print "quz";
}
```

Ожидаемый вывод:

```
quz
```

Тестовый случай 3:

Входные данные:

```
var stage = "unknown";
var age = 29;
if (age < 18) {
    if (age < 13) { stage = "child"; }
    else if (age < 16) { stage = "young teenager"; }
    else { stage = "teenager"; }
}
else if (age < 65) {
    if (age < 30) { stage = "young adult"; }
    else if (age < 50) { stage = "adult"; }
    else { stage = "middle-aged adult"; }
}
else { stage = "senior"; }
print stage;

var isAdult = age >= 18;
if (isAdult) {
    print "eligible for voting: true";
    if (age < 25) {
        print "first-time voter: likely";
    }
    else { print "first-time voter: unlikely"; }
}
else { print "eligible for voting: false"; }

if (age < 16) { print "eligible for driving: false"; }
else if (age < 18) {
    print "eligible for driving: learner's permit";
    if (age < 17) { print "supervised driving required"; }
    else { print "unsupervised driving allowed with restrictions"; }
}
else { print "eligible for driving: full license"; }

if (age < 21) { print "eligible for drinking (US): false"; }
else {
    print "eligible for drinking (US): true";
    if (age < 25) { print "remember: drink responsibly!"; }
}
```

Ожидаемый вывод:

```
young adult
eligible for voting: true
first-time voter: unlikely
eligible for driving: full license
eligible for drinking (US): true
```

Тестовый случай 4:

Входные данные:

```
if (true) if (false) print "world"; else print "baz";
```

Ожидаемый вывод:

```
baz
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/if/dangling_else.lox)