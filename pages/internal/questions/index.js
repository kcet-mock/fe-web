import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import RenderContent from '../../../components/RenderContent';

export async function getStaticProps() {
  if (process.env.NEXT_PUBLIC_INTERNAL_PAGES !== 'true') return { notFound: true };
  return { props: {} };
}

export default function InternalQuestionsListPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('phy');
  const [year, setYear] = useState('all');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    if (!router.isReady) return;
    const { sub, year: yearParam } = router.query;
    if (sub && ['phy', 'chem', 'mat', 'bio'].includes(sub)) {
      setSubject(sub);
    }
    if (yearParam && ['all', '2025', '2024', '2023'].includes(yearParam)) {
      setYear(yearParam);
    }
  }, [router.isReady, router.query]);

  // Update URL when filters change
  const updateURL = (newSubject, newYear) => {
    const query = { sub: newSubject };
    if (newYear !== 'all') {
      query.year = newYear;
    }
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  const handleSubjectChange = (newSubject) => {
    setSubject(newSubject);
    updateURL(newSubject, year);
  };

  const handleYearChange = (newYear) => {
    setYear(newYear);
    updateURL(subject, newYear);
  };

  useEffect(() => {
    if (!subject) return;
    
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const yearParam = year && year !== 'all' ? `&year=${year}` : '';
        const res = await fetch(`/api/internal/questions?full=1&subject=${subject}${yearParam}`);
        if (!res.ok) throw new Error('Failed to load');
        const json = await res.json();
        const list = Array.isArray(json.questions) ? json.questions : [];
        if (!cancelled) setQuestions(list);
      } catch (e) {
        if (!cancelled) setError('Failed to load questions (dev-only).');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subject, year]);

  const isImageToken = (token) => {
    return typeof token === 'string' && (token.startsWith('images/') || token.startsWith('image/'));
  };

  const imageTokenToSrc = (token, basePathPrefix) => {
    const stripped = token.startsWith('image/') ? token.slice('image/'.length) : token;
    const relativePath = stripped.replace(/^\/+/, '');
    return `${basePathPrefix}${relativePath}`;
  };

  return (
    <main className="main-layout main-layout--top">
      <section>
        <div>
          <div className="badge">Internal · Dev only</div>
          <h1 className="title">Questions</h1>
          <p className="subtitle">List all questions directly and edit them.</p>
        </div>

        <div className="test-layout">
          <div className="test-questions">
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="filter-group">
                <div className="filter-label">Subject</div>
                <select
                  className="select"
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                >
                  <option value="phy">Physics</option>
                  <option value="chem">Chemistry</option>
                  <option value="mat">Mathematics</option>
                  <option value="bio">Biology</option>
                </select>
              </div>
              <div className="filter-group">
                <div className="filter-label">Year</div>
                <select
                  className="select"
                  value={year}
                  onChange={(e) => handleYearChange(e.target.value)}
                >
                  <option value="all">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>
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
            ) : loading ? (
              <p className="question-text" style={{ marginTop: '1rem' }}>
                Loading…
              </p>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                <div className="page-section-subtitle" style={{ marginBottom: '0.5rem' }}>
                  Total: {questions.length}
                </div>
                <div className="questions-stack">
                  {questions.map((q) => {
                    const id = q?.id;
                    const questionSubject = q?.subject || subject;
                    const basePathPrefix = typeof window !== 'undefined' && window.__NEXT_DATA__?.assetPrefix
                      ? String(window.__NEXT_DATA__.assetPrefix)
                      : '/';

                    if (!id) return null;

                    const questionParts = Array.isArray(q.question) ? q.question : [];
                    const options = Array.isArray(q.choices) ? q.choices : [];
                    const answer = typeof q.correctAnswer === 'number' ? q.correctAnswer : null;

                    return (
                      <div
                        key={id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          gap: '0.75rem',
                          alignItems: 'start',
                        }}
                      >
                        <div className="question-block">
                          <div className="question-header">
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span className="badge-soft">{id}</span>
                              {typeof answer === 'number' ? (
                                <span className="badge-soft">Answer: {answer}</span>
                              ) : null}
                            </div>
                          </div>

                          {questionParts.map((part, idx) => {
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
                            {options.map((optParts, optIdx) => {
                              const parts = Array.isArray(optParts) ? optParts : [];
                              const isCorrect = optIdx === (typeof answer === 'number' ? answer - 1 : -1);
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

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Link
                            href={`/internal/questions/edit?subject=${questionSubject}&id=${encodeURIComponent(id)}`}
                            className=""
                            aria-label={`Edit ${id}`}
                            title="Edit"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.35rem',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '9999px',
                              lineHeight: 1,
                            }}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M4 20h4l10.5-10.5a1.5 1.5 0 0 0 0-2.12L15.62 4.5a1.5 1.5 0 0 0-2.12 0L3 15v5z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M13.5 6.5l4 4"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </Link>
                        </div>
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
