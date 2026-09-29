На этом этапе сервер будет извлекать путь URL из HTTP-запроса и возвращать `200` или `404` в зависимости от пути.

### HTTP-запрос

HTTP-запрос состоит из трёх частей, разделённых [CRLF](https://developer.mozilla.org/en-US/docs/Glossary/CRLF) (`\r\n`):

1. Строка запроса.
2. Ноль или более заголовков, каждый из которых заканчивается CRLF.
3. Необязательное тело запроса.

Пример HTTP-запроса:
```javascript
GET /index.html HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\n\r\n
```

Разберём запрос по частям:
```javascript
// Request line
GET                          // HTTP method
/index.html                  // Request target
HTTP/1.1                     // HTTP version
\r\n                         // CRLF that marks the end of the request line

// Headers
Host: localhost:4221\r\n     // Header that specifies the server's host and port
User-Agent: curl/7.64.1\r\n  // Header that describes the client's user agent
Accept: */*\r\n              // Header that specifies which media types the client can accept
\r\n                         // CRLF that marks the end of the headers

// Request body (empty)
```

«Цель запроса» задаёт путь URL для этого запроса. В данном примере путь URL — `/index.html`.

Обратите внимание: каждый заголовок заканчивается CRLF, и весь раздел заголовков также заканчивается CRLF.

### Тесты

Тестирующая система запустит вашу программу следующим образом:
```bash
$ ./your_program.sh
```

Затем она отправит серверу два HTTP-запроса.

Сначала тестирующая система отправит запрос `GET` со случайной строкой в качестве пути:
```bash
$ curl -v http://localhost:4221/abcdefg
```

На этот запрос сервер должен вернуть ответ `404`:
```javascript
HTTP/1.1 404 Not Found\r\n\r\n
```

Затем тестирующая система отправит запрос `GET` с путём `/`:
```bash
$ curl -v http://localhost:4221
```

На этот запрос сервер должен вернуть ответ `200`:
```javascript
HTTP/1.1 200 OK\r\n\r\n
```

### Примечания

- Пока заголовки можно игнорировать. Их разбор вы изучите на следующем этапе.
- На этом этапе цель запроса записывается как путь URL. Однако у неё есть [четыре возможных формата](https://datatracker.ietf.org/doc/html/rfc9112#section-3.2). Формат пути URL называется «origin form» и используется чаще всего. Остальные форматы нужны для более узких сценариев, например отправки запроса через прокси.
- Дополнительные сведения об HTTP-запросах приведены в [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_requests) и [спецификации HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112#name-message).
