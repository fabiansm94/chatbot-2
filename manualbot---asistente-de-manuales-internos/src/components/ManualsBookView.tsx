import React, { useState } from 'react';
import {
  BookOpen,
  Search,
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
  Tag
} from 'lucide-react';
import { ManualCategory, ManualDocument, ManualSection } from '../types/manual';

interface ManualsBookViewProps {
  manuals: ManualDocument[];
  onOpenSection: (section: ManualSection, manual: ManualDocument) => void;
  onOpenAddModal: () => void;
  onResetManuals: () => void;
  onAskAboutManual: (manual: ManualDocument) => void;
}

export const ManualsBookView: React.FC<ManualsBookViewProps> = ({
  manuals,
  onOpenSection,
  onOpenAddModal,
  onResetManuals,
  onAskAboutManual
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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
        return <Users className="w-4 h-4 text-emerald-400" />;
      case 'ti':
        return <Laptop className="w-4 h-4 text-sky-400" />;
      case 'seguridad':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'legal_etica':
        return <Scale className="w-4 h-4 text-purple-400" />;
      case 'operaciones':
        return <Briefcase className="w-4 h-4 text-rose-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-400" />;
    }
  };

  const filteredManuals = manuals.filter(m => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesQuery =
      m.title.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q) ||
      m.sections.some(
        s =>
          s.title.toLowerCase().includes(q) ||
          s.articleNumber.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q) ||
          s.tags.some(t => t.toLowerCase().includes(q))
      );
    return matchesCat && matchesQuery;
  });

  const totalArticles = manuals.reduce((acc, m) => acc + m.sections.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Book Corporativo Oficial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Repositorio de Manuales y Normativas
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Base de conocimiento corporativo que nutre las respuestas del Asistente Gemini. Cualquier trabajador puede consultar, verificar los artículos oficiales o agregar nuevas directivas.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={onResetManuals}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition-all"
              title="Restablecer a manuales estándar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Manual o Política</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/50">
            <div className="text-xs text-slate-400">Manuales Vigentes</div>
            <div className="text-xl font-bold text-white mt-0.5">{manuals.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/50">
            <div className="text-xs text-slate-400">Artículos Indexados</div>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">{totalArticles}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/50">
            <div className="text-xs text-slate-400">Motor de Búsqueda</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">RAG Activo</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/50">
            <div className="text-xs text-slate-400">Última Auditoría</div>
            <div className="text-xl font-bold text-slate-200 mt-0.5">2025/2026</div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'rrhh', label: 'RRHH & Beneficios' },
            { id: 'ti', label: 'TI & Seguridad' },
            { id: 'seguridad', label: 'Prevención SST' },
            { id: 'legal_etica', label: 'Ética & Legal' },
            { id: 'operaciones', label: 'Finanzas & Viajes' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar manuales o cláusulas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Manuals List */}
      <div className="space-y-4">
        {filteredManuals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">No se encontraron manuales</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay documentos que coincidan con los filtros aplicados. Prueba con otra palabra clave o agrega un nuevo manual.
            </p>
          </div>
        ) : (
          filteredManuals.map(manual => {
            const isExpanded = !!expandedManuals[manual.id];

            return (
              <div
                key={manual.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md overflow-hidden transition-all hover:border-slate-700/80"
              >
                {/* Manual Header Card */}
                <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {manual.code}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                        v{manual.version}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        {getCategoryIcon(manual.category)}
                        <span>{manual.department}</span>
                      </div>
                      <span className="text-slate-600 text-xs">•</span>
                      <span className="text-xs text-slate-500">
                        Actualizado: {manual.updatedDate}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white hover:text-indigo-300 transition-colors cursor-pointer" onClick={() => toggleExpand(manual.id)}>
                      {manual.title}
                    </h2>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {manual.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onAskAboutManual(manual)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition-all"
                      title="Hacer preguntas al Asistente sobre este manual"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Consultar en Chat</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(manual.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
                      aria-expanded={isExpanded}
                    >
                      <span>{manual.sections.length} artículos</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Sections Accordion */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-6 space-y-3">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Artículos y Cláusulas del Documento</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {manual.sections.map(section => (
                        <div
                          key={section.id}
                          onClick={() => onOpenSection(section, manual)}
                          className="group p-4 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-850 cursor-pointer transition-all flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                                {section.articleNumber}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <h4 className="text-sm font-semibold text-white group-hover:text-indigo-200 transition-colors">
                              {section.title}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {section.content}
                            </p>
                          </div>

                          {section.keyPoints && section.keyPoints.length > 0 && (
                            <div className="pt-2 border-t border-slate-800/60">
                              <span className="text-[11px] text-slate-500 block truncate">
                                💡 {section.keyPoints[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
