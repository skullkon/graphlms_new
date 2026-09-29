На этом этапе вы добавите проверку ключевого слова `this`, чтобы оно использовалось только в допустимых контекстах. Для этого потребуется обнаруживать некорректное использование `this` и сообщать об ошибках.

### Ссылка на книгу

Код для этого этапа реализован в [разделе 12.6: Ключевое слово 'this'](https://craftinginterpreters.com/classes.html#the-this-keyword), а именно в частях об обработке ошибок.

### Проверки

Тестирующая система выполнит серию проверок с файлами `test.lox`, содержащими недопустимые использования `this`.

Например, если `test.lox` содержит следующее:

```
print this;
```

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh run test.lox
[line 1] Error at 'this': Can't use 'this' outside of a class.
```

Тестирующая система выполнит несколько проверок с недопустимым использованием `this`, например:

Тестовый случай 1:

Входные данные:
```
fun notAMethod() {
  print this;
}
```

Ожидаемый вывод:
```
[line 2] Error at 'this': Can't use 'this' outside of a class.
```

Тестовый случай 2:

Входные данные:
```
class Person {
  sayName() {
    print this();
  }
}
Person().sayName();
```

Ожидаемый вывод:
```
Can only call functions and classes.
[line 3]
```

Тестовый случай 3:

Входные данные:
```
class Confused {
  method() {
    fun inner(instance) {
      var feeling = "confused";
      print this.feeling;
    }
    return inner;
  }
}

var instance = Confused();
var m = instance.method();
m(instance);
```

Ожидаемый вывод:
```
Undefined property 'feeling'.
[line 5]
```

Тестирующая система проверит, что при корректном использовании this код завершения равен 0. При ошибках компиляции программа должна завершиться с кодом 65. При ошибках времени выполнения программа должна завершиться с кодом 70. В обоих случаях следует вывести соответствующее сообщение об ошибке.

### Примечания

- Эти форматы ошибок соответствуют форматам в [репозитории книги](https://github.com/munificent/craftinginterpreters/blob/4a840f70f69c6ddd17cfef4f6964f8e1bcd8c3d4/test/this/this_in_top_level_function.lox)
- Сообщения об ошибках следует выводить в stderr, но их точный текст не проверяется.