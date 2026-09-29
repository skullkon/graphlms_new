На этом этапе вы добавите поддержку ключевого слова `super` в свой интерпретатор Lox. Ключевое слово `super` позволяет методам вызывать переопределённые методы своего суперкласса.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 13.3: Вызов методов суперкласса](https://craftinginterpreters.com/inheritance.html#calling-superclass-methods).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, использующими ключевое слово `super`.

Например, если `test.lox` содержит следующее:

```
class Doughnut {
  cook() {
    print "Fry until golden brown.";
  }
}

// Super can be used to call the overridden method
// of the parent class
class BostonCream < Doughnut {
  cook() {
    super.cook();
  }
}

BostonCream().cook();
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
Fry until golden brown.
```

Тестирующая система выполнит несколько таких проверок с `super` в разных контекстах, например:

Тестовый случай 1:

Входные данные:
```
class Base {
  method() {
    print "Base.method()";
  }
}

class Parent < Base {
  method() {
    super.method();
  }
}

class Child < Parent {
  method() {
    super.method();
  }
}

var parent = Parent();
parent.method();
var child = Child();
child.method();
```

Ожидаемый вывод:
```
Base.method()
Base.method()
```

Тестирующая система проверит, что ваша программа корректно обрабатывает ключевое слово `super`, включая:
- Вызов методов суперкласса через несколько уровней наследования.
- Сохранение корректного разрешения методов в сложных цепочках наследования.
- Правильное связывание `super` в различных контекстах.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/super/call_other_method.lox#L1)