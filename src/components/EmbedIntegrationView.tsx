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
  const [themeColor, setThemeColor] = useState('#4f46e5');
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
    { label: 'Índigo Corporativo', value: '#4f46e5' },
    { label: 'Azul Marino / Tech', value: '#2563eb' },
    { label: 'Esmeralda / SST', value: '#059669' },
    { label: 'Morado Ejecutivo', value: '#7c3aed' },
    { label: 'Ámbar Cálido', value: '#d97706' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Affirmation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Compatible con Cualquier Web o Intranet</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            ¿Cómo poner este Chatbot en la página de tu trabajo?
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            <strong>¡Sí, funciona perfectamente!</strong> Puedes integrarlo en la página de tu empresa, intranet de SharePoint, WordPress, Google Sites, Notion o Confluence. Tus trabajadores tendrán acceso inmediato a todos los manuales y procedimientos internos sin salir de su flujo de trabajo.
          </p>
        </div>
      </div>

      {/* Main Grid: Code Generator on the left, Live Intranet Simulator on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Embed Methods & Code */}
        <div className="lg:col-span-7 space-y-6">
          {/* Method Selector Tabs */}
          <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setActiveSnippetTab('script')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                activeSnippetTab === 'script'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>1. Burbuja Flotante (Recomendado)</span>
            </button>

            <button
              onClick={() => setActiveSnippetTab('iframe')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                activeSnippetTab === 'iframe'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2. iFrame Embebido</span>
            </button>

            <button
              onClick={() => setActiveSnippetTab('link')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                activeSnippetTab === 'link'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>3. Enlace Directo</span>
            </button>
          </div>

          {/* Configuration Panel */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <span>Personalizar aspecto del widget</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Color de Marca / Botón:</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorPresets.map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => setThemeColor(preset.value)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        themeColor === preset.value ? 'scale-115 border-white shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                  <input
                    type="color"
                    value={themeColor}
                    onChange={e => setThemeColor(e.target.value)}
                    className="w-6 h-6 rounded-full bg-transparent border-0 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Posición en la pantalla:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWidgetPosition('bottom-right')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      widgetPosition === 'bottom-right'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Inferior Derecha
                  </button>
                  <button
                    onClick={() => setWidgetPosition('bottom-left')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      widgetPosition === 'bottom-left'
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    Inferior Izquierda
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Snippet Code Box */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-400" />
                {activeSnippetTab === 'script' && 'Código JavaScript (Pegar en tu web o CMS)'}
                {activeSnippetTab === 'iframe' && 'Código HTML (iFrame para incrustar)'}
                {activeSnippetTab === 'link' && 'URL directa del Portal'}
              </span>

              <button
                onClick={() => handleCopy(activeSnippetTab)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                {(activeSnippetTab === 'script' && copiedScript) ||
                (activeSnippetTab === 'iframe' && copiedIframe) ||
                (activeSnippetTab === 'link' && copiedLink) ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Código</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-200 overflow-x-auto font-mono select-all leading-relaxed">
              {activeSnippetTab === 'script' && scriptCode}
              {activeSnippetTab === 'iframe' && iframeCode}
              {activeSnippetTab === 'link' && directLink}
            </pre>

            {/* Step-by-step instructions */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>¿Dónde se pega este código en tu empresa?</span>
              </div>
              {activeSnippetTab === 'script' && (
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                  <li>Copia el código superior con el botón <strong>Copiar Código</strong>.</li>
                  <li>Ve a tu sitio corporativo (WordPress, SharePoint, panel de intranet o archivo <code className="text-indigo-300">index.html</code>).</li>
                  <li>Pégalo justo antes de la etiqueta de cierre <code className="text-indigo-300">&lt;/body&gt;</code> o en el bloque de scripts del encabezado.</li>
                  <li>¡Listo! Aparecerá de inmediato el botón flotante en la esquina para todos los trabajadores.</li>
                </ol>
              )}
              {activeSnippetTab === 'iframe' && (
                <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                  <li>Copia el bloque <code className="text-indigo-300">&lt;iframe&gt;</code>.</li>
                  <li>En tu gestor de contenido o intranet (ej. SharePoint / WordPress / Google Sites), agrega un bloque de <strong>"Insertar Código HTML"</strong> o <strong>"Embed"</strong>.</li>
                  <li>Pega el código. La ventana del asistente se mostrará integrada dentro de la propia página.</li>
                </ol>
              )}
              {activeSnippetTab === 'link' && (
                <p className="text-slate-400">
                  Comparte esta URL con tus trabajadores, agrégala en los marcadores de Google Chrome / Edge o vincúlala en el menú de navegación de la intranet de la empresa.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Simulator of Company Intranet with Floating Widget */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-indigo-400" />
                <span>Simulador en Vivo: Intranet de la Empresa</span>
              </h2>
              <p className="text-xs text-slate-400">
                Haz clic en la burbuja flotante para probar la experiencia que tendrán tus trabajadores.
              </p>
            </div>
          </div>

          {/* Browser Window Mockup */}
          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden min-h-[580px] flex flex-col">
            {/* Browser top chrome */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 max-w-xs mx-auto px-3 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 truncate text-center">
                intranet.{companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'empresa'}.com/portal
              </div>
            </div>

            {/* Mock Intranet Content */}
            <div className="flex-1 p-5 space-y-4 bg-slate-950/70 select-none overflow-y-auto">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Portal del Empleado • {companyName}
                </span>
                <h3 className="text-sm font-bold text-white">
                  Bienvenido al Espacio de Trabajo Digital
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Aquí puedes consultar comunicados internos, nóminas, calendario de festivos y noticias corporativas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="font-semibold text-white">Fichaje Diario</div>
                  <div className="text-[11px] text-emerald-400 mt-1">● Turno Activo (09:00 - 18:00)</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="font-semibold text-white">Mis Días Libres</div>
                  <div className="text-[11px] text-slate-400 mt-1">18 días disponibles</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/30 text-xs text-indigo-300">
                💡 <strong>Duda laboral:</strong> En cualquier momento puedes pulsar la burbuja de chat en la esquina para que el Asistente responda cualquier pregunta con base en los manuales oficiales.
              </div>
            </div>

            {/* Floating Widget Launcher Button */}
            <div
              className={`absolute bottom-4 ${
                widgetPosition === 'bottom-left' ? 'left-4' : 'right-4'
              } z-30`}
            >
              <button
                type="button"
                onClick={() => setSimWidgetOpen(!simWidgetOpen)}
                className="w-13 h-13 rounded-full text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: themeColor }}
                title="Abrir Asistente de Manuales Internos"
                aria-label="Abrir Asistente"
              >
                {simWidgetOpen ? (
                  <span className="text-lg font-bold">✕</span>
                ) : (
                  <Bot className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Floating Widget Popup (Inside the mock simulator) */}
            {simWidgetOpen && (
              <div
                className={`absolute bottom-20 ${
                  widgetPosition === 'bottom-left' ? 'left-3' : 'right-3'
                } w-[340px] h-[480px] max-w-[calc(100%-24px)] rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl z-40 overflow-hidden flex flex-col animate-fade-in`}
              >
                <WidgetContainer
                  companyName={companyName}
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
