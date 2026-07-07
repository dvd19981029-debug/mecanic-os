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
    calculateElSalvadorPeriodPayroll,
    DEPARTAMENTOS_CODES,
    MUNICIPIOS_CODES
} from '../../app.js?v=40';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport,
    safe
} from '../utils.js?v=40';

export function renderFacturador(container, queryParams) {
    const db = getDatabase();
    
    // Check if we are in direct invoicing mode (presId is present)
    const selectedPresId = queryParams.presId || '';
    
    if (selectedPresId) {
        // Render Invoicing Form Workspace
        renderInvoicingWorkspace(container, selectedPresId);
    } else {
        // Render Tabbed List Workspace
        renderTabbedListWorkspace(container);
    }
}

export function renderTabbedListWorkspace(container) {
    const activeUser = getActiveUser();
    const isAdmin = activeUser && (activeUser.Nivel_Acceso === 'Administrador');
    
    container.innerHTML = html`
        <div class="tabs-container" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; gap: 1rem;">
                <button class="tab-btn" id="tab-btn-pending" style="background: none; border: none; color: var(--text-secondary); font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; transition: all 0.2s;">
                    <i class="fa-solid fa-clock-rotate-left"></i> Pendientes de Facturar
                </button>
                <button class="tab-btn" id="tab-btn-issued" style="background: none; border: none; color: var(--text-secondary); font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; transition: all 0.2s;">
                    <i class="fa-solid fa-file-invoice-dollar"></i> Historial DTEs Emitidos
                </button>
            </div>
            ${safe(isAdmin ? `<button class="btn btn-warning" id="view-invalidated-budgets-btn" style="padding: 0.5rem 1rem; font-size: 0.9rem; display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem;"><i class="fa-solid fa-ban"></i> Presupuestos Anulados</button>` : '')}
        </div>
        
        <div id="tab-content-area">
            <!-- Dynamic Tab Content -->
        </div>
    `;
    
    const tabBtnPending = document.getElementById('tab-btn-pending');
    const tabBtnIssued = document.getElementById('tab-btn-issued');
    const tabContentArea = document.getElementById('tab-content-area');
    const viewInvalidatedBtn = document.getElementById('view-invalidated-budgets-btn');
    
    let currentTab = localStorage.getItem('mecanic_os_facturador_active_tab') || 'pending';
    
    function switchTab(tabName) {
        currentTab = tabName;
        localStorage.setItem('mecanic_os_facturador_active_tab', tabName);
        
        // Remove active styles from both
        tabBtnPending.classList.remove('active');
        tabBtnPending.style.color = 'var(--text-secondary)';
        tabBtnPending.style.borderBottom = 'none';
        
        tabBtnIssued.classList.remove('active');
        tabBtnIssued.style.color = 'var(--text-secondary)';
        tabBtnIssued.style.borderBottom = 'none';
        
        if (tabName === 'pending') {
            tabBtnPending.classList.add('active');
            tabBtnPending.style.color = 'var(--text-primary)';
            tabBtnPending.style.borderBottom = '2px solid var(--primary)';
            renderPendingTab(tabContentArea);
        } else {
            tabBtnIssued.classList.add('active');
            tabBtnIssued.style.color = 'var(--text-primary)';
            tabBtnIssued.style.borderBottom = '2px solid var(--primary)';
            renderIssuedTab(tabContentArea);
        }
    }
    
    tabBtnPending.addEventListener('click', () => switchTab('pending'));
    tabBtnIssued.addEventListener('click', () => switchTab('issued'));
    if (viewInvalidatedBtn) {
        viewInvalidatedBtn.addEventListener('click', () => {
            openInvalidatedBudgetsModal();
        });
    }
    
    // Initial load
    switchTab(currentTab);
}


function openInvalidatedBudgetsModal() {
    const activeUser = getActiveUser();
    const isAdmin = activeUser && (activeUser.Nivel_Acceso === 'Administrador');
    if (!isAdmin) {
        showToast("Acceso denegado: Solo administradores pueden gestionar presupuestos anulados.", "danger");
        return;
    }

    const db = getDatabase();
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    function renderModalContent() {
        const dbCurrent = getDatabase();
        const anulados = dbCurrent.presupuestos.filter(p => p.Estado == 4);
        
        let rowsHtml = '';
        if (anulados.length === 0) {
            rowsHtml = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay presupuestos anulados registrados</td></tr>`;
        } else {
            anulados.forEach(p => {
                const grandTotal = getBudgetGrandTotal(p, dbCurrent);
                const formattedDate = p.Fecha_Anulacion ? new Date(p.Fecha_Anulacion).toLocaleString() : 'N/A';
                rowsHtml += `
                    <tr>
                        <td><a href="#presupuestos?id=${p['ID Presupuesto']}" style="color: var(--primary); font-weight: bold; text-decoration: underline;" id="link-rec-${p['ID Presupuesto']}">${p['ID Presupuesto']}</a></td>
                        <td>${formattedDate}</td>
                        <td>${p.Nombre || 'N/A'}</td>
                        <td><span class="badge-tag badge-secondary">${p.Placas || 'N/A'}</span></td>
                        <td>$${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>
                            <div style="display: flex; gap: 0.35rem;">
                                <button class="btn btn-warning btn-recover-direct" data-id="${p['ID Presupuesto']}" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;" title="Recuperar Presupuesto"><i class="fa-solid fa-rotate-left"></i> Recuperar</button>
                                <button class="btn btn-danger btn-delete-direct" data-id="${p['ID Presupuesto']}" style="padding: 0.35rem 0.5rem; font-size: 0.8rem; background: var(--danger); border: none; display: inline-flex; align-items: center; gap: 0.25rem;" title="Eliminar definitivamente"><i class="fa-solid fa-trash"></i> Eliminar</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        
        modal.innerHTML = html`
            <div class="modal-content glass-card" style="max-width: 850px; width: 90%; padding: 1.5rem;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h2><i class="fa-solid fa-ban" style="color: var(--warning);"></i> Presupuestos Anulados / Invalidados</h2>
                    <button class="close-modal-btn" id="close-anulados-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                
                <div class="table-container" style="max-height: 400px; overflow-y: auto; margin-bottom: 1.5rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Fecha Anulación</th>
                                <th>Cliente</th>
                                <th>Placas</th>
                                <th>Total (Con IVA)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="anulados-table-rows">
                            ${safe(rowsHtml)}
                        </tbody>
                    </table>
                </div>
                
                <div style="display:flex; justify-content:flex-end;">
                    <button type="button" class="btn btn-secondary" id="close-anulados-btn">Cerrar</button>
                </div>
            </div>
        `;
        
        // Re-bind click listeners for links
        modal.querySelectorAll('a[id^="link-rec-"]').forEach(link => {
            link.addEventListener('click', (e) => {
                modal.remove();
            });
        });
        
        // Re-bind action buttons
        modal.querySelectorAll('.btn-recover-direct').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const p = dbCurrent.presupuestos.find(x => x['ID Presupuesto'] === id);
                if (p) {
                    if (confirm(`¿Estás seguro de que deseas recuperar el presupuesto ${id}? Se borrarán sus datos de emisión anteriores y volverá al estado inicial (Borrador) para que pueda editarlo.`)) {
                        p.Estado = 1; // Revert to Borrador
                        delete p.Anulado;
                        delete p.Fecha_Anulacion;
                        delete p.controlNumber;
                        delete p.mhControlNumber;
                        delete p.receptionSeal;
                        delete p.Doc_a_Emitir;
                        delete p.Fecha_Facturacion;
                        delete p.Condicion;
                        saveDatabase(dbCurrent);
                        showToast(`Presupuesto ${id} recuperado correctamente al estado inicial (Borrador).`, "success");
                        modal.remove();
                        handleRouting();
                    }
                }
            });
        });
        
        modal.querySelectorAll('.btn-delete-direct').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el presupuesto ${id}? Esta acción no se puede deshacer y borrará también sus detalles.`)) {
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
                    showToast(`Presupuesto ${id} eliminado permanentemente.`, "success");
                    renderModalContent();
                }
            });
        });
        
        const closeModal = () => { modal.remove(); };
        document.getElementById('close-anulados-modal').addEventListener('click', closeModal);
        document.getElementById('close-anulados-btn').addEventListener('click', closeModal);
    }
    
    renderModalContent();
    document.body.appendChild(modal);
}

export function renderPendingTab(container) {
    const db = getDatabase();
    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

    const pending = db.presupuestos.filter(p => p.Estado == 5);
    
    container.innerHTML = html`
        <div class="glass-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;">
                <h3 style="margin: 0;"><i class="fa-solid fa-clock-rotate-left"></i> Presupuestos Aprobados por Facturar</h3>
                <div class="search-bar-container" style="max-width: 350px; flex-grow: 1; margin: 0;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="pending-dte-search" placeholder="Buscar por número, cliente, placa o monto...">
                </div>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Código Presupuesto</th>
                            <th>Fecha Aprobación</th>
                            <th>Cliente</th>
                            <th>Placas Auto</th>
                            <th>Total (Con IVA)</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="pending-dte-rows">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    const rowsContainer = document.getElementById('pending-dte-rows');
    const searchInput = document.getElementById('pending-dte-search');
    
    function populate(filter = '') {
        rowsContainer.innerHTML = '';
        
        const filtered = pending.filter(p => {
            const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === p['ID Presupuesto']);
            const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === p['ID Presupuesto']);
            const sumProd = products.reduce((sum, prod) => sum + parseFloat(prod.PrecioUnitario || 0) * parseInt(prod.Cantidad || 1), 0);
            const sumLab = labor.reduce((sum, lab) => sum + parseFloat(lab.PrecioUnitario || 0) * parseInt(lab.Cantidad || 1), 0);
            const subtotal = sumProd + sumLab;
            const taxRate = parseFloat(p['% Impuesto'] !== undefined ? p['% Impuesto'] : 0.13);
            const iva = subtotal * taxRate;
            const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || {};
            let retVal = 0;
            let percVal = 0;
            if (client.AplicaRetencion > 0) retVal = subtotal * parseFloat(client.AplicaRetencion);
            if (client.AplicaPercepcion > 0) percVal = subtotal * parseFloat(client.AplicaPercepcion);
            const grandTotal = subtotal + iva + percVal - retVal;
            const grandTotalString = grandTotal.toFixed(2);
            const grandTotalFormatted = grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            const term = filter.toLowerCase().trim();
            const termWithDot = term.replace(',', '.');
            return (p['ID Presupuesto'] || '').toLowerCase().includes(term) ||
                (p.Nombre || '').toLowerCase().includes(term) ||
                (p.Placas || '').toLowerCase().includes(term) ||
                grandTotalString.includes(term) ||
                grandTotalString.includes(termWithDot) ||
                grandTotalFormatted.toLowerCase().includes(term);
        });
        
        if (filtered.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay presupuestos pendientes de facturación</td></tr>';
            return;
        }
        
        filtered.forEach(p => {
            const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === p['ID Presupuesto']);
            const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === p['ID Presupuesto']);
            
            const sumProd = products.reduce((sum, prod) => sum + parseFloat(prod.PrecioUnitario || 0) * parseInt(prod.Cantidad || 1), 0);
            const sumLab = labor.reduce((sum, lab) => sum + parseFloat(lab.PrecioUnitario || 0) * parseInt(lab.Cantidad || 1), 0);
            const subtotal = sumProd + sumLab;
            const taxRate = parseFloat(p['% Impuesto'] !== undefined ? p['% Impuesto'] : 0.13);
            const iva = subtotal * taxRate;
            
            const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || {};
            let retVal = 0;
            let percVal = 0;
            if (client.AplicaRetencion > 0) {
                retVal = subtotal * parseFloat(client.AplicaRetencion);
            }
            if (client.AplicaPercepcion > 0) {
                percVal = subtotal * parseFloat(client.AplicaPercepcion);
            }
            const grandTotal = subtotal + iva + percVal - retVal;
            
            const tr = document.createElement('tr');
            tr.innerHTML = html`
                <td><strong>${p['ID Presupuesto']}</strong></td>
                <td>${p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A'}</td>
                <td>${p.Nombre}</td>
                <td><span class="badge-tag badge-primary">${p.Placas || 'N/A'}</span></td>
                <td><strong>$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><span class="badge-tag badge-primary" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">Aprobado</span></td>
                <td>
                    <div style="display: flex; gap: 0.35rem;">
                        <a href="#facturador?presId=${p['ID Presupuesto']}" class="btn btn-success" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-file-signature"></i> Facturar DTE</a>
                        <a href="#presupuestos?id=${p['ID Presupuesto']}" class="btn btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-eye"></i> Ver Detalle</a>
                    </div>
                </td>
            `;
            rowsContainer.appendChild(tr);
        });
    }
    
    searchInput.addEventListener('input', (e) => populate(e.target.value));
    populate();
}

