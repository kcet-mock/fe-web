import { useState } from 'react';
import Link from 'next/link';

export default function ContributePage() {
  const [mode, setMode] = useState('single-question');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    const formData = new FormData(event.target);
    formData.append('mode', mode);

    try {
      const response = await fetch('/api/submit-contribution', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setStatus({ type: 'success', message: data.message || 'Submitted successfully!', prUrl: data.prUrl });
      event.target.reset();
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-layout">
      <section className="card">
        <header className="card-header">
          <div>
            <div className="badge">Community contribution</div>
            <h1 className="title">Contribute questions or PDFs</h1>
            <p className="subtitle">
              Add a single multiple-choice question (with optional image), or upload a full-year
              KCET question paper PDF. Your submission will create a GitHub pull request to this
              project, so it can be reviewed before going live.
            </p>
          </div>
        </header>

        <div className="papers-layout">
          <aside className="filter-panel">
            <h2 className="page-section-title">Contribution type</h2>
            <p className="page-section-subtitle">Choose what you want to upload.</p>

            <div className="filter-group">
              <button
                type="button"
                className={`button-secondary ${mode === 'single-question' ? 'button-secondary--active' : ''}`}
                onClick={() => setMode('single-question')}
              >
                Single MCQ question
              </button>
            </div>
            <div className="filter-group">
              <button
                type="button"
                className={`button-secondary ${mode === 'pdf-upload' ? 'button-secondary--active' : ''}`}
                onClick={() => setMode('pdf-upload')}
              >
                Full-year PDF paper
              </button>
            </div>

            <div style={{ marginTop: '1.25rem', fontSize: '0.8rem' }}>
              <Link href="/">
                <span className="button-secondary">← Back to landing page</span>
              </Link>
            </div>
          </aside>

          <div className="papers-list">
            <form onSubmit={handleSubmit}>
              {mode === 'single-question' && (
                <div className="questions-stack">
                  <h2 className="page-section-title">Single question details</h2>
                  <p className="page-section-subtitle">
                    Provide the question text, four options, and select the correct answer.
                    Optionally, attach an image that will be shown with the question.
                  </p>

                  <div className="filter-group">
                    <label className="filter-label" htmlFor="questionText">
                      Question text
                    </label>
                    <textarea
                      id="questionText"
                      name="questionText"
                      className="select"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="filter-group">
                    <label className="filter-label" htmlFor="questionImage">
                      Optional question image
                    </label>
                    <input
                      id="questionImage"
                      name="questionImage"
                      type="file"
                      accept="image/*"
                      className="select"
                    />
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Options (A–D)</label>
                    <div className="filter-group">
                      <input
                        name="option1"
                        placeholder="Option 1 (A) text"
                        className="select"
                        required
                      />
                      <input
                        name="optionImage1"
                        type="file"
                        accept="image/*"
                        className="select"
                      />
                    </div>
                    <div className="filter-group">
                      <input
                        name="option2"
                        placeholder="Option 2 (B) text"
                        className="select"
                        required
                      />
                      <input
                        name="optionImage2"
                        type="file"
                        accept="image/*"
                        className="select"
                      />
                    </div>
                    <div className="filter-group">
                      <input
                        name="option3"
                        placeholder="Option 3 (C) text"
                        className="select"
                        required
                      />
                      <input
                        name="optionImage3"
                        type="file"
                        accept="image/*"
                        className="select"
                      />
                    </div>
                    <div className="filter-group">
                      <input
                        name="option4"
                        placeholder="Option 4 (D) text"
                        className="select"
                        required
                      />
                      <input
                        name="optionImage4"
                        type="file"
                        accept="image/*"
                        className="select"
                      />
                    </div>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label" htmlFor="correctOption">
                      Correct option
                    </label>
                    <select
                      id="correctOption"
                      name="correctOption"
                      className="select"
                      required
                    >
                      <option value="">Select correct option</option>
                      <option value="1">Option 1 (A)</option>
                      <option value="2">Option 2 (B)</option>
                      <option value="3">Option 3 (C)</option>
                      <option value="4">Option 4 (D)</option>
                    </select>
                  </div>
                </div>
              )}

              {mode === 'pdf-upload' && (
                <div className="questions-stack">
                  <h2 className="page-section-title">Full-year PDF details</h2>
                  <p className="page-section-subtitle">
                    Upload a complete KCET question paper as a PDF. This will be placed in the
                    repository and linked for review.
                  </p>

                  <div className="filter-group">
                    <label className="filter-label" htmlFor="year">
                      Exam year
                    </label>
                    <input
                      id="year"
                      name="year"
                      type="number"
                      min="2000"
                      max="2100"
                      className="select"
                      required
                    />
                  </div>

                  <div className="filter-group">
                    <label className="filter-label" htmlFor="subject">
                      Subject
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      className="select"
                      placeholder="e.g. Physics, Chemistry, Mathematics, Biology"
                      required
                    />
                  </div>

                  <div className="filter-group">
                    <label className="filter-label" htmlFor="pdfFile">
                      PDF file
                    </label>
                    <input
                      id="pdfFile"
                      name="pdfFile"
                      type="file"
                      accept="application/pdf"
                      className="select"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="test-footer" style={{ marginTop: '1.5rem' }}>
                <button type="submit" className="button-primary" disabled={loading}>
                  {loading ? 'Submitting…' : 'Submit contribution'}
                </button>
              </div>

              {status && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: status.type === 'success' ? '#ecfdf3' : '#fef2f2',
                    color: status.type === 'success' ? '#166534' : '#b91c1c',
                    fontSize: '0.9rem',
                  }}
                >
                  <div>{status.message}</div>
                  {status.prUrl && (
                    <div style={{ marginTop: '0.4rem' }}>
                      View pull request:{' '}
                      <a href={status.prUrl} target="_blank" rel="noreferrer">
                        {status.prUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
