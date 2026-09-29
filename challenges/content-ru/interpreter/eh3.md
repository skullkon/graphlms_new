На этом этапе вы добавите поддержку обнаружения недопустимых инструкций возврата. Инструкции возврата разрешены только внутри тел функций и должны считаться ошибкой в коде верхнего уровня или в блоках вне функций.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 11.5.1: Ошибки недопустимого возврата](https://craftinginterpreters.com/resolving-and-binding.html#invalid-return-errors).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с инструкциями возврата в различных контекстах.

Например, если `test.lox` содержит следующее:

```
fun foo() {
  return "at function scope is ok";
}

return;
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
[line 6] Error at 'return': Can't return from top-level code.
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
fun foo() {
  if (true) {
    return "early return";
  }

  for (var i = 0; i < 10; i = i + 1) {
    return "loop return";
  }
}

if (true) {
  return "conditional return";
}
```

Ожидаемый вывод:

```
[line 12] Error at 'return': Can't return from top-level code.
```

Тестовый случай 2:

Входные данные:

```
{
  return "not allowed in a block either";
}

fun allowed() {
  if (true) {
    return "this is fine";
  }
  return;
}
```

Ожидаемый вывод:

```
[line 3] Error at 'return': Can't return from top-level code.
```

Тестовый случай 3:

Входные данные:

```
fun outer() {
  fun inner() {
    return "ok";
  }

  return "also ok";
}

if (true) {
  fun nested() {
    return;
  }

  return "not ok";
}
```

Ожидаемый вывод:

```
[line 15] Error at 'return': Can't return from top-level code.
```

Тестирующая система проверит, что инструкции возврата внутри функций успешно компилируются. Для инструкций возврата вне функций (в коде верхнего уровня или в блоках) программа должна завершиться с кодом 65 и вывести соответствующее сообщение об ошибке.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/return/at_top_level.lox)
- Ошибка должна обнаруживаться во время компиляции, а не выполнения
- Сообщения об ошибках следует выводить в stderr, но их точный текст не проверяется.