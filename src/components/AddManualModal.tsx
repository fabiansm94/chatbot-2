import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Check,
  Upload,
  FileUp,
  FileText,
  AlertCircle,
  Loader2,
  FileType,
  FileCheck2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ManualCategory, ManualDocument, ManualSection } from '../types/manual';
import { RichTextEditor } from './RichTextEditor';

interface AddManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddManual: (manual: ManualDocument) => void;
  initialFile?: File | null;
  defaultTab?: 'upload' | 'manual';
}

export const AddManualModal: React.FC<AddManualModalProps> = ({
  isOpen,
  onClose,
  onAddManual,
  initialFile = null,
  defaultTab = 'upload'
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>(defaultTab);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ManualCategory>('general');
  const [department, setDepartment] = useState('Dirección General');
  const [version, setVersion] = useState('1.0');
  const [summary, setSummary] = useState('');
  const [sections, setSections] = useState<ManualSection[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string | null>(null);
  const [parsedWithAi, setParsedWithAi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSectionIndex, setExpandedSectionIndex] = useState<number | null>(0);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // If opened with initialFile, process it automatically
  useEffect(() => {
    if (initialFile && isOpen) {
      handleFileSelected(initialFile);
    }
  }, [initialFile, isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setCategory('general');
    setDepartment('Dirección General');
    setVersion('1.0');
    setSummary('');
    setSections([]);
    setUploadedFileName(null);
    setFileSizeStr(null);
    setParsedWithAi(false);
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
    setUploadProgress('Leyendo archivo...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const resultStr = reader.result as string;
          const base64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;

          setUploadProgress('Analizando texto y estructurando artículos...');

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
          setTitle(parsed.title);
          setCategory(parsed.category || 'general');
          setDepartment(parsed.department || 'Dirección General');
          setVersion(parsed.version || '1.0');
          setSummary(parsed.summary || '');
          setSections(parsed.sections || []);
          setParsedWithAi(!!data.parsedWithAi);
          setIsUploading(false);
        } catch (serverErr: any) {
          setIsUploading(false);
          setError(serverErr.message || 'No se pudo procesar el archivo en el servidor.');
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

  const handleAddManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Por favor indica el título del documento.');
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = summary;
    const plainSummary = (tempDiv.textContent || tempDiv.innerText || '').trim();

    // Prepare sections
    let finalSections: ManualSection[] = sections;
    if (finalSections.length === 0) {
      finalSections = [{
        id: `sec-${Date.now()}-1`,
        articleNumber: 'Art. 1',
        title: title.trim(),
        content: plainSummary || summary.trim() || 'Contenido del manual.',
        tags: [category]
      }];
    }

    const codePrefix = {
      rrhh: 'RRHH',
      ti: 'TI',
      seguridad: 'SST',
      legal_etica: 'ETICA',
      operaciones: 'OPER',
      general: 'GEN'
    }[category] || 'MAN';

    const newManual: ManualDocument = {
      id: `man-custom-${Date.now()}`,
      title: title.trim(),
      code: `MAN-${codePrefix}-${Date.now().toString().slice(-4)}`,
      category,
      department: department.trim() || 'Dirección General',
      version: version.trim() || '1.0',
      updatedDate: new Date().toISOString().split('T')[0],
      summary: plainSummary || `Manual oficial: ${title}`,
      description: plainSummary || `Manual oficial: ${title}`,
      iconName: 'FileText',
      sections: finalSections
    };

    onAddManual(newManual);
    handleClose();
  };

  const handleSectionChange = (index: number, field: keyof ManualSection, value: any) => {
    setSections(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddSection = () => {
    setSections(prev => [
      ...prev,
      {
        id: `sec-${Date.now()}-${prev.length + 1}`,
        articleNumber: `Art. ${prev.length + 1}`,
        title: 'Nueva Cláusula o Sección',
        content: '',
        tags: [category]
      }
    ]);
    setExpandedSectionIndex(sections.length);
  };

  const handleDeleteSection = (index: number) => {
    setSections(prev => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#2f3140] border border-[#3e4153] rounded-2xl shadow-2xl overflow-hidden my-6 text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#3e4153] bg-[#262835] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#ca4048]/20 text-[#ca4048] border border-[#ca4048]/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Incorporar Manual o Procedimiento</h2>
              <p className="text-xs text-slate-300">
                Sube un archivo PDF o Word para integrarlo de inmediato a la base del Asistente
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#3e4153] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-0 bg-[#262835] border-b border-[#3e4153] flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
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
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'manual'
                ? 'border-[#ca4048] text-white bg-[#2f3140]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Crear Manualmente</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleAddManualSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#ca4048]/20 border border-[#ca4048]/50 text-xs text-white flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#ca4048] shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Dropzone */}
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
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#ca4048] bg-[#ca4048]/10 scale-[1.01]'
                      : 'border-[#3e4153] hover:border-[#ca4048]/60 bg-[#262835]/50 hover:bg-[#262835]'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#ca4048]/15 border border-[#ca4048]/30 flex items-center justify-center text-[#ca4048]">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Arrastra tu archivo aquí o haz clic para explorar
                  </h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mb-3 leading-relaxed">
                    Soporta documentos oficiales en formato PDF (.pdf) y Microsoft Word (.docx, .doc). El sistema extraerá el título, departamento y los artículos automáticamente.
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

              {/* Uploading State */}
              {isUploading && (
                <div className="rounded-2xl bg-[#262835] border border-[#3e4153] p-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#ca4048]/20 flex items-center justify-center text-[#ca4048]">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Procesando {uploadedFileName}</h4>
                    <p className="text-xs text-slate-300 mt-1">{uploadProgress}</p>
                  </div>
                  <div className="w-48 h-1.5 bg-[#2f3140] rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-[#ca4048] rounded-full animate-pulse w-3/4"></div>
                  </div>
                </div>
              )}

              {/* Uploaded File Pill */}
              {uploadedFileName && !isUploading && (
                <div className="p-4 rounded-xl bg-[#262835] border border-[#3e4153] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-[#ca4048]/20 text-[#ca4048] border border-[#ca4048]/30 shrink-0">
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          ✓ Contenido extraído con éxito
                        </span>
                        {parsedWithAi && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                            IA Estructurada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[#2f3140] hover:bg-[#3e4153] text-xs font-medium text-slate-200 border border-[#3e4153] transition-colors shrink-0"
                  >
                    Cambiar archivo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Metadata Fields (editable in both upload and manual mode) */}
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Título del Manual / Documento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Procedimiento de Ciberseguridad y Accesos"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#262835] border border-[#3e4153] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Versión
                </label>
                <input
                  type="text"
                  placeholder="1.0"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#262835] border border-[#3e4153] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ManualCategory)}
                  className="w-full px-3 py-2 rounded-lg bg-[#262835] border border-[#3e4153] text-sm text-white focus:outline-none focus:border-[#ca4048]"
                >
                  <option value="rrhh">Recursos Humanos (RRHH)</option>
                  <option value="ti">Tecnología e Información (TI)</option>
                  <option value="seguridad">Seguridad y Salud en el Trabajo (SST)</option>
                  <option value="legal_etica">Legal, Ética y Cumplimiento</option>
                  <option value="operaciones">Operaciones, Viajes y Viáticos</option>
                  <option value="general">Políticas Generales</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Departamento Responsable
                </label>
                <input
                  type="text"
                  placeholder="Ej. Recursos Humanos, Prevención SST, etc."
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#262835] border border-[#3e4153] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048]"
                />
              </div>
            </div>

            {/* Summary / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Resumen Ejecutivo / Descripción General
              </label>
              <textarea
                rows={2}
                placeholder="Breve descripción del alcance y propósito de este documento normativo..."
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#262835] border border-[#3e4153] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048] resize-none"
              />
            </div>

            {/* Sections / Articles (Accordion list) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Artículos y Cláusulas ({sections.length})
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Cada artículo es consultado por el asistente para citar respuestas oficiales
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#262835] hover:bg-[#3e4153] text-white text-xs font-medium border border-[#3e4153] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ca4048]" />
                  <span>Agregar Artículo</span>
                </button>
              </div>

              {sections.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#262835] border border-[#3e4153] text-center text-xs text-slate-400">
                  {activeTab === 'upload'
                    ? 'Sube un archivo PDF o Word para autocompletar los artículos, o haz clic en "Agregar Artículo".'
                    : 'Haz clic en "Agregar Artículo" para redactar las cláusulas del manual.'}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {sections.map((section, idx) => {
                    const isExpanded = expandedSectionIndex === idx;

                    return (
                      <div
                        key={section.id || idx}
                        className="rounded-xl bg-[#262835] border border-[#3e4153] overflow-hidden transition-all"
                      >
                        <div
                          onClick={() => setExpandedSectionIndex(isExpanded ? null : idx)}
                          className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#2f3140] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-[#ca4048]/20 text-[#ca4048] font-mono text-xs font-bold border border-[#ca4048]/30 shrink-0">
                              {section.articleNumber || `Art. ${idx + 1}`}
                            </span>
                            <span className="text-xs font-bold text-white truncate">
                              {section.title || `Artículo ${idx + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleDeleteSection(idx);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-[#ca4048] hover:bg-[#2f3140] transition-colors"
                              title="Eliminar artículo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-3.5 border-t border-[#3e4153] bg-[#2f3140] space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                                  Número / Identificador
                                </label>
                                <input
                                  type="text"
                                  value={section.articleNumber}
                                  onChange={e => handleSectionChange(idx, 'articleNumber', e.target.value)}
                                  placeholder="Ej. Art. 4.1"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#262835] border border-[#3e4153] text-xs text-white focus:outline-none focus:border-[#ca4048]"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                                  Título de la Cláusula
                                </label>
                                <input
                                  type="text"
                                  value={section.title}
                                  onChange={e => handleSectionChange(idx, 'title', e.target.value)}
                                  placeholder="Ej. Procedimiento de Solicitud de Vacaciones"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#262835] border border-[#3e4153] text-xs text-white focus:outline-none focus:border-[#ca4048]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                                Contenido Detallado
                              </label>
                              <textarea
                                rows={4}
                                value={section.content}
                                onChange={e => handleSectionChange(idx, 'content', e.target.value)}
                                placeholder="Escribe el texto de la normativa, pasos o condiciones..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#262835] border border-[#3e4153] text-xs text-white focus:outline-none focus:border-[#ca4048] resize-y"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-[#3e4153] flex items-center justify-end gap-3 sticky bottom-0 bg-[#2f3140]">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-[#3e4153] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || !title.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ca4048] hover:bg-[#b5343c] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-[#ca4048]/30 transition-all"
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
