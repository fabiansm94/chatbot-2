import { KnowledgeProposal } from '../types/manual';

export const DEFAULT_PROPOSALS: KnowledgeProposal[] = [
  {
    id: 'prop-seed-01',
    title: 'Protocolo de Reserva de Salas y Equipos Audiovisuales',
    category: 'operaciones',
    department: 'Servicios Generales & Infraestructura',
    articleNumber: 'Proc. 2.4',
    content: `1. Reserva obligatoria: Toda sala de reunión con más de 6 personas debe apartarse a través de Google Calendar corporativo con al menos 24 horas de antelación.
2. Equipos de videoconferencia: Si se requiere soporte para conferencias híbridas (Zoom Rooms / Meet Hardware), se debe tildar la opción "Requiere Asistencia Técnica" para que el equipo de soporte prepare los micrófonos 10 minutos antes.
3. Política de cancelación: Si una reunión presencial se pospone, la sala debe liberarse inmediatamente en el calendario para permitir el uso a otros equipos.`,
    tags: ['salas', 'reunion', 'videoconferencia', 'google calendar', 'reserva'],
    keyPoints: [
      'Reserva con 24h de antelación vía Google Calendar',
      'Asistencia técnica solicitada 10 min antes',
      'Liberación obligatoria al cancelar'
    ],
    submittedBy: 'Valeria Gómez (Servicios Generales)',
    submittedAt: '2025-02-18 10:30',
    reason: 'Frecuentes solapamientos de reuniones en el piso 3 y falta de salas libres.',
    status: 'pending'
  },
  {
    id: 'prop-seed-02',
    title: 'Pauta de Reembolso de Taxis Nocturnos por Seguridad',
    category: 'rrhh',
    department: 'Gestión de Talento y Cultura',
    targetManualId: 'man-rrhh-01',
    articleNumber: 'Art. 5.3',
    content: `1. Cobertura: Todo colaborador cuya jornada o evento corporativo autorizado culmine después de las 21:30 hrs tiene derecho a solicitar transporte en taxi seguro a través de la cuenta corporativa de Uber/Cabify para el retorno a su domicilio.
2. Registro: El gasto se cargará directamente al centro de costos del proyecto con visto bueno del líder directo. No requiere anticipo de dinero por parte del empleado.`,
    tags: ['taxi', 'nocturno', 'transporte', 'seguridad', 'reembolso', 'uber'],
    keyPoints: [
      'Aplica para salidas laborales posteriores a las 21:30 hrs',
      'Uso directo de cuenta corporativa (sin desembolso personal)'
    ],
    submittedBy: 'Diego Morales (Operaciones & Soporte)',
    submittedAt: '2025-02-19 16:45',
    reason: 'Protección y seguridad del personal en turnos de cierre o despliegues nocturnos.',
    status: 'pending'
  },
  {
    id: 'prop-seed-03',
    title: 'Procedimiento de Solicitud de Licencia por Formación y Certificaciones',
    category: 'rrhh',
    department: 'Cultura y Aprendizaje',
    targetManualId: 'man-rrhh-01',
    articleNumber: 'Art. 4.4',
    content: `La empresa subvenciona el 100% del costo de exámenes de certificación técnica oficial vinculadas al rol del colaborador, y otorga 1 día hábil retribuido para rendir el examen final previa aprobación del plan de carrera.`,
    tags: ['certificaciones', 'estudios', 'formacion', 'licencia', 'subsidio'],
    keyPoints: [
      '100% subvención de examen de certificación',
      '1 día libre remunerado para rendir la prueba'
    ],
    submittedBy: 'Carolina Soto (RRHH)',
    submittedAt: '2025-01-22 09:15',
    reason: 'Fomento al crecimiento profesional de los colaboradores.',
    status: 'approved',
    reviewedBy: 'Director de Personas',
    reviewedAt: '2025-01-22 15:00'
  }
];
