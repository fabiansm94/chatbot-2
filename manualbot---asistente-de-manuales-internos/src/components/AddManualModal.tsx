import React, { useState } from 'react';
import { X, Plus, Trash2, Sparkles, BookOpen, Check } from 'lucide-react';
import { ManualCategory, ManualDocument, ManualSection } from '../types/manual';

interface AddManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddManual: (manual: ManualDocument) => void;
}

export const AddManualModal: React.FC<AddManualModalProps> = ({
  isOpen,
  onClose,
  onAddManual
}) => {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<ManualCategory>('rrhh');
  const [department, setDepartment] = useState('');
  const [version, setVersion] = useState('1.0');
  const [summary, setSummary] = useState('');
  const [sections, setSections] = useState<Array<{
    articleNumber: string;
    title: string;
    content: string;
    tags: string;
    keyPoints: string;
  }>>([
    {
      articleNumber: 'Art. 1.1',
      title: 'Disposiciones Generales y Alcance',
      content: '',
      tags: 'politica, general, alcance',
      keyPoints: 'Alcance aplicable a todo el personal'
    }
  ]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (type: 'remote' | 'onboarding' | 'diversity') => {
    if (type === 'remote') {
      setTitle('Política Corporativa de Teletrabajo, Flexibilidad y Desconexión Digital');
      setCode('POL-REM-06');
      setCategory('rrhh');
      setDepartment('Cultura y Personas');
      setVersion('1.0');
      setSummary('Regulación de horarios flexibles, días de teletrabajo a la semana, derecho a no responder fuera del horario y compensación de suministros.');
      setSections([
        {
          articleNumber: 'Art. 1.2',
          title: 'Modalidad Híbrida y Frecuencia de Presencialidad',
          content: 'Los trabajadores adscritos a modalidad híbrida acordarán con su líder de equipo un mínimo de 2 días de presencia en oficina por semana. El registro de jornada se efectuará diariamente mediante la aplicación móvil oficial.',
          tags: 'teletrabajo, hibrido, presencialidad, horario, registro',
          keyPoints: 'Mínimo 2 días presenciales por semana | Registro diario en app'
        },
        {
          articleNumber: 'Art. 2.1',
          title: 'Garantía del Derecho a la Desconexión Digital',
          content: 'Fuera de la jornada laboral oficial pactada (de 9:00 a 18:00 hrs) y durante fines de semana, permisos y vacaciones, el trabajador no tiene obligación alguna de responder correos, mensajes de chat corporativo ni llamadas telefónicas, sin que ello pueda derivar en consecuencias desfavorables.',
          tags: 'desconexion digital, descanso, mensajes, llamadas, privacidad',
          keyPoints: 'Sin obligación de responder fuera de horario | Prohibido enviar mensajes urgentes no justificados'
        }
      ]);
    } else if (type === 'onboarding') {
      setTitle('Guía Oficial de Bienvenida e Inducción para Nuevos Ingresos');
      setCode('GUI-ONB-01');
      setCategory('general');
      setDepartment('Experiencia del Empleado & Onboarding');
      setVersion('2.0');
      setSummary('Pasos durante los primeros 30, 60 y 90 días, asignación de buddy (tutor), credenciales de sistemas y cursos de formación inicial obligatorios.');
      setSections([
        {
          articleNumber: 'Fase 1',
          title: 'Primer Día y Configuración de Cuentas',
          content: 'En tu primer día de incorporación serás recibido por tu Buddy asignado. TI te entregará tus credenciales de correo, 1Password y acceso al Portal de RRHH. Realizarás un tour virtual por las instalaciones y el saludo de bienvenida con el equipo.',
          tags: 'bienvenida, primer dia, buddy, induccion, credenciales',
          keyPoints: 'Acompañamiento con Buddy asignado | Entrega de credenciales en la mañana'
        },
        {
          articleNumber: 'Fase 2',
          title: 'Cursos Obligatorios de Inducción (Días 1 a 15)',
          content: 'Todo colaborador recién ingresado debe completar los módulos online de Ciberseguridad Básica, Prevención de Riesgos y Código de Conducta en la plataforma Academy dentro de las primeras dos semanas de contrato.',
          tags: 'cursos, academy, formacion, induccion, obligatorio',
          keyPoints: 'Completar cursos en plataforma Academy antes del día 15'
        }
      ]);
    } else {
      setTitle('Protocolo de Diversidad, Equidad e Inclusión Laboral');
      setCode('PRO-DEI-03');
      setCategory('legal_etica');
      setDepartment('Comité de Igualdad & Sostenibilidad');
      setVersion('1.5');
      setSummary('Compromisos para la igualdad de oportunidades, no discriminación, uso de lenguaje incluyente y adaptación de puestos de trabajo.');
      setSections([
        {
          articleNumber: 'Art. 3.2',
          title: 'Adaptaciones Razonables y Accesibilidad Universal',
          content: 'Cualquier colaborador con alguna necesidad específica de accesibilidad motriz, visual, auditiva o neurodiversa puede solicitar adaptaciones en su estación de trabajo o herramientas digitales comunicándose a diversidad@empresa.com con resolución en un plazo de 10 días.',
          tags: 'diversidad, adaptacion, accesibilidad, inclusion, discapacidad',
          keyPoints: 'Solicitud de adaptaciones con respuesta en 10 días'
        }
      ]);
    }
  };

  const handleAddSection = () => {
    setSections(prev => [
      ...prev,
      {
        articleNumber: `Art. ${prev.length + 1}.1`,
        title: '',
        content: '',
        tags: '',
        keyPoints: ''
      }
    ]);
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) return;
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      setError('Por favor indica el título y el código del manual.');
      return;
    }

    const hasEmptySections = sections.some(s => !s.title.trim() || !s.content.trim());
    if (hasEmptySections) {
      setError('Todos los artículos deben tener un título y contenido formal.');
      return;
    }

    const newSections: ManualSection[] = sections.map((s, idx) => ({
      id: `${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-sec-${idx + 1}`,
      articleNumber: s.articleNumber.trim() || `Art. ${idx + 1}`,
      title: s.title.trim(),
      content: s.content.trim(),
      tags: s.tags.split(',').map(t => t.trim()).filter(Boolean),
      keyPoints: s.keyPoints ? s.keyPoints.split('|').map(p => p.trim()).filter(Boolean) : undefined
    }));

    const newManual: ManualDocument = {
      id: `man-custom-${Date.now()}`,
      title: title.trim(),
      code: code.trim().toUpperCase(),
      category,
      department: department.trim() || 'Dirección General',
      version: version.trim() || '1.0',
      updatedDate: new Date().toISOString().split('T')[0],
      summary: summary.trim() || `Manual de ${title}`,
      iconName: category === 'ti' ? 'Laptop' : category === 'seguridad' ? 'ShieldAlert' : category === 'legal_etica' ? 'Scale' : category === 'operaciones' ? 'Briefcase' : 'Users',
      sections: newSections
    };

    onAddManual(newManual);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Incorporar Manual o Política al Book</h2>
              <p className="text-xs text-slate-400">El Asistente integrará este documento inmediatamente a sus respuestas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates quick selector */}
        <div className="p-4 bg-indigo-950/20 border-b border-indigo-900/30 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-indigo-300 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Plantillas Rápidas:
          </span>
          <button
            type="button"
            onClick={() => handleApplyTemplate('remote')}
            className="text-xs px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
          >
            Teletrabajo y Desconexión
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('onboarding')}
            className="text-xs px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
          >
            Guía de Onboarding
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('diversity')}
            className="text-xs px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors"
          >
            Diversidad e Inclusión
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título del Manual / Documento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Manual de Trabajo Remoto 2026"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Código de Documento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. MAN-REM-06"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 uppercase font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ManualCategory)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="rrhh">Recursos Humanos / Personas</option>
                <option value="ti">Tecnología & TI</option>
                <option value="seguridad">Seguridad & SST</option>
                <option value="legal_etica">Legal, Ética & Compliance</option>
                <option value="operaciones">Finanzas & Operaciones</option>
                <option value="general">General / Bienvenida</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Departamento Responsable
              </label>
              <input
                type="text"
                placeholder="Ej. Gestión de Personas"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Versión
              </label>
              <input
                type="text"
                placeholder="1.0"
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Resumen Ejecutivo del Documento
            </label>
            <textarea
              rows={2}
              placeholder="Breve descripción del alcance y objetivos de esta política..."
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Section List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Artículos / Cláusulas del Manual</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  {sections.length}
                </span>
              </h3>
              <button
                type="button"
                onClick={handleAddSection}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Artículo</span>
              </button>
            </div>

            {sections.map((section, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      placeholder="Art. 1.1"
                      value={section.articleNumber}
                      onChange={e => {
                        const val = e.target.value;
                        setSections(prev =>
                          prev.map((s, i) => (i === idx ? { ...s, articleNumber: val } : s))
                        );
                      }}
                      className="w-24 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Título del Artículo..."
                      value={section.title}
                      onChange={e => {
                        const val = e.target.value;
                        setSections(prev =>
                          prev.map((s, i) => (i === idx ? { ...s, title: val } : s))
                        );
                      }}
                      className="flex-1 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(idx)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800"
                      title="Eliminar artículo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <textarea
                    rows={3}
                    placeholder="Contenido oficial del artículo o directiva..."
                    value={section.content}
                    onChange={e => {
                      const val = e.target.value;
                      setSections(prev =>
                        prev.map((s, i) => (i === idx ? { ...s, content: val } : s))
                      );
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">
                      Palabras clave (separadas por comas)
                    </label>
                    <input
                      type="text"
                      placeholder="remoto, horario, beneficio"
                      value={section.tags}
                      onChange={e => {
                        const val = e.target.value;
                        setSections(prev =>
                          prev.map((s, i) => (i === idx ? { ...s, tags: val } : s))
                        );
                      }}
                      className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">
                      Puntos clave para el Asistente (separados por |)
                    </label>
                    <input
                      type="text"
                      placeholder="Punto 1 | Punto 2"
                      value={section.keyPoints}
                      onChange={e => {
                        const val = e.target.value;
                        setSections(prev =>
                          prev.map((s, i) => (i === idx ? { ...s, keyPoints: val } : s))
                        );
                      }}
                      className="w-full px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Guardar en el Book de la Empresa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
