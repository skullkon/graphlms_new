На этом этапе вы добавите поддержку объявления, определения и интерпретации пользовательских функций с аргументами в свой интерпретатор Lox.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 10.3: Объявления функций](https://craftinginterpreters.com/functions.html#function-declarations).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с пользовательскими функциями с аргументами.

Например, если `test.lox` содержит следующее

```
fun foo(a) { print a; }
foo(10);
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
10
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
fun f1(a) {
  print a;
}
f1(76);
```

Ожидаемый вывод:

```
76
```

Тестовый случай 2:

Входные данные:

```
fun f3(a, b, c) { print a + b + c; }
f3(24, 24, 24);
```

Ожидаемый вывод:

```
72
```

Тестовый случай 3:

Входные данные:

```
fun f8(a, b, c, d, e, f, g, h) { print a - b + c * d + e - f + g - h; }
f8(51, 51, 51, 51, 51, 51, 51, 51);
```

Ожидаемый вывод:

```
2601
```

Тестовый случай 4:

Входные данные:

```
fun calculateGrade(score, bonus) {
  var finalScore = score + bonus;

  if (finalScore >= 90) {
    print "A";
  } else if (finalScore >= 80) {
    print "B";
  } else if (finalScore >= 70) {
    print "C";
  } else if (finalScore >= 60) {
    print "D";
  } else {
    print "F";
  }
}

var score = 81;
var bonus = 3;
print "Grade for given score is: ";
calculateGrade(score, bonus);
```

Ожидаемый вывод:

```
Grade for given score is:
B
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/function/parameters.lox)