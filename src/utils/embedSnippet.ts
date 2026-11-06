export interface WidgetEmbedOptions {
  companyName: string;
  themeColor: string;
  position: 'bottom-right' | 'bottom-left';
  initialPrompt?: string;
}

export function generateIframeSnippet(baseUrl: string, options: Partial<WidgetEmbedOptions> = {}): string {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams();
  params.set('mode', 'widget');
  if (options.themeColor) params.set('color', options.themeColor);
  if (options.companyName) params.set('company', options.companyName);

  const fullUrl = `${cleanUrl}/?${params.toString()}`;

  return `<!-- AI-zen: Chat Embebido en Versión Chat Directa (iFrame) -->
<iframe
  src="${fullUrl}"
  width="100%"
  height="640"
  style="width: 100%; max-width: 420px; height: 640px; border: 1px solid #fecdd3; border-radius: 28px; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25); display: block; margin: 0 auto;"
  title="AI-zen - Asistente Control y Monitoreo"
  allow="clipboard-write"
></iframe>`;
}

export function generateWidgetScriptSnippet(baseUrl: string, options: Partial<WidgetEmbedOptions> = {}): string {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const company = options.companyName || 'Nuestra Empresa';
  const color = options.themeColor || '#d84451';
  const position = options.position || 'bottom-right';

  return `<!-- AI-zen: Widget de Chat para Intranet o Sitio Web -->
<script
  src="${cleanUrl}/widget.js"
  data-app-url="${cleanUrl}"
  data-company="${company}"
  data-color="${color}"
  data-position="${position}"
  defer
></script>`;
}
