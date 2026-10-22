import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  Plus,
  Sparkles
} from 'lucide-react';
import { KnowledgeProposal } from '../types/manual';

interface ApprovalsViewProps {
  proposals: KnowledgeProposal[];
  onApprove: (proposal: KnowledgeProposal, approverName: string) => void;
  onReject: (proposal: KnowledgeProposal, reason: string, approverName: string) => void;
  onOpenProposeModal: () => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  proposals,
  onApprove,
  onReject,
  onOpenProposeModal
}) => {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [approverName, setApproverName] = useState('Administrador General');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const approvedCount = proposals.filter(p => p.status === 'approved').length;
  const rejectedCount = proposals.filter(p => p.status === 'rejected').length;

  const filteredProposals = proposals.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleConfirmReject = (proposal: KnowledgeProposal) => {
    if (!rejectReason.trim()) return;
    onReject(proposal, rejectReason, approverName);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#fafbfc] space-y-6">
      {/* Header Banner Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#fa5252]">
                Control de Calidad
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500">Buzón de Aprobaciones</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Aprobación de Nuevos Procedimientos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Revisa y autoriza el conocimiento propuesto por los colaboradores. Nada se incorpora a las respuestas oficiales del bot sin tu visto bueno.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="text-xs">
              <label className="block text-slate-500 font-medium mb-1">Nombre del Aprobador:</label>
              <input
                type="text"
                value={approverName}
                onChange={e => setApproverName(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#fa5252]"
              />
            </div>

            <button
              onClick={onOpenProposeModal}
              className="mt-4 sm:mt-0 px-3.5 py-2 rounded-xl bg-[#fa5252] hover:bg-[#e03131] text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Propuesta</span>
            </button>
          </div>
        </div>

        {/* Counter Tabs */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => setFilter('pending')}
            className={`p-3 rounded-xl border text-left transition-all ${
              filter === 'pending'
                ? 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pendientes</span>
            </div>
            <div className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</div>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`p-3 rounded-xl border text-left transition-all ${
              filter === 'approved'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Aprobados</span>
            </div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{approvedCount}</div>
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`p-3 rounded-xl border text-left transition-all ${
              filter === 'rejected'
                ? 'bg-rose-50/80 border-rose-300 text-rose-900 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Rechazados</span>
            </div>
            <div className="text-xl font-bold text-rose-600 mt-1">{rejectedCount}</div>
          </button>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">No hay propuestas en esta vista</h3>
            <p className="text-xs text-slate-400">
              {filter === 'pending'
                ? '¡Todo al día! No tienes procedimientos pendientes de aprobación.'
                : 'No se encontraron registros bajo el filtro seleccionado.'}
            </p>
          </div>
        ) : (
          filteredProposals.map(proposal => (
            <div
              key={proposal.id}
              className={`p-5 sm:p-6 rounded-2xl border bg-white transition-all shadow-2xs ${
                proposal.status === 'pending'
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : 'border-slate-200'
              }`}
            >
              {/* Proposal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  {proposal.status === 'pending' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>Pendiente</span>
                    </span>
                  )}
                  {proposal.status === 'approved' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Aprobado por {proposal.reviewedBy}</span>
                    </span>
                  )}
                  {proposal.status === 'rejected' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>Rechazado por {proposal.reviewedBy}</span>
                    </span>
                  )}

                  <span className="text-xs text-slate-500 font-mono">
                    {proposal.department}
                  </span>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-xs text-slate-400">
                    {proposal.submittedAt}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Propuesto por: <strong className="text-slate-700">{proposal.submittedBy}</strong></span>
                </div>
              </div>

              {/* Title and Reason */}
              <div className="py-3 space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  {proposal.title}
                </h3>
                {proposal.reason && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="font-semibold text-[#fa5252]">Motivo:</span>
                    <span>{proposal.reason}</span>
                  </p>
                )}
              </div>

              {/* Procedure Content */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                {proposal.content}
              </div>

              {/* Key points & tags */}
              {((proposal.keyPoints && proposal.keyPoints.length > 0) || (proposal.tags && proposal.tags.length > 0)) && (
                <div className="pt-3 flex flex-wrap items-center gap-2">
                  {proposal.keyPoints?.map((kp, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-rose-50 text-[#fa5252] border border-rose-150 font-medium">
                      ✓ {kp}
                    </span>
                  ))}
                  {proposal.tags?.map((t, idx) => (
                    <span key={idx} className="text-[10px] text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Rejection reason box if rejected */}
              {proposal.status === 'rejected' && proposal.rejectionReason && (
                <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                  <strong className="block font-semibold">Motivo del Rechazo:</strong>
                  <span>{proposal.rejectionReason}</span>
                </div>
              )}

              {/* Actions for Pending Proposals */}
              {proposal.status === 'pending' && (
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    Al aprobarlo, este contenido se incorporará al Book oficial de manuales.
                  </div>

                  {rejectingId === proposal.id ? (
                    <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Escribe el motivo del rechazo..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleConfirmReject(proposal)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                        >
                          Confirmar Rechazo
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                          className="px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRejectingId(proposal.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold border border-slate-200 transition-all"
                      >
                        Rechazar
                      </button>

                      <button
                        onClick={() => onApprove(proposal, approverName)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprobar e Incorporar al Book</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
