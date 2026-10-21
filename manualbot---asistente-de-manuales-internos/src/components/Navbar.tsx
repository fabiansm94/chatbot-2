import React from 'react';
import {
  Bot,
  BookOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Building2,
  Globe,
  Clock
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'chat' | 'book' | 'explorer' | 'approvals' | 'embed' | 'settings';
  setActiveTab: (tab: 'chat' | 'book' | 'explorer' | 'approvals' | 'embed' | 'settings') => void;
  companyName: string;
  totalManuals: number;
  totalArticles: number;
  pendingApprovalsCount: number;
  hasGeminiKey: boolean;
  onOpenProposeModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  companyName,
  totalManuals,
  totalArticles,
  pendingApprovalsCount,
  hasGeminiKey,
  onOpenProposeModal
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">ManualBot</span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Book v3
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Building2 className="w-2.5 h-2.5 text-slate-500 hidden sm:inline" />
                <span className="truncate max-w-[110px] sm:max-w-xs">{companyName}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('book')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'book'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Book</span>
              <span className="text-[10px] px-1 rounded-full bg-slate-800 text-slate-300">
                {totalManuals}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'explorer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Artículos</span>
              <span className="sm:hidden">Buscar</span>
              <span className="text-[10px] px-1 rounded-full bg-slate-800 text-slate-300">
                {totalArticles}
              </span>
            </button>

            {/* Aprobaciones Tab */}
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 relative ${
                activeTab === 'approvals'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Aprobaciones</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('embed')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'embed'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Integrar en Web</span>
              <span className="md:hidden">Integrar</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Configuración"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </nav>

          {/* Quick Enseñar al Asistente Button */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={onOpenProposeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Enseñar al Bot</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
