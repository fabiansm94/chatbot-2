import React, { useState, useMemo } from 'react';
import { Search, FileText, ExternalLink, MessageSquare, BookOpen, Pencil, Calendar } from 'lucide-react';
import { ManualDocument, ManualSection } from '../types/manual';
import { searchManuals, normalizeText } from '../utils/manualSearch';
import { stripHtmlForPreview } from '../utils/textFormatting';

interface ArticleExplorerViewProps {
  manuals: ManualDocument[];
  onOpenSection: (section: ManualSection, manual: ManualDocument) => void;
  onAskAboutSection: (section: ManualSection, manual: ManualDocument) => void;
  onAskAboutManual?: (manual: ManualDocument) => void;
  onEditManual?: (manual: ManualDocument) => void;
}

export const ArticleExplorerView: React.FC<ArticleExplorerViewProps> = ({
  manuals,
  onOpenSection,
  onAskAboutSection,
  onAskAboutManual,
  onEditManual
}) => {
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredManuals = useMemo(() => {
    const query = searchTerm.trim();
    if (!query) return manuals;

    const normQuery = normalizeText(query);
    const searchResults = searchManuals(query, manuals, 50);
    const matchedManualIds = new Set(searchResults.map(sr => sr.manual.id));

    return manuals.filter(manual => {
      if (matchedManualIds.has(manual.id)) return true;
      const fullContent = getManualFullContent(manual);
      const haystack = normalizeText(`${manual.title} ${manual.code} ${fullContent}`);
      return haystack.includes(normQuery);
    });
  }, [manuals, searchTerm]);

  const handleViewFullManual = (manual: ManualDocument) => {
    const fullContent = getManualFullContent(manual);
    const mainSection: ManualSection = manual.sections?.[0]
      ? {
          ...manual.sections[0],
          title: manual.title,
          content: fullContent
        }
      : {
          id: `${manual.id}-full`,
          articleNumber: manual.code,
          title: manual.title,
          content: fullContent,
          tags: [],
          keyPoints: []
        };
    onOpenSection(mainSection, manual);
  };

  const handleAskManual = (manual: ManualDocument) => {
    if (onAskAboutManual) {
      onAskAboutManual(manual);
      return;
    }
    const firstSection = manual.sections?.[0] || {
      id: `${manual.id}-full`,
      articleNumber: manual.code,
      title: manual.title,
      content: getManualFullContent(manual),
      tags: []
    };
    onAskAboutSection(firstSection, manual);
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#2f3140] text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ca4048]">
              Explorador Global
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-xs text-slate-300">Catálogo de Manuales</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Todos los Manuales Añadidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Visualiza, busca y consulta todos los manuales y procedimientos registrados en el sistema.
          </p>
        </div>

        <div className="text-xs text-slate-300 px-3.5 py-1.5 rounded-full bg-[#262835] border border-[#3e4153] shadow-xs self-start md:self-auto">
          Mostrando <strong className="text-[#ca4048]">{filteredManuals.length}</strong> de {manuals.length} manuales
        </div>
      </div>

      {/* Search Control */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar manual por título, código o contenido..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#262835] border border-[#3e4153] text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048] transition-colors shadow-xs"
        />
      </div>

      {/* Manuals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredManuals.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-[#262835] border border-[#3e4153] space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">
              No se encontraron manuales que coincidan con la búsqueda.
            </p>
          </div>
        ) : (
          filteredManuals.map(manual => {
            const fullContent = getManualFullContent(manual);
            return (
              <div
                key={manual.id}
                className="p-5 rounded-2xl bg-[#262835] border border-[#3e4153] hover:border-[#ca4048] hover:shadow-md flex flex-col justify-between space-y-4 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-xs font-mono font-bold text-[#ca4048] px-2.5 py-0.5 rounded bg-[#ca4048]/20 border border-[#ca4048]/30 uppercase">
                      {manual.code}
                    </span>
                    {manual.updatedDate && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{manual.updatedDate}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-[#ca4048] shrink-0 mt-0.5" />
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#ca4048] transition-colors line-clamp-2">
                      {manual.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-4 mt-3 leading-relaxed">
                    {stripHtmlForPreview(fullContent, 220)}
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-[#3e4153] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleViewFullManual(manual)}
                      className="flex items-center gap-1 text-xs text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Completo</span>
                    </button>

                    {onEditManual && (
                      <button
                        type="button"
                        onClick={() => onEditManual(manual)}
                        className="flex items-center gap-1 text-xs text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#ca4048]" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAskManual(manual)}
                    className="flex items-center gap-1 text-xs text-[#ca4048] hover:text-[#b5343c] font-semibold transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Consultar en Chat</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
