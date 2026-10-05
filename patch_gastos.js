const fs = require('fs');
const file = '/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/views/gastos.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                            if (confirm(\`¿Está seguro de eliminar este DTE recibido (\${dteNum} - \${emisor}) de la bandeja?\\n\\nEsta acción no se puede deshacer.\`)) {
                                dbFirestore.collection("workshops").doc(workshopUid).collection("dte_recibidos").doc(dteId).delete()
                                    .then(() => {
                                        loadDtes();
                                    })
                                    .catch(err => {
                                        console.error("Error al eliminar DTE:", err);
                                        alert("Error al eliminar el DTE: " + err.message);
                                    });
                            }`;

const replacement = `                            if (confirm(\`¿Está seguro de anular este DTE recibido (\${dteNum} - \${emisor}) de la bandeja?\`)) {
                                dbFirestore.collection("workshops").doc(workshopUid).collection("dte_recibidos").doc(dteId).update({ estado: 'anulado' })
                                    .then(() => {
                                        const db = typeof getDatabase === 'function' ? getDatabase() : null;
                                        if (db) {
                                            db.audit_logs = db.audit_logs || [];
                                            const activeUser = typeof getActiveUser === 'function' ? (getActiveUser() || {}) : {};
                                            db.audit_logs.push({
                                                fecha: new Date().toISOString(),
                                                usuario: activeUser.Nombre || activeUser.id || 'Desconocido',
                                                documento_id: dteId,
                                                tipo: 'compra',
                                                razon: 'Anulación manual DTE recibido'
                                            });
                                            if (typeof saveDatabase === 'function') saveDatabase(db);
                                        }
                                        loadDtes();
                                    })
                                    .catch(err => {
                                        console.error("Error al anular DTE:", err);
                                        alert("Error al anular el DTE: " + err.message);
                                    });
                            }`;

content = content.replace(targetStr, replacement);
fs.writeFileSync(file, content);
console.log('patched gastos.js');
