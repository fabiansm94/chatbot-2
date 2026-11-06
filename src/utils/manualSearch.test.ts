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
  detectConversationalIntent,
  detectTargetEntityType
} from './manualSearch';
import { DEFAULT_MANUALS } from '../data/defaultManuals';
import { ManualDocument } from '../types/manual';

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

test('buildManualContext generates structured context with manual title and extracted data', () => {
  const results = searchManuals('cámaras de seguridad', DEFAULT_MANUALS);
  const context = buildManualContext(results);
  assert.ok(context.includes('REFERENCIA 1'));
  assert.ok(context.includes('Título:'));
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

test('detectTargetEntityType identifies schedule, person, and amount queries', () => {
  assert.equal(detectTargetEntityType('¿cuál es el horario de atención?'), 'schedule');
  assert.equal(detectTargetEntityType('¿a qué hora abren la oficina?'), 'schedule');
  assert.equal(detectTargetEntityType('¿cuál es el turno de noche?'), 'schedule');

  assert.equal(detectTargetEntityType('¿quién es el encargado de seguridad?'), 'person');
  assert.equal(detectTargetEntityType('¿cuál es el nombre del responsable?'), 'person');
  assert.equal(detectTargetEntityType('¿a quién le envío el formulario?'), 'person');

  assert.equal(detectTargetEntityType('¿cuántos días de anticipación necesito?'), 'amount');
  assert.equal(detectTargetEntityType('¿cuánto es el monto máximo de viáticos?'), 'amount');

  assert.equal(detectTargetEntityType('¿cómo configuro la vpn en windows?'), 'general');
});

test('extractRelevantExcerpt extracts ONLY the schedule from a long manual with multiple subtitles', () => {
  const multiSubtitleManual = `
  # Manual de Operaciones de Sucursal
  
  ## 1. Introducción y Filosofía
  Nuestra misión es ofrecer la mejor experiencia posible a nuestros clientes y colaboradores desde 2018.
  
  ## 2. Horario de Atención y Jornada
  El horario de atención al público es de lunes a viernes de 08:30 a 17:30 hrs ininterrumpido. Los días sábado no se atiende a público.
  
  ## 3. Código de Vestimenta
  Todo el personal debe vestir ropa formal o semiformal de acuerdo al manual corporativo de imagen.
  
  ## 4. Encargados y Responsables
  El Jefe de Sucursal a cargo es Carlos Morales (contacto: cmorales@empresa.com, anexo 402).
  
  ## 5. Procedimiento de Cierre Diario
  A las 18:00 se realiza el cuadre de caja y activación del sistema de alarmas perimetral.
  `;

  const query = '¿cuál es el horario de atención?';
  const extracted = extractRelevantExcerpt(multiSubtitleManual, query);

  // Must contain schedule
  assert.ok(extracted.includes('08:30 a 17:30'));
  // Must NOT contain unrelated subtitles
  assert.ok(!extracted.includes('Código de Vestimenta'));
  assert.ok(!extracted.includes('Carlos Morales'));
  assert.ok(!extracted.includes('Procedimiento de Cierre Diario'));
  assert.ok(!extracted.includes('Introducción y Filosofía'));
});

test('extractRelevantExcerpt extracts ONLY the responsible person and contact from a long manual', () => {
  const multiSubtitleManual = `
  # Manual de Operaciones de Sucursal
  
  ## 1. Introducción y Filosofía
  Nuestra misión es ofrecer la mejor experiencia posible a nuestros clientes y colaboradores desde 2018.
  
  ## 2. Horario de Atención y Jornada
  El horario de atención al público es de lunes a viernes de 08:30 a 17:30 hrs ininterrumpido.
  
  ## 3. Encargados y Responsables
  El Jefe de Sucursal y responsable de la sede es Carlos Morales (contacto: cmorales@empresa.com, anexo 402).
  
  ## 4. Cuadraturas y Bóveda
  La bóveda debe cerrarse bajo supervisión dual con dos llaves distintas custodiadas por tesorería.
  `;

  const query = '¿quién es el encargado y cuál es su correo?';
  const extracted = extractRelevantExcerpt(multiSubtitleManual, query);

  // Must contain the person name and contact
  assert.ok(extracted.includes('Carlos Morales'));
  assert.ok(extracted.includes('cmorales@empresa.com'));
  // Must NOT contain unrelated subtitles
  assert.ok(!extracted.includes('08:30 a 17:30'));
  assert.ok(!extracted.includes('Cuadraturas y Bóveda'));
  assert.ok(!extracted.includes('Introducción y Filosofía'));
});

test('extractRelevantExcerpt extracts ONLY the requested person from arrow-delimited manual text', () => {
  const forestaText = 'Foresta Residence / Puesto 25.0 / SI -01 En primer lugar, se debe controlar las entradas y salidas del puesto, así como llevar el registro de dichas entradas o salidas.o actuales como pendientes ➤ Al registr o diario de visitas, sus horas de ingreso y las visitas pendientes ➤ Personal autorizado por administración (Cinthia Collado/Jaco Desarrollos/H.W./HOLIDAY RENTALS /Áreas comunes (reciclar basura, fumigar, mantenimiento de piscinas, limpiezas generales, trab aios o';

  const query = 'quien es cinthia collado?';
  const extracted = extractRelevantExcerpt(forestaText, query);

  // Must contain the specific person and authorization
  assert.ok(extracted.includes('Cinthia Collado'));
  assert.ok(extracted.includes('Personal autorizado'));
  // Must NOT contain the rest of the manual
  assert.ok(!extracted.includes('entradas y salidas'));
  assert.ok(!extracted.includes('diario de visitas'));
  assert.ok(!extracted.includes('mantenimiento de piscinas'));
});

test('generateLocalGroundedAnswer responds directly with Ella es la administradora de Foresta Residence', () => {
  const forestaText = 'Foresta Residence / Puesto 25.0 / SI -01 En primer lugar, se debe controlar las entradas y salidas del puesto, así como llevar el registro de dichas entradas o salidas.o actuales como pendientes ➤ Al registr o diario de visitas, sus horas de ingreso y las visitas pendientes ➤ Personal autorizado por administración (Cinthia Collado/Jaco Desarrollos/H.W./HOLIDAY RENTALS /Áreas comunes (reciclar basura, fumigar, mantenimiento de piscinas, limpiezas generales, trab aios o';

  const mockManual: ManualDocument = {
    id: 'man-4110',
    title: 'Puesto 25 - Foresta Residence (1)',
    code: 'MAN-4110',
    category: 'seguridad',
    version: '1.0',
    updatedDate: '2026-10-30',
    department: 'Seguridad',
    iconName: 'ShieldCheck',
    summary: 'Manual puesto 25',
    sections: [
      {
        id: 'sec-info',
        articleNumber: 'Info',
        title: 'Info General',
        tags: ['foresta', 'cinthia', 'collado'],
        content: forestaText
      }
    ]
  };

  const results = searchManuals('quien es cinthia collado?', [mockManual]);
  const { answer } = generateLocalGroundedAnswer('quien es cinthia collado?', results, 'direct');

  assert.ok(answer.includes('Cinthia Collado'), `Expected Cinthia Collado in "${answer}"`);
  assert.ok(answer.includes('Foresta Residence'), `Expected Foresta Residence in "${answer}"`);
  assert.ok(!answer.includes('entradas y salidas'));
  assert.ok(!answer.includes('diario de visitas'));
  assert.ok(!answer.includes('piscinas'));

  // Also verify "quien es el admin de foresta?" yields Cinthia Collado
  const adminResults = searchManuals('quien es el admin de foresta?', [mockManual]);
  const adminAnswer = generateLocalGroundedAnswer('quien es el admin de foresta?', adminResults, 'direct');
  assert.ok(adminAnswer.answer.includes('Cinthia Collado'), `Expected Cinthia Collado in "${adminAnswer.answer}"`);
  assert.ok(adminAnswer.answer.includes('Foresta Residence'), `Expected Foresta Residence in "${adminAnswer.answer}"`);
});

test('searchManuals does not crash when manual sections lack tags property', () => {
  const manualWithoutTags: any = {
    id: 'man-untagged',
    title: 'Manual Sin Etiquetas',
    code: 'MAN-UNT',
    category: 'operaciones',
    version: '1.0',
    sections: [
      {
        id: 'sec-1',
        articleNumber: 'Art. 1',
        title: 'Horario',
        content: 'El horario de atención es de 09:00 a 18:00 hrs.'
        // Note: tags is undefined
      }
    ]
  };

  const results = searchManuals('horario de atencion', [manualWithoutTags]);
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].section.articleNumber, 'Art. 1');
});

