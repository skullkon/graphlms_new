На этом этапе вы добавите поддержку обнаружения недопустимой самоинициализации переменных. Это означает выявление случаев, когда переменная пытается использовать себя в собственном инициализаторе до того, как она полностью определена.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 11.5: Ошибки разрешения имён](https://craftinginterpreters.com/resolving-and-binding.html#resolution-errors).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с самоинициализацией переменных.

Например, если `test.lox` содержит следующее:

```
var a = "value";
var a = a;      // This is allowed in global scope
print a;        // Should print "value"
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
value
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
var a = "outer";
{
  var a = a;    // Error: Can't read local variable in its own initializer
}
```

Ожидаемый вывод:

```
[line 3] Error at 'a': Can't read local variable in its own initializer.
```

Тестовый случай 2:

Входные данные:

```
fun returnArg(arg) {
  return arg;
}

var b = "global";
{
  var a = "first";
  var b = returnArg(b);    // Error: Can't read local variable in its own initializer
  print b;
}

var b = b + " updated";
print b;
```

Ожидаемый вывод:

```
[line 8] Error at 'b': Can't read local variable in its own initializer.
```

Тестовый случай 3:

Входные данные:

```
fun outer() {
  var a = "outer";

  fun inner() {
    var a = a;    // Error: Can't read local variable in its own initializer
    print a;
  }

  inner();
}

outer();
```

Ожидаемый вывод:

```
[line 5] Error at 'a': Can't read local variable in its own initializer.
```

Тестирующая система проверит, что при допустимой глобальной самоинициализации код завершения равен 0. При недопустимой локальной самоинициализации программа должна завершиться с кодом 65 и вывести соответствующее сообщение об ошибке.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/variable/use_local_in_initializer.lox)
- Самоинициализация разрешена в глобальной области видимости, но не в локальных
- Ошибка должна обнаруживаться во время компиляции, а не выполнения
- Сообщения об ошибках следует выводить в stderr, но их точный текст не проверяется.