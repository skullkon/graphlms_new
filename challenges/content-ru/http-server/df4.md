Добро пожаловать в расширение «Сжатие HTTP»! В нём вы добавите в HTTP-сервер поддержку [сжатия](https://en.wikipedia.org/wiki/HTTP_compression).

На этом этапе вы добавите поддержку заголовков `Accept-Encoding` и `Content-Encoding`.

### `Accept-Encoding` и `Content-Encoding`

HTTP-клиент использует заголовок `Accept-Encoding`, чтобы указать поддерживаемые методы сжатия. В следующем примере клиент сообщает о поддержке `gzip`:
```
> GET /echo/foo HTTP/1.1
> Host: localhost:4221
> User-Agent: curl/7.81.0
> Accept: */*
> Accept-Encoding: gzip  // Client specifies it supports the gzip compression scheme.
```

Сервер выбирает один из методов сжатия, перечисленных в `Accept-Encoding`, и сжимает им тело ответа.

Затем сервер отправляет ответ со сжатым телом и заголовком `Content-Encoding`, а `Content-Encoding` указывает использованный метод сжатия.

В следующем примере тело ответа сжато с помощью `gzip`:
```
< HTTP/1.1 200 OK
< Content-Encoding: gzip    // Server specifies that the response body is compressed with gzip.
< Content-Type: text/plain  // Original media type of the body.
< Content-Length: 23        // Size of the compressed body.
< ...                       // Compressed body.
```

Если сервер не поддерживает ни один из методов сжатия, указанных клиентом, он не сжимает тело ответа. Вместо этого он отправляет обычный ответ без заголовка `Content-Encoding`.

В этом расширении считайте, что сервер поддерживает только метод сжатия `gzip`.

На этом этапе сжимать тело не требуется. Вы реализуете сжатие на одном из следующих этапов.

### Тесты

Тестирующая система запустит вашу программу следующим образом:
```
$ ./your_program.sh
```

Затем она отправит два запроса `GET` к эндпоинту `/echo/{str}` вашего сервера.

#### Первый запрос

Сначала тестирующая система отправит запрос с заголовком `Accept-Encoding: gzip`.
```
$ curl -v -H "Accept-Encoding: gzip" http://localhost:4221/echo/abc
```

Ответ сервера должен содержать заголовок `Content-Encoding: gzip`.
```
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Encoding: gzip

...  // Body omitted.
```

#### Второй запрос

Затем тестирующая система отправит запрос с заголовком `Accept-Encoding: invalid-encoding`.
```
$ curl -v -H "Accept-Encoding: invalid-encoding" http://localhost:4221/echo/abc
```

Ответ сервера не должен содержать заголовок `Content-Encoding`:
```
HTTP/1.1 200 OK
Content-Type: text/plain

...  // Body omitted.
```

### Примечания

- Поддержку нескольких методов сжатия в заголовке `Accept-Encoding` вы добавите на следующем этапе.
- Существует ещё один способ сжатия HTTP, использующий заголовки `TE` и `Transfer-Encoding`. В этом расширении мы его не рассматриваем.
