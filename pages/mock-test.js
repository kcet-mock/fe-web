import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import questionsData from '../data/questions.json';

// 60-minute mock test timer (in seconds)
const TEST_DURATION_SECONDS = 60 * 60;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Questions data is sourced from data/questions.json
const QUESTIONS = questionsData;

function TimerContent({ remaining, running, finished }) {
  return (
    <>
      <span className="timer-label">Remaining time</span>
      <span className="timer-display">{formatTime(remaining)}</span>
      {finished ? (
        <span className="timer-label">Time&apos;s up! Submit your test.</span>
      ) : running ? (
        <span className="timer-label">Timer is running</span>
      ) : (
        <span className="timer-label">Timer is paused</span>
      )}
    </>
  );
}

function MobileTimer({ remaining, running, finished }) {
  return (
    <div className="only-mobile">
      <div className="timer-panel timer-panel--mobile">
        <TimerContent remaining={remaining} running={running} finished={finished} />
      </div>
    </div>
  );
}

function DesktopTimerWithSummary({ remaining, running, finished, answers, questions }) {
  const attemptedCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <aside className="test-sidebar only-desktop">
      <div className="timer-panel timer-panel--floating">
        <TimerContent remaining={remaining} running={running} finished={finished} />

        <div style={{ marginTop: '0.75rem' }}>
          <div className="page-section-subtitle" style={{ marginBottom: '0.35rem' }}>
            Test summary
          </div>
          <div className="test-sidebar-summary-row">
            <span>Attempted: {attemptedCount}</span>
            <span>Unattempted: {totalQuestions - attemptedCount}</span>
          </div>
          <div className="question-summary-grid">
            {questions.map((_, index) => {
              const isAttempted = answers[index] !== undefined;
              return (
                <div
                  key={index}
                  className={`question-summary-item${
                    isAttempted ? ' question-summary-item--attempted' : ''
                  }`}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function MockTestPage() {
  const router = useRouter();
  const [remaining, setRemaining] = useState(TEST_DURATION_SECONDS);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (!running || finished) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, finished]);

  const handleStart = () => {
    setRemaining(TEST_DURATION_SECONDS);
    setFinished(false);
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
  };

  const handleResume = () => {
    if (remaining > 0) setRunning(true);
  };

  const handleSelectOption = (questionIndex, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    const timeTakenSeconds = TEST_DURATION_SECONDS - remaining;
    const answeredCount = Object.keys(answers).length;
    let correctCount = 0;

    QUESTIONS.forEach((q, index) => {
      const selected = answers[index];
      if (selected === undefined) return;
      // answers in JSON are 1-based, selected is 0-based
      const correctIndex = typeof q.answer === 'number' ? q.answer - 1 : -1;
      if (selected === correctIndex) {
        correctCount += 1;
      }
    });

    if (typeof window !== 'undefined') {
      const payload = {
        answers,
        timeTakenSeconds,
        totalQuestions: QUESTIONS.length,
        correctCount,
        attemptedCount: answeredCount,
      };

      try {
        window.sessionStorage.setItem('kcetMockTestResult', JSON.stringify(payload));
      } catch (e) {
        // If sessionStorage is not available, we still navigate, but results page may not load data
      }
    }

    router.push('/results');
  };

  return (
    <main className="main-layout main-layout--top">
      <section>
        <header className="card-header">
          <div>
            <div className="badge">Mock Test · Option 1</div>
            <h1 className="title">KCET full-length mock test</h1>
            <p className="subtitle">
              Timer is always visible so you can practice managing your
              time like the real exam.
            </p>
          </div>
        </header>

        <MobileTimer remaining={remaining} running={running} finished={finished} />

        <div className="test-layout">
          <div>
            <div className="badge-soft">Sample questions</div>
            <h2 className="page-section-title" style={{ marginTop: '0.75rem' }}>
              All questions on a single page
            </h2>
            <p className="question-text">
              Scroll down to view and select options for every question below.
            </p>

            <div className="questions-stack">
              {QUESTIONS.map((q, index) => {
                const selectedOption = answers[index];
                const questionNumber = index + 1;
                const options = q.options || [];
                const basePathPrefix = router.basePath ? `${router.basePath}/` : '/';
                const questionImageSrc = q.question?.image
                  ? `${basePathPrefix}${q.question.image.replace(/^\/+/, '')}`
                  : null;
                return (
                  <div key={questionNumber} className="question-block">
                    <div className="question-header">
                      <span className="badge-soft">
                        Question {questionNumber} of {QUESTIONS.length}
                      </span>
                    </div>
                    {q.question?.text && (
                      <p className="question-text">{q.question.text}</p>
                    )}
                    {questionImageSrc && (
                      <div className="question-image">
                        <img
                          src={questionImageSrc}
                          alt={`Question ${questionNumber}`}
                          style={{ maxWidth: '100%', height: 'auto' }}
                        />
                      </div>
                    )}
                    <div className="options-list">
                      {options.map((option, optionIndex) => {
                        const isSelected = selectedOption === optionIndex;
                        const optionImageSrc = option?.image
                          ? `${basePathPrefix}${option.image.replace(/^\/+/, '')}`
                          : null;
                        return (
                          <button
                            type="button"
                            key={optionIndex}
                            className={`option-pill${
                              isSelected ? ' option-pill--selected' : ''
                            }`}
                            onClick={() => handleSelectOption(index, optionIndex)}
                          >
                            <span
                              className={`option-circle${
                                isSelected ? ' option-circle--selected' : ''
                              }`}
                            />
                            {option?.text && <span>{option.text}</span>}
                            {optionImageSrc && (
                              <div className="option-image">
                                <img
                                  src={optionImageSrc}
                                  alt={`Question ${questionNumber} option ${optionIndex + 1}`}
                                  style={{ maxWidth: '100%', height: 'auto' }}
                                />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="test-footer">
              <span>
                Selected {Object.keys(answers).length} out of {QUESTIONS.length} questions.
              </span>
              <button type="button" className="button-primary" onClick={handleSubmit}>
                Submit test
              </button>
            </div>
          </div>

          <DesktopTimerWithSummary
            remaining={remaining}
            running={running}
            finished={finished}
            answers={answers}
            questions={QUESTIONS}
          />
        </div>
      </section>
    </main>
  );
}
