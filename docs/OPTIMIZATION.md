# Mecanic OS - Plan de Optimización de Rendimiento

Este documento detalla las estrategias para optimizar la eficiencia y rendimiento del código de Mecanic OS (principalmente en `frontend/app.js`), sin sacrificar ninguna funcionalidad existente y manteniendo la arquitectura Vanilla JS / Offline-First.

## 1. Optimización del Rendering (DOM Manipulation)

Actualmente, el sistema depende masivamente de la concatenación de strings y la inyección mediante `innerHTML`. En un archivo de +12,000 líneas, esto genera "Reflows" y "Repaints" muy costosos en el navegador, especialmente cuando las bases de datos (clientes, inventario) crecen.

### Mejoras propuestas:
*   **Implementar `DocumentFragment`**: En lugar de hacer múltiples `.innerHTML += ...` dentro de bucles (`.map` / `.forEach`), se debe crear un `document.createDocumentFragment()`, construir el sub-árbol del DOM en memoria e inyectarlo al DOM real **una sola vez**.
*   **Evitar recrear vistas enteras**: Al recibir un cambio de Firestore, `smartRefreshView()` (línea 176) actualmente re-renderiza toda la vista. Se deben implementar actualizaciones granulares: identificar qué ID cambió en la tabla y actualizar solo esa fila (`<tr>`), en vez de destruir y recrear todo el HTML de la tabla.

## 2. Optimización de Manejo de Eventos (Event Listeners)

Una búsqueda en el código revela casi 200 llamadas a `addEventListener`. Muchas de estas parecen estar atadas a botones dentro de listas renderizadas dinámicamente.

### Mejoras propuestas:
*   **Event Delegation (Delegación de Eventos)**: En lugar de asignar un `addEventListener` a cada botón de "Editar", "Borrar" o "Facturar" en las tablas de clientes o presupuestos, se debe asignar **un solo** event listener al contenedor padre (`<tbody>` o al div principal de la vista).
    *   *Beneficio*: Reduce drásticamente el consumo de memoria y previene *memory leaks* (fugas de memoria) causados al destruir elementos con `.innerHTML` que aún tienen listeners adheridos.

## 3. Optimización de Listas y Tablas (Data Rendering)

Actualmente, funciones como `renderPresupuestos`, `renderClientesVehiculos` o `renderInventario` iteran e intentan renderizar toda la colección contenida en `getDatabase()`.

### Mejoras propuestas:
*   **Paginación Virtual (Virtual Scrolling) o Paginación Clásica**: Si un taller tiene 5,000 presupuestos, inyectar 5,000 nodos HTML a la vez congelará la pestaña. Se debe implementar paginación (ej. mostrar de a 50) o carga diferida ("Cargar más").
*   **Caché Estructural**: Las tablas de reportes (Dashboard BI) realizan cálculos complejos (sumas de DTE, promedios) en cada render. Estos cálculos deberían ejecutarse asíncronamente en Background o guardarse en caché (memoization), recalculándose solo cuando la colección subyacente cambie.

## 4. Refactorización Estructural (Code Splitting)

La optimización más crítica no es matemática, sino arquitectónica. El motor de JavaScript del navegador tarda considerablemente en parsear y compilar en memoria un archivo monolítico de casi 700 KB (`app.js`).

### Mejoras propuestas:
*   **Módulos ES6 (ESM)**: Dividir `app.js`.
    *   `/frontend/core/router.js` (Manejo de hash y navegación).
    *   `/frontend/views/...` (Un archivo `.js` por cada función `render...`).
    *   `/frontend/utils/dom.js` (Helpers para crear elementos y delegar eventos).
*   *Beneficio Funcional*: El tiempo de carga interactiva (TTI - Time to Interactive) del navegador mejorará al poder procesar archivos más pequeños en paralelo, y el trabajo en equipo será manejable sin conflictos de Git masivos.

## 5. Carga de Imágenes y Assets

*   Si los logos de talleres o fotos de vehículos se cargan en listas, implementar `loading="lazy"` en las etiquetas `<img>` para diferir la carga de imágenes fuera del viewport inicial.

## 6. Debouncing y Throttling

*   Se detectó que `smartRefreshView` tiene un debounce básico (línea 178), lo cual es bueno. Sin embargo, hay barras de búsqueda (ej. `id="budget-search"`) que filtran el DOM o los arrays. Se debe aplicar un debounce estricto (ej. 300ms) a las funciones de búsqueda en vivo (`keyup` / `input`) para evitar ejecutar el bucle de filtrado con cada letra presionada por el usuario.