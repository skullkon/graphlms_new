Добро пожаловать в расширение «Magnet-ссылки BitTorrent»! В нём вы добавите поддержку скачивания файлов по magnet-ссылкам.

На этом этапе вы разберёте magnet-ссылку и выведете информационный хеш и URL трекера.

### Magnet-ссылки

[Magnet-ссылки](https://www.bittorrent.org/beps/bep_0009.html) позволяют скачивать файлы у пиров без торрент-файла.

Пример magnet-ссылки:
```
magnet:?xt=urn:btih:ad42ce8109f54c99613ce38f9b4d87e70f24a165&dn=magnet1.gif&tr=http%3A%2F%2Fbittorrent-test-tracker.codecrafters.io%2Fannounce
```

В отличие от файлов .torrent, magnet-ссылки не содержат длину файла, длину фрагмента и хеши фрагментов. В них есть только минимум информации для поиска пиров. Остальные сведения клиент может запросить у пиров через [протокол обмена метаданными](https://www.bittorrent.org/beps/bep_0009.html#metadata-exchange). Вы реализуете это на следующих этапах.

Параметры запроса в magnet-ссылке:

- `xt`: `urn:btih:`, за которым следует информационный хеш в виде 40-символьной шестнадцатеричной строки (пример: `urn:btih:ad42ce8109f54c99613ce38f9b4d87e70f24a165`).
- `dn`: имя скачиваемого файла (пример: `magnet1.gif`).
- `tr`: URL трекера (пример: `http://bittorrent-test-tracker.codecrafters.io/announce`).

Подробнее о формате magnet-ссылок — в [этой статье Википедии](https://en.wikipedia.org/wiki/Magnet_URI_scheme).

### Пример magnet-ссылки

Тестирующая система запустит вашу программу следующим образом:

```bash
$ ./your_program.sh magnet_parse <magnet-link>
```

Ожидаемый вывод:

```bash
Tracker URL: http://bittorrent-test-tracker.codecrafters.io/announce
Info Hash: d69f91e6b2ae4c542468d1073a71d4ea13879a7f
```

### Примечания

- Мы используем версию v1 [формата magnet URI](https://www.bittorrent.org/beps/bep_0009.html#magnet-uri-format). Версия v2 пока не получила широкого распространения.
- `xt` (информационный хеш) — единственный обязательный параметр; остальные необязательны.
- Magnet-ссылка может содержать несколько URL трекеров, но в этом задании будет только один.
