На этом этапе вы обработаете особое поведение возврата из конструкторов. В Lox для конструкторов (методов `init()`) действуют особые правила инструкций возврата: они могут содержать пустой возврат, но не могут возвращать значение.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 12.7: Конструкторы](https://craftinginterpreters.com/classes.html#constructors), а именно в частях об инструкциях возврата в инициализаторах.

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими инструкции возврата внутри конструкторов.

Например, если `test.lox` содержит следующее:

```
class Person {
  init() {
    print "world";
    return;
  }
}

Person();
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
world
```

Тестирующая система выполнит несколько таких проверок с различными вариантами возврата из конструкторов, например:

Тестовый случай 1:

Входные данные:
```
class ThingDefault {
  init() {
    this.x = "foo";
    this.y = 42;
    return this;
  }
}
var out = ThingDefault();
print out;
```

Ожидаемый вывод:
```
[line 5] Error at 'return': Can't return a value from an initializer.
```

Тестовый случай 2:

Входные данные:
```
class Foo {
  init() {
    return "something else";
  }
}

Foo();
```

Ожидаемый вывод:
```
[line 3] Error at 'return': Can't return a value from an initializer.
```

Тестовый случай 3:

Входные данные:
```
class Foo {
  init() {
    return this.callback();
  }

  callback() {
    return "callback";
  }
}

Foo();
```

Ожидаемый вывод:
```
[line 3] Error at 'return': Can't return a value from an initializer.
```

Тестирующая система проверит, что при корректном возврате код завершения равен 0. При некорректном возврате программа должна завершиться с кодом 65 (ошибка компиляции) и вывести соответствующее сообщение об ошибке.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/master/test/constructor/return_in_nested_function.lox)
- Сообщения об ошибках следует выводить в stderr, но их точный текст не проверяется.