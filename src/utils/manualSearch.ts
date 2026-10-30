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
    for (const section of manual.sections) {
      const normTitle = normalizeText(section.title);
      const normArticle = normalizeText(section.articleNumber);
      const normContent = normalizeText(section.content);
      const normTags = section.tags.map(t => normalizeText(t)).join(' ');

      let score = 0;

      // Exact title match bonus
      if (normTitle.includes(normalizedQuery)) {
        score += 80;
      }

      // Exact article number match (e.g. "Art. 4.1" or "4.1")
      if (normArticle.includes(normalizedQuery) || normalizedQuery.includes(normArticle)) {
        score += 100;
      }

      // Keywords match across title, tags and content
      for (const kw of keywords) {
        if (normTitle.includes(kw)) score += 25;
        if (normTags.includes(kw)) score += 20;
        if (normContent.includes(kw)) score += 8;
        if (normArticle.includes(kw)) score += 30;
      }

      // Department matching
      if (normalizeText(manual.department).includes(normalizedQuery)) {
        score += 15;
      }

      if (score > 0) {
        // Build readable snippet centered on matching term
        let snippet = section.content.slice(0, 180);
        for (const kw of keywords) {
          const idx = normContent.indexOf(kw);
          if (idx !== -1) {
            const start = Math.max(0, idx - 40);
            const end = Math.min(section.content.length, idx + 140);
            snippet = (start > 0 ? '...' : '') + section.content.slice(start, end) + '...';
            break;
          }
        }

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
 * Builds formatted context markdown for Gemini RAG prompt
 */
export function buildManualContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No se encontraron artículos directamente coincidentes en los manuales indexados.';
  }

  return results
    .map((res, index) => {
      const { manual, section } = res;
      return `### [REFERENCIA ${index + 1}]
Manual: ${manual.title} (${manual.code}, v${manual.version})
Departamento: ${manual.department}
Artículo: ${section.articleNumber} - "${section.title}"
Identificador: ${manual.id}#${section.id}
${section.keyPoints && section.keyPoints.length > 0 ? `Puntos Clave del Artículo: ${section.keyPoints.join(' | ')}\n` : ''}Texto del Artículo (Úsalo como fuente de referencia para extraer ÚNICAMENTE lo que preguntó el usuario, NUNCA transcribas el texto completo):
${section.content}
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
 * Extracts only the specific, relevant sentence or paragraph answering the user's query,
 * preventing long walls of text or full verbatim manual dumps.
 */
export function extractRelevantExcerpt(
  content: string,
  query: string,
  keyPoints?: string[]
): string {
  if (!content) return '';

  const keywords = extractKeywords(query);

  // 1. If key points exist, see if any key point directly answers the query keywords
  if (keyPoints && keyPoints.length > 0 && keywords.length > 0) {
    const matchedPoints = keyPoints.filter(kp => {
      const normKp = normalizeText(kp);
      return keywords.some(kw => normKp.includes(kw));
    });

    if (matchedPoints.length > 0) {
      return matchedPoints.slice(0, 3).map(p => `• ${p}`).join('\n');
    }
  }

  // 2. Split content into coherent blocks/paragraphs (by blank lines \n\s*\n)
  const rawParagraphs = content
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 10);

  const paragraphs = rawParagraphs.length > 1
    ? rawParagraphs
    : content.split('\n').map(p => p.trim()).filter(p => p.length > 10);

  // If content is already very brief (<= 180 chars), return it as is
  if (paragraphs.length <= 1 && content.length <= 180) {
    return content.trim();
  }

  // 3. Score paragraphs by keyword matches & presence of specific terms/numbers
  const scoredParagraphs: { text: string; score: number }[] = [];

  for (const para of paragraphs) {
    const norm = normalizeText(para);
    let score = 0;
    for (const kw of keywords) {
      if (norm.includes(kw)) score += 10;
    }
    // Boost paragraphs with numbers, days, requirements, steps, deadlines
    if (/\b(\d+|dias|horas|meses|semanas|plazo|requisito|monto|\$|porcentaje|art|portal|formulario)\b/i.test(norm)) {
      score += 3;
    }
    if (score > 0) {
      scoredParagraphs.push({ text: para, score });
    }
  }

  if (scoredParagraphs.length > 0) {
    scoredParagraphs.sort((a, b) => b.score - a.score);
    const top = scoredParagraphs[0];

    // If the top paragraph is a clear strong match or subsequent ones are noticeably weaker, return only the top paragraph
    if (
      scoredParagraphs.length === 1 ||
      scoredParagraphs[1].score < top.score * 0.65 ||
      top.score >= 25
    ) {
      return top.text;
    }

    // Otherwise return at most top 2 paragraphs
    const topParagraphs = scoredParagraphs.slice(0, 2).map(p => p.text);
    return topParagraphs.join('\n\n');
  }

  // 4. If no paragraph scored with keywords, inspect individual sentences
  const sentences = content
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  for (const sentence of sentences) {
    const norm = normalizeText(sentence);
    for (const kw of keywords) {
      if (norm.includes(kw)) {
        return sentence;
      }
    }
  }

  // 5. Fallback: return ONLY the first paragraph (clipped to 220 chars) instead of dumping the whole manual
  const first = paragraphs[0] || content.slice(0, 200);
  return first.length > 220 ? first.slice(0, 220).trim() + '...' : first;
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
    // Direct and concise coworker tone (never dumps the whole manual)
    answer = `¡Hola! Mira, sobre lo que preguntas, el **${primary.manual.title}** ([${primary.manual.code}: ${primary.section.articleNumber}]) establece puntualmente lo siguiente:\n\n`;
    answer += `${relevantExcerpt}\n\n`;
    answer += `*(Si deseas ver el artículo completo, abajo tienes la referencia oficial [${primary.section.articleNumber}]).*`;
  }

  return {
    answer,
    citations
  };
}
