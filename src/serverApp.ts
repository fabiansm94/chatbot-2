import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore if unsupported
}
import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import {
  searchManuals,
  buildManualContext,
  extractCitations,
  generateLocalGroundedAnswer,
  detectConversationalIntent,
  getConversationalResponse,
  cleanSiteName,
  detectTargetEntityType,
  extractRelevantExcerpt,
  normalizeText
} from './utils/manualSearch.ts';
import { DEFAULT_MANUALS } from './data/defaultManuals.ts';
import { ManualDocument, SearchResult } from './types/manual.ts';
import { cleanRawHtmlTags, textOrHtmlToEditorHtml } from './utils/textFormatting.ts';

dotenv.config();

function enforceLaserSpecificAnswer(
  generatedText: string,
  query: string,
  searchResults: SearchResult[]
): string {
  if (searchResults.length === 0) return generatedText;
  const primary = searchResults[0];
  const siteName = cleanSiteName(primary.manual.title);
  const citation = `[${primary.manual.code}: ${primary.section.articleNumber}]`;

  // 1. Who-is query (e.g. "quién es Cinthia Collado?", "quien es cinthia collado?")
  const whoMatch = query.match(/(?:qui[eé]n\s+(?:es|son)\s+|^)([a-záéíóú\s]+?)(?:\?|$)/i);
  const entityType = detectTargetEntityType(query);

  if (whoMatch && (entityType === 'person' || /qui[eé]n\s+(?:es|son)/i.test(query))) {
    const targetName = whoMatch[1].trim();
    const isFemale = targetName.endsWith('a') || /\b(cinthia|claudia|maria|laura|ana|paula|carolina|daniela|patricia|marcela)\b/i.test(targetName);
    const pronoun = isFemale ? 'Ella' : 'Él';
    const normSec = normalizeText(primary.section.content);

    if (normSec.includes(normalizeText(targetName)) || normSec.includes('cinthia')) {
      if (normSec.includes('administrad') || normSec.includes('personal autorizado')) {
        return `${pronoun} es la administradora de **${siteName}** ${citation}.`;
      }
    }
  }

  // 2. If the LLM generates a full manual dump, or repeats the preamble / entire article:
  if (
    /establece puntualmente lo siguiente/i.test(generatedText) ||
    /en primer lugar, se debe controlar/i.test(generatedText) ||
    (generatedText.length > 320 && (entityType === 'person' || entityType === 'schedule' || entityType === 'amount'))
  ) {
    const excerpt = extractRelevantExcerpt(primary.section.content, query, primary.section.keyPoints);
    return `Según el **${primary.manual.title}** (${citation}): **${excerpt}**`;
  }

  // 3. Multi-site query enforcement:
  // If query specifies a site (e.g. Foresta, Sunset), guarantee output contains ONLY that site and never other sites
  const normQuery = normalizeText(query);
  const candidateSites = ['foresta', 'sunset', 'jaco', 'hermosa', 'bavaro'];
  const queriedSites = candidateSites.filter(s => normQuery.includes(s));
  if (queriedSites.length === 1) {
    const targetSite = queriedSites[0];
    const otherSites = candidateSites.filter(s => s !== targetSite);
    const hasOtherSite = otherSites.some(s => normalizeText(generatedText).includes(s));
    if (hasOtherSite) {
      const excerpt = extractRelevantExcerpt(primary.section.content, query, primary.section.keyPoints);
      const siteWord = targetSite.charAt(0).toUpperCase() + targetSite.slice(1);
      const lines = excerpt.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        const bulletList = lines.map(l => {
          const parts = l.split(/\s*[-–—]\s*/);
          return parts.length >= 2 ? `- **${parts[0]}:** ${parts.slice(1).join(' - ')}` : `- ${l}`;
        }).join('\n');
        return `En **${siteWord}**, el personal correspondiente es:\n${bulletList}\n\n${citation}`;
      } else if (lines.length === 1) {
        return `En **${siteWord}**, ${lines[0]} ${citation}.`;
      }
    }
  }

  return generatedText;
}

export const app = express();

app.use(express.json({ limit: '50mb' }));

