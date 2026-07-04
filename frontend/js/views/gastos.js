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
} from '../../app.js?v=26';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport
} from '../utils.js?v=26';

let activeGastosTab = 'egresos';

export function renderGastos(container) {
    const db = getDatabase();
    
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
            <button class="saas-tab-btn ${activeGastosTab === 'cxp' ? 'active' : ''}" data-tab="cxp" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-file-invoice-dollar"></i> Cuentas por Pagar</button>
            <button class="saas-tab-btn ${activeGastosTab === 'proveedores' ? 'active' : ''}" data-tab="proveedores" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-truck-field"></i> Proveedores</button>
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
                                </tr>
                            </thead>
                            <tbody>
                                ${safe(db.gastos.length === 0 
                                    ? '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Sin gastos registrados</td></tr>'
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

    // --- TAB 2: REGISTER PURCHASE INVOICE ---
    function renderComprasTab(parent) {
        purchaseItems = purchaseItems.length === 0 ? [{ id_producto: '', cant: 1, precio_costo: 0 }] : purchaseItems;

        parent.innerHTML = html`
            <div class="glass-card" style="max-width:900px; margin:0 auto;">
                <h3>Registrar Entrada de Factura de Compra</h3>
                <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.5rem;">Carga las compras de repuestos del taller para registrar automáticamente el ingreso de stock al inventario.</p>
                
                <form id="purchase-invoice-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                    <div class="form-row" style="display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Proveedor</label>
                            <select id="pur-proveedor" required style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%;">
                                <option value="">-- Seleccionar Proveedor --</option>
                                ${safe(db.proveedores.map(p => `<option value="${p.ID_Proveedor}">${escapeHtml(p.Nombre)}</option>`).join(''))}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Fecha de Factura</label>
                            <input type="date" id="pur-date" required value="${new Date().toISOString().split('T')[0]}" style="padding:0.6rem;">
                        </div>
                        <div class="form-group">
                            <label>Número de Factura / DTE</label>
                            <input type="text" id="pur-num-doc" required placeholder="Ej: FCF-1002" style="padding:0.6rem;">
                        </div>
                        <div class="form-group">
                            <label>Condición de Pago</label>
                            <select id="pur-condicion" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:38px; width:100%;">
                                <option value="CONTADO">Contado (Pagado ya)</option>
                                <option value="CREDITO">Crédito (Cuenta x Pagar)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="border-top:1px solid var(--border-color); padding-top:1.25rem;">
                        <h4 style="margin-bottom:0.75rem; color:var(--primary); font-weight:700;">Detalle de Repuestos / Insumos</h4>
                        <div class="table-container">
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
                        <div style="width:300px; font-size:0.85rem; display:flex; flex-direction:column; gap:0.5rem; background:rgba(255,255,255,0.02); padding:1rem; border-radius:6px; border:1px solid var(--border-color);">
                            <div style="display:flex; justify-content:space-between;">
                                <span>Subtotal Neto:</span>
                                <strong id="pur-summary-subtotal">$ 0.00</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>IVA Crédito Fiscal (13%):</span>
                                <strong id="pur-summary-iva">$ 0.00</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:0.5rem; font-size:1.05rem; color:var(--primary); font-weight:700;">
                                <span>Total Factura:</span>
                                <strong id="pur-summary-total">$ 0.00</strong>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-purchase">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-circle-check"></i> Registrar Factura de Compra</button>
                    </div>
                </form>
            </div>
        `;

        const rowsContainer = document.getElementById('purchase-rows-container');
        const addRowBtn = document.getElementById('btn-add-purchase-row');
        const cancelBtn = document.getElementById('btn-cancel-purchase');
        const formEl = document.getElementById('purchase-invoice-form');

        function renderRows() {
            rowsContainer.innerHTML = purchaseItems.map((item, idx) => `
                <tr data-idx="${idx}">
                    <td>
                        <select class="pur-row-prod" required style="width:100%; padding:0.4rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                            <option value="">-- Seleccionar Repuesto --</option>
                            ${safe(db.productos.map(p => `<option value="${p['ID_ Producto']}" ${item.id_producto === p['ID_ Producto'] ? 'selected' : ''}>${escapeHtml(p.Descripcion)} (${escapeHtml(p['ID_ Producto'])})</option>`).join(''))}
                        </select>
                    </td>
                    <td>
                        <input type="number" class="pur-row-cant" required min="1" value="${item.cant}" style="width:100%; padding:0.4rem; text-align:center;">
                    </td>
                    <td>
                        <input type="number" class="pur-row-cost" required min="0.01" step="0.01" value="${item.precio_costo}" style="width:100%; padding:0.4rem; text-align:right;">
                    </td>
                    <td style="text-align:right; font-weight:600; padding:0.4rem;" class="pur-row-subtotal">
                        $ ${(item.cant * item.precio_costo).toFixed(2)}
                    </td>
                    <td style="text-align:center;">
                        ${safe(purchaseItems.length > 1 ? `<button type="button" class="pur-row-delete-btn" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem;">&times;</button>` : '')}
                    </td>
                </tr>
            `).join('');

            // Attach event listeners to all inputs in the rows
            rowsContainer.querySelectorAll('tr').forEach(row => {
                const idx = parseInt(row.getAttribute('data-idx'));
                const prodSelect = row.querySelector('.pur-row-prod');
                const cantInput = row.querySelector('.pur-row-cant');
                const costInput = row.querySelector('.pur-row-cost');
                const deleteBtn = row.querySelector('.pur-row-delete-btn');

                prodSelect.addEventListener('change', (e) => {
                    purchaseItems[idx].id_producto = e.target.value;
                    // Auto-fill cost price with current price unit from DB if 0
                    if (e.target.value && purchaseItems[idx].precio_costo === 0) {
                        const dbProd = db.productos.find(p => p['ID_ Producto'] === e.target.value);
                        if (dbProd) {
                            purchaseItems[idx].precio_costo = parseFloat(dbProd['Precio Unit'] || 0);
                            costInput.value = purchaseItems[idx].precio_costo.toFixed(2);
                        }
                    }
                    updateTotals();
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
                    deleteBtn.addEventListener('click', () => {
                        purchaseItems.splice(idx, 1);
                        renderRows();
                        updateTotals();
                    });
                }
            });

            updateTotals();
        }

        function updateTotals() {
            let sumNet = 0;
            purchaseItems.forEach(item => {
                sumNet += item.cant * item.precio_costo;
            });
            const iva = sumNet * 0.13;
            const total = sumNet + iva;

            document.getElementById('pur-summary-subtotal').textContent = `$ ${sumNet.toFixed(2)}`;
            document.getElementById('pur-summary-iva').textContent = `$ ${iva.toFixed(2)}`;
            document.getElementById('pur-summary-total').textContent = `$ ${total.toFixed(2)}`;
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

            const provId = document.getElementById('pur-proveedor').value;
            const date = document.getElementById('pur-date').value;
            const numDoc = document.getElementById('pur-num-doc').value;
            const condicion = document.getElementById('pur-condicion').value;

            // Calculations
            let sumNet = 0;
            purchaseItems.forEach(item => sumNet += item.cant * item.precio_costo);
            const iva = sumNet * 0.13;
            const total = sumNet + iva;

            const prov = db.proveedores.find(p => p.ID_Proveedor === provId) || { Nombre: 'Proveedor S.A.', Dias_Credito: 0 };
            const purchaseId = "COMPRA-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);

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

            // 1. Create Purchase record
            const newPurchase = {
                ID_Compra: purchaseId,
                ID_Proveedor: provId,
                Fecha_Compra: date,
                Fecha_Vencimiento: dueDate,
                Dias_Credito: creditDays,
                Num_Factura: numDoc,
                Monto_Neto: sumNet,
                Monto_IVA: iva,
                Monto_Total: total,
                Condicion: condicion,
                Estado_Pago: condicion === 'CONTADO' ? 'PAGADO' : 'PENDIENTE',
                Saldo_Pendiente: condicion === 'CONTADO' ? 0 : total,
                Items: purchaseItems.map(item => ({
                    ID_Producto: item.id_producto,
                    Cantidad: item.cant,
                    Precio_Costo: item.precio_costo
                }))
            };
            db.compras.unshift(newPurchase);

            // 2. Affect Stock and cost in Catalog, and record Kardex movements
            purchaseItems.forEach(item => {
                const prod = db.productos.find(p => p['ID_ Producto'] === item.id_producto);
                if (prod) {
                    prod.Minimos = (prod.Minimos || 0) + item.cant;
                    prod['Precio Unit'] = item.precio_costo;

                    // Kardex
                    db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
                    db['29 Movs de Inventario'].unshift({
                        id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
                        id_producto: item.id_producto,
                        descripcion: prod.Descripcion,
                        Cant_Mov: item.cant,
                        "Fecha Mov": Date.now(),
                        Tipo: 'ENTRADA',
                        "Valor ($)": item.precio_costo,
                        Observacion: `Compra Factura ${numDoc} (${prov.Nombre})`
                    });
                }
            });

            // 3. Register cash outflow in Egresos if CONTADO
            if (condicion === 'CONTADO') {
                db.gastos.unshift({
                    "ID Gasto": "GASTO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
                    "Fecha Gasto": date,
                    Concepto: `Compra de Repuestos - Factura ${numDoc} (${prov.Nombre})`,
                    "Monto Total": total,
                    "Forma de Pago": "EFECTIVO",
                    "ID Categoría Gasto": "Insumos Directos",
                    "Estado Pago": "PAGADO",
                    ID_Proveedor: provId
                });
            }

            saveDatabase(db);
            showToast("Factura de compra registrada con éxito. Stock e inventario actualizados.", "success");
            
            activeGastosTab = condicion === 'CONTADO' ? 'egresos' : 'cxp';
            purchaseItems = []; // Reset
            renderGastos(container);
        });

        renderRows();
    }

    // --- TAB 3: ACCOUNTS PAYABLE (CxP) ---
    function renderCxpTab(parent) {
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
                        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-primary); margin-top:0.2rem;">$ ${totalDebt.toFixed(2)}</h2>
                    </div>
                </div>
                <div class="glass-card" style="display:flex; align-items:center; gap:1rem; padding:1.25rem;">
                    <div style="width:50px; height:50px; border-radius:50%; background:rgba(245,158,11,0.15); display:flex; justify-content:center; align-items:center; color:#f59e0b; font-size:1.5rem;">
                        <i class="fa-solid fa-clock"></i>
                    </div>
                    <div>
                        <span style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Facturas Pendientes</span>
                        <h2 style="font-size:1.6rem; font-weight:800; color:var(--text-primary); margin-top:0.2rem;">${countUnpaid} Facturas</h2>
                    </div>
                </div>
            </div>

            <div class="glass-card">
                <h3>Detalle de Cuentas por Pagar (Créditos)</h3>
                <div class="table-container" style="margin-top:1rem;">
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
                        <tbody>
                            ${safe(pendingPurchases.length === 0
                                ? '<tr><td colspan="7" style="text-align:center; color:var(--text-muted)">No hay facturas pendientes de pago (Sin deudas)</td></tr>'
                                : pendingPurchases.map(c => {
                                    const prov = db.proveedores.find(p => p.ID_Proveedor === c.ID_Proveedor) || { Nombre: 'Proveedor S.A.' };
                                    let dateStr = 'N/A';
                                    let venceStr = '';
                                    try {
                                        dateStr = new Date(c.Fecha_Compra + 'T00:00:00').toLocaleDateString('es-SV');
                                        if (c.Fecha_Vencimiento) {
                                            const dueTime = new Date(c.Fecha_Vencimiento + 'T00:00:00').getTime();
                                            const todayObj = new Date();
                                            const todayTime = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate()).getTime();
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
                                        } else {
                                            venceStr = `<span style="font-size:0.75rem; color:var(--text-secondary);"><br>Vence: N/A</span>`;
                                        }
                                    } catch(e) {}
                                    const itemsDetail = (c.Items || []).map(item => {
                                        const prod = db.productos.find(p => p['ID_ Producto'] === item.ID_Producto);
                                        const prodDesc = prod ? prod.Descripcion : item.ID_Producto;
                                        return `• ${escapeHtml(prodDesc)} (${item.Cantidad})`;
                                    }).join('<br>');
                                    return `
                                        <tr>
                                            <td>${dateStr}${venceStr}</td>
                                            <td><strong>${escapeHtml(prov.Nombre)}</strong></td>
                                            <td>
                                                <strong>${escapeHtml(c.Num_Factura)}</strong>
                                                ${itemsDetail ? `<div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.4rem; border-top:1px dashed var(--border-color); padding-top:0.3rem; line-height:1.4; font-weight:normal; max-width:280px; word-break:break-word;">${itemsDetail}</div>` : ''}
                                            </td>
                                            <td style="font-weight:600;">$ ${parseFloat(c.Monto_Total).toFixed(2)}</td>
                                            <td style="font-weight:700; color:#ef4444;">$ ${parseFloat(c.Saldo_Pendiente).toFixed(2)}</td>
                                            <td><span class="badge-tag badge-warning">CRÉDITO</span></td>
                                            <td>
                                                <button class="btn btn-primary btn-abono-cxp" data-id="${c.ID_Compra}" style="padding:0.4rem 0.8rem; font-size:0.75rem;"><i class="fa-solid fa-hand-holding-dollar"></i> Registrar Abono</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join(''))}
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

        // Bind abono buttons
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

            if (amount <= 0 || amount > parseFloat(comp.Saldo_Pendiente)) {
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

            // 2. Update purchase balance
            comp.Saldo_Pendiente = parseFloat((parseFloat(comp.Saldo_Pendiente) - amount).toFixed(2));
            if (comp.Saldo_Pendiente <= 0) {
                comp.Estado_Pago = 'PAGADO';
                comp.Saldo_Pendiente = 0;
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
}

// 11. DASHBOARD BI VIEW


