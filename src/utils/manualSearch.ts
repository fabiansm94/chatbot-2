import { Citation, ManualDocument, ManualSection, SearchResult } from '../types/manual';
import { cleanRawHtmlTags } from './textFormatting';

const SPANISH_STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para',
  'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus', 'le', 'ya', 'o',
  'este', 'si', 'porque', 'esta', 'son', 'entre', 'esta', 'cuando', 'muy', 'sin', 'sobre',
  'ser', 'tiene', 'tambien', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo',
  'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante',
  'ellos', 'e', 'esto', 'mi', 'antes', 'algunos', 'que', 'unos', 'yo', 'otro', 'otras',
  'otra', 'el', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual',
  'sea', 'poco', 'ella', 'estar', 'haber', 'estas', 'estaba', 'estamos', 'algunas', 'algo',
  'nosotros', 'hola', 'buenas', 'buenos', 'tardes', 'noches', 'favor', 'quisiera', 'saber',
  'gracias', 'muchas', 'chao', 'adios'
]);

const OFF_TOPIC_PATTERNS = [
  /\b(naruto|sasuke|kakashi|sakura|hokage|itachi|anime|manga|goku|dragon ball|one piece|luffy|pokemon|pikachu)\b/i,
  /\b(receta|cocinar|tarta|pastel|ingredientes|horno|pasta|pizza|hamburguesa)\b/i,
  /\b(chiste|adivinanza|cuentame un chiste|dime un chiste)\b/i,
  /\b(futbol|messi|ronaldo|champions|partido de hoy|mundial|balon de oro|real madrid|barcelona)\b/i,
  /\b(pelicula|netflix|marvel|avengers|spiderman|cine|actor|actriz|hollywood)\b/i,
  /\b(horoscopo|astrologia|signo zodiacal|tarot)\b/i,
  /\b(tarea de matematica|resuelve la ecuacion|capital de francia|quien descubrio america)\b/i
];

export type ConversationalIntent = 'greeting' | 'thanks' | 'farewell' | 'acknowledgment';

/**
 * Checks if a user's question is unrelated/off-topic to company procedures (e.g. Naruto, anime, recipes, sports)
 */
export function isOffTopicQuery(query: string): boolean {
  const norm = normalizeText(query);
  return OFF_TOPIC_PATTERNS.some(pattern => pattern.test(norm));
}

/**
 * Normalizes text for robust matching: lowercases, removes accents, trims punctuation
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes user query into meaningful keywords (excluding stop words)
 */
export function extractKeywords(query: string): string[] {
  const normalized = normalizeText(query);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  const filtered = words.filter(w => !SPANISH_STOPWORDS.has(w));
  return filtered.length > 0 ? filtered : [];
}

/**
 * Detects if a message is a greeting, thank-you, farewell or acknowledgment
 * WITHOUT specific work requests, so the bot responds conversationally without searching manuals.
 */
export function detectConversationalIntent(query: string): ConversationalIntent | null {
  const norm = normalizeText(query);
  if (!norm) return null;

  // If the query contains substantial procedural keywords, it is a work query (e.g. "hola, ¿cómo pido vacaciones?")
  const WORK_KEYWORDS = /\b(vacacion|vacaciones|permiso|licencia|seguro|salud|medico|viatico|viaticos|gasto|reembolso|contrasena|clave|password|correo|phishing|acoso|denuncia|accidente|licitacion|remoto|computador|laptop|vpn|horario|sueldo|nomina|contrato|sala|reunion|taxi|dias libres|floating|procedimiento|manual|beneficio)\b/i;
  if (WORK_KEYWORDS.test(norm)) {
    return null;
  }

  // 1. Thanks: any expression of gratitude (since WORK_KEYWORDS was already checked above)
  if (/\b(gracias|agradezco|agradecido|agradecida|se agradece|thanks|grax)\b/i.test(norm)) {
    return 'thanks';
  }

  // 2. Greetings: any expression of hello/greeting
  if (/\b(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal|como estas|como te va|saludos|que onda|que hay)\b/i.test(norm)) {
    return 'greeting';
  }

  // 3. Farewells: chao, adios, etc.
  if (/\b(chao|adios|hasta luego|nos vemos|hasta manana|hasta pronto|que tengas buen dia|cuidate|bye|chau)\b/i.test(norm)) {
    return 'farewell';
  }

  // 4. Acknowledgments: ok, vale, entendido, etc.
  if (/^(ok|vale|entendido|perfecto|listo|de acuerdo|comprendido|todo claro|excelente|genial|dale)$/i.test(norm)) {
    return 'acknowledgment';
  }

  return null;
}

/**
 * Returns conversational coworker answers for social intents
 */
export function getConversationalResponse(intent: ConversationalIntent, companyName = 'la empresa'): string {
  switch (intent) {
    case 'greeting':
      return `¡Hola! ¿Cómo estás? Aquí estoy listo para darte una mano con cualquier duda o trámite de ${companyName}: vacaciones, permisos, seguros, beneficios, viáticos o temas de TI. ¿En qué te puedo ayudar hoy?`;
    case 'thanks':
      return `¡De nada! Es un gusto ayudarte. Si te surge cualquier otra duda sobre tus trámites, beneficios o procedimientos de la empresa, avísame con toda confianza. ¡Que tengas un excelente día!`;
    case 'farewell':
      return `¡Hasta luego! Que te vaya muy bien. Si en cualquier momento necesitas revisar algo más de la oficina o de los manuales, aquí estaré. ¡Cuídate!`;
    case 'acknowledgment':
      return `¡Buenísimo! Quedo a tu disposición si necesitas consultar cualquier otro tema. ¡Mucho éxito en tu jornada!`;
  }
}

