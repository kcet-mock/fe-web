#!/usr/bin/env python3

import argparse
import json
import sys
import uuid
from pathlib import Path
from typing import Any, Dict, List


def generate_uuid() -> uuid.UUID:
    """Generate a random UUID v4."""
    return uuid.uuid4()


def _normalize_image_token(value: str) -> str:
    """Normalize image tokens to match current app expectations.
    
    The internal UI treats tokens starting with "images/" as images.
    """
    v = (value or "").strip()
    if not v:
        return ""
    
    # Remove leading slashes
    while v.startswith("/"):
        v = v[1:]
    
    # Legacy -> current
    if v.startswith("image/"):
        return "images/" + v[len("image/"):]
    
    return v


def _normalize_question_parts(question: Any) -> List[str]:
    """Normalize question to list of strings (text and/or image paths)."""
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


def _normalize_choices(choices: Any) -> List[List[str]]:
    """Return choices as list[list[str]] with exactly 4 choices."""
    if choices is None:
        return [[], [], [], []]
    
    # Handle ["opt1", "opt2", ...] format
    if isinstance(choices, list) and (len(choices) == 0 or isinstance(choices[0], str) or choices[0] is None):
        out: List[List[str]] = []
        for choice in choices:
            if choice is None:
                out.append([])
                continue
            text = _normalize_image_token(str(choice))
            out.append([text] if text else [])
        # Ensure exactly 4 choices
        while len(out) < 4:
            out.append([])
        return out[:4]
    
    # Handle [["part1", ...], ...] format
    if isinstance(choices, list) and (len(choices) == 0 or isinstance(choices[0], list)):
        out2: List[List[str]] = []
        for choice_parts in choices:
            if not isinstance(choice_parts, list):
                choice_parts = [choice_parts]
            parts: List[str] = []
            for p in choice_parts:
                if p is None:
                    continue
                text = _normalize_image_token(str(p))
                if text:
                    parts.append(text)
            out2.append(parts)
        # Ensure exactly 4 choices
        while len(out2) < 4:
            out2.append([])
        return out2[:4]
    
    # Fallback: single string etc
    text = _normalize_image_token(str(choices))
    return [[text], [], [], []] if text else [[], [], [], []]


def _normalize_correct_answer(value: Any) -> int:
    """Convert correctAnswer to 0-3 index."""
    try:
        n = int(value)
    except Exception:
        return 0
    # If value is 1-4, convert to 0-3
    if 1 <= n <= 4:
        return n - 1
    # If already 0-3, keep it
    if 0 <= n <= 3:
        return n
    return 0


def _normalize_explanation(explanation: Any) -> List[str]:
    """Normalize explanation to list of strings."""
    return _normalize_question_parts(explanation)


def convert_question(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a question to the standard format with random UUID."""
    new_id = str(generate_uuid())
    
    record = {
        "id": new_id,
        "question": _normalize_question_parts(raw.get("question")),
        "choices": _normalize_choices(raw.get("choices") or raw.get("options")),
        "correctAnswer": _normalize_correct_answer(raw.get("correctAnswer") or raw.get("answer")),
    }
    
    # Add explanation if present
    if "explanation" in raw and raw["explanation"]:
        record["explanation"] = _normalize_explanation(raw["explanation"])
    
    return record


def write_json(path: Path, data: Any) -> None:
    """Write JSON data to file with pretty formatting."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_all_js(path: Path, new_ids: List[str]) -> None:
    """Add new question IDs to _all.js file, preserving existing IDs."""
    import re
    
    path.parent.mkdir(parents=True, exist_ok=True)
    
    # Read existing IDs if file exists
    existing_ids: List[str] = []
    if path.exists():
        try:
            content = path.read_text(encoding="utf-8")
            # Extract IDs from the JavaScript array
            matches = re.findall(r"'([^']+)'", content)
            existing_ids = matches
        except Exception:
            pass
    
    # Combine existing and new IDs, removing duplicates while preserving order
    all_ids = existing_ids.copy()
    for qid in new_ids:
        if qid not in all_ids:
            all_ids.append(qid)
    
    # Format as JavaScript module
    content = "export const QUESTION_IDS = [\n"
    for qid in all_ids:
        content += f"  '{qid}',\n"
    content += "];\n"
    
    path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Convert questions.json to individual UUID files with time-based UUIDs.\n"
            "Creates <uuid>.json files and updates _all.js in the destination directory."
        )
    )
    parser.add_argument("input", type=Path, help="Path to questions.json")
    parser.add_argument("destination", type=Path, help="Output directory (e.g., data/bio/)")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing files",
    )
    
    args = parser.parse_args()
    
    input_path: Path = args.input
    dest_dir: Path = args.destination
    
    if not input_path.exists():
        print(f"Error: Input file not found: {input_path}", file=sys.stderr)
        return 2
    
    # Read input JSON
    try:
        raw = json.loads(input_path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"Error: Failed to parse JSON: {e}", file=sys.stderr)
        return 2
    
    if not isinstance(raw, list):
        print("Error: Input JSON must be an array of questions.", file=sys.stderr)
        return 2
    
    # Convert questions
    ids: List[str] = []
    written = 0
    skipped = 0
    
    for idx, item in enumerate(raw):
        if not isinstance(item, dict):
            print(f"Warning: Skipping non-object at index {idx}", file=sys.stderr)
            skipped += 1
            continue
        
        try:
            record = convert_question(item)
            qid = record["id"]
            ids.append(qid)
            
            target = dest_dir / f"{qid}.json"
            if target.exists() and not args.force:
                print(f"Warning: Skipping existing file {qid}.json (use --force to overwrite)", file=sys.stderr)
                skipped += 1
                continue
            
            write_json(target, record)
            written += 1
        except Exception as e:
            print(f"Error: Failed to process question at index {idx}: {e}", file=sys.stderr)
            skipped += 1
            continue
    
    # Write _all.js file
    all_js_path = dest_dir / "_all.js"
    try:
        write_all_js(all_js_path, ids)
        print(f"\n✓ Successfully converted questions")
        print(f"  Input:   {input_path}")
        print(f"  Destination: {dest_dir}")
        print(f"  Total:   {len(raw)}")
        print(f"  Written: {written}")
        print(f"  Skipped: {skipped}")
        print(f"  Index:   {all_js_path}")
    except Exception as e:
        print(f"Error: Failed to write _all.js: {e}", file=sys.stderr)
        return 2
    
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
