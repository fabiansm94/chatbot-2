import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Plus,
  Search,
  Paperclip,
  Smile,
  ChevronDown,
  RotateCcw,
  BookOpen,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Users,
  Eye,
  ArrowRight,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { ChatMessage, Citation, ManualDocument, ManualSection, UserChatThread } from '../types/manual';
import { BOT_PROFILE, USER_PROFILE, RenderAvatar, AvatarProfile } from '../data/avatars';

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
}

export const ChatView: React.FC<ChatViewProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  isLoading,
  onSendMessage,
  onClearChat,
  onOpenCitation,
  companyName,
  onOpenProposeModal
}) => {
  const [inputText, setInputText] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'up' | 'down'>>({});
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.userId === activeThreadId) || threads[0];
  const isViewingSelf = activeThread?.isCurrentUser ?? true;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    // If user is currently browsing another coworker's chat, switch to own chat and ask
    if (!isViewingSelf) {
      onSelectThread('current-user');
    }
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

  // Filter threads based on search
  const filteredThreads = threads.filter(thread => {
    if (!sidebarSearch.trim()) return true;
    const query = sidebarSearch.toLowerCase();
    return (
      thread.userName.toLowerCase().includes(query) ||
      thread.department.toLowerCase().includes(query) ||
      thread.userRole.toLowerCase().includes(query) ||
      thread.messages.some(m => m.content.toLowerCase().includes(query))
    );
  });

  const currentUserThread = threads.find(t => t.isCurrentUser) || threads[0];
  const coworkerThreads = filteredThreads.filter(t => !t.isCurrentUser);

  // Helper to build avatar profile for display
  const getThreadAvatarProfile = (thread: UserChatThread): AvatarProfile => {
    if (thread.isCurrentUser) return USER_PROFILE;
    return {
      id: thread.userId,
      name: thread.userName,
      department: thread.department,
      role: thread.userRole,
      color: '#fa5252',
      bgGradient: thread.bgGradient || 'from-rose-400 to-red-500',
      initials: thread.initials
    };
  };

  const activeSenderProfile = getThreadAvatarProfile(activeThread);

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white">
      {/* =========================================================================
          MIDDLE COLUMN: Users & Coworker Chat List (1 Chat Per User)
          ========================================================================= */}
      <div className="w-72 sm:w-80 border-r border-slate-150 flex flex-col shrink-0 bg-white select-none">
        {/* Top Search & Propose Bar */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-2.5">
          {onOpenProposeModal && (
            <button
              type="button"
              onClick={onOpenProposeModal}
              className="w-8 h-8 rounded-full bg-rose-50 text-[#fa5252] border border-rose-200 hover:bg-[#fa5252] hover:text-white flex items-center justify-center transition-all shrink-0 shadow-2xs font-semibold text-lg"
              title="Enseñar nuevo procedimiento al bot (+)"
              aria-label="Enseñar al Bot"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {/* Pill Search Input */}
          <div className="flex-1 relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar colaborador o duda..."
              value={sidebarSearch}
              onChange={e => setSidebarSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] transition-colors"
            />
            {sidebarSearch && (
              <button
                type="button"
                onClick={() => setSidebarSearch('')}
                className="absolute right-2.5 text-[10px] text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List of User Chats */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100/80 scrollbar-none">
          {/* Main User Chat Item (Pinned at Top: "Mi Chat") */}
          <div
            onClick={() => onSelectThread('current-user')}
            className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
              activeThreadId === 'current-user'
                ? 'bg-rose-50/70 border-l-3 border-[#fa5252]'
                : 'hover:bg-slate-50'
            }`}
          >
            <RenderAvatar profile={USER_PROFILE} size="md" showStatus />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-slate-800 truncate">
                    Mi Chat con ManualBot
                  </h4>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#fa5252]/10 text-[#fa5252] font-semibold">
                    Tú
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentUserThread.messages.length > 0
                    ? new Date(currentUserThread.messages[currentUserThread.messages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Activo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {currentUserThread.messages.length > 0
                  ? currentUserThread.messages[currentUserThread.messages.length - 1].content.slice(0, 42) + '...'
                  : 'Escribe tu consulta sobre manuales o políticas...'}
              </p>
            </div>
          </div>

          {/* Section Divider: Other Coworkers' Chats */}
          <div className="px-3.5 py-2 bg-slate-50/80 border-y border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3 text-[#fa5252]" />
              <span>Dudas de Otros Colaboradores</span>
            </span>
            <span className="text-[9px] font-semibold text-slate-400">
              1 chat por persona
            </span>
          </div>

          {/* Coworker User Threads */}
          {coworkerThreads.map(thread => {
            const isSelected = activeThreadId === thread.userId;
            const lastMsg = thread.messages[thread.messages.length - 1];
            const profile = getThreadAvatarProfile(thread);
            const userQuestionsCount = thread.messages.filter(m => m.role === 'user').length;

            return (
              <div
                key={thread.userId}
                onClick={() => onSelectThread(thread.userId)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors group ${
                  isSelected ? 'bg-rose-50/70 border-l-3 border-[#fa5252]' : 'hover:bg-slate-50'
                }`}
                title={`Ver dudas consultadas por ${thread.userName}`}
              >
                <RenderAvatar profile={profile} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#fa5252] transition-colors">
                      {thread.userName}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {thread.lastActive}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 truncate mb-0.5">
                    {thread.department}
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] text-slate-500 truncate">
                      {lastMsg ? lastMsg.content : 'Consultas al bot...'}
                    </p>

                    {/* Question Count Badge */}
                    <span
                      className="shrink-0 px-1.5 py-0.2 rounded-full bg-[#fa5252] text-white text-[10px] font-bold"
                      title={`${userQuestionsCount} dudas consultadas`}
                    >
                      {userQuestionsCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {coworkerThreads.length === 0 && sidebarSearch && (
            <div className="p-6 text-center text-xs text-slate-400">
              No se encontraron consultas de colaboradores con "{sidebarSearch}"
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Main Chat Area (Coral Top Banner + Light Canvas)
          ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#fdfdfe]">
        {/* Top Coral Header Bar */}
        <div className="bg-gradient-to-r from-[#ff7a6e] to-[#fa5252] px-6 py-3.5 flex items-center justify-between text-white shadow-sm shrink-0 relative select-none">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              className="flex items-center gap-1.5 font-bold text-sm sm:text-base tracking-tight hover:opacity-90 transition-opacity"
            >
              <span>
                {isViewingSelf
                  ? `ManualBot • Mi Chat Privado (${companyName})`
                  : `ManualBot • Chat de ${activeThread.userName} (${activeThread.department})`}
              </span>
              <ChevronDown className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* If viewing another colleague's chat, quick button to return to personal chat */}
            {!isViewingSelf && (
              <button
                type="button"
                onClick={() => onSelectThread('current-user')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#fa5252] hover:bg-rose-50 text-xs font-semibold transition-all shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ir a Mi Chat</span>
              </button>
            )}

            {onOpenProposeModal && (
              <button
                type="button"
                onClick={onOpenProposeModal}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white text-white hover:text-[#fa5252] text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Enseñar</span>
              </button>
            )}

            {isViewingSelf && activeThread.messages.length > 0 && (
              <button
                type="button"
                onClick={onClearChat}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                title="Reiniciar mi conversación"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dropdown Options */}
          {headerMenuOpen && (
            <div className="absolute top-13 left-6 z-50 w-72 bg-white rounded-2xl shadow-xl border border-slate-150 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between">
                <span>Opciones del Asistente</span>
                <span className="text-[10px] text-slate-400 font-normal">1 chat / usuario</span>
              </div>
              <button
                onClick={() => {
                  setHeaderMenuOpen(false);
                  onSelectThread('current-user');
                  onSendMessage('¿Cuáles son los 5 manuales principales de la empresa y qué cubre cada uno?');
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#fa5252]" />
                <span>Resumen de Todos los Manuales</span>
              </button>
              {onOpenProposeModal && (
                <button
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onOpenProposeModal();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-[#fa5252]" />
                  <span>Proponer Nuevo Procedimiento</span>
                </button>
              )}
              {isViewingSelf && activeThread.messages.length > 0 && (
                <button
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    onClearChat();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-slate-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar Mi Chat</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Informative Banner when viewing another coworker's questions */}
        {!isViewingSelf && (
          <div className="bg-amber-50/90 border-b border-amber-200/80 px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="truncate">
                Viendo consultas de <strong>{activeThread.userName}</strong> ({activeThread.userRole}). Puedes revisar qué preguntó para resolver dudas comunes.
              </span>
            </div>
            <button
              onClick={() => onSelectThread('current-user')}
              className="text-xs font-bold text-[#fa5252] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Preguntar en Mi Chat</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Message Scroll Canvas */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {activeThread.messages.length === 0 ? (
            /* Empty State / Welcome Screen matching reference style */
            <div className="max-w-lg mx-auto py-10 text-center space-y-6 select-none">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#ff7a6e] to-[#fa5252] p-1 mx-auto shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden p-1">
                  <img
                    src="/assets/aistudio/Minimal_White_Mascot_Face_Icon_40e4f488.png"
                    alt="ManualBot"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-slate-800">
                  ¡Hola! Soy tu compañero para dudas de la empresa
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Este es tu chat único con ManualBot. Pregúntame con confianza sobre tus vacaciones, permisos, seguros, beneficios o normas internas.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {[
                  '¿Cuántos días de vacaciones me corresponden?',
                  '¿Qué hacer si recibo un correo de phishing?',
                  '¿Cuáles son los topes de viáticos diarios?',
                  '¿Cómo reporto un accidente laboral?'
                ].map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!isViewingSelf) onSelectThread('current-user');
                      onSendMessage(q);
                    }}
                    className="p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-[#fa5252] hover:bg-rose-50/40 text-xs text-slate-700 transition-all shadow-2xs font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Render Messages matching image bubbles */
            activeThread.messages.map(msg => {
              const isUser = msg.role === 'user';
              const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              const senderName = isUser
                ? (isViewingSelf ? 'Tú' : activeThread.userName)
                : BOT_PROFILE.name;

              const senderAvatarProfile = isUser
                ? activeSenderProfile
                : BOT_PROFILE;

              return (
                <div key={msg.id} className="space-y-1">
                  {/* Sender Name above Bubble */}
                  <div className={`flex items-center text-xs font-semibold text-slate-700 px-12 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{senderName}</span>
                  </div>

                  {/* Message Row: Avatar + Bubble + Time */}
                  <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {/* Bot Avatar on Left */}
                    {!isUser && (
                      <RenderAvatar profile={BOT_PROFILE} size="md" className="shrink-0 mb-1" />
                    )}

                    {/* Timestamp for User on Left of bubble */}
                    {isUser && (
                      <span className="text-[11px] text-slate-400 font-medium select-none mb-2">
                        {formattedTime}
                      </span>
                    )}

                    {/* Speech Bubble */}
                    <div
                      className={`relative max-w-lg sm:max-w-xl px-4.5 py-3 text-xs sm:text-sm leading-relaxed transition-all shadow-2xs ${
                        isUser
                          ? 'bg-[#fa5252] text-white rounded-2xl rounded-tr-xs'
                          : 'bg-[#f1f3f6] text-slate-800 rounded-2xl rounded-tl-xs'
                      }`}
                    >
                      {/* Message Content */}
                      <div className="whitespace-pre-line select-text">
                        {msg.content}
                      </div>

                      {/* Reference Citations inside Bot Bubble */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1">
                          <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#fa5252]" />
                            <span>Referencias Oficiales Citadas:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {msg.citations.map((cit, idx) => (
                              <button
                                key={idx}
                                onClick={() => onOpenCitation(cit)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-[#fa5252] text-[11px] text-[#fa5252] font-medium transition-colors group shadow-2xs"
                                title="Ver artículo en el manual"
                              >
                                <span className="font-semibold">{cit.articleNumber}</span>
                                <span className="text-slate-500 truncate max-w-[120px]">{cit.sectionTitle}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-[#fa5252]" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bot Message Helpful Controls */}
                      {!isUser && (
                        <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60 select-none">
                          <div className="flex items-center gap-1">
                            {msg.citations && msg.citations.length > 0 ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Book Oficial</span>
                              </span>
                            ) : (
                              <span>Compañero de Trabajo</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="p-1 rounded hover:bg-slate-200/60 transition-colors"
                              title="Copiar texto"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1 rounded hover:bg-slate-200/60 transition-colors ${
                                feedbackState[msg.id] === 'up' ? 'text-emerald-600 font-bold' : ''
                              }`}
                              title="Útil"
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1 rounded hover:bg-slate-200/60 transition-colors ${
                                feedbackState[msg.id] === 'down' ? 'text-rose-600 font-bold' : ''
                              }`}
                              title="No útil"
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timestamp for Bot on Right of bubble */}
                    {!isUser && (
                      <span className="text-[11px] text-slate-400 font-medium select-none mb-2">
                        {formattedTime}
                      </span>
                    )}

                    {/* User Avatar on Right */}
                    {isUser && (
                      <RenderAvatar profile={senderAvatarProfile} size="md" className="shrink-0 mb-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Loading Indicator */}
          {isLoading && isViewingSelf && (
            <div className="flex items-end gap-2.5 justify-start">
              <RenderAvatar profile={BOT_PROFILE} size="md" className="shrink-0 mb-1" />
              <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-[#f1f3f6] flex items-center gap-2 text-xs text-slate-500 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#fa5252] animate-ping" />
                <span>Escribiendo respuesta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* =========================================================================
            BOTTOM INPUT BAR: Pill Input with Clip, Smile, and Coral Send Button
            ========================================================================= */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
            {/* Attachment Button (Paperclip) */}
            {onOpenProposeModal && (
              <button
                type="button"
                onClick={onOpenProposeModal}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[#fa5252] hover:bg-rose-50 transition-colors shrink-0"
                title="Proponer nuevo procedimiento al bot"
                aria-label="Adjuntar o Proponer Procedimiento"
              >
                <Paperclip className="w-5 h-5 stroke-[2]" />
              </button>
            )}

            {/* Pill-shaped Input Container */}
            <div className="flex-1 flex items-center bg-[#f8fafc] border border-slate-200 rounded-full px-4 py-2 focus-within:border-[#fa5252] focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-100 transition-all shadow-2xs">
              <input
                type="text"
                placeholder={
                  isViewingSelf
                    ? 'Write a message...'
                    : `¿Tienes una duda similar? Escribe aquí y se enviará a Tu Chat...`
                }
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />

              {/* Smiley Icon inside pill */}
              <button
                type="button"
                onClick={() => setInputText(prev => prev + ' 😊 ')}
                className="text-slate-400 hover:text-slate-600 transition-colors ml-2"
                title="Añadir emoji"
              >
                <Smile className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            {/* Coral Circular Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-[#fa5252] hover:bg-[#e03131] disabled:opacity-40 disabled:hover:bg-[#fa5252] text-white flex items-center justify-center transition-all shadow-md shadow-rose-500/20 active:scale-95 shrink-0 cursor-pointer"
              aria-label="Enviar mensaje"
              title={isViewingSelf ? 'Enviar mensaje' : 'Enviar a Mi Chat'}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
