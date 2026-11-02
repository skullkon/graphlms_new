"""Loopback-only Piston protocol adapter for disposable Go containers.

The trusted service talks to Docker; submitted code never receives its socket.
Each run uses a read-only toolchain and warm cache, with bounded temporary space.
"""
import json
import os
from pathlib import Path
import selectors
import subprocess
import tempfile
import time
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer

VERSION = "1.26.4"
MAX_BODY = 1024 * 1024
MAX_OUTPUT = 4 * 1024 * 1024
IMAGE = os.environ.get("SANDBOX_IMAGE", "graphlms-go-sandbox:1.26.4")
CLEANUP_FAILED = False


def execution_result(output, returncode, signal, duration_ms):
    text = output.decode("utf-8", errors="replace")
    timed_out = signal == "SIGKILL" or "panic: test timed out after " in text
    if signal:
        text += "\n[executor] Time or output limit exceeded.\n"
    return {"language": "gotest", "version": VERSION, "run": {
        "stdout": text, "stderr": "", "output": text,
        "code": returncode if not signal else 137,
        "signal": signal, "status": "TO" if timed_out else None,
        "wall_time": duration_ms,
    }}


def validate_files(payload):
    if not isinstance(payload, dict) or payload.get("language") != "gotest" or payload.get("version") != VERSION:
        raise ValueError("Unsupported runtime")
    files = payload.get("files")
    if not isinstance(files, list) or not 1 <= len(files) <= 4:
        raise ValueError("Expected one to four source files")
    names = set()
    size = 0
    for file in files:
        if not isinstance(file, dict):
            raise ValueError("Invalid file")
        name, content = file.get("name"), file.get("content")
        if not isinstance(name, str) or name not in {"go.mod", "solution.go", "solution_test.go", "support.go"} or name in names:
            raise ValueError("Invalid or duplicate filename")
        if not isinstance(content, str) or file.get("encoding", "utf8") != "utf8":
            raise ValueError("Expected UTF-8 text")
        size += len(content.encode("utf-8"))
        if size > MAX_BODY:
            raise ValueError("Source too large")
        names.add(name)
    return files


def execute(files):
    global CLEANUP_FAILED
    if CLEANUP_FAILED:
        raise OSError("A previous container could not be removed; restart executor")
    name = "graphlms-job-" + uuid.uuid4().hex
    started = time.monotonic()
    output = bytearray()
    signal = None
    with tempfile.TemporaryDirectory(prefix="graphlms-job-") as work:
        os.chmod(work, 0o755)
        for file in files:
            path = Path(work, file["name"])
            path.write_text(file["content"], encoding="utf-8")
            path.chmod(0o644)
        command = [
            "/usr/bin/docker", "run", "--read-only", "--name", name,
            "--label=graphlms.executor=1",
            "--network=none", "--cpus=1", "--memory=768m", "--memory-swap=768m",
            "--pids-limit=128", "--user=65534:65534", "--cap-drop=ALL",
            "--security-opt=no-new-privileges", "--log-driver=none",
            "--ulimit=nofile=256:256", "--ulimit=fsize=16777216:16777216",
            "--mount", f"type=bind,source={work},target=/work,readonly",
            "--tmpfs=/tmp:rw,exec,nosuid,nodev,size=134217728,mode=1777", "--workdir=/work",
            "--env=GOMAXPROCS=2", "--env=GOTOOLCHAIN=local", "--env=GOPROXY=off",
            "--env=GOPATH=/tmp/gopath", IMAGE,
            "go", "test", "-json", "-race", "-count=1", "-timeout=30s", "./...",
        ]
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        try:
            with selectors.DefaultSelector() as poll:
                poll.register(process.stdout, selectors.EVENT_READ)
                while poll.get_map():
                    if time.monotonic() - started > 55:
                        signal = "SIGKILL"
                        break
                    for key, _ in poll.select(timeout=0.1):
                        block = os.read(key.fd, 65536)
                        if not block:
                            poll.unregister(key.fileobj)
                            continue
                        remaining = MAX_OUTPUT - len(output)
                        output.extend(block[:remaining])
                        if len(block) > remaining:
                            signal = "SIGXFSZ"
                            break
                    if signal:
                        break
            if not signal:
                process.wait(timeout=5)
        finally:
            removed = False
            try:
                for _ in range(2):
                    try:
                        cleanup = subprocess.run(["/usr/bin/docker", "rm", "--force", name],
                                                 capture_output=True, timeout=5)
                        removed = cleanup.returncode == 0 or b"No such container" in cleanup.stderr
                    except subprocess.SubprocessError:
                        continue
                    if removed:
                        break
            finally:
                if process.poll() is None:
                    process.kill()
                process.wait(timeout=5)
                process.stdout.close()
                CLEANUP_FAILED = not removed
            if not removed:
                raise OSError("Container cleanup failed")
    return execution_result(output, process.returncode, signal,
                            int((time.monotonic() - started) * 1000))


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(65)

    def respond(self, status, value):
        data = json.dumps(value).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/api/v2/runtimes":
            self.respond(200, [{"language": "gotest", "version": VERSION, "aliases": []}])
        else:
            self.respond(404, {"message": "Not found"})

    def do_POST(self):
        if self.path != "/api/v2/execute":
            return self.respond(404, {"message": "Not found"})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if not 0 < size <= MAX_BODY:
                raise ValueError("Invalid body size")
            files = validate_files(json.loads(self.rfile.read(size)))
        except (ValueError, UnicodeError) as error:
            return self.respond(400, {"message": str(error)})
        try:
            self.respond(200, execute(files))
        except (OSError, subprocess.SubprocessError):
            self.respond(503, {"message": "Container executor unavailable"})


if __name__ == "__main__":
    stale = subprocess.check_output(["/usr/bin/docker", "ps", "-aq",
                                     "--filter=label=graphlms.executor=1"], timeout=10).split()
    if stale:
        subprocess.run(["/usr/bin/docker", "rm", "--force", *[i.decode() for i in stale]],
                       check=True, timeout=20)
    HTTPServer(("127.0.0.1", 2000), Handler).serve_forever()
