import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  // Only allow in development or when explicitly enabled
  if (process.env.NEXT_PUBLIC_INTERNAL_PAGES !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method === 'GET') {
    const { full, subject, year } = req.query;

    try {
      // Determine which subjects to load
      const subjects = subject ? [subject] : ['bio', 'chem', 'phy', 'mat'];
      const allQuestions = [];

      for (const subj of subjects) {
        const subjectDir = path.join(process.cwd(), 'data', subj);
        
        try {
          let ids = [];
          
          // Load question IDs based on year filter
          if (year && year !== 'all') {
            // Load year-specific IDs
            try {
              const yearModule = await import(`../../../data/${subj}/_${year}.js`);
              ids = Array.isArray(yearModule.QUESTION_IDS) ? yearModule.QUESTION_IDS : [];
            } catch (err) {
              console.error(`Failed to load year ${year} for subject ${subj}:`, err);
            }
          } else {
            // Load all IDs
            const allModule = await import(`../../../data/${subj}/_all.js`);
            ids = Array.isArray(allModule.QUESTION_IDS) ? allModule.QUESTION_IDS : [];
          }

          if (full === '1' || full === 'true') {
            // Load full question data
            for (const id of ids) {
              try {
                const questionPath = path.join(subjectDir, `${id}.json`);
                const questionData = await fs.readFile(questionPath, 'utf-8');
                const question = JSON.parse(questionData);
                allQuestions.push({ ...question, subject: subj });
              } catch (err) {
                console.error(`Failed to load question ${id}:`, err);
              }
            }
          } else {
            // Just return IDs with subject
            ids.forEach(id => {
              allQuestions.push({ id, subject: subj });
            });
          }
        } catch (err) {
          console.error(`Failed to load subject ${subj}:`, err);
        }
      }

      return res.status(200).json({ questions: allQuestions });
    } catch (error) {
      console.error('Error loading questions:', error);
      return res.status(500).json({ error: 'Failed to load questions' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
