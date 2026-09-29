На этом этапе вы добавите поддержку подстановки параметров в форме `${VAR}`.

### Подстановка с фигурными скобками

Без скобок `$FOObar` воспринимается как переменная `FOObar`. Если заключить имя в скобки — `${FOO}bar` — оболочка точно определит конец имени: значение `FOO` будет подставлено, а `bar` добавится как буквальный текст.

```bash
$ declare Var1=foo
$ declare Var2=bar
$ echo ${Var1}end
fooend
$ echo ${Var1}and${Var2}
fooandbar
```

### Проверки

Тестирующая система запустит вашу программу следующим образом:

```bash
$ ./your_program.sh
```

Система установит переменные и выполнит следующие команды:

```bash
$ declare Item=widget
$ declare Foo1=Bar2
$ ./custom_exe_1234 stock_${Item}_id ${Foo1}
Program was passed 3 args (including program name).
Arg #0 (program name): custom_exe_1234
Arg #1: stock_widget_id
Arg #2: Bar2
Program Signature: 5998595441
```

Тестирующая система проверит, что напечатанный вывод соответствует полностью раскрытой строке.