test('multi-site query returns ONLY the requested site and never other sites', () => {
  const multiSiteDoc = 'Hay 3 Alexander: Alexander - Mantenimiento Foresta Alexander - Mantenimiento Sunset Alexander - Tecnico Sunset Luego estan: Farida - Liempeza Sunset Heidi - Limpieza Foresta';

  const mockManual: ManualDocument = {
    id: 'man-sites',
    title: 'Asignación de Puestos y Sedes',
    code: 'MAN-PUESTOS',
    category: 'operaciones',
    version: '1.0',
    updatedDate: '2026-11-02',
    department: 'Operaciones',
    iconName: 'ShieldCheck',
    summary: 'Personal por sede',
    sections: [
      {
        id: 'sec-puestos',
        articleNumber: 'Art. 1',
        title: 'Personal Asignado por Sede',
        tags: ['foresta', 'sunset', 'alexander', 'farida', 'heidi'],
        content: multiSiteDoc
      }
    ]
  };

  // 1. Query only Foresta
  const resultsForesta = searchManuals('Foresta', [mockManual]);
  const answerForesta = generateLocalGroundedAnswer('Foresta', resultsForesta, 'direct');
  assert.ok(answerForesta.answer.includes('Foresta'));
  assert.ok(answerForesta.answer.includes('Alexander'));
  assert.ok(answerForesta.answer.includes('Heidi'));
  assert.ok(!answerForesta.answer.includes('Sunset'), 'Must not include Sunset when querying Foresta');
  assert.ok(!answerForesta.answer.includes('Farida'), 'Must not include Farida when querying Foresta');

  // 2. Query only Sunset
  const resultsSunset = searchManuals('Sunset', [mockManual]);
  const answerSunset = generateLocalGroundedAnswer('Sunset', resultsSunset, 'direct');
  assert.ok(answerSunset.answer.includes('Sunset'));
  assert.ok(answerSunset.answer.includes('Alexander'));
  assert.ok(answerSunset.answer.includes('Farida'));
  assert.ok(!answerSunset.answer.includes('Foresta'), 'Must not include Foresta when querying Sunset');
  assert.ok(!answerSunset.answer.includes('Heidi'), 'Must not include Heidi when querying Sunset');

  // 3. Query specific person at site: Alexander de Foresta
  const resultsAlexForesta = searchManuals('Alexander de Foresta', [mockManual]);
  const answerAlexForesta = generateLocalGroundedAnswer('Alexander de Foresta', resultsAlexForesta, 'direct');
  assert.ok(answerAlexForesta.answer.includes('Foresta'));
  assert.ok(answerAlexForesta.answer.includes('Alexander'));
  assert.ok(answerAlexForesta.answer.includes('Mantenimiento'));
  assert.ok(!answerAlexForesta.answer.includes('Sunset'));
  // 4. Query Alexander de Sunset
  const resultsAlexSunset = searchManuals('Alexander de Sunset', [mockManual]);
  const answerAlexSunset = generateLocalGroundedAnswer('Alexander de Sunset', resultsAlexSunset, 'direct');
  assert.ok(answerAlexSunset.answer.includes('Sunset'));
  assert.ok(answerAlexSunset.answer.includes('Alexander'));
  assert.ok(answerAlexSunset.answer.includes('Mantenimiento'));
  assert.ok(answerAlexSunset.answer.includes('Tecnico'));
  assert.ok(!answerAlexSunset.answer.includes('Foresta'));
  assert.ok(!answerAlexSunset.answer.includes('Heidi'));

  // 5. Query quien es Heidi
  const resultsHeidi = searchManuals('quien es Heidi', [mockManual]);
  const answerHeidi = generateLocalGroundedAnswer('quien es Heidi', resultsHeidi, 'direct');
  assert.ok(answerHeidi.answer.includes('Heidi'));
  assert.ok(answerHeidi.answer.includes('Limpieza') || answerHeidi.answer.includes('Foresta'));
  assert.ok(!answerHeidi.answer.includes('Sunset'));
  assert.ok(!answerHeidi.answer.includes('Farida'));
});

