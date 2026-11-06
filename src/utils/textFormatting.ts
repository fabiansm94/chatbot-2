/**
 * Utility for decoding HTML entities, sanitizing raw HTML artifacts,
 * and normalizing special characters and symbols for clean rendering.
 */

const NAMED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&deg;': '°',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&le;': '≤',
  '&ge;': '≥',
  '&ne;': '≠',
  '&euro;': '€',
  '&pound;': '£',
  '&yen;': '¥',
  '&sect;': '§',
  '&mdash;': '—',
  '&ndash;': '–',
  '&bull;': '•',
  // Accents in Spanish
  '&aacute;': 'á',
  '&eacute;': 'é',
  '&iacute;': 'í',
  '&oacute;': 'ó',
  '&uacute;': 'ú',
  '&ntilde;': 'ñ',
  '&Aacute;': 'Á',
  '&Eacute;': 'É',
  '&Iacute;': 'Í',
  '&Oacute;': 'Ó',
  '&Uacute;': 'Ú',
  '&Ntilde;': 'Ñ',
  '&uuml;': 'ü',
  '&Uuml;': 'Ü',
  '&iexcl;': '¡',
  '&iquest;': '¿'
};

/**
 * Decodes all HTML entities (named, decimal, hex) into their UTF-8 character representation.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';

  let decoded = text;

  // Replace named entities
  for (const [entity, char] of Object.entries(NAMED_ENTITIES)) {
    if (decoded.includes(entity)) {
      decoded = decoded.split(entity).join(char);
    }
  }

  // Replace decimal entities &#123;
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => {
    try {
      return String.fromCharCode(parseInt(dec, 10));
    } catch {
      return _;
    }
  });

  // Replace hex entities &#x1f;
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return _;
    }
  });

  return decoded;
}

/**
 * Converts raw HTML anchor tags (and malformed artifacts like '(target) <a target="_blank" rel="noopener noreferrer nofollow" href="...">text</a>')
 * into standard clean markdown links [text](url), and removes redundant container HTML tags.
 */
