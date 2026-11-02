import React, { useState } from 'react';
import {
  Copy,
  Check,
  Globe,
  MessageSquare,
  Layers,
  FileCode
} from 'lucide-react';
import { generateIframeSnippet, generateWidgetScriptSnippet } from '../utils/embedSnippet';
import { WidgetContainer } from './WidgetContainer';
import { ManualDocument } from '../types/manual';

interface EmbedIntegrationViewProps {
  companyName: string;
  manuals: ManualDocument[];
  hasGeminiKey: boolean;
}

export const EmbedIntegrationView: React.FC<EmbedIntegrationViewProps> = ({
  companyName,
  manuals,
  hasGeminiKey
}) => {
  const [activeSnippetTab, setActiveSnippetTab] = useState<'iframe' | 'script' | 'link'>('iframe');
  const [themeColor, setThemeColor] = useState('#d84451');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Simulator state: open by default so the Embed always shows in its Chat version
  const [simWidgetOpen, setSimWidgetOpen] = useState(true);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tu-empresa-app.run.app';
  const widgetUrl = `${currentOrigin}/?mode=widget`;

  const scriptCode = generateWidgetScriptSnippet(currentOrigin, {
    companyName,
    themeColor,
    position: widgetPosition
  });

  const iframeCode = generateIframeSnippet(currentOrigin, {
    companyName,
    themeColor
  });

  const handleCopy = (type: 'script' | 'iframe' | 'link') => {
    let text = '';
    if (type === 'script') text = scriptCode;
    if (type === 'iframe') text = iframeCode;
    if (type === 'link') text = widgetUrl;

    navigator.clipboard.writeText(text);
    if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else if (type === 'iframe') {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const colorPresets = [
    { label: 'Rojo AI-zen', value: '#d84451' },
    { label: 'Coral Oficial', value: '#fa5252' },
    { label: 'Índigo Tech', value: '#4f46e5' },
    { label: 'Azul Corporativo', value: '#2563eb' },
    { label: 'Esmeralda', value: '#059669' }
  ];

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#2f3140] text-white space-y-6">
      {/* Top Banner Card */}
      <div className="p-6 rounded-2xl bg-[#262835] border border-[#3e4153] shadow-md">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#ca4048]">
              Despliegue & Conexión
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-xs text-slate-300">Integración de AI-zen en Web</span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Integrar AI-zen (Versión Chat) en tu Web o Intranet
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Al incrustar este código en tu página web, SharePoint, WordPress, Google Sites o Notion, aparecerá directamente la versión chat de AI-zen lista para responder consultas de manuales y procedimientos.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Embed Methods & Code */}
        <div className="lg:col-span-7 space-y-4">
          {/* Method Selector Tabs */}
          <div className="p-1 rounded-full bg-[#262835] border border-[#3e4153] flex items-center gap-1 shadow-xs">
            <button
              onClick={() => setActiveSnippetTab('iframe')}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeSnippetTab === 'iframe'
                  ? 'bg-[#ca4048] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chat Embebido (iFrame)</span>
            </button>

            <button
              onClick={() => setActiveSnippetTab('script')}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeSnippetTab === 'script'
                  ? 'bg-[#ca4048] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Widget Flotante</span>
            </button>

            <button
              onClick={() => setActiveSnippetTab('link')}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeSnippetTab === 'link'
                  ? 'bg-[#ca4048] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>URL Directa del Chat</span>
            </button>
          </div>

          {/* Configuration Options */}
          <div className="p-5 rounded-2xl bg-[#262835] border border-[#3e4153] shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Personalizar Apariencia del Embed:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Color Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Color Primario:</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {colorPresets.map(preset => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setThemeColor(preset.value)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          themeColor === preset.value ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: preset.value }}
                        title={preset.label}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    className="w-7 h-7 rounded border border-[#3e4153] cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Ubicación en Pantalla:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWidgetPosition('bottom-right')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      widgetPosition === 'bottom-right'
                        ? 'bg-[#ca4048]/20 border-[#ca4048] text-white font-semibold'
                        : 'bg-[#2f3140] border-[#3e4153] text-slate-300'
                    }`}
                  >
                    Inferior Derecha
                  </button>
                  <button
                    type="button"
                    onClick={() => setWidgetPosition('bottom-left')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      widgetPosition === 'bottom-left'
                        ? 'bg-[#ca4048]/20 border-[#ca4048] text-white font-semibold'
                        : 'bg-[#2f3140] border-[#3e4153] text-slate-300'
                    }`}
                  >
                    Inferior Izquierda
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Code Snippet */}
          <div className="rounded-2xl bg-[#262835] border border-[#3e4153] overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-[#1e202b] flex items-center justify-between border-b border-[#3e4153]">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#ca4048]" />
                <span className="text-xs font-mono text-slate-300">
                  {activeSnippetTab === 'iframe' ? 'embed-chat-iframe.html' : activeSnippetTab === 'script' ? 'código-widget.html' : 'url-embed-chat.txt'}
                </span>
              </div>

              <button
                onClick={() => handleCopy(activeSnippetTab)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white text-white hover:text-slate-900 text-xs font-semibold transition-all"
              >
                {(activeSnippetTab === 'script' && copiedScript) ||
                (activeSnippetTab === 'iframe' && copiedIframe) ||
                (activeSnippetTab === 'link' && copiedLink) ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 font-mono text-xs text-rose-200 overflow-x-auto leading-relaxed bg-[#262835]">
              <pre>
                {activeSnippetTab === 'iframe' ? iframeCode : activeSnippetTab === 'script' ? scriptCode : widgetUrl}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Live Chat Embed Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#262835] border border-[#3e4153] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Vista Previa del Embed (Versión Chat):
              </h3>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/40">
                ● Chat Activo
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Así es exactamente como aparece AI-zen en su versión chat dentro del embed (sin barras de administración laterales).
            </p>

            {simWidgetOpen && (
              <div className="w-full max-w-[400px] h-[600px] mx-auto rounded-[28px] border border-rose-200/40 overflow-hidden shadow-2xl bg-[#fff8f8]">
                <WidgetContainer
                  companyName={companyName}
                  primaryColor={themeColor}
                  manuals={manuals}
                  hasGeminiKey={hasGeminiKey}
                />
              </div>
            )}

            <div className="pt-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setSimWidgetOpen(!simWidgetOpen)}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#2f3140] hover:bg-[#383b4d] border border-[#3e4153] text-xs text-slate-200 font-medium transition-all cursor-pointer"
              >
                <img
                  src="/assets/aistudio/bot_avatar_custom.png"
                  alt="AI-zen"
                  className="w-6 h-6 object-contain"
                />
                <span>{simWidgetOpen ? 'Minimizar vista previa' : 'Abrir vista previa del Chat'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
