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
  'nosotros', 'hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'favor', 'quisiera', 'saber',
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
 * Friendly, coworker-styled grounded answer generator with polite boundary for off-topic queries
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

  let answer = '';

  if (tone === 'steps') {
    answer = `¡Hola! Claro que sí, aquí te dejo el paso a paso ordenado según lo que indica el **${primary.manual.title}** ([${primary.manual.code}: ${primary.section.articleNumber}]):\n\n`;
    if (primary.section.keyPoints && primary.section.keyPoints.length > 0) {
      primary.section.keyPoints.forEach((point, i) => {
        answer += `${i + 1}. **${point}**\n`;
      });
      answer += `\n**Para tener en cuenta:**\n${primary.section.content}\n`;
    } else {
      answer += `${primary.section.content}\n`;
    }
    answer += `\nCualquier duda que te surja en el proceso, avísame y lo revisamos juntos. ¡Mucho éxito!`;
  } else if (tone === 'detailed') {
    answer = `¡Qué bueno que preguntas! Te comparto el detalle completo de lo que tenemos establecido en el **${primary.manual.title}** ([${primary.manual.code}: ${primary.section.articleNumber} - *${primary.section.title}*]):\n\n`;
    answer += `${primary.section.content}\n\n`;
    if (primary.section.keyPoints && primary.section.keyPoints.length > 0) {
      answer += `**Puntos clave que no debes olvidar:**\n`;
      primary.section.keyPoints.forEach(kp => {
        answer += `- ${kp}\n`;
      });
    }
    if (results.length > 1) {
      const secondary = results[1];
      answer += `\n*Dato adicional:* En el documento **${secondary.manual.title}** [${secondary.manual.code}: ${secondary.section.articleNumber}] también se menciona que: ${secondary.section.content.slice(0, 140)}...`;
    }
  } else {
    // Direct but friendly coworker tone
    answer = `¡Hola! Mira, según lo establecido en el **${primary.manual.title}** ([${primary.manual.code}: ${primary.section.articleNumber}]), la cosa funciona así:\n\n`;
    if (primary.section.keyPoints && primary.section.keyPoints.length > 0) {
      answer += primary.section.keyPoints.map(kp => `• ${kp}`).join('\n') + '\n\n';
    }
    answer += `${primary.section.content.split('\n')[0]}\n\n`;
    answer += `*(Si necesitas revisar la cláusula oficial completa, puedes ver la referencia [${primary.section.articleNumber}] que te dejé abajo). ¡Espero te sirva!*`;
  }

  return {
    answer,
    citations
  };
}
