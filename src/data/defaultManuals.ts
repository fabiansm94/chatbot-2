import { ManualDocument } from '../types/manual';

export const DEFAULT_MANUALS: ManualDocument[] = [
  {
    id: 'man-seg-01',
    title: 'Procedimientos de Monitoreo y Vigilancia Remota',
    code: 'MAN-SEG-01',
    category: 'seguridad',
    version: '1.0',
    updatedDate: '2026-10-21',
    department: 'Centro de Control y Monitoreo',
    iconName: 'Eye',
    summary: 'Protocolos para la vigilancia de cámaras CCTV, monitoreo de alarmas remotas y respuesta a eventos detectados en tiempo real.',
    sections: [
      {
        id: 'seg-monitoreo-cctv',
        articleNumber: 'Art. 1.1',
        title: 'Vigilancia de Cámaras CCTV',
        tags: ['cctv', 'camaras', 'monitoreo', 'vigilancia'],
        content: 'El operador de monitoreo debe realizar patrullajes virtuales cada 15 minutos en todas las cámaras asignadas, reportando cualquier anomalía en la bitácora electrónica.',
        keyPoints: ['Patrullaje virtual cada 15 min', 'Reporte inmediato de anomalías']
      }
    ]
  },
  {
    id: 'man-seg-02',
    title: 'Control de Accesos y Seguridad Perimetral',
    code: 'MAN-SEG-02',
    category: 'seguridad',
    version: '1.0',
    updatedDate: '2026-10-21',
    department: 'Seguridad Física',
    iconName: 'ShieldCheck',
    summary: 'Directrices para el control de entrada/salida de personal, vehículos y proveedores en las instalaciones.',
    sections: [
      {
        id: 'seg-acceso-personal',
        articleNumber: 'Art. 2.1',
        title: 'Control de Acceso de Personal',
        tags: ['acceso', 'personal', 'identificacion'],
        content: 'Todo personal debe presentar identificación vigente. Visitantes deben registrarse obligatoriamente con documento de identidad original.',
        keyPoints: ['Registro obligatorio de visitantes', 'Identificación obligatoria']
      }
    ]
  },
  {
    id: 'man-seg-03',
    title: 'Protocolos de Reacción ante Alarmas y Emergencias',
    code: 'MAN-SEG-03',
    category: 'seguridad',
    version: '1.0',
    updatedDate: '2026-10-21',
    department: 'Respuesta Inmediata',
    iconName: 'AlertTriangle',
    summary: 'Pasos a seguir ante la activación de alarmas de intrusión, incendio o pánico.',
    sections: [
      {
        id: 'seg-reaccion-alarma',
        articleNumber: 'Art. 3.1',
        title: 'Protocolo ante Alarmas de Intrusión',
        tags: ['alarma', 'intrusion', 'reaccion'],
        content: 'Al recibir una alarma de intrusión, verificar video, contactar a la unidad de respuesta y notificar a la policía si es confirmado.',
        keyPoints: ['Verificación de video', 'Notificación a patrulla y policía']
      }
    ]
  },
  {
    id: 'man-4110',
    title: 'Puesto 25 - Foresta Residence (1)',
    code: 'MAN-4110',
    category: 'seguridad',
    version: '1.0',
    updatedDate: '2026-10-30',
    department: 'Seguridad Operativa',
    iconName: 'ShieldCheck',
    summary: 'Directrices del puesto 25 Foresta Residence y asignaciones de personal por sede.',
    sections: [
      {
        id: 'sec-foresta-info',
        articleNumber: 'Info',
        title: 'Personal Autorizado y Administración',
        tags: ['foresta', 'cinthia', 'collado', 'administracion', 'jaco'],
        content: 'Foresta Residence / Puesto 25.0 / SI -01 En primer lugar, se debe controlar las entradas y salidas del puesto, así como llevar el registro de dichas entradas o salidas.o actuales como pendientes ➤ Al registr o diario de visitas, sus horas de ingreso y las visitas pendientes ➤ Personal autorizado por administración (Cinthia Collado/Jaco Desarrollos/H.W./HOLIDAY RENTALS /Áreas comunes (reciclar basura, fumigar, mantenimiento de piscinas, limpiezas generales, trabajos o',
        keyPoints: ['Personal autorizado por administración: Cinthia Collado (Jaco Desarrollos / Holiday Rentals)', 'Control de entradas y salidas']
      },
      {
        id: 'sec-foresta-personal',
        articleNumber: 'Personal',
        title: 'Asignación de Personal Foresta y Sunset',
        tags: ['personal', 'foresta', 'sunset', 'alexander', 'farida', 'heidi', 'mantenimiento', 'limpieza', 'tecnico'],
        content: 'Hay 3 Alexander: Alexander - Mantenimiento Foresta Alexander - Mantenimiento Sunset Alexander - Tecnico Sunset Luego estan: Farida - Liempeza Sunset Heidi - Limpieza Foresta',
        keyPoints: ['Alexander - Mantenimiento Foresta', 'Alexander - Mantenimiento Sunset', 'Alexander - Tecnico Sunset', 'Farida - Liempeza Sunset', 'Heidi - Limpieza Foresta']
      }
    ]
  }
];
