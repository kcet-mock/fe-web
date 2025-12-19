#!/usr/bin/env python3
import json
import os
from pathlib import Path
from pdf2image import convert_from_path
from PIL import Image

def get_question_page_mapping():
    """
    Map question numbers to their approximate page numbers in the PDF.
    Based on typical exam format with ~15 questions per page.
    """
    # Manually map based on observed structure
    # You may need to adjust these based on actual PDF layout
    mappings = {
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 2,
        9: 2,
        10: 2,
        11: 2,
        12: 2,
        13: 2,
        14: 2,
        15: 3,
        # Add more mappings...
        # For now, estimate: question number / 7 + 1
    }
    
    def estimate_page(q_num):
        if q_num in mappings:
            return mappings[q_num]
        # Estimate: approximately 7 questions per page
        return (q_num - 1) // 7 + 1
    
    return estimate_page

def extract_question_images():
    """Extract images for questions that need them"""
    # Load the list of questions needing images
    with open('/Users/avinashks/Documents/GitHub/kcet/chem_images_needed.json', 'r') as f:
        images_needed = json.load(f)
    
    pdf_path = '/Users/avinashks/Documents/GitHub/kcet/public/pdfs/2025/chem.pdf'
    output_dir = Path('/Users/avinashks/Documents/GitHub/kcet/public/images')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    get_page = get_question_page_mapping()
    
    print(f"Converting PDF to images...")
    # Convert all PDF pages to images
    # This might take a while
    images = convert_from_path(pdf_path, dpi=200)
    print(f"Converted {len(images)} pages")
    
    # Process each question that needs an image
    for item in images_needed:
        q_num = item['number']
        q_id = item['id']
        
        page_num = get_page(q_num)
        
        if page_num <= len(images):
            # Save the full page for manual cropping
            # In a production system, you'd crop to the specific question
            page_img = images[page_num - 1]
            
            # Save image with question ID
            image_path = output_dir / f"{q_id}.png"
            page_img.save(image_path, 'PNG')
            
            print(f"Question {q_num}: Saved page {page_num} to {q_id}.png")
            print(f"   (You'll need to manually crop this to show only the table)")
        else:
            print(f"Question {q_num}: Page {page_num} not found")
    
    print(f"\n✅ Images saved to {output_dir}")
    print(f"\n⚠️  Next steps:")
    print("1. Manually review and crop each image to show only the relevant table/diagram")
    print("2. Update the JSON files to reference these images")

def update_json_with_images():
    """Update JSON files to reference the created images"""
    with open('/Users/avinashks/Documents/GitHub/kcet/chem_images_needed.json', 'r') as f:
        images_needed = json.load(f)
    
    data_dir = Path('/Users/avinashks/Documents/GitHub/kcet/data/chem')
    
    for item in images_needed:
        q_id = item['id']
        json_file = data_dir / f"{q_id}.json"
        
        if json_file.exists():
            with open(json_file, 'r') as f:
                data = json.load(f)
            
            # Add image reference to question
            if 'images' not in str(data['question']):
                data['question'].append(f"images/{q_id}.png")
            
            with open(json_file, 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"Updated {q_id}.json with image reference")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'extract':
        extract_question_images()
    elif len(sys.argv) > 1 and sys.argv[1] == 'update':
        update_json_with_images()
    else:
        print("Usage:")
        print("  python3 extract_images.py extract  # Extract images from PDF")
        print("  python3 extract_images.py update   # Update JSON files with image refs")
