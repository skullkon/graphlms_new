На этом этапе вы добавите проверку ключевого слова `super`, чтобы оно использовалось только в допустимых контекстах. Для этого потребуется обнаруживать некорректное использование `super` и сообщать об ошибках.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 13.3: Вызов методов суперкласса](https://craftinginterpreters.com/inheritance.html#calling-superclass-methods), а именно в частях об обработке ошибок.

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими недопустимые использования `super`.

Например, если `test.lox` содержит следующее:

```
class Foo {
  cook() {
    // Foo is not a subclass
    super.cook(); // expect compile error
  }
}
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
[line 4] Error at 'super': Can't use 'super' in a class with no superclass.
```

Тестирующая система выполнит несколько проверок с недопустимым использованием `super`, например:

Тестовый случай 1:

Входные данные:
```
// super can't be used outside of a class
super.notEvenInAClass(); // expect compile error
```

Ожидаемый вывод:
```
[line 2] Error at 'super': Can't use 'super' outside of a class.
```

Тестовый случай 2:

Входные данные:
```
class A {}

class B < A {
  method() {
    // super must be followed by `.`
    // and an expression
    super; // expect compile error
  }
}
```

Ожидаемый вывод:
```
[line 7] Error at ';': Expect '.' after 'super'.
```

Тестирующая система проверит, что ваша программа корректно обнаруживает недопустимые использования `super` и сообщает о них подходящими сообщениями и кодами завершения. При недопустимом использовании `super` программа должна завершиться с кодом 65 (ошибка компиляции).

### Примечания

- Ключевое слово `super` должно использоваться только в подклассах.
- За ключевым словом `super` всегда должны следовать `.` и выражение.
- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/inheritance/inherit_from_function.lox)
- Сообщения об ошибках следует выводить в stderr, но их точный текст не проверяется.