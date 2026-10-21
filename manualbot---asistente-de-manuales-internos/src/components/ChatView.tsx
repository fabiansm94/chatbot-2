import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';
import { ChatMessage, Citation, ManualDocument, ManualSection } from '../types/manual';

interface ChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, tone: 'direct' | 'detailed' | 'steps') => void;
  onClearChat: () => void;
  onOpenCitation: (citation: Citation) => void;
  companyName: string;
  hasGeminiKey: boolean;
  manuals: ManualDocument[];
  onOpenProposeModal?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  onOpenCitation,
  companyName,
  hasGeminiKey,
  manuals,
  onOpenProposeModal
}) => {
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState<'direct' | 'detailed' | 'steps'>('direct');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text, tone);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackState(prev => ({ ...prev, [id]: type }));
  };

  const quickPrompts = [
    {
      category: 'RRHH',
      query: '¿Cuántos días de vacaciones me corresponden y con cuánta antelación debo solicitarlas?',
      tag: 'Vacaciones'
    },
    {
      category: 'TI',
      query: '¿Qué procedimiento debo seguir si sospecho de un correo de phishing o hago clic por error?',
      tag: 'Phishing y Ciberseguridad'
    },
    {
      category: 'Finanzas',
      query: '¿Cuáles son los topes de viáticos diarios para viajes de trabajo y el plazo de rendición?',
      tag: 'Viáticos'
    },
    {
      category: 'SST',
      query: '¿Cómo reporto un accidente laboral o in itinere y qué formulario debo llenar?',
      tag: 'Accidente de Trabajo'
    },
    {
      category: 'Ética',
      query: '¿Cuál es el valor máximo permitido para aceptar un regalo de un proveedor?',
      tag: 'Regalos y Cortesías'
    },
    {
      category: 'Beneficios',
      query: '¿Qué cubre el seguro de salud complementario y cómo se incluye a familiares?',
      tag: 'Seguro Médico'
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 w-full">
      {/* Top Banner & Tone Control */}
      <div className="py-3 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Estilo de respuesta:</span>
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setTone('direct')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                tone === 'direct'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Directo & Ágil
            </button>
            <button
              type="button"
              onClick={() => setTone('steps')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                tone === 'steps'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Paso a Paso
            </button>
            <button
              type="button"
              onClick={() => setTone('detailed')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                tone === 'detailed'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Normativa Detallada
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenProposeModal && (
            <button
              type="button"
              onClick={onOpenProposeModal}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-900/50 hover:bg-indigo-900/40 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enseñar al Bot</span>
            </button>
          )}

          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-900"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
            {/* Welcome Greeting */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-0.5 mx-auto shadow-xl shadow-indigo-600/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Bot className="w-8 h-8 text-indigo-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                ¡Hola! Soy tu Asistente de Manuales Internos
              </h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                Tengo indexado el <strong>Book Oficial de {companyName}</strong> (RRHH, Ciberseguridad, SST, Código de Ética y Operaciones). Pregúntame sobre cualquier duda laboral o procedimiento.
              </p>
            </div>

            {/* Quick Questions Grid */}
            <div className="space-y-3 pt-2 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Preguntas Frecuentes de Trabajadores:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(item.query, tone)}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {item.category}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <span className="text-xs text-slate-200 group-hover:text-white font-medium line-clamp-2">
                      {item.query}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div
                className={`relative max-w-2xl rounded-2xl p-4 sm:p-5 space-y-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Header tag for bot message */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] font-medium text-slate-400">
                        Fundamentado en el Book de la Empresa
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Copiar respuesta"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Content with structured rendering */}
                <div className="whitespace-pre-line select-text">
                  {msg.content}
                </div>

                {/* Citations Cards / Badges */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-indigo-400" />
                      <span>Artículos de Referencia Citados:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((cit, idx) => (
                        <button
                          key={idx}
                          onClick={() => onOpenCitation(cit)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 text-xs text-slate-300 hover:text-indigo-200 transition-all text-left group"
                          title="Clic para ver artículo completo en el manual"
                        >
                          <span className="font-mono font-bold text-indigo-400">
                            {cit.articleNumber}
                          </span>
                          <span className="text-slate-400 max-w-[150px] sm:max-w-xs truncate">
                            {cit.sectionTitle}
                          </span>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistant footer with helpfulness feedback */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>¿Fue útil?</span>
                      <button
                        onClick={() => handleFeedback(msg.id, 'up')}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          feedbackState[msg.id] === 'up' ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, 'down')}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                          feedbackState[msg.id] === 'down' ? 'text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-md shadow-indigo-600/30">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Consultando el Book de manuales internos...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="py-3 sm:py-4 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <input
            type="text"
            placeholder="Pregunta sobre vacaciones, ciberseguridad, permisos..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isLoading}
            className="w-full pl-3.5 pr-22 sm:pr-24 py-3 sm:py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-1.5 sm:right-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all flex items-center gap-1.5"
          >
            <span className="hidden xs:inline">Preguntar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 sm:mt-2 px-1">
          <span className="truncate">Respuestas vinculadas al Book corporativo</span>
          <span className="shrink-0">{inputText.length}/500</span>
        </div>
      </div>
    </div>
  );
};
