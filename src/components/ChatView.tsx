import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Plus,
  Search,
  Paperclip,
  Smile,
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
  HelpCircle,
  MoreVertical,
  LogOut
} from 'lucide-react';
import { ChatMessage, Citation, ManualDocument, ManualSection, UserChatThread } from '../types/manual';
import { BOT_PROFILE, USER_PROFILE, getUserProfile, RenderAvatar, AvatarProfile } from '../data/avatars';

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
  onOpenProposeModal,
  loggedUserName,
  onLogout
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
    if (thread.isCurrentUser) return getUserProfile(loggedUserName);
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
    <div className="flex-1 flex h-full overflow-hidden bg-[#2f3140]">
      {/* =========================================================================
          MIDDLE COLUMN: Users & Coworker Chat List (1 Chat Per User)
          ========================================================================= */}
      <div className="w-72 sm:w-80 border-r border-[#3e4153] flex flex-col shrink-0 bg-[#262835] select-none">
        {/* Top Search & Propose Bar */}
        <div className="p-3.5 border-b border-[#3e4153] flex items-center gap-2.5">
          {onOpenProposeModal && (
            <button
              type="button"
              onClick={onOpenProposeModal}
              className="w-8 h-8 rounded-full bg-[#ca4048]/20 text-[#ca4048] border border-[#ca4048]/40 hover:bg-[#ca4048] hover:text-white flex items-center justify-center transition-all shrink-0 shadow-2xs font-semibold text-lg hidden"
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
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-[#2f3140] border border-[#3e4153] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048] transition-colors"
            />
            {sidebarSearch && (
              <button
                type="button"
                onClick={() => setSidebarSearch('')}
                className="absolute right-2.5 text-[10px] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List of User Chats */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#3e4153] scrollbar-none">
          {/* Main User Chat Item (Pinned at Top: "Mi Chat") */}
          <div
            onClick={() => onSelectThread('current-user')}
            className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
              activeThreadId === 'current-user'
                ? 'bg-[#ca4048]/15 border-l-3 border-[#ca4048]'
                : 'hover:bg-[#2f3140]'
            }`}
          >
            <RenderAvatar profile={getUserProfile(loggedUserName)} size="md" showStatus />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate">
                    Mi Chat con Aizen
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentUserThread.messages.length > 0
                    ? new Date(currentUserThread.messages[currentUserThread.messages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Activo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {currentUserThread.messages.length > 0
                  ? currentUserThread.messages[currentUserThread.messages.length - 1].content.slice(0, 42) + '...'
                  : 'Escribe tu consulta sobre manuales o políticas...'}
              </p>
            </div>
          </div>

          {/* Section Divider: Other Coworkers' Chats */}
          <div className="px-3.5 py-2 bg-[#2f3140] border-y border-[#3e4153] flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
              <Users className="w-3 h-3 text-[#ca4048]" />
              <span>Dudas de Otros Colaboradores</span>
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
                  isSelected ? 'bg-[#ca4048]/15 border-l-3 border-[#ca4048]' : 'hover:bg-[#2f3140]'
                }`}
              >
                <RenderAvatar profile={profile} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#ca4048] transition-colors">
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
                    <p className="text-[11px] text-slate-300 truncate">
                      {lastMsg ? lastMsg.content : 'Consultas al bot...'}
                    </p>

                    <span
                      className="shrink-0 px-1.5 py-0.2 rounded-full bg-[#ca4048] text-white text-[10px] font-bold"
                    >
                      {userQuestionsCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Main Chat Area
          ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#2f3140]">
        {/* Top Header Bar */}
        <div className="bg-[#ca4048] px-6 py-3.5 flex items-center justify-between text-white shadow-sm shrink-0 relative select-none">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              className="flex items-center gap-1.5 font-bold text-sm sm:text-base tracking-tight hover:opacity-90 transition-opacity"
            >
              <span>
                {isViewingSelf
                  ? `Aizen - Asistente de STS Security`
                  : `Aizen • Chat de ${activeThread.userName} (${activeThread.department})`}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 relative">
            {loggedUserName && (
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full font-bold text-white shadow-xs capitalize">
                Usuario: {loggedUserName}
              </span>
            )}

            {!isViewingSelf && (
              <button
                type="button"
                onClick={() => onSelectThread('current-user')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition-all shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ir a Mi Chat</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              title="Opciones"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Options */}
            {headerMenuOpen && (
              <div className="absolute top-full right-0 mt-2 z-50 w-72 bg-[#2f3140] rounded-2xl shadow-xl border border-[#3e4153] py-1.5 text-xs text-white animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-[#3e4153] font-bold text-white flex items-center justify-between">
                  <span>Opciones del Asistente</span>
                </div>
                {onOpenProposeModal && (
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      onOpenProposeModal();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-[#262835] flex items-center gap-2 text-xs text-white"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#ca4048]" />
                    <span>Proponer Nuevo Procedimiento</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setHeaderMenuOpen(false);
                    console.log('Mostrar mensajes destacados');
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#262835] flex items-center gap-2 text-xs text-white"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#ca4048]" />
                  <span>Mostrar mensajes destacados</span>
                </button>
                {isViewingSelf && activeThread.messages.length > 0 && (
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      onClearChat();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-[#ca4048]/20 text-[#ca4048] flex items-center gap-2 border-t border-[#3e4153] text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Limpiar Mi Chat</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-[#ca4048]/20 text-[#ca4048] flex items-center gap-2 border-t border-[#3e4153] text-xs font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#ca4048]" />
                    <span>Cerrar Sesión</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Informative Banner */}
        {!isViewingSelf && (
          <div className="bg-[#262835] border-b border-[#3e4153] px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 text-[#ca4048] shrink-0" />
              <span className="truncate">
                Viendo consultas de <strong>{activeThread.userName}</strong>.
              </span>
            </div>
            <button
              onClick={() => onSelectThread('current-user')}
              className="text-xs font-bold text-[#ca4048] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>Preguntar en Mi Chat</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Message Scroll Canvas */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 bg-[#2f3140]">
          {activeThread.messages.length === 0 ? (
            /* Empty State */
            <div className="max-w-lg mx-auto py-10 text-center space-y-6 select-none">
              <div className="w-20 h-20 mx-auto flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/aistudio/Minimal_White_Mascot_Face_Icon_40e4f488.png"
                  alt="Aizen"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white">
                  ¡Hola! ¿Cómo estás? Aquí estoy listo para darte una mano con cualquier duda
                </h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  ¿En qué te puedo ayudar hoy?
                </p>
              </div>
            </div>
          ) : (
            /* Render Messages */
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
                  <div className={`flex items-center text-xs font-semibold text-slate-300 px-12 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{senderName}</span>
                  </div>

                  <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <RenderAvatar profile={BOT_PROFILE} size="md" className="shrink-0 mb-1" />
                    )}

                    {isUser && (
                      <span className="text-[11px] text-slate-400 font-medium select-none mb-2">
                        {formattedTime}
                      </span>
                    )}

                    <div
                      className={`relative max-w-lg sm:max-w-xl px-4.5 py-3 text-xs sm:text-sm leading-relaxed transition-all shadow-md ${
                        isUser
                          ? 'bg-[#ca4048] text-white rounded-2xl rounded-tr-xs'
                          : 'bg-[#262835] border border-[#3e4153] text-white rounded-2xl rounded-tl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line select-text">
                        {msg.content}
                      </div>

                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#3e4153] space-y-1">
                          <div className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-[#ca4048]" />
                            <span>Referencias Oficiales:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {msg.citations.map((cit, idx) => (
                              <button
                                key={idx}
                                onClick={() => onOpenCitation(cit)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2f3140] border border-[#3e4153] hover:border-[#ca4048] text-[11px] text-[#ca4048] font-medium transition-colors group shadow-2xs"
                              >
                                <span className="font-semibold text-white">{cit.articleNumber}</span>
                                <span className="text-slate-300 truncate max-w-[120px]">{cit.sectionTitle}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {!isUser && (
                        <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-[#3e4153] select-none">
                          <div className="flex items-center gap-1">
                            {msg.citations && msg.citations.length > 0 ? (
                              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Book Oficial</span>
                              </span>
                            ) : (
                              <span className="text-slate-300">Compañero</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="p-1 rounded hover:bg-[#3e4153] text-slate-300 hover:text-white transition-colors"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1 rounded hover:bg-[#3e4153] text-slate-300 hover:text-white transition-colors ${
                                feedbackState[msg.id] === 'up' ? 'text-emerald-400 font-bold' : ''
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1 rounded hover:bg-[#3e4153] text-slate-300 hover:text-white transition-colors ${
                                feedbackState[msg.id] === 'down' ? 'text-[#ca4048] font-bold' : ''
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isUser && (
                      <span className="text-[11px] text-slate-400 font-medium select-none mb-2">
                        {formattedTime}
                      </span>
                    )}

                    {isUser && (
                      <RenderAvatar profile={senderAvatarProfile} size="md" className="shrink-0 mb-1" />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isLoading && isViewingSelf && (
            <div className="flex items-end gap-2.5 justify-start">
              <RenderAvatar profile={BOT_PROFILE} size="md" className="shrink-0 mb-1" />
              <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-[#262835] border border-[#3e4153] flex items-center gap-2 text-xs text-white shadow-md">
                <span className="w-2 h-2 rounded-full bg-[#ca4048] animate-ping" />
                <span>Escribiendo...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-[#262835] border-t border-[#3e4153] shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
            <div className="flex-1 flex items-center bg-[#2f3140] border border-[#3e4153] rounded-full px-4 py-2 focus-within:border-[#ca4048] focus-within:ring-2 focus-within:ring-[#ca4048]/30 transition-all shadow-xs">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setInputText(prev => prev + ' 😊 ')}
                className="text-slate-400 hover:text-white transition-colors ml-2"
              >
                <Smile className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-[#ca4048] hover:bg-[#b5343c] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
              aria-label="Enviar"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
