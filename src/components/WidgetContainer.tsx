import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, ShieldCheck, BookOpen, ExternalLink, RotateCcw, X, Sparkles } from 'lucide-react';
import { ChatMessage, Citation, ManualDocument, ManualSection } from '../types/manual';
import { ManualDrawer } from './ManualDrawer';

interface WidgetContainerProps {
  companyName: string;
  manuals: ManualDocument[];
  hasGeminiKey: boolean;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  companyName,
  manuals,
  hasGeminiKey
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerManual, setDrawerManual] = useState<ManualDocument | null>(null);
  const [drawerSection, setDrawerSection] = useState<ManualSection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newHistory.slice(-4),
          manuals,
          tone: 'direct',
          companyName
        })
      });
      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'No pude encontrar información para esta consulta.',
        citations: data.citations || [],
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: 'Error al contactar con el asistente. Intenta de nuevo.',
          timestamp: Date.now(),
          error: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCitation = (cit: Citation) => {
    const manual = manuals.find(m => m.id === cit.manualId || m.code === cit.manualCode);
    if (manual) {
      const sec = manual.sections.find(s => s.id === cit.sectionId || s.articleNumber === cit.articleNumber);
      if (sec) {
        setDrawerManual(manual);
        setDrawerSection(sec);
        setDrawerOpen(true);
      }
    }
  };

  return (
    <div className="w-full h-screen max-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-text overflow-hidden">
      {/* Widget Header */}
      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-white">ManualBot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[11px] text-slate-400 block truncate max-w-[190px]">
              {companyName} • Procedimientos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Limpiar conversación"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
        {messages.length === 0 ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">¿En qué procedimiento te ayudo?</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Consulta sobre vacaciones, permisos, ciberseguridad, viáticos y reglamentos de la empresa.
              </p>
            </div>

            {/* Quick Chips */}
            <div className="space-y-1.5 pt-2 text-left">
              {[
                '¿Cómo solicito vacaciones y con cuánta antelación?',
                '¿Qué hago si sospecho de un correo de phishing?',
                '¿Cuáles son los topes de viáticos para viajes?'
              ].map((query, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(query)}
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-left text-[11px] text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                >
                  <span className="line-clamp-1">{query}</span>
                  <Sparkles className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3 rounded-2xl leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs space-y-2'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 pb-1 border-b border-slate-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Book Oficial</span>
                  </div>
                )}

                <div className="whitespace-pre-line text-[11px] sm:text-xs">
                  {msg.content}
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">
                      Cláusulas:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {msg.citations.map((c, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleOpenCitation(c)}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-[10px] text-indigo-300 font-mono flex items-center gap-1"
                        >
                          <span>{c.articleNumber}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>Consultando manuales...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend(inputText);
        }}
        className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 shrink-0"
      >
        <input
          type="text"
          placeholder="Escribe tu consulta..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
          aria-label="Enviar pregunta"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Manual Drawer inside widget */}
      <ManualDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        manual={drawerManual}
        section={drawerSection}
      />
    </div>
  );
};
