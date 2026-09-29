На этом этапе вы добавите поддержку инструкции `else-if` в свой интерпретатор. Инструкция `else-if` используется для условного выполнения инструкций, когда условие `if` ложно.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 9.2: Условное выполнение](https://craftinginterpreters.com/control-flow.html#conditional-execution).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с инструкциями `if`.

Например, если `test.lox` содержит следующее

```
if (false) print "if branch"; else if (false) print "else-if branch";
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
if (true) print "if branch"; else if (false) print "else-if branch";
```

Ожидаемый вывод:

```
if branch
```

Тестовый случай 2:

Входные данные:

```
if (true) {
  print "hello";
} else if (true) print "hello";

if (true) print "hello"; else if (true) {
  print "hello";
}
```

Ожидаемый вывод:

```
hello
hello
```

Тестовый случай 3:

Входные данные:

```
var age = 88;
var stage = "unknown";
if (age < 18) { stage = "child"; }
else if (age >= 18) { stage = "adult"; }
else if (age >= 65) { stage = "senior"; }
else if (age >= 100) { stage = "centenarian"; }
print stage;
```

Ожидаемый вывод:

```
adult
```

Тестовый случай 4:

Входные данные:

```
var age = 67;

var isAdult = age >= 18;
if (isAdult) { print "eligible for voting: true"; }
else { print "eligible for voting: false"; }

if (age < 16) { print "eligible for driving: false"; }
else if (age < 18) { print "eligible for driving: learner's permit"; }
else { print "eligible for driving: full license"; }

if (age < 21) { print "eligible for drinking (US): false"; }
else { print "eligible for drinking (US): true"; }
```

Ожидаемый вывод:

```
eligible for voting: true
eligible for driving: full license
eligible for drinking (US): true
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/if/else.lox)