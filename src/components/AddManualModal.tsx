import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, BookOpen, Check } from 'lucide-react';
import { ManualCategory, ManualDocument, ManualSection } from '../types/manual';
import { RichTextEditor } from './RichTextEditor';

interface AddManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddManual: (manual: ManualDocument) => void;
}

export const AddManualModal: React.FC<AddManualModalProps> = ({
  isOpen,
  onClose,
  onAddManual
}) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor indica el título del documento.');
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = summary;
    const plainSummary = (tempDiv.textContent || tempDiv.innerText || '').trim();

    const newManual: ManualDocument = {
      id: `man-custom-${Date.now()}`,
      title: title.trim(),
      code: `MAN-${Date.now().toString().slice(-4)}`,
      category: 'general',
      department: 'Dirección General',
      version: '1.0',
      updatedDate: new Date().toISOString().split('T')[0],
      summary: plainSummary || `Información sobre ${title}`,
      iconName: 'FileText',
      sections: [{
        id: `sec-${Date.now()}`,
        articleNumber: 'Info',
        title: title.trim(),
        content: summary.trim() || 'Sin información adicional.',
        tags: []
      }]
    };

    onAddManual(newManual);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#2f3140] border border-[#3e4153] rounded-2xl shadow-2xl overflow-hidden my-8 text-white">
        {/* Header */}
        <div className="p-5 border-b border-[#3e4153] bg-[#262835] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#ca4048]/20 text-[#ca4048] border border-[#ca4048]/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Incorporar Manual o Política al Book</h2>
              <p className="text-xs text-slate-300">El Asistente integrará este documento inmediatamente a sus respuestas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#3e4153]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-[#ca4048]/20 border border-[#ca4048]/50 text-xs text-white">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Título del Manual / Documento *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Instrucciones de Seguridad"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#262835] border border-[#3e4153] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Información
            </label>
            <RichTextEditor content={summary} onChange={setSummary} />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-[#3e4153] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-[#3e4153] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#ca4048] hover:bg-[#b5343c] text-white text-xs font-semibold shadow-md shadow-[#ca4048]/30 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Guardar en el Book de la Empresa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