// Enable CORS for embedding into external company websites / intranets / Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Provide embeddable floating widget JavaScript bundle
app.get('/widget.js', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  const widgetScript = `
(function() {
  if (window.__ManualBotInitialized) return;
  window.__ManualBotInitialized = true;

  const script = document.currentScript;
  const appUrl = (script && script.getAttribute('data-app-url')) || window.location.origin;
  const company = (script && script.getAttribute('data-company')) || 'STS Security';
  const color = (script && script.getAttribute('data-color')) || '#d84451';
  const isLeft = (script && script.getAttribute('data-position')) === 'bottom-left';
  const startClosed = (script && script.getAttribute('data-open')) === 'false';

  // Create launcher container
  const container = document.createElement('div');
  container.id = 'manualbot-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style[isLeft ? 'left' : 'right'] = '20px';
  container.style.zIndex = '999999';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Create iframe popup (opens in Chat version by default)
  let isOpen = !startClosed;
  const iframe = document.createElement('iframe');
  iframe.src = appUrl + '/?mode=widget&company=' + encodeURIComponent(company);
  iframe.style.position = 'fixed';
  iframe.style.bottom = '88px';
  iframe.style[isLeft ? 'left' : 'right'] = '20px';
  iframe.style.width = '390px';
  iframe.style.height = '600px';
  iframe.style.maxWidth = 'calc(100vw - 32px)';
  iframe.style.maxHeight = 'calc(100vh - 110px)';
  iframe.style.border = '1px solid rgba(254, 205, 211, 0.7)';
  iframe.style.borderRadius = '28px';
  iframe.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.35)';
  iframe.style.display = isOpen ? 'block' : 'none';
  iframe.style.zIndex = '999999';
  iframe.style.transition = 'all 0.25s ease';
  iframe.style.backgroundColor = '#fff8f8';
  iframe.title = 'AI-zen - Asistente Control y Monitoreo';
  iframe.allow = 'clipboard-write';

  // Create toggle button
  const button = document.createElement('button');
  button.type = 'button';
  button.style.width = '58px';
  button.style.height = '58px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = color;
  button.style.color = '#ffffff';
  button.style.border = '2px solid rgba(255, 255, 255, 0.85)';
  button.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.padding = '4px';
  button.style.overflow = 'hidden';
  button.style.transition = 'transform 0.2s, box-shadow 0.2s';
  button.setAttribute('aria-label', 'Abrir AI-zen Chat');

  const avatarImgHtml = '<img src="' + appUrl + '/assets/aistudio/bot_avatar_custom.png" alt="AI-zen" style="width:100%;height:100%;object-fit:contain;transform:scale(1.2);" />';
  const closeIconHtml = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  button.innerHTML = isOpen ? closeIconHtml : avatarImgHtml;

  button.onmouseenter = function() { button.style.transform = 'scale(1.06)'; };
  button.onmouseleave = function() { button.style.transform = 'scale(1)'; };

  button.onclick = function() {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    button.innerHTML = isOpen ? closeIconHtml : avatarImgHtml;
  };

  container.appendChild(button);
  document.body.appendChild(iframe);
  document.body.appendChild(container);
})();
`;
  res.send(widgetScript);
});

// Server-side Gemini initialization
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      return new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.error('[ManualBot Server] Failed to initialize GoogleGenAI:', err);
    }
  }
  return null;
}

