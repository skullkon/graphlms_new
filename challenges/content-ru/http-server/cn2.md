На этом этапе вы реализуете эндпоинт `/echo/{str}`, который принимает строку и возвращает её в теле ответа.

### Тело ответа

Тело ответа служит для передачи содержимого клиенту. Это может быть целая веб-страница, файл, строка или любые другие данные, представимые в байтах.

Эндпоинт `/echo/{str}` должен возвращать ответ `200` с заданной строкой в теле, а также заголовками `Content-Type` и `Content-Length`.

Пример запроса к `/echo/{str}`:
```javascript
GET /echo/abc HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: curl/7.64.1\r\nAccept: */*\r\n\r\n
```

Ожидаемый ответ:
```javascript
HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\n\r\nabc
```

Разберём ответ по частям:
```javascript
// Status line
HTTP/1.1 200 OK
\r\n                          // CRLF that marks the end of the status line

// Headers
Content-Type: text/plain\r\n  // Header that specifies the format of the response body
Content-Length: 3\r\n         // Header that specifies the size of the response body, in bytes
\r\n                          // CRLF that marks the end of the headers

// Response body
abc                           // The string from the request
```

Оба заголовка необходимы, чтобы клиент мог разобрать тело ответа. Обратите внимание: каждый заголовок заканчивается CRLF, и весь раздел заголовков также заканчивается CRLF.

### Тесты

Тестирующая система запустит вашу программу следующим образом:
```bash
$ ./your_program.sh
```

Затем она отправит запрос `GET` к эндпоинту `/echo/{str}` вашего сервера с некоторой случайной строкой.
```bash
$ curl -v http://localhost:4221/echo/abc
```

Сервер должен вернуть ответ `200`, содержащий:
- Заголовок `Content-Type` со значением `text/plain`.
- Заголовок `Content-Length` с длиной заданной строки.
- Тело ответа с заданной строкой.
```javascript
HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\n\r\nabc
```

### Примечания
- Дополнительные сведения об HTTP-ответах приведены в [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_responses) и [спецификации HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112#name-message).
