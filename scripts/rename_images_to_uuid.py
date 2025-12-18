import argparse
import json
import os
import uuid
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DIR = PROJECT_ROOT / "public"


def is_image_token(token: Any) -> bool:
  return isinstance(token, str) and (token.startswith("images/") or token.startswith("image/"))


def _resolve_public_path(token: str) -> Tuple[Path, str]:
  """Resolve a stored token to an on-disk path under public/.

  Returns: (absolute_path, normalized_token_prefix)
  - If token starts with 'images/', it maps to public/images/...
  - If token starts with 'image/', it's legacy. We first try public/<rest>,
    then public/images/<rest> as a fallback.
  """
  if token.startswith("images/"):
    rel = token
    return (PUBLIC_DIR / rel, "images")

  # legacy
  rest = token[len("image/") :].lstrip("/")
  first = PUBLIC_DIR / rest
  if first.exists():
    return (first, "image")

  second = PUBLIC_DIR / "images" / rest
  return (second, "image")


def _make_uuid_filename(ext: str) -> str:
  safe_ext = ext if ext.startswith(".") else f".{ext}" if ext else ".png"
  # Use canonical UUID format with hyphens, e.g. 1bd155a2-512e-4ed5-bdeb-54526fdc1cb1
  return f"{uuid.uuid4()}{safe_ext}"


def rename_image_token(
  token: str,
  *,
  dry_run: bool,
  rename_cache: Dict[Path, str],
) -> str:
  """Rename the image file referenced by token to a UUID filename.

  Returns updated token (always using the 'images/<uuid>.<ext>' form when possible).
  If the file doesn't exist, returns the original token unchanged.
  """
  src, _prefix = _resolve_public_path(token)
  src = src.resolve()

  if src in rename_cache:
    return rename_cache[src]

  if not src.exists():
    print(f"[WARN] Image not found, skipping: {src.relative_to(PROJECT_ROOT) if src.is_absolute() else src}")
    return token

  ext = src.suffix or ".png"
  # Always place renamed images into public/images/
  dest_dir = PUBLIC_DIR / "images"
  dest_dir.mkdir(parents=True, exist_ok=True)

  dest = dest_dir / _make_uuid_filename(ext)
  # Very unlikely collision, but handle it
  while dest.exists():
    dest = dest_dir / _make_uuid_filename(ext)

  if dry_run:
    print(f"[DRY] Renaming {src.relative_to(PROJECT_ROOT)} -> {dest.relative_to(PROJECT_ROOT)}")
  else:
    print(f"Renaming {src.relative_to(PROJECT_ROOT)} -> {dest.relative_to(PROJECT_ROOT)}")
    os.rename(src, dest)

  new_token = f"images/{dest.name}"
  rename_cache[src] = new_token
  return new_token


def _walk_json_files(root: Path) -> List[Path]:
  if root.is_file() and root.suffix.lower() == ".json":
    return [root]

  if root.is_file():
    return []

  files: List[Path] = []
  for p in root.rglob("*.json"):
    if p.name == "_all.json":
      continue
    # Skip hidden / dotfiles
    if any(part.startswith(".") for part in p.parts):
      continue
    files.append(p)
  return sorted(files)


def _rewrite_tokens_in_parts(
  parts: Any,
  *,
  dry_run: bool,
  rename_cache: Dict[Path, str],
) -> Tuple[Any, bool]:
  if not isinstance(parts, list):
    return parts, False
  changed = False
  out: List[Any] = []
  for item in parts:
    if is_image_token(item):
      new_item = rename_image_token(str(item), dry_run=dry_run, rename_cache=rename_cache)
      out.append(new_item)
      changed = changed or (new_item != item)
    else:
      out.append(item)
  return out, changed


def _process_question_dict(
  q: Dict[str, Any],
  *,
  dry_run: bool,
  rename_cache: Dict[Path, str],
) -> bool:
  changed = False

  # New internal format: question: [str], options: [[str]]
  if isinstance(q.get("question"), list):
    new_parts, c = _rewrite_tokens_in_parts(q.get("question"), dry_run=dry_run, rename_cache=rename_cache)
    if c:
      q["question"] = new_parts
      changed = True

  opts = q.get("options")
  if isinstance(opts, list):
    new_opts: List[Any] = []
    for opt in opts:
      new_opt, c = _rewrite_tokens_in_parts(opt, dry_run=dry_run, rename_cache=rename_cache)
      new_opts.append(new_opt)
      changed = changed or c
    if changed:
      q["options"] = new_opts

  # Legacy list-of-questions format with question.image / option.image
  question_block = q.get("question")
  if isinstance(question_block, dict):
    img = question_block.get("image")
    if isinstance(img, str):
      new_img = rename_image_token(img, dry_run=dry_run, rename_cache=rename_cache)
      if new_img != img:
        question_block["image"] = new_img
        q["question"] = question_block
        changed = True

  options = q.get("options")
  if isinstance(options, list) and options and isinstance(options[0], dict):
    for opt in options:
      if not isinstance(opt, dict):
        continue
      opt_img = opt.get("image")
      if isinstance(opt_img, str):
        new_img = rename_image_token(opt_img, dry_run=dry_run, rename_cache=rename_cache)
        if new_img != opt_img:
          opt["image"] = new_img
          changed = True

  return changed


def process_json_file(path: Path, *, dry_run: bool, rename_cache: Dict[Path, str]) -> bool:
  try:
    data = json.loads(path.read_text(encoding="utf-8"))
  except Exception as e:
    print(f"[WARN] Failed to read JSON: {path.relative_to(PROJECT_ROOT)} ({e})")
    return False

  changed = False

  if isinstance(data, dict):
    changed = _process_question_dict(data, dry_run=dry_run, rename_cache=rename_cache)
  elif isinstance(data, list):
    # Could be a list of question objects
    any_changed = False
    for item in data:
      if isinstance(item, dict):
        any_changed = _process_question_dict(item, dry_run=dry_run, rename_cache=rename_cache) or any_changed
    changed = any_changed
  else:
    return False

  if not changed:
    return False

  if dry_run:
    print(f"[DRY] Would update JSON tokens in {path.relative_to(PROJECT_ROOT)}")
    return True

  path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
  print(f"Updated JSON tokens in {path.relative_to(PROJECT_ROOT)}")
  return True


def main() -> None:
  parser = argparse.ArgumentParser(
    description="Rename referenced public images to UUID filenames and update JSON tokens (images/... or image/...)."
  )
  parser.add_argument(
    "path",
    nargs="?",
    default=str(PROJECT_ROOT / "data"),
    help="File or directory to scan for .json files (default: ./data)",
  )
  parser.add_argument("--dry-run", action="store_true", help="Print actions without changing files")
  args = parser.parse_args()

  target = Path(args.path).expanduser()
  if not target.is_absolute():
    target = (Path.cwd() / target).resolve()

  if not target.exists():
    raise SystemExit(f"Path not found: {target}")

  json_files = _walk_json_files(target)
  if not json_files:
    raise SystemExit(f"No .json files found under: {target}")

  rename_cache: Dict[Path, str] = {}
  updated_files = 0
  for fpath in json_files:
    if process_json_file(fpath, dry_run=args.dry_run, rename_cache=rename_cache):
      updated_files += 1

  print(f"Done. Updated {updated_files} JSON file(s). Renamed {len(rename_cache)} image file(s).")


if __name__ == "__main__":
  main()
