На этом этапе вы добавите в HTTP-сервер поддержку [сжатия `gzip`](https://www.gzip.org/).

### Тесты

Тестирующая система запустит вашу программу следующим образом:
```
$ ./your_program.sh
```

Затем она отправит запрос `GET` к эндпоинту `/echo/{str}` вашего сервера. В запросе будет заголовок `Accept-Encoding`, включающий `gzip`.
```
$ curl -v -H "Accept-Encoding: gzip" http://localhost:4221/echo/abc | hexdump -C
```

Ответ сервера должен содержать:
- Код ответа `200`.
- Заголовок `Content-Type` со значением `text/plain`.
- Заголовок `Content-Encoding` со значением `gzip`.
- Заголовок `Content-Length` с размером сжатого тела.
- Тело ответа с параметром `str`, сжатым с помощью `gzip`.

```
HTTP/1.1 200 OK
Content-Encoding: gzip
Content-Type: text/plain
Content-Length: 23

1F 8B 08 00 00 00 00 00  // This is the hexadecimal representation of the body.
00 03 4B 4C 4A 06 00 C2  // It should actually be sent as binary data.
41 24 35 03 00 00 00
```

### Примечания

- Проверить правильность сжатого тела можно командой `echo -n <uncompressed-str> | gzip | hexdump -C`.
- Увеличение размера при сжатии очень короткой строки, например `abc`, — нормальное явление.
