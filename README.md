# KCET Mock Test Platform

A comprehensive web application for Karnataka Common Entrance Test (KCET) preparation, built with Next.js. This platform provides an interactive mock test environment with authentic exam questions, detailed explanations, and performance analytics.

## 🌟 Features

### Mock Test System
- **Full-length timed tests** with countdown timer (start, pause, resume)
- **Auto-submit** when time expires
- **Single-scroll interface** for seamless test-taking experience
- **Subject-wise tests**: Biology, Chemistry, Mathematics, and Physics
- **Year-specific practice**: Access past papers from 2023-2025
- **Random question mode**: Practice with shuffled questions across years

### Rich Question Content
- **720 authentic KCET questions** (180 per subject)
- **KaTeX support** for mathematical expressions and formulas
- **GitHub Flavored Markdown** for tables, lists, and formatted text
- **Image support** for diagrams, charts, and visual questions
- **Detailed explanations** with step-by-step solutions
- **Mixed content arrays** (seamlessly combine text and images)

### Previous Papers Archive
- Browse and practice year-wise exam papers
- Filter by year (2023, 2024, 2025) and subject
- Download PDF versions of complete papers

### Analytics & Performance Tracking
- **Mixpanel integration** for comprehensive user analytics
- Track question-level performance and accuracy
- Monitor time spent per question
- Identify weak areas and improvement patterns
- Dashboard for learning insights and progress monitoring

See [ANALYTICS.md](ANALYTICS.md) for detailed analytics documentation.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kcet-mock/fe-web.git
   cd fe-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token_here
   ```
   
   > **Note**: Analytics are optional. The app works without Mixpanel token, but tracking will be disabled.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in your browser**
   - **Landing page**: http://localhost:3000/
   - **Mock test**: http://localhost:3000/mock-test
   - **Previous papers**: http://localhost:3000/previous-papers

## 📁 Project Structure

```
fe-web/
├── components/          # Reusable React components
│   ├── RenderContent.js    # Content renderer with markdown & KaTeX
│   ├── RenderWithKatex.js  # KaTeX math expression renderer
│   └── TopNav.js           # Navigation component
├── data/               # Question database (720 questions)
│   ├── bio/              # Biology questions (180)
│   ├── chem/             # Chemistry questions (180)
│   ├── mat/              # Mathematics questions (180)
│   └── phy/              # Physics questions (180)
├── lib/                # Utility libraries
│   └── analytics.js      # Mixpanel analytics service
├── pages/              # Next.js pages
│   ├── index.js          # Landing page
│   ├── mock-test/        # Mock test pages
│   ├── previous-papers.js # Previous papers browser
│   └── results/          # Test results pages
├── public/             # Static assets
│   └── images/           # Question images and diagrams
├── scripts/            # Build and utility scripts
│   └── build_static.mjs  # Static site generation
└── styles/             # CSS stylesheets
```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with internal pages enabled |
| `npm run dev:internal` | Start internal question management server |
| `npm run build` | Build static site for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint for code quality |

## 🎯 Question Data Format

Questions follow a standardized JSON schema:

```json
{
  "id": "2025-phy-1",
  "question": [
    "Question text here",
    "images/2025-phy-1-1.png"
  ],
  "choices": [
    ["Choice A text"],
    ["Choice B with <katex>$formula$</katex>"],
    ["Choice C"],
    ["Choice D"]
  ],
  "correctAnswer": 0,
  "explanation": [
    "Detailed explanation with steps",
    "Can include <katex>$math$</katex> and images"
  ]
}
```

### Key Format Rules
- **ID format**: `{year}-{subject}-{number}` (e.g., "2025-phy-1")
- **Array-based content**: All fields support mixed text and image arrays
- **Zero-indexed answers**: 0-3 for four choices (A-D)
- **KaTeX math**: Use `<katex>$expression$</katex>` for formulas
- **Markdown support**: Tables, lists, bold, italic in text content

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for comprehensive format documentation.

## 🛠️ Technology Stack

- **Framework**: Next.js 16
- **UI Library**: React 19
- **Math Rendering**: KaTeX
- **Markdown**: react-markdown with GFM support
- **Analytics**: Mixpanel
- **Styling**: Custom CSS
- **Build Tool**: Custom static generation

## 📊 Question Bank Statistics

- **Total Questions**: 720
- **Biology**: 180 questions (2023-2025)
- **Chemistry**: 180 questions (2023-2025)
- **Mathematics**: 180 questions (2023-2025)
- **Physics**: 180 questions (2023-2025)

## 🤝 Contributing

Contributions are welcome! To add or update questions:

1. Follow the question data format specified above
2. Place question files in the appropriate subject directory (`data/{subject}/`)
3. Use the naming convention: `{year}-{subject}-{number}.json`
4. Ensure images are placed in `public/images/`
5. Run `npm run build` to regenerate aggregated data files

## 📚 Documentation

- [Analytics Implementation](ANALYTICS.md) - Detailed Mixpanel setup and tracking
- [Analytics Implementation Guide](ANALYTICS_IMPLEMENTATION.md) - Technical analytics details
- [Copilot Instructions](.github/copilot-instructions.md) - Question format specifications

## 📄 License

ISC

## 🔗 Links

- **Repository**: https://github.com/kcet-mock/fe-web
- **Issue Tracker**: https://github.com/kcet-mock/fe-web/issues

---

Made with ❤️ for KCET aspirants
