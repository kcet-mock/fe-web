#!/usr/bin/env python3

import argparse
import json
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List, Tuple


def _normalize_image_token(value: str) -> str:
    """Normalize legacy image tokens to match current app expectations.

    The internal UI treats tokens starting with "images/" (and sometimes "image/") as images.
    Uploaded images are stored under public/images, so we convert legacy "image/<name>" to
    "images/<name>".
    """

    v = (value or "").strip()
    if not v:
        return ""

    # Remove leading slashes.
    while v.startswith("/"):
        v = v[1:]

    # Legacy -> current
    if v.startswith("image/"):
        return "images/" + v[len("image/") :]

    return v


def _normalize_question_parts(question: Any) -> List[str]:
    if question is None:
        return []
    if isinstance(question, str):
        q = question.strip()
        return [_normalize_image_token(q)] if q else []
    if isinstance(question, list):
        out: List[str] = []
        for part in question:
            if part is None:
                continue
            text = _normalize_image_token(str(part))
            if text:
                out.append(text)
        return out
    return [_normalize_image_token(str(question))]


def _normalize_options(options: Any) -> List[List[str]]:
    """Return options as list[list[str]] length 4 when possible."""

    if options is None:
        return []

    # Most of your raw JSON uses: ["opt1", "opt2", ...]
    if isinstance(options, list) and (len(options) == 0 or isinstance(options[0], str) or options[0] is None):
        out: List[List[str]] = []
        for opt in options:
            if opt is None:
                out.append([])
                continue
            text = _normalize_image_token(str(opt))
            out.append([text] if text else [])
        return out

    # Already in the internal shape: [["part1", ...], ...]
    if isinstance(options, list) and (len(options) == 0 or isinstance(options[0], list)):
        out2: List[List[str]] = []
        for opt_parts in options:
            if not isinstance(opt_parts, list):
                opt_parts = [opt_parts]
            parts: List[str] = []
            for p in opt_parts:
                if p is None:
                    continue
                text = _normalize_image_token(str(p))
                if text:
                    parts.append(text)
            out2.append(parts)
        return out2

    # Fallback: single string etc
    text = _normalize_image_token(str(options))
    return [[text]] if text else []


def _coerce_answer(value: Any) -> int:
    try:
        n = int(value)
    except Exception:
        return 1
    return n if 1 <= n <= 4 else 1


def _question_to_record(raw: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    qid = raw.get("id") or raw.get("uuid") or raw.get("_id")
    if not isinstance(qid, str) or not qid.strip():
        qid = str(uuid.uuid4())
    qid = qid.strip()

    record = {
        "id": qid,
        "question": _normalize_question_parts(raw.get("question")),
        "options": _normalize_options(raw.get("options")),
        "answer": _coerce_answer(raw.get("answer")),
    }
    return qid, record


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Convert a single questions.json (array) into data/<subject>/<uuid>.json files plus _all.json.\n"
            "Input items should look like: {id, question: [...], options: [...], answer}."
        )
    )
    parser.add_argument("input", type=Path, help="Path to questions.json")
    parser.add_argument(
        "--outdir",
        type=Path,
        default=None,
        help="Output directory (default: input file's parent directory)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing <uuid>.json and _all.json files",
    )

    args = parser.parse_args()

    input_path: Path = args.input
    if not input_path.exists():
        print(f"Input not found: {input_path}", file=sys.stderr)
        return 2

    outdir: Path = args.outdir if args.outdir is not None else input_path.parent

    try:
        raw = json.loads(input_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"Failed to parse JSON: {e}", file=sys.stderr)
        return 2

    if not isinstance(raw, list):
        print("Input JSON must be an array of questions.", file=sys.stderr)
        return 2

    ids: List[str] = []
    written = 0
    skipped = 0

    for idx, item in enumerate(raw):
        if not isinstance(item, dict):
            print(f"Skipping non-object at index {idx}", file=sys.stderr)
            skipped += 1
            continue

        qid, record = _question_to_record(item)
        ids.append(qid)

        target = outdir / f"{qid}.json"
        if target.exists() and not args.force:
            skipped += 1
            continue

        _write_json(target, record)
        written += 1

    all_path = outdir / "_all.json"
    if all_path.exists() and not args.force:
        print(
            f"Not writing {all_path} because it already exists (use --force to overwrite).",
            file=sys.stderr,
        )
    else:
        _write_json(all_path, ids)

    print(f"Input:   {input_path}")
    print(f"Outdir:  {outdir}")
    print(f"Total:   {len(raw)}")
    print(f"Written: {written}")
    print(f"Skipped: {skipped} (already existed or invalid)")
    print(f"Index:   {all_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
