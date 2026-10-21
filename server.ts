import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  searchManuals,
  buildManualContext,
  extractCitations,
  generateLocalGroundedAnswer
} from './src/utils/manualSearch.ts';
import { DEFAULT_MANUALS } from './src/data/defaultManuals.ts';
import { ManualDocument } from './src/types/manual.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for embedding into external company websites / intranets
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
let aiClient: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[ManualBot Server] Gemini AI client initialized successfully.');
  } catch (err) {
    console.error('[ManualBot Server] Failed to initialize GoogleGenAI:', err);
  }
} else {
  console.log('[ManualBot Server] GEMINI_API_KEY not configured or using default placeholder. Running in integrated knowledge-base mode.');
}

// System status endpoint
app.get('/api/status', (req: Request, res: Response) => {
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

    // Search manuals for relevant context
    const searchResults = searchManuals(message, manualList, 4);
    const citations = extractCitations(searchResults);

    // If Gemini client is active, generate response with gemini-3.8-flash
    if (aiClient) {
      const contextMarkdown = buildManualContext(searchResults);

      const toneGuidance =
        tone === 'steps'
          ? 'Estructura la respuesta en un checklist o guía paso a paso numerada para que el trabajador sepa exactamente qué hacer.'
          : tone === 'detailed'
          ? 'Ofrece una explicación completa y detallada, desglosando la normativa, requisitos, excepciones y plazos.'
          : 'Sé directo, conciso y claro, respondiendo de inmediato a la duda esencial del trabajador.';

      const systemInstruction = `Eres "ManualBot", el Asistente Inteligente de Manuales y Políticas Internas de ${companyName}.
Tu objetivo es orientar y responder con precisión las dudas de los empleados y trabajadores basándote en el "Book de Manuales Corporativos" de la empresa.

DIRECTRICES CLAVE:
1. Basamento Normativo: Basa tus respuestas en el contenido de los manuales proporcionados en el contexto siguiente.
2. Citas Exactas: Cada vez que menciones una política, cita explícitamente el código del manual y artículo, por ejemplo: "[MAN-RRHH-01: Art. 4.1]".
3. ${toneGuidance}
4. Vacíos de Información: Si la pregunta del empleado no está contemplada en ningún manual o artículo del contexto disponible, indícalo de forma transparente y sugiere acudir al departamento responsable (ej. RRHH en rrhh-gestion@empresa.com, Soporte TI, Prevención SST o Finanzas).
5. Tono: Cercano, empático, profesional y resolutivo en idioma español.

CONTEXTO DE MANUALES INDEXADOS RELEVANTES:
${contextMarkdown}
`;

      try {
        // Construct chat contents including limited prior history for conversational continuity
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

        // Call Gemini with timeout race to avoid hanging requests
        const geminiPromise = aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.2, // Low temperature for high factual precision to manual contents
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
        // Fallback to local grounded knowledge engine below
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

// Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ManualBot Server] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[ManualBot Server] Failed to start server:', err);
});
