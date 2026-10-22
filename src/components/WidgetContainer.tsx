import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { ManualDocument, ManualSection, ChatMessage, Citation, UserChatThread, KnowledgeProposal } from '../types/manual';
import { LeftRail } from './LeftRail';
import { ChatView } from './ChatView';
import { ManualsBookView } from './ManualsBookView';
import { ArticleExplorerView } from './ArticleExplorerView';
import { SettingsView } from './SettingsView';
import { ManualDrawer } from './ManualDrawer';
import { AddManualModal } from './AddManualModal';
import { ProposeKnowledgeModal } from './ProposeKnowledgeModal';
import { LoginModal } from './LoginModal';
import { DEFAULT_MANUALS } from '../data/defaultManuals';
import { DEFAULT_PROPOSALS } from '../data/defaultProposals';
import { DEFAULT_USER_THREADS, appendUserMessage } from '../data/userChatThreads';
import { approveProposal, rejectProposal } from '../utils/approvalWorkflow';

interface WidgetContainerProps {
  companyName: string;
  manuals: ManualDocument[];
  hasGeminiKey: boolean;
  primaryColor?: string;
}

const STORAGE_KEY_MANUALS = 'manualbot_widget_company_manuals_v1';
const STORAGE_KEY_COMPANY = 'manualbot_widget_company_name_v1';
const STORAGE_KEY_PROPOSALS = 'manualbot_widget_proposals_v1';

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  companyName: initialCompanyName,
  manuals: initialManuals,
  hasGeminiKey
}) => {
  const [manuals, setManuals] = useState<ManualDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MANUALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return initialManuals.length > 0 ? initialManuals : DEFAULT_MANUALS;
  });

  const [proposals, setProposals] = useState<KnowledgeProposal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROPOSALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PROPOSALS;
  });

  const [companyName, setCompanyName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_COMPANY) || initialCompanyName || 'Global Corp & Partners';
  });

  const [threads, setThreads] = useState<UserChatThread[]>(() => {
    try {
      const saved = localStorage.getItem('manualbot_widget_threads_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_USER_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>('current-user');
  const [activeTab, setActiveTab] = useState<'chat' | 'book' | 'explorer' | 'settings'>('chat');
  const [isLoading, setIsLoading] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [station, setStation] = useState<'Estación 1' | 'Estación 2' | null>(null);
  const [loggedUserName, setLoggedUserName] = useState<string>(() => {
    return localStorage.getItem('manualbot_widget_logged_user_v1') || '';
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
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (station: 'Estación 1' | 'Estación 2', userName: string) => {
    setStation(station);
    setIsAuthenticated(true);
    setShowLoginModal(false);
    setLoggedUserName(userName);
    localStorage.setItem('manualbot_widget_logged_user_v1', userName);
    const isFab = userName.trim().toLowerCase() === 'fabian';
    if (!isFab) {
      setActiveTab('chat');
    }
  };

  // Drawer & Modal state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerManual, setDrawerManual] = useState<ManualDocument | null>(null);
  const [drawerSection, setDrawerSection] = useState<ManualSection | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    try {
      localStorage.setItem('manualbot_widget_threads_v3', JSON.stringify(threads));
    } catch (e) {}
  }, [threads]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MANUALS, JSON.stringify(manuals));
    } catch (e) {}
  }, [manuals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROPOSALS, JSON.stringify(proposals));
    } catch (e) {}
  }, [proposals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COMPANY, companyName);
    } catch (e) {}
  }, [companyName]);

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
    if (window.confirm('¿Deseas restablecer el Book a los Procedimientos estándar?')) {
      setManuals(DEFAULT_MANUALS);
      localStorage.removeItem(STORAGE_KEY_MANUALS);
    }
  };

  const handleImportManuals = (imported: ManualDocument[]) => {
    setManuals(imported);
  };

  const handleSubmitProposal = (newProp: KnowledgeProposal) => {
    setProposals(prev => [newProp, ...prev]);
    showToast('¡Propuesta enviada con éxito!');
  };

  const handleApproveProposal = (prop: KnowledgeProposal, approverName: string) => {
    const { updatedManuals, approvedProposal } = approveProposal(prop, manuals, approverName);
    setManuals(updatedManuals);
    setProposals(prev => prev.map(p => (p.id === prop.id ? approvedProposal : p)));
    showToast(`¡Aprobado! El procedimiento "${prop.title}" ha sido incorporado.`);
  };

  const handleRejectProposal = (prop: KnowledgeProposal, reason: string, approverName: string) => {
    const rejected = rejectProposal(prop, reason, approverName);
    setProposals(prev => prev.map(p => (p.id === prop.id ? rejected : p)));
    showToast(`Procedimiento rechazado.`);
  };

  const pendingApprovalsCount = proposals.filter(p => p.status === 'pending').length;

  return (
    <div className="w-full h-screen max-h-screen bg-[#1a1a1a] text-slate-200 flex overflow-hidden font-sans">
      {showLoginModal && <LoginModal onLogin={handleLogin} />}

      <LeftRail
        activeTab={activeTab as any}
        setActiveTab={setActiveTab as any}
        pendingApprovalsCount={pendingApprovalsCount}
        totalManuals={manuals.length}
        loggedUserName={loggedUserName}
      />
      
      <main className="flex-1 flex overflow-hidden bg-[#242424] w-full h-full">
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
          />
        )}

        {isFabian && activeTab === 'book' && (
          <ManualsBookView
            manuals={manuals}
            onOpenSection={handleOpenSection}
            onOpenAddModal={() => setAddModalOpen(true)}
            onResetManuals={handleResetManuals}
            onAskAboutManual={handleAskAboutManual}
          />
        )}

        {isFabian && activeTab === 'explorer' && (
          <ArticleExplorerView
            manuals={manuals}
            onOpenSection={handleOpenSection}
            onAskAboutSection={handleAskAboutSection}
          />
        )}

        {isFabian && activeTab === 'settings' && (
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

      <ManualDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        manual={drawerManual}
        section={drawerSection}
        onAskAboutSection={(section, manual) => {
          setDrawerOpen(false);
          setActiveTab('chat');
          handleSendMessage(`¿Qué requisitos, plazos o pasos debo tener en cuenta según el ${section.articleNumber} ("${section.title}") del ${manual.title}?`);
        }}
      />

      <AddManualModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddManual={handleAddManual}
      />

      <ProposeKnowledgeModal
        isOpen={proposeModalOpen}
        onClose={() => setProposeModalOpen(false)}
        onSubmitProposal={handleSubmitProposal}
        manuals={manuals}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-2xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
