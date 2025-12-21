import MathText from './MathText';

export default function RenderWithKatex({ children }) {
  if (typeof children !== 'string') {
    return <>{children}</>;
  }

  const parts = [];
  let remaining = children;
  let key = 0;

  while (remaining.length > 0) {
    const startIndex = remaining.indexOf('<katex>');
    
    if (startIndex === -1) {
      // No more katex tags, add remaining text
      if (remaining.length > 0) {
        parts.push(<span key={key++}>{remaining}</span>);
      }
      break;
    }

    // Add text before katex tag
    if (startIndex > 0) {
      parts.push(<span key={key++}>{remaining.substring(0, startIndex)}</span>);
    }

    // Find closing tag
    const endIndex = remaining.indexOf('</katex>', startIndex);
    if (endIndex === -1) {
      // No closing tag found, treat rest as plain text
      parts.push(<span key={key++}>{remaining.substring(startIndex)}</span>);
      break;
    }

    // Extract and render katex content
    const katexContent = remaining.substring(startIndex + 7, endIndex);
    parts.push(<MathText key={key++}>{katexContent}</MathText>);

    // Continue with remaining string
    remaining = remaining.substring(endIndex + 8);
  }

  return <>{parts}</>;
}
