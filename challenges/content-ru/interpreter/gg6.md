На этом этапе вы добавите поддержку замыканий в свой интерпретатор Lox.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 10.6: Локальные функции и замыкания](https://craftinginterpreters.com/functions.html#local-functions-and-closures).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с замыканиями.

Например, если `test.lox` содержит следующее

```
fun makeCounter() {
  var i = 0;
  fun count() {
    i = i + 1;
    print i;
  }

  return count;
}

var counter = makeCounter();
counter();
counter();
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
1
2
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
fun makeCounter() {
  var i = 0;
  fun count() {
    i = i + 1;
    print i;
  }

  return count;
}

var counter = makeCounter();
counter();
counter();
```

Ожидаемый вывод:

```
1
2
```

Тестовый случай 2:

Входные данные:

```
{
  var threshold = 50;

  fun isEven(n) {
    if (n == 0) return true;
    if (n > threshold) return false;
    return isOdd(n - 1);
  }

  fun isOdd(n) {
    if (n == 0) return false;
    if (n > threshold) return false;
    return isEven(n - 1);
  }

  print isEven(61);
}
```

Ожидаемый вывод:

```
false
```

Тестовый случай 3:

Входные данные:

```
fun makeLogger(prefix) {
  var logCount = 0;

  fun log(message) {
    logCount = logCount + 1;
    print prefix + ": " + message;

    if (logCount > 6) {
      print prefix + ": Too many log lines!";
      logCount = 0;
    }
  }

  return log;
}

var debugLog = makeLogger("debug");
var errorLog = makeLogger("error");

debugLog("Starting");
debugLog("Processing");
debugLog("Finishing");
debugLog("Extra line");

errorLog("Failed!");
errorLog("Retrying...");
```

Ожидаемый вывод:

```
debug: Starting
debug: Processing
debug: Finishing
debug: Extra line
error: Failed!
error: Retrying...
```

Тестовый случай 4:

Входные данные:

```
fun makeAccumulator(label) {
  var sum = 0;
  var count = 0;

  fun accumulate(value) {
    sum = sum + value;
    count = count + 1;

    print label;
    print count;
    print sum;
    print sum;

    if (count > 3) {
      print "reset";
      sum = 0;
      count = 0;
    }

    return sum;
  }

  return accumulate;
}

var acc1 = makeAccumulator("First:");
var acc2 = makeAccumulator("Second:");

acc1(2);
acc1(6);
acc1(3);
acc1(4);

acc2(6);
acc2(4);
```

Ожидаемый вывод:

```
First:
1
2
2
First:
2
8
8
First:
3
11
11
First:
4
15
15
reset
Second:
1
6
6
Second:
2
10
10
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/closure/open_closure_in_function.lox)