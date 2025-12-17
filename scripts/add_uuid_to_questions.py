import argparse
import json
import uuid
from pathlib import Path


def add_uuids(path: Path, field_name: str = "id") -> None:
  """Add a UUID field to each question object in the JSON array.

  The JSON is expected to be a list of question objects, like the
  existing data/questions.json structure. If a given object already
  has the field, it is left unchanged.
  """
  if not path.exists():
    raise SystemExit(f"File not found: {path}")

  with path.open("r", encoding="utf-8") as f:
    data = json.load(f)

  if not isinstance(data, list):
    raise SystemExit("Expected top-level JSON array of questions")

  changed = False
  for q in data:
    if isinstance(q, dict) and field_name not in q:
      q[field_name] = str(uuid.uuid4())
      changed = True

  if not changed:
    print("No changes made (all questions already had a UUID field).")
    return

  # Write back with pretty formatting
  with path.open("w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")

  print(f"Added UUIDs to questions in {path}")


def main() -> None:
  parser = argparse.ArgumentParser(description="Add UUIDs to each question in a JSON file.")
  parser.add_argument(
    "json_path",
    nargs="?",
    default="data/questions.json",
    help="Path to questions JSON file (default: data/questions.json)",
  )
  parser.add_argument(
    "--field",
    default="id",
    help="Field name to store the UUID on each question (default: id)",
  )
  args = parser.parse_args()

  add_uuids(Path(args.json_path), field_name=args.field)


if __name__ == "__main__":
  main()
