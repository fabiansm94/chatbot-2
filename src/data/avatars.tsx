import React from 'react';

export interface AvatarProfile {
  id: string;
  name: string;
  department: string;
  role: string;
  color: string;
  bgGradient?: string;
  bgColor?: string;
  textColor?: string;
  initials: string;
  avatarUrl?: string;
}

export const USER_PROFILE: AvatarProfile = {
  id: 'current-user',
  name: 'Tú',
  department: 'Colaborador',
  role: 'Empleado',
  color: '#2563eb',
  bgColor: '#2563eb',
  textColor: '#ffffff',
  initials: 'TU'
};

export const BOT_PROFILE: AvatarProfile = {
  id: 'aizen',
  name: 'Aizen',
  department: 'Asistente IA',
  role: 'Compañero Oficial',
  color: '#ff6b6b',
  bgGradient: 'from-[#ff7a6e] to-[#fa5252]',
  initials: 'AZ',
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

const USER_COLORS: Record<string, { bg: string; text: string }> = {
  angelo: { bg: '#2563eb', text: '#ffffff' }, // Blue
  anthony: { bg: '#059669', text: '#ffffff' }, // Emerald
  emmanuel: { bg: '#7c3aed', text: '#ffffff' }, // Violet
  fabian: { bg: '#db2777', text: '#ffffff' }, // Pink
  froylan: { bg: '#ea580c', text: '#ffffff' }, // Orange
  jeremy: { bg: '#0284c7', text: '#ffffff' }, // Sky
  'juan carlos': { bg: '#16a34a', text: '#ffffff' }, // Green
  kendal: { bg: '#9333ea', text: '#ffffff' }, // Purple
  kevin: { bg: '#dc2626', text: '#ffffff' }, // Red
  soporte: { bg: '#4f46e5', text: '#ffffff' }, // Indigo
  sebastian: { bg: '#0d9488', text: '#ffffff' } // Teal
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

  const isBot = profile.id === 'aizen';

  return (
    <div className={`relative shrink-0 ${className}`}>
      {profile.avatarUrl ? (
        isBot ? (
          <div className={`${sizeClasses[size]} flex items-center justify-center overflow-hidden`}>
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div
            className={`${sizeClasses[size]} rounded-full bg-white ring-2 ring-rose-200/80 shadow-2xs flex items-center justify-center overflow-hidden p-0.5`}
          >
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        )
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full shadow-xs flex items-center justify-center font-bold tracking-tight`}
          style={{
            backgroundColor: profile.bgColor || '#334155',
            color: profile.textColor || '#ffffff'
          }}
        >
          {profile.initials}
        </div>
      )}
      {showStatus && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
      )}
    </div>
  );
};

export function getUserProfile(loggedUserName?: string): AvatarProfile {
  if (!loggedUserName) return USER_PROFILE;
  const name = loggedUserName.trim();
  const lowerName = name.toLowerCase();
  const parts = name.split(/\s+/);
  let initials = 'U';
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (name.length >= 2) {
    initials = name.slice(0, 2).toUpperCase();
  } else {
    initials = name.toUpperCase();
  }

  const colorConfig = USER_COLORS[lowerName] || { bg: '#334155', text: '#ffffff' };

  return {
    id: 'current-user',
    name: name.charAt(0).toUpperCase() + name.slice(1),
    department: 'Colaborador',
    role: 'Empleado',
    color: colorConfig.bg,
    bgColor: colorConfig.bg,
    textColor: colorConfig.text,
    initials
  };
}
