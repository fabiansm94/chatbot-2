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

  // 2. Convert standard formatting tags to markdown or newlines
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div\b[^>]*>/gi, '')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<h[1-6]\b[^>]*>/gi, '### ')
    .replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b\b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em\b[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i\b[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<code\b[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<li\b[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<\/?(ul|ol|span|section|article)\b[^>]*>/gi, '');

  // Remove any remaining HTML tags starting with <tagname> or </tagname>
  // BUT preserve mathematical/logical symbols like "< 15", "> 5", "<=", ">="
  cleaned = cleaned.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, '');

  // Normalize excessive empty lines while preserving paragraph spacing
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
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
