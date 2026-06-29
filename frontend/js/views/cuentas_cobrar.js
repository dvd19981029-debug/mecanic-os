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
} from '../../app.js?v=21';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport
} from '../utils.js?v=21';

let activeCuentasCobrarTab = 'cartera';

export function renderCuentasCobrar(container) {
    const db = getDatabase();
    
    // Calculate metric card values
    const creditClients = db.clientes.filter(c => c['Credito?'] === 'SI');
    let totalPortfolio = 0;
    let overlimitCount = 0;
    
    creditClients.forEach(c => {
        const balance = getClientPendingBalance(c.Codigo_Cliente, db);
        totalPortfolio += balance;
        const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
        if (balance > limit) {
            overlimitCount++;
        }
    });

    let selectedClientId = null;

    container.innerHTML = html`
        <div class="saas-tabs" style="display:flex; gap:0.5rem; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; overflow-x:auto;">
            <button class="saas-tab-btn ${activeCuentasCobrarTab === 'cartera' ? 'active' : ''}" data-tab="cartera" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-address-book"></i> Gestión de Cartera</button>
            <button class="saas-tab-btn ${activeCuentasCobrarTab === 'reporteria' ? 'active' : ''}" data-tab="reporteria" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-file-pdf"></i> Reportería y PDFs</button>
        </div>
        <div id="cxc-tab-content"></div>
    `;

    // Bind tabs switcher
    container.querySelectorAll('.saas-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCuentasCobrarTab = btn.getAttribute('data-tab');
            renderCuentasCobrar(container);
        });
    });

    const contentArea = document.getElementById('cxc-tab-content');

    if (activeCuentasCobrarTab === 'cartera') {
        renderCxCCarteraTab(contentArea);
    } else if (activeCuentasCobrarTab === 'reporteria') {
        renderCxCReporteriaTab(contentArea);
    }

    function renderCxCReporteriaTab(parent) {
        parent.innerHTML = html`
            <div class="glass-card" style="max-width: 600px; margin: 2rem auto; padding: 2rem; border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: rgba(255,255,255,0.01);">
                <h3 style="margin-bottom: 1.5rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                    <i class="fa-solid fa-chart-pie" style="color: var(--primary);"></i> Generación de Reportes Financieros
                </h3>
                
                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Seleccionar Tipo de Reporte</label>
                    <select id="rep-tipo" class="form-control" style="width: 100%; padding: 0.5rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                        <option value="general">1. Reporte General de Cartera (Saldos por Cliente)</option>
                        <option value="cliente">2. Estado de Cuenta de Cliente (Facturas y Abonos)</option>
                        <option value="mora">3. Reporte de Clientes con Límite de Crédito Excedido</option>
                    </select>
                </div>
                
                <!-- Client selector (hidden by default) -->
                <div class="form-group" id="rep-client-selector-group" style="margin-bottom: 1.5rem; display: none;">
                    <label style="font-weight: 600; display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Seleccionar Cliente</label>
                    <select id="rep-client-id" class="form-control" style="width: 100%; padding: 0.5rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px;">
                        ${safe(db.clientes.map(c => `<option value="${c.Codigo_Cliente}">${escapeHtml(c.Nombre)} (${c.Codigo_Cliente})</option>`).join(''))}
                    </select>
                </div>
                
                <div style="display:flex; gap:1rem; margin-top:1.5rem;">
                    <button class="btn btn-primary" id="btn-generate-report" style="flex:1; padding: 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <i class="fa-solid fa-file-pdf"></i> Generar PDF
                    </button>
                    <button class="btn btn-secondary" id="btn-generate-excel" style="flex:1; padding: 0.75rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border-color:#2ecc71; color:#2ecc71;">
                        <i class="fa-solid fa-file-excel"></i> Exportar Excel
                    </button>
                </div>
            </div>
        `;
        
        const repTipo = document.getElementById('rep-tipo');
        const clientGroup = document.getElementById('rep-client-selector-group');
        const genBtn = document.getElementById('btn-generate-report');
        const excelBtn = document.getElementById('btn-generate-excel');
        
        repTipo.addEventListener('change', () => {
            if (repTipo.value === 'cliente') {
                clientGroup.style.display = 'block';
            } else {
                clientGroup.style.display = 'none';
            }
        });
        
        genBtn.addEventListener('click', () => {
            const tipo = repTipo.value;
            const ws = getWorkshopConfig(db);
            
            if (tipo === 'general') {
                printGeneralPortfolioPDF(db, ws);
            } else if (tipo === 'mora') {
                printOverlimitPortfolioPDF(db, ws);
            } else if (tipo === 'cliente') {
                const clientId = document.getElementById('rep-client-id').value;
                if (!clientId) {
                    showToast("Por favor seleccione un cliente.", "danger");
                    return;
                }
                printClientStatementPDF(db, ws, clientId);
            }
        });

        excelBtn.addEventListener('click', () => {
            const tipo = repTipo.value;
            
            if (tipo === 'general') {
                const creditClients = db.clientes.filter(c => c['Credito?'] === 'SI' || getClientPendingBalance(c.Codigo_Cliente, db) > 0);
                const excelData = creditClients.map(c => {
                    const balance = getClientPendingBalance(c.Codigo_Cliente, db);
                    const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
                    const isExceeded = balance > limit;
                    return {
                        "Código Cliente": c.Codigo_Cliente,
                        "Nombre Cliente": c.Nombre,
                        "Límite de Crédito ($)": limit,
                        "Saldo Pendiente ($)": balance,
                        "Estado": isExceeded ? "EXCEDIDO" : "AL DÍA"
                    };
                });
                downloadExcelReport(`Reporte_General_Cartera_${Date.now()}.xlsx`, excelData);
            } else if (tipo === 'mora') {
                const creditClients = db.clientes.filter(c => {
                    const balance = getClientPendingBalance(c.Codigo_Cliente, db);
                    const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
                    return balance > limit;
                });
                const excelData = creditClients.map(c => {
                    const balance = getClientPendingBalance(c.Codigo_Cliente, db);
                    const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
                    const exceededAmount = balance - limit;
                    return {
                        "Código Cliente": c.Codigo_Cliente,
                        "Nombre Cliente": c.Nombre,
                        "Límite de Crédito ($)": limit,
                        "Saldo Pendiente ($)": balance,
                        "Monto Excedido ($)": exceededAmount
                    };
                });
                downloadExcelReport(`Reporte_Cartera_Excedida_${Date.now()}.xlsx`, excelData);
            } else if (tipo === 'cliente') {
                const clientId = document.getElementById('rep-client-id').value;
                if (!clientId) {
                    showToast("Por favor seleccione un cliente.", "danger");
                    return;
                }
                const client = db.clientes.find(c => c.Codigo_Cliente === clientId);
                if (!client) return;

                const creditBudgets = db.presupuestos.filter(p => 
                    p.Codigo_Cliente === clientId && 
                    p.Condicion === 'CREDITO' && 
                    (p.Estado == 3 || p.Estado == '3' || p.Estado == 4 || p.Estado == '4' || p.Anulado === true)
                );
                const charges = creditBudgets.map(p => ({
                    timestamp: p.Fecha ? new Date(p.Fecha).getTime() : Date.now(),
                    fecha: p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A',
                    ref: p['ID Presupuesto'],
                    tipo: 'Facturación Crédito',
                    cargo: getBudgetGrandTotal(p, db),
                    abono: 0,
                    dte: p.mhControlNumber || p.controlNumber || '',
                    isAnulado: p.Estado == 4 || p.Anulado === true
                }));

                const abonos = (db['30 Abonos Creditos'] || []).filter(ab => ab.Codigo_Cliente === clientId);
                const payments = abonos.map(ab => ({
                    timestamp: ab['Fecha Abono'] || Date.now(),
                    fecha: ab['Fecha Abono'] ? new Date(ab['Fecha Abono']).toLocaleDateString('es-SV') : 'N/A',
                    ref: ab.ID_Abono,
                    tipo: `Abono (${ab['Metodo Pago'] || 'EFECTIVO'})`,
                    cargo: 0,
                    abono: parseFloat(ab['Monto Abono'] || ab.Monto || 0),
                    dte: '',
                    isAnulado: false
                }));

                const ledger = [...charges, ...payments].sort((a, b) => a.timestamp - b.timestamp);

                let runningBalance = 0;
                const excelData = ledger.map(t => {
                    const isTransAnulada = t.isAnulado;
                    if (!isTransAnulada) {
                        runningBalance += t.cargo - t.abono;
                    }
                    return {
                        "Fecha": t.fecha,
                        "Referencia / N° Doc": t.ref,
                        "Tipo Transacción": t.tipo,
                        "N° DTE / Control": t.dte || "-",
                        "Cargo ($)": isTransAnulada ? 0 : (t.cargo || 0),
                        "Abono ($)": t.abono || 0,
                        "Saldo Acumulado ($)": runningBalance,
                        "Estado": isTransAnulada ? "ANULADO" : "ACTIVO"
                    };
                });
                const cleanName = client.Nombre.replace(/[^a-zA-Z0-9]/g, '_');
                downloadExcelReport(`Estado_Cuenta_${cleanName}_${Date.now()}.xlsx`, excelData);
            }
        });
    }

    function renderCxCCarteraTab(parent) {
        parent.innerHTML = html`
            <!-- KPI summary metrics -->
            <div class="dashboard-stats" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 1.5rem;">
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Cartera Activa Total</span>
                        <span class="stat-value" style="color: var(--cyan); font-weight: 700;">$ ${totalPortfolio.toFixed(2)}</span>
                    </div>
                    <div class="stat-icon" style="color: var(--cyan); background-color: rgba(0, 242, 254, 0.15);"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Clientes con Crédito</span>
                        <span class="stat-value" style="color: var(--primary);">${creditClients.length}</span>
                    </div>
                    <div class="stat-icon" style="color: var(--primary); background-color: var(--primary-glow);"><i class="fa-solid fa-users"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Clientes Excedidos</span>
                        <span class="stat-value" style="color: var(--danger);">${overlimitCount}</span>
                    </div>
                    <div class="stat-icon" style="color: var(--danger); background-color: var(--danger-glow);"><i class="fa-solid fa-circle-exclamation"></i></div>
                </div>
            </div>

            <div class="master-detail-container">
                <div class="glass-card list-panel">
                    <div class="search-bar-container" style="max-width: 100%; margin-bottom: 1rem;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="credit-client-search" placeholder="Buscar cliente por nombre o código...">
                    </div>
                    <div class="scrollable-list" id="credit-clients-list" style="max-height: 500px; overflow-y: auto;">
                        <!-- Loaded dynamically -->
                    </div>
                </div>
                
                <div class="glass-card detail-panel" id="credit-detail-panel" style="min-height: 450px;">
                    <div style="text-align: center; padding: 6rem 1rem; color: var(--text-secondary);">
                        <i class="fa-solid fa-address-book" style="font-size: 4rem; color: var(--border-color); margin-bottom: 1.5rem;"></i>
                        <h3>Selecciona un cliente de la lista</h3>
                        <p>Para ver el estado de su cuenta corriente, configurar límites de crédito y registrar abonos.</p>
                    </div>
                </div>
            </div>

            <!-- Abono Modal -->
            <div id="abono-modal" class="modal">
                <div class="modal-content glass-card" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Registrar Abono / Pago</h2>
                        <button class="close-modal-btn" id="close-abono-modal">&times;</button>
                    </div>
                    <form id="abono-form">
                        <input type="hidden" id="abono-client-id">
                        <input type="hidden" id="abono-pres-id">
                        <div class="form-group">
                            <label>Cliente</label>
                            <input type="text" id="abono-client-name" readonly style="background-color: var(--border-color);">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Saldo Actual</label>
                                <input type="text" id="abono-current-balance" readonly style="background-color: var(--border-color); color: var(--danger); font-weight:700;">
                            </div>
                            <div class="form-group">
                                <label>Monto a Abonar ($)</label>
                                <input type="number" id="abono-amount" required step="0.01" min="0.01">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Método de Pago</label>
                                <select id="abono-method">
                                    <option value="01">01 - Efectivo</option>
                                    <option value="02">02 - Tarjeta</option>
                                    <option value="03">03 - Transferencia Bancaria</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Nº Documento / Referencia</label>
                                <input type="text" id="abono-ref" placeholder="Ej. Transacción #">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notas del Cobro</label>
                            <input type="text" id="abono-notes" placeholder="Detalles extra...">
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                            <button type="button" class="btn btn-secondary" id="cancel-abono">Cancelar</button>
                            <button type="submit" class="btn btn-success">Guardar Abono</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Configurar Credito Modal -->
            <div id="config-credit-modal" class="modal">
                <div class="modal-content glass-card" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Configurar Línea de Crédito</h2>
                        <button class="close-modal-btn" id="close-config-credit-modal">&times;</button>
                    </div>
                    <form id="config-credit-form">
                        <input type="hidden" id="config-client-id">
                        <div class="form-group">
                            <label>Cliente</label>
                            <input type="text" id="config-client-name" readonly style="background-color: var(--border-color);">
                        </div>
                        <div class="form-group">
                            <label>¿Línea de Crédito Autorizada?</label>
                            <select id="config-credit-enabled">
                                <option value="SI">Sí (Permite Crédito)</option>
                                <option value="NO">No (Solo Contado)</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Monto de Crédito Autorizado ($)</label>
                                <input type="number" id="config-credit-limit" required min="0" step="50">
                            </div>
                            <div class="form-group">
                                <label>Plazo de Pago (Días)</label>
                                <input type="number" id="config-credit-days" required min="1">
                            </div>
                        </div>
                        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                            <button type="button" class="btn btn-secondary" id="cancel-config-credit">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Guardar Configuración</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        const listContainer = document.getElementById('credit-clients-list');
        const detailPanel = document.getElementById('credit-detail-panel');
        const searchInput = document.getElementById('credit-client-search');

        // Modals & Forms
        const abonoModal = document.getElementById('abono-modal');
        const abonoForm = document.getElementById('abono-form');
        const configModal = document.getElementById('config-credit-modal');
        const configForm = document.getElementById('config-credit-form');

        function populateClientsList(filter = '') {
            listContainer.innerHTML = '';
            const allDbClients = db.clientes;
            
            // Filter clients: show clients that either have credit enabled OR have a balance > 0
            const filtered = allDbClients.filter(c => {
                const hasCreditSetting = c['Credito?'] === 'SI';
                const balance = getClientPendingBalance(c.Codigo_Cliente, db);
                const matchesFilter = c.Nombre.toLowerCase().includes(filter.toLowerCase()) || c.Codigo_Cliente.toLowerCase().includes(filter.toLowerCase());
                return matchesFilter && (hasCreditSetting || balance > 0);
            });

            if (filtered.length === 0) {
                listContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding:1.5rem; text-align:center;">No se encontraron clientes de crédito.</div>';
                return;
            }

            filtered.forEach(c => {
                const balance = getClientPendingBalance(c.Codigo_Cliente, db);
                const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
                const isExceeded = balance > limit;
                const hasCreditEnabled = c['Credito?'] === 'SI';

                const item = document.createElement('div');
                item.className = `list-item ${selectedClientId === c.Codigo_Cliente ? 'active' : ''}`;
                item.style.cursor = 'pointer';
                item.style.padding = '1rem';
                item.style.marginBottom = '0.5rem';
                
                item.innerHTML = html`
                    <div class="list-item-main" style="flex-grow:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span class="list-item-title" style="font-weight:600;">${c.Nombre}</span>
                            ${safe(isExceeded ? '<span class="badge-tag badge-danger" style="font-size:0.65rem; padding:0.15rem 0.35rem;">EXCEDIDO</span>' : '')}
                            ${safe(!hasCreditEnabled && balance > 0 ? '<span class="badge-tag badge-warning" style="font-size:0.65rem; padding:0.15rem 0.35rem;">BLOQUEADO</span>' : '')}
                        </div>
                        <span class="list-item-subtitle" style="display:flex; justify-content:space-between; margin-top:0.25rem;">
                            <span>Cód: ${c.Codigo_Cliente}</span>
                            <span style="font-weight:700; color: ${balance > 0 ? 'var(--danger)' : 'var(--success)'};">
                                Saldo: $ ${balance.toFixed(2)}
                            </span>
                        </span>
                    </div>
                `;

                item.addEventListener('click', () => {
                    selectedClientId = c.Codigo_Cliente;
                    document.querySelectorAll('#credit-clients-list .list-item').forEach(el => el.classList.remove('active'));
                    item.classList.add('active');
                    renderClientDetails(c.Codigo_Cliente);
                });

                listContainer.appendChild(item);
            });
        }

        function renderClientDetails(clientId) {
            const client = db.clientes.find(c => c.Codigo_Cliente === clientId);
            if (!client) return;

            const balance = getClientPendingBalance(clientId, db);
            const limit = parseFloat(client['Monto Credito'] || client.Monto_Credito || 0);
            const termDays = parseInt(client['Plazo Credito Días'] || 30);
            const availableCredit = Math.max(0, limit - balance);
            const isExceeded = balance > limit;

            // Fetch pending budgets (Condition = CREDIT, status is FACTURADO, and Pagado? !== SI)
            const pendingBudgets = db.presupuestos.filter(p => 
                p.Codigo_Cliente === clientId && 
                p.Condicion === 'CREDITO' && 
                p['Pagado?'] !== 'SI' && 
                (p.Estado === 3 || p.Estado === '3')
            );
            
            // Fetch client abonos
            const abonos = (db['30 Abonos Creditos'] || []).filter(ab => ab.Codigo_Cliente === clientId);

            detailPanel.innerHTML = html`
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1.5rem;">
                    <div>
                        <h3 style="margin:0;">${client.Nombre}</h3>
                        <p style="font-size:0.8rem; color:var(--text-secondary); margin:0.25rem 0 0 0;">Código: <strong>${client.Codigo_Cliente}</strong> • Tel: ${client['Telefono 1 '] || 'N/A'}</p>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-secondary" id="btn-config-credit-details" style="padding:0.5rem 0.75rem;"><i class="fa-solid fa-gears"></i> Configurar</button>
                        <button class="btn btn-primary" id="btn-abono-general" style="padding:0.5rem 0.75rem;"><i class="fa-solid fa-plus-circle"></i> Recibir Abono</button>
                    </div>
                </div>

                <!-- Financial metrics dashboard -->
                <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:2rem;">
                    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px; padding:1rem;">
                        <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Límite de Crédito</div>
                        <div style="font-size:1.5rem; font-weight:700; color:var(--text-primary); margin-top:0.25rem;">$ ${limit.toFixed(2)}</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Plazo: ${termDays} días</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px; padding:1rem;">
                        <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Saldo Pendiente</div>
                        <div style="font-size:1.5rem; font-weight:700; color:${balance > 0 ? 'var(--danger)' : 'var(--success)'}; margin-top:0.25rem;">$ ${balance.toFixed(2)}</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">
                            ${safe(isExceeded ? '<span style="color:var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> Excede el límite!</span>' : 'Crédito Habilitado')}
                        </div>
                    </div>
                    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px; padding:1rem;">
                        <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Crédito Disponible</div>
                        <div style="font-size:1.5rem; font-weight:700; color:var(--success); margin-top:0.25rem;">$ ${availableCredit.toFixed(2)}</div>
                        <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Disponible para compras</div>
                    </div>
                </div>

                <!-- Pending Invoices / Budgets section -->
                <h4 style="margin-bottom:1rem; border-bottom:1px dashed var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-clock-rotate-left"></i> Presupuestos / DTEs al Crédito Pendientes (${pendingBudgets.length})</h4>
                <div class="table-container" style="margin-bottom:2rem; max-height:220px; overflow-y:auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Presupuesto</th>
                                <th>Fecha</th>
                                <th>Vehículo</th>
                                <th>Monto Total</th>
                                <th>Saldo Pendiente</th>
                                <th style="text-align:right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(pendingBudgets.length === 0 
                                ? '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:1.5rem;">No hay presupuestos pendientes de liquidar.</td></tr>' 
                                : pendingBudgets.map(p => {
                                    const totalBudget = getBudgetGrandTotal(p, db);
                                    const budgetId = p['ID Presupuesto'];
                                    const linked = abonos.filter(ab => 
                                        ab.ID_Presupuesto === budgetId || 
                                        (ab.Observaciones && ab.Observaciones.includes(`presupuesto ${budgetId}`))
                                    );
                                    const totalPaid = linked.reduce((sum, ab) => sum + parseFloat(ab['Monto Abono'] || ab.Monto || 0), 0);
                                    const remaining = Math.max(0, totalBudget - totalPaid);
                                    
                                    return `
                                        <tr>
                                            <td><strong>${p['ID Presupuesto']}</strong></td>
                                            <td>${p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A'}</td>
                                            <td>${p.Placas || 'N/A'}</td>
                                            <td>$ ${totalBudget.toFixed(2)}</td>
                                            <td style="color:var(--danger); font-weight:700;">$ ${remaining.toFixed(2)}</td>
                                            <td style="text-align:right;">
                                                <button class="btn btn-success btn-pay-budget" data-pres-id="${p['ID Presupuesto']}" data-total="${remaining}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-check"></i> Registrar Pago</button>
                                                <button class="btn btn-secondary btn-liquidate-direct" data-pres-id="${p['ID Presupuesto']}" style="padding:0.25rem 0.5rem; font-size:0.75rem; border-color:var(--danger); color:var(--danger);"><i class="fa-solid fa-ban"></i> Liquidar</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join(''))}
                        </tbody>
                    </table>
                </div>

                <!-- Abonos history section -->
                <h4 style="margin-bottom:1rem; border-bottom:1px dashed var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-receipt"></i> Historial de Abonos Recibidos (${abonos.length})</h4>
                <div class="table-container" style="max-height:200px; overflow-y:auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Abono</th>
                                <th>Fecha</th>
                                <th>Monto</th>
                                <th>Método</th>
                                <th>Referencia</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(abonos.length === 0 
                                ? '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:1.5rem;">No se han registrado abonos previos.</td></tr>' 
                                : abonos.map(ab => `
                                    <tr>
                                        <td><strong>${ab.ID_Abono}</strong></td>
                                        <td>${ab['Fecha Abono'] ? new Date(ab['Fecha Abono']).toLocaleDateString('es-SV') : 'N/A'}</td>
                                        <td style="color:var(--success); font-weight:700;">$ ${parseFloat(ab['Monto Abono'] || ab.Monto || 0).toFixed(2)}</td>
                                        <td>${ab['Metodo Pago'] || 'N/A'}</td>
                                        <td>${ab['Num Doc/Auto'] || 'N/A'}</td>
                                        <td><span style="font-size:0.75rem; color:var(--text-secondary);">${ab.Observaciones || '-'}</span></td>
                                    </tr>
                                `).join(''))}
                        </tbody>
                    </table>
                </div>
            `;

            // Wire details-related click events
            document.getElementById('btn-config-credit-details').addEventListener('click', () => {
                document.getElementById('config-client-id').value = clientId;
                document.getElementById('config-client-name').value = client.Nombre;
                document.getElementById('config-credit-enabled').value = client['Credito?'] || 'NO';
                document.getElementById('config-credit-limit').value = limit;
                document.getElementById('config-credit-days').value = termDays;
                
                configModal.classList.add('active');
            });

            document.getElementById('btn-abono-general').addEventListener('click', () => {
                document.getElementById('abono-client-id').value = clientId;
                document.getElementById('abono-pres-id').value = '';
                document.getElementById('abono-client-name').value = client.Nombre;
                const roundedBalance = parseFloat(balance.toFixed(2));
                document.getElementById('abono-current-balance').value = '$' + roundedBalance.toFixed(2);
                document.getElementById('abono-amount').value = '';
                document.getElementById('abono-amount').max = roundedBalance;
                
                abonoModal.classList.add('active');
            });

            document.querySelectorAll('.btn-pay-budget').forEach(btn => {
                btn.addEventListener('click', () => {
                    const presId = btn.getAttribute('data-pres-id');
                    const total = parseFloat(btn.getAttribute('data-total'));
                    
                    document.getElementById('abono-client-id').value = clientId;
                    document.getElementById('abono-pres-id').value = presId;
                    document.getElementById('abono-client-name').value = client.Nombre;
                    const roundedTotal = parseFloat(total.toFixed(2));
                    document.getElementById('abono-current-balance').value = '$' + roundedTotal.toFixed(2);
                    document.getElementById('abono-amount').value = roundedTotal.toFixed(2);
                    document.getElementById('abono-amount').max = roundedTotal;
                    
                    abonoModal.classList.add('active');
                });
            });

            document.querySelectorAll('.btn-liquidate-direct').forEach(btn => {
                btn.addEventListener('click', () => {
                    const presId = btn.getAttribute('data-pres-id');
                    if (confirm(`¿Estás seguro de que deseas liquidar directamente el presupuesto ${presId} sin registrar un abono financiero? (Esto saldará la deuda de este documento).`)) {
                        const budget = db.presupuestos.find(p => p['ID Presupuesto'] === presId);
                        if (budget) {
                            budget['Pagado?'] = 'SI';
                            budget.Pagado = 'SI';
                            saveDatabase(db);
                            showToast(`Presupuesto ${presId} liquidado correctamente`, "success");
                            renderClientDetails(clientId);
                            populateClientsList(searchInput.value);
                        }
                    }
                });
            });
        }

        // Search bar event listener
        searchInput.addEventListener('input', (e) => populateClientsList(e.target.value));

        // Modal cancellation wiring
        document.getElementById('close-abono-modal').addEventListener('click', () => abonoModal.classList.remove('active'));
        document.getElementById('cancel-abono').addEventListener('click', () => abonoModal.classList.remove('active'));
        document.getElementById('close-config-credit-modal').addEventListener('click', () => configModal.classList.remove('active'));
        document.getElementById('cancel-config-credit').addEventListener('click', () => configModal.classList.remove('active'));

        // Submit handlers
        abonoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const clientId = document.getElementById('abono-client-id').value;
            const presId = document.getElementById('abono-pres-id').value;
            const amount = parseFloat(document.getElementById('abono-amount').value);
            const method = document.getElementById('abono-method').value;
            const ref = document.getElementById('abono-ref').value;
            const notes = document.getElementById('abono-notes').value;

            db['30 Abonos Creditos'] = db['30 Abonos Creditos'] || [];
            const abonoId = "ABONOCC-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);

            db['30 Abonos Creditos'].unshift({
                ID_Abono: abonoId,
                Codigo_Cliente: clientId,
                ID_Presupuesto: presId || "",
                "Fecha Abono": Date.now(),
                "Monto Abono": amount,
                "Metodo Pago": method === '01' ? 'EFECTIVO' : method === '02' ? 'TARJETA' : 'TRANSFERENCIA',
                "Num Doc/Auto": ref,
                User: getActiveUser().Email || "jjmunoz932@gmail.com",
                "Fecha Registro": Date.now(),
                Observaciones: notes + (presId ? ` (Pago presupuesto ${presId})` : '')
            });

            if (presId) {
                const budget = db.presupuestos.find(p => p['ID Presupuesto'] === presId);
                if (budget) {
                    const budgetTotal = getBudgetGrandTotal(budget, db);
                    const existingLinked = (db['30 Abonos Creditos'] || []).filter(ab => 
                        ab.Codigo_Cliente === clientId && 
                        (ab.ID_Presupuesto === presId || (ab.Observaciones && ab.Observaciones.includes(`presupuesto ${presId}`)))
                    );
                    const totalAbonado = existingLinked.reduce((sum, ab) => sum + parseFloat(ab['Monto Abono'] || ab.Monto || 0), 0);
                    
                    if (totalAbonado >= budgetTotal - 0.01) {
                        budget['Pagado?'] = 'SI';
                        budget.Pagado = 'SI';
                    }
                }
            }

            saveDatabase(db);
            showToast(`Abono de $ ${amount.toFixed(2)} registrado con éxito`, "success");
            abonoModal.classList.remove('active');
            
            // Refresh views
            renderClientDetails(clientId);
            populateClientsList(searchInput.value);
        });

        configForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const clientId = document.getElementById('config-client-id').value;
            const enabled = document.getElementById('config-credit-enabled').value;
            const limit = parseFloat(document.getElementById('config-credit-limit').value);
            const days = parseInt(document.getElementById('config-credit-days').value);

            const client = db.clientes.find(c => c.Codigo_Cliente === clientId);
            if (client) {
                client['Credito?'] = enabled;
                client['Monto Credito'] = limit;
                client.Monto_Credito = limit; // Keep both fields in sync
                client['Plazo Credito Días'] = days;
                
                saveDatabase(db);
                showToast("Configuración de crédito guardada", "success");
                configModal.classList.remove('active');
                
                // Refresh views
                renderClientDetails(clientId);
                populateClientsList(searchInput.value);
            }
        });

        // Run loaders
        populateClientsList();
        if (creditClients.length > 0) {
            selectedClientId = creditClients[0].Codigo_Cliente;
            renderClientDetails(selectedClientId);
            populateClientsList(); // Set active style in list
        }
    }
}