test('extractRelevantExcerpt extracts ONLY the specific item from a single-section manual with 1,2,3 and a,b,c lists', () => {
  const richManualContent = `
# Normas Operativas Condominio Las Palmas
1. El acceso de proveedores está permitido únicamente de lunes a viernes de 08:00 a 16:00 hrs.
2. Las rondas perimetrales por cámaras deben realizarse cada 20 minutos sin excepción.
3. En caso de corte de energía eléctrica, verificar que el generador encienda en menos de 3 minutos.
4. El encargado de mantenimiento del edificio es Roberto Gómez (teléfono 8888-5555).

## Protocolo de Piscina
a. El horario de uso de la piscina es de 07:00 a 21:00 hrs de martes a domingo.
b. Los días lunes la piscina permanece cerrada por mantenimiento y aplicación de químicos.
c. Está estrictamente prohibido ingresar con envases de vidrio al área de piscina.
  `.trim();

  // Ask about item 2 (rondas)
  const exRondas = extractRelevantExcerpt(richManualContent, '¿Cada cuánto se hacen las rondas perimetrales en Las Palmas?');
  assert.ok(exRondas.includes('20 minutos'));
  assert.ok(!exRondas.includes('proveedores'));
  assert.ok(!exRondas.includes('Roberto Gómez'));
  assert.ok(!exRondas.includes('envases de vidrio'));

  // Ask about item 3 (corte de energía)
  const exEnergia = extractRelevantExcerpt(richManualContent, '¿Qué se hace en caso de corte de energía eléctrica?');
  assert.ok(exEnergia.includes('generador'));
  assert.ok(!exEnergia.includes('20 minutos'));
  assert.ok(!exEnergia.includes('proveedores'));

  // Ask about item c (prohibido en piscina)
  const exVidrio = extractRelevantExcerpt(richManualContent, '¿Qué está prohibido en la piscina?');
  assert.ok(exVidrio.includes('envases de vidrio'));
  assert.ok(!exVidrio.includes('07:00 a 21:00'));
  assert.ok(!exVidrio.includes('Roberto Gómez'));
});