const GENERIC_QUERY_VERBS = new Set([
  'dice', 'decir', 'hace', 'hacer', 'hago', 'hacen', 'hagamos', 'pasa', 'pasar',
  'tiene', 'tienen', 'tener', 'debe', 'deben', 'debo', 'debemos', 'puede', 'pueden',
  'puedo', 'podemos', 'cual', 'cuales', 'quien', 'quienes', 'cuanto', 'cuantos',
  'cuantas', 'donde', 'cuando', 'como', 'explica', 'indica', 'menciona', 'habla',
  'trata', 'existe', 'estan', 'esta', 'este', 'corresponde', 'corresponden',
  'necesito', 'quiero', 'saber', 'pregunta', 'consultar', 'consulta', 'informacion',
  'manual', 'procedimiento', 'protocolo', 'reglamento', 'puesto', 'articulo', 'seccion'
]);

/**
 * Extracts a Spanish lexical stem/root for resilient matching across plurals and verb conjugations
 * (e.g. "fumigan" <-> "fumigar", "piscinas" <-> "piscina", "limpio" <-> "limpiezas")
 */
export function getSpanishStem(word: string): string {
  const w = normalizeText(word);
  if (w.length <= 4) return w;

  const suffixes = [
    'aciones', 'iciones', 'amientos', 'imientos',
    'acion', 'icion', 'amiento', 'imiento',
    'adores', 'adoras', 'antes', 'ientes',
    'ador', 'adora', 'ante', 'iente',
    'ando', 'iendo', 'aron', 'ieron', 'aban', 'aran', 'eran', 'iran',
    'mente', 'anzas', 'anza', 'ezas', 'eza', 'cias', 'cia',
    'ar', 'er', 'ir', 'an', 'en', 'as', 'es', 'os', 'a', 'e', 'o', 's'
  ];

  for (const suffix of suffixes) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 4) {
      return w.slice(0, w.length - suffix.length);
    }
  }

  return w.slice(0, Math.max(4, w.length - 2));
}

/**
 * Checks whether a keyword matches inside normalized text (exact, singular/plural, or Spanish stem)
 * Returns match quality multiplier: 1.0 (exact), 0.9 (plural/singular), 0.8 (stem), or 0 (no match)
 */
export function matchKeywordScore(normText: string, textTokens: string[], kw: string): number {
  if (!kw || !normText) return 0;
  if (normText.includes(kw)) return 1.0;

  if (kw.length >= 4) {
    const singular = kw.endsWith('es') && kw.length >= 5
      ? kw.slice(0, -2)
      : kw.endsWith('s')
        ? kw.slice(0, -1)
        : kw;

    if (singular.length >= 4) {
      for (const token of textTokens) {
        if (token === singular || token === `${singular}s` || token === `${singular}es` || token.startsWith(singular)) {
          return 0.9;
        }
      }
    }
  }

  if (kw.length >= 5) {
    const stem = getSpanishStem(kw);
    if (stem.length >= 4) {
      for (const token of textTokens) {
        if (token.length >= 4 && (token.startsWith(stem) || getSpanishStem(token) === stem)) {
          return 0.8;
        }
      }
    }
  }

  return 0;
}

/**
 * Searches manuals using weighted keyword and phrase scoring
 * ONLY searches when the message has meaningful keywords and is not a pure social greeting/thanks.
 */
