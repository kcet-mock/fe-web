import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import questionsData from '../data/questions.json';

const QUESTIONS = questionsData;

function isImageToken(token) {
  return typeof token === 'string' && token.startsWith('image/');
}

function imageTokenToSrc(token, basePathPrefix) {
  const relativePath = token.slice('image/'.length).replace(/^\/+/, '');
  return `${basePathPrefix}${relativePath}`;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.sessionStorage.getItem('kcetMockTestResult');
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setResult(parsed);
    } catch (e) {
      // Ignore parsing/storage errors and show fallback UI
    }
  }, []);

  const summary = useMemo(() => {
    if (!result) return null;

    const answers = result.answers || {};
    let correct = 0;
    let wrong = 0;
    let notAttempted = 0;
    const questionStatuses = [];

    QUESTIONS.forEach((q, index) => {
      const selected = answers[index];
      const correctIndex = typeof q.answer === 'number' ? q.answer - 1 : -1;

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
  }, [result]);

  if (!result) {
    return (
      <main className="main-layout main-layout--top">
        <section className="card">
          <header className="card-header">
            <div>
              <div className="badge">Results</div>
              <h1 className="title">No result data found</h1>
              <p className="subtitle">
                Please complete a mock test first. Once you submit your test,
                you will see a detailed breakdown of your performance here.
              </p>
            </div>
          </header>
          <div className="test-layout">
            <div className="test-questions">
              <p className="question-text">
                Go back to the mock test page to start a new attempt.
              </p>
              <Link href="/mock-test" className="button-primary">
                Start mock test
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { timeTakenSeconds, totalQuestions, correctCount, attemptedCount } = result;
  const { correct, wrong, notAttempted, questionStatuses } = summary || {};
  const attemptedPercent = totalQuestions
    ? Math.round((attemptedCount / totalQuestions) * 100)
    : 0;

  const breakdownCard = (
    <div className="results-metric-card">
      <div className="results-metric-label">Breakdown</div>
      <div className="results-breakdown-row">
        <span className="status-pill status-pill--correct">Correct: {correct}</span>
        <span className="status-pill status-pill--wrong">Wrong: {wrong}</span>
        <span className="status-pill status-pill--skipped">Not attempted: {notAttempted}</span>
      </div>
      <div
        className="page-section-subtitle"
        style={{ marginTop: '0.6rem', marginBottom: '0.35rem' }}
      >
        Test summary
      </div>
      <div className="test-sidebar-summary-row">
        <span>Progress</span>
        <span>{attemptedPercent}%</span>
      </div>
      <div className="test-summary-progress">
        <div
          className="test-summary-progress-bar"
          style={{ width: `${attemptedPercent}%` }}
        />
      </div>
      <div className="question-summary-grid">
        {QUESTIONS.map((_, index) => {
          const status = questionStatuses ? questionStatuses[index] : 'skipped';
          let itemClass = 'question-summary-item';
          if (status === 'correct') {
            itemClass += ' question-summary-item--correct';
          } else if (status === 'wrong') {
            itemClass += ' question-summary-item--wrong';
          } else {
            itemClass += ' question-summary-item--skipped';
          }

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
    </div>
  );

  return (
    <main className="main-layout main-layout--top">
      <section>
        <header className="card-header">
          <div>
            <div className="badge">Results</div>
            <h1 className="title">Mock test summary</h1>
            <p className="subtitle">
              Review your performance, understand which questions you got right
              or wrong, and identify topics to revise.
            </p>
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
              </div>

              <div className="only-mobile">{breakdownCard}</div>

              <div className="results-actions">
                <Link href="/mock-test" className="button-secondary">
                  Retake mock test
                </Link>
                <Link href="/" className="button-primary">
                  Back to home
                </Link>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div className="badge-soft">Question-wise review</div>
              <h2 className="page-section-title" style={{ marginTop: '0.75rem' }}>
                Which questions were correct, wrong or not attempted
              </h2>
              <p className="question-text">
                Options below are read-only: you can&apos;t change any answers here.
                Use this view purely to analyse your performance.
              </p>

              <div className="questions-stack">
                {QUESTIONS.map((q, index) => {
                const questionNumber = index + 1;
                const selected = result.answers[index];
                const correctIndex = typeof q.answer === 'number' ? q.answer - 1 : -1;
                const options = Array.isArray(q.options) ? q.options : [];
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
                    <div
                      key={questionNumber}
                      id={`question-${questionNumber}`}
                      className="question-block"
                    >
                      <div className="question-header results-question-header">
                        <span className="badge-soft">
                          Question {questionNumber} of {QUESTIONS.length}
                        </span>
                        <span className={statusClass}>{statusLabel}</span>
                      </div>
                      {questionParts.map((part, partIndex) => {
                        if (isImageToken(part)) {
                          const src = imageTokenToSrc(part, basePathPrefix);
                          return (
                            <div key={`q-${partIndex}`} className="question-image">
                              <img
                                src={src}
                                alt={`Question ${questionNumber}`}
                                style={{ maxWidth: '100%', height: 'auto' }}
                              />
                            </div>
                          );
                        }

                        return (
                          <p key={`q-${partIndex}`} className="question-text">
                            {part}
                          </p>
                        );
                      })}
                      <div className="options-list">
                        {options.map((optionParts, optionIndex) => {
                          const parts = Array.isArray(optionParts) ? optionParts : [];
                          const isCorrectOption = optionIndex === correctIndex;
                          const isSelectedOption = optionIndex === selected;

                          let optionClass = 'option-pill option-pill--static';
                          if (isCorrectOption) {
                            optionClass += ' option-pill--correct';
                          }
                          if (isSelectedOption && !isCorrectOption) {
                            optionClass += ' option-pill--wrong';
                          }

                          return (
                            <div key={optionIndex} className={optionClass}>
                              <span className="option-circle" />
                              {parts.map((part, partIndex) => {
                                if (isImageToken(part)) {
                                  const src = imageTokenToSrc(part, basePathPrefix);
                                  return (
                                    <div key={`o-${partIndex}`} className="option-image">
                                      <img
                                        src={src}
                                        alt={`Question ${questionNumber} option ${optionIndex + 1}`}
                                        style={{ maxWidth: '100%', height: 'auto' }}
                                      />
                                    </div>
                                  );
                                }

                                return <span key={`o-${partIndex}`}>{part}</span>;
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="results-sidebar only-desktop">
            <div className="results-sidebar-panel">{breakdownCard}</div>
          </aside>
        </div>
      </section>
    </main>
  );
}
