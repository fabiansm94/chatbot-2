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
  }
];