export function renderIssuedTab(container) {
    const db = getDatabase();
    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

    // Helper to format local date YYYY-MM-DD
    const formatLocalYYYYMMDD = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const defaultStart = formatLocalYYYYMMDD(sevenDaysAgo);
    const defaultEnd = formatLocalYYYYMMDD(today);
    
    container.innerHTML = html`
        <div class="glass-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;">
                <h3 style="margin: 0;"><i class="fa-solid fa-file-invoice-dollar"></i> Historial de DTEs Emitidos a Hacienda</h3>
                <div class="search-bar-container" style="max-width: 350px; flex-grow: 1; margin: 0;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="issued-dte-search" placeholder="Buscar por DTE, cliente, placa o monto...">
                </div>
            </div>

            <div style="display: flex; gap: 1rem; align-items: center; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); padding: 0.75rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label for="dte-date-start" style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Desde:</label>
                    <input type="date" id="dte-date-start" style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; padding: 0.35rem 0.6rem; font-size: 0.85rem; outline: none; font-family: inherit;">
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label for="dte-date-end" style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Hasta:</label>
                    <input type="date" id="dte-date-end" style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; padding: 0.35rem 0.6rem; font-size: 0.85rem; outline: none; font-family: inherit;">
                </div>
                <button class="btn btn-primary" id="btn-filter-dte-dates" style="padding: 0.35rem 1rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
                    <i class="fa-solid fa-filter"></i> Filtrar Fechas
                </button>
                <button class="btn btn-secondary" id="btn-clear-dte-dates" style="padding: 0.35rem 1rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
                    <i class="fa-solid fa-rotate-left"></i> Todo
                </button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Número de Control / DTE</th>
                            <th>Fecha Emisión</th>
                            <th>Cliente</th>
                            <th>Placas Auto</th>
                            <th>Tipo DTE</th>
                            <th>Total (Con IVA)</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="issued-dte-rows">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    const rowsContainer = document.getElementById('issued-dte-rows');
    const searchInput = document.getElementById('issued-dte-search');
    const dateStartInput = document.getElementById('dte-date-start');
    const dateEndInput = document.getElementById('dte-date-end');
    const btnFilterDates = document.getElementById('btn-filter-dte-dates');
    const btnClearDates = document.getElementById('btn-clear-dte-dates');
    
    // Initialize default range (last 7 days)
    dateStartInput.value = defaultStart;
    dateEndInput.value = defaultEnd;
    
    function populate(filter = '') {
        rowsContainer.innerHTML = '';
        
        const startVal = dateStartInput.value;
        const endVal = dateEndInput.value;
        
        const startTime = startVal ? new Date(startVal + 'T00:00:00').getTime() : 0;
        const endTime = endVal ? new Date(endVal + 'T23:59:59').getTime() : Infinity;
        
        const allIssued = db.presupuestos.filter(p => p.Estado == 3 || p.Estado == 4);
        
        const dateFiltered = allIssued.filter(p => {
            const itemTime = p.Fecha_Facturacion ? new Date(p.Fecha_Facturacion).getTime() : new Date(p.Fecha).getTime();
            return itemTime >= startTime && itemTime <= endTime;
        });
        
        const filtered = dateFiltered.filter(p => {
            const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === p['ID Presupuesto']);
            const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === p['ID Presupuesto']);
            const sumProd = products.reduce((sum, prod) => sum + parseFloat(prod.PrecioUnitario || 0) * parseInt(prod.Cantidad || 1), 0);
            const sumLab = labor.reduce((sum, lab) => sum + parseFloat(lab.PrecioUnitario || 0) * parseInt(lab.Cantidad || 1), 0);
            const subtotal = sumProd + sumLab;
            
            const discount = parseFloat(p.Descuento || 0);
            const subtotalConDescuento = Math.max(0, subtotal - discount);
            
            const taxRate = parseFloat(p['% Impuesto'] !== undefined ? p['% Impuesto'] : 0.13);
            const iva = subtotalConDescuento * taxRate;
            const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || {};
            let retVal = 0;
            let percVal = 0;
            if (client.AplicaRetencion > 0) retVal = subtotalConDescuento * parseFloat(client.AplicaRetencion);
            if (client.AplicaPercepcion > 0) percVal = subtotalConDescuento * parseFloat(client.AplicaPercepcion);
            const grandTotal = subtotalConDescuento + iva + percVal - retVal;
            const grandTotalString = grandTotal.toFixed(2);
            const grandTotalFormatted = grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            const term = filter.toLowerCase().trim();
            const termWithDot = term.replace(',', '.');
            return (p.controlNumber || '').toLowerCase().includes(term) ||
                (p['ID Presupuesto'] || '').toLowerCase().includes(term) ||
                (p.Nombre || '').toLowerCase().includes(term) ||
                (p.Placas || '').toLowerCase().includes(term) ||
                grandTotalString.includes(term) ||
                grandTotalString.includes(termWithDot) ||
                grandTotalFormatted.toLowerCase().includes(term);
        });
        
        // Sort by billing date descending (newest first)
        filtered.sort((a, b) => {
            const timeA = a.Fecha_Facturacion ? new Date(a.Fecha_Facturacion).getTime() : new Date(a.Fecha).getTime();
            const timeB = b.Fecha_Facturacion ? new Date(b.Fecha_Facturacion).getTime() : new Date(b.Fecha).getTime();
            return timeB - timeA;
        });

        if (filtered.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay DTEs emitidos registrados en este rango de fechas</td></tr>';
            return;
        }
        
        filtered.forEach(p => {
            const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === p['ID Presupuesto']);
            const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === p['ID Presupuesto']);
            
            const sumProd = products.reduce((sum, prod) => sum + parseFloat(prod.PrecioUnitario || 0) * parseInt(prod.Cantidad || 1), 0);
            const sumLab = labor.reduce((sum, lab) => sum + parseFloat(lab.PrecioUnitario || 0) * parseInt(lab.Cantidad || 1), 0);
            const subtotal = sumProd + sumLab;
            
            const discount = parseFloat(p.Descuento || 0);
            const subtotalConDescuento = Math.max(0, subtotal - discount);
            
            const taxRate = parseFloat(p['% Impuesto'] !== undefined ? p['% Impuesto'] : 0.13);
            const iva = subtotalConDescuento * taxRate;
            
            const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || {};
            let retVal = 0;
            let percVal = 0;
            if (client.AplicaRetencion > 0) {
                retVal = subtotalConDescuento * parseFloat(client.AplicaRetencion);
            }
            if (client.AplicaPercepcion > 0) {
                percVal = subtotalConDescuento * parseFloat(client.AplicaPercepcion);
            }
            const grandTotal = subtotalConDescuento + iva + percVal - retVal;
            
            const isAnulado = p.Estado == 4 || p.Anulado;
            const dteLabel = p.Doc_a_Emitir === 'CREDITO FISCAL' ? 'Crédito Fiscal (CCF)' : 'Factura (FE)';
            const typeBadge = isAnulado 
                ? `<span class="badge-tag badge-secondary">${dteLabel}</span> <span class="badge-tag" style="background: rgba(231, 76, 60, 0.15); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); font-weight: bold; font-size: 0.75rem;">ANULADO</span>`
                : `<span class="badge-tag badge-secondary">${dteLabel}</span>`;
                
            const genCode = p.controlNumber || 'MOCK-DTE-123456';
            const ctrlNum = p.mhControlNumber || p.controlNumber || 'N/A';
            const displayCtrl = ctrlNum;
            const uuidText = p.controlNumber && p.controlNumber !== p.mhControlNumber ? p.controlNumber : '';
            const uuidSub = uuidText ? `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.15rem; font-family: monospace;" title="Código de Generación (UUID): ${uuidText}">Gen: ${uuidText.substring(0, 8)}...</div>` : '';
            
            // Dropdown definition
            if (!window.toggleDteDropdown) {
                window.toggleDteDropdown = function(event, budgetId) {
                    event.stopPropagation();
                    event.preventDefault();
                    document.querySelectorAll('.dte-actions-dropdown').forEach(dropdown => {
                        if (dropdown.id !== `dropdown-${budgetId}`) {
                            dropdown.style.display = 'none';
                        }
                    });
                    const dropdown = document.getElementById(`dropdown-${budgetId}`);
                    if (dropdown) {
                        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
                    }
                };

                document.addEventListener('click', () => {
                    document.querySelectorAll('.dte-actions-dropdown').forEach(dropdown => {
                        dropdown.style.display = 'none';
                    });
                });
            }

            const actionsHtml = isAnulado
                ? `
                    <div style="position: relative; display: inline-block;">
                        <button class="btn btn-secondary" onclick="toggleDteDropdown(event, '${p['ID Presupuesto']}')" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.3rem;" title="Ver Opciones">
                            <i class="fa-solid fa-ellipsis-vertical"></i> Acciones <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem;"></i>
                        </button>
                        <div id="dropdown-${p['ID Presupuesto']}" class="dte-actions-dropdown">
                            <a href="#presupuestos?id=${p['ID Presupuesto']}" class="dte-dropdown-item" title="Ver Detalle Presupuesto"><i class="fa-solid fa-eye"></i> Detalle</a>
                            <button class="dte-dropdown-item btn-print-dte-ticket" data-id="${p['ID Presupuesto']}" title="Imprimir Ticket"><i class="fa-solid fa-receipt"></i> Ticket</button>
                            <button class="dte-dropdown-item btn-reemit-dte" data-id="${p['ID Presupuesto']}" title="Clonar presupuesto para re-facturar"><i class="fa-solid fa-copy"></i> Re-emitir</button>
                        </div>
                    </div>
                  `
                : `
                    <div style="position: relative; display: inline-block;">
                        <button class="btn btn-secondary" onclick="toggleDteDropdown(event, '${p['ID Presupuesto']}')" style="padding: 0.35rem 0.65rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.3rem;" title="Ver Opciones">
                            <i class="fa-solid fa-ellipsis-vertical"></i> Acciones <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem;"></i>
                        </button>
                        <div id="dropdown-${p['ID Presupuesto']}" class="dte-actions-dropdown">
                            <a href="#presupuestos?id=${p['ID Presupuesto']}" class="dte-dropdown-item" title="Ver Detalle Presupuesto / Factura"><i class="fa-solid fa-eye"></i> Detalle</a>
                            <button class="dte-dropdown-item btn-view-dte-pdf" data-id="${genCode}" title="Ver Representación Gráfica DTE (MH)"><i class="fa-solid fa-file-pdf"></i> PDF</button>
                            <button class="dte-dropdown-item btn-print-dte-ticket" data-id="${p['ID Presupuesto']}" title="Imprimir Ticket"><i class="fa-solid fa-receipt"></i> Ticket</button>
                            <button class="dte-dropdown-item btn-query-dte" data-id="${genCode}" title="Consultar Estado en MH"><i class="fa-solid fa-magnifying-glass"></i> Consultar</button>
                            <div style="border-top: 1px solid var(--border-color); margin: 0.25rem 0;"></div>
                            <button class="dte-dropdown-item btn-invalidate-dte" data-id="${genCode}" data-presid="${p['ID Presupuesto']}" style="color: #ef4444;" title="Anular DTE"><i class="fa-solid fa-ban"></i> Anular</button>
                        </div>
                    </div>
                  `;
            
            const tr = document.createElement('tr');
            if (isAnulado) {
                tr.style.opacity = '0.75';
                tr.style.background = 'rgba(231, 76, 60, 0.03)';
            }
            tr.innerHTML = html`
                <td>
                    <strong style="font-family: monospace; font-size: 0.85rem;" title="Número de Control: ${ctrlNum}">${displayCtrl}</strong>
                    ${safe(uuidSub)}
                </td>
                <td>${p.Fecha_Facturacion ? new Date(p.Fecha_Facturacion).toLocaleDateString('es-SV') : 'N/A'}</td>
                <td>${p.Nombre}</td>
                <td><span class="badge-tag badge-primary">${p.Placas || 'N/A'}</span></td>
                <td>${safe(typeBadge)}</td>
                <td><strong>$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td>
                    <div>
                        ${safe(actionsHtml)}
                    </div>
                </td>
            `;
            rowsContainer.appendChild(tr);
        });
        
        // Bind PDF DTE Buttons
        rowsContainer.querySelectorAll('.btn-view-dte-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                viewDtePdf(btn.getAttribute('data-id'));
            });
        });
        
        // Bind Ticket Buttons
        rowsContainer.querySelectorAll('.btn-print-dte-ticket').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                printDteTicket(btn.getAttribute('data-id'));
            });
        });
        
        // Bind Query Buttons
        rowsContainer.querySelectorAll('.btn-query-dte').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                queryDteStatusMH(btn.getAttribute('data-id'));
            });
        });
        
        // Bind Invalidate Buttons
        rowsContainer.querySelectorAll('.btn-invalidate-dte').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openInvalidateDteModal(btn.getAttribute('data-id'), btn.getAttribute('data-presid'));
            });
        });

        // Bind Re-emit Buttons
        rowsContainer.querySelectorAll('.btn-reemit-dte').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                reemitBudget(btn.getAttribute('data-id'));
            });
        });
    }
    
    btnFilterDates.addEventListener('click', () => {
        populate(searchInput.value);
    });
    
    btnClearDates.addEventListener('click', () => {
        dateStartInput.value = '';
        dateEndInput.value = '';
        populate(searchInput.value);
    });

    searchInput.addEventListener('input', (e) => populate(e.target.value));
    populate();
}

