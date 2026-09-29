На этом этапе вы добавите поддержку получения и установки свойств экземпляров классов. Свойства можно динамически добавлять к экземплярам после создания; они могут хранить значения любого типа.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 12.4: Свойства экземпляров](https://craftinginterpreters.com/classes.html#properties-on-instances).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими обращение к свойствам и их изменение.

Например, если `test.lox` содержит следующее:

```
// Basic property setting and getting
class Spaceship {}
var falcon = Spaceship();

falcon.name = "Millennium Falcon";
falcon.speed = 75.5;

print "Ship details:";
print falcon.name;
print falcon.speed;
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
Ship details:
Millennium Falcon
75.5
```

Тестирующая система выполнит несколько таких проверок с обращением к свойствам в разных контекстах, например:

Тестовый случай 1:

Входные данные:
```
// Multiple properties and conditional access
class Robot {}
var r2d2 = Robot();

r2d2.model = "Astromech";
r2d2.operational = false;

if (r2d2.operational) {
  print r2d2.model;
  r2d2.mission = "Navigate hyperspace";
  print r2d2.mission;
}
```

Ожидаемый вывод:
```
(No output because the condition is false)
```

Тестовый случай 2:

Входные данные:
```
// Multiple instances with properties
class Superhero {}
var batman = Superhero();
var superman = Superhero();

batman.name = "Batman";
batman.called = 18;

superman.name = "Superman";
superman.called = 66;

print "Times " + superman.name + " was called: ";
print superman.called;
print "Times " + batman.name + " was called: ";
print batman.called;
```

Ожидаемый вывод:
```
Times Superman was called:
66
Times Batman was called:
18
```

Тестовый случай 3:

Входные данные:
```
// Property manipulation in functions
class Wizard {}
var gandalf = Wizard();

gandalf.color = "Grey";
gandalf.power = nil;
print gandalf.color;

fun promote(wizard) {
  wizard.color = "White";
  if (true) {
    wizard.power = 100;
  } else {
    wizard.power = 0;
  }
}

promote(gandalf);
print gandalf.color;
print gandalf.power;
```

Ожидаемый вывод:
```
Grey
White
100
```

Тестирующая система проверит, что ваша программа корректно обрабатывает обращение к свойствам и их изменение, включая:
- Установку свойств со значениями разных типов.
- Чтение значений свойств.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/benchmark/binary_trees.lox)
- Свойства можно динамически добавлять к экземплярам в любой момент
- Свойства могут хранить любое допустимое значение Lox (строки, числа, nil и т. д.)
- Обращение к неопределённым свойствам должно приводить к ошибке времени выполнения