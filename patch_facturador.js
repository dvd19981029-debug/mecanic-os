const fs = require('fs');
const file = '/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/views/facturador.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `        modal.querySelectorAll('.btn-delete-direct').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm(\`¿Estás seguro de que deseas eliminar permanentemente el presupuesto \${id}? Esta acción no se puede deshacer y borrará también sus detalles.\`)) {
                    const dbNew = getDatabase();
                    dbNew.presupuestos = dbNew.presupuestos.filter(x => x['ID Presupuesto'] !== id);
                    if (dbNew.detalle_productos) {
                        dbNew.detalle_productos = dbNew.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] !== id);
                    }
                    if (dbNew['21 Detalle Presupuesto Producto']) {
                        dbNew['21 Detalle Presupuesto Producto'] = dbNew['21 Detalle Presupuesto Producto'].filter(dp => dp['ID_Presupuesto DPP'] !== id);
                    }
                    if (dbNew.detalle_mano_obra) {
                        dbNew.detalle_mano_obra = dbNew.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] !== id);
                    }
                    if (dbNew['11 Detalle Mano de Obra']) {
                        dbNew['11 Detalle Mano de Obra'] = dbNew['11 Detalle Mano de Obra'].filter(dm => dm['ID_Presupuesto MO'] !== id);
                    }
                    saveDatabase(dbNew);
                    showToast(\`Presupuesto \${id} eliminado permanentemente.\`, "success");
                    renderModalContent();
                }
            });
        });`;

const replacement = `        modal.querySelectorAll('.btn-delete-direct').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm(\`¿Estás seguro de que deseas eliminar permanentemente el presupuesto \${id}?\`)) {
                    const dbNew = getDatabase();
                    let target = dbNew.presupuestos.find(x => x['ID Presupuesto'] === id);
                    if (target) {
                        target.Estado = 'anulado';
                        target.Anulado = true;
                    }
                    dbNew.audit_logs = dbNew.audit_logs || [];
                    const activeUser = typeof getActiveUser === 'function' ? (getActiveUser() || {}) : {};
                    dbNew.audit_logs.push({
                        fecha: new Date().toISOString(),
                        usuario: activeUser.Nombre || activeUser.id || 'Desconocido',
                        documento_id: id,
                        tipo: 'venta',
                        razon: 'Eliminación manual desde Anulados'
                    });
                    saveDatabase(dbNew);
                    showToast(\`Presupuesto \${id} marcado como anulado (soft-delete).\`, "success");
                    renderModalContent();
                }
            });
        });`;

content = content.replace(targetStr, replacement);

// Also we need to add audit log to btn-invalidate-dte
// In function openInvalidateDteModal processing:
content = content.replace(/p\.Estado = 4; \/\/ Anulado\n\s*p\.Anulado = true;\n\s*p\.Fecha_Anulacion = Date\.now\(\);/g, `p.Estado = 4; // Anulado
                    p.Anulado = true;
                    p.Fecha_Anulacion = Date.now();
                    
                    db.audit_logs = db.audit_logs || [];
                    const aUser = typeof getActiveUser === 'function' ? (getActiveUser() || {}) : {};
                    db.audit_logs.push({
                        fecha: new Date().toISOString(),
                        usuario: aUser.Nombre || aUser.id || 'Desconocido',
                        documento_id: p['ID Presupuesto'] || p.ID_Venta_Rapida || dteId,
                        tipo: 'venta',
                        razon: reason + (comment ? ' - ' + comment : '')
                    });`);

// Same for isQuickSale = true branch inside that modal:
content = content.replace(/p\.Estado = "ANULADO";\n\s*p\.Anulado = true;\n\s*p\.Fecha_Anulacion = Date\.now\(\);/g, `p.Estado = "ANULADO";
                    p.Anulado = true;
                    p.Fecha_Anulacion = Date.now();
                    
                    db.audit_logs = db.audit_logs || [];
                    const aUserQS = typeof getActiveUser === 'function' ? (getActiveUser() || {}) : {};
                    db.audit_logs.push({
                        fecha: new Date().toISOString(),
                        usuario: aUserQS.Nombre || aUserQS.id || 'Desconocido',
                        documento_id: p.ID_Venta_Rapida || dteId,
                        tipo: 'venta',
                        razon: reason + (comment ? ' - ' + comment : '')
                    });`);

fs.writeFileSync(file, content);
console.log('patched facturador.js');
