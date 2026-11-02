import React from 'react';

interface RobotMascotProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

export const RobotMascot: React.FC<RobotMascotProps> = ({
  size = 'md',
  className = '',
  showGlow = true
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const dim = sizeMap[size];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${dim} ${className}`}>
      {showGlow && (
        <div className="absolute inset-0 rounded-full bg-rose-400/20 blur-md pointer-events-none" />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md select-none"
      >
        <defs>
          {/* Head & Body Glossy Ceramic Gradient */}
          <linearGradient id="robotBodyGrad" x1="20" y1="10" x2="80" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fdf8f8" />
            <stop offset="85%" stopColor="#f2dede" />
            <stop offset="100%" stopColor="#e5c8c8" />
          </linearGradient>

          {/* Screen Visor Gradient */}
          <linearGradient id="visorGrad" x1="50" y1="32" x2="50" y2="65" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2c1a1e" />
            <stop offset="100%" stopColor="#150a0d" />
          </linearGradient>

          {/* Eye Glow Gradient */}
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffb3ba" />
            <stop offset="60%" stopColor="#ff8591" />
            <stop offset="100%" stopColor="#ff5264" />
          </radialGradient>

          {/* Antenna Glow */}
          <radialGradient id="antennaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#ff7a8a" />
            <stop offset="100%" stopColor="#d93848" />
          </radialGradient>

          {/* Cheek Blush */}
          <radialGradient id="blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff6b7b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ff6b7b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Antenna */}
        <line x1="50" y1="18" x2="50" y2="8" stroke="#d5bebe" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="7" r="4.5" fill="url(#antennaGlow)" />
        <circle cx="48.5" cy="5.5" r="1.5" fill="#ffffff" />

        {/* Ears / Side Nodes */}
        <rect x="14" y="38" width="6" height="14" rx="3" fill="#e5c8c8" />
        <rect x="80" y="38" width="6" height="14" rx="3" fill="#e5c8c8" />

        {/* Body / Shoulders */}
        <ellipse cx="50" cy="85" rx="26" ry="14" fill="url(#robotBodyGrad)" />
        <path d="M32 80 Q50 88 68 80" stroke="#ffb3ba" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

        {/* Head Dome */}
        <rect x="18" y="16" width="64" height="54" rx="26" fill="url(#robotBodyGrad)" />
        {/* Soft top highlight */}
        <ellipse cx="44" cy="22" rx="16" ry="4" fill="#ffffff" opacity="0.8" />

        {/* Visor Screen */}
        <rect x="25" y="27" width="50" height="32" rx="14" fill="url(#visorGrad)" stroke="#eedcdc" strokeWidth="1" />

        {/* Visor Top Glass Reflection */}
        <path
          d="M27 34 Q50 30 73 34 C72 31 68 29 60 29 L40 29 C32 29 28 31 27 34 Z"
          fill="#ffffff"
          opacity="0.15"
        />

        {/* Left Eye */}
        <ellipse cx="40" cy="42" rx="5.5" ry="6.5" fill="url(#eyeGlow)" />
        <circle cx="38" cy="39.5" r="2" fill="#ffffff" />
        <circle cx="42" cy="44.5" r="1" fill="#ffffff" opacity="0.8" />

        {/* Right Eye */}
        <ellipse cx="60" cy="42" rx="5.5" ry="6.5" fill="url(#eyeGlow)" />
        <circle cx="58" cy="39.5" r="2" fill="#ffffff" />
        <circle cx="62" cy="44.5" r="1" fill="#ffffff" opacity="0.8" />

        {/* Cheeks */}
        <ellipse cx="33" cy="48" rx="4" ry="2.5" fill="url(#blush)" />
        <ellipse cx="67" cy="48" rx="4" ry="2.5" fill="url(#blush)" />

        {/* Happy Smiling Mouth */}
        <path
          d="M45 49 Q50 53 55 49"
          stroke="#ff949f"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};