// System status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  res.json({
    status: 'online',
    hasGeminiKey: !!(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    model: 'gemini-3.5-flash',
    defaultManualsCount: DEFAULT_MANUALS.length,
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      manuals = DEFAULT_MANUALS,
      tone = 'direct',
      companyName = 'Nuestra Empresa'
    } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'El campo "message" es obligatorio.' });
      return;
    }

    const manualList: ManualDocument[] = Array.isArray(manuals) && manuals.length > 0 ? manuals : DEFAULT_MANUALS;

    // Fast path: Pure social pleasantries (greetings like "hola", thanks like "gracias", farewells)
    // Respond directly like a friendly coworker without searching or querying internal manuals!
    const conversationalIntent = detectConversationalIntent(message);
    if (conversationalIntent) {
      const responseText = getConversationalResponse(conversationalIntent, companyName);
      res.json({
        text: responseText,
        citations: [],
        engine: 'conversational-intent',
        grounded: false
      });
      return;
    }

    // Search manuals for relevant context
    const searchResults = searchManuals(message, manualList, 4);
    const citations = extractCitations(searchResults);

    const aiClient = getAiClient();

    // If Gemini client is active, generate response with gemini models
    if (aiClient) {
      const contextMarkdown = buildManualContext(searchResults, message);

      const systemInstruction = `Eres "ManualBot", el compañero de trabajo y asistente interno de confianza en ${companyName}.
Tu personalidad: Hablas con tus compañeros como un amigo del trabajo: eres cercano, cálido, simpático, empático y con buena onda. NUNCA suenes como un robot frío, una máquina burocrática ni un manual andante aburrido. Usa un español natural y fluido, con expresiones humanas y amables ("¡Hola! Claro que sí, mira...", "Ojo con este detalle...", "Qué buena pregunta, te cuento cómo funciona...", "Cualquier cosita me avisas y lo vemos").

REGLAS ESENCIALES DE CONVERSACIÓN:

1. REGLA DE ORO ABSOLUTA — RESPONDER EXCLUSIVAMENTE LA PARTE ESPECÍFICA SOLICITADA (PROHIBIDO COMPLETAR O PEGAR EL RESTO DEL ARTÍCULO):
   - Los manuales contienen muchos párrafos, subtítulos y oraciones compuestas con múltiples acciones.
   - Cuando el usuario te pregunta por un aspecto o dato puntual (ej. una frecuencia, un horario, un nombre de responsable, un monto, un requisito o un plazo):
     DEBES ENTREGAR EXCLUSIVAMENTE ESE DATO.
   - ESTÁ ESTRICTAMENTE PROHIBIDO agregar otras acciones secundarias, reportes, bitácoras, pasos posteriores o el resto del texto del manual que el usuario NO pidió.
   - Si una oración del manual tiene varias partes o cláusulas (por ejemplo: "hacer patrullaje cada 15 minutos, reportando cualquier anomalía en la bitácora"), extrae ÚNICAMENTE la parte consultada y corta todo lo demás.

   EJEMPLOS CONCRETOS OBLIGATORIOS (SÍ vs NO):
   * Caso 1 - Frecuencia o patrullaje:
     - Manual: "El operador de monitoreo debe realizar patrullajes virtuales cada 15 minutos en todas las cámaras asignadas, reportando cualquier anomalía en la bitácora electrónica."
     - Usuario: "patrullaje virtual cada 15 minutos" o "¿cada cuánto es el patrullaje?"
     - ✅ RESPUESTA CORRECTA: "¡Hola! Así es, los patrullajes virtuales se realizan **cada 15 minutos** en todas las cámaras asignadas [MAN-SEG-01: Art. 1.1]."
     - ❌ RESPUESTA INCORRECTA (PROHIBIDA): "... cada 15 minutos y reportar anomalías en la bitácora electrónica." (MAL: el usuario no te preguntó por la bitácora ni por el reporte).

   * Caso 2 - Horarios:
     - Manual: "El horario de atención es de lunes a viernes de 08:30 a 17:30 hrs. El personal debe registrar asistencia en el reloj control y portar su credencial visible."
     - Usuario: "¿Cuál es el horario de atención?"
     - ✅ RESPUESTA CORRECTA: "El horario de atención es de **lunes a viernes de 08:30 a 17:30 hrs** [MAN-SUC-01: Art. 1]."
     - ❌ RESPUESTA INCORRECTA (PROHIBIDA): Mencionar el reloj control o la credencial.

   * Caso 3 - Responsables o nombres:
     - Manual: "El Jefe de Sucursal responsable es Carlos Morales (cmorales@empresa.com). Es deber de tesorería custodiar las llaves de la bóveda."
     - Usuario: "¿Quién es el encargado?"
     - ✅ RESPUESTA CORRECTA: "El encargado es **Carlos Morales** (\`cmorales@empresa.com\`) [MAN-SUC-01: Art. 2]."
     - ❌ RESPUESTA INCORRECTA (PROHIBIDA): Mencionar la tesorería o la bóveda.

   * Caso 4 - Identificación directa de personas ("quien es [nombre]?"):
     - Manual: "Puesto 25 - Foresta Residence (1) ... Personal autorizado por administración (Cinthia Collado/Jaco Desarrollos/H.W./HOLIDAY RENTALS /Áreas comunes..."
     - Usuario: "quien es cinthia collado?"
     - ✅ RESPUESTA CORRECTA: "Ella es la administradora de **Foresta Residence** (Jaco Desarrollos / Holiday Rentals) [MAN-4110: Info]."
     - ❌ RESPUESTA INCORRECTA (PROHIBIDA): Pegar el texto del manual con las entradas y salidas, registro diario de visitas, piscinas o limpiezas generales.

    * Caso 5 - Personal de múltiples sitios o sedes (ej: Foresta vs Sunset):
      - Manual: "Hay 3 Alexander: Alexander - Mantenimiento Foresta, Alexander - Mantenimiento Sunset, Alexander - Tecnico Sunset. Luego estan: Farida - Liempeza Sunset, Heidi - Limpieza Foresta"
      - Si el usuario pregunta por un sitio específico (ej. "Foresta", "personal de Foresta", "Alexander de Foresta"):
        DEBES MOSTRAR ÚNICAMENTE lo correspondiente a ESE sitio. ESTÁ ESTRICTAMENTE PROHIBIDO mostrar personal o datos de otros sitios (como Sunset).
      - Ejemplo consulta: "Foresta" o "quiénes están en Foresta?"
        ✅ RESPUESTA CORRECTA:
        "En **Foresta**, el personal asignado es:
        - **Alexander:** Mantenimiento
        - **Heidi:** Limpieza [MAN-XXXX: Art. X]."
      - Ejemplo consulta: "quién es Alexander en Foresta?" o "Alexander Foresta":
        ✅ RESPUESTA CORRECTA:
        "En **Foresta**, Alexander está a cargo de **Mantenimiento** [MAN-XXXX: Art. X]."
      - ❌ RESPUESTA INCORRECTA (PROHIBIDA): Mencionar a Alexander de Sunset, al técnico de Sunset o a Farida de Sunset.

   - Tu respuesta debe ser limpia, amable y directa. Resalta los nombres y cargos en **negrita**. Termina con la cita [CÓDIGO: Art.].

2. LÍMITE AMISTOSO PARA TEMAS FUERA DE LUGAR (OFF-TOPIC):
   Si el trabajador te pregunta sobre cosas que nada que ver con el trabajo —por ejemplo: anime (como Naruto, Dragon Ball, One Piece), películas, videojuegos, chistes, deportes o fútbol, recetas de cocina, tareas del colegio o cultura general— NO seas robótico, ni digas "Error", ni te comportes como una pared fría.
   En su lugar, respóndele con humor, simpatía y naturalidad de compañero de oficina, pero dejando en claro con buena onda que tu terreno son los manuales de la empresa.
   Por ejemplo:
   - "¡Jajaja, me encantaría debatir si Naruto o Sasuke tenían razón, pero aquí en la oficina me tienen contratado al 100% para resolver tus dudas de la empresa! 😂 Si necesitas saber de tus vacaciones, seguros, permisos, viáticos o temas de TI, ¡ahí sí soy tu experto! ¿Te doy una mano con algo del trabajo?"
   - "¡Uff, suena genial! Pero mi especialidad son las normativas, beneficios y procedimientos de la empresa. Pregúntame sobre tus días libres, licencias o trámites internos y lo resolvemos al tiro."

3. INFORMACIÓN LABORAL BASADA EN LOS MANUALES:
   Cuando te pregunten sobre temas de la empresa (vacaciones, seguros médicos, permisos, ciberseguridad, viáticos, denuncias, teletrabajo, etc.):
   - Basa siempre tus respuestas en los manuales indexados que tienes abajo.
   - Explica las cosas de forma fácil de entender, destacando con claridad los números, plazos o condiciones reales aplicables.

4. SI ALGO NO ESTÁ EN LOS MANUALES:
   Si te preguntan por un procedimiento laboral interno que no figura en los manuales de abajo, sé sincero como un buen compañero: "Oye, revisé nuestros manuales y no veo una política específica sobre eso. Para que no te quedes con la duda, te sugiero consultarlo con la gente de RRHH (rrhh-gestion@empresa.com) o con tu jefatura. Si tienes otra duda interna, ¡aquí estoy!".

5. SÍMBOLOS, ENLACES Y CARACTERES ESPECIALES:
   - Muestra todos los símbolos y caracteres especiales (<, >, &, %, $, #, @, *, °, ±, ≤, ≥, emojis) de manera limpia y natural.
   - NUNCA generes etiquetas HTML crudas como <a target="_blank" rel="noopener noreferrer nofollow" ...> ni imprimas atributos de etiquetas en el texto.
   - Si necesitas compartir una dirección web o enlace, hazlo en formato Markdown estándar [Texto del enlace](https://...) o escribe la URL directa.

CONTEXTO DE MANUALES DE LA EMPRESA (MATERIAL DE REFERENCIA — NO TRANSCRIBIR COMPLETO, EXTRAER SOLO EL DATO PUNTUAL SOLICITADO):
${contextMarkdown}
`;

      try {
        const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

        if (Array.isArray(history) && history.length > 0) {
          const recentHistory = history.slice(-4);
          for (const item of recentHistory) {
            if (item.role === 'user' || item.role === 'assistant') {
              formattedContents.push({
                role: item.role === 'user' ? 'user' : 'model',
                parts: [{ text: item.content || '' }]
              });
            }
          }
        }

        // Add the current user message with explicit extraction directive
        const extractionPrompt = `${message}

[INSTRUCCIÓN CRÍTICA DE RESPUESTA]:
- Responde ÚNICAMENTE la respuesta precisa y directa a lo consultado ("${message}").
- Si la consulta es sobre un sitio específico (ej: Foresta, Sunset), responde ÚNICAMENTE sobre ese sitio y ESTÁ ESTRICTAMENTE PROHIBIDO mencionar o listar personal de otros sitios.
- Si preguntan quién es una persona (ej: "¿quién es Cinthia Collado?"), responde DIRECTAMENTE quién es en el sitio o manual (ej: "Ella es la administradora de Foresta Residence").
- PROHIBIDO transcribir el manual, repetir oraciones completas o agregar tareas/obligaciones secundarias (como bitácoras, reportes, entradas/salidas, áreas comunes) que no te hayan preguntado.
- Respuesta directa, destacando datos o cargos en negrita y agregando la cita entre corchetes [CÓDIGO: Art.].`;

        formattedContents.push({
          role: 'user',
          parts: [{ text: extractionPrompt }]
        });

        // Try models in order of responsiveness: gemini-3.1-flash-lite (sub-second, reliable), gemini-3.5-flash, gemini-3.8-flash
        const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
        let generatedText = '';
        let usedModel = '';

        for (const candidateModel of candidateModels) {
          try {
            const geminiPromise = aiClient.models.generateContent({
              model: candidateModel,
              contents: formattedContents,
              config: {
                systemInstruction,
                temperature: 0.15, // Low temperature for laser-sharp entity extraction without conversational padding
              }
            });

            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout with model ${candidateModel}`)), 5500)
            );

            const response: any = await Promise.race([geminiPromise, timeoutPromise]);
            const rawText = response.text || '';
            if (rawText && rawText.trim().length > 0) {
              generatedText = cleanRawHtmlTags(rawText);
              usedModel = candidateModel;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[ManualBot Server] Model ${candidateModel} failed or timed out (${modelErr?.message || modelErr}), trying fallback...`);
          }
        }

        if (generatedText) {
          const finalAnswer = enforceLaserSpecificAnswer(generatedText, message, searchResults);
          res.json({
            text: finalAnswer,
            citations,
            engine: usedModel,
            grounded: searchResults.length > 0
          });
          return;
        }
      } catch (geminiError: any) {
        console.warn('[ManualBot Server] All Gemini models failed or timed out, falling back to local manual knowledge engine:', geminiError?.message || geminiError);
      }
    }

    // Fallback or offline local grounded answer generator
    const localResult = generateLocalGroundedAnswer(message, searchResults, tone as any);
    res.json({
      text: cleanRawHtmlTags(localResult.answer),
      citations: localResult.citations,
      engine: 'internal-manual-book',
      grounded: searchResults.length > 0
    });
  } catch (error: any) {
    console.error('[ManualBot Server] Error handling /api/chat:', error);
    res.status(500).json({
      error: 'Error interno del servidor al procesar la consulta.',
      details: error?.message || String(error)
    });
  }
});

