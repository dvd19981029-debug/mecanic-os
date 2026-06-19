# Mecanic OS - Reporte de Diagnóstico y Estado del Sistema

## 1. Estado Actual (Visión General)
Mecanic OS es un sistema funcional y operativo basado en una arquitectura ligera y descentralizada de Single Page Application (SPA). El enfoque principal es "Offline-first", logrando una aplicación rápida y resiliente a desconexiones, fuertemente acoplada a las normativas de El Salvador (Facturación Electrónica DTE vía FacturaLlama y Pagos recurrentes vía Wompi).

### Fortalezas
*   **Cero Dependencias Externas en Backend:** El backend (`server.js`) está escrito puramente en Node.js utilizando los módulos nativos (`http`, `https`, `fs`, `path`). Esto significa que no hay dependencias en `node_modules` (ni siquiera Express, aunque la documentación lo mencionara genéricamente, el código fuente muestra un servidor HTTP crudo). Esto reduce la superficie de ataque a cero vulnerabilidades de paquetes de terceros (zero CVEs).
*   **Offline-First & Auto-Healing:** La capa de abstracción de datos (`dataService.js`) es muy robusta. Si las colecciones no existen o están corruptas, el sistema se "cura" a sí mismo (Self-healing database check) inyectando la estructura esperada en `localStorage`.
*   **Sincronización Transparente:** La integración con Firebase (v10 compat) para la sincronización de las bases de datos de `localStorage` hacia Firestore ocurre de forma bidireccional y transparente, lo cual es ideal para redes intermitentes en talleres.
*   **Modo de Simulación (Mocks):** Excelente soporte para desarrollo y pruebas. El backend intercepta llamadas a Wompi y FacturaLlama usando credenciales como `test_sk_...` o `simulado_` y devuelve respuestas generadas localmente (Mocks), previniendo cargos reales durante las pruebas.

## 2. Deuda Técnica (Technical Debt)
*   **Código Monolítico en el Frontend:** El archivo `/frontend/app.js` es un monolito extremo de más de 12,000 líneas de código. Contiene routing, lógica de UI, generación de PDFs, llamadas a API y componentes. Esto dificulta significativamente el mantenimiento, el trabajo en equipo y los pull requests, aumentando la probabilidad de conflictos.
*   **Acoplamiento de Vista y Lógica:** Al usar Vanilla JS puro con manipulación directa del DOM (`innerHTML`, `document.getElementById`), la lógica de negocio está fuertemente acoplada a la vista.
*   **Falta de Framework de Testing:** Actualmente el sistema solo posee un "Sanity Check" en `test-app.js` que simula un entorno de navegador para evaluar si `app.js` compila y se ejecuta sin errores de sintaxis o de nivel superior. No existen pruebas unitarias (Jest, Mocha) ni pruebas E2E (Cypress, Playwright) para las funciones de cálculo de facturación, carritos o integración.
*   **Credenciales quemadas (Hardcoded Default Keys):** En `app.js` y `dataService.js` existe la llave `test_sk_mecanicos_default_sandbox_key_998877` hardcodeada. Aunque es una llave de prueba, esta práctica puede derivar en subir llaves de producción por error.

## 3. Riesgos de Seguridad
*   **Exposición Lógica de Negocio:** Al ser una SPA sin ofuscación o minificación severa (los archivos `.js` están crudos en `public/`), toda la lógica de cálculo, márgenes de ganancia y estructura de la base de datos es visible para el cliente.
*   **Falta de Validación Estricta en el Backend:** El archivo `server.js` actúa como un proxy pasivo para las APIs. No parece haber validación estricta de JSON schemas sobre los payloads que el frontend envía antes de redirigirlos a FacturaLlama, confiando ciegamente en que el frontend enviará datos correctos.

## 4. Recomendaciones Arquitectónicas a Corto/Mediano Plazo

1.  **Refactorización (Split) de `app.js`**:
    *   Urgente: Dividir `app.js` utilizando ES6 Modules (`import/export`). Separar en carpetas como `/router`, `/components`, `/views` (dashboard, facturador, pos), `/utils` y `/api`.
2.  **Implementación de Bundler**:
    *   Integrar Vite o Webpack para minificar, ofuscar y empaquetar los archivos de frontend para producción, optimizando los tiempos de carga y protegiendo el código.
3.  **Implementación de Testing**:
    *   Agregar `jest` para testear las funciones matemáticas (cálculo de IVA, subtotales, totales de DTE).
4.  **Uso de Variables de Entorno en Frontend**:
    *   Remover cualquier string o configuración (Firebase config, API keys de prueba) del código estático y pasarlos a variables de entorno inyectadas durante el build.
5.  **Validación de Esquemas (Backend)**:
    *   Implementar validaciones básicas (por ejemplo, con `zod` o comprobaciones manuales en Node) en `server.js` antes de hacer el *proxying* de la data.