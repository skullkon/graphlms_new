# Основание курса Linux для разработчика

Проверка открытых источников: 30 сентября 2026 года. Курс оригинальный; программы служат ориентиром последовательности, документация — проверкой механизма. Мы не воспроизводим чужие уроки или экзамены.

## Программы и методика

- [Linux Foundation LFS101](https://training.linuxfoundation.org/training/introduction-to-linux/): официальный поисковый индекс подтверждает бесплатный introductory course, GUI/CLI и разные семейства дистрибутивов. Полный URL оказался недоступен web-инструменту; [открытая программа LFS101x](https://courses.edx.org/c4x/LinuxFoundationX/LFS101x/asset/Introduction_to_Linux_Course_Outline.pdf) — архив, а не доказательство неизменности нынешнего курса. Берём разделение системы, командной строки, процессов, файлов и разрешений. Не требуем регистрации LF для завершения собственного курса.
- [MIT Missing Semester 2026](https://missing.csail.mit.edu/) и [введение в shell](https://missing.csail.mit.edu/2026/course-shell/): официальный поиск подтвердил текущую программу и практические shell exercises; часть полного открытия заблокирована. Берём обучение через реальные входы, исследование инструмента и объяснение результата. Не включаем Git/Vim как обязательные большие темы: здесь одна последовательная база Linux.
- [Ubuntu: command line for beginners](https://ubuntu.com/tutorials/command-line-for-beginners?campaign=nurture): официальный индекс сообщил перенос урока в продуктовую документацию. Берём безопасную собственную папку, постепенное объяснение команд и отличий shell/terminal.
- [Ubuntu WSL installation](https://ubuntu.com/wsl/docs/latest/howto/install-ubuntu-wsl2/), [Microsoft WSL systemd](https://learn.microsoft.com/en-us/windows/wsl/systemd): версия и init проверяются, systemctl не назначается для любой WSL. Для курса фиксируем Ubuntu 24.04 LTS как воспроизводимую учебную цель, а не называем её самой новой.
- [Canonical Multipass installation](https://canonical.com/multipass/docs/latest/how-to-guides/install-multipass/) прочитана полностью; [create instance](https://canonical.com/multipass/docs/latest/how-to-guides/manage-instances/create-an-instance/) проверена через официальный индекс. macOS 14+ и актуальная поддерживаемая версия инструмента; локальная VM обходится без покупки сервера. Это terminal Linux environment, не установка Desktop поверх пользовательского диска.

## Первичные справочники

[Bash quoting](https://www.gnu.org/software/bash/manual/html_node/Quoting.html), [Bash pipelines](https://www.gnu.org/software/bash/manual/html_node/Pipelines), [Coreutils](https://www.gnu.org/software/coreutils/manual/coreutils.html), [chmod](https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html), [Findutils safe filename handling](https://www.gnu.org/software/findutils/manual/html_node/find_html/Safe-File-Name-Handling.html), [GNU tar tutorial](https://www.gnu.org/software/tar/manual/html_chapter/Tutorial.html), [Linux signals](https://man7.org/linux/man-pages/man7/signal.7.html), [systemctl](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html), [Ubuntu packages](https://ubuntu.com/server/docs/how-to/software/package-management/).

GNU и man7 часть прямых запросов вернули timeout/restricted; официальный индекс позволил подтвердить основные разделы. systemd man page вернула 403; раздел systemd надо сверять также с локальным man установленной версии. В уроках указаны конкретные страницы, не поиск как источник. Документация latest может описывать больше возможностей, чем Ubuntu24.04; используем только базовые поддерживаемые операции.

## Последовательность

14 глав: окружение; устройство; shell/пути; файлы/поиск; потоки/статусы; права; процессы; пакеты; окружение; scripts; сеть; services/logs; хранение/backup; итоговый проект. Каждый урок содержит сценарий, механизм, опыт, вариативность вывода, самостоятельное действие, критерий и разбор. Термин сначала появляется в действии. Главы строятся на прежних понятиях; для начала не нужны SQL, Docker, облако или платный курс.

Учебная Ubuntu работает в VM/WSL. Опыты используют отдельный mktemp-каталог, файлы своего пользователя и loopback. Повышение прав ограничено установкой известных пакетов в учебной Ubuntu; root shell, curl|sh, форматирование и удаление личных данных отсутствуют. Финал проверяет диагностику, восстановление и объяснение причины, а не запоминание команд.

## Проверка и ограничения среды

Авторская среда — Darwin/macOS. Bash, Python3, curl, tar, find, grep, awk и переносимые команды можно исполнить локально. procfs, apt, ip, ss, systemd, journalctl и WSL/Multipass installation здесь не исполнены: соответствующие уроки не выдают документальную проверку за эксперимент на Linux. Финальный отчёт дополняется фактическими результатами portable-проверки после создания материалов.

## Фактическая приёмка

Все 14 глав созданы; frontmatter содержит только title, order и minutes. Order последовательный 1–14, minutes=10 отражает чтение, длительность практики указана отдельно. Размер главы — 725–906 слов по подсчёту whitespace-токенов тела Markdown (включая команды). Raw HTML не используется.

`bash -n tools/linux-labs/smoke.sh tools/linux-labs/report.sh` — PASS. `bash tools/linux-labs/smoke.sh` — PASS на Darwin: имена с пробелами, поиск и статус grep, отчёт 5/2 и ошибки формата/вызова, права обычного владельца, окружение, TERM/wait собственного процесса, tar с извлечением и cmp, loopback HTTP/404/отказ после остановки. Скрипт оставляет свою временную папку для осмотра и завершает свой сервер; пользовательские файлы не удаляет.

`report.sh` извлечён дословно из десятой главы; набор содержит README, fixtures и помощник loopback-сервера. Учебные данные и формат описаны, сертификат и платные сервисы не нужны. APT, systemd, procfs, ip/ss, WSL и установка Multipass документально сверены, но фактически на Linux здесь не исполнены. Это явное ограничение проверки, а не обещание их запуска на macOS.

Все 14 файлов также прошли локальный разбор gray-matter и Markdown→HTML (remark-parse/remark-rehype/rehype-stringify). Проверены последовательность order, точный набор полей, заголовки лаборатории/разбора и ссылки на первичные источники. В smoke устранена гонка сигнала до запуска sleep: дочерний процесс явно сообщает готовность перед TERM. Повторный smoke — PASS.

## Исправления независимого review

В главе 12 общая подготовка site/index и определение wait_http расположены до проверки manager. Ручная ветка не требует создания unit или systemd-папки. Оба способа запуска используют не больше пяти HTTP-попыток с таймаутом и требуют точного содержимого страницы; Type=simple/active не объявляется готовностью endpoint. В главе 13 исходник исправлен на source/docs/notes.txt, показан намеренный cmp=1 после изменения и извлечение старой версии в новый пустой каталог.

Блоки общей подготовки и ручного запуска главы 12 исполнены на Darwin в новой собственной временной папке (путь HOME/linux-course-service заменён на её точный путь без изменения HOME): готовность, ожидаемый текст, HTTP-запись журнала и отсутствие слушателя после TERM — PASS. Wait=143 после TERM ожидаем. Блоки архива главы 13 исполнены: первоначальный cmp=0, изменённый cmp=1, source=draft two, оба независимых восстановления=draft one — PASS. Общий smoke повторно PASS. Systemd-ветка не исполнена на Linux; проверены текстовые команды и общий переносимый механизм ожидания.
