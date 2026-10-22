import React, { useState, useEffect } from 'react';
import { LeftRail } from './components/LeftRail';
import { ChatView } from './components/ChatView';
import { ManualsBookView } from './components/ManualsBookView';
import { ArticleExplorerView } from './components/ArticleExplorerView';
import { SettingsView } from './components/SettingsView';
import { EmbedIntegrationView } from './components/EmbedIntegrationView';
import { WidgetContainer } from './components/WidgetContainer';
import { ApprovalsView } from './components/ApprovalsView';
import { ProposeKnowledgeModal } from './components/ProposeKnowledgeModal';
import { ManualDrawer } from './components/ManualDrawer';
import { AddManualModal } from './components/AddManualModal';
import { LoginModal } from './components/LoginModal';
import { DEFAULT_MANUALS } from './data/defaultManuals';
import { DEFAULT_PROPOSALS } from './data/defaultProposals';
import { DEFAULT_USER_THREADS, appendUserMessage } from './data/userChatThreads';
import { ChatMessage, Citation, ManualDocument, ManualSection, KnowledgeProposal, UserChatThread } from './types/manual';
import { approveProposal, rejectProposal } from './utils/approvalWorkflow';

const STORAGE_KEY_MANUALS = 'manualbot_company_manuals_v1';
const STORAGE_KEY_COMPANY = 'manualbot_company_name_v1';
const STORAGE_KEY_CHAT = 'manualbot_chat_history_v1';
const STORAGE_KEY_THREADS = 'manualbot_user_threads_v3';
const STORAGE_KEY_PROPOSALS = 'manualbot_proposals_v1';

