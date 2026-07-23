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
} from '../../app.js?v=69';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport,
    makeSelectSearchable
} from '../utils.js?v=80';

export function renderPresupuestos(container, queryParams) {
    const db = getDatabase();
    
    // If action=new, load editor in creation mode
    if (queryParams.action === 'new') {
        renderBudgetEditor(container, null);
        return;
    }
    
    // If we have an ID, load that budget editor in edit mode
    if (queryParams.id) {
        const budget = db.presupuestos.find(p => p['ID Presupuesto'] === queryParams.id);
        if (!budget) {
            container.innerHTML = html`<div class="glass-card" style="text-align: center; padding: 2rem;"><h2>Presupuesto no encontrado</h2></div>`;
            return;
        }
        renderBudgetEditor(container, budget);
        return;
    }

    // Otherwise, show list of budgets
    container.innerHTML = html`
        <div class="glass-card" style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div class="search-bar-container" style="max-width: 320px;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="budget-search" placeholder="Buscar por número o cliente...">
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-secondary" id="history-budget-btn" style="background: rgba(255,255,255,0.05); color: var(--text-primary); border: 1px solid var(--border-color); display: inline-flex; align-items: center; gap: 0.5rem;"><i class="fa-solid fa-clock-rotate-left"></i> Historial</button>
                    <button class="btn btn-primary" id="new-budget-direct-btn"><i class="fa-solid fa-file-circle-plus"></i> Nueva Cotización</button>
                </div>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Código Presupuesto</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Placas Auto</th>
                            <th>N° Equipo</th>
                            <th>Total (Con IVA)</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="budgets-list-rows">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Budget History Modal -->
        <div id="budget-history-modal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6); backdrop-filter: blur(4px);">
            <div class="modal-content glass-card" style="margin: 2% auto; width: 90%; max-width: 1200px; padding: 2rem; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-sidebar); max-height: 90vh; display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                    <h2 style="margin: 0; font-family: 'Outfit', sans-serif; color: var(--primary);"><i class="fa-solid fa-clock-rotate-left"></i> Historial de Presupuestos</h2>
                    <span class="close-modal" id="close-history-modal" style="font-size: 1.8rem; cursor: pointer; color: var(--text-secondary);">&times;</span>
                </div>
                
                <!-- Filters Section -->
                <div class="glass-card" style="padding: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); border-radius: 8px;">
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; display: block; font-weight: 600;">Cliente / Código / Placas</label>
                        <input type="text" id="hist-filter-search" placeholder="Buscar..." style="padding: 0.45rem 0.6rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%; font-size: 0.85rem; box-sizing: border-box; height: 35px;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; display: block; font-weight: 600;">Nº Equipo</label>
                        <input type="text" id="hist-filter-equipo" placeholder="Buscar Nº Equipo..." style="padding: 0.45rem 0.6rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%; font-size: 0.85rem; box-sizing: border-box; height: 35px;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; display: block; font-weight: 600;">Estado</label>
                        <select id="hist-filter-state" style="padding: 0.45rem 0.6rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%; font-size: 0.85rem; box-sizing: border-box; height: 35px;">
                            <option value="">-- Todos los Estados --</option>
                            <option value="1">1 - Creado (Borrador)</option>
                            <option value="2">2 - Aprobado</option>
                            <option value="5">5 - Trabajo Finalizado</option>
                            <option value="3">3 - Facturado / Entregado</option>
                            <option value="4">4 - Anulado / Rechazado</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; display: block; font-weight: 600;">Desde</label>
                        <input type="date" id="hist-filter-from-date" style="padding: 0.45rem 0.6rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%; font-size: 0.85rem; box-sizing: border-box; height: 35px;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; display: block; font-weight: 600;">Hasta</label>
                        <input type="date" id="hist-filter-to-date" style="padding: 0.45rem 0.6rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%; font-size: 0.85rem; box-sizing: border-box; height: 35px;">
                    </div>
                    <div class="form-group" style="margin: 0;">
                        <label style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; display: block; font-weight: 600;">Monto Mínimo</label>
                        <input type="number" id="hist-filter-min-amount" placeholder="Min $" style="padding: 0.45rem 0.6rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%; font-size: 0.85rem; box-sizing: border-box; height: 35px;">
                    </div>
                </div>
                
                <!-- Table Area -->
                <div style="flex: 1; overflow-y: auto; min-height: 250px; border: 1px solid var(--border-color); border-radius: 8px;" class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Placas</th>
                                <th>Nº Equipo</th>
                                <th>Total (Con IVA)</th>
                                <th>Estado</th>
                                <th style="text-align: right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="hist-table-body">
                            <!-- Loaded dynamically -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border-color); flex-wrap: wrap; gap: 1rem;">
                    <div style="font-size: 0.85rem; color: var(--text-secondary);" id="hist-pagination-info">
                        Mostrando 0-0 de 0 registros
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button class="btn btn-secondary" id="hist-prev-page-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;"><i class="fa-solid fa-chevron-left"></i> Anterior</button>
                        <span style="font-size: 0.85rem; font-weight: bold; padding: 0 0.5rem; color: var(--primary);" id="hist-current-page-num">1</span>
                        <button class="btn btn-secondary" id="hist-next-page-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Siguiente <i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const rowsContainer = document.getElementById('budgets-list-rows');
    const searchInput = document.getElementById('budget-search');

    function populateBudgetsList(filter = '') {
        if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
        if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

        rowsContainer.innerHTML = '';
        const filtered = db.presupuestos.filter(p => {
            if (p.Estado == 2 || p.Estado == 3 || p.Estado == 4 || p.Estado == 5) return false;
            
            const termMatch = (p['ID Presupuesto'] || '').toLowerCase().includes(filter.toLowerCase()) ||
                (p.Nombre || '').toLowerCase().includes(filter.toLowerCase()) ||
                (p.Placas || '').toLowerCase().includes(filter.toLowerCase());
                
            if (termMatch) return true;
            
            const vehicle = db.vehiculos.find(v => v.Placas === p.Placas || v.ID_Vehiculo === p.ID_Vehiculo) || {};
            return (vehicle.N_Equipo || '').toLowerCase().includes(filter.toLowerCase());
        });

        // Sort by creation date descending (newest first)
        filtered.sort((a, b) => {
            const dateA = new Date(a.Fecha).getTime() || 0;
            const dateB = new Date(b.Fecha).getTime() || 0;
            return dateB - dateA;
        });

        if (filtered.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Sin resultados</td></tr>';
            return;
        }

        filtered.forEach(p => {
            let statusBadge = '';
            if (p.Estado == 1) statusBadge = '<span class="badge-tag badge-warning">Creado</span>';
            else if (p.Estado == 2) statusBadge = '<span class="badge-tag badge-primary">Aprobado</span>';
            else if (p.Estado == 3) statusBadge = '<span class="badge-tag badge-success">Facturado</span>';
            else if (p.Estado == 4) statusBadge = '<span class="badge-tag badge-danger">Anulado</span>';
            else statusBadge = '<span class="badge-tag badge-success">En Espera</span>';
            
            const isFacturado = p.Estado == 3;
            const isAnulado = p.Estado == 4;
            const isReadonly = isFacturado || isAnulado;
            const actionText = isReadonly ? '<i class="fa-solid fa-eye"></i> Ver' : '<i class="fa-solid fa-edit"></i> Editar';
            
            const deleteBtnHtml = isReadonly 
                ? `<button class="btn" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem; background: rgba(255,255,255,0.05); color: var(--text-muted); border: none; cursor: not-allowed;" disabled title="No se puede eliminar un presupuesto facturado o anulado"><i class="fa-solid fa-trash-can"></i> Eliminar</button>`
                : `<button class="btn btn-delete-budget" data-id="${p['ID Presupuesto']}" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem; background: #e74c3c; color: white; border: none; cursor: pointer;" title="Eliminar presupuesto"><i class="fa-solid fa-trash-can"></i> Eliminar</button>`;
            
            const vehicle = db.vehiculos.find(v => v.Placas === p.Placas || v.ID_Vehiculo === p.ID_Vehiculo) || {};
            const numEquipo = vehicle.N_Equipo || 'N/A';
            const grandTotal = getBudgetGrandTotal(p, db);

            const tr = document.createElement('tr');
            tr.innerHTML = html`
                <td><strong>${escapeHtml(p['ID Presupuesto'])}</strong></td>
                <td>${p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A'}</td>
                <td>${escapeHtml(p.Nombre)}</td>
                <td><span class="badge-tag badge-primary">${escapeHtml(p.Placas || 'N/A')}</span></td>
                <td><strong style="color:var(--cyan); font-family:monospace;">${escapeHtml(numEquipo)}</strong></td>
                <td><strong>$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td>${safe(statusBadge)}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="#presupuestos?id=${escapeHtml(p['ID Presupuesto'])}" class="btn btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;">${safe(actionText)}</a>
                        <button class="btn btn-secondary btn-print-budget-pdf" data-id="${escapeHtml(p['ID Presupuesto'])}" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-file-pdf"></i> PDF</button>
                        <button class="btn btn-approve-budget-shortcut" data-id="${escapeHtml(p['ID Presupuesto'])}" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem; background: #2ecc71; color: white; border: none; cursor: pointer;" title="Aprobar presupuesto"><i class="fa-solid fa-circle-check"></i> Aprobar</button>
                        ${safe(deleteBtnHtml)}
                    </div>
                </td>
            `;
            rowsContainer.appendChild(tr);
        });

        // Bind print PDF buttons
        rowsContainer.querySelectorAll('.btn-print-budget-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                exportBudgetPDF(id);
            });
        });

        // Bind approve buttons
        rowsContainer.querySelectorAll('.btn-approve-budget-shortcut').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                const budgetObj = db.presupuestos.find(b => b['ID Presupuesto'] === id);
                if (!budgetObj) return;

                if (confirm(`¿Estás seguro de que deseas aprobar el presupuesto ${id}? El vehículo pasará al estado de reparación activa en el taller (Kanban).`)) {
                    budgetObj.Estado = 2;
                    saveDatabase(db);
                    showToast(`Presupuesto ${id} aprobado con éxito.`, "success");
                    populateBudgetsList(searchInput.value || '');
                }
            });
        });

        // Bind delete buttons
        rowsContainer.querySelectorAll('.btn-delete-budget').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el presupuesto ${id}? Esta acción no se puede deshacer.`)) {
                    db.presupuestos = db.presupuestos.filter(b => b['ID Presupuesto'] !== id);
                    saveDatabase(db);
                    showToast("Presupuesto eliminado correctamente", "success");
                    populateBudgetsList(searchInput.value || '');
                }
            });
        });
    }

    searchInput.addEventListener('input', (e) => {
        populateBudgetsList(e.target.value);
    });

    document.getElementById('new-budget-direct-btn').addEventListener('click', () => {
        window.location.hash = '#presupuestos?action=new';
    });

    // Budget History Modal Logic
    let histCurrentPage = 1;
    const histPageSize = 20;
    let histFilteredBudgets = [];

    function populateHistoryList() {
        const histTableBody = document.getElementById('hist-table-body');
        if (!histTableBody) return;

        const term = document.getElementById('hist-filter-search').value.toLowerCase().trim();
        const equipo = document.getElementById('hist-filter-equipo').value.toLowerCase().trim();
        const stateFilter = document.getElementById('hist-filter-state').value;
        const fromDateStr = document.getElementById('hist-filter-from-date').value;
        const toDateStr = document.getElementById('hist-filter-to-date').value;
        const minAmountStr = document.getElementById('hist-filter-min-amount').value;

        // Perform memory-efficient filtering across all budgets
        histFilteredBudgets = db.presupuestos.filter(p => {
            // 1. Search term (Client name, budget ID, or plate number)
            if (term) {
                const idMatch = (p['ID Presupuesto'] || '').toLowerCase().includes(term);
                const nameMatch = (p.Nombre || '').toLowerCase().includes(term);
                const platesMatch = (p.Placas || '').toLowerCase().includes(term);
                if (!idMatch && !nameMatch && !platesMatch) return false;
            }

            // 2. Status filter
            if (stateFilter) {
                if (parseInt(p.Estado || 1) !== parseInt(stateFilter)) return false;
            }

            // 3. Date range filter
            if (fromDateStr) {
                const fromTime = new Date(fromDateStr + 'T00:00:00').getTime();
                const bTime = new Date(p.Fecha).getTime();
                if (isNaN(bTime) || bTime < fromTime) return false;
            }
            if (toDateStr) {
                const toTime = new Date(toDateStr + 'T23:59:59').getTime();
                const bTime = new Date(p.Fecha).getTime();
                if (isNaN(bTime) || bTime > toTime) return false;
            }

            // Look up vehicle for equipment number or total calculations if needed
            const vehicle = db.vehiculos.find(v => v.Placas === p.Placas || v.ID_Vehiculo === p.ID_Vehiculo) || {};

            // 4. Equipment Number filter
            if (equipo) {
                const eqMatch = (vehicle.N_Equipo || '').toLowerCase().includes(equipo);
                if (!eqMatch) return false;
            }

            const grandTotal = getBudgetGrandTotal(p, db);
            p._cachedTotal = grandTotal;
            p._cachedEquipo = vehicle.N_Equipo || 'N/A';

            // 5. Min amount filter
            if (minAmountStr) {
                const minVal = parseFloat(minAmountStr);
                if (isNaN(minVal) || grandTotal < minVal) return false;
            }

            return true;
        });

        // Sort filtered budgets by date descending
        histFilteredBudgets.sort((a, b) => {
            const dateA = new Date(a.Fecha).getTime() || 0;
            const dateB = new Date(b.Fecha).getTime() || 0;
            return dateB - dateA;
        });

        // Pagination calculations
        const totalRecords = histFilteredBudgets.length;
        const totalPages = Math.max(1, Math.ceil(totalRecords / histPageSize));
        
        if (histCurrentPage > totalPages) {
            histCurrentPage = totalPages;
        }

        const startIndex = (histCurrentPage - 1) * histPageSize;
        const endIndex = Math.min(startIndex + histPageSize, totalRecords);
        const pageBudgets = histFilteredBudgets.slice(startIndex, endIndex);

        // Update pagination labels
        document.getElementById('hist-current-page-num').textContent = histCurrentPage.toString();
        document.getElementById('hist-pagination-info').textContent = totalRecords === 0
            ? 'Mostrando 0-0 de 0 registros'
            : `Mostrando ${startIndex + 1}-${endIndex} de ${totalRecords} registros`;

        // Enable/Disable pagination buttons
        document.getElementById('hist-prev-page-btn').disabled = (histCurrentPage === 1);
        document.getElementById('hist-next-page-btn').disabled = (histCurrentPage === totalPages);

        histTableBody.innerHTML = '';

        if (pageBudgets.length === 0) {
            histTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">Sin registros coincidentes</td></tr>';
            return;
        }

        pageBudgets.forEach(p => {
            let statusBadge = '';
            const st = parseInt(p.Estado || 1);
            if (st === 1) statusBadge = '<span class="badge-tag badge-warning">Creado</span>';
            else if (st === 2) statusBadge = '<span class="badge-tag badge-primary">Aprobado</span>';
            else if (st === 3) statusBadge = '<span class="badge-tag badge-success">Facturado</span>';
            else if (st === 4) statusBadge = '<span class="badge-tag badge-danger">Anulado</span>';
            else if (st === 5) statusBadge = '<span class="badge-tag" style="background:rgba(168,85,247,0.1); color:#a855f7;">Finalizado</span>';
            else statusBadge = `<span class="badge-tag badge-secondary">Estado ${st}</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = html`
                <td><strong>${escapeHtml(p['ID Presupuesto'])}</strong></td>
                <td>${p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A'}</td>
                <td>${escapeHtml(p.Nombre)}</td>
                <td><span class="badge-tag badge-primary">${escapeHtml(p.Placas || 'N/A')}</span></td>
                <td><strong style="color:var(--cyan); font-family:monospace;">${escapeHtml(p._cachedEquipo)}</strong></td>
                <td><strong>$ ${p._cachedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td>${safe(statusBadge)}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <a href="#presupuestos?id=${escapeHtml(p['ID Presupuesto'])}" class="btn btn-secondary btn-hist-view" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-eye"></i> Ver/Editar</a>
                    </div>
                </td>
            `;
            histTableBody.appendChild(tr);
        });

        // Close modal on detail view navigation clicks
        histTableBody.querySelectorAll('.btn-hist-view').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('budget-history-modal').style.display = 'none';
            });
        });
    }

    // Modal toggle
    const historyBtn = document.getElementById('history-budget-btn');
    const historyModal = document.getElementById('budget-history-modal');
    
    if (historyBtn && historyModal) {
        historyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            historyModal.style.display = 'block';
            histCurrentPage = 1;
            populateHistoryList();
        });
    }

    const closeHistoryBtn = document.getElementById('close-history-modal');
    if (closeHistoryBtn && historyModal) {
        closeHistoryBtn.addEventListener('click', () => {
            historyModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.style.display = 'none';
        }
    });

    // Pagination events
    const prevBtn = document.getElementById('hist-prev-page-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (histCurrentPage > 1) {
                histCurrentPage--;
                populateHistoryList();
            }
        });
    }

    const nextBtn = document.getElementById('hist-next-page-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const totalRecords = histFilteredBudgets.length;
            const totalPages = Math.ceil(totalRecords / histPageSize);
            if (histCurrentPage < totalPages) {
                histCurrentPage++;
                populateHistoryList();
            }
        });
    }

    // Filter change/input events
    const filterInputs = [
        'hist-filter-search',
        'hist-filter-equipo',
        'hist-filter-state',
        'hist-filter-from-date',
        'hist-filter-to-date',
        'hist-filter-min-amount'
    ];

    filterInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const evType = el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input';
            el.addEventListener(evType, () => {
                histCurrentPage = 1;
                populateHistoryList();
            });
        }
    });

    populateBudgetsList();
}

