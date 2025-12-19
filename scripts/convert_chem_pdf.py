#!/usr/bin/env python3
import json
import re
import uuid
from pathlib import Path
import PyPDF2

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
    return text

def parse_questions(text):
    """Parse questions from extracted text"""
    questions = []
    
    # Split by question numbers (assuming format like "1.", "2.", etc.)
    # This is a basic parser - we'll refine based on actual PDF structure
    lines = text.split('\n')
    
    current_question = None
    current_options = []
    current_text = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if line starts with a number followed by period (question start)
        question_match = re.match(r'^(\d+)\.\s+(.+)', line)
        if question_match:
            # Save previous question if exists
            if current_question is not None:
                questions.append({
                    'question_text': current_text,
                    'options': current_options,
                    'answer': None  # Will be set later
                })
            
            # Start new question
            current_question = question_match.group(1)
            current_text = [question_match.group(2)]
            current_options = []
        
        # Check if line is an option (a), b), c), d))
        option_match = re.match(r'^([a-d])\)\s*(.+)', line, re.IGNORECASE)
        if option_match and current_question is not None:
            current_options.append(option_match.group(2))
        elif current_question is not None and not option_match:
            # Continue question text
            if not re.match(r'^[a-d]\)', line, re.IGNORECASE):
                current_text.append(line)
    
    # Add last question
    if current_question is not None:
        questions.append({
            'question_text': current_text,
            'options': current_options,
            'answer': None
        })
    
    return questions

def create_question_json(question_data, answer_num):
    """Create JSON structure for a question"""
    question_id = str(uuid.uuid4())
    
    return {
        'id': question_id,
        'question': question_data['question_text'],
        'options': [[opt] for opt in question_data['options']],
        'answer': answer_num
    }

def main():
    # Paths
    pdf_path = Path('/Users/avinashks/Documents/GitHub/kcet/public/pdfs/2025/chem.pdf')
    output_dir = Path('/Users/avinashks/Documents/GitHub/kcet/data/chem')
    
    # Extract text
    print("Extracting text from PDF...")
    text = extract_pdf_text(pdf_path)
    
    # Save raw text for inspection
    with open('/Users/avinashks/Documents/GitHub/kcet/chem_extracted.txt', 'w') as f:
        f.write(text)
    print(f"Raw text saved to chem_extracted.txt")
    
    # Parse questions
    print("Parsing questions...")
    questions = parse_questions(text)
    print(f"Found {len(questions)} questions")
    
    # Print first few for inspection
    print("\nFirst 3 questions:")
    for i, q in enumerate(questions[:3]):
        print(f"\nQuestion {i+1}:")
        print(f"Text: {q['question_text']}")
        print(f"Options: {q['options']}")

if __name__ == '__main__':
    main()
