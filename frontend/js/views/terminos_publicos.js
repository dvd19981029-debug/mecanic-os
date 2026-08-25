/**
 * Mecanic OS - Vista Pública de Términos y Condiciones
 * Archivo independiente para evitar cualquier colisión con el flujo SaaS de registro / activación.
 */

import { html } from '../utils.js?v=69';

export function renderTerminosPublicos(container) {
    container.innerHTML = html`
        <div style="min-height: 100vh; background: var(--bg-base); color: var(--text-primary); padding: 2rem 1rem; overflow-y: auto;">
            <div style="max-width: 900px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 2.5rem 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                
                <!-- HEADER CON BOTON DE REGRESO -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 44px; height: 44px; background: rgba(99, 102, 241, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.3rem;">
                            <i class="fa-solid fa-file-contract"></i>
                        </div>
                        <div>
                            <h1 style="font-family:'Outfit', sans-serif; font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0;">Términos y Condiciones</h1>
                            <span style="color: var(--text-secondary); font-size: 0.8rem;">Mecanic OS • Forbidden Soluciones S.A. de C.V.</span>
                        </div>
                    </div>

                    <a href="#landing" class="btn btn-secondary" style="font-size: 0.85rem; font-weight: 600; padding: 0.5rem 1.2rem; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color);">
                        <i class="fa-solid fa-arrow-left"></i> Volver a la Web
                    </a>
                </div>

                <!-- CONTENEDOR DE TEXTO LEGAL -->
                <div style="background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 10px; padding: 2rem; max-height: 65vh; overflow-y: auto; font-size: 0.88rem; line-height: 1.7; color: var(--text-secondary); font-family: 'Inter', sans-serif; white-space: pre-wrap; text-align: left;">TÉRMINOS Y CONDICIONES DE USO
MECANIC OS
Fecha de Última Actualización: 27 de Octubre de 2025

IMPORTANTE: Lea detenidamente estos Términos y Condiciones de Uso (en adelante, los "Términos") antes de utilizar la plataforma MECANIC OS (en adelante, la "Plataforma"). Estos Términos constituyen un acuerdo legal vinculante entre usted (en adelante, el "Usuario" o "Taller") y Forbidden Soluciones S.A. de C.V. (en adelante, el "Proveedor"), con domicilio legal en El Salvador.

Al acceder o utilizar la Plataforma, usted acepta quedar obligado por estos Términos y por nuestra Política de Privacidad. Si no está de acuerdo con alguna parte de estos Términos, no debe utilizar la Plataforma.

1. DEFINICIONES
● Plataforma o Sistema: Se refiere al software en la nube MECANIC OS operado por el Proveedor para la gestión operativa, administrativa y tributaria de talleres mecánicos.
● Usuario / Taller: Cualquier persona natural o jurídica que contrata, accede o utiliza la Plataforma.
● Contenido del Usuario: Datos de clientes, vehículos, repuestos, órdenes de trabajo, fotografías y comprobantes fiscales que el Taller ingresa al sistema.
● Servicio: Las funcionalidades, operaciones, almacenamiento y transmisión de DTE certificada ante el Ministerio de Hacienda proporcionada a través de la Plataforma.

2. OBJETO DEL SERVICIO
Mecanic OS tiene como finalidad la gestión integral de las operaciones de talleres y centros de servicio automotriz, incluyendo:
1. Catálogo de Clientes y Flota de Vehículos
2. Recepción Digital con Hoja de Ingreso, Inventario y Firma de Cliente en Pantalla
3. Hoja de Diagnóstico Visual e Inspección 21 Puntos por Semáforo
4. Presupuestos y Cotizaciones con cálculo de IVA (13%), Retención (1%) y Percepción (2%)
5. Control Operativo de Trabajos y Tablero Kanban en Tiempo Real
6. Facturación Electrónica DTE (Facturas, Créditos Fiscales, Sujetos Excluidos) con firma digital y transmisión directa a Hacienda
7. Punto de Venta (POS) y Venta Rápida de Mostrador
8. Control de Caja Diaria, Cortes Ciegos y Arqueo
9. Kárdex Automatizado e Inventario de Repuestos
10. Control de Gastos y Compras a Proveedores
11. Planilla Laboral de Ley (ISSS, AFP, Renta ISR) y Liquidación de Comisiones a Mecánicos

3. USO Y ACCESO A LA PLATAFORMA
3.1. Requisitos Legales:
El Usuario declara ser mayor de dieciocho (18) años de edad y tener plena capacidad legal para representar comercialmente al taller.
3.2. Cuentas y Contraseñas:
El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. El Proveedor no será responsable por pérdidas que resulten del mal manejo de contraseñas.
3.3. Uso Aceptable:
El Usuario se compromete a no utilizar la Plataforma para fines ilícitos ni transmitir información falsa ante las autoridades tributarias.

4. PROPIEDAD INTELLECTUAL Y LICENCIA DE USO
4.1. Propiedad del Proveedor:
El diseño, código fuente, interfaz gráfica, arquitectura y base de datos de Mecanic OS pertenecen exclusivamente a Forbidden Soluciones S.A. de C.V.
4.2. Licencia de Uso:
La Plataforma se otorga bajo licencia de uso intransferible y no exclusiva.
4.3. Propiedad de la Información del Taller:
El Taller conserva en todo momento la propiedad exclusiva de sus datos de clientes, vehículos y facturación.

5. FACTURACIÓN ELECTRÓNICA DTE (EL SALVADOR)
El sistema cumple con los lineamientos técnicos de la Dirección General de Impuestos Internos (DGII) del Ministerio de Hacienda de El Salvador. El Taller es el único responsable de la veracidad de los datos fiscales ingresados y de sus credenciales de emisor DTE (llaves criptográficas y contraseñas de Hacienda).

6. CONDICIONES ECONÓMICAS Y PLANES
Los servicios de suscripción o licencias vitalicias se rigen por las tarifas vigentes acordadas al momento de la contratación o activación de la cuenta.

7. PROTECCIÓN DE DATOS Y CONFIDENCIALIDAD
Forbidden Soluciones S.A. de C.V. garantiza la estricta confidencialidad de los datos comerciales y de clientes ingresados por el Taller, aplicando protocolos de cifrado y aislamiento seguro entre talleres.

8. LEY APLICABLE Y JURISDICCIÓN
Estos Términos se rigen e interpretan conforme a las leyes de la República de El Salvador.

9. CONTACTO Y SOPORTE
Para soporte o consultas legales:
● Empresa: Forbidden Soluciones S.A. de C.V.
● Correo: soporte@forbiddensoluciones.com / ventas@forbiddensoluciones.com
● País: El Salvador

FIN DE LOS TÉRMINOS Y CONDICIONES DE USO</div>

                <!-- BOTON INFERIOR -->
                <div style="margin-top: 1.5rem; text-align: center;">
                    <a href="#landing" class="btn btn-primary" style="padding: 0.75rem 2rem; font-size: 0.95rem; font-weight: 700; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-arrow-left"></i> Volver a Mecanic OS
                    </a>
                </div>

            </div>
        </div>
    `;
}
