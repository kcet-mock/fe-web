import Link from 'next/link';

export default function TopNav() {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link href="/" className="top-nav-brand">
          <span className="top-nav-logo-circle" />
          <span className="top-nav-title">KCET Mock</span>
        </Link>
        <nav className="top-nav-links">
          <Link
            href="https://github.com/avinashkranjan/kcet#donate"
            className="top-nav-link top-nav-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            Donate
          </Link>
        </nav>
      </div>
    </header>
  );
}
