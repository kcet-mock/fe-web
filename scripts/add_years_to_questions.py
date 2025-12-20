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


def add_years_to_question(file_path, years_list, force=False):
    """Add years field to a question JSON file."""
    try:
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

, force=False):
    """Process all JSON files in the directory."""
    directory_path = Path(directory)
    
    if not directory_path.exists():
        print(f"Error: Directory '{directory}' does not exist")
        return
    
    if not directory_path.is_dir():
        print(f"Error: '{directory}' is not a directory")
        return
    
    # Get all JSON files except _all.js
    json_files = [f for f in directory_path.glob('*.json') if f.name != '_all.json']
    
    if not json_files:
        print(f"No JSON files found in '{directory}'")
        return
    
    print(f"Processing {len(json_files)} files in '{directory}'...")
    print(f"Adding years: {years_list}")
    if force:
        print("Force mode: ON (will overwrite existing 'years' fields)")
    
    updated_count = 0
    for json_file in sorted(json_files):
        if add_years_to_question(json_file, years_list, force
        if add_years_to_question(json_file, years_list):
            updated_count += 1
    
    print(f"\nCompleted! Updated {updated_count} out of {len(json_files)} files.")


def main():
    parser = argparse.ArgumentParser(
        description='Add years field to question JSON files',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Add empty years list to all questions in bio directory
  python add_years_to_questions.py data/bio/
  
  # Add specific years to all questions
  pyForce overwrite existing years fields
  python add_years_to_questions.py data/bio/ --years 2025 --force
  
  # thon add_years_to_questions.py data/bio/ --years 2023 2024
  
  # Process multiple subjects
  python add_years_to_questions.py data/chem/ --years 2023
        """
    )
    
    parser.add_argument('--force', action='store_true', 
                        help='Overwrite existing years field if present')
    
    args = parser.parse_args()
    
    process_directory(args.directory, args.years, args.force
    args = parser.parse_args()
    
    process_directory(args.directory, args.years)


if __name__ == '__main__':
    main()
