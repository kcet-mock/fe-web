import Link from 'next/link';

export default function Home() {
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
            <span className="timer-label">3 sections · 60 questions</span>
          </div>
        </header>

        <div className="actions-grid">
          <Link href="/mock-test">
            <div className="action-card">
              <div className="action-label">Option 1</div>
              <div className="action-title">Take mock test</div>
              <p className="action-desc">
                Start an exam-mode session with a visible countdown timer
                and focused test layout.
              </p>
              <div className="chip-row">
                <span className="chip">Realistic UI</span>
                <span className="chip">Live timer</span>
                <span className="chip">Full-screen focus</span>
              </div>
            </div>
          </Link>

          <Link href="/previous-papers">
            <div className="action-card">
              <div className="action-label">Option 2</div>
              <div className="action-title">Previous exam papers</div>
              <p className="action-desc">
                Browse year-wise, subject-wise KCET question papers and
                download them as PDFs.
              </p>
              <div className="chip-row">
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
