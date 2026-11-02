import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Smile,
  RotateCcw,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  CheckCheck,
  ShieldCheck,
  MoreVertical,
  LogOut,
  Calendar,
  Users,
  Shield,
  HelpCircle,
  Lock
} from 'lucide-react';
import { ChatMessage, Citation, ManualDocument, ManualSection, UserChatThread } from '../types/manual';
import { FormattedContent } from './FormattedContent';
import { RobotMascot } from './RobotMascot';

interface ChatViewProps {
  threads: UserChatThread[];
  activeThreadId: string;
  onSelectThread: (threadId: string) => void;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onOpenCitation: (citation: Citation) => void;
  companyName: string;
  hasGeminiKey: boolean;
  manuals: ManualDocument[];
  onOpenProposeModal?: () => void;
  onOpenSection?: (section: ManualSection, manual: ManualDocument) => void;
  loggedUserName?: string;
  onLogout?: () => void;
  viewMode?: 'web' | 'phone';
  allowModeToggle?: boolean;
}

const QUICK_ACTIONS = [
  {
    id: 'schedules',
    icon: Calendar,
    title: 'Horarios y Turnos',
    query: '¿Cuáles son los horarios de atención y turnos del personal?'
  },
  {
    id: 'personnel',
    icon: Users,
    title: 'Personal y Sedes',
    query: '¿Quiénes están asignados en Foresta y Sunset?'
  },
  {
    id: 'manuals',
    icon: Shield,
    title: 'Manuales Oficiales',
    query: '¿Cuáles son los manuales y procedimientos principales de seguridad?'
  },
  {
    id: 'question',
    icon: HelpCircle,
    title: 'Hacer Pregunta',
    query: ''
  }
];


