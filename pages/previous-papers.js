import { useMemo, useState } from 'react';
import Link from 'next/link';

const PAPERS = [
  { year: 2024, subject: 'Physics', file: '/pdfs/2024-physics.pdf' },
  { year: 2024, subject: 'Chemistry', file: '/pdfs/2024-chemistry.pdf' },
  { year: 2024, subject: 'Mathematics', file: '/pdfs/2024-mathematics.pdf' },
  { year: 2023, subject: 'Physics', file: '/pdfs/2023-physics.pdf' },
  { year: 2023, subject: 'Chemistry', file: '/pdfs/2023-chemistry.pdf' },
  { year: 2023, subject: 'Mathematics', file: '/pdfs/2023-mathematics.pdf' },
  { year: 2022, subject: 'Biology', file: '/pdfs/2022-biology.pdf' },
];

const ALL_YEARS = Array.from(new Set(PAPERS.map((p) => p.year))).sort((a, b) => b - a);
const ALL_SUBJECTS = Array.from(new Set(PAPERS.map((p) => p.subject))).sort();

export default function PreviousPapersPage() {
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const filtered = useMemo(() => {
    return PAPERS.filter((paper) => {
      const yearOk = selectedYear === 'all' || paper.year === Number(selectedYear);
      const subjectOk = selectedSubject === 'all' || paper.subject === selectedSubject;
      return yearOk && subjectOk;
    });
  }, [selectedYear, selectedSubject]);

  return (
    <main className="main-layout">
      <section className="card">
        <header className="card-header">
          <div>
            <div className="badge">Previous Papers · Option 2</div>
            <h1 className="title">Year-wise, subject-wise KCET PDFs</h1>
            <p className="subtitle">
              Use filters to quickly locate and download KCET question papers
              by exam year and subject.
            </p>
          </div>
        </header>

        <div className="papers-layout">
          <aside className="filter-panel">
            <h2 className="page-section-title">Filters</h2>
            <p className="page-section-subtitle">
              Choose a specific year or subject, or keep both to view all
              available papers.
            </p>

            <div className="filter-group">
              <div className="filter-label">Year</div>
              <select
                className="select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="all">All years</option>
                {ALL_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <div className="filter-label">Subject</div>
              <select
                className="select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="all">All subjects</option>
                {ALL_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              Tip: Replace the sample file paths with actual KCET PDF URLs
              or static files served from your Next.js public folder.
            </div>

            <div style={{ marginTop: '1.25rem', fontSize: '0.8rem' }}>
              <Link href="/">
                <span className="button-secondary">← Back to landing page</span>
              </Link>
            </div>
          </aside>

          <div className="papers-list">
            <div className="paper-list-header">
              <span>Available papers</span>
              <span>{filtered.length} result(s)</span>
            </div>

            {filtered.length === 0 ? (
              <div className="paper-list-empty">
                No papers match the selected filters. Try changing the year or
                subject.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {filtered.map((paper) => (
                  <div key={`${paper.year}-${paper.subject}`} className="paper-item">
                    <div className="paper-item-main">
                      <div>
                        KCET {paper.year} · <strong>{paper.subject}</strong>
                      </div>
                      <div className="paper-meta">Official-style question paper (PDF)</div>
                    </div>
                    <a
                      className="paper-download"
                      href={paper.file}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download PDF →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
