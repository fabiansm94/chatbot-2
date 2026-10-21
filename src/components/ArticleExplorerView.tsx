import React, { useState, useMemo } from 'react';
import { Search, FileText, ExternalLink, MessageSquare, Tag, BookOpen, Filter } from 'lucide-react';
import { ManualDocument, ManualSection } from '../types/manual';
import { searchManuals } from '../utils/manualSearch';

interface ArticleExplorerViewProps {
  manuals: ManualDocument[];
  onOpenSection: (section: ManualSection, manual: ManualDocument) => void;
  onAskAboutSection: (section: ManualSection, manual: ManualDocument) => void;
}

export const ArticleExplorerView: React.FC<ArticleExplorerViewProps> = ({
  manuals,
  onOpenSection,
  onAskAboutSection
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const departments = useMemo(() => {
    const deps = new Set<string>();
    manuals.forEach(m => deps.add(m.department));
    return Array.from(deps);
  }, [manuals]);

  // Flatten all articles with their parent manual
  const allArticles = useMemo(() => {
    const list: Array<{ manual: ManualDocument; section: ManualSection }> = [];
    manuals.forEach(manual => {
      manual.sections.forEach(section => {
        list.push({ manual, section });
      });
    });
    return list;
  }, [manuals]);

  const filteredArticles = useMemo(() => {
    let result = allArticles;

    if (departmentFilter !== 'all') {
      result = result.filter(item => item.manual.department === departmentFilter);
    }

    if (searchTerm.trim()) {
      // Use searchManuals logic for relevance ranking
      const searchResults = searchManuals(searchTerm, manuals, 25);
      const matchingIds = new Set(searchResults.map(sr => sr.section.id));
      result = result.filter(item => matchingIds.has(item.section.id));
      // Re-order by search rank
      result.sort((a, b) => {
        const rankA = searchResults.findIndex(sr => sr.section.id === a.section.id);
        const rankB = searchResults.findIndex(sr => sr.section.id === b.section.id);
        return rankA - rankB;
      });
    }

    return result;
  }, [allArticles, departmentFilter, searchTerm, manuals]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Explorador Rápido de Artículos y Cláusulas
          </h1>
          <p className="text-sm text-slate-400">
            Localiza cualquier norma interna por palabra clave o departamento de forma instantánea.
          </p>
        </div>

        <div className="text-xs text-slate-400 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 self-start md:self-auto">
          Mostrando <strong className="text-indigo-400">{filteredArticles.length}</strong> de {allArticles.length} artículos
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por término (ej. 'antelación', 'mfa', 'dieta', 'accidente', '1password')..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
          >
            <option value="all">Todos los Departamentos</option>
            {departments.map(dep => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <Search className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">
              No hay artículos que coincidan con los criterios de búsqueda.
            </p>
          </div>
        ) : (
          filteredArticles.map(({ manual, section }) => (
            <div
              key={section.id}
              className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex flex-col justify-between space-y-4 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 uppercase">
                    {section.articleNumber}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {manual.code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                  {section.title}
                </h3>

                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{manual.title}</span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 mt-3 leading-relaxed">
                  {section.content}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenSection(section, manual)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Completo</span>
                </button>

                <button
                  onClick={() => onAskAboutSection(section, manual)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Consultar en Chat</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
