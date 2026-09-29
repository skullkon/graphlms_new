На этом этапе вы добавите поддержку инструкции `else` в свой интерпретатор. Инструкция `else` используется для условного выполнения инструкций, когда условие `if` ложно.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 9.2: Условное выполнение](https://craftinginterpreters.com/control-flow.html#conditional-execution).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с инструкциями `if`.

Например, если `test.lox` содержит следующее

```
if (true) print "if branch"; else print "else branch";
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
if branch
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
if (true) print "if branch"; else print "else branch";
```

Ожидаемый вывод:

```
if branch
```

Тестовый случай 2:

Входные данные:

```
var age = 21;
if (age > 18) print "adult"; else print "child";
```

Ожидаемый вывод:

```
adult
```

Тестовый случай 3:

Входные данные:

```
if (false) {
  print "if block";
} else print "else statement";

if (false) print "if statement"; else {
  print "else block";
}
```

Ожидаемый вывод:

```
else statement
else block
```

Тестовый случай 4:

Входные данные:

```
var celsius = 67;
var fahrenheit = 0;
var isHot = false;

{
  fahrenheit = celsius * 9 / 5 + 32;
  print celsius; print fahrenheit;

  if (celsius > 30) {
    isHot = true;
    print "It's a hot day. Stay hydrated!";
  } else {
    print "It's cold today. Wear a jacket!";
  }

  if (isHot) { print "Remember to use sunscreen!"; }
}
```

Ожидаемый вывод:

```
67
152.6
It's a hot day. Stay hydrated!
Remember to use sunscreen!
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/if/else.lox)