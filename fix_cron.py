import re

with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/backend/src/services/cronJobs.js', 'r') as f:
    content = f.read()

target = """            // Si el taller tiene Wompi vinculado y su fecha de pago ya se venció
            if (workshop.idEnlace && workshop.suscripcion_status === 'activo' && proximoPago <= now) {"""

new_code = """            // CASO 1: Taller CON enlace de Wompi (Cobro Automático)
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
"""

# To safely replace the inside of the loop, I'll use a regex
loop_regex = re.compile(r"            // Si el taller tiene Wompi vinculado.*?(?=\n        }\n\n        console\.log)", re.DOTALL)
content = loop_regex.sub(new_code.strip(), content)

with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/backend/src/services/cronJobs.js', 'w') as f:
    f.write(content)
print("cronJobs updated")
