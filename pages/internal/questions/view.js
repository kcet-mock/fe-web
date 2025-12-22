import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export async function getStaticProps() {
  if (process.env.NEXT_PUBLIC_INTERNAL_PAGES !== 'true') return { notFound: true };
  return { props: {} };
}

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

export default function InternalQuestionViewPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const subject = typeof router.query.subject === 'string' ? router.query.subject : '';
  const basePathPrefix = router.basePath ? `${router.basePath}/` : '/';

  const [question, setQuestion] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady || !id || !subject) return;
    let cancelled = false;
    (async () => {
      try {
        const subjectParam = subject ? `?subject=${subject}` : '';
        const res = await fetch(`/api/internal/questions/${encodeURIComponent(id)}${subjectParam}`);
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (!cancelled) setQuestion(json.question || null);
      } catch (e) {
        if (!cancelled) setError('Question not found (dev-only).');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, subject, router.isReady]);

  return (
    <main className="main-layout main-layout--top">
      <section className="card">
        <header className="card-header">
          <div>
            <div className="badge">Internal · Dev only</div>
            <h1 className="title">View question</h1>
            <p className="subtitle">{id || '—'}</p>
          </div>
        </header>

        <div className="test-layout">
          <div className="test-questions">
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {id ? (
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => router.replace(`/internal/questions/edit?subject=${subject}&id=${encodeURIComponent(id)}`)}
                >
                  Edit
                </button>
              ) : null}
            </div>

            {error ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                {error}
              </p>
            ) : !question ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                Loading…
              </p>
            ) : (
              <div className="question-block" style={{ marginTop: '1rem' }}>
                <div className="question-header">
                  <span className="badge-soft">Answer: {question.correctAnswer}</span>
                </div>

                {(Array.isArray(question.question) ? question.question : []).map((part, idx) => {
                  if (isImageToken(part)) {
                    const src = imageTokenToSrc(part, basePathPrefix);
                    return (
                      <div key={`q-${idx}`} className="question-image">
                        <Image
                          src={src}
                          alt={`Question ${id}`}
                          width={1200}
                          height={800}
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      </div>
                    );
                  }
                  return (
                    <p key={`q-${idx}`} className="question-text">
                      {part}
                    </p>
                  );
                })}

                <div className="options-list">
                  {(Array.isArray(question.choices) ? question.choices : []).map((optParts, optIdx) => {
                    const parts = Array.isArray(optParts) ? optParts : [];
                    const isCorrect = optIdx === (typeof question.correctAnswer === 'number' ? question.correctAnswer : -1);
                    return (
                      <div
                        key={`opt-${optIdx}`}
                        className={`option-pill option-pill--static${isCorrect ? ' option-pill--correct' : ''}`}
                      >
                        <span className="option-circle" />
                        {parts.map((part, idx) => {
                          if (isImageToken(part)) {
                            const src = imageTokenToSrc(part, basePathPrefix);
                            return (
                              <div key={`o-${idx}`} className="option-image">
                                <Image
                                  src={src}
                                  alt={`Option ${optIdx + 1}`}
                                  width={1200}
                                  height={800}
                                  style={{ maxWidth: '100%', height: 'auto' }}
                                />
                              </div>
                            );
                          }
                          return <span key={`o-${idx}`}>{part}</span>;
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
