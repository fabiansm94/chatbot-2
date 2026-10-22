import { ChatMessage, UserChatThread } from '../types/manual';

export const DEFAULT_USER_THREADS: UserChatThread[] = [
  {
    userId: 'current-user',
    userName: 'Tú',
    userRole: 'Mi Perfil de Empleado',
    department: 'Mi Cuenta',
    initials: 'TU',
    bgGradient: 'from-amber-400 via-rose-500 to-red-500',
    isCurrentUser: true,
    lastActive: 'Ahora',
    messages: []
  },
  {
    userId: 'user-marianne',
    userName: 'Marianne Miu',
    userRole: 'Especialista en Talento',
    department: 'Recursos Humanos',
    initials: 'MM',
    bgGradient: 'from-pink-400 to-rose-500',
    isCurrentUser: false,
    lastActive: 'Hace 15 min',
    unreadCount: 2,
    messages: [
      {
        id: 'mm-1',
        role: 'user',
        content: 'Hola ManualBot, una duda rápida sobre el reglamento: ¿con cuánta anticipación debe un colaborador solicitar sus vacaciones anuales y cuántos días se pueden acumular para el siguiente período?',
        timestamp: Date.now() - 1000 * 60 * 60 * 2
      },
      {
        id: 'mm-2',
        role: 'assistant',
        content: '¡Hola Marianne! Con gusto te detallo lo que indica nuestra normativa interna:\n\n• **Anticipación mínima**: Toda solicitud de vacaciones debe registrarse en el portal corporativo con al menos **15 días corridos de anticipación** a la fecha de inicio deseada (para que la jefatura pueda planificar la cobertura del equipo).\n• **Acumulación de días**: El reglamento permite acumular hasta un máximo de **5 días hábiles** para el año inmediatamente siguiente, los cuales deben disfrutarse preferentemente dentro del primer semestre.\n\nAmbas directrices están estipuladas en el **MAN-RRHH-01 (Manual de Vacaciones y Permisos)**, Art. 2: Procedimiento de Solicitud y Plazos.',
        timestamp: Date.now() - 1000 * 60 * 58,
        grounded: true,
        citations: [
          {
            manualId: 'man-rrhh-01',
            manualCode: 'MAN-RRHH-01',
            manualTitle: 'Política de Vacaciones Anuales y Días Libres',
            sectionId: 'sec-vac-02',
            articleNumber: 'Art. 2',
            sectionTitle: 'Procedimiento de Solicitud y Plazos',
            excerpt: 'Las solicitudes deben enviarse con al menos 15 días de antelación...'
          }
        ]
      },
      {
        id: 'mm-3',
        role: 'user',
        content: 'Excelente, ¿y qué documentación se necesita presentar para el permiso remunerado por nacimiento o paternidad?',
        timestamp: Date.now() - 1000 * 60 * 20
      },
      {
        id: 'mm-4',
        role: 'assistant',
        content: 'Para el permiso remunerado de paternidad (que otorga **10 días hábiles continuos** con goce íntegro de sueldo), el trabajador solo debe adjuntar el **certificado de nacimiento oficial o resolución judicial de adopción** en el portal de RRHH dentro de los primeros 5 días hábiles posteriores al nacimiento.\n\nTodo esto figura en el Art. 3 del MAN-RRHH-01.',
        timestamp: Date.now() - 1000 * 60 * 18,
        grounded: true,
        citations: [
          {
            manualId: 'man-rrhh-01',
            manualCode: 'MAN-RRHH-01',
            manualTitle: 'Política de Vacaciones Anuales y Días Libres',
            sectionId: 'sec-vac-03',
            articleNumber: 'Art. 3',
            sectionTitle: 'Permisos Especiales con Goce de Sueldo',
            excerpt: '10 días hábiles remunerados por nacimiento de hijo o adopción...'
          }
        ]
      }
    ]
  },
  {
    userId: 'user-tommy',
    userName: 'Tommy Chen',
    userRole: 'Ingeniero de Infraestructura',
    department: 'Sistemas & Ciberseguridad',
    initials: 'TC',
    bgGradient: 'from-sky-400 to-blue-600',
    isCurrentUser: false,
    lastActive: 'Hace 45 min',
    unreadCount: 1,
    messages: [
      {
        id: 'tc-1',
        role: 'user',
        content: '¿Cuáles son los requisitos obligatorios de complejidad de contraseñas y qué debe hacer un empleado si extravía su teléfono con la aplicación de 2FA?',
        timestamp: Date.now() - 1000 * 60 * 60 * 4
      },
      {
        id: 'tc-2',
        role: 'assistant',
        content: '¡Hola Tommy! Conforme al **MAN-TI-02 (Ciberseguridad y Gestión de Accesos)**:\n\n1. **Requisitos de Contraseñas**:\n   • Mínimo **12 caracteres**.\n   • Debe combinar mayúsculas, minúsculas, números y al menos un símbolo especial.\n   • Expiración forzada cada **90 días**, prohibiendo repetir las últimas 5 contraseñas.\n\n2. **Pérdida de dispositivo 2FA**:\n   • El colaborador debe reportarlo de inmediato a la **Mesa de Ayuda de TI (Helpdesk)** vía llamada telefónica o presencial.\n   • El equipo de TI invalidará los tokens anteriores y emitirá un código de acceso temporal de 24 horas tras validar su identidad con su jefatura directa.',
        timestamp: Date.now() - 1000 * 60 * 45,
        grounded: true,
        citations: [
          {
            manualId: 'man-ti-02',
            manualCode: 'MAN-TI-02',
            manualTitle: 'Gestión de Contraseñas y Doble Factor de Autenticación',
            sectionId: 'sec-ti-01',
            articleNumber: 'Art. 1',
            sectionTitle: 'Estándar de Complejidad y Rotación de Contraseñas',
            excerpt: 'Longitud mínima de 12 caracteres, cambio cada 90 días...'
          }
        ]
      }
    ]
  },
  {
    userId: 'user-eliza',
    userName: 'Eliza Stone',
    userRole: 'Supervisora de Seguridad y Salud',
    department: 'Prevención de Riesgos (SST)',
    initials: 'ES',
    bgGradient: 'from-emerald-400 to-teal-600',
    isCurrentUser: false,
    lastActive: 'Ayer',
    unreadCount: 1,
    messages: [
      {
        id: 'es-1',
        role: 'user',
        content: '¿Cuál es el protocolo de reporte inmediato en caso de que ocurra un accidente laboral en cualquiera de las sedes y qué plazo máximo hay?',
        timestamp: Date.now() - 1000 * 60 * 60 * 26
      },
      {
        id: 'es-2',
        role: 'assistant',
        content: '¡Hola Eliza! El protocolo del **MAN-SST-03 (Seguridad y Salud en el Trabajo)** estipula:\n\n1. **Primeros Auxilios**: Atender y trasladar de inmediato al afectado al centro médico de convenio o activar el servicio de emergencias médicas.\n2. **Plazo de Notificación**: Debe notificarse al área de SST y a la jefatura directa en un plazo **máximo de 2 horas** desde ocurrido el evento.\n3. **Comité de Investigación**: Se debe levantar el acta preliminar de causas e investigación dentro de las **48 horas hábiles** posteriores al accidente.',
        timestamp: Date.now() - 1000 * 60 * 60 * 25,
        grounded: true,
        citations: [
          {
            manualId: 'man-sst-03',
            manualCode: 'MAN-SST-03',
            manualTitle: 'Protocolo de Reporte de Accidentes Laborales y Emergencias',
            sectionId: 'sec-sst-01',
            articleNumber: 'Art. 1',
            sectionTitle: 'Notificación Inmediata y Plazos de Reporte',
            excerpt: 'Todo incidente o accidente laboral debe ser comunicado dentro de las primeras 2 horas...'
          }
        ]
      }
    ]
  },
  {
    userId: 'user-michael',
    userName: 'Michael Smith',
    userRole: 'Oficial de Cumplimiento',
    department: 'Legal & Ética',
    initials: 'MS',
    bgGradient: 'from-purple-400 to-indigo-600',
    isCurrentUser: false,
    lastActive: 'Hace 2 días',
    unreadCount: 0,
    messages: [
      {
        id: 'ms-1',
        role: 'user',
        content: '¿Qué garantías de confidencialidad y protección frente a represalias existen para un empleado que use la línea ética para denunciar un posible conflicto de interés?',
        timestamp: Date.now() - 1000 * 60 * 60 * 48
      },
      {
        id: 'ms-2',
        role: 'assistant',
        content: '¡Hola Michael! Conforme al **MAN-ETH-04 (Código de Ética y Canal de Denuncias)**:\n\n• **Anonimato y Confidencialidad**: La línea ética es operada por un proveedor externo independiente. El denunciante puede elegir permanecer en estricto anonimato.\n• **Política de Cero Represalias**: Está terminantemente prohibida cualquier medida disciplinaria, hostigamiento o cambio desfavorable hacia quien reporte de buena fe. Las represalias son sancionadas con despido inmediato por causa justificada.',
        timestamp: Date.now() - 1000 * 60 * 60 * 47,
        grounded: true,
        citations: [
          {
            manualId: 'man-eth-04',
            manualCode: 'MAN-ETH-04',
            manualTitle: 'Canal de Denuncias Éticas y Protección al Denunciante',
            sectionId: 'sec-eth-01',
            articleNumber: 'Art. 1',
            sectionTitle: 'Garantía de Confidencialidad y Protección contra Represalias',
            excerpt: 'La empresa garantiza la estricta reserva de la identidad del denunciante...'
          }
        ]
      }
    ]
  },
  {
    userId: 'user-frances',
    userName: 'Frances Ford',
    userRole: 'Analista de Finanzas',
    department: 'Administración & Finanzas',
    initials: 'FF',
    bgGradient: 'from-amber-400 to-orange-500',
    isCurrentUser: false,
    lastActive: 'Hace 3 días',
    unreadCount: 0,
    messages: [
      {
        id: 'ff-1',
        role: 'user',
        content: '¿Cuáles son los topes vigentes de viáticos diarios para alimentación y alojamiento en comisiones nacionales, y cuántos días hay para rendir gastos?',
        timestamp: Date.now() - 1000 * 60 * 60 * 72
      },
      {
        id: 'ff-2',
        role: 'assistant',
        content: '¡Hola Frances! Según el **MAN-OPS-05 (Política de Viáticos y Gastos de Viaje)**:\n\n• **Alimentación diaria**: Hasta **$45 USD diarios** en viajes nacionales (incluye desayuno, almuerzo y cena).\n• **Alojamiento**: Hasta **$95 USD por noche** en hoteles de tarifa corporativa autorizados.\n• **Plazo de Rendición**: Todas las facturas y comprobantes fiscales deben ingresarse en el sistema dentro de los **5 días hábiles** siguientes a la finalización del viaje.',
        timestamp: Date.now() - 1000 * 60 * 60 * 71,
        grounded: true,
        citations: [
          {
            manualId: 'man-ops-05',
            manualCode: 'MAN-OPS-05',
            manualTitle: 'Límites Diarios de Viáticos y Alojamiento Corporativo',
            sectionId: 'sec-ops-01',
            articleNumber: 'Art. 1',
            sectionTitle: 'Topes Diarios de Alimentación y Hospedaje',
            excerpt: 'Alimentación $45 USD diarios, alojamiento $95 USD por noche...'
          }
        ]
      }
    ]
  },
  {
    userId: 'user-andres',
    userName: 'Andrés Silva',
    userRole: 'Líder de Operaciones',
    department: 'Operaciones & Logística',
    initials: 'AS',
    bgGradient: 'from-cyan-400 to-teal-500',
    isCurrentUser: false,
    lastActive: 'Hace 4 días',
    unreadCount: 0,
    messages: [
      {
        id: 'as-1',
        role: 'user',
        content: '¿Cómo funciona la política de teletrabajo o trabajo híbrido y cuántos días se pueden hacer desde casa?',
        timestamp: Date.now() - 1000 * 60 * 60 * 96
      },
      {
        id: 'as-2',
        role: 'assistant',
        content: '¡Hola Andrés! En la modalidad híbrida corporativa regulada en el **MAN-RRHH-01**:\n\n• Los colaboradores en roles elegibles pueden trabajar hasta **2 días a la semana de forma remota**, coordinando previamente los días fijos con su jefatura directa para asegurar cobertura presencial.\n• La empresa provee los accesorios tecnológicos necesarios (laptop, monitor y periféricos) tramitados por ticket en TI.',
        timestamp: Date.now() - 1000 * 60 * 60 * 95,
        grounded: true,
        citations: [
          {
            manualId: 'man-rrhh-01',
            manualCode: 'MAN-RRHH-01',
            manualTitle: 'Política de Vacaciones Anuales y Días Libres',
            sectionId: 'sec-vac-01',
            articleNumber: 'Art. 1',
            sectionTitle: 'Cálculo de Días de Vacaciones y Modalidades',
            excerpt: 'Esquema híbrido de hasta 2 días de trabajo remoto semanal...'
          }
        ]
      }
    ]
  }
];

export function getUserThread(threads: UserChatThread[], userId: string): UserChatThread | undefined {
  return threads.find(t => t.userId === userId);
}

export function appendUserMessage(
  threads: UserChatThread[],
  userId: string,
  message: ChatMessage
): UserChatThread[] {
  return threads.map(thread => {
    if (thread.userId === userId) {
      return {
        ...thread,
        messages: [...thread.messages, message],
        lastActive: 'Ahora'
      };
    }
    return thread;
  });
}

export function searchUserThreads(threads: UserChatThread[], query: string): UserChatThread[] {
  if (!query || !query.trim()) return threads;
  const q = query.toLowerCase().trim();

  return threads.filter(thread => {
    if (thread.userName.toLowerCase().includes(q)) return true;
    if (thread.department.toLowerCase().includes(q)) return true;
    if (thread.userRole.toLowerCase().includes(q)) return true;
    return thread.messages.some(
      m => m.content.toLowerCase().includes(q)
    );
  });
}
