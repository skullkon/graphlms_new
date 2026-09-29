На этом этапе вы добавите поддержку нативных функций в свой интерпретатор Lox.

Пока можно определить только одну нативную функцию: мы выберем `clock()`, которая возвращает число секунд, прошедших с полуночи 1 января 1970 года по UTC.

Возвращаемое значение `clock()` может быть числом с плавающей точкой или целым числом: тестирующая система приведёт его к целому и проверит, находится ли оно в разумных пределах.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 10.2: Нативные функции](https://craftinginterpreters.com/functions.html#native-functions).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с нативными функциями.

Например, если `test.lox` содержит следующее

```
print clock();
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
1731411035
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
print clock() + 75;
```

Ожидаемый вывод:

```
1731411035
```

Тестовый случай 2:

Входные данные:

```
print clock() / 1000;
```

Ожидаемый вывод:

```
1731410
```

Тестовый случай 3:

Входные данные:

```
var startTime = clock();
var timeoutSeconds = 2;

// Check if less than 2 seconds have elapsed
if ((clock() >= startTime) and (clock() <= (startTime + timeoutSeconds))) {
  print "Operation in progress...";
} else {
  print "Operation timed out!";
}
```

Ожидаемый вывод:

```
Operation in progress...
```

Тестовый случай 4:

Входные данные:

```
// Countdown from 3 seconds
var startTime = clock();
var totalDuration = 3; // 3 seconds countdown
var lastCheck = startTime;
var completed = false;

while (!completed) {
  var currentTime = clock();
  var elapsedTime = currentTime - startTime;
  var remainingTime = totalDuration - elapsedTime;

  // Update progress every second
  if (currentTime >= lastCheck + 1) {
    if (remainingTime >= 2) {
      print "Plenty of time remaining: ";
      print remainingTime;
    } else if (remainingTime >= 1) {
      print "Getting closer: ";
      print remainingTime;
    } else if (remainingTime > 0) {
      print "Almost there: ";
      print remainingTime;
    }
    lastCheck = currentTime;
  }

  // Check for completion
  if (elapsedTime >= totalDuration) {
    completed = true;
    print "Countdown complete!";
  } else if (elapsedTime < 0) {
    // Handle clock overflow or system time changes
    print "Time error detected!";
    completed = true;
  }
}
```

Ожидаемый вывод:

```
Plenty of time remaining:
2
Getting closer:
1
Countdown complete!
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/function/print.lox)