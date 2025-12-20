#!/usr/bin/env python3
import sys
import shutil
from pathlib import Path

def copy_all_to_year(directory, year):
    """Copy _all.js to _<year>.js in the specified directory"""
    dir_path = Path(directory)
    
    if not dir_path.exists():
        print(f"Error: Directory '{directory}' does not exist")
        sys.exit(1)
    
    all_file = dir_path / "_all.js"
    if not all_file.exists():
        print(f"Error: _all.js not found in '{directory}'")
        sys.exit(1)
    
    year_file = dir_path / f"_{year}.js"
    
    # Copy the file
    shutil.copy2(all_file, year_file)
    print(f"Successfully copied {all_file} to {year_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python 2_copy_all_to_year.py <directory> <year>")
        print("Example: python 2_copy_all_to_year.py ../data/bio 2025")
        sys.exit(1)
    
    copy_all_to_year(sys.argv[1], sys.argv[2])
