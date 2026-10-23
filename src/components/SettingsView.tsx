import React, { useState } from 'react';
import {
  Building2,
  Cpu,
  Download,
  Upload,
  RotateCcw,
  Check,
  Info,
  Eye,
  EyeOff,
  User
} from 'lucide-react';
import { ManualDocument, KnowledgeProposal } from '../types/manual';
import { ApprovalsView } from './ApprovalsView';
import { EmbedIntegrationView } from './EmbedIntegrationView';
import { USERS } from '../data/users';

interface SettingsViewProps {
  companyName: string;
  setCompanyName: (name: string) => void;
  manuals: ManualDocument[];
  onImportManuals: (imported: ManualDocument[]) => void;
  onResetManuals: () => void;
  hasGeminiKey: boolean;
  proposals: KnowledgeProposal[];
  onApproveProposal: (prop: KnowledgeProposal, approverName: string) => void;
  onRejectProposal: (prop: KnowledgeProposal, reason: string, approverName: string) => void;
  onOpenProposeModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyName,
  setCompanyName,
  manuals,
  onImportManuals,
  onResetManuals,
  hasGeminiKey,
  proposals,
  onApproveProposal,
  onRejectProposal,
  onOpenProposeModal
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

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'embed' | 'approvals' | 'users'>('general');

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col bg-[#2f3140] text-white">
      {/* Sub-menu */}
      <div className="px-4 sm:px-6 pt-6 pb-2 border-b border-[#3e4153] bg-[#262835]">
        <div className="flex gap-2">
          {[
            { id: 'general', label: 'Configuración General' },
            { id: 'embed', label: 'Despliegue & Conexión' },
            { id: 'approvals', label: 'Control de Calidad' },
            { id: 'users', label: 'Usuarios' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold transition-all ${
                activeSubTab === tab.id
                  ? 'bg-[#2f3140] text-[#ca4048] border-b-2 border-[#ca4048]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeSubTab === 'general' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Configuración del Asistente y Book Corporativo
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                Ajusta la identidad empresarial, revisa el estado del motor Gemini y gestiona respaldos del repositorio.
              </p>
            </div>

            {/* Company Name Customization */}
            <div className="p-6 rounded-2xl bg-[#262835] border border-[#3e4153] shadow-md space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ca4048]/20 text-[#ca4048] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Nombre de la Organización</h2>
              </div>
              <p className="text-xs text-slate-300">
                El Asistente utilizará este nombre para identificarse y contextualizar las normativas corporativas.
              </p>

              <form onSubmit={handleSaveName} className="flex gap-3 max-w-md">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Ej. Mi Empresa S.A."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#2f3140] border border-[#3e4153] text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048] transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#ca4048] hover:bg-[#b5343c] text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
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
            <div className="p-6 rounded-2xl bg-[#262835] border border-[#3e4153] shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#ca4048]/20 text-[#ca4048] flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-white">Motor de Inteligencia Artificial</h2>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  hasGeminiKey
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${hasGeminiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{hasGeminiKey ? 'Conectado a Gemini 3.8 Flash' : 'Motor RAG Interno Activo'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#2f3140] border border-[#3e4153] space-y-1">
                  <div className="text-slate-300 font-medium">Modelo Principal</div>
                  <div className="text-sm font-bold text-[#ca4048]">gemini-3.8-flash</div>
                  <div className="text-[11px] text-slate-400">Respuestas rápidas, amigables y fundamentadas</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#2f3140] border border-[#3e4153] space-y-1">
                  <div className="text-slate-300 font-medium">Arquitectura de Servidor</div>
                  <div className="text-sm font-bold text-white">Express + Vite + @google/genai</div>
                  <div className="text-[11px] text-slate-400">Llamadas seguras en servidor (/api/chat)</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#2f3140] border border-[#3e4153] text-xs text-slate-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#ca4048] shrink-0 mt-0.5" />
                <span>
                  Las llamadas a Gemini se procesan en el backend con telemetría <code className="bg-[#262835] px-1 py-0.5 rounded text-[11px] font-mono border border-[#3e4153]">User-Agent: aistudio-build</code>. Tu API Key se inyecta de forma segura mediante variables de entorno del servidor.
                </span>
              </div>
            </div>

            {/* Export & Import Backup */}
            <div className="p-6 rounded-2xl bg-[#262835] border border-[#3e4153] shadow-md space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ca4048]/20 text-[#ca4048] flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">Respaldo y Portabilidad del Book</h2>
              </div>
              <p className="text-xs text-slate-300">
                Descarga todos los manuales y cláusulas en formato JSON estructurado o importa un book existente de otra sede.
              </p>

              {importError && (
                <div className="p-3 rounded-lg bg-[#ca4048]/20 border border-[#ca4048]/50 text-xs text-white">
                  {importError}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2f3140] hover:bg-[#3e4153] text-white text-xs font-semibold transition-all border border-[#3e4153]"
                >
                  <Download className="w-4 h-4 text-slate-300" />
                  <span>Exportar Book a JSON ({manuals.length} manuales)</span>
                </button>

                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2f3140] hover:bg-[#3e4153] text-white text-xs font-semibold cursor-pointer transition-all border border-[#3e4153]">
                  <Upload className="w-4 h-4 text-slate-300" />
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2f3140] hover:bg-[#ca4048]/20 text-slate-300 hover:text-[#ca4048] text-xs font-semibold border border-[#3e4153] hover:border-[#ca4048]/50 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restablecer a Valores de Fábrica</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'embed' && (
          <EmbedIntegrationView
            companyName={companyName}
            manuals={manuals}
            hasGeminiKey={hasGeminiKey}
          />
        )}

        {activeSubTab === 'approvals' && (
          <ApprovalsView
            proposals={proposals}
            onApprove={onApproveProposal}
            onReject={onRejectProposal}
            onOpenProposeModal={onOpenProposeModal}
          />
        )}

        {activeSubTab === 'users' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {USERS.map((user) => {
                const UserCard = () => {
                  const [showPass, setShowPass] = useState(false);
                  return (
                    <div className="p-4 rounded-2xl bg-[#262835] border border-[#3e4153] shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#ca4048]/20 text-[#ca4048] flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white capitalize">{user.name}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            {showPass ? user.password : '••••••'}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-[#ca4048] transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                };
                return <UserCard key={user.name} />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