// BUDGET EDITOR SUB-VIEW
export function renderBudgetEditor(container, budget) {
    const db = getDatabase();
    const isNew = (budget === null);
    const activeUser = getActiveUser();
    const isAdmin = activeUser && (activeUser.Nivel_Acceso === 'Administrador');
    const config = getWorkshopConfig(db);
    const tipoComision = config.tipo_comision || 'general';
    const isDetailed = tipoComision === 'detallada';
    const habilitarRepuestosCliente = db.saas_state?.workshopData?.features?.habilitar_repuestos_cliente === true;
    
    if (isNew) {
        budget = {
            "ID Presupuesto": "PRES-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
            Fecha: Date.now(),
            Codigo_Cliente: '',
            Nombre: '',
            ID_Vehiculo: '',
            Placas: '',
            Kilometraje: '',
            Estado: 1, // Iniciado
            "% Impuesto": 0.13,
            AplicaPercepcion: 0,
            AplicaRetencion: 0,
            Tecnico_Asignado: db.tecnicos[0] ? db.tecnicos[0].Tecnico_ID : '',
            Asesor_Asignado: '',
            Orden_Compra: '',
            Fallas_Detectadas: '',
            "Pagado?": "NO"
        };
    }

    window.currentEditingBudgetId = budget['ID Presupuesto'];
    
    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];
    
    let budgetProducts = isNew ? [] : db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === budget['ID Presupuesto']);
    let budgetLabor = isNew ? [] : db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === budget['ID Presupuesto']);
    
    const client = isNew ? null : (db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { Nombre: budget.Nombre });
    const vehicle = isNew ? null : (db.vehiculos.find(v => v.ID_Vehiculo === budget.ID_Vehiculo) || { Placas: budget.Placas || 'N/A', Marca: 'N/A', Modelo: 'N/A' });
    const techsHTML = db.tecnicos.map(t => `<option value="${t.Tecnico_ID}" ${budget.Tecnico_Asignado === t.Tecnico_ID ? 'selected' : ''}>${t.Nombre_Completo}</option>`).join('');
    const advisorsHTML = db.tecnicos.map(t => `<option value="${t.Tecnico_ID}" ${budget.Asesor_Asignado === t.Tecnico_ID ? 'selected' : ''}>${t.Nombre_Completo}</option>`).join('');

    // Generate header HTML
    let headerHTML = '';
    if (isNew) {
        headerHTML = `
            <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 1.25rem; color: var(--primary); font-family: var(--font-heading); display:flex; align-items:center; gap:0.5rem;"><i class="fa-solid fa-file-invoice-dollar"></i> Crear Nueva Cotización</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>1. Seleccionar Cliente</label>
                        <select id="editor-client-select" required style="padding: 0.65rem;">
                            <option value="">-- Busque y seleccione Cliente --</option>
                            ${safe(db.clientes.map(c => `<option value="${escapeHtml(c.Codigo_Cliente)}">${escapeHtml(c.Nombre)}</option>`).join(''))}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>2. Seleccionar Vehículo</label>
                        <select id="editor-vehicle-select" required disabled style="padding: 0.65rem;">
                            <option value="">-- Elija vehículo (seleccione cliente primero) --</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Kilometraje / Odómetro</label>
                        <input type="text" id="editor-odo" placeholder="Ej. 120,000 Km" style="padding: 0.6rem;">
                    </div>
                    <div class="form-group">
                        <label>Técnico Asignado</label>
                        <select id="editor-tech-select" style="padding: 0.6rem;">
                            ${safe(techsHTML)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Asesor Comercial</label>
                        <select id="editor-advisor-select" style="padding: 0.6rem;">
                            <option value="">-- Sin Asignar --</option>
                            ${safe(advisorsHTML)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Orden de Compra</label>
                        <input type="text" id="editor-purchase-order" placeholder="N° Orden de Compra" style="padding: 0.6rem;" value="${escapeHtml(budget.Orden_Compra || '')}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Fallas Detectadas / Diagnóstico Final</label>
                    <input type="text" id="editor-fallas" placeholder="Escriba fallas reportadas o diagnóstico inicial..." style="padding: 0.65rem;">
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label>Observaciones Generales / Recomendaciones</label>
                    <input type="text" id="editor-observaciones" placeholder="Escriba observaciones o recomendaciones adicionales..." style="padding: 0.65rem;">
                </div>
            </div>
        `;
    } else {
        const ingestLinkHTML = budget.Ingreso_ID ? `
            <p style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--primary);">
                <i class="fa-solid fa-file-signature"></i> Recepción enlazada: 
                <a href="#ingresos?id=${escapeHtml(budget.Ingreso_ID)}" style="color: var(--primary); font-weight: bold; text-decoration: underline;">${escapeHtml(budget.Ingreso_ID)}</a>
            </p>
        ` : '';

        headerHTML = `
            <div class="glass-card" style="padding: 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <span class="badge-tag badge-primary" style="font-family: var(--font-heading); font-size: 1rem;">${escapeHtml(budget['ID Presupuesto'])}</span>
                        <h2 style="margin-top: 0.5rem;">${escapeHtml(client.Nombre)}</h2>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">Vehículo: <strong>${escapeHtml(vehicle.Placas)} (${escapeHtml(vehicle.Marca)} ${escapeHtml(vehicle.Modelo)})</strong> • Nº Equipo: <strong>${escapeHtml(vehicle.N_Equipo || 'N/A')}</strong> • Odómetro: ${escapeHtml(budget.Kilometraje || '0')}</p>
                        ${ingestLinkHTML}
                    </div>
                    <div style="display: flex; gap: 0.75rem;">
                        <div class="form-group" style="width: 160px;">
                            <label>Asesor</label>
                            <select id="editor-advisor-select" style="padding: 0.5rem;" ${budget.Estado != 1 ? 'disabled' : ''}>
                                <option value="">-- Sin Asignar --</option>
                                ${safe(advisorsHTML)}
                            </select>
                        </div>
                        <div class="form-group" style="width: 160px;">
                            <label>Técnico Asignado</label>
                            <select id="editor-tech-select" style="padding: 0.5rem;" ${budget.Estado != 1 ? 'disabled' : ''}>
                                ${safe(techsHTML)}
                            </select>
                        </div>
                        <div class="form-group" style="width: 160px;">
                            <label>Orden de Compra</label>
                            <input type="text" id="editor-purchase-order" placeholder="N° Orden de Compra" style="padding: 0.5rem;" value="${escapeHtml(budget.Orden_Compra || '')}" ${(budget.Estado == 3 || budget.Estado == 4) ? 'disabled' : ''}>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Fallas Detectadas / Diagnóstico Final</label>
                    <input type="text" id="editor-fallas" value="${escapeHtml(budget.Fallas_Detectadas || 'Diagnóstico general')}" style="padding: 0.6rem;" ${budget.Estado != 1 ? 'disabled' : ''}>
                </div>
                <div class="form-group" style="margin-top: 1rem;">
                    <label>Observaciones Generales / Recomendaciones</label>
                    <input type="text" id="editor-observaciones" value="${escapeHtml(budget.Observaciones || '')}" placeholder="Escriba observaciones o recomendaciones adicionales..." style="padding: 0.6rem;" ${budget.Estado != 1 ? 'disabled' : ''}>
                </div>
            </div>
        `;
    }

    const promoOptions = (db.promociones || []).filter(p => p.Estado === 'Activo' || (budget.ID_Promocion && p.ID_Promocion === budget.ID_Promocion)).map(p => {
        const isSelected = budget.ID_Promocion === p.ID_Promocion ? 'selected' : '';
        const desc = p.Tipo === 'monto_fijo' ? `$${parseFloat(p.Valor).toFixed(2)}` : `${parseFloat(p.Valor)}%`;
        return `<option value="${escapeHtml(p.ID_Promocion)}" ${isSelected}>${escapeHtml(p.Nombre)} (${desc})</option>`;
    }).join('');

    container.innerHTML = html`
        <div class="budget-editor" id="budget-editor-layout">
            <div class="items-section">
                <!-- Header Info Card -->
                ${safe(headerHTML)}

                <!-- Products (Spare Parts) Detail -->
                <div class="glass-card" id="editor-products-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Repuestos y Refacciones</h3>
                        <button class="btn btn-primary" id="add-prod-item-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" ${isNew || budget.Estado != 1 ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Agregar Repuesto</button>
                    </div>
                    
                    <div class="item-row" style="grid-template-columns: 80px 2.2fr 1.3fr 0.8fr 1fr 1fr 50px; background-color: var(--border-color); font-weight: bold; border: none; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem;">
                        <div>Código</div>
                        <div>Descripción</div>
                        <div>Técnico</div>
                        <div>Cantidad</div>
                        <div>Precio Unit.</div>
                        <div style="text-align: right;">Total</div>
                        <div></div>
                    </div>
                    
                    <div id="budget-products-rows" style="margin-top: 0.5rem;">
                        <!-- Injected -->
                    </div>
                </div>

                <!-- Labor Detail -->
                <div class="glass-card" id="editor-labor-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Mano de Obra y Servicios</h3>
                        <button class="btn btn-primary" id="add-labor-item-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" ${isNew || budget.Estado != 1 ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Agregar Servicio</button>
                    </div>
                    
                    <div class="item-row" style="grid-template-columns: 80px 2.2fr 1.3fr 0.8fr 1fr 1fr 50px; background-color: var(--border-color); font-weight: bold; border: none; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem;">
                        <div>Código</div>
                        <div>Descripción del Servicio</div>
                        <div>Técnico</div>
                        <div>Cantidad</div>
                        <div>Precio Unit.</div>
                        <div style="text-align: right;">Total</div>
                        <div></div>
                    </div>
                    
                    <div id="budget-labor-rows" style="margin-top: 0.5rem;">
                        <!-- Injected -->
                    </div>
                </div>

                <!-- Customer-provided Parts (Solicitud de Repuestos) -->
                ${habilitarRepuestosCliente ? safe(`
                <div class="glass-card" id="editor-customer-parts-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Solicitud de Repuestos (Traídos por Cliente)</h3>
                        <button class="btn btn-primary" id="add-customer-part-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" ${(isNew || (budget.Estado == 3 || budget.Estado == 4)) ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Agregar Fila</button>
                    </div>
                    
                    <div class="item-row" style="grid-template-columns: 2.2fr 1fr 50px; background-color: var(--border-color); font-weight: bold; border: none; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem;">
                        <div>Descripción del Repuesto</div>
                        <div>Cantidad</div>
                        <div></div>
                    </div>
                    
                    <div id="budget-customer-parts-rows" style="margin-top: 0.5rem;">
                        <!-- Injected -->
                    </div>
                </div>
                `) : ''}
            </div>

            <!-- Summary Sticky Sidebar -->
            <div class="summary-sidebar glass-card" id="editor-summary-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                <h3>Resumen Presupuesto</h3>
                <p style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 1.5rem;">Condiciones fiscales aplicadas</p>
                
                <div class="form-group">
                    <label>Estado del Presupuesto</label>
                    <select id="editor-state" style="padding: 0.5rem; font-weight: 600;" ${budget.Estado != 1 ? 'disabled' : ''}>
                        <option value="1" ${budget.Estado == 1 ? 'selected' : ''}>1 - Creado</option>
                        <option value="2" ${budget.Estado == 2 ? 'selected' : ''} ${!isAdmin ? 'disabled' : ''}>2 - Aprobado ${!isAdmin ? '(Solo Admin)' : ''}</option>
                        <option value="5" ${budget.Estado == 5 ? 'selected' : ''} disabled>5 - Trabajos Finalizados</option>
                        <option value="3" ${budget.Estado == 3 ? 'selected' : ''} disabled>3 - Facturado</option>
                        <option value="4" ${budget.Estado == 4 ? 'selected' : ''} disabled>4 - Anulado</option>
                    </select>
                </div>

                <div class="form-group" style="margin-top: 1rem;">
                    <label>Aplicar Promoción</label>
                    <select id="editor-promocion-select" style="padding: 0.5rem;" ${budget.Estado != 1 ? 'disabled' : ''}>
                        <option value="">Sin promoción / descuento</option>
                        ${safe(promoOptions)}
                    </select>
                </div>
                
                <div style="border-top: 1px solid var(--border-color); margin-top: 1rem; padding-top: 1rem;">
                    <div class="summary-row"><span>Suma Repuestos:</span><span id="sum-products">$0.00</span></div>
                    <div class="summary-row"><span>Suma Mano Obra:</span><span id="sum-labor">$0.00</span></div>
                    <div class="summary-row"><span>Subtotal Neto:</span><span id="subtotal-neto" style="font-weight: 600;">$0.00</span></div>
                    
                    <div id="discount-section">
                        <!-- Shows discount if applicable -->
                    </div>
                    
                    <div class="summary-row"><span>IVA (13%):</span><span id="tax-iva">$0.00</span></div>
                    
                    <div id="ret-per-section">
                        <!-- Shows retention/perception if applicable -->
                    </div>
                    
                    <div class="summary-total">Total: <span id="grand-total">$0.00</span></div>
                </div>

                ${safe((budget.Estado != 1) ? `
                <div style="background: ${budget.Estado == 4 ? 'rgba(231, 76, 60, 0.1)' : budget.Estado == 5 ? 'rgba(168, 85, 247, 0.1)' : budget.Estado == 2 ? 'rgba(52, 152, 219, 0.1)' : 'rgba(46, 204, 113, 0.1)'}; border: 1px solid ${budget.Estado == 4 ? 'var(--danger)' : budget.Estado == 5 ? '#a855f7' : budget.Estado == 2 ? 'var(--primary)' : 'var(--success)'}; padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; color: ${budget.Estado == 4 ? 'var(--danger)' : budget.Estado == 5 ? '#a855f7' : budget.Estado == 2 ? 'var(--primary)' : 'var(--success)'}; display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
                    <i class="fa-solid ${budget.Estado == 4 ? 'fa-ban' : budget.Estado == 5 ? 'fa-circle-check' : budget.Estado == 2 ? 'fa-screwdriver-wrench' : 'fa-circle-check'}"></i>
                    <span>${
                        budget.Estado == 2 ? 'Presupuesto aprobado. Reparaciones en proceso en el taller (Lectura).' : 
                        budget.Estado == 5 ? 'Trabajos finalizados en el taller. Listo para facturación (Lectura).' : 
                        budget.Estado == 4 ? 'DTE o Presupuesto Anulado / Rechazado (Lectura).' : 
                        'Presupuesto facturado y entregado (Lectura).'
                    }</span>
                </div>
                ` : '')}

                <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
                    ${safe((!isNew && budget.Estado == 1 && isAdmin) ? `
                        <button class="btn btn-success" id="approve-budget-shortcut-btn" style="background: var(--success);"><i class="fa-solid fa-check-double"></i> Aprobar Presupuesto</button>
                        <button class="btn btn-danger" id="reject-budget-shortcut-btn" style="background: var(--danger); border: none; color: white;"><i class="fa-solid fa-ban"></i> Rechazar Cotización</button>
                    ` : '')}
                    <button class="btn btn-primary" id="save-budget-btn" ${(budget.Estado == 3 || budget.Estado == 4) ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}><i class="fa-solid fa-floppy-disk"></i> Guardar Cotización</button>
                    ${safe((!isNew && budget.Estado == 2) ? `
                        <button class="btn btn-success" id="finalize-work-btn" style="background: #a855f7; border: none; color: white;"><i class="fa-solid fa-circle-check"></i> Finalizar Trabajos</button>
                        <button class="btn btn-warning" id="revert-to-draft-btn" style="background: #f59e0b; color: white; border: none;"><i class="fa-solid fa-rotate-left"></i> Devolver a Borrador</button>
                    ` : '')}
                    ${safe((!isNew && budget.Estado == 5) ? `
                        <button class="btn btn-success" id="facturar-budget-shortcut-btn"><i class="fa-solid fa-wallet"></i> Facturar DTE</button>
                        <button class="btn btn-warning" id="reopen-work-btn" style="background: #f59e0b; color: white; border: none;"><i class="fa-solid fa-wrench"></i> Reabrir Reparación</button>
                    ` : '')}
                    ${safe((!isNew && budget.Estado == 4 && isAdmin) ? `<button class="btn btn-warning" id="recover-budget-btn" style="background: #f59e0b; color: white; font-weight: bold; border: none; box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);"><i class="fa-solid fa-rotate-left"></i> Recuperar Presupuesto</button>` : '')}
                    ${safe(!isNew ? `<button class="btn btn-secondary" id="print-budget-btn" type="button"><i class="fa-solid fa-file-pdf"></i> Compartir / PDF</button>` : '')}
                    <button class="btn btn-secondary" onclick="window.location.hash='${
                        (budget.Estado == 3 || budget.Estado == 5) ? '#facturador' : 
                        (budget.Estado == 2) ? '#kanban' : '#presupuestos'
                    }'"><i class="fa-solid fa-arrow-left"></i> Volver</button>
                </div>
            </div>
        </div>

        <!-- Add Product Item Modal -->
        <div id="item-prod-modal" class="modal">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2>Buscar Repuesto</h2>
                    <button class="close-modal-btn" id="close-item-prod-modal">&times;</button>
                </div>
                <div class="form-group">
                    <label>Buscar en catálogo</label>
                    <input type="text" id="search-catalogo-prod" placeholder="Escribe descripción o código...">
                </div>
                <div class="scrollable-list" id="catalogo-prod-results" style="max-height: 300px;">
                    <!-- Results dynamic -->
                </div>
            </div>
        </div>

        <!-- Add Labor Item Modal -->
        <div id="item-labor-modal" class="modal">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2>Buscar Servicio (Mano de Obra)</h2>
                    <button class="close-modal-btn" id="close-item-labor-modal">&times;</button>
                </div>
                <div class="form-group">
                    <label>Buscar en catálogo</label>
                    <input type="text" id="search-catalogo-labor" placeholder="Escribe descripción de servicio...">
                </div>
                <div class="scrollable-list" id="catalogo-labor-results" style="max-height: 300px;">
                    <!-- Results dynamic -->
                </div>
            </div>
        </div>
    `;

    const productsContainer = document.getElementById('budget-products-rows');
    const laborContainer = document.getElementById('budget-labor-rows');

    // Load actual catalog products & labor for modals
    const prodModal = document.getElementById('item-prod-modal');
    const laborModal = document.getElementById('item-labor-modal');
    const searchProdInput = document.getElementById('search-catalogo-prod');
    const searchLaborInput = document.getElementById('search-catalogo-labor');
    const prodResults = document.getElementById('catalogo-prod-results');
    const laborResults = document.getElementById('catalogo-labor-results');

    // Local temporary copies of products/labor rows so we don't save to db until user clicks save
    let tempProducts = [...budgetProducts];
    let tempLabor = [...budgetLabor];
    let tempRepuestosCliente = [...(budget.Repuestos_Cliente || [])];

    function autoSaveBudget() {
        if (!budget || !budget['ID Presupuesto']) return;

        // Auto-update header fields if elements exist
        const fallasEl = document.getElementById('editor-fallas');
        if (fallasEl) {
            budget.Fallas_Detectadas = fallasEl.value;
        }
        const obsEl = document.getElementById('editor-observaciones');
        if (obsEl) {
            budget.Observaciones = obsEl.value;
        }
        const techEl = document.getElementById('editor-tech-select');
        if (techEl) {
            budget.Tecnico_Asignado = techEl.value;
        }
        const advisorEl = document.getElementById('editor-advisor-select');
        if (advisorEl) {
            budget.Asesor_Asignado = advisorEl.value;
        }
        const poEl = document.getElementById('editor-purchase-order');
        if (poEl) {
            budget.Orden_Compra = poEl.value.trim().toUpperCase();
        }
        const stateEl = document.getElementById('editor-state');
        if (stateEl) {
            budget.Estado = parseInt(stateEl.value);
        }
        const odoEl = document.getElementById('editor-odo');
        if (odoEl) {
            budget.Kilometraje = odoEl.value;
        }

        const config = getWorkshopConfig(db);
        budget.Tipo_Comision = config.tipo_comision || 'general';

        // Save details
        db.detalle_productos = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] !== budget['ID Presupuesto']).concat(tempProducts);
        db.detalle_mano_obra = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] !== budget['ID Presupuesto']).concat(tempLabor);
        if (habilitarRepuestosCliente) {
            budget.Repuestos_Cliente = tempRepuestosCliente;
        }

        // If it is a new budget and client+vehicle are selected, make sure it's in the list
        if (isNew && budget.Codigo_Cliente && budget.ID_Vehiculo) {
            const exists = db.presupuestos.some(b => b['ID Presupuesto'] === budget['ID Presupuesto']);
            if (!exists) {
                db.presupuestos.unshift(budget);
            }
        }

        saveDatabase(db);
    }

    // Helper functions for Creation Mode dropdowns
    if (isNew) {
        makeSelectSearchable('editor-client-select', 'Buscar cliente...');
        makeSelectSearchable('editor-vehicle-select', 'Buscar vehículo...');
        
        const clientSelect = document.getElementById('editor-client-select');
        const vehicleSelect = document.getElementById('editor-vehicle-select');
        
        clientSelect.addEventListener('change', (e) => {
            const clientCode = e.target.value;
            if (!clientCode) {
                vehicleSelect.innerHTML = '<option value="">-- Elija vehículo (seleccione cliente primero) --</option>';
                vehicleSelect.disabled = true;
                disableEditorModules();
                return;
            }
            
            const selectedClient = db.clientes.find(c => c.Codigo_Cliente === clientCode);
            budget.Codigo_Cliente = clientCode;
            budget.Nombre = selectedClient.Nombre;
            budget['% Impuesto'] = selectedClient['% Impuesto'] || 0.13;
            budget.AplicaPercepcion = selectedClient.AplicaPercepcion || 0;
            budget.AplicaRetencion = selectedClient.AplicaRetencion || 0;
            
            // Populate vehicles
            const clientVehicles = db.vehiculos.filter(v => v.Codigo_Cliente === clientCode);
            vehicleSelect.innerHTML = '<option value="">-- Seleccione Vehículo --</option>';
            clientVehicles.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.ID_Vehiculo;
                opt.textContent = `${v.Placas} - ${v.Marca} ${v.Modelo} (${v.Año})${v.N_Equipo ? ' • Eq: ' + v.N_Equipo : ''}`;
                vehicleSelect.appendChild(opt);
            });
            
            if (clientVehicles.length > 0) {
                vehicleSelect.disabled = false;
            } else {
                vehicleSelect.innerHTML = '<option value="">-- Sin vehículos (Registrar primero) --</option>';
                vehicleSelect.disabled = true;
                showToast("Este cliente no tiene vehículos. Regístralo en Clientes y Autos primero.", "warning");
            }
            disableEditorModules();
        });
        
        vehicleSelect.addEventListener('change', (e) => {
            const vehId = e.target.value;
            if (!vehId) {
                disableEditorModules();
                return;
            }
            
            const selectedVeh = db.vehiculos.find(v => v.ID_Vehiculo === vehId);
            budget.ID_Vehiculo = vehId;
            budget.Placas = selectedVeh.Placas;
            
            // Enable items editor
            enableEditorModules();
            calculateTotals();
            autoSaveBudget();
        });
        
        function disableEditorModules() {
            document.getElementById('editor-products-card').style.opacity = '0.4';
            document.getElementById('editor-products-card').style.pointerEvents = 'none';
            document.getElementById('add-prod-item-btn').disabled = true;
            
            document.getElementById('editor-labor-card').style.opacity = '0.4';
            document.getElementById('editor-labor-card').style.pointerEvents = 'none';
            document.getElementById('add-labor-item-btn').disabled = true;
            
            if (habilitarRepuestosCliente) {
                const card = document.getElementById('editor-customer-parts-card');
                if (card) {
                    card.style.opacity = '0.4';
                    card.style.pointerEvents = 'none';
                }
                const btn = document.getElementById('add-customer-part-btn');
                if (btn) {
                    btn.disabled = true;
                }
            }
            
            document.getElementById('editor-summary-card').style.opacity = '0.4';
            document.getElementById('editor-summary-card').style.pointerEvents = 'none';
        }
        
        function enableEditorModules() {
            document.getElementById('editor-products-card').style.opacity = '1';
            document.getElementById('editor-products-card').style.pointerEvents = 'all';
            document.getElementById('add-prod-item-btn').disabled = false;
            
            document.getElementById('editor-labor-card').style.opacity = '1';
            document.getElementById('editor-labor-card').style.pointerEvents = 'all';
            document.getElementById('add-labor-item-btn').disabled = false;
            
            if (habilitarRepuestosCliente) {
                const card = document.getElementById('editor-customer-parts-card');
                if (card) {
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'all';
                }
                const btn = document.getElementById('add-customer-part-btn');
                if (btn) {
                    btn.disabled = false;
                }
            }
            
            document.getElementById('editor-summary-card').style.opacity = '1';
            document.getElementById('editor-summary-card').style.pointerEvents = 'all';
        }
    }

    function renderTempRows() {
        const isLocked = budget.Estado != 1;
        productsContainer.innerHTML = '';
        tempProducts.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'item-row';
            
            row.style.gridTemplateColumns = '80px 2.2fr 1.3fr 0.8fr 1fr 1fr 50px';
            const currentTechId = item.Tecnico_ID || '';
            const tech = db.tecnicos.find(t => t.Tecnico_ID === currentTechId) || { Nombre_Completo: 'Sin Técnico' };
            const techOptions = '<option value="">-- Seleccione Técnico --</option>' + db.tecnicos.map(t => `<option value="${t.Tecnico_ID}" ${currentTechId === t.Tecnico_ID ? 'selected' : ''}>${t.Nombre_Completo}</option>`).join('');
            let techCol = isAdmin 
                ? `<div><select class="row-tech" data-type="product" data-idx="${index}" style="padding: 0.25rem 0.35rem; font-size: 0.8rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%;" ${isLocked ? 'disabled' : ''}>${techOptions}</select></div>`
                : `<div><span class="badge-tag badge-secondary" style="font-size: 0.75rem;">${escapeHtml(tech.Nombre_Completo)}</span></div>`;

            row.innerHTML = html`
                <div><small class="text-muted">${escapeHtml(item['ID_Producto DPP'] || 'PROD')}</small></div>
                <div><strong>${escapeHtml(item.Descripcion)}</strong></div>
                ${safe(techCol)}
                <div><input type="number" class="row-qty" data-type="product" data-idx="${index}" value="${item.Cantidad}" min="1" style="padding: 0.35rem; width: 60px;" ${isLocked ? 'disabled' : ''}></div>
                <div><input type="number" class="row-price" data-type="product" data-idx="${index}" value="${item.PrecioUnitario}" step="0.01" style="padding: 0.35rem; width: 80px;" ${isLocked ? 'disabled' : ''}></div>
                <div style="text-align: right; font-weight: bold;">$ ${(parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1)).toFixed(2)}</div>
                <div><button class="icon-btn btn-danger delete-row-btn" data-type="product" data-idx="${index}" style="width: 30px; height: 30px;" ${isLocked ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}><i class="fa-solid fa-trash"></i></button></div>
            `;
            productsContainer.appendChild(row);
        });

        laborContainer.innerHTML = '';
        tempLabor.forEach((item, index) => {
            const moCatalog = db.mano_obra.find(m => m.ID_ManoObra === item.ID_ManoObra);
            const isPriceEditable = !moCatalog || moCatalog.PrecioEditable !== 'NO';
            const priceDisabled = isLocked || !isPriceEditable;

            const row = document.createElement('div');
            row.className = 'item-row';

            row.style.gridTemplateColumns = '80px 2.2fr 1.3fr 0.8fr 1fr 1fr 50px';
            const currentTechId = item.Tecnico_ID || '';
            const tech = db.tecnicos.find(t => t.Tecnico_ID === currentTechId) || { Nombre_Completo: 'Sin Técnico' };
            const techOptions = '<option value="">-- Seleccione Técnico --</option>' + db.tecnicos.map(t => `<option value="${t.Tecnico_ID}" ${currentTechId === t.Tecnico_ID ? 'selected' : ''}>${t.Nombre_Completo}</option>`).join('');
            let techCol = isAdmin 
                ? `<div><select class="row-tech" data-type="labor" data-idx="${index}" style="padding: 0.25rem 0.35rem; font-size: 0.8rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%;" ${isLocked ? 'disabled' : ''}>${techOptions}</select></div>`
                : `<div><span class="badge-tag badge-secondary" style="font-size: 0.75rem;">${escapeHtml(tech.Nombre_Completo)}</span></div>`;

            row.innerHTML = html`
                <div><small class="text-muted">${escapeHtml(item.ID_ManoObra || 'MO')}</small></div>
                <div>
                    ${isPriceEditable ? safe(`
                        <input type="text" class="row-desc" data-type="labor" data-idx="${index}" value="${escapeHtml(item.Descripcion)}" style="padding: 0.35rem; width: 100%; font-weight: bold; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; box-sizing: border-box;" ${isLocked ? 'disabled' : ''}>
                    `) : safe(`
                        <strong>${escapeHtml(item.Descripcion)}</strong>
                    `)}
                </div>
                ${safe(techCol)}
                <div><input type="number" class="row-qty" data-type="labor" data-idx="${index}" value="${item.Cantidad}" min="1" style="padding: 0.35rem; width: 60px;" ${isLocked ? 'disabled' : ''}></div>
                <div><input type="number" class="row-price" data-type="labor" data-idx="${index}" value="${item.PrecioUnitario}" step="0.01" style="padding: 0.35rem; width: 80px; ${!isPriceEditable ? 'background:rgba(255,255,255,0.05); color:var(--text-muted); cursor:not-allowed;' : ''}" ${priceDisabled ? 'disabled title="Este precio es fijo (no editable)"' : ''}></div>
                <div style="text-align: right; font-weight: bold;">$ ${(parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1)).toFixed(2)}</div>
                <div><button class="icon-btn btn-danger delete-row-btn" data-type="labor" data-idx="${index}" style="width: 30px; height: 30px;" ${isLocked ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}><i class="fa-solid fa-trash"></i></button></div>
            `;
            laborContainer.appendChild(row);
        });

        if (habilitarRepuestosCliente) {
            const customerPartsContainer = document.getElementById('budget-customer-parts-rows');
            if (customerPartsContainer) {
                customerPartsContainer.innerHTML = '';
                tempRepuestosCliente.forEach((item, index) => {
                    const row = document.createElement('div');
                    row.className = 'item-row';
                    row.style.gridTemplateColumns = '2.2fr 1fr 50px';
                    row.innerHTML = html`
                        <div><input type="text" class="row-cust-desc" data-idx="${index}" value="${item.Descripcion || ''}" placeholder="Ej. Filtro de aceite marca K&N traído por cliente" style="padding: 0.35rem; width: 100%; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px;" ${isLocked ? 'disabled' : ''}></div>
                        <div><input type="number" class="row-cust-qty" data-idx="${index}" value="${item.Cantidad || 1}" min="1" style="padding: 0.35rem; width: 80px; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px;" ${isLocked ? 'disabled' : ''}></div>
                        <div><button class="icon-btn btn-danger delete-cust-row-btn" data-idx="${index}" style="width: 30px; height: 30px;" ${isLocked ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}><i class="fa-solid fa-trash"></i></button></div>
                    `;
                    customerPartsContainer.appendChild(row);
                });

                // Wire up change events for customer parts
                customerPartsContainer.querySelectorAll('.row-cust-desc').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const idx = parseInt(e.target.getAttribute('data-idx'));
                        tempRepuestosCliente[idx].Descripcion = e.target.value;
                        autoSaveBudget();
                    });
                });
                customerPartsContainer.querySelectorAll('.row-cust-qty').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const idx = parseInt(e.target.getAttribute('data-idx'));
                        tempRepuestosCliente[idx].Cantidad = parseInt(e.target.value) || 1;
                        autoSaveBudget();
                    });
                });
                customerPartsContainer.querySelectorAll('.delete-cust-row-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
                        tempRepuestosCliente.splice(idx, 1);
                        renderTempRows();
                        autoSaveBudget();
                    });
                });
            }
        }

        // Wire up change events
        document.querySelectorAll('.row-qty, .row-price').forEach(input => {
            input.addEventListener('change', (e) => {
                const type = e.target.getAttribute('data-type');
                const idx = parseInt(e.target.getAttribute('data-idx'));
                const val = parseFloat(e.target.value);
                const isQty = e.target.classList.contains('row-qty');

                if (type === 'product') {
                    if (isQty) tempProducts[idx].Cantidad = parseInt(val);
                    else tempProducts[idx].PrecioUnitario = val;
                } else {
                    if (isQty) tempLabor[idx].Cantidad = parseInt(val);
                    else tempLabor[idx].PrecioUnitario = val;
                }
                renderTempRows();
                calculateTotals();
                autoSaveBudget();
            });
        });

        // Wire up description change events
        document.querySelectorAll('.row-desc').forEach(input => {
            input.addEventListener('change', (e) => {
                const type = e.target.getAttribute('data-type');
                const idx = parseInt(e.target.getAttribute('data-idx'));
                const val = e.target.value;

                if (type === 'labor') {
                    tempLabor[idx].Descripcion = val;
                } else if (type === 'product') {
                    tempProducts[idx].Descripcion = val;
                }
                autoSaveBudget();
            });
        });

        // Wire up technician change events
        document.querySelectorAll('.row-tech').forEach(select => {
            select.addEventListener('change', (e) => {
                const type = e.target.getAttribute('data-type');
                const idx = parseInt(e.target.getAttribute('data-idx'));
                const val = e.target.value;
                
                if (type === 'product') {
                    tempProducts[idx].Tecnico_ID = val;
                } else {
                    tempLabor[idx].Tecnico_ID = val;
                }
                autoSaveBudget();
            });
        });

        // Wire up delete events
        document.querySelectorAll('.delete-row-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                const idx = parseInt(btn.getAttribute('data-idx'));

                if (type === 'product') {
                    tempProducts.splice(idx, 1);
                } else {
                    tempLabor.splice(idx, 1);
                }
                renderTempRows();
                calculateTotals();
                autoSaveBudget();
            });
        });
    }

    function calculateTotals() {
        let sumProd = 0;
        let sumLab = 0;
        
        tempProducts.forEach(p => sumProd += parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1));
        tempLabor.forEach(l => sumLab += parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1));
        
        const subtotal = sumProd + sumLab;
        
        // Find promotion
        const promoSelect = document.getElementById('editor-promocion-select');
        const selectedPromoId = promoSelect ? promoSelect.value : (budget.ID_Promocion || '');
        const promo = (db.promociones || []).find(p => p.ID_Promocion === selectedPromoId);
        
        let discount = 0;
        let promoRowHtml = '';
        if (promo) {
            if (promo.Tipo === 'desc_mano_obra') {
                discount = sumLab * (parseFloat(promo.Valor || 0) / 100);
                promoRowHtml = `<div class="summary-row" style="color: var(--warning);"><span>Desc. MO (${promo.Valor}%):</span><span>- $ ${discount.toFixed(2)}</span></div>`;
            } else if (promo.Tipo === 'desc_productos') {
                discount = sumProd * (parseFloat(promo.Valor || 0) / 100);
                promoRowHtml = `<div class="summary-row" style="color: var(--warning);"><span>Desc. Prod (${promo.Valor}%):</span><span>- $ ${discount.toFixed(2)}</span></div>`;
            } else if (promo.Tipo === 'monto_fijo') {
                discount = parseFloat(promo.Valor || 0);
                promoRowHtml = `<div class="summary-row" style="color: var(--warning);"><span>Descuento Fijo:</span><span>- $ ${discount.toFixed(2)}</span></div>`;
            }
        }
        discount = Math.min(discount, subtotal);
        budget.Descuento = discount;
        if (promoSelect) {
            budget.ID_Promocion = selectedPromoId;
        }
        
        const subtotalConDescuento = subtotal - discount;
        const taxRate = parseFloat(budget['% Impuesto'] || 0.13);
        
        const wsConfig = getWorkshopConfig(db);
        const preciosConIva = wsConfig.features && wsConfig.features.precios_con_iva === true;

        let iva = 0;
        let grandTotal = 0;
        let subtotalNetoDisp = subtotal;

        if (preciosConIva) {
            grandTotal = subtotalConDescuento;
            subtotalNetoDisp = grandTotal / 1.13;
            iva = grandTotal - subtotalNetoDisp;
        } else {
            iva = subtotalConDescuento * taxRate;
            grandTotal = subtotalConDescuento + iva;
            subtotalNetoDisp = subtotal;
        }
        
        const selectedClientCode = isNew ? document.getElementById('editor-client-select').value : budget.Codigo_Cliente;
        const selectedClient = db.clientes.find(c => c.Codigo_Cliente === selectedClientCode) || { AplicaPercepcion: 0, AplicaRetencion: 0 };
        
        document.getElementById('sum-products').textContent = '$' + sumProd.toFixed(2);
        document.getElementById('sum-labor').textContent = '$' + sumLab.toFixed(2);
        document.getElementById('subtotal-neto').textContent = '$' + subtotalNetoDisp.toFixed(2);
        
        const discountSection = document.getElementById('discount-section');
        if (discountSection) {
            discountSection.innerHTML = promoRowHtml;
        }
        
        document.getElementById('tax-iva').textContent = '$' + iva.toFixed(2);

        // Retention and Perception rules for El Salvador
        const retPerEl = document.getElementById('ret-per-section');
        retPerEl.innerHTML = '';
        
        const baseParaImpuestos = preciosConIva ? (subtotalConDescuento / 1.13) : subtotalConDescuento;

        if (selectedClient.AplicaPercepcion > 0) {
            const perc = baseParaImpuestos * parseFloat(selectedClient.AplicaPercepcion);
            grandTotal += perc;
            retPerEl.innerHTML += `<div class="summary-row"><span>Percepción (2%):</span><span style="color: var(--cyan);">+ $ ${perc.toFixed(2)}</span></div>`;
        }
        const isGranContrib = selectedClient['Categoría Contribuyente'] === 'GRANDE' || (selectedClient.AplicaRetencion > 0);
        if (isGranContrib && baseParaImpuestos >= 100.00) {
            const ret = baseParaImpuestos * 0.01;
            grandTotal -= ret;
            retPerEl.innerHTML += `<div class="summary-row"><span>Retención (1%):</span><span style="color: var(--warning);">- $ ${ret.toFixed(2)}</span></div>`;
        }

        document.getElementById('grand-total').textContent = '$' + grandTotal.toFixed(2);
    }

    // Product search modal triggers
    function openCreateProductModal(initialDesc, onCreated) {
        const modalId = 'create-custom-product-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const wsConfig = getWorkshopConfig(db);
        const preciosConIva = wsConfig.features && wsConfig.features.precios_con_iva === true;

        const newProdId = "PROD-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100);

        const modalHtml = html`
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:10000; backdrop-filter:blur(4px);">
                <div class="glass-card" style="width:480px; padding:2rem; border:1px solid var(--border-color); box-shadow:0 20px 40px rgba(0,0,0,0.5);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                        <h3 style="margin:0; color:var(--primary);"><i class="fa-solid fa-plus-circle"></i> Registrar Nuevo Repuesto</h3>
                        <button id="close-create-prod-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                    </div>

                    <form id="create-prod-form" style="display:flex; flex-direction:column; gap:1rem; font-size:0.9rem;">
                        <div class="form-group">
                            <label>Código de Producto / Repuesto</label>
                            <input type="text" id="new-prod-id" required value="${newProdId}" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Descripción / Nombre</label>
                            <input type="text" id="new-prod-desc" required value="${escapeHtml(initialDesc)}" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                            <div class="form-group">
                                <label>Marca</label>
                                <input type="text" id="new-prod-brand" value="Genérico" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                            </div>
                            <div class="form-group">
                                <label>Unidad de Medida</label>
                                <select id="new-prod-unit" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:36px; width:100%;">
                                    <option value="Pza" selected>Pieza (Pza)</option>
                                    <option value="Ltr">Litro (Ltr)</option>
                                    <option value="Gal">Galón (Gal)</option>
                                    <option value="Jgo">Juego (Jgo)</option>
                                    <option value="Kit">Kit</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                            <div class="form-group">
                                <label>${preciosConIva ? 'Precio Venta (Con IVA)' : 'Precio Venta ($)'}</label>
                                <input type="number" id="new-prod-price-sell" required value="15.00" step="0.01" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                            </div>
                            <div class="form-group">
                                <label>Precio Costo ($)</label>
                                <input type="number" id="new-prod-price-cost" required value="10.00" step="0.01" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Existencia Inicial (Stock)</label>
                            <input type="number" id="new-prod-stock" required value="0" min="0" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:1rem; border-top:1px solid var(--border-color); padding-top:1.25rem; margin-top:0.5rem;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-create-prod" style="padding:0.5rem 1rem;">Cancelar</button>
                            <button type="submit" class="btn btn-primary" style="padding:0.5rem 1.25rem;"><i class="fa-solid fa-check"></i> Guardar y Añadir</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const closeModal = () => document.getElementById(modalId).remove();
        document.getElementById('close-create-prod-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel-create-prod').addEventListener('click', closeModal);

        document.getElementById('create-prod-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('new-prod-id').value.trim();
            const desc = document.getElementById('new-prod-desc').value.trim();
            const brand = document.getElementById('new-prod-brand').value.trim();
            const unit = document.getElementById('new-prod-unit').value;
            const priceSell = parseFloat(document.getElementById('new-prod-price-sell').value) || 0;
            const priceCost = parseFloat(document.getElementById('new-prod-price-cost').value) || 0;
            const stock = parseFloat(document.getElementById('new-prod-stock').value) || 0;

            if (db.productos.some(p => p['ID_ Producto'] === code)) {
                showToast("Ya existe un producto con este código de repuesto", "danger");
                return;
            }

            const finalPrecioBase = preciosConIva ? parseFloat((priceSell / 1.13).toFixed(4)) : priceSell;
            const finalPrecioIvaInc = preciosConIva ? priceSell : parseFloat((priceSell * 1.13).toFixed(2));

            const newProd = {
                'ID_ Producto': code,
                Descripcion: desc,
                Marca: brand,
                'Unidad de Medida': unit,
                'Precio Compra': priceCost,
                'Precio Costo': priceCost,
                'Precio Venta': finalPrecioBase,
                'Precio Unit': finalPrecioBase,
                'Precio Venta Unit Iva Inc': finalPrecioIvaInc,
                'Precio Unit Iva Inc': finalPrecioIvaInc,
                Minimos: stock,
                Presentacion: unit === 'Pza' ? 'Unidad' : unit
            };

            db.productos.unshift(newProd);
            saveDatabase(db);
            closeModal();

            onCreated(newProd);
        });
    }

    function openCreateLaborModal(initialDesc, onCreated) {
        const modalId = 'create-custom-labor-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const wsConfig = getWorkshopConfig(db);
        const preciosConIva = wsConfig.features && wsConfig.features.precios_con_iva === true;

        const newMoId = "MO-" + Math.floor(Date.now() / 1000).toString().substring(4) + "-" + Math.floor(Math.random()*10);

        const modalHtml = html`
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:10000; backdrop-filter:blur(4px);">
                <div class="glass-card" style="width:450px; padding:2rem; border:1px solid var(--border-color); box-shadow:0 20px 40px rgba(0,0,0,0.5);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                        <h3 style="margin:0; color:var(--primary);"><i class="fa-solid fa-plus-circle"></i> Registrar Nueva Mano de Obra</h3>
                        <button id="close-create-labor-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                    </div>

                    <form id="create-labor-form" style="display:flex; flex-direction:column; gap:1rem; font-size:0.9rem;">
                        <div class="form-group">
                            <label>Código del Servicio</label>
                            <input type="text" id="new-mo-id" required value="${newMoId}" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Descripción / Nombre del Servicio</label>
                            <input type="text" id="new-mo-desc" required value="${escapeHtml(initialDesc)}" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>${preciosConIva ? 'Precio Unitario (Con IVA)' : 'Precio Base ($)'}</label>
                            <input type="number" id="new-mo-price" required value="10.00" step="0.01" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>¿Precio Editable en Presupuestos?</label>
                            <select id="new-mo-editable" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:36px; width:100%;">
                                <option value="SI" selected>Sí, se puede cambiar el precio en cada cotización</option>
                                <option value="NO">No, el precio es fijo</option>
                            </select>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:1rem; border-top:1px solid var(--border-color); padding-top:1.25rem; margin-top:0.5rem;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-create-labor" style="padding:0.5rem 1rem;">Cancelar</button>
                            <button type="submit" class="btn btn-primary" style="padding:0.5rem 1.25rem;"><i class="fa-solid fa-check"></i> Guardar y Añadir</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const closeModal = () => document.getElementById(modalId).remove();
        document.getElementById('close-create-labor-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel-create-labor').addEventListener('click', closeModal);

        document.getElementById('create-labor-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('new-mo-id').value.trim();
            const desc = document.getElementById('new-mo-desc').value.trim();
            const price = parseFloat(document.getElementById('new-mo-price').value) || 0;
            const editable = document.getElementById('new-mo-editable').value;

            if (db.mano_obra.some(m => m.ID_ManoObra === code)) {
                showToast("Ya existe un servicio con este código", "danger");
                return;
            }

            const finalPrecioBase = preciosConIva ? parseFloat((price / 1.13).toFixed(4)) : price;
            const finalPrecioIvaInc = preciosConIva ? price : parseFloat((price * 1.13).toFixed(2));

            const newMo = {
                ID_ManoObra: code,
                Descripcion: desc,
                PrecioUnitario: finalPrecioBase,
                PrecioUnitarioIvaInc: finalPrecioIvaInc,
                PrecioEditable: editable
            };

            db.mano_obra.unshift(newMo);
            saveDatabase(db);
            closeModal();

            onCreated(newMo);
        });
    }

    document.getElementById('add-prod-item-btn').addEventListener('click', () => {
        prodModal.classList.add('active');
        searchProdInput.value = '';
        populateProdCatalog();
    });
    document.getElementById('close-item-prod-modal').addEventListener('click', () => prodModal.classList.remove('active'));

    if (habilitarRepuestosCliente) {
        const addCustBtn = document.getElementById('add-customer-part-btn');
        if (addCustBtn) {
            addCustBtn.addEventListener('click', () => {
                tempRepuestosCliente.push({ Descripcion: '', Cantidad: 1 });
                renderTempRows();
                autoSaveBudget();
            });
        }
    }

    function populateProdCatalog(filter = '') {
        prodResults.innerHTML = '';
        const filtered = db.productos.filter(p => 
            (p.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
            (p['ID_ Producto'] || '').toLowerCase().includes(filter.toLowerCase())
        );

        const wsConfig = getWorkshopConfig(db);
        const preciosConIva = wsConfig.features && wsConfig.features.precios_con_iva === true;

        filtered.slice(0, 10).forEach(p => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const displayPrice = preciosConIva
                ? parseFloat(p['Precio Unit Iva Inc'] || p['Precio Venta Unit Iva Inc'] || ((p['Precio Unit'] || p['Precio Venta'] || 0) * 1.13))
                : parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0);

            item.innerHTML = html`
                <div class="list-item-main">
                    <span class="list-item-title">${p.Descripcion}</span>
                    <span class="list-item-subtitle">Código: ${p['ID_ Producto']} • Unitario: $${displayPrice.toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-add" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i></button>
            `;
            
            item.querySelector('.btn-add').addEventListener('click', () => {
                const activeUser = getActiveUser();
                const defaultTechId = (activeUser && activeUser.Tecnico_ID) ? activeUser.Tecnico_ID : (budget.Tecnico_Asignado || '');
                tempProducts.push({
                    DPP: "DETPP-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                    'ID_Presupuesto DPP': budget['ID Presupuesto'],
                    'ID_Producto DPP': p['ID_ Producto'],
                    Descripcion: p.Descripcion,
                    Cantidad: 1,
                    UnidadMedida: p['Unidad de Medida'] || 'Pza',
                    PrecioUnitario: displayPrice,
                    ImpuestoCodigo: 'IVA13',
                    Tecnico_ID: defaultTechId
                });
                renderTempRows();
                calculateTotals();
                autoSaveBudget();
                prodModal.classList.remove('active');
                showToast("Repuesto añadido al presupuesto", "success");
            });
            prodResults.appendChild(item);
        });

        // Fallback or Option to create a new product via modal if search term is provided
        if (filter.trim().length > 1) {
            const createItem = document.createElement('div');
            createItem.className = 'list-item';
            createItem.style.background = 'rgba(110, 68, 255, 0.08)';
            createItem.style.border = '1px dashed var(--primary)';
            createItem.style.marginTop = '0.75rem';
            createItem.style.borderRadius = '6px';
            createItem.style.display = 'flex';
            createItem.style.justifyContent = 'space-between';
            createItem.style.alignItems = 'center';
            createItem.style.padding = '0.75rem 1rem';
            createItem.innerHTML = html`
                <div class="list-item-main">
                    <span class="list-item-title" style="color:var(--primary); font-weight:700;"><i class="fa-solid fa-circle-plus"></i> ¿Registrar nuevo repuesto?</span>
                    <span class="list-item-subtitle" style="font-style:italic;">"${escapeHtml(filter)}"</span>
                </div>
                <button type="button" class="btn btn-primary btn-open-create-prod" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; font-weight:600;"><i class="fa-solid fa-plus"></i> Registrar</button>
            `;
            
            createItem.querySelector('.btn-open-create-prod').addEventListener('click', () => {
                openCreateProductModal(filter.trim(), (newProd) => {
                    const activeUser = getActiveUser();
                    const defaultTechId = (activeUser && activeUser.Tecnico_ID) ? activeUser.Tecnico_ID : (budget.Tecnico_Asignado || '');
                    
                    const addedPrice = preciosConIva
                        ? parseFloat(newProd['Precio Unit Iva Inc'] || newProd['Precio Venta Unit Iva Inc'] || 0)
                        : parseFloat(newProd['Precio Unit'] || newProd['Precio Venta'] || 0);

                    tempProducts.push({
                        DPP: "DETPP-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                        'ID_Presupuesto DPP': budget['ID Presupuesto'],
                        'ID_Producto DPP': newProd['ID_ Producto'],
                        Descripcion: newProd.Descripcion,
                        Cantidad: 1,
                        UnidadMedida: newProd['Unidad de Medida'],
                        PrecioUnitario: addedPrice,
                        ImpuestoCodigo: 'IVA13',
                        Tecnico_ID: defaultTechId
                    });
                    
                    renderTempRows();
                    calculateTotals();
                    autoSaveBudget();
                    prodModal.classList.remove('active');
                    showToast(`Repuesto "${newProd.Descripcion}" creado y añadido`, "success");
                });
            });
            prodResults.appendChild(createItem);
        }
    }

    searchProdInput.addEventListener('input', (e) => populateProdCatalog(e.target.value));

    // Labor search modal triggers
    document.getElementById('add-labor-item-btn').addEventListener('click', () => {
        laborModal.classList.add('active');
        searchLaborInput.value = '';
        populateLaborCatalog();
    });
    document.getElementById('close-item-labor-modal').addEventListener('click', () => laborModal.classList.remove('active'));

    function populateLaborCatalog(filter = '') {
        laborResults.innerHTML = '';
        const filtered = db.mano_obra.filter(mo => 
            (mo.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
            (mo.ID_ManoObra || '').toString().includes(filter)
        );

        const wsConfig = getWorkshopConfig(db);
        const preciosConIva = wsConfig.features && wsConfig.features.precios_con_iva === true;

        filtered.slice(0, 10).forEach(mo => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const displayPrice = preciosConIva
                ? parseFloat(mo.PrecioUnitarioIvaInc || ((mo.PrecioUnitario || 0) * 1.13))
                : parseFloat(mo.PrecioUnitario || 0);

            item.innerHTML = html`
                <div class="list-item-main">
                    <span class="list-item-title">${mo.Descripcion}</span>
                    <span class="list-item-subtitle">Servicio: ${mo.ID_ManoObra} • ${preciosConIva ? 'Unitario (Con IVA)' : 'Base'}: $${displayPrice.toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-add" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i></button>
            `;
            
            item.querySelector('.btn-add').addEventListener('click', () => {
                const activeUser = getActiveUser();
                const defaultTechId = (activeUser && activeUser.Tecnico_ID) ? activeUser.Tecnico_ID : (budget.Tecnico_Asignado || '');
                tempLabor.push({
                    ID_DetalleMO: "DETMO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                    'ID_Presupuesto MO': budget['ID Presupuesto'],
                    ID_ManoObra: mo.ID_ManoObra,
                    Descripcion: mo.Descripcion,
                    Cantidad: 1,
                    PrecioUnitario: displayPrice,
                    FechaCreacion: Date.now(),
                    Tecnico_ID: defaultTechId
                });
                renderTempRows();
                calculateTotals();
                autoSaveBudget();
                laborModal.classList.remove('active');
                showToast("Servicio añadido al presupuesto", "success");
            });
            laborResults.appendChild(item);
        });

        // Fallback or Option to create a new labor service via modal if search term is provided
        if (filter.trim().length > 1) {
            const createItem = document.createElement('div');
            createItem.className = 'list-item';
            createItem.style.background = 'rgba(110, 68, 255, 0.08)';
            createItem.style.border = '1px dashed var(--primary)';
            createItem.style.marginTop = '0.75rem';
            createItem.style.borderRadius = '6px';
            createItem.style.display = 'flex';
            createItem.style.justifyContent = 'space-between';
            createItem.style.alignItems = 'center';
            createItem.style.padding = '0.75rem 1rem';
            createItem.innerHTML = html`
                <div class="list-item-main">
                    <span class="list-item-title" style="color:var(--primary); font-weight:700;"><i class="fa-solid fa-circle-plus"></i> ¿Registrar nuevo servicio?</span>
                    <span class="list-item-subtitle" style="font-style:italic;">"${escapeHtml(filter)}"</span>
                </div>
                <button type="button" class="btn btn-primary btn-open-create-labor" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; font-weight:600;"><i class="fa-solid fa-plus"></i> Registrar</button>
            `;
            
            createItem.querySelector('.btn-open-create-labor').addEventListener('click', () => {
                openCreateLaborModal(filter.trim(), (newMo) => {
                    const activeUser = getActiveUser();
                    const defaultTechId = (activeUser && activeUser.Tecnico_ID) ? activeUser.Tecnico_ID : (budget.Tecnico_Asignado || '');
                    
                    const addedPrice = preciosConIva
                        ? parseFloat(newMo.PrecioUnitarioIvaInc || 0)
                        : parseFloat(newMo.PrecioUnitario || 0);

                    tempLabor.push({
                        ID_DetalleMO: "DETMO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                        'ID_Presupuesto MO': budget['ID Presupuesto'],
                        ID_ManoObra: newMo.ID_ManoObra,
                        Descripcion: newMo.Descripcion,
                        Cantidad: 1,
                        PrecioUnitario: addedPrice,
                        FechaCreacion: Date.now(),
                        Tecnico_ID: defaultTechId
                    });
                    
                    renderTempRows();
                    calculateTotals();
                    autoSaveBudget();
                    laborModal.classList.remove('active');
                    showToast(`Servicio "${newMo.Descripcion}" creado y añadido`, "success");
                });
            });
            laborResults.appendChild(createItem);
        }
    }

    searchLaborInput.addEventListener('input', (e) => populateLaborCatalog(e.target.value));

    // Save budget changes helper
    const saveBudget = (newState = null) => {
        if (isNew) {
            const clientSelect = document.getElementById('editor-client-select');
            const vehicleSelect = document.getElementById('editor-vehicle-select');
            if (!clientSelect.value || !vehicleSelect.value) {
                showToast("Debes seleccionar un cliente y un vehículo", "danger");
                return;
            }
            budget.Kilometraje = document.getElementById('editor-odo').value;
        }

        // Save headers
        budget.Fallas_Detectadas = document.getElementById('editor-fallas').value;
        const obsEl = document.getElementById('editor-observaciones');
        if (obsEl) {
            budget.Observaciones = obsEl.value;
        }
        budget.Tecnico_Asignado = document.getElementById('editor-tech-select').value;
        const advisorSelect = document.getElementById('editor-advisor-select');
        if (advisorSelect) {
            budget.Asesor_Asignado = advisorSelect.value;
        }
        const poEl = document.getElementById('editor-purchase-order');
        if (poEl) {
            budget.Orden_Compra = poEl.value.trim().toUpperCase();
        }
        
        // Validate technician assignment on every row if in Detailed Commission model (unless rejecting)
        const config = getWorkshopConfig(db);
        if (config.tipo_comision === 'detallada' && newState !== 4) {
            const hasEmptyProductTech = tempProducts.some(dp => !dp.Tecnico_ID);
            const hasEmptyLaborTech = tempLabor.some(dm => !dm.Tecnico_ID);
            if (hasEmptyProductTech || hasEmptyLaborTech) {
                showToast("En modo de Comisión Detallada, es obligatorio asignar un técnico a cada fila de repuestos y servicios", "danger");
                return;
            }
        }
        
        // Use explicit newState if provided to bypass disabled select/option browser limits
        if (newState !== null) {
            budget.Estado = newState;
            const stateSelect = document.getElementById('editor-state');
            if (stateSelect) {
                stateSelect.disabled = false;
                Array.from(stateSelect.options).forEach(opt => opt.disabled = false);
                stateSelect.value = newState.toString();
            }
        } else {
            budget.Estado = parseInt(document.getElementById('editor-state').value);
        }
        
        // Save details
        db.detalle_productos = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] !== budget['ID Presupuesto']).concat(tempProducts);
        db.detalle_mano_obra = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] !== budget['ID Presupuesto']).concat(tempLabor);
        if (habilitarRepuestosCliente) {
            budget.Repuestos_Cliente = tempRepuestosCliente;
        }
        
        if (isNew) {
            const exists = db.presupuestos.some(b => b['ID Presupuesto'] === budget['ID Presupuesto']);
            if (!exists) {
                db.presupuestos.unshift(budget);
            }
        }

        // Save to LocalStorage
        saveDatabase(db);
        showToast("Presupuesto guardado correctamente", "success");
        
        // Dynamic redirection based on new state
        if (budget.Estado === 5) {
            window.location.hash = '#facturador';
        } else if (budget.Estado === 2) {
            window.location.hash = '#kanban';
        } else {
            window.location.hash = '#presupuestos';
        }
    };

    document.getElementById('save-budget-btn').addEventListener('click', () => saveBudget(null));

    const approveBtn = document.getElementById('approve-budget-shortcut-btn');
    if (approveBtn) {
        approveBtn.addEventListener('click', () => {
            saveBudget(2);
        });
    }

    const rejectBtn = document.getElementById('reject-budget-shortcut-btn');
    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
            if (confirm("¿Estás seguro de que deseas rechazar esta cotización? El auto pasará al estado de salida/anulado.")) {
                saveBudget(4);
            }
        });
    }

    const finalizeBtn = document.getElementById('finalize-work-btn');
    if (finalizeBtn) {
        finalizeBtn.addEventListener('click', () => {
            if (confirm("¿Confirmas que los trabajos físicos han sido finalizados y el presupuesto está listo para facturar?")) {
                saveBudget(5);
            }
        });
    }

    const revertDraftBtn = document.getElementById('revert-to-draft-btn');
    if (revertDraftBtn) {
        revertDraftBtn.addEventListener('click', () => {
            if (confirm("¿Deseas devolver este presupuesto al estado inicial (Borrador)? Se desbloqueará el presupuesto para que puedas realizar modificaciones o anularlo.")) {
                saveBudget(1);
            }
        });
    }

    const reopenBtn = document.getElementById('reopen-work-btn');
    if (reopenBtn) {
        reopenBtn.addEventListener('click', () => {
            if (confirm("¿Deseas reabrir la orden de reparación en el taller? El auto volverá al estado 'Trabajando'.")) {
                saveBudget(2);
            }
        });
    }

    if (document.getElementById('facturar-budget-shortcut-btn')) {
        document.getElementById('facturar-budget-shortcut-btn').addEventListener('click', () => {
            window.location.hash = `#facturador?presId=${budget['ID Presupuesto']}`;
        });
    }

    if (document.getElementById('recover-budget-btn')) {
        document.getElementById('recover-budget-btn').addEventListener('click', () => {
            if (confirm("¿Estás seguro de que deseas recuperar este presupuesto anulado? Se borrarán sus datos de emisión anteriores y volverá al estado inicial (Borrador) para que pueda editarlo o aprobarlo nuevamente.")) {
                budget.Estado = 1; // Revert to Borrador
                delete budget.Anulado;
                delete budget.Fecha_Anulacion;
                delete budget.controlNumber;
                delete budget.mhControlNumber;
                delete budget.receptionSeal;
                delete budget.Doc_a_Emitir;
                delete budget.Fecha_Facturacion;
                delete budget.Condicion;
                saveDatabase(db);
                showToast("Presupuesto recuperado al estado inicial (Borrador) y listo para editar o aprobar.", "success");
                window.location.hash = '#presupuestos';
            }
        });
    }

    if (document.getElementById('print-budget-btn')) {
        document.getElementById('print-budget-btn').addEventListener('click', () => {
            exportBudgetPDF(budget['ID Presupuesto']);
        });
    }

    // Run loaders
    renderTempRows();
    calculateTotals();

    // Wire up header listeners to auto-save on change/input
    const odoEl = document.getElementById('editor-odo');
    if (odoEl) odoEl.addEventListener('change', autoSaveBudget);
    
    const techEl = document.getElementById('editor-tech-select');
    if (techEl) techEl.addEventListener('change', autoSaveBudget);

    const advisorEl = document.getElementById('editor-advisor-select');
    if (advisorEl) advisorEl.addEventListener('change', autoSaveBudget);
    
    const poEl = document.getElementById('editor-purchase-order');
    if (poEl) {
        poEl.addEventListener('input', autoSaveBudget);
        poEl.addEventListener('change', autoSaveBudget);
    }
    
    const fallasEl = document.getElementById('editor-fallas');
    if (fallasEl) {
        fallasEl.addEventListener('input', autoSaveBudget);
        fallasEl.addEventListener('change', autoSaveBudget);
    }
    
    const obsEl = document.getElementById('editor-observaciones');
    if (obsEl) {
        obsEl.addEventListener('input', autoSaveBudget);
        obsEl.addEventListener('change', autoSaveBudget);
    }
    
    const stateEl = document.getElementById('editor-state');
    if (stateEl) stateEl.addEventListener('change', autoSaveBudget);

    const promoEl = document.getElementById('editor-promocion-select');
    if (promoEl) {
        promoEl.addEventListener('change', () => {
            calculateTotals();
            autoSaveBudget();
        });
    }
}

