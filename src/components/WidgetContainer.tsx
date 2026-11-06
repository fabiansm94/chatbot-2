import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ManualDocument, ManualSection, ChatMessage, Citation, UserChatThread, KnowledgeProposal } from '../types/manual';
import { ChatView } from './ChatView';
import { ManualDrawer } from './ManualDrawer';
import { LoginModal } from './LoginModal';
import { DEFAULT_MANUALS } from '../data/defaultManuals';
import { DEFAULT_USER_THREADS, appendUserMessage } from '../data/userChatThreads';
import { searchManuals, generateLocalGroundedAnswer } from '../utils/manualSearch';

interface WidgetContainerProps {
  companyName: string;
  manuals: ManualDocument[];
  hasGeminiKey: boolean;
  primaryColor?: string;
}

const STORAGE_KEY_MANUALS = 'manualbot_widget_company_manuals_v1';
const STORAGE_KEY_COMPANY = 'manualbot_widget_company_name_v1';

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  companyName: initialCompanyName,
  manuals: initialManuals,
  hasGeminiKey
}) => {
  const [manuals, setManuals] = useState<ManualDocument[]>(() => {
    const deletedIds = JSON.parse(localStorage.getItem('manualbot_deleted_manual_ids_v1') || '[]');
    if (initialManuals && initialManuals.length > 0) {
      return initialManuals.filter(m => !deletedIds.includes(m.id));
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MANUALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((m: ManualDocument) => !deletedIds.includes(m.id));
      }
    } catch (e) {}
    return DEFAULT_MANUALS.filter(m => !deletedIds.includes(m.id));
  });

  useEffect(() => {
    if (initialManuals) {
      const deletedIds = JSON.parse(localStorage.getItem('manualbot_deleted_manual_ids_v1') || '[]');
      setManuals(initialManuals.filter(m => !deletedIds.includes(m.id)));
    }
  }, [initialManuals]);

  const [companyName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('company');
      if (fromUrl) return fromUrl;
    }
    return localStorage.getItem(STORAGE_KEY_COMPANY) || initialCompanyName || 'Control y Monitoreo';
  });

  const [threads, setThreads] = useState<UserChatThread[]>(DEFAULT_USER_THREADS);

  const [activeThreadId, setActiveThreadId] = useState<string>('current-user');
  const [isLoading, setIsLoading] = useState(false);

  // Drawer state for citations
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerManual, setDrawerManual] = useState<ManualDocument | null>(null);
  const [drawerSection, setDrawerSection] = useState<ManualSection | null>(null);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loggedUserName, setLoggedUserName] = useState<string>(() => {
    return localStorage.getItem('manualbot_logged_user_name_v1') || '';
  });

  useEffect(() => {
    try {
      localStorage.setItem('manualbot_widget_threads_v3', JSON.stringify(threads));
    } catch (e) {}
  }, [threads]);

  const handleLogin = (_station: 'Estación 1' | 'Estación 2', userName: string) => {
    setLoggedUserName(userName);
    setShowLoginModal(false);
    localStorage.setItem('manualbot_logged_user_name_v1', userName);
    localStorage.setItem('manualbot_auth_v1', 'true');
  };

  const handleLogout = () => {
    setLoggedUserName('');
    setShowLoginModal(true);
    localStorage.removeItem('manualbot_logged_user_name_v1');
    localStorage.setItem('manualbot_auth_v1', 'false');
  };

  const handleSubmitProposal = (newProp: KnowledgeProposal) => {
    setDoc(doc(db, 'proposals', newProp.id), newProp).catch(console.warn);
    setToastMessage('¡Propuesta enviada al buzón de aprobaciones!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendMessage = async (text: string) => {
    setActiveThreadId('current-user');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const currentThread = threads.find(t => t.isCurrentUser) || threads[0];
    const newMessages = [...currentThread.messages, userMsg];

    setThreads(prev => appendUserMessage(prev, 'current-user', userMsg));
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(-6),
          manuals,
          companyName
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'No he podido generar una respuesta en este momento.',
        citations: data.citations || [],
        grounded: data.grounded,
        timestamp: Date.now()
      };

      setThreads(prev => appendUserMessage(prev, 'current-user', assistantMsg));
    } catch (error: any) {
      console.warn('Communication issue with server, answering with local manual engine:', error);
      const searchResults = searchManuals(text, manuals, 4);
      const localResult = generateLocalGroundedAnswer(text, searchResults, 'direct');
      const fallbackMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: localResult.answer,
        citations: localResult.citations,
        grounded: searchResults.length > 0,
        timestamp: Date.now()
      };
      setThreads(prev => appendUserMessage(prev, 'current-user', fallbackMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setThreads(prev =>
      prev.map(t => (t.isCurrentUser ? { ...t, messages: [] } : t))
    );
  };

  const handleOpenSection = (section: ManualSection, manual: ManualDocument) => {
    setDrawerManual(manual);
    setDrawerSection(section);
    setDrawerOpen(true);
  };

  const handleOpenCitation = (citation: Citation) => {
    const foundManual = manuals.find(m => m.id === citation.manualId || m.code === citation.manualCode);
    if (foundManual) {
      const foundSection = foundManual.sections.find(s => s.id === citation.sectionId || s.articleNumber === citation.articleNumber);
      if (foundSection) {
        setDrawerManual(foundManual);
        setDrawerSection(foundSection);
        setDrawerOpen(true);
        return;
      }
    }
    if (foundManual && foundManual.sections.length > 0) {
      setDrawerManual(foundManual);
      setDrawerSection(foundManual.sections[0]);
      setDrawerOpen(true);
    }
  };

  return (
    <div className="w-full h-full bg-[#fff8f8] text-slate-800 flex flex-col overflow-hidden font-sans relative">
      {showLoginModal && <LoginModal onLogin={handleLogin} />}

      <main className="flex-1 flex flex-col overflow-hidden bg-[#fff8f8] w-full h-full relative">
        <ChatView
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={setActiveThreadId}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onOpenCitation={handleOpenCitation}
          companyName={companyName}
          hasGeminiKey={hasGeminiKey}
          manuals={manuals}
          onOpenProposeModal={() => setProposeModalOpen(true)}
          proposeModalOpen={proposeModalOpen}
          onCloseProposeModal={() => setProposeModalOpen(false)}
          onSubmitProposal={handleSubmitProposal}
          onOpenSection={handleOpenSection}
          loggedUserName={loggedUserName}
          onLogout={handleLogout}
          viewMode="phone"
          allowModeToggle={false}
          isEmbed={true}
        />
      </main>

      <ManualDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        manual={drawerManual}
        section={drawerSection}
        onAskAboutSection={(section, manual) => {
          setDrawerOpen(false);
          handleSendMessage(`¿Qué requisitos, plazos o pasos debo tener en cuenta según el ${section.articleNumber} ("${section.title}") del ${manual.title}?`);
        }}
      />

      {toastMessage && (
        <div className="fixed bottom-16 right-4 z-50 px-3.5 py-2.5 rounded-xl bg-[#2f3140] border border-[#ca4048] shadow-2xl text-xs text-white flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#ca4048] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
