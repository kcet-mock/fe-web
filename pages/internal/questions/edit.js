import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

function isImageToken(token) {
  return (
    typeof token === 'string' && (token.startsWith('images/') || token.startsWith('image/'))
  );
}

function imageTokenToSrc(token, basePathPrefix) {
  const stripped = token.startsWith('image/') ? token.slice('image/'.length) : token;
  const relativePath = stripped.replace(/^\/+/, '');
  return `${basePathPrefix}${relativePath}`;
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

export default function InternalQuestionEditPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const basePathPrefix = router.basePath ? `${router.basePath}/` : '/';

  const [dragState, setDragState] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setSaved(false);

    (async () => {
      try {
        const res = await fetch(`/api/internal/questions/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        const q = json.question;
        if (!q) throw new Error('Missing');

        if (cancelled) return;
        setQuestionParts(normalizeParts(q.question));
        const opts = Array.isArray(q.options) ? q.options : [];
        setOpt1Parts(normalizeParts(opts[0]));
        setOpt2Parts(normalizeParts(opts[1]));
        setOpt3Parts(normalizeParts(opts[2]));
        setOpt4Parts(normalizeParts(opts[3]));
        setAnswer(String(typeof q.answer === 'number' ? q.answer : 1));
      } catch (e) {
        if (!cancelled) setError('Failed to load question.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
      const { key } = uploadTarget;
      setPartsByKey(key, (prev) => [...prev, token]);
    } catch (err) {
      setUploadError(String(err?.message || err || 'Upload failed'));
    } finally {
      setUploadTarget(null);
    }
  };

  const renderPartsEditor = (label, parts, setParts, key) => {
    const isQuestion = key === 'question';

    const updatePart = (index, value) => {
      setParts((prev) => prev.map((p, i) => (i === index ? value : p)));
    };

    const onDragStart = (e, fromIndex) => {
      if (uploading) return;
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(fromIndex));
      } catch {
        // ignore
      }

      setDragState({ key, fromIndex, overIndex: fromIndex, overAfter: false });
    };

    const onDragOverRow = (e, index) => {
      if (!dragState || dragState.key !== key) return;
      e.preventDefault();
      try {
        e.dataTransfer.dropEffect = 'move';
      } catch {
        // ignore
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const overAfter = e.clientY > rect.top + rect.height / 2;
      setDragState((prev) => {
        if (!prev || prev.key !== key) return prev;
        if (prev.overIndex === index && prev.overAfter === overAfter) return prev;
        return { ...prev, overIndex: index, overAfter };
      });
    };

    const onDrop = (e, fallbackToEnd) => {
      e.preventDefault();
      e.stopPropagation();

      const state = dragState && dragState.key === key ? dragState : null;
      setDragState(null);
      if (!state) return;

      const fromIndex = state.fromIndex;
      if (!Number.isInteger(fromIndex)) return;

      let toIndex;
      if (fallbackToEnd) {
        toIndex = parts.length;
      } else {
        const base = Number.isInteger(state.overIndex) ? state.overIndex : parts.length - 1;
        toIndex = base + (state.overAfter ? 1 : 0);
      }

      setParts((prev) => {
        if (fromIndex < 0 || fromIndex >= prev.length) return prev;
        const clampedTo = Math.max(0, Math.min(toIndex, prev.length));
        let insertIndex = clampedTo;
        if (insertIndex > fromIndex) insertIndex -= 1;
        if (insertIndex === fromIndex) return prev;

        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(insertIndex, 0, item);
        return next;
      });
    };

    const removePart = (index) => {
      setParts((prev) => prev.filter((_, i) => i !== index));
    };

    const addTextPart = () => setParts((prev) => [...prev, '']);
    const addImagePart = () => openFilePicker({ key });

    return (
      <div style={{ marginTop: '1rem' }}>
        <div className="page-section-subtitle">{label}</div>

        <div
          style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}
          onDragOver={(e) => {
            if (dragState && dragState.key === key) e.preventDefault();
          }}
          onDrop={(e) => onDrop(e, true)}
        >
          {parts.map((part, index) => {
            const img = isImageToken(part);
            const isOver = dragState && dragState.key === key && dragState.overIndex === index;
            const showTop = isOver && !dragState.overAfter;
            const showBottom = isOver && dragState.overAfter;
            return (
              <div
                key={`${label}-${index}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '0.5rem',
                  alignItems: 'start',
                  borderTop: showTop ? '2px solid #38bdf8' : undefined,
                  borderBottom: showBottom ? '2px solid #38bdf8' : undefined,
                  paddingTop: showTop ? '0.35rem' : undefined,
                  paddingBottom: showBottom ? '0.35rem' : undefined,
                }}
                onDragOver={(e) => onDragOverRow(e, index)}
                onDrop={(e) => {
                  e.stopPropagation();
                  onDrop(e, false);
                }}
              >
                <button
                  type="button"
                  className="icon-button drag-handle"
                  draggable={!uploading}
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragEnd={() => setDragState(null)}
                  disabled={uploading}
                  aria-label="Drag to reorder"
                  title="Drag to reorder"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M9 7h.01M9 12h.01M9 17h.01M15 7h.01M15 12h.01M15 17h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </button>

                {img ? (
                  <div>
                    <div className="question-image">
                      <Image
                        src={imageTokenToSrc(part, basePathPrefix)}
                        alt={`${label} ${index + 1}`}
                        width={1200}
                        height={800}
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                  </div>
                ) : (
                  isQuestion ? (
                    <textarea
                      value={part}
                      onChange={(e) => updatePart(index, e.target.value)}
                      rows={4}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <input
                      value={part}
                      onChange={(e) => updatePart(index, e.target.value)}
                      style={{ width: '100%' }}
                    />
                  )
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => removePart(index)}
                    disabled={uploading}
                    aria-label="Remove"
                    title="Remove"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M4 6h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M7 6l1 15h8l1-15" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      <path d="M10 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {parts.length === 0 ? (
            <p className="question-text" style={{ marginTop: '0.25rem' }}>
              No parts yet.
            </p>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
            <div className="add-part-wrap">
              <button
                type="button"
                className="icon-button"
                onClick={addTextPart}
                disabled={uploading}
                aria-label="Add text part"
                title="Add"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>

              <div className="add-part-menu" role="menu" aria-label="Add part">
                <button
                  type="button"
                  className="icon-button"
                  onClick={addTextPart}
                  disabled={uploading}
                  aria-label="Add text"
                  title="Add text"
                >
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1 }}>A</span>
                </button>

                <button
                  type="button"
                  className="icon-button"
                  onClick={addImagePart}
                  disabled={uploading}
                  aria-label="Add image"
                  title="Add image"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M5 7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M9 10.5a1.25 1.25 0 1 0 0-2.5a1.25 1.25 0 0 0 0 2.5z" fill="currentColor" />
                    <path d="M6.5 17l4-4 3 3 2-2 2.5 3" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const onSave = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch(`/api/internal/questions/${encodeURIComponent(id)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Save failed');
      }
      setSaved(true);
      router.push(`/internal/questions/view?id=${encodeURIComponent(id)}`);
    } catch (e) {
      setError(e?.message || 'Save failed');
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
            <h1 className="title">Edit question</h1>
            <p className="subtitle">{id || '—'}</p>
          </div>
        </header>

        <div className="test-layout">
          <div className="test-questions">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/internal/questions" className="button-secondary">
                Back to list
              </Link>
              {id ? (
                <Link href={`/internal/questions/view?id=${encodeURIComponent(id)}`} className="button-secondary">
                  View
                </Link>
              ) : null}
            </div>

            {error ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                {error}
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

            {saved ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                Saved.
              </p>
            ) : null}

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
              <button type="button" className="button-primary" onClick={onSave} disabled={loading || !id}>
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
