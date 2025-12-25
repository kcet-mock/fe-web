import Head from 'next/head';
import Image from 'next/image';

export default function DonatePage() {
  return (
    <>
      <Head>
        <title>Donate · KCET Mock</title>
        <meta name="description" content="Support KCET Mock by donating. Help us keep the platform free and improve access for all students." />
      </Head>
      <main className="main-layout main-layout--top">
        <section className="card">
          <header className="card-header">
            <div>
              <div className="badge">Support Us</div>
              <h1 className="title">Donate to this project</h1>
              <p className="subtitle">Your contribution helps keep KCET Mock free, open, and accessible for all students preparing for the exam.</p>
            </div>
          </header>

          <div style={{ marginBottom: '2rem' }}>
            <h2 className="page-section-title">Why Donate?</h2>
            <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.2em' }}>
              <li>Keep the platform <strong>free</strong> for everyone, forever.</li>
              <li>Support <strong>open-source</strong> education and community-driven improvements.</li>
              <li>Help us add more features, questions, and better analytics for students.</li>
              <li>Cover server, hosting, and development costs.</li>
            </ul>
            <h2 className="page-section-title">How Your Donation Helps</h2>
            <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.2em' }}>
              <li>Funds new question and content creation.</li>
              <li>Improves platform speed, reliability, and accessibility.</li>
              <li>Enables us to keep the project ad-free and privacy-focused.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 className="page-section-title">Donate via UPI</h2>
            <div style={{ margin: '1.5rem 0' }}>
              {/* TODO: Place your UPI QR code image below */}
              <div style={{ width: 180, height: 180, margin: '0 auto', background: '#f3f4f6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #bbb' }}>
                <span style={{ color: '#888', fontSize: '1.1rem' }}>UPI QR Code<br />Coming Soon</span>
              </div>
            </div>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <strong>UPI ID:</strong> <span style={{ fontFamily: 'monospace' }}>your-upi@bank</span>
            </div>
            <div style={{ color: '#888', fontSize: '0.95rem' }}>
              (Scan the QR code or use the UPI ID above to donate any amount)
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', textAlign: 'center', color: '#16a34a', fontWeight: 500 }}>
            Thank you for supporting KCET Mock and helping students succeed!
          </div>
        </section>
      </main>
    </>
  );
}
