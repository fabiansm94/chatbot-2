import React, { useState } from 'react';
import {
  Plus,
  Users,
  Laptop,
  ShieldAlert,
  Scale,
  Briefcase,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Trash2
} from 'lucide-react';
import { ManualCategory, ManualDocument, ManualSection } from '../types/manual';

interface ManualsBookViewProps {
  manuals: ManualDocument[];
  onOpenSection: (section: ManualSection, manual: ManualDocument) => void;
  onOpenAddModal: () => void;
  onResetManuals: () => void;
  onAskAboutManual: (manual: ManualDocument) => void;
  onDeleteManual?: (manualId: string) => void;
}

export const ManualsBookView: React.FC<ManualsBookViewProps> = ({
  manuals,
  onOpenSection,
  onOpenAddModal,
  onResetManuals,
  onAskAboutManual,
  onDeleteManual
}) => {
  const [expandedManuals, setExpandedManuals] = useState<Record<string, boolean>>({
    'man-rrhh-01': true // Expand first one by default
  });

  const toggleExpand = (id: string) => {
    setExpandedManuals(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getCategoryIcon = (category: ManualCategory) => {
    switch (category) {
      case 'rrhh':
        return <Users className="w-4 h-4 text-emerald-500" />;
      case 'ti':
        return <Laptop className="w-4 h-4 text-sky-500" />;
      case 'seguridad':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'legal_etica':
        return <Scale className="w-4 h-4 text-purple-500" />;
      case 'operaciones':
        return <Briefcase className="w-4 h-4 text-orange-500" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#2f3140] text-white space-y-6">
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
              Base de conocimiento oficial que alimenta las respuestas del Asistente. Puedes consultar, verificar las cláusulas o proponer actualizaciones.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={onResetManuals}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2f3140] hover:bg-[#3e4153] text-white text-xs font-medium transition-all border border-[#3e4153]"
              title="Restablecer a manuales estándar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ca4048] hover:bg-[#b5343c] text-white text-xs font-semibold shadow-sm transition-all"
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
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#ca4048]/15 border border-[#ca4048]/30 flex items-center justify-center shrink-0">
                    {getCategoryIcon(manual.category)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#ca4048] bg-[#ca4048]/15 px-2 py-0.5 rounded border border-[#ca4048]/30">
                        {manual.code}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-white">
                        {manual.title}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        v{manual.version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                      {manual.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline-block text-xs text-slate-300 font-medium">
                    {manual.sections.length} artículos
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAboutManual(manual);
                    }}
                    className="p-2 rounded-lg bg-[#2f3140] hover:bg-[#ca4048] text-slate-300 hover:text-white transition-colors border border-[#3e4153]"
                    title="Preguntar al bot sobre este manual"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteManual && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteManual(manual.id);
                      }}
                      className="p-2 rounded-lg bg-[#2f3140] hover:bg-[#ca4048]/30 text-slate-300 hover:text-[#ca4048] transition-colors border border-[#3e4153]"
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

              {/* Sections Accordion Content */}
              {isExpanded && (
                <div className="border-t border-[#3e4153] bg-[#2f3140] p-4 sm:p-5 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Artículos y Procedimientos Incluidos:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {manual.sections.map(section => (
                      <div
                        key={section.id}
                        onClick={() => onOpenSection(section, manual)}
                        className="p-4 rounded-xl bg-[#262835] border border-[#3e4153] hover:border-[#ca4048] hover:shadow-md cursor-pointer transition-all group flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#ca4048]">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{section.articleNumber}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#ca4048] transition-colors" />
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-[#ca4048] transition-colors">
                            {section.title}
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                            {section.content}
                          </p>
                        </div>

                        {section.tags && section.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {section.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-[#2f3140] text-slate-300 font-medium border border-[#3e4153]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
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
