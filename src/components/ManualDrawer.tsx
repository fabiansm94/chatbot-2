import React, { useState } from 'react';
import { X, BookOpen, Check, Copy, MessageSquare, Tag, ExternalLink, Shield } from 'lucide-react';
import { ManualDocument, ManualSection } from '../types/manual';

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

  const handleCopy = () => {
    const textToCopy = `[${manual.code} - ${section.articleNumber}: ${section.title}]\n\n${section.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#fa5252]/10 text-[#fa5252] border border-[#fa5252]/20">
                {manual.code}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200 font-mono">
                v{manual.version}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {manual.department}
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#fa5252] shrink-0" />
              <span>{manual.title}</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Cerrar panel de artículo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Article Title & Number */}
          <div className="pb-4 border-b border-slate-100">
            <span className="text-xs font-mono font-bold text-[#fa5252] uppercase tracking-wide">
              {section.articleNumber}
            </span>
            <h1 className="text-xl font-bold text-slate-800 mt-1">
              {section.title}
            </h1>
          </div>

          {/* Key points if present */}
          {section.keyPoints && section.keyPoints.length > 0 && (
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/70 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#e04343]">
                <Shield className="w-3.5 h-3.5" />
                <span>Puntos Clave y Directrices Inmediatas</span>
              </div>
              <ul className="space-y-1.5 mt-2">
                {section.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fa5252] mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Official Full Text */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Texto Oficial del Manual
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 whitespace-pre-line leading-relaxed font-sans select-text">
              {section.content}
            </div>
          </div>

          {/* Tags */}
          {section.tags && section.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                <span>Términos y etiquetas indexadas</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {section.tags.map(t => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar Cláusula</span>
              </>
            )}
          </button>

          {onAskAboutSection && (
            <button
              onClick={() => {
                onAskAboutSection(section, manual);
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fa5252] hover:bg-[#e04343] text-white text-xs font-semibold shadow-md shadow-[#fa5252]/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Preguntar al Asistente sobre esto</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
