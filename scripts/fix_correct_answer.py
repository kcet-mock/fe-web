#!/usr/bin/env python3
import os
import sys
import json

def process_json_file(filepath, year):
	with open(filepath, 'r', encoding='utf-8') as f:
		data = json.load(f)
	changed = False
	# Only process if the year is in the 'years' field
	if 'years' in data and isinstance(data['years'], list) and year in data['years']:
		if 'correctAnswer' in data and isinstance(data['correctAnswer'], int):
			if data['correctAnswer'] != 0:
				data['correctAnswer'] += 1
				changed = True
	if changed:
		with open(filepath, 'w', encoding='utf-8') as f:
			json.dump(data, f, ensure_ascii=False, indent=2)

def main():
	if len(sys.argv) != 3:
		print('Usage: python fix_correct_answer.py <directory> <year>')
		sys.exit(1)
	dir_path = sys.argv[1]
	try:
		year = int(sys.argv[2])
	except ValueError:
		print('Year must be an integer')
		sys.exit(1)
	for root, _, files in os.walk(dir_path):
		for file in files:
			if file.endswith('.json'):
				process_json_file(os.path.join(root, file), year)

if __name__ == '__main__':
	main()
