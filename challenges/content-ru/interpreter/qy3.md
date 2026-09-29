На этом этапе вы добавите поддержку инструкций `while` в свой интерпретатор. Инструкции `while` используются для многократного выполнения блока кода, пока условие истинно.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 9.4: Циклы while](https://craftinginterpreters.com/control-flow.html#while-loops).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с инструкциями `while`.

Например, если `test.lox` содержит следующее

```
var foo = 0;
while (foo < 3) print foo = foo + 1;
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
1
2
3
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
var foo = 0;
while (foo < 3) print foo = foo + 1;
```

Ожидаемый вывод:

```
1
2
3
```

Тестовый случай 2:

Входные данные:

```
var quz = 0;
while (quz < 3) {
  print quz;
  quz = quz + 1;
}
```

Ожидаемый вывод:

```
0
1
2
```

Тестовый случай 3:

Входные данные:

```
while (false) {
  print "should not print";
}

var product = 1;
var i = 1;

while (i <= 5) {
  product = product * i;
  i = i + 1;
}

print "Product of numbers 1 to 5: "; print product;
```

Ожидаемый вывод:

```
Product of numbers 1 to 5:
120
```

Тестовый случай 4:

Входные данные:

```
var n = 10;
var fm = 0;
var fn = 1;
var index = 0;

while (index < n) {
  print fm;
  var temp = fm;
  fm = fn;
  fn = temp + fn;
  index = index + 1;
}
```

Ожидаемый вывод:

```
0
1
1
2
3
5
8
13
21
34
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/while/syntax.lox)