// 5. KANBAN BOARD VIEW


function numeroALetras(num) {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const diezADiecinueve = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISITE', 'DIECIOCHO', 'DIECINUEVE'];
    const veintiunoAVeintinueve = ['VEINTE', 'VEINTIUNO', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    function convertirGrupo(n) {
        let output = '';
        if (n >= 100) {
            if (n === 100) return 'CIEN ';
            output += centenas[Math.floor(n / 100)] + ' ';
            n %= 100;
        }
        if (n >= 20) {
            if (n >= 20 && n <= 29) {
                output += veintiunoAVeintinueve[n - 20] + ' ';
            } else {
                output += decenas[Math.floor(n / 10)] + ' ';
                n %= 10;
                if (n > 0) {
                    output += 'Y ' + unidades[n] + ' ';
                }
            }
        } else if (n >= 10) {
            output += diezADiecinueve[n - 10] + ' ';
        } else if (n > 0) {
            output += unidades[n] + ' ';
        }
        return output;
    }

    if (num === 0) return 'CERO CON 00/100 DÓLARES';
    
    let entero = Math.floor(num);
    let decimales = Math.round((num - entero) * 100);
    let letras = '';

    if (entero >= 1000000) {
        let millones = Math.floor(entero / 1000000);
        if (millones === 1) {
            letras += 'UN MILLÓN ';
        } else {
            letras += convertirGrupo(millones) + 'MILLONES ';
        }
        entero %= 1000000;
    }

    if (entero >= 1000) {
        let miles = Math.floor(entero / 1000);
        if (miles === 1) {
            letras += 'MIL ';
        } else {
            letras += convertirGrupo(miles) + 'MIL ';
        }
        entero %= 1000;
    }

    if (entero > 0) {
        letras += convertirGrupo(entero);
    }

    const centavos = (decimales < 10 ? '0' : '') + decimales;
    return `${letras.trim()} CON ${centavos}/100 DÓLARES`;
}

// Format 1: Clásico Mecanic OS


function getClasicoMecanicOSHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab, discount = 0) {
    const productsHTML = products.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px;">No se cotizan repuestos y lubricantes</td></tr>'
        : products.map(p => `
            <tr>
                <td style="text-align: center; width: 8%;">${p.Cantidad}</td>
                <td style="width: 62%;">${p.Descripcion}</td>
                <td style="text-align: right; width: 15%;">$ ${parseFloat(p.PrecioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; width: 15%;">$ ${(parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

    const laborHTML = labor.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px;">No se cotiza mano de obra</td></tr>'
        : labor.map(l => `
            <tr>
                <td style="text-align: center; width: 8%;">${l.Cantidad}</td>
                <td style="width: 62%;">${l.Descripcion}</td>
                <td style="text-align: right; width: 15%;">$ ${parseFloat(l.PrecioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
                <td style="text-align: right; width: 15%;">$ ${(parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

    let percRow = '';
    if (percVal > 0) {
        percRow = `
            <tr>
                <td class="totals-label">(+) IVA PERCIBIDO</td>
                <td class="totals-val">$ ${percVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let retRow = '';
    if (retVal > 0) {
        retRow = `
            <tr>
                <td class="totals-label">(-) IVA RETENIDO</td>
                <td class="totals-val">$ ${retVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Orden de Trabajo - ${budget['ID Presupuesto']}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: ${ws.color_presupuesto || '#1e293b'};
            --secondary-color: #475569;
            --bg-label: #dce2e6;
            --border-color: #b0b8c0;
            --text-color: #000;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--text-color);
            background-color: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .no-print-toolbar {
            background-color: #1e293b;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #fff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .no-print-toolbar h3 {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 1.15rem;
            font-weight: 600;
        }
        .toolbar-buttons {
            display: flex;
            gap: 12px;
        }
        .btn-action {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .btn-print {
            background-color: #10b981;
            color: #fff;
        }
        .btn-print:hover {
            background-color: #059669;
        }
        .btn-close {
            background-color: #64748b;
            color: #fff;
        }
        .btn-close:hover {
            background-color: #475569;
        }

        .page-container {
            width: 820px;
            margin: 30px auto;
            background-color: #fff;
            padding: 40px;
            box-sizing: border-box;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border-radius: 8px;
        }

        .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
        }
        .company-details {
            max-width: 500px;
        }
        .company-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 1.5rem;
            margin: 0 0 6px 0;
            color: var(--primary-color);
            letter-spacing: -0.02em;
        }
        .company-info {
            font-size: 0.85rem;
            line-height: 1.5;
            color: #334155;
        }
        .company-email {
            color: #0b5ed7;
            text-decoration: none;
            font-weight: 600;
        }
        .company-email:hover {
            text-decoration: underline;
        }
        .logo-container {
            width: 220px;
            text-align: center;
        }

        .document-title {
            text-align: right;
            font-family: 'Outfit', sans-serif;
            font-size: 1.25rem;
            font-weight: 500;
            color: #64748b;
            letter-spacing: 0.08em;
            margin: 10px 0 15px 0;
            text-transform: uppercase;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            margin-bottom: 20px;
        }
        table, th, td {
            border: 1px solid var(--border-color);
        }

        .meta-table td {
            padding: 6px 10px;
            vertical-align: middle;
        }
        .meta-label {
            background-color: var(--bg-label);
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.72rem;
            width: 18%;
            text-align: center;
            color: #1e293b;
        }
        .meta-val {
            background-color: #fff;
            width: 32%;
            font-size: 0.8rem;
            color: #0f172a;
        }

        .section-title-bar {
            background-color: var(--primary-color);
            color: #fff;
            text-align: center;
            font-family: 'Outfit', sans-serif;
            font-size: 0.8rem;
            font-weight: 700;
            padding: 6px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .section-desc-box {
            border: 1px solid var(--border-color);
            border-top: none;
            padding: 10px 15px;
            min-height: 40px;
            font-size: 0.85rem;
            margin-bottom: 25px;
            background-color: #fff;
            color: #1e293b;
            border-radius: 0 0 4px 4px;
        }

        .data-table th {
            background-color: var(--primary-color);
            color: #ffffff;
            font-weight: 700;
            text-align: center;
            padding: 8px;
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }
        .data-table td {
            padding: 8px 10px;
            font-size: 0.82rem;
            color: #1e293b;
        }
        .table-footer-row {
            background-color: var(--primary-color);
            font-weight: bold;
            font-size: 0.8rem;
        }
        .table-footer-row td {
            color: #ffffff !important;
            padding: 8px 10px;
        }

        .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 25px;
            page-break-inside: avoid;
        }
        .auth-box {
            width: 55%;
            border: 1.5px solid var(--border-color);
            padding: 15px;
            box-sizing: border-box;
            border-radius: 6px;
            min-height: 120px;
            font-size: 0.8rem;
            background-color: #fff;
        }
        .auth-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 30px;
            color: #0f172a;
            font-size: 0.75rem;
            letter-spacing: 0.04em;
        }
        .auth-line {
            border-bottom: 1.5px dashed var(--border-color);
            margin-top: 20px;
            width: 80%;
        }

        .totals-table {
            width: 40%;
            margin-bottom: 0;
        }
        .totals-table td {
            padding: 6px 10px;
        }
        .totals-label {
            background-color: var(--bg-label);
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.72rem;
            width: 50%;
            text-align: center;
            color: #0f172a;
        }
        .totals-val {
            text-align: right;
            font-size: 0.85rem;
            width: 50%;
            color: #1e293b;
        }
        .grand-total-row {
            font-weight: bold;
            font-size: 1rem;
        }

        @media print {
            body {
                background-color: #fff;
                color: #000;
            }
            .no-print-toolbar {
                display: none !important;
            }
            .page-container {
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border-radius: 0;
            }
            @page {
                size: portrait;
                margin: 1.2cm;
            }
        }
    </style>
</head>
<body>

    <div class="no-print-toolbar">
        <h3>Vista Previa de Impresión - Mecanic OS</h3>
        <div class="toolbar-buttons">
            <button class="btn-action btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir o Guardar PDF</button>
            <button class="btn-action btn-close" onclick="window.close()"><i class="fa-solid fa-xmark"></i> Cerrar Vista Previa</button>
        </div>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="pdf-header">
            <div class="company-details">
                <h1 class="company-title">${ws.nombre_comercial || ws.nombre}</h1>
                <div class="company-info">
                    ${ws.nombre_comercial && ws.nombre_comercial !== ws.nombre ? `Razón Social: ${ws.nombre}<br>` : ''}
                    Dirección: ${ws.direccion || ''}${ws.municipio || ws.departamento || ws.pais ? `, ${[ws.municipio, ws.departamento, ws.pais].filter(Boolean).join(', ')}` : ''}<br>
                    Tel: ${ws.telefono} | Correo: <a href="mailto:${ws.correo}" class="company-email">${ws.correo}</a><br>
                    ${ws.tipo_documento || 'NIT'}: ${ws.num_documento || ws.nit || ''} ${ws.nrc ? ` | NRC: ${ws.nrc}` : ''}<br>
                    Giro: ${ws.actividad_economica || ws.giro || 'Servicios Automotrices'}
                </div>
            </div>
            <div class="logo-container" style="display: flex; justify-content: center; align-items: center; min-height: 90px;">
                ${safe(ws.logo ? `
                    <img src="${ws.logo}" style="max-width: 220px; max-height: 90px; object-fit: contain; border-radius: 4px;" />
                ` : `
                    <svg width="220" height="90" viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="218" height="88" rx="8" fill="#f8fafc" stroke="#b0b8c0" stroke-width="1.2"/>
                        <path d="M10,75 L210,75 M10,79 L210,79" stroke="#64748b" stroke-width="0.8" stroke-dasharray="2,2"/>
                        <g transform="translate(14, 16) scale(0.052)" fill="#1e293b">
                            <path d="M190 280 L160 210 Q150 190 130 190 L60 190 Q40 190 30 210 L5 280 L5 360 L190 360 Z M190 360 M120 220 L70 220 L70 260 L120 260 Z" fill="#64748b"/>
                            <circle cx="50" cy="370" r="22"/>
                            <circle cx="150" cy="370" r="22"/>
                            <path d="M420 250 L380 160 Q360 130 330 130 L230 130 Q200 130 180 160 L140 250 L140 370 L420 370 Z M280 170 L210 170 L210 220 L280 220 Z M370 170 L300 170 L300 220 L370 220 Z" fill="#1e293b"/>
                            <circle cx="210" cy="385" r="28"/>
                            <circle cx="350" cy="385" r="28"/>
                        </g>
                        <text x="76" y="24" font-family="'Outfit', sans-serif" font-size="11.5" font-weight="800" fill="#1e293b">${ws.logoText || 'TALLER'}</text>
                        <text x="76" y="37" font-family="'Outfit', sans-serif" font-size="9" font-weight="700" fill="#64748b">${ws.nombre.includes('C.V.') || ws.nombre.includes('c.v.') ? 'S.A. DE C.V.' : ''}</text>
                        <text x="76" y="55" font-family="'Inter', sans-serif" font-size="6" font-weight="600" fill="#1e293b">${(ws.logoTagline || '').toUpperCase()}</text>
                        <text x="76" y="65" font-family="'Inter', sans-serif" font-size="5.5" font-weight="600" fill="#64748b">${(ws.giro || '').substring(0, 50).toUpperCase()}</text>
                    </svg>
                `)}
            </div>
        </div>

        <div class="document-title">Orden de Trabajo</div>

        <!-- Meta Grid -->
        <table class="meta-table">
            <tr>
                <td class="meta-label">Cliente</td>
                <td class="meta-val">${budget.Nombre}</td>
                <td class="meta-label">Placa</td>
                <td class="meta-val">${vehicle.Placas || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Teléfono</td>
                <td class="meta-val">${budget['Telefono 1 '] || client['Telefono 1 '] || 'N/A'}</td>
                <td class="meta-label">Condición</td>
                <td class="meta-val">${budget.Condicion || (client['Credito?'] === 'SI' ? 'CREDITO' : 'CONTADO')}</td>
            </tr>
            <tr>
                <td class="meta-label">Fecha Ingreso</td>
                <td class="meta-val">${new Date(budget.Fecha).toLocaleDateString('es-SV')}</td>
                <td class="meta-label">Fecha Prometida</td>
                <td class="meta-val">${budget['Fecha Prometida'] ? new Date(budget['Fecha Prometida']).toLocaleDateString('es-SV') : new Date(budget.Fecha + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('es-SV')}</td>
            </tr>
            <tr>
                <td class="meta-label">V I N</td>
                <td class="meta-val">${vehicle.Nª_VIN || 'N/A'}</td>
                <td class="meta-label">Marca</td>
                <td class="meta-val">${vehicle.Marca || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Odómetro</td>
                <td class="meta-val">${budget.Kilometraje || vehicle.Odometro || '0'}</td>
                <td class="meta-label">Modelo</td>
                <td class="meta-val">${vehicle.Modelo || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Motor</td>
                <td class="meta-val">${vehicle.Nª_Motor || 'N/A'}</td>
                <td class="meta-label">Año</td>
                <td class="meta-val">${vehicle.Año || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Nº Equipo</td>
                <td class="meta-val">${vehicle.N_Equipo || 'N/A'}</td>
                <td class="meta-label"></td>
                <td class="meta-val"></td>
            </tr>
        </table>

        <!-- Fallas Detectadas Box -->
        <div class="section-title-bar">Fallas Detectadas</div>
        <div class="section-desc-box">${budget.Fallas_Detectadas || budget['Fallas Detectadas'] || 'Diagnóstico general de taller'}</div>

        ${budget.Observaciones ? `
        <div class="section-title-bar" style="margin-top: 10px;">Observaciones / Recomendaciones</div>
        <div class="section-desc-box">${budget.Observaciones}</div>
        ` : ''}

        <!-- Products Table -->
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-cant">Cant</th>
                    <th class="col-desc">Descripción Repuestos y Lubricantes</th>
                    <th class="col-price">P. Unitario</th>
                    <th class="col-total">Total ($)</th>
                </tr>
            </thead>
            <tbody>
                ${safe(productsHTML)}
                <tr class="table-footer-row">
                    <td colspan="3">Total Repuestos y Lubricantes</td>
                    <td style="text-align: right;">$ ${sumProd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>

        <!-- Labor Table -->
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-cant">Cant</th>
                    <th class="col-desc">Descripción Mano de Obra</th>
                    <th class="col-price">P. Unitario</th>
                    <th class="col-total">Total ($)</th>
                </tr>
            </thead>
            <tbody>
                ${safe(laborHTML)}
                <tr class="table-footer-row">
                    <td colspan="3">Total Mano de obra</td>
                    <td style="text-align: right;">$ ${sumLab.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>

        <!-- Repuestos Traídos por Cliente (Solicitud de Repuestos) -->
        ${(budget.Repuestos_Cliente && budget.Repuestos_Cliente.length > 0) ? `
        <table class="data-table" style="margin-top: 15px;">
            <thead>
                <tr>
                    <th class="col-cant">Cant</th>
                    <th class="col-desc">Solicitud de Repuestos</th>
                    <th class="col-price">P. Unitario</th>
                    <th class="col-total">Total ($)</th>
                </tr>
            </thead>
            <tbody>
                ${budget.Repuestos_Cliente.map(rc => `
                    <tr>
                        <td style="text-align: center; width: 8%;">${rc.Cantidad}</td>
                        <td style="width: 62%;">${rc.Descripcion}</td>
                        <td style="text-align: right; width: 15%;">-</td>
                        <td style="text-align: right; width: 15%;">-</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}

        <!-- Bottom Layout -->
        <div class="bottom-section">
            <div class="auth-box">
                <div class="auth-title">Trabajos Autorizados Por:</div>
                <div style="font-weight: 500; font-size: 0.85rem; color: #334155; margin-top: 15px;">
                    ${budget.Nombre}
                </div>
                <div class="auth-line"></div>
            </div>
            
            <table class="totals-table">
                <tr>
                    <td class="totals-label">Sumas</td>
                    <td class="totals-val">$ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${safe(discount > 0 ? `
                <tr>
                    <td class="totals-label">(-) Descuento</td>
                    <td class="totals-val" style="color: #b91c1c;">- $ ${discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ` : '')}
                <tr>
                    <td class="totals-label">IVA</td>
                    <td class="totals-val">$ ${iva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${percRow}
                ${retRow}

                <tr class="grand-total-row">
                    <td class="totals-label" style="background-color: var(--primary-color); color: #fff;">Total a Pagar</td>
                    <td class="totals-val" style="font-weight: bold; font-size: 1.05rem;">$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
    `;
}

// Format 2: Moderno FacturaLlama DTE


function getModernoFacturaLlamaHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab, discount = 0) {
    const db = typeof getDatabase === 'function' ? getDatabase() : { promociones: [] };
    const tech = (db.tecnicos || []).find(t => t.Tecnico_ID === budget.Tecnico_Asignado) || { Nombre_Completo: 'Sin Asignar' };
    const advisor = (db.tecnicos || []).find(t => t.Tecnico_ID === budget.Asesor_Asignado) || { Nombre_Completo: 'Sin Asignar' };
    
    // Extract formatted time of generation from budget.Hora or budget.Fecha timestamp
    let horaStr = '12:00:00';
    if (budget.Hora) {
        horaStr = budget.Hora;
    } else if (budget.Fecha) {
        const dateObj = new Date(budget.Fecha);
        if (!isNaN(dateObj.getTime())) {
            const h = dateObj.getHours().toString().padStart(2, '0');
            const m = dateObj.getMinutes().toString().padStart(2, '0');
            const s = dateObj.getSeconds().toString().padStart(2, '0');
            if (!(dateObj.getHours() === 0 && dateObj.getMinutes() === 0 && dateObj.getSeconds() === 0)) {
                horaStr = `${h}:${m}:${s}`;
            }
        }
    }

    // Generate WhatsApp QR Code dynamically
    const phoneInput = ws.qr_whatsapp || ws.telefono || '';
    const cleanNumber = phoneInput.replace(/\D/g, '');
    let waNumber = cleanNumber;
    if (waNumber && waNumber.length === 8) {
        waNumber = '503' + waNumber;
    }
    const plate = vehicle.Placas || 'N/A';
    const quoteId = budget['ID Presupuesto'];
    const waText = `Hola, me gustaría consultar/aceptar la cotización ${quoteId} del vehículo con placas ${plate}.`;
    const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : '';
    const qrImgUrl = waUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(waUrl)}` : '';

    const promo = (db.promociones || []).find(p => p.ID_Promocion === budget.ID_Promocion);

    let prodDiscountPercent = 0;
    let laborDiscountPercent = 0;
    let isProportional = true;

    if (promo) {
        if (promo.Tipo === 'desc_mano_obra') {
            laborDiscountPercent = parseFloat(promo.Valor || 0) / 100;
            isProportional = false;
        } else if (promo.Tipo === 'desc_productos') {
            prodDiscountPercent = parseFloat(promo.Valor || 0) / 100;
            isProportional = false;
        }
    }

    if (isProportional) {
        const discountPercent = subtotal > 0 ? (discount / subtotal) : 0;
        prodDiscountPercent = discountPercent;
        laborDiscountPercent = discountPercent;
    }

    let items = [];
    products.forEach(p => {
        const itemPrice = parseFloat(p.PrecioUnitario || 0);
        const itemQty = parseInt(p.Cantidad || 1);
        const itemSubtotal = itemPrice * itemQty;
        const itemDiscount = itemSubtotal * prodDiscountPercent;
        const itemTotal = itemSubtotal - itemDiscount;
        items.push({
            cant: parseFloat(p.Cantidad || 1).toFixed(2),
            unidad: 'Pieza',
            desc: `${p.Descripcion}`,
            precio: itemPrice,
            descItem: itemDiscount,
            total: itemTotal
        });
    });
    labor.forEach(l => {
        const itemPrice = parseFloat(l.PrecioUnitario || 0);
        const itemQty = parseInt(l.Cantidad || 1);
        const itemSubtotal = itemPrice * itemQty;
        const itemDiscount = itemSubtotal * laborDiscountPercent;
        const itemTotal = itemSubtotal - itemDiscount;
        items.push({
            cant: parseFloat(l.Cantidad || 1).toFixed(2),
            unidad: 'Servicio',
            desc: `${l.Descripcion}`,
            precio: itemPrice,
            descItem: itemDiscount,
            total: itemTotal
        });
    });

    let custPartsHTML = '';
    if (budget.Repuestos_Cliente && budget.Repuestos_Cliente.length > 0) {
        custPartsHTML = `
            <tr style="background-color: #f8fafc; font-weight: bold;">
                <td colspan="7" style="padding: 6px 12px; border-bottom: 2px solid #cbd5e1; font-size: 0.75rem; text-align: left;">SOLICITUD DE REPUESTOS</td>
            </tr>
        ` + budget.Repuestos_Cliente.map((rc, idx) => `
            <tr>
                <td style="text-align: center; width: 4%;">${items.length + idx + 1}</td>
                <td style="text-align: center; width: 6%;">${rc.Cantidad}</td>
                <td style="text-align: center; width: 8%;">Pieza (C)</td>
                <td style="width: 52%;">${rc.Descripcion}</td>
                <td style="text-align: center; width: 10%;">-</td>
                <td style="text-align: center; width: 10%;">-</td>
                <td style="text-align: center; width: 10%;">-</td>
            </tr>
        `).join('');
    }

    const itemsHTML = (items.length === 0 && custPartsHTML === '')
        ? '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 12px;">No se registran items cotizados</td></tr>'
        : (items.map((item, idx) => `
            <tr>
                <td style="text-align: center; width: 4%;">${idx + 1}</td>
                <td style="text-align: center; width: 6%;">${item.cant}</td>
                <td style="text-align: center; width: 8%;">${item.unidad}</td>
                <td style="width: 52%;">${item.desc}</td>
                <td style="text-align: center; width: 10%;">$ ${item.precio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: center; width: 10%;">$ ${item.descItem.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: center; width: 10%;">$ ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('') + custPartsHTML);

    const totalLetras = numeroALetras(grandTotal).toUpperCase();
    const conditionStr = budget.Condicion || (client['Credito?'] === 'SI' ? 'CRÉDITO' : 'CONTADO');

    let percRow = '';
    if (percVal > 0) {
        percRow = `
            <tr>
                <td class="totals-label">(+) IVA Percibido</td>
                <td class="totals-val">$ ${percVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let retRow = '';
    if (retVal > 0) {
        retRow = `
            <tr>
                <td class="totals-label">(-) IVA Retenido</td>
                <td class="totals-val">$ ${retVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let logoHTML = '';
    if (ws.logo) {
        logoHTML = `<img src="${ws.logo}" style="max-height: 85px; max-width: 200px; object-fit: contain; border-radius: 4px;" />`;
    } else {
        logoHTML = `
            <div style="border:1.2px solid var(--border-color); padding: 6px; border-radius:6px; background:#f8fafc; font-family:'Outfit',sans-serif; text-align:center; font-weight:800; color:var(--primary-color); width:100%;">
                <div style="font-size:1.15rem;">${ws.logoText || 'TALLER'}</div>
                <div style="font-size:0.6rem; color:#64748b; font-weight:600; text-transform:uppercase;">${(ws.logoTagline || '').substring(0,35)}</div>
            </div>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Presupuesto DTE - ${budget['ID Presupuesto']}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: ${ws.color_presupuesto || '#5a626a'};
            --border-color: #cbd5e1;
            --text-color: #0f172a;
            --bg-label: #f1f5f9;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--text-color);
            background-color: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 0.72rem;
        }

        .no-print-toolbar {
            background-color: #1e293b;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #fff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .no-print-toolbar h3 {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 1.15rem;
            font-weight: 600;
        }
        .toolbar-buttons {
            display: flex;
            gap: 12px;
        }
        .btn-action {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .btn-print {
            background-color: #10b981;
            color: #fff;
        }
        .btn-print:hover {
            background-color: #059669;
        }
        .btn-close {
            background-color: #64748b;
            color: #fff;
        }
        .btn-close:hover {
            background-color: #475569;
        }

        .page-container {
            width: 820px;
            margin: 30px auto;
            background-color: #fff;
            padding: 25px;
            box-sizing: border-box;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border-radius: 8px;
        }

        .pdf-header {
            display: grid;
            grid-template-columns: 1.3fr 1fr 0.8fr;
            gap: 10px;
            margin-bottom: 15px;
            align-items: start;
        }
        .company-details {
            font-size: 0.72rem;
            line-height: 1.4;
        }
        .company-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 1.25rem;
            margin: 0 0 4px 0;
            color: var(--primary-color);
        }
        .logo-container {
            text-align: center;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .section-header-bar {
            background-color: var(--primary-color);
            color: #fff;
            font-family: 'Outfit', sans-serif;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 10px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            text-align: center;
            border-radius: 4px 4px 0 0;
        }

        .box-container {
            border: 1px solid var(--border-color);
            border-top: none;
            padding: 10px;
            background-color: #fff;
            border-radius: 0 0 4px 4px;
            margin-bottom: 12px;
        }

        .dte-grid {
            display: grid;
            grid-template-columns: 85px 1fr;
            gap: 12px;
            align-items: center;
        }
        .dte-details {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 5px;
            font-size: 0.7rem;
            line-height: 1.3;
        }

        .receptor-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 15px;
            font-size: 0.7rem;
            line-height: 1.3;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.68rem;
            margin-bottom: 12px;
        }
        table, th, td {
            border: 1px solid var(--border-color);
        }
        th {
            background-color: var(--primary-color);
            color: #ffffff;
            font-weight: 700;
            text-align: center;
            padding: 4px 5px;
            font-size: 0.7rem;
        }
        td {
            padding: 2.5px 6px;
            line-height: 1.15;
        }

        .bottom-grid {
            display: grid;
            grid-template-columns: 1.3fr 1fr;
            gap: 15px;
            margin-top: 10px;
            page-break-inside: avoid;
        }
        .left-notes {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .notes-box {
            border: 1px solid var(--border-color);
            padding: 8px;
            background-color: #fafbfc;
            border-radius: 4px;
            min-height: 40px;
            font-size: 0.68rem;
            line-height: 1.3;
        }
        .extension-box {
            border: 1px solid var(--border-color);
            border-radius: 4px;
            overflow: hidden;
        }
        .extension-header {
            background-color: var(--primary-color);
            color: #fff;
            text-align: center;
            font-weight: 700;
            padding: 3px;
            font-size: 0.7rem;
        }
        .extension-body {
            padding: 8px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 0.65rem;
        }
        .sig-line {
            border-bottom: 1px dashed #b0b8c0;
            margin-top: 15px;
            height: 10px;
        }

        .totals-table {
            width: 100%;
            margin-bottom: 0;
        }
        .totals-table td {
            padding: 4px 8px;
        }
        .totals-label {
            font-weight: 600;
            font-size: 0.65rem;
            color: #334155;
            background-color: var(--bg-label);
        }
        .totals-val {
            text-align: center;
            font-weight: 600;
        }
        .grand-total-row td {
            background-color: var(--primary-color);
            color: #fff;
            font-size: 0.8rem;
        }

        @media print {
            body {
                background-color: #fff;
                color: #000;
            }
            .no-print-toolbar {
                display: none !important;
            }
            .page-container {
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border-radius: 0;
            }
            @page {
                size: portrait;
                margin: 1.2cm;
            }
        }
    </style>
</head>
<body>

    <div class="no-print-toolbar">
        <h3>Vista Previa de Impresión (Formato DTE) - Mecanic OS</h3>
        <div class="toolbar-buttons">
            <button class="btn-action btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir o Guardar PDF</button>
            <button class="btn-action btn-close" onclick="window.close()"><i class="fa-solid fa-xmark"></i> Cerrar Vista Previa</button>
        </div>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="pdf-header">
            <div class="company-details">
                <h1 class="company-title">${ws.nombre_comercial || ws.nombre}</h1>
                <div><strong>Nombre o Razón Social:</strong> ${ws.nombre}</div>
                <div><strong>NIT:</strong> ${ws.num_documento || ws.nit || ''} &nbsp;&nbsp; <strong>NRC:</strong> ${ws.nrc || ''}</div>
                <div><strong>Correo Electrónico:</strong> ${ws.correo}</div>
            </div>
            <div class="company-details">
                <div><strong>Dirección:</strong> ${ws.direccion || ''}</div>
                <div>MUNICIPIO DE ${ws.municipio ? ws.municipio.toUpperCase() : ''}</div>
                <div>DEPARTAMENTO DE ${ws.departamento ? ws.departamento.toUpperCase() : ''}</div>
                <div><strong>Teléfono:</strong> ${ws.telefono}</div>
            </div>
            <div class="logo-container">
                ${safe(logoHTML)}
            </div>
        </div>

        <!-- DTE Box -->
        <div class="section-header-bar">Detalles del Presupuesto / Cotización</div>
        <div class="box-container dte-grid">
            <div style="display:flex; justify-content:center; align-items:center;">
                ${qrImgUrl ? `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px; text-align:center;">
                        <img src="${qrImgUrl}" width="80" height="80" style="border: 1px solid var(--border-color); border-radius: 4px; padding: 2px;" alt="QR WhatsApp" />
                        <span style="font-size:0.5rem; font-weight:700; color:var(--primary-color); text-transform:uppercase; letter-spacing:0.02em;">Escanear WA</span>
                    </div>
                ` : `
                    <!-- Mock QR Code -->
                    <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <rect width="100" height="100" fill="#f8fafc" rx="4" stroke="#b0b8c0" stroke-width="1"/>
                        <rect x="10" y="10" width="25" height="25" fill="none" stroke="#5a626a" stroke-width="6"/>
                        <rect x="15" y="15" width="15" height="15" fill="#f8fafc"/>
                        <rect x="17" y="17" width="11" height="11" fill="#5a626a"/>
                        
                        <rect x="65" y="10" width="25" height="25" fill="none" stroke="#5a626a" stroke-width="6"/>
                        <rect x="70" y="15" width="15" height="15" fill="#f8fafc"/>
                        <rect x="72" y="17" width="11" height="11" fill="#5a626a"/>
                        
                        <rect x="10" y="65" width="25" height="25" fill="none" stroke="#5a626a" stroke-width="6"/>
                        <rect x="15" y="70" width="15" height="15" fill="#f8fafc"/>
                        <rect x="17" y="72" width="11" height="11" fill="#5a626a"/>
                        
                        <rect x="65" y="65" width="10" height="10" fill="#5a626a"/>
                        <rect x="42" y="12" width="6" height="6" fill="#5a626a"/>
                        <rect x="48" y="18" width="6" height="12" fill="#5a626a"/>
                        <rect x="12" y="42" width="12" height="6" fill="#5a626a"/>
                        <rect x="24" y="48" width="6" height="6" fill="#5a626a"/>
                        <rect x="42" y="42" width="18" height="18" fill="#5a626a"/>
                        <rect x="72" y="42" width="12" height="12" fill="#5a626a"/>
                        <rect x="42" y="72" width="12" height="6" fill="#5a626a"/>
                        <rect x="78" y="78" width="10" height="10" fill="#5a626a"/>
                        <rect x="54" y="60" width="6" height="18" fill="#5a626a"/>
                    </svg>
                `}
            </div>
            <div class="dte-details">
                <div><strong>N° de Cotización:</strong><br><span style="font-family:monospace; font-weight:700; font-size:0.75rem; color:var(--primary-color);">${budget['ID Presupuesto'].toUpperCase()}</span></div>
                <div><strong>Vigencia / Validez:</strong><br>15 días calendario</div>
                
                <div><strong>Fecha de Generación:</strong><br>${new Date(budget.Fecha).toLocaleDateString('es-SV')}</div>
                <div><strong>Hora de Generación:</strong><br>${horaStr}</div>
                
                <div><strong>Técnico Asignado:</strong><br>${tech.Nombre_Completo}</div>
                <div><strong>Asesor:</strong><br>${advisor.Nombre_Completo}</div>
                ${budget.Orden_Compra ? safe(`<div><strong>Orden de Compra:</strong><br>${escapeHtml(budget.Orden_Compra)}</div>`) : ''}
            </div>
        </div>

        <!-- Receptor Box -->
        <div class="section-header-bar">Receptor / Cliente y Vehículo</div>
        <div class="box-container receptor-grid">
            <div>
                <div><strong>Nombre o Razón Social:</strong> ${client.Nombre}</div>
                <div><strong>Tipo de Documento:</strong> ${client['Tipo Doc'] || client.Tipo_Documento || 'DUI'}</div>
                <div><strong>N° Documento:</strong> ${client['Num Doc'] || client.Num_Documento || client.NIT || client.DUI || 'N/A'}</div>
                <div><strong>Dirección:</strong> ${client.Direccion || 'Dirección de cliente registrada'}</div>
                <div><strong>Correo Electrónico:</strong> ${client.Correo || 'N/A'}</div>
                <div><strong>Teléfono:</strong> ${budget['Telefono 1 '] || client['Telefono 1 '] || 'N/A'}</div>
            </div>
            <div>
                <div><strong>Placa:</strong> ${vehicle.Placas || 'N/A'} &nbsp;&nbsp;&nbsp; <strong>Año:</strong> ${vehicle.Año || 'N/A'}</div>
                <div><strong>Marca / Modelo:</strong> ${vehicle.Marca || 'N/A'} ${vehicle.Modelo || 'N/A'}</div>
                <div><strong>VIN / Motor:</strong> ${vehicle.Nª_VIN || 'N/A'} / ${vehicle.Nª_Motor || 'N/A'}</div>
                <div><strong>Nº Equipo:</strong> ${vehicle.N_Equipo || 'N/A'}</div>
                <div><strong>Odómetro / Recorrido:</strong> ${budget.Kilometraje || vehicle.Odometro || '0'} km</div>
            </div>
        </div>

        <!-- Cuerpo de Documento -->
        <div class="section-header-bar">Cuerpo del Documento</div>
        <table>
            <thead>
                <tr>
                    <th>N°</th>
                    <th>Cant.</th>
                    <th>Unidad</th>
                    <th>Descripción</th>
                    <th>Precio Unitario</th>
                    <th>Descuento</th>
                    <th>Ventas Gravadas</th>
                </tr>
            </thead>
            <tbody>
                ${safe(itemsHTML)}
            </tbody>
        </table>

        <!-- Bottom -->
        <div class="bottom-grid">
            <div class="left-notes">
                <div><strong>Total en Letras:</strong> <span style="font-weight: 700;">${totalLetras}</span></div>
                <div><strong>Condición de la Operación:</strong> ${conditionStr.toUpperCase()}</div>
                <div><strong>Observaciones / Diagnóstico:</strong></div>
                <div class="notes-box">
                    <div><strong>Fallas Detectadas / Diagnóstico Final:</strong></div>
                    <div style="color: #475569; margin-bottom: 8px; font-style: italic; font-size: 0.75rem;">
                        ${budget.Fallas_Detectadas || budget['Fallas Detectadas'] || 'Servicio y mantenimiento técnico automotriz.'}
                    </div>
                    
                    ${budget.Observaciones ? `
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
                            <strong>Observaciones / Recomendaciones adicionales:</strong>
                        </div>
                        <div style="color: #475569; font-style: italic; font-size: 0.75rem; margin-top: 2px;">
                            ${budget.Observaciones}
                        </div>
                    ` : ''}
                </div>
                
                <!-- Extensión Firmas -->
                <div class="extension-box">
                    <div class="extension-header">Extensión</div>
                    <div class="extension-body">
                        <div>
                            <strong>Nombre Entrega:</strong>
                            <div class="sig-line"></div>
                            <div style="margin-top:5px;">N° Documento:</div>
                        </div>
                        <div>
                            <strong>Nombre Recibe:</strong>
                            <div class="sig-line"></div>
                            <div style="margin-top:5px;">N° Documento:</div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <table class="totals-table">
                    <tr>
                        <td class="totals-label">Sumatoria de Ventas</td>
                        <td class="totals-val">$ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">Monto Global de Descuento</td>
                        <td class="totals-val">$ ${discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">Sub Total</td>
                        <td class="totals-val">$ ${(subtotal - discount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">(+) IVA (13%)</td>
                        <td class="totals-val">$ ${iva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    ${percRow}
                    ${retRow}

                    <tr class="grand-total-row">
                        <td class="totals-label">Total a Pagar</td>
                        <td class="totals-val">$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
    `;
}

// Format 3: Elegante / Ejecutivo


function getEleganteEjecutivoHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab, discount = 0) {
    const taxRate = parseFloat(budget['% Impuesto'] !== undefined ? budget['% Impuesto'] : 0.13);
    const ivaMultiplier = 1 + taxRate;

    const productsHTML = products.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px; font-style:italic;">Sin repuestos ni lubricantes cotizados</td></tr>'
        : products.map(p => {
            const unitPriceWithIva = parseFloat(p.PrecioUnitario || 0) * ivaMultiplier;
            const totalWithIva = unitPriceWithIva * parseInt(p.Cantidad || 1);
            return `
                <tr>
                    <td style="text-align: center; font-weight: 500;">${p.Cantidad}</td>
                    <td>${p.Descripcion}</td>
                    <td style="text-align: right;">$ ${unitPriceWithIva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align: right; font-weight: 600;">$ ${totalWithIva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');

    const laborHTML = labor.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px; font-style:italic;">Sin mano de obra cotizada</td></tr>'
        : labor.map(l => {
            const unitPriceWithIva = parseFloat(l.PrecioUnitario || 0) * ivaMultiplier;
            const totalWithIva = unitPriceWithIva * parseInt(l.Cantidad || 1);
            return `
                <tr>
                    <td style="text-align: center; font-weight: 500;">${l.Cantidad}</td>
                    <td>${l.Descripcion}</td>
                    <td style="text-align: right;">$ ${unitPriceWithIva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="text-align: right; font-weight: 600;">$ ${totalWithIva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            `;
        }).join('');

    let percRow = '';
    if (percVal > 0) {
        percRow = `
            <tr>
                <td class="total-label">(+) IVA Percibido</td>
                <td class="total-val">$ ${percVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let retRow = '';
    if (retVal > 0) {
        retRow = `
            <tr>
                <td class="total-label">(-) IVA Retenido</td>
                <td class="total-val">$ ${retVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let logoHTML = '';
    if (ws.logo) {
        logoHTML = `<img src="${ws.logo}" style="max-height: 90px; max-width: 250px; object-fit: contain; border-radius: 4px;" />`;
    } else {
        logoHTML = `<div style="font-family:'Outfit', sans-serif; font-size: 2.2rem; font-weight:800; color:var(--primary-color); margin: 0; letter-spacing: -0.03em;">${ws.logoText || 'MECANIC OS'}</div>`;
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Presupuesto Comercial - ${budget['ID Presupuesto']}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: ${ws.color_presupuesto || '#0f172a'};
            --accent-color: ${ws.color_presupuesto || '#b45309'};
            --border-color: #e2e8f0;
            --text-color: #334155;
            --bg-light: #f8fafc;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--text-color);
            background-color: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 0.8rem;
        }

        .no-print-toolbar {
            background-color: var(--primary-color);
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #fff;
        }
        .no-print-toolbar h3 {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
        }
        .toolbar-buttons {
            display: flex;
            gap: 12px;
        }
        .btn-action {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .btn-print {
            background-color: var(--accent-color);
            color: #fff;
        }
        .btn-print:hover {
            opacity: 0.9;
        }
        .btn-close {
            background-color: #64748b;
            color: #fff;
        }

        .page-container {
            width: 820px;
            margin: 30px auto;
            background-color: #fff;
            padding: 40px;
            box-sizing: border-box;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border-radius: 8px;
        }

        .pdf-header {
            display: grid;
            grid-template-columns: 1.3fr 1.1fr 0.8fr;
            gap: 15px;
            margin-bottom: 20px;
            align-items: start;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 15px;
        }
        .company-details {
            font-size: 0.72rem;
            line-height: 1.4;
        }
        .company-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 1.25rem;
            margin: 0 0 4px 0;
            color: var(--primary-color);
        }
        .logo-container {
            text-align: center;
            display: flex;
            justify-content: flex-end;
            align-items: center;
        }

        .doc-meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            background-color: var(--bg-light);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px 25px;
        }
        .meta-col h4 {
            margin: 0 0 4px 0;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
        }
        .meta-col div {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--primary-color);
        }

        .grid-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-card {
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
        }
        .card-title {
            font-family: 'Outfit', sans-serif;
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--primary-color);
            border-bottom: 1.5px solid var(--accent-color);
            padding-bottom: 5px;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .card-body div {
            margin-bottom: 4px;
            font-size: 0.72rem;
            line-height: 1.25;
        }

        .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            color: var(--primary-color);
            margin: 20px 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.72rem;
            margin-bottom: 20px;
        }
        th {
            border-bottom: 2px solid var(--primary-color);
            color: var(--primary-color);
            font-weight: 700;
            text-align: left;
            padding: 6px 8px;
            font-size: 0.68rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        td {
            border-bottom: 1px solid var(--border-color);
            padding: 6px 8px;
        }
        
        .totals-block {
            display: flex;
            justify-content: flex-end;
            margin-top: 15px;
            page-break-inside: avoid;
        }
        .totals-subtable {
            width: 320px;
        }
        .totals-subtable td {
            border-bottom: 1px solid var(--border-color);
            padding: 5px 8px;
            font-size: 0.72rem;
        }
        .total-label {
            font-weight: 600;
            color: var(--primary-color);
        }
        .total-val {
            text-align: right;
        }
        .grand-total-row td {
            border-top: 2px solid var(--accent-color);
            border-bottom: 2px solid var(--accent-color);
            background-color: var(--bg-light);
            font-size: 0.95rem;
            font-weight: 800;
            color: var(--primary-color);
        }

        .notes-section {
            margin-top: 25px;
            font-size: 0.75rem;
            color: #64748b;
            line-height: 1.4;
            border-top: 1px solid var(--border-color);
            padding-top: 15px;
            page-break-inside: avoid;
        }

        @media print {
            .no-print-toolbar {
                display: none !important;
            }
            @page {
                size: portrait;
                margin: 1.2cm;
            }
            body {
                background-color: #fff;
            }
        }
    </style>
</head>
<body>

    <div class="no-print-toolbar">
        <h3>Vista Previa - Presupuesto Ejecutivo</h3>
        <div class="toolbar-buttons">
            <button class="btn-action btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir Presupuesto</button>
            <button class="btn-action btn-close" onclick="window.close()"><i class="fa-solid fa-xmark"></i> Cerrar</button>
        </div>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="pdf-header">
            <div class="company-details">
                <h1 class="company-title">${ws.nombre_comercial || ws.nombre}</h1>
                ${ws.nombre_comercial && ws.nombre_comercial !== ws.nombre ? `<div><strong>Razón Social:</strong> ${ws.nombre}</div>` : ''}
                <div><strong>NIT:</strong> ${ws.num_documento || ws.nit || ''} ${ws.nrc ? `&nbsp;&nbsp; <strong>NRC:</strong> ${ws.nrc}` : ''}</div>
                <div><strong>Giro:</strong> ${ws.actividad_economica || ws.giro || 'Servicios Automotrices'}</div>
            </div>
            <div class="company-details">
                <div><strong>Dirección:</strong> ${ws.direccion || ''}${ws.municipio || ws.departamento || ws.pais ? `, ${[ws.municipio, ws.departamento, ws.pais].filter(Boolean).join(', ')}` : ''}</div>
                <div><strong>Teléfono:</strong> ${ws.telefono}</div>
                <div><strong>Correo:</strong> ${ws.correo}</div>
            </div>
            <div class="logo-container">
                ${safe(logoHTML)}
            </div>
        </div>

        <!-- Document Metadata -->
        <div class="doc-meta-row">
            <div class="meta-col">
                <h4>Presupuesto ID</h4>
                <div>${budget['ID Presupuesto']}</div>
            </div>
            <div class="meta-col">
                <h4>Fecha Emisión</h4>
                <div>${new Date(budget.Fecha).toLocaleDateString('es-SV')}</div>
            </div>
            <div class="meta-col">
                <h4>Condición</h4>
                <div>${(budget.Condicion || (client['Credito?'] === 'SI' ? 'CRÉDITO' : 'CONTADO')).toUpperCase()}</div>
            </div>
            <div class="meta-col">
                <h4>Total Cotizado</h4>
                <div style="color:var(--accent-color); font-weight: 800;">$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
        </div>

        <!-- Receptor Details -->
        <div class="grid-cards">
            <div class="info-card">
                <div class="card-title" style="text-align: center;">Cliente</div>
                <div class="card-body">
                    <div><strong>Nombre:</strong> ${client.Nombre}</div>
                    <div><strong>Documento:</strong> ${client['Tipo Doc'] || client.Tipo_Documento || 'DUI'}: ${client['Num Doc'] || client.Num_Documento || client.NIT || client.DUI || 'N/A'}</div>
                    <div><strong>Dirección:</strong> ${client.Direccion || 'Dirección de cliente registrada'}</div>
                    <div><strong>Teléfono:</strong> ${budget['Telefono 1 '] || client['Telefono 1 '] || 'N/A'}</div>
                    <div><strong>Email:</strong> ${client.Correo || 'N/A'}</div>
                </div>
            </div>
            <div class="info-card">
                <div class="card-title" style="text-align: center;">Vehículo</div>
                <div class="card-body">
                    <div><strong>Placa:</strong> ${vehicle.Placas || 'N/A'} &nbsp;&nbsp;&nbsp; <strong>Año:</strong> ${vehicle.Año || 'N/A'}</div>
                    <div><strong>Marca / Modelo:</strong> ${vehicle.Marca || 'N/A'} ${vehicle.Modelo || 'N/A'}</div>
                    <div><strong>VIN / Motor:</strong> ${vehicle.Nª_VIN || 'N/A'} / ${vehicle.Nª_Motor || 'N/A'}</div>
                    <div><strong>Nº Equipo:</strong> ${vehicle.N_Equipo || 'N/A'}</div>
                    <div><strong>Kilometraje / Odómetro:</strong> ${budget.Kilometraje || vehicle.Odometro || '0'} km</div>
                    <div><strong>Fallas Reportadas:</strong> ${budget.Fallas_Detectadas || 'Diagnóstico de taller'}</div>
                    ${budget.Observaciones ? `<div><strong>Observaciones:</strong> ${budget.Observaciones}</div>` : ''}
                </div>
            </div>
        </div>

        <!-- Tables -->
        <div class="section-title">Repuestos y Lubricantes</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 8%; text-align: center;">Cant</th>
                    <th style="width: 62%;">Descripción del Item</th>
                    <th style="width: 15%; text-align: right;">P. Unitario</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${safe(productsHTML)}
            </tbody>
        </table>

        <div class="section-title">Mano de Obra y Servicios</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 8%; text-align: center;">Cant</th>
                    <th style="width: 62%;">Descripción del Servicio</th>
                    <th style="width: 15%; text-align: right;">P. Unitario</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${safe(laborHTML)}
            </tbody>
        </table>

        <!-- Repuestos Traídos por Cliente (Solicitud de Repuestos) -->
        ${(budget.Repuestos_Cliente && budget.Repuestos_Cliente.length > 0) ? `
        <div class="section-title">Solicitud de Repuestos</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 8%; text-align: center;">Cant</th>
                    <th style="width: 62%;">Descripción del Item</th>
                    <th style="width: 15%; text-align: right;">P. Unitario</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${budget.Repuestos_Cliente.map(rc => `
                    <tr>
                        <td style="text-align: center; font-weight: 500;">${rc.Cantidad}</td>
                        <td>${rc.Descripcion}</td>
                        <td style="text-align: right;">-</td>
                        <td style="text-align: right;">-</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}

        <!-- Totals Block -->
        <div class="totals-block">
            <table class="totals-subtable">
                <tr>
                    <td class="total-label">Sumatoria Repuestos y Servicios</td>
                    <td class="total-val">$ ${(subtotal * ivaMultiplier).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${safe(discount > 0 ? `
                <tr>
                    <td class="total-label">(-) Descuento</td>
                    <td class="total-val" style="color: #b91c1c;">- $ ${(discount * ivaMultiplier).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ` : '')}
                ${percRow}
                ${retRow}
                <tr class="grand-total-row">
                    <td class="total-label">Total a Pagar</td>
                    <td class="total-val">$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </table>
        </div>

        <!-- Notes and terms -->
        <div class="notes-section">
            <strong>Observaciones Generales:</strong><br>
            Este presupuesto es válido por un período de 15 días a partir de su emisión. Los trabajos adicionales no contemplados en este documento serán consultados previamente con el cliente.
        </div>
    </div>
</body>
</html>
    `;
}

// ----------------------------------------------------
// BUDGET PDF EXPORT (CONDITIONAL FORMAT SELECTOR)
// ----------------------------------------------------


export function exportBudgetPDF(budgetId) {
    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    const budget = db.presupuestos.find(p => p['ID Presupuesto'] === budgetId);
    if (!budget) {
        showToast("Error: Presupuesto no encontrado", "danger");
        return;
    }

    const client = db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { 
        Nombre: budget.Nombre, 
        'Telefono 1 ': budget['Telefono 1 '] || '', 
        Direccion: budget.Direccion || '' 
    };
    
    const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === budget.ID_Vehiculo) || { 
        Placas: budget.Placas || 'N/A', 
        Marca: 'N/A', 
        Modelo: 'N/A', 
        Año: 'N/A' 
    };

    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

    const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === budgetId);
    const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === budgetId);

    const sumProd = products.reduce((sum, p) => sum + parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1), 0);
    const sumLab = labor.reduce((sum, l) => sum + parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1), 0);
    const rawSubtotal = sumProd + sumLab;

    // Calculate promotion discount
    const promo = (db.promociones || []).find(p => p.ID_Promocion === budget.ID_Promocion);
    let discount = 0;
    if (promo) {
        if (promo.Tipo === 'desc_mano_obra') {
            discount = sumLab * (parseFloat(promo.Valor || 0) / 100);
        } else if (promo.Tipo === 'desc_productos') {
            discount = sumProd * (parseFloat(promo.Valor || 0) / 100);
        } else if (promo.Tipo === 'monto_fijo') {
            discount = parseFloat(promo.Valor || 0);
        }
    }
    discount = Math.min(discount, rawSubtotal);

    const subtotalConDescuento = rawSubtotal - discount;
    const taxRate = parseFloat(budget['% Impuesto'] || 0.13);

    const wsConfig = getWorkshopConfig(db);
    const preciosConIva = wsConfig.features && wsConfig.features.precios_con_iva === true;

    let iva = 0;
    let subtotal = rawSubtotal;
    let baseParaImpuestos = subtotalConDescuento;
    let finalDiscount = discount;

    if (preciosConIva) {
        const totalSinImpuestos = subtotalConDescuento / 1.13;
        iva = subtotalConDescuento - totalSinImpuestos;
        subtotal = rawSubtotal / 1.13;
        baseParaImpuestos = totalSinImpuestos;
        finalDiscount = discount / 1.13;
    } else {
        iva = subtotalConDescuento * taxRate;
        baseParaImpuestos = subtotalConDescuento;
    }

    let retVal = 0;
    let percVal = 0;
    const isGranContrib = client['Categoría Contribuyente'] === 'GRANDE' || (client.AplicaRetencion > 0);
    if (isGranContrib && baseParaImpuestos >= 100.00) {
        retVal = baseParaImpuestos * 0.01;
    }
    if (client.AplicaPercepcion > 0) {
        percVal = baseParaImpuestos * parseFloat(client.AplicaPercepcion);
    }

    let grandTotal = 0;
    if (preciosConIva) {
        grandTotal = subtotalConDescuento + percVal - retVal;
    } else {
        grandTotal = subtotalConDescuento + iva + percVal - retVal;
    }
    discount = finalDiscount;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast("Error: Habilite las ventanas emergentes (popups) para imprimir el presupuesto", "danger");
        return;
    }

    const format = ws.formato_presupuesto || 'moderno_facturallama';
    let pdfHTML = '';

    if (format === 'clasico_mecanicos') {
        pdfHTML = getClasicoMecanicOSHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab, discount);
    } else if (format === 'elegante_ejecutivo') {
        pdfHTML = getEleganteEjecutivoHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab, discount);
    } else if (format === 'compacto_orden') {
        pdfHTML = getCompactoOrdenHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab, discount);
    } else {
        pdfHTML = getModernoFacturaLlamaHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab, discount);
    }

    printWindow.document.write(pdfHTML);
    printWindow.document.close();
}

function getCompactoOrdenHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab, discount = 0) {
    const db = typeof getDatabase === 'function' ? getDatabase() : { tecnicos: [] };
    const tech = (db.tecnicos || []).find(t => t.Tecnico_ID === budget.Tecnico_Asignado) || { Nombre_Completo: 'Sin Asignar' };
    const advisor = (db.tecnicos || []).find(t => t.Tecnico_ID === budget.Asesor_Asignado) || { Nombre_Completo: 'Sin Asignar' };

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Orden de Trabajo / Cotización - ${budget['ID Presupuesto']}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #0f172a;
            --border-color: #cbd5e1;
            --text-color: #1e293b;
        }
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--text-color);
            background-color: #fff;
            font-size: 11px;
            line-height: 1.35;
        }
        .no-print-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #1e293b;
            color: #fff;
            padding: 10px 20px;
            font-family: sans-serif;
        }
        .no-print-toolbar h3 { margin: 0; font-size: 14px; }
        .no-print-toolbar .btn-action {
            background: #10b981;
            color: #fff;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .no-print-toolbar .btn-close {
            background: #64748b;
            color: #fff;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
        }
        
        .page-container {
            width: 800px;
            margin: 0 auto;
            padding: 25px;
            box-sizing: border-box;
        }
        
        /* Flex row for top info */
        .top-info-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
            margin-top: 10px;
            margin-bottom: 8px;
        }
        
        .top-col {
            flex: 1;
            font-size: 11px;
        }
        .top-col-left {
            max-width: 35%;
        }
        .top-col-center {
            max-width: 35%;
            text-align: center;
        }
        .top-col-right {
            max-width: 30%;
            text-align: right;
        }
        
        .title-block {
            margin-bottom: 12px;
        }
        .title-text {
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            margin: 0;
            letter-spacing: -0.01em;
        }
        .subtitle-text {
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            margin: 2px 0 0 0;
        }
        
        .divider-line {
            border-top: 1px solid #94a3b8;
            margin: 6px 0;
        }
        
        /* Items Table styling */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
            line-height: 1.25;
        }
        .items-table th {
            border-bottom: 2.5px solid var(--primary-color);
            padding: 4px 8px;
            font-weight: 700;
            text-align: left;
            text-transform: uppercase;
            font-size: 10px;
        }
        .items-table td {
            padding: 3.5px 8px;
            border-bottom: 1px dashed #cbd5e1;
        }
        
        .category-header-row td {
            font-weight: 800;
            font-size: 11px;
            background-color: #f1f5f9;
            border-bottom: 1.5px solid var(--primary-color);
            padding: 4px 8px;
        }
        
        .category-total-row td {
            font-weight: 700;
            border-top: 1px solid var(--primary-color);
            border-bottom: 1.5px solid var(--primary-color);
            padding: 5px 8px;
            background-color: #f8fafc;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 15px;
        }
        .totals-table {
            width: 250px;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 4px 8px;
            font-size: 11px;
            border-bottom: 1px solid #e2e8f0;
        }
        .totals-table .total-label {
            font-weight: 600;
            text-align: left;
        }
        .totals-table .total-value {
            font-weight: 700;
            text-align: right;
        }
        .totals-table .grand-total-row td {
            font-size: 12px;
            font-weight: 800;
            border-top: 2px solid var(--primary-color);
            border-bottom: 2.5px solid var(--primary-color);
            background-color: #f8fafc;
        }
        
        /* Signature block */
        .signatures-container {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            gap: 20px;
            page-break-inside: avoid;
        }
        .signature-box {
            flex: 1;
            text-align: center;
            border-top: 1px solid #475569;
            padding-top: 5px;
            font-size: 10px;
        }
        .signature-box .sig-title {
            font-weight: 700;
            color: #334155;
        }
        .signature-box .sig-name {
            margin-top: 2px;
            color: #64748b;
        }
        
        .footer-info {
            text-align: center;
            font-size: 9px;
            color: #64748b;
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
        
        @media print {
            .no-print-toolbar {
                display: none !important;
            }
            html, body {
                height: 100%;
                margin: 0;
                padding: 0;
            }
            body {
                background-color: #fff;
                padding: 1.2cm 1.4cm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                min-height: 100vh;
            }
            .page-container {
                padding: 0;
                width: 100%;
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }
            .signatures-container {
                margin-top: auto !important;
            }
            .footer-info {
                margin-top: 15px !important;
            }
            @page {
                size: portrait;
                margin: 0;
            }
        }
    </style>
</head>
<body>

    <div class="no-print-toolbar">
        <h3>Vista Previa - Formato Compacto</h3>
        <div style="display: flex; gap: 10px; align-items: center;">
            <button class="btn-action" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir o PDF</button>
            <button class="btn-close" onclick="window.close()">Cerrar</button>
        </div>
    </div>
    
    <div class="page-container">
        <!-- Title block -->
        <div class="title-block">
            <h1 class="title-text">Orden de Trabajo</h1>
            <div class="subtitle-text"># ${budget['ID Presupuesto']} | ${budget.Fecha ? new Date(budget.Fecha).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
        </div>
        
        <!-- Header Info Row -->
        <div class="top-info-section">
            <!-- Left: Client Info -->
            <div class="top-col top-col-left">
                <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px;">${client.Nombre}</div>
                <div><strong>Documento:</strong> ${client['Num Doc'] || client.Num_Documento || client.NIT || client.DUI || 'N/A'}</div>
                <div><strong>Teléfono:</strong> ${client['Telefono 1 '] || client.Telefono || 'N/A'}</div>
                <div><strong>Dirección:</strong> ${client.Direccion || 'N/A'}</div>
            </div>
            
            <!-- Center: Workshop Info & Logo -->
            <div class="top-col top-col-center" style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; margin-top: -20px;">
                ${ws.logo ? `
                    <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 6px; width: 100%; max-width: 240px;">
                        <img src="${ws.logo}" style="max-height: 85px; max-width: 100%; object-fit: contain; display: block;" />
                    </div>
                ` : `
                    <div style="font-weight: 700; color: var(--primary-color); font-size: 13px; margin-bottom: 4px; text-align: center;">${ws.nombreTaller || 'Centro de Servicio'}</div>
                `}
                <div style="color: #475569; font-size: 10px; text-align: center; line-height: 1.4;">
                    ${ws.logo ? `<div style="font-weight: 700; color: var(--primary-color); font-size: 11px; margin-bottom: 2px;">${ws.nombreTaller || 'Centro de Servicio'}</div>` : ''}
                    <div>${ws.direccion || ''}</div>
                    <div>Tel: ${ws.telefono || ''}</div>
                    ${ws.correo ? `<div>Email: ${ws.correo}</div>` : ''}
                </div>
            </div>
            
            <!-- Right: Vehicle Info -->
            <div class="top-col top-col-right">
                <div style="font-weight: 700; font-size: 12px; margin-bottom: 4px;">${vehicle.Marca || 'N/A'} ${vehicle.Modelo || ''} ${vehicle.Año ? '(' + vehicle.Año + ')' : ''}</div>
                <div><strong>Placas:</strong> ${vehicle.Placas || 'N/A'}</div>
                ${vehicle.Color ? `<div><strong>Color:</strong> ${vehicle.Color}</div>` : ''}
                ${vehicle.N_Equipo ? `<div><strong>N° Equipo:</strong> ${vehicle.N_Equipo}</div>` : ''}
                ${budget.Kilometraje ? `<div><strong>Kilometraje:</strong> ${budget.Kilometraje}</div>` : ''}
            </div>
        </div>
        
        <div class="divider-line"></div>
        
        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Descripción</th>
                    <th style="text-align: center; width: 10%;">Cant.</th>
                    <th style="text-align: right; width: 13%;">Precio Unit.</th>
                    <th style="text-align: right; width: 12%;">Desc.</th>
                    <th style="text-align: right; width: 15%;">Total</th>
                </tr>
            </thead>
            <tbody>
                <!-- Mano de obra / Servicios -->
                ${labor.length > 0 ? `
                    <tr class="category-header-row">
                        <td colspan="5">Mano de Obra y Servicios</td>
                    </tr>
                    ${labor.map(l => {
                        const unitPrice = parseFloat(l.PrecioUnitario || 0);
                        const qty = parseInt(l.Cantidad || 1);
                        const disc = parseFloat(l.Descuento || 0);
                        const tot = (unitPrice * qty) - disc;
                        return `
                            <tr>
                                <td>${l.Descripcion}</td>
                                <td style="text-align: center;">${qty}</td>
                                <td style="text-align: right;">$ ${unitPrice.toFixed(2)}</td>
                                <td style="text-align: right;">$ ${disc.toFixed(2)}</td>
                                <td style="text-align: right; font-weight: 600;">$ ${tot.toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('')}
                    <tr class="category-total-row">
                        <td colspan="4" style="text-align: right;">Total Mano de obra:</td>
                        <td style="text-align: right; font-weight: 700;">$ ${sumLab.toFixed(2)}</td>
                    </tr>
                ` : ''}
                
                <!-- Repuestos -->
                ${products.length > 0 ? `
                    <tr class="category-header-row">
                        <td colspan="5">Repuestos, Lubricantes y Refacciones</td>
                    </tr>
                    ${products.map(p => {
                        const unitPrice = parseFloat(p.PrecioUnitario || 0);
                        const qty = parseInt(p.Cantidad || 1);
                        const disc = parseFloat(p.Descuento || 0);
                        const tot = (unitPrice * qty) - disc;
                        return `
                            <tr>
                                <td>${p.Descripcion}</td>
                                <td style="text-align: center;">${qty}</td>
                                <td style="text-align: right;">$ ${unitPrice.toFixed(2)}</td>
                                <td style="text-align: right;">$ ${disc.toFixed(2)}</td>
                                <td style="text-align: right; font-weight: 600;">$ ${tot.toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('')}
                    <tr class="category-total-row">
                        <td colspan="4" style="text-align: right;">Total Repuestos:</td>
                        <td style="text-align: right; font-weight: 700;">$ ${sumProd.toFixed(2)}</td>
                    </tr>
                ` : ''}

                <!-- Repuestos Traídos por el Cliente (Solicitud de Repuestos) -->
                ${(budget.Repuestos_Cliente && budget.Repuestos_Cliente.length > 0) ? `
                    <tr class="category-header-row">
                        <td colspan="5">Solicitud de Repuestos</td>
                    </tr>
                    ${budget.Repuestos_Cliente.map(rc => `
                        <tr>
                            <td>${rc.Descripcion}</td>
                            <td style="text-align: center;">${rc.Cantidad}</td>
                            <td style="text-align: right;">-</td>
                            <td style="text-align: right;">-</td>
                            <td style="text-align: right;">-</td>
                        </tr>
                    `).join('')}
                ` : ''}
            </tbody>
        </table>
        
        <!-- Totals & Notes Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 15px; gap: 20px; page-break-inside: avoid;">
            <!-- Left: Notes -->
            <div style="flex: 1; font-size: 10px; color: #475569; border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px; min-height: 60px;">
                <div style="font-weight: 700; color: var(--primary-color); margin-bottom: 4px;">Observaciones / Recomendaciones:</div>
                <div>${budget[' Observaciones'] || budget.Observaciones || 'Ninguna.'}</div>
                ${budget.Diagnostico ? `<div style="margin-top: 6px;"><strong>Diagnóstico:</strong> ${budget.Diagnostico}</div>` : ''}
            </div>
            
            <!-- Right: Totals table -->
            <div style="width: 280px;">
                <table class="totals-table">
                    <tr>
                        <td class="total-label">Subtotal Neto</td>
                        <td class="total-value">$ ${subtotal.toFixed(2)}</td>
                    </tr>
                    ${discount > 0 ? `
                        <tr style="color: #b45309;">
                            <td class="total-label">(-) Descuento Promo</td>
                            <td class="total-value">- $ ${discount.toFixed(2)}</td>
                        </tr>
                    ` : ''}
                    <tr>
                        <td class="total-label">IVA (13%)</td>
                        <td class="total-value">$ ${iva.toFixed(2)}</td>
                    </tr>
                    ${percVal > 0 ? `
                        <tr>
                            <td class="total-label">(+) IVA Percibido</td>
                            <td class="total-value">+ $ ${percVal.toFixed(2)}</td>
                        </tr>
                    ` : ''}
                    ${retVal > 0 ? `
                        <tr>
                            <td class="total-label">(-) IVA Retenido</td>
                            <td class="total-value">- $ ${retVal.toFixed(2)}</td>
                        </tr>
                    ` : ''}
                    <tr class="grand-total-row">
                        <td class="total-label">TOTAL</td>
                        <td class="total-value">$ ${grandTotal.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
        </div>
        
        <!-- Signatures Block -->
        <div class="signatures-container">
            <div class="signature-box">
                <div class="sig-title">Firma Técnico</div>
                <div class="sig-name">${tech.Nombre_Completo}</div>
            </div>
            <div class="signature-box">
                <div class="sig-title">Firma Asesor</div>
                <div class="sig-name">${advisor.Nombre_Completo}</div>
            </div>
            <div class="signature-box">
                <div class="sig-title">Firma Cliente</div>
                <div class="sig-name">${client.Nombre}</div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer-info">
            ${ws.direccion || ''} ${ws.telefono ? '• Tel: ' + ws.telefono : ''} ${ws.correo ? '• Email: ' + ws.correo : ''}
        </div>
    </div>
    
</body>
</html>
    `;
}

// ----------------------------------------------------
// ACCOUNTS RECEIVABLE REPORTING PDF GENERATORS
// ----------------------------------------------------


