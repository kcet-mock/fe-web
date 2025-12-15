import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME;
const GITHUB_BASE_BRANCH = process.env.GITHUB_BASE_BRANCH || 'main';

async function parseForm(req) {
  const form = new IncomingForm({
    multiples: false,
    // Allow empty file inputs so optional file fields don't throw
    allowEmptyFiles: true,
    minFileSize: 0,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function githubRequest(pathname, options = {}) {
  if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
    throw new Error('GitHub configuration is missing. Please set GITHUB_TOKEN, GITHUB_REPO_OWNER and GITHUB_REPO_NAME.');
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}${pathname}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'kcet-mock-portal',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${text}`);
  }

  return res.json();
}

async function createBranch() {
  const baseRef = await githubRequest(`/git/ref/heads/${GITHUB_BASE_BRANCH}`);
  const sha = baseRef.object.sha;
  const branchName = `contribution/${Date.now()}`;

  await githubRequest('/git/refs', {
    method: 'POST',
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha,
    }),
  });

  return branchName;
}

async function getFileContent(pathname, ref) {
  try {
    const result = await githubRequest(`/contents/${pathname}?ref=${encodeURIComponent(ref)}`);
    const decoded = Buffer.from(result.content, 'base64').toString('utf8');
    return { content: decoded, sha: result.sha };
  } catch (error) {
    if (String(error.message).includes('404')) {
      return { content: null, sha: null };
    }
    throw error;
  }
}

async function putFile(pathname, { content, message, branch, sha }) {
  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };
  if (sha) body.sha = sha;

  return githubRequest(`/contents/${pathname}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function putBinaryFile(pathname, { filePath, message, branch }) {
  const fileBuffer = await fs.promises.readFile(filePath);
  const body = {
    message,
    content: fileBuffer.toString('base64'),
    branch,
  };

  return githubRequest(`/contents/${pathname}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function createPullRequest({ branchName, title, body }) {
  return githubRequest('/pulls', {
    method: 'POST',
    body: JSON.stringify({
      title,
      head: branchName,
      base: GITHUB_BASE_BRANCH,
      body,
    }),
  });
}

async function handleSingleQuestionSubmission({ fields, files, branchName }) {
  const questionText = String(fields.questionText || '').trim();
  const option1 = String(fields.option1 || '').trim();
  const option2 = String(fields.option2 || '').trim();
  const option3 = String(fields.option3 || '').trim();
  const option4 = String(fields.option4 || '').trim();
  const correctOption = Number(fields.correctOption);

  if (!questionText || !option1 || !option2 || !option3 || !option4 || ![1, 2, 3, 4].includes(correctOption)) {
    throw new Error('Invalid question data submitted.');
  }

  const questionsPath = 'data/questions.json';
  const { content: existingContent, sha } = await getFileContent(questionsPath, GITHUB_BASE_BRANCH);

  if (!existingContent) {
    throw new Error('questions.json not found in repository.');
  }

  let questions;
  try {
    questions = JSON.parse(existingContent);
  } catch (error) {
    throw new Error('Failed to parse existing questions.json in repository.');
  }

  let questionImagePath = null;
  const questionImageFile = files.questionImage;
  if (questionImageFile && questionImageFile.filepath && questionImageFile.size > 0) {
    const ext = path.extname(questionImageFile.originalFilename || '') || '.png';
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext.toLowerCase()) ? ext : '.png';
    const filename = `question-${Date.now()}${safeExt}`;
    questionImagePath = `public/images/${filename}`;

    await putBinaryFile(questionImagePath, {
      filePath: questionImageFile.filepath,
      message: 'Add question image from contribution form',
      branch: branchName,
    });
  }

  const newQuestion = {
    question: {
      text: questionText,
      image: questionImagePath ? questionImagePath.replace(/^public\//, '') : null,
    },
    options: [
      { text: option1, image: null },
      { text: option2, image: null },
      { text: option3, image: null },
      { text: option4, image: null },
    ],
    answer: correctOption,
  };

  // Option images (optional for each option)
  const optionImageFiles = [
    files.optionImage1,
    files.optionImage2,
    files.optionImage3,
    files.optionImage4,
  ];

  for (let i = 0; i < optionImageFiles.length; i += 1) {
    const file = optionImageFiles[i];
    if (!file || !file.filepath || file.size === 0) continue;

    const ext = path.extname(file.originalFilename || '') || '.png';
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext.toLowerCase())
      ? ext
      : '.png';
    const filename = `option-${i + 1}-${Date.now()}${safeExt}`;
    const optionImagePath = `public/images/${filename}`;

    await putBinaryFile(optionImagePath, {
      filePath: file.filepath,
      message: 'Add option image from contribution form',
      branch: branchName,
    });

    newQuestion.options[i].image = optionImagePath.replace(/^public\//, '');
  }

  const updatedQuestions = [...questions, newQuestion];
  const prettyJson = JSON.stringify(updatedQuestions, null, 2) + '\n';

  await putFile(questionsPath, {
    content: prettyJson,
    message: 'Add new question from contribution form',
    branch: branchName,
    sha,
  });

  const pr = await createPullRequest({
    branchName,
    title: 'Add new KCET question from contribution form',
    body: `This PR was created automatically from the contribution form.\n\nQuestion: ${questionText.substring(0, 200)}...`,
  });

  return pr.html_url;
}

async function handlePdfSubmission({ fields, files, branchName }) {
  const year = Number(fields.year);
  const subjectRaw = String(fields.subject || '').trim();
  const pdfFile = files.pdfFile;

  if (!year || !subjectRaw || !pdfFile || !pdfFile.filepath || pdfFile.size === 0) {
    throw new Error('Invalid PDF submission data.');
  }

  const normalisedSubject = subjectRaw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const pdfFilename = `${year}-${normalisedSubject || 'paper'}.pdf`;
  const pdfRepoPath = `public/pdfs/${pdfFilename}`;

  await putBinaryFile(pdfRepoPath, {
    filePath: pdfFile.filepath,
    message: 'Add KCET PDF from contribution form',
    branch: branchName,
  });

  const pr = await createPullRequest({
    branchName,
    title: `Add KCET PDF ${year} ${subjectRaw}`,
    body: `This PR was created automatically from the contribution form.\n\nPDF: /pdfs/${pdfFilename}`,
  });

  return pr.html_url;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    if (!GITHUB_TOKEN || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
      return res.status(500).json({
        ok: false,
        error:
          'Server GitHub configuration missing. Please configure GITHUB_TOKEN, GITHUB_REPO_OWNER and GITHUB_REPO_NAME.',
      });
    }

    const { fields, files } = await parseForm(req);
    const mode = String(fields.mode || '').trim();

    if (!mode || (mode !== 'single-question' && mode !== 'pdf-upload')) {
      return res.status(400).json({ ok: false, error: 'Invalid mode.' });
    }

    const branchName = await createBranch();

    let prUrl;
    if (mode === 'single-question') {
      prUrl = await handleSingleQuestionSubmission({ fields, files, branchName });
    } else {
      prUrl = await handlePdfSubmission({ fields, files, branchName });
    }

    return res.status(200).json({
      ok: true,
      message: 'Thank you! Your contribution has been submitted for review as a pull request.',
      prUrl,
    });
  } catch (error) {
    console.error('Contribution submission error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to create pull request. Please try again later.',
    });
  }
}
