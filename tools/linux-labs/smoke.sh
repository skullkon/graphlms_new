#!/usr/bin/env bash
# Bash 3+; только собственная новая временная папка, без sudo и внешней сети.
set -eu
base_dir=$(cd "$(dirname "$0")" && pwd)
for command_name in python3 curl tar awk grep cmp find; do
  command -v "$command_name" >/dev/null || { printf 'missing: %s\n' "$command_name" >&2; exit 2; }
done
lab_dir=$(mktemp -d "${TMPDIR:-/tmp}/linux-labs.XXXXXX")
server_pid=''
cleanup() {
  [ "${BASH_SUBSHELL:-0}" = 0 ] || return 0
  if [ -n "$server_pid" ]; then
    kill -TERM "$server_pid" 2>/dev/null || :
    wait "$server_pid" 2>/dev/null || :
  fi
  # Материалы сохраняются для просмотра; пользовательские файлы не удаляем.
}
trap cleanup EXIT
cd "$lab_dir"
printf 'Рабочая папка сохранена: %s\n' "$lab_dir"
mkdir source restored site
cp "$base_dir/fixtures/requests.log" 'source/request sample.log'
cp 'source/request sample.log' source/copy.log
cmp 'source/request sample.log' source/copy.log
mv source/copy.log source/renamed.log
ln -s renamed.log source/latest.log
cmp source/latest.log source/renamed.log
find source -type f -name '*.log' > found.txt
[ "$(wc -l < found.txt | tr -d ' ')" = 2 ]
[ "$(grep -c '^500 ' 'source/request sample.log')" = 2 ]
if grep '^503 ' 'source/request sample.log' > no-match.txt; then
  printf 'unexpected grep match\n' >&2; exit 1
else
  [ "$?" = 1 ]
fi
printf 'PASS: пути с пробелом, копия, ссылка, поиск и grep-статус\n'

bash -n "$base_dir/report.sh"
[ "$(bash "$base_dir/report.sh" 'source/request sample.log')" = 'requests=5 failures=2' ]
: > empty.log
[ "$(bash "$base_dir/report.sh" empty.log)" = 'requests=0 failures=0' ]
for input in "$base_dir/fixtures/invalid.log" missing.log; do
  if bash "$base_dir/report.sh" "$input" > report.out 2> report.err; then
    printf 'expected report failure\n' >&2; exit 1
  else
    [ "$?" = 2 ]
    [ ! -s report.out ]
    [ -s report.err ]
  fi
done
if bash "$base_dir/report.sh" > report.out 2> report.err; then exit 1; else [ "$?" = 2 ]; fi
printf 'PASS: отчёт 5/2, пустой вход, неверный вход и аргументы\n'

bash -c 'umask 077; printf private > private.txt; mkdir private-dir'
chmod u=rw,go= private.txt
if [ "$(id -u)" = 0 ]; then
  printf 'SKIP: отказ записи обычному владельцу — запуск от root\n'
else
  chmod u-w private.txt
  if bash -c 'printf changed > private.txt' 2> permission.err; then exit 1; fi
  chmod u+w private.txt
  printf updated > private.txt
fi
COURSE_MODE=demo bash -c '[ "$COURSE_MODE" = demo ]'
(trap - EXIT; printf ready > child.ready; exec sleep 30) &
child=$!
for attempt in 1 2 3 4 5; do
  [ -s child.ready ] && break
  sleep 1
done
[ -s child.ready ] || exit 1
kill -TERM "$child"
if wait "$child" 2>/dev/null; then printf 'expected terminated child\n' >&2; exit 1; fi
printf 'PASS: собственные права, окружение и остановка дочернего процесса\n'

tar -czf backup.tar.gz -C source .
tar -xzf backup.tar.gz -C restored
cmp 'source/request sample.log' 'restored/request sample.log'
[ "$(bash "$base_dir/report.sh" 'restored/request sample.log')" = 'requests=5 failures=2' ]
printf 'PASS: извлечение архива и повторный отчёт\n'

printf 'linux course\n' > site/index.html
python3 -u "$base_dir/serve.py" "$lab_dir/site" "$lab_dir/port.txt" > server.log 2>&1 &
server_pid=$!
# Ожидание готовности ограничено, файл порта записывает уже привязанный сервер.
for attempt in 1 2 3 4 5; do
  [ -s port.txt ] && break
  sleep 1
done
[ -s port.txt ] || { cat server.log >&2; exit 1; }
port=$(cat port.txt)
[ "$(curl --noproxy '*' -sS --connect-timeout 2 --max-time 5 "http://127.0.0.1:$port/")" = 'linux course' ]
[ "$(curl --noproxy '*' -sS -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:$port/missing")" = 404 ]
kill -TERM "$server_pid"
wait "$server_pid" 2>/dev/null || :
server_pid=''
if curl --noproxy '*' -sS --connect-timeout 2 --max-time 3 "http://127.0.0.1:$port/" > stopped.out 2> stopped.err; then
  printf 'unexpected response after stopping server\n' >&2; exit 1
fi
printf 'PASS: локальный HTTP, 404 и отсутствие соединения после остановки\n'
printf 'Все переносимые проверки пройдены. APT/systemd/ip/proc и установка Linux здесь не проверяются.\n'
