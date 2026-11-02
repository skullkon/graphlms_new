import unittest
import subprocess
import sys
from unittest.mock import patch

from container_executor import validate_files


class VerdictTests(unittest.TestCase):
    def test_recognizes_go_test_timeout_before_outer_deadline(self):
        from container_executor import execution_result
        result = execution_result(b'panic: test timed out after 30s\n', 1, None, 30100)
        self.assertEqual(result["run"]["status"], "TO")
        self.assertNotEqual(result["run"]["code"], 0)


class CleanupTests(unittest.TestCase):
    def test_failed_container_removal_reaps_client_and_blocks_further_jobs(self):
        import container_executor as executor
        child = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"],
                                 stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        try:
            with patch.object(executor.subprocess, "Popen", return_value=child), \
                 patch.object(executor.subprocess, "run", side_effect=subprocess.TimeoutExpired("docker rm", 5)), \
                 patch.object(executor.time, "monotonic", side_effect=[0, 56]):
                with self.assertRaises(OSError):
                    executor.execute([])
            self.assertIsNotNone(child.poll())
            self.assertTrue(executor.CLEANUP_FAILED)
            with self.assertRaises(OSError):
                executor.execute([])
        finally:
            executor.CLEANUP_FAILED = False
            if child.poll() is None:
                child.kill()
            child.wait()
            child.stdout.close()


class InputTests(unittest.TestCase):
    def payload(self, files):
        return {"language": "gotest", "version": "1.26.4", "files": files}

    def test_accepts_only_expected_source_files(self):
        files = [{"name": "go.mod", "content": "module solution\ngo 1.25\n"},
                 {"name": "solution.go", "content": "package solution"}]
        self.assertEqual(validate_files(self.payload(files)), files)

    def test_rejects_traversal_and_unexpected_files(self):
        for name in ["../secret", "/etc/passwd", "reference.go", "go.sum"]:
            with self.subTest(name=name), self.assertRaises(ValueError):
                validate_files(self.payload([{"name": name, "content": "x"}]))

    def test_rejects_duplicates_oversized_and_invalid_payloads(self):
        file = {"name": "solution.go", "content": "x"}
        payloads = [None, {}, self.payload([]), self.payload([file, file]),
                    self.payload([{"name": "solution.go", "content": "x" * 1048577}]),
                    self.payload([{"name": "solution.go", "content": 123}]),
                    dict(self.payload([file]), language="bash")]
        for payload in payloads:
            with self.subTest(payload_type=type(payload).__name__), self.assertRaises(ValueError):
                validate_files(payload)


if __name__ == "__main__":
    unittest.main()
