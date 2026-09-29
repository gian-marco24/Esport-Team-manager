import React from 'react';
import { ExternalLink } from 'lucide-react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Parses inline formatting: **bold**, *italic*, ~~strike~~, `code`, URLs
 */
function parseInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  // Regex tokenizes: URLs, code blocks, bold, strike, italic
  const tokenRegex = /(https?:\/\/[^\s]+)|(`[^`]+`)|(\*\*[^*]+\*\*)|(~~[^~]+~~)|(\*[^*]+\*)|(_[^_]+_)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    // Text before matched token
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];
    const key = `${keyPrefix}-${match.index}`;

    if (match[1]) {
      // URL
      nodes.push(
        <a
          key={key}
          href={fullMatch}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-purple-400 hover:text-[#E2B86E] underline underline-offset-2 break-all inline-flex items-center gap-0.5 font-medium transition-colors"
        >
          <span>{fullMatch}</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
        </a>
      );
    } else if (match[2]) {
      // `inline code`
      const code = fullMatch.slice(1, -1);
      nodes.push(
        <code
          key={key}
          className="bg-[#0D0914] text-[#E2B86E] px-1 py-0.5 rounded text-[11px] font-mono border border-[#522B80]/50"
        >
          {code}
        </code>
      );
    } else if (match[3]) {
      // **bold**
      const boldText = fullMatch.slice(2, -2);
      nodes.push(
        <strong key={key} className="font-bold text-white">
          {parseInlineMarkdown(boldText, `${key}-b`)}
        </strong>
      );
    } else if (match[4]) {
      // ~~strikethrough~~
      const strikeText = fullMatch.slice(2, -2);
      nodes.push(
        <del key={key} className="line-through text-gray-400 opacity-80">
          {parseInlineMarkdown(strikeText, `${key}-s`)}
        </del>
      );
    } else if (match[5] || match[6]) {
      // *italic* or _italic_
      const italicText = fullMatch.slice(1, -1);
      nodes.push(
        <em key={key} className="italic text-gray-200">
          {parseInlineMarkdown(italicText, `${key}-i`)}
        </em>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  // Trailing text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split lines to handle blockquotes (> quote) and code blocks (```)
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks (```)
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        renderedElements.push(
          <pre
            key={`code-block-${i}`}
            className="my-1.5 p-2.5 rounded-xl bg-[#0D0914] border border-[#522B80]/40 text-xs font-mono text-[#E2B86E] overflow-x-auto select-text"
          >
            <code>{codeBlockBuffer.join('\n')}</code>
          </pre>
        );
        codeBlockBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Handle Discord-style blockquote (> Quote)
    if (line.startsWith('> ') || line.startsWith('>>> ')) {
      const quoteText = line.replace(/^>{1,3}\s*/, '');
      renderedElements.push(
        <div
          key={`quote-${i}`}
          className="border-l-[3px] border-[#8B44F7] bg-[#180d29]/60 pl-2.5 py-1 my-1 rounded-r text-gray-200 font-medium text-xs leading-relaxed"
        >
          {parseInlineMarkdown(quoteText, `q-${i}`)}
        </div>
      );
      continue;
    }

    // Standard line
    renderedElements.push(
      <div key={`line-${i}`} className="min-h-[1.25rem]">
        {parseInlineMarkdown(line, `l-${i}`)}
      </div>
    );
  }

  // Flush any unclosed code block
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    renderedElements.push(
      <pre
        key={`code-block-end`}
        className="my-1.5 p-2.5 rounded-xl bg-[#0D0914] border border-[#522B80]/40 text-xs font-mono text-[#E2B86E] overflow-x-auto select-text"
      >
        <code>{codeBlockBuffer.join('\n')}</code>
      </pre>
    );
  }

  return <div className={`space-y-0.5 text-xs sm:text-[13px] ${className}`}>{renderedElements}</div>;
};
