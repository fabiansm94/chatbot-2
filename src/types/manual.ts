export type ManualCategory =
  | 'rrhh'
  | 'seguridad'
  | 'ti'
  | 'legal_etica'
  | 'operaciones'
  | 'general';

export interface ManualSection {
  id: string;
  articleNumber: string;
  title: string;
  content: string;
  tags: string[];
  keyPoints?: string[];
  approvedBy?: string;
  approvedAt?: string;
  author?: string;
}

export interface ManualDocument {
  id: string;
  title: string;
  code: string;
  category: ManualCategory;
  version: string;
  updatedDate: string;
  summary: string;
  department: string;
  iconName: 'Users' | 'ShieldAlert' | 'Laptop' | 'Scale' | 'FileText' | 'Briefcase' | 'HelpCircle';
  sections: ManualSection[];
}

export interface Citation {
  manualId: string;
  manualCode: string;
  manualTitle: string;
  sectionId: string;
  articleNumber: string;
  sectionTitle: string;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: Citation[];
  error?: boolean;
  queriedManuals?: string[];
  matchedCount?: number;
}

export interface SearchResult {
  section: ManualSection;
  manual: ManualDocument;
  score: number;
  snippet: string;
}

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface KnowledgeProposal {
  id: string;
  title: string;
  category: ManualCategory;
  department: string;
  articleNumber?: string;
  content: string;
  tags: string[];
  keyPoints?: string[];
  submittedBy: string;
  submittedAt: string;
  reason: string;
  targetManualId?: string; // If null, creates a new procedure document
  targetManualCode?: string;
  status: ProposalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}
