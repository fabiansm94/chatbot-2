import { ManualDocument } from '../types/manual';

export const DEFAULT_MANUALS: ManualDocument[] = [
  {
    id: 'man-rrhh-01',
    title: 'Manual de Personas, RRHH y Beneficios Corporativos',
    code: 'MAN-RRHH-01',
    category: 'rrhh',
    version: '3.4',
    updatedDate: '2025-01-15',
    department: 'Gestión de Talento y Cultura',
    iconName: 'Users',
    summary: 'Directrices generales sobre jornada laboral, solicitud de vacaciones, permisos retribuidos, seguro complementario de salud, vales de comida y plan de beneficios flexibles.',
    sections: [
      {
        id: 'rrhh-vacaciones',
        articleNumber: 'Art. 4.1',
        title: 'Política de Vacaciones Anuales y Días Libres',
        tags: ['vacaciones', 'dias libres', 'descanso', 'solicitud', 'antelacion', 'aprobacion'],
        content: `1. Todo trabajador contratado por tiempo indefinido tiene derecho a 22 días hábiles (o el equivalente según convenio marco nacional) de vacaciones remuneradas por año completo laborado.
2. Procedimiento de solicitud: Las solicitudes deben registrarse a través del Portal del Empleado con al menos 15 días naturales de antelación para periodos superiores a 3 días, y al menos 48 horas de antelación para días individuales.
3. Aprobación: El responsable directo revisará y aprobará la solicitud en un plazo máximo de 3 días laborables, velando por la continuidad operativa del equipo.
4. Periodo de goce: Las vacaciones deben disfrutarse dentro del año en curso y hasta el 31 de marzo del año inmediatamente posterior. No son acumulables ni compensables económicamente salvo cese de relación laboral.
5. Días de libre disposición (Floating Days): Cada empleado dispone de 2 días adicionales al año para trámites personales o cumpleaños sin necesidad de justificación médica.`,
        keyPoints: [
          '22 días hábiles por año trabajado',
          'Solicitar con 15 días de anticipación (periodos > 3 días)',
          '2 Floating Days adicionales para libre disposición',
          'Plazo límite de disfrute: 31 de marzo del año siguiente'
        ]
      },
      {
        id: 'rrhh-permisos',
        articleNumber: 'Art. 4.2',
        title: 'Permisos Retribuidos y Licencias Especiales',
        tags: ['permisos', 'licencias', 'mudanza', 'matrimonio', 'enfermedad', 'fallecimiento', 'justificante'],
        content: `La empresa concede permisos con goce íntegro de sueldo en los siguientes supuestos, previa presentación del comprobante formal ante RRHH:
- Matrimonio o unión civil registrada: 15 días naturales continuos.
- Mudanza de domicilio habitual: 1 día laborable por año (2 días si implica cambio de provincia o estado).
- Fallecimiento de familiares de primer grado (padres, cónyuge, hijos): 4 días laborables (ampliable a 6 si requiere desplazamiento mayor a 250 km).
- Nacimiento / Cuidado del lactante y parental: Conforme al marco legal vigente (16 semanas remuneradas con opción de distribución compactada).
- Exámenes prenatales y preparación al parto: El tiempo indispensable dentro de la jornada laboral.
- Deber inexcusable de carácter público (mesa electoral, citación judicial): El tiempo necesario acreditado.
- Todos los justificantes deben remitirse a rrhh-gestion@empresa.com dentro de las 48 horas siguientes a la reincorporación.`,
        keyPoints: [
          '15 días por matrimonio/unión civil',
          '1 día por mudanza (2 días si hay cambio de ciudad)',
          '4 días por fallecimiento primer grado (+2 con desplazamiento)',
          'Justificante obligatorio en máx 48 horas tras reincorporación'
        ]
      },
      {
        id: 'rrhh-beneficios',
        articleNumber: 'Art. 5.1',
        title: 'Seguro Médico Complementario y Salud Integral',
        tags: ['seguro medico', 'salud', 'dental', 'copago', 'beneficios', 'familiares', 'poliza'],
        content: `1. Cobertura: La empresa financia al 100% la prima del seguro médico privado de salud y cuadro dental de libre elección para el trabajador titular desde el primer día de contrato.
2. Inclusión de dependientes: Cónyuges e hijos pueden incorporarse a la póliza corporativa con tarifa colectiva subvencionada (la empresa asume el 50% de la prima de dependientes).
3. Coberturas destacadas: Hospitalización sin límite de días, atención psicológica (hasta 12 sesiones anuales sin copago a través del programa EAP), fisioterapia preventiva y chequeo médico anual completo en clínicas concertadas.
4. Activación: La tarjeta digital de salud se descarga en la app de la aseguradora asociada con el DNI/cédula del empleado en un plazo de 5 días tras el alta laboral.`,
        keyPoints: [
          '100% financiado para el empleado titular',
          '50% de subsidio para cónyuge e hijos',
          'Incluye dental y 12 sesiones de apoyo psicológico anual',
          'Activación digital en app de la aseguradora'
        ]
      },
      {
        id: 'rrhh-vales-comida',
        articleNumber: 'Art. 5.2',
        title: 'Subsidio de Alimentación, Transporte y Teletrabajo',
        tags: ['vales', 'ticket restaurant', 'alimentacion', 'transporte', 'subsidio internet', 'remoto'],
        content: `1. Tarjeta Restaurant / Vales de comida: Cada colaborador recibe un saldo mensual de 11 € / $12 USD por cada día de trabajo presencial o mixto efectivo, utilizable en hostelería y supermercados autorizados.
2. Abono de transporte: Subvención del 50% del pase de transporte metropolitano para colaboradores adscritos a modalidad presencial o híbrida.
3. Subsidio de conectividad y suministros en teletrabajo: Para trabajadores en modalidad híbrida o 100% remota oficial, la empresa abona mensualmente una compensación neta de 45 € / $50 USD en nómina en concepto de compensación por gastos de luz, calefacción e internet de alta velocidad.`,
        keyPoints: [
          'Tarjeta de comida por día laborado',
          '50% abono transporte metropolitano',
          'Compensación neta mensual por teletrabajo en nómina (45€ / $50 USD)'
        ]
      }
    ]
  },
  {
    id: 'man-ti-02',
    title: 'Manual de TI, Ciberseguridad y Trabajo Híbrido',
    code: 'MAN-TI-02',
    category: 'ti',
    version: '2.9',
    updatedDate: '2025-02-10',
    department: 'Tecnologías de la Información & Ciberseguridad',
    iconName: 'Laptop',
    summary: 'Normas de uso de dispositivos corporativos, autenticación multifactor (2FA), gestión de contraseñas, protocolos ante incidentes de ciberseguridad y dotación de puesto de trabajo.',
    sections: [
      {
        id: 'ti-passwords-mfa',
        articleNumber: 'Art. 2.1',
        title: 'Gestión de Contraseñas y Doble Factor de Autenticación (2FA)',
        tags: ['contrasenas', 'password', '2fa', 'mfa', 'autenticacion', 'seguridad', '1password'],
        content: `1. Política de contraseñas: Deben tener una longitud mínima de 14 caracteres, combinando mayúsculas, minúsculas, números y símbolos especiales. Queda terminantemente prohibido reutilizar contraseñas anteriores o compartirlas con compañeros.
2. Gestor corporativo: La empresa suministra licencias de 1Password Empresarial. Todas las credenciales de servicios corporativos deben custodiarse exclusivamente en dicho gestor.
3. MFA / 2FA obligatorio: Toda cuenta corporativa (@empresa.com) debe tener configurado el doble factor mediante app de autenticación (Google Authenticator, Microsoft Authenticator o llave de seguridad física YubiKey). Los SMS no están admitidos como método principal de MFA.
4. Bloqueo de sesión: Los equipos deben bloquearse automáticamente tras 5 minutos de inactividad (Win + L en Windows o Ctrl + Cmd + Q en macOS).`,
        keyPoints: [
          'Mínimo 14 caracteres con símbolos y números',
          'Uso obligatorio del gestor 1Password corporativo',
          'MFA por aplicación obligatoria (SMS no permitido)',
          'Bloqueo automático de pantalla tras 5 minutos'
        ]
      },
      {
        id: 'ti-phishing-incidentes',
        articleNumber: 'Art. 2.3',
        title: 'Protocolo de Respuesta ante Phishing y Fuga de Información',
        tags: ['phishing', 'correo sospechoso', 'incidente', 'virus', 'malware', 'hackeo', 'soc', 'reporte'],
        content: `1. Detección de correos o mensajes sospechosos: Si recibe un correo con enlaces inusuales, peticiones urgentes de transferencias o cambios de cuenta bancaria:
   - NO haga clic en ningún enlace ni descargue adjuntos.
   - Presione el botón "Reportar Phishing" integrado en el cliente de correo (Outlook/Gmail).
   - O bien reenvíe el correo como archivo adjunto a security-alert@empresa.com.
2. Si por error hizo clic o introdujo credenciales:
   - Desconecte de inmediato el equipo de la red Wi-Fi o cable Ethernet.
   - Notifique de urgencia a la Línea Caliente de Seguridad de TI (+1-800-SEC-CORP o Slack/Teams #ti-emergencias).
   - El equipo de SOC aislará el equipo remotamente y procederá al reseteo preventivo de tokens de sesión.`,
        keyPoints: [
          'Usar botón "Reportar Phishing" o enviar a security-alert@empresa.com',
          'Si hizo clic: desconectar Wi-Fi/cable de inmediato',
          'Llamar a línea caliente o escribir a #ti-emergencias',
          'Nunca intentar solucionar una brecha sin informar al SOC'
        ]
      },
      {
        id: 'ti-teletrabajo-equipos',
        articleNumber: 'Art. 3.4',
        title: 'Equipamiento Informático y Puesto de Trabajo Remoto',
        tags: ['laptop', 'monitor', 'equipamiento', 'rotura', 'perdida', 'hardware', 'soporte'],
        content: `1. Dotación inicial: La empresa proporciona a cada colaborador una computadora portátil corporativa cifrada con BitLocker/FileVault, ratón ergonómico, teclado y auriculares con cancelación de ruido.
2. Pack de pantalla ergonómica: El colaborador puede solicitar a TI un monitor externo de 27" para su domicilio a través de la mesa de ayuda (ServiceNow) con entrega directa por mensajería.
3. Renovación de hardware: Los equipos portátiles se sustituyen cada 3 años de ciclo de vida.
4. Pérdida o robo de equipos: Debe comunicarse a TI y formalizar denuncia policial en un plazo máximo de 12 horas para proceder al borrado remoto (Remote Wipe) del dispositivo y evitar sanciones de protección de datos.`,
        keyPoints: [
          'Portátil cifrado + accesorios ergonómicos',
          'Monitor de 27" solicitables vía ServiceNow para casa',
          'Ciclo de renovación de hardware cada 3 años',
          'Denuncia y reporte de robo en máx 12 horas'
        ]
      }
    ]
  },
  {
    id: 'man-sst-03',
    title: 'Manual de Prevención, Seguridad y Salud Laboral',
    code: 'MAN-SST-03',
    category: 'seguridad',
    version: '4.2',
    updatedDate: '2025-01-20',
    department: 'Seguridad y Salud en el Trabajo (SST)',
    iconName: 'ShieldAlert',
    summary: 'Protocolos de evacuación de sedes, reporte de accidentes de trabajo o in itinere, primeros auxilios, pausas activas y ergonomía laboral.',
    sections: [
      {
        id: 'sst-accidentes',
        articleNumber: 'Art. 2.1',
        title: 'Protocolo de Reporte de Accidentes Laborales e "In Itinere"',
        tags: ['accidente', 'urgencia', 'lesion', 'in itinere', 'mutua', 'hospital', 'sst', 'formulario'],
        content: `1. Accidente en la sede o lugar de trabajo:
   - Se debe prestar auxilio primario inmediato contactando al brigadista de primeros auxilios del piso o botiquín central.
   - Si la gravedad lo amerita, contactar a emergencias médicas externas (112 / 911) y avisar a recepción.
   - Notificar al responsable del área y al departamento de SST dentro de las 24 horas del suceso mediante el Formulario SST-01.
2. Accidente "In Itinere" (trayecto directo entre domicilio y centro de trabajo):
   - El trayecto debe coincidir con el itinerario habitual y no haberse interrumpido por motivos de ocio o personales ajenos.
   - Se debe acudir al centro asistencial concertado de la Mutua de Accidentes presentando el certificado de empresa.
   - Remitir el informe de asistencia médica a sst@empresa.com antes de las 48 horas.`,
        keyPoints: [
          'Atención inmediata con brigadista o 112/911',
          'Llenar Formulario SST-01 en menos de 24 horas',
          'Accidentes in itinere: acudir a la Mutua con certificado de empresa',
          'Remitir parte de atención en máx 48 horas'
        ]
      },
      {
        id: 'sst-evacuacion',
        articleNumber: 'Art. 3.1',
        title: 'Plan de Emergencia y Evacuación de Edificios',
        tags: ['evacuacion', 'incendio', 'alarma', 'salida de emergencia', 'punto de encuentro', 'simulacro'],
        content: `1. Activación de la alarma acústica continua:
   - Guarde la calma, interrumpa cualquier llamada o reunión y cierre las ventanas si es seguro.
   - No utilice bajo ninguna circunstancia los ascensores. Use exclusivamente las escaleras de emergencia.
   - Siga las instrucciones del Coordinador de Evacuación de su planta (chaleco reflectante naranja).
   - No regrese jamás a recoger efectos personales.
2. Punto de Encuentro Exterior:
   - Diríjase a la Plaza Central exterior señalizada como "Punto de Reunión Alfa".
   - Permanezca agrupado por departamento para facilitar el recuento de personas.`,
        keyPoints: [
          'Uso exclusivo de escaleras (prohibido ascensores)',
          'Seguir al brigadista de planta con chaleco naranja',
          'Punto de reunión: Plaza Central (Punto Alfa)',
          'No volver por objetos personales'
        ]
      },
      {
        id: 'sst-ergonomia',
        articleNumber: 'Art. 4.3',
        title: 'Ergonomía frente a Pantallas y Pausas Activas',
        tags: ['ergonomia', 'pantalla', 'postura', 'pausas activas', 'espalda', 'vista'],
        content: `1. Regla 20-20-6: Cada 20 minutos de trabajo continuado en pantalla, desvíe la mirada durante al menos 20 segundos hacia un objeto situado a 6 metros de distancia para relajar los músculos ciliares.
2. Postura en la silla ergonómica: Los muslos deben quedar paralelos al suelo, rodillas a 90 grados, con la zona lumbar apoyada firmemente y los antebrazos alineados a la mesa de trabajo.
3. Pausas activas programadas: La empresa promueve dos pausas activas diarias de 5 a 10 minutos (11:00 AM y 4:00 PM) con estiramientos de cuello, muñecas y hombros guiados en la intranet.`,
        keyPoints: [
          'Regla 20-20-6 de descanso visual',
          'Ajuste ergonómico de silla y monitor al nivel de los ojos',
          'Pausas activas a las 11:00 AM y 4:00 PM'
        ]
      }
    ]
  },
  {
    id: 'man-eth-04',
    title: 'Código de Ética, Conducta y Línea de Denuncias',
    code: 'MAN-ETH-04',
    category: 'legal_etica',
    version: '2.4',
    updatedDate: '2025-01-10',
    department: 'Cumplimiento Normativo (Compliance) & Legal',
    iconName: 'Scale',
    summary: 'Principios de integridad corporativa, política anticorrupción, límites a regalos comerciales, prevención del acoso laboral y funcionamiento del canal de denuncias anónimas.',
    sections: [
      {
        id: 'eth-canal-denuncias',
        articleNumber: 'Art. 1.3',
        title: 'Canal de Denuncias Éticas y Protección al Denunciante',
        tags: ['denuncia', 'linea etica', 'acoso', 'fraude', 'anonimato', 'represalias', 'compliance'],
        content: `1. Principio rector: La empresa garantiza confidencialidad absoluta y una estricta política de "Tolerancia Cero a las Represalias" frente a cualquier empleado que formule una alerta o denuncia de buena fe.
2. Vías de reporte disponibles 24/7/365:
   - Plataforma web externa e independiente: https://linea-etica-corporativa.internal (permite reporte 100% anónimo con buzón cifrado).
   - Teléfono gratuito internacional atendido por auditores externos.
   - Correo electrónico directo del Oficial de Cumplimiento: compliance@empresa.com.
3. Plazos de investigación: El Comité de Ética acusará recibo en un máximo de 7 días naturales y emitirá un informe de conclusiones y medidas correctivas en no más de 90 días.`,
        keyPoints: [
          'Garantía total contra represalias',
          'Opción de reporte 100% anónimo en plataforma web externa',
          'Acuse de recibo en 7 días y resolución en máx 90 días'
        ]
      },
      {
        id: 'eth-regalos',
        articleNumber: 'Art. 2.2',
        title: 'Política de Aceptación de Regalos, Hospitalidad y Conflictos de Interés',
        tags: ['regalos', 'soborno', 'proveedores', 'comidas', 'limite', 'conflicto de interes'],
        content: `1. Límite de valor: Ningún empleado puede aceptar regalos, obsequios o atenciones comerciales de clientes, socios o proveedores cuyo valor estimado supere los 60 € / $70 USD.
2. Prohibición estricta: Se prohíbe taxativamente aceptar dinero en efectivo, cheques, criptomonedas, vales de compra o regalos de cualquier importe si existe un proceso de licitación, negociación contractual o adjudicación activa.
3. Registro de obsequios: Todo regalo recibido que cumpla los criterios permitidos pero supere los 30 € debe inscribirse en el Registro de Transparencia del Portal de Compliance dentro de los 5 días posteriores a su entrega.
4. Sorteo navideño: Los cestas o regalos de cortesía de fin de año se sortean entre todo el personal de la empresa de forma transparente.`,
        keyPoints: [
          'Límite máximo de cortesía comercial: 60 € / $70 USD',
          'Prohibido efectivo o regalos durante licitaciones',
          'Registro obligatorio en Compliance si supera 30 €',
          'Cestas y presentes festivos se sortean internamente'
        ]
      },
      {
        id: 'eth-acoso-discriminacion',
        articleNumber: 'Art. 3.1',
        title: 'Tolerancia Cero contra el Acoso Laboral, Sexual y Discriminación',
        tags: ['acoso', 'discriminacion', 'respeto', 'igualdad', 'diversidad', 'protocolo'],
        content: `1. Compromiso: La compañía promueve un ambiente de trabajo libre de cualquier tipo de discriminación por razón de género, raza, orientación sexual, religión, discapacidad, edad o ideología.
2. Conductas inaceptables: Se tipifica como falta muy grave cualquier trato degradante, comentarios vejatorios, insinuaciones sexuales no deseadas, aislamiento social deliberado o abuso de poder jerárquico.
3. Medidas cautelares inmediatas: Ante la apertura de un expediente informativo por presunto acoso, se dispondrá la separación física o funcional inmediata de las partes involucradas protegiendo a la presunta víctima.`,
        keyPoints: [
          'Tolerancia cero absoluta ante faltas de respeto y acoso',
          'Separación preventiva de funciones para proteger a la víctima',
          'Sanciones disciplinarias que contemplan el despido procedente'
        ]
      }
    ]
  },
  {
    id: 'man-ops-05',
    title: 'Manual de Gastos de Viaje, Viáticos y Compras Operativas',
    code: 'MAN-OPS-05',
    category: 'operaciones',
    version: '1.8',
    updatedDate: '2025-01-30',
    department: 'Finanzas, Tesorería y Operaciones',
    iconName: 'Briefcase',
    summary: 'Procedimiento de solicitud de anticipos, límites tarifarios de hoteles, dietas diarias de viaje (viáticos), compras menores y rendición de gastos en nómina.',
    sections: [
      {
        id: 'ops-viaticos-limites',
        articleNumber: 'Art. 2.1',
        title: 'Límites Diarios de Viáticos y Alojamiento para Viajes de Negocios',
        tags: ['viaticos', 'gastos', 'viajes', 'hotel', 'dietas', 'facturas', 'rendicion'],
        content: `1. Límites diarios de alimentación en viajes de trabajo:
   - Nacional / Doméstico: Hasta 55 € / $65 USD por día (desayuno 10, almuerzo 25, cena 20).
   - Internacional: Hasta 90 € / $105 USD por día (o según anexo de ciudades caras tipo Londres, Nueva York, Tokio: 120 €/día).
   - No se reembolsan bebidas alcohólicas ni consumos del minibar del hotel.
2. Alojamiento: Se reservará en hoteles de categoría estándar 3 o 4 estrellas a través de la agencia corporativa de viajes autorizada con los siguientes techos:
   - Ciudades principales: Hasta 140 € / $160 USD por noche.
   - Ciudades secundarias: Hasta 95 € / $110 USD por noche.
3. Desplazamientos: Se priorizará el tren de alta velocidad en clase turista para trayectos menores a 3 horas. Vuelos en clase turista para cualquier viaje internacional.`,
        keyPoints: [
          'Dieta nacional: 55 €/día | Internacional: 90-120 €/día',
          'Hoteles 3-4 estrellas con reserva por agencia corporativa',
          'Vuelos y trenes en clase económica/turista',
          'No se cubren consumos personales ni alcohol'
        ]
      },
      {
        id: 'ops-rendicion-plazos',
        articleNumber: 'Art. 3.2',
        title: 'Plazo y Requisitos de Rendición de Gastos de Viaje',
        tags: ['rendicion', 'plazo', 'factura', 'tickets', 'reembolso', 'expensify'],
        content: `1. Plazo de presentación: Todo colaborador que haya incurrido en gastos de representación o viaje debe enviar la hoja de liquidación mediante la plataforma Expensify / Portal Financiero dentro de los 10 días hábiles posteriores al retorno del viaje.
2. Requisitos de validez fiscal:
   - Todo gasto superior a 15 € debe contar con factura formal a nombre de la empresa con el NIF/CIF fiscal correspondiente.
   - Los tickets simples solo se aceptan de forma excepcional para taxis, peajes o estacionamientos donde no sea viable factura.
3. Calendario de liquidación: Los gastos aprobados antes del día 15 de cada mes se liquidan en la nómina de ese mismo mes por transferencia bancaria.`,
        keyPoints: [
          'Plazo máximo de rendición: 10 días hábiles tras finalizar el viaje',
          'Facturas con NIF corporativo para gastos > 15 €',
          'Aprobación antes del día 15 = abono en nómina corriente'
        ]
      }
    ]
  }
];
