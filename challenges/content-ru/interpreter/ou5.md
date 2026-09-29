На этом этапе вы добавите поддержку конструкторов в свой интерпретатор Lox. В Lox конструктор — это метод с именем `init()`, который автоматически вызывается при создании экземпляра класса.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 12.7: Конструкторы и инициализаторы](https://craftinginterpreters.com/classes.html#constructors-and-initializers).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими определения и вызовы конструкторов.

Например, если `test.lox` содержит следующее:

```
class Default {
  init() {
    this.x = "bar";
    this.y = 91;
  }
}
print Default().x;
print Default().y;
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
bar
91
```

Тестирующая система выполнит несколько таких проверок с конструкторами в разных контекстах, например:

Тестовый случай 1:

Входные данные:
```
class Robot {
  init(model, function) {
    this.model = model;
    this.function = function;
  }
}
print Robot("R2-D2", "Astromech").model;
```

Ожидаемый вывод:
```
R2-D2
```

Тестовый случай 2:

Входные данные:
```
class Counter {
  init(startValue) {
    if (startValue < 0) {
      print "startValue can't be negative";
      this.count = 0;
    } else {
      this.count = startValue;
    }
  }
}

var instance = Counter(-52);
print instance.count;
print instance.init(52).count;
```

Ожидаемый вывод:
```
startValue can't be negative
0
52
```

Тестовый случай 3:

Входные данные:
```
class Vehicle {
  init(type) {
    this.type = type;
  }
}

class Car {
  init(make, model) {
    this.make = make;
    this.model = model;
    this.wheels = "four";
  }

  describe() {
    print this.make + " " + this.model +
    " with " + this.wheels + " wheels";
  }
}

var vehicle = Vehicle("Generic");
print "Generic " + vehicle.type;

var myCar = Car("Toyota", "Corolla");
myCar.describe();
```

Ожидаемый вывод:
```
Generic Generic
Toyota Corolla with four wheels
```

Тестирующая система проверит, что ваша программа корректно обрабатывает конструкторы, включая:
- Автоматический вызов метода `init()` при создании экземпляра класса.
- Корректную передачу аргументов конструктора.
- Установку свойств экземпляра в конструкторе.

### Примечания

- Метод `init()` можно вызывать явно, как и любой другой метод
- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/constructor/call_init_early_return.lox)