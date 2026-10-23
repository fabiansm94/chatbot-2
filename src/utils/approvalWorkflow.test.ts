import test from 'node:test';
import assert from 'node:assert/strict';
import { createProposal, approveProposal, rejectProposal } from './approvalWorkflow';
import { DEFAULT_MANUALS } from '../data/defaultManuals';

test('createProposal initiates pending knowledge proposal with metadata', () => {
  const proposal = createProposal({
    title: 'Protocolo de Reserva de Salas',
    category: 'operaciones',
    department: 'Servicios Generales',
    content: 'Las salas de reuniones deben reservarse a través de Google Calendar con 24h de antelación.',
    tags: ['salas', 'reunion', 'reserva'],
    submittedBy: 'Mariana López (Operaciones)',
    reason: 'Frecuentes solapamientos de reuniones'
  });

  assert.equal(proposal.status, 'pending');
  assert.equal(proposal.submittedBy, 'Mariana López (Operaciones)');
  assert.ok(proposal.id.startsWith('prop-'));
});

test('approveProposal incorporates proposal into an existing manual', () => {
  const proposal = createProposal({
    title: 'Pauta de Reembolso de Taxis Nocturnos',
    category: 'rrhh',
    department: 'Gestión de Talento y Cultura',
    content: 'Salidas laborales después de las 21:30 hrs tienen derecho a taxi corporativo por Cabify/Uber Empresas.',
    tags: ['taxi', 'nocturno', 'transporte'],
    submittedBy: 'Andrés Vera',
    reason: 'Seguridad en horario nocturno',
    targetManualId: 'man-seg-01',
    articleNumber: 'Art. 5.3'
  });

  const { updatedManuals, approvedProposal } = approveProposal(proposal, DEFAULT_MANUALS, 'Supervisor de Seguridad');

  assert.equal(approvedProposal.status, 'approved');
  assert.equal(approvedProposal.reviewedBy, 'Supervisor de Seguridad');

  const segManual = updatedManuals.find(m => m.id === 'man-seg-01');
  assert.ok(segManual);
  const newSection = segManual.sections.find(s => s.title === 'Pauta de Reembolso de Taxis Nocturnos');
  assert.ok(newSection);
  assert.equal(newSection.articleNumber, 'Art. 5.3');
  assert.equal(newSection.author, 'Andrés Vera');
});

test('rejectProposal sets status to rejected and attaches rejection reason', () => {
  const proposal = createProposal({
    title: 'Instalación de Software Libre no autorizado',
    category: 'ti',
    department: 'TI',
    content: 'Permitir a cada usuario instalar programas sin aprobación.',
    tags: ['software', 'ti'],
    submittedBy: 'Lucas',
    reason: 'Comodidad'
  });

  const rejected = rejectProposal(proposal, 'Contradice la política de seguridad y protección de datos', 'CISO');
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.rejectionReason, 'Contradice la política de seguridad y protección de datos');
  assert.equal(rejected.reviewedBy, 'CISO');
});
