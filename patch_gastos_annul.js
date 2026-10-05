const fs = require('fs');
const file = '/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/views/gastos.js';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `        // 1. Update purchase state and clear balance
        comp.Estado_Pago = 'ANULADA';
        comp.Saldo_Pendiente = 0;`;

const replacement = `        // 1. Update purchase state and clear balance
        comp.Estado_Pago = 'ANULADA';
        comp.Saldo_Pendiente = 0;
        
        db.audit_logs = db.audit_logs || [];
        const activeUser = typeof getActiveUser === 'function' ? (getActiveUser() || {}) : {};
        db.audit_logs.push({
            fecha: new Date().toISOString(),
            usuario: activeUser.Nombre || activeUser.id || 'Desconocido',
            documento_id: purchaseId,
            tipo: 'compra',
            razon: 'Anulación manual de compra'
        });`;

content = content.replace(targetStr, replacement);
fs.writeFileSync(file, content);
console.log('patched gastos_annul.js');
