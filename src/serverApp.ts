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
  getConversationalResponse
} from './utils/manualSearch.ts';
import { DEFAULT_MANUALS } from './data/defaultManuals.ts';
import { ManualDocument } from './types/manual.ts';
import { cleanRawHtmlTags } from './utils/textFormatting.ts';

dotenv.config();

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
  const company = (script && script.getAttribute('data-company')) || 'Nuestra Empresa';
  const color = (script && script.getAttribute('data-color')) || '#4f46e5';
  const isLeft = (script && script.getAttribute('data-position')) === 'bottom-left';

  // Create launcher container
  const container = document.createElement('div');
  container.id = 'manualbot-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style[isLeft ? 'left' : 'right'] = '20px';
  container.style.zIndex = '999999';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Create iframe popup
  const iframe = document.createElement('iframe');
  iframe.src = appUrl + '/?mode=widget&company=' + encodeURIComponent(company);
  iframe.style.position = 'fixed';
  iframe.style.bottom = '85px';
  iframe.style[isLeft ? 'left' : 'right'] = '20px';
  iframe.style.width = '380px';
  iframe.style.height = '580px';
  iframe.style.maxWidth = 'calc(100vw - 32px)';
  iframe.style.maxHeight = 'calc(100vh - 110px)';
  iframe.style.border = '1px solid rgba(255, 255, 255, 0.15)';
  iframe.style.borderRadius = '18px';
  iframe.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4)';
  iframe.style.display = 'none';
  iframe.style.zIndex = '999999';
  iframe.style.transition = 'all 0.25s ease';
  iframe.title = 'ManualBot - Asistente de Manuales Internos';
  iframe.allow = 'clipboard-write';

  // Create toggle button
  const button = document.createElement('button');
  button.type = 'button';
  button.style.width = '56px';
  button.style.height = '56px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = color;
  button.style.color = '#ffffff';
  button.style.border = 'none';
  button.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.transition = 'transform 0.2s, box-shadow 0.2s';
  button.setAttribute('aria-label', 'Abrir Asistente de Manuales Internos');

  button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  button.onmouseenter = function() { button.style.transform = 'scale(1.06)'; };
  button.onmouseleave = function() { button.style.transform = 'scale(1)'; };

  let isOpen = false;
  button.onclick = function() {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    button.innerHTML = isOpen
      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
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

    // If Gemini client is active, generate response with gemini-3.8-flash
    if (aiClient) {
      const contextMarkdown = buildManualContext(searchResults);

      const systemInstruction = `Eres "ManualBot", el compañero de trabajo y asistente interno de confianza en ${companyName}.
Tu personalidad: Hablas con tus compañeros como un amigo del trabajo: eres cercano, cálido, simpático, empático y con buena onda. NUNCA suenes como un robot frío, una máquina burocrática ni un manual andante aburrido. Usa un español natural y fluido, con expresiones humanas y amables ("¡Hola! Claro que sí, mira...", "Ojo con este detalle...", "Qué buena pregunta, te cuento cómo funciona...", "Cualquier cosita me avisas y lo vemos").

REGLAS ESENCIALES DE CONVERSACIÓN:

1. REGLA DE ORO — EXTRACCIÓN QUIRÚRGICA DE INFORMACIÓN ESPECÍFICA (PROHIBIDO VOLCAR EL MANUAL COMPLETO):
   - Los manuales de la empresa suelen ser largos y contener gran cantidad de información, capítulos, antecedentes y múltiples subtítulos.
   - El usuario habitualmente busca un dato puntual (por ejemplo: un horario, un nombre de responsable, un plazo, un monto, un requisito o un paso específico).
   - ESTÁ ESTRICTAMENTE PROHIBIDO volcar el manual completo, copiar páginas enteras, pegar artículos de principio a fin o incluir subtítulos irrelevantes que el usuario no pidió.
   - Tu labor es actuar como un filtro de alta precisión: extrae y entrega ÚNICAMENTE la respuesta exacta al dato que pidió el usuario:
     * Si pregunta por HORARIOS o TURNOS (ej. "¿cuál es el horario de atención?", "¿a qué hora abre/cierra?", "¿cuándo se atiende?"):
       Indica directamente las horas y días exactos en negrita (ej: "El horario de atención es de **lunes a viernes de 08:30 a 17:30 hrs**"). NUNCA agregues los antecedentes de la empresa, ni otros subtítulos o artículos ajenos.
     * Si pregunta por NOMBRES, ENCARGADOS O CONTACTOS (ej. "¿quién es el encargado?", "nombre del responsable", "¿a quién contacto?"):
       Indica directamente el nombre, cargo o correo de contacto (ej: "El responsable asignado es **Juan Pérez (Jefe de Seguridad)**, contacto: \`jperez@empresa.com\`"). Omite la descripción del departamento o el resto de los procedimientos.
     * Si pregunta por PLAZOS, DÍAS O MONTOS (ej. "¿con cuánta anticipación pido vacaciones?", "¿cuánto es el viático?"):
       Responde directo al grano con la cifra o plazo en negrita (ej: "Debes solicitarlo con **al menos 15 días corridos** de anticipación").
     * Si la pregunta requiere varios pasos puntuales o requisitos específicos, usa una lista breve de 2 o 3 viñetas como máximo.
   - Mantén la respuesta súper breve (1 o 2 oraciones directas y amables).
   - Cita siempre la referencia oficial de forma breve entre corchetes (ej. "[MAN-SEG-01: Art. 1.1]").

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

        // Add the current user message
        formattedContents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        // Try models in order of responsiveness: gemini-3.5-flash, gemini-3.1-flash-lite, gemini-3.8-flash
        const candidateModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
        let generatedText = '';
        let usedModel = '';

        for (const candidateModel of candidateModels) {
          try {
            const geminiPromise = aiClient.models.generateContent({
              model: candidateModel,
              contents: formattedContents,
              config: {
                systemInstruction,
                temperature: 0.25, // Lower temperature to strictly pinpoint requested entities without dumping extra text
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
          res.json({
            text: generatedText,
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

// Parse uploaded PDF and Word (DOCX/DOC) documents
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

    if (isDocx) {
      const mammothAny = (mammoth as any).default || mammoth;
      const result = await mammothAny.extractRawText({ buffer });
      extractedText = result.value || '';
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

    if (!extractedText.trim()) {
      res.status(422).json({
        error: 'No se pudo extraer texto legible del archivo. Verifica que el archivo no esté protegido con contraseña o dañado.'
      });
      return;
    }

    let manualData: {
      title: string;
      category: 'rrhh' | 'seguridad' | 'ti' | 'legal_etica' | 'operaciones' | 'general';
      department: string;
      version: string;
      summary: string;
      sections: Array<{
        articleNumber: string;
        title: string;
        content: string;
        tags: string[];
      }>;
    } | null = null;

    const aiClient = getAiClient();
    let parsedWithAi = false;

    if (aiClient) {
      try {
        const prompt = `Analiza el siguiente texto extraído de un documento oficial de la empresa (PDF o Word) con nombre de archivo "${fileName}".
Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura exacta:
{
  "title": "Título conciso y oficial del manual o procedimiento",
  "category": "rrhh" | "ti" | "seguridad" | "legal_etica" | "operaciones" | "general",
  "department": "Departamento responsable",
  "version": "1.0",
  "summary": "Resumen claro de 2 a 3 oraciones de la política o procedimiento",
  "sections": [
    {
      "articleNumber": "Art. 1" (o número de artículo/sección correlativo),
      "title": "Título breve y descriptivo de la cláusula o procedimiento",
      "content": "Texto detallado con sus reglas o indicaciones",
      "tags": ["etiqueta1", "etiqueta2"]
    }
  ]
}

Si el documento no tiene divisiones explícitas de artículos, organízalo en secciones lógicas y claras (mínimo 2 y máximo 8 secciones).
TEXTO DEL DOCUMENTO:
${extractedText.slice(0, 35000)}
`;

        const response: any = await Promise.race([
          aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI parsing timeout')), 14000))
        ]);

        const rawJson = response.text?.trim() || '';
        const cleanedJson = rawJson.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
        const jsonResult = JSON.parse(cleanedJson);

        if (jsonResult && jsonResult.title && Array.isArray(jsonResult.sections) && jsonResult.sections.length > 0) {
          manualData = jsonResult;
          parsedWithAi = true;
        }
      } catch (aiErr) {
        console.warn('[ManualBot Server] AI document parsing failed or timed out, using heuristic fallback:', aiErr);
      }
    }

    if (!manualData) {
      const cleanTitle = fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (l: string) => l.toUpperCase())
        .trim();

      const lowerText = extractedText.toLowerCase();
      let category: 'rrhh' | 'seguridad' | 'ti' | 'legal_etica' | 'operaciones' | 'general' = 'general';
      let department = 'Dirección General';

      if (lowerText.includes('vacaci') || lowerText.includes('remuneraci') || lowerText.includes('licencia') || lowerText.includes('empleado') || lowerText.includes('beneficio') || lowerText.includes('rrhh')) {
        category = 'rrhh';
        department = 'Recursos Humanos & Gestión de Talento';
      } else if (lowerText.includes('ciberseguridad') || lowerText.includes('contraseña') || lowerText.includes('vpn') || lowerText.includes('software') || lowerText.includes('antivirus') || lowerText.includes('red')) {
        category = 'ti';
        department = 'Tecnología e Información (TI)';
      } else if (lowerText.includes('accidente') || lowerText.includes('evacuaci') || lowerText.includes('epp') || lowerText.includes('extintor') || lowerText.includes('sst') || lowerText.includes('seguridad')) {
        category = 'seguridad';
        department = 'Prevención de Riesgos y Seguridad';
      } else if (lowerText.includes('etica') || lowerText.includes('conducta') || lowerText.includes('confidencial') || lowerText.includes('denuncia') || lowerText.includes('anticorrupci')) {
        category = 'legal_etica';
        department = 'Legal y Cumplimiento Normativo';
      } else if (lowerText.includes('viatico') || lowerText.includes('reembolso') || lowerText.includes('gasto') || lowerText.includes('proveedor') || lowerText.includes('compra')) {
        category = 'operaciones';
        department = 'Administración y Finanzas';
      }

      const articleRegex = /(?:^|\n)(?:Artículo|Art\.|Capítulo|Cap\.|Sección|Sec\.|Cláusula)\s*([0-9A-Za-z\.\-]+)[\.:\- ]*(.*?)(?=\n(?:Artículo|Art\.|Capítulo|Cap\.|Sección|Sec\.|Cláusula)\s*[0-9A-Za-z\.\-]+|\n\n\n|$)/gis;
      const sections: Array<{ articleNumber: string; title: string; content: string; tags: string[] }> = [];

      let match;
      let count = 0;
      while ((match = articleRegex.exec(extractedText)) !== null && count < 20) {
        count++;
        const artNum = `Art. ${match[1].trim()}`;
        const header = match[2]?.trim() || `Artículo ${match[1]}`;
        const headerLines = header.split('\n');
        const artTitle = (headerLines[0] || `Disposición ${count}`).slice(0, 80).trim();
        const content = (headerLines.slice(1).join('\n') || match[0]).trim();
        if (content.length > 10) {
          sections.push({
            articleNumber: artNum,
            title: artTitle || `Norma ${count}`,
            content: content.slice(0, 3000),
            tags: [category, 'documento']
          });
        }
      }

      if (sections.length === 0) {
        const paragraphs = extractedText
          .split(/\n\s*\n/)
          .map(p => p.trim())
          .filter(p => p.length > 40);

        if (paragraphs.length > 0) {
          const chunkSize = Math.max(1, Math.ceil(paragraphs.length / 5));
          for (let i = 0; i < paragraphs.length && sections.length < 6; i += chunkSize) {
            const chunk = paragraphs.slice(i, i + chunkSize).join('\n\n');
            const lines = chunk.split('\n');
            const firstLine = lines[0].replace(/^[#\*\-0-9\.\s]+/, '').trim().slice(0, 70);
            sections.push({
              articleNumber: `Art. ${sections.length + 1}`,
              title: firstLine || `Sección ${sections.length + 1}`,
              content: chunk.slice(0, 3000),
              tags: [category, 'oficial']
            });
          }
        } else {
          sections.push({
            articleNumber: 'Art. 1',
            title: 'Contenido General del Documento',
            content: extractedText.slice(0, 3000),
            tags: [category]
          });
        }
      }

      const cleanSummary = extractedText
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 280) + '...';

      manualData = {
        title: cleanTitle || 'Manual Corporativo',
        category,
        department,
        version: '1.0',
        summary: cleanSummary,
        sections
      };
    }

    const codePrefix = {
      rrhh: 'RRHH',
      ti: 'TI',
      seguridad: 'SST',
      legal_etica: 'ETICA',
      operaciones: 'OPER',
      general: 'GEN'
    }[manualData.category] || 'MAN';

    const timestamp = Date.now();
    const finalManual: ManualDocument = {
      id: `man-upload-${timestamp}`,
      title: cleanRawHtmlTags(manualData.title),
      code: `MAN-${codePrefix}-${timestamp.toString().slice(-4)}`,
      category: manualData.category,
      department: manualData.department,
      version: manualData.version || '1.0',
      updatedDate: new Date().toISOString().split('T')[0],
      summary: cleanRawHtmlTags(manualData.summary),
      description: cleanRawHtmlTags(manualData.summary),
      iconName: 'FileText',
      sections: manualData.sections.map((sec, idx) => ({
        id: `sec-${timestamp}-${idx + 1}`,
        articleNumber: sec.articleNumber || `Art. ${idx + 1}`,
        title: cleanRawHtmlTags(sec.title || `Sección ${idx + 1}`),
        content: cleanRawHtmlTags(sec.content || 'Sin detalles adicionales.'),
        tags: Array.isArray(sec.tags) && sec.tags.length > 0 ? sec.tags : [manualData!.category]
      }))
    };

    res.json({
      success: true,
      parsedWithAi,
      manual: finalManual,
      stats: {
        characters: extractedText.length,
        sectionsCount: finalManual.sections.length,
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
