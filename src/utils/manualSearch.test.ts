import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  extractKeywords,
  searchManuals,
  buildManualContext,
  generateLocalGroundedAnswer
} from './manualSearch';
import { DEFAULT_MANUALS } from '../data/defaultManuals';

test('normalizeText cleans accents and symbols', () => {
  assert.equal(normalizeText('¡Hola! ¿Cómo estás?'), 'hola como estas');
  assert.equal(normalizeText('Vacación & Ciberseguridad'), 'vacacion ciberseguridad');
});

test('extractKeywords removes Spanish stop words and keeps meaningful tokens', () => {
  const keywords = extractKeywords('¿Cómo solicito mis vacaciones de verano?');
  assert.ok(keywords.includes('vacaciones'));
  assert.ok(keywords.includes('solicito'));
  assert.ok(!keywords.includes('como'));
  assert.ok(!keywords.includes('de'));
});

test('searchManuals accurately retrieves vacation article for vacation questions', () => {
  const results = searchManuals('¿Cuántos días de vacaciones me corresponden?', DEFAULT_MANUALS);
  assert.ok(results.length > 0);
  assert.equal(results[0].section.id, 'rrhh-vacaciones');
  assert.equal(results[0].manual.code, 'MAN-RRHH-01');
});

test('searchManuals retrieves phishing procedure for security queries', () => {
  const results = searchManuals('recibí un correo sospechoso con un link raro', DEFAULT_MANUALS);
  assert.ok(results.length > 0);
  assert.equal(results[0].section.id, 'ti-phishing-incidentes');
  assert.equal(results[0].manual.code, 'MAN-TI-02');
});

test('buildManualContext generates structured context with manual code and title', () => {
  const results = searchManuals('viáticos para viaje', DEFAULT_MANUALS);
  const context = buildManualContext(results);
  assert.ok(context.includes('MAN-OPS-05'));
  assert.ok(context.includes('Art. 2.1'));
});

test('generateLocalGroundedAnswer yields grounded answers with valid citations', () => {
  const results = searchManuals('seguro médico dental', DEFAULT_MANUALS);
  const { answer, citations } = generateLocalGroundedAnswer('seguro médico dental', results, 'direct');
  assert.ok(answer.length > 20);
  assert.ok(citations.length > 0);
  assert.equal(citations[0].sectionId, 'rrhh-beneficios');
});
