На этом этапе вы добавите поддержку переопределения методов в свой интерпретатор Lox. Это позволит подклассам предоставлять собственную реализацию методов, определённых в суперклассе.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 13.2: Наследование методов](https://craftinginterpreters.com/inheritance.html#inheriting-methods).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими переопределение методов.

Например, если `test.lox` содержит следующее:

```
class A {
  method() {
    print "A method";
  }
}

// B inherits method `method` from A
// and overrides it with a new implementation
class B < A {
  method() {
    print "B method";
  }
}

var b = B();
b.method();  // expect: B method
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
B method
```

Тестирующая система выполнит несколько таких проверок с переопределением методов в разных контекстах, например:

Тестовый случай 1:

Входные данные:
```
class Base {
  init(a) {
    this.a = a;
  }
}

// Constructors can also be overridden
class Derived < Base {
  init(a, b) {
    this.a = a;
    this.b = b;
  }
}

var derived = Derived(89, 32);
print derived.a;
print derived.b;
```

Ожидаемый вывод:
```
89
32
```

Тестовый случай 2:

Входные данные:
```
class Animal {
  speak() {
    return "Animal speaks";
  }

  makeSound() {
    return "Generic sound";
  }

  communicate() {
    return this.speak() + " : " + this.makeSound();
  }
}

class Dog < Animal {
  speak() {
    return "Dog speaks";
  }

  makeSound() {
    return "Woof";
  }
}

class Puppy < Dog {
  speak() {
    return "Puppy speaks";
  }
}

var animal = Animal();
var dog = Dog();
var puppy = Puppy();

print animal.communicate();
print dog.communicate();
print puppy.communicate();
```

Ожидаемый вывод:
```
Animal speaks : Generic sound
Dog speaks : Woof
Puppy speaks : Woof
```

Тестирующая система проверит, что ваша программа корректно обрабатывает переопределение методов, включая:
- Корректное переопределение методов в подклассах.
- Переопределение конструкторов с новыми сигнатурами.
- Корректную работу нескольких уровней переопределения методов.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/inheritance/inherit_methods.lox)
- Переопределённые методы должны полностью заменять реализацию суперкласса
- Переопределение методов должно работать через несколько уровней наследования