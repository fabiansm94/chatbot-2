import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
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

export default function App() {
  const isWidgetMode = typeof window !== 'undefined' && window.location.search.includes('mode=widget');

  const [activeTab, setActiveTab] = useState<'chat' | 'book' | 'explorer' | 'approvals' | 'embed' | 'settings'>('chat');
  const [manuals, setManuals] = useState<ManualDocument[]>(DEFAULT_MANUALS);
  const [proposals, setProposals] = useState<KnowledgeProposal[]>(DEFAULT_PROPOSALS);
  const [companyName, setCompanyName] = useState<string>('Global Corp & Partners');
  const [threads, setThreads] = useState<UserChatThread[]>(DEFAULT_USER_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>('current-user');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerManual, setDrawerManual] = useState<ManualDocument | null>(null);
  const [drawerSection, setDrawerSection] = useState<ManualSection | null>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalInitialFile, setAddModalInitialFile] = useState<File | null>(null);
  const [addModalDefaultTab, setAddModalDefaultTab] = useState<'upload' | 'manual'>('upload');
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenUploadModal = () => {
    setAddModalInitialFile(null);
    setAddModalDefaultTab('upload');
    setAddModalOpen(true);
  };

  const handleUploadFileDirectly = (file: File) => {
    setAddModalInitialFile(file);
    setAddModalDefaultTab('upload');
    setAddModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('manualbot_auth_v1') === 'true');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [station, setStation] = useState<'Estación 1' | 'Estación 2' | null>(null);
  const [loggedUserName, setLoggedUserName] = useState<string>(() => {
    return localStorage.getItem('manualbot_logged_user_name_v1') || '';
  });

  const isFabian = loggedUserName.trim().toLowerCase() === 'fabian';

  // Load from Firebase Firestore on mount
  useEffect(() => {
    // 1. Load Manuals (Check if seeded or deleted)
    Promise.all([
      getDocs(collection(db, 'manuals')),
      getDoc(doc(db, 'system_meta', 'manuals_meta'))
    ])
      .then(([snapshot, metaSnap]) => {
        const metaData = metaSnap.exists() ? metaSnap.data() : null;
        const deletedManualIds: string[] = metaData?.deletedManualIds || [];
        const isSeeded = metaData?.isSeeded || false;

        if (!snapshot.empty) {
          const loadedManuals: ManualDocument[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as ManualDocument;
            if (!deletedManualIds.includes(data.id)) {
              loadedManuals.push(data);
            }
          });
          setManuals(loadedManuals);
        } else if (!isSeeded) {
          // First time seeding defaults only if never initialized
          setDoc(doc(db, 'system_meta', 'manuals_meta'), {
            isSeeded: true,
            deletedManualIds: []
          }).catch(console.warn);

          DEFAULT_MANUALS.forEach(m => {
            setDoc(doc(db, 'manuals', m.id), m).catch(console.warn);
          });
          setManuals(DEFAULT_MANUALS);
        } else {
          // If already seeded and collection is empty, user deleted all manuals
          setManuals([]);
        }
      })
      .catch(err => {
        console.warn('Error loading manuals from Firestore:', err);
        // Fallback to local storage if offline
        const deletedIds = JSON.parse(localStorage.getItem('manualbot_deleted_manual_ids_v1') || '[]');
        setManuals(prev => prev.filter(m => !deletedIds.includes(m.id)));
      });

    // 2. Load Proposals
    getDocs(collection(db, 'proposals'))
      .then(snapshot => {
        if (!snapshot.empty) {
          const loadedProps: KnowledgeProposal[] = [];
          snapshot.forEach(docSnap => {
            loadedProps.push(docSnap.data() as KnowledgeProposal);
          });
          setProposals(loadedProps);
        } else {
          DEFAULT_PROPOSALS.forEach(p => {
            setDoc(doc(db, 'proposals', p.id), p).catch(console.warn);
          });
        }
      })
      .catch(err => console.warn('Error loading proposals from Firestore:', err));

    // 3. Load Chat Threads
    getDocs(collection(db, 'chats'))
      .then(snapshot => {
        if (!snapshot.empty) {
          const loadedThreads: UserChatThread[] = [];
          snapshot.forEach(docSnap => {
            loadedThreads.push(docSnap.data() as UserChatThread);
          });
          setThreads(loadedThreads);
        } else {
          DEFAULT_USER_THREADS.forEach(t => {
            setDoc(doc(db, 'chats', t.userId), t).catch(console.warn);
          });
        }
      })
      .catch(err => console.warn('Error loading chats from Firestore:', err));

    // Status check
    fetch('/api/status')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data.hasGeminiKey === 'boolean') {
          setHasGeminiKey(data.hasGeminiKey);
        }
      })
      .catch(err => console.warn('Could not contact /api/status:', err));
  }, []);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const h = now.getHours();
      if ((h === 6 || h === 14 || h === 22) && now.getMinutes() === 0) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        localStorage.setItem('manualbot_auth_v1', 'false');
      }
    };
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) setShowLoginModal(true);
  }, []);

  useEffect(() => {
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
    localStorage.setItem('manualbot_auth_v1', 'true');
    if (userName.trim().toLowerCase() !== 'fabian') {
      setActiveTab('chat');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLoginModal(true);
    setLoggedUserName('');
    localStorage.removeItem('manualbot_logged_user_name_v1');
    localStorage.setItem('manualbot_auth_v1', 'false');
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

    const updatedThreads = appendUserMessage(threads, 'current-user', userMsg);
    setThreads(updatedThreads);
    
    // Save current user thread to Firestore
    const updatedUserThread = updatedThreads.find(t => t.isCurrentUser);
    if (updatedUserThread) {
      setDoc(doc(db, 'chats', updatedUserThread.userId), updatedUserThread).catch(console.warn);
    }

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

      const finalThreads = appendUserMessage(updatedThreads, 'current-user', assistantMsg);
      setThreads(finalThreads);

      const finalUserThread = finalThreads.find(t => t.isCurrentUser);
      if (finalUserThread) {
        setDoc(doc(db, 'chats', finalUserThread.userId), finalUserThread).catch(console.warn);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'Hubo un inconveniente temporal de comunicación. He recurrido a la base interna local de manuales. Por favor intenta reformular tu pregunta.',
        timestamp: Date.now(),
        error: true
      };
      const finalThreads = appendUserMessage(updatedThreads, 'current-user', errorMsg);
      setThreads(finalThreads);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    const cleared = threads.map(t => (t.isCurrentUser ? { ...t, messages: [] } : t));
    setThreads(cleared);
    const currentUserThread = cleared.find(t => t.isCurrentUser);
    if (currentUserThread) {
      setDoc(doc(db, 'chats', currentUserThread.userId), currentUserThread).catch(console.warn);
    }
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
    setDoc(doc(db, 'manuals', newManual.id), newManual).catch(console.warn);
    showToast('Manual guardado en Firebase.');
  };

  const handleDeleteManual = async (manualId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este manual/procedimiento permanentemente?')) {
      // 1. Remove from state immediately
      setManuals(prev => prev.filter(m => m.id !== manualId));

      // 2. Track deleted ID in localStorage
      try {
        const deletedIds = JSON.parse(localStorage.getItem('manualbot_deleted_manual_ids_v1') || '[]');
        if (!deletedIds.includes(manualId)) {
          deletedIds.push(manualId);
          localStorage.setItem('manualbot_deleted_manual_ids_v1', JSON.stringify(deletedIds));
        }
      } catch (e) {}

      // 3. Delete document from Firestore
      try {
        await deleteDoc(doc(db, 'manuals', manualId));
      } catch (err) {
        console.warn('Error deleting doc from Firestore:', err);
      }

      // 4. Update system_meta to permanently record the deletion so seeding never re-adds it
      try {
        await setDoc(doc(db, 'system_meta', 'manuals_meta'), {
          isSeeded: true,
          deletedManualIds: arrayUnion(manualId)
        }, { merge: true });
      } catch (err) {
        console.warn('Error updating manuals_meta in Firestore:', err);
      }

      showToast('Manual eliminado permanentemente.');
    }
  };

  const handleResetManuals = async () => {
    if (window.confirm('¿Deseas restablecer el Book a los Procedimientos estándar?')) {
      setManuals(DEFAULT_MANUALS);
      localStorage.removeItem('manualbot_deleted_manual_ids_v1');

      // Clear deletedManualIds in Firestore
      try {
        await setDoc(doc(db, 'system_meta', 'manuals_meta'), {
          isSeeded: true,
          deletedManualIds: []
        });
      } catch (e) {}

      DEFAULT_MANUALS.forEach(m => {
        setDoc(doc(db, 'manuals', m.id), m).catch(console.warn);
      });
      showToast('Manuales restablecidos.');
    }
  };

  const handleImportManuals = (imported: ManualDocument[]) => {
    setManuals(imported);
    imported.forEach(m => {
      setDoc(doc(db, 'manuals', m.id), m).catch(console.warn);
    });
  };

  const handleSubmitProposal = (newProp: KnowledgeProposal) => {
    setProposals(prev => [newProp, ...prev]);
    setDoc(doc(db, 'proposals', newProp.id), newProp).catch(console.warn);
    showToast('¡Propuesta enviada con éxito! Está en el Buzón de Aprobaciones.');
  };

  const handleApproveProposal = (prop: KnowledgeProposal, approverName: string) => {
    const { updatedManuals, approvedProposal } = approveProposal(prop, manuals, approverName);
    setManuals(updatedManuals);
    setProposals(prev => prev.map(p => (p.id === prop.id ? approvedProposal : p)));
    setDoc(doc(db, 'manuals', approvedProposal.id || 'man-prop-' + Date.now()), updatedManuals[0]).catch(console.warn);
    setDoc(doc(db, 'proposals', prop.id), approvedProposal).catch(console.warn);
    showToast(`¡Aprobado! El procedimiento "${prop.title}" ha sido incorporado al Book oficial.`);
  };

  const handleRejectProposal = (prop: KnowledgeProposal, reason: string, approverName: string) => {
    const rejected = rejectProposal(prop, reason, approverName);
    setProposals(prev => prev.map(p => (p.id === prop.id ? rejected : p)));
    setDoc(doc(db, 'proposals', prop.id), rejected).catch(console.warn);
    showToast(`Procedimiento rechazado.`);
  };

  const pendingApprovalsCount = proposals.filter(p => p.status === 'pending').length;

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
    <div className="min-h-screen bg-[#2f3140] text-white p-2 sm:p-4 lg:p-6 flex items-center justify-center font-sans antialiased">
      {showLoginModal && <LoginModal onLogin={handleLogin} />}

      <div className="w-full max-w-7xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] bg-[#262835] rounded-[24px] sm:rounded-[32px] shadow-2xl overflow-hidden flex border border-[#3e4153]">
        {isFabian && (
          <LeftRail
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pendingApprovalsCount={pendingApprovalsCount}
            totalManuals={manuals.length}
            loggedUserName={loggedUserName}
          />
        )}

        <main className="flex-1 flex overflow-hidden bg-[#262835] min-w-0 min-h-0 h-full">
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

          {isFabian && activeTab === 'book' && (
            <ManualsBookView
              manuals={manuals}
              onOpenSection={handleOpenSection}
              onOpenAddModal={() => {
                setAddModalInitialFile(null);
                setAddModalDefaultTab('manual');
                setAddModalOpen(true);
              }}
              onOpenUploadModal={handleOpenUploadModal}
              onUploadFile={handleUploadFileDirectly}
              onResetManuals={handleResetManuals}
              onAskAboutManual={handleAskAboutManual}
              onDeleteManual={handleDeleteManual}
            />
          )}

          {isFabian && activeTab === 'explorer' && (
            <ArticleExplorerView
              manuals={manuals}
              onOpenSection={handleOpenSection}
              onAskAboutSection={handleAskAboutSection}
            />
          )}

          {isFabian && activeTab === 'approvals' && (
            <ApprovalsView
              proposals={proposals}
              onApprove={handleApproveProposal}
              onReject={handleRejectProposal}
              onOpenProposeModal={() => setProposeModalOpen(true)}
            />
          )}

          {isFabian && activeTab === 'embed' && (
            <EmbedIntegrationView
              companyName={companyName}
              manuals={manuals}
              hasGeminiKey={hasGeminiKey}
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
      </div>

      <ManualDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        manual={drawerManual}
        section={drawerSection}
        onAskAboutSection={handleAskAboutSection}
      />

      <AddManualModal
        isOpen={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setAddModalInitialFile(null);
        }}
        onAddManual={handleAddManual}
        initialFile={addModalInitialFile}
        defaultTab={addModalDefaultTab}
      />

      <ProposeKnowledgeModal
        isOpen={proposeModalOpen}
        onClose={() => setProposeModalOpen(false)}
        onSubmitProposal={handleSubmitProposal}
        manuals={manuals}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#2f3140] border border-[#ca4048] shadow-2xl text-xs text-white flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#ca4048] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
