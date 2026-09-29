На этом этапе вы добавите поддержку объявлений классов в свой интерпретатор Lox. Это позволит пользователям определять классы с помощью ключевого слова `class`, чтобы затем создавать и использовать их экземпляры.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 12.2: Объявления классов](https://craftinginterpreters.com/classes.html#class-declarations).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими объявления классов в различных контекстах.

Например, если `test.lox` содержит следующее:

```
class Spaceship {}
print Spaceship;
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
Spaceship
```

Тестирующая система выполнит несколько таких проверок с объявлениями классов в разных контекстах, например:

Тестовый случай 1:

Входные данные:

```
// Multiple class declarations with empty body
class Robot {}
class Wizard {}
print Robot;
print Wizard;
print "Both classes successfully printed";
```

Ожидаемый вывод:

```
Robot
Wizard
Both classes successfully printed
```

Тестовый случай 2:

Входные данные:

```
{
  // Class declaration inside blocks should work
  class Dinosaur {}
  print "Inside block: Dinosaur exists";
  print Dinosaur;
}
print "Accessing out-of-scope class:";
print Dinosaur; // expect runtime error
```

Ожидаемый вывод:

```
Inside block: Dinosaur exists
Dinosaur
Accessing out-of-scope class:
Undefined variable 'Dinosaur'.
[line 8]
```

Тестовый случай 3:

Входные данные:

```
// Class declaration inside function should work
fun foo() {
  class Superhero {}
  print "Class declared inside function";
  print Superhero;
}

foo();
print "Function called successfully";
```

Ожидаемый вывод:

```
Class declared inside function
Superhero
Function called successfully
```

Тестирующая система проверит, что ваша программа корректно обрабатывает объявления классов и соблюдает правила их областей видимости.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/class/empty.lox)
- Для классов должны действовать те же правила областей видимости, что и для переменных
- При выводе класса должно отображаться его имя
- На этом этапе тестирующая система не проверяет точный текст ошибки, а только завершение программы с кодом 70.