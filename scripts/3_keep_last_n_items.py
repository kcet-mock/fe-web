#!/usr/bin/env python3
import sys
import re
from pathlib import Path

def keep_last_n_items(file_path, n):
    """Keep only the last N entries in a _<year>.js file"""
    file_path = Path(file_path)
    
    if not file_path.exists():
        print(f"Error: File '{file_path}' does not exist")
        sys.exit(1)
    
    # Read the file
    content = file_path.read_text()
    
    # Extract all question IDs using regex
    # Pattern matches strings like '019b377f-0b5b-7d68-a154-770b4bfcacc4'
    id_pattern = r"'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'"
    all_ids = re.findall(id_pattern, content)
    
    if not all_ids:
        print(f"Error: No question IDs found in '{file_path}'")
        sys.exit(1)
    
    print(f"Found {len(all_ids)} question IDs")
    
    # Keep only the last N items
    if n > len(all_ids):
        print(f"Warning: N ({n}) is greater than total IDs ({len(all_ids)}). Keeping all items.")
        last_n_ids = all_ids
    else:
        last_n_ids = all_ids[-n:]
        print(f"Keeping last {n} items")
    
    # Build the new content
    new_content = "export const QUESTION_IDS = [\n"
    for question_id in last_n_ids:
        new_content += f"  '{question_id}',\n"
    new_content += "];\n"
    
    # Write back to file
    file_path.write_text(new_content)
    print(f"Successfully updated {file_path} with {len(last_n_ids)} items")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python 3_keep_last_n_items.py <file_path> <n>")
        print("Example: python 3_keep_last_n_items.py ../data/bio/_2025.js 60")
        sys.exit(1)
    
    file_path = sys.argv[1]
    try:
        n = int(sys.argv[2])
        if n <= 0:
            print("Error: N must be a positive integer")
            sys.exit(1)
    except ValueError:
        print("Error: N must be a valid integer")
        sys.exit(1)
    
    keep_last_n_items(file_path, n)