export function searchManuals(
  query: string,
  manuals: ManualDocument[],
  maxResults = 4
): SearchResult[] {
  // If the query is purely conversational (greeting, thanks, etc.), do NOT search manuals!
  if (detectConversationalIntent(query)) {
    return [];
  }

  const keywords = extractKeywords(query);
  const normalizedQuery = normalizeText(query);

  if (!query.trim() || manuals.length === 0 || keywords.length === 0) {
    return [];
  }

  const results: SearchResult[] = [];

  for (const manual of manuals) {
    const rawSections: ManualSection[] =
      Array.isArray(manual.sections) && manual.sections.length > 0
        ? manual.sections
        : [
            {
              id: `${manual.id}-main`,
              articleNumber: 'Manual Oficial',
              title: manual.title,
              content: manual.description || manual.summary || '',
              tags: ['manual', 'oficial']
            }
          ];

    const normManualTitle = normalizeText(manual.title || '');
    const manualTitleTokens = normManualTitle.split(/\s+/).filter(Boolean);

    for (const rawSection of rawSections) {
      const cleanedContent = cleanRawHtmlTags(
        rawSection.content || manual.description || manual.summary || ''
      );
      const section: ManualSection = {
        ...rawSection,
        content: cleanedContent
      };

      const normTitle = normalizeText(section.title || manual.title || '');
      const titleTokens = normTitle.split(/\s+/).filter(Boolean);
      const normArticle = normalizeText(section.articleNumber || '');
      const normContent = normalizeText(cleanedContent);
      const contentTokens = normContent.split(/\s+/).filter(Boolean);
      const normTags = Array.isArray(section.tags)
        ? section.tags.map(t => normalizeText(t)).join(' ')
        : '';
      const tagTokens = normTags.split(/\s+/).filter(Boolean);

      let score = 0;

      // Exact title match bonus
      if (normTitle.includes(normalizedQuery) || normManualTitle.includes(normalizedQuery)) {
        score += 80;
      }

      // Exact article number match (e.g. "Art. 4.1" or "4.1")
      const isArticleCode = /^(?:art|artículo|articulo|secc|cap|\d+)/i.test(normArticle);
      if (
        normArticle === normalizedQuery ||
        (isArticleCode && (normArticle.includes(normalizedQuery) || normalizedQuery.includes(normArticle)))
      ) {
        score += 100;
      }

      // Keywords match across title, manual title, tags and content (including Spanish stems)
      for (const kw of keywords) {
        const isGeneric = GENERIC_QUERY_VERBS.has(kw);
        const weightMultiplier = isGeneric ? 0.35 : 1.0;

        const titleMatch = Math.max(
          matchKeywordScore(normTitle, titleTokens, kw),
          matchKeywordScore(normManualTitle, manualTitleTokens, kw)
        );
        if (titleMatch > 0) score += 25 * titleMatch * weightMultiplier;

        const tagMatch = matchKeywordScore(normTags, tagTokens, kw);
        if (tagMatch > 0) score += 20 * tagMatch * weightMultiplier;

        const contentMatch = matchKeywordScore(normContent, contentTokens, kw);
        if (contentMatch > 0) score += 12 * contentMatch * weightMultiplier;

        if (normArticle.includes(kw)) score += 30 * weightMultiplier;
      }

      // Department matching
      if (normalizeText(manual.department || '').includes(normalizedQuery)) {
        score += 15;
      }

      if (score > 0) {
        const snippet = extractRelevantExcerpt(cleanedContent, query, section.keyPoints).slice(0, 220);

        results.push({
          manual,
          section,
          score,
          snippet
        });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Builds formatted context markdown for Gemini RAG prompt.
 * Always supplies the laser-extracted relevant excerpt rather than dumping entire manuals.
 */
export function buildManualContext(results: SearchResult[], query?: string): string {
  if (results.length === 0) {
    return 'No se encontraron artículos directamente coincidentes en los manuales indexados.';
  }

  return results
    .slice(0, 2)
    .map((res, index) => {
      const { manual, section } = res;
      const cleanedContent = cleanRawHtmlTags(section.content || '');
      const targetedData = query
        ? extractRelevantExcerpt(cleanedContent, query, section.keyPoints)
        : cleanedContent.slice(0, 300);

      return `### [REFERENCIA ${index + 1}]
Manual: ${manual.title} (${manual.code}, v${manual.version})
Departamento: ${manual.department}
Artículo: ${section.articleNumber} - "${section.title}"
Identificador: ${manual.id}#${section.id}
DATO EXACTO DEL MANUAL QUE RESPONDE LA PREGUNTA (RESPONDER EXCLUSIVAMENTE CON ESTE DATO, PROHIBIDO AGREGAR OTROS PUNTOS):
"${targetedData}"
---`;
    })
    .join('\n\n');
}

/**
 * Converts search results into structured citations
 */
export function extractCitations(results: SearchResult[]): Citation[] {
  return results.map(r => ({
    manualId: r.manual.id,
    manualCode: r.manual.code,
    manualTitle: r.manual.title,
    sectionId: r.section.id,
    articleNumber: r.section.articleNumber,
    sectionTitle: r.section.title,
    excerpt: r.snippet
  }));
}

/**
 * Detects if a query is asking for a specific entity type:
 * - schedule/hours
 * - person/role/contact
 * - amount/days/deadline
 */
export function detectTargetEntityType(query: string): 'schedule' | 'person' | 'amount' | 'general' {
  const norm = normalizeText(query);

  if (/\b(horario|horarios|hora|horas|hrs|a que hora|a que horas|turno|turnos|jornada|apertura|cierre|atencion|cuando abre|cuando cierra|frecuencia|cada cuanto)\b/i.test(norm)) {
    return 'schedule';
  }

  if (/\b(quien|quienes|nombre|nombres|responsable|responsables|encargado|encargada|contacto|contactar|jefe|jefatura|coordinador|coordinadora|lider|con quien|a quien|quien autoriza|quien responde)\b/i.test(norm) ||
      /^(?:qui[eé]n\s+es\s+)?([a-zñáéíóú]{2,}\s+[a-zñáéíóú]{2,})\??$/i.test(norm.trim())) {
    return 'person';
  }

  if (/\b(cuanto|cuantos|cuantas|plazo|plazos|anticipacion|dias|tiempo|fecha limite|monto|montos|viatico|viaticos|valor|tope|porcentaje|costo|pesos|dolar|\$)\b/i.test(norm)) {
    return 'amount';
  }

  return 'general';
}

interface SubtitleBlock {
  heading?: string;
  text: string;
}

/**
 * Splits manual content into discrete subtitle blocks when real headers/sections exist,
 * WITHOUT treating numbered (1., 2.) or alphabetical (a., b.) list items as empty headings.
 */
function splitIntoSubtitleBlocks(content: string): SubtitleBlock[] {
  const lines = content.split('\n');
  const blocks: SubtitleBlock[] = [];
  let currentHeading: string | undefined = undefined;
  let currentLines: string[] = [];

  const isHeadingLine = (trimmed: string): boolean => {
    if (!trimmed || trimmed.length > 85) return false;
    // 1. Markdown heading (#, ##, ###)
    if (/^#{1,6}\s+.+/.test(trimmed)) return true;
    // 2. Formal Article / Chapter / Section header
    if (/^(?:Art[íi]culo|Cap[íi]tulo|Secci[óo]n|Cl[áa]usula)\s+[IVXLCDM\d]+[:.-]?\s*.*/i.test(trimmed)) {
      return true;
    }
    // 3. Standalone bold title line (**Subtítulo** or **Subtítulo:**)
    if (/^\*\*[^*]{3,75}\*\*:?$/.test(trimmed)) return true;
    // 4. Short uppercase or title-colon header (NOT starting with list item 1. / a. / •)
    if (
      !/^(?:\d+[.)]|[a-zA-Z][.)]|[•●▪▸➤\-*])\s+/.test(trimmed) &&
      /^[A-ZÁÉÍÓÚÑ][^.!?\n]{2,55}:$/.test(trimmed)
    ) {
      return true;
    }
    return false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentLines.push(line);
      continue;
    }

    if (isHeadingLine(trimmed)) {
      if (currentLines.some(l => l.trim().length > 0)) {
        blocks.push({
          heading: currentHeading,
          text: currentLines.join('\n').trim()
        });
        currentLines = [];
      } else if (currentHeading) {
        currentLines.push(currentHeading);
      }
      currentHeading = trimmed
        .replace(/^#{1,6}\s*/, '')
        .replace(/^\*\*|\*\*:?$/g, '')
        .replace(/:$/, '')
        .trim();
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.some(l => l.trim().length > 0)) {
    blocks.push({
      heading: currentHeading,
      text: currentLines.join('\n').trim()
    });
  } else if (currentHeading) {
    blocks.push({
      heading: undefined,
      text: currentHeading
    });
  }

  return blocks.length > 0 ? blocks : [{ heading: undefined, text: content }];
}

/**
 * Parses individual personnel/task entries from continuous or structured document text.
 * E.g.: "Hay 3 Alexander: Alexander - Mantenimiento Foresta Alexander - Mantenimiento Sunset Alexander - Tecnico Sunset Luego estan: Farida - Liempeza Sunset Heidi - Limpieza Foresta"
 */
export function parseRosterEntries(text: string): string[] {
  if (!text) return [];

  // Normalize intro clauses with colons and punctuation symbols
  const normalized = text
    .replace(/\b(?:Hay\s+\d+\s+[A-Za-z]+|Luego\s+est[aá]n|Adem[aá]s|Tambi[eé]n)\s*[:]/gi, '\n')
    .replace(/[•●○▪▫■□➤►▸➜➔➡√✓]/g, '\n')
    .replace(/\s*\/\s*(?=[A-ZÁÉÍÓÚ])/g, '\n');

  const rawLines = normalized.split(/[\n\r;]+/).map(l => l.trim()).filter(Boolean);
  const entries: string[] = [];

  for (const line of rawLines) {
    const parts = line.split(/\s*[-–—]\s*/);
    if (parts.length > 2) {
      // Multiple hyphens on one line packed together
      let currentName = parts[0].trim().split(/\s+/).slice(-1)[0] || '';
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          entries.push(`${currentName} - ${part.trim()}`);
        } else {
          const words = part.trim().split(/\s+/);
          let splitIdx = words.length - 1;
          if (splitIdx > 1 && /^(?:luego|ademas|tambien)$/i.test(words[splitIdx - 2])) {
            splitIdx = splitIdx - 2;
          } else if (splitIdx > 0 && /^(?:estan|estan:|hay)$/i.test(words[splitIdx - 1])) {
            splitIdx = splitIdx - 1;
          }
          const roleAndSite = words.slice(0, splitIdx).join(' ').replace(/\s*(?:luego|ademas|tambien)?\s*(?:estan|hay)?[:\s]*$/i, '');
          const nextName = words.slice(splitIdx).join(' ').replace(/.*:\s*/, '');
          entries.push(`${currentName} - ${roleAndSite.trim()}`);
          currentName = nextName.trim();
        }
      }
    } else if (line.includes('-') || line.includes('–') || line.includes('—')) {
      const trimmed = line.replace(/^[-\s*•]+/, '').trim();
      if (trimmed.length < 150 && /^[A-ZÁÉÍÓÚ][a-zñáéíóú]+(?:\s+[A-ZÁÉÍÓÚ][a-zñáéíóú]+)*\s*[-–—]\s*.+/i.test(trimmed)) {
        entries.push(trimmed);
      }
    }
  }

  return entries.filter(e => e.length > 3 && !/^(?:Hay\s+\d+|Luego\s+est[aá]n|Personal\s*:?)/i.test(e));
}

/**
 * Filters roster entries by target site, person, and role from the query.
 * Guarantees that if a specific site is requested (e.g. Foresta), entries from other sites (e.g. Sunset) are excluded.
 */
export function filterRosterEntriesByQuery(entries: string[], query: string): string[] {
  if (entries.length === 0) return [];
  const normQ = normalizeText(query);
  const qWords = normQ.split(/\s+/).filter(w => w.length > 2);

  // Extract candidate sites from roster entries
  const candidateSites = new Set<string>();
  for (const entry of entries) {
    const words = normalizeText(entry).split(/\s+/);
    if (words.length >= 2) {
      candidateSites.add(words[words.length - 1]);
      if (words.length >= 3) {
        candidateSites.add(words[words.length - 2] + ' ' + words[words.length - 1]);
      }
    }
  }

  const matchedSites = Array.from(candidateSites).filter(site => 
    site.length >= 3 && normQ.includes(site)
  );

  let filtered = entries;
  let targetSite = '';

  if (matchedSites.length > 0) {
    matchedSites.sort((a, b) => b.length - a.length);
    targetSite = matchedSites[0];
    filtered = entries.filter(e => normalizeText(e).includes(targetSite));
  }

  // Filter out site words and generic filler words
  const nonSiteWords = qWords.filter(w => 
    !targetSite.includes(w) && 
    !['personal', 'quien', 'quienes', 'estan', 'esta', 'para', 'del', 'los', 'las', 'solo', 'sitio', 'sobre', 'dame', 'muestra', 'muestrame'].includes(w)
  );

  if (nonSiteWords.length > 0) {
    // 1. Check if person name is queried
    const personMatch = filtered.filter(e => {
      const entryName = normalizeText(e.split(/[-–—:]/)[0] || '');
      return nonSiteWords.some(w => entryName.includes(w));
    });

    if (personMatch.length > 0) {
      return personMatch;
    }

    // 2. Check if role is queried (e.g., mantenimiento, limpieza, tecnico)
    const roleMatch = filtered.filter(e => {
      const normE = normalizeText(e);
      return nonSiteWords.some(w => 
        (w.length >= 4 && normE.includes(w)) || 
        (w.startsWith('limp') && (normE.includes('limp') || normE.includes('liemp')))
      );
    });

    if (roleMatch.length > 0) {
      return roleMatch;
    }
  }

  return filtered;
}

/**
 * Splits a block of text into granular sentences and list items (1., a., •, ➤, lines)
 * while preserving list prefixes (e.g., "1. Paso uno") and attaching short colon headers to their value.
 */
function splitIntoGranularSegments(text: string): string[] {
  const cleaned = cleanRawHtmlTags(text);
  const rawLines = cleaned
    .replace(/\s*[➤►▸➜➔➡●○▪▫■□✓✔√]+\s*/g, '\n')
    .replace(/\s+\/\s*(?=[A-ZÁÉÍÓÚÑ])/g, '\n')
    .replace(/(?<=[.!?])\s+(?=(?:\d{1,2}[.)]|[a-zA-Z][.)]|•)\s+)/g, '\n')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const segments: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];

    if (
      line.endsWith(':') &&
      line.length < 75 &&
      i + 1 < rawLines.length &&
      !/^(?:\d+[.)]|[a-zA-Z][.)]|•)\s+/.test(rawLines[i + 1])
    ) {
      line = `${line} ${rawLines[i + 1]}`;
      i++;
    }

    const listPrefixMatch = line.match(/^((?:\d{1,2}[.)]|[a-zA-Z][.)]|•|-)\s+)(.+)$/);
    if (listPrefixMatch) {
      segments.push(line);
      continue;
    }

    const subSentences = line
      .split(/(?<!\b(?:[0-9]{1,3}|[a-zA-Z]|Art|Cap|Secc|Sr|Sra|Dr|Dra|Ing|Lic|No|Nro|Av|Tel|Ext))(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡0-9•*])|;\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 3);

    if (subSentences.length > 1) {
      segments.push(...subSentences);
    } else if (line.length > 3) {
      segments.push(line);
    }
  }

  return segments;
}

