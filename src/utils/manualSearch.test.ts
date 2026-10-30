import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  extractKeywords,
  searchManuals,
  buildManualContext,
  generateLocalGroundedAnswer,
  extractRelevantExcerpt,
  isOffTopicQuery,
  detectConversationalIntent
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

test('detectConversationalIntent identifies pure social pleasantries without manual search', () => {
  assert.equal(detectConversationalIntent('hola'), 'greeting');
  assert.equal(detectConversationalIntent('¡Hola!'), 'greeting');
  assert.equal(detectConversationalIntent('buenos días'), 'greeting');
  assert.equal(detectConversationalIntent('buenas tardes amigo'), 'greeting');

  assert.equal(detectConversationalIntent('gracias'), 'thanks');
  assert.equal(detectConversationalIntent('muchas gracias'), 'thanks');
  assert.equal(detectConversationalIntent('vale gracias'), 'thanks');

  assert.equal(detectConversationalIntent('chao'), 'farewell');
  assert.equal(detectConversationalIntent('hasta luego'), 'farewell');

  assert.equal(detectConversationalIntent('ok'), 'acknowledgment');
  assert.equal(detectConversationalIntent('entendido'), 'acknowledgment');

  // A work question starting with greeting MUST NOT be classified as pure greeting!
  assert.equal(detectConversationalIntent('hola, ¿cómo solicito mis vacaciones?'), null);
  assert.equal(detectConversationalIntent('buenos días, necesito saber sobre los viáticos'), null);
});

test('searchManuals does NOT trigger when user sends pure greeting or thanks', () => {
  const resultsHola = searchManuals('hola', DEFAULT_MANUALS);
  assert.equal(resultsHola.length, 0);

  const resultsGracias = searchManuals('muchas gracias', DEFAULT_MANUALS);
  assert.equal(resultsGracias.length, 0);

  const resultsChao = searchManuals('hasta luego', DEFAULT_MANUALS);
  assert.equal(resultsChao.length, 0);
});

test('searchManuals accurately retrieves CCTV article for camera monitoring questions', () => {
  const results = searchManuals('¿Cómo realizo el monitoreo de cámaras y patrullaje virtual?', DEFAULT_MANUALS);
  assert.ok(results.length > 0);
  assert.equal(results[0].section.id, 'seg-monitoreo-cctv');
  assert.equal(results[0].manual.code, 'MAN-SEG-01');
});

test('searchManuals retrieves alarm procedure for security alarm queries', () => {
  const results = searchManuals('reacción ante alarma de intrusión e incidentes', DEFAULT_MANUALS);
  assert.ok(results.length > 0);
  assert.equal(results[0].section.id, 'seg-reaccion-alarma');
  assert.equal(results[0].manual.code, 'MAN-SEG-03');
});

test('buildManualContext generates structured context with manual code and title', () => {
  const results = searchManuals('cámaras de seguridad', DEFAULT_MANUALS);
  const context = buildManualContext(results);
  assert.ok(context.includes('MAN-SEG-01'));
  assert.ok(context.includes('Art. 1.1'));
});

test('generateLocalGroundedAnswer yields grounded answers with valid citations', () => {
  const results = searchManuals('acceso de personal e identificación', DEFAULT_MANUALS);
  const { answer, citations } = generateLocalGroundedAnswer('acceso de personal', results, 'direct');
  assert.ok(answer.length > 20);
  assert.ok(citations.length > 0);
  assert.equal(citations[0].sectionId, 'seg-acceso-personal');
});

test('generateLocalGroundedAnswer answers greetings and thanks conversationally without citations', () => {
  const greetingResult = generateLocalGroundedAnswer('hola', []);
  assert.ok(greetingResult.answer.includes('¡Hola!'));
  assert.equal(greetingResult.citations.length, 0);

  const thanksResult = generateLocalGroundedAnswer('muchas gracias', []);
  assert.ok(thanksResult.answer.includes('¡De nada!'));
  assert.equal(thanksResult.citations.length, 0);
});

test('isOffTopicQuery accurately identifies anime and off-topic questions', () => {
  assert.ok(isOffTopicQuery('¿Quién es el papá de Naruto?'));
  assert.ok(isOffTopicQuery('cuéntame un chiste de pepito'));
  assert.ok(isOffTopicQuery('dame una receta para hacer pizza casera'));
  assert.ok(isOffTopicQuery('quién ganó el partido de fútbol de ayer'));

  // Company work topics should NOT be off topic
  assert.ok(!isOffTopicQuery('¿Cuántos días de vacaciones tengo?'));
  assert.ok(!isOffTopicQuery('¿Cómo solicito reembolso de viáticos?'));
  assert.ok(!isOffTopicQuery('¿Qué longitud mínima debe tener mi contraseña de TI?'));
});

test('generateLocalGroundedAnswer gives friendly redirection for off-topic questions like Naruto', () => {
  const { answer, citations } = generateLocalGroundedAnswer('Háblame de Naruto y Sasuke', []);
  assert.ok(answer.includes('Naruto'));
  assert.ok(answer.includes('empresa') || answer.includes('oficina'));
  assert.equal(citations.length, 0);
});

test('extractRelevantExcerpt extracts only the matching sentence or key point instead of dumping whole manual', () => {
  const longManualText = `
  Capítulo I: Disposiciones de Carácter General y Ámbito de Aplicación.
  El presente reglamento tiene por objeto establecer las normas básicas que rigen la relación laboral entre la empresa y todos sus trabajadores dependientes.
  
  Artículo 15: Régimen Anual de Feriado y Vacaciones.
  Todo colaborador con contrato indefinido tiene derecho a un feriado anual de 22 días hábiles con remuneración íntegra.
  La solicitud deberá ingresarse con al menos 15 días corridos de anticipación en el portal de autoservicio de la intranet.
  
  Artículo 16: Rendición y Gastos de Viaje.
  Los gastos incurridos por concepto de traslados y alimentación deberán ser rendidos dentro de los 5 días hábiles siguientes al término de la comisión.
  `;

  const query = '¿cuántos días de vacaciones me corresponden y con cuánta anticipación debo pedirlas?';
  const extracted = extractRelevantExcerpt(longManualText, query);

  // Must include the specific vacation rules
  assert.ok(extracted.includes('22 días'));
  assert.ok(extracted.includes('15 días'));
  // Must NOT include unrelated long sections like Article 16 or general introduction
  assert.ok(!extracted.includes('Artículo 16: Rendición'));
  assert.ok(!extracted.includes('Capítulo I: Disposiciones de Carácter General'));
});

test('generateLocalGroundedAnswer yields concise extracted answer without dumping full manual pages', () => {
  const results = searchManuals('monitoreo de cámaras de seguridad', DEFAULT_MANUALS);
  const { answer } = generateLocalGroundedAnswer('¿cada cuántos minutos se hace el patrullaje de cámaras?', results, 'direct');
  assert.ok(answer.includes('MAN-SEG-01'));
  // Must not be an absurd wall of text
  assert.ok(answer.length < 900);
});

