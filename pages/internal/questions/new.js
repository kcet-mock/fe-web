import Link from 'next/link';
import { useMemo, useState } from 'react';
import { splitLinesToParts } from '../../../components/internalQuestionsForm';

export async function getStaticProps() {
  if (process.env.NEXT_PUBLIC_INTERNAL_PAGES !== 'true') return { notFound: true };
  return { props: {} };
}

export default function InternalQuestionNewPage() {
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState('');
  const [loading, setLoading] = useState(false);

  const [questionText, setQuestionText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [answer, setAnswer] = useState('1');

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
