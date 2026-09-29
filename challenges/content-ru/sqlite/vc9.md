Этот этап похож на предыдущий, но тестирующая система будет запрашивать несколько столбцов вместо одного.

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh sample.db "SELECT name, color FROM apples"
```

Ожидаемый вывод:

```
Granny Smith|Light Green
Fuji|Red
Honeycrisp|Blush Red
Golden Delicious|Yellow
```

Как и на предыдущем этапе, порядок строк не важен.
