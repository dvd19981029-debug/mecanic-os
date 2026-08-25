/**
 * Mecanic OS - Centro Legal: Términos y Condiciones & Política de Privacidad
 * Adaptado y blindado conforme al marco legal de la República de El Salvador:
 * - Exoneración integral por Bugs, Errores de Software, Fórmulas, Descuadres y Lucro Cesante ("AS IS")
 * - Código Tributario y Normativa de Facturación Electrónica (DTE / DGII - Ministerio de Hacienda)
 * - Ley de Protección al Consumidor (Defensoría del Consumidor)
 * - Ley de Comercio Electrónico y Ley de Firma Electrónica
 * - Estándares de Privacidad y Manejo de Datos (ARCO-POL)
 */

import { html } from '../utils.js?v=69';

export function renderTerminosPublicos(container) {
    container.innerHTML = html`
        <div style="min-height: 100vh; background: var(--bg-base); color: var(--text-primary); padding: 2.5rem 1rem; overflow-y: auto;">
            <div style="max-width: 950px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 2.5rem 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.45);">
                
                <!-- HEADER CON TABS Y RETORNO -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 46px; height: 46px; background: rgba(99, 102, 241, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.4rem;">
                            <i class="fa-solid fa-scale-balanced"></i>
                        </div>
                        <div>
                            <h1 style="font-family:'Outfit', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0;">Centro Legal y Normativo</h1>
                            <span style="color: var(--text-secondary); font-size: 0.82rem;">Mecanic OS • Forbidden Soluciones S.A. de C.V. • El Salvador</span>
                        </div>
                    </div>

                    <a href="#landing" class="btn btn-secondary" style="font-size: 0.85rem; font-weight: 600; padding: 0.55rem 1.3rem; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color);">
                        <i class="fa-solid fa-arrow-left"></i> Volver a la Web
                    </a>
                </div>

                <!-- SELECTOR DE PESTAÑAS LEGALES -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: rgba(255,255,255,0.03); padding: 0.4rem; border-radius: 10px; border: 1px solid var(--border-color);">
                    <button id="legal-tab-terms" class="btn btn-primary" style="flex: 1; padding: 0.65rem 1rem; font-size: 0.88rem; font-weight: 700; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
                        <i class="fa-solid fa-file-contract"></i> 1. Términos, Licenciamiento y Exoneración de Responsabilidad
                    </button>
                    <button id="legal-tab-privacy" class="btn btn-secondary" style="flex: 1; padding: 0.65rem 1rem; font-size: 0.88rem; font-weight: 700; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; background: transparent; border: none; color: var(--text-secondary);">
                        <i class="fa-solid fa-shield-halved"></i> 2. Política de Privacidad & Protección de Datos
                    </button>
                </div>

                <!-- CONTENEDOR 1: TERMINOS Y CONDICIONES -->
                <div id="legal-content-terms" style="display: block; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 10px; padding: 2.25rem 2rem; max-height: 65vh; overflow-y: auto; font-size: 0.88rem; line-height: 1.75; color: var(--text-secondary); font-family: 'Inter', sans-serif; white-space: pre-wrap; text-align: left;">TÉRMINOS Y CONDICIONES GENERALES DE USO, LICENCIAMIENTO Y EXONERACIÓN DE RESPONSABILIDAD
PLATAFORMA MECANIC OS (EL SALVADOR)
Última actualización: 25 de Agosto de 2026

PROVEEDOR DEL SERVICIO:
FORBIDDEN SOLUCIONES S.A. DE C.V., sociedad salvadoreña con domicilio legal en la República de El Salvador (en adelante denominada "EL PROVEEDOR" o "FORBIDDEN SOLUCIONES").

1. MARCO LEGAL APLICABLE Y ACEPTACIÓN VINCULANTE
El presente instrumento contractual regula el acceso, licenciamiento, uso operativo, administrativo y contable de la plataforma de software en la nube denominada MECANIC OS (en adelante "LA PLATAFORMA"), conforme a las leyes vigentes de la República de El Salvador, en particular:
a) El Código de Comercio de El Salvador.
b) La Ley de Comercio Electrónico y Ley de Firma Electrónica.
c) La Ley de Protección al Consumidor.
d) El Código Tributario de El Salvador y los Lineamientos Técnicos y Normativos de Facturación Electrónica (DTE) dictados por la Dirección General de Impuestos Internos (DGII) del Ministerio de Hacienda.

Al registrarse, acceder, utilizar o pagar cualquier suscripción o licencia de LA PLATAFORMA, la persona natural o jurídica titular del establecimiento automotriz (en adelante "EL CLIENTE" o "EL TALLER") declara haber leído, comprendido y aceptado en su totalidad estos Términos, obligándose legalmente a su estricto cumplimiento.

2. NATURALEZA DEL SERVICIO Y LICENCIAMIENTO (SaaS)
2.1. Modelo de Licencia:
Mecanic OS se entrega bajo la modalidad de Software como Servicio (SaaS) o Licencia de Uso Operativo no exclusiva, intransferible y revocable en caso de incumplimiento. En ningún caso se otorga al CLIENTE cesión de derechos patrimoniales de autor, venta del código fuente, arquitectura de base de datos ni derechos de explotación intelectual.
2.2. Módulos Comprendidos:
El software provee herramientas tecnológicas para la automatización de talleres mecánicos, incluyendo:
1. Directorio de Clientes y Flota de Vehículos.
2. Hoja de Ingreso y Recepción Digital con inventario físico y firma en pantalla.
3. Diagnóstico e Inspección Técnica de 21 Puntos por Semáforo.
4. Presupuestos y Cotizaciones con cálculo de mano de obra y repuestos.
5. Tablero Kanban y Control de Flujo de Reparaciones en Taller.
6. Facturador Electrónico DTE (Facturas, Créditos Fiscales, Sujetos Excluidos, Notas de Crédito).
7. Punto de Venta (POS) para mostrador y Venta Rápida.
8. Control de Caja Diaria, Cortes Ciegos, Entradas y Salidas de Efectivo.
9. Control de Inventario y Kárdex Automatizado de Repuestos.
10. Control de Compras a Proveedores y Gastos Operativos.
11. Estimador de Planilla Laboral de Ley (ISSS, AFP, Renta ISR) y Liquidación de Comisiones.

3. EXONERACIÓN INTEGRAL DE RESPONSABILIDAD POR BUGS, ERRORES DE SOFTWARE Y PROVISIÓN "TAL CUAL" (AS IS)
3.1. Provisión en Estado Actual ("AS IS" y "AS AVAILABLE"):
EL CLIENTE reconoce y acepta expresamente que el software, por su propia naturaleza tecnológica, es susceptible a fallas, interrupciones, incompatibilidades de navegador, errores de codificación (bugs) o caídas fortuitas. LA PLATAFORMA se provee "TAL CUAL" y "SEGÚN DISPONIBILIDAD", sin garantías explícitas o implícitas de infalibilidad absoluta, funcionamiento ininterrumpido o libre de defectos.
3.2. Deber de Verificación y Control del Taller:
LA PLATAFORMA es una herramienta de auxilio operativo y cálculo automatizado. EL TALLER, sus contadores, cajeros y administradores tienen la obligación indelegable de revisar y verificar la coherencia de todos los números, presupuestos, cortes de caja, montos facturados, retenciones (1%), percepciones (2%), inventarios y saldos antes de emitir documentos formales o liquidar pagos a terceros o empleados.
3.3. Exclusión Total de Lucro Cesante y Daños Consecuenciales:
EN NINGÚN CASO FORBIDDEN SOLUCIONES S.A. DE C.V., SUS ACCIONISTAS, DIRECTORES, DESARROLLADORES O EMPLEADOS SERÁN RESPONSABLES ANTE EL CLIENTE O TERCEROS POR:
a) Daños directos, indirectos, incidentales, punitivos, especiales o consecuenciales.
b) Pérdida de ganancias, lucro cesante, interrupción de operaciones comerciales o pérdida de oportunidades de negocio.
c) Errores en cálculos de kárdex, descuadres en cortes de caja o discrepancias en estimaciones de salarios/comisiones.
d) Pérdida, corrupción o alteración de datos locales, fallos de conexión o caídas en la red de internet del usuario.
3.4. Límite Máximo Indemnizatorio:
En el supuesto no consentido de que un tribunal competente de la República de El Salvador declare alguna responsabilidad a cargo del PROVEEDOR, la responsabilidad total agregada y máxima quedará expresamente limitada al monto efectivamente pagado por EL TALLER durante el último mes de suscripción del servicio o el equivalente a una mensualidad ordinaria básica.

4. DESLINDE ESPECÍFICO Y LÍMITES EN MATERIA TRIBUTARIA (DTE / MH)
4.1. Rol de Intermediación Tecnológica:
LA PLATAFORMA actúa exclusivamente como un canal y puente tecnológico para estructurar, firmar digitalmente y transmitir comprobantes tributarios electrónicos hacia los servidores de la DGII / Ministerio de Hacienda.
4.2. Responsabilidad Exclusiva del Emisor Tributario:
EL TALLER es el único y exclusivo obligado y responsable ante el Ministerio de Hacienda y las autoridades fiscales por:
a) La veracidad, exactitud y legitimidad de los datos fiscales, montos, precios, clasificación tributaria, NIT, NRC y actividades económicas declaradas.
b) La custodia, confidencialidad y validez de sus credenciales criptográficas de emisor DTE (Llave privada, contraseña y API Key proporcionadas por el Ministerio de Hacienda).
c) Las obligaciones de pago de impuestos derivados de sus ventas (IVA, Pago a Cuenta, Renta, Retenciones y Percepciones).
4.3. Exclusión por Caídas del Ente Recaudador o Fallos de Transmisión:
FORBIDDEN SOLUCIONES no se hace responsable por demoras, rechazos, caídas temporales de servidores o fallas originadas directamente en la infraestructura del Ministerio de Hacienda de El Salvador o en proveedores externos de conectividad e internet.

5. DELIMITACIÓN Y RESPONSABILIDAD EN VEHÍCULOS Y RECEPCIÓN
5.1. Recepción y Custodia de Bienes:
La recepción, inspección visual de 21 puntos, hoja de inventario físico y levantamiento de rayones o daños preexistentes en los vehículos automotores constituyen una relación directa y contractual entre EL TALLER y el propietario del automotor.
5.2. Exclusión de Responsabilidad Mecánica:
FORBIDDEN SOLUCIONES no asume responsabilidad alguna por garantías mecánicas, fallas en reparaciones, pérdidas materiales, sustracciones o accidentes ocurridos dentro o fuera de las instalaciones del taller usuario de LA PLATAFORMA.

6. OBLIGACIONES DE PAGO Y DISPONIBILIDAD DEL SERVICIO
6.1. Cuotas de Suscripción / Mantenimiento:
El acceso continuo a LA PLATAFORMA está condicionado al pago puntual de la tarifa pactada (mensual, anual o mantenimiento de licencia vitalicia).
6.2. Suspensión por Mora:
En caso de falta de pago, el acceso a las funciones operativas del software podrá ser suspendido automáticamente previa notificación electrónica. El Taller dispondrá de un período de 30 días calendario para regularizar su cuenta o solicitar la exportación de sus datos históricos.
6.3. No Reembolsos:
Las tarifas canceladas por el uso de la licencia y consumo de infraestructura no son sujetas a reembolso, salvo fallas directas comprobadas atribuibles de manera exclusiva y negligente al PROVEEDOR.

7. SEGURIDAD Y CREDENCIALES DE ACCESO
Cada usuario, mecánico o administrador del taller es responsable de la confidencialidad de su PIN y contraseña. Todas las transacciones, anulaciones, movimientos de caja o emisiones fiscales efectuadas con las credenciales de un usuario se presumirán realizadas por el titular de las mismas.

8. PROPIEDAD INTELECTUAL Y PROHIBICIÓN DE INGENIERÍA INVERSA
Queda estrictamente prohibido al CLIENTE, sus empleados o terceros:
a) Intentar descompilar, realizar ingeniería inversa, copiar, replicar o comercializar el código fuente, la arquitectura o la interfaz gráfica de Mecanic OS.
b) Utilizar LA PLATAFORMA para el desarrollo de un software competidor.
La infracción a esta cláusula dará lugar a las acciones civiles y penales pertinentes ante los tribunales de la República de El Salvador.

9. JURISDICCIÓN Y SOLUCIÓN DE CONTROVERSIAS
Para cualquier divergencia o controversia derivada de la interpretación o ejecución de estos Términos, las partes fijan como domicilio especial la ciudad de San Salvador, sometiéndose expresamente a la jurisdicción de sus tribunales competentes y a la legislación de la República de El Salvador.</div>

                <!-- CONTENEDOR 2: POLITICA DE PRIVACIDAD -->
                <div id="legal-content-privacy" style="display: none; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 10px; padding: 2.25rem 2rem; max-height: 65vh; overflow-y: auto; font-size: 0.88rem; line-height: 1.75; color: var(--text-secondary); font-family: 'Inter', sans-serif; white-space: pre-wrap; text-align: left;">POLÍTICA DE PRIVACIDAD, TRATAMIENTO DE DATOS Y CONFIDENCIALIDAD
MECANIC OS (FORBIDDEN SOLUCIONES S.A. DE C.V.)
Última actualización: 25 de Agosto de 2026

FORBIDDEN SOLUCIONES S.A. DE C.V., en cumplimiento de los principios de confidencialidad comercial, seguridad de la información y la legislación de la República de El Salvador sobre protección de la privacidad, emite la presente Política de Tratamiento de Datos.

1. INFORMACIÓN QUE RECOPILA LA PLATAFORMA
Mecanic OS recopila y procesa exclusivamente los datos necesarios para la adecuada operatividad del taller automotriz y el cumplimiento fiscal, a saber:
a) Datos de Identificación del Taller: Nombre comercial, razón social, NIT, NRC, giro económico, dirección fiscal, teléfono y correo electrónico.
b) Datos de Clientes del Taller: Nombres, números de teléfono, correos, número de DUI/NIT/NRC para facturación y dirección.
c) Datos de Vehículos: Número de placa, marca, modelo, año, kilometraje, VIN/chasis, fotografías de estado físico e historiales mecánicos.
d) Datos Contables y de Nómina: Registros de ventas, presupuestos, egresos, salarios base y comisiones de empleados del taller.

2. FINALIDAD Y USO DE LOS DATOS
La información recopilada se utiliza con los siguientes propósitos exclusivos:
1. Operación Técnica: Permitir la generación de presupuestos, órdenes de trabajo, control de inventario y expedientes de autos.
2. Facturación Electrónica: Transmitir en tiempo real los comprobantes DTE hacia la Dirección General de Impuestos Internos (DGII) de El Salvador.
3. Respaldo y Sincronización en la Nube: Proteger la base de datos del taller contra pérdidas locales mediante replicación cifrada en la nube (Firestore / Google Cloud).
4. Asistencia y Soporte Técnico: Brindar soporte remoto únicamente cuando sea expresamente solicitado por el administrador del taller.

3. ESTRICTA NO COMERCIALIZACIÓN DE DATOS
FORBIDDEN SOLUCIONES S.A. DE C.V. NO VENDE, NO ALQUILA, NO CEDE NI COMERCIALIZA bajo ningún concepto las bases de datos de clientes, vehículos, finanzas o proveedores de los talleres suscritos. Toda la información pertenece en todo momento y de forma inalienable al CLIENTE / TALLER.

4. MEDIDAS DE SEGURIDAD Y CIFRADO
Aplicamos estándares de seguridad de nivel bancario y empresarial para salvaguardar la integridad de los datos:
a) Cifrado de Credenciales DTE: Las contraseñas y llaves de Hacienda son cifradas mediante criptografía AES-256 antes de su almacenamiento.
b) Aislamiento de Base de Datos (Multi-Tenant Seguro): Cada taller opera en un espacio de datos estrictamente aislado y protegido mediante reglas de seguridad criptográficas (ID único de taller).
c) Cifrado en Tránsito: Todas las comunicaciones entre el navegador y la nube se realizan mediante protocolos seguros HTTPS / TLS 1.3 con certificados SSL oficiales.

5. EJERCICIO DE DERECHOS ARCO-POL (ACCESO, RECTIFICACIÓN, CANCELACIÓN Y PORTABILIDAD)
El titular de los datos o el administrador del taller tiene derecho en todo momento a:
● Acceso y Rectificación: Modificar en tiempo real los datos de su perfil, clientes y catálogo de repuestos desde el módulo de Configuración.
● Portabilidad: Exportar su información histórica en formatos estándar abiertos (Excel / JSON).
● Eliminación / Desconexión: Solicitar el borrado definitivo de su cuenta y base de datos una vez concluida su relación de servicio.

6. CONTACTO DEL OFICIAL DE PRIVACIDAD
Para cualquier requerimiento, consulta o ejercicio de derechos sobre datos personales:
● Responsable: Departamento de Seguridad y Privacidad - Forbidden Soluciones S.A. de C.V.
● Correo: privacidad@forbiddensoluciones.com / soporte@forbiddensoluciones.com
● Domicilio: República de El Salvador.</div>

                <!-- FOOTER DE ACCIONES -->
                <div style="margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
                        <i class="fa-solid fa-shield-check" style="color: var(--success);"></i> Plataforma Blindada y Certificada para El Salvador
                    </div>
                    <a href="#landing" class="btn btn-primary" style="padding: 0.65rem 2rem; font-size: 0.9rem; font-weight: 700; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-arrow-left"></i> Volver a Mecanic OS
                    </a>
                </div>

            </div>
        </div>
    `;

    // Toggle de pestañas
    const btnTerms = document.getElementById('legal-tab-terms');
    const btnPrivacy = document.getElementById('legal-tab-privacy');
    const contentTerms = document.getElementById('legal-content-terms');
    const contentPrivacy = document.getElementById('legal-content-privacy');

    if (btnTerms && btnPrivacy && contentTerms && contentPrivacy) {
        btnTerms.addEventListener('click', () => {
            btnTerms.className = 'btn btn-primary';
            btnTerms.style.background = '';
            btnTerms.style.color = '#fff';
            
            btnPrivacy.className = 'btn btn-secondary';
            btnPrivacy.style.background = 'transparent';
            btnPrivacy.style.border = 'none';
            btnPrivacy.style.color = 'var(--text-secondary)';

            contentTerms.style.display = 'block';
            contentPrivacy.style.display = 'none';
        });

        btnPrivacy.addEventListener('click', () => {
            btnPrivacy.className = 'btn btn-primary';
            btnPrivacy.style.background = '';
            btnPrivacy.style.color = '#fff';

            btnTerms.className = 'btn btn-secondary';
            btnTerms.style.background = 'transparent';
            btnTerms.style.border = 'none';
            btnTerms.style.color = 'var(--text-secondary)';

            contentPrivacy.style.display = 'block';
            contentTerms.style.display = 'none';
        });
    }
}
