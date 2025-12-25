import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import RenderContent from '../../../components/RenderContent';

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
  const [questionNumber, setQuestionNumber] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(null);

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

  // Fetch all questions to determine question number
  useEffect(() => {
    if (!router.isReady || !id || !subject) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/internal/questions?full=1&subject=${subject}`);
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        const list = Array.isArray(json.questions) ? json.questions : [];
        if (!cancelled) {
          setTotalQuestions(list.length);
          const index = list.findIndex(q => q.id === id);
          if (index !== -1) {
            setQuestionNumber(index + 1);
          }
        }
      } catch (e) {
        // Silently fail - question number is optional
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
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {questionNumber !== null && totalQuestions !== null ? (
                      <span className="badge-soft">
                        Question {questionNumber} of {totalQuestions}
                      </span>
                    ) : null}
                    <span className="badge-soft">Answer: {question.correctAnswer}</span>
                  </div>
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
                      <RenderContent>{part}</RenderContent>
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
                                  width={200}
                                  height={200}
                                  style={{ maxWidth: 200, maxHeight: 200, height: 'auto', width: 'auto' }}
                                />
                              </div>
                            );
                          }
                          return (
                            <span key={`o-${idx}`}>
                              <RenderContent>{part}</RenderContent>
                            </span>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {question.explanation && Array.isArray(question.explanation) && question.explanation.length > 0 ? (
                  <div className="explanation-section" style={{ marginTop: '1.5rem', background: '#ede9fe', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
                    <div className="badge-soft" style={{ marginBottom: '0.5rem', background: '#a78bfa', color: '#fff', display: 'inline-block', minWidth: 0 }}>Explanation</div>
                    {question.explanation.map((part, idx) => {
                      if (isImageToken(part)) {
                        const src = imageTokenToSrc(part, basePathPrefix);
                        return (
                          <div key={`e-${idx}`} className="question-image">
                            <Image
                              src={src}
                              alt={`Explanation ${id}`}
                              width={1200}
                              height={800}
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                          </div>
                        );
                      }
                      return (
                        <p key={`e-${idx}`} className="question-text">
                          <RenderContent>{part}</RenderContent>
                        </p>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
