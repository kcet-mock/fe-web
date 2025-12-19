#!/usr/bin/env python3
import json
import re
import uuid
from pathlib import Path

def clean_line(line):
    """Clean up line from headers and markers"""
    # Remove page headers
    if re.match(r'(KCET-2025|Chemistry|TEST PAPER|^\s*E\s*$|^\d+\s+E\s*$|^Chemistry\s*$)', line.strip()):
        return None
    return line.strip()

def parse_chemistry_questions(text):
    """Parse chemistry questions from extracted PDF text"""
    questions = []
    lines = text.split('\n')
    
    i = 0
    while i < len(lines):
        line = clean_line(lines[i])
        if line is None:
            i += 1
            continue
        
        # Check for question start (number followed by period)
        question_match = re.match(r'^(\d+)\.\s+(.+)', line)
        if question_match:
            qnum = int(question_match.group(1))
            question_text = [question_match.group(2)]
            
            # Collect question text until we hit options
            i += 1
            options_text = []
            
            while i < len(lines):
                line = clean_line(lines[i])
                if line is None:
                    i += 1
                    continue
                
                # Check if this line contains options (has "(1)" pattern)
                if re.search(r'\(\d\)', line):
                    options_text.append(line)
                    # Continue collecting if more options on next lines
                    i += 1
                    while i < len(lines):
                        next_line = clean_line(lines[i])
                        if next_line and re.search(r'\(\d\)', next_line) and not re.match(r'^Ans\.', next_line):
                            options_text.append(next_line)
                            i += 1
                        else:
                            break
                    break
                elif re.match(r'^Ans\.', line):
                    # No options found, this might be malformed
                    break
                else:
                    question_text.append(line)
                    i += 1
            
            # Now parse options from collected lines
            options = []
            full_options_text = ' '.join(options_text)
            
            # Extract options using regex
            # Pattern: (1) text (2) text (3) text (4) text
            option_pattern = r'\((\d)\)\s+([^()]+?)(?=\s*\(\d\)|$)'
            matches = re.finditer(option_pattern, full_options_text)
            
            for match in matches:
                opt_num = int(match.group(1))
                opt_text = match.group(2).strip()
                options.append(opt_text)
            
            # Find answer
            answer = None
            while i < len(lines):
                line = clean_line(lines[i])
                if line is None:
                    i += 1
                    continue
                
                answer_match = re.match(r'^Ans\.\s*(\d+)', line)
                if answer_match:
                    answer = int(answer_match.group(1))
                    i += 1
                    break
                i += 1
            
            # Skip solution section
            while i < len(lines):
                line = clean_line(lines[i])
                if line and re.match(r'^\d+\.', line):
                    # Next question
                    break
                i += 1
            
            # Add question if it has options
            if options:
                questions.append({
                    'number': qnum,
                    'question_text': [t for t in question_text if t],
                    'options': options,
                    'answer': answer
                })
        else:
            i += 1
    
    return questions

def has_table_or_image_marker(text):
    """Check if question text contains markers that suggest a table or image"""
    text_str = ' '.join(text) if isinstance(text, list) else text
    
    markers = [
        r'List-I.*List-II',
        r'Match.*with',
        r'following\s+table',
        r'following\s+diagram',
        r'following\s+figure',
        r'shown\s+below',
        r'given\s+below',
        r'structure.*below',
        r'Match\s+the\s+following'
    ]
    
    for marker in markers:
        if re.search(marker, text_str, re.IGNORECASE):
            return True
    
    return False

def create_question_files(questions, output_dir):
    """Create individual JSON files for each question"""
    output_dir = Path(output_dir)
    
    all_ids = []
    images_needed = []
    
    for q in questions:
        question_id = str(uuid.uuid4())
        all_ids.append(question_id)
        
        # Check if it might have an image/table
        needs_image = has_table_or_image_marker(q['question_text'])
        
        # Prepare question data
        question_data = {
            'id': question_id,
            'question': q['question_text'],
            'options': [[opt] for opt in q['options']],
            'answer': q['answer']
        }
        
        if needs_image:
            images_needed.append({
                'number': q['number'],
                'id': question_id,
                'text': ' '.join(q['question_text'][:150])
            })
        
        # Write JSON file
        output_file = output_dir / f"{question_id}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(question_data, f, indent=2, ensure_ascii=False)
    
    return all_ids, images_needed

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
    print("\nFirst 5 questions:")
    for q in questions[:5]:
        print(f"\nQuestion {q['number']}:")
        print(f"Text: {' '.join(q['question_text'][:100])}")
        print(f"Options ({len(q['options'])}):")
        for i, opt in enumerate(q['options'], 1):
            print(f"  ({i}) {opt[:80]}...")
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
    all_ids, images_needed = create_question_files(questions, output_dir)
    
    # Create _all.js
    print("Creating _all.js...")
    create_all_js(all_ids, output_dir)
    
    print(f"\n✅ Created {len(all_ids)} question files in {output_dir}")
    
    if images_needed:
        print(f"\n📸 {len(images_needed)} questions need images/tables:")
        with open('/Users/avinashks/Documents/GitHub/kcet/chem_images_needed.json', 'w') as f:
            json.dump(images_needed, f, indent=2)
        print("   Saved list to chem_images_needed.json")
        
        for img in images_needed[:10]:
            print(f"\n  Q{img['number']} (ID: {img['id']}):")
            print(f"    {img['text'][:100]}...")

if __name__ == '__main__':
    main()
