import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { ManualDocument } from '../types/manual';
import { LeftRail } from './LeftRail';
import { ChatView } from './ChatView';
import { ManualDrawer } from './ManualDrawer';
import { DEFAULT_USER_THREADS } from '../data/userChatThreads';

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
  const [threads, setThreads] = useState<any[]>(DEFAULT_USER_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>('current-user');
  const [activeTab, setActiveTab] = useState<'chat' | 'book' | 'explorer' | 'settings'>('chat');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (text: string) => { /* logic */ };
  const handleClearChat = () => { /* logic */ };
  const handleOpenCitation = (cit: any) => { /* logic */ };
  const handleOpenSection = (sec: any, man: any) => { /* logic */ };

  return (
    <div className="w-full h-screen max-h-screen bg-[#1a1a1a] text-slate-200 flex overflow-hidden font-sans">
      <LeftRail
        activeTab={activeTab as any}
        setActiveTab={setActiveTab as any}
        pendingApprovalsCount={0}
        totalManuals={manuals.length}
      />
      
      <main className="flex-1 flex overflow-hidden bg-[#242424]">
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
            onOpenProposeModal={() => {}}
            onOpenSection={handleOpenSection}
          />
        )}
        {/* Other tabs can be added similarly */}
      </main>
    </div>
  );
};