export function renderInvoicingWorkspace(container, presId) {
    const db = getDatabase();
    const p = db.presupuestos.find(b => b['ID Presupuesto'] === presId);
    if (!p) {
        container.innerHTML = html`
            <div class="glass-card" style="text-align: center; padding: 3rem;">
                <h3 style="color: var(--danger);">Presupuesto no encontrado</h3>
                <a href="#facturador" class="btn btn-secondary" style="margin-top: 1rem;"><i class="fa-solid fa-arrow-left"></i> Volver al Listado</a>
            </div>
        `;
        return;
    }
    
    const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || { Nombre: p.Nombre };

    if (p.Estado == 3) {
        container.innerHTML = html`
            <div style="margin-bottom: 1.5rem;">
                <a href="#facturador" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-arrow-left"></i> Volver al Listado</a>
            </div>
            
            <div class="glass-card" style="text-align: center; padding: 3rem 1.5rem; border-color: var(--warning);">
                <i class="fa-solid fa-circle-check" style="font-size: 4rem; color: var(--success); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--success);">Presupuesto ya Facturado</h3>
                <p style="color: var(--text-secondary); margin-top: 0.5rem; max-width: 500px; margin-left: auto; margin-right: auto; font-size: 0.95rem;">
                    Este presupuesto (ID: <strong>${presId}</strong>) ya ha sido procesado y transmitido con éxito al Ministerio de Hacienda.
                </p>
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; max-width: 450px; margin: 1.5rem auto; text-align: left; font-size: 0.85rem;">
                    <p style="margin-bottom: 0.4rem;"><strong>Documento Emitido:</strong> ${p.Doc_a_Emitir || 'N/A'}</p>
                    <p style="margin-bottom: 0.4rem;"><strong>Código de Generación (UUID):</strong> <code style="color: var(--cyan); word-break: break-all;">${p.controlNumber || 'N/A'}</code></p>
                    <p style="margin-bottom: 0.4rem;"><strong>Número de Control:</strong> <strong style="color: var(--success); font-family: monospace;">${p.mhControlNumber || 'N/A'}</strong></p>
                    <p style="margin-bottom: 0;"><strong>Fecha de Facturación:</strong> ${p.Fecha_Facturacion ? new Date(p.Fecha_Facturacion).toLocaleString() : 'N/A'}</p>
                </div>
                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">
                    <a href="#facturador" onclick="localStorage.setItem('mecanic_os_facturador_active_tab', 'issued')" class="btn btn-primary"><i class="fa-solid fa-list-check"></i> Ver Historial de DTEs</a>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = html`
        <div style="margin-bottom: 1.5rem;">
            <a href="#facturador" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-arrow-left"></i> Volver al Listado</a>
        </div>
        
        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3>Emitir Documento Tributario Electrónico (DTE MH)</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">Genera y firma comprobantes de facturación digital con validación directa del Ministerio de Hacienda de El Salvador.</p>
            
            <div class="form-row" style="grid-template-columns: 1.5fr 1fr; gap: 1.5rem;">
                <div>
                    <div id="invoice-details-box" style="background-color: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
                        <!-- Injected -->
                    </div>
                </div>
                
                <div class="glass-card" id="invoice-billing-settings" style="height: fit-content; margin: 0; padding: 1.25rem; background-color: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color);">
                    <h3>Ajustes de Emisión</h3>
                    <div class="form-group" style="margin-top: 1rem;">
                        <label>Tipo de DTE a Emitir</label>
                        <select id="dte-doc-type" style="padding:0.6rem; width:100%;">
                            <option value="FE">Factura Electrónica (Consumidor Final)</option>
                            <option value="CCF">Comprobante de Crédito Fiscal (Empresas)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Condición de Pago</label>
                        <select id="dte-pay-condition" style="padding:0.6rem; width:100%;">
                            <option value="CONTADO">Contado (Efectivo/Tarjeta/Transferencia)</option>
                            <option value="CREDITO">Crédito (Abonos)</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="credit-days-group" style="display: none;">
                        <label>Días de Plazo</label>
                        <input type="number" id="dte-credit-days" value="30" min="1" style="padding:0.6rem; width:100%;">
                    </div>
                    
                    <div class="form-group">
                        <label>Forma de Pago Principal</label>
                        <select id="dte-pay-method" style="padding:0.6rem; width:100%;">
                            <option value="01">01 - Efectivo</option>
                            <option value="02">02 - Tarjeta de Crédito/Débito</option>
                            <option value="03">03 - Transferencia / Depósito</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-success" id="emit-dte-btn" style="width: 100%; margin-top: 1rem; padding: 0.75rem;"><i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH</button>
                </div>
            </div>
        </div>
        
        <!-- Print/DTE Preview area -->
        <div id="dte-emission-result" class="glass-card" style="display: none; border-color: var(--success); margin-top: 2rem;">
            <!-- Render MH seal, generation code and print structure -->
        </div>
    `;
    
    const detailsBox = document.getElementById('invoice-details-box');
    const dteType = document.getElementById('dte-doc-type');
    const dtePayCond = document.getElementById('dte-pay-condition');
    const creditDaysGroup = document.getElementById('credit-days-group');
    const emitBtn = document.getElementById('emit-dte-btn');
    const resultBox = document.getElementById('dte-emission-result');
    
    // Load calculations
    const prodItems = (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(item => item['ID_Presupuesto DPP'] === presId);
    const laborItems = (db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || []).filter(item => item['ID_Presupuesto MO'] === presId);

    const promo = (db.promociones || []).find(pr => pr.ID_Promocion === p.ID_Promocion);
    
    const totalNetBeforeDiscount = 
        prodItems.reduce((acc, item) => acc + parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1), 0) +
        laborItems.reduce((acc, item) => acc + parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1), 0);
        
    const flatDiscountFactor = (promo && promo.Tipo === 'monto_fijo' && totalNetBeforeDiscount > 0) 
        ? Math.max(0, 1 - parseFloat(promo.Valor || 0) / totalNetBeforeDiscount)
        : 1;

    function getItemDiscountedPrice(item, isLabor) {
        const rawPrice = parseFloat(item.PrecioUnitario || 0);
        if (!promo) return rawPrice;
        
        if (promo.Tipo === 'monto_fijo') {
            return parseFloat((rawPrice * flatDiscountFactor).toFixed(4));
        }
        if (isLabor && promo.Tipo === 'desc_mano_obra') {
            return parseFloat((rawPrice * (1 - parseFloat(promo.Valor || 0) / 100)).toFixed(4));
        }
        if (!isLabor && promo.Tipo === 'desc_productos') {
            return parseFloat((rawPrice * (1 - parseFloat(promo.Valor || 0) / 100)).toFixed(4));
        }
        return rawPrice;
    }

    let subtotal = 0;
    prodItems.forEach(item => subtotal += getItemDiscountedPrice(item, false) * parseInt(item.Cantidad || 1));
    laborItems.forEach(item => subtotal += getItemDiscountedPrice(item, true) * parseInt(item.Cantidad || 1));
    
    const iva = subtotal * 0.13;
    let grandTotal = subtotal + iva;
    
    let retention = 0;
    let perception = 0;
    if (client.AplicaPercepcion > 0) {
        perception = subtotal * parseFloat(client.AplicaPercepcion);
        grandTotal += perception;
    }
    if (client.AplicaRetencion > 0) {
        retention = subtotal * parseFloat(client.AplicaRetencion);
        grandTotal -= retention;
    }

    // Auto select DTE document type based on client data
    if (client['Contribuyente?'] === 'SI') {
        dteType.value = 'CCF';
    } else {
        dteType.value = 'FE';
    }
    
    // Auto select payment condition if budget has it set or if client has credit enabled
    const hasCreditEnabled = client['Credito?'] === 'SI';
    if (p.Condicion === 'CREDITO' || (p.Condicion !== 'CONTADO' && hasCreditEnabled)) {
        dtePayCond.value = 'CREDITO';
        creditDaysGroup.style.display = 'block';
        if (client['Plazo Credito Días']) {
            const creditDaysInput = document.getElementById('dte-credit-days');
            if (creditDaysInput) {
                creditDaysInput.value = parseInt(client['Plazo Credito Días']);
            }
        }
    } else {
        dtePayCond.value = 'CONTADO';
        creditDaysGroup.style.display = 'none';
    }
    
    detailsBox.innerHTML = html`
        <h4>Detalle del Presupuesto a Facturar</h4>
        <div style="margin: 1rem 0; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem;">
            <p>Cliente: <strong>${client.Nombre}</strong></p>
            <p>NIT/DUI: ${client.NIT || client['Num Doc'] || 'N/A'}</p>
            <p>Vehículo Placas: <strong style="color: var(--primary);">${p.Placas || 'N/A'}</strong></p>
        </div>
        
        <div style="border-top: 1px dashed var(--border-color); padding-top: 1rem; margin-top: 1rem;">
            <h5 style="margin-bottom:0.75rem;">Ítems a Emitir</h5>
            <div style="display:flex; flex-direction:column; gap:0.4rem;">
                ${safe(prodItems.map(item => `<div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>${item.Cantidad}x ${item.Descripcion}</span><span>$ ${(getItemDiscountedPrice(item, false)*parseInt(item.Cantidad)).toFixed(2)}</span></div>`).join(''))}
                ${safe(laborItems.map(item => `<div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>${item.Cantidad}x ${item.Descripcion}</span><span>$ ${(getItemDiscountedPrice(item, true)*parseInt(item.Cantidad)).toFixed(2)}</span></div>`).join(''))}
            </div>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem; font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.3rem;">
            <div style="display:flex; justify-content:space-between;"><span>Subtotal Neto:</span><span>$ ${subtotal.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>IVA (13%):</span><span>$ ${iva.toFixed(2)}</span></div>
            ${safe(perception > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Percepción:</span><span>+ $ ${perception.toFixed(2)}</span></div>` : '')}
            ${safe(retention > 0 ? `<div style="display:flex; justify-content:space-between;"><span>Retención:</span><span>- $ ${retention.toFixed(2)}</span></div>` : '')}
            <div style="display:flex; justify-content:space-between; font-weight:700; margin-top:0.5rem; font-size:1.1rem; color:var(--cyan);"><span>TOTAL DTE:</span><span>$ ${grandTotal.toFixed(2)}</span></div>
        </div>
    `;

    dtePayCond.addEventListener('change', (e) => {
        if (e.target.value === 'CREDITO') {
            creditDaysGroup.style.display = 'block';
        } else {
            creditDaysGroup.style.display = 'none';
        }
    });

    emitBtn.addEventListener('click', () => {
        const type = dteType.value;
        const payCond = dtePayCond.value;
        const payMethod = document.getElementById('dte-pay-method').value;

        // Cash Session Validation
        const openSession = (db.cajas_sesiones || []).find(s => s.estado === 'ABIERTA');
        if (!openSession) {
            showToast("Error: Debe abrir una Caja Diaria en el módulo de Control de Caja antes de facturar.", "danger");
            window.location.hash = 'caja';
            return;
        }
        
        // Credit validation
        if (payCond === 'CREDITO') {
            if (client['Credito?'] !== 'SI') {
                showToast("Error: El cliente no tiene una línea de crédito autorizada.", "danger");
                return;
            }
            const creditLimit = parseFloat(client['Monto Credito'] || client.Monto_Credito || 0);
            const pendingBalance = getClientPendingBalance(client.Codigo_Cliente, db);
            if (pendingBalance + grandTotal > creditLimit) {
                showToast(`Límite de crédito excedido: Saldo actual $${pendingBalance.toFixed(2)} + Nueva Factura $${grandTotal.toFixed(2)} = $${(pendingBalance + grandTotal).toFixed(2)} (Límite: $${creditLimit.toFixed(2)}).`, "danger");
                return;
            }
        }
        
        // Fetch FacturaLlama config
        const dteCfg = (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.dte_config) ||
                       getSecureDteConfig();

        const isCCF = type === 'CCF';
        const deptName = client.Depto || 'San Salvador';
        const muniName = client.Municipio || 'San Salvador Centro';
        
        let deptCode = DEPARTAMENTOS_CODES[deptName] || deptName;
        if (isNaN(deptCode)) {
            deptCode = DEPARTAMENTOS_CODES[Object.keys(DEPARTAMENTOS_CODES).find(k => k.toLowerCase() === deptName.trim().toLowerCase())] || '06';
        }
        
        let muniCode = muniName;
        if (muniName && isNaN(muniName)) {
            const matchedMuniKey = Object.keys(MUNICIPIOS_CODES).find(k => k.toUpperCase() === muniName.trim().toUpperCase());
            muniCode = matchedMuniKey ? MUNICIPIOS_CODES[matchedMuniKey] : '23';
        } else if (muniName && muniName.length >= 4) {
            muniCode = muniName.substring(muniName.length - 2);
        }

        const phoneClean = (client['Telefono 1 '] || client.Telefono || '').replace(/\D/g, '').slice(0, 8);
        const docTypeVal = client['Tipo Doc'] === 'NIT' ? 'NIT' : 'DUI';
        const docNumClean = (client['Num Doc'] || client.NIT || '').replace(/\D/g, '');

        let recipientPayload = {
            name: client.Nombre || 'Consumidor Final',
            email: client.Correo || 'facturacion@mecanicos.com',
            address: {
                department: deptCode,
                municipality: muniCode,
                complement: (client.Direccion || 'San Salvador').substring(0, 200)
            },
            identificationDocument: {
                type: docTypeVal,
                number: docNumClean
            }
        };

        if (phoneClean && phoneClean.length === 8) {
            recipientPayload.phone = phoneClean;
        }

        if (isCCF) {
            recipientPayload.contributorType = client['Tipo Cliente'] === 'JURIDICA' ? 'JURIDICA' : 'NATURAL';
            let giroCode = '45201';
            if (client.Giro) {
                const match = client.Giro.match(/^\d{5}/);
                if (match) {
                    giroCode = match[0];
                } else {
                    giroCode = client.Giro.replace(/\D/g, '').slice(0, 5) || '45201';
                }
            }
            recipientPayload.economicActivity = giroCode;
            recipientPayload.nrc = (client.NRC || '').replace(/\D/g, '').slice(0, 8);
        }

        const formattedItems = [
            ...prodItems.map(item => {
                const rawPrice = getItemDiscountedPrice(item, false);
                const unitPrice = isCCF ? parseFloat((rawPrice / 1.13).toFixed(4)) : rawPrice;
                return {
                    type: 'BIENES',
                    internalCode: String(item['ID_Producto DPP'] || '').trim(),
                    description: item.Descripcion || 'Producto',
                    quantity: parseInt(item.Cantidad || 1),
                    unitPrice: unitPrice,
                    saleType: 'GRAVADA'
                };
            }),
            ...laborItems.map(item => {
                const rawPrice = getItemDiscountedPrice(item, true);
                const unitPrice = isCCF ? parseFloat((rawPrice / 1.13).toFixed(4)) : rawPrice;
                return {
                    type: 'SERVICIOS',
                    internalCode: String(item['ID_ManoObra'] || '').trim(),
                    description: item.Descripcion || 'Mano de Obra',
                    quantity: parseInt(item.Cantidad || 1),
                    unitPrice: unitPrice,
                    saleType: 'GRAVADA'
                };
            })
        ];

        const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === p.ID_Vehiculo) || { Placas: p.Placas || 'N/A' };
        const vehicleInfo = `${vehicle.Placas || 'n/a'} ${vehicle.Marca || ''} ${vehicle.Modelo || ''} ${vehicle.Año || vehicle.Anio || ''}`;
        const ws = (db.saas_state && db.saas_state.workshopData) || {};

        const dtePayload = {
            id: generateUUID(),
            recipient: recipientPayload,
            items: formattedItems
        };

        if (payCond === 'CREDITO') {
            dtePayload.paymentType = 'CREDITO';
        } else {
            dtePayload.paymentType = 'CONTADO';
        }

        emitBtn.disabled = true;
        emitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Transmitiendo...';

        const baseUrl = sanitizeBackendUrl(dteCfg.backendUrl || getBackendUrl(db));
        const isSimulated = !dteCfg.apiKey || dteCfg.apiKey.trim() === '' || dteCfg.apiKey.startsWith('simulado_');

        if (!baseUrl && !isSimulated) {
            showToast("Error: Debe configurar la 'URL del Servidor Backend' en Ajustes para transmitir con su API Key real.", "danger");
            emitBtn.disabled = false;
            emitBtn.innerHTML = '<i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH';
            return;
        }

        // Helper to process DTE emission success
        function processSuccess(resData) {
            const genCode = resData.generationCode || resData.id || generateUUID();
            const ctrlNum = resData.controlNumber || ("DTE-" + (type === 'CCF' ? '03' : '01') + "-M001P001-0000" + Math.floor(Math.random()*9000 + 1000));
            const seal = resData.receptionSeal || (Math.floor(Math.random()*900000) + "-APPROVED");
            const mhUrl = resData.mhDteUrl || `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${genCode}&fechaEmi=${new Date().toISOString().split('T')[0]}`;

            p.Estado = 3;
            const wsConfig = getWorkshopConfig(db);
            p.Tipo_Comision = wsConfig.tipo_comision || 'general';
            p.controlNumber = genCode;
            p.mhControlNumber = ctrlNum;
            p.receptionSeal = seal;
            p.Doc_a_Emitir = type === 'CCF' ? 'CREDITO FISCAL' : 'FACTURA';
            p.Fecha_Facturacion = Date.now();
            p.Condicion = payCond;
            p.Pagado = payCond === 'CONTADO' ? 'SI' : 'NO';
            p['Pagado?'] = payCond === 'CONTADO' ? 'SI' : 'NO';

            // Deduct inventory stock and record Kardex movements for invoiced products
            const prodItems = (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(item => item['ID_Presupuesto DPP'] === presId);
            prodItems.forEach(item => {
                const prodId = item['ID_Producto DPP'];
                const qty = parseInt(item.Cantidad || 1);
                
                const dbProd = db.productos.find(prod => prod['ID_ Producto'] === prodId);
                if (dbProd) {
                    dbProd.Minimos = Math.max(0, (dbProd.Minimos || 0) - qty);
                    
                    // Register Kardex movement
                    db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
                    db['29 Movs de Inventario'].unshift({
                        id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                        id_producto: prodId,
                        descripcion: dbProd.Descripcion,
                        Cant_Mov: qty,
                        "Fecha Mov": Date.now(),
                        Tipo: "SALIDA",
                        "Valor ($)": parseFloat(item.PrecioUnitario || dbProd['Precio Unit'] || 10),
                        Observacion: `Facturación Presupuesto ${presId}`,
                        DTE: ctrlNum
                    });
                }
            });
            
            if (payCond === 'CONTADO') {
                const payId = "PAGO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
                db.pagos = db.pagos || [];
                db.pagos.unshift({
                    "ID Pago": payId,
                    ID_Presupuesto: presId,
                    "Fecha Pago": Date.now(),
                    "Monto Pago": grandTotal,
                    "Metodo Pago": payMethod === '01' ? 'EFECTIVO' : payMethod === '02' ? 'TARJETA' : 'TRANSFERENCIA',
                    "Estado Pago": "COMPLETADO",
                    User: getActiveUser().Email || "jjmunoz932@gmail.com",
                    Cliente: p.Codigo_Cliente,
                    id_sesion: openSession.id_sesion
                });
            } else {
                showToast("Registrado en Cuentas por Cobrar del cliente", "warning");
            }

            saveDatabase(db);
            showToast("DTE Generado y Aprobado por MH El Salvador!", "success");

            // Hide billing settings and make layout full-width to prevent re-emission
            const billingSettings = document.getElementById('invoice-billing-settings');
            if (billingSettings) {
                billingSettings.style.display = 'none';
            }
            const gridEl = container.querySelector('.form-row');
            if (gridEl) {
                gridEl.style.gridTemplateColumns = '1fr';
            }
            
            resultBox.style.display = 'block';
            resultBox.innerHTML = html`
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid var(--success); padding-bottom: 1rem; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3 style="color:var(--success);"><i class="fa-solid fa-circle-check"></i> DOCUMENTO TRANSMITIDO CON ÉXITO</h3>
                        <p style="font-size:0.8rem; color:var(--text-secondary);">Validación de Sello y Código Generado</p>
                    </div>
                    <div style="display:flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir</button>
                        <a href="#facturador" class="btn btn-primary" id="btn-done-goto-history" style="text-decoration:none;"><i class="fa-solid fa-list-check"></i> Ver Historial DTEs</a>
                    </div>
                </div>
                
                <div id="print-section" style="background-color: white; color: black; padding: 2rem; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 0.85rem; border: 1px solid #ccc;">
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <h3>${wsConfig.nombre}</h3>
                        <p>${wsConfig.giro}</p>
                        <p>${wsConfig.direccion}</p>
                        <p>TEL: ${wsConfig.telefono} • NIT: ${wsConfig.nit} • NRC: ${wsConfig.nrc}</p>
                        <p>--------------------------------------------------</p>
                        <h4>DOCUMENTO TRIBUTARIO ELECTRÓNICO</h4>
                        <p><strong>${type === 'CCF' ? 'COMPROBANTE DE CRÉDITO FISCAL' : 'FACTURA DE CONSUMIDOR FINAL'}</strong></p>
                    </div>
                    
                    <p><strong>Código Generación:</strong> ${genCode}</p>
                    <p><strong>Número Control:</strong> ${ctrlNum}</p>
                    <p><strong>Sello Recepción:</strong> ${seal}</p>
                    <p><strong>Fecha/Hora Emisión:</strong> ${new Date().toLocaleString()}</p>
                    <p>--------------------------------------------------</p>
                    <p><strong>CLIENTE:</strong> ${client.Nombre}</p>
                    <p><strong>NIT/DUI:</strong> ${client.NIT || client['Num Doc'] || 'N/A'}</p>
                    <p><strong>AUTO PLACA:</strong> ${p.Placas || 'N/A'}</p>
                    <p>--------------------------------------------------</p>
                    
                    <table style="width:100%; font-size:0.8rem; border:none; text-align:left; color:black;">
                        <thead>
                            <tr style="border-bottom:1px solid black;">
                                <th>DESCRIPCIÓN</th>
                                <th>CANT</th>
                                <th>P.UNIT</th>
                                <th style="text-align:right;">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(prodItems.map(item => {
                                const discPrice = getItemDiscountedPrice(item, false);
                                return `
                                    <tr>
                                        <td>${item.Descripcion.substring(0,25)}</td>
                                        <td>${item.Cantidad}</td>
                                        <td>$${discPrice.toFixed(2)}</td>
                                        <td style="text-align:right;">$${(discPrice * parseInt(item.Cantidad)).toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join(''))}
                            ${safe(laborItems.map(item => {
                                const discPrice = getItemDiscountedPrice(item, true);
                                return `
                                    <tr>
                                        <td>${item.Descripcion.substring(0,25)}</td>
                                        <td>${item.Cantidad}</td>
                                        <td>$${discPrice.toFixed(2)}</td>
                                        <td style="text-align:right;">$${(discPrice * parseInt(item.Cantidad)).toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join(''))}
                        </tbody>
                    </table>
                    <p>--------------------------------------------------</p>
                    <div style="text-align:right;">
                        <p>Subtotal Neto: $ ${subtotal.toFixed(2)}</p>
                        <p>IVA (13%): $ ${iva.toFixed(2)}</p>
                        ${safe(perception > 0 ? `<p>Percepción (2%): $ ${perception.toFixed(2)}</p>` : '')}
                        ${safe(retention > 0 ? `<p>Retención (1%): $ ${retention.toFixed(2)}</p>` : '')}
                        <p><strong>TOTAL: $ ${grandTotal.toFixed(2)}</strong></p>
                    </div>
                    <p>--------------------------------------------------</p>
                    <div style="text-align:center; font-size:0.75rem; margin-top:1rem;">
                        <p>Enlace de Consulta Fiscal MH:</p>
                        <p style="word-break: break-all;"><a href="${mhUrl}" target="_blank" style="color:black;">${mhUrl}</a></p>
                        <p>¡Gracias por su preferencia!</p>
                    </div>
                </div>
            `;
            
            document.getElementById('btn-done-goto-history').addEventListener('click', (ev) => {
                localStorage.setItem('mecanic_os_facturador_active_tab', 'issued');
            });
            
            emitBtn.disabled = false;
            emitBtn.innerHTML = '<i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH';
        }

        if (isSimulated) {
            // Frontend Simulation Fallback
            setTimeout(() => {
                const simulatedRes = {
                    success: true,
                    simulated: true,
                    code: "00",
                    description: "DTE Simulado Exitosamente (Frontend Fallback)",
                    generationCode: "MOCK-DTE-" + Math.floor(Date.now() / 1000).toString() + "-" + Math.floor(Math.random()*10000),
                    controlNumber: "DTE-" + (type === 'CCF' ? '03' : '01') + "-M001P001-" + Math.floor(Math.random()*90000 + 10000),
                    receptionSeal: Math.floor(Math.random()*9000000).toString() + "-APPROVED-" + Math.floor(Math.random()*9000),
                    mhDteUrl: `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=MOCK&fechaEmi=${new Date().toISOString().split('T')[0]}`
                };
                processSuccess(simulatedRes);
            }, 1200);
            return;
        }

        const endpoint = `${baseUrl}/api/dte`;

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: dteCfg.apiKey,
                docType: type.toLowerCase() === 'fe' ? 'fc' : type.toLowerCase(),
                payload: dtePayload
            })
        })
        .then(response => {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("html")) {
                throw new Error("El servidor backend retornó HTML en lugar de JSON. Verifique su URL del backend en Ajustes.");
            }
            if (!response.ok) {
                return response.json().then(errData => {
                    let errMsg = '';
                    if (Array.isArray(errData.message)) {
                        errMsg = errData.message.join(', ');
                    } else {
                        errMsg = errData.message || errData.error || 'Error al emitir DTE';
                    }
                    return Promise.reject(new Error(errMsg));
                }, () => {
                    return Promise.reject(new Error(`Error del proxy backend (Código ${response.status}). Verifique la URL de su servidor.`));
                });
            }
            return response.json();
        })
        .then(resData => {
            processSuccess(resData);
        })
        .catch(err => {
            console.error(err);
            showToast(err.message, "danger");
        })
        .finally(() => {
            emitBtn.disabled = false;
            emitBtn.innerHTML = '<i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH';
        });
    });
}

async function viewDtePdf(dteId) {
    try {
        const db = getDatabase();
        const dteCfg = (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.dte_config) ||
                       getSecureDteConfig();
        
        const apiKey = dteCfg.apiKey || '';
        const baseUrl = sanitizeBackendUrl(dteCfg.backendUrl || getBackendUrl(db));
        const isSimulated = !apiKey || apiKey.trim() === '' || apiKey.startsWith('simulado_');

        if (isSimulated) {
            showToast("Simulación: Abriendo representación gráfica del DTE...", "info");
            alert("En modo de simulación, no hay un PDF real en los servidores de FacturaLlama. Cuando use su API Key real en producción, este botón abrirá la representación gráfica oficial del DTE.");
            return;
        }

        if (!baseUrl) {
            showToast("Error: Configure la URL de su servidor backend proxy en Ajustes para descargar el PDF.", "danger");
            return;
        }

        showToast("Generando representación gráfica del DTE...", "info");

        const response = await fetch(`${baseUrl}/api/dte/pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey, dteId })
        });

        if (!response.ok) {
            throw new Error(`Error al recuperar PDF (Código ${response.status})`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const pdfWin = window.open(blobUrl, '_blank');
        if (pdfWin) {
            pdfWin.opener = null;
        } else {
            showToast("Error: El navegador bloqueó la ventana emergente del PDF. Por favor permita las ventanas emergentes.", "danger");
        }
    } catch (err) {
        console.error(err);
        showToast("Error al obtener el PDF del DTE: " + err.message, "danger");
    }
}

export function printDteTicket(presId) {
    try {
        const db = getDatabase();
        let p = db.presupuestos.find(pres => pres['ID Presupuesto'] === presId);
        let isQuickSale = false;
        if (!p) {
            p = (db['43 Venta Rapida'] || []).find(vr => vr.ID_Venta_Rapida === presId);
            if (!p) {
                showToast("Error: Venta o Presupuesto no encontrado.", "danger");
                return;
            }
            isQuickSale = true;
        }

        const client = db.clientes.find(c => c.Codigo_Cliente === (p.Codigo_Cliente || p.Cliente)) || { Nombre: p.Nombre };
        const wsConfig = getWorkshopConfig(db);

        const prodItems = isQuickSale ? (p.productos || []) : (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(item => item['ID_Presupuesto DPP'] === presId);
        const laborItems = isQuickSale ? (p.mano_obra || []) : (db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || []).filter(item => item['ID_Presupuesto MO'] === presId);

        let subtotal = 0;
        prodItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || item.price || 0) * parseInt(item.Cantidad || item.qty || 1));
        laborItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || item.price || 0) * parseInt(item.Cantidad || item.qty || 1));
        
        const isCCF = p.Doc_a_Emitir === 'CREDITO FISCAL' || p['Tipo Doc'] === 'CREDITO FISCAL';
        const taxRate = parseFloat(p['% Impuesto'] !== undefined ? p['% Impuesto'] : 0.13);
        const iva = subtotal * taxRate;
        
        let retention = 0;
        let perception = 0;
        if (client.AplicaPercepcion > 0) {
            perception = subtotal * parseFloat(client.AplicaPercepcion);
        }
        if (client.AplicaRetencion > 0) {
            retention = subtotal * parseFloat(client.AplicaRetencion);
        }
        const grandTotal = subtotal + iva + perception - retention;

        const genCode = p.controlNumber || 'N/A';
        
        const ticketWindow = window.open('', '_blank', 'width=400,height=600');
        if (!ticketWindow) {
            showToast("Error: El navegador bloqueó la ventana emergente de impresión.", "danger");
            return;
        }

        ticketWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ticket DTE - ${presId}</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        html, body {
            margin: 0;
            padding: 0;
            background-color: #eaeaea;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 12px;
            color: #111;
            -webkit-print-color-adjust: exact;
        }
        .control-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 50px;
            background: rgba(30, 30, 30, 0.9);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        .control-bar span {
            color: #fff;
            font-weight: 500;
            font-size: 14px;
        }
        .btn-action {
            padding: 6px 14px;
            font-size: 13px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            text-decoration: none;
        }
        .btn-print {
            background-color: #2ecc71;
            color: white;
        }
        .btn-print:hover {
            background-color: #27ae60;
        }
        .btn-close {
            background-color: #e74c3c;
            color: white;
        }
        .btn-close:hover {
            background-color: #c0392b;
        }
        .receipt-container {
            width: 80mm;
            min-height: 100vh;
            margin: 70px auto 30px auto;
            background: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            box-sizing: border-box;
            padding: 8mm 6mm;
            position: relative;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .divider {
            border-top: 1px dashed #444;
            margin: 8px 0;
            height: 0;
        }
        .double-divider {
            border-top: 3px double #444;
            margin: 8px 0;
            height: 0;
        }
        .info-table {
            width: 100%;
            font-size: 11px;
            margin: 6px 0;
        }
        .info-table td {
            padding: 2px 0;
            vertical-align: top;
        }
        .info-table td.label {
            font-weight: bold;
            width: 35%;
            color: #333;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 11px;
        }
        .items-table th {
            border-bottom: 1px solid #000;
            padding: 4px 0;
            font-weight: bold;
            font-size: 10px;
            text-transform: uppercase;
        }
        .items-table td {
            padding: 5px 0;
            vertical-align: top;
        }
        .totals-table {
            width: 100%;
            font-size: 11px;
            margin-top: 5px;
        }
        .totals-table td {
            padding: 3px 0;
        }
        .totals-table tr.total-row td {
            font-size: 13px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 6px;
        }
        .code-box {
            font-family: monospace;
            font-size: 9px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            padding: 4px;
            border-radius: 3px;
            word-break: break-all;
            display: block;
            margin-top: 2px;
            color: #333;
        }
        .qr-section {
            margin: 15px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .qr-image {
            width: 90px;
            height: 90px;
            border: 1px solid #ddd;
            padding: 4px;
            background: #fff;
        }
        .qr-label {
            font-size: 8px;
            color: #666;
            text-align: center;
            max-width: 150px;
        }
        @media print {
            html, body {
                background-color: white;
            }
            .control-bar {
                display: none !important;
            }
            .receipt-container {
                width: 76mm;
                margin: 0;
                padding: 4mm 2mm;
                box-shadow: none;
                min-height: auto;
            }
            .divider {
                border-top: 1px dashed black;
            }
            .double-divider {
                border-top: 3px double black;
            }
            .code-box {
                background: none;
                border: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="control-bar no-print">
        <span>Vista Previa del Ticket DTE</span>
        <div style="display: flex; gap: 10px;">
            <button onclick="window.print()" class="btn-action btn-print">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 4px;"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"></path></svg>Imprimir
            </button>
            <button onclick="window.close()" class="btn-action btn-close">Cerrar Ventana</button>
        </div>
    </div>
    <div class="receipt-container">
        <div class="text-center">
            <h3 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 800; text-transform: uppercase;">${wsConfig.nombre || 'TALLER MECÁNICO'}</h3>
            <p style="margin: 2px 0; font-size: 11px;">${wsConfig.giro || 'Servicios Mecánicos'}</p>
            <p style="margin: 2px 0; font-size: 10px; color: #555;">${wsConfig.direccion || ''}</p>
            <p style="margin: 2px 0; font-size: 10px;">TEL: ${wsConfig.telefono || ''}</p>
            <p style="margin: 2px 0; font-size: 10px;">NIT: ${wsConfig.nit || ''} • NRC: ${wsConfig.nrc || ''}</p>
            <div class="divider"></div>
            <h4 style="margin: 4px 0; font-size: 11px; letter-spacing: 0.5px; font-weight: 700;">DOCUMENTO TRIBUTARIO ELECTRÓNICO</h4>
            <h4 style="margin: 2px 0; font-size: 12px; font-weight: 800; color: #000;">${isCCF ? 'COMPROBANTE DE CRÉDITO FISCAL' : 'FACTURA DE CONSUMIDOR FINAL'}</h4>
        </div>
        <div class="divider"></div>
        <table class="info-table">
            <tr>
                <td class="label">Código Gen:</td>
                <td><span class="code-box">${genCode}</span></td>
            </tr>
            <tr>
                <td class="label">Num Control:</td>
                <td><strong>${p.mhControlNumber || p.controlNumber || 'N/A'}</strong></td>
            </tr>
            <tr>
                <td class="label">Sello Rec:</td>
                <td><span class="code-box">${p.receptionSeal || 'APROBADO-MH'}</span></td>
            </tr>
            <tr>
                <td class="label">Fecha Emisión:</td>
                <td>${p.Fecha_Facturacion ? new Date(p.Fecha_Facturacion).toLocaleString('es-SV') : new Date().toLocaleString('es-SV')}</td>
            </tr>
        </table>
        <div class="divider"></div>
        <table class="info-table">
            <tr>
                <td class="label">Cliente:</td>
                <td>${client.Nombre}</td>
            </tr>
            <tr>
                <td class="label">NIT/DUI:</td>
                <td>${client.NIT || client['Num Doc'] || 'N/A'}</td>
            </tr>
            ${safe(isCCF ? `
            <tr>
                <td class="label">NRC:</td>
                <td>${client.NRC || 'N/A'}</td>
            </tr>
            <tr>
                <td class="label">Giro:</td>
                <td>${client.Giro || 'N/A'}</td>
            </tr>
            <tr>
                <td class="label">Dirección:</td>
                <td>${client.Direccion || 'N/A'}</td>
            </tr>
            ` : '')}
            <tr>
                <td class="label">Placa Auto:</td>
                <td>${p.Placas || 'N/A'}</td>
            </tr>
        </table>
        <div class="divider"></div>
        <table class="items-table">
            <thead>
                <tr>
                    <th style="text-align: center; vertical-align: middle; white-space: nowrap; width: 45%;">DESCRIPCIÓN</th>
                    <th style="text-align: center; vertical-align: middle; white-space: nowrap; width: 10%;">CANT</th>
                    <th style="text-align: center; vertical-align: middle; white-space: nowrap; width: 20%;">P.UNIT</th>
                    <th style="text-align: center; vertical-align: middle; white-space: nowrap; width: 25%;">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                ${safe(prodItems.map(item => `
                    <tr>
                        <td style="word-break: break-word;">${escapeHtml(item.Descripcion || item.desc || '')}</td>
                        <td style="text-align: center;">${item.Cantidad || item.qty}</td>
                        <td style="text-align: right;">$${parseFloat(item.PrecioUnitario || item.price || 0).toFixed(2)}</td>
                        <td style="text-align: right;">$${(parseFloat(item.PrecioUnitario || item.price || 0) * parseInt(item.Cantidad || item.qty || 1)).toFixed(2)}</td>
                    </tr>
                `).join(''))}
                ${safe(laborItems.map(item => `
                    <tr>
                        <td style="word-break: break-word;">${escapeHtml(item.Descripcion || item.desc || '')}</td>
                        <td style="text-align: center;">${item.Cantidad || item.qty}</td>
                        <td style="text-align: right;">$${parseFloat(item.PrecioUnitario || item.price || 0).toFixed(2)}</td>
                        <td style="text-align: right;">$${(parseFloat(item.PrecioUnitario || item.price || 0) * parseInt(item.Cantidad || item.qty || 1)).toFixed(2)}</td>
                    </tr>
                `).join(''))}
            </tbody>
        </table>
        <div class="double-divider"></div>
        <table class="totals-table">
            <tr>
                <td>Subtotal Neto:</td>
                <td class="text-right">$ ${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
                <td>IVA (13%):</td>
                <td class="text-right">$ ${iva.toFixed(2)}</td>
            </tr>
            ${safe(perception > 0 ? `
            <tr>
                <td>Percepción (2%):</td>
                <td class="text-right">$ ${perception.toFixed(2)}</td>
            </tr>` : '')}
            ${safe(retention > 0 ? `
            <tr>
                <td>Retención (1%):</td>
                <td class="text-right">$ ${retention.toFixed(2)}</td>
            </tr>` : '')}
            <tr class="total-row">
                <td>TOTAL A PAGAR:</td>
                <td class="text-right">$ ${grandTotal.toFixed(2)}</td>
            </tr>
        </table>
        <div class="divider"></div>
        
        <div class="qr-section">
            <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('https://admin.facturallama.com/dte/validate/' + genCode)}" alt="QR DTE Verification" onerror="this.style.display='none'">
            <div class="qr-label">Escanee para verificar el documento electrónico DTE ante el Ministerio de Hacienda</div>
        </div>
        
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9px; margin-top: 10px; color: #555;">
            <p style="margin: 2px 0; font-weight: bold;">¡Gracias por su preferencia!</p>
            <p style="margin: 2px 0;">Software de Facturación MecanicOS</p>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        }
    </script>
</body>
</html>
        `);
        ticketWindow.document.close();
        ticketWindow.opener = null;
    } catch (err) {
        console.error("Error al imprimir ticket DTE:", err);
        showToast("Error al generar ticket DTE: " + err.message, "danger");
    }
}

function reemitBudget(presId) {
    const db = getDatabase();
    const orig = db.presupuestos.find(b => b['ID Presupuesto'] === presId);
    if (!orig) return;

    if (!confirm(`¿Está seguro de que desea re-emitir el presupuesto ${presId}? Se creará una copia en estado 'Aprobado' para poder facturarlo de nuevo.`)) {
        return;
    }

    const newId = "PRES-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
    const newBudget = {
        ...orig,
        "ID Presupuesto": newId,
        Fecha: Date.now(),
        Estado: 2,
        "Pagado?": "NO"
    };
    
    delete newBudget.controlNumber;
    delete newBudget.mhControlNumber;
    delete newBudget.receptionSeal;
    delete newBudget.Fecha_Facturacion;
    delete newBudget.Anulado;
    delete newBudget.Fecha_Anulacion;

    db.presupuestos.unshift(newBudget);

    const origProds = (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(item => item['ID_Presupuesto DPP'] === presId);
    origProds.forEach(item => {
        const newDppId = "DPP-" + Math.floor(Math.random()*900000);
        db.detalle_productos.push({
            ...item,
            "ID Detalle Presupuesto Producto": newDppId,
            "ID_Presupuesto DPP": newId
        });
    });

    const origLabor = (db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || []).filter(item => item['ID_Presupuesto MO'] === presId);
    origLabor.forEach(item => {
        const newMoId = "DMO-" + Math.floor(Math.random()*900000);
        db.detalle_mano_obra.push({
            ...item,
            "ID Detalle Presupuesto Mano de Obra": newMoId,
            "ID_Presupuesto MO": newId
        });
    });

    saveDatabase(db);
    showToast(`Presupuesto clonado con éxito como ${newId} en Pendientes de Facturar.`, "success");
    handleRouting();
}

function queryDteStatusMH(dteId) {
    const db = getDatabase();
    const dteCfg = (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.dte_config) ||
                   getSecureDteConfig();
                   
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = html`
        <div class="modal-content glass-card" style="max-width: 500px; text-align: center; padding: 2rem;">
            <h3><i class="fa-solid fa-spinner fa-spin" style="color: var(--primary);"></i> Consultando Ministerio de Hacienda...</h3>
            <p style="margin-top: 1rem; color: var(--text-secondary); font-size:0.85rem;">Consultando estado para el DTE:<br><strong style="word-break:break-all;">${dteId}</strong></p>
        </div>
    `;
    document.body.appendChild(modal);
    
    const baseUrl = sanitizeBackendUrl(dteCfg.backendUrl || getBackendUrl(db));
    const isSimulated = !dteCfg.apiKey || dteCfg.apiKey.trim() === '' || dteCfg.apiKey.startsWith('simulado_');

    function renderQueryResult(data) {
        modal.innerHTML = html`
            <div class="modal-content glass-card" style="max-width: 500px; padding: 1.5rem;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h2>Resultado de Consulta MH</h2>
                    <button class="close-modal-btn" id="close-query-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div style="font-size:0.9rem; display:flex; flex-direction:column; gap:0.75rem;">
                    <p>DTE ID: <strong style="word-break:break-all;">${escapeHtml(data.id || dteId)}</strong></p>
                    <p>Estado en MH: <span class="badge-tag badge-success" style="font-size:0.85rem; font-weight:700;">${escapeHtml(data.status || 'APPROVED')}</span></p>
                    <p>Ambiente: <strong>${data.environment === '00' ? 'PRODUCCIÓN' : 'PRUEBAS'}</strong></p>
                    <p>Código Control: <strong>${escapeHtml(data.controlNumber || 'N/A')}</strong></p>
                    <p>Mensaje API: <span style="color:var(--success); font-weight:600;">${escapeHtml(data.message || 'Consulta exitosa')}</span></p>
                </div>
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn btn-secondary" id="close-query-modal-btn">Cerrar</button>
                </div>
            </div>
        `;
        const close = () => { modal.remove(); };
        document.getElementById('close-query-modal').addEventListener('click', close);
        document.getElementById('close-query-modal-btn').addEventListener('click', close);
    }

    if (isSimulated && !baseUrl) {
        setTimeout(() => {
            renderQueryResult({
                id: dteId,
                status: "APPROVED",
                environment: "01",
                controlNumber: "DTE-01-M001P001-99887",
                message: "Consulta de DTE simulada con éxito (Modo Demo)"
            });
        }, 1000);
        return;
    }

    if (!baseUrl) {
        modal.innerHTML = html`
            <div class="modal-content glass-card" style="max-width: 500px; padding: 1.5rem;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h2 style="color:var(--danger);">Error de Configuración</h2>
                    <button class="close-modal-btn" id="close-query-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <p>Debe configurar la 'URL del Servidor Backend' en Ajustes para consultar DTEs reales.</p>
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn btn-secondary" id="close-query-modal-btn">Cerrar</button>
                </div>
            </div>
        `;
        const close = () => { modal.remove(); };
        document.getElementById('close-query-modal').addEventListener('click', close);
        document.getElementById('close-query-modal-btn').addEventListener('click', close);
        return;
    }

    const endpoint = `${baseUrl}/api/dte/retrieve`;
    
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            apiKey: dteCfg.apiKey,
            dteId: dteId
        })
    })
    .then(response => {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("html")) {
            throw new Error("El servidor backend retornó HTML en lugar de JSON. Verifique su URL en Ajustes.");
        }
        if (!response.ok) {
            return response.json().then(errData => {
                let errMsg = '';
                if (Array.isArray(errData.message)) {
                    errMsg = errData.message.join(', ');
                } else {
                    errMsg = errData.message || errData.error || 'Error al consultar DTE';
                }
                return Promise.reject(new Error(errMsg));
            }, () => {
                return Promise.reject(new Error(`Error de conexión (Código ${response.status}).`));
            });
        }
        return response.json();
    })
    .then(data => {
        renderQueryResult(data);
    })
    .catch(err => {
        modal.innerHTML = html`
            <div class="modal-content glass-card" style="max-width: 500px; padding: 1.5rem;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h2 style="color:var(--danger);">Error de Consulta</h2>
                    <button class="close-modal-btn" id="close-query-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <p style="color:var(--danger);">${err.message}</p>
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn btn-secondary" id="close-query-modal-btn">Cerrar</button>
                </div>
            </div>
        `;
        const close = () => { modal.remove(); };
        document.getElementById('close-query-modal').addEventListener('click', close);
        document.getElementById('close-query-modal-btn').addEventListener('click', close);
    });
}

