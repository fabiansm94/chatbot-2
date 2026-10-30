import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeHtmlEntities,
  cleanRawHtmlTags,
  stripHtmlForPreview
} from './textFormatting';

test('decodeHtmlEntities decodes common HTML entities and accented characters', () => {
  assert.equal(decodeHtmlEntities('&amp;'), '&');
  assert.equal(decodeHtmlEntities('&lt; 15 d&iacute;as &gt; 5'), '< 15 días > 5');
  assert.equal(decodeHtmlEntities('&quot;vacaciones&quot; &#39;urgente&#39;'), '"vacaciones" \'urgente\'');
  assert.equal(decodeHtmlEntities('&copy; 2026 &bull; &plusmn; 5%'), '© 2026 • ± 5%');
  assert.equal(decodeHtmlEntities('&#60;test&#62;'), '<test>');
});

test('cleanRawHtmlTags cleans target blank noopener artifacts and converts to markdown links', () => {
  const artifactText = 'Consulta el portal interno (target) <a target="_blank" rel="noopener noreferrer nofollow" href="https://portal.empresa.com">Portal de Personas</a> para solicitar tus días.';
  const cleaned = cleanRawHtmlTags(artifactText);

  assert.ok(cleaned.includes('[Portal de Personas](https://portal.empresa.com)'));
  assert.ok(!cleaned.includes('noopener'));
  assert.ok(!cleaned.includes('noreferrer'));
  assert.ok(!cleaned.includes('(target)'));
  assert.ok(!cleaned.includes('<a target='));
});

test('cleanRawHtmlTags preserves mathematical symbols and inequality signs', () => {
  const mathText = 'La contraseña debe tener >= 14 caracteres y durar < 90 días. Saldo > $0.';
  const cleaned = cleanRawHtmlTags(mathText);

  assert.ok(cleaned.includes('>= 14 caracteres'));
  assert.ok(cleaned.includes('< 90 días'));
  assert.ok(cleaned.includes('> $0'));
});

test('cleanRawHtmlTags handles paragraph and formatting tags', () => {
  const htmlText = '<p>Primer párrafo con <strong>negrita</strong> y <em>cursiva</em>.</p><p>Segundo párrafo con <code>código</code>.</p>';
  const cleaned = cleanRawHtmlTags(htmlText);

  assert.ok(cleaned.includes('**negrita**'));
  assert.ok(cleaned.includes('*cursiva*'));
  assert.ok(cleaned.includes('`código`'));
  assert.ok(!cleaned.includes('<p>'));
  assert.ok(!cleaned.includes('</p>'));
});

test('stripHtmlForPreview generates clean plain text preview for cards', () => {
  const textWithHtml = '<p>Revisa el <a href="https://example.com" target="_blank" rel="noopener">enlace oficial</a> para ver los requisitos &amp; condiciones &lt; 30 días.</p>';
  const preview = stripHtmlForPreview(textWithHtml, 100);

  assert.equal(preview, 'Revisa el enlace oficial para ver los requisitos & condiciones < 30 días.');
});
