import '../styles/globals.css';
import TopNav from '../components/TopNav';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <TopNav />
      <Component {...pageProps} />
    </>
  );
}

