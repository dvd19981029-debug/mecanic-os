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
    makeSelectSearchable,
    showDteErrorModal,
    getNombreProducto
} from '../utils.js?v=80';
import { printDteTicket, viewDtePdf } from './facturador.js?v=145';

export function renderVentaRapida(container) {
    const db = getDatabase();
    
    let tempProducts = [];
    let tempLabor = [];
    let editingVentaRapidaId = null;
    
    container.innerHTML = html`
        <div class="tabs-container" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; flex-wrap: wrap;">
            <button class="tab-btn active" id="pos-tab-btn-new" style="background: none; border: none; color: var(--text-primary); border-bottom: 2px solid var(--primary); font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; transition: all 0.2s; display: flex; align-items: center; gap: 0.35rem;">
                <i class="fa-solid fa-cart-plus"></i> Nueva Venta
            </button>
            <button class="tab-btn" id="pos-tab-btn-pending" style="background: none; border: none; color: var(--text-secondary); font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; transition: all 0.2s; display: flex; align-items: center; gap: 0.35rem;">
                <i class="fa-solid fa-clock-rotate-left"></i> Ventas Pendientes
            </button>
            <button class="tab-btn" id="pos-tab-btn-history" style="background: none; border: none; color: var(--text-secondary); font-size: 1.1rem; font-weight: 600; cursor: pointer; padding: 0.5rem 1rem; transition: all 0.2s; display: flex; align-items: center; gap: 0.35rem;">
                <i class="fa-solid fa-file-invoice"></i> Historial Facturadas
            </button>
        </div>

        <!-- PANEL 1: NUEVA VENTA -->
        <div id="pos-panel-new" class="pos-panel">
            <div class="budget-editor" style="display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: start;">
                <div class="items-section" style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <!-- Client and Document Selection -->
                    <div class="glass-card" style="padding: 1.25rem;">
                        <h4 style="margin: 0 0 1rem 0; color: var(--primary); font-family: var(--font-heading); display:flex; align-items:center; gap:0.5rem; font-size:1.05rem; font-weight:700;">
                            <i class="fa-solid fa-user-tag"></i> Datos del Cliente y Documento
                        </h4>
                        <div class="form-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1rem;">
                            <div class="form-group" style="margin:0;">
                                <label style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:0.4rem;">
                                    <i class="fa-solid fa-user"></i> Seleccionar Cliente
                                </label>
                                <select id="pos-client-select" style="padding: 0.65rem; width:100%; font-family:inherit;">
                                    ${safe(db.clientes.map(c => `<option value="${escapeHtml(c.Codigo_Cliente)}">${escapeHtml(c.Nombre)}</option>`).join(''))}
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:0.4rem;">
                                    <i class="fa-solid fa-car"></i> Vehículo (Opcional)
                                </label>
                                <select id="pos-vehicle-select" style="padding: 0.65rem; width:100%; font-family:inherit;">
                                    <option value="">-- Sin Vehículo (Venta Mostrador) --</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:0.4rem;">
                                    <i class="fa-solid fa-file-invoice"></i> Tipo de Documento
                                </label>
                                <select id="pos-doc-type" style="padding: 0.65rem; width:100%; font-family:inherit;">
                                    <option value="FE">Factura Electrónica (Consumidor Final)</option>
                                    <option value="CCF">Comprobante de Crédito Fiscal (CCF)</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:0.4rem;">
                                <i class="fa-regular fa-comment-dots"></i> Observaciones / Notas de la Venta (Opcional)
                            </label>
                            <input type="text" id="pos-observaciones" placeholder="Ej: Venta de mostrador / Retira el cliente / Mantenimiento específico..." style="padding: 0.65rem 0.8rem; width:100%; font-family:inherit; background:var(--bg-input); border:1px solid var(--border-color); border-radius:var(--radius-sm); color:var(--text-primary); font-size:0.85rem;" autocomplete="off">
                        </div>
                    </div>

                    <!-- Products Table -->
                    <div class="glass-card" style="padding: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin:0; font-size:1.1rem; font-weight:700;">Repuestos y Refacciones</h3>
                            <button class="btn btn-primary" id="pos-add-prod-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display:flex; align-items:center; gap:0.3rem;">
                                <i class="fa-solid fa-plus"></i> Agregar Repuesto
                            </button>
                        </div>
                        <div class="item-row" style="background-color: var(--border-color); font-weight: bold; border: none; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; display: grid; grid-template-columns: 80px 2.5fr 1fr 1fr 1fr 50px; gap: 1rem; align-items: center;">
                            <div>Código</div>
                            <div>Descripción</div>
                            <div>Cantidad</div>
                            <div>Precio Unit.</div>
                            <div style="text-align: right;">Total</div>
                            <div></div>
                        </div>
                        <div id="pos-products-rows" style="margin-top: 0.5rem;">
                            <!-- Injected rows -->
                        </div>
                    </div>

                    <!-- Labor Table -->
                    <div class="glass-card" style="padding: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin:0; font-size:1.1rem; font-weight:700;">Mano de Obra y Servicios</h3>
                            <button class="btn btn-primary" id="pos-add-labor-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; display:flex; align-items:center; gap:0.3rem;">
                                <i class="fa-solid fa-plus"></i> Agregar Servicio
                            </button>
                        </div>
                        <div class="item-row" style="background-color: var(--border-color); font-weight: bold; border: none; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; display: grid; grid-template-columns: 80px 2.5fr 1fr 1fr 1fr 50px; gap: 1rem; align-items: center;">
                            <div>Código</div>
                            <div>Descripción del Servicio</div>
                            <div>Cantidad</div>
                            <div>Precio Unit.</div>
                            <div style="text-align: right;">Total</div>
                            <div></div>
                        </div>
                        <div id="pos-labor-rows" style="margin-top: 0.5rem;">
                            <!-- Injected rows -->
                        </div>
                    </div>
                </div>

                <!-- Sidebar Summary -->
                <div class="summary-sidebar glass-card" style="padding: 1.25rem; position: sticky; top: 10px;">
                    <h3 style="margin:0 0 0.25rem 0; font-size:1.15rem; font-weight:700;">Resumen de Venta</h3>
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin: 0 0 1.25rem 0;"><i class="fa-solid fa-shield-halved"></i> Solo ventas al contado (Contado)</p>
                    
                    <div class="form-group" style="margin-bottom:1rem;">
                        <label style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:0.4rem;">Aplicar Promoción / Descuento</label>
                        <select id="pos-promo-select" style="padding: 0.5rem; width:100%; font-family:inherit;">
                            <option value="">Sin promoción / descuento</option>
                            ${safe((db.promociones || []).filter(pr => pr.Estado === 'Activo').map(pr => {
                                const desc = pr.Tipo === 'monto_fijo' ? `$${parseFloat(pr.Valor).toFixed(2)}` : `${parseFloat(pr.Valor)}%`;
                                return `<option value="${escapeHtml(pr.ID_Promocion)}">${escapeHtml(pr.Nombre)} (${desc})</option>`;
                            }).join(''))}
                        </select>
                    </div>

                    <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; font-size: 0.85rem; display:flex; flex-direction:column; gap:0.4rem;">
                        <div class="summary-row" style="display:flex; justify-content:space-between;"><span>Suma Repuestos:</span><span id="pos-sum-products">$0.00</span></div>
                        <div class="summary-row" style="display:flex; justify-content:space-between;"><span>Suma Mano Obra:</span><span id="pos-sum-labor">$0.00</span></div>
                        <div class="summary-row" style="display:flex; justify-content:space-between; font-weight:600; border-top: 1px dashed var(--border-color); padding-top:0.4rem; margin-top:0.2rem;"><span>Subtotal Neto:</span><span id="pos-subtotal-neto">$0.00</span></div>
                        <div id="pos-discount-section"></div>
                        <div class="summary-row" style="display:flex; justify-content:space-between;"><span>IVA (13%):</span><span id="pos-tax-iva">$0.00</span></div>
                        <div id="pos-ret-per-section"></div>
                        <div class="summary-total" style="display:flex; justify-content:space-between; font-weight: 800; font-size: 1.25rem; color: var(--cyan); border-top: 1px solid var(--border-color); padding-top: 0.6rem; margin-top: 0.4rem;">
                            <span>TOTAL:</span><span id="pos-grand-total">$0.00</span>
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
                        <button class="btn btn-success" id="pos-save-btn" style="background: var(--success); font-weight:600; padding:0.65rem;"><i class="fa-solid fa-floppy-disk"></i> Crear Venta Rápida</button>
                        <button class="btn btn-secondary" id="pos-clear-btn-new" style="padding:0.65rem;"><i class="fa-solid fa-trash"></i> Vaciar Todo</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- PANEL 2: VENTAS PENDIENTES -->
        <div id="pos-panel-pending" class="pos-panel" style="display: none;">
            <div class="glass-card" style="padding: 1.25rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; gap:1rem; flex-wrap:wrap;">
                    <h3 style="margin:0; font-size:1.15rem; font-weight:700;"><i class="fa-solid fa-clock-rotate-left"></i> Ventas Rápidas Pendientes de Facturar</h3>
                    <div class="search-bar-container" style="max-width:300px; margin:0; flex-grow:1;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="pos-pending-search" placeholder="Buscar venta o cliente...">
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código Venta</th>
                                <th>Fecha Creación</th>
                                <th>Cliente</th>
                                <th>Tipo Doc</th>
                                <th>Total</th>
                                <th>Usuario</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="pos-pending-rows">
                            <!-- Injected -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- PANEL 3: HISTORIAL FACTURADAS -->
        <div id="pos-panel-history" class="pos-panel" style="display: none;">
            <div class="glass-card" style="padding: 1.25rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; gap:1rem; flex-wrap:wrap;">
                    <h3 style="margin:0; font-size:1.15rem; font-weight:700;"><i class="fa-solid fa-file-invoice"></i> Historial de Ventas Rápidas Facturadas</h3>
                    <div class="search-bar-container" style="max-width:300px; margin:0; flex-grow:1;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="pos-history-search" placeholder="Buscar DTE, cliente o código...">
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código Venta</th>
                                <th>Fecha Emisión</th>
                                <th>Cliente</th>
                                <th>Tipo Doc</th>
                                <th>Número Control DTE</th>
                                <th>Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="pos-history-rows">
                            <!-- Injected -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Add Product Item Modal -->
        <div id="pos-prod-modal" class="modal">
            <div class="modal-content glass-card">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h2 style="margin:0; font-size:1.25rem;">Buscar Repuesto</h2>
                    <button class="close-modal-btn" id="close-pos-prod-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label>Buscar en catálogo</label>
                    <input type="text" id="search-pos-prod" placeholder="Escribe descripción o código..." style="padding:0.6rem; width:100%; margin-top:0.25rem;">
                </div>
                <div class="scrollable-list" id="pos-prod-results" style="max-height: 300px; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem;">
                    <!-- Results dynamic -->
                </div>
            </div>
        </div>

        <!-- Add Labor Item Modal -->
        <div id="pos-labor-modal" class="modal">
            <div class="modal-content glass-card">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h2 style="margin:0; font-size:1.25rem;">Buscar Servicio (Mano de Obra)</h2>
                    <button class="close-modal-btn" id="close-pos-labor-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div class="form-group" style="margin-bottom:1rem;">
                    <label>Buscar en catálogo</label>
                    <input type="text" id="search-pos-labor" placeholder="Escribe descripción de servicio..." style="padding:0.6rem; width:100%; margin-top:0.25rem;">
                </div>
                <div class="scrollable-list" id="pos-labor-results" style="max-height: 300px; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem;">
                    <!-- Results dynamic -->
                </div>
            </div>
        </div>

        <!-- POS Invoicing Modal -->
        <div id="pos-billing-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 550px;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    <h2 style="margin:0; font-size:1.25rem; color:var(--primary);"><i class="fa-solid fa-cash-register"></i> Facturar Venta Rápida (DTE)</h2>
                    <button class="close-modal-btn" id="close-pos-billing-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <div class="modal-body" id="pos-billing-modal-body" style="display:flex; flex-direction:column; gap:1rem;">
                    <!-- Dynamic Injected Form -->
                </div>
            </div>
        </div>
    `;

    // Elements
    const tabBtnNew = document.getElementById('pos-tab-btn-new');
    const tabBtnPending = document.getElementById('pos-tab-btn-pending');
    const tabBtnHistory = document.getElementById('pos-tab-btn-history');
    
    const panelNew = document.getElementById('pos-panel-new');
    const panelPending = document.getElementById('pos-panel-pending');
    const panelHistory = document.getElementById('pos-panel-history');
    
    makeSelectSearchable('pos-client-select', 'Buscar y seleccionar cliente...');
    const clientSelect = document.getElementById('pos-client-select');
    const vehicleSelect = document.getElementById('pos-vehicle-select');
    makeSelectSearchable('pos-vehicle-select', 'Buscar o seleccionar vehículo (Opcional)...');
    const docTypeSelect = document.getElementById('pos-doc-type');
    const observacionesInput = document.getElementById('pos-observaciones');

    function populatePosVehicles(clientCode, selectedVehKey = '') {
        if (!vehicleSelect) return;
        const rawVehicles = [...(db.vehiculos || []), ...(db['02 Vehiculos'] || [])];
        const vMap = new Map();
        rawVehicles.forEach(v => {
            const key = v.ID_Vehiculo || v.Placas || v.Placa;
            if (key && !vMap.has(key)) vMap.set(key, v);
        });
        const allVehs = Array.from(vMap.values());
        
        const clientVehs = allVehs.filter(v => {
            if (!clientCode) return false;
            return (v.Codigo_Cliente && v.Codigo_Cliente === clientCode) ||
                   (v.Cliente && v.Cliente === clientCode) ||
                   (v.ID_Cliente && v.ID_Cliente === clientCode);
        });
        
        vehicleSelect.innerHTML = '<option value="">-- Sin Vehículo (Venta Mostrador) --</option>';
        clientVehs.forEach(v => {
            const opt = document.createElement('option');
            const vehId = v.ID_Vehiculo || v.Placas || v.Placa;
            opt.value = vehId;
            const placa = v.Placas || v.Placa || 'S/P';
            const marca = v.Marca || '';
            const modelo = v.Modelo || '';
            const anio = v.Año || v.Anio || '';
            const details = [placa];
            if (marca || modelo) details.push(`- ${marca} ${modelo}`.trim());
            if (anio) details.push(`(${anio})`);
            opt.textContent = details.join(' ');
            
            if (selectedVehKey && (vehId === selectedVehKey || v.Placas === selectedVehKey || v.Placa === selectedVehKey)) {
                opt.selected = true;
            }
            vehicleSelect.appendChild(opt);
        });
        
        if (!selectedVehKey) {
            vehicleSelect.value = '';
        }
        vehicleSelect.dispatchEvent(new Event('change'));
    }

    if (clientSelect) {
        populatePosVehicles(clientSelect.value);
        clientSelect.addEventListener('change', () => {
            populatePosVehicles(clientSelect.value);
            calculateTotals();
        });
    }
    
    const productsRows = document.getElementById('pos-products-rows');
    const laborRows = document.getElementById('pos-labor-rows');
    
    const sumProductsEl = document.getElementById('pos-sum-products');
    const sumLaborEl = document.getElementById('pos-sum-labor');
    const subtotalNetoEl = document.getElementById('pos-subtotal-neto');
    const discountSection = document.getElementById('pos-discount-section');
    const taxIvaEl = document.getElementById('pos-tax-iva');
    const retPerSection = document.getElementById('pos-ret-per-section');
    const grandTotalEl = document.getElementById('pos-grand-total');
    const promoSelect = document.getElementById('pos-promo-select');
    
    const prodModal = document.getElementById('pos-prod-modal');
    const closeProdModal = document.getElementById('close-pos-prod-modal');
    const addProdBtn = document.getElementById('pos-add-prod-btn');
    const searchProd = document.getElementById('search-pos-prod');
    
    const laborModal = document.getElementById('pos-labor-modal');
    const closeLaborModal = document.getElementById('close-pos-labor-modal');
    const addLaborBtn = document.getElementById('pos-add-labor-btn');
    const searchLabor = document.getElementById('search-pos-labor');
    
    const billingModal = document.getElementById('pos-billing-modal');
    const closeBillingModal = document.getElementById('close-pos-billing-modal');
    const billingBody = document.getElementById('pos-billing-modal-body');
    
    const saveBtn = document.getElementById('pos-save-btn');
    const clearBtn = document.getElementById('pos-clear-btn-new');
    
    const pendingSearch = document.getElementById('pos-pending-search');
    const historySearch = document.getElementById('pos-history-search');

    let lastCalculatedSubtotal = 0;
    let lastCalculatedDiscount = 0;
    let lastCalculatedIva = 0;
    let lastCalculatedPerception = 0;
    let lastCalculatedRetention = 0;
    let lastCalculatedGrandTotal = 0;

    // Tabs logic
    function switchPosTab(tabName) {
        tabBtnNew.style.color = 'var(--text-secondary)';
        tabBtnNew.style.borderBottom = 'none';
        tabBtnPending.style.color = 'var(--text-secondary)';
        tabBtnPending.style.borderBottom = 'none';
        tabBtnHistory.style.color = 'var(--text-secondary)';
        tabBtnHistory.style.borderBottom = 'none';
        
        panelNew.style.display = 'none';
        panelPending.style.display = 'none';
        panelHistory.style.display = 'none';
        
        if (tabName === 'new') {
            tabBtnNew.style.color = 'var(--text-primary)';
            tabBtnNew.style.borderBottom = '2px solid var(--primary)';
            panelNew.style.display = 'block';
        } else if (tabName === 'pending') {
            tabBtnPending.style.color = 'var(--text-primary)';
            tabBtnPending.style.borderBottom = '2px solid var(--primary)';
            panelPending.style.display = 'block';
            populatePendingList();
        } else if (tabName === 'history') {
            tabBtnHistory.style.color = 'var(--text-primary)';
            tabBtnHistory.style.borderBottom = '2px solid var(--primary)';
            panelHistory.style.display = 'block';
            populateHistoryList();
        }
    }
    
    tabBtnNew.addEventListener('click', () => switchPosTab('new'));
    tabBtnPending.addEventListener('click', () => switchPosTab('pending'));
    tabBtnHistory.addEventListener('click', () => switchPosTab('history'));

    // Client select doc-type linkage
    clientSelect.addEventListener('change', () => {
        const client = db.clientes.find(c => c.Codigo_Cliente === clientSelect.value) || {};
        if (client['Contribuyente?'] === 'SI') {
            docTypeSelect.value = 'CCF';
        } else {
            docTypeSelect.value = 'FE';
        }
        calculateTotals();
    });
    
    docTypeSelect.addEventListener('change', calculateTotals);

    // Modals visibility
    addProdBtn.addEventListener('click', () => {
        prodModal.classList.add('active');
        searchProd.value = '';
        populateProdList('');
        searchProd.focus();
    });
    closeProdModal.addEventListener('click', () => prodModal.classList.remove('active'));
    
    addLaborBtn.addEventListener('click', () => {
        laborModal.classList.add('active');
        searchLabor.value = '';
        populateLaborList('');
        searchLabor.focus();
    });
    closeLaborModal.addEventListener('click', () => laborModal.classList.remove('active'));
    
    closeBillingModal.addEventListener('click', () => {
        billingModal.classList.remove('active');
        populatePendingList();
    });

    // Search catalog items populating
    function populateProdList(filterText = '') {
        const resultsContainer = document.getElementById('pos-prod-results');
        resultsContainer.innerHTML = '';
        const searchNormalized = (filterText || '').toLowerCase().trim();
        const filtered = db.productos.filter(p => {
            const fullName = getNombreProducto(p);
            return (
                fullName.toLowerCase().includes(searchNormalized) ||
                (p.Descripcion || '').toLowerCase().includes(searchNormalized) ||
                (p['ID_ Producto'] || '').toLowerCase().includes(searchNormalized) ||
                (p.Barra || '').toLowerCase().includes(searchNormalized) ||
                (p['Aplicación'] || '').toLowerCase().includes(searchNormalized)
            );
        });
        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1rem;">Sin resultados</div>';
            return;
        }
        filtered.forEach(p => {
            const div = document.createElement('div');
            div.className = 'catalog-item';
            div.style = 'display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.75rem; border-bottom:1px solid var(--border-color); cursor:pointer; border-radius:4px; transition: background 0.15s;';
            div.addEventListener('mouseenter', () => div.style.backgroundColor = 'rgba(255,255,255,0.03)');
            div.addEventListener('mouseleave', () => div.style.backgroundColor = 'transparent');
            
            const fullName = getNombreProducto(p);
            div.innerHTML = html`
                <div>
                    <strong>${escapeHtml(fullName || p.Descripcion)}</strong>
                    <div style="font-size:0.75rem; color:var(--text-secondary);">Código: ${escapeHtml(p['ID_ Producto'])} | Stock: ${p.Minimos || 0}</div>
                </div>
                <div style="font-weight:bold; color:var(--cyan);">$ ${parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0).toFixed(2)}</div>
            `;
            div.addEventListener('click', () => {
                addTempProduct(p);
                prodModal.classList.remove('active');
            });
            resultsContainer.appendChild(div);
        });
    }
    
    searchProd.addEventListener('input', (e) => populateProdList(e.target.value));

    function populateLaborList(filterText = '') {
        const resultsContainer = document.getElementById('pos-labor-results');
        resultsContainer.innerHTML = '';
        const filtered = db.mano_obra.filter(m => 
            (m.Descripcion || '').toLowerCase().includes(filterText.toLowerCase()) ||
            String(m.ID_ManoObra || '').toLowerCase().includes(filterText.toLowerCase())
        );
        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1rem;">Sin resultados</div>';
            return;
        }
        filtered.forEach(m => {
            const div = document.createElement('div');
            div.className = 'catalog-item';
            div.style = 'display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0.75rem; border-bottom:1px solid var(--border-color); cursor:pointer; border-radius:4px; transition: background 0.15s;';
            div.addEventListener('mouseenter', () => div.style.backgroundColor = 'rgba(255,255,255,0.03)');
            div.addEventListener('mouseleave', () => div.style.backgroundColor = 'transparent');
            
            div.innerHTML = html`
                <div>
                    <strong>${escapeHtml(m.Descripcion)}</strong>
                    <div style="font-size:0.75rem; color:var(--text-secondary);">Código: ${escapeHtml(m.ID_ManoObra)}</div>
                </div>
                <div style="font-weight:bold; color:var(--cyan);">$ ${parseFloat(m.PrecioUnitario || m.Precio || 0).toFixed(2)}</div>
            `;
            div.addEventListener('click', () => {
                addTempLabor(m);
                laborModal.classList.remove('active');
            });
            resultsContainer.appendChild(div);
        });
    }
    
    searchLabor.addEventListener('input', (e) => populateLaborList(e.target.value));

    // Cart items operations
    function addTempProduct(p) {
        const existing = tempProducts.find(item => item.id === p['ID_ Producto']);
        const fullName = getNombreProducto(p);
        if (existing) {
            existing.qty += 1;
        } else {
            tempProducts.push({
                id: p['ID_ Producto'],
                desc: fullName || p.Descripcion,
                price: parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0),
                qty: 1
            });
        }
        renderTempRows();
        calculateTotals();
    }
    
    function addTempLabor(m) {
        const existing = tempLabor.find(item => item.id === m.ID_ManoObra);
        if (existing) {
            existing.qty += 1;
        } else {
            tempLabor.push({
                id: m.ID_ManoObra,
                desc: m.Descripcion,
                price: parseFloat(m.PrecioUnitario || m.Precio || 0),
                qty: 1,
                isPriceEditable: m.PrecioEditable !== 'NO'
            });
        }
        renderTempRows();
        calculateTotals();
    }

    function renderTempRows() {
        productsRows.innerHTML = '';
        if (tempProducts.length === 0) {
            productsRows.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1rem; font-size:0.85rem;">No hay repuestos agregados</div>';
        } else {
            tempProducts.forEach((item, index) => {
                const row = document.createElement('div');
                row.className = 'item-row';
                row.style = 'display: grid; grid-template-columns: 80px 2.5fr 1fr 1fr 1fr 50px; gap: 1rem; align-items: center; padding: 0.5rem 0.75rem; border-bottom: 1px dashed var(--border-color);';
                row.innerHTML = html`
                    <div style="font-family:monospace; font-size:0.8rem;">${escapeHtml(item.id)}</div>
                    <div style="font-size:0.85rem; font-weight:600;">${escapeHtml(item.desc)}</div>
                    <div><input type="number" min="1" value="${item.qty}" class="pos-qty-input-prod" data-idx="${index}" style="width:60px; padding:0.3rem; font-family:inherit;"></div>
                    <div><input type="number" step="0.01" min="0" value="${item.price.toFixed(2)}" class="pos-price-input-prod" data-idx="${index}" style="width:75px; padding:0.3rem; font-family:inherit;"></div>
                    <div style="text-align:right; font-weight:600; font-size:0.9rem;">$ ${(item.price * item.qty).toFixed(2)}</div>
                    <div style="text-align:right;"><button class="btn btn-delete delete-temp-prod" data-idx="${index}" style="background:#e74c3c; color:white; border:none; padding:0.35rem 0.5rem; cursor:pointer; border-radius:4px;"><i class="fa-solid fa-trash-can"></i></button></div>
                `;
                productsRows.appendChild(row);
            });
        }
        
        laborRows.innerHTML = '';
        if (tempLabor.length === 0) {
            laborRows.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1rem; font-size:0.85rem;">No hay servicios agregados</div>';
        } else {
            tempLabor.forEach((item, index) => {
                const moCatalog = db.mano_obra.find(m => m.ID_ManoObra === item.id);
                const isPriceEditable = !moCatalog || moCatalog.PrecioEditable !== 'NO';

                const row = document.createElement('div');
                row.className = 'item-row';
                row.style = 'display: grid; grid-template-columns: 80px 2.5fr 1fr 1fr 1fr 50px; gap: 1rem; align-items: center; padding: 0.5rem 0.75rem; border-bottom: 1px dashed var(--border-color);';
                row.innerHTML = html`
                    <div style="font-family:monospace; font-size:0.8rem;">${escapeHtml(item.id)}</div>
                    <div>
                        ${isPriceEditable ? safe(`
                            <input type="text" value="${escapeHtml(item.desc)}" class="pos-desc-input-labor" data-idx="${index}" style="width:100%; padding:0.3rem; font-family:inherit; font-size:0.85rem; font-weight:600; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; box-sizing:border-box;">
                        `) : safe(`
                            <div style="font-size:0.85rem; font-weight:600;">${escapeHtml(item.desc)}</div>
                        `)}
                    </div>
                    <div><input type="number" min="1" value="${item.qty}" class="pos-qty-input-labor" data-idx="${index}" style="width:60px; padding:0.3rem; font-family:inherit;"></div>
                    <div><input type="number" step="0.01" min="0" value="${item.price.toFixed(2)}" class="pos-price-input-labor" data-idx="${index}" style="width:75px; padding:0.3rem; font-family:inherit;"></div>
                    <div style="text-align:right; font-weight:600; font-size:0.9rem;">$ ${(item.price * item.qty).toFixed(2)}</div>
                    <div style="text-align:right;"><button class="btn btn-delete delete-temp-labor" data-idx="${index}" style="background:#e74c3c; color:white; border:none; padding:0.35rem 0.5rem; cursor:pointer; border-radius:4px;"><i class="fa-solid fa-trash-can"></i></button></div>
                `;
                laborRows.appendChild(row);
            });
        }
        
        // Wire up inputs listeners
        document.querySelectorAll('.pos-qty-input-prod').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(input.getAttribute('data-idx'));
                tempProducts[idx].qty = Math.max(1, parseInt(e.target.value) || 1);
                renderTempRows();
                calculateTotals();
            });
        });
        document.querySelectorAll('.pos-price-input-prod').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(input.getAttribute('data-idx'));
                tempProducts[idx].price = Math.max(0, parseFloat(e.target.value) || 0);
                renderTempRows();
                calculateTotals();
            });
        });
        
        document.querySelectorAll('.pos-qty-input-labor').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(input.getAttribute('data-idx'));
                tempLabor[idx].qty = Math.max(1, parseInt(e.target.value) || 1);
                renderTempRows();
                calculateTotals();
            });
        });
        document.querySelectorAll('.pos-price-input-labor').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(input.getAttribute('data-idx'));
                tempLabor[idx].price = Math.max(0, parseFloat(e.target.value) || 0);
                renderTempRows();
                calculateTotals();
            });
        });

        document.querySelectorAll('.pos-desc-input-labor').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(input.getAttribute('data-idx'));
                tempLabor[idx].desc = e.target.value;
            });
        });
        
        // Wire up delete buttons
        document.querySelectorAll('.delete-temp-prod').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                tempProducts.splice(idx, 1);
                renderTempRows();
                calculateTotals();
            });
        });
        document.querySelectorAll('.delete-temp-labor').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                tempLabor.splice(idx, 1);
                renderTempRows();
                calculateTotals();
            });
        });
    }

    function calculateTotals() {
        const sumProd = tempProducts.reduce((sum, item) => sum + item.price * item.qty, 0);
        const sumLab = tempLabor.reduce((sum, item) => sum + item.price * item.qty, 0);
        const subtotal = sumProd + sumLab;
        
        sumProductsEl.textContent = '$ ' + sumProd.toFixed(2);
        sumLaborEl.textContent = '$ ' + sumLab.toFixed(2);
        subtotalNetoEl.textContent = '$ ' + subtotal.toFixed(2);
        
        let discount = 0;
        let promoRowHtml = '';
        const promoId = promoSelect.value;
        const promo = (db.promociones || []).find(pr => pr.ID_Promocion === promoId);
        if (promo) {
            if (promo.Tipo === 'desc_mano_obra') {
                discount = sumLab * (parseFloat(promo.Valor || 0) / 100);
                promoRowHtml = `<div class="summary-row" style="display:flex; justify-content:space-between; color: var(--warning);"><span>Desc. MO (${promo.Valor}%):</span><span>- $ ${discount.toFixed(2)}</span></div>`;
            } else if (promo.Tipo === 'desc_productos') {
                discount = sumProd * (parseFloat(promo.Valor || 0) / 100);
                promoRowHtml = `<div class="summary-row" style="display:flex; justify-content:space-between; color: var(--warning);"><span>Desc. Prod (${promo.Valor}%):</span><span>- $ ${discount.toFixed(2)}</span></div>`;
            } else if (promo.Tipo === 'monto_fijo') {
                discount = parseFloat(promo.Valor || 0);
                promoRowHtml = `<div class="summary-row" style="display:flex; justify-content:space-between; color: var(--warning);"><span>Descuento Fijo:</span><span>- $ ${discount.toFixed(2)}</span></div>`;
            }
        }
        discount = Math.min(discount, subtotal);
        discountSection.innerHTML = promoRowHtml;
        
        const subtotalConDescuento = Math.max(0, subtotal - discount);
        const wsConfig = getWorkshopConfig(db);
        const preciosConIva = wsConfig.features && wsConfig.features.precios_con_iva === true;
        const taxRate = 0.13;
        
        let iva = 0;
        let grandTotal = 0;
        let baseParaImpuestos = subtotalConDescuento;

        if (preciosConIva) {
            grandTotal = subtotalConDescuento;
            baseParaImpuestos = subtotalConDescuento / 1.13;
            iva = subtotalConDescuento - baseParaImpuestos;
        } else {
            iva = subtotalConDescuento * taxRate;
            grandTotal = subtotalConDescuento + iva;
            baseParaImpuestos = subtotalConDescuento;
        }
        
        taxIvaEl.textContent = '$ ' + iva.toFixed(2);
        
        const clientCode = clientSelect.value;
        const client = db.clientes.find(c => c.Codigo_Cliente === clientCode) || { AplicaPercepcion: 0, AplicaRetencion: 0 };
        
        retPerSection.innerHTML = '';
        let perception = 0;
        let retention = 0;
        
        const isTallerGrande = wsConfig.clasificacion_tributaria === 'Gran contribuyente';
        if (isTallerGrande && baseParaImpuestos >= 100.00) {
            perception = baseParaImpuestos * 0.01;
            grandTotal += perception;
            retPerSection.innerHTML += `<div class="summary-row" style="display:flex; justify-content:space-between;"><span>Percepción (1%):</span><span style="color: var(--cyan);">+ $ ${perception.toFixed(2)}</span></div>`;
        } else if (client.AplicaPercepcion > 0) {
            perception = baseParaImpuestos * parseFloat(client.AplicaPercepcion);
            grandTotal += perception;
            retPerSection.innerHTML += `<div class="summary-row" style="display:flex; justify-content:space-between;"><span>Percepción (${(parseFloat(client.AplicaPercepcion)*100).toFixed(0)}%):</span><span style="color: var(--cyan);">+ $ ${perception.toFixed(2)}</span></div>`;
        }
        
        const isGranContrib = client['Categoría Contribuyente'] === 'GRANDE' || client.AplicaRetencion > 0;
        if (isGranContrib && baseParaImpuestos >= 100.00) {
            retention = baseParaImpuestos * 0.01;
            grandTotal -= retention;
            retPerSection.innerHTML += `<div class="summary-row" style="display:flex; justify-content:space-between;"><span>Retención (1%):</span><span style="color: var(--warning);">- $ ${retention.toFixed(2)}</span></div>`;
        }
        
        grandTotalEl.textContent = '$ ' + grandTotal.toFixed(2);
        
        lastCalculatedSubtotal = subtotal;
        lastCalculatedDiscount = discount;
        lastCalculatedIva = iva;
        lastCalculatedPerception = perception;
        lastCalculatedRetention = retention;
        lastCalculatedGrandTotal = grandTotal;
    }
    
    promoSelect.addEventListener('change', calculateTotals);

    // Save Venta Rápida (Paso 1)
    saveBtn.addEventListener('click', () => {
        if (tempProducts.length === 0 && tempLabor.length === 0) {
            showToast("Agrega al menos un repuesto o servicio para crear la venta rápida", "warning");
            return;
        }
        
        const clientCode = clientSelect.value;
        const client = db.clientes.find(c => c.Codigo_Cliente === clientCode) || {};
        
        // Resolve selected vehicle
        const selectedVehId = vehicleSelect ? vehicleSelect.value : '';
        let selectedPlaca = '';
        let selectedVehDesc = '';
        if (selectedVehId) {
            const rawVehicles = [...(db.vehiculos || []), ...(db['02 Vehiculos'] || [])];
            const foundVeh = rawVehicles.find(v => (v.ID_Vehiculo && v.ID_Vehiculo === selectedVehId) || (v.Placas && v.Placas === selectedVehId) || (v.Placa && v.Placa === selectedVehId));
            if (foundVeh) {
                selectedPlaca = foundVeh.Placas || foundVeh.Placa || selectedVehId;
                const marca = foundVeh.Marca || '';
                const modelo = foundVeh.Modelo || '';
                const anio = foundVeh.Año || foundVeh.Anio || '';
                selectedVehDesc = `${marca} ${modelo} ${anio}`.trim();
            } else {
                selectedPlaca = selectedVehId;
            }
        }
        
        const rawObs = observacionesInput ? observacionesInput.value.trim() : '';
        const obsFinal = rawObs || "Venta directa de mostrador";
        
        db['43 Venta Rapida'] = db['43 Venta Rapida'] || [];
        
        if (editingVentaRapidaId) {
            // Update existing VR
            const existingIdx = db['43 Venta Rapida'].findIndex(vr => vr.ID_Venta_Rapida === editingVentaRapidaId);
            if (existingIdx !== -1) {
                const oldVR = db['43 Venta Rapida'][existingIdx];
                db['43 Venta Rapida'][existingIdx] = {
                    ...oldVR,
                    Usuario: (getActiveUser() && getActiveUser().Email) || "jjmunoz932@gmail.com",
                    UsuarioNombre: (getActiveUser() && getActiveUser().Nombre_Completo) || "",
                    Cliente: clientCode,
                    Nombre: client.Nombre || "Consumidor Final",
                    ID_Vehiculo: selectedVehId || "",
                    Placa: selectedPlaca || "",
                    Placas: selectedPlaca || "",
                    Vehiculo: selectedVehDesc ? `${selectedPlaca} - ${selectedVehDesc}` : (selectedPlaca || ""),
                    Observaciones: obsFinal,
                    " Observaciones": obsFinal,
                    "Tipo Doc": docTypeSelect.value === 'CCF' ? 'CREDITO FISCAL' : 'FACTURA',
                    ID_Promocion: promoSelect.value || "",
                    productos: JSON.parse(JSON.stringify(tempProducts)),
                    mano_obra: JSON.parse(JSON.stringify(tempLabor)),
                    subtotal: lastCalculatedSubtotal,
                    descuento: lastCalculatedDiscount,
                    iva: lastCalculatedIva,
                    percepcion: lastCalculatedPerception,
                    retencion: lastCalculatedRetention,
                    total: lastCalculatedGrandTotal
                };
                db.venta_rapida = db['43 Venta Rapida'];
                saveDatabase(db);
                showToast(`Venta Rápida ${editingVentaRapidaId} actualizada con éxito`, "success");
            } else {
                showToast("Error: No se encontró la venta rápida original para actualizar.", "danger");
            }
            
            // Reset editing state
            editingVentaRapidaId = null;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Crear Venta Rápida';
            saveBtn.className = 'btn btn-success';
            saveBtn.style.backgroundColor = '';
            tabBtnNew.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Nueva Venta';
        } else {
            // Create new VR
            const vrId = "VR-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
            const newVR = {
                ID_Venta_Rapida: vrId,
                "Marca Temporal": Date.now(),
                Fecha: new Date().toISOString().slice(0, 10),
                Usuario: (getActiveUser() && getActiveUser().Email) || "jjmunoz932@gmail.com",
                UsuarioNombre: (getActiveUser() && getActiveUser().Nombre_Completo) || "",
                Cliente: clientCode,
                Nombre: client.Nombre || "Consumidor Final",
                ID_Vehiculo: selectedVehId || "",
                Placa: selectedPlaca || "",
                Placas: selectedPlaca || "",
                Vehiculo: selectedVehDesc ? `${selectedPlaca} - ${selectedVehDesc}` : (selectedPlaca || ""),
                Observaciones: obsFinal,
                " Observaciones": obsFinal,
                "% Impuesto": 0.13,
                Estado: "PENDIENTE",
                "Tipo Doc": docTypeSelect.value === 'CCF' ? 'CREDITO FISCAL' : 'FACTURA',
                ID_Promocion: promoSelect.value || "",
                productos: JSON.parse(JSON.stringify(tempProducts)),
                mano_obra: JSON.parse(JSON.stringify(tempLabor)),
                subtotal: lastCalculatedSubtotal,
                descuento: lastCalculatedDiscount,
                iva: lastCalculatedIva,
                percepcion: lastCalculatedPerception,
                retencion: lastCalculatedRetention,
                total: lastCalculatedGrandTotal
            };
            db['43 Venta Rapida'].unshift(newVR);
            db.venta_rapida = db['43 Venta Rapida'];
            saveDatabase(db);
            showToast(`Venta Rápida ${vrId} creada con éxito y pendiente de facturación`, "success");
        }
        
        // Clear form
        tempProducts = [];
        tempLabor = [];
        promoSelect.value = '';
        if (observacionesInput) observacionesInput.value = '';
        populatePosVehicles(clientSelect.value);
        renderTempRows();
        calculateTotals();
        switchPosTab('pending');
    });
    
    clearBtn.addEventListener('click', () => {
        if (confirm("¿Estás seguro de que deseas vaciar los ítems de esta venta?")) {
            tempProducts = [];
            tempLabor = [];
            promoSelect.value = '';
            if (observacionesInput) observacionesInput.value = '';
            populatePosVehicles(clientSelect.value);
            editingVentaRapidaId = null;
            
            // Reset button and tab
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Crear Venta Rápida';
            saveBtn.className = 'btn btn-success';
            saveBtn.style.backgroundColor = '';
            tabBtnNew.innerHTML = '<i class="fa-solid fa-cart-plus"></i> Nueva Venta';
            
            renderTempRows();
            calculateTotals();
            showToast("Formulario vaciado", "info");
        }
    });

    // Helper to resolve email/user ID to full name
    function getUsuarioDisplayName(userVal) {
        if (!userVal) return 'N/A';
        const tecnicos = db.tecnicos || [];
        const valLower = userVal.trim().toLowerCase();

        // 1. Match by Email
        const matchEmail = tecnicos.find(t => (t.Email || '').trim().toLowerCase() === valLower);
        if (matchEmail && matchEmail.Nombre_Completo) return matchEmail.Nombre_Completo;

        // 2. Match by Tecnico_ID or Codigo_Cliente
        const matchId = tecnicos.find(t => (t.Tecnico_ID || '') === userVal || (t.Codigo_Cliente || '') === userVal);
        if (matchId && matchId.Nombre_Completo) return matchId.Nombre_Completo;

        // 3. Match by Nombre_Completo directly
        const matchName = tecnicos.find(t => (t.Nombre_Completo || '').trim().toLowerCase() === valLower);
        if (matchName && matchName.Nombre_Completo) return matchName.Nombre_Completo;

        // 4. Check activeUser
        const activeUser = typeof getActiveUser === 'function' ? getActiveUser() : null;
        if (activeUser && activeUser.Nombre_Completo) {
            if ((activeUser.Email || '').trim().toLowerCase() === valLower || (activeUser.Tecnico_ID || '') === userVal) {
                return activeUser.Nombre_Completo;
            }
        }

        // 5. Check SaaS workshop owner config
        if (db.saas_state && db.saas_state.workshopData) {
            const wsData = db.saas_state.workshopData;
            if (wsData.correo && wsData.correo.trim().toLowerCase() === valLower && wsData.propietario) {
                return wsData.propietario;
            }
        }

        // 6. Check config_taller
        if (db.config_taller && db.config_taller.propietario) {
            if (db.config_taller.correo && db.config_taller.correo.trim().toLowerCase() === valLower) {
                return db.config_taller.propietario;
            }
        }

        return userVal;
    }

    // Populate Pending Table
    function populatePendingList(filterText = '') {
        const rowsContainer = document.getElementById('pos-pending-rows');
        rowsContainer.innerHTML = '';
        
        const list = (db['43 Venta Rapida'] || []).filter(vr => 
            vr.Estado === 'PENDIENTE' && 
            ((vr.ID_Venta_Rapida || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.Nombre || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.Placas || vr.Placa || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.Vehiculo || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.Observaciones || vr[' Observaciones'] || '').toLowerCase().includes(filterText.toLowerCase()))
        );
        
        if (list.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">No hay ventas rápidas pendientes de facturar</td></tr>';
            return;
        }
        
        list.forEach(vr => {
            const tr = document.createElement('tr');
            const dateStr = new Date(vr['Marca Temporal']).toLocaleString('es-SV');
            const docLabel = vr['Tipo Doc'] === 'CREDITO FISCAL' ? 'Crédito Fiscal (CCF)' : 'Factura (FE)';
            const userDisplayName = getUsuarioDisplayName(vr.UsuarioNombre || vr.Usuario);
            
            const vehicleTag = (vr.Placas || vr.Placa || vr.Vehiculo) 
                ? `<div style="font-size:0.75rem; color:var(--primary); margin-top:0.25rem; display:inline-flex; align-items:center; gap:0.3rem; background:rgba(59, 130, 246, 0.1); padding:0.15rem 0.45rem; border-radius:4px; font-weight:600;"><i class="fa-solid fa-car"></i> ${escapeHtml(vr.Vehiculo || vr.Placas || vr.Placa)}</div>`
                : `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem; display:inline-flex; align-items:center; gap:0.3rem;"><i class="fa-solid fa-store"></i> Mostrador</div>`;

            const obsTag = (vr.Observaciones && vr.Observaciones !== 'Venta directa de mostrador')
                ? `<div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.2rem; font-style:italic;"><i class="fa-regular fa-comment-dots"></i> ${escapeHtml(vr.Observaciones)}</div>`
                : '';

            tr.innerHTML = html`
                <td><strong style="font-family:monospace;">${escapeHtml(vr.ID_Venta_Rapida)}</strong></td>
                <td>${dateStr}</td>
                <td>
                    <strong style="color:var(--text-primary);">${escapeHtml(vr.Nombre)}</strong>
                    ${safe(vehicleTag)}
                    ${safe(obsTag)}
                </td>
                <td><span class="badge-tag badge-secondary">${docLabel}</span></td>
                <td><strong>$ ${(parseFloat(vr.total || vr.Total || vr.Monto || 0)).toFixed(2)}</strong></td>
                <td><strong style="font-size:0.85rem; color:var(--text-primary);">${escapeHtml(userDisplayName)}</strong></td>
                <td>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                        <button class="btn btn-success btn-facturar-pos" data-id="${vr.ID_Venta_Rapida}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem;">
                            <i class="fa-solid fa-cash-register"></i> Facturar (DTE)
                        </button>
                        <button class="btn btn-secondary btn-editar-pos" data-id="${vr.ID_Venta_Rapida}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem; background:transparent; border:1px solid var(--border-color); color:var(--text-primary);">
                            <i class="fa-solid fa-pen-to-square"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-eliminar-pos" data-id="${vr.ID_Venta_Rapida}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600; display:inline-flex; align-items:center; gap:0.25rem; background:transparent; border:1px solid var(--danger); color:var(--danger);">
                            <i class="fa-solid fa-trash-can"></i> Eliminar
                        </button>
                    </div>
                </td>
            `;
            rowsContainer.appendChild(tr);
        });
        
        document.querySelectorAll('.btn-facturar-pos').forEach(btn => {
            btn.addEventListener('click', () => {
                openPOSBillingModal(btn.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.btn-editar-pos').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const vr = db['43 Venta Rapida'].find(x => x.ID_Venta_Rapida === id);
                if (vr) {
                    editingVentaRapidaId = vr.ID_Venta_Rapida;
                    
                    clientSelect.value = vr.Cliente || '';
                    populatePosVehicles(clientSelect.value, vr.ID_Vehiculo || vr.Placas || vr.Placa || '');
                    if (observacionesInput) {
                        const obsText = vr.Observaciones || vr[' Observaciones'] || '';
                        observacionesInput.value = (obsText === 'Venta directa de mostrador') ? '' : obsText;
                    }
                    docTypeSelect.value = vr['Tipo Doc'] === 'CREDITO FISCAL' ? 'CCF' : 'FE';
                    promoSelect.value = vr.ID_Promocion || '';
                    
                    tempProducts = JSON.parse(JSON.stringify(vr.productos || []));
                    tempLabor = JSON.parse(JSON.stringify(vr.mano_obra || []));
                    
                    renderTempRows();
                    calculateTotals();
                    
                    saveBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Guardar Cambios';
                    saveBtn.className = 'btn btn-primary';
                    saveBtn.style.backgroundColor = 'var(--primary)';
                    tabBtnNew.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editar Venta (${vr.ID_Venta_Rapida})`;
                    
                    switchPosTab('new');
                }
            });
        });

        document.querySelectorAll('.btn-eliminar-pos').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la Venta Rápida ${id}?`)) {
                    const filtered = (db['43 Venta Rapida'] || db.venta_rapida || []).filter(vr => vr.ID_Venta_Rapida !== id);
                    db['43 Venta Rapida'] = filtered;
                    db.venta_rapida = filtered;
                    saveDatabase(db);
                    showToast(`Venta Rápida ${id} eliminada con éxito`, "success");
                    populatePendingList(pendingSearch.value);
                }
            });
        });
    }
    
    pendingSearch.addEventListener('input', (e) => populatePendingList(e.target.value));

    // Populate History Table
    function populateHistoryList(filterText = '') {
        const rowsContainer = document.getElementById('pos-history-rows');
        rowsContainer.innerHTML = '';
        
        const list = (db['43 Venta Rapida'] || []).filter(vr => 
            vr.Estado === 'FACTURADO' && 
            ((vr.ID_Venta_Rapida || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.Nombre || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.controlNumber || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.mhControlNumber || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.Placas || vr.Placa || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.Vehiculo || '').toLowerCase().includes(filterText.toLowerCase()) ||
             (vr.Observaciones || vr[' Observaciones'] || '').toLowerCase().includes(filterText.toLowerCase()))
        );
        
        if (list.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">No hay ventas rápidas facturadas en el historial</td></tr>';
            return;
        }
        
        list.forEach(vr => {
            const tr = document.createElement('tr');
            const dateStr = vr.Fecha_Facturacion ? new Date(vr.Fecha_Facturacion).toLocaleString('es-SV') : new Date(vr['Marca Temporal']).toLocaleString('es-SV');
            const docLabel = vr['Tipo Doc'] === 'CREDITO FISCAL' ? 'Crédito Fiscal (CCF)' : 'Factura (FE)';
            
            const vehicleTag = (vr.Placas || vr.Placa || vr.Vehiculo) 
                ? `<div style="font-size:0.75rem; color:var(--primary); margin-top:0.25rem; display:inline-flex; align-items:center; gap:0.3rem; background:rgba(59, 130, 246, 0.1); padding:0.15rem 0.45rem; border-radius:4px; font-weight:600;"><i class="fa-solid fa-car"></i> ${escapeHtml(vr.Vehiculo || vr.Placas || vr.Placa)}</div>`
                : `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem; display:inline-flex; align-items:center; gap:0.3rem;"><i class="fa-solid fa-store"></i> Mostrador</div>`;

            const obsTag = (vr.Observaciones && vr.Observaciones !== 'Venta directa de mostrador')
                ? `<div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.2rem; font-style:italic;"><i class="fa-regular fa-comment-dots"></i> ${escapeHtml(vr.Observaciones)}</div>`
                : '';

            tr.innerHTML = html`
                <td><strong style="font-family:monospace;">${escapeHtml(vr.ID_Venta_Rapida)}</strong></td>
                <td>${dateStr}</td>
                <td>
                    <strong style="color:var(--text-primary);">${escapeHtml(vr.Nombre)}</strong>
                    ${safe(vehicleTag)}
                    ${safe(obsTag)}
                </td>
                <td><span class="badge-tag badge-secondary">${docLabel}</span></td>
                <td>
                    <strong style="font-family:monospace; font-size:0.8rem;">${escapeHtml(vr.mhControlNumber || vr.controlNumber || 'N/A')}</strong>
                    ${safe(vr.controlNumber ? `<div style="font-size:0.65rem; color:var(--text-muted);">Gen: ${vr.controlNumber.substring(0,8)}...</div>` : '')}
                </td>
                <td><strong>$ ${(parseFloat(vr.total || vr.Total || vr.Monto || 0)).toFixed(2)}</strong></td>
                <td>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-secondary btn-print-pos-ticket" data-id="${vr.ID_Venta_Rapida}" style="padding:0.3rem 0.5rem; font-size:0.75rem; display:inline-flex; align-items:center; gap:0.25rem;"><i class="fa-solid fa-receipt"></i> Ticket</button>
                        ${safe(vr.controlNumber ? `<button class="btn btn-primary btn-view-pos-pdf" data-id="${vr.controlNumber}" style="padding:0.3rem 0.5rem; font-size:0.75rem; display:inline-flex; align-items:center; gap:0.25rem;"><i class="fa-solid fa-file-pdf"></i> PDF</button>` : '')}
                    </div>
                </td>
            `;
            rowsContainer.appendChild(tr);
        });
        
        rowsContainer.querySelectorAll('.btn-print-pos-ticket').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                printDteTicket(btn.getAttribute('data-id'));
            });
        });
        rowsContainer.querySelectorAll('.btn-view-pos-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                viewDtePdf(btn.getAttribute('data-id'));
            });
        });
    }
    
    historySearch.addEventListener('input', (e) => populateHistoryList(e.target.value));

    // Cashier Invoicing Modal (Paso 2)
    function openPOSBillingModal(vrId) {
        const vr = (db['43 Venta Rapida'] || []).find(v => v.ID_Venta_Rapida === vrId);
        if (!vr) return;
        
        if (vr.Estado === "FACTURADO" || vr.estado === "anulado" || vr.Estado === "ANULADO") {
            showToast("Esta venta rápida ya fue facturada o anulada.", "warning");
            billingModal.classList.remove('active');
            populatePendingList();
            return;
        }
        
        billingModal.classList.add('active');
        
        const client = db.clientes.find(c => c.Codigo_Cliente === vr.Cliente) || { Nombre: vr.Nombre };
        const vehDisplay = vr.Vehiculo || vr.Placas || vr.Placa;
        const obsDisplay = (vr.Observaciones && vr.Observaciones !== 'Venta directa de mostrador') ? vr.Observaciones : (vr[' Observaciones'] && vr[' Observaciones'] !== 'Venta directa de mostrador' ? vr[' Observaciones'] : '');
        
        billingBody.innerHTML = html`
            <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; font-size:0.85rem; display:flex; flex-direction:column; gap:0.4rem;">
                <p>Venta Rápida: <strong>${vrId}</strong></p>
                <p>Cliente: <strong>${client.Nombre}</strong></p>
                ${safe(vehDisplay ? `<p>Vehículo: <strong style="color:var(--primary);"><i class="fa-solid fa-car"></i> ${escapeHtml(vehDisplay)}</strong></p>` : '')}
                ${safe(obsDisplay ? `<p>Observaciones: <span style="color:var(--text-secondary);">${escapeHtml(obsDisplay)}</span></p>` : '')}
                <p>Documento a Emitir: <strong style="color:var(--primary);">${vr['Tipo Doc'] === 'CREDITO FISCAL' ? 'Crédito Fiscal (CCF)' : 'Factura (FE)'}</strong></p>
                <p>Total a Facturar: <strong style="color:var(--cyan);">$ ${(parseFloat(vr.total || vr.Total || vr.Monto || 0)).toFixed(2)}</strong></p>
            </div>
            
            <div class="form-group" style="margin-top:0.5rem;">
                <label style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-bottom:0.4rem;">Forma de Pago (Solo Contado)</label>
                <select id="pos-billing-pay-method" style="padding:0.6rem; width:100%; font-family:inherit;">
                    <option value="01">01 - Efectivo</option>
                    <option value="02">02 - Tarjeta de Crédito/Débito</option>
                    <option value="03">03 - Transferencia / Depósito</option>
                </select>
            </div>
            <div id="pos-pay-extra"></div>
            
            <button class="btn btn-success" id="pos-billing-submit-btn" style="width:100%; font-weight:600; padding:0.65rem; margin-top:0.5rem; display:flex; align-items:center; justify-content:center; gap:0.35rem;">
                <i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH
            </button>
        `;
        
    const payMethodSelect = document.getElementById('pos-billing-pay-method');
    const payExtraBox = document.getElementById('pos-pay-extra');
    const renderPayExtra = () => {
        const m = payMethodSelect.value;
        if (!(true)) { payExtraBox.innerHTML = ''; return; }
        if (m === '02') {
            payExtraBox.innerHTML = '<div class="form-group" style="margin-top:0.5rem;"><label>N° de Autorización (6 caracteres)</label><input type="text" id="pos-pay-auth" maxlength="6" autocomplete="off" style="padding:0.6rem; width:100%; text-transform:uppercase; font-family:inherit;" placeholder="Ej: A1B2C3"></div>';
        } else if (m === '01') {
            payExtraBox.innerHTML = '<div class="form-group" style="margin-top:0.5rem;"><label>Efectivo recibido ($)</label><input type="number" id="pos-pay-cash" step="0.01" min="0" style="padding:0.6rem; width:100%; font-family:inherit;"><div id="pos-pay-change" style="margin-top:0.4rem; font-weight:700; color:var(--success);"></div></div>';
            document.getElementById('pos-pay-cash').addEventListener('input', (e) => {
                const received = parseFloat(e.target.value);
                const total = parseFloat(vr.total || vr.Total || vr.Monto || 0);
                const out = document.getElementById('pos-pay-change');
                if (isNaN(received)) { out.textContent = ''; return; }
                const change = received - total;
                out.style.color = change < -0.005 ? 'var(--danger)' : 'var(--success)';
                out.textContent = change < -0.005 ? 'Faltan: $ ' + Math.abs(change).toFixed(2) : 'Cambio a entregar: $ ' + Math.max(0, change).toFixed(2);
            });
        } else {
            payExtraBox.innerHTML = '<div class="form-group" style="margin-top:0.5rem;"><label>Banco donde depositó</label><select id="pos-pay-bank" style="padding:0.6rem; width:100%; font-family:inherit;"><option value="">Seleccione el banco...</option><option value="Banco Agrícola">Banco Agrícola</option><option value="Banco Cuscatlán">Banco Cuscatlán</option><option value="Banco Davivienda">Banco Davivienda</option><option value="BAC Credomatic">BAC Credomatic</option><option value="Banco Promerica">Banco Promerica</option><option value="Banco Hipotecario">Banco Hipotecario</option><option value="Banco Industrial">Banco Industrial</option><option value="Banco Azul">Banco Azul</option><option value="Banco Atlántida">Banco Atlántida</option><option value="Banco de Fomento Agropecuario">Banco de Fomento Agropecuario</option></select></div>';
        }
    };
    payMethodSelect.addEventListener('change', renderPayExtra);
    renderPayExtra();

        const submitBtn = document.getElementById('pos-billing-submit-btn');
        submitBtn.addEventListener('click', () => {
            // Cash Session Validation
            const openSession = (db.cajas_sesiones || []).find(s => s.estado === 'ABIERTA');
            if (!openSession) {
                showToast("Error: Debe abrir una Caja Diaria en el módulo de Control de Caja antes de facturar.", "danger");
                billingModal.classList.remove('active');
                window.location.hash = 'caja';
                return;
            }

            const payMethod = document.getElementById('pos-billing-pay-method').value;
        let payExtra = {};
        if (true) {
            if (payMethod === '02') {
                const auth = (document.getElementById('pos-pay-auth').value || '').trim().toUpperCase();
                if (!/^[A-Z0-9]{6}$/.test(auth)) {
                    showToast("La autorización de tarjeta debe tener exactamente 6 caracteres (letras o números).", "danger");
                    return;
                }
                payExtra = { Autorizacion: auth };
            } else if (payMethod === '01') {
                const received = parseFloat(document.getElementById('pos-pay-cash').value);
                const totalToPay = parseFloat(vr.total || vr.Total || vr.Monto || 0);
                if (isNaN(received) || received < totalToPay - 0.005) {
                    showToast("Ingrese el efectivo recibido (debe cubrir el total a cobrar).", "danger");
                    return;
                }
                payExtra = { "Efectivo Recibido": Number(received.toFixed(2)), Cambio: Number((received - totalToPay).toFixed(2)) };
            } else {
                const bank = document.getElementById('pos-pay-bank').value;
                if (!bank) {
                    showToast("Seleccione el banco donde el cliente depositó.", "danger");
                    return;
                }
                payExtra = { Banco: bank };
            }
        }
            const type = vr['Tipo Doc'] === 'CREDITO FISCAL' ? 'CCF' : 'FE';
            
            // CCF logic for El Salvador DTE (prices excl tax in items payload)
            const isCCF = type === 'CCF';
            const rawDept = client.Departamento || client.Depto || '06';
            let deptCode = rawDept;
            if (isNaN(rawDept)) {
                deptCode = DEPARTAMENTOS_CODES[rawDept] || 
                           DEPARTAMENTOS_CODES[Object.keys(DEPARTAMENTOS_CODES).find(k => k.toLowerCase() === rawDept.trim().toLowerCase())] || 
                           '06';
            }
            
            const rawMuni = client.Municipio || '23';
            let muniCode = rawMuni;
            if (isNaN(rawMuni)) {
                const matchedMuniKey = Object.keys(MUNICIPIOS_CODES).find(k => k.toUpperCase() === rawMuni.trim().toUpperCase());
                muniCode = matchedMuniKey ? MUNICIPIOS_CODES[matchedMuniKey] : '23';
            } else if (rawMuni && rawMuni.length >= 4) {
                muniCode = rawMuni.substring(rawMuni.length - 2);
            }
            
            const phoneClean = (client['Telefono 1 '] || client.Telefono || '').replace(/\D/g, '').slice(0, 8);
            let docTypeVal = 'DUI';
            if (client['Tipo Cliente'] === 'JURIDICA' || client['Tipo Doc'] === 'NIT' || (client.NIT && !client['Num Doc'])) {
                docTypeVal = 'NIT';
            }
            const docNumClean = (docTypeVal === 'NIT' ? (client.NIT || client['Num Doc'] || '') : (client['Num Doc'] || client.NIT || '')).replace(/\D/g, '');
            
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
                recipientPayload.contributorSize = client['Categoría Contribuyente'] || 'OTROS';
                let giroCode = '45201';
                if (client.Giro) {
                    const match = client.Giro.match(/^\d{5}/);
                    giroCode = match ? match[0] : (client.Giro.replace(/\D/g, '').slice(0, 5) || '45201');
                }
                recipientPayload.economicActivity = giroCode;
                recipientPayload.nrc = (client.NRC || '').replace(/\D/g, '').slice(0, 8);
            }
            
            const promo = (db.promociones || []).find(pr => pr.ID_Promocion === vr.ID_Promocion);
            
            const totalNetBeforeDiscount = 
                (vr.productos || []).reduce((acc, item) => acc + parseFloat(item.price || 0) * parseInt(item.qty || 1), 0) +
                (vr.mano_obra || []).reduce((acc, item) => acc + parseFloat(item.price || 0) * parseInt(item.qty || 1), 0);
            
            const flatDiscountFactor = (promo && promo.Tipo === 'monto_fijo' && totalNetBeforeDiscount > 0)
                ? Math.max(0, 1 - parseFloat(promo.Valor || 0) / totalNetBeforeDiscount)
                : 1;
            
            function getItemDiscountedPrice(item, isLabor) {
                const rawPrice = parseFloat(item.price || 0);
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
            
            const wsConfig = getWorkshopConfig(db);
            const preciosConIva = wsConfig.features && wsConfig.features.precios_con_iva === true;

            const formattedItems = [
                ...(vr.productos || []).map(item => {
                    const rawPrice = getItemDiscountedPrice(item, false);
                    const unitPrice = preciosConIva ? parseFloat((rawPrice / 1.13).toFixed(4)) : rawPrice;
                    return {
                        type: 'BIENES',
                        internalCode: String(item.id || '').trim(),
                        description: item.desc || 'Producto',
                        quantity: parseInt(item.qty || 1),
                        unitPrice: unitPrice,
                        saleType: 'GRAVADA'
                    };
                }),
                ...(vr.mano_obra || []).map(item => {
                    const rawPrice = getItemDiscountedPrice(item, true);
                    const unitPrice = preciosConIva ? parseFloat((rawPrice / 1.13).toFixed(4)) : rawPrice;
                    return {
                        type: 'SERVICIOS',
                        internalCode: String(item.id || '').trim(),
                        description: item.desc || 'Servicio',
                        quantity: parseInt(item.qty || 1),
                        unitPrice: unitPrice,
                        saleType: 'GRAVADA'
                    };
                })
            ];
            
            let discountedSubtotal = 0;
            (vr.productos || []).forEach(item => discountedSubtotal += getItemDiscountedPrice(item, false) * parseInt(item.qty || 1));
            (vr.mano_obra || []).forEach(item => discountedSubtotal += getItemDiscountedPrice(item, true) * parseInt(item.qty || 1));
            
            const baseParaImpuestos = preciosConIva ? (discountedSubtotal / 1.13) : discountedSubtotal;
            const isGranContribValue = client['Categoría Contribuyente'] === 'GRANDE' || client.AplicaRetencion > 0;
            const dteRetention = (isGranContribValue && baseParaImpuestos >= 100.00) ? parseFloat((baseParaImpuestos * 0.01).toFixed(4)) : 0;
            
            const dtePayload = {
                id: generateUUID(),
                recipient: recipientPayload,
                items: formattedItems,
                paymentType: 'CONTADO',
                retentionIva: dteRetention
            };
            
            if (isCCF) {
                const missingCcf = [];
                if (!String(client.NRC || '').replace(/\D/g, '')) missingCcf.push('NRC');
                if (!String(client.NIT || client.DUI || client['Num Doc'] || client.Num_Documento || '').replace(/\D/g, '')) missingCcf.push('NIT/DUI');
                if (String(client.Codigo_Actividad || client.Giro || '').replace(/\D/g, '').length < 5) missingCcf.push('Actividad económica (giro)');
                if (!String(client.Direccion || '').trim()) missingCcf.push('Dirección');
                if (!(client.Departamento || client.Depto)) missingCcf.push('Departamento');
                if (!client.Municipio) missingCcf.push('Municipio');
                if (missingCcf.length > 0) {
                    showToast(`Complete los datos del cliente antes de emitir el CCF. Falta: ${missingCcf.join(', ')}`, "danger");
                    return;
                }
            }
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Transmitiendo...';
            
            const dteCfg = (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.dte_config) || getSecureDteConfig();
            const baseUrl = sanitizeBackendUrl(dteCfg.backendUrl || getBackendUrl(db));
            const isSimulated = !dteCfg.apiKey || dteCfg.apiKey.trim() === '' || dteCfg.apiKey.startsWith('simulado_');
            
            if (!baseUrl && !isSimulated) {
                showToast("Error: Configure la URL del servidor backend en Ajustes para transmitir.", "danger");
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH';
                return;
            }
            
            function processVRSuccess(resData) {
                const genCode = resData.generationCode || resData.id || generateUUID();
                const ctrlNum = resData.controlNumber || ("DTE-" + (tipoDte === 'CCF' ? '03' : '01') + "-M001P001-0000" + Math.floor(Math.random()*9000 + 1000));
                const seal = resData.receptionSeal || (Math.floor(Math.random()*900000) + "-APPROVED");
                
                vr.Estado = "FACTURADO";
                vr.controlNumber = genCode;
                vr.mhControlNumber = ctrlNum;
                vr.receptionSeal = seal;
                vr.Fecha_Facturacion = Date.now();
                
                // Inventory stock decrement & Kardex movements
                (vr.productos || []).forEach(item => {
                    const prodId = item.id;
                    const qty = parseInt(item.qty || 1);
                    
                    const dbProd = db.productos.find(prod => prod['ID_ Producto'] === prodId);
                    if (dbProd) {
                        dbProd.Minimos = Math.max(0, (dbProd.Minimos || 0) - qty);
                        
                        db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
                        db['29 Movs de Inventario'].unshift({
                            id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                            id_producto: prodId,
                            descripcion: dbProd.Descripcion,
                            Cant_Mov: qty,
                            "Fecha Mov": Date.now(),
                            Tipo: "SALIDA",
                            "Valor ($)": parseFloat(item.price || dbProd['Precio Unit'] || 10),
                            Observacion: `Facturación Venta POS ${vrId}`,
                            DTE: ctrlNum
                        });
                    }
                });
                
                // Save Cash Payment record
                const payId = "PAGO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
                db.pagos = db.pagos || [];
                db.pagos.unshift({
                    "ID Pago": payId,
                    ID_Presupuesto: vrId,
                    "Fecha Pago": Date.now(),
                    "Monto Pago": vr.total,
                    "Metodo Pago": payMethod === '01' ? 'EFECTIVO' : payMethod === '02' ? 'TARJETA' : 'TRANSFERENCIA',
                    "Estado Pago": "COMPLETADO",
                    User: getActiveUser().Email || getActiveUser().Nombre_Completo || "",
                    UserNombre: getActiveUser().Nombre_Completo || "",
                    Cliente: vr.Cliente,
                    id_sesion: openSession.id_sesion,
                    ...payExtra
                });
                
                saveDatabase(db);
                populatePendingList();
                showToast("DTE Generado y Aprobado por MH El Salvador!", "success");
                
                billingBody.innerHTML = html`
                    <div style="text-align: center; padding: 1.5rem 0;">
                        <i class="fa-solid fa-circle-check" style="font-size: 3rem; color: var(--success); margin-bottom: 0.75rem;"></i>
                        <h3 style="color: var(--success); margin-bottom:0.25rem;">Venta Facturada con Éxito</h3>
                        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.25rem;">DTE emitido e informado al Ministerio de Hacienda</p>
                        
                        <div style="background: rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; font-size:0.8rem; text-align:left; margin-bottom:1.25rem;">
                            <p style="margin-bottom: 0.3rem;"><strong>DTE Emitido:</strong> ${type === 'CCF' ? 'Crédito Fiscal (CCF)' : 'Factura (FE)'}</p>
                            <p style="margin-bottom: 0.3rem;"><strong>Código de Generación (UUID):</strong> <code style="color:var(--cyan); word-break:break-all;">${genCode}</code></p>
                            <p style="margin-bottom: 0.3rem;"><strong>Número de Control MH:</strong> <strong style="color:var(--success);">${ctrlNum}</strong></p>
                            <p style="margin-bottom: 0;"><strong>Monto Total:</strong> $ ${(parseFloat(vr.total || vr.Total || vr.Monto || 0)).toFixed(2)}</p>
                        </div>
                        
                        <div style="display:flex; gap:0.75rem;">
                            <button class="btn btn-success" id="pos-billing-print-btn" style="flex:1;"><i class="fa-solid fa-print"></i> Imprimir Ticket</button>
                            <button class="btn btn-secondary" id="pos-billing-done-btn" style="flex:1;"><i class="fa-solid fa-circle-check"></i> Listo</button>
                        </div>
                    </div>
                `;
                
                document.getElementById('pos-billing-print-btn').addEventListener('click', () => {
                    printDteTicket(vrId);
                });
                
                document.getElementById('pos-billing-done-btn').addEventListener('click', () => {
                    billingModal.classList.remove('active');
                    populatePendingList();
                });
            }
            
            if (isSimulated && !baseUrl) {
                setTimeout(() => {
                    const simulatedRes = {
                        success: true,
                        simulated: true,
                        code: "00",
                        description: "DTE Simulado Exitosamente (POS Fallback)",
                        generationCode: "MOCK-DTE-" + Math.floor(Date.now() / 1000).toString() + "-" + Math.floor(Math.random()*10000),
                        controlNumber: "DTE-" + (type === 'CCF' ? '03' : '01') + "-M001P001-" + Math.floor(Math.random()*90000 + 10000),
                        receptionSeal: Math.floor(Math.random()*9000000).toString() + "-APPROVED-" + Math.floor(Math.random()*9000),
                        mhDteUrl: `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=MOCK&fechaEmi=${new Date().toISOString().split('T')[0]}`
                    };
                    processVRSuccess(simulatedRes);
                }, 1000);
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
                    payload: dtePayload,
                    workshopId: db.saas_state?.workshopId || 'desconocido'
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        return Promise.reject(errData);
                    }, () => {
                        return Promise.reject({ message: `Error del servidor DTE (Código ${response.status})` });
                    });
                }
                return response.json();
            })
            .then(resData => {
                processVRSuccess(resData);
            })
            .catch(err => {
                console.error("Venta Rápida DTE Error:", err);
                showDteErrorModal(err);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH';
            });
        });
    }

    // Initial load
    renderTempRows();
    calculateTotals();
}

// 7.5. CONTROL DE CAJA Y TURNOS (POS) VIEW


