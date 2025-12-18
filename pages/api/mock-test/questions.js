import fs from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_SUBJECTS = new Set(['bio', 'phy']);
const MAX_QUESTIONS = 120;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const subjectRaw = typeof req.body?.subject === 'string' ? req.body.subject : 'bio';
    const subject = ALLOWED_SUBJECTS.has(subjectRaw) ? subjectRaw : 'bio';

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const safeIds = ids.filter((id) => typeof id === 'string').slice(0, MAX_QUESTIONS);

    const questionsDir = path.join(process.cwd(), 'data', subject);

    const questions = await Promise.all(
      safeIds.map(async (id) => {
        const filePath = path.join(questionsDir, `${id}.json`);
        const raw = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(raw);
      })
    );

    return res.status(200).json({ questions });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load questions' });
  }
}
