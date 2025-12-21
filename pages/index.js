import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { v7 as uuidv7 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const SUBJECTS = useMemo(
    () => [
      { value: 'bio', label: 'Biology' },
      { value: 'phy', label: 'Physics' },
      { value: 'chem', label: 'Chemistry' },
      { value: 'mat', label: 'Mathematics' },
    ],
    []
  );
  const [subject, setSubject] = useState(SUBJECTS[0]?.value || 'bio');

  const generateSessionId = () => uuidv7();

  const handleStartMockTest = () => {
    const sessionId = generateSessionId();
    router.push(`/mock-test/${encodeURIComponent(subject)}?year=random&session_id=${encodeURIComponent(sessionId)}`);
  };

  return (
    <main className="main-layout">
      <section className="card">
        <header className="card-header">
          <div>
            <div className="badge">KCET MOCK PORTAL</div>
            <h1 className="title">Karnataka CET practice, reimagined.</h1>
            <p className="subtitle">
              Take an exam-style mock test with a live timer, or quickly
              download previous year question papers by year and subject.
            </p>
          </div>
          <div className="timer-panel">
            <span className="timer-label">Typical KCET duration</span>
            <span className="timer-display">01:20:00</span>
            <span className="timer-label">4 sections · 60 questions each</span>
          </div>
        </header>

        <div className="actions-grid">
          <div className="action-card" role="group" aria-label="Take mock test">
            <div className="action-label">Option 1</div>
            <div className="action-title">Take mock test</div>
            <p className="action-desc">
              Pick a subject, then start an exam-mode session with a visible countdown timer.
            </p>

            <div className="filter-group" style={{ marginTop: '0.85rem' }}>
              <div className="filter-label">Subject</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="select"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{ flex: 1 }}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleStartMockTest}
                >
                  Start
                </button>
              </div>
            </div>

            <div className="chip-row" style={{ marginTop: '0.75rem' }}>
              <span className="chip">Live timer</span>
              <span className="chip">Focused layout</span>
              <span className="chip">Random questions</span>
            </div>
          </div>

          <Link href="/previous-papers?sub=all&year=all">
            <div className="action-card">
              <div className="action-label">Option 2</div>
              <div className="action-title">Previous exam papers</div>
              <p className="action-desc">
                Browse year-wise, subject-wise KCET question papers and
                download them as PDFs.
              </p>
              
              <div style={{ marginTop: '0.85rem', height: '4rem' }}></div>

              <div className="chip-row" style={{ marginTop: '0.75rem' }}>
                <span className="chip">Year-wise</span>
                <span className="chip">Subject-wise</span>
                <span className="chip">Quick download</span>
              </div>
            </div>
          </Link>
        </div>

        <footer className="footer">
          <div>
            <div>Designed for quick KCET revision and timed practice.</div>
          </div>
          <div className="footer-pill">
            <span className="footer-dot" />
            <span>
              <strong>Tip:</strong> Start with a mock test, then revise using
              past papers.
            </span>
          </div>
        </footer>
      </section>
    </main>
  );
}
