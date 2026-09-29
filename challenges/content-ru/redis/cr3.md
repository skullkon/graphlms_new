На этом этапе вы добавите вычисление числовой оценки местоположения.

### Оценки местоположений

Чтобы хранить местоположения в упорядоченном множестве, Redis преобразует широту и долготу в одно числовое значение — score.

Авторы курса подготовили [репозиторий GitHub](https://github.com/codecrafters-io/redis-geocoding-algorithm), объясняющий это преобразование. В нём есть:

- Описание алгоритма и псевдокод.
- Примеры кода на нескольких языках.
- Набор местоположений и оценок для проверки.

Вот [ссылка на репозиторий](https://github.com/codecrafters-io/redis-geocoding-algorithm).

### Проверки

Тестирующая система запустит программу так:

```bash
$ ./your_program.sh
```

Затем отправит несколько команд `GEOADD`:

```bash
$ redis-cli GEOADD places 2.2944692 48.8584625 Paris
# Expect: (integer) 1
$ redis-cli GEOADD places -0.127758 51.507351 London
# Expect: (integer) 1
```

Правильность вычисленных оценок будет проверена несколькими командами `ZSCORE`:

```bash
$ redis-cli ZSCORE places Paris
# Expecting bulk string: "3663832614298053"
```

Вычисленные оценки должны совпадать с ожидаемыми значениями из [этого репозитория](https://github.com/codecrafters-io/redis-geocoding-algorithm).
