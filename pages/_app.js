import Head from 'next/head';
import '../styles/globals.css';
import 'katex/dist/katex.min.css';
import TopNav from '../components/TopNav';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>KCET Mock Tests & Previous Year Papers | Free Practice Platform</title>
        <meta name="description" content="Practice KCET with realistic mock tests, live timers, and previous year question papers. Subject-wise practice for Physics, Chemistry, Math & Biology. Start free." />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="KCET Practice Reimagined - Free Mock Tests & Papers" />
        <meta property="og:description" content="Master Karnataka CET with timed mock tests and authentic previous year papers. Free preparation platform with subject-wise practice." />
        <meta property="og:site_name" content="KCET Mock Portal" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="KCET Mock Tests & Previous Year Papers" />
        <meta name="twitter:description" content="Practice KCET with realistic mock tests, live timers, and previous year papers. Completely free." />
        
        {/* Viewport and Mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <TopNav />
      <Component {...pageProps} />
    </>
  );
}

