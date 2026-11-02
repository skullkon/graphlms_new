"""Run the full local acceptance suite; propagate failure; no model/API calls."""
import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    try:
        result = subprocess.run(
            [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-v"],
            cwd=Path(__file__).resolve().parent,
            timeout=60,
        )
        sys.exit(result.returncode)
    except subprocess.TimeoutExpired:
        print("Checks exceeded 60 seconds", file=sys.stderr)
        sys.exit(1)
