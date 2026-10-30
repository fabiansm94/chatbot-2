import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { cleanRawHtmlTags } from '../utils/textFormatting';

interface FormattedContentProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown: bold, italic, inline code, links, and auto-detects URLs.
 * Correctly renders symbols and special characters without HTML escaping artifacts.
 */
function renderInlineContent(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match:
  // 1. Markdown links [text](url)
  // 2. Inline code `code`
  // 3. Bold **text** or __text__
  // 4. Italic *text* or _text_
  // 5. Standalone URLs https://... or http://...
  const pattern = /(\[[^\]]+\]\([^\)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|https?:\/\/[^\s<]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('[') && token.includes('](')) {
      // Markdown link [Label](url)
      const closeBracket = token.indexOf('](');
      const label = token.slice(1, closeBracket);
      const url = token.slice(closeBracket + 2, -1);

      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ca4048] hover:text-[#e0535b] underline font-medium inline-flex items-center gap-0.5 break-all transition-colors"
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 inline shrink-0 ml-0.5" />
        </a>
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      // Inline code
      parts.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded bg-[#2f3140] text-rose-300 font-mono text-[0.88em] border border-[#3e4153]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (
      (token.startsWith('**') && token.endsWith('**') && token.length >= 4) ||
      (token.startsWith('__') && token.endsWith('__') && token.length >= 4)
    ) {
      // Bold
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (
      (token.startsWith('*') && token.endsWith('*') && token.length >= 2) ||
      (token.startsWith('_') && token.endsWith('_') && token.length >= 2)
    ) {
      // Italic
      parts.push(
        <em key={`italic-${match.index}`} className="italic text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('http://') || token.startsWith('https://')) {
      // Autolink URL
      parts.push(
        <a
          key={`url-${match.index}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ca4048] hover:text-[#e0535b] underline font-medium inline-flex items-center gap-0.5 break-all transition-colors"
        >
          <span>{token}</span>
          <ExternalLink className="w-3 h-3 inline shrink-0 ml-0.5" />
        </a>
      );
    }

    lastIndex = match.index + token.length;
  }

  // Trailing text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({ content, className = '' }) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    // 1. Clean any raw HTML artifacts (like target="_blank" noopener artifacts) and decode entities
    const cleanText = cleanRawHtmlTags(content);

    // 2. Split into blocks/lines
    const lines = cleanText.split('\n');
    const elements: React.ReactNode[] = [];

    let currentListItems: React.ReactNode[] = [];
    let isNumberedList = false;

    const flushList = () => {
      if (currentListItems.length > 0) {
        const key = `list-${elements.length}`;
        if (isNumberedList) {
          elements.push(
            <ol key={key} className="space-y-1.5 pl-5 list-decimal my-2">
              {currentListItems}
            </ol>
          );
        } else {
          elements.push(
            <ul key={key} className="space-y-1.5 my-2">
              {currentListItems}
            </ul>
          );
        }
        currentListItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        continue;
      }

      // Check header: ### or ## or #
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={`h4-${i}`} className="text-xs sm:text-sm font-bold text-white mt-3 mb-1.5 tracking-tight">
            {renderInlineContent(trimmed.slice(4))}
          </h4>
        );
        continue;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm sm:text-base font-bold text-white mt-3 mb-1.5 tracking-tight">
            {renderInlineContent(trimmed.slice(3))}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${i}`} className="text-base sm:text-lg font-bold text-white mt-4 mb-2 tracking-tight">
            {renderInlineContent(trimmed.slice(2))}
          </h2>
        );
        continue;
      }

      // Check bullet list: • or - or *
      if (/^[•\-\*]\s+/.test(trimmed)) {
        if (isNumberedList) flushList();
        isNumberedList = false;
        const itemContent = trimmed.replace(/^[•\-\*]\s+/, '');
        currentListItems.push(
          <li key={`li-${i}`} className="flex items-start gap-2 text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ca4048] mt-2 shrink-0" />
            <span className="flex-1">{renderInlineContent(itemContent)}</span>
          </li>
        );
        continue;
      }

      // Check numbered list: 1. or 2.
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        if (!isNumberedList) flushList();
        isNumberedList = true;
        currentListItems.push(
          <li key={`num-li-${i}`} className="text-slate-200">
            <span>{renderInlineContent(numMatch[2])}</span>
          </li>
        );
        continue;
      }

      // Standard paragraph
      flushList();
      elements.push(
        <p key={`p-${i}`} className="leading-relaxed my-1.5 text-slate-200">
          {renderInlineContent(line)}
        </p>
      );
    }

    flushList();

    return elements;
  }, [content]);

  return <div className={`select-text ${className}`}>{renderedElements}</div>;
};
