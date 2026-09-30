#!/usr/bin/env bash
if [ "$#" -ne 1 ]; then
  printf 'usage: report.sh FILE\n' >&2
  exit 2
fi
input=$1
if [ ! -f "$input" ] || [ ! -r "$input" ]; then
  printf 'cannot read regular file: %s\n' "$input" >&2
  exit 2
fi
awk '
  NF != 2 || $1 !~ /^[0-9][0-9][0-9]$/ {bad=1; next}
  {total++; if ($1 == 500) failures++}
  END {
    if (bad) exit 2
    printf "requests=%d failures=%d\n", total, failures
  }
' "$input"
status=$?
if [ "$status" -ne 0 ]; then
  printf 'invalid input or read failure\n' >&2
fi
exit "$status"
