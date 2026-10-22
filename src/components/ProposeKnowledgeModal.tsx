import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, Check, BookOpen, AlertCircle, User, Info } from 'lucide-react';
import { KnowledgeProposal, ManualCategory, ManualDocument } from '../types/manual';
import { createProposal } from '../utils/approvalWorkflow';

interface ProposeKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitProposal: (proposal: KnowledgeProposal) => void;
  manuals: ManualDocument[];
}

export const ProposeKnowledgeModal: React.FC<ProposeKnowledgeModalProps> = ({
  isOpen,
  onClose,
  onSubmitProposal,
  manuals
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ManualCategory>('operaciones');
  const [department, setDepartment] = useState('');
  const [targetManualId, setTargetManualId] = useState<string>('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (type: 'vpn' | 'salas' | 'taxi') => {
    if (type === 'vpn') {
      setTitle('Procedimiento de Solicitud de Acceso a VPN y Red Remota');
      setCategory('ti');
      setDepartment('Tecnologías de la Información');
      setTargetManualId('man-ti-02');
      setContent('1. Todo acceso a redes privadas corporativas desde el exterior debe tramitarse mediante ticket en el portal de TI.\n2. Es requisito previo tener el doble factor (2FA) configurado y el antivirus corporativo actualizado.\n3. El responsable directo del equipo debe validar la justificación en un plazo de 24 horas.');
      setTags('vpn, acceso remoto, red, seguridad, ticket');
      setKeyPoints('Ticket obligatorio en portal TI | Aprobación del líder en 24h | 2FA obligatorio');
      setReason('Muchos empleados nuevos preguntan cómo conectarse fuera de la oficina.');
      setSubmittedBy('Soporte de TI / Colaborador');
    } else if (type === 'salas') {
      setTitle('Pauta de Uso y Reserva de Salas de Reunión');
      setCategory('operaciones');
      setDepartment('Servicios Generales');
      setContent('1. Las salas deben reservarse a través del calendario corporativo con al menos 24 horas de antelación.\n2. Al finalizar la reunión, se debe dejar la sala ordenada, apagar pantallas y liberar la reserva si se termina antes de tiempo.');
      setTags('salas, reunion, calendario, reserva, orden');
      setKeyPoints('Reserva con 24h de antelación | Liberación de sala si termina antes');
      setReason('Evitar cruces y quejas por salas ocupadas sin reserva formal.');
      setSubmittedBy('Recepción & Operaciones');
    } else {
      setTitle('Protocolo de Reembolso de Taxis Nocturnos');
      setCategory('rrhh');
      setDepartment('Gestión de Personas');
      setTargetManualId('man-rrhh-01');
      setContent('Las salidas de trabajo posteriores a las 21:30 hrs por requerimiento del proyecto cuentan con servicio de taxi seguro cubierto por la empresa a través de la cuenta corporativa.');
      setTags('taxi, transporte, noche, seguridad, reembolso');
      setKeyPoints('Aplica después de las 21:30 hrs | Cargo directo a cuenta corporativa');
      setReason('Garantizar la seguridad física de los empleados en turnos nocturnos.');
      setSubmittedBy('Comité de Bienestar');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !submittedBy.trim()) {
      setError('Por favor completa el título, contenido y tu nombre o departamento.');
      return;
    }

    const newProposal = createProposal({
      title,
      category,
      department: department.trim() || 'General',
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      keyPoints: keyPoints ? keyPoints.split('|').map(p => p.trim()).filter(Boolean) : undefined,
      submittedBy,
      reason: reason.trim() || 'Propuesta de mejora interna',
      targetManualId: targetManualId || undefined
    });

    onSubmitProposal(newProposal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#fa5252]/10 text-[#fa5252]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Enseñar un Nuevo Procedimiento al Asistente</h2>
              <p className="text-xs text-slate-500">Propón un nuevo procedimiento o política para que tus compañeros puedan consultarlo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner: Requires Admin Approval */}
        <div className="p-3.5 bg-amber-50 border-b border-amber-200/70 text-xs text-amber-800 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Control de Calidad y Aprobación:</strong> La información no se guardará en el Asistente automáticamente. Tu propuesta pasará primero al <strong>Buzón de Aprobaciones del Administrador</strong>. Una vez revisada y autorizada por ti o tu supervisor, el bot la incorporará a sus respuestas oficiales.
          </span>
        </div>

        {/* Templates quick selector */}
        <div className="p-3.5 bg-orange-50/50 border-b border-orange-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-600 font-medium">Ejemplos Rápidos:</span>
          <button
            type="button"
            onClick={() => handleApplyTemplate('vpn')}
            className="text-xs px-2.5 py-1 rounded-lg bg-white text-[#fa5252] hover:bg-orange-50 border border-orange-200 shadow-2xs transition-colors"
          >
            Acceso a VPN
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('salas')}
            className="text-xs px-2.5 py-1 rounded-lg bg-white text-[#fa5252] hover:bg-orange-50 border border-orange-200 shadow-2xs transition-colors"
          >
            Reserva de Salas
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('taxi')}
            className="text-xs px-2.5 py-1 rounded-lg bg-white text-[#fa5252] hover:bg-orange-50 border border-orange-200 shadow-2xs transition-colors"
          >
            Taxis Nocturnos
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título del Procedimiento o Regla *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Protocolo de Reserva de Salas de Reunión"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tu Nombre o Departamento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Pérez (Operaciones) / TI"
                value={submittedBy}
                onChange={e => setSubmittedBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ManualCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#fa5252] focus:bg-white"
              >
                <option value="operaciones">Operaciones & Procesos</option>
                <option value="rrhh">RRHH & Beneficios</option>
                <option value="ti">TI & Ciberseguridad</option>
                <option value="seguridad">Seguridad & SST</option>
                <option value="legal_etica">Legal & Ética</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departamento Responsable
              </label>
              <input
                type="text"
                placeholder="Ej. Soporte al Empleado"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vincular a Manual Existente
              </label>
              <select
                value={targetManualId}
                onChange={e => setTargetManualId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#fa5252] focus:bg-white"
              >
                <option value="">Crear nuevo documento</option>
                {manuals.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.title.slice(0, 25)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contenido Oficial del Procedimiento o Respuesta *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Explica detalladamente los pasos, requisitos, plazos y directrices que el Asistente debe responder a los trabajadores..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] focus:bg-white leading-relaxed font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5 font-medium">
                Puntos Clave / Resumen (separados por |)
              </label>
              <input
                type="text"
                placeholder="Paso 1 | Paso 2 | Plazo máx"
                value={keyPoints}
                onChange={e => setKeyPoints(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-0.5 font-medium">
                Palabras clave de búsqueda (separadas por comas)
              </label>
              <input
                type="text"
                placeholder="sala, reserva, meeting"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ¿Por qué se propone esta información? (Para el Administrador)
            </label>
            <input
              type="text"
              placeholder="Ej. Cambio de política la semana pasada / Pregunta recurrente en el equipo"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fa5252] focus:bg-white"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Estado inicial: ⏳ Pendiente de Aprobación
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fa5252] hover:bg-[#e04343] text-white text-xs font-semibold shadow-md shadow-[#fa5252]/20 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar para Aprobación</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