// 9. INVENTARIO / KARDEX VIEW


export function printGeneralPortfolioPDF(db, ws) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast("Error: Habilite las ventanas emergentes (popups) para ver el PDF", "danger");
        return;
    }
    
    const creditClients = db.clientes.filter(c => c['Credito?'] === 'SI' || getClientPendingBalance(c.Codigo_Cliente, db) > 0);
    let totalPortfolio = 0;
    let overlimitCount = 0;
    
    const rowsHTML = creditClients.map(c => {
        const balance = getClientPendingBalance(c.Codigo_Cliente, db);
        totalPortfolio += balance;
        const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
        const isExceeded = balance > limit;
        if (isExceeded) overlimitCount++;
        
        return `
            <tr>
                <td style="padding:8px; border-bottom:1px solid #ddd; white-space:nowrap;">${escapeHtml(c.Codigo_Cliente)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; font-weight:bold;">${escapeHtml(c.Nombre)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right; white-space:nowrap;">$ ${limit.toFixed(2)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right; font-weight:bold; white-space:nowrap; color:${balance > 0 ? '#ef233c' : '#333'};">$ ${balance.toFixed(2)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:center; white-space:nowrap;">
                    <span style="padding:3px 8px; border-radius:4px; font-size:10px; font-weight:bold; background:${isExceeded ? '#ffccd5' : '#cbf3f0'}; color:${isExceeded ? '#c9184a' : '#0f9f90'};">
                        ${isExceeded ? 'EXCEDIDO' : 'AL DÍA'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    const brandColor = ws.color_presupuesto || '#4361ee';
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Reporte General de Cartera - ${escapeHtml(ws.name || 'Mecanic-OS')}</title>
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
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
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid ${brandColor} !important; padding-bottom: 15px; margin-bottom: 20px; }
                .title { font-size: 18px; font-weight: bold; color: ${brandColor} !important; text-transform: uppercase; margin-bottom:5px; }
                .subtitle { font-size: 11px; color: #666; }
                .kpis { display: flex; gap: 15px; margin-bottom: 25px; }
                .kpi-card { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 12px; background: #fafafa; }
                .kpi-label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: bold; }
                .kpi-val { font-size: 16px; font-weight: bold; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: ${brandColor} !important; color: white !important; padding: 8px; text-align: center; vertical-align: middle; font-weight: bold; border: 1px solid ${brandColor} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
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
            <div class="header">
                <div>
                    <div class="title">${escapeHtml(ws.name || 'Mecanic-OS')}</div>
                    <div class="subtitle">${escapeHtml(ws.address || 'El Salvador')}</div>
                    <div class="subtitle">Teléfono: ${escapeHtml(ws.phone || 'N/A')} • Email: ${escapeHtml(ws.email || 'N/A')}</div>
                </div>
                <div class="text-right">
                    <div style="font-weight:bold; font-size:14px;">REPORTE GENERAL DE CARTERA</div>
                    <div class="subtitle">Fecha Emisión: ${new Date().toLocaleDateString('es-SV')}</div>
                </div>
            </div>
            
            <div class="kpis">
                <div class="kpi-card">
                    <div class="kpi-label">Cartera Activa Total</div>
                    <div class="kpi-val" style="color:${brandColor};">$ ${totalPortfolio.toFixed(2)}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Clientes en Cartera</div>
                    <div class="kpi-val">${creditClients.length} Clientes</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Clientes Excedidos (Mora)</div>
                    <div class="kpi-val" style="color:#ef233c;">${overlimitCount} Clientes</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Código</th>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Nombre del Cliente</th>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Límite Crédito</th>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Saldo Pendiente</th>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${safe(rowsHTML || '<tr><td colspan="5" style="text-align:center; padding:15px; color:#666;">No hay clientes con saldo o crédito registrado</td></tr>')}
                </tbody>
            </table>
            
            <div class="sign-box">
                <div class="sign-line">Preparado Por</div>
                <div class="sign-line">Revisado Por / Supervisor</div>
                <div class="sign-line">Autorizado Por / Gerencia</div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}



export function printOverlimitPortfolioPDF(db, ws) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast("Error: Habilite las ventanas emergentes (popups) para ver el PDF", "danger");
        return;
    }
    
    const creditClients = db.clientes.filter(c => {
        const balance = getClientPendingBalance(c.Codigo_Cliente, db);
        const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
        return balance > limit;
    });
    
    let totalPortfolioExceeded = 0;
    
    const rowsHTML = creditClients.map(c => {
        const balance = getClientPendingBalance(c.Codigo_Cliente, db);
        const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
        const exceededAmount = balance - limit;
        totalPortfolioExceeded += exceededAmount;
        
        return `
            <tr>
                <td style="padding:8px; border-bottom:1px solid #ddd; white-space:nowrap;">${escapeHtml(c.Codigo_Cliente)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; font-weight:bold;">${escapeHtml(c.Nombre)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right; white-space:nowrap;">$ ${limit.toFixed(2)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right; font-weight:bold; white-space:nowrap; color:#ef233c;">$ ${balance.toFixed(2)}</td>
                <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right; font-weight:bold; white-space:nowrap; color:#d90429;">$ ${exceededAmount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
    
    const brandColor = ws.color_presupuesto || '#4361ee';
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Reporte de Cartera Excedida - ${escapeHtml(ws.name || 'Mecanic-OS')}</title>
            <style>
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
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
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ef233c !important; padding-bottom: 15px; margin-bottom: 20px; }
                .title { font-size: 18px; font-weight: bold; color: #ef233c !important; text-transform: uppercase; margin-bottom:5px; }
                .subtitle { font-size: 11px; color: #666; }
                .kpis { display: flex; gap: 15px; margin-bottom: 25px; }
                .kpi-card { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 12px; background: #fafafa; }
                .kpi-label { font-size: 9px; color: #666; text-transform: uppercase; font-weight: bold; }
                .kpi-val { font-size: 16px; font-weight: bold; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th { background: #ef233c !important; color: white !important; padding: 8px; text-align: center; vertical-align: middle; font-weight: bold; border: 1px solid #ef233c !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .sign-box { margin-top: 60px; display: flex; justify-content: space-between; }
                .sign-line { border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 5px; font-size: 10px; }
                .btn-print { background: #ef233c; color:white; border:none; padding:10px 20px; font-weight:bold; border-radius:4px; cursor:pointer; margin-bottom:20px; }
                
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
            <div class="header">
                <div>
                    <div class="title">REPORTE DE CLIENTES EXCEDIDOS</div>
                    <div class="subtitle">${escapeHtml(ws.name || 'Mecanic-OS')} • ${escapeHtml(ws.address || 'El Salvador')}</div>
                </div>
                <div class="text-right">
                    <div style="font-weight:bold; font-size:14px; color:#ef233c;">ALERTA DE MORA</div>
                    <div class="subtitle">Fecha Emisión: ${new Date().toLocaleDateString('es-SV')}</div>
                </div>
            </div>
            
            <div class="kpis">
                <div class="kpi-card">
                    <div class="kpi-label">Total Exceso de Crédito</div>
                    <div class="kpi-val" style="color:#ef233c;">$ ${totalPortfolioExceeded.toFixed(2)}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Clientes en Mora</div>
                    <div class="kpi-val">${creditClients.length} Clientes</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Código</th>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Nombre del Cliente</th>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Límite Crédito</th>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Saldo Pendiente</th>
                        <th style="padding:8px; text-align:center; vertical-align:middle; white-space:nowrap;">Monto Excedido</th>
                    </tr>
                </thead>
                <tbody>
                    ${safe(rowsHTML || '<tr><td colspan="5" style="text-align:center; padding:15px; color:#666;">No hay clientes que superen su límite de crédito.</td></tr>')}
                </tbody>
            </table>
            
            <div class="sign-box">
                <div class="sign-line">Auditor de Créditos</div>
                <div class="sign-line">Revisado Por / Supervisor</div>
                <div class="sign-line">Autorizado Por / Gerencia</div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}



export function printClientStatementPDF(db, ws, clientId) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast("Error: Habilite las ventanas emergentes (popups) para ver el PDF", "danger");
        return;
    }
    
    const client = db.clientes.find(c => c.Codigo_Cliente === clientId);
    if (!client) return;

    const limit = parseFloat(client['Monto Credito'] || client.Monto_Credito || 0);
    const balance = getClientPendingBalance(clientId, db);
    const termDays = parseInt(client['Plazo Credito Días'] || 30);
    const availableCredit = Math.max(0, limit - balance);
    const isExceeded = balance > limit;

    // Invoices/Charges (Condition = CREDIT)
    const creditBudgets = db.presupuestos.filter(p => p.Codigo_Cliente === clientId && p.Condicion === 'CREDITO');
    const charges = creditBudgets.map(p => ({
        timestamp: p.Fecha ? new Date(p.Fecha).getTime() : Date.now(),
        fecha: p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A',
        ref: p['ID Presupuesto'],
        tipo: 'Facturación Crédito',
        cargo: getBudgetGrandTotal(p, db),
        abono: 0,
        dte: p.mhControlNumber || p.controlNumber || '',
        isAnulado: p.Estado == 4 || p.Anulado === true
    }));

    // Payments/Abonos
    const abonos = (db['30 Abonos Creditos'] || []).filter(ab => ab.Codigo_Cliente === clientId);
    const payments = abonos.map(ab => ({
        timestamp: ab['Fecha Abono'] || Date.now(),
        fecha: ab['Fecha Abono'] ? new Date(ab['Fecha Abono']).toLocaleDateString('es-SV') : 'N/A',
        ref: ab.ID_Abono,
        tipo: `Abono (${ab['Metodo Pago'] || 'EFECTIVO'})`,
        cargo: 0,
        abono: parseFloat(ab['Monto Abono'] || ab.Monto || 0),
        dte: '',
        isAnulado: false
    }));

    // Combine and sort chronologically
    const ledger = [...charges, ...payments].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate running balance rows
    let runningBalance = 0;
    const rowsHTML = ledger.map(t => {
        const isTransAnulada = t.isAnulado;
        if (!isTransAnulada) {
            runningBalance += t.cargo - t.abono;
        }

        let cargoText = '-';
        let abonoText = '-';
        if (t.cargo > 0) {
            cargoText = `$ ${t.cargo.toFixed(2)}`;
            if (isTransAnulada) {
                cargoText = `<span style="text-decoration: line-through; color:#aaa;">$ ${t.cargo.toFixed(2)}</span>`;
            }
        }
        if (t.abono > 0) {
            abonoText = `$ ${t.abono.toFixed(2)}`;
        }

        return `
            <tr>
                <td style="padding:8px 6px; border:1px solid #ddd; text-align:center; font-size:10px; white-space:nowrap;">${t.fecha}</td>
                <td style="padding:8px 6px; border:1px solid #ddd; font-weight:bold; font-size:10px;">${escapeHtml(t.ref)}</td>
                <td style="padding:8px 6px; border:1px solid #ddd; font-size:10px;">${escapeHtml(t.tipo)}</td>
                <td style="padding:8px 6px; border:1px solid #ddd; font-family:monospace; font-size:9.5px; white-space:nowrap;">${t.dte ? escapeHtml(t.dte) : '-'}</td>
                <td style="padding:8px 6px; border:1px solid #ddd; text-align:right; font-size:10px; white-space:nowrap; color:${t.cargo > 0 && !isTransAnulada ? '#ef233c' : '#aaa'};">${cargoText}</td>
                <td style="padding:8px 6px; border:1px solid #ddd; text-align:right; font-size:10px; white-space:nowrap; color:${t.abono > 0 ? '#10b981' : '#333'};">${abonoText}</td>
                <td style="padding:8px 6px; border:1px solid #ddd; text-align:right; font-size:10px; font-weight:bold; white-space:nowrap;">$ ${runningBalance.toFixed(2)}</td>
                <td style="padding:8px 6px; border:1px solid #ddd; text-align:center; font-size:10px;">
                    ${safe(isTransAnulada 
                        ? '<span style="background:rgba(239,68,68,0.15); color:#ef4444; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold;">ANULADO</span>' 
                        : '<span style="background:rgba(16,185,129,0.15); color:#10b981; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold;">ACTIVO</span>')}
                </td>
            </tr>
        `;
    }).join('');
    
    const brandColor = ws.color_presupuesto || '#84cc16';
    
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
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Estado de Cuenta - ${escapeHtml(client.Nombre)}</title>
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
                DOCUMENTO TRIBUTARIO ELECTRÓNICO - ESTADO DE CUENTA DE CLIENTE
            </div>

            <!-- Client & Credit details box -->
            <div style="background:${brandColor} !important; color:#fff !important; text-align:center; padding:6px; font-weight:bold; font-size:11px; letter-spacing:0.5px; margin-bottom:10px; border-radius:3px; text-transform:uppercase; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                receptor / cliente y detalles de crédito
            </div>
            
            <div style="border: 1px solid ${brandColor} !important; border-radius: 6px; padding: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 11px; line-height: 1.6;">
                <div style="flex:1; padding-right:20px;">
                    <div style="color:${brandColor} !important; font-weight:bold; margin-bottom:5px; font-size:12px; border-bottom:1px solid #eee; padding-bottom:3px;">Datos del Cliente</div>
                    <div><strong>Nombre o Razón Social:</strong> ${escapeHtml(client.Nombre)}</div>
                    <div><strong>Tipo de Documento:</strong> ${escapeHtml(client['Tipo Doc'] || client.Tipo_Documento || 'DUI')}</div>
                    <div><strong>N° Documento:</strong> ${escapeHtml(client['Num Doc'] || client.Num_Documento || client.NIT || client.DUI || 'N/A')}</div>
                    <div><strong>Dirección:</strong> ${escapeHtml(client.Direccion || 'N/A')}</div>
                    <div><strong>Correo Electrónico:</strong> ${escapeHtml(client.Correo || client.Email || 'N/A')}</div>
                    <div><strong>Teléfono:</strong> ${escapeHtml(client['Telefono 1 '] || 'N/A')}</div>
                </div>
                <div style="width:250px; border-left:1px solid #eee; padding-left:20px;">
                    <div style="color:${brandColor} !important; font-weight:bold; margin-bottom:5px; font-size:12px; border-bottom:1px solid #eee; padding-bottom:3px;">Detalles del Crédito</div>
                    <div><strong>Límite Autorizado:</strong> $ ${limit.toFixed(2)}</div>
                    <div><strong>Plazo de Pago:</strong> ${termDays} días</div>
                    <div><strong>Saldo Pendiente Actual:</strong> <strong style="color:${balance > 0 ? '#ef233c' : '#10b981'};">$ ${balance.toFixed(2)}</strong></div>
                    <div><strong>Crédito Disponible:</strong> <strong style="color:#10b981;">$ ${availableCredit.toFixed(2)}</strong></div>
                    <div><strong>Estado:</strong> 
                        ${safe(isExceeded 
                            ? '<span style="color:#ef233c; font-weight:bold;">LÍMITE EXCEDIDO</span>' 
                            : '<span style="color:#10b981; font-weight:bold;">CUENTA AL DÍA</span>')}
                    </div>
                </div>
            </div>

            <!-- Transaction Ledger Section -->
            <div style="background:${brandColor} !important; color:#fff !important; text-align:center; padding:6px; font-weight:bold; font-size:11px; letter-spacing:0.5px; margin-bottom:10px; border-radius:3px; text-transform:uppercase; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                cuerpo del documento / historial de transacciones
            </div>
            
            <table style="width:100%; border-collapse:collapse; margin-bottom:30px; font-size:10px;">
                <thead>
                    <tr style="background:${brandColor} !important; color:white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                        <th style="padding:8px 6px; text-align:center; vertical-align:middle; border:1px solid ${brandColor} !important; font-size:10px; width:10%; white-space:nowrap;">Fecha</th>
                        <th style="padding:8px 6px; text-align:center; vertical-align:middle; border:1px solid ${brandColor} !important; font-size:10px; width:14%; white-space:nowrap;">Referencia</th>
                        <th style="padding:8px 6px; text-align:center; vertical-align:middle; border:1px solid ${brandColor} !important; font-size:10px; width:12%; white-space:nowrap;">Tipo</th>
                        <th style="padding:8px 6px; text-align:center; vertical-align:middle; border:1px solid ${brandColor} !important; font-size:10px; width:28%; white-space:nowrap;">DTE / Control</th>
                        <th style="padding:8px 6px; text-align:center; vertical-align:middle; border:1px solid ${brandColor} !important; font-size:10px; width:11%; white-space:nowrap;">Cargo</th>
                        <th style="padding:8px 6px; text-align:center; vertical-align:middle; border:1px solid ${brandColor} !important; font-size:10px; width:11%; white-space:nowrap;">Abono</th>
                        <th style="padding:8px 6px; text-align:center; vertical-align:middle; border:1px solid ${brandColor} !important; font-size:10px; width:14%; white-space:nowrap;">Saldo</th>
                        <th style="padding:8px 6px; text-align:center; vertical-align:middle; border:1px solid ${brandColor} !important; font-size:10px; width:10%; white-space:nowrap;">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${safe(rowsHTML || '<tr><td colspan="8" style="text-align:center; padding:20px; color:#666; border:1px solid #ddd;">No se registran cargos ni abonos para este cliente</td></tr>')}
                </tbody>
            </table>
            
            <div class="sign-box" style="margin-top: 80px;">
                <div class="sign-line">Firma de Conformidad Cliente</div>
                <div class="sign-line">Firma Cajero / Receptor</div>
                <div class="sign-line">Autorizado Supervisor</div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ----------------------------------------------------
// SAAS PORTAL & ONBOARDING VIEWS
// ----------------------------------------------------