export default function App() {
  // Check if loaded in embedded widget mode
  const isWidgetMode = typeof window !== 'undefined' && window.location.search.includes('mode=widget');

  const [activeTab, setActiveTab] = useState<'chat' | 'book' | 'explorer' | 'approvals' | 'embed' | 'settings'>('chat');
  const [manuals, setManuals] = useState<ManualDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MANUALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved manuals, using defaults');
    }
    return DEFAULT_MANUALS;
  });

  const [proposals, setProposals] = useState<KnowledgeProposal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROPOSALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved proposals, using defaults');
    }
    return DEFAULT_PROPOSALS;
  });

  const [companyName, setCompanyName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_COMPANY) || 'Global Corp & Partners';
  });

  const [threads, setThreads] = useState<UserChatThread[]>(() => {
    try {
      const savedThreads = localStorage.getItem(STORAGE_KEY_THREADS);
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved threads, using defaults');
    }

    // Check if user has previous chat messages in STORAGE_KEY_CHAT
    try {
      const savedChat = localStorage.getItem(STORAGE_KEY_CHAT);
      if (savedChat) {
        const parsed = JSON.parse(savedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return DEFAULT_USER_THREADS.map(t =>
            t.isCurrentUser ? { ...t, messages: parsed } : t
          );
        }
      }
    } catch (e) {
      // fallback
    }

    return DEFAULT_USER_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>('current-user');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  // Manual Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerManual, setDrawerManual] = useState<ManualDocument | null>(null);
  const [drawerSection, setDrawerSection] = useState<ManualSection | null>(null);

  // Add Manual & Propose Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);

  // Check system status on mount
  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data.hasGeminiKey === 'boolean') {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch(err => {
        console.warn('Could not contact /api/status:', err);
      });
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MANUALS, JSON.stringify(manuals));
    } catch (e) {
      console.warn('LocalStorage save failed for manuals');
    }
  }, [manuals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY, companyName);
    } catch (e) {
      console.warn('LocalStorage save failed for company');
    }
  }, [companyName]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THREADS, JSON.stringify(threads));
      const currentUserThread = threads.find(t => t.isCurrentUser);
      if (currentUserThread) {
        localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(currentUserThread.messages));
      }
    } catch (e) {
      console.warn('LocalStorage save failed for threads');
    }
  }, [threads]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [station, setStation] = useState<'Estación 1' | 'Estación 2' | null>(null);
  const [loggedUserName, setLoggedUserName] = useState<string>(() => {
    return localStorage.getItem('manualbot_logged_user_name_v1') || '';
  });

  const isFabian = loggedUserName.trim().toLowerCase() === 'fabian';

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const h = now.getHours();
      if ((h === 6 || h === 14 || h === 22) && now.getMinutes() === 0) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
      }
    };
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Show on mount if not authenticated
    if (!isAuthenticated) setShowLoginModal(true);
  }, []);

  useEffect(() => {
    const isFabian = loggedUserName.trim().toLowerCase() === 'fabian';
    if (!isFabian) {
      setActiveTab('chat');
    }
  }, [loggedUserName]);

  const handleLogin = (station: 'Estación 1' | 'Estación 2', userName: string) => {
    setStation(station);
    setIsAuthenticated(true);
    setShowLoginModal(false);
    setLoggedUserName(userName);
    localStorage.setItem('manualbot_logged_user_name_v1', userName);
    if (userName.trim().toLowerCase() !== 'fabian') {
      setActiveTab('chat');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLoginModal(true);
    setLoggedUserName('');
    localStorage.removeItem('manualbot_logged_user_name_v1');
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
      console.error('Error sending message:', error);
      const errorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Hubo un inconveniente temporal de comunicación. He recurrido a la base interna local de manuales. Por favor intenta reformular tu pregunta.',
        timestamp: Date.now(),
        error: true
      };
      setThreads(prev => appendUserMessage(prev, 'current-user', errorMsg));
    } finally {
      setIsLoading(false);
    }
  };


  const handleClearChat = () => {
    setThreads(prev =>
      prev.map(t => (t.isCurrentUser ? { ...t, messages: [] } : t))
    );
    localStorage.removeItem(STORAGE_KEY_CHAT);
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

  const handleAskAboutSection = (section: ManualSection, manual: ManualDocument) => {
    setActiveTab('chat');
    setActiveThreadId('current-user');
    handleSendMessage(`¿Qué requisitos, plazos o pasos debo tener en cuenta según el ${section.articleNumber} ("${section.title}") del ${manual.title}?`);
  };

  const handleAskAboutManual = (manual: ManualDocument) => {
    setActiveTab('chat');
    setActiveThreadId('current-user');
    handleSendMessage(`¿Cuáles son los temas, derechos y obligaciones principales que contempla el ${manual.title} (${manual.code})?`);
  };

  const handleAddManual = (newManual: ManualDocument) => {
    setManuals(prev => [newManual, ...prev]);
  };

  const handleResetManuals = () => {
    if (window.confirm('¿Deseas restablecer el Book a los Procedimientos de Control y Monitoreo estándar?')) {
      setManuals(DEFAULT_MANUALS);
      localStorage.removeItem(STORAGE_KEY_MANUALS);
    }
  };

  const handleImportManuals = (imported: ManualDocument[]) => {
    setManuals(imported);
  };

  // Save proposals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(proposals));
    } catch (e) {
      console.warn('LocalStorage save failed for proposals');
    }
  }, [proposals]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmitProposal = (newProp: KnowledgeProposal) => {
    setProposals(prev => [newProp, ...prev]);
    showToast('¡Propuesta enviada con éxito! Está en el Buzón de Aprobaciones.');
  };

  const handleApproveProposal = (prop: KnowledgeProposal, approverName: string) => {
    const { updatedManuals, approvedProposal } = approveProposal(prop, manuals, approverName);
    setManuals(updatedManuals);
    setProposals(prev => prev.map(p => (p.id === prop.id ? approvedProposal : p)));
    showToast(`¡Aprobado! El procedimiento "${prop.title}" ha sido incorporado al Book oficial.`);
  };

  const handleRejectProposal = (prop: KnowledgeProposal, reason: string, approverName: string) => {
    const rejected = rejectProposal(prop, reason, approverName);
    setProposals(prev => prev.map(p => (p.id === prop.id ? rejected : p)));
    showToast(`Procedimiento "${prop.title}" rechazado.`);
  };

  const pendingApprovalsCount = proposals.filter(p => p.status === 'pending').length;
  const totalArticles = manuals.reduce((acc, m) => acc + m.sections.length, 0);

  // If page is loaded in an iframe as a widget, render the dedicated widget view
  if (isWidgetMode) {
    return (
      <WidgetContainer
        companyName={companyName}
        manuals={manuals}
        hasGeminiKey={hasGeminiKey}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-slate-200 p-2 sm:p-4 lg:p-6 flex items-center justify-center font-sans antialiased">
      {showLoginModal && <LoginModal onLogin={handleLogin} />}
      {/* Floating Card Window matching reference image */}
      <div className="w-full max-w-7xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] bg-[#242424] rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden flex border border-[#333333]">
        {/* 1. Left Slim Rail (Coral Gradient) */}
        {isFabian && (
          <LeftRail
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pendingApprovalsCount={pendingApprovalsCount}
            totalManuals={manuals.length}
            loggedUserName={loggedUserName}
          />
        )}

        {/* 2. Main View Area */}
        <main className="flex-1 flex overflow-hidden bg-[#242424] min-w-0 min-h-0 h-full">
          {activeTab === 'chat' && (
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
              onOpenSection={handleOpenSection}
              loggedUserName={loggedUserName}
              onLogout={handleLogout}
            />
          )}

          {activeTab === 'book' && (
            <ManualsBookView
              manuals={manuals}
              onOpenSection={handleOpenSection}
              onOpenAddModal={() => setAddModalOpen(true)}
              onResetManuals={handleResetManuals}
              onAskAboutManual={handleAskAboutManual}
            />
          )}

          {activeTab === 'explorer' && (
            <ArticleExplorerView
              manuals={manuals}
              onOpenSection={handleOpenSection}
              onAskAboutSection={handleAskAboutSection}
            />
          )}

          {activeTab === 'approvals' && (
            <div className="p-8 text-center text-slate-500">Esta sección ha sido movida a Configuración.</div>
          )}

          {activeTab === 'embed' && (
            <div className="p-8 text-center text-slate-500">Esta sección ha sido movida a Configuración.</div>
          )}

          {activeTab === 'settings' && (
            <SettingsView
              companyName={companyName}
              setCompanyName={setCompanyName}
              manuals={manuals}
              onImportManuals={handleImportManuals}
              onResetManuals={handleResetManuals}
              hasGeminiKey={hasGeminiKey}
              proposals={proposals}
              onApproveProposal={handleApproveProposal}
              onRejectProposal={handleRejectProposal}
              onOpenProposeModal={() => setProposeModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Section Reference Drawer */}
      <ManualDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        manual={drawerManual}
        section={drawerSection}
        onAskAboutSection={handleAskAboutSection}
      />

      {/* Add Manual Modal */}
      <AddManualModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddManual={handleAddManual}
      />

      {/* Propose Knowledge Modal */}
      <ProposeKnowledgeModal
        isOpen={proposeModalOpen}
        onClose={() => setProposeModalOpen(false)}
        onSubmitProposal={handleSubmitProposal}
        manuals={manuals}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-2xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
