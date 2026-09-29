На этом этапе вы добавите поддержку наследования классов в свой интерпретатор Lox. Это позволит пользователям определять иерархии классов, указывая суперкласс с помощью оператора `<`.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 13.1: Суперклассы и подклассы](https://craftinginterpreters.com/inheritance.html#superclasses-and-subclasses).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими объявления наследования классов.

Например, если `test.lox` содержит следующее:

```
class Doughnut {}

class BostonCream < Doughnut {}

print Doughnut();
print BostonCream();
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
Doughnut instance
BostonCream instance
```

Тестирующая система выполнит несколько таких проверок с наследованием в разных контекстах, например:

Тестовый случай 1:

Входные данные:
```
{
  class A {}

  // B is a subclass of A
  class B < A {}

  // C is also a subclass of A
  class C < A {}

  print A();
  print B();
  print C();
}
```

Ожидаемый вывод:
```
A instance
B instance
C instance
```

Тестовый случай 2:

Входные данные:
```
class Vehicle {}

// Car is a subclass of Vehicle
class Car < Vehicle {}

// Sedan is a subclass of Car
class Sedan < Car {}

print Vehicle();
print Car();
print Sedan();

{
  // Truck is a subclass of Vehicle
  class Truck < Vehicle {}
  print Truck();
}
```

Ожидаемый вывод:
```
Vehicle instance
Car instance
Sedan instance
Truck instance
```

Тестирующая система проверит, что ваша программа корректно обрабатывает объявления наследования классов и использует для вывода экземпляров те же правила, что и для обычных классов.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/01e6f5b8f3e5dfa65674c2f9cf4700d73ab41cf8/test/class/local_inherit_other.lox)
- Подклассы должны выводить свои экземпляры в том же формате, что и обычные классы
- Объявления наследования должны работать в любой области видимости, где допустимы объявления классов