test('extractRelevantExcerpt does NOT dump the whole manual even when the manual is short (< 220 chars)', () => {
  const shortManual = `El código de la alarma de bodega es 4829.
Las llaves de la camioneta las custodia el supervisor Pedro Soto.
El camión recolector de basura pasa los martes y jueves.`;

  const exCodigo = extractRelevantExcerpt(shortManual, '¿Cuál es el código de la alarma de bodega?');
  assert.ok(exCodigo.includes('4829'));
  assert.ok(!exCodigo.includes('Pedro Soto'));
  assert.ok(!exCodigo.includes('camión recolector'));

  const exLlaves = extractRelevantExcerpt(shortManual, '¿Quién tiene las llaves de la camioneta?');
  assert.ok(exLlaves.includes('Pedro Soto'));
  assert.ok(!exLlaves.includes('4829'));
  assert.ok(!exLlaves.includes('camión recolector'));
});

test('extractRelevantExcerpt extracts ONLY the specific comma-separated clause for MC55 SABO INTERNACIONAL', () => {
  const saboManualText =
    'MC55 SABO INTERNACIONAL Buenas, nuevo MC, 8 cámaras, cuenta con un oficial, el cual se encuentra a 30 metros, en caso de que este oficial necesite soporte se envia a GEO. Principal actividad a observar, cualquier tipo de actividad fuera de lo normal en XEOMA hay 3 camaras (MC55-01, MC55-02, MC55-03) en las cuales se ve donde ingresan personas sin autorización, estar al tanto de esto. Es un servicio de 06:00 a 18:00.';

  // 1. Query: que motorizado se envia a Sabo?
  const exMotorizado = extractRelevantExcerpt(
    saboManualText,
    'que motorizado se envia a Sabo?',
    undefined,
    'MC55 SABO INTERNACIONAL'
  );
  assert.ok(exMotorizado.includes('GEO'), `Expected GEO in "${exMotorizado}"`);
  assert.ok(!exMotorizado.includes('8 cámaras'), `Must not include 8 cámaras in "${exMotorizado}"`);
  assert.ok(!exMotorizado.includes('30 metros'), `Must not include 30 metros in "${exMotorizado}"`);
  assert.ok(!exMotorizado.includes('Buenas, nuevo MC'), `Must not include greeting in "${exMotorizado}"`);

  // 2. Query: cuantas camaras tiene Sabo?
  const exCamaras = extractRelevantExcerpt(
    saboManualText,
    'cuantas camaras tiene Sabo?',
    undefined,
    'MC55 SABO INTERNACIONAL'
  );
  assert.ok(exCamaras.includes('8 cámaras'), `Expected 8 cámaras in "${exCamaras}"`);
  assert.ok(!exCamaras.includes('GEO'), `Must not include GEO in "${exCamaras}"`);
  assert.ok(!exCamaras.includes('30 metros'), `Must not include 30 metros in "${exCamaras}"`);

  // 3. Query: a cuantos metros se encuentra el oficial en Sabo?
  const exMetros = extractRelevantExcerpt(
    saboManualText,
    'a cuantos metros se encuentra el oficial en Sabo?',
    undefined,
    'MC55 SABO INTERNACIONAL'
  );
  assert.ok(exMetros.includes('30 metros'), `Expected 30 metros in "${exMetros}"`);
  assert.ok(!exMetros.includes('8 cámaras'), `Must not include 8 cámaras in "${exMetros}"`);
  assert.ok(!exMetros.includes('GEO'), `Must not include GEO in "${exMetros}"`);

  // 4. Full local answer must NOT include "Según el" or "[MAN-"
  const saboManual: ManualDocument = {
    id: 'man-7405',
    title: 'MC55 SABO INTERNACIONAL',
    code: 'MAN-7405',
    category: 'operaciones',
    version: '1.0',
    updatedDate: '2026-11-06',
    department: 'Operaciones',
    iconName: 'FileText',
    summary: saboManualText,
    sections: [
      {
        id: 'sec-sabo',
        articleNumber: 'Manual Oficial',
        title: 'MC55 SABO INTERNACIONAL',
        tags: ['sabo', 'mc55'],
        content: saboManualText
      }
    ]
  };
  const saboResults = searchManuals('que motorizado se envia a Sabo?', [saboManual]);
  const saboAnswer = generateLocalGroundedAnswer('que motorizado se envia a Sabo?', saboResults, 'direct');
  assert.strictEqual(saboAnswer.answer, 'En caso de que este oficial necesite soporte se envia a GEO.');
  assert.ok(!saboAnswer.answer.includes('Según el'));
  assert.ok(!saboAnswer.answer.includes('MAN-7405'));

  // 5. Query: horario de sabo -> must extract "Es un servicio de 06:00 a 18:00."
  const saboHorarioResults = searchManuals('horario de sabo', [saboManual]);
  const saboHorarioAnswer = generateLocalGroundedAnswer('horario de sabo', saboHorarioResults, 'direct');
  assert.strictEqual(saboHorarioAnswer.answer, 'Es un servicio de 06:00 a 18:00.');
});

