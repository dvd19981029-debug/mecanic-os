import {
    getDatabase,
    saveDatabase,
    getActiveUser,
    setActiveUser,
    getWorkshopConfig,
    getBudgetGrandTotal,
    getClientPendingBalance,
    generateUUID,
    updateUserUI,
    updateSidebarBrand,
    updateNotifications,
    setSecureDteConfig,
    getSecureDteConfig,
    setupMunicipiosSelect,
    setupOfficialCatalogsSelect,
    getGirosOptionsHtml,
    getValidEconomicActivityCode,
    calculateElSalvadorPeriodPayroll
} from '../../app.js?v=66';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport
} from '../utils.js?v=66';

export function renderKanban(container) {
    const db = getDatabase();
    
    // Columns definition corresponding exactly to budget states (Trigger rebuild 1):
    // 1: Creado/Borrador, 2: Aprobado/Reparación, 5: Trabajos Finalizados, 3: Facturado/Entregado, 4: Anulado
    const columns = [
        { state: 1, title: 'Creado / Diagnóstico', class: 'border-left: 4px solid var(--warning);' },
        { state: 2, title: 'Aprobado / Reparación', class: 'border-left: 4px solid var(--primary);' },
        { state: 5, title: 'Trabajos Finalizados', class: 'border-left: 4px solid #a855f7;' },
        { state: 3, title: 'Facturado / Entregado (30d)', class: 'border-left: 4px solid var(--success);' },
        { state: 4, title: 'Anulado / Rechazado (30d)', class: 'border-left: 4px solid var(--danger);' }
    ];

    container.innerHTML = html`
        <div class="kanban-board">
            ${safe(columns.map(col => {
                const budgetsInCol = db.presupuestos.filter(p => {
                    const st = parseInt(p.Estado || 1);
                    if (st !== col.state) return false;
                    // For active items, show all. For completed/cancelled, show last 30 days
                    if (st === 1 || st === 2 || st === 5) return true;
                    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                    const budgetDate = new Date(p.Fecha).getTime();
                    return budgetDate >= thirtyDaysAgo;
                });

                return `
                    <div class="kanban-column" data-id="${col.state}">
                        <div class="kanban-column-header" style="${col.class}">
                            <h3>${col.title}</h3>
                            <span class="kanban-count">${budgetsInCol.length}</span>
                        </div>
                        <div class="kanban-cards-container" id="kanban-container-col-${col.state}">
                            ${budgetsInCol.map(p => {
                                const stateNum = parseInt(p.Estado || 1);
                                let stateBadge = '<span style="color:var(--warning)">Creado</span>';
                                if (stateNum === 2) stateBadge = '<span style="color:var(--primary)">Aprobado</span>';
                                else if (stateNum === 5) stateBadge = '<span style="color:#a855f7">Finalizado</span>';
                                else if (stateNum === 3) stateBadge = '<span style="color:var(--success)">Facturado</span>';
                                else if (stateNum === 4) stateBadge = '<span style="color:var(--danger)">Anulado</span>';

                                return `
                                    <div class="kanban-card" onclick="window.location.hash='#presupuestos?id=${escapeHtml(p['ID Presupuesto'])}'">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                            <span class="badge-tag badge-primary" style="font-size: 0.7rem;">${escapeHtml(p.Placas || 'P-0000')}</span>
                                            <small style="color: var(--text-muted); font-size: 0.7rem;">${new Date(p.Fecha).toLocaleDateString('es-SV', {day:'2-digit', month:'short'})}</small>
                                        </div>
                                        <h4 class="kanban-card-title">${escapeHtml(p.Nombre)}</h4>
                                        <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3; height: 2.6em; overflow: hidden; text-overflow: ellipsis;">
                                            ${escapeHtml(p.Fallas_Detectadas || 'Sin detalles registrados')}
                                        </p>
                                        <div class="kanban-card-footer">
                                            <span><i class="fa-solid fa-wrench"></i> ${escapeHtml(db.tecnicos.find(t => t.Tecnico_ID === p.Tecnico_Asignado)?.Nombre_Completo.split(' ')[0] || 'Asignar')}</span>
                                            <strong>${stateBadge}</strong>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join(''))}
        </div>
    `;
}

// 6. FACTURADOR DTE VIEW


