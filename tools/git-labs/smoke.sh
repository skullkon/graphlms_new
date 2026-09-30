#!/usr/bin/env bash
# All writes are confined to a fresh temporary directory. No network or force push.
set -euo pipefail
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_COMMON_DIR GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES GIT_CONFIG_PARAMETERS GIT_CONFIG_COUNT
export GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_TERMINAL_PROMPT=0
export GIT_EDITOR=: GIT_SEQUENCE_EDITOR=:
lab=$(mktemp -d "${TMPDIR:-/tmp}/git-labs-smoke.XXXXXX")
trap 'rm -rf -- "$lab"' EXIT
mkdir "$lab/empty-template"
export GIT_TEMPLATE_DIR="$lab/empty-template"
new_repo() {
  git init -q -b main "$1"
  cd "$1"
  git config user.name 'Git Lab'
  git config user.email 'learner@example.invalid'
  git config commit.gpgsign false
  git config core.autocrlf false
}
identity() {
  git config user.name 'Git Lab'
  git config user.email 'learner@example.invalid'
  git config commit.gpgsign false
  git config core.autocrlf false
}
assert_eq() {
  if [ "$1" != "$2" ]; then
    printf 'FAIL %s: got <%s>, want <%s>\n' "$3" "$1" "$2" >&2
    exit 1
  fi
}
pass() { printf 'PASS %s\n' "$1"; }

new_repo "$lab/model"
printf 'queue=16\n' > plan.txt
git add plan.txt
printf 'workers=2\n' >> plan.txt
git commit -qm 'Save staged version'
assert_eq "$(git show HEAD:plan.txt)" 'queue=16' 'index boundary'
assert_eq "$(git show :plan.txt)" 'queue=16' 'index contents'
git diff --exit-code -- plan.txt >/dev/null && { echo 'FAIL missing working diff' >&2; exit 1; }
git add plan.txt
git commit -qm 'Save remaining line'
assert_eq "$(git rev-list --count HEAD)" '2' 'two commits'
pass '01–03 snapshot, index, commit, diff'

new_repo "$lab/branches"
printf 'queue=16\n' > settings.txt
git add settings.txt
git commit -qm 'Base'
git switch -qc topic
printf 'queue=32\n' > settings.txt
git add settings.txt
git commit -qm 'Topic limit'
git switch -q main
assert_eq "$(cat settings.txt)" 'queue=16' 'branch snapshot'
printf 'queue=8\n' > settings.txt
git add settings.txt
git commit -qm 'Main limit'
if git merge topic >"$lab/merge.out" 2>&1; then
  echo 'FAIL expected merge conflict' >&2; exit 1
fi
assert_eq "$(git status --short)" 'UU settings.txt' 'conflict status'
assert_eq "$(git show :1:settings.txt)" 'queue=16' 'merge base'
assert_eq "$(git show :2:settings.txt)" 'queue=8' 'merge current'
assert_eq "$(git show :3:settings.txt)" 'queue=32' 'merge other'
git merge --abort
assert_eq "$(cat settings.txt)" 'queue=8' 'merge abort'
if git merge topic >"$lab/merge.out" 2>&1; then exit 1; fi
printf 'queue=24\n' > settings.txt
git add settings.txt
git commit -qm 'Resolve at 24'
assert_eq "$(git rev-list --parents -n 1 HEAD | awk '{print NF}')" '3' 'two merge parents'
assert_eq "$(git status --porcelain)" '' 'clean merged tree'
pass '04–05 branches, conflict, abort, merge parents'

# Local bare remote and two independent clones.
git init -q --bare -b main "$lab/shared.git"
new_repo "$lab/a"
printf 'base\n' > README.txt
git add README.txt
git commit -qm 'Base'
git remote add origin "$lab/shared.git"
git push -qu origin main
git clone -q "$lab/shared.git" "$lab/b"
cd "$lab/b"
identity
printf 'workers=2\n' > workers.txt
git add workers.txt
git commit -qm 'B worker limit'
git push -q origin main
cd "$lab/a"
a_before=$(git rev-parse main)
git fetch -q origin
assert_eq "$(git rev-parse main)" "$a_before" 'fetch keeps local main'
[ ! -f workers.txt ]
git merge -q --ff-only origin/main
assert_eq "$(cat workers.txt)" 'workers=2' 'fetch then integrate'
printf 'queue=16\n' > queue.txt
git add queue.txt
git commit -qm 'A queue limit'
git push -q origin main
cd "$lab/b"
printf 'B note\n' > b.txt
git add b.txt
git commit -qm 'Independent B note'
if git push origin main >"$lab/push.out" 2>&1; then
  echo 'FAIL expected non-fast-forward push rejection' >&2; exit 1
