import React from 'react';
import {
  MessageCircle,
  BookOpen,
  Search,
  Star,
  Globe,
  Settings
} from 'lucide-react';
import { USER_PROFILE, getUserProfile, RenderAvatar } from '../data/avatars';

interface LeftRailProps {
  activeTab: 'chat' | 'book' | 'explorer' | 'approvals' | 'embed' | 'settings';
  setActiveTab: (tab: 'chat' | 'book' | 'explorer' | 'approvals' | 'embed' | 'settings') => void;
  pendingApprovalsCount: number;
  totalManuals: number;
  loggedUserName?: string;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  loggedUserName,
}) => {
  const profile = getUserProfile(loggedUserName);
  const isFabian = loggedUserName ? loggedUserName.trim().toLowerCase() === 'fabian' : false;

  return (
    <aside className="w-18 sm:w-20 bg-gradient-to-b from-[#ca4048] to-[#992229] flex flex-col items-center py-5 shrink-0 select-none z-20 justify-between">
      {/* Top Profile Avatar */}
      <div className="flex flex-col items-center gap-6">
        <div
          className="relative cursor-pointer group"
          title={isFabian ? "Tu perfil de colaborador" : "Perfil de operador"}
          onClick={() => isFabian && setActiveTab('settings')}
        >
          <div className="w-11 h-11 rounded-full p-0.5 bg-white/30 ring-2 ring-white/60 shadow-md group-hover:ring-white transition-all">
            <RenderAvatar profile={profile} size="md" />
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
                ? 'bg-white text-[#ca4048] shadow-md shadow-black/20 scale-105'
                : 'text-white/80 hover:text-white hover:bg-white/15'
            }`}
            title="Chat con Aizen"
            aria-label="Abrir Chat"
          >
            <MessageCircle className="w-5 h-5 stroke-[2.2]" />
          </button>

          {isFabian && (
            <>
              {/* Book de Manuales Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('book')}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === 'book'
                    ? 'bg-white text-[#ca4048] shadow-md shadow-black/20 scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
                title="Book Oficial de Procedimientos"
                aria-label="Abrir Book de Manuales"
              >
                <BookOpen className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Article Explorer Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('explorer')}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === 'explorer'
                    ? 'bg-white text-[#ca4048] shadow-md shadow-black/20 scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
                title="Buscador de Artículos y Normas"
                aria-label="Buscador Rápido"
              >
                <Search className="w-5 h-5 stroke-[2.2]" />
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Bottom Settings Icon (Fabian only) */}
      <div className="flex flex-col items-center gap-4">
        {isFabian && (
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative ${
              activeTab === 'settings'
                ? 'bg-white text-[#ca4048] shadow-md shadow-black/20 scale-105'
                : 'text-white/80 hover:text-white hover:bg-white/15'
            }`}
            title="Configuración y Aprobaciones"
            aria-label="Configuración"
          >
            <Settings className="w-5 h-5 stroke-[2.2]" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#ca4048] font-bold text-[10px] rounded-full flex items-center justify-center shadow-md animate-bounce">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