/**
 * Extracts only the specific, relevant data point (schedule, name, amount, list item, or concise sentence)
 * answering the user's query, filtering out unrelated subtitles and preventing full manual dumps.
 */
export function extractRelevantExcerpt(
  content: string,
  query: string,
  keyPoints?: string[]
): string {
  const cleanedContent = cleanRawHtmlTags(content || '');
  if (!cleanedContent) return '';

  // 0. Site-specific roster extraction:
  // If the document contains multiple person-role entries across different sites (e.g. Foresta vs Sunset)
  const rosterEntries = parseRosterEntries(cleanedContent);
  if (rosterEntries.length >= 2) {
    const filteredRoster = filterRosterEntriesByQuery(rosterEntries, query);
    if (filteredRoster.length > 0 && filteredRoster.length < rosterEntries.length) {
      return filteredRoster.join('\n');
    }
  }

  const keywords = extractKeywords(query);
  const entityType = detectTargetEntityType(query);

  const specificKeywords = keywords.filter(kw => !GENERIC_QUERY_VERBS.has(kw));
  const activeKeywords = specificKeywords.length > 0 ? specificKeywords : keywords;

  // 1. If key points exist, see if any key point directly answers the query
  if (keyPoints && keyPoints.length > 0 && activeKeywords.length > 0) {
    const matchedPoints = keyPoints.filter(kp => {
      const normKp = normalizeText(kp);
      const kpTokens = normKp.split(/\s+/).filter(Boolean);
      const kwMatch = activeKeywords.some(kw => matchKeywordScore(normKp, kpTokens, kw) >= 0.8);
      if (!kwMatch) return false;
      if (entityType === 'schedule') {
        return /\b(\d{1,2}:\d{2}|\d+\s*(am|pm|hrs|horas|minutos|min)|turno|horario|cada\s+\d+)\b/i.test(normKp);
      }
      if (entityType === 'person') {
        return /\b(responsable|encargad|jefe|coordinador|oficial|contacto|correo|email|administrad|autorizad)\b/i.test(normKp);
      }
      if (entityType === 'amount') {
        return /\b(\d+|plazo|anticipacion|dias|monto|\$)\b/i.test(normKp);
      }
      return true;
    });

    if (matchedPoints.length > 0) {
      return matchedPoints.slice(0, 2).map(p => `• ${p}`).join('\n');
    }
  }

  // 2. Break down into subtitle blocks if document has subsections
  const blocks = splitIntoSubtitleBlocks(cleanedContent);
  let targetText = cleanedContent;
  let targetHeading: string | undefined = undefined;
  let matchedByHeadingOnly = false;

  // Helper to strip unrelated secondary clauses (e.g. log reporting, secondary obligations)
  const refineClause = (text: string): string => {
    const clauseDelimiters = /\s*(?:,\s*(?:y\s+|adem[aá]s\s+|asimismo\s+|mientras que\s+|reportando\b|registrando\b|dejando\b|notificando\b|debiendo\b|indicando\b|anotando\b)|;\s*)/i;
    if (!clauseDelimiters.test(text)) return text;

    const clauses = text.split(clauseDelimiters).map(c => c.trim()).filter(c => c.length > 5);
    if (clauses.length <= 1) return text;

    let bestClause = text;
    let bestScore = -1;

    for (const cl of clauses) {
      const norm = normalizeText(cl);
      const tokens = norm.split(/\s+/).filter(Boolean);
      let score = 0;
      for (const kw of keywords) {
        const m = matchKeywordScore(norm, tokens, kw);
        if (m > 0) score += (GENERIC_QUERY_VERBS.has(kw) ? 4 : 14) * m;
      }
      if (entityType === 'schedule' && /\b(\d{1,2}:\d{2}|\d+\s*(am|pm|hrs|horas|minutos|min)|turno|horario|cada\s+\d+)\b/i.test(norm)) {
        score += 25;
      }
      if (entityType === 'person' && /\b(responsable|encargad|jefe|coordinador|oficial|contacto|correo|email)\b/i.test(norm)) {
        score += 25;
      }
      if (entityType === 'amount' && /\b(\d+|plazo|anticipacion|dias|monto|\$)\b/i.test(norm)) {
        score += 25;
      }

      if (score > bestScore) {
        bestScore = score;
        bestClause = cl;
      }
    }

    if (bestScore >= 10 && bestClause.length < text.length * 0.9) {
      return bestClause.endsWith('.') ? bestClause : bestClause + '.';
    }
    return text;
  };

  if (blocks.length > 1) {
    let bestBlockScore = -1;
    let bestBlock = blocks[0];
    let bestHeadingScore = 0;

    for (const b of blocks) {
      let bScore = 0;
      let hScore = 0;
      const normH = b.heading ? normalizeText(b.heading) : '';
      const hTokens = normH.split(/\s+/).filter(Boolean);
      const normT = normalizeText(b.text);
      const tTokens = normT.split(/\s+/).filter(Boolean);

      for (const kw of keywords) {
        const isGeneric = GENERIC_QUERY_VERBS.has(kw);
        const hMatch = matchKeywordScore(normH, hTokens, kw);
        if (hMatch > 0) {
          const pts = (isGeneric ? 10 : 38) * hMatch;
          bScore += pts;
          hScore += pts;
        }
        const tMatch = matchKeywordScore(normT, tTokens, kw);
        if (tMatch > 0) {
          bScore += (isGeneric ? 3 : 14) * tMatch;
        }
      }

      if (entityType === 'schedule') {
        if (/\b(horario|hora|jornada|turno|atencion|apertura|cierre)\b/i.test(normH)) {
          bScore += 45;
          hScore += 45;
        }
        if (/\b(\d{1,2}:\d{2}|\d+\s*(hrs|horas|am|pm)|lunes a viernes)\b/i.test(normT)) bScore += 25;
      } else if (entityType === 'person') {
        if (/\b(responsable|encargad|contacto|jefe|personal|equipo)\b/i.test(normH)) {
          bScore += 45;
          hScore += 45;
        }
        if (/\b(@|responsable|encargad|jefe|coordinador)\b/i.test(normT)) bScore += 25;
      } else if (entityType === 'amount') {
        if (/\b(plazo|anticipacion|monto|valor|viatico|feriado|vacacion)\b/i.test(normH)) {
          bScore += 45;
          hScore += 45;
        }
        if (/\b(\d+\s*(dias|días|meses|semanas)|\$\s*\d+)\b/i.test(normT)) bScore += 25;
      }

      if (bScore > bestBlockScore) {
        bestBlockScore = bScore;
        bestBlock = b;
        bestHeadingScore = hScore;
      }
    }

    if (bestBlockScore > 10) {
      targetText = bestBlock.text;
      targetHeading = bestBlock.heading;
      matchedByHeadingOnly = bestHeadingScore >= 30;
    }
  }

  // 3. Granular sentence and list item extraction
  const sentences = splitIntoGranularSegments(targetText);

  if (sentences.length === 0) {
    return targetText.trim();
  }

  const kwSentenceFreq: Record<string, number> = {};
  const firstSegmentNorm = normalizeText(sentences[0] || '');
  const firstSegmentTokens = firstSegmentNorm.split(/\s+/).filter(Boolean);

  for (const kw of keywords) {
    let count = 0;
    for (const s of sentences) {
      const norm = normalizeText(s);
      const tokens = norm.split(/\s+/).filter(Boolean);
      if (matchKeywordScore(norm, tokens, kw) > 0) count++;
    }
    kwSentenceFreq[kw] = count;
  }

  const hasNonPreambleSpecificKw =
    blocks.length === 1 &&
    sentences.length > 2 &&
    specificKeywords.some(
      kw => kwSentenceFreq[kw] > 0 && matchKeywordScore(firstSegmentNorm, firstSegmentTokens, kw) === 0
    );

  const scoredSentences: {
    sentence: string;
    score: number;
    index: number;
    matchedSpecificKws: string[];
  }[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const norm = normalizeText(s);
    const tokens = norm.split(/\s+/).filter(Boolean);
    let score = 0;
    const matchedSpecificKws: string[] = [];

    for (const kw of keywords) {
      const m = matchKeywordScore(norm, tokens, kw);
      if (m > 0) {
        const isGeneric = GENERIC_QUERY_VERBS.has(kw);
        if (isGeneric) {
          score += 5 * m;
        } else {
          matchedSpecificKws.push(kw);
          const isInPreamble = matchKeywordScore(firstSegmentNorm, firstSegmentTokens, kw) > 0;
          if (hasNonPreambleSpecificKw && isInPreamble && sentences.length > 1) {
            score += 6 * m;
          } else {
            const rarityBonus = (kwSentenceFreq[kw] || 1) === 1 ? 14 : 0;
            score += (26 + rarityBonus) * m;
          }
        }
      }
    }

    if (entityType === 'schedule') {
      if (/\b(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm|hrs|horas)|de\s+\d{1,2}[:\d]*\s*a\s*\d{1,2}[:\d]*|lunes a viernes|lunes a sabado|martes a domingo|cada\s+\d+\s*(minutos|min|hrs|horas)|turno|horario)\b/i.test(norm)) {
        score += 35;
      }
    } else if (entityType === 'person') {
      if (/\b(responsable|encargad[oa]|jefe|jefatura|coordinador[a]?|oficial|supervisor[a]?|gerente|operador|director[a]?|contacto|correo|email|anexo|telefono|personal autorizado|autorizad[oa]|administrad[oa]r?[a]?)\b/i.test(norm)) {
        score += 35;
      }
      if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(s)) {
        score += 25;
      }
    } else if (entityType === 'amount') {
      if (/\b(\d+\s*(dias|días|meses|semanas|horas|minutos|uf|clp|pesos|\%)|\$\s*[\d.]+|\b\d+\s*dias corridos|\b\d+\s*dias habiles|\banticipacion\b|\bplazo\b)\b/i.test(norm)) {
        score += 35;
      }
    }

    if (score > 0) {
      scoredSentences.push({ sentence: s, score, index: i, matchedSpecificKws });
    }
  }

  if (scoredSentences.length > 0) {
    scoredSentences.sort((a, b) => b.score - a.score);
    const top = scoredSentences[0];

    if (top.score >= 12 || entityType !== 'general') {
      let result = refineClause(top.sentence);

      if (result.includes('(') && !result.includes(')')) {
        result += ')';
      }

      const coveredKws = new Set(top.matchedSpecificKws);
      if (targetHeading && blocks.length > 1) {
        const normH = normalizeText(targetHeading);
        const hTokens = normH.split(/\s+/).filter(Boolean);
        for (const kw of specificKeywords) {
          if (matchKeywordScore(normH, hTokens, kw) > 0) {
            coveredKws.add(kw);
          }
        }
      }

      const isCompoundQuery = /\b(y\s+(?:con\s+)?(?:cuant[oa]?s?|como|que|donde|cuando|quien(?:es)?|cual(?:es)?)|ademas)\b/i.test(normalizeText(query));

      const secondDistinct = scoredSentences.slice(1).find(
        cand =>
          (cand.score >= 20 && cand.matchedSpecificKws.some(kw => !coveredKws.has(kw))) ||
          (blocks.length > 1 && isCompoundQuery && cand.score >= top.score * 0.5)
      );

      if (secondDistinct) {
        const secondRefined = refineClause(secondDistinct.sentence);
        const ordered =
          top.index < secondDistinct.index
            ? [result, secondRefined]
            : [secondRefined, result];
        result = ordered.join(' ');
      } else {
        const topIdx = top.index;
        if (topIdx + 1 < sentences.length) {
          const next = sentences[topIdx + 1];
          const normNext = normalizeText(next);
          if (
            next.length < 110 &&
            ((entityType === 'schedule' && /\b(sabado|domingo|festivo|feriado|cerrado|no se atiende)\b/i.test(normNext)) ||
              (entityType === 'general' &&
                /^(los dias sabado|los sabados|nota:|importante:)\b/i.test(normNext)))
          ) {
            result = `${result} ${next}`;
          }
        }
      }

      if (targetHeading && !result.toLowerCase().includes(targetHeading.toLowerCase())) {
        return `**${targetHeading}:** ${result}`;
      }
      return result;
    }
  }

  // 4. If a specific subtitle heading matched the user's query (e.g. "## Código de Vestimenta")
  // and its body is concise (so the query keywords were in the heading rather than repeated in the body)
  if (matchedByHeadingOnly && targetHeading && targetText.length <= 350) {
    return `**${targetHeading}:** ${targetText.trim()}`;
  }

  // 5. Fallback: first concise sentence (never dump the entire manual)
  const first = sentences[0] || targetText.slice(0, 180);
  return first.length > 220 ? first.slice(0, 220).trim() + '...' : first;
}

