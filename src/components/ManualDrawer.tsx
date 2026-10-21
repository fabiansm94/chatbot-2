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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {manual.code}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                v{manual.version}
              </span>
              <span className="text-xs text-slate-400">
                {manual.department}
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{manual.title}</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Cerrar panel de artículo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Article Title & Number */}
          <div className="pb-4 border-b border-slate-800">
            <span className="text-sm font-mono font-bold text-indigo-400 uppercase tracking-wide">
              {section.articleNumber}
            </span>
            <h1 className="text-xl font-bold text-white mt-1">
              {section.title}
            </h1>
          </div>

          {/* Key points if present */}
          {section.keyPoints && section.keyPoints.length > 0 && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                <Shield className="w-3.5 h-3.5" />
                <span>Puntos Clave y Directrices Inmediatas</span>
              </div>
              <ul className="space-y-1.5 mt-2">
                {section.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
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
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-300 whitespace-pre-line leading-relaxed font-sans select-text">
              {section.content}
            </div>
          </div>

          {/* Tags */}
          {section.tags && section.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                <span>Términos y etiquetas indexadas</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {section.tags.map(t => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-800/70 text-slate-400 border border-slate-700/50"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition-all"
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
