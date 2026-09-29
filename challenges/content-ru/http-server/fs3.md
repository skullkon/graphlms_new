На этом этапе вы реализуете эндпоинт `/user-agent`, который читает заголовок запроса `User-Agent` и возвращает его значение в теле ответа.

### Заголовок `User-Agent`

Заголовок [`User-Agent`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) описывает пользовательский агент клиента.

Эндпоинт `/user-agent` должен прочитать заголовок `User-Agent` и вернуть его значение в теле ответа. Пример запроса к `/user-agent`:
```javascript
// Request line
GET
/user-agent
HTTP/1.1
\r\n

// Headers
Host: localhost:4221\r\n
User-Agent: foobar/1.2.3\r\n  // Read this value
Accept: */*\r\n
\r\n

// Request body (empty)
```

Ожидаемый ответ:
```javascript
// Status line
HTTP/1.1 200 OK               // Status code must be 200
\r\n

// Headers
Content-Type: text/plain\r\n
Content-Length: 12\r\n
\r\n

// Response body
foobar/1.2.3                  // The value of `User-Agent`
```

### Тесты

Тестирующая система запустит вашу программу следующим образом:
```bash
$ ./your_program.sh
```

Затем она отправит запрос `GET` к эндпоинту `/user-agent` вашего сервера. Запрос будет содержать заголовок `User-Agent`.
```bash
$ curl -v --header "User-Agent: foobar/1.2.3" http://localhost:4221/user-agent
```

Сервер должен вернуть ответ `200`, содержащий:
- Заголовок `Content-Type` со значением `text/plain`.
- Заголовок `Content-Length` с длиной значения `User-Agent`.
- Тело сообщения со значением `User-Agent`.
```javascript
HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 12\r\n\r\nfoobar/1.2.3
```

### Примечания
- Имена заголовков [не чувствительны к регистру](https://datatracker.ietf.org/doc/html/rfc9112#name-field-syntax).