fi
git fetch -q origin
if git merge --ff-only origin/main >"$lab/ff.out" 2>&1; then
  echo 'FAIL expected ff-only rejection' >&2; exit 1
fi
git merge -q --no-edit origin/main
[ -f queue.txt ] && [ -f b.txt ]
git push -q origin main
cd "$lab/a"
git pull -q --ff-only origin main
assert_eq "$(git rev-parse main)" "$(git --git-dir="$lab/shared.git" rev-parse main)" 'shared main'
assert_eq "$(git rev-parse main)" "$(git -C "$lab/b" rev-parse main)" 'two clone heads'
pass '06–07 bare remote, clone, fetch/pull/push, divergence'

# Author proposes a branch; reviewer spots an inconsistent description.
git switch -qc proposal
printf 'Queue: 24\n' > description.txt
git add description.txt
git commit -qm 'Incomplete proposal'
git push -qu origin proposal
cd "$lab/b"
git fetch -q origin
git switch -qc review origin/proposal
assert_eq "$(cat queue.txt)" 'queue=16' 'review finds mismatch'
cd "$lab/a"
printf 'queue=24\n' > queue.txt
git add queue.txt
git commit -qm 'Align proposal with description'
git push -q origin proposal
cd "$lab/b"
git fetch -q origin
git merge -q --ff-only origin/proposal
assert_eq "$(cat queue.txt)" 'queue=24' 'reviewed correction'
git switch -q main
git merge -q --no-ff --no-edit origin/proposal
git push -q origin main
pass '08 local proposal, review, correction, integration'

new_repo "$lab/undo"
printf 'queue=16\n' > settings.txt
git add settings.txt
git commit -qm 'Base'
printf 'queue=32\n' > settings.txt
git add settings.txt
git restore --staged -- settings.txt
git diff --cached --exit-code
assert_eq "$(cat settings.txt)" 'queue=32' 'unstage preserves working text'
git restore -- settings.txt
assert_eq "$(cat settings.txt)" 'queue=16' 'restore working file'
printf 'queue=32\n' > settings.txt
git add settings.txt
git commit -qm 'Bad limit'
bad=$(git rev-parse HEAD)
git revert --no-edit "$bad" >/dev/null
assert_eq "$(cat settings.txt)" 'queue=16' 'revert content'
assert_eq "$(git rev-list --count HEAD)" '3' 'revert preserves history'
printf 'workers=2\n' > workers.txt
git add workers.txt
git commit -qm 'Private draft'
git branch saved-draft
git reset -q --soft HEAD~1
assert_eq "$(git status --short)" 'A  workers.txt' 'soft index'
git reset -q --mixed HEAD
assert_eq "$(git status --short)" '?? workers.txt' 'mixed index'
assert_eq "$(git show saved-draft:workers.txt)" 'workers=2' 'saved draft'
pass '09 restore, revert, soft/mixed reset'

new_repo "$lab/rebase"
printf 'Project\n' > README.txt
git add README.txt
git commit -qm 'Base'
git switch -qc topic
printf 'queue=16\n' > queue.txt
git add queue.txt
git commit -qm 'Queue'
printf 'workers=2\n' > workers.txt
git add workers.txt
git commit -qm 'Workers'
before=$(git rev-parse HEAD)
git branch topic-before
git switch -q main
printf 'Project\nRun locally\n' > README.txt
git add README.txt
git commit -qm 'Launch'
git switch -q topic
git rebase main >"$lab/rebase.out" 2>&1
[ "$(git rev-parse HEAD)" != "$before" ]
git merge-base --is-ancestor main topic
assert_eq "$(cat queue.txt)" 'queue=16' 'rebase content'
assert_eq "$(git rev-parse topic-before)" "$before" 'rebase backup'
git switch -q main
git merge -q --ff-only topic
pass '10 private rebase with preserved content'

