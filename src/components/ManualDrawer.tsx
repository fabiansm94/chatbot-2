import React, { useState } from 'react';
import { X, BookOpen, Check, Copy, MessageSquare } from 'lucide-react';
import { ManualDocument, ManualSection } from '../types/manual';
import { FormattedContent } from './FormattedContent';

interface ManualDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  manual: ManualDocument | null;
  section: ManualSection | null;
  onAskAboutSection?: (section: ManualSection, manual: ManualDocument) => void;
}

export const ManualDrawer: React.FC<ManualDrawerProps> = ({
  isOpen,
  onClose,
  manual,
  section,
  onAskAboutSection
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !manual || !section) return null;

  const fullContent =
    section.content ||
    manual.summary ||
    manual.sections?.map(s => s.content).join('\n\n') ||
    manual.description ||
    '';

  const handleCopy = () => {
    const textToCopy = `[${manual.code} - ${manual.title}]\n\n${fullContent}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl h-full bg-[#2f3140] border-l border-[#3e4153] shadow-2xl flex flex-col z-10 overflow-hidden text-white">
        {/* Header */}
        <div className="p-5 border-b border-[#3e4153] bg-[#262835] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#ca4048]/20 text-[#ca4048] border border-[#ca4048]/30">
                {manual.code}
              </span>
              {manual.updatedDate && (
                <span className="text-xs text-slate-400">
                  Actualizado: {manual.updatedDate}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#ca4048] shrink-0" />
              <span>{manual.title}</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#3e4153] transition-colors cursor-pointer"
            aria-label="Cerrar panel de manual"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Información del Manual
            </h3>
            <div className="p-5 rounded-xl bg-[#262835] border border-[#3e4153] text-sm text-slate-200 leading-relaxed font-sans select-text">
              <FormattedContent content={fullContent} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#3e4153] bg-[#262835] flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2f3140] hover:bg-[#3e4153] text-white text-xs font-medium border border-[#3e4153] shadow-xs transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copiar Manual</span>
              </>
            )}
          </button>

          {onAskAboutSection && (
            <button
              onClick={() => {
                onAskAboutSection(section, manual);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ca4048] hover:bg-[#b5343c] text-white text-xs font-semibold shadow-md shadow-[#ca4048]/30 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Consultar a AI-zen sobre esto</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
