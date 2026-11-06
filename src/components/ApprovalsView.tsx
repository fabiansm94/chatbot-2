import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  Plus
} from 'lucide-react';
import { KnowledgeProposal } from '../types/manual';
import { FormattedContent } from './FormattedContent';

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
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const approverName = 'Admin';

  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const approvedCount = proposals.filter(p => p.status === 'approved').length;
  const rejectedCount = proposals.filter(p => p.status === 'rejected').length;

  const filteredProposals = proposals.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleConfirmReject = (proposal: KnowledgeProposal) => {
    const reasonToSave = rejectReason.trim() || 'No aprobado por el Admin';
    onReject(proposal, reasonToSave, approverName);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto p-4 sm:p-8 bg-[#2f3140] text-white space-y-6">
      {/* Header Banner Card */}
      <div className="p-6 rounded-2xl bg-[#262835] border border-[#3e4153] shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ca4048]">
                Control de Calidad
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-xs text-slate-300">Buzón Exclusivo de Admin</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Aprobación de Enseñanzas al Bot
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Las enseñanzas enviadas por los usuarios no se guardan inmediatamente. Como administrador (<strong className="text-white">Admin</strong>), eres el único autorizado para aceptarlas o rechazarlas antes de que pasen a los manuales de AI-zen.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-[#2f3140] border border-[#3e4153] text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#ca4048]" />
              <span className="text-slate-300">Rol: <strong className="text-white">Admin</strong></span>
            </div>

            <button
              onClick={onOpenProposeModal}
              className="px-3.5 py-2 rounded-xl bg-[#ca4048] hover:bg-[#b5343c] text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Enseñanza</span>
            </button>
          </div>
        </div>

        {/* Counter Tabs */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#3e4153]">
          <button
            onClick={() => setFilter('pending')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-[#ca4048]/20 border-[#ca4048] text-white shadow-xs'
                : 'bg-[#2f3140] border-[#3e4153] text-slate-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pendientes</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{pendingCount}</div>
          </button>

          <button
            onClick={() => setFilter('approved')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filter === 'approved'
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-xs'
                : 'bg-[#2f3140] border-[#3e4153] text-slate-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aceptadas</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{approvedCount}</div>
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              filter === 'rejected'
                ? 'bg-[#ca4048]/20 border-[#ca4048] text-white shadow-xs'
                : 'bg-[#2f3140] border-[#3e4153] text-slate-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <XCircle className="w-3.5 h-3.5 text-[#ca4048]" />
              <span>Rechazadas</span>
            </div>
            <div className="text-xl font-bold text-[#ca4048] mt-1">{rejectedCount}</div>
          </button>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#262835] border border-[#3e4153] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No hay enseñanzas en esta vista</h3>
            <p className="text-xs text-slate-300">
              {filter === 'pending'
                ? '¡Todo al día! No tienes enseñanzas pendientes de aprobación.'
                : 'No se encontraron registros bajo el filtro seleccionado.'}
            </p>
          </div>
        ) : (
          filteredProposals.map(proposal => (
            <div
              key={proposal.id}
              className={`p-5 sm:p-6 rounded-2xl border bg-[#262835] transition-all shadow-xs ${
                proposal.status === 'pending'
                  ? 'border-[#ca4048] ring-1 ring-[#ca4048]/40'
                  : 'border-[#3e4153]'
              }`}
            >
              {/* Proposal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3e4153]">
                <div className="flex items-center gap-2 flex-wrap">
                  {proposal.status === 'pending' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 flex items-center gap-1 border border-amber-500/30">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Pendiente de aprobación por Admin</span>
                    </span>
                  )}
                  {proposal.status === 'approved' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 flex items-center gap-1 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Aceptado por Admin</span>
                    </span>
                  )}
                  {proposal.status === 'rejected' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ca4048]/20 text-[#ca4048] flex items-center gap-1 border border-[#ca4048]/40">
                      <XCircle className="w-3 h-3 text-[#ca4048]" />
                      <span>Rechazado por Admin</span>
                    </span>
                  )}

                  <span className="text-xs text-slate-400">
                    {proposal.submittedAt}
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enviado por: <strong className="text-white capitalize">{proposal.submittedBy}</strong></span>
                </div>
              </div>

              {/* Title */}
              <div className="py-3">
                <h3 className="text-base font-bold text-white">
                  {proposal.title}
                </h3>
              </div>

              {/* Procedure Content */}
              <div className="p-4 rounded-xl bg-[#2f3140] border border-[#3e4153] text-xs text-slate-200 leading-relaxed font-sans">
                <FormattedContent content={proposal.content} />
              </div>

              {/* Rejection reason box if rejected */}
              {proposal.status === 'rejected' && proposal.rejectionReason && (
                <div className="mt-3 p-3 rounded-lg bg-[#2f3140] border border-[#ca4048]/50 text-xs text-white space-y-1">
                  <strong className="block font-semibold text-[#ca4048]">Motivo del Rechazo:</strong>
                  <span>{proposal.rejectionReason}</span>
                </div>
              )}

              {/* Actions for Pending Proposals */}
              {proposal.status === 'pending' && (
                <div className="pt-4 mt-4 border-t border-[#3e4153] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-300">
                    Al aceptarla, esta enseñanza se guardará inmediatamente como un manual oficial en el sistema.
                  </div>

                  {rejectingId === proposal.id ? (
                    <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Motivo del rechazo (opcional)..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-[#2f3140] border border-[#3e4153] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#ca4048]"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleConfirmReject(proposal)}
                          className="px-3 py-1.5 rounded-lg bg-[#ca4048] hover:bg-[#b5343c] text-white text-xs font-semibold cursor-pointer"
                        >
                          Confirmar Rechazo
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                          className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRejectingId(proposal.id)}
                        className="px-3.5 py-2 rounded-xl bg-[#2f3140] hover:bg-[#ca4048]/20 text-slate-300 hover:text-[#ca4048] text-xs font-semibold border border-[#3e4153] transition-all cursor-pointer"
                      >
                        Rechazar
                      </button>

                      <button
                        onClick={() => onApprove(proposal, approverName)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aceptar y Guardar Manual</span>
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
