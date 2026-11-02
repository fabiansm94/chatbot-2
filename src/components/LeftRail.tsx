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
    <aside className="w-16 sm:w-18 bg-gradient-to-b from-[#b82733] via-[#941c24] to-[#75141b] flex flex-col items-center py-5 shrink-0 select-none z-20 justify-between border-r border-[#631016]/40">
      {/* Top Profile Avatar */}
      <div className="flex flex-col items-center gap-6">
        <div
          className="relative cursor-pointer group"
          title={isFabian ? "Tu perfil de colaborador" : "Perfil de operador"}
          onClick={() => isFabian && setActiveTab('settings')}
        >
          <div className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-pink-400 to-rose-600 ring-2 ring-white/70 shadow-lg group-hover:scale-105 transition-all flex items-center justify-center text-white font-bold text-xs uppercase">
            {profile.initials || 'US'}
          </div>
        </div>

        {/* Primary Nav Icons */}
        <nav className="flex flex-col items-center gap-4">
          {/* Chat Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[18px] flex items-center justify-center transition-all ${
              activeTab === 'chat'
                ? 'bg-white text-[#b82733] shadow-xl shadow-black/30 scale-105'
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
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[18px] flex items-center justify-center transition-all ${
                  activeTab === 'explorer'
                    ? 'bg-white text-[#b82733] shadow-xl shadow-black/30 scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
                title="Buscador de Artículos y Normas"
                aria-label="Buscador Rápido"
              >
                <Search className="w-5 h-5 stroke-[2.2]" />
              </button>

              {/* Embed / Integration Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('embed')}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[18px] flex items-center justify-center transition-all ${
                  activeTab === 'embed'
                    ? 'bg-white text-[#b82733] shadow-xl shadow-black/30 scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/15'
                }`}
                title="Integrar en tu Web (Código Embed)"
                aria-label="Código Embed"
              >
                <Globe className="w-5 h-5 stroke-[2.2]" />
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
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-[18px] flex items-center justify-center transition-all relative ${
              activeTab === 'settings'
                ? 'bg-white text-[#b82733] shadow-xl shadow-black/30 scale-105'
                : 'text-white/80 hover:text-white hover:bg-white/15'
            }`}
            title="Configuración y Aprobaciones"
            aria-label="Configuración"
          >
            <Settings className="w-5 h-5 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#b82733] font-bold text-[10px] rounded-full flex items-center justify-center shadow-md">
              {pendingApprovalsCount > 0 ? pendingApprovalsCount : '2'}
            </span>
          </button>
        )}
      </div>
    </aside>
  );
};
