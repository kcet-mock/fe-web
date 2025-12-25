import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import RenderContent from '../../components/RenderContent';
import { analytics } from '../../lib/analytics';

const SUBJECTS = [
  { value: 'bio', label: 'Biology' },
  { value: 'phy', label: 'Physics' },
  { value: 'chem', label: 'Chemistry' },
  { value: 'mat', label: 'Mathematics' },
];

function isImageToken(token) {
  return typeof token === 'string' && (token.startsWith('images/') || token.startsWith('image/'));
}

function imageTokenToSrc(token, basePathPrefix) {
  const stripped = token.startsWith('image/') ? token.slice('image/'.length) : token;
  const relativePath = stripped.replace(/^\/+/, '');
  return `${basePathPrefix}${relativePath}`;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export async function getStaticPaths() {
  return {
    paths: SUBJECTS.map((s) => ({ params: { subject: s.value } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  const fs = await import('fs/promises');
  const path = await import('path');

  const subject = typeof params?.subject === 'string' ? params.subject : 'bio';

  let allIds = [];
  try {
    const { QUESTION_IDS } = await import(`../../data/${subject}/_all.js`);
    allIds = QUESTION_IDS;
  } catch (error) {
    console.error(`Failed to load questions for subject: ${subject}`, error);
    // Fallback to biology if subject data not found
    const { QUESTION_IDS } = await import('../../data/bio/_all.js');
    allIds = QUESTION_IDS;
  }

  const questionsDir = path.join(process.cwd(), 'data', subject);
  const questions = await Promise.all(
    allIds.map(async (id) => {
      const filePath = path.join(questionsDir, `${id}.json`);
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    })
  );

  return { props: { subject, questions } };
}

export default function ResultsSubjectPage({ subject, questions }) {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [trackedExplanations, setTrackedExplanations] = useState(new Set());
  const ALL_QUESTIONS = Array.isArray(questions) ? questions : [];

  const questionsById = useMemo(() => {
    const map = new Map();
    ALL_QUESTIONS.forEach((q) => {
      if (q && typeof q.id === 'string') map.set(q.id, q);
    });
    return map;
  }, [ALL_QUESTIONS]);

  const selectedQuestions = useMemo(() => {
    const ids = Array.isArray(result?.questionIds) ? result.questionIds : [];
    return ids.map((id) => questionsById.get(id)).filter(Boolean);
  }, [result, questionsById]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sessionIdFromQuery =
        typeof router?.query?.session_id === 'string' ? router.query.session_id : undefined;
      const storageKey = sessionIdFromQuery 
        ? `kcetMockTestResult_${sessionIdFromQuery}`
        : 'kcetMockTestResult';
      const stored = window.sessionStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setResult(parsed);
    } catch (e) {
      // ignore
    }
  }, [router.query.session_id]);

  // Track explanations viewed using IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined' || !result) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const questionId = entry.target.getAttribute('data-question-id');
            const questionIndex = entry.target.getAttribute('data-question-index');
            
            if (questionId && !trackedExplanations.has(questionId)) {
              const question = selectedQuestions[parseInt(questionIndex)];
              const wasCorrect = result.answers[questionIndex] === question?.correctAnswer;
              
              // Track explanation viewed
              analytics.trackExplanationViewed(question, subject, wasCorrect, 0);
              
              setTrackedExplanations(prev => new Set(prev).add(questionId));
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all explanation sections
    const explanationElements = document.querySelectorAll('.explanation-section');
    explanationElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [result, selectedQuestions, subject, trackedExplanations]);

  const summary = (() => {
    if (!result) return null;

    const answers = result.answers || {};
    let correct = 0;
    let wrong = 0;
    let notAttempted = 0;
    const questionStatuses = [];

    selectedQuestions.forEach((q, index) => {
      const selected = answers[index];
      const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : -1;

      if (selected === undefined) {
        notAttempted += 1;
        questionStatuses[index] = 'skipped';
      } else if (selected === correctIndex) {
        correct += 1;
        questionStatuses[index] = 'correct';
      } else {
        wrong += 1;
        questionStatuses[index] = 'wrong';
      }
    });

    return { correct, wrong, notAttempted, questionStatuses };
  })();

  const subjectLabel = SUBJECTS.find((s) => s.value === subject)?.label || subject;

  if (!result) {
    return (
      <main className="main-layout main-layout--top">
        <section className="card">
          <header className="card-header">
            <div>
              <div className="badge">Results</div>
              <h1 className="title">No result data found</h1>
              <p className="subtitle">Please complete a mock test first.</p>
            </div>
          </header>
          <div className="test-layout">
            <div className="test-questions">
              <Link href={`/mock-test/${encodeURIComponent(subject)}`} className="button-primary">
                Start mock test · {subjectLabel}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }


  const { timeTakenSeconds, totalQuestions, correctCount, attemptedCount } = result;
  const { correct, wrong, notAttempted, questionStatuses } = summary || {};
  const attemptedPercent = totalQuestions ? Math.round((attemptedCount / totalQuestions) * 100) : 0;

  // Accuracy: correct / attempted
  const accuracy = attemptedCount ? (correctCount / attemptedCount) : 0;
  // Efficiency: (totalQuestions / examTime) / (attemptedCount / timeTakenSeconds)
  // Assume exam time is 80 minutes (4800 seconds)
  const EXAM_TIME_SECONDS = 80 * 60;
  const efficiency = (attemptedCount && timeTakenSeconds)
    ? ((attemptedCount / timeTakenSeconds) / (totalQuestions / EXAM_TIME_SECONDS))
    : 0;

  const breakdownCard = (
    <>
      <div className="results-metric-label">Breakdown</div>
      <div className="results-breakdown-row">
        <span className="status-pill status-pill--correct">Correct: {correct}</span>
        <span className="status-pill status-pill--wrong">Wrong: {wrong}</span>
        <span className="status-pill status-pill--skipped">Not attempted: {notAttempted}</span>
      </div>
      <div className="page-section-subtitle" style={{ marginTop: '0.6rem', marginBottom: '0.35rem' }}>
        Test summary
      </div>
      <div className="test-sidebar-summary-row">
        <span>Progress</span>
        <span>{attemptedPercent}%</span>
      </div>
      <div className="test-sidebar-summary-row">
        <span>Accuracy</span>
        <span>{(accuracy * 100).toFixed(1)}%</span>
      </div>
      <div className="test-sidebar-summary-row">
        <span>Efficiency</span>
        <span>{(efficiency * 100).toFixed(1)}%</span>
      </div>
      <div className="test-summary-progress">
        <div className="test-summary-progress-bar" style={{ width: `${attemptedPercent}%` }} />
      </div>
      <div className="question-summary-grid">
        {selectedQuestions.map((_, index) => {
          const status = questionStatuses ? questionStatuses[index] : 'skipped';
          let itemClass = 'question-summary-item';
          if (status === 'correct') itemClass += ' question-summary-item--correct';
          else if (status === 'wrong') itemClass += ' question-summary-item--wrong';
          else itemClass += ' question-summary-item--skipped';

          const handleJump = () => {
            if (typeof document === 'undefined') return;
            const target = document.getElementById(`question-${index + 1}`);
            if (!target) return;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          };

          return (
            <button
              type="button"
              key={index}
              className={itemClass}
              onClick={handleJump}
              aria-label={`Jump to question ${index + 1}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <main className="main-layout main-layout--top">
      <section>
        <header className="card-header">
          <div>
            <div className="badge">Results</div>
            <h1 className="title">Mock test summary · {subjectLabel}</h1>
            <p className="subtitle">Review your performance and revise efficiently.</p>
          </div>
        </header>

        <div className="results-layout">
          <div>
            <div className="results-summary">

              <div className="results-metrics">
                <div className="results-metric-card">
                  <div className="results-metric-label">Score</div>
                  <div className="results-metric-value">
                    {correctCount} / {totalQuestions}
                  </div>
                  <div className="results-metric-sub">
                    Attempted {attemptedCount} question{attemptedCount === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="results-metric-card">
                  <div className="results-metric-label">Time taken</div>
                  <div className="results-metric-value">{formatTime(timeTakenSeconds)}</div>
                  <div className="results-metric-sub">of 60:00 total</div>
                </div>
                <div className="results-metric-card">
                  <div className="results-metric-label">Accuracy</div>
                  <div className="results-metric-value">{(accuracy * 100).toFixed(1)}%</div>
                  <div className="results-metric-sub">Correct / Attempted</div>
                </div>
                <div className="results-metric-card">
                  <div className="results-metric-label">Efficiency</div>
                  <div className="results-metric-value">{(efficiency * 100).toFixed(1)}%</div>
                  <div className="results-metric-sub">Speed vs exam avg</div>
                </div>
              </div>

              <div className="only-mobile">
                <div className="results-metric-card">
                  {breakdownCard}
                </div>
              </div>

              <div className="results-actions">
                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => {
                    const { year } = router.query;
                    let url = `/mock-test/${encodeURIComponent(subject)}`;
                    const params = [];
                    if (year) params.push(`year=${encodeURIComponent(year)}`);
                    // Generate a new UUID v4 for session_id
                    function uuidv4() {
                      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                      });
                    }
                    params.push(`session_id=${uuidv4()}`);
                    if (params.length > 0) url += `?${params.join('&')}`;
                    router.replace(url);
                  }}
                >
                  Retake mock test
                </button>
                <button
                  className="button-primary"
                  type="button"
                  onClick={() => router.replace('/')}
                >
                  Back to home
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div className="badge-soft">Question-wise review</div>
              <h2 className="page-section-title" style={{ marginTop: '0.75rem' }}>
                Which questions were correct, wrong or not attempted
              </h2>
              <p className="question-text">
                Options below are read-only: you can&apos;t change any answers here.
              </p>

              <div className="questions-stack">
                {selectedQuestions.map((q, index) => {
                  const questionNumber = index + 1;
                  const selected = result.answers[index];
                  const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : -1;
                  const options = Array.isArray(q.choices) ? q.choices : [];
                  const basePathPrefix = router.basePath ? `${router.basePath}/` : '/';
                  const questionParts = Array.isArray(q.question) ? q.question : [];

                  let statusLabel = 'Not attempted';
                  let statusClass = 'status-pill status-pill--skipped';

                  if (selected !== undefined) {
                    if (selected === correctIndex) {
                      statusLabel = 'Correct';
                      statusClass = 'status-pill status-pill--correct';
                    } else {
                      statusLabel = 'Wrong';
                      statusClass = 'status-pill status-pill--wrong';
                    }
                  }

                  return (
                    <div key={q.id || questionNumber} id={`question-${questionNumber}`} className="question-block" data-question-id={q.id}>
                      <div className="question-header">
                        <span className="badge-soft">
                          Question {questionNumber} of {selectedQuestions.length}
                        </span>
                        <span className={statusClass}>{statusLabel}</span>
                      </div>

                      {questionParts.map((part, partIndex) => {
                        if (isImageToken(part)) {
                          const src = imageTokenToSrc(part, basePathPrefix);
                          return (
                            <div key={`q-${partIndex}`} className="question-image">
                              <Image
                                src={src}
                                alt={`Question ${questionNumber}`}
                                width={1200}
                                height={800}
                                style={{ maxWidth: '100%', height: 'auto' }}
                              />
                            </div>
                          );
                        }

                        return (
                          <p key={`q-${partIndex}`} className="question-text">
                            <RenderContent>{part}</RenderContent>
                          </p>
                        );
                      })}

                      <div className="options-list">
                        {options.map((optionParts, optionIndex) => {
                          const isSelected = selected === optionIndex;
                          const parts = Array.isArray(optionParts) ? optionParts : [];

                          let optionClass = 'option-pill option-pill--static';
                          if (optionIndex === correctIndex) optionClass += ' option-pill--correct';
                          else if (isSelected && optionIndex !== correctIndex) optionClass += ' option-pill--wrong';

                          return (
                            <div key={optionIndex} className={optionClass}>
                              <span className={`option-circle${isSelected ? ' option-circle--selected' : ''}`} />
                              {parts.map((part, partIndex) => {
                                if (isImageToken(part)) {
                                  const src = imageTokenToSrc(part, basePathPrefix);
                                  return (
                                    <div key={`o-${partIndex}`} className="option-image">
                                      <Image
                                        src={src}
                                        alt={`Question ${questionNumber} option ${optionIndex + 1}`}
                                        width={1200}
                                        height={800}
                                        style={{ maxWidth: '200px', maxHeight: '200px', width: 'auto', height: 'auto' }}
                                      />
                                    </div>
                                  );
                                }
                                return (
                                  <span key={`o-${partIndex}`}>
                                    <RenderContent>{part}</RenderContent>
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div 
                          className="explanation-section"
                          data-question-id={q.id}
                          data-question-index={index}
                          style={{ marginTop: '1rem', background: '#ede9fe', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}
                        >
                          <div className="badge-soft" style={{ marginBottom: '0.5rem', background: '#a78bfa', color: '#fff', display: 'inline-block', minWidth: 0 }}>Explanation</div>
                          <div className="explanation-content">
                            {Array.isArray(q.explanation) ? q.explanation.map((part, partIndex) => {
                              if (isImageToken(part)) {
                                const src = imageTokenToSrc(part, basePathPrefix);
                                return (
                                  <div key={`exp-${partIndex}`} className="question-image">
                                    <Image
                                      src={src}
                                      alt={`Explanation for question ${questionNumber}`}
                                      width={1200}
                                      height={800}
                                      style={{ maxWidth: '100%', height: 'auto' }}
                                    />
                                  </div>
                                );
                              }
                              return (
                                <p key={`exp-${partIndex}`} className="explanation-text">
                                    <RenderContent>{part}</RenderContent>
                                </p>
                              );
                            }) : (
                              <p className="explanation-text">{q.explanation}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="only-desktop" style={{ marginTop: '1.25rem' }}>
                <div className="results-metric-card">
                  {breakdownCard}
                </div>
              </div>
            </div>
          </div>

          <aside className="test-sidebar only-desktop">
            <div className="timer-panel timer-panel--floating">
              {breakdownCard}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
