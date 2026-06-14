# Propuesta de Mejora: Arquitectura de Base de Datos para Mecanic OS

Con base en el análisis previo del proyecto, el uso intensivo de `localStorage` y la sincronización mediante un único documento JSON grande en Firestore representan riesgos para la escalabilidad, la concurrencia y el rendimiento a medida que el sistema crezca.

Esta propuesta detalla dos alternativas principales de refactorización y una estrategia recomendada para implementar las mejoras, priorizando la estabilidad y el esfuerzo de desarrollo.

---

## El Problema Actual

1. **Cuello de Botella en el Navegador (`localStorage`):**
   - Límite de tamaño estricto (generalmente 5MB).
   - Operaciones síncronas que bloquean el hilo principal de la UI (cada lectura/escritura requiere `JSON.parse` o `JSON.stringify` de todo el objeto).
2. **Conflictos en la Nube (Firestore):**
   - Actualmente, Firebase sobrescribe toda la base de datos de un taller enviando el objeto JSON completo. Si dos usuarios (ej. un administrador en caja y un mecánico en el taller) guardan un cambio al mismo tiempo, el último en guardar sobrescribe los cambios del primero.
   - Carga de red ineficiente al sincronizar miles de registros para actualizar solo un valor.

---

## Opción 1: Migración a IndexedDB Local (Recomendada como primera fase)

Sustituir el uso de `localStorage` por **IndexedDB**, la base de datos estándar moderna de los navegadores, utilizando una librería envolvedora (wrapper) como **Dexie.js** o **localForage**.

### Implementación (Ejemplo con Dexie.js)
1. Reemplazar la función `initDatabase()` para inicializar Dexie con esquemas y tablas separadas (`clientes`, `vehiculos`, `presupuestos`, etc.).
2. Modificar las operaciones de lectura/escritura en `app.js` (ej. `getDatabase()` y `saveDatabase()`) para utilizar métodos asíncronos (`async/await`) de Dexie (ej. `db.clientes.add()`, `db.presupuestos.toArray()`).

### Ventajas (Pros)
- **Capacidad de almacenamiento masiva:** No tiene el límite de 5MB, soporta GBs de información local.
- **Rendimiento:** Las operaciones son asíncronas y no bloquean la UI del usuario.
- **Transiciones más fáciles:** Es un puente intermedio ideal si el objetivo es mantener una experiencia puramente "Offline-First".

### Desventajas (Contras)
- **Refactorización masiva:** Requiere reescribir gran parte de la lógica de datos actual en `app.js` para soportar promesas (`await`).
- **No resuelve el problema de concurrencia en la nube:** Seguiríamos teniendo retos si decidimos seguir subiendo toda la base local hacia Firebase de golpe.

### Esfuerzo Estimado:
Medio-Alto (1 a 2 semanas de trabajo).

---

## Opción 2: Migración Total a Colecciones Nativas de Firestore (Cloud-First)

En lugar de tener una base local que se sincroniza "a la fuerza" hacia la nube, la propuesta es hacer que el sistema lea y escriba directamente contra colecciones de Google Firebase (Firestore).

### Implementación
1. Estructurar la base de datos de Firestore en colecciones y subcolecciones:
   - `workshops/{workshopId}/clientes/{clienteId}`
   - `workshops/{workshopId}/vehiculos/{vehiculoId}`
   - `workshops/{workshopId}/presupuestos/{presupuestoId}`
2. Reemplazar todo el uso local por escuchadores en tiempo real (`onSnapshot()`) o consultas directas (`get()`, `set()`, `update()`) hacia la nube.
3. Habilitar la persistencia offline nativa del SDK de Firebase para que el sistema siga funcionando sin internet temporalmente.

### Ventajas (Pros)
- **Concurrencia real:** Múltiples técnicos y administradores pueden usar la aplicación al mismo tiempo sin sobrescribir los datos del otro.
- **Rendimiento de red:** Solo se descargan y suben los documentos que cambian.
- **Escalabilidad corporativa:** Preparado para millones de registros sin afectar el navegador del cliente.

### Desventajas (Contras)
- **Dependencia de la Nube:** Aunque Firestore soporta modo offline, la fuente de la verdad pasa a ser internet.
- **Refactorización de UI:** Algunos listados y tablas que asumen datos síncronos deberán soportar estados de "Cargando...".
- **Costos:** Al migrar a colecciones nativas de Firestore, el número de lecturas/escrituras en Google Cloud aumentará (se cobra por operación), aunque para un SaaS típico esto es manejable y traspasable al cliente final en su cuota.

### Esfuerzo Estimado:
Alto (2 a 4 semanas de trabajo).

---

## Estrategia de Implementación Recomendada

Recomendamos el siguiente **plan de acción por fases** para no romper el sistema actual:

### FASE 1: Aislamiento (Capa de Abstracción de Datos)
1. Identificar en `app.js` todos los lugares que llaman a `getDatabase()` y `saveDatabase()` o acceden al objeto global `db`.
2. Crear un archivo `dataService.js` con funciones de operaciones CRUD (ej. `createClient()`, `getBudgets()`, `updateVehicle()`).
3. Reescribir el frontend para usar estas funciones, aún si internamente siguen usando `localStorage`.

### FASE 2: Migración Cloud-First (Opción 2 con Firebase)
Dado que el proyecto tiene un enfoque de SaaS y multi-tenancy (se gestionan cuotas, planes y accesos), la **Opción 2 (Colecciones de Firestore)** es la única que garantizará la estabilidad a largo plazo.

1. Implementar la persistencia offline del SDK de Firebase (`firebase.firestore().enablePersistence()`).
2. Conectar las funciones creadas en la Fase 1 directamente a las colecciones de Firestore.
3. Eliminar el uso de `mecanic_os_db` del `localStorage`.

### FASE 3: Migración de Datos Existentes
Crear un script temporal para los clientes en producción que mueva sus datos JSON desde el `localStorage` de su computadora hacia las nuevas colecciones de Firestore en la nube cuando inicien sesión por primera vez tras la actualización.

## Siguientes Pasos
Por favor revisa esta propuesta y determina con cuál alternativa deseas continuar. Si estás de acuerdo con la estrategia recomendada, el primer paso práctico será crear la **Capa de Abstracción de Datos (Fase 1)**.
