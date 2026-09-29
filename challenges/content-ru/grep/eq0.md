На этом этапе вы добавите подсветку нескольких совпадений.

### Подсветка нескольких совпадений

Grep подсвечивает весь совпавший текст, найденный в строке.

Например:

<html>
<pre>
$ echo -n "dogs and cats are pets" | grep --color=always -E '(dogs|cats)'
<span style="color: red; font-weight: bold;">dogs</span> and <span style="color: red; font-weight: bold;">cats</span> are pets
</pre>
</html>

Здесь и `dogs`, и `cats` выделены красным полужирным шрифтом.

Для каждого найденного совпадения:
1. Вставьте открывающую последовательность ANSI `\033[01;31m` перед совпадением.
2. Вставьте закрывающую последовательность ANSI `\033[m` после совпадения.
3. Продолжите поиск со следующей позиции после конца предыдущего совпадения.

### Проверки

Тестирующая система запустит программу так:

<html>
<pre>
$ echo -n "jekyll and hyde" | ./your_program.sh --color=always -E '(jekyll|hyde)'
<span style="color: red; font-weight: bold;">jekyll</span> and <span style="color: red; font-weight: bold;">hyde</span>

$ echo -n "2025" | ./your_program.sh --color=always -E '\d'
<span style="color: red; font-weight: bold;">2</span><span style="color: red; font-weight: bold;">0</span><span style="color: red; font-weight: bold;">2</span><span style="color: red; font-weight: bold;">5</span>
</pre>
</html>

Если входные данные не соответствуют шаблону, программа должна:
- Завершиться с кодом `1`.
- Ничего не вывести.

Если входной текст соответствует шаблону, программа должна:
- Завершиться с кодом `0`.
- Вывести входной текст в стандартный вывод.
- Выделить все совпавшие фрагменты красным полужирным шрифтом.

### Примечания

- На этом этапе достаточно одной строки. Подсветку совпадений в нескольких строках добавим позже.
- Порядок кодов SGR не важен: `\033[31;01m` и `\033[01;31m` дают одинаковое красное полужирное выделение.
