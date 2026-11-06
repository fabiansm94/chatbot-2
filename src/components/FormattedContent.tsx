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

  const pattern = /(\[[^\]]+\]\([^\)]+\)|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|https?:\/\/[^\s<]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('[') && token.includes('](')) {
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
      parts.push(
        <strong key={`bold-${match.index}`} className="font-extrabold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (
      (token.startsWith('*') && token.endsWith('*') && token.length >= 2) ||
      (token.startsWith('_') && token.endsWith('_') && token.length >= 2)
    ) {
      parts.push(
        <em key={`italic-${match.index}`} className="italic opacity-95">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('http://') || token.startsWith('https://')) {
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

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({ content, className = '' }) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    const cleanText = cleanRawHtmlTags(content);
    const lines = cleanText.split('\n');
    const elements: React.ReactNode[] = [];

    let currentListItems: React.ReactNode[] = [];
    let currentListKind: 'bullet' | 'decimal' | 'alpha' = 'bullet';

    const flushList = () => {
      if (currentListItems.length > 0) {
        const key = `list-${elements.length}`;
        if (currentListKind === 'decimal') {
          elements.push(
            <ol key={key} className="space-y-1.5 pl-5 list-decimal my-2">
              {currentListItems}
            </ol>
          );
        } else if (currentListKind === 'alpha') {
          elements.push(
            <ol key={key} className="space-y-1.5 pl-5 list-[lower-alpha] my-2">
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

      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={`h4-${i}`} className="text-xs sm:text-sm font-bold mt-3 mb-1.5 tracking-tight">
            {renderInlineContent(trimmed.slice(4))}
          </h4>
        );
        continue;
      }
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm sm:text-base font-bold mt-3 mb-1.5 tracking-tight">
            {renderInlineContent(trimmed.slice(3))}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${i}`} className="text-base sm:text-lg font-bold mt-4 mb-2 tracking-tight">
            {renderInlineContent(trimmed.slice(2))}
          </h2>
        );
        continue;
      }

      // Bullet list: • or - or *
      if (/^[•\-\*]\s+/.test(trimmed)) {
        if (currentListKind !== 'bullet') flushList();
        currentListKind = 'bullet';
        const itemContent = trimmed.replace(/^[•\-\*]\s+/, '');
        currentListItems.push(
          <li key={`li-${i}`} className="flex items-start gap-2 text-inherit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ca4048] mt-2 shrink-0" />
            <span className="flex-1">{renderInlineContent(itemContent)}</span>
          </li>
        );
        continue;
      }

      // Numbered list: 1. or 1)
      const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
      if (numMatch) {
        if (currentListKind !== 'decimal') flushList();
        currentListKind = 'decimal';
        currentListItems.push(
          <li key={`num-li-${i}`} className="text-inherit">
            <span>{renderInlineContent(numMatch[2])}</span>
          </li>
        );
        continue;
      }

      // Alphabetical list: a. or a)
      const alphaMatch = trimmed.match(/^([a-zA-Z])[\.\)]\s+(.*)$/);
      if (alphaMatch) {
        if (currentListKind !== 'alpha') flushList();
        currentListKind = 'alpha';
        currentListItems.push(
          <li key={`alpha-li-${i}`} className="text-inherit">
            <span>{renderInlineContent(alphaMatch[2])}</span>
          </li>
        );
        continue;
      }

      flushList();
      elements.push(
        <p key={`p-${i}`} className="leading-relaxed my-1.5 text-inherit">
          {renderInlineContent(line)}
        </p>
      );
    }

    flushList();

    return elements;
  }, [content]);

  return <div className={`select-text ${className}`}>{renderedElements}</div>;
};
