import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { partsToTextarea, splitLinesToParts } from '../../../components/internalQuestionsForm';

export async function getStaticProps() {
  if (process.env.NEXT_PUBLIC_INTERNAL_PAGES !== 'true') return { notFound: true };
  return { props: {} };
}

export default function InternalQuestionEditPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [questionText, setQuestionText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
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
        setQuestionText(partsToTextarea(q.question));
        const opts = Array.isArray(q.options) ? q.options : [];
        setOpt1(partsToTextarea(opts[0]));
        setOpt2(partsToTextarea(opts[1]));
        setOpt3(partsToTextarea(opts[2]));
        setOpt4(partsToTextarea(opts[3]));
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
      question: splitLinesToParts(questionText),
      options: [
        splitLinesToParts(opt1),
        splitLinesToParts(opt2),
        splitLinesToParts(opt3),
        splitLinesToParts(opt4),
      ],
      answer: Number(answer),
    };
  }, [questionText, opt1, opt2, opt3, opt4, answer]);

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

            {saved ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                Saved.
              </p>
            ) : null}

            <div style={{ marginTop: '1rem' }}>
              <div className="page-section-subtitle">Question (one part per line)</div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={6}
                style={{ width: '100%', marginTop: '0.5rem' }}
              />
            </div>

            <div style={{ marginTop: '1rem' }}>
              <div className="page-section-subtitle">Options (one part per line)</div>
              <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
                <textarea value={opt1} onChange={(e) => setOpt1(e.target.value)} rows={3} style={{ width: '100%' }} />
                <textarea value={opt2} onChange={(e) => setOpt2(e.target.value)} rows={3} style={{ width: '100%' }} />
                <textarea value={opt3} onChange={(e) => setOpt3(e.target.value)} rows={3} style={{ width: '100%' }} />
                <textarea value={opt4} onChange={(e) => setOpt4(e.target.value)} rows={3} style={{ width: '100%' }} />
              </div>
            </div>

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
