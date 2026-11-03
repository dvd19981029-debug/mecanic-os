# REGLAS DE PROYECTO (MECANIC OS)

1. **GIT**: Los commits van directo a `main` en `dvd19981029-debug/mecanic-os` y se suben (push) al terminar. Nunca incluyas archivos ajenos (ej. `backend/scripts/limpiar_perfil_taller.js`).
2. **CACHE-BUSTER (frontend)**: Al cambiar un módulo JS, sube su `?v=` en el archivo que lo importa, luego `router.js?v=` en `main.js` y `main.js?v=` en `index.html`.
3. **SaaS MULTI-TALLER**: Cada taller es un documento en `workshops/{uid}`. Nunca mezcles ni cruces datos entre talleres.
4. **PRIVACIDAD**: No guardar imágenes de la tarjeta de circulación ni datos del propietario; el OCR es local y solo extrae datos del vehículo.
5. **APK**: Para generar el APK: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`, `npx cap sync android` y `cd android && ./gradlew assembleDebug`; copiar a `~/Desktop/MecanicOS.apk`.

## Firebase (proyecto `gema-661cb`, llave en `~/.gemini/secrets/firebase-service-account.json`)
- **LECTURA**: libre para investigar y auditar.
- **ESCRITURA O BORRADO**: SOLO si el usuario lo pide de forma explícita, indicando taller y colección. Antes de escribir: muestra qué registros se afectarán (modo simulación) y guarda una copia JSON de los documentos afectados en `~/.gemini/antigravity/scratch/backups-firestore/` (fuera del repo). Después de escribir: verifica leyendo de nuevo y reporta el resultado.
- Nunca imprimas, copies ni subas a GitHub el contenido de la llave.
- Si tocas el documento de un presupuesto/venta, ten en cuenta que cambia su fecha de última modificación.
- Los logs de emisión de DTE (colección `dte_api_logs`) son la fuente de verdad de lo enviado a Hacienda.
