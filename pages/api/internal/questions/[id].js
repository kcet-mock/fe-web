import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  // Only allow in development or when explicitly enabled
  if (process.env.NEXT_PUBLIC_INTERNAL_PAGES !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }

  const { id } = req.query;
  const subject = req.query.subject || req.body?.subject;

  if (!id) {
    return res.status(400).json({ error: 'Question ID is required' });
  }

  if (req.method === 'GET') {
    try {
      // If subject is provided, search only in that subject
      const subjects = subject ? [subject] : ['bio', 'chem', 'phy', 'mat'];
      
      for (const subj of subjects) {
        try {
          const questionPath = path.join(process.cwd(), 'data', subj, `${id}.json`);
          const questionData = await fs.readFile(questionPath, 'utf-8');
          const question = JSON.parse(questionData);
          return res.status(200).json({ question: { ...question, subject: subj } });
        } catch (err) {
          // Question not found in this subject, try next
          continue;
        }
      }

      // Question not found in any subject
      return res.status(404).json({ error: 'Question not found' });
    } catch (error) {
      console.error('Error loading question:', error);
      return res.status(500).json({ error: 'Failed to load question' });
    }
  }

  if (req.method === 'PUT') {
    // Update question
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required for updates' });
    }

    try {
      const questionPath = path.join(process.cwd(), 'data', subject, `${id}.json`);
      
      // Verify question exists
      await fs.access(questionPath);
      
      // Update question data
      const updatedQuestion = {
        id,
        question: req.body.question || [],
        choices: req.body.choices || [],
        correctAnswer: req.body.correctAnswer || 0,
        explanation: req.body.explanation || [],
        years: req.body.years || [],
      };

      await fs.writeFile(questionPath, JSON.stringify(updatedQuestion, null, 2), 'utf-8');
      return res.status(200).json({ question: updatedQuestion });
    } catch (error) {
      console.error('Error updating question:', error);
      return res.status(500).json({ error: 'Failed to update question' });
    }
  }

  if (req.method === 'DELETE') {
    // Delete question
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required for deletion' });
    }

    try {
      const questionPath = path.join(process.cwd(), 'data', subject, `${id}.json`);
      await fs.unlink(questionPath);
      
      // Also remove from _all.js
      const allPath = path.join(process.cwd(), 'data', subject, '_all.js');
      const allModule = await import(`../../../../data/${subject}/_all.js`);
      const ids = Array.isArray(allModule.QUESTION_IDS) ? allModule.QUESTION_IDS : [];
      const updatedIds = ids.filter(qid => qid !== id);
      
      const allContent = `export const QUESTION_IDS = ${JSON.stringify(updatedIds, null, 2)};\n`;
      await fs.writeFile(allPath, allContent, 'utf-8');
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({ error: 'Failed to delete question' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
