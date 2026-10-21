import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
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
import { DEFAULT_MANUALS } from './data/defaultManuals';
import { DEFAULT_PROPOSALS } from './data/defaultProposals';
import { ChatMessage, Citation, ManualDocument, ManualSection, KnowledgeProposal } from './types/manual';
import { approveProposal, rejectProposal } from './utils/approvalWorkflow';

const STORAGE_KEY_MANUALS = 'manualbot_company_manuals_v1';
const STORAGE_KEY_COMPANY = 'manualbot_company_name_v1';
const STORAGE_KEY_CHAT = 'manualbot_chat_history_v1';
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

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved chat');
    }
    return [];
  });

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
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
    } catch (e) {
      console.warn('LocalStorage save failed for chat');
    }
  }, [messages]);

  const handleSendMessage = async (text: string, tone: 'direct' | 'detailed' | 'steps') => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(-6),
          manuals,
          tone,
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
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Hubo un inconveniente temporal de comunicación. He recurrido a la base interna local de manuales. Por favor intenta reformular tu pregunta.',
        timestamp: Date.now(),
        error: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
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

    // Fallback if exact match wasn't found in current state
    if (foundManual && foundManual.sections.length > 0) {
      setDrawerManual(foundManual);
      setDrawerSection(foundManual.sections[0]);
      setDrawerOpen(true);
    }
  };

  const handleAskAboutSection = (section: ManualSection, manual: ManualDocument) => {
    const query = `¿Qué requisitos, plazos o pasos debo tener en cuenta según el ${section.articleNumber} ("${section.title}") del ${manual.title}?`;
    setActiveTab('chat');
    handleSendMessage(query, 'direct');
  };

  const handleAskAboutManual = (manual: ManualDocument) => {
    const query = `¿Cuáles son los temas, derechos y obligaciones principales que contempla el ${manual.title} (${manual.code})?`;
    setActiveTab('chat');
    handleSendMessage(query, 'direct');
  };

  const handleAddManual = (newManual: ManualDocument) => {
    setManuals(prev => [newManual, ...prev]);
  };

  const handleResetManuals = () => {
    if (window.confirm('¿Deseas restablecer el Book a los manuales corporativos estándar?')) {
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

  const handleSubmitProposal = (newProp: KnowledgeProposal) => {
    setProposals(prev => [newProp, ...prev]);
    alert('¡Propuesta enviada con éxito! Está en el Buzón de Aprobaciones a la espera de autorización.');
  };

  const handleApproveProposal = (prop: KnowledgeProposal, approverName: string) => {
    const { updatedManuals, approvedProposal } = approveProposal(prop, manuals, approverName);
    setManuals(updatedManuals);
    setProposals(prev => prev.map(p => (p.id === prop.id ? approvedProposal : p)));
    alert(`¡Aprobado! El procedimiento "${prop.title}" ha sido incorporado al Book oficial y el Asistente ya lo puede responder.`);
  };

  const handleRejectProposal = (prop: KnowledgeProposal, reason: string, approverName: string) => {
    const rejected = rejectProposal(prop, reason, approverName);
    setProposals(prev => prev.map(p => (p.id === prop.id ? rejected : p)));
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        companyName={companyName}
        totalManuals={manuals.length}
        totalArticles={totalArticles}
        pendingApprovalsCount={pendingApprovalsCount}
        hasGeminiKey={hasGeminiKey}
        onOpenProposeModal={() => setProposeModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onOpenCitation={handleOpenCitation}
            companyName={companyName}
            hasGeminiKey={hasGeminiKey}
            manuals={manuals}
            onOpenProposeModal={() => setProposeModalOpen(true)}
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
          <ApprovalsView
            proposals={proposals}
            onApprove={handleApproveProposal}
            onReject={handleRejectProposal}
            onOpenProposeModal={() => setProposeModalOpen(true)}
          />
        )}

        {activeTab === 'embed' && (
          <EmbedIntegrationView
            companyName={companyName}
            manuals={manuals}
            hasGeminiKey={hasGeminiKey}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            companyName={companyName}
            setCompanyName={setCompanyName}
            manuals={manuals}
            onImportManuals={handleImportManuals}
            onResetManuals={handleResetManuals}
            hasGeminiKey={hasGeminiKey}
          />
        )}
      </main>

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
    </div>
  );
}
