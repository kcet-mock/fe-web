import '../styles/globals.css';
import 'katex/dist/katex.min.css';
import TopNav from '../components/TopNav';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <TopNav />
      <Component {...pageProps} />
    </>
  );
}

