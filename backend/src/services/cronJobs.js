const cron = require('node-cron');
const { db } = require('../config/firebaseAdmin');

async function checkWompiSubscriptions() {
    console.log("==================================================");
    console.log(`[CRON] Iniciando verificación de cuotas Wompi: ${new Date().toISOString()}`);
    console.log("==================================================");

    if (!db) {
        console.error("[CRON] Firebase DB no está inicializada. Abortando.");
        return;
    }

    try {
        const configSnap = await db.collection("saas_config").doc("global").get();
        let wompiConfig = {};
        if (configSnap.exists) {
            wompiConfig = configSnap.data().wompi || {};
        }
        
        const clientId = wompiConfig.clientId || process.env.WOMPI_CLIENT_ID;
        const clientSecret = wompiConfig.clientSecret || process.env.WOMPI_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.warn("[CRON] Faltan credenciales globales de Wompi. Abortando verificación de cuotas.");
            return;
        }

        // 1. Obtener Token de Wompi
        const fetch = (await import('node-fetch')).default;
        
        const tokenBody = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience: 'wompi_api'
        }).toString();

        const tokenRes = await fetch('https://id.wompi.sv/connect/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenBody
        });

        if (!tokenRes.ok) {
            console.error("[CRON] Falló la autenticación con Wompi:", await tokenRes.text());
            return;
        }

        const { access_token } = await tokenRes.json();

        // 2. Traer todos los talleres activos
        const reqSnap = await db.collection("saas_requests").where("status", "in", ["aprobado", "active", "approved_terms_pending"]).get();
        
        const now = Date.now();
        let checkedCount = 0;
        let renewedCount = 0;
        let suspendedCount = 0;

        for (const doc of reqSnap.docs) {
            const workshop = doc.data();
            const proximoPago = workshop.proximo_pago || 0;
            
// CASO 1: Taller CON enlace de Wompi (Cobro Automático)
            if (workshop.idEnlace && workshop.suscripcion_status === 'activo' && proximoPago > 0 && proximoPago <= now) {
                checkedCount++;
                console.log(`[CRON] Revisando Wompi para taller: ${workshop.nombre} (ID: ${workshop.id})`);

                const subRes = await fetch(`https://api.wompi.sv/EnlacePagoRecurrente/${workshop.idEnlace}/suscripciones`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${access_token}` }
                });

                if (subRes.ok) {
                    const list = await subRes.json();
                    const isStillSubscribed = Array.isArray(list) && list.length > 0;
                    
                    if (isStillSubscribed) {
                        const newProximoPago = now + (30 * 24 * 60 * 60 * 1000);
                        await db.collection("saas_requests").doc(workshop.id).update({ proximo_pago: newProximoPago });

                        const newPayment = {
                            id: 'PAY-CRON-' + Date.now().toString().slice(-4),
                            workshopId: workshop.id,
                            workshopName: workshop.nombre,
                            plan: workshop.plan || 'Plan Pro',
                            monto: workshop.precio_mensual || 75.00,
                            fecha: now,
                            metodo: 'Suscripción Recurrente Automática (Wompi)',
                            estado: 'completado',
                            wompiEnlaceId: workshop.idEnlace
                        };

                        try {
                            const admin = require('firebase-admin');
                            await db.collection("workshops").doc(workshop.id).update({
                                saas_payments: admin.firestore.FieldValue.arrayUnion(newPayment)
                            });
                        } catch (e) {}
                        
                        renewedCount++;
                    } else {
                        await db.collection("saas_requests").doc(workshop.id).update({ suscripcion_status: 'suspendido' });
                        try {
                            await db.collection("workshops").doc(workshop.id).update({ "saas_state.status": "suspendido" });
                        } catch (e) {}
                        suspendedCount++;
                    }
                }
            } 
            // CASO 2: Taller SIN enlace de Wompi (Pago Manual/Efectivo/Transferencia)
            else if (!workshop.idEnlace && proximoPago > 0 && proximoPago <= now && workshop.suscripcion_status === 'activo') {
                checkedCount++;
                console.log(`[CRON] Vencimiento Manual detectado para: ${workshop.nombre} (ID: ${workshop.id})`);
                
                await db.collection("saas_requests").doc(workshop.id).update({ suscripcion_status: 'suspendido' });
                try {
                    await db.collection("workshops").doc(workshop.id).update({ "saas_state.status": "suspendido" });
                } catch (e) {}
                
                suspendedCount++;
                console.log(`  -> SUSPENDIDO: Plazo manual vencido.`);
            }
            
            // Bypass the old logic block inside the loop by replacing it completely
        }

        console.log(`[CRON] Resumen: ${checkedCount} talleres revisados | ${renewedCount} renovados | ${suspendedCount} suspendidos.`);
        
    } catch (error) {
        console.error("[CRON] Error crítico durante la verificación:", error);
    }
}

// Inicializar el Cron (Corre todos los días a las 2:00 AM)
function initCronJobs() {
    cron.schedule('0 2 * * *', () => {
        checkWompiSubscriptions();
    });
    console.log("⚙️ Cron Jobs inicializados (Verificación de Wompi programada a las 2:00 AM)");
}

module.exports = { initCronJobs, checkWompiSubscriptions };