export function cleanRawHtmlTags(text: string): string {
  if (!text) return '';

  let cleaned = decodeHtmlEntities(text);

  // 1. Transform raw <a ...> tags (including malformed ones with prefixes like '(target)') into Markdown links
  // Pattern matches: optional "(target)" or spaces followed by <a ... href="..." ...>text</a>
  cleaned = cleaned.replace(
    /(?:\(target\)\s*)?<a\b(?:\s+[^>]*?)href=(["'])(.*?)\1(?:\s+[^>]*?)?>([\s\S]*?)<\/a>/gi,
    (_, quote, href, linkText) => {
      const cleanHref = href.trim();
      const cleanLabel = (linkText || cleanHref).replace(/<[^>]+>/g, '').trim();
      return cleanHref ? `[${cleanLabel}](${cleanHref})` : cleanLabel;
    }
  );

  // Also catch <a ...> tags where href doesn't have quotes or is in a different order
  cleaned = cleaned.replace(
    /<a\b[^>]*?href=([^\s>]+)[^>]*?>([\s\S]*?)<\/a>/gi,
    (_, href, linkText) => {
      const cleanHref = href.replace(/["']/g, '').trim();
      const cleanLabel = (linkText || cleanHref).replace(/<[^>]+>/g, '').trim();
      return cleanHref ? `[${cleanLabel}](${cleanHref})` : cleanLabel;
    }
  );

  // Clean empty or dangling <a> tags without text or href
  cleaned = cleaned.replace(/<a\b[^>]*?>/gi, '').replace(/<\/a>/gi, '');

  // Clean loose '(target)' or 'target="_blank"' artifacts if left behind as plain text
  cleaned = cleaned.replace(/\(target\)\s*/gi, '');
  cleaned = cleaned.replace(/\brel=(["'])noopener noreferrer nofollow\1/gi, '');
  cleaned = cleaned.replace(/\brel=(["'])noopener noreferrer\1/gi, '');
  cleaned = cleaned.replace(/\btarget=(["'])_blank\1/gi, '');

  // 2. Process ordered (<ol>) and unordered (<ul>) lists BEFORE stripping <p> tags
  // because Tiptap wraps list item contents inside <li><p>...</p></li>
  const formatInlineTagContent = (inner: string): string => {
    return inner
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?p\b[^>]*>/gi, ' ')
      .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
      .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
      .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  cleaned = cleaned.replace(/<ol\b([^>]*)>([\s\S]*?)<\/ol>/gi, (_, attrs, listBody) => {
    const isAlpha =
      /data-list-type=(["'])lower-alpha\1/i.test(attrs) ||
      /type=(["'])a\1/i.test(attrs) ||
      /lower-alpha/i.test(attrs);
    let idx = 0;
    const items: string[] = [];
    listBody.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_match: string, liContent: string) => {
      idx++;
      const textItem = formatInlineTagContent(liContent);
      if (textItem) {
        const prefix = isAlpha
          ? `${String.fromCharCode(96 + ((idx - 1) % 26) + 1)}.`
          : `${idx}.`;
        items.push(`${prefix} ${textItem}`);
      }
      return '';
    });
    return items.length > 0 ? `\n${items.join('\n')}\n\n` : '';
  });

  cleaned = cleaned.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_, listBody) => {
    const items: string[] = [];
    listBody.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_match: string, liContent: string) => {
      const textItem = formatInlineTagContent(liContent);
      if (textItem) {
        items.push(`• ${textItem}`);
      }
      return '';
    });
    return items.length > 0 ? `\n${items.join('\n')}\n\n` : '';
  });

  // 3. Convert remaining standard formatting tags to markdown or newlines
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div\b[^>]*>/gi, '')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h1\b[^>]*>/gi, '# ')
    .replace(/<h2\b[^>]*>/gi, '## ')
    .replace(/<h[3-6]\b[^>]*>/gi, '### ')
    .replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
    .replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n')
    .replace(/<\/?(ul|ol|span|section|article)\b[^>]*>/gi, '');

  // Remove any remaining HTML tags starting with <tagname> or </tagname>
  // BUT preserve mathematical/logical symbols like "< 15", "> 5", "<=", ">="
  cleaned = cleaned.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, '');

  // Normalize excessive empty lines while preserving paragraph spacing
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * Converts plain text, markdown, or HTML (e.g., from an uploaded PDF/Word file or saved manual)
 * into rich HTML ready for the Tiptap RichTextEditor so lists (1,2,3 / a,b,c / •),
 * headings, and bold/italic formatting are visible and editable in real time.
 */
export function textOrHtmlToEditorHtml(input: string): string {
  if (!input || !input.trim()) return '';

  // If input already contains rich HTML tags from Tiptap or Mammoth, normalize it only if needed
  const hasHtmlStructure = /<(p|ul|ol|li|h[1-6]|strong|em|br)\b/i.test(input);
  const normalizedText = hasHtmlStructure ? cleanRawHtmlTags(input) : decodeHtmlEntities(input);

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const formatInline = (line: string) => {
    let out = escapeHtml(line);
    // Bold **text**
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    // Inline code `code`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    return out;
  };

  const lines = normalizedText.replace(/\r\n/g, '\n').split('\n');
  const htmlBlocks: string[] = [];
  let currentListType: 'ul' | 'ol-decimal' | 'ol-alpha' | null = null;
  let currentListItems: string[] = [];

  const flushList = () => {
    if (!currentListType || currentListItems.length === 0) return;
    const lis = currentListItems.map((item) => `<li><p>${formatInline(item)}</p></li>`).join('');
    if (currentListType === 'ul') {
      htmlBlocks.push(`<ul>${lis}</ul>`);
    } else if (currentListType === 'ol-alpha') {
      htmlBlocks.push(`<ol data-list-type="lower-alpha" type="a">${lis}</ol>`);
    } else {
      htmlBlocks.push(`<ol data-list-type="decimal">${lis}</ol>`);
    }
    currentListType = null;
    currentListItems = [];
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    // Heading detection
    if (/^#{1}\s+/.test(trimmed)) {
      flushList();
      htmlBlocks.push(`<h1>${formatInline(trimmed.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }
    if (/^#{2,6}\s+/.test(trimmed)) {
      flushList();
      htmlBlocks.push(`<h2>${formatInline(trimmed.replace(/^#{2,6}\s+/, ''))}</h2>`);
      continue;
    }

    // Bullet list: • item, - item, * item
    const bulletMatch = trimmed.match(/^(?:[•●▪▸\-*])\s+(.+)$/);
    if (bulletMatch) {
      if (currentListType !== 'ul') {
        flushList();
        currentListType = 'ul';
      }
      currentListItems.push(bulletMatch[1].trim());
      continue;
    }

    // Alpha list: a. item, b) item (single letter a-z followed by . or ))
    const alphaMatch = trimmed.match(/^([a-zA-Z])[.)]\s+(.+)$/);
    if (alphaMatch) {
      if (currentListType !== 'ol-alpha') {
        flushList();
        currentListType = 'ol-alpha';
      }
      currentListItems.push(alphaMatch[2].trim());
      continue;
    }

    // Numbered list: 1. item, 2) item
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      if (currentListType !== 'ol-decimal') {
        flushList();
        currentListType = 'ol-decimal';
      }
      currentListItems.push(numMatch[2].trim());
      continue;
    }

    flushList();
    htmlBlocks.push(`<p>${formatInline(trimmed)}</p>`);
  }

  flushList();
  return htmlBlocks.join('');
}

/**
 * Strips HTML and markdown formatting for clean plain-text previews (e.g. card previews).
 * Preserves all special characters, symbols and numbers accurately.
 */
export function stripHtmlForPreview(text: string, maxLength = 160): string {
  if (!text) return '';

  let clean = cleanRawHtmlTags(text);

  // Convert markdown links [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove markdown bold/italic/code markers
  clean = clean.replace(/[*_`#~]/g, '');

  // Normalize whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  if (clean.length > maxLength) {
    return clean.slice(0, maxLength).trim() + '...';
  }

  return clean;
}
