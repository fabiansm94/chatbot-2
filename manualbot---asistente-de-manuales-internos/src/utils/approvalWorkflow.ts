import { KnowledgeProposal, ManualDocument, ManualSection } from '../types/manual';

/**
 * Creates a new pending proposal submitted by an employee
 */
export function createProposal(params: {
  title: string;
  category: KnowledgeProposal['category'];
  department: string;
  content: string;
  tags: string[];
  keyPoints?: string[];
  submittedBy: string;
  reason: string;
  targetManualId?: string;
  articleNumber?: string;
}): KnowledgeProposal {
  return {
    id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: params.title.trim(),
    category: params.category,
    department: params.department.trim() || 'General',
    content: params.content.trim(),
    tags: params.tags,
    keyPoints: params.keyPoints,
    submittedBy: params.submittedBy.trim() || 'Colaborador Anónimo',
    submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    reason: params.reason.trim(),
    targetManualId: params.targetManualId,
    articleNumber: params.articleNumber?.trim() || 'Procedimiento Aprobado',
    status: 'pending'
  };
}

/**
 * Approves a proposal and incorporates it into the official Book of Manuals
 */
export function approveProposal(
  proposal: KnowledgeProposal,
  manuals: ManualDocument[],
  approverName = 'Administrador General'
): {
  updatedManuals: ManualDocument[];
  approvedProposal: KnowledgeProposal;
} {
  const approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

  const approvedProposal: KnowledgeProposal = {
    ...proposal,
    status: 'approved',
    reviewedBy: approverName,
    reviewedAt: approvedAt
  };

  const newSection: ManualSection = {
    id: `sec-${proposal.id}`,
    articleNumber: proposal.articleNumber || `Proc. ${Date.now().toString().slice(-4)}`,
    title: proposal.title,
    content: proposal.content,
    tags: proposal.tags,
    keyPoints: proposal.keyPoints,
    approvedBy: approverName,
    approvedAt,
    author: proposal.submittedBy
  };

  let updatedManuals: ManualDocument[] = [];

  // If targeted at an existing manual, add section into it
  if (proposal.targetManualId) {
    let found = false;
    updatedManuals = manuals.map(m => {
      if (m.id === proposal.targetManualId) {
        found = true;
        return {
          ...m,
          updatedDate: approvedAt.split(' ')[0],
          sections: [...m.sections, newSection]
        };
      }
      return m;
    });

    if (found) {
      return { updatedManuals, approvedProposal };
    }
  }

  // Otherwise, create a dedicated new approved procedure document in the Book
  const newManualDoc: ManualDocument = {
    id: `man-prop-${proposal.id}`,
    title: `Procedimiento Oficial: ${proposal.title}`,
    code: `PROC-${proposal.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-3)}`,
    category: proposal.category,
    version: '1.0 (Aprobado)',
    updatedDate: approvedAt.split(' ')[0],
    summary: `Procedimiento propuesto por ${proposal.submittedBy} y aprobado por ${approverName}. Motivo: ${proposal.reason || 'Actualización de procesos'}.`,
    department: proposal.department,
    iconName: proposal.category === 'ti' ? 'Laptop' : proposal.category === 'seguridad' ? 'ShieldAlert' : proposal.category === 'legal_etica' ? 'Scale' : proposal.category === 'operaciones' ? 'Briefcase' : 'Users',
    sections: [newSection]
  };

  updatedManuals = [newManualDoc, ...manuals];
  return { updatedManuals, approvedProposal };
}

/**
 * Rejects a proposal with a reason
 */
export function rejectProposal(
  proposal: KnowledgeProposal,
  rejectionReason: string,
  approverName = 'Administrador General'
): KnowledgeProposal {
  return {
    ...proposal,
    status: 'rejected',
    rejectionReason: rejectionReason.trim(),
    reviewedBy: approverName,
    reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
  };
}
