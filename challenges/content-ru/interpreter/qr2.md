На этом этапе вы добавите поддержку методов экземпляров в свой интерпретатор Lox. Методы — это функции, определённые внутри класса, которые можно вызывать для экземпляров этого класса.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 12.5: Методы классов](https://craftinginterpreters.com/classes.html#methods-on-classes).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими определения и вызовы методов.

Например, если `test.lox` содержит следующее:

```
class Robot {
  beep() {
    print "Beep boop!";
  }
}

var r2d2 = Robot();
r2d2.beep();

Robot().beep();
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
Beep boop!
Beep boop!
```

Тестирующая система выполнит несколько таких проверок с методами в разных контекстах, например:

Тестовый случай 1:

Входные данные:
```
{
  class Foo {
    returnSelf() {
      return Foo;
    }
  }

  print Foo().returnSelf();  // expect: Foo
}
```

Ожидаемый вывод:
```
Foo
```

Тестовый случай 2:

Входные данные:
```
class Wizard {
  castSpell(spell) {
    print "Casting a magical spell: " + spell;
  }
}

class Dragon {
  breatheFire(fire, intensity) {
    print "Breathing " + fire + " with intensity: "
    + intensity;
  }
}

// Methods on different class instances
var merlin = Wizard();
var smaug = Dragon();

// Conditional method calling
if (true) {
  var action = merlin.castSpell;
  action("Fireball");
} else {
  var action = smaug.breatheFire;
  action("Fire", "100");
}
```

Ожидаемый вывод:
```
Casting a magical spell: Fireball
```

Тестовый случай 3:

Входные данные:
```
class Superhero {
  useSpecialPower(hero) {
    print "Using power: " + hero.specialPower;
  }

  hasSpecialPower(hero) {
    return hero.specialPower;
  }

  giveSpecialPower(hero, power) {
    hero.specialPower = power;
  }
}

// Methods in functions
fun performHeroics(hero, superheroClass) {
  if (superheroClass.hasSpecialPower(hero)) {
    superheroClass.useSpecialPower(hero);
  } else {
    print "No special power available";
  }
}

var superman = Superhero();
var heroClass = Superhero();

if (true) {
  heroClass.giveSpecialPower(superman, "Flight");
} else {
  heroClass.giveSpecialPower(superman, "Strength");
}

performHeroics(superman, heroClass);
```

Ожидаемый вывод:
```
Using power: Flight
```

Тестирующая система проверит, что ваша программа корректно обрабатывает методы, включая:
- Определение методов внутри классов.
- Вызов методов для экземпляров.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/benchmark/method_call.lox)
- Методы определяются внутри тела класса
- Методы могут принимать параметры и возвращать значения
- Методы могут использоваться для изменения свойств экземпляра