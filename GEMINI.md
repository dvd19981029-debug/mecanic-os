# REGLAS ESTRICTAS DE DESARROLLO (MECANIC OS)

1. **CERO PROACTIVIDAD NO SOLICITADA**: Trabaja ÚNICA Y EXCLUSIVAMENTE en lo que el usuario solicita de forma explícita.
2. **NO AGREGAR ELEMENTOS EXTRA**: No agregues textos, badges, etiquetas visuales, badges de descuento, campos, botones o funcionalidades que el usuario no haya pedido explícitamente.
3. **NO MODIFICAR NADA ADICIONAL**: Limita cualquier edición a las líneas exactas necesarias para cumplir la petición específica del usuario.
4. **PRECISIÓN QUIRÚRGICA**: Respeta el diseño original y las instrucciones directas del usuario al pie de la letra sin asumir requerimientos adicionales.
5. **IDIOMA**: Responde siempre en español, de forma concisa.
6. **SINCRONIZAR PRIMERO**: El usuario trabaja en 3 computadoras. Antes de empezar, haz `git pull origin main`.
7. **GIT**: Los commits van directo a `main` en `dvd19981029-debug/mecanic-os` y se suben (push) cuando el usuario lo pide. Nunca incluyas en un commit archivos que no sean tuyos (ej. `backend/scripts/limpiar_perfil_taller.js`).
8. **CACHE-BUSTER (frontend)**: Al cambiar un módulo JS, sube su `?v=` en el archivo que lo importa, luego `router.js?v=` en `main.js` y `main.js?v=` en `index.html`.
9. **SaaS MULTI-TALLER**: Cada taller es un documento en `workshops/{uid}`. Nunca mezcles ni cruces datos entre talleres.
10. **PRIVACIDAD**: No almacenar imágenes de la tarjeta de circulación ni datos del propietario; el OCR es local y solo extrae datos del vehículo.
11. **SIN COSTO**: Solo soluciones gratuitas (sin plan Blaze ni APIs de pago).
12. **FIREBASE (clave de servicio en `/Users/luis/.gemini/secrets/firebase-service-account.json`, proyecto `gema-661cb`)**: Lectura libre para investigar. Escritura o borrado SOLO si el usuario lo pide explícitamente, indicando taller y colección; antes mostrar qué registros se afectan y, en borrados, guardar copia JSON fuera del repo. Nunca subir la clave a GitHub ni mostrar su contenido.
13. **HONESTIDAD**: Si algo no se pudo probar o verificar, dilo claramente. No afirmes lo que no se comprobó.
14. **APK**: Para generar el APK: `export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`, `npx cap sync android` y `cd android && ./gradlew assembleDebug`; copiar a `~/Desktop/MecanicOS.apk`.
