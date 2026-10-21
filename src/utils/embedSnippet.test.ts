import test from 'node:test';
import assert from 'node:assert/strict';
import { generateIframeSnippet, generateWidgetScriptSnippet } from './embedSnippet';

test('generateIframeSnippet builds valid iframe tag with query params', () => {
  const snippet = generateIframeSnippet('https://mi-empresa.com/app', {
    companyName: 'Acme Corp',
    themeColor: '#6366f1'
  });

  assert.ok(snippet.includes('<iframe'));
  assert.ok(snippet.includes('src="https://mi-empresa.com/app/?mode=widget'));
  assert.ok(snippet.includes('company=Acme+Corp'));
  assert.ok(snippet.includes('allow="clipboard-write"'));
});

test('generateWidgetScriptSnippet outputs defer script tag with dataset attributes', () => {
  const snippet = generateWidgetScriptSnippet('https://mi-empresa.com/app', {
    companyName: 'Tech Logistics',
    themeColor: '#059669',
    position: 'bottom-left'
  });

  assert.ok(snippet.includes('<script'));
  assert.ok(snippet.includes('src="https://mi-empresa.com/app/widget.js"'));
  assert.ok(snippet.includes('data-company="Tech Logistics"'));
  assert.ok(snippet.includes('data-color="#059669"'));
  assert.ok(snippet.includes('data-position="bottom-left"'));
});
