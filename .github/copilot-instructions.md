**Version: 2.0.0**

# Copilot Instructions for KCET Question Generation

## Quick Reference Table

| Rule | Description |
|------|-------------|
| Arrays | All content fields (`question`, `choices`, `explanation`) are arrays, even if only text |
| Mixed Content | Strings and image paths can be intermixed in any order |
| Table Format | Tables must be a single string in the array (not split across elements) |
| Images | Use `"images/{uuid}.png"` format for image references |
| Choices | Each choice is an array (even single-text choices like `["Text"]`) |
| Answer Index | Zero-based (0-3 for four choices) |
| Math | Use `<katex>$...$</katex>` or `<katex>$$...$$</katex>` for math |
| Markdown | Supports tables, lists, bold, italic, etc. |

---

## Content Formatting Rules

1. **Array-based Content**: All content fields (`question`, `choices`, `explanation`) are arrays, even if they contain only text.
2. **Mixed Content**: Strings and image paths can be intermixed in any order within these arrays.
3. **Table Format**: If a table is present in a question, choice, or explanation, the entire table **must be included as a single string** within the array (do not split table rows or lines into separate array elements).
4. **Image Path Format**: Always use `"images/{uuid}.png"` format for image references.
5. **Choices Structure**: Each choice must be an array (even single-text choices like `["Text"]`).
6. **Zero-indexed Answers**: Answer indices start at 0 (0-3 for four choices).
  - If the source paper uses 1, 2, 3, 4 for answers, you must subtract 1 to convert to the correct zero-based index (i.e., 1→0, 2→1, 3→2, 4→3).
  - If the source paper uses A, B, C, D for answers, use 0, 1, 2, 3 respectively (A→0, B→1, C→2, D→3).
7. **Math/LaTeX Content**: Wrap mathematical expressions in `<katex>` tags with LaTeX inside `$` or `$$`.
8. **Markdown Support**: Text content supports Markdown formatting including tables, lists, bold, italic, etc.

---

## Markdown Support

The application supports GitHub Flavored Markdown (GFM) in all text content. This enables rich formatting:

**Supported Features**:
- **Tables** - Create data tables with proper formatting in Markdown as a single string
- **Lists** - Both ordered (numbered) and unordered (bullet) lists
- **Bold** - Use `**text**` or `__text__`
- **Italic** - Use `*text*` or `_text_`
- **Line breaks** - Use two spaces at end of line or blank line for paragraphs

**Example with table in question**:
```json
{
  "question": [
    "Refer to the table below:\n\n| Element | Symbol | Atomic Number |\n|---------|--------|---------------|\n| Hydrogen| H      | 1             |\n| Oxygen  | O      | 8             |\n\nWhich element has atomic number 8?"
  ]
}
```

**Usage Notes**:
- Cells can contain any text, including math expressions
- Markdown can be mixed with `<katex>` tags for math
- Example: `"The value is **bold** and equals <katex>$x^2$</katex>"`

---

## Math Content with KaTeX

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

---

## Question Data Structure

When generating or working with questions, follow this exact JSON structure:

### Schema Overview

```json
{
  "id": "year-subject-number",
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
- For year-based papers, must be in the format: `<year>-<sub>-<n>`
  - `<year>`: 4-digit year (e.g., 2025)
  - `<sub>`: subject code (`bio`, `chem`, `phy`, `mat`)
  - `<n>`: question number (1-based, e.g., 1, 2, ..., 60)
- Example: `"2025-phy-1"`, `"2025-bio-23"`
- The order of questions in the file must be maintained (do not shuffle or randomize).

For non-year-based or random questions, use a valid UUID v4:
- Format: `"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"`
- Example: `"68764b0a-9d80-4a0a-9b82-15611e1a0f28"`

#### `question` (array, required)
- An array that can contain strings and/or image paths in any order
- Strings contain the question text
- Image paths must use the format: `"images/{question.id}-1.png"`, `"images/{question.id}-2.png"`, etc., where the number is unique per image in the question (including choices and explanation if needed).
- Example:
  ```json
  [
    "The students identify the given pedigree chart as",
    "images/2025-phy-1-1.png"
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

---

## When Generating Questions

1. Always generate a new ID in the format `year-subject-number` for the `id` field
2. Structure text and images appropriately in arrays
3. Ensure exactly 4 choices are provided
4. Verify the `correctAnswer` index matches the correct choice (0-3)
5. Provide clear, educational explanations
6. Use proper image paths when referencing diagrams, charts, or illustrations
7. Maintain consistent JSON formatting with proper indentation

---

## File Organization

- Questions are organized by subject: `data/bio/`, `data/chem/`, `data/mat/`, `data/phy/`
- Each question is stored in a separate JSON file named `{year-subject-number}.json`
- An `_all.js` file in each subject directory aggregates all questions


Create list of all 60 questions for attached pdf - 2025 phy