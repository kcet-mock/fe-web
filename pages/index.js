import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { v7 as uuidv7 } from 'uuid';
import { analytics } from '../lib/analytics';

export default function Home() {
    // For Previous KCET Papers card dropdowns
    const [prevYear, setPrevYear] = useState('all');
    const [prevSub, setPrevSub] = useState('all');
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

  const handleSubjectChange = (newSubject) => {
    setSubject(newSubject);
    analytics.trackSubjectSelected(newSubject, 'home');
  };

  const generateSessionId = () => uuidv7();

  const handleStartMockTest = () => {
    const sessionId = generateSessionId();
    analytics.trackNavigation('home', 'mock-test');
    router.push(`/mock-test/${encodeURIComponent(subject)}?year=random&session_id=${encodeURIComponent(sessionId)}`);
  };

  return (

    <main className="main-layout">
      <section className="card">
        <header className="card-header">
          <div>
            <div className="badge">KCET MOCK PORTAL</div>
            <h1 className="title">Crack Karnataka CET with Real Exam Papers</h1>
            <p className="subtitle">
              Practice with mocks designed exactly like the Karnataka CET — syllabus-mapped, timed, and rank-predictive.
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
            <div className="action-title">Start Free KCET Mock Test</div>
            <p className="action-desc">
              Choose a subject and start an exam-mode session. Questions are picked at random from previous years and by difficulty level for a real exam experience.
            </p>

            <div className="filter-group" style={{ marginTop: '0.85rem' }}>
              <div className="filter-label">Subject</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="select"
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
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

          <div className="action-card">
              <div className="action-label">Option 2</div>
              <div className="action-title">Attempt Previous KCET Papers</div>
              <p className="action-desc">
                Choose the year and subject you want to solve, and attempt previous KCET exam papers. Practice with real questions and see instant solutions and scoring.
              </p>

              {/* Dropdowns and Start button */}
              <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', width: '100%', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', width: '100%', whiteSpace: 'nowrap', overflowX: 'auto', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%', alignItems: 'center', justifyContent: 'flex-start' }}>
                      <select
                        className="select"
                        value={prevYear}
                        onChange={e => setPrevYear(e.target.value)}
                        style={{ flex: '1 1 120px', minWidth: 90, maxWidth: '100%' }}
                      >
                        <option value="all">Year</option>
                        {[2025,2024,2023].map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      <select
                        className="select"
                        value={prevSub}
                        onChange={e => setPrevSub(e.target.value)}
                        style={{ flex: '1 1 120px', minWidth: 90, maxWidth: '100%' }}
                      >
                        <option value="all">Subject</option>
                        {['phy','chem','mat','bio'].map((subject) => (
                          <option key={subject} value={subject}>
                            {subject === 'phy' ? 'Physics' : subject === 'chem' ? 'Chemistry' : subject === 'mat' ? 'Mathematics' : 'Biology'}
                          </option>
                        ))}
                      </select>
                      <button
                        className="button-primary"
                        style={{ flex: '1 1 120px', minWidth: 90, fontWeight: 600, fontSize: '1rem', maxWidth: '100%' }}
                        disabled={prevYear === 'all' || prevSub === 'all'}
                        onClick={() => {
                          if (prevYear !== 'all' && prevSub !== 'all') {
                            const sessionId = uuidv7();
                            router.push(`/mock-test/${prevSub}?year=${prevYear}&session_id=${sessionId}`);
                            analytics.trackNavigation('home', 'mock-test');
                            analytics.trackSubjectSelected(prevSub, 'home');
                          }
                        }}
                      >
                        Start
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chip-row" style={{ marginTop: '0.75rem' }}>
                <span className="chip">Year-wise</span>
                <span className="chip">Subject-wise</span>
                <span className="chip">Quick download</span>
              </div>
            </div>
        </div>

        {/* Trust Bar - now below cards */}
                {/* Trusted by thousands card */}
                <div style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '1.5rem',
                  width: '100%',
                     margin: '1.1rem 0 0.5rem 0',
                     padding: '1.1rem 1.5rem',
                  boxShadow: '0 12px 48px rgba(15,23,42,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.6rem',
                  fontSize: '2.16rem',
                  fontWeight: 700,
                  color: '#22223b',
                  justifyContent: 'center',
                }}>
                      {/* Logo removed for cleaner look */}
                      <span style={{ fontSize: '1.3rem', fontWeight: 500, color: '#22223b' }}>
                        Join a community of <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '2.16rem' }}>10,000+</span> KCET aspirants who use this platform.
                      </span>
                </div>
        <div style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '1rem',
          width: '100%',
          margin: '2.5rem 0 2.2rem 0',
          padding: '1.5rem 2rem',
          boxShadow: '0 6px 24px rgba(15,23,42,0.07)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '1.1rem', color: '#22223b' }}>
            <span style={{ color: '#22c55e' }}>Why KCET Aspirants Trust Us</span>
          </div>
          <ul style={{
            listStyle: 'disc',
            margin: '0 0 0 1.2rem',
            padding: 0,
            color: '#22223b',
            fontSize: '1.05rem',
            fontWeight: 500,
          }}>
            <li style={{ margin: '0.7rem 0' }}><strong>Based on the latest KCET exam papers:</strong> All questions and mocks are created using real, recent KCET papers and the official KEA syllabus.</li>
            <li style={{ margin: '0.7rem 0' }}><strong>All 4 subjects covered:</strong> Physics, Chemistry, Mathematics, and Biology — practice any or all, just like the real exam.</li>
            <li style={{ margin: '0.7rem 0' }}><strong>Trusted by thousands:</strong> Join a community of KCET aspirants who use this platform for serious, exam-style practice.</li>
            <li style={{ margin: '0.7rem 0' }}><strong>Absolutely free:</strong> No payments, no card details, and no hidden costs — just sign in and start practicing.</li>
            <li style={{ margin: '0.7rem 0' }}><strong>Open source & transparent:</strong> This project is fully open source — anyone can view, use, or contribute to the code.</li>
          </ul>
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
