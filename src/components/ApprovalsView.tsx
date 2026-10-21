import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  BookOpen,
  Tag,
  ArrowRight,
  Filter,
  Sparkles,
  MessageSquare,
  AlertCircle
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gobernanza y Control de Calidad del Book</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Buzón de Aprobaciones del Asistente
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Revisa, audita y autoriza el conocimiento que tus empleados proponen para el chatbot. Ninguna información entra en vigor ni se comparte con los demás trabajadores hasta que tú la apruebes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="text-xs">
              <label className="block text-slate-400 font-medium mb-1">Nombre del Aprobador:</label>
              <input
                type="text"
                value={approverName}
                onChange={e => setApproverName(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={onOpenProposeModal}
              className="mt-4 sm:mt-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Proponer Procedimiento</span>
            </button>
          </div>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setFilter('pending')}
            className={`p-3 rounded-xl border text-left transition-all ${
              filter === 'pending'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pendientes de Aprobación</span>
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">{pendingCount}</div>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`p-3 rounded-xl border text-left transition-all ${
              filter === 'approved'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aprobados e Incorporados</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{approvedCount}</div>
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`p-3 rounded-xl border text-left transition-all ${
              filter === 'rejected'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Rechazados</span>
            </div>
            <div className="text-xl font-bold text-rose-400 mt-1">{rejectedCount}</div>
          </button>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">No hay propuestas en esta vista</h3>
            <p className="text-xs text-slate-500">
              {filter === 'pending'
                ? '¡Todo al día! No tienes procedimientos pendientes de aprobación.'
                : 'No se encontraron registros bajo el filtro seleccionado.'}
            </p>
          </div>
        ) : (
          filteredProposals.map(proposal => (
            <div
              key={proposal.id}
              className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                proposal.status === 'pending'
                  ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-950/20'
                  : proposal.status === 'approved'
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-slate-950/80 border-slate-850 opacity-80'
              }`}
            >
              {/* Proposal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  {proposal.status === 'pending' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Pendiente de tu Aprobación</span>
                    </span>
                  )}
                  {proposal.status === 'approved' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Aprobado por {proposal.reviewedBy}</span>
                    </span>
                  )}
                  {proposal.status === 'rejected' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      <span>Rechazado por {proposal.reviewedBy}</span>
                    </span>
                  )}

                  <span className="text-xs text-slate-400 font-mono">
                    {proposal.department}
                  </span>
                  <span className="text-slate-600 text-xs">•</span>
                  <span className="text-xs text-slate-500">
                    Enviado: {proposal.submittedAt}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Propuesto por: <strong className="text-slate-200">{proposal.submittedBy}</strong></span>
                </div>
              </div>

              {/* Title and Reason */}
              <div className="py-3 space-y-1.5">
                <h3 className="text-lg font-bold text-white">
                  {proposal.title}
                </h3>
                {proposal.reason && (
                  <p className="text-xs text-indigo-300 flex items-center gap-1.5">
                    <span>💡 Motivo de la propuesta:</span>
                    <span className="text-slate-300">{proposal.reason}</span>
                  </p>
                )}
              </div>

              {/* Procedure Content */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {proposal.content}
              </div>

              {/* Key points & tags */}
              {((proposal.keyPoints && proposal.keyPoints.length > 0) || (proposal.tags && proposal.tags.length > 0)) && (
                <div className="pt-3 flex flex-wrap items-center gap-2">
                  {proposal.keyPoints?.map((kp, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-900/50">
                      ✓ {kp}
                    </span>
                  ))}
                  {proposal.tags?.map((t, idx) => (
                    <span key={idx} className="text-[10px] text-slate-500">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Rejection reason box if rejected */}
              {proposal.status === 'rejected' && proposal.rejectionReason && (
                <div className="mt-3 p-3 rounded-lg bg-rose-950/40 border border-rose-900 text-xs text-rose-200 space-y-1">
                  <strong className="block text-rose-300">Motivo del Rechazo:</strong>
                  <span>{proposal.rejectionReason}</span>
                </div>
              )}

              {/* Actions for Pending Proposals */}
              {proposal.status === 'pending' && (
                <div className="pt-4 mt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Al aprobarlo, este contenido se guardará en el Book oficial y el Asistente lo responderá a todos los empleados.
                  </div>

                  {rejectingId === proposal.id ? (
                    <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Escribe el motivo del rechazo..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
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
                          className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRejectingId(proposal.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs font-semibold border border-slate-700 hover:border-rose-800 transition-all"
                      >
                        Rechazar
                      </button>

                      <button
                        onClick={() => onApprove(proposal, approverName)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
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