test('extractRelevantExcerpt correctly isolates address and staff lists in Foresta manual', () => {
  const forestaManualText = `
Foresta Residence / Puesto 25.0 / SI -01 En primer lugar, se debe controlar las entradas y salidas del puesto.
Al registrar el staff de Foresta, Jairo, Heidi o Alexander, Tambien a veces puede estar jordan.
En la zona del rancho, hay parqueos extras para visitas. Pese a estar en el exterior, es un parqueo privado.
Provincia: Puntarenas Cantón : Garabito Distrito: Jaco Dirección : 3ra entrada Quebrada Seca a mano izquierda, Calle la montaña. https://maps.app.goo.gl/test
`;

  const forestaManual: ManualDocument = {
    id: 'man-foresta',
    title: 'Puesto 25 - Foresta Residence (1)',
    code: 'MAN-9567',
    category: 'seguridad',
    version: '1.0',
    updatedDate: '2026-11-06',
    department: 'Seguridad',
    iconName: 'FileText',
    summary: forestaManualText,
    sections: [
      {
        id: 'sec-foresta',
        articleNumber: 'Manual Oficial',
        title: 'Puesto 25 - Foresta Residence (1)',
        tags: ['foresta', 'puesto 25'],
        content: forestaManualText
      }
    ]
  };

  // 1. Address query
  const addrResults = searchManuals('direccion de foresta', [forestaManual]);
  const addrAnswer = generateLocalGroundedAnswer('direccion de foresta', addrResults, 'direct');
  assert.ok(addrAnswer.answer.includes('3ra entrada Quebrada Seca'), `Expected address in "${addrAnswer.answer}"`);
  assert.ok(!addrAnswer.answer.includes('parqueo privado'), `Address should not include unrelated parking text in "${addrAnswer.answer}"`);

  // 2. Staff query
  const staffResults = searchManuals('quien es el staff de foresta?', [forestaManual]);
  const staffAnswer = generateLocalGroundedAnswer('quien es el staff de foresta?', staffResults, 'direct');
  assert.ok(staffAnswer.answer.includes('Jairo') && staffAnswer.answer.includes('Heidi'), `Expected staff members in "${staffAnswer.answer}"`);
  assert.ok(!staffAnswer.answer.includes('figura en'), `Should not contain robotic "figura en" in "${staffAnswer.answer}"`);
});



