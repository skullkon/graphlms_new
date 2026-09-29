На этом этапе вы реализуете клонирование публичного репозитория с GitHub.

Это последний этап задания и, вероятно, самый сложный во всём CodeCrafters!

В будущем мы, возможно, разделим его на расширение с несколькими этапами, но пока это один большой этап.

Подробных инструкций здесь нет, поэтому вам предстоит разобраться самостоятельно. Несколько подсказок для начала:

- В [этом сообщении на форуме](https://forum.codecrafters.io/t/step-for-git-clone-implementing-the-git-protocol/4407) есть рекомендации по поэтапной реализации.
- Вам понадобится [протокол передачи Smart HTTP](https://www.git-scm.com/docs/http-protocol) Git.
- Для изучения формата протокола рекомендуем:
  - [gitprotocol-pack](https://git-scm.com/docs/gitprotocol-pack)
  - [gitformat-pack](https://git-scm.com/docs/gitformat-pack)
  - [Unpacking Git packfiles](https://codewords.recurse.com/issues/three/unpacking-git-packfiles)
  - [Sneaky git number encoding](https://medium.com/@concertdaw/sneaky-git-number-encoding-ddcc5db5329f)

### Тесты

Тестирующая система запустит вашу программу следующим образом:

```bash
$ /path/to/your_program.sh clone https://github.com/blah/blah <some_dir>
```

Программа должна создать `<some_dir>` и клонировать в него указанный репозиторий.

Для проверки тестирующая система:

- Проверит содержимое случайного файла.
- Прочитает атрибуты объекта коммита из каталога `.git`.
