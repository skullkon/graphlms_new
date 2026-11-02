"""Local, sequential task manager; Python 3.10+, standard library only."""
import argparse
import json
import sys
from pathlib import Path


def load_tasks(path):
    if not path.exists():
        return []
    tasks = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(tasks, list):
        raise ValueError("Expected a JSON list")
    ids = set()
    for task in tasks:
        if (not isinstance(task, dict)
                or type(task.get("id")) is not int or task["id"] < 1
                or task["id"] in ids
                or not isinstance(task.get("title"), str)
                or not task["title"].strip()
                or type(task.get("done")) is not bool):
            raise ValueError("Invalid task data")
        ids.add(task["id"])
    return tasks


def save_tasks(path, tasks):
    # Sequential local use only: no crash safety or concurrent writer guarantee.
    path.write_text(json.dumps(tasks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def add_task(tasks, title):
    raise NotImplementedError("Implement add_task using SPEC.md")


def complete_task(tasks, task_id):
    raise NotImplementedError("Implement complete_task using SPEC.md")


def main():
    parser = argparse.ArgumentParser(description="Local task manager")
    parser.add_argument("--file", type=Path, default=Path("tasks.json"))
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("list")
    add = commands.add_parser("add")
    add.add_argument("title")
    done = commands.add_parser("done")
    done.add_argument("id", type=int)
    args = parser.parse_args()
    try:
        tasks = load_tasks(args.file)
        if args.command == "list":
            for task in tasks:
                marker = "x" if task["done"] else " "
                print(f"[{marker}] {task['id']}: {task['title']}")
        elif args.command == "add":
            task_id = add_task(tasks, args.title)
            save_tasks(args.file, tasks)
            print(f"Added {task_id}")
        else:
            if complete_task(tasks, args.id):
                save_tasks(args.file, tasks)
            print(f"Done {args.id}")
        return 0
    except (OSError, ValueError, NotImplementedError) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
