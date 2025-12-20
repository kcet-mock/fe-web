#!/usr/bin/env python3
import sys
import shutil
from pathlib import Path
from datetime import datetime

def copy_all_to_year(directory):
    """Copy _all.js to _<year>.js in the specified directory"""
    dir_path = Path(directory)
    
    if not dir_path.exists():
        print(f"Error: Directory '{directory}' does not exist")
        sys.exit(1)
    
    all_file = dir_path / "_all.js"
    if not all_file.exists():
        print(f"Error: _all.js not found in '{directory}'")
        sys.exit(1)
    
    # Get current year
    year = datetime.now().year
    year_file = dir_path / f"_{year}.js"
    
    # Copy the file
    shutil.copy2(all_file, year_file)
    print(f"Successfully copied {all_file} to {year_file}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python 2_copy_all_to_year.py <directory>")
        print("Example: python 2_copy_all_to_year.py ../data/bio")
        sys.exit(1)
    
    copy_all_to_year(sys.argv[1])
