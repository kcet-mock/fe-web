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

const questionsDir = path.join(process.cwd(), 'data', 'bio');
const allPath = path.join(questionsDir, '_all.json');

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

async function readAllIds() {
  const ids = await readJsonFile(allPath);
  return Array.isArray(ids) ? ids : [];
}

function normalizeQuestionPayload(payload, id) {
  const questionParts = Array.isArray(payload?.question)
    ? payload.question.filter((x) => typeof x === 'string' && x.trim() !== '')
    : [];

  const options = Array.isArray(payload?.options)
    ? payload.options.map((opt) =>
        Array.isArray(opt) ? opt.filter((x) => typeof x === 'string' && x.trim() !== '') : []
      )
    : [];

  const answer = Number(payload?.answer);

  return {
    id,
    question: questionParts,
    options,
    answer: Number.isFinite(answer) ? answer : null,
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
      const ids = await readAllIds();
      sendJson(res, 200, { ids });
      return;
    }

    if (match.kind === 'collection' && req.method === 'POST') {
      const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const payload = await readBodyJson(req);
      const q = normalizeQuestionPayload(payload, id);

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        sendJson(res, 400, { error: 'options must be an array of 4 arrays' });
        return;
      }
      if (typeof q.answer !== 'number' || q.answer < 1 || q.answer > 4) {
        sendJson(res, 400, { error: 'answer must be 1-4' });
        return;
      }

      const ids = await readAllIds();
      await writeJsonFile(path.join(questionsDir, `${id}.json`), q);
      await writeJsonFile(allPath, [...ids, id]);
      sendJson(res, 201, { id });
      return;
    }

    if (match.kind === 'image-upload' && req.method === 'POST') {
      const { file } = await parseMultipartSingleFile(req);
      if (!file) {
        sendJson(res, 400, { error: 'Missing file field (multipart/form-data name="file")' });
        return;
      }

      const mimetype = file.mimetype;
      if (typeof mimetype === 'string' && !mimetype.toLowerCase().startsWith('image/')) {
        sendJson(res, 400, { error: 'Only image uploads are allowed' });
        return;
      }

      const publicImagesDir = path.join(process.cwd(), 'public', 'images');
      await fs.mkdir(publicImagesDir, { recursive: true });

      const uuid = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const ext = guessExtension({ originalFilename: file.originalFilename, mimetype: file.mimetype });
      const filename = `${uuid}${ext}`;
      const destAbs = path.join(publicImagesDir, filename);

      await moveFile(file.filepath, destAbs);
      sendJson(res, 201, { token: `images/${filename}` });
      return;
    }

    if (match.kind === 'item' && req.method === 'GET') {
      const filePath = path.join(questionsDir, `${match.id}.json`);
      const q = await readJsonFile(filePath);
      sendJson(res, 200, { question: q });
      return;
    }

    if (match.kind === 'item' && req.method === 'PUT') {
      const payload = await readBodyJson(req);
      const q = normalizeQuestionPayload(payload, match.id);

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        sendJson(res, 400, { error: 'options must be an array of 4 arrays' });
        return;
      }
      if (typeof q.answer !== 'number' || q.answer < 1 || q.answer > 4) {
        sendJson(res, 400, { error: 'answer must be 1-4' });
        return;
      }

      await writeJsonFile(path.join(questionsDir, `${match.id}.json`), q);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (match.kind === 'item' && req.method === 'DELETE') {
      const ids = await readAllIds();
      await writeJsonFile(allPath, ids.filter((x) => x !== match.id));
      await fs.unlink(path.join(questionsDir, `${match.id}.json`));
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
