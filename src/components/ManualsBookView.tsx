import React, { useState, useRef } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Trash2,
  Upload,
  Pencil
} from 'lucide-react';
import { ManualDocument, ManualSection } from '../types/manual';
import { stripHtmlForPreview } from '../utils/textFormatting';
import { FormattedContent } from './FormattedContent';

interface ManualsBookViewProps {
  manuals: ManualDocument[];
  onOpenSection: (section: ManualSection, manual: ManualDocument) => void;
  onOpenAddModal: () => void;
  onOpenUploadModal?: () => void;
  onUploadFile?: (file: File) => void;
  onEditManual?: (manual: ManualDocument) => void;
  onResetManuals: () => void;
  onAskAboutManual: (manual: ManualDocument) => void;
  onDeleteManual?: (manualId: string) => void;
}

export const ManualsBookView: React.FC<ManualsBookViewProps> = ({
  manuals,
  onOpenAddModal,
  onOpenUploadModal,
  onUploadFile,
  onEditManual,
  onAskAboutManual,
  onDeleteManual
}) => {
  const [expandedManuals, setExpandedManuals] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFilePicked = (file: File) => {
    if (onUploadFile) {
      onUploadFile(file);
    } else if (onOpenUploadModal) {
      onOpenUploadModal();
    } else {
      onOpenAddModal();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedManuals(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getManualFullContent = (manual: ManualDocument): string => {
    if (manual.summary && manual.summary.length >= (manual.sections?.[0]?.content?.length || 0)) {
      return manual.summary;
    }
    if (manual.sections && manual.sections.length > 0) {
      return manual.sections
        .map(s => (manual.sections.length > 1 && s.title ? `## ${s.title}\n${s.content}` : s.content))
        .join('\n\n');
    }
    return manual.description || '';
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#2f3140] text-white space-y-6">
      {/* Hidden file input for uploading PDF and Word documents */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleFilePicked(e.target.files[0]);
          }
        }}
      />

      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-[#262835] border border-[#3e4153] shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ca4048]">
                Biblioteca Normativa
              </span>
              <span className="text-[#3e4153]">/</span>
              <span className="text-xs text-slate-300">Manuales Oficiales</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Procedimientos de Control y Monitoreo
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Base de conocimiento oficial que alimenta las respuestas de AI-zen. Puedes consultar, editar en tiempo real o agregar nuevos manuales.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => {
                if (onOpenUploadModal) {
                  onOpenUploadModal();
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="hidden items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ca4048]/20 hover:bg-[#ca4048]/30 text-white text-xs font-semibold border border-[#ca4048]/50 shadow-sm transition-all"
              title="Subir archivo PDF o Word"
            >
              <Upload className="w-3.5 h-3.5 text-[#ca4048]" />
              <span>Subir PDF / Word</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ca4048] hover:bg-[#b5343c] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manuals List */}
      <div className="space-y-4">
        {manuals.map(manual => {
          const isExpanded = expandedManuals[manual.id] ?? false;
          const fullContent = getManualFullContent(manual);

          return (
            <div
              key={manual.id}
              className="rounded-2xl bg-[#262835] border border-[#3e4153] shadow-xs overflow-hidden transition-all"
            >
              {/* Manual Card Header */}
              <div
                onClick={() => toggleExpand(manual.id)}
                className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#2f3140] transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#ca4048]/15 border border-[#ca4048]/30 flex items-center justify-center shrink-0 text-[#ca4048]">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#ca4048] bg-[#ca4048]/15 px-2 py-0.5 rounded border border-[#ca4048]/30">
                        {manual.code}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        {manual.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                      {stripHtmlForPreview(fullContent, 160)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onEditManual && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onEditManual(manual);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2f3140] hover:bg-[#3e4153] text-slate-200 hover:text-white text-xs font-semibold transition-colors border border-[#3e4153] cursor-pointer"
                      title="Editar contenido del manual"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#ca4048]" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onAskAboutManual(manual);
                    }}
                    className="p-2 rounded-lg bg-[#2f3140] hover:bg-[#ca4048] text-slate-300 hover:text-white transition-colors border border-[#3e4153] cursor-pointer"
                    title="Preguntar a AI-zen sobre este manual"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteManual && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onDeleteManual(manual.id);
                      }}
                      className="p-2 rounded-lg bg-[#2f3140] hover:bg-[#ca4048]/30 text-slate-300 hover:text-[#ca4048] transition-colors border border-[#3e4153] cursor-pointer"
                      title="Eliminar manual"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="p-1 rounded-lg text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Manual Full Content */}
              {isExpanded && (
                <div className="border-t border-[#3e4153] bg-[#2f3140] p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Información y Descripción del Manual
                    </span>
                    {onEditManual && (
                      <button
                        type="button"
                        onClick={() => onEditManual(manual)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ca4048] hover:bg-[#b5343c] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar Manual aquí mismo</span>
                      </button>
                    )}
                  </div>

                  <div className="p-5 rounded-xl bg-[#262835] border border-[#3e4153] text-sm text-slate-200 leading-relaxed">
                    <FormattedContent content={fullContent} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
