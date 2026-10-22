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

  const filteredManuals = manuals.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sections.some(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.articleNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const totalArticles = manuals.reduce((acc, m) => acc + m.sections.length, 0);

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#fafbfc] space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#fa5252]">
                Biblioteca Normativa
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">Manuales Oficiales</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Book de Manuales Corporativos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Base de conocimiento oficial que alimenta las respuestas del Asistente. Puedes consultar, verificar las cláusulas o proponer actualizaciones.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={onResetManuals}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all"
              title="Restablecer a manuales estándar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fa5252] hover:bg-[#e03131] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Manual</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
            <div className="text-[11px] text-slate-500 font-medium">Manuales Vigentes</div>
            <div className="text-lg font-bold text-slate-800 mt-0.5">{manuals.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
            <div className="text-[11px] text-slate-500 font-medium">Artículos Indexados</div>
            <div className="text-lg font-bold text-[#fa5252] mt-0.5">{totalArticles}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
            <div className="text-[11px] text-slate-500 font-medium">Motor de Búsqueda</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">RAG Activo</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-150">
            <div className="text-[11px] text-slate-500 font-medium">Versión Normativa</div>
            <div className="text-lg font-bold text-slate-700 mt-0.5">2026/2027</div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'rrhh', label: 'RRHH' },
            { id: 'ti', label: 'TI & Ciberseguridad' },
            { id: 'seguridad', label: 'Prevención SST' },
            { id: 'legal_etica', label: 'Ética' },
            { id: 'operaciones', label: 'Viáticos' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === tab.id
                  ? 'bg-[#fa5252] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por título, artículo..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] transition-colors"
          />
        </div>
      </div>

      {/* Manuals List */}
      <div className="space-y-4">
        {filteredManuals.map(manual => {
          const isExpanded = expandedManuals[manual.id] ?? false;

          return (
            <div
              key={manual.id}
              className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
            >
              {/* Manual Card Header */}
              <div
                onClick={() => toggleExpand(manual.id)}
                className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-150 flex items-center justify-center shrink-0">
                    {getCategoryIcon(manual.category)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#fa5252] bg-rose-50 px-2 py-0.5 rounded border border-rose-150">
                        {manual.code}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-slate-800">
                        {manual.title}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        v{manual.version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {manual.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
                    {manual.sections.length} artículos
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAskAboutManual(manual);
                    }}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-[#fa5252] text-slate-600 hover:text-white transition-colors"
                    title="Preguntar al bot sobre este manual"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <div className="p-1 rounded-lg text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Sections Accordion Content */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-[#fafbfc] p-4 sm:p-5 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Artículos y Procedimientos Incluidos:
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {manual.sections.map(section => (
                      <div
                        key={section.id}
                        onClick={() => onOpenSection(section, manual)}
                        className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-[#fa5252] hover:shadow-sm cursor-pointer transition-all group flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#fa5252]">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{section.articleNumber}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#fa5252] transition-colors" />
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#fa5252] transition-colors">
                            {section.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {section.content}
                          </p>
                        </div>

                        {section.tags && section.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {section.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
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
