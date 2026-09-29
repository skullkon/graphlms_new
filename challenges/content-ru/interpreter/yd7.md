На этом этапе вы добавите поддержку ключевого слова `this` в свой интерпретатор Lox. Ключевое слово `this` позволяет методам обращаться к экземпляру, для которого они вызваны, обеспечивая полноценное объектно-ориентированное программирование.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 12.6: this](https://craftinginterpreters.com/classes.html#this).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, использующими ключевое слово `this` в различных контекстах.

Например, если `test.lox` содержит следующее:

```
class Spaceship {
  identify() {
    print this;
  }
}

Spaceship().identify();
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
Spaceship instance
```

Тестирующая система выполнит несколько таких проверок с `this` в разных контекстах, например:

Тестовый случай 1:

Входные данные:
```
class Calculator {
  add(a, b) {
    return a + b + this.memory;
  }
}

var calc = Calculator();
calc.memory = 82;
print calc.add(92, 1);
```

Ожидаемый вывод:
```
175
```

Тестовый случай 2:

Входные данные:
```
class Animal {
  makeSound() {
    print this.sound;
  }
  identify() {
    print this.species;
  }
}

var dog = Animal();
dog.sound = "Woof";
dog.species = "Dog";

var cat = Animal();
cat.sound = "Meow";
cat.species = "Cat";

// Swap methods between instances
cat.makeSound = dog.makeSound;
dog.identify = cat.identify;

cat.makeSound();
dog.identify();
```

Ожидаемый вывод:
```
Woof
Cat
```

Тестовый случай 3:

Входные данные:
```
class Wizard {
  getSpellCaster() {
    fun castSpell() {
      print this;
      print "Casting spell as " + this.name;
    }

    return castSpell;
  }
}

var wizard = Wizard();
wizard.name = "Merlin";
wizard.getSpellCaster()();
```

Ожидаемый вывод:
```
Wizard instance
Casting spell as Merlin
```

Тестирующая система проверит, что ваша программа корректно обрабатывает ключевое слово `this`, включая:
- Обращение к экземпляру в методах.
- Доступ к свойствам экземпляра через `this`.
- Сохранение правильной привязки `this` при передаче методов.

### Примечания

- При вызове метода `this` должен быть связан с экземпляром, для которого вызван метод
- Привязка `this` должна сохраняться даже при передаче методов как значений первого класса
- Форматы вывода на этом этапе соответствуют форматам в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/benchmark/binary_trees.lox)