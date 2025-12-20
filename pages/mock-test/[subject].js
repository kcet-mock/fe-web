import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

// 60-minute mock test timer (in seconds)
const TEST_DURATION_SECONDS = 60 * 60;
const DEFAULT_QUESTION_COUNT = 60;

const SUBJECTS = [
  { value: 'bio', label: 'Biology' },
  { value: 'phy', label: 'Physics' },
  { value: 'chem', label: 'Chemistry' },
  { value: 'mat', label: 'Mathematics' },
];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function isImageToken(token) {
  return typeof token === 'string' && (token.startsWith('images/') || token.startsWith('image/'));
}

function imageTokenToSrc(token, basePathPrefix) {
  const stripped = token.startsWith('image/') ? token.slice('image/'.length) : token;
  const relativePath = stripped.replace(/^\/+/, '');
  return `${basePathPrefix}${relativePath}`;
}

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
  const attemptedPercent = totalQuestions ? Math.round((attemptedCount / totalQuestions) * 100) : 0;

  const scrollToQuestion = (questionNumber) => {
    if (typeof document === 'undefined') return;
    const target = document.getElementById(`question-${questionNumber}`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside className="test-sidebar only-desktop">
      <div className="timer-panel timer-panel--floating">
        <TimerContent remaining={remaining} running={running} finished={finished} />

        <div style={{ marginTop: '0.75rem' }}>
          <div className="page-section-subtitle" style={{ marginBottom: '0.35rem' }}>
            Test summary
          </div>
          <div className="test-sidebar-summary-row">
            <span>Progress</span>
            <span>{attemptedPercent}%</span>
          </div>
          <div className="test-summary-progress">
            <div className="test-summary-progress-bar" style={{ width: `${attemptedPercent}%` }} />
          </div>
          <div className="question-summary-grid">
            {questions.map((_, index) => {
              const isAttempted = answers[index] !== undefined;
              return (
                <button
                  type="button"
                  key={index}
                  className={`question-summary-item${isAttempted ? ' question-summary-item--attempted' : ''}`}
                  onClick={() => scrollToQuestion(index + 1)}
                  aria-label={`Jump to question ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

function sampleWithoutReplacement(items, count) {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
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
    const { ALL_QUESTION_IDS } = await import(`../../data/${subject}/_all.js`);
    allIds = ALL_QUESTION_IDS;
  } catch (error) {
    console.error(`Failed to load questions for subject: ${subject}`, error);
    // Fallback to biology if subject data not found
    const { ALL_QUESTION_IDS } = await import('../../data/bio/_all.js');
    allIds = ALL_QUESTION_IDS;
  }

  const questionsDir = path.join(process.cwd(), 'data', subject);
  const questions = await Promise.all(
    allIds.map(async (id) => {
      const filePath = path.join(questionsDir, `${id}.json`);
      const raw = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(raw);
    })
  );

  // Pre-load available years for this subject
  const availableYears = [];
  const dataDir = path.join(process.cwd(), 'data', subject);
  try {
    const files = await fs.readdir(dataDir);
    const yearFiles = files.filter(f => /^_(\d{4})\.js$/.test(f));
    availableYears.push(...yearFiles.map(f => parseInt(f.match(/^_(\d{4})\.js$/)[1])));
  } catch (error) {
    // ignore
  }

  return { props: { subject, allIds, questions, availableYears: availableYears.sort((a, b) => b - a) } };
}

export default function MockTestSubjectPage({ subject, allIds, questions, availableYears }) {
  const router = useRouter();
  const { year, session_id } = router.query;
  
  const ALL_IDS = Array.isArray(allIds) ? allIds : [];
  const ALL_QUESTIONS = Array.isArray(questions) ? questions : [];

  const questionsById = useMemo(() => {
    const map = new Map();
    ALL_QUESTIONS.forEach((q) => {
      if (q && typeof q.id === 'string') map.set(q.id, q);
    });
    return map;
  }, [ALL_QUESTIONS]);

  // Filter questions by year if year parameter is provided
  const filteredIds = useMemo(() => {
    if (!year || year === 'random') return ALL_IDS;
    
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) return ALL_IDS;
    
    // Filter questions that have the specified year
    return ALL_QUESTIONS
      .filter(q => q.years && Array.isArray(q.years) && q.years.includes(yearNum))
      .map(q => q.id);
  }, [year, ALL_IDS, ALL_QUESTIONS]);

  const [selectedIds, setSelectedIds] = useState([]);
  const [remaining, setRemaining] = useState(TEST_DURATION_SECONDS);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState({});
  const hasAutoSubmittedRef = useRef(false);

  const selectedQuestions = useMemo(() => {
    return selectedIds.map((id) => questionsById.get(id)).filter(Boolean);
  }, [selectedIds, questionsById]);

  useEffect(() => {
    const idsToUse = filteredIds.length > 0 ? filteredIds : ALL_IDS;
    const safeCount = Math.max(0, Math.min(DEFAULT_QUESTION_COUNT, idsToUse.length));
    setSelectedIds(sampleWithoutReplacement(idsToUse, safeCount));
  }, [filteredIds, ALL_IDS]);

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

  useEffect(() => {
    if (!finished) return;
    if (hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;
    handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

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

    selectedQuestions.forEach((q, index) => {
      const selected = answers[index];
      if (selected === undefined) return;
      const correctIndex = typeof q.correctAnswer === 'number' ? q.correctAnswer : -1;
      if (selected === correctIndex) correctCount += 1;
    });

    if (typeof window !== 'undefined') {
      const sessionIdFromQuery =
        typeof router?.query?.session_id === 'string' ? router.query.session_id : undefined;
      const payload = {
        answers,
        timeTakenSeconds,
        totalQuestions: selectedQuestions.length,
        correctCount,
        attemptedCount: answeredCount,
        subject,
        questionIds: selectedIds,
        session_id: sessionIdFromQuery,
      };

      try {
        const storageKey = sessionIdFromQuery 
          ? `kcetMockTestResult_${sessionIdFromQuery}`
          : 'kcetMockTestResult';
        window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (e) {
        // ignore
      }
    }

    const sessionIdFromQuery =
      typeof router?.query?.session_id === 'string' ? router.query.session_id : undefined;
    const resultsUrl = sessionIdFromQuery
      ? `/results/${encodeURIComponent(subject)}?session_id=${encodeURIComponent(sessionIdFromQuery)}`
      : `/results/${encodeURIComponent(subject)}`;
    router.replace(resultsUrl);
  };

  const subjectLabel = SUBJECTS.find((s) => s.value === subject)?.label || subject;
  const QUESTIONS = selectedQuestions;
  
  const yearDisplay = year && year !== 'random' ? ` ${year}` : '';
  const testTypeLabel = year && year !== 'random' ? 'Previous Year Paper' : 'Mock Test';

  return (
    <main className="main-layout main-layout--top">
      <section>
        <header className="card-header">
          <div>
            <div className="badge">{testTypeLabel} · {subjectLabel}{yearDisplay}</div>
            <h1 className="title">KCET {testTypeLabel.toLowerCase()} · {subjectLabel}</h1>
            <p className="subtitle">
              {year && year !== 'random' 
                ? `Practicing ${QUESTIONS.length} questions from KCET ${year}. Timer is always visible.`
                : 'Timer is always visible so you can practice managing your time like the real exam.'}
            </p>
          </div>
        </header>

        <MobileTimer remaining={remaining} running={running} finished={finished} />

        <div className="test-layout">
          <div>
            <div className="badge-soft">Questions</div>
            <h2 className="page-section-title" style={{ marginTop: '0.75rem' }}>
              All questions on a single page
            </h2>
            <p className="question-text">Scroll down to view and select options for every question below.</p>

            <div className="questions-stack">
              {QUESTIONS.map((q, index) => {
                const selectedOption = answers[index];
                const questionNumber = index + 1;
                const options = Array.isArray(q.choices) ? q.choices : [];
                const basePathPrefix = router.basePath ? `${router.basePath}/` : '/';
                const questionParts = Array.isArray(q.question) ? q.question : [];

                return (
                  <div key={q.id || questionNumber} id={`question-${questionNumber}`} className="question-block">
                    <div className="question-header">
                      <span className="badge-soft">
                        Question {questionNumber} of {QUESTIONS.length}
                      </span>
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
                          {part}
                        </p>
                      );
                    })}

                    <div className="options-list">
                      {options.map((optionParts, optionIndex) => {
                        const isSelected = selectedOption === optionIndex;
                        const parts = Array.isArray(optionParts) ? optionParts : [];
                        return (
                          <button
                            type="button"
                            key={optionIndex}
                            className={`option-pill${isSelected ? ' option-pill--selected' : ''}`}
                            onClick={() => handleSelectOption(index, optionIndex)}
                          >
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
                                      style={{ maxWidth: '100%', height: 'auto' }}
                                    />
                                  </div>
                                );
                              }

                              return <span key={`o-${partIndex}`}>{part}</span>;
                            })}
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
