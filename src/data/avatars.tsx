import React from 'react';

export interface AvatarProfile {
  id: string;
  name: string;
  department: string;
  role: string;
  color: string;
  bgGradient: string;
  initials: string;
  avatarUrl?: string;
}

export const USER_PROFILE: AvatarProfile = {
  id: 'current-user',
  name: 'Tú',
  department: 'Colaborador',
  role: 'Empleado',
  color: '#fa5252',
  bgGradient: 'from-amber-400 via-rose-500 to-red-500',
  initials: 'TU'
};

export const BOT_PROFILE: AvatarProfile = {
  id: 'manualbot',
  name: 'ManualBot',
  department: 'Asistente IA',
  role: 'Compañero Oficial',
  color: '#ff6b6b',
  bgGradient: 'from-[#ff7a6e] to-[#fa5252]',
  initials: 'MB',
  avatarUrl: '/assets/aistudio/Minimal_White_Mascot_Face_Icon_40e4f488.png'
};

export const DEPARTMENT_PROFILES: Record<string, AvatarProfile> = {
  'man-rrhh-01': {
    id: 'man-rrhh-01',
    name: 'Gestión de Personas & RRHH',
    department: 'Recursos Humanos',
    role: 'Marianne Miu',
    color: '#f06595',
    bgGradient: 'from-pink-400 to-rose-500',
    initials: 'MM'
  },
  'man-ti-02': {
    id: 'man-ti-02',
    name: 'Ciberseguridad & TI',
    department: 'Sistemas & TI',
    role: 'Tommy Chen',
    color: '#339af0',
    bgGradient: 'from-sky-400 to-blue-600',
    initials: 'TC'
  },
  'man-sst-03': {
    id: 'man-sst-03',
    name: 'Seguridad y Salud (SST)',
    department: 'Prevención de Riesgos',
    role: 'Eliza Stone',
    color: '#20c997',
    bgGradient: 'from-emerald-400 to-teal-600',
    initials: 'ES'
  },
  'man-eth-04': {
    id: 'man-eth-04',
    name: 'Código de Ética & Conducta',
    department: 'Cumplimiento Legal',
    role: 'Michael Smith',
    color: '#cc5de8',
    bgGradient: 'from-purple-400 to-indigo-600',
    initials: 'MS'
  },
  'man-ops-05': {
    id: 'man-ops-05',
    name: 'Viáticos & Finanzas',
    department: 'Administración & Finanzas',
    role: 'Frances Ford',
    color: '#ff922b',
    bgGradient: 'from-amber-400 to-orange-500',
    initials: 'FF'
  }
};

export const RenderAvatar: React.FC<{
  profile: AvatarProfile;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showStatus?: boolean;
}> = ({ profile, size = 'md', className = '', showStatus = false }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs font-semibold',
    lg: 'w-12 h-12 text-sm font-bold'
  };

  return (
    <div className={`relative shrink-0 ${className}`}>
      {profile.avatarUrl ? (
        <div
          className={`${sizeClasses[size]} rounded-full bg-white ring-2 ring-rose-200/80 shadow-2xs flex items-center justify-center overflow-hidden p-0.5`}
        >
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr ${profile.bgGradient} p-0.5 shadow-xs flex items-center justify-center text-white`}
        >
          <div className="w-full h-full rounded-full bg-slate-900/10 flex items-center justify-center font-bold tracking-tight">
            {profile.initials}
          </div>
        </div>
      )}
      {showStatus && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
      )}
    </div>
  );
};
