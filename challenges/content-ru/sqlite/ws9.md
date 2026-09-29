Пора поработать с большим объёмом данных!

На этом этапе синтаксис останется прежним: запрос с условием `WHERE`. Однако теперь запрашиваемая таблица будет больше и займёт несколько страниц.

Тестирующая система запустит вашу программу следующим образом:

```
$ ./your_program.sh superheroes.db "SELECT id, name FROM superheroes WHERE eye_color = 'Pink Eyes'"
```

Ожидаемый вывод:

```
297|Stealth (New Earth)
790|Tobias Whale (New Earth)
1085|Felicity (New Earth)
2729|Thrust (New Earth)
3289|Angora Lapin (New Earth)
3913|Matris Ater Clementia (New Earth)
```

Тестирующая система использует пример базы супергероев размером около 1 МБ. Для локального тестирования можно скачать уменьшенную версию; см. раздел **Sample Databases** в **README** вашего репозитория.

На этом этапе потребуется обходить [B-дерево](https://en.wikipedia.org/wiki/B-tree). Если вы не знакомы с B-деревьями или хотите освежить знания, хорошая отправная точка — статья Вайдехи Джоши [Busying Oneself With B-Trees](https://medium.com/basecs/busying-oneself-with-b-trees-78bbf10522e7). Особенности хранения B-деревьев SQLite на диске описаны в разделе документации [B-tree Pages](https://www.sqlite.org/fileformat.html#b_tree_pages).
