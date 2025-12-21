import { useEffect, useRef } from 'react';

export default function MathText({ children, display = false }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || typeof children !== 'string') return;

    // Strip leading/trailing $ or $$ signs
    let mathContent = children.trim();
    if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
      mathContent = mathContent.slice(2, -2);
    } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
      mathContent = mathContent.slice(1, -1);
    }

    // Dynamically import KaTeX
    import('katex').then((katex) => {
      try {
        if (ref.current) {
          katex.default.render(mathContent, ref.current, {
            throwOnError: false,
            displayMode: display,
          });
        }
      } catch (err) {
        console.error('KaTeX render error:', err);
        if (ref.current) {
          ref.current.textContent = mathContent;
        }
      }
    });
  }, [children, display]);

  return <span ref={ref} />;
}
