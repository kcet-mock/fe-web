KCET is a Karnataka CET mock website (Next.js project).

## Features implemented

1. Landing page with 2 major actions:
	- Option 1: Take mock test
	- Option 2: Previous exam papers
2. Mock test page (`/mock-test`):
	- Starts a full-length test with a visible countdown timer
	- Timer can be started, paused and resumed
	- When time reaches 0, the test automatically ends
    - should be single scroll page
3. Previous papers page (`/previous-papers`):
	- Year-wise and subject-wise filters
	- List of papers with PDF download links (sample data; replace with real PDFs)
4. **Analytics tracking** with Mixpanel:
	- User engagement metrics
	- Learning performance tracking
	- Question-level analytics
	- See [ANALYTICS.md](ANALYTICS.md) for full documentation

## Getting started

1. Install dependencies:

	```bash
	npm install
	```

2. Configure environment variables:

	Create or update `.env` file:
	```bash
	NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token_here
	```
	See [ANALYTICS.md](ANALYTICS.md) for analytics setup.

3. Run the development server:

	```bash
	npm run dev
	```

4. Open in your browser:

	- http://localhost:3000/ → Landing page
	- http://localhost:3000/mock-test → Mock test with timer
	- http://localhost:3000/previous-papers → Previous exam papers

## Notes

- The question content and PDF URLs are placeholders. Replace them with real KCET questions and actual PDF file paths or static files in the `public` folder.



Convert to PDF attachment json format
if the question or choice has an image use image/<random-uuid>.jpg as placeholder
```
[
	{
		"answer": 2,
		"id": "dec5bb5c-1e49-4606-a2d4-41decdf76515",
		"question": [
			"In zygote intrafallopian tube transfer, the embryo upto ______ stage is transferred into the fallopian tube"
		],
		"options": [
			["16 blastomeres"],
			["8 blastomeres"],
			["32 blastomeres"],
			["2 blastomeres"]
		]
	}
]
```
