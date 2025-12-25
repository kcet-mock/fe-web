#!/usr/bin/env python3
"""
Script to add a 'years' field (list of numbers) to each question in a directory.
Usage: python add_years_to_questions.py <directory> [--years 2023 2024]
"""

import json
import os
import sys
import argparse
from pathlib import Path


import re

def extract_years_from_filename(filename):
    # Match patterns like 2023-bio-1.json or 2024-chem-12.json
    match = re.match(r"(\d{4})(?:-(\w+)-(\d+))?\.json$", filename)
    if match:
        year = int(match.group(1))
        return [year]
    return []

def add_years_to_question(file_path, force=False):
    """Add years field to a question JSON file based on filename."""
    try:
        years_list = extract_years_from_filename(file_path.name)
        if not years_list:
            print(f"  Skipping {file_path.name} - could not extract year from filename")
            return False
        with open(file_path, 'r', encoding='utf-8') as f:
            question = json.load(f)
        # Check if years field exists
        if 'years' in question and not force:
            print(f"  Skipping {file_path.name} - already has 'years' field (use --force to overwrite)")
            return False
        # Add or update years field
        question['years'] = years_list
        # Write back to file with proper formatting
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(question, f, indent=2, ensure_ascii=False)
        return True
    except json.JSONDecodeError as e:
        print(f"  Error parsing {file_path.name}: {e}")
        return False
    except Exception as e:
        print(f"  Error processing {file_path.name}: {e}")
        return False


def process_directory(directory, force=False):
    """Process all JSON files in the directory, setting years from filename."""
    directory_path = Path(directory)
    if not directory_path.exists():
        print(f"Error: Directory '{directory}' does not exist")
        return
    if not directory_path.is_dir():
        print(f"Error: '{directory}' is not a directory")
        return
    # Get all JSON files except _all.json
    json_files = [f for f in directory_path.glob('*.json') if f.name != '_all.json']
    if not json_files:
        print(f"No JSON files found in '{directory}'")
        return
    print(f"Processing {len(json_files)} files in '{directory}'...")
    if force:
        print("Force mode: ON (will overwrite existing 'years' fields)")
    updated_count = 0
    for json_file in sorted(json_files):
        if add_years_to_question(json_file, force):
            updated_count += 1
    print(f"\nCompleted! Updated {updated_count} out of {len(json_files)} files.")


def main():
    parser = argparse.ArgumentParser(
        description='Add years field to question JSON files based on filename',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Add years field to all questions in bio directory based on filename
  python 4_add_years_to_questions.py data/bio/
  # Force overwrite existing years fields
  python 4_add_years_to_questions.py data/bio/ --force
        """
    )
    parser.add_argument('directory', help='Directory containing question JSON files')
    parser.add_argument('--force', action='store_true', 
                        help='Overwrite existing years field if present')
    args = parser.parse_args()
    process_directory(args.directory, args.force)


if __name__ == '__main__':
    main()
