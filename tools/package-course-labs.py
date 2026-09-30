#!/usr/bin/env python3
"""Build deterministic source archives for the four practical courses."""
from pathlib import Path
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
LABS = ("git-labs", "linux-labs", "database-labs", "algorithm-labs")
IGNORED = {"__pycache__", ".git", ".DS_Store"}

def package(name):
    source = ROOT / "tools" / name
    if not (source / "README.md").is_file():
        raise ValueError(f"missing README: {name}")
    files = []
    for file in sorted(source.rglob("*")):
        if any(part in IGNORED for part in file.relative_to(source).parts):
            continue
        if file.is_symlink():
            raise ValueError(f"symlink is not a lab source: {file}")
        if file.is_file():
            files.append(file)
    output = ROOT / "site/web/public/downloads" / f"{name}.zip"
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file in files:
            entry = zipfile.ZipInfo(f"{name}/{file.relative_to(source).as_posix()}", (2026, 9, 30, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.create_system = 3
            mode = 0o755 if file.suffix == ".sh" else 0o644
            entry.external_attr = (0o100000 | mode) << 16
            archive.writestr(entry, file.read_bytes())
    print(f"{name}: {len(files)} files, SHA256 {hashlib.sha256(output.read_bytes()).hexdigest()}")

if __name__ == "__main__":
    for name in LABS:
        package(name)
