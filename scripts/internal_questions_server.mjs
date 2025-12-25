import http from 'node:http';
import { URL } from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import formidable from 'formidable';

const PORT = Number(process.env.INTERNAL_PORT || 8787);

const enabled =
  process.env.NEXT_PUBLIC_INTERNAL_PAGES === 'true' || process.env.NODE_ENV === 'development';

if (!enabled) {
  console.error('internal_questions_server: only run in dev/internal mode');
  process.exit(1);
}

const VALID_SUBJECTS = ['bio', 'chem', 'phy', 'mat'];

function getQuestionsDir(subject) {
  if (!VALID_SUBJECTS.includes(subject)) {
    throw new Error(`Invalid subject: ${subject}`);
  }
  return path.join(process.cwd(), 'data', subject);
}

function getAllPath(subject) {
  return path.join(getQuestionsDir(subject), '_all.json');
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

async function readAllIds(subject) {
  const ids = await readJsonFile(getAllPath(subject));
  return Array.isArray(ids) ? ids : [];
}

function getQuestionsJsonPath() {
  return path.join(process.cwd(), 'scripts', 'questions.json');
}

async function syncToQuestionsJson(questionData) {
  try {
    const questionsJsonPath = getQuestionsJsonPath();
    let allQuestions = [];
    
    try {
      allQuestions = await readJsonFile(questionsJsonPath);
      if (!Array.isArray(allQuestions)) {
        allQuestions = [];
      }
    } catch (err) {
      // File doesn't exist or is invalid, start with empty array
      console.log('questions.json not found or invalid, creating new one');
    }

    // Find and update existing question or add new one
    const existingIndex = allQuestions.findIndex(q => q.id === questionData.id);
    
    if (existingIndex >= 0) {
      // Update existing question
      allQuestions[existingIndex] = questionData;
    } else {
      // Add new question
      allQuestions.push(questionData);
    }

    // Write back to questions.json
    await writeJsonFile(questionsJsonPath, allQuestions);
    console.log(`Synced question ${questionData.id} to questions.json`);
  } catch (err) {
    console.error('Error syncing to questions.json:', err);
    // Don't throw - we don't want to fail the save operation if sync fails
  }
}

async function removeFromQuestionsJson(questionId) {
  try {
    const questionsJsonPath = getQuestionsJsonPath();
    let allQuestions = [];
    
    try {
      allQuestions = await readJsonFile(questionsJsonPath);
      if (!Array.isArray(allQuestions)) {
        return;
      }
    } catch (err) {
      // File doesn't exist, nothing to remove
      return;
    }

    // Filter out the deleted question
    const filtered = allQuestions.filter(q => q.id !== questionId);
    
    if (filtered.length !== allQuestions.length) {
      await writeJsonFile(questionsJsonPath, filtered);
      console.log(`Removed question ${questionId} from questions.json`);
    }
  } catch (err) {
    console.error('Error removing from questions.json:', err);
    // Don't throw - we don't want to fail the delete operation if sync fails
  }
}

function normalizeQuestionPayload(payload, id) {
  const questionParts = Array.isArray(payload?.question)
    ? payload.question.filter((x) => typeof x === 'string' && x.trim() !== '')
    : [];

  const choices = Array.isArray(payload?.choices)
    ? payload.choices.map((choice) =>
        Array.isArray(choice) ? choice.filter((x) => typeof x === 'string' && x.trim() !== '') : []
      )
    : Array.isArray(payload?.options)
    ? payload.options.map((opt) =>
        Array.isArray(opt) ? opt.filter((x) => typeof x === 'string' && x.trim() !== '') : []
      )
    : [];

  const explanationParts = Array.isArray(payload?.explanation)
    ? payload.explanation.filter((x) => typeof x === 'string' && x.trim() !== '')
    : [];

  const answer = Number(payload?.answer);
  const correctAnswer = Number(payload?.correctAnswer);

  return {
    id,
    question: questionParts,
    choices,
    correctAnswer: Number.isFinite(correctAnswer) ? correctAnswer : (Number.isFinite(answer) ? answer : null),
    explanation: explanationParts,
  };
}

async function readBodyJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function routeMatch(pathname, method) {
  if (pathname === '/api/internal/questions' && (method === 'GET' || method === 'POST')) {
    return { kind: 'collection' };
  }

  if (pathname === '/api/internal/images' && method === 'POST') {
    return { kind: 'image-upload' };
  }

  const m = pathname.match(/^\/api\/internal\/questions\/([^/]+)$/);
  if (m && (method === 'GET' || method === 'PUT' || method === 'DELETE')) {
    return { kind: 'item', id: decodeURIComponent(m[1]) };
  }

  return null;
}

function guessExtension({ originalFilename, mimetype }) {
  const ext = path.extname(originalFilename || '').toLowerCase();
  if (ext && ext.length <= 8) return ext;

  const mt = String(mimetype || '').toLowerCase();
  if (mt === 'image/png') return '.png';
  if (mt === 'image/jpeg') return '.jpg';
  if (mt === 'image/webp') return '.webp';
  if (mt === 'image/gif') return '.gif';
  return '.png';
}

async function moveFile(src, dest) {
  try {
    await fs.rename(src, dest);
  } catch (e) {
    if (e && e.code === 'EXDEV') {
      await fs.copyFile(src, dest);
      await fs.unlink(src);
      return;
    }
    throw e;
  }
}

async function parseMultipartSingleFile(req) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 15 * 1024 * 1024,
  });

  return await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const file = files?.file;
      if (!file) return resolve({ fields, file: null });

      // Formidable may return an array depending on client.
      const f = Array.isArray(file) ? file[0] : file;
      resolve({ fields, file: f || null });
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const match = routeMatch(url.pathname, req.method || 'GET');
    if (!match) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    if (match.kind === 'collection' && req.method === 'GET') {
      const subject = url.searchParams.get('subject') || 'bio';
      if (!VALID_SUBJECTS.includes(subject)) {
        sendJson(res, 400, { error: 'Invalid subject' });
        return;
      }
      
      const questionsDir = getQuestionsDir(subject);
      const ids = await readAllIds(subject);
      const wantsFull = url.searchParams.get('full') === '1' || url.searchParams.get('full') === 'true';
      if (!wantsFull) {
        sendJson(res, 200, { ids });
        return;
      }

      const questions = await Promise.all(
        ids.map(async (id) => {
          try {
            return await readJsonFile(path.join(questionsDir, `${id}.json`));
          } catch {
            return null;
          }
        })
      );

      sendJson(res, 200, { ids, questions: questions.filter(Boolean) });
      return;
    }

    if (match.kind === 'collection' && req.method === 'POST') {
      const payload = await readBodyJson(req);
      const subject = url.searchParams.get('subject') || payload.subject || 'bio';
      if (!VALID_SUBJECTS.includes(subject)) {
        sendJson(res, 400, { error: 'Invalid subject' });
        return;
      }
      
      const questionsDir = getQuestionsDir(subject);
      const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const q = normalizeQuestionPayload(payload, id);

      if (!Array.isArray(q.choices) || q.choices.length !== 4) {
        sendJson(res, 400, { error: 'choices must be an array of 4 arrays' });
        return;
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        sendJson(res, 400, { error: 'correctAnswer must be 0-3' });
        return;
      }

      const ids = await readAllIds(subject);
      await writeJsonFile(path.join(questionsDir, `${id}.json`), q);
      await writeJsonFile(getAllPath(subject), [...ids, id]);
      await syncToQuestionsJson(q);
      sendJson(res, 201, { id });
      return;
    }

    if (match.kind === 'image-upload' && req.method === 'POST') {
      // Expect questionId in query or form fields
      let questionId = null;
      let part = null;
      let fields = {};
      const { file, fields: parsedFields } = await parseMultipartSingleFile(req);
      fields = parsedFields || {};
      questionId = fields.questionId || (req.url && new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams.get('questionId'));
      part = fields.part || (req.url && new URL(req.url, `http://${req.headers.host || 'localhost'}`).searchParams.get('part'));
      if (!file) {
        sendJson(res, 400, { error: 'Missing file field (multipart/form-data name="file")' });
        return;
      }
      if (!questionId) {
        sendJson(res, 400, { error: 'Missing questionId for image naming' });
        return;
      }
      const mimetype = file.mimetype;
      if (typeof mimetype === 'string' && !mimetype.toLowerCase().startsWith('image/')) {
        sendJson(res, 400, { error: 'Only image uploads are allowed' });
        return;
      }
      const publicImagesDir = path.join(process.cwd(), 'public', 'images');
      await fs.mkdir(publicImagesDir, { recursive: true });
      // Find next available N for this questionId
      const files = await fs.readdir(publicImagesDir);
      const prefix = `${questionId}-`;
      let maxN = 0;
      for (const fname of files) {
        if (fname.startsWith(prefix) && fname.match(/-([0-9]+)\.(png|jpg|jpeg|webp|gif)$/)) {
          const m = fname.match(/-([0-9]+)\.(png|jpg|jpeg|webp|gif)$/);
          const n = parseInt(m[1], 10);
          if (n > maxN) maxN = n;
        }
      }
      const nextN = maxN + 1;
      const ext = guessExtension({ originalFilename: file.originalFilename, mimetype: file.mimetype });
      const filename = `${questionId}-${nextN}${ext}`;
      const destAbs = path.join(publicImagesDir, filename);
      await moveFile(file.filepath, destAbs);
      sendJson(res, 201, { token: `images/${filename}` });
      return;
    }

    if (match.kind === 'item' && req.method === 'GET') {
      const subject = url.searchParams.get('subject') || 'bio';
      if (!VALID_SUBJECTS.includes(subject)) {
        sendJson(res, 400, { error: 'Invalid subject' });
        return;
      }
      
      const questionsDir = getQuestionsDir(subject);
      const filePath = path.join(questionsDir, `${match.id}.json`);
      const q = await readJsonFile(filePath);
      sendJson(res, 200, { question: q });
      return;
    }

    if (match.kind === 'item' && req.method === 'PUT') {
      const payload = await readBodyJson(req);
      const subject = url.searchParams.get('subject') || payload.subject || 'bio';
      if (!VALID_SUBJECTS.includes(subject)) {
        sendJson(res, 400, { error: 'Invalid subject' });
        return;
      }
      
      const questionsDir = getQuestionsDir(subject);
      const q = normalizeQuestionPayload(payload, match.id);

      if (!Array.isArray(q.choices) || q.choices.length !== 4) {
        sendJson(res, 400, { error: 'choices must be an array of 4 arrays' });
        return;
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
        sendJson(res, 400, { error: 'correctAnswer must be 0-3' });
        return;
      }

      await writeJsonFile(path.join(questionsDir, `${match.id}.json`), q);
      await syncToQuestionsJson(q);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (match.kind === 'item' && req.method === 'DELETE') {
      const subject = url.searchParams.get('subject') || 'bio';
      if (!VALID_SUBJECTS.includes(subject)) {
        sendJson(res, 400, { error: 'Invalid subject' });
        return;
      }
      
      const questionsDir = getQuestionsDir(subject);
      const ids = await readAllIds(subject);
      await writeJsonFile(getAllPath(subject), ids.filter((x) => x !== match.id));
      await fs.unlink(path.join(questionsDir, `${match.id}.json`));
      await removeFromQuestionsJson(match.id);
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    sendJson(res, 500, { error: 'Internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`internal_questions_server listening on http://localhost:${PORT}`);
});
