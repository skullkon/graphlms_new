На этом этапе вы добавите поддержку метода `POST` для эндпоинта `/files/{filename}`, который принимает текст от клиента и создаёт новый файл с этим текстом.

### Тело запроса

Тело запроса используется для передачи данных от клиента серверу.

Пример запроса `POST /files/{filename}`:
```
// Request line
POST /files/number HTTP/1.1
\r\n

// Headers
Host: localhost:4221\r\n
User-Agent: curl/7.64.1\r\n
Accept: */*\r\n
Content-Type: application/octet-stream  // Header that specifies the format of the request body
Content-Length: 5\r\n                   // Header that specifies the size of the request body, in bytes
\r\n

// Request Body
12345
```

### Тесты

Тестирующая система запустит программу с флагом `--directory`. Флаг `--directory` задаёт абсолютный путь к каталогу, в котором нужно создать файл.
```
$ ./your_program.sh --directory /tmp/
```

Затем она отправит запрос `POST` к эндпоинту `/files/{filename}` вашего сервера, содержащий:
- Заголовок `Content-Type` со значением `application/octet-stream`.
- Заголовок `Content-Length` с размером тела запроса в байтах.
- Тело запроса с произвольным текстом.

```
$ curl -v --data "12345" -H "Content-Type: application/octet-stream" http://localhost:4221/files/file_123
```

Сервер должен вернуть ответ `201`:
```
HTTP/1.1 201 Created\r\n\r\n
```

Также сервер должен создать новый файл в каталоге файлов со следующими требованиями:
- Имя файла должно совпадать с параметром `filename` эндпоинта.
- Файл должен содержать содержимое тела запроса.
