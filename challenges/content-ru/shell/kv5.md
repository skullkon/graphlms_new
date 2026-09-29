На этом этапе вы добавите поддержку хранения и отображения переменных оболочки.

### Объявление переменных оболочки

С помощью `declare NAME=VALUE` оболочка сохраняет переменную и её значение. С помощью `declare -p NAME` оболочка выводит строку с описанием этой переменной. Вывод `declare -p NAME` имеет вид `declare -- NAME="VALUE"`.

Например:

```bash
$ declare foo=bar
$ declare -p foo
declare -- foo="bar"
```

### Проверки

Тестирующая система запустит вашу программу следующим образом:

```bash
$ ./your_program.sh
```

Затем система определит переменную с помощью `declare` и запросит её описание:

```bash
$ declare foo=bar
$ declare -p foo
declare -- foo="bar"
$ declare -p missing_variable
declare: missing_variable: not found
$ declare foo=bar2
$ declare -p foo
declare -- foo="bar2"
```

Тестирующая система проверит, что вывод соответствует ожидаемому формату для существующих и несуществующих переменных.
