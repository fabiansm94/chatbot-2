import React, { useState } from 'react';
import {
  Building2,
  Cpu,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ManualDocument } from '../types/manual';

interface SettingsViewProps {
  companyName: string;
  setCompanyName: (name: string) => void;
  manuals: ManualDocument[];
  onImportManuals: (imported: ManualDocument[]) => void;
  onResetManuals: () => void;
  hasGeminiKey: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyName,
  setCompanyName,
  manuals,
  onImportManuals,
  onResetManuals,
  hasGeminiKey
}) => {
  const [nameInput, setNameInput] = useState(companyName);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setCompanyName(nameInput.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manuals, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `book-manuales-${companyName.toLowerCase().replace(/\s+/g, '-')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].sections) {
          onImportManuals(parsed);
          setImportError(null);
        } else {
          setImportError('El archivo JSON no tiene el formato válido de Book de Manuales.');
        }
      } catch (err) {
        setImportError('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-[#fafbfc]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Configuración del Asistente y Book Corporativo
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ajusta la identidad empresarial, revisa el estado del motor Gemini y gestiona respaldos del repositorio.
          </p>
        </div>

        {/* Company Name Customization */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fa5252]/10 text-[#fa5252] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Nombre de la Organización</h2>
          </div>
          <p className="text-xs text-slate-500">
            El Asistente utilizará este nombre para identificarse y contextualizar las normativas corporativas.
          </p>

          <form onSubmit={handleSaveName} className="flex gap-3 max-w-md">
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Ej. Mi Empresa S.A."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] focus:bg-white transition-colors"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#fa5252] hover:bg-[#e04343] text-white text-xs font-semibold shadow-md shadow-[#fa5252]/20 transition-all flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>Actualizar</span>
              )}
            </button>
          </form>
        </div>

        {/* Gemini AI Engine Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fa5252]/10 text-[#fa5252] flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Motor de Inteligencia Artificial</h2>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              hasGeminiKey
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${hasGeminiKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{hasGeminiKey ? 'Conectado a Gemini 3.8 Flash' : 'Motor RAG Interno Activo'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="text-slate-500 font-medium">Modelo Principal</div>
              <div className="text-sm font-bold text-[#fa5252]">gemini-3.8-flash</div>
              <div className="text-[11px] text-slate-400">Respuestas rápidas, amigables y fundamentadas</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="text-slate-500 font-medium">Arquitectura de Servidor</div>
              <div className="text-sm font-bold text-slate-700">Express + Vite + @google/genai</div>
              <div className="text-[11px] text-slate-400">Llamadas seguras en servidor (/api/chat)</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200/60 text-xs text-orange-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#fa5252] shrink-0 mt-0.5" />
            <span>
              Las llamadas a Gemini se procesan en el backend con telemetría <code className="bg-orange-100 px-1 py-0.5 rounded text-[11px] font-mono">User-Agent: aistudio-build</code>. Tu API Key se inyecta de forma segura mediante variables de entorno del servidor.
            </span>
          </div>
        </div>

        {/* Export & Import Backup */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fa5252]/10 text-[#fa5252] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Respaldo y Portabilidad del Book</h2>
          </div>
          <p className="text-xs text-slate-500">
            Descarga todos los manuales y cláusulas en formato JSON estructurado o importa un book existente de otra sede.
          </p>

          {importError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {importError}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar Book a JSON ({manuals.length} manuales)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Importar Archivo JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={onResetManuals}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-semibold border border-slate-200 hover:border-rose-200 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restablecer a Valores de Fábrica</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
