import Link from 'next/link';
import { useEffect, useState } from 'react';

export async function getStaticProps() {
  if (process.env.NEXT_PUBLIC_INTERNAL_PAGES !== 'true') return { notFound: true };
  return { props: {} };
}

export default function InternalQuestionsListPage() {
  const [ids, setIds] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/internal/questions');
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        if (!cancelled) setIds(Array.isArray(json.ids) ? json.ids : []);
      } catch (e) {
        if (!cancelled) setError('Failed to load questions (dev-only).');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="main-layout main-layout--top">
      <section className="card">
        <header className="card-header">
          <div>
            <div className="badge">Internal · Dev only</div>
            <h1 className="title">Questions</h1>
            <p className="subtitle">List all questions, open, edit, or add new.</p>
          </div>
        </header>

        <div className="test-layout">
          <div className="test-questions">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/internal/questions/new" className="button-primary">
                Add new question
              </Link>
              <Link href="/" className="button-secondary">
                Back to home
              </Link>
            </div>

            {error ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                {error}
              </p>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                <div className="page-section-subtitle" style={{ marginBottom: '0.5rem' }}>
                  Total: {ids.length}
                </div>
                <div className="questions-stack">
                  {ids.map((id) => (
                    <div key={id} className="question-block">
                      <div className="question-header" style={{ justifyContent: 'space-between' }}>
                        <span className="badge-soft">{id}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link href={`/internal/questions/view?id=${encodeURIComponent(id)}`} className="button-secondary">
                            View
                          </Link>
                          <Link href={`/internal/questions/edit?id=${encodeURIComponent(id)}`} className="button-primary">
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
