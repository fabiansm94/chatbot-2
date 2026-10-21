import { Citation, ManualDocument, ManualSection, SearchResult } from '../types/manual';

const SPANISH_STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para',
  'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus', 'le', 'ya', 'o',
  'este', 'si', 'porque', 'esta', 'son', 'entre', 'esta', 'cuando', 'muy', 'sin', 'sobre',
  'ser', 'tiene', 'tambien', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo',
  'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante',
  'ellos', 'e', 'esto', 'mi', 'antes', 'algunos', 'que', 'unos', 'yo', 'otro', 'otras',
  'otra', 'el', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual',
  'sea', 'poco', 'ella', 'estar', 'haber', 'estas', 'estaba', 'estamos', 'algunas', 'algo',
  'nosotros', 'hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'favor', 'quisiera', 'saber'
]);

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
  return filtered.length > 0 ? filtered : words;
}

/**
 * Searches manuals using weighted keyword and phrase scoring
 */
export function searchManuals(
  query: string,
  manuals: ManualDocument[],
  maxResults = 4
): SearchResult[] {
  const keywords = extractKeywords(query);
  const normalizedQuery = normalizeText(query);

  if (!query.trim() || manuals.length === 0) {
    return [];
  }

  const results: SearchResult[] = [];

  for (const manual of manuals) {
    for (const section of manual.sections) {
      const normTitle = normalizeText(section.title);
      const normArticle = normalizeText(section.articleNumber);
      const normContent = normalizeText(section.content);
      const normTags = section.tags.map(t => normalizeText(t)).join(' ');
      const normManualTitle = normalizeText(manual.title);

      let score = 0;

      // Exact phrase bonus in title or content
      if (normalizedQuery.length > 3 && normTitle.includes(normalizedQuery)) {
        score += 50;
      } else if (normalizedQuery.length > 3 && normContent.includes(normalizedQuery)) {
        score += 25;
      }

      // Keyword matches
      for (const kw of keywords) {
        if (normArticle.includes(kw)) {
          score += 20;
        }
        if (normTitle.includes(kw)) {
          score += 15;
        }
        if (normTags.includes(kw)) {
          score += 12;
        }
        if (normManualTitle.includes(kw)) {
          score += 6;
        }
        if (normContent.includes(kw)) {
          // Count occurrences with diminishing returns
          const regex = new RegExp(`\\b${kw}`, 'gi');
          const count = (normContent.match(regex) || []).length;
          score += Math.min(count * 3, 15);
        }
      }

      if (score > 0) {
        // Generate snippet around the best matching keyword
        let snippet = section.content.slice(0, 180).trim() + '...';
        const bestKw = keywords.find(kw => normContent.includes(kw));
        if (bestKw) {
          const idx = normContent.indexOf(bestKw);
          const start = Math.max(0, idx - 40);
          const end = Math.min(section.content.length, idx + 140);
          snippet = (start > 0 ? '...' : '') + section.content.slice(start, end).trim() + (end < section.content.length ? '...' : '');
        }

        results.push({
          section,
          manual,
          score,
          snippet
        });
      }
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

/**
 * Builds formatted context markdown for Gemini RAG prompt
 */
export function buildManualContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No se encontraron artículos directamente coincidentes en los manuales indexados.';
  }

  return results
    .map((res, index) => {
      const { manual, section } = res;
      return `### [DOCUMENTO ${index + 1}]
Manual: ${manual.title} (${manual.code}, v${manual.version})
Departamento: ${manual.department}
Artículo: ${section.articleNumber} - "${section.title}"
Identificador: ${manual.id}#${section.id}
Contenido Oficial:
${section.content}
${section.keyPoints && section.keyPoints.length > 0 ? `Puntos Clave: ${section.keyPoints.join(' | ')}` : ''}
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
 * Deterministic local grounded answer generator for offline/resilient mode
 */
export function generateLocalGroundedAnswer(
  query: string,
  results: SearchResult[],
  tone: 'direct' | 'detailed' | 'steps' = 'direct'
): { answer: string; citations: Citation[] } {
  const normalizedQuery = normalizeText(query);
  const greetings = ['hola', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'hola bot', 'que tal'];

  // Handle greetings naturally
  if (greetings.some(g => normalizedQuery === g || normalizedQuery.startsWith(g + ' '))) {
    return {
      answer: `¡Hola! Soy ManualBot, tu asistente de manuales y procedimientos internos. 

¿De qué duda sobre los manuales o procedimientos quieres que te ayude?`,
      citations: []
    };
  }

  // Detect clearly out of scope questions
  const outOfScopePatterns = [
    'hora', 'clima', 'tiempo', 'receta', 'chiste', 'noticia', 'deporte', 'futbol', 'cine', 'musica',
    'china', 'japon', 'eeuu', 'españa', 'francia', 'alemania', 'italia', 'mexico', 'argentina',
    'calcular', 'convertir', 'traducir', 'ia general', 'chatgpt', 'openai'
  ];

  if (outOfScopePatterns.some(pattern => normalizedQuery.includes(pattern))) {
    return {
      answer: `Solo puedo ayudarte con dudas sobre los manuales y procedimientos internos de la empresa. ¿Tienes alguna consulta relacionada con RRHH, TI, SST, Ética o Gastos/Viajes?`,
      citations: []
    };
  }

  if (results.length === 0) {
    return {
      answer: `He revisado el Book de Manuales Internos, pero no encuentro una respuesta directa para eso en lo que tengo indexado.

Si es un tema que debería estar en los manuales, te sugiero contactar con el departamento correspondiente (RRHH, TI, SST, Compliance/Ética o Finanzas). ¿Me dices un poco más de contexto para ver si logro orientarte?`,
      citations: []
    };
  }

  const primary = results[0];
  const citations = extractCitations(results);

  let answer = '';

  if (tone === 'steps') {
    answer = `Según lo estipulado en el **${primary.manual.title}** (${primary.manual.code}, ${primary.section.articleNumber} - *${primary.section.title}*), estos son los pasos y directrices a seguir:\n\n`;
    if (primary.section.keyPoints && primary.section.keyPoints.length > 0) {
      primary.section.keyPoints.forEach((point, i) => {
        answer += `${i + 1}. **${point}**\n`;
      });
      answer += `\n**Detalle normativo:**\n${primary.section.content}\n`;
    } else {
      answer += `${primary.section.content}\n`;
    }
  } else if (tone === 'detailed') {
    answer = `De acuerdo con la normativa interna vigente en el **${primary.manual.title}** [${primary.manual.code}, ${primary.section.articleNumber}]:\n\n`;
    answer += `> *${primary.section.title}*\n\n`;
    answer += `${primary.section.content}\n\n`;
    if (primary.section.keyPoints && primary.section.keyPoints.length > 0) {
      answer += `**Aspectos clave a considerar:**\n`;
      primary.section.keyPoints.forEach(kp => {
        answer += `- ${kp}\n`;
      });
    }
    if (results.length > 1) {
      const secondary = results[1];
      answer += `\n**Información complementaria relacionada:** En **${secondary.manual.title}** [${secondary.manual.code}, ${secondary.section.articleNumber}] se especifica: ${secondary.section.content.slice(0, 140)}...`;
    }
  } else {
    // Direct tone
    answer = `En base a lo establecido en el **${primary.manual.title}** (${primary.manual.code}, ${primary.section.articleNumber} - *${primary.section.title}*):\n\n`;
    if (primary.section.keyPoints && primary.section.keyPoints.length > 0) {
      answer += primary.section.keyPoints.map(kp => `• ${kp}`).join('\n') + '\n\n';
    }
    answer += `${primary.section.content.split('\n')[0]}\n\n`;
    answer += `*Para consultar el texto legal completo, revisa la referencia [${primary.section.articleNumber}] adjunta.*`;
  }

  return {
    answer,
    citations
  };
}
