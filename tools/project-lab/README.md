# Project Lab: your editor, local official checks

Node 20+, Git, Go, and the runtime/toolchain for your selected solution language must be on PATH. macOS and Linux are supported. The official testers are Go programs; the first run downloads the pinned official GitHub repository and Go dependencies, then compiles the tester. Internet access is required for that first run. Testers and course starter caches live in `~/.cache/graphlms-project-lab`, outside this repository. The 10 systems challenges need no account or paid service; Claude Code checks are an explicitly opted-in paid exception.

From the LMS repository:

```sh
node tools/project-lab/cli.mjs list
node tools/project-lab/cli.mjs init http-server ../my-http-server --language go
```

Open the newly created directory in your editor. From that directory, run the CLI by its absolute path:

```sh
node /absolute/path/to/lms/tools/project-lab/cli.mjs test --stage at4
node /absolute/path/to/lms/tools/project-lab/cli.mjs submit --stage at4 --url http://127.0.0.1:3000
node /absolute/path/to/lms/tools/project-lab/cli.mjs status
```

Start the LMS with `PROJECT_LAB_LOCAL=1` and open Project Lab before submitting. Its local server creates `.local/project-lab/token`. The CLI reads that token directly and sends it only to a loopback HTTP origin. Submission runs the tests again, then records the outcome locally. Failed solutions are also recorded. No solution source is uploaded. This is personal practice evidence, not secure remote certification.

`--json` emits machine-readable results. Exit codes: 0 passed/success, 1 solution checks failed, 2 runner/configuration/submission error. An omitted `--stage` repeats the last attempted stage (initially the first stage). Base stages are cumulative; extension checks include preceding base stages, preceding stages of that extension, and explicit prerequisites. Only fully passing selected runs report passed stages. The official tester exit status determines success.

Initialization refuses an existing destination and rejects symbolic links in upstream starters. It preserves starter executable permissions and initializes local Git without pushing. For a newly created Go starter requesting a Go version newer than the installed toolchain, it adapts only that starter’s go.mod to the installed version and records an explicit notice in its metadata. Existing projects are never rewritten. Files and progress live in your own project directory; `.graphlms.json` contains its selected challenge and latest result. Tests execute your solution with your current user permissions: use your own code, not untrusted submissions. The web server never executes solutions. Testers run in a private temporary working directory so their test.db/test.lox fixtures cannot overwrite solution files. Known fixed upstream temporary paths are checked for collisions before execution. Runs that use those paths acquire an exclusive course lock under /tmp; a concurrent invocation stops without touching the active run. A hard-killed process can leave a lock behind: verify that no tester is running before manually removing the reported lock directory. The CLI stops the tester process group on timeout (three minutes), bounds captured output, and uses argument arrays rather than shell evaluation.

Upstream starters may mention a newer runtime version than installed locally; Go initialization adapts this as described above. Install the chosen language toolchain and any course-specific external dependencies documented in its README. Some testers require additional tools/services or platform features; their diagnostics are returned directly. All 11 pinned testers build on macOS arm64. Fresh Go starters were smoke-tested against the first official stage for the 10 locally supported challenges (expected failures); HTTP stages one and two also passed a tiny reference solution. The grep runner gives the upstream tester a disposable copy of grep to relocate, preserving host tools. Claude Code official checks require both the external paid `CODECRAFTERS_SECRET_OPENROUTER_API_KEY` environment variable and explicit `--allow-paid-api` on `test` or `submit`. Without both, the CLI stops before making any request. Its tasks and starter remain available for free. The Claude tester receives a private temporary home directory so its settings fixture cannot change your real Claude settings; Go compiler, module, and build cache paths are retained explicitly. Paid Claude checks were not run during verification. Initial fetch/build failures do not claim a solution passed.

Run CLI regression tests with `node --test tools/project-lab/cli.test.mjs`.
