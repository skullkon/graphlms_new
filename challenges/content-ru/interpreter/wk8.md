На этом этапе вы добавите поддержку оператора логического ИЛИ в свой интерпретатор. Оператор логического ИЛИ объединяет два условия и возвращает первое истинное значение.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 9.3: Логические операторы](https://craftinginterpreters.com/control-flow.html#logical-operators).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с оператором логического ИЛИ.

Например, если `test.lox` содержит следующее

```
print nil or "ok";
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
ok
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
if (false or "ok") print "baz";
if (nil or "ok") print "baz";

if (false or false) print "world";
if (true or "world") print "world";

if (24 or "bar") print "bar";
if ("bar" or "bar") print "bar";
```

Ожидаемый вывод:

```
baz
baz
world
bar
bar
```

Тестовый случай 2:

Входные данные:

```
print 41 or true;
print false or 41;
print false or false or true;

print false or false;
print false or false or false;
print true or true or true or true;
```

Ожидаемый вывод:

```
41
41
true
false
false
true
```

Тестовый случай 3:

Входные данные:

```
var a = "hello";
var b = "hello";
(a = false) or (b = true) or (a = "hello");
print a;
print b;
```

Ожидаемый вывод:

```
false
true
```

Тестовый случай 4:

Входные данные:

```
var stage = "unknown";
var age = 23;
if (age < 18) { stage = "child"; }
if (age >= 18) { stage = "adult"; }
print stage;

var isAdult = age >= 18;
if (isAdult) { print "eligible for voting: true"; }
if (!isAdult) { print "eligible for voting: false"; }
```

Ожидаемый вывод:

```
adult
eligible for voting: true
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/logical_operator/or.lox)