import { KnowledgeProposal, ManualDocument, ManualSection } from '../types/manual';

/**
 * Recursively cleans any object to remove keys with undefined values
 * which Firebase Firestore strictly rejects.
 */
export function sanitizeFirestoreDoc<T extends Record<string, any>>(data: T): T {
  const clean: any = Array.isArray(data) ? [] : {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue;
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      clean[key] = sanitizeFirestoreDoc(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

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
  const proposal: KnowledgeProposal = {
    id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: params.title.trim(),
    category: params.category || 'general',
    department: params.department.trim() || 'General',
    content: params.content.trim(),
    tags: params.tags || [],
    submittedBy: params.submittedBy.trim() || 'Colaborador Anónimo',
    submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    reason: params.reason.trim() || 'Propuesta desde Enseñar al Bot',
    articleNumber: params.articleNumber?.trim() || 'Procedimiento Aprobado',
    status: 'pending'
  };

  if (params.keyPoints && params.keyPoints.length > 0) {
    proposal.keyPoints = params.keyPoints;
  }
  if (params.targetManualId) {
    proposal.targetManualId = params.targetManualId;
  }

  return proposal;
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
    title: proposal.title,
    code: `MAN-${Date.now().toString().slice(-4)}`,
    category: proposal.category,
    version: '1.0',
    updatedDate: approvedAt.split(' ')[0],
    summary: proposal.content,
    description: proposal.content,
    department: proposal.department,
    iconName: 'FileText',
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
