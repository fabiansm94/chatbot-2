import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  BookOpen,
  Check,
  Upload,
  FileUp,
  AlertCircle,
  Loader2,
  FileCheck2
} from 'lucide-react';
import { ManualDocument } from '../types/manual';
import { RichTextEditor } from './RichTextEditor';
import { cleanRawHtmlTags, textOrHtmlToEditorHtml } from '../utils/textFormatting';

interface AddManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddManual: (manual: ManualDocument) => void;
  onUpdateManual?: (manual: ManualDocument) => void;
  editingManual?: ManualDocument | null;
  initialFile?: File | null;
  defaultTab?: 'upload' | 'manual';
}

export const AddManualModal: React.FC<AddManualModalProps> = ({
  isOpen,
  onClose,
  onAddManual,
  onUpdateManual,
  editingManual = null,
  initialFile = null,
  defaultTab = 'upload'
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>(defaultTab);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync tab or load editingManual when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (editingManual) {
      setActiveTab('manual');
      setTitle(editingManual.title || '');
      // Combine existing content from summary or sections into clean rich HTML for editing
      const rawExisting =
        (editingManual.summary && editingManual.summary.length >= (editingManual.sections?.[0]?.content?.length || 0))
          ? editingManual.summary
          : editingManual.sections && editingManual.sections.length > 0
            ? editingManual.sections
                .map(s => (editingManual.sections.length > 1 && s.title ? `## ${s.title}\n${s.content}` : s.content))
                .join('\n\n')
            : editingManual.description || '';
      setContentHtml(textOrHtmlToEditorHtml(rawExisting));
      setError(null);
    } else {
      setActiveTab(defaultTab);
      if (!initialFile) {
        setTitle('');
        setContentHtml('');
        setUploadedFileName(null);
        setFileSizeStr(null);
        setError(null);
      }
    }
  }, [isOpen, editingManual, defaultTab, initialFile]);

  // If opened with initialFile, process it automatically
  useEffect(() => {
    if (initialFile && isOpen && !editingManual) {
      setActiveTab('upload');
      handleFileSelected(initialFile);
    }
  }, [initialFile, isOpen, editingManual]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setContentHtml('');
    setUploadedFileName(null);
    setFileSizeStr(null);
    setError(null);
    setIsUploading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileSelected = async (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx', '.doc'].includes(ext)) {
      setError('Formato no soportado. Por favor sube un archivo PDF (.pdf) o Word (.docx, .doc).');
      return;
    }

    setUploadedFileName(file.name);
    setFileSizeStr(formatFileSize(file.size));
    setError(null);
    setIsUploading(true);
    setUploadProgress('Leyendo y transcribiendo el documento...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const resultStr = reader.result as string;
          const base64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;

          setUploadProgress('Transcribiendo texto y aplicando formato enriquecido...');

          const response = await fetch('/api/parse-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileBase64: base64,
              mimeType: file.type
            })
          });

          const data = await response.json();
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Error al procesar el archivo');
          }

          const parsed = data.manual as ManualDocument;
          setTitle(parsed.title || file.name.replace(/\.[^/.]+$/, ''));

          const transcribed =
            data.contentHtml ||
            textOrHtmlToEditorHtml(
              data.fullText ||
                (parsed.sections ? parsed.sections.map(s => s.content).join('\n\n') : parsed.summary || '')
            );

          setContentHtml(transcribed);
          setIsUploading(false);
        } catch (serverErr: any) {
          setIsUploading(false);
          setError(serverErr.message || 'No se pudo transcribir el archivo en el servidor.');
        }
      };

      reader.onerror = () => {
        setIsUploading(false);
        setError('Error al leer el archivo en el navegador.');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || 'Error inesperado al cargar el archivo.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Por favor indica el título del manual.');
      return;
    }

    const plainTextContent = cleanRawHtmlTags(contentHtml);
    if (!plainTextContent.trim()) {
      setError('Por favor ingresa la información o descripción del manual.');
      return;
    }

    const nowDate = new Date().toISOString().split('T')[0];

    if (editingManual && onUpdateManual) {
      const updatedManual: ManualDocument = {
        ...editingManual,
        title: title.trim(),
        updatedDate: nowDate,
        summary: contentHtml,
        description: plainTextContent,
        sections: [
          {
            id: editingManual.sections?.[0]?.id || `sec-${Date.now()}-1`,
            articleNumber: 'Manual Oficial',
            title: title.trim(),
            content: plainTextContent,
            tags: ['manual', 'oficial']
          }
        ]
      };
      onUpdateManual(updatedManual);
      handleClose();
      return;
    }

    const timestamp = Date.now();
    const newManual: ManualDocument = {
      id: `man-custom-${timestamp}`,
      title: title.trim(),
      code: `MAN-${timestamp.toString().slice(-4)}`,
      category: 'general',
      department: 'General',
      version: '1.0',
      updatedDate: nowDate,
      summary: contentHtml,
      description: plainTextContent,
      iconName: 'FileText',
      sections: [
        {
          id: `sec-${timestamp}-1`,
          articleNumber: 'Manual Oficial',
          title: title.trim(),
          content: plainTextContent,
          tags: ['manual', 'oficial']
        }
      ]
    };

    onAddManual(newManual);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#2f3140] border border-[#3e4153] rounded-2xl shadow-2xl overflow-hidden my-6 text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#3e4153] bg-[#262835] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#ca4048]/20 text-[#ca4048] border border-[#ca4048]/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingManual ? 'Editar Manual o Procedimiento' : 'Incorporar Manual o Procedimiento'}
              </h2>
              <p className="text-xs text-slate-300">
                {editingManual
                  ? 'Edita el contenido enriquecido en tiempo real y guarda los cambios sin necesidad de volver a subir el archivo'
                  : 'Sube un archivo para transcribirlo automáticamente o redáctalo con formato en tiempo real'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#3e4153] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection (shown when creating a new manual, or allows re-importing a file) */}
        <div className="px-6 pt-3 pb-0 bg-[#262835] border-b border-[#3e4153] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#ca4048] text-white bg-[#2f3140]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileUp className="w-4 h-4 text-[#ca4048]" />
            <span>Subir Archivo (PDF / Word)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'manual'
                ? 'border-[#ca4048] text-white bg-[#2f3140]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingManual ? 'Editar Contenido' : 'Crear Manualmente'}</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#ca4048]/20 border border-[#ca4048]/50 text-xs text-white flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#ca4048] shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />

              {!uploadedFileName && !isUploading && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#ca4048] bg-[#ca4048]/10 scale-[1.01]'
                      : 'border-[#3e4153] hover:border-[#ca4048]/60 bg-[#262835]/50 hover:bg-[#262835]'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-[#ca4048]/15 border border-[#ca4048]/30 flex items-center justify-center text-[#ca4048]">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Arrastra tu archivo PDF o Word aquí o haz clic para seleccionarlo
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mb-3 leading-relaxed">
                    El sistema leerá el archivo y lo transcribirá en el editor de abajo con su formato y listas para que puedas editarlo directamente cuando quieras.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#ca4048]/20 text-[#ca4048] font-mono text-[11px] font-semibold border border-[#ca4048]/30">
                      PDF (.pdf)
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 font-mono text-[11px] font-semibold border border-sky-500/30">
                      Word (.docx / .doc)
                    </span>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="rounded-2xl bg-[#262835] border border-[#3e4153] p-6 text-center space-y-3">
                  <div className="w-11 h-11 mx-auto rounded-full bg-[#ca4048]/20 flex items-center justify-center text-[#ca4048]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Transcribiendo {uploadedFileName}</h4>
                    <p className="text-xs text-slate-300 mt-1">{uploadProgress}</p>
                  </div>
                </div>
              )}

              {uploadedFileName && !isUploading && (
                <div className="p-3.5 rounded-xl bg-[#262835] border border-[#3e4153] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-[#ca4048]/20 text-[#ca4048] border border-[#ca4048]/30 shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                          {uploadedFileName}
                        </span>
                        {fileSizeStr && (
                          <span className="text-[11px] text-slate-400 font-mono">({fileSizeStr})</span>
                        )}
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium block mt-0.5">
                        ✓ Archivo transcrito al editor — puedes editar el texto libremente abajo
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#2f3140] hover:bg-[#3e4153] text-xs font-medium text-slate-200 border border-[#3e4153] transition-colors shrink-0 cursor-pointer"
                  >
                    Cambiar archivo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Unified Fields for both Upload and Manual Creation */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Título del Manual / Procedimiento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Procedimiento de Control Foresta Residence"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262835] border border-[#3e4153] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Información del Manual / Descripción *
                </label>
                <span className="text-[11px] text-slate-400">
                  Editor en tiempo real (Listas • puntos, 1,2,3 y a,b,c)
                </span>
              </div>
              <RichTextEditor
                content={contentHtml}
                onChange={setContentHtml}
                placeholder="Escribe o edita aquí toda la información del manual. Puedes usar listas con puntos (•), listas numeradas (1, 2, 3), listas alfabéticas (a, b, c), títulos y negritas..."
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#3e4153] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-[#262835] hover:bg-[#3e4153] text-slate-200 text-xs font-medium transition-colors border border-[#3e4153] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#ca4048] hover:bg-[#b5343c] disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingManual ? 'Guardar Cambios' : 'Guardar Manual'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
