# Mecanic OS - Documentación Técnica

## Visión General del Sistema (System Overview)
**Mecanic OS** es un Sistema Premium de Gestión de Talleres Mecánicos y Facturación Electrónica para El Salvador. Está diseñado bajo una arquitectura "multi-tenant" (SaaS) donde la información de cada taller está aislada, permitiendo gestionar clientes, vehículos, presupuestos, inventario, ventas rápidas, gastos, y nómina.

Además, el sistema está fuertemente integrado con las normativas fiscales de El Salvador, ofreciendo un **Facturador DTE** que se comunica de forma directa con la API de FacturaLlama para emitir Documentos Tributarios Electrónicos (DTE) válidos ante el Ministerio de Hacienda (MH).

## Arquitectura (Architecture)

La aplicación es una Single Page Application (SPA) construida principalmente con **Vanilla JavaScript** en el frontend, soportada por un backend en **Node.js con Express** que actúa como servidor estático y proxy de APIs, y un sistema de almacenamiento y sincronización híbrido:
- **Almacenamiento Local (LocalStorage)**: Funciona como base de datos local y permite el funcionamiento offline.
- **Firebase Firestore**: Proporciona sincronización en tiempo real a la nube (Cloud Sync) para ambientes de red y multi-dispositivo (Dueño y Empleados).

### Frontend
- **Ubicación:** Carpeta `/frontend/` y `/public/`
- **Componentes:**
  - `app.js`: Motor principal de la aplicación. Maneja el routing (basado en hash de la URL), la renderización de las vistas (DOM manipulation native), la lógica de negocio y las integraciones con pasarelas (Wompi, FacturaLlama DTE).
  - `dataService.js`: Capa de abstracción de datos. Maneja el caché en memoria, la persistencia en `localStorage`, la sincronización multi-tenant con Firebase Firestore y la lógica de subcolecciones granulares (por ejemplo, clientes, vehículos, productos, presupuestos).
  - `index.html`: Plantilla base de la SPA. Define la estructura principal y enlaza los scripts y estilos.
  - `index.css`: Estilos de la aplicación.
  - `data/`: Base de datos estática incrustada inicial (`.json`) para seeding u operaciones predeterminadas.

### Backend (Node.js Proxy & Static Server)
- **Ubicación:** Carpeta `/backend/server.js`
- **Funcionalidades:**
  1. **Servidor Estático**: Sirve los archivos del Frontend (`index.html`, `.js`, `.css`, etc.).
  2. **API Proxy para FacturaLlama**: Intermedia las solicitudes hacia `api.facturallama.com` para emitir DTEs y validar la conexión (`/api/dte/test-connection`, `/api/dte`), evitando problemas de CORS en los navegadores y protegiendo las API Keys en caso de ser necesario, aunque el diseño admite configuración en frontend.
  3. **API Proxy para Wompi**: Intermedia la creación y verificación de enlaces de pagos recurrentes (`/api/wompi/create-link`, `/api/wompi/check-subscription`, etc.) mediante OAuth (client_credentials) hacia `api.wompi.sv`.
  4. **Log Logger**: Captura errores remotos reportados desde el navegador (`/api/log-error`).

### Sincronización y Persistencia de Datos
Mecanic OS utiliza una estrategia "offline-first".
1. Todo cambio se guarda en caché y `localStorage` (`mecanic_os_db`).
2. Si el usuario está autenticado y conectado, `dataService.js` propaga los cambios a **Firebase Firestore**. Cada taller es un Documento Raíz (`workshops/{uid}`), y dentro de este, cada entidad (clientes, vehiculos, presupuestos) es una Subcolección.
3. El frontend utiliza `onSnapshot` para escuchar cambios remotos y actualizar la UI y la base de datos local automáticamente.

## Módulos Principales (Core Modules)

1. **Panel Taller (Dashboard)**: Resumen general de las operaciones, finanzas, presupuestos activos e información de DTE emitidos.
2. **Clientes y Autos**: Gestión de la base de clientes y los vehículos registrados para cada uno.
3. **Revisión 21 Puntos**: Módulo para la inspección digital detallada de los vehículos al ingresar al taller.
4. **Presupuestos y Órdenes**: Creación, edición y seguimiento del estado de los presupuestos de reparación.
5. **Kanban de Taller**: Tablero visual para el control de flujo de trabajo de los vehículos (Recepción, En Proceso, Listo, Entregado).
6. **Facturador DTE**: Módulo crítico. Permite generar Facturas de Consumidor Final y Comprobantes de Crédito Fiscal en formato DTE (El Salvador), con envíos al Ministerio de Hacienda, previsualización de impresión y simulación offline.
7. **Punto de Venta (POS) & Venta Rápida**: Interfaz para ventas de repuestos y servicios sin necesidad de abrir una orden de taller.
8. **Cuentas por Cobrar**: Seguimiento de pagos parciales (abonos) y créditos de clientes.
9. **Inventario & Kárdex**: Control de existencias de repuestos, productos, mano de obra y movimientos de inventario (entradas y salidas).
10. **Gastos del Taller**: Registro de egresos operativos.
11. **Planilla y Salarios**: Gestión de pagos y comisiones a los técnicos y empleados.
12. **Configuración y Nube**: Ajustes de parámetros del taller, formatos de impresión, planes de suscripción SaaS, integración con Wompi y FacturaLlama, y sincronización de base de datos multi-dispositivo.

## Integraciones Externas (Integrations)

### FacturaLlama (DTE El Salvador)
Mecanic OS se integra con FacturaLlama para la emisión de DTEs de acuerdo a las regulaciones del Ministerio de Hacienda de El Salvador.
- **Funcionamiento**: El taller configura su `API Key` en los ajustes. Cuando se emite un DTE, el payload JSON de la factura/CCF se genera en el frontend y se envía a FacturaLlama (ya sea directamente o a través del backend proxy `/api/dte`).
- **Modo Simulación**: Si la `API Key` comienza con `simulado_` o el servidor está en modo pruebas, el backend genera una respuesta MOCK que simula el sello de recepción del MH.

### Pasarela Wompi El Salvador (Suscripciones SaaS)
Mecanic OS ofrece planes SaaS y se cobra a los dueños de taller mediante Wompi.
- **Funcionamiento**: Generación de Enlaces de Pago Recurrentes. El backend autentica con `Client ID` y `Client Secret` en el endpoint OAuth de Wompi, recupera el `idAplicativo` y crea la suscripción mensual.
- **Modo Simulación**: Si el servidor detecta credenciales de test (`test_` o `simulado_`), genera enlaces MOCK y URLs locales para simular el proceso de pago.

## Instrucciones para Ejecutar la Aplicación (Running the App)

1. **Requisitos Previos**: Node.js instalado en el entorno.
2. **Dependencias**: El proyecto utiliza dependencias mínimas (librerías core de Node).
3. **Ejecutar el Servidor de Desarrollo**:
   ```bash
   cd backend
   node server.js
   ```
   *El servidor iniciará en el puerto 3005 (o el puerto configurado en el entorno).*
4. **Acceder a la Aplicación**:
   Abre un navegador web y dirígete a `http://localhost:3005`
5. **Ejecutar Tests de Sanidad (Sanity Checks)**:
   ```bash
   node test-app.js
   ```
   *Este script verifica errores de sintaxis y evaluación en el código fuente principal del frontend (app.js).*