export const ChatView: React.FC<ChatViewProps> = ({
  threads,
  activeThreadId,
  isLoading,
  onSendMessage,
  onClearChat,
  onOpenCitation,
  loggedUserName,
  onLogout,
  viewMode = 'web',
  allowModeToggle = true
}) => {
  const [currentMode, setCurrentMode] = useState<'web' | 'phone'>(viewMode);
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if prop changes externally
  useEffect(() => {
    if (viewMode) setCurrentMode(viewMode);
  }, [viewMode]);

  const activeThread =
    threads.find(t => t.userId === activeThreadId) ||
    threads.find(t => t.isCurrentUser) ||
    threads[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackState(prev => ({
      ...prev,
      [id]: prev[id] === type ? undefined! : type
    }));
  };

  const handleQuickAction = (query: string) => {
    if (query) {
      onSendMessage(query);
    } else {
      inputRef.current?.focus();
    }
  };

  const isEmbed =
    !allowModeToggle ||
    (typeof window !== 'undefined' &&
      (window.location.search.includes('mode=widget') ||
       window.location.search.includes('embed') ||
       window.self !== window.top));

  const isPhone = isEmbed || currentMode === 'phone';

  return (
    <div
      className={`w-full h-full flex flex-col overflow-hidden transition-all duration-200 select-none ${
        isPhone
          ? isEmbed
            ? 'w-full h-full bg-[#fff8f8]'
            : 'max-w-[420px] mx-auto rounded-[32px] sm:rounded-[38px] shadow-2xl border border-rose-200/70 bg-[#fff8f8]'
          : 'flex-1 rounded-[24px] shadow-xl border border-rose-200/50 bg-[#fff8f8]'
      }`}
    >
      {/* =========================================================================
          HEADER: Mascot, Title, User & Options (Clean layout matching reference)
          ========================================================================= */}
      <div className={`bg-gradient-to-r from-[#d84451] via-[#c63542] to-[#ad242f] px-4 py-3 sm:px-6 sm:py-3.5 text-white flex items-center justify-between shadow-md shrink-0 relative z-20 ${isPhone && !isEmbed ? 'rounded-t-[32px] sm:rounded-t-[38px]' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          <RobotMascot size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
                Aizen
              </h2>
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shadow-2xs">
                AI
              </span>
            </div>
            <p className="text-[11px] text-white/90 font-medium truncate leading-tight mt-0.5">
              Asistente STS Security
            </p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-medium leading-tight mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>En línea</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 relative shrink-0">
          {loggedUserName && (
            <span className="text-[11px] bg-white/15 px-2.5 py-1 rounded-full font-bold text-white shadow-2xs capitalize hidden md:inline-block">
              {loggedUserName}
            </span>
          )}

          <button
            type="button"
            onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Opciones"
            aria-label="Opciones"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Header Dropdown Menu */}
          {headerMenuOpen && (
            <div className="absolute top-full right-0 mt-2 z-50 w-64 bg-white rounded-2xl shadow-2xl border border-rose-100 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-rose-100 font-bold text-[#b82733] flex items-center justify-between">
                <span>Opciones de Aizen</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {isPhone ? 'Modo Embed' : 'Modo Web'}
                </span>
              </div>
              {activeThread.messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onClearChat();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-slate-700 hover:text-[#b82733] flex items-center gap-2 text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#b82733]" />
                  <span>Limpiar Chat</span>
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-[#b82733] flex items-center gap-2 border-t border-rose-100 text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#b82733]" />
                  <span>Cerrar Sesión</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          CHAT FEED: Scrollable messages and cards
          ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 space-y-4 bg-[#fff8f8] scrollbar-thin">
        <div className={`space-y-4 ${!isPhone ? 'max-w-3xl mx-auto' : ''}`}>
          {/* Date Divider Pill */}
          <div className="flex justify-center select-none pt-1">
            <span className="bg-rose-100/80 text-rose-600 text-[10px] sm:text-[11px] font-semibold px-3 py-0.5 rounded-full shadow-2xs">
              Hoy
            </span>
          </div>

          {/* Welcome Greeting Card */}
          <div className="flex items-start gap-2.5 justify-start">
            <RobotMascot size="sm" className="mt-1 shrink-0" />
            <div className="max-w-[85%] bg-white border border-rose-100/90 text-slate-800 rounded-2xl rounded-tl-xs p-3.5 shadow-xs text-xs sm:text-sm space-y-1">
              <h4 className="font-extrabold text-[#b82733] flex items-center gap-1">
                <span>¡Hola! Soy Aizen</span>
                <span>👋</span>
              </h4>
              <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
                Estoy aquí para ayudarte con turnos, sedes, personal autorizado, protocolos y manuales de STS Security.
              </p>
              <div className="text-[10px] text-slate-400 text-right pt-0.5">
                10:30 AM
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts Grid */}
          <div className="bg-white border border-rose-100/90 rounded-2xl p-3 sm:p-4 shadow-xs">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {QUICK_ACTIONS.map(action => {
                const IconComp = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleQuickAction(action.query)}
                    className="flex flex-col items-center group cursor-pointer focus:outline-none"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#d84451] to-[#ab2430] text-white flex items-center justify-center shadow-xs mb-1.5 group-hover:scale-105 group-hover:shadow-md transition-all">
                      <IconComp className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 group-hover:text-[#b82733] leading-tight text-center transition-colors">
                      {action.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Render Conversation Messages */}
          {activeThread.messages.map(msg => {
            const isUser = msg.role === 'user';
            const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={msg.id} className="space-y-1 select-text">
                <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <RobotMascot size="sm" className="shrink-0 mb-1" />
                  )}

                  <div
                    className={`relative max-w-[85%] px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-r from-[#d84451] to-[#ab2430] text-white rounded-2xl rounded-tr-xs'
                        : 'bg-white border border-rose-100/90 text-slate-800 rounded-2xl rounded-tl-xs'
                    }`}
                  >
                    <FormattedContent
                      content={msg.content}
                      className={isUser ? 'text-white' : 'text-slate-800'}
                    />

                    {/* Official References Citations */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-rose-100/80 space-y-1">
                        <div className="text-[10px] font-bold text-[#b82733] uppercase flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-[#b82733]" />
                          <span>Referencias Oficiales:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.citations.map((cit, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onOpenCitation(cit)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50/80 border border-rose-200/80 hover:border-[#b82733] text-[11px] text-[#b82733] font-medium transition-colors shadow-2xs"
                            >
                              <span className="font-bold">{cit.articleNumber}</span>
                              <span className="text-slate-600 truncate max-w-[140px]">{cit.sectionTitle}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Actions / Meta */}
                    <div
                      className={`mt-1.5 pt-1 flex items-center justify-between text-[10px] border-t select-none ${
                        isUser
                          ? 'border-white/20 text-white/80'
                          : 'border-rose-100/80 text-slate-400'
                      }`}
                    >
                      {!isUser ? (
                        <div className="flex items-center gap-1">
                          {msg.citations && msg.citations.length > 0 ? (
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verificado</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">Aizen</span>
                          )}
                        </div>
                      ) : (
                        <div />
                      )}

                      <div className="flex items-center gap-1.5">
                        {!isUser && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="p-0.5 rounded hover:bg-rose-100/60 text-slate-400 hover:text-slate-700 transition-colors"
                              title="Copiar respuesta"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-0.5 rounded hover:bg-rose-100/60 transition-colors ${
                                feedbackState[msg.id] === 'up' ? 'text-emerald-600 font-bold' : 'text-slate-400'
                              }`}
                              title="Útil"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-0.5 rounded hover:bg-rose-100/60 transition-colors ${
                                feedbackState[msg.id] === 'down' ? 'text-[#b82733] font-bold' : 'text-slate-400'
                              }`}
                              title="No útil"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </>
                        )}

                        <span className="font-medium text-[10px]">{formattedTime}</span>
                        {isUser && <CheckCheck className="w-3 h-3 text-white/90" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <RobotMascot size="sm" className="shrink-0 mb-1" />
              <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-xs bg-white border border-rose-100/90 flex items-center gap-2 text-xs text-slate-700 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#d84451] animate-ping" />
                <span className="font-medium">Aizen está buscando en los manuales...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* =========================================================================
          BOTTOM INPUT BAR: Floating rounded pill & Send button
          ========================================================================= */}
      <div className={`p-2.5 sm:p-3.5 bg-[#fff8f8] border-t border-rose-100/90 shrink-0 ${isPhone ? (isEmbed ? '' : 'rounded-b-[32px] sm:rounded-b-[38px]') : 'rounded-b-[24px]'}`}>
        <div className={!isPhone ? 'max-w-3xl mx-auto' : ''}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-white border border-rose-200/90 rounded-full pl-3.5 pr-2 py-1.5 shadow-sm focus-within:border-[#d84451] focus-within:ring-2 focus-within:ring-[#d84451]/20 transition-all">
              <input
                ref={inputRef}
                type="text"
                placeholder="Escribe tu consulta..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setInputText(prev => prev + ' 😊 ')}
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                title="Añadir emoji"
              >
                <Smile className="w-4 h-4 stroke-[1.8]" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-[#d84451] to-[#ab2430] hover:opacity-95 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>

          {/* Privacy Note */}
          <div className="text-[10px] text-rose-900/60 font-medium flex items-center justify-center gap-1 pt-1.5 select-none">
            <Lock className="w-2.5 h-2.5 text-rose-800/60" />
            <span>Tus consultas y datos son seguros y privados.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
