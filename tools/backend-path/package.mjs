import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Run from any working directory. No shell, npm or third-party zip library.
const root = path.dirname(fileURLToPath(import.meta.url));
const downloads = path.resolve(root, '../../site/web/public/downloads');
for (const role of ['starter', 'reference']) {
  const moduleRoot = path.join(root, role);
  for (const required of ['go.mod', 'README.md', 'STAGES.md', 'internal/jobs/jobs.go']) {
    if (!existsSync(path.join(moduleRoot, required))) throw new Error(`Missing ${role}/${required}`);
  }
  mkdirSync(path.join(moduleRoot, 'internal/jobs'), { recursive: true });
  mkdirSync(path.join(moduleRoot, 'cmd/load'), { recursive: true });
  copyFileSync(path.join(root, 'shared/stages_test.go'), path.join(moduleRoot, 'internal/jobs/stages_test.go'));
  copyFileSync(path.join(root, 'shared/load.go'), path.join(moduleRoot, 'cmd/load/main.go'));
}
mkdirSync(downloads, { recursive: true });
const python = String.raw`
import hashlib, json, pathlib, sys, zipfile
root, downloads = map(pathlib.Path, sys.argv[1:])
outputs = []
for role in ('starter', 'reference'):
    source = root / role
    target = downloads / ('backend-path-' + role + '.zip')
    files = sorted(p for p in source.rglob('*') if p.is_file() and (
        p.suffix == '.go' or p.relative_to(source).as_posix() in ('go.mod', 'go.sum', 'README.md', 'STAGES.md')
    ))
    # A fixed time, permissions, order and stored bytes make repeat builds identical.
    # Generated jobs.json, executables, editor files and local data are never exported.
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_STORED) as archive:
        for file in files:
            if file.is_symlink():
                raise ValueError('Refusing symlink: ' + str(file))
            name = 'backend-path-' + role + '/' + file.relative_to(source).as_posix()
            entry = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            entry.compress_type = zipfile.ZIP_STORED
            archive.writestr(entry, file.read_bytes())
    outputs.append({'archive': target.name, 'files': len(files), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
print(json.dumps(outputs))
`;
process.stdout.write(execFileSync('python3', ['-c', python, root, downloads], { encoding: 'utf8' }));
