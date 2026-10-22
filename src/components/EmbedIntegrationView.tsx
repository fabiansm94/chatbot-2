import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Globe,
  Sparkles,
  ExternalLink,
  Laptop,
  MessageSquare,
  ShieldCheck,
  Palette,
  Layers,
  Bot,
  HelpCircle,
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
  const [activeSnippetTab, setActiveSnippetTab] = useState<'script' | 'iframe' | 'link'>('script');
  const [themeColor, setThemeColor] = useState('#fa5252');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Simulator state
  const [simWidgetOpen, setSimWidgetOpen] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://tu-empresa-app.run.app';
  const directLink = `${currentOrigin}/`;
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
    if (type === 'link') text = directLink;

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
    { label: 'Coral Oficial', value: '#fa5252' },
    { label: 'Índigo Tech', value: '#4f46e5' },
    { label: 'Azul Corporativo', value: '#2563eb' },
    { label: 'Esmeralda', value: '#059669' },
    { label: 'Morado Ejecutivo', value: '#7c3aed' }
  ];

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#fafbfc] space-y-6">
      {/* Top Banner Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#fa5252]">
              Despliegue & Conexión
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">Integración en Web</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            ¿Cómo poner este Chatbot en la página de tu trabajo?
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Puedes integrarlo en la web de tu empresa, SharePoint, WordPress, Google Sites, Notion o Confluence. Tus trabajadores tendrán acceso inmediato a todos los manuales y procedimientos internos.
          </p>
        </div>
      </div>

      {/* Main Grid: Code Generator on the left, Live Intranet Simulator on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Embed Methods & Code */}
        <div className="lg:col-span-7 space-y-4">
          {/* Method Selector Tabs */}
          <div className="p-1 rounded-full bg-white border border-slate-200 flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => setActiveSnippetTab('script')}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeSnippetTab === 'script'
                  ? 'bg-[#fa5252] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Burbuja Flotante</span>
            </button>

            <button
              onClick={() => setActiveSnippetTab('iframe')}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeSnippetTab === 'iframe'
                  ? 'bg-[#fa5252] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>iFrame Embebido</span>
            </button>

            <button
              onClick={() => setActiveSnippetTab('link')}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                activeSnippetTab === 'link'
                  ? 'bg-[#fa5252] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Enlace Directo</span>
            </button>
          </div>

          {/* Configuration Options */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Personalizar Apariencia del Widget:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Color Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">Color Primario:</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {colorPresets.map(preset => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setThemeColor(preset.value)}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          themeColor === preset.value ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'
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
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-600">Ubicación en Pantalla:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWidgetPosition('bottom-right')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      widgetPosition === 'bottom-right'
                        ? 'bg-rose-50 border-[#fa5252] text-[#fa5252] font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Inferior Derecha
                  </button>
                  <button
                    type="button"
                    onClick={() => setWidgetPosition('bottom-left')}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      widgetPosition === 'bottom-left'
                        ? 'bg-rose-50 border-[#fa5252] text-[#fa5252] font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Inferior Izquierda
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Code Snippet */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#fa5252]" />
                <span className="text-xs font-mono text-slate-300">
                  {activeSnippetTab === 'script' ? 'código-widget.html' : activeSnippetTab === 'iframe' ? 'embed-iframe.html' : 'url-directa.txt'}
                </span>
              </div>

              <button
                onClick={() => handleCopy(activeSnippetTab)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white text-slate-300 hover:text-slate-900 text-xs font-semibold transition-all"
              >
                {activeSnippetTab === 'script' && copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>¡Copiado!</span>
                  </>
                ) : activeSnippetTab === 'iframe' && copiedIframe ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
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

            <div className="p-4 font-mono text-xs text-rose-200 overflow-x-auto leading-relaxed bg-slate-900">
              <pre>
                {activeSnippetTab === 'script' ? scriptCode : activeSnippetTab === 'iframe' ? iframeCode : directLink}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Simulador en Vivo:
              </h3>
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
                ● Listo para producción
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Haz clic en el botón circular abajo para abrir o cerrar la ventana del bot exactamente como se verá en tu intranet corporativa.
            </p>

            <div className="p-6 rounded-xl bg-slate-100/80 border border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 text-center">
              <button
                type="button"
                onClick={() => setSimWidgetOpen(!simWidgetOpen)}
                className="w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer overflow-hidden p-1 bg-white ring-2 ring-rose-200"
              >
                <img
                  src="/assets/aistudio/Minimal_White_Mascot_Face_Icon_40e4f488.png"
                  alt="ManualBot"
                  className="w-full h-full object-contain"
                />
              </button>
              <div className="text-xs text-slate-600 font-medium">
                {simWidgetOpen ? 'El widget está ABIERTO' : 'Haz clic para probar el botón flotante'}
              </div>
            </div>

            {simWidgetOpen && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xl">
                <WidgetContainer
                  companyName={companyName}
                  primaryColor={themeColor}
                  manuals={manuals}
                  hasGeminiKey={hasGeminiKey}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