function openInvalidateDteModal(dteId, presId) {
    const db = getDatabase();
    const dteCfg = (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.dte_config) ||
                   getSecureDteConfig();
                   
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = html`
        <div class="modal-content glass-card" style="max-width: 500px; padding: 1.5rem;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <h2>Anulación de Documento DTE</h2>
                <button class="close-modal-btn" id="close-invalidate-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            
            <form id="invalidate-dte-form" style="display:flex; flex-direction:column; gap:1rem;">
                <p style="font-size:0.85rem; color:var(--text-secondary);">Esta acción transmitirá una anulación oficial al Ministerio de Hacienda para el DTE: <br><strong style="word-break:break-all;">${dteId}</strong>.<br><br>Una vez invalidado, el presupuesto volverá a estado "Aprobado" para que puedas corregirlo, facturarlo nuevamente o eliminarlo.</p>
                
                <div class="form-group">
                    <label>Motivo de Anulación</label>
                    <select id="inv-reason" required style="width:100%; padding:0.6rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);">
                        <option value="ERROR_ESCRITURA">Error de digitación o escritura en datos</option>
                        <option value="OPERACION_SUSPENDIDA">La operación comercial se suspendió / canceló</option>
                        <option value="TIPO_DOC_INCORRECTO">Cambio de tipo de documento</option>
                        <option value="OTRO">Otro motivo justificable</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Comentario / Justificación</label>
                    <input type="text" id="inv-comment" placeholder="Ej. El cliente canceló el pedido de repuestos" required style="width:100%; padding:0.6rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);">
                </div>
                
                <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                    <button type="button" class="btn btn-secondary" id="close-invalidate-btn">Cancelar</button>
                    <button type="submit" class="btn btn-danger" style="background:#e74c3c; border:none;"><i class="fa-solid fa-ban"></i> Confirmar Anulación</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    const closeModal = () => { modal.remove(); };
    document.getElementById('close-invalidate-modal').addEventListener('click', closeModal);
    document.getElementById('close-invalidate-btn').addEventListener('click', closeModal);
    
    document.getElementById('invalidate-dte-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const reason = document.getElementById('inv-reason').value;
        const comment = document.getElementById('inv-comment').value;
        
        const submitBtn = modal.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Anulando...';
        
        const baseUrl = sanitizeBackendUrl(dteCfg.backendUrl || getBackendUrl(db));
        const isSimulated = !dteCfg.apiKey || dteCfg.apiKey.trim() === '' || dteCfg.apiKey.startsWith('simulado_');

        function processLocalInvalidation() {
            let p = db.presupuestos.find(b => b.controlNumber === dteId || b['ID Presupuesto'] === presId);
            let isQuickSale = false;
            if (!p) {
                p = (db['43 Venta Rapida'] || []).find(vr => vr.controlNumber === dteId || vr.ID_Venta_Rapida === presId);
                isQuickSale = true;
            }
            
            if (p) {
                if (isQuickSale) {
                    p.Estado = "ANULADO";
                    p.Anulado = true;
                    p.Fecha_Anulacion = Date.now();
                } else {
                    p.Estado = 4; // Anulado
                    p.Anulado = true;
                    p.Fecha_Anulacion = Date.now();
                }
                
                // Restore stock and record devolution movement in Kardex
                const prodItems = isQuickSale ? (p.productos || []) : (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(item => item['ID_Presupuesto DPP'] === p['ID Presupuesto']);
                prodItems.forEach(item => {
                    const prodId = isQuickSale ? item.id : item['ID_Producto DPP'];
                    const qty = parseInt(isQuickSale ? (item.qty || 1) : (item.Cantidad || 1));
                    
                    const dbProd = db.productos.find(prod => prod['ID_ Producto'] === prodId);
                    if (dbProd) {
                        dbProd.Minimos = (dbProd.Minimos || 0) + qty;
                        
                        db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
                        db['29 Movs de Inventario'].unshift({
                            id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                            id_producto: prodId,
                            descripcion: dbProd.Descripcion,
                            Cant_Mov: qty,
                            "Fecha Mov": Date.now(),
                            Tipo: "ENTRADA",
                            "Valor ($)": parseFloat(isQuickSale ? (item.price || dbProd['Precio Unit'] || 10) : (item.PrecioUnitario || dbProd['Precio Unit'] || 10)),
                            Observacion: `Devolución por Anulación DTE ${p.ID_Venta_Rapida || p['ID Presupuesto']}`,
                            DTE: p.mhControlNumber || p.controlNumber || ''
                        });
                    }
                });
                
                // Traceability: instead of deleting payments, record negative payments for returns
                db.pagos = db.pagos || [];
                const activePayments = db.pagos.filter(pay => pay.ID_Presupuesto === (p.ID_Venta_Rapida || p['ID Presupuesto']) && pay['Estado Pago'] === 'COMPLETADO');
                activePayments.forEach(pay => {
                    const devPayId = "PAGO-DEV-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100);
                    db.pagos.unshift({
                        "ID Pago": devPayId,
                        ID_Presupuesto: pay.ID_Presupuesto,
                        "Fecha Pago": Date.now(),
                        "Monto Pago": -Math.abs(parseFloat(pay['Monto Pago'] || 0)),
                        "Metodo Pago": pay['Metodo Pago'],
                        "Estado Pago": "DEVOLUCION",
                        User: getActiveUser().Email || "jjmunoz932@gmail.com",
                        Cliente: pay.Cliente || p.Cliente || p.Nombre
                    });
                });
                saveDatabase(db);
            }
            closeModal();
            showToast("DTE Anulado con éxito. Productos devueltos a inventario y contra-movimiento de caja registrado.", "success");
            handleRouting();
        }

        if (isSimulated && !baseUrl) {
            setTimeout(processLocalInvalidation, 1000);
            return;
        }

        if (!baseUrl) {
            showToast("Error: Debe configurar la URL del servidor backend en Ajustes para anular DTEs reales.", "danger");
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Confirmar Anulación';
            return;
        }

        const endpoint = `${baseUrl}/api/dte/invalidate`;
        
        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: dteCfg.apiKey,
                payload: {
                    dteId: dteId,
                    reason: `${reason}: ${comment}`.substring(0, 250)
                }
            })
        })
        .then(response => {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("html")) {
                throw new Error("El servidor backend retornó HTML en lugar de JSON. Verifique su URL del backend en Ajustes.");
            }
            if (!response.ok) {
                return response.json().then(errData => {
                    let errMsg = '';
                    if (Array.isArray(errData.message)) {
                        errMsg = errData.message.join(', ');
                    } else {
                        errMsg = errData.message || errData.error || 'Error al invalidar DTE';
                    }
                    return Promise.reject(new Error(errMsg));
                }, () => {
                    return Promise.reject(new Error(`Error de conexión (Código ${response.status}).`));
                });
            }
            return response.json();
        })
        .then(data => {
            processLocalInvalidation();
        })
        .catch(err => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Confirmar Anulación';
            showToast(err.message, "danger");
        });
    });
}

// 7. VENTA RAPIDA POS VIEW


