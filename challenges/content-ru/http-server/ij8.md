На этом этапе вы добавите поддержку заголовков `Accept-Encoding`, содержащих несколько методов сжатия.

### Несколько методов сжатия

Клиент может сообщить о поддержке нескольких методов сжатия, указав их в `Accept-Encoding` через запятую:
```
Accept-Encoding: encoding-1, encoding-2, encoding-3
```

В этом расширении считайте, что сервер поддерживает только метод сжатия `gzip`.

На этом этапе сжимать тело не требуется. Вы реализуете сжатие на следующем этапе.

### Тесты

Тестирующая система запустит вашу программу следующим образом:
```
$ ./your_program.sh
```

Затем она отправит два запроса `GET` к эндпоинту `/echo/{str}` вашего сервера.

#### Первый запрос

В первом запросе заголовок `Accept-Encoding` будет содержать `gzip` вместе с несколькими неподдерживаемыми кодированиями:
```
$ curl -v -H "Accept-Encoding: invalid-encoding-1, gzip, invalid-encoding-2" http://localhost:4221/echo/abc
```

Ответ сервера должен содержать заголовок `Content-Encoding: gzip`.
```javascript
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Encoding: gzip

// Body omitted.
```

#### Второй запрос

Во втором запросе заголовок `Accept-Encoding` будет содержать только неподдерживаемые кодирования:
```
$ curl -v -H "Accept-Encoding: invalid-encoding-1, invalid-encoding-2" http://localhost:4221/echo/abc
```

Ответ сервера не должен содержать заголовок `Content-Encoding`:
```javascript
HTTP/1.1 200 OK
Content-Type: text/plain

// Body omitted.
```
