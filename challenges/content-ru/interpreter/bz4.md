На этом этапе вы добавите поддержку глобальной и локальной областей видимости в свой интерпретатор Lox.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 10.6: Локальные функции и замыкания](https://craftinginterpreters.com/functions.html#local-functions-and-closures).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с глобальной и локальной областями видимости.

Например, если `test.lox` содержит следующее

```
var a = 38;

fun printAndModify() {
  print a;
  var a = 95;
  print a;
}

print a;
a = 68;
printAndModify();
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
38
68
95
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
var a = 38;

fun printAndModify() {
  print a;
  var a = 95;
  print a;
}

print a;
a = 68;
printAndModify();
```

Ожидаемый вывод:

```
38
68
95
```

Тестовый случай 2:

Входные данные:

```
var count = 3;

fun tick() {
  if (count > 0) {
    print count;
    count = count - 1;
    return false;
  }
  print "Blast off!";
  return true;
}

while (!tick()) {}
```

Ожидаемый вывод:

```
3
2
1
Blast off!
```

Тестовый случай 3:

Входные данные:

```
var counter = 89;

fun incrementCounter(amount) {
  counter = counter + amount;
  print counter;
}

{
  counter = 83;
  incrementCounter(6);
  print counter;
}
print counter;
```

Ожидаемый вывод:

```
89
89
89
```

Тестовый случай 4:

Входные данные:

```
var x = 1;
var y = 2;

fun printBoth() {
  if (x < y) {
    print "x is less than y:";
    print x;
    print y;
  } else {
    print "x is not less than y:";
    print x;
    print y;
  }
}

{
  var x = 10;
  {
    var y = 20;

    var i = 0;
    while (i < 3) {
      x = x + 1;
      y = y - 1;
      print "Local x: ";
      print x;
      print "Local y: ";
      print y;
      i = i + 1;
    }

    if (x > y) {
      print "Local x > y";
    }

    printBoth();
  }
}
```

Ожидаемый вывод:

```
Local x:
11
Local y:
19
Local x:
12
Local y:
18
Local x:
13
Local y:
17
x is less than y:
1
2
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/closure/open_closure_in_function.lox)