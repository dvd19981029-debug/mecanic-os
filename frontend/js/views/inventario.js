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
} from '../../app.js?v=38';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport
} from '../utils.js?v=38';

let activeInventarioTab = 'catalogo';

export function renderInventario(container) {
    const db = getDatabase();
    db.productos = db.productos || [];
    db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];

    container.innerHTML = html`
        <div class="saas-tabs" style="display:flex; gap:0.5rem; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; overflow-x:auto;">
            <button class="saas-tab-btn ${activeInventarioTab === 'catalogo' ? 'active' : ''}" data-tab="catalogo" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-boxes-stacked"></i> Catálogo de Repuestos</button>
            <button class="saas-tab-btn ${activeInventarioTab === 'movimientos' ? 'active' : ''}" data-tab="movimientos" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-clock-rotate-left"></i> Historial de Movimientos (Kárdex)</button>
        </div>
        <div id="inventario-tab-content"></div>
    `;

    // Bind tabs switcher
    container.querySelectorAll('.saas-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeInventarioTab = btn.getAttribute('data-tab');
            renderInventario(container);
        });
    });

    const contentArea = document.getElementById('inventario-tab-content');

    if (activeInventarioTab === 'catalogo') {
        renderCatalogoTab(contentArea);
    } else {
        renderMovimientosTab(contentArea);
    }

    // --- TAB 1: CATALOGO ---
    function renderCatalogoTab(parent) {
        parent.innerHTML = html`
            <div class="glass-card" style="margin-bottom: 2rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap: 1rem; flex-wrap:wrap; margin-bottom: 1rem;">
                    <div class="search-bar-container" style="max-width:320px; flex:1;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="inv-search" placeholder="Buscar repuesto...">
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                        <button class="btn btn-secondary" id="btn-export-inv"><i class="fa-solid fa-file-excel" style="color:#10b981;"></i> Exportar Catálogo a Excel</button>
                        <button class="btn btn-primary" id="adjust-stock-btn"><i class="fa-solid fa-arrows-spin"></i> Ajuste Manual de Stock</button>
                    </div>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código Producto</th>
                                <th>Descripción</th>
                                <th>Unidad Medida</th>
                                <th>Precio Costo</th>
                                <th>Precio Venta + IVA</th>
                                <th>Existencia</th>
                                <th>Estado Alerta</th>
                            </tr>
                        </thead>
                        <tbody id="inv-rows-container">
                            <!-- Dynamic -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Stock Adjust Modal -->
            <div id="stock-modal" class="modal">
                <div class="modal-content glass-card" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Registrar Ajuste de Inventario</h2>
                        <button class="close-modal-btn" id="close-stock-modal">&times;</button>
                    </div>
                    <form id="stock-form">
                        <div class="form-group">
                            <label>Seleccionar Repuesto</label>
                            <select id="stock-prod-select" required style="padding: 0.65rem; width:100%; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px;">
                                ${safe(db.productos.map(p => `<option value="${escapeHtml(p['ID_ Producto'])}">${escapeHtml(p.Descripcion)} (${escapeHtml(p['ID_ Producto'])})</option>`).join(''))}
                            </select>
                        </div>
                        <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                            <div class="form-group">
                                <label>Tipo de Ajuste</label>
                                <select id="stock-adj-type" style="background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; height:36px; padding:0.25rem 0.5rem; width:100%;">
                                    <option value="ENTRADA">ENTRADA (Ajuste Positivo / Ingreso)</option>
                                    <option value="SALIDA">SALIDA (Ajuste Negativo / Descarte)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Cantidad de Movimiento</label>
                                <input type="number" id="stock-qty" required min="1" value="1" style="padding:0.4rem;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Observaciones / Motivo</label>
                            <input type="text" id="stock-notes" required placeholder="Ej. Inventario inicial, descarte..." style="padding:0.6rem;">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                            <button type="button" class="btn btn-secondary" id="cancel-stock">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Registrar Movimiento</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const rowsEl = document.getElementById('inv-rows-container');
        const searchInput = document.getElementById('inv-search');
        const stockModal = document.getElementById('stock-modal');
        const stockForm = document.getElementById('stock-form');
        const exportBtn = document.getElementById('btn-export-inv');

        function populateInventoryList(filter = '') {
            rowsEl.innerHTML = '';
            const filtered = db.productos.filter(p => 
                (p.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
                (p['ID_ Producto'] || '').toLowerCase().includes(filter.toLowerCase())
            );

            filtered.forEach(p => {
                const qty = p.Minimos || 0;
                let alertTag = '<span class="badge-tag badge-success">OK</span>';
                if (qty <= 0) alertTag = '<span class="badge-tag badge-danger">Agotado</span>';
                else if (qty <= 3) alertTag = '<span class="badge-tag badge-warning">Mínimo</span>';

                const tr = document.createElement('tr');
                tr.innerHTML = html`
                    <td><strong>${escapeHtml(p['ID_ Producto'])}</strong></td>
                    <td>${escapeHtml(p.Descripcion)}</td>
                    <td>${escapeHtml(p['Unidad de Medida'] || 'Pza')}</td>
                    <td>$ ${parseFloat(p['Precio Unit'] || 10).toFixed(2)}</td>
                    <td>$ ${parseFloat(p['Precio Venta Unit Iva Inc'] || p['Precio Unit Iva Inc'] || 13).toFixed(2)}</td>
                    <td><strong>${qty}</strong></td>
                    <td>${safe(alertTag)}</td>
                `;
                rowsEl.appendChild(tr);
            });
        }

        searchInput.addEventListener('input', (e) => populateInventoryList(e.target.value));
        
        document.getElementById('adjust-stock-btn').addEventListener('click', () => stockModal.classList.add('active'));
        document.getElementById('close-stock-modal').addEventListener('click', () => stockModal.classList.remove('active'));
        document.getElementById('cancel-stock').addEventListener('click', () => stockModal.classList.remove('active'));

        stockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const prodId = document.getElementById('stock-prod-select').value;
            const type = document.getElementById('stock-adj-type').value;
            const qty = parseInt(document.getElementById('stock-qty').value);
            const notes = document.getElementById('stock-notes').value;

            const p = db.productos.find(prod => prod['ID_ Producto'] === prodId);
            if (p) {
                p.Minimos = p.Minimos || 0;
                if (type === 'ENTRADA') p.Minimos += qty;
                else p.Minimos = Math.max(0, p.Minimos - qty);
                
                db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
                db['29 Movs de Inventario'].unshift({
                    id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
                    id_producto: prodId,
                    descripcion: p.Descripcion,
                    Cant_Mov: qty,
                    "Fecha Mov": Date.now(),
                    Tipo: type,
                    "Valor ($)": parseFloat(p['Precio Unit'] || 10),
                    Observacion: notes
                });

                saveDatabase(db);
                showToast("Ajuste de inventario registrado", "success");
                stockModal.classList.remove('active');
                populateInventoryList();
            }
        });

        exportBtn.addEventListener('click', () => {
            const filter = searchInput.value;
            const filtered = db.productos.filter(p => 
                (p.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
                (p['ID_ Producto'] || '').toLowerCase().includes(filter.toLowerCase())
            );

            if (filtered.length === 0) {
                showToast("No hay datos para exportar", "warning");
                return;
            }

            const excelData = filtered.map(p => ({
                "Código Producto": p['ID_ Producto'] || '',
                "Descripción": p.Descripcion || '',
                "Unidad de Medida": p['Unidad de Medida'] || 'Pza',
                "Precio Costo ($)": parseFloat(p['Precio Unit'] || 10),
                "Precio Venta ($)": parseFloat(p['Precio Venta Unit Iva Inc'] || p['Precio Unit Iva Inc'] || 13),
                "Existencia": p.Minimos || 0,
                "Estado": (p.Minimos || 0) <= 0 ? "Agotado" : ((p.Minimos || 0) <= 3 ? "Mínimo" : "OK")
            }));

            const timestamp = new Date().toISOString().slice(0, 10);
            downloadExcelReport(`Catalogo_Inventario_${timestamp}.xlsx`, excelData);
        });

        populateInventoryList();
    }

    // --- TAB 2: HISTORIAL DE MOVIMIENTOS (KARDEX) ---
    function renderMovimientosTab(parent) {
        parent.innerHTML = html`
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; gap: 1rem; flex-wrap:wrap; margin-bottom:1.5rem;">
                    <div class="search-bar-container" style="max-width:320px; flex:1;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="kardex-search" placeholder="Buscar por repuesto o ID...">
                    </div>
                    <button class="btn btn-secondary" id="btn-export-kardex"><i class="fa-solid fa-file-excel" style="color:#10b981;"></i> Exportar Kárdex a Excel</button>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha Movimiento</th>
                                <th>Código Producto</th>
                                <th>Descripción</th>
                                <th>Tipo</th>
                                <th>Cantidad</th>
                                <th>Costo Unitario ($)</th>
                                <th>Monto Total ($)</th>
                                <th>Observación</th>
                                <th>Número DTE</th>
                            </tr>
                        </thead>
                        <tbody id="kardex-rows-container">
                            <!-- Dynamic -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const rowsEl = document.getElementById('kardex-rows-container');
        const searchInput = document.getElementById('kardex-search');
        const exportBtn = document.getElementById('btn-export-kardex');

        function getCombinedKardexList() {
            const productMovs = db['29 Movs de Inventario'] || [];
            const facturados = (db.presupuestos || []).filter(p => p.Estado == 3);
            const laborDetails = db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || [];
            const productDetails = db.detalle_productos || db['21 Detalle Presupuesto Producto'] || [];
            
            // Create virtual labor movements
            const laborMovs = [];
            facturados.forEach(p => {
                const pLabor = laborDetails.filter(dm => dm['ID_Presupuesto MO'] === p['ID Presupuesto']);
                pLabor.forEach(dm => {
                    const tech = db.tecnicos.find(t => t.Tecnico_ID === dm.Tecnico_ID) || db.tecnicos.find(t => t.Tecnico_ID === p.Tecnico_Asignado) || { Nombre_Completo: 'Sin Asignar' };
                    let dteVal = p.mhControlNumber || p.controlNumber || 'N/A';
                    
                    laborMovs.push({
                        id_Mov: "MOVINV-LAB-" + dm.ID_DetalleMO,
                        id_producto: dm.ID_ManoObra || 'SERV',
                        descripcion: dm.Descripcion,
                        Tipo: "SALIDA",
                        Cant_Mov: parseInt(dm.Cantidad || 1),
                        "Fecha Mov": p.Fecha_Facturacion || p.Fecha || Date.now(),
                        "Valor ($)": parseFloat(dm.PrecioUnitario || 0),
                        Observacion: `Servicio Presupuesto ${p['ID Presupuesto']} - Técnico: ${tech.Nombre_Completo}`,
                        DTE: dteVal,
                        isLabor: true
                    });
                });
            });
            
            // Enhance product movements with technician names and clean up DTEs
            const enhancedProductMovs = productMovs.map(mov => {
                let obsVal = mov.Observacion || mov.observacion || '';
                let dteVal = mov.DTE || mov.dte || 'N/A';
                
                if (dteVal === 'N/A') {
                    if (obsVal.includes(' - DTE ')) {
                        const parts = obsVal.split(' - DTE ');
                        obsVal = parts[0];
                        dteVal = parts[1];
                    } else if (obsVal.includes(' DTE ')) {
                        const parts = obsVal.split(' DTE ');
                        obsVal = parts[0];
                        dteVal = parts[1];
                    }
                }
                if (dteVal === 'N/A' && obsVal.includes('Venta POS ')) {
                    const vrId = obsVal.replace('Venta POS ', '').trim();
                    const vr = (db['43 Venta Rapida'] || []).find(v => v.ID_Venta_Rapida === vrId);
                    if (vr && vr.controlNumber) {
                        dteVal = vr.controlNumber;
                    }
                }

                // Try to extract budget ID
                let budgetId = '';
                if (obsVal.includes('Presupuesto ')) {
                    const match = obsVal.match(/PRES-CS-[0-9]+/);
                    if (match) budgetId = match[0];
                }
                
                let techName = '';
                if (budgetId) {
                    const p = (db.presupuestos || []).find(x => x['ID Presupuesto'] === budgetId);
                    if (p) {
                        const dp = productDetails.find(d => d['ID_Presupuesto DPP'] === budgetId && d['ID_Producto DPP'] === mov.id_producto);
                        const techId = (dp && dp.Tecnico_ID) || (p && p.Tecnico_Asignado) || '';
                        const tech = db.tecnicos.find(t => t.Tecnico_ID === techId);
                        if (tech) techName = tech.Nombre_Completo;
                    }
                }
                
                return {
                    ...mov,
                    Observacion: techName ? `${obsVal} - Técnico: ${techName}` : obsVal,
                    DTE: dteVal
                };
            });

            // Combine and sort by date descending
            return [...enhancedProductMovs, ...laborMovs].sort((a, b) => {
                const timeA = new Date(a['Fecha Mov']).getTime();
                const timeB = new Date(b['Fecha Mov']).getTime();
                return timeB - timeA;
            });
        }

        function populateKardexList(filter = '') {
            rowsEl.innerHTML = '';
            const list = getCombinedKardexList();
            
            const filtered = list.filter(mov => {
                const obsVal = mov.Observacion || '';
                const dteVal = mov.DTE || 'N/A';
                const filterLower = filter.toLowerCase();
                return (mov.id_producto || '').toLowerCase().includes(filterLower) ||
                       (mov.descripcion || '').toLowerCase().includes(filterLower) ||
                       obsVal.toLowerCase().includes(filterLower) ||
                       dteVal.toLowerCase().includes(filterLower);
            });

            filtered.forEach(mov => {
                const tr = document.createElement('tr');
                const val = parseFloat(mov['Valor ($)'] || 0);
                const sub = (mov.Cant_Mov || 0) * val;
                
                let typeBadge = `<span class="badge-tag badge-success">ENTRADA</span>`;
                if (mov.Tipo === 'SALIDA') {
                    typeBadge = `<span class="badge-tag badge-danger">SALIDA</span>`;
                }

                let dateStr = 'N/A';
                try {
                    dateStr = new Date(mov['Fecha Mov']).toLocaleString('es-SV');
                } catch(e) {}

                tr.innerHTML = html`
                    <td>${dateStr}</td>
                    <td><code>${escapeHtml(mov.id_producto)}</code></td>
                    <td><strong>${escapeHtml(mov.descripcion)}</strong></td>
                    <td>${safe(typeBadge)}</td>
                    <td style="text-align:center; font-weight:700;">${mov.Cant_Mov}</td>
                    <td style="text-align:right;">$ ${val.toFixed(2)}</td>
                    <td style="text-align:right; font-weight:600;">$ ${sub.toFixed(2)}</td>
                    <td><span style="font-size:0.8rem; color:var(--text-secondary);">${escapeHtml(mov.Observacion)}</span></td>
                    <td><span style="font-size:0.8rem; font-family:monospace; color:var(--cyan); font-weight:600;">${escapeHtml(mov.DTE)}</span></td>
                `;
                rowsEl.appendChild(tr);
            });

            if (filtered.length === 0) {
                rowsEl.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted)">No se encontraron movimientos registrados en el Kárdex</td></tr>';
            }
        }

        searchInput.addEventListener('input', (e) => populateKardexList(e.target.value));

        exportBtn.addEventListener('click', () => {
            const filter = searchInput.value;
            const list = getCombinedKardexList();
            
            const filtered = list.filter(mov => {
                const obsVal = mov.Observacion || '';
                const dteVal = mov.DTE || 'N/A';
                const filterLower = filter.toLowerCase();
                return (mov.id_producto || '').toLowerCase().includes(filterLower) ||
                       (mov.descripcion || '').toLowerCase().includes(filterLower) ||
                       obsVal.toLowerCase().includes(filterLower) ||
                       dteVal.toLowerCase().includes(filterLower);
            });

            if (filtered.length === 0) {
                showToast("No hay datos de movimientos para exportar", "warning");
                return;
            }

            const excelData = filtered.map(mov => {
                return {
                    "Fecha": new Date(mov['Fecha Mov']).toLocaleString('es-SV'),
                    "Código Producto": mov.id_producto || '',
                    "Descripción": mov.descripcion || '',
                    "Tipo de Movimiento": mov.Tipo || '',
                    "Cantidad": mov.Cant_Mov || 0,
                    "Valor ($)": parseFloat(mov['Valor ($)'] || 0),
                    "Subtotal ($)": (mov.Cant_Mov || 0) * parseFloat(mov['Valor ($)'] || 0),
                    "Observación": mov.Observacion || '',
                    "Número DTE": mov.DTE || 'N/A'
                };
            });

            const timestamp = new Date().toISOString().slice(0, 10);
            downloadExcelReport(`Kardex_Movimientos_Inventario_${timestamp}.xlsx`, excelData);
        });

        populateKardexList();
    }
}

// 10. GASTOS Y COMPRAS VIEW


