На этом этапе вы добавите поддержку областей видимости в свой интерпретатор. Области видимости создаются блоками и используются для группировки переменных. Мы проверим переменные в локальных и вложенных областях видимости, затенение переменных и доступ к переменным вне области их определения.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 8.5: Область видимости](https://craftinginterpreters.com/statements-and-state.html#scope).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими операцию присваивания.

Например, если `test.lox` содержит следующее

```
{
    var world = "before";
    {
        var world = "after";
        print world;
    }
    print world;
}
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
after
before
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
var baz = (91 * 16) - 61;
{
    var world = "quz" + "89";
    print world;
}
print baz;
```

Ожидаемый вывод:

```
quz89
1395
```

Тестовый случай 2:

Входные данные:

```
{
    var quz = "before";
    {
        var quz = "after";
        print quz;
    }
    print quz;
}
```

Ожидаемый вывод:

```
after
before
```

Тестовый случай 3:

Входные данные:

```
var bar = "global bar";
var world = "global world";
var hello = "global hello";
{
  var bar = "outer bar";
  var world = "outer world";
  {
    var bar = "inner bar";
    print bar;
    print world;
    print hello;
  }
  print bar;
  print world;
  print hello;
}
print bar;
print world;
print hello;
```

Ожидаемый вывод:

```
inner bar
outer world
global hello
outer bar
outer world
global hello
global bar
global world
global hello
```

Тестовый случай 4:

Входные данные:

```
{
  var hello = "outer hello";
  {
    var hello = "inner hello";
    print hello;
  }
  print hello;
}
print hello;
```

Ожидаемый вывод:

```
inner hello
outer hello
Undefined variable 'hello'.
[line 9]
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0. Обращение к переменной вне её области видимости должно вызывать ошибку времени выполнения; в этом случае код завершения должен быть 70.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/01e6f5b8f3e5dfa65674c2f9cf4700d73ab41cf8/test/string/literals.lox)