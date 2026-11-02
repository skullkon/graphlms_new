"""Behaviour checks: invoke real CLI in temporary directories, no network."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / "app.py"


class CliCase(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.data = Path(self.folder.name) / "tasks.json"

    def command(self, *args):
        return subprocess.run([sys.executable, str(APP), "--file", str(self.data), *args],
                              capture_output=True, text=True, encoding="utf-8", timeout=5)

    def seed(self):
        tasks = [{"id": 2, "title": "Первая", "done": False},
                 {"id": 7, "title": "Вторая", "done": False}]
        self.data.write_text(json.dumps(tasks, ensure_ascii=False), encoding="utf-8")
        return tasks


class TestList(CliCase):
    def test_absent_file_is_empty_and_not_created(self):
        result = self.command("list")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, "")
        self.assertFalse(self.data.exists())

    def test_lists_titles_ids_and_statuses(self):
        tasks = self.seed()
        tasks[1]["done"] = True
        self.data.write_text(json.dumps(tasks), encoding="utf-8")
        before = self.data.read_bytes()
        result = self.command("list")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("[ ] 2: Первая", result.stdout)
        self.assertIn("[x] 7: Вторая", result.stdout)
        self.assertEqual(self.data.read_bytes(), before)


class TestAdd(CliCase):
    def test_add_trimmed_title_and_read_after_restart(self):
        result = self.command("add", "  Пройти урок  ")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(self.data.read_text(encoding="utf-8")),
                         [{"id": 1, "title": "Пройти урок", "done": False}])
        restarted = self.command("list")
        self.assertEqual(restarted.returncode, 0, restarted.stderr)
        self.assertIn("[ ] 1: Пройти урок", restarted.stdout)

    def test_next_id_preserves_existing_tasks(self):
        original = self.seed()
        result = self.command("add", "Третья")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(self.data.read_text(encoding="utf-8")),
                         original + [{"id": 8, "title": "Третья", "done": False}])

    def test_blank_title_preserves_existing_bytes(self):
        self.seed()
        before = self.data.read_bytes()
        result = self.command("add", "   ")
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(result.stderr)
        self.assertEqual(self.data.read_bytes(), before)

    def test_blank_title_does_not_create_file(self):
        result = self.command("add", "")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(self.data.exists())


class TestDone(CliCase):
    def test_changes_only_selected_task_and_persists(self):
        original = self.seed()
        result = self.command("done", "7")
        self.assertEqual(result.returncode, 0, result.stderr)
        original[1]["done"] = True
        self.assertEqual(json.loads(self.data.read_text(encoding="utf-8")), original)
        restarted = self.command("list")
        self.assertIn("[x] 7: Вторая", restarted.stdout)
        self.assertIn("[ ] 2: Первая", restarted.stdout)

    def test_unknown_id_preserves_bytes(self):
        self.seed()
        before = self.data.read_bytes()
        result = self.command("done", "99")
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(result.stderr)
        self.assertEqual(self.data.read_bytes(), before)

    def test_repeated_completion_succeeds_without_rewrite(self):
        self.seed()
        first = self.command("done", "2")
        self.assertEqual(first.returncode, 0, first.stderr)
        before = self.data.read_bytes()
        second = self.command("done", "2")
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertEqual(self.data.read_bytes(), before)


class TestData(CliCase):
    def test_invalid_json_is_preserved_for_all_commands(self):
        for args in [("list",), ("add", "Новая"), ("done", "1")]:
            with self.subTest(args=args):
                self.data.write_bytes(b"{broken json")
                before = self.data.read_bytes()
                result = self.command(*args)
                self.assertNotEqual(result.returncode, 0)
                self.assertTrue(result.stderr)
                self.assertEqual(self.data.read_bytes(), before)

    def test_invalid_structure_and_duplicate_ids_are_preserved(self):
        invalid = [{}, [1], [{"id": True, "title": "A", "done": False}],
                   [{"id": 1, "title": "A", "done": False},
                    {"id": 1, "title": "B", "done": True}]]
        for value in invalid:
            with self.subTest(value=value):
                self.data.write_text(json.dumps(value), encoding="utf-8")
                before = self.data.read_bytes()
                result = self.command("add", "Новая")
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.data.read_bytes(), before)

    def test_noninteger_id_is_rejected_without_modification(self):
        self.seed()
        before = self.data.read_bytes()
        result = self.command("done", "abc")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.data.read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
