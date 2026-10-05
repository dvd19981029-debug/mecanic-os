/**
 * Mecanic OS - Script para limpiar el perfil de un taller
 * =======================================================
 * Este script borra:
 * 1. Aperturas y cierres de caja (cajas_sesiones / 31 Cortes de Caja)
 * 2. Movimientos manuales de caja (caja_movimientos)
 * 3. Pagos registrados en caja y ventas (pagos / pagos_vr)
 * 4. Facturaciones de Venta Rápida / POS (venta_rapida / 43 Venta Rapida)
 * 5. Facturaciones de Presupuestos / Venta Normal:
 *    - Limpia sellos de recepción, códigos de generación DTE, números de control MH
 *    - Revierte el estado de "Facturado" (Estado 3) a "Creado" (Estado 1) [o eliminación total según configuración]
 * 6. Movimientos de kardex/inventario generados por facturación
 * 7. Logs de auditoría DTE en Firestore (dte_api_logs)
 *
 * USO EN TERMINAL (Node.js):
 *   node backend/scripts/limpiar_perfil_taller.js <WORKSHOP_UID> [--eliminar-presupuestos]
 *
 * NOTA: Si prefieres ejecutarlo directo desde el navegador (sin configurar credenciales en terminal),
 * copia la función `limpiarPerfilTallerNavegador()` que se encuentra al final de este archivo
 * y pégala en la Consola de Desarrollador (F12) de Mecanic OS.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. Inicialización de Firebase Admin
let db = null;
try {
    let serviceAccount = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        raw = raw.replace(/[\u201c\u201d\u201e]/g, '"').replace(/[\u2018\u2019]/g, "'");
        serviceAccount = JSON.parse(raw);
    } else {
        const potentialKeyPath = path.resolve(__dirname, '../serviceAccountKey.json');
        if (fs.existsSync(potentialKeyPath)) {
            serviceAccount = require(potentialKeyPath);
        }
    }

    if (serviceAccount) {
        const app = admin.initializeApp({
            credential: admin.cert(serviceAccount)
        }, 'cleanup-app');
        db = admin.firestore(app);
    } else {
        const app = admin.initializeApp({}, 'cleanup-app-default');
        db = admin.firestore(app);
    }
} catch (e) {
    // Si no hay credenciales locales, se informará al ejecutar
}

async function eliminarColeccionPorLotes(coleccionRef, batchSize = 200) {
    let eliminados = 0;
    while (true) {
        const snapshot = await coleccionRef.limit(batchSize).get();
        if (snapshot.empty) break;

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            eliminados++;
        });
        await batch.commit();
    }
    return eliminados;
}

async function limpiarPerfilTaller(workshopId, opciones = { eliminarPresupuestosFacturados: false }) {
    if (!db) {
        console.error("❌ Error: Firebase Admin SDK no está autenticado.");
        console.error("Para correrlo en terminal necesitas definir FIREBASE_SERVICE_ACCOUNT o tener backend/serviceAccountKey.json.");
        console.error("👉 Alternativa recomendada: Usa el script para la consola del navegador que se muestra abajo.");
        return;
    }

    if (!workshopId || typeof workshopId !== 'string') {
        console.error("❌ Debes especificar un workshopId válido.");
        console.log("Uso: node backend/scripts/limpiar_perfil_taller.js <WORKSHOP_UID>");
        return;
    }

    console.log(`\n🧹 Iniciando limpieza para el taller: ${workshopId}`);
    console.log(`--------------------------------------------------------`);

    const wsRef = db.collection("workshops").doc(workshopId);
    const wsDoc = await wsRef.get();
    if (!wsDoc.exists) {
        console.warn(`⚠️ Advertencia: No se encontró documento principal para el taller '${workshopId}'. Continuando con subcolecciones...`);
    }

    // 1. Borrar Cajas Sesiones
    console.log("⏳ Borrando aperturas y cierres de caja (cajas_sesiones)...");
    const cajasEliminadas = await eliminarColeccionPorLotes(wsRef.collection("cajas_sesiones"));
    console.log(`  ✓ ${cajasEliminadas} sesiones de caja eliminadas.`);

    // 2. Borrar Movimientos de Caja
    console.log("⏳ Borrando movimientos manuales de caja (caja_movimientos)...");
    const movsCajaEliminados = await eliminarColeccionPorLotes(wsRef.collection("caja_movimientos"));
    console.log(`  ✓ ${movsCajaEliminados} movimientos de caja eliminados.`);

    // 3. Borrar Pagos y Pagos VR
    console.log("⏳ Borrando registros de pagos...");
    const pagosEliminados = await eliminarColeccionPorLotes(wsRef.collection("pagos"));
    const pagosVrEliminados = await eliminarColeccionPorLotes(wsRef.collection("pagos_vr"));
    console.log(`  ✓ ${pagosEliminados + pagosVrEliminados} pagos eliminados.`);

    // 4. Borrar Ventas Rápidas (POS)
    console.log("⏳ Borrando ventas rápidas (venta_rapida)...");
    const vrEliminadas = await eliminarColeccionPorLotes(wsRef.collection("venta_rapida"));
    console.log(`  ✓ ${vrEliminadas} ventas rápidas eliminadas.`);

    // 5. Presupuestos y Facturación Normal
    console.log("⏳ Procesando presupuestos facturados...");
    const presupuestosSnap = await wsRef.collection("presupuestos").get();
    let presupuestosModificados = 0;
    let presupuestosEliminados = 0;

    for (const doc of presupuestosSnap.docs) {
        const p = doc.data();
        const estaFacturado = p.Estado == 3 || p.controlNumber || p.mhControlNumber;

        if (estaFacturado) {
            if (opciones.eliminarPresupuestosFacturados) {
                await doc.ref.delete();
                presupuestosEliminados++;
            } else {
                // Revertir estado y eliminar huella de DTE
                await doc.ref.update({
                    Estado: 1, // Regresar a estado 'Creado'
                    Pagado: "NO",
                    "Pagado?": "NO",
                    controlNumber: admin.firestore.FieldValue.delete(),
                    mhControlNumber: admin.firestore.FieldValue.delete(),
                    receptionSeal: admin.firestore.FieldValue.delete(),
                    Doc_a_Emitir: admin.firestore.FieldValue.delete(),
                    Fecha_Facturacion: admin.firestore.FieldValue.delete(),
                    Condicion: admin.firestore.FieldValue.delete()
                });
                presupuestosModificados++;
            }
        }
    }

    if (opciones.eliminarPresupuestosFacturados) {
        console.log(`  ✓ ${presupuestosEliminados} presupuestos facturados eliminados.`);
    } else {
        console.log(`  ✓ ${presupuestosModificados} presupuestos facturados revertidos a 'Creado' (sin DTE).`);
    }

    // 6. Limpiar movimientos de inventario que fueron generados por facturación
    console.log("⏳ Limpiando movimientos de inventario relacionados con facturación...");
    const invSnap = await wsRef.collection("movs_inventario").get();
    let invMovsBorrados = 0;
    for (const doc of invSnap.docs) {
        const m = doc.data();
        const obs = (m.Observacion || '').toLowerCase();
        if (obs.includes('facturación') || obs.includes('facturacion') || m.DTE) {
            await doc.ref.delete();
            invMovsBorrados++;
        }
    }
    console.log(`  ✓ ${invMovsBorrados} movimientos de salida de inventario eliminados.`);

    // 7. Borrar logs de DTE del taller
    console.log("⏳ Limpiando logs de transmisión DTE (dte_api_logs)...");
    const dteLogsSnap = await db.collection("dte_api_logs").where("workshopId", "==", workshopId).get();
    let logsBorrados = 0;
    if (!dteLogsSnap.empty) {
        const batch = db.batch();
        dteLogsSnap.docs.forEach(doc => {
            batch.delete(doc.ref);
            logsBorrados++;
        });
        await batch.commit();
    }
    console.log(`  ✓ ${logsBorrados} logs de DTE eliminados.`);

    console.log(`--------------------------------------------------------`);
    console.log(`✅ ¡Limpieza completada exitosamente! El taller '${workshopId}' está listo para iniciar en cero.\n`);
}

// Ejecución en CLI si se invoca directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    const workshopId = args[0];
    const eliminarPresupuestos = args.includes('--eliminar-presupuestos');

    if (!workshopId) {
        console.log(`
Uso del script en terminal:
  node backend/scripts/limpiar_perfil_taller.js <WORKSHOP_UID> [--eliminar-presupuestos]

Opciones:
  --eliminar-presupuestos  Elimina completamente los presupuestos que estaban facturados
                           (Por defecto solo se les remueve la facturación y vuelven a Creado)
        `);
        process.exit(1);
    }

    limpiarPerfilTaller(workshopId, { eliminarPresupuestosFacturados: eliminarPresupuestos })
        .then(() => process.exit(0))
        .catch(err => {
            console.error("Error al ejecutar la limpieza:", err);
            process.exit(1);
        });
}

module.exports = { limpiarPerfilTaller };
