import json
import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
QUESTIONS_PATH = PROJECT_ROOT / "data" / "questions.json"
PUBLIC_DIR = PROJECT_ROOT / "public"


def rename_image(old_rel: str, new_stem: str) -> str:
  """Rename an image under public/ to use the new stem.

  Returns the new relative path (as stored in JSON). If the source
  file does not exist, the original path is returned unchanged.
  """
  rel_path = Path(old_rel)
  ext = rel_path.suffix or ".png"

  src = PUBLIC_DIR / rel_path
  if not src.exists():
    print(f"[WARN] Image not found, skipping: {src}")
    return old_rel

  parent = src.parent
  new_name = f"{new_stem}{ext}"
  dest = parent / new_name

  if dest.exists() and dest != src:
    print(f"[WARN] Destination already exists, skipping rename: {dest}")
    return str(Path(rel_path.parent) / new_name) if rel_path.parent != Path(".") else new_name

  if dest != src:
    print(f"Renaming {src.relative_to(PROJECT_ROOT)} -> {dest.relative_to(PROJECT_ROOT)}")
    os.rename(src, dest)

  # Build the JSON-relative path (relative to public/)
  json_rel = Path(rel_path.parent) / new_name if rel_path.parent != Path(".") else Path(new_name)
  return str(json_rel)


def main() -> None:
  if not QUESTIONS_PATH.exists():
    raise SystemExit(f"questions.json not found at {QUESTIONS_PATH}")

  with QUESTIONS_PATH.open("r", encoding="utf-8") as f:
    questions = json.load(f)

  if not isinstance(questions, list):
    raise SystemExit("Expected questions.json to contain a top-level list")

  changed = False

  for q in questions:
    if not isinstance(q, dict):
      continue

    qid = q.get("id")
    if not qid:
      # Skip questions without UUIDs; they can be processed after running add_uuid_to_questions.py
      continue

    # Question-level image
    question_block = q.get("question") or {}
    img = question_block.get("image")
    if img:
      new_rel = rename_image(img, f"{qid}_q")
      question_block["image"] = new_rel
      q["question"] = question_block
      changed = True

    # Option-level images
    options = q.get("options") or []
    for idx, opt in enumerate(options, start=1):
      if not isinstance(opt, dict):
        continue
      opt_img = opt.get("image")
      if not opt_img:
        continue
      new_rel = rename_image(opt_img, f"{qid}_{idx}")
      opt["image"] = new_rel
      changed = True

    q["options"] = options

  if not changed:
    print("No image paths updated (no matching images found).")
    return

  with QUESTIONS_PATH.open("w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)
    f.write("\n")

  print(f"Updated image paths in {QUESTIONS_PATH.relative_to(PROJECT_ROOT)}")


if __name__ == "__main__":
  main()