/**
 * Cleans raw manual title down to the site or project name
 */
export function cleanSiteName(title: string): string {
  return title
    .replace(/^Puesto\s+\d+\s*[-–—]\s*/i, '')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/^(?:Reglamento|Manual|Procedimiento)\s+(?:de|del|para)\s+/i, '')
    .trim();
}

/**
 * Friendly, coworker-styled grounded answer generator with polite boundary for off-topic queries.
 * Synthesizes and extracts ONLY the specific part requested by the user, avoiding dumping entire manuals.
 */
export function generateLocalGroundedAnswer(
  query: string,
  results: SearchResult[],
  tone: 'direct' | 'detailed' | 'steps' = 'direct'
): { answer: string; citations: Citation[] } {
  // 1. Social pleasantries (greetings, thanks, etc.) -> Zero manual searching
  const socialIntent = detectConversationalIntent(query);
  if (socialIntent) {
    return {
      answer: getConversationalResponse(socialIntent),
      citations: []
    };
  }

  // 2. Off-topic topics like Naruto, cooking, sports -> Friendly coworker redirection
  if (isOffTopicQuery(query)) {
    return {
      answer: `¡Jajaja, me encantaría quedarme hablando de eso (o de Naruto)! 😅 Pero aquí en la oficina me tienen contratado como tu compañero para resolver dudas de la empresa.\n\nSi tienes preguntas sobre vacaciones, permisos, seguro médico, beneficios, viáticos o temas de TI y seguridad, ¡ahí sí soy todo oídos! ¿Te doy una mano con algo del trabajo?`,
      citations: []
    };
  }

  // 3. Work query but nothing matched in manuals
  if (results.length === 0) {
    return {
      answer: `¡Oye! Estuve revisando con atención nuestro **Book de Manuales Internos**, pero no encontré una política o procedimiento que hable específicamente de *"${query}"*.\n\nPara que no te quedes con la duda, te recomiendo consultar directamente con el equipo de **Gestión de Personas (RRHH)** en \`rrhh-gestion@empresa.com\` o con tu líder directo. ¡Si tienes otra duda sobre beneficios o trámites, avísame y lo buscamos juntos!`,
      citations: []
    };
  }

  const primary = results[0];
  const citations = extractCitations(results);
  const relevantExcerpt = extractRelevantExcerpt(primary.section.content, query, primary.section.keyPoints);

  let answer = '';

  if (tone === 'steps') {
    answer = `¡Hola! Claro que sí, aquí tienes puntualmente lo que indica el **${primary.manual.title}** ([${primary.manual.code}: ${primary.section.articleNumber}]):\n\n`;
    if (primary.section.keyPoints && primary.section.keyPoints.length > 0) {
      primary.section.keyPoints.forEach((point, i) => {
        answer += `${i + 1}. **${point}**\n`;
      });
      if (relevantExcerpt && !primary.section.keyPoints.some(kp => relevantExcerpt.includes(kp))) {
        answer += `\n**Dato puntual:**\n${relevantExcerpt}\n`;
      }
    } else {
      answer += `${relevantExcerpt}\n`;
    }
    answer += `\n*(Cualquier duda adicional, puedes revisar la referencia completa [${primary.section.articleNumber}] abajo).*`;
  } else if (tone === 'detailed') {
    answer = `¡Hola! Te comparto la parte específica que aplica según el **${primary.manual.title}** ([${primary.manual.code}: ${primary.section.articleNumber} - *${primary.section.title}*]):\n\n`;
    answer += `${relevantExcerpt}\n\n`;
    if (primary.section.keyPoints && primary.section.keyPoints.length > 0) {
      answer += `**Puntos clave:**\n`;
      primary.section.keyPoints.slice(0, 3).forEach(kp => {
        answer += `- ${kp}\n`;
      });
    }
  } else {
    const whoMatch = query.match(/(?:qui[eé]n\s+(?:es|son)\s+|^)([a-záéíóú\s]+?)(?:\?|$)/i);
    const targetEntityType = detectTargetEntityType(query);
    const rosterLines = relevantExcerpt.split('\n').map(l => l.trim()).filter(Boolean);
    const hasSectionRoster = parseRosterEntries(primary.section.content).length >= 2;
    const isRoster =
      hasSectionRoster &&
      rosterLines.length > 0 &&
      rosterLines.every(l => /^[^•\d-][^-–—]{1,35}\s+[-–—]\s+.+$/.test(l));

    if (isRoster) {
      const siteMatch = query.match(/\b(foresta|sunset|[A-ZÁÉÍÓÚ][a-zñáéíóú]{3,})\b/i);
      const siteWord = siteMatch ? siteMatch[0].charAt(0).toUpperCase() + siteMatch[0].slice(1).toLowerCase() : cleanSiteName(primary.manual.title);

      if (rosterLines.length > 1) {
        const bulletList = rosterLines.map(l => {
          const parts = l.split(/\s*[-–—]\s*/);
          if (parts.length >= 2) {
            const role = parts.slice(1).join(' - ').replace(new RegExp(`\\b${siteWord}\\b`, 'gi'), '').trim();
            return `- **${parts[0]}:** ${role || parts.slice(1).join(' - ')}`;
          }
          return `- ${l}`;
        }).join('\n');
        answer = `En **${siteWord}**, el personal correspondiente es:\n${bulletList}\n\n[${primary.manual.code}: ${primary.section.articleNumber}].`;
      } else {
        const parts = rosterLines[0].split(/\s*[-–—]\s*/);
        const name = parts[0];
        const role = parts.slice(1).join(' - ').replace(new RegExp(`\\b${siteWord}\\b`, 'gi'), '').trim();
        answer = `En **${siteWord}**, **${name}** está a cargo de: **${role || parts.slice(1).join(' - ')}** [${primary.manual.code}: ${primary.section.articleNumber}].`;
      }
    } else if (whoMatch && (targetEntityType === 'person' || /qui[eé]n\s+(?:es|son)/i.test(query))) {
      const targetName = whoMatch[1].trim();
      const siteName = cleanSiteName(primary.manual.title);
      const normEx = normalizeText(relevantExcerpt);

      if (normEx.includes('personal autorizado') || normEx.includes('administrad')) {
        const isFemale = targetName.endsWith('a') || /\b(cinthia|claudia|maria|laura|ana|paula|carolina|daniela|patricia|marcela)\b/i.test(targetName);
        const pronoun = isFemale ? 'Ella' : 'Él';
        answer = `${pronoun} es la administradora de **${siteName}** [${primary.manual.code}: ${primary.section.articleNumber}].`;
      } else {
        answer = `${targetName} figura en **${siteName}** como: **${relevantExcerpt}** [${primary.manual.code}: ${primary.section.articleNumber}].`;
      }
    } else {
      // Direct and concise response (never dumps the whole manual)
      const formattedExcerpt = relevantExcerpt.includes('\n')
        ? `\n${relevantExcerpt}`
        : relevantExcerpt.includes('**')
          ? relevantExcerpt
          : `**${relevantExcerpt}**`;
      answer = `Según el **${primary.manual.title}** ([${primary.manual.code}: ${primary.section.articleNumber}]): ${formattedExcerpt}`;
    }
  }

  return {
    answer,
    citations
  };
}
