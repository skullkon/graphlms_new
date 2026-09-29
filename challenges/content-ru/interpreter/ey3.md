На этом этапе вы добавите поддержку функций высшего порядка в свой интерпретатор Lox.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 10.6: Локальные функции и замыкания](https://craftinginterpreters.com/functions.html#local-functions-and-closures).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с функциями высшего порядка.

Например, если `test.lox` содержит следующее

```
fun makeGreeter() {
  fun greet(name) {
    print "Hello " + name;
  }
  return greet;
}

var sayHello = makeGreeter();
sayHello("Bob");
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
Hello Bob
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
fun makeGreeter() {
  fun greet(name) {
    print "Hello " + name;
  }
  return greet;
}

var sayHello = makeGreeter();
sayHello("Bob");
```

Ожидаемый вывод:

```
Hello Bob
```

Тестовый случай 2:

Входные данные:

```
fun returnArg(arg) {
  return arg;
}

fun returnFunCallWithArg(func, arg) {
  return returnArg(func)(arg);
}

fun printArg(arg) {
  print arg;
}

returnFunCallWithArg(printArg, "foo");
```

Ожидаемый вывод:

```
foo
```

Тестовый случай 3:

Входные данные:

```
fun square(x) {
  return x * x;
}

// This higher-order function applies a
// function N times to a starting value x.
fun applyTimesN(N, f, x) {
  var i = 0;
  while (i < N) {
    x = f(x);
    i = i + 1;
  }
  return x;
}

// 6 is squared once
print applyTimesN(1, square, 6);
// 6 is squared twice
print applyTimesN(2, square, 6);
// 6 is squared thrice
print applyTimesN(3, square, 6);
```

Ожидаемый вывод:

```
36
1296
1679616
```

Тестовый случай 4:

Входные данные:

```
fun makeFilter() {
  fun filter(n) {
    if (n < 42) {
      return false;
    }
    return true;
  }
  return filter;
}

// This function applies a function to a list of numbers
fun applyToNumbers(f, count) {
  var n = 0;
  while (n < count) {
    if (f(n)) {
      print n;
    }
    n = n + 1;
  }
}

var greaterThanX = makeFilter();

print "Numbers >= 42:";
applyToNumbers(greaterThanX, 42 + 5);
```

Ожидаемый вывод:

```
Numbers >= 42:
42
43
44
45
46
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/function/local_recursion.lox)
