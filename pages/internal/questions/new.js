import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

function isImageToken(token) {
  return (
    typeof token === 'string' && (token.startsWith('images/') || token.startsWith('image/'))
  );
}

function normalizeParts(parts) {
  return Array.isArray(parts)
    ? parts.map((x) => String(x || '').trim()).filter(Boolean)
    : [];
}

export async function getStaticProps() {
  if (process.env.NEXT_PUBLIC_INTERNAL_PAGES !== 'true') return { notFound: true };
  return { props: {} };
}

export default function InternalQuestionNewPage() {
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState('');
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  const [questionParts, setQuestionParts] = useState([]);
  const [opt1Parts, setOpt1Parts] = useState([]);
  const [opt2Parts, setOpt2Parts] = useState([]);
  const [opt3Parts, setOpt3Parts] = useState([]);
  const [opt4Parts, setOpt4Parts] = useState([]);
  const [answer, setAnswer] = useState('1');

  const payload = useMemo(() => {
    return {
      question: normalizeParts(questionParts),
      options: [
        normalizeParts(opt1Parts),
        normalizeParts(opt2Parts),
        normalizeParts(opt3Parts),
        normalizeParts(opt4Parts),
      ],
      answer: Number(answer),
    };
  }, [questionParts, opt1Parts, opt2Parts, opt3Parts, opt4Parts, answer]);

  const setPartsByKey = (key, updater) => {
    if (key === 'question') setQuestionParts(updater);
    else if (key === 'opt1') setOpt1Parts(updater);
    else if (key === 'opt2') setOpt2Parts(updater);
    else if (key === 'opt3') setOpt3Parts(updater);
    else if (key === 'opt4') setOpt4Parts(updater);
  };

  const openFilePicker = (target) => {
    setUploadError('');
    setUploadTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const uploadSelectedFile = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/internal/images', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Upload failed');
      if (!json?.token || typeof json.token !== 'string') throw new Error('Upload failed');
      return json.token;
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !uploadTarget) return;

    try {
      const token = await uploadSelectedFile(file);
      const { key, mode, index } = uploadTarget;

      if (mode === 'replace' && typeof index === 'number') {
        setPartsByKey(key, (prev) => prev.map((p, i) => (i === index ? token : p)));
      } else {
        setPartsByKey(key, (prev) => [...prev, token]);
      }
    } catch (err) {
      setUploadError(String(err?.message || err || 'Upload failed'));
    } finally {
      setUploadTarget(null);
    }
  };

  const renderPartsEditor = (label, parts, setParts, key) => {
    const updatePart = (index, value) => {
      setParts((prev) => prev.map((p, i) => (i === index ? value : p)));
    };

    const removePart = (index) => {
      setParts((prev) => prev.filter((_, i) => i !== index));
    };

    const addTextPart = () => setParts((prev) => [...prev, '']);
    const addImagePart = () => openFilePicker({ key, mode: 'add', index: null });

    return (
      <div style={{ marginTop: '1rem' }}>
        <div className="page-section-subtitle">{label}</div>
        <p className="question-text" style={{ marginTop: '0.35rem' }}>
          Use plain text parts, or an image path starting with <b>images/</b>.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="button-secondary" onClick={addTextPart} disabled={uploading}>
            Add text
          </button>
          <button type="button" className="button-secondary" onClick={addImagePart} disabled={uploading}>
            Add image
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
          {parts.map((part, index) => {
            const img = isImageToken(part);
            return (
              <div
                key={`${label}-${index}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '0.5rem',
                  alignItems: 'start',
                }}
              >
                {img ? (
                  <input
                    value={part}
                    onChange={(e) => updatePart(index, e.target.value)}
                    placeholder="images/your_file.png"
                    style={{ width: '100%' }}
                  />
                ) : (
                  <textarea
                    value={part}
                    onChange={(e) => updatePart(index, e.target.value)}
                    rows={2}
                    style={{ width: '100%' }}
                  />
                )}

                {img ? (
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => openFilePicker({ key, mode: 'replace', index })}
                    disabled={uploading}
                  >
                    Replace
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => removePart(index)}
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
            );
          })}
          {parts.length === 0 ? (
            <p className="question-text" style={{ marginTop: '0.25rem' }}>
              No parts yet.
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  const onCreate = async () => {
    setLoading(true);
    setError('');
    setCreatedId('');

    try {
      const res = await fetch('/api/internal/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Create failed');
      setCreatedId(json.id);
    } catch (e) {
      setError(e?.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-layout main-layout--top">
      <section className="card">
        <header className="card-header">
          <div>
            <div className="badge">Internal · Dev only</div>
            <h1 className="title">Add new question</h1>
            <p className="subtitle">Creates a new UUID file and appends it to _all.json.</p>
          </div>
        </header>

        <div className="test-layout">
          <div className="test-questions">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/internal/questions" className="button-secondary">
                Back to list
              </Link>
              {createdId ? (
                <Link
                  href={`/internal/questions/edit?id=${encodeURIComponent(createdId)}`}
                  className="button-primary"
                >
                  Edit created question
                </Link>
              ) : null}
            </div>

            {error ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                {error}
              </p>
            ) : null}

            {createdId ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                Created: {createdId}
              </p>
            ) : null}

            {uploadError ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                {uploadError}
              </p>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />

            {renderPartsEditor('Question parts', questionParts, setQuestionParts, 'question')}
            {renderPartsEditor('Option 1 parts', opt1Parts, setOpt1Parts, 'opt1')}
            {renderPartsEditor('Option 2 parts', opt2Parts, setOpt2Parts, 'opt2')}
            {renderPartsEditor('Option 3 parts', opt3Parts, setOpt3Parts, 'opt3')}
            {renderPartsEditor('Option 4 parts', opt4Parts, setOpt4Parts, 'opt4')}

            <div style={{ marginTop: '1rem' }}>
              <div className="page-section-subtitle">Correct answer (1-4)</div>
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                inputMode="numeric"
                style={{ width: '6rem', marginTop: '0.5rem' }}
              />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="button-primary" onClick={onCreate} disabled={loading}>
                {loading ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
