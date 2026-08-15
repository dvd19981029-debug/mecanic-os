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
} from '../utils.js?v=69';

let activeGastosTab = 'egresos';

export function renderGastos(container) {
    const db = getDatabase();
    
    const activeUser = typeof getActiveUser === 'function' ? getActiveUser() : null;
    const roleName = activeUser ? (activeUser.Nivel_Acceso || activeUser.Tecnico_Rol || activeUser.Rol || "Mecánico") : "Mecánico";
    const searchRole = roleName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isAdmin = searchRole === "administrador" || searchRole === "admin";
    
    // Set up structures
    db.gastos = db.gastos || [];
    db.proveedores = db.proveedores || [];
    db.compras = db.compras || [];
    db.abonos_proveedores = db.abonos_proveedores || [];
    db.productos = db.productos || [];

    let editingProveedorId = null;
    let purchaseItems = []; // Array of { id_producto, cant, precio_costo }
    let activeAbonoPurchaseId = null;

    container.innerHTML = html`
        <div class="saas-tabs" style="display:flex; gap:0.5rem; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; overflow-x:auto;">
            <button class="saas-tab-btn ${activeGastosTab === 'egresos' ? 'active' : ''}" data-tab="egresos" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-receipt"></i> Gastos Operativos</button>
            <button class="saas-tab-btn ${activeGastosTab === 'compras' ? 'active' : ''}" data-tab="compras" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-cart-shopping"></i> Registrar Compra</button>
            <button class="saas-tab-btn ${activeGastosTab === 'cxp' ? 'active' : ''}" data-tab="cxp" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-file-invoice-dollar"></i> Compras</button>
            <button class="saas-tab-btn ${activeGastosTab === 'proveedores' ? 'active' : ''}" data-tab="proveedores" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-truck-field"></i> Proveedores</button>
            <button class="saas-tab-btn ${activeGastosTab === 'dtes_recibidos' ? 'active' : ''}" data-tab="dtes_recibidos" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-envelope-open-text"></i> DTEs Recibidos (Gmail)</button>
            <button class="saas-tab-btn ${activeGastosTab === 'reporteria' ? 'active' : ''}" data-tab="reporteria" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-chart-line"></i> Reportería</button>
        </div>
        <div id="gastos-tab-content"></div>
    `;

    // Bind tabs switcher
    container.querySelectorAll('.saas-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeGastosTab = btn.getAttribute('data-tab');
            renderGastos(container);
        });
    });

    const contentArea = document.getElementById('gastos-tab-content');

    if (activeGastosTab === 'egresos') {
        renderEgresosTab(contentArea);
    } else if (activeGastosTab === 'compras') {
        renderComprasTab(contentArea);
    } else if (activeGastosTab === 'cxp') {
        renderCxpTab(contentArea);
    } else if (activeGastosTab === 'proveedores') {
        renderProveedoresTab(contentArea);
    } else if (activeGastosTab === 'dtes_recibidos') {
        renderDtesRecibidosTab(contentArea);
    } else if (activeGastosTab === 'reporteria') {
        renderReporteriaTab(contentArea);
    }

    // --- TAB 1: OPERATIONAL EXPENSES ---
    function renderEgresosTab(parent) {
        parent.innerHTML = html`
            <div class="view-split">
                <div class="glass-card">
                    <h3>Historial de Egresos y Gastos</h3>
                    <div class="table-container" style="margin-top:1rem;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Concepto</th>
                                    <th>Monto Total</th>
                                    <th>Proveedor</th>
                                    <th>Forma Pago</th>
                                    ${safe(isAdmin ? '<th style="text-align:center;">Acciones</th>' : '')}
                                </tr>
                            </thead>
                            <tbody>
                                ${safe(db.gastos.length === 0 
                                    ? `<tr><td colspan="${isAdmin ? 6 : 5}" style="text-align:center; color:var(--text-muted)">Sin gastos registrados</td></tr>`
                                    : db.gastos.map(g => {
                                        const provName = g.ID_Proveedor ? (db.proveedores.find(p => p.ID_Proveedor === g.ID_Proveedor)?.Nombre || 'Proveedor') : 'General/Otros';
                                        let dateStr = 'N/A';
                                        try {
                                            dateStr = new Date(g['Fecha Gasto'] + 'T00:00:00').toLocaleDateString('es-SV');
                                        } catch(e) {}
                                        
                                        // Try to extract and display purchased items if this is a purchase
                                        let purchaseItemsDetail = '';
                                        if (g.Concepto && g.Concepto.includes('Factura ')) {
                                            const match = g.Concepto.match(/Factura\s+([^\s\()]+)/);
                                            if (match && match[1]) {
                                                const invoiceNum = match[1];
                                                const purchase = db.compras.find(c => c.Num_Factura === invoiceNum && c.ID_Proveedor === g.ID_Proveedor);
                                                if (purchase && purchase.Items) {
                                                    purchaseItemsDetail = purchase.Items.map(item => {
                                                        const prod = db.productos.find(p => p['ID_ Producto'] === item.ID_Producto);
                                                        const prodDesc = prod ? prod.Descripcion : item.ID_Producto;
                                                        return `• ${escapeHtml(prodDesc)} (${item.Cantidad})`;
                                                    }).join('<br>');
                                                }
                                            }
                                        }
                                        
                                        return `
                                            <tr>
                                                <td>${dateStr}</td>
                                                <td>
                                                    <strong>${escapeHtml(g.Concepto)}</strong>
                                                    ${purchaseItemsDetail ? `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.3rem; border-top:1px dashed var(--border-color); padding-top:0.25rem; line-height:1.3; font-weight:normal; max-width:300px; word-break:break-word;">${purchaseItemsDetail}</div>` : ''}
                                                </td>
                                                <td style="font-weight:700;">$ ${parseFloat(g['Monto Total']).toFixed(2)}</td>
                                                <td>${escapeHtml(provName)}</td>
                                                <td><span class="badge-tag badge-success">${escapeHtml(g['Forma de Pago'] || 'EFECTIVO')}</span></td>
                                                ${isAdmin ? `
                                                    <td style="text-align:center;">
                                                        <button class="btn btn-secondary btn-edit-gasto" data-id="${g['ID Gasto']}" title="Editar Gasto (Solo Administradores)" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                                                    </td>
                                                ` : ''}
                                            </tr>
                                        `;
                                    }).join(''))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="glass-card">
                    <h3>Registrar Gasto Operacional</h3>
                    <form id="expense-form" style="margin-top:1rem;">
                        <div class="form-group">
                            <label>Fecha de Gasto</label>
                            <input type="date" id="exp-date" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>Concepto / Detalle Gasto</label>
                            <input type="text" id="exp-concept" required placeholder="Ej. Pago recibo CAESS, herramientas taller...">
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div class="form-group">
                                <label>Monto Total ($)</label>
                                <input type="number" id="exp-amount" required step="0.01" placeholder="0.00">
                            </div>
                            <div class="form-group">
                                <label>Forma de Pago</label>
                                <select id="exp-pay-method">
                                    <option value="EFECTIVO">Efectivo (Caja Chica)</option>
                                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                                    <option value="TARJETA">Tarjeta Débito/Crédito</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div class="form-group">
                                <label>Proveedor / Acreedor</label>
                                <select id="exp-proveedor" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%;">
                                    <option value="">-- General / Ninguno --</option>
                                    ${safe(db.proveedores.map(p => `<option value="${p.ID_Proveedor}">${escapeHtml(p.Nombre)}</option>`).join(''))}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Categoría Gasto</label>
                                <select id="exp-cat" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%;">
                                    <option value="Servicios Públicos">Servicios Públicos (Luz/Agua)</option>
                                    <option value="Insumos Directos">Repuestos e Insumos Directos</option>
                                    <option value="Herramientas">Herramientas y Equipo</option>
                                    <option value="Administración">Alquileres y Salarios</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;"><i class="fa-solid fa-save"></i> Registrar Gasto</button>
                    </form>
                </div>
            </div>
        `;

        if (isAdmin) {
            parent.querySelectorAll('.btn-edit-gasto').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    openEditGastoModal(id);
                });
            });
        }

        const form = document.getElementById('expense-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const date = document.getElementById('exp-date').value;
            const concept = document.getElementById('exp-concept').value;
            const amount = parseFloat(document.getElementById('exp-amount').value);
            const method = document.getElementById('exp-pay-method').value;
            const provId = document.getElementById('exp-proveedor').value;
            const cat = document.getElementById('exp-cat').value;

            const newExpense = {
                "ID Gasto": "GASTO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
                "Fecha Gasto": date,
                Concepto: concept,
                "Monto Total": amount,
                "Forma de Pago": method,
                "ID Categoría Gasto": cat,
                "Estado Pago": "PAGADO",
                ID_Proveedor: provId || null
            };

            db.gastos.unshift(newExpense);
            saveDatabase(db);
            showToast("Gasto operacional registrado correctamente", "success");
            renderGastos(container);
        });
    }

    function openEditGastoModal(gastoId) {
        const g = db.gastos.find(item => item['ID Gasto'] === gastoId);
        if (!g) return;

        const modalId = 'edit-gasto-modal';
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();

        const provOptions = db.proveedores.map(p => 
            `<option value="${p.ID_Proveedor}" ${g.ID_Proveedor === p.ID_Proveedor ? 'selected' : ''}>${escapeHtml(p.Nombre)}</option>`
        ).join('');

        const categories = ['Servicios Públicos', 'Insumos Directos', 'Herramientas', 'Administración', 'Nota de Crédito', 'Otros'];
        const catOptions = categories.map(cat => 
            `<option value="${cat}" ${g['ID Categoría Gasto'] === cat ? 'selected' : ''}>${cat}</option>`
        ).join('');

        const modalHtml = html`
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(4px);">
                <div class="glass-card" style="width:90%; max-width:520px; padding:1.5rem; border-radius:12px; background:var(--bg-card, #1e1e2d); border:1px solid var(--border-color, rgba(255,255,255,0.1));">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                        <h3 style="margin:0; font-size:1.1rem; color:var(--text-primary);"><i class="fa-solid fa-pen-to-square" style="color:var(--primary); margin-right:0.5rem;"></i> Editar Gasto / Egreso</h3>
                        <button id="close-edit-gasto-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <form id="edit-gasto-form" style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label style="display:block; margin-bottom:0.35rem; font-size:0.85rem; color:var(--text-secondary);">Fecha de Gasto</label>
                            <input type="date" id="edit-gasto-date" required value="${g['Fecha Gasto'] || ''}" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                        </div>
                        <div class="form-group">
                            <label style="display:block; margin-bottom:0.35rem; font-size:0.85rem; color:var(--text-secondary);">Concepto / Detalle Gasto</label>
                            <input type="text" id="edit-gasto-concept" required value="${escapeHtml(g.Concepto || '')}" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                            <div class="form-group">
                                <label style="display:block; margin-bottom:0.35rem; font-size:0.85rem; color:var(--text-secondary);">Monto Total ($)</label>
                                <input type="number" id="edit-gasto-amount" required step="0.01" value="${parseFloat(g['Monto Total'] || 0).toFixed(2)}" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                            </div>
                            <div class="form-group">
                                <label style="display:block; margin-bottom:0.35rem; font-size:0.85rem; color:var(--text-secondary);">Forma de Pago</label>
                                <select id="edit-gasto-pay-method" style="width:100%; height:38px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                                    <option value="EFECTIVO" ${g['Forma de Pago'] === 'EFECTIVO' ? 'selected' : ''}>Efectivo (Caja Chica)</option>
                                    <option value="TRANSFERENCIA" ${g['Forma de Pago'] === 'TRANSFERENCIA' ? 'selected' : ''}>Transferencia Bancaria</option>
                                    <option value="TARJETA" ${g['Forma de Pago'] === 'TARJETA' ? 'selected' : ''}>Tarjeta Débito/Crédito</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                            <div class="form-group">
                                <label style="display:block; margin-bottom:0.35rem; font-size:0.85rem; color:var(--text-secondary);">Proveedor / Acreedor</label>
                                <select id="edit-gasto-proveedor" style="width:100%; height:38px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                                    <option value="">-- General / Ninguno --</option>
                                    ${safe(provOptions)}
                                </select>
                            </div>
                            <div class="form-group">
                                <label style="display:block; margin-bottom:0.35rem; font-size:0.85rem; color:var(--text-secondary);">Categoría Gasto</label>
                                <select id="edit-gasto-cat" style="width:100%; height:38px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                                    ${safe(catOptions)}
                                </select>
                            </div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-edit-gasto">Cancelar</button>
                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const closeModal = () => {
            const m = document.getElementById(modalId);
            if (m) m.remove();
        };

        document.getElementById('close-edit-gasto-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel-edit-gasto').addEventListener('click', closeModal);

        document.getElementById('edit-gasto-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const newDate = document.getElementById('edit-gasto-date').value;
            const newConcept = document.getElementById('edit-gasto-concept').value;
            const newAmount = parseFloat(document.getElementById('edit-gasto-amount').value);
            const newMethod = document.getElementById('edit-gasto-pay-method').value;
            const newProvId = document.getElementById('edit-gasto-proveedor').value || null;
            const newCat = document.getElementById('edit-gasto-cat').value;

            g['Fecha Gasto'] = newDate;
            g.Concepto = newConcept;
            g['Monto Total'] = newAmount;
            g['Forma de Pago'] = newMethod;
            g.ID_Proveedor = newProvId;
            g['ID Categoría Gasto'] = newCat;

            // Sincronizar con compra si proviene de una factura
            if (g.Concepto && g.Concepto.includes('Factura ')) {
                const match = g.Concepto.match(/Factura\s+([^\s\()]+)/);
                if (match && match[1]) {
                    const invoiceNum = match[1];
                    const purchase = db.compras.find(c => c.Num_Factura === invoiceNum);
                    if (purchase) {
                        purchase.Fecha_Compra = newDate;
                        purchase.Monto_Total = newAmount;
                        if (newProvId) purchase.ID_Proveedor = newProvId;
                    }
                }
            }

            saveDatabase(db);
            closeModal();
            showToast("Gasto actualizado correctamente", "success");
            renderGastos(container);
        });
    }

    // --- TAB 2: REGISTER PURCHASE INVOICE ---
    function renderComprasTab(parent) {
        purchaseItems = purchaseItems.length === 0 ? [{ id_producto: '', cant: 1, precio_costo: 0 }] : purchaseItems;

        parent.innerHTML = html`
            <div class="glass-card" style="max-width:960px; margin:0 auto;">
                <h3 id="pur-form-title">Registrar Entrada de Factura de Compra</h3>
                <p id="pur-form-subtitle" style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.5rem;">Carga las compras de repuestos del taller para registrar automáticamente el ingreso de stock al inventario.</p>
                
                <form id="purchase-invoice-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                    <!-- Linea 1: Tipo DTE, Proveedor, Fecha DTE, Condicion Pago -->
                    <div class="form-row" style="display:grid; grid-template-columns:1fr 1.5fr 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Tipo de DTE</label>
                            <select id="pur-tipo-dte" required style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%; font-weight:600;">
                                <option value="CCF">Crédito Fiscal (CCF)</option>
                                <option value="FAC">Factura Consumidor</option>
                                <option value="FSE">Sujeto Excluido (FSE)</option>
                                <option value="NC" style="color:#f87171;">Nota de Crédito (NC)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Proveedor</label>
                            <select id="pur-proveedor" required style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%;">
                                <option value="">-- Seleccionar Proveedor --</option>
                                ${safe(db.proveedores.map(p => `<option value="${p.ID_Proveedor}">${escapeHtml(p.Nombre)}</option>`).join(''))}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Fecha del DTE</label>
                            <input type="date" id="pur-date" required value="${new Date().toISOString().split('T')[0]}" style="padding:0.6rem;">
                        </div>
                        <div class="form-group" id="pur-condicion-group">
                            <label>Condición de Pago</label>
                            <select id="pur-condicion" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%;">
                                <option value="CONTADO">Contado (Pagado ya)</option>
                                <option value="CREDITO">Crédito (Cuenta x Pagar)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Linea 2: Codigo de Generacion, Numero de Control, Forma de Pago (Contado) -->
                    <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Código de Generación</label>
                            <input type="text" id="pur-num-doc" required placeholder="Ej: 4B17731D-B09B-89A8-5BFD-A3646BD9D9CE" style="padding:0.6rem;">
                        </div>
                        <div class="form-group">
                            <label>Número de Control</label>
                            <input type="text" id="pur-num-control" placeholder="Ej: DTE-01-M001P001-000000000001509" style="padding:0.6rem;">
                        </div>
                        <div class="form-group" id="pur-forma-pago-group">
                            <label>Forma de Pago (Contado)</label>
                            <select id="pur-forma-pago" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%; font-weight:600;">
                                <option value="EFECTIVO">💵 Efectivo (Caja Chica)</option>
                                <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                                <option value="TARJETA">💳 Tarjeta Débito/Crédito</option>
                                <option value="CHEQUE">📝 Cheque</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="border-top:1px solid var(--border-color); padding-top:1.25rem;">
                        <h4 style="margin-bottom:0.75rem; color:var(--primary); font-weight:700;">Detalle de Repuestos / Insumos</h4>
                        <div class="table-container" style="overflow:visible; position:relative; min-height: 180px;">
                            <table style="min-width:100%;">
                                <thead>
                                    <tr>
                                        <th style="width:50%;">Producto / Repuesto</th>
                                        <th style="width:15%;">Cantidad</th>
                                        <th style="width:15%;">Costo Unitario ($)</th>
                                        <th style="width:15%;">Subtotal ($)</th>
                                        <th style="width:5%;"></th>
                                    </tr>
                                </thead>
                                <tbody id="purchase-rows-container">
                                    <!-- Dynamic rows loaded here -->
                                </tbody>
                            </table>
                        </div>
                        <button type="button" class="btn btn-secondary" id="btn-add-purchase-row" style="margin-top:0.75rem; width:fit-content;"><i class="fa-solid fa-plus"></i> Agregar Fila</button>
                    </div>

                    <div style="border-top:1px solid var(--border-color); padding-top:1rem; display:flex; justify-content:flex-end;">
                        <div style="width:320px; font-size:0.85rem; display:flex; flex-direction:column; gap:0.5rem; background:rgba(255,255,255,0.02); padding:1rem; border-radius:6px; border:1px solid var(--border-color);">
                            <div style="display:flex; justify-content:space-between;">
                                <span>Subtotal Neto:</span>
                                <strong id="pur-summary-subtotal">$ 0.00</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;" id="pur-iva-row">
                                <span id="pur-iva-label">IVA Crédito Fiscal (13%):</span>
                                <strong id="pur-summary-iva">$ 0.00</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:0.5rem; font-size:1.05rem; color:var(--primary); font-weight:700;">
                                <span id="pur-total-label">Total Factura:</span>
                                <strong id="pur-summary-total">$ 0.00</strong>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-purchase">Cancelar</button>
                        <button type="submit" class="btn btn-primary" id="btn-submit-purchase"><i class="fa-solid fa-circle-check"></i> Registrar DTE</button>
                    </div>
                </form>
            </div>
        `;

        const rowsContainer = document.getElementById('purchase-rows-container');
        const addRowBtn = document.getElementById('btn-add-purchase-row');
        const cancelBtn = document.getElementById('btn-cancel-purchase');
        const formEl = document.getElementById('purchase-invoice-form');
        const tipoDteSelect = document.getElementById('pur-tipo-dte');
        const condicionGroup = document.getElementById('pur-condicion-group');
        const condicionSelect = document.getElementById('pur-condicion');

        makeSelectSearchable('pur-proveedor', 'Buscar y seleccionar proveedor...');

        const formaPagoGroup = document.getElementById('pur-forma-pago-group');
        const formaPagoSelect = document.getElementById('pur-forma-pago');

        function onCondicionChange() {
            const isContado = condicionSelect.value === 'CONTADO';
            if (formaPagoGroup) {
                formaPagoGroup.style.display = isContado ? 'block' : 'none';
            }
        }
        condicionSelect.addEventListener('change', onCondicionChange);
        onCondicionChange();

        // React to DTE type changes
        function onTipoDteChange() {
            const tipo = tipoDteSelect.value;
            const isNC = tipo === 'NC';
            const formTitle = document.getElementById('pur-form-title');
            const formSubtitle = document.getElementById('pur-form-subtitle');
            const submitBtn = document.getElementById('btn-submit-purchase');
            const ivaRow = document.getElementById('pur-iva-row');
            const ivaLabel = document.getElementById('pur-iva-label');
            const totalLabel = document.getElementById('pur-total-label');

            if (isNC) {
                formTitle.innerHTML = '<span style="color:var(--danger);"><i class="fa-solid fa-rotate-left"></i> Registrar Nota de Crédito</span>';
                formSubtitle.innerHTML = '<span style="color:#f87171;"><i class="fa-solid fa-triangle-exclamation"></i> <strong>Nota de Crédito:</strong> Reduce el inventario y revierte el gasto correspondiente.</span>';
                submitBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Registrar Nota de Crédito';
                submitBtn.style.background = 'var(--danger)';
                // NC is always settled immediately (no CxP)
                condicionSelect.value = 'CONTADO';
                condicionGroup.style.opacity = '0.5';
                condicionGroup.style.pointerEvents = 'none';
                ivaLabel.textContent = 'IVA a Revertir (13%):';
                totalLabel.textContent = 'Total Revertido:';
                ivaRow.style.color = 'var(--danger)';
                document.getElementById('pur-summary-total').style.color = 'var(--danger)';
            } else {
                const labels = { CCF: 'Crédito Fiscal (CCF)', FAC: 'Factura Consumidor', FSE: 'Sujeto Excluido (FSE)' };
                formTitle.textContent = `Registrar Entrada — ${labels[tipo] || 'Factura de Compra'}`;
                formSubtitle.textContent = 'Carga las compras de repuestos del taller para registrar automáticamente el ingreso de stock al inventario.';
                submitBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Registrar ${labels[tipo] || 'DTE'}`;
                submitBtn.style.background = '';
                condicionGroup.style.opacity = '1';
                condicionGroup.style.pointerEvents = 'auto';
                // FSE has no IVA
                if (tipo === 'FSE') {
                    ivaLabel.textContent = 'IVA (FSE - No Aplica):';
                } else {
                    ivaLabel.textContent = 'IVA Crédito Fiscal (13%):';
                }
                ivaRow.style.color = '';
                document.getElementById('pur-summary-total').style.color = 'var(--primary)';
            }
            onCondicionChange();
            updateTotals();
        }

        tipoDteSelect.addEventListener('change', onTipoDteChange);

        function renderRows() {
            rowsContainer.innerHTML = purchaseItems.map((item, idx) => {
                const prod = item.id_producto ? db.productos.find(p => p['ID_ Producto'] === item.id_producto) : null;
                const displayName = prod ? prod.Descripcion : (item.nombre_display || '');
                return `
                <tr data-idx="${idx}">
                    <td style="position:relative;">
                        <div class="pur-prod-search-wrap" style="position:relative;">
                            <div style="display:flex; align-items:center; gap:0.4rem; padding:0.4rem 0.6rem; background:var(--bg-input); border:1px solid ${item.id_producto ? 'var(--primary)' : 'var(--border-color)'}; border-radius:6px; cursor:pointer;" data-trigger-idx="${idx}">
                                <i class="fa-solid fa-magnifying-glass" style="color:var(--text-muted); font-size:0.8rem; flex-shrink:0;"></i>
                                <span class="pur-prod-label" style="flex:1; font-size:0.85rem; color:${item.id_producto ? 'var(--text-primary)' : 'var(--text-muted)'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${item.id_producto ? escapeHtml(displayName) : '🔍 Buscar repuesto...'}
                                </span>
                                ${item.id_producto ? `<i class="fa-solid fa-circle-check" style="color:var(--success); font-size:0.75rem;"></i>` : ''}
                            </div>
                            <div class="pur-prod-dropdown" data-for-idx="${idx}" style="display:none; position:absolute; top:100%; left:0; right:0; z-index:9999; background:var(--bg-card); border:1px solid var(--primary); border-top:none; border-radius:0 0 8px 8px; box-shadow:0 8px 24px rgba(0,0,0,0.4); max-height:260px; overflow:hidden;">
                                <div style="padding:0.5rem; border-bottom:1px solid var(--border-color);">
                                    <input type="text" class="pur-prod-input" data-idx="${idx}" placeholder="Escribe descripción o código..." autocomplete="off" style="width:100%; padding:0.45rem 0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; font-size:0.85rem; box-sizing:border-box;">
                                </div>
                                <div class="pur-prod-results" data-idx="${idx}" style="overflow-y:auto; max-height:200px;"></div>
                            </div>
                        </div>
                        <input type="hidden" class="pur-row-prod" value="${item.id_producto || ''}">
                    </td>
                    <td>
                        <input type="number" class="pur-row-cant" required min="1" value="${item.cant}" style="width:100%; padding:0.4rem; text-align:center;">
                    </td>
                    <td>
                        <input type="number" class="pur-row-cost" required min="0" step="0.0001" value="${item.precio_costo}" style="width:100%; padding:0.4rem; text-align:right;">
                    </td>
                    <td style="text-align:right; font-weight:600; padding:0.4rem;" class="pur-row-subtotal">
                        $ ${(item.cant * item.precio_costo).toFixed(2)}
                    </td>
                    <td style="text-align:center;">
                        ${purchaseItems.length > 1 ? `<button type="button" class="pur-row-delete-btn" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem;">&times;</button>` : ''}
                    </td>
                </tr>`;
            }).join('');

            // Attach listeners to every row
            rowsContainer.querySelectorAll('tr').forEach(row => {
                const idx = parseInt(row.getAttribute('data-idx'));
                const hiddenProdInput = row.querySelector('.pur-row-prod');
                const cantInput = row.querySelector('.pur-row-cant');
                const costInput = row.querySelector('.pur-row-cost');
                const deleteBtn = row.querySelector('.pur-row-delete-btn');
                const triggerDiv = row.querySelector('[data-trigger-idx]');
                const dropdown = row.querySelector('.pur-prod-dropdown');
                const searchInput = row.querySelector('.pur-prod-input');
                const resultsDiv = row.querySelector('.pur-prod-results');

                // Stop propagation on dropdown clicks so typing or selecting doesn't close it
                dropdown.addEventListener('click', (e) => e.stopPropagation());

                // Open dropdown on trigger click
                triggerDiv.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Close all other dropdowns first
                    document.querySelectorAll('.pur-prod-dropdown').forEach(d => {
                        if (d !== dropdown) d.style.display = 'none';
                    });
                    const isOpen = dropdown.style.display === 'block';
                    dropdown.style.display = isOpen ? 'none' : 'block';
                    if (!isOpen) {
                        searchInput.value = '';
                        populateProdResults(resultsDiv, '', idx, hiddenProdInput, row, dropdown);
                        setTimeout(() => searchInput.focus(), 50);
                    }
                });

                searchInput.addEventListener('input', (e) => {
                    e.stopPropagation();
                    populateProdResults(resultsDiv, searchInput.value, idx, hiddenProdInput, row, dropdown);
                });

                cantInput.addEventListener('input', (e) => {
                    purchaseItems[idx].cant = parseInt(e.target.value) || 0;
                    row.querySelector('.pur-row-subtotal').textContent = `$ ${(purchaseItems[idx].cant * purchaseItems[idx].precio_costo).toFixed(2)}`;
                    updateTotals();
                });

                costInput.addEventListener('input', (e) => {
                    purchaseItems[idx].precio_costo = parseFloat(e.target.value) || 0;
                    row.querySelector('.pur-row-subtotal').textContent = `$ ${(purchaseItems[idx].cant * purchaseItems[idx].precio_costo).toFixed(2)}`;
                    updateTotals();
                });

                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        purchaseItems.splice(idx, 1);
                        renderRows();
                        updateTotals();
                    });
                }
            });

            // Single global document click handler to close dropdowns when clicking outside
            if (!window._purCloseDropdownListener) {
                window._purCloseDropdownListener = (e) => {
                    document.querySelectorAll('.pur-prod-search-wrap').forEach(wrap => {
                        if (!wrap.contains(e.target)) {
                            const d = wrap.querySelector('.pur-prod-dropdown');
                            if (d) d.style.display = 'none';
                        }
                    });
                };
                document.addEventListener('click', window._purCloseDropdownListener);
            }

            updateTotals();
        }

        function populateProdResults(resultsDiv, filter, idx, hiddenInput, row, dropdown) {
            resultsDiv.innerHTML = '';
            const term = filter.toLowerCase().trim();
            const filtered = db.productos.filter(p =>
                !term ||
                (p.Descripcion || '').toLowerCase().includes(term) ||
                (p['ID_ Producto'] || '').toLowerCase().includes(term)
            ).slice(0, 12);

            if (filtered.length === 0) {
                resultsDiv.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--text-muted); font-size:0.82rem;"><i class="fa-solid fa-circle-info"></i> No se encontraron productos</div>`;
                return;
            }

            filtered.forEach(p => {
                const div = document.createElement('div');
                const isSelected = purchaseItems[idx].id_producto === p['ID_ Producto'];
                div.style.cssText = `
                    display:flex; justify-content:space-between; align-items:center;
                    padding:0.6rem 0.85rem; cursor:pointer; gap:0.5rem;
                    border-bottom:1px solid rgba(255,255,255,0.05);
                    background:${isSelected ? 'rgba(110,68,255,0.15)' : 'transparent'};
                    transition:background 0.15s;
                `;
                div.addEventListener('mouseover', () => div.style.background = 'rgba(255,255,255,0.06)');
                div.addEventListener('mouseout', () => div.style.background = isSelected ? 'rgba(110,68,255,0.15)' : 'transparent');

                const costo = parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0);
                div.innerHTML = `
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.Descripcion)}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:1px;">
                            <span style="color:var(--primary); font-weight:500;">${escapeHtml(p['ID_ Producto'] || '')}</span>
                            ${p['Unidad de Medida'] ? ` · ${escapeHtml(p['Unidad de Medida'])}` : ''}
                        </div>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                        <div style="font-size:0.85rem; font-weight:700; color:var(--success);">$${costo.toFixed(2)}</div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">costo unit.</div>
                    </div>
                `;

                div.addEventListener('click', () => {
                    purchaseItems[idx].id_producto = p['ID_ Producto'];
                    purchaseItems[idx].nombre_display = p.Descripcion;
                    if (purchaseItems[idx].precio_costo === 0) {
                        purchaseItems[idx].precio_costo = costo;
                    }
                    dropdown.style.display = 'none';
                    renderRows();
                    updateTotals();
                });

                resultsDiv.appendChild(div);
            });
        }

        function updateTotals() {
            const tipo = tipoDteSelect ? tipoDteSelect.value : 'CCF';
            let sumNet = 0;
            purchaseItems.forEach(item => {
                sumNet += item.cant * item.precio_costo;
            });
            // FSE has no IVA; NC shows negative amounts
            const hasIva = tipo !== 'FSE';
            const iva = hasIva ? sumNet * 0.13 : 0;
            const total = sumNet + iva;
            const sign = tipo === 'NC' ? '-' : '';

            document.getElementById('pur-summary-subtotal').textContent = `${sign}$ ${sumNet.toFixed(2)}`;
            document.getElementById('pur-summary-iva').textContent = hasIva ? `${sign}$ ${iva.toFixed(2)}` : `$ 0.00 (N/A)`;
            document.getElementById('pur-summary-total').textContent = `${sign}$ ${total.toFixed(2)}`;
        }

        addRowBtn.addEventListener('click', () => {
            purchaseItems.push({ id_producto: '', cant: 1, precio_costo: 0 });
            renderRows();
        });

        cancelBtn.addEventListener('click', () => {
            activeGastosTab = 'egresos';
            renderGastos(container);
        });

        formEl.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate that we have selected products
            const invalid = purchaseItems.some(item => !item.id_producto || item.cant <= 0 || item.precio_costo <= 0);
            if (invalid) {
                showToast("Por favor complete todas las filas con productos y valores válidos", "danger");
                return;
            }

            const tipoDte = tipoDteSelect.value; // CCF | FAC | FSE | NC
            const isNC = tipoDte === 'NC';
            const hasIva = tipoDte !== 'FSE';

            const provId = document.getElementById('pur-proveedor').value;
            const date = document.getElementById('pur-date').value;
            const numDoc = document.getElementById('pur-num-doc').value.trim();
            const numControl = (document.getElementById('pur-num-control')?.value || '').trim();
            const condicion = isNC ? 'CONTADO' : document.getElementById('pur-condicion').value;
            const formaPago = condicion === 'CONTADO' ? (document.getElementById('pur-forma-pago')?.value || 'EFECTIVO') : 'CREDITO';

            // Calculations
            let sumNet = 0;
            purchaseItems.forEach(item => sumNet += item.cant * item.precio_costo);
            const roundedSumNet = parseFloat(sumNet.toFixed(2));
            const roundedIva = hasIva ? parseFloat((sumNet * 0.13).toFixed(2)) : 0;
            const roundedTotal = parseFloat((roundedSumNet + roundedIva).toFixed(2));

            const prov = db.proveedores.find(p => p.ID_Proveedor === provId) || { Nombre: 'Proveedor S.A.', Dias_Credito: 0 };
            const purchaseId = (isNC ? 'NC' : 'COMPRA') + '-CS-' + Math.floor(Date.now() / 1000).toString().substring(3);

            // Calculate due date for credit
            const creditDays = parseInt(prov.Dias_Credito || 0);
            let dueDate = date;
            if (condicion === 'CREDITO' && creditDays > 0) {
                const compDateObj = new Date(date + 'T00:00:00');
                compDateObj.setDate(compDateObj.getDate() + creditDays);
                const year = compDateObj.getFullYear();
                const month = String(compDateObj.getMonth() + 1).padStart(2, '0');
                const day = String(compDateObj.getDate()).padStart(2, '0');
                dueDate = `${year}-${month}-${day}`;
            }

            // 1. Create Purchase/NC record
            const newPurchase = {
                ID_Compra: purchaseId,
                Tipo_DTE: tipoDte,
                ID_Proveedor: provId,
                Fecha_Compra: date,
                Fecha_Vencimiento: dueDate,
                Dias_Credito: creditDays,
                Num_Factura: numDoc,
                Num_Control: numControl,
                Monto_Neto: isNC ? -roundedSumNet : roundedSumNet,
                Monto_IVA: isNC ? -roundedIva : roundedIva,
                Monto_Total: isNC ? -roundedTotal : roundedTotal,
                Condicion: condicion,
                Forma_Pago: formaPago,
                Estado_Pago: condicion === 'CONTADO' ? 'PAGADO' : 'PENDIENTE',
                Saldo_Pendiente: condicion === 'CONTADO' ? 0 : (isNC ? -roundedTotal : roundedTotal),
                Items: purchaseItems.map(item => ({
                    ID_Producto: item.id_producto,
                    Cantidad: isNC ? -item.cant : item.cant,
                    Precio_Costo: item.precio_costo
                }))
            };
            db.compras.unshift(newPurchase);

            // 2. Affect Stock / Kardex (skip consumibles; NC subtracts)
            const dteLabelMap = { CCF: 'CCF', FAC: 'Factura', FSE: 'FSE', NC: 'Nota de Crédito' };
            purchaseItems.forEach(item => {
                const prod = db.productos.find(p => p['ID_ Producto'] === item.id_producto);
                if (prod && !prod.Consumible) {
                    if (isNC) {
                        // Subtract stock (but never below 0)
                        prod.Minimos = Math.max(0, (prod.Minimos || 0) - item.cant);
                    } else {
                        prod.Minimos = (prod.Minimos || 0) + item.cant;
                    }

                    db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
                    db['29 Movs de Inventario'].unshift({
                        id_Mov: 'MOVIN-CS-' + Math.floor(Date.now() / 1000).toString().substring(3),
                        id_producto: item.id_producto,
                        descripcion: prod.Descripcion,
                        Cant_Mov: item.cant,
                        'Fecha Mov': Date.now(),
                        Tipo: isNC ? 'SALIDA' : 'ENTRADA',
                        'Valor ($)': item.precio_costo,
                        Observacion: `${dteLabelMap[tipoDte]} ${numDoc} (${prov.Nombre})`
                    });

                    // Update cost price for normal purchases
                    if (!isNC) prod['Precio Compra'] = item.precio_costo;
                }
            });

            // 3. Register cash movement in Egresos
            if (condicion === 'CONTADO') {
                const tipeName = dteLabelMap[tipoDte] || tipoDte;
                if (isNC) {
                    // NC: register as negative gasto (credit/reversal)
                    db.gastos.unshift({
                        'ID Gasto': 'NC-GASTO-CS-' + Math.floor(Date.now() / 1000).toString().substring(3),
                        'Fecha Gasto': date,
                        Concepto: `Nota de Crédito ${numDoc} - Reversión (${prov.Nombre})`,
                        'Monto Total': -roundedTotal,
                        'Forma de Pago': formaPago,
                        'ID Categoría Gasto': 'Nota de Crédito',
                        'Estado Pago': 'PAGADO',
                        ID_Proveedor: provId
                    });
                } else {
                    db.gastos.unshift({
                        'ID Gasto': 'GASTO-CS-' + Math.floor(Date.now() / 1000).toString().substring(3),
                        'Fecha Gasto': date,
                        Concepto: `Compra ${tipeName} - ${numDoc} (${prov.Nombre})`,
                        'Monto Total': roundedTotal,
                        'Forma de Pago': formaPago,
                        'ID Categoría Gasto': 'Insumos Directos',
                        'Estado Pago': 'PAGADO',
                        ID_Proveedor: provId
                    });
                }
            }

            saveDatabase(db);
            if (isNC) {
                showToast(`Nota de Crédito ${numDoc} registrada. Inventario y gastos revertidos.`, 'success');
            } else {
                showToast(`${dteLabelMap[tipoDte]} ${numDoc} registrada con éxito. Stock e inventario actualizados.`, 'success');
            }

            activeGastosTab = condicion === 'CONTADO' ? 'egresos' : 'cxp';
            purchaseItems = []; // Reset
            renderGastos(container);
        });


        renderRows();
    }

    // Modal to view complete purchase details, items, unit prices, costs, and payment history
    function showPurchaseDetailModal(comp) {
        const prov = db.proveedores.find(p => p.ID_Proveedor === comp.ID_Proveedor) || { Nombre: 'Proveedor S.A.', NIT_DUI: '', Giro: '' };
        const items = comp.Items || [];
        
        // Find abonos for this purchase
        const abonos = (db.abonos_proveedores || []).filter(a => a.ID_Compra === comp.ID_Compra);
        const totalAbonado = abonos.reduce((sum, a) => sum + parseFloat(a.Monto_Abono || 0), 0);

        const dteTypeNames = {
            CCF: 'Crédito Fiscal (CCF)',
            FAC: 'Factura Consumidor (FAC)',
            FSE: 'Factura Sujeto Excluido (FSE)',
            NC: 'Nota de Crédito (NC)'
        };

        const modalId = 'purchase-detail-modal';
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        let itemsTableRows = items.length > 0 ? items.map((item, idx) => {
            const prod = db.productos.find(p => p['ID_ Producto'] === item.ID_Producto);
            const desc = prod ? prod.Descripcion : (item.ID_Producto || 'Repuesto / Insumo');
            const code = prod ? (prod['ID_ Producto'] || prod.Codigo || '') : '';
            const qty = parseFloat(item.Cantidad || 0);
            const cost = parseFloat(item.Precio_Costo || 0);
            const subtotal = qty * cost;
            return `
                <tr style="border-bottom:1px solid var(--border-color);">
                    <td style="padding:0.65rem; text-align:center; color:var(--text-muted); font-size:0.8rem;">${idx + 1}</td>
                    <td style="padding:0.65rem;">
                        <strong style="color:var(--text-primary); font-size:0.9rem;">${escapeHtml(desc)}</strong>
                        ${code ? `<div style="font-size:0.75rem; color:var(--text-muted);">Cód: ${escapeHtml(code)}</div>` : ''}
                    </td>
                    <td style="padding:0.65rem; text-align:center; font-weight:700;">${qty}</td>
                    <td style="padding:0.65rem; text-align:right; font-weight:600;">$ ${cost.toFixed(2)}</td>
                    <td style="padding:0.65rem; text-align:right; font-weight:700; color:var(--cyan);">$ ${subtotal.toFixed(2)}</td>
                </tr>
            `;
        }).join('') : `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem;">No se encontraron repuestos desglosados en esta compra.</td></tr>`;

        let abonosTableRows = abonos.length > 0 ? abonos.map(a => `
            <tr style="border-bottom:1px solid var(--border-color); font-size:0.82rem;">
                <td style="padding:0.5rem;">${a.Fecha_Abono || 'N/A'}</td>
                <td style="padding:0.5rem;"><span class="badge-tag badge-info">${escapeHtml(a.Forma_Pago || 'EFECTIVO')}</span></td>
                <td style="padding:0.5rem; color:var(--text-secondary);">${escapeHtml(a.Notas || 'Abono registrado')}</td>
                <td style="padding:0.5rem; text-align:right; font-weight:700; color:var(--success);">$ ${parseFloat(a.Monto_Abono || 0).toFixed(2)}</td>
            </tr>
        `).join('') : `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:1rem; font-size:0.8rem;">No se han registrado abonos a esta compra.</td></tr>`;

        const totalAmount = parseFloat(comp.Monto_Total || 0);
        const netAmount = comp.Monto_Neto !== undefined ? parseFloat(comp.Monto_Neto) : (totalAmount / 1.13);
        const ivaAmount = comp.Monto_IVA !== undefined ? parseFloat(comp.Monto_IVA) : (totalAmount - netAmount);
        const pendingBalance = parseFloat(comp.Saldo_Pendiente || 0);

        const modalHtml = `
            <div class="modal" id="${modalId}" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:99999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
                <div class="modal-content glass-card" style="max-width:780px; width:94%; max-height:90vh; overflow-y:auto; padding:1.75rem; border:1px solid var(--border-color); border-radius:12px; background:var(--bg-card); color:var(--text-primary); box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                    <!-- Header -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1.25rem;">
                        <div>
                            <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
                                <span class="badge-tag badge-primary" style="font-weight:700; font-size:0.75rem;">${dteTypeNames[comp.Tipo_DTE] || comp.Tipo_DTE || 'COMPRA'}</span>
                                <h3 style="margin:0; font-size:1.25rem; font-weight:800; color:var(--text-primary);">Factura N° ${escapeHtml(comp.Num_Factura || 'S/N')}</h3>
                                <span class="badge-tag ${comp.Estado_Pago === 'PAGADO' ? 'badge-success' : 'badge-warning'}">${escapeHtml(comp.Estado_Pago || 'PENDIENTE')}</span>
                            </div>
                            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.3rem;">
                                ID Compra: <code>${escapeHtml(comp.ID_Compra)}</code>
                                ${comp.Num_Control ? ` | Ctrl: <code style="color:var(--cyan);">${escapeHtml(comp.Num_Control)}</code>` : ''}
                            </div>
                        </div>
                        <button id="btn-close-comp-modal-x" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer; padding:0; line-height:1;">&times;</button>
                    </div>

                    <!-- Info Grid -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1.25rem; background:rgba(255,255,255,0.02); padding:1rem; border-radius:8px; border:1px solid var(--border-color); font-size:0.85rem;">
                        <div>
                            <div style="color:var(--primary); font-weight:700; text-transform:uppercase; font-size:0.75rem; margin-bottom:0.4rem;"><i class="fa-solid fa-truck-field"></i> Proveedor</div>
                            <div><strong>${escapeHtml(prov.Nombre)}</strong></div>
                            ${prov.NIT_DUI ? `<div style="color:var(--text-secondary); font-size:0.8rem;">NIT/DUI: ${escapeHtml(prov.NIT_DUI)}</div>` : ''}
                            ${prov.Giro ? `<div style="color:var(--text-secondary); font-size:0.8rem;">Giro: ${escapeHtml(prov.Giro)}</div>` : ''}
                        </div>
                        <div>
                            <div style="color:var(--primary); font-weight:700; text-transform:uppercase; font-size:0.75rem; margin-bottom:0.4rem;"><i class="fa-solid fa-calendar-days"></i> Fechas y Forma de Pago</div>
                            <div>Fecha Compra: <strong>${comp.Fecha_Compra || 'N/A'}</strong></div>
                            ${comp.Fecha_Vencimiento ? `<div>Fecha Vencimiento: <strong style="color:${comp.Estado_Pago === 'PENDIENTE' ? '#f59e0b' : 'inherit'};">${comp.Fecha_Vencimiento}</strong> (${comp.Dias_Credito || 0} días crédito)</div>` : ''}
                            <div>Condición: <strong>${escapeHtml(comp.Condicion || 'CONTADO')}</strong> | Forma de Pago: <strong>${escapeHtml(comp.Forma_Pago || 'EFECTIVO')}</strong></div>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <div style="margin-bottom:1.25rem;">
                        <h4 style="margin:0 0 0.6rem 0; font-size:0.95rem; color:var(--text-primary); display:flex; align-items:center; gap:0.4rem;">
                            <i class="fa-solid fa-boxes-stacked" style="color:var(--primary);"></i> Desglose de Repuestos e Insumos (${items.length})
                        </h4>
                        <div style="overflow-x:auto; border:1px solid var(--border-color); border-radius:8px;">
                            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                                <thead>
                                    <tr style="background:rgba(255,255,255,0.03); border-bottom:1px solid var(--border-color); color:var(--text-secondary); text-align:left;">
                                        <th style="padding:0.6rem; text-align:center; width:40px;">#</th>
                                        <th style="padding:0.6rem;">Descripción Repuesto</th>
                                        <th style="padding:0.6rem; text-align:center;">Cant.</th>
                                        <th style="padding:0.6rem; text-align:right;">Precio Costo ($)</th>
                                        <th style="padding:0.6rem; text-align:right;">Subtotal ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsTableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Financial Totals Box -->
                    <div style="display:flex; justify-content:flex-end; margin-bottom:1.5rem;">
                        <div style="width:320px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:8px; padding:0.85rem 1rem; font-size:0.85rem; display:flex; flex-direction:column; gap:0.4rem;">
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--text-secondary);">Subtotal Neto:</span>
                                <strong>$ ${netAmount.toFixed(2)}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--text-secondary);">IVA Crédito Fiscal (13%):</span>
                                <strong>$ ${ivaAmount.toFixed(2)}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); padding-top:0.4rem; font-size:1.05rem; color:var(--primary); font-weight:800;">
                                <span>Total Factura:</span>
                                <strong>$ ${totalAmount.toFixed(2)}</strong>
                            </div>
                            ${comp.Condicion === 'CREDITO' ? `
                                <div style="display:flex; justify-content:space-between; color:var(--success); margin-top:0.2rem;">
                                    <span>Total Abonado:</span>
                                    <strong>$ ${totalAbonado.toFixed(2)}</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; color:${pendingBalance > 0 ? '#ef4444' : 'var(--success)'}; font-weight:800; border-top:1px dashed var(--border-color); padding-top:0.3rem;">
                                    <span>Saldo Pendiente:</span>
                                    <strong>$ ${pendingBalance.toFixed(2)}</strong>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Abonos History (If Credit) -->
                    ${comp.Condicion === 'CREDITO' ? `
                    <div style="margin-bottom:1rem;">
                        <h4 style="margin:0 0 0.6rem 0; font-size:0.9rem; color:var(--text-secondary); display:flex; align-items:center; gap:0.4rem;">
                            <i class="fa-solid fa-clock-rotate-left"></i> Histórico de Abonos Realizados
                        </h4>
                        <div style="overflow-x:auto; border:1px solid var(--border-color); border-radius:8px;">
                            <table style="width:100%; border-collapse:collapse;">
                                <thead>
                                    <tr style="background:rgba(255,255,255,0.02); border-bottom:1px solid var(--border-color); color:var(--text-secondary); text-align:left; font-size:0.8rem;">
                                        <th style="padding:0.5rem;">Fecha</th>
                                        <th style="padding:0.5rem;">Forma Pago</th>
                                        <th style="padding:0.5rem;">Notas</th>
                                        <th style="padding:0.5rem; text-align:right;">Monto Abonado ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${abonosTableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Footer -->
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:1rem;">
                        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                            ${comp.Estado_Pago === 'PENDIENTE' && abonos.length === 0 ? `
                                <button id="btn-edit-from-modal" class="btn btn-secondary" style="background:rgba(67,97,238,0.2); border:1px solid #4361ee; color:#93c5fd; padding:0.5rem 1.25rem; font-weight:700; font-size:0.85rem; cursor:pointer;">
                                    <i class="fa-solid fa-pen-to-square" style="color:#60a5fa;"></i> Editar Compra
                                </button>
                            ` : ''}
                            ${comp.Estado_Pago !== 'ANULADA' ? `
                                <button id="btn-annul-from-modal" class="btn btn-secondary" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#fca5a5; padding:0.5rem 1.25rem; font-weight:700; font-size:0.85rem; cursor:pointer;">
                                    <i class="fa-solid fa-ban" style="color:#ef4444;"></i> Anular Compra
                                </button>
                            ` : `<span style="color:#f87171; font-weight:700; font-size:0.85rem;"><i class="fa-solid fa-ban"></i> ESTA COMPRA SE ENCUENTRA ANULADA</span>`}
                        </div>
                        <button id="btn-close-comp-modal-btn" class="btn btn-secondary" style="padding:0.5rem 1.25rem;">Cerrar</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const closeModal = () => {
            const m = document.getElementById(modalId);
            if (m) m.remove();
        };

        document.getElementById('btn-close-comp-modal-x')?.addEventListener('click', closeModal);
        document.getElementById('btn-close-comp-modal-btn')?.addEventListener('click', closeModal);
        document.getElementById('btn-annul-from-modal')?.addEventListener('click', () => annulPurchase(comp.ID_Compra));
        document.getElementById('btn-edit-from-modal')?.addEventListener('click', () => showEditPurchaseModal(comp));
    }

    // Modal to edit an existing pending purchase (products, quantities, unit costs, invoice number, dates)
    function showEditPurchaseModal(comp) {
        if (!comp) return;

        const hasAbonos = (db.abonos_proveedores || []).some(a => a.ID_Compra === comp.ID_Compra);
        if (comp.Estado_Pago !== 'PENDIENTE' || hasAbonos) {
            showToast("Solo se pueden editar compras en estado PENDIENTE que no tengan abonos ni pagos registrados.", "warning");
            return;
        }

        const modalId = 'edit-purchase-modal';
        const existingModal = document.getElementById(modalId);
        if (existingModal) existingModal.remove();

        // Local clone of items to edit
        let editItems = (comp.Items || []).map(i => ({
            id_producto: i.ID_Producto,
            cant: parseFloat(i.Cantidad || 0),
            precio_costo: parseFloat(i.Precio_Costo || 0)
        }));

        const renderEditItemsRows = () => {
            const tbody = document.getElementById('edit-purchase-items-body');
            if (!tbody) return;

            if (editItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem; color:var(--text-muted);">Sin repuestos agregados a esta compra.</td></tr>';
                return;
            }

            tbody.innerHTML = safe(editItems.map((item, idx) => {
                const prod = db.productos.find(p => p['ID_ Producto'] === item.id_producto);
                const desc = prod ? prod.Descripcion : item.id_producto;
                const subtotal = item.cant * item.precio_costo;
                return `
                    <tr style="border-bottom:1px solid var(--border-color);">
                        <td style="padding:0.5rem;">
                            <strong>${escapeHtml(desc)}</strong>
                        </td>
                        <td style="padding:0.5rem; text-align:center;">
                            <input type="number" class="edit-item-qty" data-idx="${idx}" min="0.01" step="0.01" value="${item.cant}" style="width:75px; padding:0.25rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; text-align:center;">
                        </td>
                        <td style="padding:0.5rem; text-align:right;">
                            <input type="number" class="edit-item-cost" data-idx="${idx}" min="0.01" step="0.01" value="${item.precio_costo.toFixed(2)}" style="width:95px; padding:0.25rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; text-align:right;">
                        </td>
                        <td style="padding:0.5rem; text-align:right; font-weight:700; color:var(--cyan);">
                            $ ${subtotal.toFixed(2)}
                        </td>
                        <td style="padding:0.5rem; text-align:center;">
                            <button type="button" class="btn-delete-edit-item" data-idx="${idx}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem; line-height:1;" title="Eliminar ítem">&times;</button>
                        </td>
                    </tr>
                `;
            }).join(''));

            // Recalculate totals
            let netSum = editItems.reduce((sum, i) => sum + (i.cant * i.precio_costo), 0);
            const netAmount = parseFloat(netSum.toFixed(2));
            const hasIva = comp.Tipo_DTE === 'CCF' || comp.Tipo_DTE === 'FAC';
            const ivaAmount = hasIva ? parseFloat((netSum * 0.13).toFixed(2)) : 0;
            const totalAmount = parseFloat((netAmount + ivaAmount).toFixed(2));

            const netElem = document.getElementById('edit-pur-net');
            const ivaElem = document.getElementById('edit-pur-iva');
            const totalElem = document.getElementById('edit-pur-total');
            if (netElem) netElem.textContent = `$ ${netAmount.toFixed(2)}`;
            if (ivaElem) ivaElem.textContent = `$ ${ivaAmount.toFixed(2)}`;
            if (totalElem) totalElem.textContent = `$ ${totalAmount.toFixed(2)}`;

            // Attach inline edit events
            tbody.querySelectorAll('.edit-item-qty').forEach(inp => {
                inp.oninput = (e) => {
                    const idx = parseInt(e.target.getAttribute('data-idx'));
                    const val = parseFloat(e.target.value) || 0;
                    if (editItems[idx]) editItems[idx].cant = val;
                    renderEditItemsRows();
                };
            });
            tbody.querySelectorAll('.edit-item-cost').forEach(inp => {
                inp.oninput = (e) => {
                    const idx = parseInt(e.target.getAttribute('data-idx'));
                    const val = parseFloat(e.target.value) || 0;
                    if (editItems[idx]) editItems[idx].precio_costo = val;
                    renderEditItemsRows();
                };
            });
            tbody.querySelectorAll('.btn-delete-edit-item').forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.getAttribute('data-idx'));
                    editItems.splice(idx, 1);
                    renderEditItemsRows();
                };
            });
        };

        const modalHtml = `
            <div class="modal" id="${modalId}" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:99999; justify-content:center; align-items:center; backdrop-filter:blur(4px);">
                <div class="modal-content glass-card" style="max-width:780px; width:94%; max-height:90vh; overflow-y:auto; padding:1.75rem; border:1px solid var(--border-color); border-radius:12px; background:var(--bg-card); color:var(--text-primary); box-shadow:0 20px 60px rgba(0,0,0,0.5);">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; margin-bottom:1.25rem;">
                        <h3 style="margin:0;"><i class="fa-solid fa-pen-to-square" style="color:var(--primary);"></i> Editar Compra Pendiente</h3>
                        <button id="btn-close-edit-modal-x" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                    </div>

                    <form id="form-edit-purchase" style="display:flex; flex-direction:column; gap:1.25rem;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; background:rgba(255,255,255,0.02); padding:1rem; border-radius:8px; border:1px solid var(--border-color);">
                            <div>
                                <label style="display:block; font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.25rem;">Proveedor</label>
                                <select id="edit-pur-prov" required style="width:100%; height:36px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem;">
                                    ${safe(db.proveedores.map(p => `<option value="${p.ID_Proveedor}" ${p.ID_Proveedor === comp.ID_Proveedor ? 'selected' : ''}>${escapeHtml(p.Nombre)}</option>`).join(''))}
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.25rem;">N° Factura / Documento</label>
                                <input type="text" id="edit-pur-num-doc" required value="${escapeHtml(comp.Num_Factura || '')}" style="width:100%; height:36px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem; padding:0.4rem 0.6rem;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.25rem;">N° Control / DTE</label>
                                <input type="text" id="edit-pur-num-control" value="${escapeHtml(comp.Num_Control || '')}" placeholder="Opcional" style="width:100%; height:36px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem; padding:0.4rem 0.6rem;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.25rem;">Fecha Compra</label>
                                <input type="date" id="edit-pur-date" required value="${comp.Fecha_Compra || new Date().toISOString().split('T')[0]}" style="width:100%; height:36px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem; padding:0.4rem 0.6rem;">
                            </div>
                            <div>
                                <label style="display:block; font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.25rem;">Condición de Pago</label>
                                <select id="edit-pur-condicion" style="width:100%; height:36px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem;">
                                    <option value="CREDITO" ${comp.Condicion === 'CREDITO' ? 'selected' : ''}>Crédito</option>
                                    <option value="CONTADO" ${comp.Condicion === 'CONTADO' ? 'selected' : ''}>Contado</option>
                                </select>
                            </div>
                            <div>
                                <label style="display:block; font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.25rem;">Tipo DTE</label>
                                <select id="edit-pur-tipo-dte" style="width:100%; height:36px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem;">
                                    <option value="CCF" ${comp.Tipo_DTE === 'CCF' ? 'selected' : ''}>Crédito Fiscal (CCF)</option>
                                    <option value="FAC" ${comp.Tipo_DTE === 'FAC' ? 'selected' : ''}>Factura Consumidor (FAC)</option>
                                    <option value="FSE" ${comp.Tipo_DTE === 'FSE' ? 'selected' : ''}>Factura Sujeto Excluido (FSE)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Add Product Row -->
                        <div style="display:flex; gap:0.5rem; align-items:flex-end; background:rgba(255,255,255,0.02); padding:0.75rem 1rem; border-radius:8px; border:1px solid var(--border-color);">
                            <div style="flex:1;">
                                <label style="display:block; font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.25rem;">Agregar Producto del Catálogo</label>
                                <select id="edit-add-prod-select" style="width:100%; height:34px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem;">
                                    <option value="">-- Seleccionar Repuesto / Insumo --</option>
                                    ${safe(db.productos.map(p => `<option value="${p['ID_ Producto']}" data-cost="${p['Precio Unit'] || 0}">${escapeHtml(p.Descripcion)} ($ ${parseFloat(p['Precio Unit'] || 0).toFixed(2)})</option>`).join(''))}
                                </select>
                            </div>
                            <div style="width:80px;">
                                <label style="display:block; font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.25rem;">Cant.</label>
                                <input type="number" id="edit-add-prod-qty" value="1" min="1" step="1" style="width:100%; height:34px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem; padding:0.2rem 0.4rem; text-align:center;">
                            </div>
                            <div style="width:110px;">
                                <label style="display:block; font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-bottom:0.25rem;">P. Costo ($)</label>
                                <input type="number" id="edit-add-prod-cost" step="0.01" min="0" placeholder="0.00" style="width:100%; height:34px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem; padding:0.2rem 0.4rem; text-align:right;">
                            </div>
                            <button type="button" id="btn-edit-add-prod" class="btn btn-secondary" style="height:34px; padding:0 0.8rem; font-size:0.8rem; border-color:var(--primary); color:var(--primary);"><i class="fa-solid fa-plus"></i> Agregar</button>
                        </div>

                        <!-- Editable Table -->
                        <div style="overflow-x:auto; border:1px solid var(--border-color); border-radius:8px;">
                            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                                <thead>
                                    <tr style="background:rgba(255,255,255,0.03); border-bottom:1px solid var(--border-color); color:var(--text-secondary); text-align:left;">
                                        <th style="padding:0.6rem;">Descripción Repuesto</th>
                                        <th style="padding:0.6rem; text-align:center; width:95px;">Cant.</th>
                                        <th style="padding:0.6rem; text-align:right; width:115px;">P. Costo ($)</th>
                                        <th style="padding:0.6rem; text-align:right; width:115px;">Subtotal ($)</th>
                                        <th style="padding:0.6rem; text-align:center; width:50px;">Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="edit-purchase-items-body">
                                </tbody>
                            </table>
                        </div>

                        <!-- Totals Summary -->
                        <div style="display:flex; justify-content:flex-end;">
                            <div style="width:300px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:8px; padding:0.85rem 1rem; font-size:0.85rem; display:flex; flex-direction:column; gap:0.4rem;">
                                <div style="display:flex; justify-content:space-between;">
                                    <span style="color:var(--text-secondary);">Subtotal Neto:</span>
                                    <strong id="edit-pur-net">$ 0.00</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between;">
                                    <span style="color:var(--text-secondary);">IVA (13%):</span>
                                    <strong id="edit-pur-iva">$ 0.00</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border-color); padding-top:0.4rem; font-size:1.05rem; color:var(--primary); font-weight:800;">
                                    <span>Total Factura / Deuda:</span>
                                    <strong id="edit-pur-total">$ 0.00</strong>
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:0.75rem; border-top:1px solid var(--border-color); padding-top:1rem; margin-top:0.5rem;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-edit-purchase">Cancelar</button>
                            <button type="submit" class="btn btn-primary" style="padding:0.5rem 1.5rem; font-weight:700;"><i class="fa-solid fa-floppy-disk"></i> Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const closeEditModal = () => {
            const m = document.getElementById(modalId);
            if (m) m.remove();
        };

        document.getElementById('btn-close-edit-modal-x')?.addEventListener('click', closeEditModal);
        document.getElementById('btn-cancel-edit-purchase')?.addEventListener('click', closeEditModal);

        // Select product change updates cost input
        const prodSelect = document.getElementById('edit-add-prod-select');
        const prodCostInput = document.getElementById('edit-add-prod-cost');
        if (prodSelect && prodCostInput) {
            prodSelect.onchange = () => {
                const opt = prodSelect.options[prodSelect.selectedIndex];
                const cost = opt ? parseFloat(opt.getAttribute('data-cost') || 0) : 0;
                prodCostInput.value = cost > 0 ? cost.toFixed(2) : '';
            };
        }

        // Add product to edit list
        document.getElementById('btn-edit-add-prod')?.addEventListener('click', () => {
            const pId = prodSelect.value;
            if (!pId) {
                showToast("Seleccione un repuesto del catálogo", "warning");
                return;
            }
            const qty = parseFloat(document.getElementById('edit-add-prod-qty').value) || 1;
            const cost = parseFloat(prodCostInput.value) || 0;

            const existingIdx = editItems.findIndex(i => i.id_producto === pId);
            if (existingIdx >= 0) {
                editItems[existingIdx].cant += qty;
                if (cost > 0) editItems[existingIdx].precio_costo = cost;
            } else {
                editItems.push({
                    id_producto: pId,
                    cant: qty,
                    precio_costo: cost
                });
            }
            renderEditItemsRows();
            prodSelect.value = '';
            prodCostInput.value = '';
        });

        // Initial items render
        renderEditItemsRows();

        // Submit form handler
        document.getElementById('form-edit-purchase').onsubmit = (e) => {
            e.preventDefault();

            if (editItems.length === 0) {
                showToast("La compra debe incluir al menos un repuesto o producto.", "warning");
                return;
            }

            const newProvId = document.getElementById('edit-pur-prov').value;
            const newNumFact = document.getElementById('edit-pur-num-doc').value.trim();
            const newNumControl = document.getElementById('edit-pur-num-control').value.trim();
            const newDate = document.getElementById('edit-pur-date').value;
            const newCondicion = document.getElementById('edit-pur-condicion').value;
            const newTipoDte = document.getElementById('edit-pur-tipo-dte').value;

            const prov = db.proveedores.find(p => p.ID_Proveedor === newProvId) || { Nombre: 'Proveedor S.A.', Dias_Credito: 0 };

            // 1. Revert Old Stock for items in comp.Items
            (comp.Items || []).forEach(oldItem => {
                const prod = db.productos.find(p => p['ID_ Producto'] === oldItem.ID_Producto);
                if (prod && !prod.Consumible) {
                    const oldQty = parseFloat(oldItem.Cantidad || 0);
                    prod.Minimos = Math.max(0, (prod.Minimos || 0) - oldQty);
                }
            });

            // 2. Apply New Stock & Cost for new items
            let netSum = 0;
            const newMappedItems = editItems.map(item => {
                const qty = parseFloat(item.cant || 0);
                const cost = parseFloat(item.precio_costo || 0);
                netSum += qty * cost;

                const prod = db.productos.find(p => p['ID_ Producto'] === item.id_producto);
                if (prod && !prod.Consumible) {
                    prod.Minimos = (prod.Minimos || 0) + qty;
                    prod['Precio Compra'] = cost;

                    // Kardex adjustment entry
                    db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
                    db['29 Movs de Inventario'].unshift({
                        id_Mov: 'MOVIN-CS-' + Math.floor(Date.now() / 1000).toString().substring(3),
                        id_producto: item.id_producto,
                        descripcion: prod.Descripcion,
                        Cant_Mov: qty,
                        'Fecha Mov': Date.now(),
                        Tipo: 'ENTRADA',
                        'Valor ($)': cost,
                        Observacion: `Edición Factura Compra ${newNumFact} (${prov.Nombre})`
                    });
                }

                return {
                    ID_Producto: item.id_producto,
                    Cantidad: qty,
                    Precio_Costo: cost
                };
            });

            const roundedNet = parseFloat(netSum.toFixed(2));
            const hasIva = newTipoDte === 'CCF' || newTipoDte === 'FAC';
            const roundedIva = hasIva ? parseFloat((netSum * 0.13).toFixed(2)) : 0;
            const roundedTotal = parseFloat((roundedNet + roundedIva).toFixed(2));

            // Calculate due date for credit
            const creditDays = parseInt(prov.Dias_Credito || 0);
            let dueDate = newDate;
            if (newCondicion === 'CREDITO' && creditDays > 0) {
                const compDateObj = new Date(newDate + 'T00:00:00');
                compDateObj.setDate(compDateObj.getDate() + creditDays);
                const y = compDateObj.getFullYear();
                const m = String(compDateObj.getMonth() + 1).padStart(2, '0');
                const d = String(compDateObj.getDate()).padStart(2, '0');
                dueDate = `${y}-${m}-${d}`;
            }

            // Update comp object
            comp.ID_Proveedor = newProvId;
            comp.Num_Factura = newNumFact;
            comp.Num_Control = newNumControl;
            comp.Fecha_Compra = newDate;
            comp.Fecha_Vencimiento = dueDate;
            comp.Dias_Credito = creditDays;
            comp.Condicion = newCondicion;
            comp.Tipo_DTE = newTipoDte;
            comp.Monto_Neto = roundedNet;
            comp.Monto_IVA = roundedIva;
            comp.Monto_Total = roundedTotal;
            comp.Saldo_Pendiente = roundedTotal;
            comp.Items = newMappedItems;

            saveDatabase(db);
            showToast(`Compra N° ${newNumFact} actualizada con éxito. Stock e inventario ajustados en Kárdex.`, "success");

            closeEditModal();
            const detailModal = document.getElementById('purchase-detail-modal');
            if (detailModal) detailModal.remove();

            renderGastos(container);
        };
    }

    // Function to annul a purchase, set status ANULADA, clear debt balance, and revert Kardex stock
    function annulPurchase(purchaseId) {
        const comp = db.compras.find(c => c.ID_Compra === purchaseId);
        if (!comp) return;

        if (comp.Estado_Pago === 'ANULADA') {
            showToast("Esta compra ya se encuentra anulada.", "warning");
            return;
        }

        const prov = db.proveedores.find(p => p.ID_Proveedor === comp.ID_Proveedor) || { Nombre: 'Proveedor S.A.' };
        const numDoc = comp.Num_Factura || comp.ID_Compra;

        if (!confirm(`¿Está seguro de ANULAR la factura de compra N° ${numDoc} (${prov.Nombre})?\n\nEsta acción:\n1. Revertirá la cantidad ingresada de los repuestos en el Kárdex de Inventario.\n2. Pondrá el estado de la compra como ANULADA y su saldo pendiente en $0.00.`)) {
            return;
        }

        // 1. Update purchase state and clear balance
        comp.Estado_Pago = 'ANULADA';
        comp.Saldo_Pendiente = 0;

        // 2. Revert Stock in Inventory & Add Output movement to Kardex
        const dteLabelMap = { CCF: 'CCF', FAC: 'Factura', FSE: 'FSE', NC: 'Nota de Crédito' };
        const dteLabel = dteLabelMap[comp.Tipo_DTE] || comp.Tipo_DTE || 'Factura';

        (comp.Items || []).forEach(item => {
            const prod = db.productos.find(p => p['ID_ Producto'] === item.ID_Producto);
            if (prod && !prod.Consumible) {
                const qty = parseFloat(item.Cantidad || 0);
                if (qty > 0) {
                    // Revert stock (subtract quantity that was added by this purchase, max min 0)
                    prod.Minimos = Math.max(0, (prod.Minimos || 0) - qty);

                    // Register Kardex SALIDA (reversal movement)
                    db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
                    db['29 Movs de Inventario'].unshift({
                        id_Mov: 'MOVIN-CS-' + Math.floor(Date.now() / 1000).toString().substring(3),
                        id_producto: item.ID_Producto,
                        descripcion: prod.Descripcion,
                        Cant_Mov: qty,
                        'Fecha Mov': Date.now(),
                        Tipo: 'SALIDA',
                        'Valor ($)': item.Precio_Costo || 0,
                        Observacion: `Anulación Compra ${dteLabel} ${numDoc} (${prov.Nombre})`
                    });
                }
            }
        });

        // 3. Mark associated gastos if any as [ANULADO]
        if (db.gastos) {
            db.gastos.forEach(g => {
                if (g.Concepto && g.Concepto.includes(numDoc) && g.ID_Proveedor === comp.ID_Proveedor) {
                    g.Concepto = `[ANULADO] ${g.Concepto}`;
                    g['Monto Total'] = 0;
                }
            });
        }

        saveDatabase(db);
        showToast(`Compra N° ${numDoc} anulada con éxito. Stock e inventario revertidos en Kárdex.`, "success");

        // Close detail modal if open
        const detailModal = document.getElementById('purchase-detail-modal');
        if (detailModal) detailModal.remove();

        renderGastos(container);
    }

    // --- TAB 3: ACCOUNTS PAYABLE (CxP) ---
    function renderCxpTab(parent) {
        // Sanitize purchase balances to exact 2 decimals to fix float rounding discrepancies
        (db.compras || []).forEach(c => {
            if (c.Saldo_Pendiente !== undefined) {
                c.Saldo_Pendiente = parseFloat(parseFloat(c.Saldo_Pendiente || 0).toFixed(2));
                if (c.Saldo_Pendiente <= 0 && c.Estado_Pago === 'PENDIENTE') {
                    c.Estado_Pago = 'PAGADO';
                    c.Saldo_Pendiente = 0;
                }
            }
            if (c.Monto_Total !== undefined) {
                c.Monto_Total = parseFloat(parseFloat(c.Monto_Total || 0).toFixed(2));
            }
        });

        const pendingPurchases = db.compras.filter(c => c.Estado_Pago === 'PENDIENTE');
        const totalDebt = pendingPurchases.reduce((sum, c) => sum + parseFloat(c.Saldo_Pendiente || 0), 0);
        const countUnpaid = pendingPurchases.length;

        parent.innerHTML = html`
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.25rem; margin-bottom:1.5rem;">
                <div class="glass-card" style="display:flex; align-items:center; gap:1rem; padding:1.25rem;">
                    <div style="width:50px; height:50px; border-radius:50%; background:rgba(239,68,68,0.15); display:flex; justify-content:center; align-items:center; color:#ef4444; font-size:1.5rem;">
                        <i class="fa-solid fa-file-invoice-dollar"></i>
                    </div>
                    <div>
                        <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Total Deuda a Proveedores</span>
                        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-primary); margin-top:0.2rem;" id="cxp-stat-debt">$ ${totalDebt.toFixed(2)}</h2>
                    </div>
                </div>
                <div class="glass-card" style="display:flex; align-items:center; gap:1rem; padding:1.25rem;">
                    <div style="width:50px; height:50px; border-radius:50%; background:rgba(245,158,11,0.15); display:flex; justify-content:center; align-items:center; color:#f59e0b; font-size:1.5rem;">
                        <i class="fa-solid fa-clock"></i>
                    </div>
                    <div>
                        <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Facturas Pendientes</span>
                        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-primary); margin-top:0.2rem;" id="cxp-stat-count">${countUnpaid} Facturas</h2>
                    </div>
                </div>
            </div>

            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
                    <h3 style="margin:0;">Compras</h3>
                </div>

                <!-- Control Bar de Filtros -->
                <div style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-bottom:1.25rem; align-items:flex-end; background:rgba(255,255,255,0.02); padding:0.85rem 1rem; border-radius:8px; border:1px solid var(--border-color);">
                    <div style="flex:1; min-width:200px;">
                        <label style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.25rem; font-weight:600;">Buscar N° Factura / Control / Repuesto</label>
                        <div style="position:relative;">
                            <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:0.6rem; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:0.8rem;"></i>
                            <input type="text" id="cxp-search-input" placeholder="Ej: 031-111467, Filtro, etc." style="width:100%; padding:0.45rem 0.6rem 0.45rem 2rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem;">
                        </div>
                    </div>

                    <div style="min-width:220px;">
                        <label style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.25rem; font-weight:600;">Filtrar por Proveedor</label>
                        <select id="cxp-filter-prov" style="width:100%; height:34px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem;">
                            <option value="">-- Todos los Proveedores --</option>
                            ${safe(db.proveedores.map(p => `<option value="${p.ID_Proveedor}">${escapeHtml(p.Nombre)}</option>`).join(''))}
                        </select>
                    </div>

                    <div style="min-width:160px;">
                        <label style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.25rem; font-weight:600;">Estado de Deuda</label>
                        <select id="cxp-filter-status" style="width:100%; height:34px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem;">
                            <option value="PENDIENTE" selected>🔴 Solo Pendientes (Deuda)</option>
                            <option value="TODOS">📋 Ver Todos</option>
                            <option value="PAGADO">🟢 Solo Pagadas (Histórico)</option>
                            <option value="VENCIDO">⚠️ Solo Vencidas</option>
                            <option value="ANULADA">🚫 Solo Anuladas</option>
                        </select>
                    </div>

                    <div style="min-width:140px;">
                        <label style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.25rem; font-weight:600;">Fecha Compra</label>
                        <input type="date" id="cxp-filter-date" style="width:100%; height:34px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-size:0.85rem; padding:0.2rem 0.5rem;">
                    </div>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha Compra / Vence</th>
                                <th>Proveedor</th>
                                <th>N° Factura</th>
                                <th>Monto Total</th>
                                <th>Saldo Pendiente</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="cxp-table-body">
                            <!-- Dynamic Rows -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Abono Modal -->
            <div class="modal" id="cxp-abono-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; justify-content:center; align-items:center;">
                <div class="modal-content glass-card" style="max-width:400px; padding:1.5rem; width:90%;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; margin-bottom:1rem;">
                        <h3 style="margin:0;"><i class="fa-solid fa-hand-holding-dollar" style="color:var(--primary);"></i> Registrar Abono a Cuenta</h3>
                        <button id="btn-close-abono-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                    </div>
                    <form id="cxp-abono-form" style="display:flex; flex-direction:column; gap:1rem;">
                        <div style="background:rgba(255,255,255,0.03); padding:0.75rem; border-radius:6px; font-size:0.8rem; line-height:1.4;">
                            <div>Proveedor: <strong id="abono-modal-prov">-</strong></div>
                            <div>Factura N°: <strong id="abono-modal-fact">-</strong></div>
                            <div>Deuda Pendiente: <strong id="abono-modal-deuda" style="color:#ef4444;">$ 0.00</strong></div>
                        </div>
                        <div class="form-group">
                            <label>Fecha de Pago</label>
                            <input type="date" id="abono-date" required value="${new Date().toISOString().split('T')[0]}" style="padding:0.5rem;">
                        </div>
                        <div class="form-group">
                            <label>Monto del Abono ($)</label>
                            <input type="number" id="abono-amount" required step="0.01" min="0.01" style="padding:0.5rem;" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label>Forma de Pago</label>
                            <select id="abono-method" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:34px; padding:0.25rem 0.5rem; width:100%;">
                                <option value="EFECTIVO">Efectivo (Caja Chica)</option>
                                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                                <option value="TARJETA">Tarjeta Débito/Crédito</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Notas / Comprobante</label>
                            <input type="text" id="abono-notes" placeholder="Ej: Transf. Agrícola #8822" style="padding:0.5rem;">
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-abono">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Aplicar Pago</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Render filtered table rows
        function renderCxpFilteredRows() {
            const tableBody = document.getElementById('cxp-table-body');
            if (!tableBody) return;

            const searchText = (document.getElementById('cxp-search-input')?.value || '').trim().toLowerCase();
            const filterProv = document.getElementById('cxp-filter-prov')?.value || '';
            const filterStatus = document.getElementById('cxp-filter-status')?.value || 'PENDIENTE';
            const filterDate = document.getElementById('cxp-filter-date')?.value || '';

            const todayObj = new Date();
            const todayTime = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate()).getTime();

            const filtered = (db.compras || []).filter(c => {
                // Status filter
                if (filterStatus === 'PENDIENTE' && c.Estado_Pago !== 'PENDIENTE') return false;
                if (filterStatus === 'PAGADO' && c.Estado_Pago !== 'PAGADO') return false;
                if (filterStatus === 'ANULADA' && c.Estado_Pago !== 'ANULADA') return false;
                if (filterStatus === 'VENCIDO') {
                    if (c.Estado_Pago !== 'PENDIENTE' || !c.Fecha_Vencimiento) return false;
                    const dueTime = new Date(c.Fecha_Vencimiento + 'T00:00:00').getTime();
                    if (dueTime >= todayTime) return false;
                }

                // Supplier filter
                if (filterProv && c.ID_Proveedor !== filterProv) return false;

                // Date filter
                if (filterDate && c.Fecha_Compra !== filterDate) return false;

                // Search text
                if (searchText) {
                    const prov = db.proveedores.find(p => p.ID_Proveedor === c.ID_Proveedor) || { Nombre: '' };
                    const provName = (prov.Nombre || '').toLowerCase();
                    const numFact = (c.Num_Factura || '').toLowerCase();
                    const numCtrl = (c.Num_Control || '').toLowerCase();
                    const itemsText = (c.Items || []).map(item => {
                        const prod = db.productos.find(p => p['ID_ Producto'] === item.ID_Producto);
                        return prod ? prod.Descripcion : item.ID_Producto;
                    }).join(' ').toLowerCase();

                    const matches = provName.includes(searchText) ||
                                    numFact.includes(searchText) ||
                                    numCtrl.includes(searchText) ||
                                    itemsText.includes(searchText);

                    if (!matches) return false;
                }

                return true;
            });

            if (filtered.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2.5rem;">No se encontraron facturas o compras que coincidan con los filtros aplicados.</td></tr>';
                return;
            }

            tableBody.innerHTML = safe(filtered.map(c => {
                const prov = db.proveedores.find(p => p.ID_Proveedor === c.ID_Proveedor) || { Nombre: 'Proveedor S.A.' };
                let dateStr = 'N/A';
                let venceStr = '';
                try {
                    dateStr = new Date(c.Fecha_Compra + 'T00:00:00').toLocaleDateString('es-SV');
                    if (c.Fecha_Vencimiento && c.Estado_Pago !== 'ANULADA') {
                        const dueTime = new Date(c.Fecha_Vencimiento + 'T00:00:00').getTime();
                        const formattedVence = new Date(c.Fecha_Vencimiento + 'T00:00:00').toLocaleDateString('es-SV');
                        
                        if (dueTime < todayTime) {
                            const diffDays = Math.ceil((todayTime - dueTime) / (1000 * 60 * 60 * 24));
                            venceStr = `<span style="font-size:0.75rem; color:#ef4444; font-weight:600;"><br>Vence: ${formattedVence} (Vencido hace ${diffDays}d)</span>`;
                        } else {
                            const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));
                            if (diffDays === 0) {
                                venceStr = `<span style="font-size:0.75rem; color:#f59e0b; font-weight:600;"><br>Vence: ${formattedVence} (Vence hoy)</span>`;
                            } else {
                                venceStr = `<span style="font-size:0.75rem; color:#10b981; font-weight:600;"><br>Vence: ${formattedVence} (Quedan ${diffDays}d)</span>`;
                            }
                        }
                    } else if (c.Estado_Pago === 'ANULADA') {
                        venceStr = `<span style="font-size:0.75rem; color:#f87171;"><br>Anulada</span>`;
                    } else {
                        venceStr = `<span style="font-size:0.75rem; color:var(--text-secondary);"><br>Vence: N/A</span>`;
                    }
                } catch(e) {}
                const itemsDetail = (c.Items || []).map(item => {
                    const prod = db.productos.find(p => p['ID_ Producto'] === item.ID_Producto);
                    const prodDesc = prod ? prod.Descripcion : item.ID_Producto;
                    return `• ${escapeHtml(prodDesc)} (${item.Cantidad})`;
                }).join('<br>');
                const isPaid = c.Estado_Pago === 'PAGADO';
                const isAnnulled = c.Estado_Pago === 'ANULADA';

                let badgeClass = 'badge-warning';
                let balanceColor = '#ef4444';
                if (isPaid) {
                    badgeClass = 'badge-success';
                    balanceColor = 'var(--success)';
                }
                if (isAnnulled) {
                    badgeClass = 'badge-danger';
                    balanceColor = 'var(--text-muted)';
                }

                const hasAbonos = (db.abonos_proveedores || []).some(a => a.ID_Compra === c.ID_Compra);
                const canEdit = c.Estado_Pago === 'PENDIENTE' && !hasAbonos;

                return `
                    <tr style="${isAnnulled ? 'opacity:0.6;' : ''}">
                        <td>${dateStr}${venceStr}</td>
                        <td><strong>${escapeHtml(prov.Nombre)}</strong></td>
                        <td>
                            <strong>${escapeHtml(c.Num_Factura)}</strong>
                            ${c.Num_Control ? `<div style="font-size:0.75rem; color:var(--cyan); margin-top:2px;" title="Número de Control">Ctrl: ${escapeHtml(c.Num_Control)}</div>` : ''}
                            ${itemsDetail ? `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.4rem; border-top:1px dashed var(--border-color); padding-top:0.3rem; line-height:1.4; font-weight:normal; max-width:280px; word-break:break-word;">${itemsDetail}</div>` : ''}
                        </td>
                        <td style="font-weight:600;">$ ${parseFloat(c.Monto_Total || 0).toFixed(2)}</td>
                        <td style="font-weight:700; color:${balanceColor};">$ ${parseFloat(c.Saldo_Pendiente || 0).toFixed(2)}</td>
                        <td><span class="badge-tag ${badgeClass}">${escapeHtml(c.Estado_Pago || 'PENDIENTE')}</span></td>
                        <td>
                            <div style="display:flex; gap:0.4rem; justify-content:center; align-items:center; flex-wrap:wrap;">
                                <button class="btn btn-secondary btn-view-purchase-detail" data-id="${c.ID_Compra}" style="padding:0.35rem 0.65rem; font-size:0.75rem; background:rgba(255,255,255,0.06); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px; cursor:pointer;" title="Ver desglose completo de repuestos, precios y abonos"><i class="fa-solid fa-eye" style="color:var(--cyan);"></i> Ver Detalle</button>

                                ${canEdit ? `<button class="btn btn-secondary btn-edit-purchase" data-id="${c.ID_Compra}" style="padding:0.35rem 0.65rem; font-size:0.75rem; background:rgba(67,97,238,0.15); border:1px solid rgba(67,97,238,0.4); color:#93c5fd; border-radius:6px; cursor:pointer;" title="Editar productos, cantidades o precios de esta compra"><i class="fa-solid fa-pen-to-square" style="color:#60a5fa;"></i> Editar</button>` : ''}

                                ${!isPaid && !isAnnulled ? `<button class="btn btn-primary btn-abono-cxp" data-id="${c.ID_Compra}" style="padding:0.35rem 0.65rem; font-size:0.75rem;"><i class="fa-solid fa-hand-holding-dollar"></i> Registrar Abono</button>` : ''}

                                ${!isAnnulled ? `<button class="btn btn-secondary btn-annul-purchase" data-id="${c.ID_Compra}" style="padding:0.35rem 0.65rem; font-size:0.75rem; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#fca5a5; border-radius:6px; cursor:pointer;" title="Anular esta compra y revertir stock en Kárdex"><i class="fa-solid fa-ban" style="color:#ef4444;"></i> Anular</button>` : `<span style="font-size:0.75rem; color:#f87171; font-weight:600;"><i class="fa-solid fa-ban"></i> Anulada</span>`}
                            </div>
                        </td>
                    </tr>
                `;
            }).join(''));

            // Re-bind view detail buttons
            parent.querySelectorAll('.btn-view-purchase-detail').forEach(btn => {
                btn.addEventListener('click', () => {
                    const compId = btn.getAttribute('data-id');
                    const comp = db.compras.find(c => c.ID_Compra === compId);
                    if (comp) showPurchaseDetailModal(comp);
                });
            });

            // Re-bind edit purchase buttons
            parent.querySelectorAll('.btn-edit-purchase').forEach(btn => {
                btn.addEventListener('click', () => {
                    const compId = btn.getAttribute('data-id');
                    const comp = db.compras.find(c => c.ID_Compra === compId);
                    if (comp) showEditPurchaseModal(comp);
                });
            });

            // Re-bind annul purchase buttons
            parent.querySelectorAll('.btn-annul-purchase').forEach(btn => {
                btn.addEventListener('click', () => {
                    const compId = btn.getAttribute('data-id');
                    annulPurchase(compId);
                });
            });

            // Re-bind abono buttons
            parent.querySelectorAll('.btn-abono-cxp').forEach(btn => {
                btn.addEventListener('click', () => {
                    const compId = btn.getAttribute('data-id');
                    const comp = db.compras.find(c => c.ID_Compra === compId);
                    if (comp) {
                        activeAbonoPurchaseId = compId;
                        const prov = db.proveedores.find(p => p.ID_Proveedor === comp.ID_Proveedor) || { Nombre: 'Proveedor S.A.' };
                        
                        document.getElementById('abono-modal-prov').textContent = prov.Nombre;
                        document.getElementById('abono-modal-fact').textContent = comp.Num_Factura;
                        document.getElementById('abono-modal-deuda').textContent = `$ ${parseFloat(comp.Saldo_Pendiente).toFixed(2)}`;
                        
                        const amountInput = document.getElementById('abono-amount');
                        const roundedDeuda = parseFloat(parseFloat(comp.Saldo_Pendiente).toFixed(2));
                        amountInput.max = roundedDeuda;
                        amountInput.value = roundedDeuda.toFixed(2);
                        
                        const modal = document.getElementById('cxp-abono-modal');
                        modal.style.display = 'flex';
                    }
                });
            });
        }

        // Attach filter listeners
        document.getElementById('cxp-search-input').oninput = renderCxpFilteredRows;
        document.getElementById('cxp-filter-prov').onchange = renderCxpFilteredRows;
        document.getElementById('cxp-filter-status').onchange = renderCxpFilteredRows;
        document.getElementById('cxp-filter-date').onchange = renderCxpFilteredRows;

        // Initial table load
        renderCxpFilteredRows();

        const closeModal = () => {
            document.getElementById('cxp-abono-modal').style.display = 'none';
            activeAbonoPurchaseId = null;
        };

        document.getElementById('btn-close-abono-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel-abono').addEventListener('click', closeModal);

        // Submit abono form
        document.getElementById('cxp-abono-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const comp = db.compras.find(c => c.ID_Compra === activeAbonoPurchaseId);
            if (!comp) return;

            const date = document.getElementById('abono-date').value;
            const amount = parseFloat(document.getElementById('abono-amount').value);
            const method = document.getElementById('abono-method').value;
            const notes = document.getElementById('abono-notes').value;

            // Normalize balances to integer cents to guarantee accurate float comparisons
            const currentDebt = parseFloat(parseFloat(comp.Saldo_Pendiente || 0).toFixed(2));
            const amountCents = Math.round((amount || 0) * 100);
            const debtCents = Math.round(currentDebt * 100);

            if (isNaN(amount) || amount <= 0 || amountCents > debtCents) {
                showToast("Monto inválido. No puede ser mayor a la deuda pendiente.", "danger");
                return;
            }

            const prov = db.proveedores.find(p => p.ID_Proveedor === comp.ID_Proveedor) || { Nombre: 'Proveedor' };
            const abonoId = "ABOP-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);

            // 1. Register Abono record
            db.abonos_proveedores.unshift({
                ID_Abono_Prov: abonoId,
                ID_Compra: comp.ID_Compra,
                Fecha_Abono: date,
                Monto_Abono: amount,
                Forma_Pago: method,
                Notas: notes
            });

            // 2. Update purchase balance safely using cents
            const newBalanceCents = debtCents - amountCents;
            if (newBalanceCents <= 0) {
                comp.Estado_Pago = 'PAGADO';
                comp.Saldo_Pendiente = 0;
            } else {
                comp.Saldo_Pendiente = parseFloat((newBalanceCents / 100).toFixed(2));
            }

            // 3. Register cash outflow in Egresos (flujo de caja real)
            db.gastos.unshift({
                "ID Gasto": "GASTO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
                "Fecha Gasto": date,
                Concepto: `Abono a Factura ${comp.Num_Factura} (${prov.Nombre})`,
                "Monto Total": amount,
                "Forma de Pago": method,
                "ID Categoría Gasto": "Insumos Directos",
                "Estado Pago": "PAGADO",
                ID_Proveedor: comp.ID_Proveedor
            });

            saveDatabase(db);
            showToast("Abono registrado con éxito en la cuenta del proveedor.", "success");
            closeModal();
            renderGastos(container);
        });
    }

    // --- TAB 4: SUPPLIERS DIRECTORY ---
    function renderProveedoresTab(parent) {
        parent.innerHTML = html`
            <div class="view-split">
                <div class="glass-card">
                    <h3>Directorio de Proveedores</h3>
                    <div class="table-container" style="margin-top:1rem;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Nombre / Razón Social</th>
                                    <th>Teléfono</th>
                                    <th>Contacto</th>
                                    <th>Plazo Crédito</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${safe(db.proveedores.length === 0
                                    ? '<tr><td colspan="6" style="text-align:center; color:var(--text-muted)">Sin proveedores registrados</td></tr>'
                                    : db.proveedores.map(p => `
                                        <tr>
                                            <td><code>${p.ID_Proveedor}</code></td>
                                            <td><strong>${escapeHtml(p.Nombre)}</strong><br><span style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(p.NIT_DUI || 'Sin NIT')}</span></td>
                                            <td>${escapeHtml(p.Telefono || 'N/A')}</td>
                                            <td>${escapeHtml(p.Contacto || 'N/A')}</td>
                                            <td><span class="badge-tag badge-primary" style="background:rgba(99, 102, 241, 0.15); color:#818cf8; font-weight:bold;">${p.Dias_Credito || 0} días</span></td>
                                            <td>
                                                <div style="display:flex; gap:0.4rem;">
                                                    <button class="btn btn-secondary btn-edit-prov" data-id="${p.ID_Proveedor}" style="padding:0.35rem 0.6rem; font-size:0.75rem;"><i class="fa-solid fa-edit"></i></button>
                                                    <button class="btn btn-danger btn-delete-prov" data-id="${p.ID_Proveedor}" style="padding:0.35rem 0.6rem; font-size:0.75rem; background:var(--danger); border:none; color:white; cursor:pointer; border-radius:4px;"><i class="fa-solid fa-trash"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join(''))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="glass-card">
                    <h3 id="prov-form-title">Registrar Nuevo Proveedor</h3>
                    <form id="prov-form" style="margin-top:1rem; display:flex; flex-direction:column; gap:1rem;">
                        <div class="form-group">
                            <label>Nombre o Razón Social</label>
                            <input type="text" id="prov-nombre" required placeholder="Ej: Super Repuestos S.A. de C.V." style="padding:0.55rem;">
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                            <div class="form-group">
                                <label>NIT o DUI</label>
                                <input type="text" id="prov-nit" placeholder="0614-222222-101-1" style="padding:0.55rem;">
                            </div>
                            <div class="form-group">
                                <label>Persona de Contacto</label>
                                <input type="text" id="prov-contacto" placeholder="Nombre de ejecutivo de ventas" style="padding:0.55rem;">
                            </div>
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                            <div class="form-group">
                                <label>Teléfono</label>
                                <input type="text" id="prov-telefono" placeholder="2222-2222" style="padding:0.55rem;">
                            </div>
                            <div class="form-group">
                                <label>Correo Electrónico</label>
                                <input type="email" id="prov-correo" placeholder="ventas@proveedor.com" style="padding:0.55rem;">
                            </div>
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns: 2fr 1fr; gap:1rem;">
                            <div class="form-group">
                                <label>Dirección</label>
                                <input type="text" id="prov-direccion" placeholder="Calle Poniente #20, San Salvador" style="padding:0.55rem;">
                            </div>
                            <div class="form-group">
                                <label>Días de Crédito (Plazo)</label>
                                <input type="number" id="prov-dias-credito" min="0" value="0" placeholder="Ej: 30" style="padding:0.55rem;">
                            </div>
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                            <button type="button" class="btn btn-secondary" id="btn-clear-prov" style="display:none; flex:1; justify-content:center;">Cancelar Edición</button>
                            <button type="submit" class="btn btn-primary" style="flex:2; justify-content:center;"><i class="fa-solid fa-save"></i> Guardar Proveedor</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const form = document.getElementById('prov-form');
        const clearBtn = document.getElementById('btn-clear-prov');

        // Bind Edit buttons
        parent.querySelectorAll('.btn-edit-prov').forEach(btn => {
            btn.addEventListener('click', () => {
                const provId = btn.getAttribute('data-id');
                const prov = db.proveedores.find(p => p.ID_Proveedor === provId);
                if (prov) {
                    editingProveedorId = provId;
                    document.getElementById('prov-form-title').textContent = "Editar Proveedor " + provId;
                    document.getElementById('prov-nombre').value = prov.Nombre;
                    document.getElementById('prov-nit').value = prov.NIT_DUI || '';
                    document.getElementById('prov-contacto').value = prov.Contacto || '';
                    document.getElementById('prov-telefono').value = prov.Telefono || '';
                    document.getElementById('prov-correo').value = prov.Correo || '';
                    document.getElementById('prov-direccion').value = prov.Direccion || '';
                    document.getElementById('prov-dias-credito').value = prov.Dias_Credito || 0;
                    clearBtn.style.display = 'inline-flex';
                }
            });
        });

        // Bind Delete buttons
        parent.querySelectorAll('.btn-delete-prov').forEach(btn => {
            btn.addEventListener('click', () => {
                const provId = btn.getAttribute('data-id');
                if (confirm(`¿Está seguro de eliminar este proveedor? Sus registros de compras se mantendrán pero el proveedor se borrará del directorio.`)) {
                    db.proveedores = db.proveedores.filter(p => p.ID_Proveedor !== provId);
                    saveDatabase(db);
                    showToast("Proveedor eliminado correctamente", "success");
                    renderGastos(container);
                }
            });
        });

        clearBtn.addEventListener('click', () => {
            editingProveedorId = null;
            document.getElementById('prov-form-title').textContent = "Registrar Nuevo Proveedor";
            form.reset();
            clearBtn.style.display = 'none';
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('prov-nombre').value;
            const nit = document.getElementById('prov-nit').value;
            const contact = document.getElementById('prov-contacto').value;
            const phone = document.getElementById('prov-telefono').value;
            const email = document.getElementById('prov-correo').value;
            const address = document.getElementById('prov-direccion').value;
            const creditDays = parseInt(document.getElementById('prov-dias-credito').value) || 0;

            if (editingProveedorId) {
                const prov = db.proveedores.find(p => p.ID_Proveedor === editingProveedorId);
                if (prov) {
                    prov.Nombre = name;
                    prov.NIT_DUI = nit;
                    prov.Contacto = contact;
                    prov.Telefono = phone;
                    prov.Correo = email;
                    prov.Direccion = address;
                    prov.Dias_Credito = creditDays;
                    showToast("Proveedor actualizado con éxito", "success");
                }
            } else {
                const newProv = {
                    ID_Proveedor: "PROV-" + Math.floor(Date.now() / 1000).toString().substring(4) + "-" + Math.floor(Math.random()*100),
                    Nombre: name,
                    NIT_DUI: nit,
                    Contacto: contact,
                    Telefono: phone,
                    Correo: email,
                    Direccion: address,
                    Dias_Credito: creditDays
                };
                db.proveedores.unshift(newProv);
                showToast("Proveedor registrado con éxito", "success");
            }

            saveDatabase(db);
            editingProveedorId = null;
            renderGastos(container);
        });
    }

    function renderDtesRecibidosTab(parent) {
        const workshopUid = localStorage.getItem('mecanic_os_workshop_uid');
        if (!workshopUid) {
            parent.innerHTML = `<div style="text-align:center; padding:3rem; color:var(--text-muted);">Debe iniciar sesión para ver los DTEs recibidos.</div>`;
            return;
        }

        parent.innerHTML = html`
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <div>
                        <h3 style="margin:0;"><i class="fa-solid fa-envelope-open-text" style="color:var(--primary); margin-right:0.5rem;"></i>Bandeja de DTEs Recibidos (Gmail)</h3>
                        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Facturas de proveedores procesadas automáticamente desde tu correo.</p>
                    </div>
                    <button id="btn-refresh-dtes" class="btn btn-secondary" style="padding:0.5rem 1rem; font-size:0.85rem;"><i class="fa-solid fa-rotate"></i> Actualizar</button>
                </div>
                
                <div class="table-container">
                    <table id="dtes-recibidos-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Proveedor / Emisor</th>
                                <th>N° Documento (DTE)</th>
                                <th>Monto Total</th>
                                <th>Estado</th>
                                <th style="text-align:right;">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="dtes-recibidos-tbody">
                            <tr><td colspan="6" style="text-align:center; color:var(--text-muted)"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando facturas...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const tbody = document.getElementById('dtes-recibidos-tbody');
        const refreshBtn = document.getElementById('btn-refresh-dtes');

        const dbFirestore = firebase.firestore();

        const loadDtes = () => {
            if (!tbody) return;
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted)"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando facturas...</td></tr>`;
            dbFirestore.collection("workshops").doc(workshopUid).collection("dte_recibidos")
                .orderBy("createdAt", "desc")
                .get()
                .then(snapshot => {
                    if (snapshot.empty) {
                        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted)">No se han recibido facturas electrónicas en tu correo aún.</td></tr>`;
                        return;
                    }
                    
                    let htmlContent = '';
                    snapshot.forEach(doc => {
                        const dte = doc.data();
                        const statusText = dte.estado === 'pendiente_aplicar' ? 
                            '<span class="badge" style="background:#eab308; color:#fff; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:600;">Pendiente de aplicar</span>' : 
                            '<span class="badge" style="background:#22c55e; color:#fff; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem; font-weight:600;">Aplicado</span>';
                        
                        const actionBtn = dte.estado === 'pendiente_aplicar' ?
                            `<button class="btn btn-primary btn-sm btn-apply-dte" data-id="${doc.id}" style="padding:0.35rem 0.75rem; font-size:0.8rem; font-weight:600;"><i class="fa-solid fa-file-import"></i> Aplicar Gasto</button>` :
                            `<button class="btn btn-secondary btn-sm" disabled style="padding:0.35rem 0.75rem; font-size:0.8rem;"><i class="fa-solid fa-check"></i> Importado</button>`;

                        htmlContent += `
                            <tr>
                                <td>${escapeHtml(dte.fecha)}</td>
                                <td><strong>${escapeHtml(dte.emisor)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(dte.nitEmisor || '')}</small></td>
                                <td>
                                    <code style="background:rgba(255,255,255,0.05); padding:0.2rem 0.4rem; border-radius:4px; font-size:0.85rem;">${escapeHtml(dte.numeroDte)}</code>
                                    ${dte.tipoDocumento ? `<br><small style="color:var(--cyan); font-weight:500; font-size:0.75rem;">${escapeHtml(dte.tipoDocumento)}</small>` : ''}
                                </td>
                                <td><strong>$${parseFloat(dte.monto || 0).toFixed(2)}</strong></td>
                                <td>${statusText}</td>
                                <td style="text-align:right;">${actionBtn}</td>
                            </tr>
                        `;
                    });
                    tbody.innerHTML = htmlContent;

                    // Bind click to apply
                    tbody.querySelectorAll('.btn-apply-dte').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const dteId = btn.getAttribute('data-id');
                            const matchedDoc = snapshot.docs.find(d => d.id === dteId);
                            if (matchedDoc) {
                                openApplyDteModal(matchedDoc.data());
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error("Error loading DTEs:", error);
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger)">Error al cargar facturas: ${escapeHtml(error.message)}</td></tr>`;
                });
        };

        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadDtes);
        }

        loadDtes();
    }

    function openApplyDteModal(dte) {
        const db = getDatabase();
        const modalId = 'apply-dte-modal';
        
        // Remove existing modal if any
        const existing = document.getElementById(modalId);
        if (existing) existing.remove();
        
        // Find matching supplier by name or NIT if possible
        let matchedProvId = '';
        if (dte.nitEmisor) {
            const cleanNit = dte.nitEmisor.replace(/[^0-9]/g, '');
            const found = db.proveedores.find(p => p.NIT_DUI && p.NIT_DUI.replace(/[^0-9]/g, '') === cleanNit);
            if (found) matchedProvId = found.ID_Proveedor;
        }
        if (!matchedProvId && dte.emisor) {
            const found = db.proveedores.find(p => p.Nombre.toLowerCase().includes(dte.emisor.toLowerCase()));
            if (found) matchedProvId = found.ID_Proveedor;
        }

        const modalHtml = html`
            <div id="${modalId}" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(4px);">
                <div class="glass-card" style="width:750px; max-height:85vh; overflow-y:auto; padding:2rem; border:1px solid var(--border-color); box-shadow:0 20px 40px rgba(0,0,0,0.5);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                        <h3 style="margin:0; color:var(--primary);"><i class="fa-solid fa-file-import"></i> Aplicar Factura de Compra DTE</h3>
                        <button id="close-apply-dte-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.02); padding:1rem; border-radius:6px; border:1px solid var(--border-color); font-size:0.9rem;">
                        <div>
                            <span style="color:var(--text-secondary);">Proveedor DTE:</span> <strong>${escapeHtml(dte.emisor)}</strong><br>
                            <span style="color:var(--text-secondary);">NIT Proveedor:</span> <span>${escapeHtml(dte.nitEmisor || 'N/A')}</span>
                        </div>
                        <div>
                            <span style="color:var(--text-secondary);">N° DTE (Sello):</span> <code style="font-size:0.85rem;">${escapeHtml(dte.numeroDte)}</code><br>
                            <span style="color:var(--text-secondary);">Tipo Documento:</span> <span style="font-size:0.85rem; font-weight:600; color:var(--cyan);">${escapeHtml(dte.tipoDocumento || 'DTE')}</span><br>
                            <span style="color:var(--text-secondary);">Monto Total:</span> <strong>$${parseFloat(dte.monto || 0).toFixed(2)}</strong>
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:1.25rem;">
                        <div class="form-row" style="display:grid; grid-template-columns:1.5fr 1fr; gap:1rem;">
                            <div class="form-group">
                                <label>Asociar a Proveedor Local</label>
                                <select id="apply-dte-prov" required style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%;">
                                    <option value="">-- Seleccionar o Crear Nuevo --</option>
                                    ${safe(db.proveedores.map(p => `<option value="${p.ID_Proveedor}" ${p.ID_Proveedor === matchedProvId ? 'selected' : ''}>${escapeHtml(p.Nombre)}</option>`).join(''))}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Condición de Pago</label>
                                <select id="apply-dte-condicion" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%;">
                                    <option value="CONTADO" selected>Contado (Pagado ya)</option>
                                    <option value="CREDITO">Crédito (Cuenta x Pagar)</option>
                                </select>
                            </div>
                        </div>

                        <div style="border-top:1px solid var(--border-color); padding-top:1rem;">
                            <h4 style="margin-bottom:0.75rem; color:var(--text-primary); font-size:0.95rem;">Mapeo de Productos al Inventario</h4>
                            <div class="table-container" style="max-height:250px; overflow-y:auto;">
                                <table style="width:100%; font-size:0.85rem;">
                                    <thead>
                                        <tr>
                                            <th>Item de la Factura</th>
                                            <th>Cant.</th>
                                            <th>Costo Unit.</th>
                                            <th>Asociar con Producto del Taller</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${safe(dte.items.map((item, idx) => {
                                            // Try to find matching product in database by description match
                                            const matchedProd = db.productos.find(p => p.Descripcion && p.Descripcion.toLowerCase().includes(item.descripcion.toLowerCase()));
                                            
                                            return `
                                                <tr class="dte-map-row" data-idx="${idx}" data-desc="${escapeHtml(item.descripcion)}" data-cant="${item.cantidad}" data-cost="${item.precioUnitario}">
                                                    <td>${escapeHtml(item.descripcion)}</td>
                                                    <td>${item.cantidad}</td>
                                                    <td>$${parseFloat(item.precioUnitario).toFixed(2)}</td>
                                                    <td>
                                                        <select class="dte-product-select" style="width:100%; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:30px; font-size:0.8rem;">
                                                            <option value="create_new">+ Crear como nuevo producto</option>
                                                            <option value="ignore">Ignorar / No inventariar</option>
                                                            ${db.productos.map(p => `<option value="${p['ID_ Producto']}" ${matchedProd && matchedProd['ID_ Producto'] === p['ID_ Producto'] ? 'selected' : ''}>${escapeHtml(p.Descripcion)} (Stock: ${p.Minimos || 0})</option>`).join('')}
                                                        </select>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join(''))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:flex-end; gap:1rem; border-top:1px solid var(--border-color); padding-top:1.25rem; margin-top:0.5rem;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-apply-dte" style="padding:0.6rem 1.25rem;">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btn-confirm-apply-dte" style="padding:0.6rem 1.5rem;"><i class="fa-solid fa-check"></i> Confirmar e Importar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Close buttons
        const closeModal = () => document.getElementById(modalId).remove();
        document.getElementById('close-apply-dte-modal').addEventListener('click', closeModal);
        document.getElementById('btn-cancel-apply-dte').addEventListener('click', closeModal);

        // Confirm button
        document.getElementById('btn-confirm-apply-dte').addEventListener('click', async () => {
            const confirmBtn = document.getElementById('btn-confirm-apply-dte');
            if (confirmBtn.disabled) return;
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Procesando...`;

            let provId = document.getElementById('apply-dte-prov').value;
            const condicion = document.getElementById('apply-dte-condicion').value;

            // 1. Create supplier if it doesn't exist
            let provName = dte.emisor;
            if (!provId) {
                provId = "PROV-" + Math.floor(Date.now() / 1000).toString().substring(4) + "-" + Math.floor(Math.random()*100);
                const newProv = {
                    ID_Proveedor: provId,
                    Nombre: dte.emisor,
                    NIT_DUI: dte.nitEmisor || "",
                    Contacto: "Contacto General",
                    Telefono: "N/A",
                    Correo: "N/A",
                    Direccion: "N/A",
                    Dias_Credito: 0
                };
                db.proveedores.unshift(newProv);
                provName = newProv.Nombre;
                showToast(`Se creó el nuevo proveedor "${dte.emisor}" automáticamente`, "success");
            } else {
                provName = db.proveedores.find(p => p.ID_Proveedor === provId)?.Nombre || dte.emisor;
            }

            // 2. Map items and update stock
            const mappedItems = [];
            const rows = document.querySelectorAll('.dte-map-row');
            
            rows.forEach(row => {
                const desc = row.getAttribute('data-desc');
                const cant = parseFloat(row.getAttribute('data-cant'));
                const cost = parseFloat(row.getAttribute('data-cost'));
                const action = row.querySelector('.dte-product-select').value;

                if (action === 'ignore') {
                    return; // skip
                }

                let productId = action;

                if (action === 'create_new') {
                    // Create new product in catalog
                    productId = "PROD-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100);
                    const newProduct = {
                        "ID_ Producto": productId,
                        Descripcion: desc,
                        Marca: "Genérico (DTE)",
                        Cod_Barra: "",
                        Precio: cost * 1.35, // 35% margin markup by default
                        Minimos: cant,      // stock
                        "Precio Unit": cost // cost
                    };
                    db.productos.unshift(newProduct);
                    showToast(`Creado producto: "${desc}"`, "success");
                } else {
                    // Update existing product
                    const prod = db.productos.find(p => p['ID_ Producto'] === productId);
                    if (prod) {
                        prod.Minimos = (prod.Minimos || 0) + cant;
                        prod['Precio Unit'] = cost; // update cost
                    }
                }

                mappedItems.push({
                    ID_Producto: productId,
                    Cantidad: cant,
                    Precio_Costo: cost
                });

                // Write Kardex movement
                db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
                db['29 Movs de Inventario'].unshift({
                    id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
                    id_producto: productId,
                    descripcion: desc,
                    Cant_Mov: cant,
                    "Fecha Mov": Date.now(),
                    Tipo: 'ENTRADA',
                    "Valor ($)": cost,
                    Observacion: `Entrada DTE ${dte.numeroDte} (${provName})`
                });
            });

            // 3. Create purchase record
            const purchaseId = "COMPRA-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
            const newPurchase = {
                ID_Compra: purchaseId,
                ID_Proveedor: provId,
                Fecha_Compra: dte.fecha,
                Fecha_Vencimiento: dte.fecha,
                Dias_Credito: 0,
                Num_Factura: dte.numeroDte,
                Monto_Neto: dte.monto / 1.13,
                Monto_IVA: dte.monto - (dte.monto / 1.13),
                Monto_Total: dte.monto,
                Condicion: condicion,
                Estado_Pago: condicion === 'CONTADO' ? 'PAGADO' : 'PENDIENTE',
                Saldo_Pendiente: condicion === 'CONTADO' ? 0 : dte.monto,
                Items: mappedItems
            };
            db.compras.unshift(newPurchase);

            // 4. Create cash expense if CONTADO
            if (condicion === 'CONTADO') {
                db.gastos.unshift({
                    "ID Gasto": "GASTO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
                    "Fecha Gasto": dte.fecha,
                    Concepto: `Compra de Repuestos - DTE ${dte.numeroDte} (${provName})`,
                    "Monto Total": dte.monto,
                    "Forma de Pago": "EFECTIVO",
                    "ID Categoría Gasto": "Insumos Directos",
                    "Estado Pago": "PAGADO",
                    ID_Proveedor: provId
                });
            }

            // 5. Update status of DTE in Firestore
            const dbFirestore = firebase.firestore();
            dbFirestore.collection("workshops")
                .doc(user.uid)
                .collection("dte_recibidos")
                .doc(dte.id_dte)
                .update({ estado: 'aplicado' })
                .then(() => {
                    // 6. Save database state and update UI
                    saveDatabase(db);
                    closeModal();
                    showToast("Factura DTE aplicada con éxito. Kardex y existencias actualizados.", "success");
                    
                    // Reload tab
                    const contentArea = document.getElementById('gastos-tab-content');
                    if (contentArea) renderDtesRecibidosTab(contentArea);
                })
                .catch(err => {
                    console.error("Error updating DTE state:", err);
                    showToast("Error al actualizar estado del DTE en la nube.", "error");
                });
        });
    }

    function renderReporteriaTab(parent) {
        parent.innerHTML = html`
            <div class="glass-card" style="max-width: 600px; margin: 2rem auto; padding: 2rem; border: 1px solid var(--border-color); border-radius: 12px; background: rgba(255,255,255,0.01);">
                <h3 style="margin-bottom: 1.5rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                    <i class="fa-solid fa-chart-line" style="color: var(--primary);"></i> Generación de Reportes de Gastos y Compras
                </h3>
                
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Seleccionar Tipo de Reporte</label>
                    <select id="rep-gastos-tipo" class="form-control" style="width: 100%; padding: 0.5rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; height: 38px;">
                        <option value="gastos_mensuales">1. Reporte de Gastos Operativos (Egresos)</option>
                        <option value="compras_proveedor">2. Estado de Cuenta de Proveedor (Compras y Abonos)</option>
                        <option value="cuentas_por_pagar">3. Resumen de Cuentas por Pagar</option>
                    </select>
                </div>
                
                <!-- Provider Selector (hidden by default) -->
                <div class="form-group" id="rep-prov-selector-group" style="margin-bottom: 1.5rem; display: none;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Seleccionar Proveedor</label>
                    <select id="rep-prov-id" class="form-control" style="width: 100%; padding: 0.5rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; height: 38px;">
                        <option value="">-- Seleccione un Proveedor --</option>
                        ${safe(db.proveedores.map(p => `<option value="${p.ID_Proveedor}">${escapeHtml(p.Nombre)}</option>`).join(''))}
                    </select>
                </div>

                <!-- Date Range (shown for 1 and 2) -->
                <div id="rep-date-range-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <div class="form-group">
                        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Fecha Desde</label>
                        <input type="date" id="rep-date-from" style="padding: 0.5rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%; box-sizing: border-box; height: 38px;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Fecha Hasta</label>
                        <input type="date" id="rep-date-to" style="padding: 0.5rem; background: var(--bg-input); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; width: 100%; box-sizing: border-box; height: 38px;">
                    </div>
                </div>
                
                <div style="display:flex; gap:1rem; margin-top:1.5rem;">
                    <button class="btn btn-primary" id="btn-generate-gastos-pdf" style="flex:1; padding: 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <i class="fa-solid fa-file-pdf"></i> Generar PDF
                    </button>
                    <button class="btn btn-secondary" id="btn-generate-gastos-excel" style="flex:1; padding: 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border-color:#2ecc71; color:#2ecc71;">
                        <i class="fa-solid fa-file-excel"></i> Exportar Excel
                    </button>
                </div>
            </div>
        `;

        const repTipo = document.getElementById('rep-gastos-tipo');
        const provGroup = document.getElementById('rep-prov-selector-group');
        const dateGroup = document.getElementById('rep-date-range-group');
        const pdfBtn = document.getElementById('btn-generate-gastos-pdf');
        const excelBtn = document.getElementById('btn-generate-gastos-excel');

        // Initialize date inputs to current month
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
        const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
        document.getElementById('rep-date-from').value = firstDay;
        document.getElementById('rep-date-to').value = lastDay;

        repTipo.addEventListener('change', () => {
            const val = repTipo.value;
            if (val === 'gastos_mensuales') {
                provGroup.style.display = 'none';
                dateGroup.style.display = 'grid';
            } else if (val === 'compras_proveedor') {
                provGroup.style.display = 'block';
                dateGroup.style.display = 'grid';
            } else if (val === 'cuentas_por_pagar') {
                provGroup.style.display = 'none';
                dateGroup.style.display = 'none';
            }
        });

        pdfBtn.addEventListener('click', () => {
            const val = repTipo.value;
            const ws = getWorkshopConfig(db);
            const fromDate = document.getElementById('rep-date-from').value;
            const toDate = document.getElementById('rep-date-to').value;

            if (val === 'gastos_mensuales') {
                printGastosPDF(db, ws, fromDate, toDate);
            } else if (val === 'compras_proveedor') {
                const provId = document.getElementById('rep-prov-id').value;
                if (!provId) {
                    showToast("Por favor seleccione un proveedor específico para generar su estado de cuenta.", "danger");
                    return;
                }
                printProveedorStatementPDF(db, ws, provId, fromDate, toDate);
            } else if (val === 'cuentas_por_pagar') {
                printCxpPDF(db, ws);
            }
        });

        excelBtn.addEventListener('click', () => {
            const val = repTipo.value;
            const fromDate = document.getElementById('rep-date-from').value;
            const toDate = document.getElementById('rep-date-to').value;

            if (val === 'gastos_mensuales') {
                const filtered = db.gastos.filter(g => {
                    const gDate = g['Fecha Gasto'] || '';
                    return gDate >= fromDate && gDate <= toDate;
                });
                const excelData = filtered.map(g => ({
                    "Fecha": g['Fecha Gasto'],
                    "Categoría": g['ID Categoría Gasto'] || 'General',
                    "Concepto": g.Concepto,
                    "Forma de Pago": g['Forma de Pago'] || 'EFECTIVO',
                    "Monto Total ($)": parseFloat(g['Monto Total'] || 0)
                }));
                downloadExcelReport(`Reporte_Gastos_${fromDate}_a_${toDate}.xlsx`, excelData);
            } else if (val === 'compras_proveedor') {
                const provId = document.getElementById('rep-prov-id').value;
                if (!provId) {
                    showToast("Por favor seleccione un proveedor específico para exportar su estado de cuenta.", "danger");
                    return;
                }
                const prov = db.proveedores.find(p => p.ID_Proveedor === provId);
                if (!prov) return;

                const creditPurchases = db.compras.filter(c => 
                    c.ID_Proveedor === provId && 
                    c.Condicion === 'CREDITO' &&
                    c.Estado_Pago !== 'ANULADA'
                );

                const charges = creditPurchases.map(c => ({
                    timestamp: c.Fecha_Compra ? new Date(c.Fecha_Compra + 'T00:00:00').getTime() : Date.now(),
                    fecha: c.Fecha_Compra || 'N/A',
                    ref: c.Num_Factura || 'Factura Crédito',
                    tipo: 'Compra a Crédito',
                    cargo: parseFloat(c.Monto_Total || 0),
                    abono: 0,
                    dte: c.mhControlNumber || c.controlNumber || ''
                }));

                const purchaseIds = creditPurchases.map(c => c.ID_Compra);
                const abonosList = (db.abonos_proveedores || []).filter(a => purchaseIds.includes(a.ID_Compra));

                const payments = abonosList.map(a => {
                    const comp = creditPurchases.find(c => c.ID_Compra === a.ID_Compra) || { Num_Factura: '' };
                    return {
                        timestamp: a.Fecha_Abono ? new Date(a.Fecha_Abono + 'T00:00:00').getTime() : Date.now(),
                        fecha: a.Fecha_Abono || 'N/A',
                        ref: `Abono a Fact. ${comp.Num_Factura || ''}`,
                        tipo: `Abono (${a.Forma_Pago || 'EFECTIVO'})`,
                        cargo: 0,
                        abono: parseFloat(a.Monto_Abono || 0),
                        dte: ''
                    };
                });

                const ledger = [...charges, ...payments].sort((a, b) => a.timestamp - b.timestamp);

                let runningBalance = 0;
                const excelData = [];
                ledger.forEach(t => {
                    runningBalance = Math.round((runningBalance + t.cargo - t.abono) * 100) / 100;
                    if (t.fecha >= fromDate && t.fecha <= toDate) {
                        excelData.push({
                            "Fecha": t.fecha,
                            "Referencia / Factura": t.ref,
                            "Tipo Transacción": t.tipo,
                            "N° DTE / Control": t.dte || "-",
                            "Compras (+) ($)": parseFloat((t.cargo || 0).toFixed(2)),
                            "Abonos (-) ($)": parseFloat((t.abono || 0).toFixed(2)),
                            "Saldo Deuda ($)": parseFloat(runningBalance.toFixed(2))
                        });
                    }
                });

                const cleanName = prov.Nombre.replace(/[^a-zA-Z0-9]/g, '_');
                downloadExcelReport(`Estado_Cuenta_Proveedor_${cleanName}_${Date.now()}.xls`, excelData);
            } else if (val === 'cuentas_por_pagar') {
                const debtors = {};
                db.compras.forEach(c => {
                    const balance = parseFloat(c.Saldo_Pendiente || 0);
                    if (balance > 0) {
                        const provId = c.ID_Proveedor;
                        if (!debtors[provId]) {
                            const prov = db.proveedores.find(p => p.ID_Proveedor === provId) || { Nombre: 'Proveedor Desconocido', NIT_DUI: '' };
                            debtors[provId] = {
                                "Proveedor": prov.Nombre,
                                "NIT / Documento": prov.NIT_DUI || 'N/A',
                                "Compras a Crédito ($)": 0,
                                "Total Abonado ($)": 0,
                                "Saldo Pendiente ($)": 0
                            };
                        }
                        const total = parseFloat(c.Monto_Total || 0);
                        debtors[provId]["Compras a Crédito ($)"] += total;
                        debtors[provId]["Saldo Pendiente ($)"] += balance;
                        debtors[provId]["Total Abonado ($)"] += (total - balance);
                    }
                });
                const excelData = Object.values(debtors).map(d => ({
                    "Proveedor": d["Proveedor"],
                    "NIT / Documento": d["NIT / Documento"],
                    "Compras a Crédito ($)": parseFloat(d["Compras a Crédito ($)"].toFixed(2)),
                    "Total Abonado ($)": parseFloat(d["Total Abonado ($)"].toFixed(2)),
                    "Saldo Pendiente ($)": parseFloat(d["Saldo Pendiente ($)"].toFixed(2))
                }));
                downloadExcelReport(`Reporte_Cuentas_por_Pagar_${Date.now()}.xls`, excelData);
            }
        });
    }

    function printGastosPDF(db, ws, fromDate, toDate) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const filtered = db.gastos.filter(g => {
            const gDate = g['Fecha Gasto'] || '';
            return gDate >= fromDate && gDate <= toDate;
        });

        filtered.sort((a, b) => (a['Fecha Gasto'] || '').localeCompare(b['Fecha Gasto'] || ''));

        const totalSpent = filtered.reduce((sum, g) => sum + parseFloat(g['Monto Total'] || 0), 0);
        const count = filtered.length;
        const avg = count > 0 ? totalSpent / count : 0;

        const brandColor = ws.color_presupuesto || '#4361ee';

        let logoHTML = '';
        if (ws.logo) {
            logoHTML = `<img src="${ws.logo}" style="max-height: 85px; max-width: 200px; object-fit: contain; border-radius: 4px;" />`;
        } else {
            logoHTML = `
                <div style="border:1.2px solid #cbd5e1; padding: 6px; border-radius:6px; background:#f8fafc; font-family:'Outfit',sans-serif; text-align:center; font-weight:800; color:${brandColor}; width:100%;">
                    <div style="font-size:1.15rem;">${escapeHtml(ws.logoText || 'TALLER')}</div>
                    <div style="font-size:0.6rem; color:#64748b; font-weight:600; text-transform:uppercase;">${escapeHtml((ws.logoTagline || '').substring(0,35))}</div>
                </div>
            `;
        }

        const rowsHtml = filtered.map(g => `
            <tr>
                <td style="padding:8px; border-bottom:1px solid #ddd; white-space:nowrap; text-align:center;">${g['Fecha Gasto'] ? new Date(g['Fecha Gasto'] + 'T00:00:00').toLocaleDateString('es-SV') : 'N/A'}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; font-weight:bold;">${escapeHtml(g['ID Categoría Gasto'] || 'General')}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd;">${escapeHtml(g.Concepto)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:center;">${escapeHtml(g['Forma de Pago'] || 'EFECTIVO')}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right; font-weight:bold;">$ ${parseFloat(g['Monto Total'] || 0).toFixed(2)}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Reporte de Gastos Operativos - ${escapeHtml(ws.name || 'Mecanic-OS')}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color:#333;
                        padding:30px;
                        font-size:12px;
                        line-height:1.4;
                        background-color:#fff;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .kpis { display: flex; gap: 15px; margin-bottom: 25px; }
                    .kpi-card { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 12px; background: #fafafa; }
                    .kpi-label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: bold; }
                    .kpi-val { font-size: 16px; font-weight: bold; margin-top: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: ${brandColor} !important; color: white !important; padding: 10px 8px; text-align: left; font-weight: bold; border: 1px solid ${brandColor} !important; }
                    .sign-box { margin-top: 60px; display: flex; justify-content: space-between; }
                    .sign-line { border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 5px; font-size: 10px; }
                    .btn-print { background: ${brandColor}; color:white; border:none; padding:10px 20px; font-weight:bold; border-radius:4px; cursor:pointer; margin-bottom:20px; }
                    
                    @media print {
                        .btn-print { display:none !important; }
                        body {
                            padding: 1.5cm !important;
                            margin: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        @page {
                            size: portrait;
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <button class="btn-print" onclick="window.print()">Imprimir o Guardar PDF</button>
                
                <!-- Styled DTE Header -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; font-size:11px; line-height:1.4;">
                    <div style="flex:1.3;">
                        <div style="font-size:22px; font-weight:bold; color:${brandColor}; font-family:'Outfit',sans-serif; margin-bottom:10px;">${escapeHtml(ws.nombre_comercial || ws.nombre || 'Grupo Gema')}</div>
                        <div><strong>Nombre o Razón Social:</strong> ${escapeHtml(ws.nombre || 'Grupo Gema')}</div>
                        <div><strong>Actividad Económica:</strong> ${escapeHtml(ws.actividad_economica || ws.giro || 'Servicios Automotrices')}</div>
                        <div><strong>NIT:</strong> ${escapeHtml(ws.num_documento || ws.nit || '')} &nbsp;&nbsp; <strong>NRC:</strong> ${escapeHtml(ws.nrc || '')}</div>
                        <div><strong>Correo Electrónico:</strong> ${escapeHtml(ws.correo || 'N/A')}</div>
                        <div><strong>Teléfono:</strong> ${escapeHtml(ws.telefono || 'N/A')}</div>
                    </div>
                    <div style="width:250px; padding-left:15px; margin-left:15px; border-left:1px solid #ddd;">
                        <div><strong>Dirección:</strong> ${escapeHtml(ws.direccion || '')}</div>
                        <div>MUNICIPIO DE ${escapeHtml((ws.municipio || '').toUpperCase())}</div>
                        <div>DEPARTAMENTO DE ${escapeHtml((ws.departamento || '').toUpperCase())}</div>
                        <div style="margin-top: 5px;"><strong>Casa Matriz/Sucursal:</strong> M001</div>
                        <div><strong>Punto de Venta:</strong> P001</div>
                    </div>
                    <div style="width:180px; text-align:right; margin-left:15px; border-right:3px solid #ddd; padding-right:15px;">
                        ${safe(logoHTML)}
                    </div>
                </div>

                <!-- Title Banner -->
                <div style="background:${brandColor} !important; color:#fff !important; text-align:center; padding:6px; font-weight:bold; font-size:12px; letter-spacing:1px; margin-bottom:15px; border-radius:3px; text-transform:uppercase; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                    REPORTE DE GASTOS OPERATIVOS (EGRESOS)
                </div>

                <div style="border: 1px solid ${brandColor} !important; border-radius: 6px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 11px; line-height: 1.6;">
                    <div>
                        <strong>Tipo de Consulta:</strong> Gastos Detallados por Período<br>
                        <strong>Rango de Fechas:</strong> ${new Date(fromDate + 'T00:00:00').toLocaleDateString('es-SV')} al ${new Date(toDate + 'T00:00:00').toLocaleDateString('es-SV')}
                    </div>
                    <div style="text-align:right;">
                        <strong>Generado el:</strong> ${new Date().toLocaleDateString('es-SV')} ${new Date().toLocaleTimeString('es-SV')}<br>
                        <strong>Estado de Consulta:</strong> PROCESADO
                    </div>
                </div>

                <div class="kpis">
                    <div class="kpi-card">
                        <div class="kpi-label">Total Egresado</div>
                        <div class="kpi-val" style="color:#ef4444;">$ ${totalSpent.toFixed(2)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Número de Transacciones</div>
                        <div class="kpi-val">${count}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Gasto Promedio</div>
                        <div class="kpi-val">$ ${avg.toFixed(2)}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width:12%; text-align:center;">Fecha</th>
                            <th style="width:20%;">Categoría</th>
                            <th>Concepto / Detalle</th>
                            <th style="width:15%; text-align:center;">Pago</th>
                            <th style="width:15%; text-align:right;">Monto Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding:15px; color:#999;">Sin registros en este período</td></tr>'}
                    </tbody>
                    <tfoot>
                        <tr style="background:#f9f9f9; font-weight:bold;">
                            <td colspan="4" style="padding:10px; border-top:2px solid #333; text-align:right;">TOTAL ACUMULADO:</td>
                            <td style="padding:10px; border-top:2px solid #333; text-align:right; color:#ef4444; font-size:14px;">$ ${totalSpent.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="sign-box">
                    <div class="sign-line">Generado por Administración</div>
                    <div class="sign-line">Firma Autorizada</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    function printProveedorStatementPDF(db, ws, provId, fromDate, toDate) {
        if (provId === 'ALL' || !provId) {
            showToast("Por favor seleccione un proveedor específico para generar su estado de cuenta.", "danger");
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const prov = db.proveedores.find(p => p.ID_Proveedor === provId);
        if (!prov) return;

        // 1. Gather all credit purchases for this supplier (excluding annulled)
        const creditPurchases = db.compras.filter(c => 
            c.ID_Proveedor === provId && 
            c.Condicion === 'CREDITO' &&
            c.Estado_Pago !== 'ANULADA'
        );

        // Map purchases to charges
        const charges = creditPurchases.map(c => ({
            timestamp: c.Fecha_Compra ? new Date(c.Fecha_Compra + 'T00:00:00').getTime() : Date.now(),
            fecha: c.Fecha_Compra || 'N/A',
            ref: c.Num_Factura || 'Factura Crédito',
            tipo: 'Compra a Crédito',
            cargo: parseFloat(c.Monto_Total || 0),
            abono: 0,
            dte: c.mhControlNumber || c.controlNumber || ''
        }));

        // 2. Gather all abonos for these purchases
        const purchaseIds = creditPurchases.map(c => c.ID_Compra);
        const abonosList = (db.abonos_proveedores || []).filter(a => purchaseIds.includes(a.ID_Compra));

        // Map abonos to payments
        const payments = abonosList.map(a => {
            const comp = creditPurchases.find(c => c.ID_Compra === a.ID_Compra) || { Num_Factura: '' };
            return {
                timestamp: a.Fecha_Abono ? new Date(a.Fecha_Abono + 'T00:00:00').getTime() : Date.now(),
                fecha: a.Fecha_Abono || 'N/A',
                ref: `Abono a Fact. ${comp.Num_Factura || ''}`,
                tipo: `Abono (${a.Forma_Pago || 'EFECTIVO'})`,
                cargo: 0,
                abono: parseFloat(a.Monto_Abono || 0),
                dte: ''
            };
        });

        // 3. Merge and sort
        const ledger = [...charges, ...payments].sort((a, b) => a.timestamp - b.timestamp);

        // 4. Calculate running balance and filter by date range
        let runningBalance = 0;
        const processedLedger = [];

        ledger.forEach(t => {
            runningBalance += t.cargo - t.abono;
            if (Math.abs(runningBalance) < 0.009) {
                runningBalance = 0;
            }
            // Only include in print list if within range
            if (t.fecha >= fromDate && t.fecha <= toDate) {
                processedLedger.push({
                    ...t,
                    balance: runningBalance
                });
            }
        });

        const brandColor = ws.color_presupuesto || '#4361ee';

        let logoHTML = '';
        if (ws.logo) {
            logoHTML = `<img src="${ws.logo}" style="max-height: 85px; max-width: 200px; object-fit: contain; border-radius: 4px;" />`;
        } else {
            logoHTML = `
                <div style="border:1.2px solid #cbd5e1; padding: 6px; border-radius:6px; background:#f8fafc; font-family:'Outfit',sans-serif; text-align:center; font-weight:800; color:${brandColor}; width:100%;">
                    <div style="font-size:1.15rem;">${escapeHtml(ws.logoText || 'TALLER')}</div>
                    <div style="font-size:0.6rem; color:#64748b; font-weight:600; text-transform:uppercase;">${escapeHtml((ws.logoTagline || '').substring(0,35))}</div>
                </div>
            `;
        }

        const rowsHtml = processedLedger.map(t => {
            const formattedDate = t.fecha ? new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-SV') : 'N/A';
            const displayCargo = Math.abs(t.cargo) < 0.009 ? 0 : t.cargo;
            const displayAbono = Math.abs(t.abono) < 0.009 ? 0 : t.abono;
            const displayBalance = Math.abs(t.balance) < 0.009 ? 0 : t.balance;

            return `
                <tr>
                    <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; white-space:nowrap; font-size:11px;">${formattedDate}</td>
                    <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; font-size:11px;">${escapeHtml(t.tipo)}</td>
                    <td style="padding:6px 8px; border:1px solid #ddd; font-family:monospace; text-align:center; font-weight:bold; font-size:11px;">${escapeHtml(t.dte || t.ref || '-')}</td>
                    <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; color:${displayCargo > 0 ? '#ef4444' : '#333'}; white-space:nowrap; font-size:11px;">$ ${displayCargo.toFixed(2)}</td>
                    <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; color:${displayAbono > 0 ? '#10b981' : '#333'}; white-space:nowrap; font-size:11px;">$ ${displayAbono.toFixed(2)}</td>
                    <td style="padding:6px 8px; border:1px solid #ddd; text-align:center; font-weight:bold; white-space:nowrap; font-size:11px;">$ ${displayBalance.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        let finalBalanceDisplay = runningBalance;
        if (Math.abs(finalBalanceDisplay) < 0.009) {
            finalBalanceDisplay = 0;
        }

        printWindow.document.write(`
            <html>
            <head>
                <title>Estado de Cuenta - ${escapeHtml(prov.Nombre)}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color:#333;
                        padding:30px;
                        font-size:12px;
                        line-height:1.4;
                        background-color:#fff;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: ${brandColor} !important; color: white !important; padding: 8px; text-align: center; font-weight: bold; border: 1px solid ${brandColor} !important; font-size: 11px; }
                    .sign-box { margin-top: 60px; display: flex; justify-content: space-between; }
                    .sign-line { border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 5px; font-size: 10px; }
                    .btn-print { background: ${brandColor}; color:white; border:none; padding:10px 20px; font-weight:bold; border-radius:4px; cursor:pointer; margin-bottom:20px; }
                    
                    @media print {
                        .btn-print { display:none !important; }
                        body {
                            padding: 1.5cm !important;
                            margin: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        @page {
                            size: portrait;
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <button class="btn-print" onclick="window.print()">Imprimir o Guardar PDF</button>
                
                <!-- Styled DTE Header -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; font-size:11px; line-height:1.4;">
                    <div style="flex:1.3;">
                        <div style="font-size:22px; font-weight:bold; color:${brandColor}; font-family:'Outfit',sans-serif; margin-bottom:10px;">${escapeHtml(ws.nombre_comercial || ws.nombre || 'Grupo Gema')}</div>
                        <div><strong>Nombre o Razón Social:</strong> ${escapeHtml(ws.nombre || 'Grupo Gema')}</div>
                        <div><strong>Actividad Económica:</strong> ${escapeHtml(ws.actividad_economica || ws.giro || 'Servicios Automotrices')}</div>
                        <div><strong>NIT:</strong> ${escapeHtml(ws.num_documento || ws.nit || '')} &nbsp;&nbsp; <strong>NRC:</strong> ${escapeHtml(ws.nrc || '')}</div>
                        <div><strong>Correo Electrónico:</strong> ${escapeHtml(ws.correo || 'N/A')}</div>
                        <div><strong>Teléfono:</strong> ${escapeHtml(ws.telefono || 'N/A')}</div>
                    </div>
                    <div style="width:250px; padding-left:15px; margin-left:15px; border-left:1px solid #ddd;">
                        <div><strong>Dirección:</strong> ${escapeHtml(ws.direccion || '')}</div>
                        <div>MUNICIPIO DE ${escapeHtml((ws.municipio || '').toUpperCase())}</div>
                        <div>DEPARTAMENTO DE ${escapeHtml((ws.departamento || '').toUpperCase())}</div>
                        <div style="margin-top: 5px;"><strong>Casa Matriz/Sucursal:</strong> M001</div>
                        <div><strong>Punto de Venta:</strong> P001</div>
                    </div>
                    <div style="width:180px; text-align:right; margin-left:15px; border-right:3px solid #ddd; padding-right:15px;">
                        ${safe(logoHTML)}
                    </div>
                </div>

                <!-- Title Banner -->
                <div style="background:${brandColor} !important; color:#fff !important; text-align:center; padding:6px; font-weight:bold; font-size:12px; letter-spacing:1px; margin-bottom:15px; border-radius:3px; text-transform:uppercase; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                    ESTADO DE CUENTA DE PROVEEDOR (CUENTAS POR PAGAR)
                </div>

                <div style="border: 1px solid ${brandColor} !important; border-radius: 6px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 11px; line-height: 1.6;">
                    <div>
                        <strong>Proveedor:</strong> ${escapeHtml(prov.Nombre)}<br>
                        <strong>NIT / DUI:</strong> ${escapeHtml(prov.NIT_DUI || 'N/A')}
                    </div>
                    <div style="text-align:right;">
                        <strong>Período de Reporte:</strong> ${new Date(fromDate + 'T00:00:00').toLocaleDateString('es-SV')} al ${new Date(toDate + 'T00:00:00').toLocaleDateString('es-SV')}<br>
                        <strong>Saldo Final al corte:</strong> $ ${finalBalanceDisplay.toFixed(2)}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width:12%; text-align:center; padding:8px;">Fecha</th>
                            <th style="padding:8px; text-align:center;">Concepto / Detalle</th>
                            <th style="width:20%; text-align:center; padding:8px;">N° DTE / Control</th>
                            <th style="width:15%; text-align:center; padding:8px;">Compras (+)</th>
                            <th style="width:15%; text-align:center; padding:8px;">Abonos (-)</th>
                            <th style="width:15%; text-align:center; padding:8px;">Saldo Deuda</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding:15px; color:#999;">Sin registros en este período</td></tr>'}
                    </tbody>
                    <tfoot>
                        <tr style="background:#f9f9f9; font-weight:bold;">
                            <td colspan="5" style="padding:10px; border-top:2px solid #333; text-align:center; font-size:11px;">SALDO PENDIENTE ACTUAL:</td>
                            <td style="padding:10px; border-top:2px solid #333; text-align:center; color:#ef4444; font-size:12px; white-space:nowrap;">$ ${finalBalanceDisplay.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="sign-box">
                    <div class="sign-line">Revisado por Finanzas</div>
                    <div class="sign-line">V°B° Proveedor</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    function printCxpPDF(db, ws) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const debtors = {};
        db.compras.forEach(c => {
            const balance = parseFloat(c.Saldo_Pendiente || 0);
            if (balance > 0) {
                const provId = c.ID_Proveedor;
                if (!debtors[provId]) {
                    const prov = db.proveedores.find(p => p.ID_Proveedor === provId) || { Nombre: 'Proveedor Desconocido', NIT_DUI: '' };
                    debtors[provId] = {
                        nombre: prov.Nombre,
                        nit: prov.NIT_DUI || 'N/A',
                        totalCredito: 0,
                        saldoPendiente: 0
                    };
                }
                const total = parseFloat(c.Monto_Total || 0);
                debtors[provId].totalCredito += total;
                debtors[provId].saldoPendiente += balance;
            }
        });

        const list = Object.values(debtors);
        list.sort((a, b) => b.saldoPendiente - a.saldoPendiente); // highest debt first

        const totalOwed = list.reduce((sum, d) => sum + d.saldoPendiente, 0);
        const count = list.length;
        const avg = count > 0 ? totalOwed / count : 0;

        const brandColor = ws.color_presupuesto || '#4361ee';

        let logoHTML = '';
        if (ws.logo) {
            logoHTML = `<img src="${ws.logo}" style="max-height: 85px; max-width: 200px; object-fit: contain; border-radius: 4px;" />`;
        } else {
            logoHTML = `
                <div style="border:1.2px solid #cbd5e1; padding: 6px; border-radius:6px; background:#f8fafc; font-family:'Outfit',sans-serif; text-align:center; font-weight:800; color:${brandColor}; width:100%;">
                    <div style="font-size:1.15rem;">${escapeHtml(ws.logoText || 'TALLER')}</div>
                    <div style="font-size:0.6rem; color:#64748b; font-weight:600; text-transform:uppercase;">${escapeHtml((ws.logoTagline || '').substring(0,35))}</div>
                </div>
            `;
        }

        const rowsHtml = list.map(d => `
            <tr>
                <td style="padding:8px; border-bottom:1px solid #ddd; font-weight:bold;">${escapeHtml(d.nombre)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:center; font-family:monospace;">${escapeHtml(d.nit)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">$ ${d.totalCredito.toFixed(2)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">$ ${(d.totalCredito - d.saldoPendiente).toFixed(2)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right; font-weight:bold; color:#ef4444;">$ ${d.saldoPendiente.toFixed(2)}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
            <head>
                <title>Reporte de Cuentas por Pagar - ${escapeHtml(ws.name || 'Mecanic-OS')}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color:#333;
                        padding:30px;
                        font-size:12px;
                        line-height:1.4;
                        background-color:#fff;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .kpis { display: flex; gap: 15px; margin-bottom: 25px; }
                    .kpi-card { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 12px; background: #fafafa; }
                    .kpi-label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: bold; }
                    .kpi-val { font-size: 16px; font-weight: bold; margin-top: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background: ${brandColor} !important; color: white !important; padding: 10px 8px; text-align: left; font-weight: bold; border: 1px solid ${brandColor} !important; }
                    .sign-box { margin-top: 60px; display: flex; justify-content: space-between; }
                    .sign-line { border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 5px; font-size: 10px; }
                    .btn-print { background: ${brandColor}; color:white; border:none; padding:10px 20px; font-weight:bold; border-radius:4px; cursor:pointer; margin-bottom:20px; }
                    
                    @media print {
                        .btn-print { display:none !important; }
                        body {
                            padding: 1.5cm !important;
                            margin: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        @page {
                            size: portrait;
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <button class="btn-print" onclick="window.print()">Imprimir o Guardar PDF</button>
                
                <!-- Styled DTE Header -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; font-size:11px; line-height:1.4;">
                    <div style="flex:1.3;">
                        <div style="font-size:22px; font-weight:bold; color:${brandColor}; font-family:'Outfit',sans-serif; margin-bottom:10px;">${escapeHtml(ws.nombre_comercial || ws.nombre || 'Grupo Gema')}</div>
                        <div><strong>Nombre o Razón Social:</strong> ${escapeHtml(ws.nombre || 'Grupo Gema')}</div>
                        <div><strong>Actividad Económica:</strong> ${escapeHtml(ws.actividad_economica || ws.giro || 'Servicios Automotrices')}</div>
                        <div><strong>NIT:</strong> ${escapeHtml(ws.num_documento || ws.nit || '')} &nbsp;&nbsp; <strong>NRC:</strong> ${escapeHtml(ws.nrc || '')}</div>
                        <div><strong>Correo Electrónico:</strong> ${escapeHtml(ws.correo || 'N/A')}</div>
                        <div><strong>Teléfono:</strong> ${escapeHtml(ws.telefono || 'N/A')}</div>
                    </div>
                    <div style="width:250px; padding-left:15px; margin-left:15px; border-left:1px solid #ddd;">
                        <div><strong>Dirección:</strong> ${escapeHtml(ws.direccion || '')}</div>
                        <div>MUNICIPIO DE ${escapeHtml((ws.municipio || '').toUpperCase())}</div>
                        <div>DEPARTAMENTO DE ${escapeHtml((ws.departamento || '').toUpperCase())}</div>
                        <div style="margin-top: 5px;"><strong>Casa Matriz/Sucursal:</strong> M001</div>
                        <div><strong>Punto de Venta:</strong> P001</div>
                    </div>
                    <div style="width:180px; text-align:right; margin-left:15px; border-right:3px solid #ddd; padding-right:15px;">
                        ${safe(logoHTML)}
                    </div>
                </div>

                <!-- Title Banner -->
                <div style="background:${brandColor} !important; color:#fff !important; text-align:center; padding:6px; font-weight:bold; font-size:12px; letter-spacing:1px; margin-bottom:15px; border-radius:3px; text-transform:uppercase; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                    RESUMEN DE CUENTAS POR PAGAR
                </div>

                <div style="border: 1px solid ${brandColor} !important; border-radius: 6px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 11px; line-height: 1.6;">
                    <div>
                        <strong>Tipo de Consulta:</strong> Consolidated Outstanding Debts<br>
                        <strong>Estado de Cuentas:</strong> CON SALDO PENDIENTE
                    </div>
                    <div style="text-align:right;">
                        <strong>Generado el:</strong> ${new Date().toLocaleDateString('es-SV')} ${new Date().toLocaleTimeString('es-SV')}<br>
                        <strong>Estado de Consulta:</strong> PROCESADO
                    </div>
                </div>

                <div class="kpis">
                    <div class="kpi-card">
                        <div class="kpi-label">Deuda Total Pendiente</div>
                        <div class="kpi-val" style="color:#ef4444;">$ ${totalOwed.toFixed(2)}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Proveedores Acreedores</div>
                        <div class="kpi-val">${count}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Deuda Promedio por Acreedor</div>
                        <div class="kpi-val">$ ${avg.toFixed(2)}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Proveedor</th>
                            <th style="width:20%; text-align:center;">NIT / Documento</th>
                            <th style="width:18%; text-align:right;">Compras a Crédito</th>
                            <th style="width:18%; text-align:right;">Total Abonado</th>
                            <th style="width:18%; text-align:right;">Saldo Pendiente</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding:15px; color:#999;">Al día. Sin deudas a proveedores</td></tr>'}
                    </tbody>
                    <tfoot>
                        <tr style="background:#f9f9f9; font-weight:bold;">
                            <td colspan="4" style="padding:10px; border-top:2px solid #333; text-align:right;">DEUDA TOTAL ACUMULADA:</td>
                            <td style="padding:10px; border-top:2px solid #333; text-align:right; color:#ef4444; font-size:13px;">$ ${totalOwed.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="sign-box">
                    <div class="sign-line">Generado por Finanzas</div>
                    <div class="sign-line">V°B° Gerencia General</div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
}

// 11. DASHBOARD BI VIEW


