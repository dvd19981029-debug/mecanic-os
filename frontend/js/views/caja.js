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
} from '../../app.js?v=28';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport
} from '../utils.js?v=28';

export function renderCaja(container) {
    const db = getDatabase();
    
    // Ensure lists exist in DB
    db.cajas_sesiones = db.cajas_sesiones || [];
    db.caja_movimientos = db.caja_movimientos || [];
    db.pagos = db.pagos || [];
    
    // Find active session
    let activeSession = db.cajas_sesiones.find(s => s.estado === 'ABIERTA');
    
    // Setup container layout
    container.innerHTML = html`
        <div class="caja-view-wrapper" style="display:flex; flex-direction:column; gap:1.5rem;">
            <!-- Tabs Navigation -->
            <div class="caja-tabs" style="display:flex; gap:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                <button class="tab-btn active" data-tab="active-session" style="background:none; border:none; color:var(--primary); border-bottom:2px solid var(--primary); padding:0.5rem 1rem; font-weight:600; cursor:pointer; font-family:inherit;">
                    <i class="fa-solid fa-cash-register"></i> Caja Diaria Activa
                </button>
                <button class="tab-btn" data-tab="history-cuts" style="background:none; border:none; color:var(--text-secondary); padding:0.5rem 1rem; font-weight:600; cursor:pointer; font-family:inherit;">
                    <i class="fa-solid fa-clock-rotate-left"></i> Historial de Cortes
                </button>
                <button class="tab-btn" data-tab="monthly-consolidation" style="background:none; border:none; color:var(--text-secondary); padding:0.5rem 1rem; font-weight:600; cursor:pointer; font-family:inherit;">
                    <i class="fa-solid fa-calendar-days"></i> Conciliación Mensual
                </button>
            </div>
            
            <!-- Tab Content -->
            <div id="caja-tab-content">
                <!-- Will be dynamically populated -->
            </div>
        </div>
    `;
    
    const tabButtons = container.querySelectorAll('.tab-btn');
    const tabContent = container.querySelector('#caja-tab-content');
    
    // Switch tabs
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.style.color = 'var(--text-secondary)';
                b.style.borderBottom = 'none';
            });
            btn.classList.add('active');
            btn.style.color = 'var(--primary)';
            btn.style.borderBottom = '2px solid var(--primary)';
            
            const tabName = btn.getAttribute('data-tab');
            renderTab(tabName);
        });
    });
    
    // Render specific tab
    function renderTab(tabName) {
        if (tabName === 'active-session') {
            renderActiveSessionTab();
        } else if (tabName === 'history-cuts') {
            renderHistoryCutsTab();
        } else if (tabName === 'monthly-consolidation') {
            renderMonthlyConsolidationTab();
        }
    }
    
    // Initialize first tab
    renderTab('active-session');
    
    function renderActiveSessionTab() {
        if (!activeSession) {
            // Render Opening Form
            // Suggest previous balance as initial balance
            const lastSession = db.cajas_sesiones.filter(s => s.estado === 'CERRADA')
                                  .sort((a,b) => b.fecha_cierre - a.fecha_cierre)[0];
            const suggestedBalance = lastSession ? parseFloat(lastSession.saldo_real || 0) : 50.00;
            
            tabContent.innerHTML = html`
                <div class="glass-card" style="max-width:500px; margin:2rem auto; padding:2rem; text-align:center; border:1px solid var(--border-color); border-radius:var(--radius-lg); background:rgba(255,255,255,0.01);">
                    <div style="width:60px; height:60px; border-radius:50%; background:rgba(67,97,238,0.1); display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem;">
                        <i class="fa-solid fa-lock" style="font-size:1.75rem; color:var(--primary);"></i>
                    </div>
                    <h3 style="margin-bottom:0.5rem; color:var(--text-primary);">Apertura de Turno de Caja</h3>
                    <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1.5rem; line-height:1.4;">
                        El turno de caja actual está cerrado. Por favor, registre el saldo inicial (efectivo en fondo de caja para dar vuelto) para abrir el turno y comenzar a facturar o registrar ventas.
                    </p>
                    
                    <div class="form-group" style="text-align:left; margin-bottom:1.5rem;">
                        <label style="font-size:0.8rem; font-weight:600; display:block; margin-bottom:0.5rem; color:var(--text-secondary);">Monto Inicial en Efectivo ($)</label>
                        <div style="position:relative;">
                            <span style="position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-weight:600; color:var(--text-secondary); font-size:0.9rem;">$</span>
                            <input type="number" id="caja-monto-inicial" class="form-control" style="padding-left:1.75rem; width:100%;" step="0.01" value="${suggestedBalance.toFixed(2)}">
                        </div>
                        ${safe(lastSession ? `<span style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.4rem; display:block;"><i class="fa-solid fa-info-circle"></i> Saldo sugerido basado en el saldo real del último corte de caja.</span>` : '')}
                    </div>
                    
                    <button class="btn btn-primary" id="btn-caja-apertura" style="width:100%; font-weight:600; padding:0.75rem; display:flex; align-items:center; justify-content:center; gap:0.5rem;">
                        <i class="fa-solid fa-key"></i> Abrir Caja Diaria
                    </button>
                </div>
            `;
            
            document.getElementById('btn-caja-apertura').addEventListener('click', () => {
                const initBalance = parseFloat(document.getElementById('caja-monto-inicial').value || 0);
                if (initBalance < 0 || isNaN(initBalance)) {
                    showToast("Por favor ingrese un monto inicial válido.", "danger");
                    return;
                }
                
                const newSessionId = "SESSION-" + Math.floor(Date.now() / 1000).toString().substring(4);
                const activeUser = getActiveUser();
                
                activeSession = {
                    id_sesion: newSessionId,
                    estado: "ABIERTA",
                    fecha_apertura: Date.now(),
                    usuario_apertura: activeUser.Email || "jjmunoz932@gmail.com",
                    saldo_inicial: initBalance,
                    saldo_egresos: 0,
                    saldo_real: 0,
                    diferencia: 0,
                    fecha_cierre: null,
                    usuario_cierre: null,
                    comentarios: ""
                };
                
                db.cajas_sesiones.unshift(activeSession);
                saveDatabase(db);
                showToast("¡Turno de Caja Abierto Exitosamente!", "success");
                renderActiveSessionTab();
            });
            return;
        }
        
        // Active Session Dashboard
        const sessionPayments = db.pagos.filter(p => p.id_sesion === activeSession.id_sesion && p["Estado Pago"] === "COMPLETADO");
        const sessionManualMovs = db.caja_movimientos.filter(m => m.id_sesion === activeSession.id_sesion);
        
        // Sums
        const totalCashIn = sessionPayments.filter(p => p["Metodo Pago"] === "EFECTIVO").reduce((acc, p) => acc + parseFloat(p["Monto Pago"] || 0), 0);
        const totalCardIn = sessionPayments.filter(p => p["Metodo Pago"] === "TARJETA").reduce((acc, p) => acc + parseFloat(p["Monto Pago"] || 0), 0);
        const totalTransfersIn = sessionPayments.filter(p => p["Metodo Pago"] === "TRANSFERENCIA").reduce((acc, p) => acc + parseFloat(p["Monto Pago"] || 0), 0);
        
        const totalManualIn = sessionManualMovs.filter(m => m.tipo === "ENTRADA").reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);
        const totalManualOut = sessionManualMovs.filter(m => m.tipo === "SALIDA").reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);
        
        const expectedCash = activeSession.saldo_inicial + totalCashIn + totalManualIn - totalManualOut;
        const totalOtherIn = totalCardIn + totalTransfersIn;
        const netOperations = totalCashIn + totalOtherIn + totalManualIn - totalManualOut;
        
        tabContent.innerHTML = html`
            <div style="display:flex; flex-direction:column; gap:1.25rem;">
                <!-- Header Stats Cards -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">
                    <div class="glass-card stat-card" style="padding:1.25rem;">
                        <div class="stat-info">
                            <span class="stat-label">Fondo de Apertura</span>
                            <span class="stat-value" style="color: var(--text-primary);">$ ${activeSession.saldo_inicial.toFixed(2)}</span>
                            <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Por: ${activeSession.usuario_apertura.split('@')[0]}</span>
                        </div>
                        <div class="stat-icon" style="color: var(--primary); background-color: rgba(99, 102, 241, 0.15);"><i class="fa-solid fa-key"></i></div>
                    </div>
                    
                    <div class="glass-card stat-card" style="padding:1.25rem;">
                        <div class="stat-info">
                            <span class="stat-label">Efectivo Recibido (Ventas)</span>
                            <span class="stat-value" style="color: var(--success);">$ ${totalCashIn.toFixed(2)}</span>
                            <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">${sessionPayments.filter(p => p["Metodo Pago"] === "EFECTIVO").length} transacciones</span>
                        </div>
                        <div class="stat-icon" style="color: var(--success); background-color: rgba(16, 185, 129, 0.15);"><i class="fa-solid fa-money-bill-wave"></i></div>
                    </div>
                    
                    <div class="glass-card stat-card" style="padding:1.25rem;">
                        <div class="stat-info">
                            <span class="stat-label">Tarjeta / Transferencias</span>
                            <span class="stat-value" style="color: var(--cyan);">$ ${totalOtherIn.toFixed(2)}</span>
                            <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Tarj: $${totalCardIn.toFixed(2)} | Transf: $${totalTransfersIn.toFixed(2)}</span>
                        </div>
                        <div class="stat-icon" style="color: var(--cyan); background-color: rgba(6, 182, 212, 0.15);"><i class="fa-solid fa-credit-card"></i></div>
                    </div>
                    
                    <div class="glass-card stat-card" style="padding:1.25rem;">
                        <div class="stat-info">
                            <span class="stat-label">Egresos / Salidas</span>
                            <span class="stat-value" style="color: var(--danger);">$ ${totalManualOut.toFixed(2)}</span>
                            <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Entradas manuales: $${totalManualIn.toFixed(2)}</span>
                        </div>
                        <div class="stat-icon" style="color: var(--danger); background-color: rgba(239, 35, 60, 0.15);"><i class="fa-solid fa-circle-minus"></i></div>
                    </div>
                    
                    <div class="glass-card stat-card" style="padding:1.25rem; border: 1px solid var(--primary); background: rgba(67, 97, 238, 0.05);">
                        <div class="stat-info">
                            <span class="stat-label" style="color: var(--primary);">Efectivo Teórico Esperado</span>
                            <span class="stat-value" style="color: var(--primary); font-weight: 800;">$ ${expectedCash.toFixed(2)}</span>
                            <span style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Saldo físico en caja esperado</span>
                        </div>
                        <div class="stat-icon" style="color: var(--primary); background-color: rgba(67, 97, 238, 0.2);"><i class="fa-solid fa-calculator"></i></div>
                    </div>
                </div>
                
                <!-- Action buttons line -->
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; gap:1rem; flex-wrap:wrap;">
                    <div style="display:flex; flex-direction:column; gap:0.25rem;">
                        <span style="font-size:0.85rem; font-weight:600;">Código de Caja Diaria: <code style="color:var(--cyan);">${activeSession.id_sesion}</code></span>
                        <span style="font-size:0.75rem; color:var(--text-secondary);"><i class="fa-solid fa-clock"></i> Abierta el: ${new Date(activeSession.fecha_apertura).toLocaleString('es-SV')}</span>
                    </div>
                    
                    <div style="display:flex; gap:0.75rem;">
                        <button class="btn btn-secondary" id="btn-caja-movimiento" style="display:flex; align-items:center; gap:0.4rem;">
                            <i class="fa-solid fa-arrow-right-arrow-left"></i> Registrar Movimiento
                        </button>
                        <button class="btn btn-danger" id="btn-caja-cierre" style="display:flex; align-items:center; gap:0.4rem; font-weight:600;">
                            <i class="fa-solid fa-lock"></i> Hacer Corte de Caja
                        </button>
                    </div>
                </div>
                
                <!-- Transactions table -->
                <div class="glass-card" style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; background:rgba(255,255,255,0.01);">
                    <h4 style="margin-bottom:1rem; font-size:1rem; display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-list-check" style="color:var(--cyan);"></i> Registro de Movimientos de Caja Diaria
                    </h4>
                    
                    <div style="overflow-x:auto;">
                        <table class="table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                            <thead>
                                <tr style="border-bottom:1px solid var(--border-color); text-align:left; color:var(--text-secondary);">
                                    <th style="padding:0.75rem 0.5rem;">Hora</th>
                                    <th style="padding:0.75rem 0.5rem;">Operación</th>
                                    <th style="padding:0.75rem 0.5rem;">Método</th>
                                    <th style="padding:0.75rem 0.5rem;">Cliente / Detalle</th>
                                    <th style="padding:0.75rem 0.5rem;">Responsable</th>
                                    <th style="padding:0.75rem 0.5rem; text-align:right;">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Manual entries, payments & open session initial balance row -->
                                <tr style="border-bottom:1px dashed var(--border-color); background:rgba(67,97,238,0.01);">
                                    <td style="padding:0.65rem 0.5rem; color:var(--text-secondary);">${new Date(activeSession.fecha_apertura).toLocaleTimeString('es-SV', {hour: '2-digit', minute:'2-digit'})}</td>
                                    <td style="padding:0.65rem 0.5rem;"><span class="badge" style="background:rgba(67,97,238,0.1); color:var(--primary); font-size:0.75rem;">Apertura</span></td>
                                    <td style="padding:0.65rem 0.5rem;">EFECTIVO</td>
                                    <td style="padding:0.65rem 0.5rem; color:var(--text-secondary); font-style:italic;">Saldo inicial de apertura</td>
                                    <td style="padding:0.65rem 0.5rem;">${activeSession.usuario_apertura.split('@')[0]}</td>
                                    <td style="padding:0.65rem 0.5rem; text-align:right; font-weight:600; color:var(--text-primary);">$ ${activeSession.saldo_inicial.toFixed(2)}</td>
                                </tr>
                                
                                ${
                                    safe(// Combine and sort
                                    [
                                        ...sessionPayments.map(p => ({
                                            timestamp: p["Fecha Pago"],
                                            tipo: p.ID_Presupuesto.startsWith('VR-') ? 'Venta POS' : 'Factura Presupuesto',
                                            metodo: p["Metodo Pago"],
                                            detalle: `Cobro Ref: ${p.ID_Presupuesto} - Cliente: ${p.Cliente || 'N/A'}`,
                                            responsable: p.User.split('@')[0],
                                            monto: parseFloat(p["Monto Pago"] || 0),
                                            isNegative: false
                                        })),
                                        ...sessionManualMovs.map(m => ({
                                            timestamp: m.timestamp,
                                            tipo: m.tipo === 'ENTRADA' ? 'Ingreso Manual' : 'Retiro / Egreso',
                                            metodo: 'EFECTIVO',
                                            detalle: m.motivo || 'Movimiento de caja',
                                            responsable: m.usuario.split('@')[0],
                                            monto: parseFloat(m.monto || 0),
                                            isNegative: m.tipo === 'SALIDA'
                                        }))
                                    ]
                                    .sort((a,b) => b.timestamp - a.timestamp)
                                    .map(row => `
                                        <tr style="border-bottom:1px solid var(--border-color);">
                                            <td style="padding:0.65rem 0.5rem; color:var(--text-secondary);">${new Date(row.timestamp).toLocaleTimeString('es-SV', {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td style="padding:0.65rem 0.5rem;">
                                                <span class="badge" style="background:${row.isNegative ? 'rgba(239,35,60,0.1)' : 'rgba(46,196,182,0.1)'}; color:${row.isNegative ? 'var(--danger)' : 'var(--success)'}; font-size:0.75rem;">
                                                    ${row.tipo}
                                                </span>
                                            </td>
                                            <td style="padding:0.65rem 0.5rem; font-weight:600; font-size:0.75rem;">${row.metodo}</td>
                                            <td style="padding:0.65rem 0.5rem;">${row.detalle}</td>
                                            <td style="padding:0.65rem 0.5rem; color:var(--text-secondary);">${row.responsable}</td>
                                            <td style="padding:0.65rem 0.5rem; text-align:right; font-weight:700; color:${row.isNegative ? 'var(--danger)' : 'var(--success)'};">
                                                ${row.isNegative ? '-' : '+'} $ ${row.monto.toFixed(2)}
                                            </td>
                                        </tr>
                                    `).join(''))
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Event Listeners for Actions
        document.getElementById('btn-caja-movimiento').addEventListener('click', () => {
            openCajaMovimientoModal();
        });
        
        document.getElementById('btn-caja-cierre').addEventListener('click', () => {
            openCajaCierreModal(expectedCash);
        });
    }
    
    // Modal for cash inputs / withdrawals
    function openCajaMovimientoModal() {
        const modalId = 'caja-mov-modal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();
        
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-backdrop active';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999;';
        
        modal.innerHTML = html`
            <div class="modal-card" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg); width:95%; max-width:400px; padding:1.5rem; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
                    <h4 style="margin:0;"><i class="fa-solid fa-arrow-right-arrow-left" style="color:var(--cyan);"></i> Registrar Movimiento Manual</h4>
                    <button class="btn-close" style="background:none; border:none; color:var(--text-secondary); font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div class="form-group" style="margin-bottom:1rem;">
                    <label style="font-size:0.8rem; display:block; margin-bottom:0.4rem; color:var(--text-secondary);">Tipo de Operación</label>
                    <select id="mov-tipo" class="form-control" style="width:100%;">
                        <option value="SALIDA">RETIRO / EGRESO DE CAJA</option>
                        <option value="ENTRADA">INGRESO MANUAL DE CAJA</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-bottom:1rem;">
                    <label style="font-size:0.8rem; display:block; margin-bottom:0.4rem; color:var(--text-secondary);">Monto en Efectivo ($)</label>
                    <div style="position:relative;">
                        <span style="position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-weight:600; color:var(--text-secondary); font-size:0.9rem;">$</span>
                        <input type="number" id="mov-monto" class="form-control" style="padding-left:1.75rem; width:100%;" step="0.01" required>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom:1.5rem;">
                    <label style="font-size:0.8rem; display:block; margin-bottom:0.4rem; color:var(--text-secondary);">Concepto / Justificación</label>
                    <textarea id="mov-motivo" class="form-control" style="width:100%; height:70px; resize:none;" placeholder="E.g. Compra de insumos de limpieza, pago de viáticos, etc." required></textarea>
                </div>
                
                <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
                    <button class="btn btn-secondary btn-cancel" style="padding:0.5rem 1rem;">Cancelar</button>
                    <button class="btn btn-primary btn-save" style="padding:0.5rem 1rem;">Guardar Movimiento</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeModal = () => modal.remove();
        modal.querySelector('.btn-close').addEventListener('click', closeModal);
        modal.querySelector('.btn-cancel').addEventListener('click', closeModal);
        
        modal.querySelector('.btn-save').addEventListener('click', () => {
            const tipo = modal.querySelector('#mov-tipo').value;
            const monto = parseFloat(modal.querySelector('#mov-monto').value || 0);
            const motivo = modal.querySelector('#mov-motivo').value.trim();
            
            if (isNaN(monto) || monto <= 0) {
                showToast("Por favor ingrese un monto mayor a cero.", "danger");
                return;
            }
            if (motivo === '') {
                showToast("Por favor escriba una justificación del movimiento.", "danger");
                return;
            }
            
            const activeUser = getActiveUser();
            
            const newMov = {
                id_movimiento: "MOVM-" + Math.floor(Date.now() / 1000).toString().substring(4),
                id_sesion: activeSession.id_sesion,
                tipo: tipo,
                monto: monto,
                motivo: motivo,
                timestamp: Date.now(),
                usuario: activeUser.Email || "jjmunoz932@gmail.com"
            };
            
            db.caja_movimientos.unshift(newMov);
            
            // Adjust egresos on session metadata if SALIDA
            if (tipo === 'SALIDA') {
                activeSession.saldo_egresos = (activeSession.saldo_egresos || 0) + monto;
            }
            
            saveDatabase(db);
            showToast("Movimiento de caja registrado exitosamente.", "success");
            closeModal();
            renderActiveSessionTab();
        });
    }
    
    // Modal for cash closure (Corte Diario)
    function openCajaCierreModal(expectedCash) {
        const modalId = 'caja-cierre-modal';
        let modal = document.getElementById(modalId);
        if (modal) modal.remove();
        
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal-backdrop active';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:9999;';
        
        modal.innerHTML = html`
            <div class="modal-card" style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-lg); width:95%; max-width:420px; padding:1.5rem; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
                    <h4 style="margin:0;"><i class="fa-solid fa-lock" style="color:var(--danger);"></i> Hacer Corte y Cierre de Caja</h4>
                    <button class="btn-close" style="background:none; border:none; color:var(--text-secondary); font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div style="background:rgba(239,35,60,0.03); border:1px solid rgba(239,35,60,0.1); border-radius:var(--radius-md); padding:0.8rem; font-size:0.8rem; margin-bottom:1.25rem;">
                    <p style="margin:0; font-weight:600; color:var(--danger);">Total Teórico en Efectivo: $ ${expectedCash.toFixed(2)}</p>
                    <p style="margin:0.25rem 0 0; color:var(--text-secondary);">Por favor cuente físicamente el efectivo en caja e ingrese la cantidad real a continuación.</p>
                </div>
                
                <div class="form-group" style="margin-bottom:1rem;">
                    <label style="font-size:0.8rem; display:block; margin-bottom:0.4rem; color:var(--text-secondary);">Monto Real Contado ($)</label>
                    <div style="position:relative;">
                        <span style="position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); font-weight:600; color:var(--text-secondary); font-size:0.9rem;">$</span>
                        <input type="number" id="cierre-monto-real" class="form-control" style="padding-left:1.75rem; width:100%; font-weight:700; color:var(--cyan);" step="0.01" value="${expectedCash.toFixed(2)}" required>
                    </div>
                </div>
                
                <div class="form-group" style="margin-bottom:1.5rem;">
                    <label style="font-size:0.8rem; display:block; margin-bottom:0.4rem; color:var(--text-secondary);">Comentarios y Conciliación</label>
                    <textarea id="cierre-comentarios" class="form-control" style="width:100%; height:70px; resize:none;" placeholder="E.g. Diferencia de $0.05 por redondeo en vueltos. Todo en orden."></textarea>
                </div>
                
                <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
                    <button class="btn btn-secondary btn-cancel" style="padding:0.5rem 1rem;">Cancelar</button>
                    <button class="btn btn-danger btn-confirm" style="padding:0.5rem 1rem; font-weight:600;">Confirmar y Cerrar Turno</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeModal = () => modal.remove();
        modal.querySelector('.btn-close').addEventListener('click', closeModal);
        modal.querySelector('.btn-cancel').addEventListener('click', closeModal);
        
        modal.querySelector('.btn-confirm').addEventListener('click', () => {
            const realCash = parseFloat(modal.querySelector('#cierre-monto-real').value || 0);
            const comentarios = modal.querySelector('#cierre-comentarios').value.trim();
            
            if (isNaN(realCash) || realCash < 0) {
                showToast("Por favor ingrese un monto real válido.", "danger");
                return;
            }
            
            const activeUser = getActiveUser();
            const diferencia = realCash - expectedCash;
            
            // Mutate activeSession to closed
            activeSession.estado = "CERRADA";
            activeSession.fecha_cierre = Date.now();
            activeSession.usuario_cierre = activeUser.Email || "jjmunoz932@gmail.com";
            activeSession.saldo_real = realCash;
            activeSession.diferencia = diferencia;
            activeSession.comentarios = comentarios;
            
            // Save database
            saveDatabase(db);
            showToast("¡Turno de Caja Cerrado Exitosamente!", "success");
            
            // Nullify local pointer so reopening works
            activeSession = null;
            
            closeModal();
            renderActiveSessionTab();
        });
    }
    
    function renderHistoryCutsTab() {
        const closedSessions = db.cajas_sesiones.filter(s => s.estado === 'CERRADA');
        
        if (closedSessions.length === 0) {
            tabContent.innerHTML = html`
                <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                    <i class="fa-solid fa-folder-open" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <p>No se encontraron cortes de caja anteriores registrados en la base de datos.</p>
                </div>
            `;
            return;
        }
        
        tabContent.innerHTML = html`
            <div class="glass-card" style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1rem; background:rgba(255,255,255,0.01);">
                <h4 style="margin-bottom:1rem; font-size:1rem; display:flex; align-items:center; gap:0.5rem;">
                    <i class="fa-solid fa-receipt" style="color:var(--primary);"></i> Historial de Cortes de Caja Diarios
                </h4>
                
                <div style="overflow-x:auto;">
                    <table class="table" style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                        <thead>
                            <tr style="border-bottom:1px solid var(--border-color); text-align:left; color:var(--text-secondary);">
                                <th style="padding:0.75rem 0.5rem;">Sesión</th>
                                <th style="padding:0.75rem 0.5rem;">Apertura</th>
                                <th style="padding:0.75rem 0.5rem;">Cierre</th>
                                <th style="padding:0.75rem 0.5rem; text-align:right;">Inicial</th>
                                <th style="padding:0.75rem 0.5rem; text-align:right;">Real Contado</th>
                                <th style="padding:0.75rem 0.5rem; text-align:right;">Diferencia</th>
                                <th style="padding:0.75rem 0.5rem; text-align:center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${
                                safe(closedSessions.map(s => {
                                    const diff = s.diferencia || 0;
                                    let diffColor = 'var(--text-primary)';
                                    if (diff > 0.01) diffColor = 'var(--success)';
                                    if (diff < -0.01) diffColor = 'var(--danger)';
                                    
                                    return `
                                        <tr style="border-bottom:1px solid var(--border-color);">
                                            <td style="padding:0.65rem 0.5rem; font-weight:600;"><code style="color:var(--cyan);">${s.id_sesion}</code></td>
                                            <td style="padding:0.65rem 0.5rem; font-size:0.8rem;">
                                                <div>${new Date(s.fecha_apertura).toLocaleDateString('es-SV')}</div>
                                                <div style="color:var(--text-secondary); font-size:0.7rem;">Por: ${s.usuario_apertura.split('@')[0]}</div>
                                            </td>
                                            <td style="padding:0.65rem 0.5rem; font-size:0.8rem;">
                                                <div>${new Date(s.fecha_cierre).toLocaleDateString('es-SV')}</div>
                                                <div style="color:var(--text-secondary); font-size:0.7rem;">Por: ${s.usuario_cierre.split('@')[0]}</div>
                                            </td>
                                            <td style="padding:0.65rem 0.5rem; text-align:right; font-weight:600;">$ ${s.saldo_inicial.toFixed(2)}</td>
                                            <td style="padding:0.65rem 0.5rem; text-align:right; font-weight:700; color:var(--cyan);">$ ${s.saldo_real.toFixed(2)}</td>
                                            <td style="padding:0.65rem 0.5rem; text-align:right; font-weight:700; color:${diffColor};">
                                                ${diff > 0.01 ? '+' : ''}$ ${diff.toFixed(2)}
                                            </td>
                                            <td style="padding:0.65rem 0.5rem; text-align:center;">
                                                <button class="btn btn-secondary btn-print-corte" data-session-id="${s.id_sesion}" style="padding:0.3rem 0.6rem; font-size:0.75rem;">
                                                    <i class="fa-solid fa-print"></i> Imprimir Ticket
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join(''))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Print ticket handlers
        tabContent.querySelectorAll('.btn-print-corte').forEach(btn => {
            btn.addEventListener('click', () => {
                const sId = btn.getAttribute('data-session-id');
                printCorteTicket(sId);
            });
        });
    }
    
    function renderMonthlyConsolidationTab() {
        // Group closed sessions and payments by month
        const monthlyData = {};
        
        db.cajas_sesiones.filter(s => s.estado === 'CERRADA').forEach(s => {
            const dateObj = new Date(s.fecha_apertura);
            const monthKey = dateObj.toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });
            
            monthlyData[monthKey] = monthlyData[monthKey] || {
                aperturas: 0,
                inicialTotal: 0,
                realTotal: 0,
                diferencias: 0,
                ingresosMetodo: { EFECTIVO: 0, TARJETA: 0, TRANSFERENCIA: 0 },
                egresosManuales: 0
            };
            
            monthlyData[monthKey].aperturas += 1;
            monthlyData[monthKey].inicialTotal += s.saldo_inicial;
            monthlyData[monthKey].realTotal += s.saldo_real;
            monthlyData[monthKey].diferencias += s.diferencia;
            monthlyData[monthKey].egresosManuales += (s.saldo_egresos || 0);
            
            // Gather all payments under this session
            const sPayments = db.pagos.filter(p => p.id_sesion === s.id_sesion && p["Estado Pago"] === "COMPLETADO");
            sPayments.forEach(p => {
                const method = p["Metodo Pago"] || 'EFECTIVO';
                monthlyData[monthKey].ingresosMetodo[method] = (monthlyData[monthKey].ingresosMetodo[method] || 0) + parseFloat(p["Monto Pago"] || 0);
            });
        });
        
        const monthKeys = Object.keys(monthlyData);
        if (monthKeys.length === 0) {
            tabContent.innerHTML = html`
                <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                    <i class="fa-solid fa-chart-pie" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                    <p>No hay datos suficientes para realizar conciliación mensual.</p>
                </div>
            `;
            return;
        }
        
        tabContent.innerHTML = html`
            <div style="display:flex; flex-direction:column; gap:1.25rem;">
                ${
                    safe(monthKeys.map(key => {
                        const data = monthlyData[key];
                        const totalSales = data.ingresosMetodo.EFECTIVO + data.ingresosMetodo.TARJETA + data.ingresosMetodo.TRANSFERENCIA;
                        return `
                            <div class="glass-card" style="border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem; background:rgba(255,255,255,0.01);">
                                <h4 style="margin:0 0 1rem 0; font-size:1.1rem; color:var(--primary); text-transform:capitalize; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center;">
                                    <span><i class="fa-solid fa-calendar"></i> ${key}</span>
                                    <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:normal;">${data.aperturas} cortes diarios consolidados</span>
                                </h4>
                                
                                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
                                    <div>
                                        <h5 style="margin:0 0 0.5rem; color:var(--text-secondary); font-size:0.8rem;">Resumen de Ingresos</h5>
                                        <div style="display:flex; flex-direction:column; gap:0.3rem; font-size:0.8rem;">
                                            <div style="display:flex; justify-content:space-between;"><span>Ventas en Efectivo:</span><strong>$ ${data.ingresosMetodo.EFECTIVO.toFixed(2)}</strong></div>
                                            <div style="display:flex; justify-content:space-between;"><span>Ventas con Tarjeta:</span><strong>$ ${data.ingresosMetodo.TARJETA.toFixed(2)}</strong></div>
                                            <div style="display:flex; justify-content:space-between;"><span>Ventas por Transferencia:</span><strong>$ ${data.ingresosMetodo.TRANSFERENCIA.toFixed(2)}</strong></div>
                                            <div style="display:flex; justify-content:space-between; border-top:1px dashed var(--border-color); padding-top:0.3rem; font-weight:600; color:var(--success);"><span>Total Facturado:</span><span>$ ${totalSales.toFixed(2)}</span></div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h5 style="margin:0 0 0.5rem; color:var(--text-secondary); font-size:0.8rem;">Egresos de Caja</h5>
                                        <div style="display:flex; flex-direction:column; gap:0.3rem; font-size:0.8rem;">
                                            <div style="display:flex; justify-content:space-between;"><span>Retiros Manuales / Gastos:</span><strong>$ ${data.egresosManuales.toFixed(2)}</strong></div>
                                            <div style="display:flex; justify-content:space-between; font-weight:600; color:var(--danger); border-top:1px dashed var(--border-color); padding-top:0.3rem;"><span>Total Egresos:</span><span>$ ${data.egresosManuales.toFixed(2)}</span></div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h5 style="margin:0 0 0.5rem; color:var(--text-secondary); font-size:0.8rem;">Conciliación Financiera</h5>
                                        <div style="display:flex; flex-direction:column; gap:0.3rem; font-size:0.8rem;">
                                            <div style="display:flex; justify-content:space-between;"><span>Saldo Real Depositado:</span><strong>$ ${data.realTotal.toFixed(2)}</strong></div>
                                            <div style="display:flex; justify-content:space-between;"><span>Fondo Inicial Acumulado:</span><strong>$ ${data.inicialTotal.toFixed(2)}</strong></div>
                                            <div style="display:flex; justify-content:space-between; border-top:1px dashed var(--border-color); padding-top:0.3rem; font-weight:700; color:${data.diferencias >= 0 ? 'var(--success)' : 'var(--danger)'};">
                                                <span>Faltante / Sobrante Neto:</span>
                                                <span>${data.diferencias >= 0 ? '+' : ''}$ ${data.diferencias.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join(''))
                }
            </div>
        `;
    }
    
    // Render ticket popup
    function printCorteTicket(sessionId) {
        const s = db.cajas_sesiones.find(session => session.id_sesion === sessionId);
        if (!s) return;
        
        const sPayments = db.pagos.filter(p => p.id_sesion === s.id_sesion && p["Estado Pago"] === "COMPLETADO");
        const sManualMovs = db.caja_movimientos.filter(m => m.id_sesion === s.id_sesion);
        
        const totalCashIn = sPayments.filter(p => p["Metodo Pago"] === "EFECTIVO").reduce((acc, p) => acc + parseFloat(p["Monto Pago"] || 0), 0);
        const totalCardIn = sPayments.filter(p => p["Metodo Pago"] === "TARJETA").reduce((acc, p) => acc + parseFloat(p["Monto Pago"] || 0), 0);
        const totalTransfersIn = sPayments.filter(p => p["Metodo Pago"] === "TRANSFERENCIA").reduce((acc, p) => acc + parseFloat(p["Monto Pago"] || 0), 0);
        
        const totalManualIn = sManualMovs.filter(m => m.tipo === "ENTRADA").reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);
        const totalManualOut = sManualMovs.filter(m => m.tipo === "SALIDA").reduce((acc, m) => acc + parseFloat(m.monto || 0), 0);
        
        const expectedCash = s.saldo_inicial + totalCashIn + totalManualIn - totalManualOut;
        const totalOtherIn = totalCardIn + totalTransfersIn;
        const ws = (db.saas_state && db.saas_state.workshopData) || {};
        
        const ticketWindow = window.open("", "Corte de Caja", "width=400,height=600");
        ticketWindow.document.write(`
            <html>
            <head>
                <title>Corte de Caja - ${s.id_sesion}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        color: #000;
                        background: #fff;
                        padding: 20px;
                        width: 300px;
                        margin: 0 auto;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .header { margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                    .title { font-size: 16px; font-weight: bold; }
                    .subtitle { font-size: 11px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
                    .bold { font-weight: bold; }
                    .footer { margin-top: 30px; font-size: 10px; }
                    .sign-box { margin-top: 50px; display: flex; justify-content: space-between; }
                    .sign-line { border-top: 1px solid #000; width: 120px; text-align: center; padding-top: 5px; font-size: 10px; }
                    
                    @media print {
                        body {
                            padding: 10px !important;
                            margin: 0 !important;
                            width: 100% !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        @page {
                            margin: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header text-center">
                    <div class="title">${ws.name || 'Mecanic-OS'}</div>
                    <div class="subtitle">${ws.address || 'El Salvador'}</div>
                    <div class="subtitle">Tel: ${ws.phone || 'N/A'}</div>
                    <div class="divider"></div>
                    <div class="bold">COMPROBANTE DE CORTE DIARIO</div>
                    <div>Caja: ${s.id_sesion}</div>
                </div>
                
                <div class="row"><span>Fecha Apertura:</span><span>${new Date(s.fecha_apertura).toLocaleString('es-SV')}</span></div>
                <div class="row"><span>Fecha Cierre:</span><span>${new Date(s.fecha_cierre).toLocaleString('es-SV')}</span></div>
                <div class="row"><span>Cajero Apertura:</span><span>${s.usuario_apertura.split('@')[0]}</span></div>
                <div class="row"><span>Cajero Cierre:</span><span>${s.usuario_cierre.split('@')[0]}</span></div>
                
                <div class="divider"></div>
                
                <div class="row bold"><span>FONDO INICIAL:</span><span>$ ${s.saldo_inicial.toFixed(2)}</span></div>
                <div class="row"><span>(+) Efectivo Ventas:</span><span>$ ${totalCashIn.toFixed(2)}</span></div>
                <div class="row"><span>(+) Entradas Manuales:</span><span>$ ${totalManualIn.toFixed(2)}</span></div>
                <div class="row"><span>(-) Egresos/Retiros:</span><span>$ ${totalManualOut.toFixed(2)}</span></div>
                
                <div class="row bold"><span>(=) EFECTIVO TEÓRICO:</span><span>$ ${expectedCash.toFixed(2)}</span></div>
                <div class="row bold"><span>(=) EFECTIVO REAL:</span><span>$ ${s.saldo_real.toFixed(2)}</span></div>
                
                <div class="divider"></div>
                
                <div class="row bold"><span>DIFERENCIA:</span><span>$ ${(s.diferencia || 0).toFixed(2)}</span></div>
                
                <div class="divider"></div>
                
                <div class="bold">OTROS MEDIOS (NO EFECTIVO)</div>
                <div class="row"><span>Tarjeta:</span><span>$ ${totalCardIn.toFixed(2)}</span></div>
                <div class="row"><span>Transferencias:</span><span>$ ${totalTransfersIn.toFixed(2)}</span></div>
                
                <div class="divider"></div>
                
                <div class="bold">Comentarios:</div>
                <div style="font-style: italic; margin-top: 5px; word-break: break-all;">${s.comentarios || 'Sin observaciones'}</div>
                
                <div class="sign-box">
                    <div class="sign-line">Firma Cajero</div>
                    <div class="sign-line">Firma Supervisor</div>
                </div>
                
                <div class="footer text-center">
                    <div class="divider"></div>
                    <p>Mecanic-OS - Control de Caja</p>
                    <p>Fecha Impresión: ${new Date().toLocaleString('es-SV')}</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `);
        ticketWindow.document.close();
    }
}

// 8. CUENTAS POR COBRAR VIEW


