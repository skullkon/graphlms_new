На этом этапе сервер будет возвращать ответ `200` на HTTP-запрос.

### HTTP-ответ

HTTP-ответ состоит из трёх частей, разделённых [CRLF](https://developer.mozilla.org/en-US/docs/Glossary/CRLF) (`\r\n`):
1. Строка состояния.
2. Ноль или более заголовков, каждый из которых заканчивается CRLF.
3. Необязательное тело ответа.

На этом этапе ответ сервера будет содержать только строку состояния. Сервер должен отправить следующий ответ:
```javascript
HTTP/1.1 200 OK\r\n\r\n
```

Разберём ответ по частям:
```javascript
// Status line
HTTP/1.1  // HTTP version
200       // Status code
OK        // Optional reason phrase
\r\n      // CRLF that marks the end of the status line

// Headers (empty)
\r\n      // CRLF that marks the end of the headers

// Response body (empty)
```

Дополнительные сведения об HTTP-ответах приведены в [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages#http_responses) и [спецификации HTTP/1.1](https://datatracker.ietf.org/doc/html/rfc9112#name-message).

### Тесты

Тестирующая система запустит вашу программу следующим образом:
```bash
$ ./your_program.sh
```

Затем она отправит серверу HTTP-запрос `GET`:
```bash
$ curl -v http://localhost:4221
```

Сервер должен вернуть следующий ответ:
```javascript
HTTP/1.1 200 OK\r\n\r\n
```

### Примечания

- Содержимое запроса можно игнорировать. Разбор запросов мы рассмотрим на следующих этапах.
- В этом задании используется HTTP/1.1.
- Чтобы изучить устройство HTTP, вы реализуете сервер с нуля, используя примитивы TCP и не полагаясь на встроенные или сторонние HTTP-библиотеки.
