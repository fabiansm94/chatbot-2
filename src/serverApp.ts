import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
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

dotenv.config();

export const app = express();

app.use(express.json({ limit: '10mb' }));

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
    model: 'gemini-3.8-flash',
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

1. LÍMITE AMISTOSO PARA TEMAS FUERA DE LUGAR (OFF-TOPIC):
   Si el trabajador te pregunta sobre cosas que nada que ver con el trabajo —por ejemplo: anime (como Naruto, Dragon Ball, One Piece), películas, videojuegos, chistes, deportes o fútbol, recetas de cocina, tareas del colegio o cultura general— NO seas robótico, ni digas "Error", ni te comportes como una pared fría.
   En su lugar, respóndele con humor, simpatía y naturalidad de compañero de oficina, pero dejando en claro con buena onda que tu terreno son los manuales de la empresa.
   Por ejemplo:
   - "¡Jajaja, me encantaría debatir si Naruto o Sasuke tenían razón, pero aquí en la oficina me tienen contratado al 100% para resolver tus dudas de la empresa! 😂 Si necesitas saber de tus vacaciones, seguros, permisos, viáticos o temas de TI, ¡ahí sí soy tu experto! ¿Te doy una mano con algo del trabajo?"
   - "¡Uff, suena genial! Pero mi especialidad son las normativas, beneficios y procedimientos de la empresa. Pregúntame sobre tus días libres, licencias o trámites internos y lo resolvemos al tiro."

2. INFORMACIÓN LABORAL BASADA EN LOS MANUALES:
   Cuando te pregunten sobre temas de la empresa (vacaciones, seguros médicos, permisos, ciberseguridad, viáticos, denuncias, teletrabajo, etc.):
   - Basa siempre tus respuestas en los manuales indexados que tienes abajo.
   - Explica las cosas de forma fácil de entender, destacando los números y plazos reales (ej. 22 días hábiles, 15 días de anticipación, contraseñas de 14 caracteres, etc.).
   - Cita de forma natural el manual o artículo oficial respectivo, por ejemplo: "[MAN-RRHH-01: Art. 4.1]".

3. SI ALGO NO ESTÁ EN LOS MANUALES:
   Si te preguntan por un procedimiento laboral interno que no figura en los manuales de abajo, sé sincero como un buen compañero: "Oye, revisé nuestros manuales y no veo una política específica sobre eso. Para que no te quedes con la duda, te sugiero consultarlo con la gente de RRHH (rrhh-gestion@empresa.com) o con tu jefatura. Si tienes otra duda interna, ¡aquí estoy!".

CONTEXTO DE MANUALES DE LA EMPRESA:
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

        // Call Gemini with friendly temperature and factual grounding
        const geminiPromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.45, // Balanced for friendly, natural coworker conversation while preserving facts
          }
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API request timed out')), 14000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const generatedText = response.text || '';

        res.json({
          text: generatedText,
          citations,
          engine: 'gemini-3.8-flash',
          grounded: searchResults.length > 0
        });
        return;
      } catch (geminiError: any) {
        console.warn('[ManualBot Server] Gemini API error, falling back to local manual knowledge engine:', geminiError?.message || geminiError);
      }
    }

    // Fallback or offline local grounded answer generator
    const localResult = generateLocalGroundedAnswer(message, searchResults, tone as any);
    res.json({
      text: localResult.answer,
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
