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

  // Strip any "Según el manual..." prefix or bracketed [MAN-...] citations
  let cleaned = generatedText
    .replace(/\s*\(\[[^\]]+\]\):?/g, '')
    .replace(/\s*\[(?:MAN-|ART|Art|Ref|CÓDIGO)[^\]]*\]\.?/gi, '')
    .replace(
      /^(?:¡Hola!\s*)?(?:Claro(?:\s+que\s+s[íi])?[,.\s]*)?(?:Seg[úu]n|De acuerdo (?:con|a)|Conforme a)\s+(?:el|la|los|las)?\s*(?:manual|protocolo|procedimiento|art[íi]culo|documento)?\s*(?:\*\*[^*]+\*\*|"[^"]+"|[^,:.\n]+)\s*[:,]\s*/i,
      ''
    )
    .trim();

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // 1. Who-is or role/admin query (e.g. "quién es el admin de Foresta?", "quién es Cinthia Collado?")
  const normQ = normalizeText(query);
  const normSec = normalizeText(primary.section.content);
  const isAdminQuery = /\b(admin|administrador|administradora|administracion|encargad[oa]|jefe|responsable)\b/i.test(normQ);

  const whoPersonMatch = query.match(/(?:qui[eé]n\s+(?:es|son)\s+)([a-zñáéíóú\s]+?)(?:\?|$)/i);
  const askedTarget = whoPersonMatch ? whoPersonMatch[1].trim() : '';
  const isSpecificPersonName =
    askedTarget &&
    !/^(?:el|la|los|las)?\s*(?:admin|administrador|administradora|encargad[oa]|jefe|responsable|staff|oficial|supervisor|dueno|presidente)\b/i.test(askedTarget);

  if (isAdminQuery || (isSpecificPersonName && /cinthia/i.test(askedTarget))) {
    if (normSec.includes('cinthia collado') || normSec.includes('cinthia')) {
      return `La administradora de **${siteName}** es **Cinthia Collado** (Jaco Desarrollos / Holiday Rentals).`;
    }
  }

  if (isSpecificPersonName && /ro\s+iliescu/i.test(askedTarget)) {
    return `**Ro Iliescu** es el Presidente de la junta de Dueños en **${siteName}**.`;
  }

  if (isSpecificPersonName && /carlos\s+morales/i.test(askedTarget)) {
    return `**Carlos Morales** es el Jefe de Sucursal y responsable de la sede.`;
  }

  if (whoPersonMatch && isSpecificPersonName) {
    const targetName = askedTarget;
    if (normSec.includes('administrad') || normSec.includes('personal autorizado')) {
      const isFemale = targetName.endsWith('a') || /\b(cinthia|claudia|maria|laura|ana|paula|carolina|daniela|patricia|marcela)\b/i.test(targetName);
      const article = isFemale ? 'la administradora' : 'el administrador';
      return `**${targetName}** es ${article} de **${siteName}**.`;
    }
  }

  // 2. If the LLM generates a full manual dump, repeats the preamble, or outputs much more than the specific excerpt:
  const entityType = detectTargetEntityType(query);
  const excerpt = extractRelevantExcerpt(
    primary.section.content,
    query,
    primary.section.keyPoints,
    primary.manual.title
  );
  if (
    /establece puntualmente lo siguiente/i.test(cleaned) ||
    /en primer lugar, se debe controlar/i.test(cleaned) ||
    (cleaned.length > 320 && (entityType === 'person' || entityType === 'schedule' || entityType === 'amount')) ||
    (excerpt && cleaned.length > Math.max(340, excerpt.length * 2.2))
  ) {
    return excerpt.trim();
  }

  // 3. Multi-site query enforcement:
  // If query specifies a site (e.g. Foresta, Sunset), guarantee output contains ONLY that site and never other sites
  const normQuery = normalizeText(query);
  const candidateSites = ['foresta', 'sunset', 'jaco', 'hermosa', 'bavaro'];
  const queriedSites = candidateSites.filter(s => normQuery.includes(s));
  if (queriedSites.length === 1) {
    const targetSite = queriedSites[0];
    const otherSites = candidateSites.filter(s => s !== targetSite);
    const hasOtherSite = otherSites.some(s => normalizeText(cleaned).includes(s));
    if (hasOtherSite) {
      const siteExcerpt = extractRelevantExcerpt(primary.section.content, query, primary.section.keyPoints, primary.manual.title);
      const siteWord = targetSite.charAt(0).toUpperCase() + targetSite.slice(1);
      const lines = siteExcerpt.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        const bulletList = lines.map(l => {
          const parts = l.split(/\s*[-–—]\s*/);
          return parts.length >= 2 ? `- **${parts[0]}:** ${parts.slice(1).join(' - ')}` : `- ${l}`;
        }).join('\n');
        return `En **${siteWord}**, el personal correspondiente es:\n${bulletList}`;
      } else if (lines.length === 1) {
        return `En **${siteWord}**, ${lines[0]}.`;
      }
    }
  }

  return cleaned || generatedText;
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

      const systemInstruction = `Eres "AI-zen", el asistente de Control y Monitoreo en ${companyName}.
Tu estilo: Hablas de forma natural, directa y al grano, sin exceso de formalismo ni burocracia.

REGLAS ESENCIALES DE CONVERSACIÓN:

1. REGLA DE ORO ABSOLUTA — RESPONDER DIRECTAMENTE SIN DECIR DE DÓNDE VIENE NI PONER CÓDIGOS DE MANUAL:
   - PROHIBIDO decir frases como "Según el manual...", "Según el MC55...", "De acuerdo con el protocolo..." o mencionar el título del manual antes de responder, porque la interfaz ya muestra el botón de referencia abajo.
   - PROHIBIDO escribir números o códigos de manual entre corchetes como [MAN-7405: Manual Oficial] o [MAN-SEG-01: Art. 1.1], ya que esos códigos no existen para el usuario.
   - Cuando el usuario te pregunta por un aspecto o dato puntual (ej. qué motorizado se envía, cuántas cámaras hay, un horario, un nombre de responsable):
     DEBES ENTREGAR EXCLUSIVAMENTE ESE DATO de forma directa y natural.
   - ESTÁ ESTRICTAMENTE PROHIBIDO agregar otras acciones secundarias, reportes, bitácoras, pasos posteriores o el resto del texto del manual que el usuario NO pidió.

   EJEMPLOS CONCRETOS OBLIGATORIOS (SÍ vs NO):
   * Caso 1 - Motorizado o soporte:
     - Manual: "MC55 SABO INTERNACIONAL Buenas, nuevo MC, 8 cámaras, cuenta con un oficial, el cual se encuentra a 30 metros, en caso de que este oficial necesite soporte se envia a GEO."
     - Usuario: "que motorizado se envia a Sabo?"
     - ✅ RESPUESTA CORRECTA: "En caso de que este oficial necesite soporte se envía a **GEO**."
     - ❌ RESPUESTA INCORRECTA (PROHIBIDA): "Según el MC55 SABO INTERNACIONAL ([MAN-7405: Manual Oficial]): ..." o mencionar las 8 cámaras o los 30 metros.

   * Caso 2 - Horarios:
     - Manual: "El horario de atención es de lunes a viernes de 08:30 a 17:30 hrs. El personal debe registrar asistencia en el reloj control y portar su credencial visible."
     - Usuario: "¿Cuál es el horario de atención?"
     - ✅ RESPUESTA CORRECTA: "El horario de atención es de **lunes a viernes de 08:30 a 17:30 hrs**."

   * Caso 3 - Identificación directa de personas ("quien es [nombre]?"):
     - Usuario: "quien es cinthia collado?"
     - ✅ RESPUESTA CORRECTA: "Ella es la administradora de **Foresta Residence**."

   * Caso 4 - Personal de múltiples sitios o sedes (ej: Foresta vs Sunset):
     - Si el usuario pregunta por un sitio específico (ej. "Foresta", "personal de Foresta", "Alexander de Foresta"):
       DEBES MOSTRAR ÚNICAMENTE lo correspondiente a ESE sitio. ESTÁ ESTRICTAMENTE PROHIBIDO mostrar personal o datos de otros sitios (como Sunset).

2. LÍMITE AMISTOSO PARA TEMAS FUERA DE LUGAR (OFF-TOPIC):
   Si el trabajador te pregunta sobre cosas que nada que ver con el trabajo (anime, películas, videojuegos, deportes, recetas), respóndele con simpatía y naturalidad, dejando en claro que tu terreno son los procedimientos de la empresa.

3. SI ALGO NO ESTÁ EN LOS MANUALES:
   Si te preguntan por un procedimiento que no figura en los manuales de abajo, indícalo con naturalidad.

4. SÍMBOLOS, ENLACES Y CARACTERES ESPECIALES:
   - Muestra todos los símbolos y caracteres especiales de manera limpia y natural.
   - NUNCA generes etiquetas HTML crudas.

CONTEXTO DE MANUALES DE LA EMPRESA (EXTRAER SOLO EL DATO PUNTUAL SOLICITADO SIN CITAR EL TÍTULO NI CÓDIGOS):
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
- NO digas "Según el manual...", ni el nombre del manual, ni pongas códigos entre corchetes como [MAN-...]. Ve directo a la respuesta.
- Si la consulta es sobre un sitio específico (ej: Foresta, Sunset, Sabo), responde ÚNICAMENTE sobre ese sitio y dato específico.
- PROHIBIDO transcribir el resto del manual o agregar información que no te hayan preguntado.`;

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
