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
    xs: 'w-8 h-8',
    sm: 'w-10 h-10 sm:w-11 sm:h-11',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  };

  const dim = sizeMap[size];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${dim} ${className}`}>
      {showGlow && (
        <div className="absolute inset-0 rounded-full bg-rose-400/20 blur-md pointer-events-none" />
      )}
      <img
        src="/assets/aistudio/bot_avatar_custom.png"
        alt="AI-zen"
        className="w-full h-full object-contain scale-125 drop-shadow-md select-none"
      />
    </div>
  );
};
