На этом этапе вы добавите поддержку экземпляров классов в свой интерпретатор Lox. Это позволит пользователям создавать экземпляры, указывая имя класса с круглыми скобками после него, например `ClassName()`.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 12.3: Создание экземпляров](https://craftinginterpreters.com/classes.html#creating-instances).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими создание экземпляров классов в различных контекстах.

Например, если `test.lox` содержит следующее:

```
class Spaceship {}
var falcon = Spaceship();
print falcon;
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
Spaceship instance
```

Тестирующая система выполнит несколько таких проверок с созданием экземпляров классов в разных контекстах, например:

Тестовый случай 1:

Входные данные:

```
// Creating multiple instances of the same class
class Robot {}
var r1 = Robot();
var r2 = Robot();

print "Created multiple robots:";
print r1;
print r2;
```

Ожидаемый вывод:

```
Created multiple robots:
Robot instance
Robot instance
```

Тестовый случай 2:

Входные данные:

```
class Wizard {}
class Dragon {}

// Instantiating classes in a function should work
fun createCharacters() {
  var merlin = Wizard();
  var smaug = Dragon();
  print "Characters created in fantasy world:";
  print merlin;
  print smaug;
  return merlin;
}

var mainCharacter = createCharacters();
// An instance of a class should be truthy
if (mainCharacter) {
  print "The main character is:";
  print mainCharacter;
} else {
  print "Failed to create a main character.";
}
```

Ожидаемый вывод:

```
Characters created in fantasy world:
Wizard instance
Dragon instance
The main character is:
Wizard instance
```

Тестовый случай 3:

Входные данные:

```
class Superhero {}

var count = 0;
while (count < 3) {
  var hero = Superhero();
  print "Hero created:";
  print hero;
  count = count + 1;
}

print "All heroes created!";
```

Ожидаемый вывод:

```
Hero created:
Superhero instance
Hero created:
Superhero instance
Hero created:
Superhero instance
All heroes created!
```

Тестирующая система проверит, что ваша программа корректно обрабатывает создание экземпляров классов и что экземпляры выводятся в формате "ClassName instance".

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/call/object.lox)
- Экземпляры классов должны считаться истинными при использовании в условных выражениях
- При выводе экземпляра должно отображаться имя его класса, за которым следует слово "instance"