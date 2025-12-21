import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const SUBJECT_MAP = {
  bio: 'Biology',
  chem: 'Chemistry',
  mat: 'Mathematics',
  phy: 'Physics',
};

// This will be populated from available _<year>.js files
const PAPERS = [
  { year: 2025, subject: 'phy', count: 60 },
  { year: 2025, subject: 'chem', count: 60 },
  { year: 2025, subject: 'mat', count: 60 },
  { year: 2025, subject: 'bio', count: 60 },
  { year: 2024, subject: 'phy', count: 60 },
  { year: 2024, subject: 'chem', count: 60 },
  { year: 2024, subject: 'mat', count: 60 },
  { year: 2024, subject: 'bio', count: 60 },
  { year: 2023, subject: 'phy', count: 60 },
  { year: 2023, subject: 'chem', count: 60 },
  { year: 2023, subject: 'mat', count: 60 },
  { year: 2023, subject: 'bio', count: 60 },
  // Add more as year files are created
];

const ALL_YEARS = Array.from(new Set(PAPERS.map((p) => p.year))).sort((a, b) => b - a);
const ALL_SUBJECTS = Array.from(new Set(PAPERS.map((p) => p.subject))).sort();

function generateSessionId() {
  if (typeof window !== 'undefined' && typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function PreviousPapersPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Initialize from URL query params on mount
  useEffect(() => {
    if (router.isReady) {
      const { sub, year } = router.query;
      setSelectedSubject(sub || 'all');
      setSelectedYear(year || 'all');
    }
  }, [router.isReady, router.query]);

  // Update URL when filters change
  const updateFilters = (newYear, newSubject) => {
    router.push({
      pathname: '/previous-papers',
      query: {
        sub: newSubject,
        year: newYear,
      },
    }, undefined, { shallow: true });
  };

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
            <div className="badge">Previous Papers</div>
            <h1 className="title">KCET Previous Year Questions</h1>
            <p className="subtitle">
              Practice with actual KCET questions from previous years.
              Select a year and subject to start an interactive test.
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
                onChange={(e) => {
                  const newYear = e.target.value;
                  setSelectedYear(newYear);
                  updateFilters(newYear, selectedSubject);
                }}
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
                onChange={(e) => {
                  const newSubject = e.target.value;
                  setSelectedSubject(newSubject);
                  updateFilters(selectedYear, newSubject);
                }}
              >
                <option value="all">All subjects</option>
                {ALL_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {SUBJECT_MAP[subject] || subject}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              Tip: Questions are loaded from year-specific files (_&lt;year&gt;.js)
              in each subject directory.
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
                {filtered.map((paper) => {
                  const sessionId = generateSessionId();
                  const testUrl = `/mock-test/${paper.subject}?year=${paper.year}&session_id=${sessionId}`;
                  
                  return (
                    <Link key={`${paper.year}-${paper.subject}`} href={testUrl}>
                      <div className="paper-item" style={{ cursor: 'pointer' }}>
                        <div className="paper-item-main">
                          <div>
                            KCET {paper.year} · <strong>{SUBJECT_MAP[paper.subject]}</strong>
                          </div>
                          <div className="paper-meta">
                            {paper.count} questions · Interactive test
                          </div>
                        </div>
                        <span className="paper-download">
                          Start Test →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