new_repo "$lab/pick-stash"
printf 'Run localy\n' > README.txt
git add README.txt
git commit -qm 'Base'
git switch -qc experiment
printf 'Run locally\n' > README.txt
git add README.txt
git commit -qm 'Fix'
fix=$(git rev-parse HEAD)
printf 'unfinished\n' > experiment.txt
git add experiment.txt
git commit -qm 'Unfinished'
git switch -q main
printf 'queue=16\n' > limits.txt
git add limits.txt
git commit -qm 'Stable limit'
git cherry-pick "$fix" >/dev/null
assert_eq "$(cat README.txt)" 'Run locally' 'pick content'
[ ! -f experiment.txt ]
printf 'Draft\n' >> README.txt
printf 'question\n' > scratch.txt
git stash push -q -u -m 'Draft'
assert_eq "$(git status --porcelain)" '' 'stash clean'
git stash apply -q 'stash@{0}'
assert_eq "$(cat scratch.txt)" 'question' 'stash untracked restoration'
assert_eq "$(git stash list | wc -l | tr -d ' ')" '1' 'apply keeps stash'
git stash drop -q 'stash@{0}'
pass '11 cherry-pick, stash -u, apply/drop'

new_repo "$lab/bisect"
printf 'queue=16\n' > settings.txt
git add settings.txt
git commit -qm 'Good'
good=$(git rev-parse HEAD)
for n in 1 2; do
  printf 'note %s\n' "$n" > note.txt
  git add note.txt
  git commit -qm "Neutral $n"
done
printf 'queue=32\n' > settings.txt
git add settings.txt
git commit -qm 'Regression'
expected_bad=$(git rev-parse HEAD)
for n in 3 4; do
  printf 'note %s\n' "$n" > note.txt
  git add note.txt
  git commit -qm "Neutral $n"
done
cat > "$lab/check.sh" <<'CHECK'
#!/bin/sh
[ -f settings.txt ] || exit 125
grep -qx 'queue=16' settings.txt
CHECK
git bisect start HEAD "$good" >"$lab/bisect.out"
git bisect run sh "$lab/check.sh" >>"$lab/bisect.out" 2>&1
assert_eq "$(git rev-parse HEAD)" "$expected_bad" 'bisect first bad'
git bisect reset >/dev/null 2>&1
assert_eq "$(git branch --show-current)" 'main' 'bisect reset'
pass '12 reproducible bisect with external test'

new_repo "$lab/ignore"
printf 'TOKEN=TRAINING_ONLY_NOT_A_SECRET\n' > .env
printf 'TOKEN=replace-locally\n' > .env.example
git add .env .env.example
git commit -qm 'Fake training data'
first=$(git rev-parse HEAD)
printf '.env*\n!.env.example\n*.log\n/build/\n' > .gitignore
printf 'local\n' > app.log
mkdir build
printf 'generated\n' > build/output.txt
git rm -q --cached .env
git add .gitignore
git commit -qm 'Ignore local files'
[ -f .env ]
assert_eq "$(git ls-files .env)" '' 'untracked config'
assert_eq "$(git ls-files .env.example)" '.env.example' 'tracked example'
git check-ignore -q app.log
git check-ignore -q build/output.txt
assert_eq "$(git show "$first":.env)" 'TOKEN=TRAINING_ONLY_NOT_A_SECRET' 'historical fake content remains'
pass '13 ignore boundaries and synthetic historical data'

# Final project check detects an inconsistency and passes again after a visible revert.
new_repo "$lab/final"
printf 'queue=16\nworkers=2\n' > settings.txt
printf 'Queue capacity: 16\nWorkers: 2\nShutdown drains accepted jobs\n' > README.txt
git add settings.txt README.txt
git commit -qm 'Initial contract'
cat > "$lab/check-project.sh" <<'CHECK'
#!/bin/sh
set -eu
queue=$(sed -n 's/^queue=//p' settings.txt)
workers=$(sed -n 's/^workers=//p' settings.txt)
test -n "$queue"
test -n "$workers"
grep -qx "Queue capacity: $queue" README.txt
grep -qx "Workers: $workers" README.txt
grep -qx 'Shutdown drains accepted jobs' README.txt
CHECK
sh "$lab/check-project.sh"
printf 'queue=32\nworkers=2\n' > settings.txt
git add settings.txt
git commit -qm 'Deliberate inconsistent contract'
if sh "$lab/check-project.sh"; then echo 'FAIL final test missed regression' >&2; exit 1; fi
git revert --no-edit HEAD >/dev/null
sh "$lab/check-project.sh"
pass '14 final consistency test and visible correction'
printf 'Git labs smoke: all scenarios passed (%s)\n' "$(git --version)"
