import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(root, '../../site/web/public/downloads/system-design-labs.zip');
const script = String.raw`
import pathlib, sys, zipfile, hashlib
root, target = map(pathlib.Path, sys.argv[1:])
files = sorted(p for p in root.iterdir() if p.is_file() and p.suffix in ('.py', '.sql', '.md'))
required = {'README.md','CASES.md','cases.py','test_cases.py','transactions.sql','stream_lab.py','capacity.py','overload.py'}
missing = required - {p.name for p in files}
if missing:
    raise ValueError('Missing lab files: '+str(sorted(missing)))
target.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_STORED) as z:
    for file in files:
        if file.is_symlink(): raise ValueError('Symlink is not allowed')
        info = zipfile.ZipInfo('system-design-labs/'+file.name, (1980,1,1,0,0,0))
        info.create_system=3
        info.external_attr=0o100644 << 16
        z.writestr(info,file.read_bytes())
print(str(target)+': '+str(len(files))+' files; SHA256 '+hashlib.sha256(target.read_bytes()).hexdigest())
`;
process.stdout.write(execFileSync('python3', ['-c', script, root, output], { encoding: 'utf8' }));