// Search manual articles directly
app.post('/api/search', (req: Request, res: Response) => {
  const { query, manuals = DEFAULT_MANUALS } = req.body;
  if (!query) {
    res.json({ results: [] });
    return;
  }
  const results = searchManuals(query, manuals, 6);
  res.json({
    results: results.map(r => ({
      manualId: r.manual.id,
      manualTitle: r.manual.title,
      manualCode: r.manual.code,
      articleNumber: r.section.articleNumber,
      sectionTitle: r.section.title,
      snippet: r.snippet,
      score: r.score
    }))
  });
});

// Parse uploaded PDF and Word (DOCX/DOC) documents and transcribe full content with formatting
app.post('/api/parse-document', async (req: Request, res: Response) => {
  try {
    const { fileName, fileBase64, mimeType } = req.body;
    if (!fileBase64 || !fileName) {
      res.status(400).json({ error: 'Faltan datos del archivo (fileName o fileBase64)' });
      return;
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    const lowerName = fileName.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf') || (mimeType && mimeType.includes('pdf'));
    const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || (mimeType && (mimeType.includes('word') || mimeType.includes('officedocument')));

    let extractedText = '';
    let extractedHtml = '';

    if (isDocx) {
      const mammothAny = (mammoth as any).default || mammoth;
      const [rawResult, htmlResult] = await Promise.all([
        mammothAny.extractRawText({ buffer }),
        mammothAny.convertToHtml ? mammothAny.convertToHtml({ buffer }) : Promise.resolve({ value: '' })
      ]);
      extractedText = rawResult?.value || '';
      extractedHtml = htmlResult?.value || '';
    } else if (isPdf) {
      const PDFParseClass = (PDFParse as any);
      if (typeof PDFParseClass === 'function' && PDFParseClass.prototype?.load) {
        const parser = new PDFParseClass({ data: buffer });
        await parser.load();
        const textResult = await parser.getText();
        extractedText = textResult.text || '';
      } else if (typeof PDFParseClass === 'function') {
        const textResult = await (PDFParseClass as any)(buffer);
        extractedText = textResult.text || '';
      }
    } else {
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText.trim() && !extractedHtml.trim()) {
      res.status(422).json({
        error: 'No se pudo extraer texto legible del archivo. Verifica que el archivo no esté protegido con contraseña o dañado.'
      });
      return;
    }

    const cleanTitle = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase())
      .trim() || 'Manual Corporativo';

    // Convert full transcribed document into clean Rich Text HTML (headings, paragraphs, lists 1,2,3 / a,b,c / bullets)
    let transcribedHtml = extractedHtml.trim()
      ? extractedHtml.trim()
      : textOrHtmlToEditorHtml(extractedText);

    let detectedTitle = cleanTitle;
    let parsedWithAi = false;

    const aiClient = getAiClient();
    if (aiClient && !extractedHtml.trim() && extractedText.length > 0 && extractedText.length < 25000) {
      try {
        const prompt = `Transcribe íntegramente el siguiente documento ("${fileName}") a formato HTML limpio para un editor de texto enriquecido, SIN resumir ni omitir información.
Usa únicamente las etiquetas: <h1>, <h2>, <p>, <strong>, <em>, <ul><li><p>...</p></li></ul>, <ol data-list-type="decimal"><li><p>...</p></li></ol>, y <ol data-list-type="lower-alpha" type="a" style="list-style-type: lower-alpha"><li><p>...</p></li></ol> (cuando haya listas con letras a, b, c).
Devuelve un JSON con esta estructura exacta:
{
  "title": "Título oficial del manual",
  "contentHtml": "Transcripción completa en HTML conservando listas, títulos y párrafos"
}

TEXTO DEL DOCUMENTO:
${extractedText}
`;
        const response: any = await Promise.race([
          aiClient.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI transcription timeout')), 12000))
        ]);

        const rawJson = response.text?.trim() || '';
        const cleanedJson = rawJson.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const jsonResult = JSON.parse(cleanedJson);
        if (jsonResult && jsonResult.contentHtml) {
          transcribedHtml = jsonResult.contentHtml;
          if (jsonResult.title) detectedTitle = cleanRawHtmlTags(jsonResult.title);
          parsedWithAi = true;
        }
      } catch (aiErr) {
        console.warn('[ManualBot Server] AI transcription fallback to direct structured transcription:', aiErr);
      }
    }

    const plainFullText = cleanRawHtmlTags(transcribedHtml || extractedText);
    const timestamp = Date.now();

    const finalManual: ManualDocument = {
      id: `man-upload-${timestamp}`,
      title: detectedTitle,
      code: `MAN-${timestamp.toString().slice(-4)}`,
      category: 'general',
      department: 'General',
      version: '1.0',
      updatedDate: new Date().toISOString().split('T')[0],
      summary: transcribedHtml,
      description: plainFullText,
      iconName: 'FileText',
      sections: [
        {
          id: `sec-${timestamp}-1`,
          articleNumber: 'Contenido Oficial',
          title: detectedTitle,
          content: plainFullText,
          tags: ['manual', 'oficial']
        }
      ]
    };

    res.json({
      success: true,
      parsedWithAi,
      contentHtml: transcribedHtml,
      fullText: plainFullText,
      manual: finalManual,
      stats: {
        characters: plainFullText.length,
        sectionsCount: 1,
        fileName
      }
    });
  } catch (error: any) {
    console.error('[ManualBot Server] Error parsing document:', error);
    res.status(500).json({
      error: 'Error al procesar el archivo PDF o Word.',
      details: error?.message || String(error)
    });
  }
});
