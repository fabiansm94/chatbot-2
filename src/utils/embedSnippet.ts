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

  return `<!-- ManualBot: Asistente de Procedimientos Internos (iFrame) -->
<iframe
  src="${fullUrl}"
  width="100%"
  height="650"
  style="border: 1px solid #1e293b; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);"
  title="Asistente de Manuales y Procedimientos"
  allow="clipboard-write"
></iframe>`;
}

export function generateWidgetScriptSnippet(baseUrl: string, options: Partial<WidgetEmbedOptions> = {}): string {
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  const company = options.companyName || 'Nuestra Empresa';
  const color = options.themeColor || '#4f46e5';
  const position = options.position || 'bottom-right';

  return `<!-- ManualBot: Burbuja Flotante de Chat para Intranet o Sitio Web -->
<script
  src="${cleanUrl}/widget.js"
  data-app-url="${cleanUrl}"
  data-company="${company}"
  data-color="${color}"
  data-position="${position}"
  defer
></script>`;
}
