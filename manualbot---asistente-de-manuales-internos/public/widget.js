(function() {
  if (window.__ManualBotInitialized) return;
  window.__ManualBotInitialized = true;

  var script = document.currentScript;
  var appUrl = (script && script.getAttribute('data-app-url')) || window.location.origin;
  var company = (script && script.getAttribute('data-company')) || 'Nuestra Empresa';
  var color = (script && script.getAttribute('data-color')) || '#4f46e5';
  var isLeft = (script && script.getAttribute('data-position')) === 'bottom-left';

  var container = document.createElement('div');
  container.id = 'manualbot-widget-container';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style[isLeft ? 'left' : 'right'] = '20px';
  container.style.zIndex = '999999';
  container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  var iframe = document.createElement('iframe');
  iframe.src = appUrl + '/?mode=widget&company=' + encodeURIComponent(company);
  iframe.style.position = 'fixed';
  iframe.style.bottom = '85px';
  iframe.style[isLeft ? 'left' : 'right'] = '20px';
  iframe.style.width = '380px';
  iframe.style.height = '580px';
  iframe.style.maxWidth = 'calc(100vw - 32px)';
  iframe.style.maxHeight = 'calc(100vh - 110px)';
  iframe.style.border = '1px solid rgba(255, 255, 255, 0.15)';
  iframe.style.borderRadius = '18px';
  iframe.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.4)';
  iframe.style.display = 'none';
  iframe.style.zIndex = '999999';
  iframe.style.transition = 'all 0.25s ease';
  iframe.title = 'ManualBot - Asistente de Manuales Internos';
  iframe.allow = 'clipboard-write';

  var button = document.createElement('button');
  button.type = 'button';
  button.style.width = '56px';
  button.style.height = '56px';
  button.style.borderRadius = '50%';
  button.style.backgroundColor = color;
  button.style.color = '#ffffff';
  button.style.border = 'none';
  button.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.transition = 'transform 0.2s, box-shadow 0.2s';
  button.setAttribute('aria-label', 'Abrir Asistente de Manuales Internos');

  button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  button.onmouseenter = function() { button.style.transform = 'scale(1.06)'; };
  button.onmouseleave = function() { button.style.transform = 'scale(1)'; };

  var isOpen = false;
  button.onclick = function() {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    button.innerHTML = isOpen
      ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  };

  container.appendChild(button);
  document.body.appendChild(iframe);
  document.body.appendChild(container);
})();
