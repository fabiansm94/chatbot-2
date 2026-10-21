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
          alert('¡Manuales importados con éxito!');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Configuración del Asistente y Book Corporativo
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Ajusta la identidad empresarial, revisa el estado del motor Gemini y gestiona respaldos del repositorio.
        </p>
      </div>

      {/* Company Name Customization */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Nombre de la Organización</h2>
        </div>
        <p className="text-xs text-slate-400">
          El Asistente utilizará este nombre para identificarse y contextualizar las normativas corporativas.
        </p>

        <form onSubmit={handleSaveName} className="flex gap-3 max-w-md">
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="Ej. Mi Empresa S.A."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <span>Actualizar</span>
            )}
          </button>
        </form>
      </div>

      {/* Gemini AI Engine Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Motor de Inteligencia Artificial</h2>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
            hasGeminiKey
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${hasGeminiKey ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`} />
            <span>{hasGeminiKey ? 'Conectado a Gemini 3.8 Flash' : 'Motor RAG Interno Activo'}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="text-slate-400 font-medium">Modelo Principal</div>
            <div className="text-sm font-bold text-indigo-300">gemini-3.8-flash</div>
            <div className="text-[11px] text-slate-500">Respuestas rápidas y fundamentadas en manuales</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="text-slate-400 font-medium">Arquitectura de Servidor</div>
            <div className="text-sm font-bold text-slate-200">Express + Vite + @google/genai</div>
            <div className="text-[11px] text-slate-500">Llamadas seguras en servidor (/api/chat)</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-indigo-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            Las llamadas a Gemini se procesan en el backend con telemetría <code className="bg-indigo-900/40 px-1 py-0.5 rounded text-[11px]">User-Agent: aistudio-build</code>. Tu API Key se inyecta de forma segura mediante los Secrets de la plataforma.
          </span>
        </div>
      </div>

      {/* Export & Import Backup */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Download className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Respaldo y Portabilidad del Book</h2>
        </div>
        <p className="text-xs text-slate-400">
          Descarga todos los manuales y cláusulas en formato JSON estructurado o importa un book existente de otra sede.
        </p>

        {importError && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-200">
            {importError}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Book a JSON ({manuals.length} manuales)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-semibold border border-slate-800 hover:border-rose-900/50 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer a Valores de Fábrica</span>
          </button>
        </div>
      </div>
    </div>
  );
};
