import React from 'react';
import {
  MessageCircle,
  BookOpen,
  Search,
  Star,
  Globe,
  Settings
} from 'lucide-react';
import { USER_PROFILE, RenderAvatar } from '../data/avatars';

interface LeftRailProps {
  activeTab: 'chat' | 'book' | 'explorer' | 'approvals' | 'embed' | 'settings';
  setActiveTab: (tab: 'chat' | 'book' | 'explorer' | 'approvals' | 'embed' | 'settings') => void;
  pendingApprovalsCount: number;
  totalManuals: number;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
}) => {
  return (
    <aside className="w-18 sm:w-20 bg-gradient-to-b from-[#ff7a6e] to-[#fa5252] flex flex-col items-center py-5 shrink-0 select-none z-20 justify-between">
      {/* Top Profile Avatar */}
      <div className="flex flex-col items-center gap-6">
        <div
          className="relative cursor-pointer group"
          title="Tu perfil de colaborador"
          onClick={() => setActiveTab('settings')}
        >
          <div className="w-11 h-11 rounded-full p-0.5 bg-white/40 ring-2 ring-white/60 shadow-md group-hover:ring-white transition-all">
            <RenderAvatar profile={USER_PROFILE} size="md" />
          </div>
        </div>

        {/* Primary Nav Icons */}
        <nav className="flex flex-col items-center gap-4">
          {/* Chat Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-[#fa5252] shadow-md shadow-black/10 scale-105'
                : 'text-white/80 hover:text-white hover:bg-white/15'
            }`}
            title="Chat con ManualBot"
            aria-label="Abrir Chat"
          >
            <MessageCircle className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Book de Manuales Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('book')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'book'
                ? 'bg-white text-[#fa5252] shadow-md shadow-black/10 scale-105'
                : 'text-white/80 hover:text-white hover:bg-white/15'
            }`}
            title="Book Oficial de Manuales"
            aria-label="Book de Manuales"
          >
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Article Explorer Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('explorer')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'explorer'
                ? 'bg-white text-[#fa5252] shadow-md shadow-black/10 scale-105'
                : 'text-white/80 hover:text-white hover:bg-white/15'
            }`}
            title="Buscador de Artículos"
            aria-label="Artículos"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>
        </nav>
      </div>

      {/* Bottom Settings Gear Icon */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            activeTab === 'settings'
              ? 'bg-white text-[#fa5252] shadow-md shadow-black/10 scale-105'
              : 'text-white/80 hover:text-white hover:bg-white/15'
          }`}
          title="Configuración de la Empresa"
          aria-label="Configuración"
        >
          <Settings className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>
    </aside>
  );
};
