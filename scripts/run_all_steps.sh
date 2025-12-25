#!/bin/bash


# Check if required arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <subject> <year> [num_questions]"
    echo "Example: $0 mat 2023 60"
    exit 1
fi

SUBJECT=$1
YEAR=$2
NUM_QUESTIONS=${3:-60}  # Default to 60 if not provided

DATA_DIR="../data/${SUBJECT}/"

# Step 0: Check if questions count is 60
QUESTION_COUNT=$(python3 -c "import json; print(len(json.load(open('questions.json'))))")
if [ "$QUESTION_COUNT" -ne 60 ]; then
    echo "Error: Expected 60 questions, but found ${QUESTION_COUNT} in questions.json"
    exit 1
fi
python3 ./1_convert_questions_to_uuid.py questions.json "${DATA_DIR}"
python3 ./2_copy_all_to_year.py "${DATA_DIR}" "${YEAR}"
python3 ./3_keep_last_n_items.py "${DATA_DIR}_${YEAR}.js" "${NUM_QUESTIONS}"
python3 ./4_add_years_to_questions.py "${DATA_DIR}"
echo "All steps completed for ${SUBJECT}."