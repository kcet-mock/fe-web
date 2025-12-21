# Copilot Instructions for KCET Question Generation

## Question Data Structure

When generating or working with questions, follow this exact JSON structure:

### Schema Overview

```json
{
  "id": "uuid-string",
  "question": ["text or image path", ...],
  "choices": [
    ["choice A text or image", ...],
    ["choice B text or image", ...],
    ["choice C text or image", ...],
    ["choice D text or image", ...]
  ],
  "correctAnswer": 0,
  "explanation": ["explanation text or image", ...]
}
```

### Field Specifications

#### `id` (string, required)
- Must be a valid UUID v4
- Format: `"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"`
- Example: `"68764b0a-9d80-4a0a-9b82-15611e1a0f28"`

#### `question` (array, required)
- An array that can contain strings and/or image paths in any order
- Strings contain the question text
- Image paths follow the format: `"images/{uuid}.png"`
- Example:
  ```json
  [
    "The students identify the given pedigree chart as",
    "images/90cfa405-4e3e-4b81-a061-0156baeb44c0.png"
  ]
  ```

#### `choices` (array of arrays, required)
- Must contain exactly 4 choices (array of 4 arrays)
- Each choice is itself an array that can contain strings and/or image paths
- Choices can mix text and images as needed
- Example:
  ```json
  [
    ["Autosomal recessive"],
    ["Sex-linked dominant"],
    ["Sex-linked recessive"],
    ["Autosomal dominant"]
  ]
  ```
- Choices with images:
  ```json
  [
    ["Choice text", "images/{uuid}.png"],
    ["Another choice"],
    ["images/{uuid}.png", "with text after"],
    ["Plain text choice"]
  ]
  ```

#### `correctAnswer` (number, required)
- Zero-based index of the correct choice
- Must be 0, 1, 2, or 3
- Example: `1` means the second choice is correct

#### `explanation` (array, required)
- An array that can contain strings and/or image paths in any order
- Provides detailed explanation for the correct answer
- Example:
  ```json
  [
    "In the given pedigree chart, the trait appears in every generation and affects",
    "images/90cfa405-4e3e-4b81-a061-0156baeb44c0.png",
    "both males and females equally"
  ]
  ```

### Important Rules

1. **Array-based Content**: All content fields (`question`, `choices`, `explanation`) are arrays, even if they contain only text
2. **Mixed Content**: Strings and image paths can be intermixed in any order within these arrays
3. **Image Path Format**: Always use `"images/{uuid}.png"` format for image references
4. **Choices Structure**: Each choice must be an array (even single-text choices like `["Text"]`)
5. **Zero-indexed Answers**: Answer indices start at 0 (0-3 for four choices)
6. **Math/LaTeX Content**: Wrap mathematical expressions in `<katex>` tags with LaTeX inside `$` or `$$`

### Math Content with KaTeX

The application uses KaTeX to render mathematical expressions. To include math in questions, choices, or explanations:

**Format**: `"<katex>$LaTeX_expression$</katex>"` for inline math or `"<katex>$$LaTeX_expression$$</katex>"` for display math

**Examples**:
```json
{
  "question": [
    "What is the value of <katex>$\\sqrt{144}$</katex>?"
  ],
  "choices": [
    ["<katex>$60^{\\circ}$</katex>"],
    ["<katex>$90^{\\circ}$</katex>"],
    ["<katex>$45^{\\circ}$</katex>"],
    ["Zero"]
  ],
  "explanation": [
    "The torque on a magnetic dipole is given by <katex>$\\tau = MB \\sin \\theta$</katex>.",
    "For zero torque, <katex>$\\sin \\theta = 0$</katex>."
  ]
}
```

**Usage Notes**:
- Can be used inline within text in `question`, `choices`, and `explanation` arrays
- Wrap math content with `<katex>` and `</katex>` tags
- Put LaTeX inside `$...$` (inline) or `$$...$$` (display) within the katex tags
- Remember to escape backslashes in JSON: use `\\` for LaTeX commands
- Multiple katex blocks can be used in the same string
- Example: `"The angle is <katex>$90^{\\circ}$</katex> at position <katex>$x=0$</katex>."`

### Complete Example

```json
{
  "id": "68764b0a-9d80-4a0a-9b82-15611e1a0f28",
  "question": [
    "The students identify the given pedigree chart as",
    "images/90cfa405-4e3e-4b81-a061-0156baeb44c0.png"
  ],
  "choices": [
    ["Autosomal recessive"],
    ["Sex-linked dominant"],
    ["Sex-linked recessive"],
    ["Autosomal dominant"]
  ],
  "correctAnswer": 1,
  "explanation": [
    "In the given pedigree chart, the trait appears in every generation and affects",
    "images/90cfa405-4e3e-4b81-a061-0156baeb44c0.png",
    "both males and females equally"
  ]
}
```

### When Generating Questions

1. Always generate a new UUID v4 for the `id` field
2. Structure text and images appropriately in arrays
3. Ensure exactly 4 choices are provided
4. Verify the `correctAnswer` index matches the correct choice (0-3)
5. Provide clear, educational explanations
6. Use proper image paths when referencing diagrams, charts, or illustrations
7. Maintain consistent JSON formatting with proper indentation

### File Organization

- Questions are organized by subject: `data/bio/`, `data/chem/`, `data/mat/`, `data/phy/`
- Each question is stored in a separate JSON file named `{uuid}.json`
- An `_all.js` file in each subject directory aggregates all questions
