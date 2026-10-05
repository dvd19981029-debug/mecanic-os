const fs = require('fs');
const file = '/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/views/venta_rapida.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `        document.querySelectorAll('.btn-eliminar-pos').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm(\`¿Estás seguro de que deseas eliminar permanentemente la Venta Rápida \${id}?\`)) {
                    const filtered = (db['43 Venta Rapida'] || db.venta_rapida || []).filter(vr => vr.ID_Venta_Rapida !== id);
                    db['43 Venta Rapida'] = filtered;
                    db.venta_rapida = filtered;
                    saveDatabase(db);
                    showToast("Venta rápida eliminada.", "success");
                    populatePendingList();
                    populateHistoryList();
                }
            });
        });`;

const replacement = `        document.querySelectorAll('.btn-eliminar-pos').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm(\`¿Estás seguro de que deseas eliminar la Venta Rápida \${id}?\`)) {
                    let target = (db['43 Venta Rapida'] || db.venta_rapida || []).find(vr => vr.ID_Venta_Rapida === id);
                    if (target) {
                        target.Estado = 'anulado';
                        target.Anulado = true;
                    }
                    db.audit_logs = db.audit_logs || [];
                    const activeUser = typeof getActiveUser === 'function' ? (getActiveUser() || {}) : {};
                    db.audit_logs.push({
                        fecha: new Date().toISOString(),
                        usuario: activeUser.Nombre || activeUser.id || 'Desconocido',
                        documento_id: id,
                        tipo: 'venta',
                        razon: 'Eliminación manual de venta rápida'
                    });
                    saveDatabase(db);
                    showToast("Venta rápida marcada como anulada (soft-delete).", "success");
                    populatePendingList();
                    populateHistoryList();
                }
            });
        });`;

content = content.replace(targetStr, replacement);
fs.writeFileSync(file, content);
console.log('patched venta_rapida.js');
