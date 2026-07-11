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
    downloadExcelReport
} from '../utils.js?v=69';

export function renderComisiones(container, queryParams) {
    const db = getDatabase();
    const currentUser = getActiveUser();
    const role = currentUser ? currentUser.Nivel_Acceso : 'Técnico';
    
    // Auto-create payments array if it doesn't exist
    if (!db.pagos_comisiones) db.pagos_comisiones = [];

    // Check if user is Admin
    const isAdmin = role === 'Administrador';
    
    // Active technician ID for detail view
    let activeTechId = null;
    
    if (isAdmin) {
        // Default to first technician in list if any
        if (db.tecnicos && db.tecnicos.length > 0) {
            activeTechId = db.tecnicos[0].Tecnico_ID;
        }
    } else {
        // If not admin, lock to current user's technician ID
        const matchedTech = db.tecnicos.find(t => t.Tecnico_ID === currentUser.Tecnico_ID || (t.Email && String(t.Email).toLowerCase() === String(currentUser.Email || '').toLowerCase()));
        if (matchedTech) {
            activeTechId = matchedTech.Tecnico_ID;
        } else if (db.tecnicos && db.tecnicos.length > 0) {
            // Fallback if not mapped
            activeTechId = db.tecnicos[0].Tecnico_ID;
        }
    }
    
    // Helper to format local date YYYY-MM-DD
    const formatLocalYYYYMMDD = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayObj = new Date();
    const firstDayOfMonth = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);
    
    const defaultStart = formatLocalYYYYMMDD(firstDayOfMonth);
    const defaultEnd = formatLocalYYYYMMDD(todayObj);

    let startTime = new Date(defaultStart + 'T00:00:00').getTime();
    let endTime = new Date(defaultEnd + 'T23:59:59').getTime();

    let adminListPanelHtml = '';
    if (isAdmin) {
        adminListPanelHtml = `
            <!-- Admin List Panel -->
            <div class="glass-card list-panel" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary);"><i class="fa-solid fa-users-gear"></i> Lista de Técnicos</h3>
                </div>
                <div class="search-bar-container" style="max-width: 100%; margin: 0;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="tech-search" placeholder="Buscar técnico por nombre...">
                </div>
                <div class="scrollable-list" id="tech-list-container" style="max-height: 480px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; padding-right: 0.25rem;">
                    <!-- Dynamically filled -->
                </div>
            </div>
        `;
    }

    // Main HTML Layout
    container.innerHTML = html`
        <div id="comisiones-workspace" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Date Filter -->
            <div class="glass-card" style="display: flex; gap: 1rem; align-items: center; padding: 0.75rem 1.25rem; border-radius: 8px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label for="comm-date-start" style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Desde:</label>
                    <input type="date" id="comm-date-start" value="${defaultStart}" style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; padding: 0.35rem 0.6rem; font-size: 0.85rem; outline: none; font-family: inherit;">
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <label for="comm-date-end" style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">Hasta:</label>
                    <input type="date" id="comm-date-end" value="${defaultEnd}" style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; padding: 0.35rem 0.6rem; font-size: 0.85rem; outline: none; font-family: inherit;">
                </div>
                <button class="btn btn-primary" id="btn-filter-comm-dates" style="padding: 0.35rem 1rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
                    <i class="fa-solid fa-filter"></i> Filtrar
                </button>
                <button class="btn btn-secondary" id="btn-clear-comm-dates" style="padding: 0.35rem 1rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.35rem;">
                    <i class="fa-solid fa-rotate-left"></i> Todo
                </button>
            </div>

            <!-- Metrics Cards -->
            <div class="dashboard-stats" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; display: grid; width: 100%;">
                <div class="glass-card stat-card" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05)); border: 1px solid rgba(99, 102, 241, 0.2); display: flex; justify-content: space-between; padding: 1.25rem; border-radius: var(--radius-md);">
                    <div class="stat-info" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <span class="stat-label" style="font-size: 0.85rem; color: var(--text-secondary);">Comisiones Generadas (Filtrado)</span>
                        <span class="stat-value" id="metric-generated" style="color: var(--cyan); font-weight: 700; font-size: 1.8rem;">$ 0.00</span>
                    </div>
                    <div class="stat-icon" style="color: var(--cyan); background: rgba(0, 242, 254, 0.15); display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--radius-sm); font-size: 1.25rem;"><i class="fa-solid fa-calculator"></i></div>
                </div>
                <div class="glass-card stat-card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05)); border: 1px solid rgba(16, 185, 129, 0.2); display: flex; justify-content: space-between; padding: 1.25rem; border-radius: var(--radius-md);">
                    <div class="stat-info" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <span class="stat-label" style="font-size: 0.85rem; color: var(--text-secondary);">Comisiones Pagadas (Filtrado)</span>
                        <span class="stat-value" id="metric-paid" style="color: var(--success); font-weight: 700; font-size: 1.8rem;">$ 0.00</span>
                    </div>
                    <div class="stat-icon" style="color: var(--success); background: rgba(16, 185, 129, 0.15); display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--radius-sm); font-size: 1.25rem;"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                </div>
                <div class="glass-card stat-card" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05)); border: 1px solid rgba(245, 158, 11, 0.2); display: flex; justify-content: space-between; padding: 1.25rem; border-radius: var(--radius-md);">
                    <div class="stat-info" style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <span class="stat-label" style="font-size: 0.85rem; color: var(--text-secondary);">Saldo Pendiente (Acumulado)</span>
                        <span class="stat-value" id="metric-pending" style="color: var(--warning); font-weight: 700; font-size: 1.8rem;">$ 0.00</span>
                    </div>
                    <div class="stat-icon" style="color: var(--warning); background: rgba(245, 158, 11, 0.15); display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--radius-sm); font-size: 1.25rem;"><i class="fa-solid fa-sack-dollar"></i></div>
                </div>
            </div>

            <!-- Main Panels -->
            <div class="master-detail-container" style="display: grid; grid-template-columns: ${isAdmin ? '1.2fr 1.8fr' : '1fr'}; gap: 1.5rem;">
                ${safe(adminListPanelHtml)}

                <!-- Detail Panel -->
                <div class="glass-card detail-panel" id="tech-detail-panel" style="padding: 1.5rem; min-height: 450px; display: flex; flex-direction: column; gap: 1.5rem;">
                    <!-- Dynamically filled -->
                </div>
            </div>
        </div>
    `;

    // References
    const metricGenerated = document.getElementById('metric-generated');
    const metricPaid = document.getElementById('metric-paid');
    const metricPending = document.getElementById('metric-pending');
    const techListContainer = document.getElementById('tech-list-container');
    const techDetailPanel = document.getElementById('tech-detail-panel');
    const techSearch = document.getElementById('tech-search');
    const dateStartInput = document.getElementById('comm-date-start');
    const dateEndInput = document.getElementById('comm-date-end');
    const btnFilterDates = document.getElementById('btn-filter-comm-dates');
    const btnClearDates = document.getElementById('btn-clear-comm-dates');

    // Helper: calculate stats for a technician
    function calculateTechStats(tId) {
        const t = db.tecnicos.find(x => x.Tecnico_ID === tId);
        if (!t) return { generated: 0, paid: 0, pending: 0, jobs: [] };

        let generatedAllTime = 0;
        let generatedFiltered = 0;
        const jobs = [];

        if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
        if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

        const config = getWorkshopConfig(db);
        const tipoComision = config.tipo_comision || 'general';

        // Loop through all budgets in state 3 (Facturado) where technician worked
        const facturados = db.presupuestos.filter(p => {
            if (p.Estado != 3) return false;
            
            const useDetailedModel = (tipoComision === 'detallada' && p.Tipo_Comision === 'detallada');

            if (useDetailedModel) {
                const pProds = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === p['ID Presupuesto']);
                const pLabor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === p['ID Presupuesto']);
                
                const hasProd = pProds.some(dp => dp.Tecnico_ID === tId);
                if (hasProd) return true;
                const hasLabor = pLabor.some(dm => dm.Tecnico_ID === tId);
                if (hasLabor) return true;
                return false;
            } else {
                return p.Tecnico_Asignado === tId;
            }
        });
        
        facturados.forEach(p => {
            const commInfo = getBudgetCommissions(p, t, db);
            if (commInfo.totalCommission > 0) {
                generatedAllTime += commInfo.totalCommission;
                
                const budgetTime = p.Fecha_Facturacion ? new Date(p.Fecha_Facturacion).getTime() : new Date(p.Fecha).getTime();
                if (budgetTime >= startTime && budgetTime <= endTime) {
                    generatedFiltered += commInfo.totalCommission;
                    jobs.push({
                        budget: p,
                        laborSub: commInfo.sumLab,
                        prodSub: commInfo.sumProd,
                        laborComm: commInfo.laborCommission,
                        prodComm: commInfo.productCommission,
                        totalComm: commInfo.totalCommission
                    });
                }
            }
        });

        // Sum payments from pagos_comisiones
        const paymentsAll = (db.pagos_comisiones || []).filter(p => p.Tecnico_ID === tId);
        const paidAllTime = paymentsAll.reduce((sum, pay) => sum + parseFloat(pay.Monto || 0), 0);
        const paidFiltered = paymentsAll
            .filter(pay => {
                const payTime = pay.Fecha;
                return payTime >= startTime && payTime <= endTime;
            })
            .reduce((sum, pay) => sum + parseFloat(pay.Monto || 0), 0);
            
        // Pending balance is ALWAYS historical (all-time) so we don't ignore prior debts
        const pending = Math.max(0, generatedAllTime - paidAllTime);

        return {
            generated: generatedFiltered,
            paid: paidFiltered,
            pending: pending,
            jobs,
            payments: paymentsAll.filter(pay => {
                const payTime = pay.Fecha;
                return payTime >= startTime && payTime <= endTime;
            })
        };
    }

    // Refresh overall metric cards
    function refreshOverallMetrics() {
        let totalGenerated = 0;
        let totalPaid = 0;

        if (isAdmin) {
            // Sum stats for all technicians
            db.tecnicos.forEach(t => {
                const stats = calculateTechStats(t.Tecnico_ID);
                totalGenerated += stats.generated;
                totalPaid += stats.paid;
            });
        } else if (activeTechId) {
            // Sum stats for active technician only
            const stats = calculateTechStats(activeTechId);
            totalGenerated = stats.generated;
            totalPaid = stats.paid;
        }

        const totalPending = Math.max(0, totalGenerated - totalPaid);

        metricGenerated.textContent = `$ ${totalGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        metricPaid.textContent = `$ ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        metricPending.textContent = `$ ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Populate Technicians List (Admin view only)
    function populateTechList(filter = '') {
        if (!techListContainer) return;
        techListContainer.innerHTML = '';

        const filtered = db.tecnicos.filter(t => 
            String(t.Nombre_Completo || '').toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            techListContainer.innerHTML = html`<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No se encontraron técnicos.</div>`;
            return;
        }

        filtered.forEach(t => {
            const stats = calculateTechStats(t.Tecnico_ID);
            const isSelected = t.Tecnico_ID === activeTechId;

            const card = document.createElement('div');
            card.className = `tech-item-card ${isSelected ? 'active' : ''}`;
            card.style.cssText = `
                padding: 1rem;
                background: ${isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.01)'};
                border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'};
                border-radius: var(--radius-md);
                cursor: pointer;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                transition: all 0.2s;
            `;

            card.innerHTML = html`
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color: ${isSelected ? 'var(--primary)' : 'var(--text-primary)'};">${t.Nombre_Completo}</strong>
                    <span style="font-size:0.75rem; color:var(--text-secondary); background:rgba(255,255,255,0.05); padding:0.15rem 0.4rem; border-radius:10px;">${t.Especialidad || 'Mecánico'}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-secondary);">
                    <span>Comisión MO/Rep: <strong>${t.Comision_Servicios !== undefined ? t.Comision_Servicios : 10}% / ${t.Comision_Productos !== undefined ? t.Comision_Productos : 0}%</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-top:0.25rem;">
                    <span>Saldo Pendiente:</span>
                    <strong style="color: ${stats.pending > 0 ? 'var(--warning)' : 'var(--success)'};">$ ${stats.pending.toFixed(2)}</strong>
                </div>
            `;

            card.addEventListener('click', () => {
                activeTechId = t.Tecnico_ID;
                populateTechList(filter);
                renderDetailPanel();
                refreshOverallMetrics();
            });

            techListContainer.appendChild(card);
        });
    }

    // Render Detail Panel for Active Technician
    function renderDetailPanel() {
        const t = db.tecnicos.find(x => x.Tecnico_ID === activeTechId);
        if (!t) {
            techDetailPanel.innerHTML = html`
                <div style="text-align: center; padding: 6rem 1rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-user-slash" style="font-size: 4rem; color: var(--border-color); margin-bottom: 1.5rem;"></i>
                    <h3>Selecciona un técnico de la lista</h3>
                    <p>Para ver su expediente detallado de comisiones y pagos.</p>
                </div>
            `;
            return;
        }

        const stats = calculateTechStats(t.Tecnico_ID);
        
        let adminButtonHtml = '';
        if (isAdmin) {
            adminButtonHtml = `
                <button class="btn btn-success" id="btn-register-payment" style="display:inline-flex; align-items:center; gap:0.35rem;">
                    <i class="fa-solid fa-money-bill-wave"></i> Registrar Pago de Comisión
                </button>
            `;
        }

        techDetailPanel.innerHTML = html`
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem; flex-wrap:wrap; gap:1rem;">
                <div>
                    <h2 style="margin:0; font-size:1.4rem; color:var(--primary);">${t.Nombre_Completo}</h2>
                    <p style="margin:0.2rem 0 0 0; font-size:0.85rem; color:var(--text-secondary);">${t.Especialidad || 'Mecánico General'} • Salario Base: $ ${parseFloat(t.Salario_Base).toFixed(2)}</p>
                </div>
                ${safe(adminButtonHtml)}
            </div>

            <!-- Detail Tabs -->
            <div class="detail-tabs-container" style="display:flex; border-bottom:1px solid var(--border-color); margin-bottom:1rem;">
                <button class="detail-tab-btn active" id="detail-tab-jobs" style="background:none; border:none; padding:0.5rem 1rem; color:var(--text-primary); border-bottom:2px solid var(--primary); font-weight:600; cursor:pointer;">
                    <i class="fa-solid fa-list-check"></i> Trabajos Realizados (${stats.jobs.length})
                </button>
                <button class="detail-tab-btn" id="detail-tab-history" style="background:none; border:none; padding:0.5rem 1rem; color:var(--text-secondary); font-weight:600; cursor:pointer;">
                    <i class="fa-solid fa-receipt"></i> Historial de Pagos (${stats.payments.length})
                </button>
            </div>

            <!-- Tab Content -->
            <div id="detail-tab-content">
                <!-- Loaded dynamically -->
            </div>
        `;

        const tabJobs = document.getElementById('detail-tab-jobs');
        const tabHistory = document.getElementById('detail-tab-history');
        const tabContent = document.getElementById('detail-tab-content');
        const btnPayment = document.getElementById('btn-register-payment');

        if (btnPayment) {
            btnPayment.addEventListener('click', () => {
                openRegisterPaymentModal(t, stats.pending);
            });
        }

        function switchDetailTab(activeTab) {
            tabJobs.classList.remove('active');
            tabJobs.style.color = 'var(--text-secondary)';
            tabJobs.style.borderBottom = 'none';

            tabHistory.classList.remove('active');
            tabHistory.style.color = 'var(--text-secondary)';
            tabHistory.style.borderBottom = 'none';

            if (activeTab === 'jobs') {
                tabJobs.classList.add('active');
                tabJobs.style.color = 'var(--text-primary)';
                tabJobs.style.borderBottom = '2px solid var(--primary)';
                renderJobsTabContent(tabContent, stats.jobs, t);
            } else {
                tabHistory.classList.add('active');
                tabHistory.style.color = 'var(--text-primary)';
                tabHistory.style.borderBottom = '2px solid var(--primary)';
                renderPaymentsTabContent(tabContent, stats.payments, t);
            }
        }

        tabJobs.addEventListener('click', () => switchDetailTab('jobs'));
        tabHistory.addEventListener('click', () => switchDetailTab('history'));

        // Initial tab load
        switchDetailTab('jobs');
    }

    // Render Jobs Tab Content
    function renderJobsTabContent(container, jobs, tech) {
        if (jobs.length === 0) {
            container.innerHTML = html`
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; color: var(--border-color);"></i>
                    No hay trabajos facturados registrados para este técnico.
                </div>
            `;
            return;
        }

        let rowsHtml = '';
        jobs.forEach(job => {
            const p = job.budget;
            const dateStr = p.Fecha_Facturacion ? new Date(p.Fecha_Facturacion).toLocaleDateString('es-SV') : new Date().toLocaleDateString('es-SV');
            rowsHtml += `
                <tr>
                    <td><a href="#presupuestos?id=${p['ID Presupuesto']}" style="color:var(--primary); font-weight:600; text-decoration:underline;">${p['ID Presupuesto']}</a></td>
                    <td>${dateStr}</td>
                    <td>${p.Nombre}</td>
                    <td><span class="badge-tag badge-primary">${p.Placas || 'N/A'}</span></td>
                    <td>$ ${job.laborSub.toFixed(2)}</td>
                    <td>$ ${job.prodSub.toFixed(2)}</td>
                    <td>$ ${job.laborComm.toFixed(2)} <span style="font-size:0.75rem; color:var(--text-secondary);">(${tech.Comision_Servicios !== undefined ? tech.Comision_Servicios : 10}%)</span></td>
                    <td>$ ${job.prodComm.toFixed(2)} <span style="font-size:0.75rem; color:var(--text-secondary);">(${tech.Comision_Productos !== undefined ? tech.Comision_Productos : 0}%)</span></td>
                    <td style="color:var(--cyan); font-weight:700;">$ ${job.totalComm.toFixed(2)}</td>
                </tr>
            `;
        });

        container.innerHTML = html`
            <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>Código Presupuesto</th>
                            <th>Fecha Facturación</th>
                            <th>Cliente</th>
                            <th>Placas</th>
                            <th>Mano de Obra ($)</th>
                            <th>Repuestos ($)</th>
                            <th>Comisión MO ($)</th>
                            <th>Comisión Rep ($)</th>
                            <th>Total Comisión ($)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${safe(rowsHtml)}
                    </tbody>
                </table>
            </div>
        `;
    }

    // Render Payments Tab Content
    function renderPaymentsTabContent(container, payments, tech) {
        if (payments.length === 0) {
            container.innerHTML = html`
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-receipt" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; color: var(--border-color);"></i>
                    No se han registrado pagos para este técnico aún.
                </div>
            `;
            return;
        }

        let rowsHtml = '';
        payments.forEach(pay => {
            const dateStr = pay.Fecha ? new Date(pay.Fecha).toLocaleString('es-SV') : 'N/A';
            rowsHtml += `
                <tr>
                    <td><strong>${pay.ID_Pago_Comision}</strong></td>
                    <td>${dateStr}</td>
                    <td style="color:var(--success); font-weight:700;">$ ${parseFloat(pay.Monto).toFixed(2)}</td>
                    <td>${pay.Observaciones || 'Sin observaciones'}</td>
                    <td>${pay.RegistradoPor || 'Admin'}</td>
                    <td>
                        <button class="btn btn-secondary btn-sm btn-print-recibo" data-id="${pay.ID_Pago_Comision}" style="padding:0.25rem 0.5rem; font-size:0.75rem; display:inline-flex; align-items:center; gap:0.25rem;"><i class="fa-solid fa-print"></i> Recibo</button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = html`
            <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                <table>
                    <thead>
                        <tr>
                            <th>ID Recibo</th>
                            <th>Fecha/Hora</th>
                            <th>Monto Pagado ($)</th>
                            <th>Observaciones</th>
                            <th>Registrado Por</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${safe(rowsHtml)}
                    </tbody>
                </table>
            </div>
        `;

        // Bind print receipt buttons
        container.querySelectorAll('.btn-print-recibo').forEach(btn => {
            btn.addEventListener('click', () => {
                const payId = btn.getAttribute('data-id');
                const payment = payments.find(x => x.ID_Pago_Comision === payId);
                if (payment) {
                    printCommissionReceipt(payment, tech);
                }
            });
        });
    }

    // Open Modal to Register Commission Payment
    function openRegisterPaymentModal(tech, pendingBalance) {
        if (pendingBalance <= 0) {
            showToast("El técnico no tiene saldo pendiente por pagar.", "warning");
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = html`
            <div class="modal-content glass-card" style="max-width: 500px; padding: 1.5rem;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h2>Registrar Pago de Comisión</h2>
                    <button class="close-modal-btn" id="close-pay-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                <form id="pay-commission-form" style="display:flex; flex-direction:column; gap:1rem;">
                    <div class="form-group">
                        <label>Técnico</label>
                        <input type="text" value="${tech.Nombre_Completo}" readonly style="background-color: var(--border-color); color: var(--text-primary); cursor: not-allowed; width: 100%; padding: 0.6rem;">
                    </div>
                    
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Saldo Pendiente ($)</label>
                            <input type="text" value="$ ${pendingBalance.toFixed(2)}" readonly style="background-color: var(--border-color); color: var(--warning); font-weight:700; width: 100%; padding: 0.6rem;">
                        </div>
                        <div class="form-group">
                            <label>Monto a Pagar ($)</label>
                            <input type="number" id="pay-amount" required step="0.01" min="0.01" max="${pendingBalance.toFixed(2)}" value="${pendingBalance.toFixed(2)}" style="width: 100%; padding: 0.6rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Comentarios / Observaciones</label>
                        <input type="text" id="pay-obs" placeholder="Ej. Pago correspondiente a la primera quincena de junio" required style="width: 100%; padding: 0.6rem; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);">
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
                        <button type="button" class="btn btn-secondary" id="close-pay-btn">Cancelar</button>
                        <button type="submit" class="btn btn-success"><i class="fa-solid fa-floppy-disk"></i> Guardar Pago</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        document.getElementById('close-pay-modal').addEventListener('click', closeModal);
        document.getElementById('close-pay-btn').addEventListener('click', closeModal);

        document.getElementById('pay-commission-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('pay-amount').value);
            const obs = document.getElementById('pay-obs').value;

            if (isNaN(amount) || amount <= 0 || amount > pendingBalance) {
                showToast("Por favor, ingrese un monto de pago válido.", "danger");
                return;
            }

            // Create payment object
            const payId = "PAG-COM-" + Math.floor(Date.now() / 1000).toString().substring(3);
            const newPayment = {
                ID_Pago_Comision: payId,
                Tecnico_ID: tech.Tecnico_ID,
                Fecha: Date.now(),
                Monto: amount,
                Observaciones: obs,
                RegistradoPor: getActiveUser().Email || "Administrador"
            };

            db.pagos_comisiones.push(newPayment);
            saveDatabase(db);

            showToast("Pago de comisión registrado con éxito.", "success");
            closeModal();

            // Refresh UI
            refreshOverallMetrics();
            if (isAdmin) {
                populateTechList(techSearch ? techSearch.value : '');
            }
            renderDetailPanel();
        });
    }

    // Print Commission Receipt Window
    function printCommissionReceipt(payment, tech) {
        const wsConfig = getWorkshopConfig(db);
        const printWindow = window.open('', '_blank', 'width=450,height=600');
        if (!printWindow) {
            showToast("El navegador bloqueó la ventana emergente de impresión.", "danger");
            return;
        }

        const dateStr = payment.Fecha ? new Date(payment.Fecha).toLocaleString('es-SV') : new Date().toLocaleString('es-SV');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Recibo Comisión - ${payment.ID_Pago_Comision}</title>
                <style>
                    body {
                        font-family: monospace;
                        font-size: 13px;
                        color: #111;
                        padding: 30px;
                        background: #fff;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .bold { font-weight: bold; }
                    .divider {
                        border-top: 1px dashed #444;
                        margin: 15px 0;
                    }
                    .receipt-header { margin-bottom: 20px; }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin: 5px 0;
                    }
                    .btn-print {
                        padding: 8px 16px;
                        background: #27ae60;
                        color: white;
                        border: none;
                        cursor: pointer;
                        font-weight: bold;
                        border-radius: 4px;
                    }
                    @media print {
                        .no-print { display: none !important; }
                        body {
                            padding: 1.5cm !important;
                            margin: 0 !important;
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
                <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                    <button class="btn-print" onclick="window.print()">Imprimir Recibo</button>
                    <button onclick="window.close()" style="padding:8px 16px; border:1px solid #ccc; background:#eee; cursor:pointer; font-weight:bold; border-radius: 4px;">Cerrar</button>
                </div>
                <div class="receipt-header text-center">
                    <h3 style="margin: 0; font-size:16px;">${wsConfig.nombre || 'TALLER MECÁNICO'}</h3>
                    <p style="margin: 4px 0;">Recibo Oficial de Pago de Comisión</p>
                    <p style="margin: 2px 0; font-size:11px;">NIT: ${wsConfig.nit || ''} • TEL: ${wsConfig.telefono || ''}</p>
                </div>
                <div class="divider"></div>
                <div class="info-row"><span><strong>Recibo No:</strong></span><span>${payment.ID_Pago_Comision}</span></div>
                <div class="info-row"><span><strong>Fecha/Hora:</strong></span><span>${dateStr}</span></div>
                <div class="info-row"><span><strong>Empleado:</strong></span><span>${tech.Nombre_Completo}</span></div>
                <div class="info-row"><span><strong>Especialidad:</strong></span><span>${tech.Especialidad || 'Taller'}</span></div>
                <div class="divider"></div>
                <div class="info-row" style="font-size: 15px;">
                    <span><strong>MONTO PAGADO:</strong></span>
                    <span><strong style="color: #27ae60;">$ ${parseFloat(payment.Monto).toFixed(2)}</strong></span>
                </div>
                <div class="divider"></div>
                <p><strong>Por concepto de:</strong></p>
                <p style="font-style: italic; background:#f9f9f9; padding:8px; border:1px solid #eee;">${payment.Observaciones || 'Abono de comisión por trabajos finalizados'}</p>
                <div class="divider" style="margin-top: 40px;"></div>
                <div style="display: flex; justify-content: space-around; margin-top: 50px; text-align: center;">
                    <div style="width: 40%;">
                        <p>_______________________</p>
                        <p style="font-size: 11px;">Firma de Recibido<br>${tech.Nombre_Completo}</p>
                    </div>
                    <div style="width: 40%;">
                        <p>_______________________</p>
                        <p style="font-size: 11px;">Entregado Por (Admin)<br>${payment.RegistradoPor || 'Admin'}</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.opener = null;
    }

    // Event listeners
    btnFilterDates.addEventListener('click', () => {
        const startVal = dateStartInput.value;
        const endVal = dateEndInput.value;
        startTime = startVal ? new Date(startVal + 'T00:00:00').getTime() : 0;
        endTime = endVal ? new Date(endVal + 'T23:59:59').getTime() : Infinity;
        
        refreshOverallMetrics();
        if (isAdmin) {
            populateTechList(techSearch ? techSearch.value : '');
        }
        renderDetailPanel();
    });

    btnClearDates.addEventListener('click', () => {
        dateStartInput.value = '';
        dateEndInput.value = '';
        startTime = 0;
        endTime = Infinity;
        
        refreshOverallMetrics();
        if (isAdmin) {
            populateTechList(techSearch ? techSearch.value : '');
        }
        renderDetailPanel();
    });

    if (techSearch) {
        techSearch.addEventListener('input', (e) => {
            populateTechList(e.target.value);
        });
    }

    // Initial population
    refreshOverallMetrics();
    if (isAdmin) {
        populateTechList();
    }
    renderDetailPanel();
}



export function getBudgetCommissions(p, t, db) {
    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];
    
    // If status is not 3 (Facturado), no commissions are calculated at all
    if (p.Estado != 3) {
        return { laborCommission: 0, productCommission: 0, totalCommission: 0, sumLab: 0, sumProd: 0 };
    }

    const config = getWorkshopConfig(db);
    const tipoComisionTaller = config.tipo_comision || 'general';
    const useDetailedModel = (tipoComisionTaller === 'detallada' && p.Tipo_Comision === 'detallada');
    
    let products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === p['ID Presupuesto']);
    let labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === p['ID Presupuesto']);
    
    if (useDetailedModel) {
        // Filter items where the assigned technician is strictly this technician
        products = products.filter(dp => dp.Tecnico_ID === t.Tecnico_ID);
        labor = labor.filter(dm => dm.Tecnico_ID === t.Tecnico_ID);
    } else {
        // General mode: if budget header is not assigned to this technician, they get nothing
        if (p.Tecnico_Asignado !== t.Tecnico_ID) {
            return { laborCommission: 0, productCommission: 0, totalCommission: 0, sumLab: 0, sumProd: 0 };
        }
    }
    
    const sumProd = products.reduce((sum, prod) => sum + parseFloat(prod.PrecioUnitario || 0) * parseInt(prod.Cantidad || 1), 0);
    const sumLab = labor.reduce((sum, lab) => sum + parseFloat(lab.PrecioUnitario || 0) * parseInt(lab.Cantidad || 1), 0);
    
    const comServRate = parseFloat(t.Comision_Servicios !== undefined ? t.Comision_Servicios : 10) / 100;
    const comProdRate = parseFloat(t.Comision_Productos !== undefined ? t.Comision_Productos : 0) / 100;
    
    const laborCommission = sumLab * comServRate;
    const productCommission = sumProd * comProdRate;
    const totalCommission = laborCommission + productCommission;
    
    return {
        laborCommission,
        productCommission,
        totalCommission,
        sumLab,
        sumProd
    };
}



