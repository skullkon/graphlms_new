На этом этапе вы добавите поддержку наследования методов в свой интерпретатор Lox. Это позволит подклассам наследовать и использовать методы, определённые в суперклассе.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 13.2: Наследование методов](https://craftinginterpreters.com/inheritance.html#inheriting-methods).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими наследование методов.

Например, если `test.lox` содержит следующее:

```
class Doughnut {
  cook() {
    print "Fry until golden brown.";
  }
}

// BostonCream is a subclass of Doughnut
class BostonCream < Doughnut {}

// BostonCream class should inherit the cook
// method from Doughnut class
BostonCream().cook();
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
Fry until golden brown.
```

Тестирующая система выполнит несколько таких проверок с наследованием методов в разных контекстах, например:

Тестовый случай 1:

Входные данные:
```
class Root {
  getName() {
    print "Root class";
  }
}

class Parent < Root {
  parentMethod() {
    print "Method defined in Parent";
  }
}

class Child < Parent {
  childMethod() {
    print "Method defined in Child";
  }
}

var root = Root();
var parent = Parent();
var child = Child();

// Root methods are available to all
root.getName();
parent.getName();
child.getName();

// Parent methods are available to Parent and Child
parent.parentMethod();
child.parentMethod();

// Child methods are only available to Child
child.childMethod();
```

Ожидаемый вывод:
```
Root class
Root class
Root class
Method defined in Parent
Method defined in Parent
Method defined in Child
```

Тестирующая система проверит, что ваша программа корректно обрабатывает наследование методов, включая:
- Наследование методов через несколько уровней наследования.
- Наследование конструкторов от родительских классов.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/01e6f5b8f3e5dfa65674c2f9cf4700d73ab41cf8/test/class/inherited_method.lox)
- Методы должны наследоваться по всей цепочке наследования
- Унаследованные методы должны иметь доступ к свойствам экземпляра
- Конструкторы (методы init) также должны наследоваться