На этом этапе вы добавите подсветку совпадений в нескольких строках.

### Подсветка совпадений в нескольких строках

Когда grep обрабатывает несколько строк:
- Каждая строка обрабатывается независимо.
- Выводятся только строки, содержащие хотя бы одно совпадение.
- В каждой выведенной строке подсвечиваются все совпадения.

Например:

<html>
<pre>
$ echo -n "dogs and cats are pets\ndogs are nice" | grep --color=always -E '(dogs|cats)'
<span style="color: red; font-weight: bold;">dogs</span> and <span style="color: red; font-weight: bold;">cats</span> are pets
<span style="color:red; font-weight: bold;">dogs</span> are nice
</pre>
</html>

Здесь выводятся обе строки, а совпадения в них подсвечены.

### Проверки

Тестирующая система запустит программу так:

<html>
<pre>
$ echo -e "Tiger in the wild\nBird in the sky" | ./your_program.sh --color=always -E '(Tiger|Bird)'
<span style="color: red; font-weight: bold;">Tiger</span> in the wild
<span style="color: red; font-weight: bold;">Bird</span> in the sky

$ echo -e "Now: 2025\nNext: 2026" | ./your_program.sh --color=always -E '\d\d\d\d'
Now: <span style="color: red; font-weight: bold;">2025</span>
Next: <span style="color: red; font-weight: bold;">2026</span>
</pre>
</html>

Если входные данные не соответствуют шаблону, программа должна:
- Завершиться с кодом `1`.
- Ничего не вывести.

Если входной текст соответствует шаблону, программа должна:
- Завершиться с кодом `0`.
- Вывести каждую строку, содержащую совпадение.
- Подсветить каждое совпадение в каждой строке.

### Примечания
- Порядок кодов SGR не важен: `\033[31;01m` и `\033[01;31m` дают одинаковое красное полужирное выделение.
