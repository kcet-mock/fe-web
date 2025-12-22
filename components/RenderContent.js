import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Renders text content with support for:
 * - Markdown (including tables via GFM)
 * - KaTeX math expressions (both inline and display)
 * - Regular text
 * 
 * Handles both legacy <katex> tags and standard markdown math syntax
 */
export default function RenderContent({ children }) {
  if (typeof children !== 'string') {
    return <>{children}</>;
  }

  // Convert legacy <katex>$...$</katex> tags to inline markdown math
  // Convert legacy <katex>$$...$$</katex> tags to display markdown math
  let processedContent = children;
  
  // Handle display math first ($$...$$)
  processedContent = processedContent.replace(
    /<katex>\s*\$\$([\s\S]*?)\$\$\s*<\/katex>/g,
    '$$$$$$1$$$$'
  );
  
  // Handle inline math ($...$)
  processedContent = processedContent.replace(
    /<katex>\s*\$([\s\S]*?)\$\s*<\/katex>/g,
    '$$$1$$'
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {processedContent}
    </ReactMarkdown>
  );
}
