#!/usr/bin/env python3
import json
import re
import uuid
from pathlib import Path

def parse_chemistry_questions(text):
    """Parse chemistry questions from extracted PDF text"""
    questions = []
    
    # Split by question numbers
    question_pattern = r'^\d+\.\s+'
    lines = text.split('\n')
    
    current_question = {
        'number': None,
        'question_text': [],
        'options': [],
        'answer': None
    }
    
    state = 'searching'  # States: searching, in_question, in_options, in_answer
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
        
        # Check for question start
        question_match = re.match(r'^(\d+)\.\s+(.+)', line)
        if question_match:
            # Save previous question if it has content
            if current_question['number'] is not None and current_question['options']:
                questions.append(current_question.copy())
            
            # Start new question
            current_question = {
                'number': int(question_match.group(1)),
                'question_text': [question_match.group(2)],
                'options': [],
                'answer': None
            }
            state = 'in_question'
            continue
        
        # Check for options (1), (2), (3), (4)
        option_match = re.match(r'^\((\d)\)\s+(.+)', line)
        if option_match and state in ['in_question', 'in_options']:
            current_question['options'].append(option_match.group(2))
            state = 'in_options'
            continue
        
        # Check for answer
        answer_match = re.match(r'^Ans\.\s*(\d+)', line)
        if answer_match:
            current_question['answer'] = int(answer_match.group(1))
            state = 'in_answer'
            continue
        
        # Check for solution (marks end of current question)
        if re.match(r'^Solution\s*:', line):
            if current_question['number'] is not None and current_question['options']:
                questions.append(current_question.copy())
                current_question = {
                    'number': None,
                    'question_text': [],
                    'options': [],
                    'answer': None
                }
            state = 'searching'
            continue
        
        # Add to question text if we're in a question
        if state == 'in_question':
            # Don't add if it looks like a header or page marker
            if not re.match(r'(KCET-2025|Chemistry|TEST PAPER|^\s*E\s*$|^\d+\s+E\s*$)', line):
                current_question['question_text'].append(line)
    
    # Add last question
    if current_question['number'] is not None and current_question['options']:
        questions.append(current_question.copy())
    
    return questions

def has_table_or_image_marker(text):
    """Check if question text contains markers that suggest a table or image"""
    text_str = ' '.join(text) if isinstance(text, list) else text
    
    # Markers for tables/images
    markers = [
        r'List-I.*List-II',
        r'Match.*with',
        r'following\s+table',
        r'following\s+diagram',
        r'following\s+figure',
        r'shown\s+below',
        r'given\s+below',
        r'structure.*below'
    ]
    
    for marker in markers:
        if re.search(marker, text_str, re.IGNORECASE):
            return True
    
    return False

def create_question_files(questions, output_dir):
    """Create individual JSON files for each question"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    all_ids = []
    
    for q in questions:
        question_id = str(uuid.uuid4())
        all_ids.append(question_id)
        
        # Prepare question data
        question_data = {
            'id': question_id,
            'question': q['question_text'],
            'options': [[opt] for opt in q['options']],
            'answer': q['answer']
        }
        
        # Check if it might have an image/table
        if has_table_or_image_marker(q['question_text']):
            print(f"Question {q['number']} might have a table/image: {' '.join(q['question_text'][:100])}")
        
        # Write JSON file
        output_file = output_dir / f"{question_id}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(question_data, f, indent=2, ensure_ascii=False)
    
    return all_ids

def create_all_js(question_ids, output_dir):
    """Create _all.js file with all question IDs"""
    output_file = Path(output_dir) / '_all.js'
    
    content = "export const ALL_QUESTION_IDS = [\n"
    for qid in question_ids:
        content += f"  '{qid}',\n"
    content += "];\n"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    # Read extracted text
    with open('/Users/avinashks/Documents/GitHub/kcet/chem_extracted.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    
    # Parse questions
    print("Parsing questions...")
    questions = parse_chemistry_questions(text)
    print(f"Found {len(questions)} questions")
    
    # Print first few for verification
    print("\nFirst 3 questions:")
    for q in questions[:3]:
        print(f"\nQuestion {q['number']}:")
        print(f"Text: {' '.join(q['question_text'][:100])}")
        print(f"Options: {len(q['options'])} options")
        print(f"Answer: {q['answer']}")
    
    # Save questions with missing answers
    questions_without_answers = [q for q in questions if q['answer'] is None]
    if questions_without_answers:
        print(f"\n⚠️  Warning: {len(questions_without_answers)} questions without answers:")
        for q in questions_without_answers:
            print(f"  Question {q['number']}")
    
    # Create JSON files
    print(f"\nCreating JSON files in data/chem/...")
    output_dir = '/Users/avinashks/Documents/GitHub/kcet/data/chem'
    all_ids = create_question_files(questions, output_dir)
    
    # Create _all.js
    print("Creating _all.js...")
    create_all_js(all_ids, output_dir)
    
    print(f"\n✅ Created {len(all_ids)} question files in {output_dir}")

if __name__ == '__main__':
    main()
