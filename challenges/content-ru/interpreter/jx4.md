На этом этапе вы добавите поддержку оператора логического И в свой интерпретатор. Оператор логического И объединяет два условия и возвращает первое ложное значение. Если все значения истинные, он возвращает последнее значение.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 9.3: Логические операторы](https://craftinginterpreters.com/control-flow.html#logical-operators).

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими программы с оператором логического И.

Например, если `test.lox` содержит следующее

```
print false and "ok";
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
false
```

Тестирующая система выполнит несколько таких проверок со случайными выражениями, например:

Тестовый случай 1:

Входные данные:

```
if (false and "bad") print "foo";
if (nil and "bad") print "foo";

if (true and "hello") print "hello";
if (97 and "baz") print "baz";
if ("baz" and "baz") print "baz";
if ("" and "bar") print "bar";
```

Ожидаемый вывод:

```
hello
baz
baz
bar
```

Тестовый случай 2:

Входные данные:

```
print false and 1;
print true and 1;
print 23 and "hello" and false;

print 23 and true;
print 23 and "hello" and 23;
```

Ожидаемый вывод:

```
false
1
false
true
23
```

Тестовый случай 3:

Входные данные:

```
var a = "quz";
var b = "quz";
(a = true) and (b = false) and (a = "bad");
print a;
print b;
```

Ожидаемый вывод:

```
true
false
```

Тестовый случай 4:

Входные данные:

```
var stage = "unknown";
var age = 14;
if (age < 18) { stage = "child"; }
if (age >= 18) { stage = "adult"; }
print stage;

var isAdult = age >= 18;
if (isAdult) { print "eligible for voting: true"; }
if (!isAdult) { print "eligible for voting: false"; }
```

Ожидаемый вывод:

```
child
eligible for voting: false
```

Тестирующая система проверит, что stdout вашей программы соответствует приведённому выше формату, а код завершения равен 0.

### Примечания

- Этот формат вывода соответствует спецификации в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/logical_operator/and.lox)