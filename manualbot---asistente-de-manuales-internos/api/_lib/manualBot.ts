import { GoogleGenAI } from '@google/genai';
import {
  searchManuals,
  buildManualContext,
  extractCitations,
  generateLocalGroundedAnswer
} from '../../src/utils/manualSearch';
import { DEFAULT_MANUALS } from '../../src/data/defaultManuals';
import type { ManualDocument } from '../../src/types/manual';

export const GEMINI_MODEL = 'gemini-3.8-flash';

let aiClient: GoogleGenAI | null = null;
let clientResolved = false;

export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !!(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
}

export function getAiClient(): GoogleGenAI | null {
  if (clientResolved) return aiClient;
  clientResolved = true;

  if (!isGeminiConfigured()) {
    console.log('[ManualBot] GEMINI_API_KEY not configured. Running in internal knowledge-base mode.');
    return aiClient;
  }

  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY as string,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('[ManualBot] Gemini AI client initialized successfully.');
  } catch (err) {
    console.error('[ManualBot] Failed to initialize GoogleGenAI:', err);
    aiClient = null;
  }

  return aiClient;
}

export interface ChatPayload {
  message?: string;
  history?: Array<{ role?: string; content?: string }>;
  manuals?: ManualDocument[];
  tone?: 'direct' | 'detailed' | 'steps' | string;
  companyName?: string;
}

export interface ChatResponse {
  status: number;
  body: Record<string, unknown>;
}

export function buildStatusPayload() {
  return {
    status: 'online',
    hasGeminiKey: isGeminiConfigured(),
    model: GEMINI_MODEL,
    defaultManualsCount: DEFAULT_MANUALS.length,
    timestamp: new Date().toISOString()
  };
}

export function handleSearchRequest(payload: { query?: string; manuals?: ManualDocument[] }) {
  const query = payload.query;
  if (!query) {
    return { status: 200, body: { results: [] } };
  }

  const results = searchManuals(query, payload.manuals || DEFAULT_MANUALS, 6);
  return {
    status: 200,
    body: {
      results: results.map(r => ({
        manualId: r.manual.id,
        manualTitle: r.manual.title,
        manualCode: r.manual.code,
        articleNumber: r.section.articleNumber,
        sectionTitle: r.section.title,
        snippet: r.snippet,
        score: r.score
      }))
    }
  };
}

export async function handleChatRequest(payload: ChatPayload): Promise<ChatResponse> {
  try {
    const {
      message,
      history = [],
      manuals = DEFAULT_MANUALS,
      tone = 'direct',
      companyName = 'Nuestra Empresa'
    } = payload;

    if (!message || typeof message !== 'string') {
      return { status: 400, body: { error: 'El campo "message" es obligatorio.' } };
    }

    const manualList: ManualDocument[] = Array.isArray(manuals) && manuals.length > 0 ? manuals : DEFAULT_MANUALS;

    const searchResults = searchManuals(message, manualList, 4);
    const citations = extractCitations(searchResults);

    const client = getAiClient();

    if (client) {
      const contextMarkdown = buildManualContext(searchResults);

      const toneGuidance =
        tone === 'steps'
          ? 'Estructura la respuesta en un checklist o guía paso a paso numerada para que el trabajador sepa exactamente qué hacer.'
          : tone === 'detailed'
          ? 'Ofrece una explicación completa y detallada, desglosando la normativa, requisitos, excepciones y plazos.'
          : 'Sé directo, conciso y claro, respondiendo de inmediato a la duda esencial del trabajador.';

      const systemInstruction = `Eres "ManualBot", el Asistente Inteligente de Manuales y Políticas Internas de ${companyName}.

OBJETIVO:
Orientar a los empleados resolviendo dudas ÚNICAMENTE con base en el "Book de Manuales Corporativos" que te ha sido proporcionado.

PERSONALIDAD Y TONO:
- Habla de forma natural, cercana y humana. Usa español coloquial pero profesional.
- Si el usuario solo saluda (hola, buenos días, qué tal), saluda brevemente de vuelta y pregúntale qué duda sobre manuales o procedimientos quiere resolver. No entables una charla general.
- Usa frases cortas cuando sea posible. Evita sonar robótico o leer un reglamento completo si con lo esencial basta.
- Sé empático, resolutivo y directo.
- ${toneGuidance}

ALCANCE ESTRICTO:
- SOLO puedes responder sobre temas relacionados con los manuales: RRHH, vacaciones/permisos/beneficios, TI/ciberseguridad, SST/accidentes/evacuación, Código de Ética/cumplimiento, gastos/viajes/compras u otros procedimientos internos.
- NO respondas sobre clima, hora en otros países, recetas, chistes, noticias, deportes, IA general, cálculos ajenos a los manuales o cualquier tema fuera del ámbito laboral/interno.
- Si la pregunta está fuera de tu alcance, responde amablemente SIN contestar lo que te piden: "Solo puedo ayudarte con dudas sobre los manuales y procedimientos internos de ${companyName}. ¿Tienes alguna consulta relacionada con ellos?"
- Nunca inventes artículos, plazos o montos que no estén en el contexto.

REGLAS DE RESPUESTA:
1. Basamento Normativo: Basa TODA tu respuesta exclusivamente en el contexto de manuales que te proporciono.
2. Citas Exactas: Siempre que cites una norma, procedimiento o política, usa el formato "[MAN-XX-XX: Art. X.X]".
3. Contexto suficiente: Si hay información relevante en los manuales, intégrala de forma natural (no copies y pegues todo el artículo).
4. Vacíos de Información: Si la duda SÍ es sobre un tema propio de los manuales pero NO hay nada en el contexto indexado, indícalo con claridad y sugiere acudir al departamento responsable (RRHH, TI, SST, Compliance/Ética o Finanzas) con su canal correspondiente.
5. Mantén el enfoque: No divagues. Si te sacan del tema, redirige suavemente al ámbito de los manuales.

CONTEXTO DE MANUALES INDEXADOS RELEVANTES:
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

        formattedContents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const geminiPromise = client.models.generateContent({
          model: GEMINI_MODEL,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.2,
          }
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API request timed out')), 14000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);
        const generatedText = response.text || '';

        return {
          status: 200,
          body: {
            text: generatedText,
            citations,
            engine: GEMINI_MODEL,
            grounded: searchResults.length > 0,
          },
        };
      } catch (geminiError: any) {
        console.warn('[ManualBot] Gemini API error, falling back to local manual knowledge engine:', geminiError?.message || geminiError);
      }
    }

    const localResult = generateLocalGroundedAnswer(message, searchResults, tone as any);
    return {
      status: 200,
      body: {
        text: localResult.answer,
        citations: localResult.citations,
        engine: 'internal-manual-book',
        grounded: searchResults.length > 0,
      },
    };
  } catch (error: any) {
    console.error('[ManualBot] Error handling chat request:', error);
    return {
      status: 500,
      body: {
        error: 'Error interno del servidor al procesar la consulta.',
        details: error?.message || String(error),
      },
    };
  }
}
