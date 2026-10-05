import re

with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/views/saas.js', 'r') as f:
    content = f.read()

old_code = """                    dataService.saas.deleteRequest(id)
                        .then(() => {
                            showToast("Solicitud eliminada exitosamente", "success");
                            if (typeof dbFirestore === 'undefined' || !dbFirestore) {
                                renderAdminSolicitudes(container);
                            }
                        })"""

new_code = """                    dataService.saas.deleteRequest(id)
                        .then(() => {
                            showToast("Solicitud eliminada exitosamente", "success");
                            // Forzar que la fila desaparezca visualmente de inmediato
                            const row = btn.closest('tr');
                            if (row) row.remove();
                            
                            // Forzar re-render si no hay dbFirestore
                            if (typeof dbFirestore === 'undefined' || !dbFirestore) {
                                renderAdminSolicitudes(container);
                            }
                        })"""

content = content.replace(old_code, new_code)

with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/views/saas.js', 'w') as f:
    f.write(content)
print("Fix applied")
