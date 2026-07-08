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
} from '../../app.js?v=55';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport
} from '../utils.js?v=55';

export function renderPlanilla(container, queryParams) {
    const db = getDatabase();
    
    // Inicializar colecciones de planillas en DB si faltan
    if (!db.novedades_planilla) db.novedades_planilla = [];
    if (!db.planillas_cerradas) db.planillas_cerradas = [];
    
    // Variables de estado del filtro local
    let currentYear = 2026;
    let currentMonth = 6;
    let currentPeriod = '1Q'; // '1Q', '2Q', 'M'
    
    function renderView() {
        const key = `${currentYear}-${currentMonth}-${currentPeriod}`;
        const isClosed = db.planillas_cerradas.some(pc => pc.key === key);
        
        // Cargar datos del histórico si está cerrado, de lo contrario calcular en vivo
        let payrollList = [];
        if (isClosed) {
            const historyObj = db.planillas_cerradas.find(pc => pc.key === key);
            payrollList = historyObj.data;
        } else {
            payrollList = db.tecnicos.map(t => {
                if (t.Salario_Base === undefined) {
                    t.Salario_Base = t.Tecnico_ID.includes('181025') ? 1200 : 750;
                }
                
                // Obtener o crear novedades del período
                let nov = db.novedades_planilla.find(n => n.techId === t.Tecnico_ID && n.year === currentYear && n.month === currentMonth && n.period === currentPeriod);
                if (!nov) {
                    nov = {
                        techId: t.Tecnico_ID,
                        year: currentYear,
                        month: currentMonth,
                        period: currentPeriod,
                        horasExtras: 0,
                        pgr: 0,
                        prestamos: 0,
                        anticipos: 0,
                        comisiones: 0,
                        primaVacacional: 0,
                        descuentosOtros: 0
                    };
                    db.novedades_planilla.push(nov);
                }
                
                const extraEarnings = parseFloat(nov.horasExtras || 0) + parseFloat(nov.comisiones || 0) + parseFloat(nov.primaVacacional || 0);
                const calc = calculateElSalvadorPeriodPayroll(t.Salario_Base, extraEarnings, currentPeriod);
                
                const totalDescuentosAdicionales = parseFloat(nov.pgr || 0) + parseFloat(nov.prestamos || 0) + parseFloat(nov.anticipos || 0) + parseFloat(nov.descuentosOtros || 0);
                const netoFinal = calc.netSalary - totalDescuentosAdicionales;
                
                return {
                    Tecnico_ID: t.Tecnico_ID,
                    Nombre_Completo: t.Nombre_Completo,
                    Especialidad: t.Especialidad || 'Técnico',
                    Salario_Base: t.Salario_Base,
                    Salario_Periodo_Base: currentPeriod === 'M' ? t.Salario_Base : t.Salario_Base / 2,
                    horasExtras: nov.horasExtras,
                    comisiones: nov.comisiones,
                    primaVacacional: nov.primaVacacional,
                    extraEarnings,
                    pgr: nov.pgr,
                    prestamos: nov.prestamos,
                    anticipos: nov.anticipos,
                    descuentosOtros: nov.descuentosOtros,
                    totalDescuentosAdicionales,
                    isssEmployee: calc.isssEmployee,
                    afpEmployee: calc.afpEmployee,
                    isr: calc.isr,
                    netSalary: netoFinal,
                    isssEmployer: calc.isssEmployer,
                    afpEmployer: calc.afpEmployer,
                    insaforp: calc.insaforp,
                    employerCost: calc.employerCost
                };
            });
        }
        
        // Calcular Totales de Planilla
        const totals = payrollList.reduce((sum, item) => {
            sum.gross += item.Salario_Periodo_Base + item.extraEarnings;
            sum.deductions += item.isssEmployee + item.afpEmployee + item.isr + item.totalDescuentosAdicionales;
            sum.net += item.netSalary;
            sum.employerCost += item.employerCost;
            return sum;
        }, { gross: 0, deductions: 0, net: 0, employerCost: 0 });
        
        container.innerHTML = html`
            <div class="glass-card" style="margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                    <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.75rem;">Año</label>
                            <select id="pl-year" style="padding:0.4rem 0.6rem; min-width:80px;">
                                <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                                <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                                <option value="2027" ${currentYear === 2027 ? 'selected' : ''}>2027</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.75rem;">Mes</label>
                            <select id="pl-month" style="padding:0.4rem 0.6rem; min-width:110px;">
                                <option value="1" ${currentMonth === 1 ? 'selected' : ''}>Enero</option>
                                <option value="2" ${currentMonth === 2 ? 'selected' : ''}>Febrero</option>
                                <option value="3" ${currentMonth === 3 ? 'selected' : ''}>Marzo</option>
                                <option value="4" ${currentMonth === 4 ? 'selected' : ''}>Abril</option>
                                <option value="5" ${currentMonth === 5 ? 'selected' : ''}>Mayo</option>
                                <option value="6" ${currentMonth === 6 ? 'selected' : ''}>Junio</option>
                                <option value="7" ${currentMonth === 7 ? 'selected' : ''}>Julio</option>
                                <option value="8" ${currentMonth === 8 ? 'selected' : ''}>Agosto</option>
                                <option value="9" ${currentMonth === 9 ? 'selected' : ''}>Septiembre</option>
                                <option value="10" ${currentMonth === 10 ? 'selected' : ''}>Octubre</option>
                                <option value="11" ${currentMonth === 11 ? 'selected' : ''}>Noviembre</option>
                                <option value="12" ${currentMonth === 12 ? 'selected' : ''}>Diciembre</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.75rem;">Período Planilla</label>
                            <select id="pl-period" style="padding:0.4rem 0.6rem; min-width:130px;">
                                <option value="1Q" ${currentPeriod === '1Q' ? 'selected' : ''}>1ª Quincena (1-15)</option>
                                <option value="2Q" ${currentPeriod === '2Q' ? 'selected' : ''}>2ª Quincena (16-Fin)</option>
                                <option value="M" ${currentPeriod === 'M' ? 'selected' : ''}>Mensual Completo</option>
                            </select>
                        </div>
                        
                        <div style="margin-top:1.1rem;">
                            ${safe(isClosed 
                                ? '<span class="badge-tag badge-success" style="padding: 0.5rem 0.75rem;"><i class="fa-solid fa-lock"></i> Planilla Cerrada e Historial Guardado</span>' 
                                : '<span class="badge-tag badge-warning" style="padding: 0.5rem 0.75rem;"><i class="fa-solid fa-pen-to-square"></i> Período Abierto (Editable)</span>')}
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:0.5rem; margin-top:1.1rem;">
                        <button class="btn btn-secondary" id="btn-export-consolidated-planilla"><i class="fa-solid fa-print"></i> Exportar Hoja</button>
                        ${safe(isClosed 
                            ? `<button class="btn btn-secondary" id="btn-reopen-planilla" style="color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-lock-open"></i> Reabrir</button>` 
                            : `<button class="btn btn-primary" id="btn-lock-planilla"><i class="fa-solid fa-lock"></i> Cerrar Período</button>`)}
                    </div>
                </div>
            </div>
            
            <div class="dashboard-stats" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom:1.5rem;">
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Ingresos / Devengado Total</span>
                        <span class="stat-value">$ ${totals.gross.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--primary); background-color:var(--primary-glow);"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Retenciones Totales</span>
                        <span class="stat-value" style="color:var(--danger);">$ ${totals.deductions.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--danger); background-color:var(--danger-glow);"><i class="fa-solid fa-minus"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Salarios Líquidos Netos</span>
                        <span class="stat-value" style="color:var(--success);">$ ${totals.net.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--success); background-color:var(--success-glow);"><i class="fa-solid fa-wallet"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Costo Total Nómina Taller</span>
                        <span class="stat-value" style="color:var(--cyan);">$ ${totals.employerCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--cyan); background-color:rgba(6,182,212,0.1);"><i class="fa-solid fa-building-columns"></i></div>
                </div>
            </div>
            
            <div class="glass-card">
                <h3>Resumen de Planilla General</h3>
                <div class="table-container" style="margin-top:1rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Base Período</th>
                                <th>Ingresos Extras</th>
                                <th>Retenciones de Ley</th>
                                <th>Otros Descuentos</th>
                                <th>Neto a Pagar</th>
                                <th>Costo Patronal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(payrollList.map(item => `
                                <tr>
                                    <td>
                                        <strong>${item.Nombre_Completo}</strong>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">${item.Especialidad}</div>
                                    </td>
                                    <td>$ ${parseFloat(item.Salario_Periodo_Base).toFixed(2)}</td>
                                    <td style="color:var(--success);">+ $ ${parseFloat(item.extraEarnings).toFixed(2)}</td>
                                    <td style="color:var(--danger);">- $ ${(item.isssEmployee + item.afpEmployee + item.isr).toFixed(2)}
                                        <div style="font-size:0.7rem; color:var(--text-muted);">ISSS: $${item.isssEmployee.toFixed(2)} | AFP: $${item.afpEmployee.toFixed(2)} | ISR: $${item.isr.toFixed(2)}</div>
                                    </td>
                                    <td style="color:var(--danger);">- $ ${parseFloat(item.totalDescuentosAdicionales).toFixed(2)}</td>
                                    <td style="font-weight:700; color:var(--success);">$ ${parseFloat(item.netSalary).toFixed(2)}</td>
                                    <td style="color:var(--cyan); font-weight:600;">$ ${parseFloat(item.employerCost).toFixed(2)}</td>
                                    <td>
                                        <div style="display:flex; gap:0.35rem;">
                                            <button class="btn btn-secondary btn-payroll-novedades" data-id="${item.Tecnico_ID}" ${isClosed ? 'disabled style="opacity:0.5;"' : ''} style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen-to-square"></i> Novedades</button>
                                            <button class="btn btn-secondary btn-payroll-boleta" data-id="${item.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-file-invoice"></i> Boleta</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join(''))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Novedades Modal -->
            <div id="novedades-periodo-modal" class="modal">
                <div class="modal-content glass-card" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Registrar Ajustes de Planilla</h2>
                        <button class="close-modal-btn" id="close-nov-modal">&times;</button>
                    </div>
                    <form id="novedades-periodo-form" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                        <input type="hidden" id="nov-tech-id">
                        <div style="font-size:0.9rem; color:var(--primary); font-weight:bold;" id="nov-empleado-name"></div>
                        <div class="form-row">
                            <div class="form-group"><label>Horas Extras ($)</label><input type="number" id="nov-horas-extras" step="0.01" min="0"></div>
                            <div class="form-group"><label>Comisiones / Bonos ($)</label><input type="number" id="nov-comisiones" step="0.01" min="0"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Prima Vacacional (30% Ley)</label><input type="number" id="nov-vacaciones" step="0.01" min="0"></div>
                            <div class="form-group"><label>Anticipo de Salario ($)</label><input type="number" id="nov-anticipos" step="0.01" min="0"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Préstamos Recurrentes ($)</label><input type="number" id="nov-prestamos" step="0.01" min="0"></div>
                            <div class="form-group"><label>Cuota Alimenticia PGR ($)</label><input type="number" id="nov-pgr" step="0.01" min="0"></div>
                        </div>
                        <div class="form-group">
                            <label>Otros Descuentos / Sanciones ($)</label>
                            <input type="number" id="nov-otros" step="0.01" min="0">
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-nov">Cancelar</button>
                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Boleta Print Modal -->
            <div id="boleta-print-modal" class="modal">
                <div class="modal-content glass-card" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>Vista de Boleta de Pago</h2>
                        <button class="close-modal-btn" id="close-boleta-modal">&times;</button>
                    </div>
                    <div id="boleta-receipt-content" style="background-color: white; color: black; padding: 2rem; border-radius: 4px; font-family: monospace;">
                        <!-- Content rendered dynamically -->
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                        <button type="button" class="btn btn-secondary" id="btn-close-boleta">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="btn-print-boleta-action"><i class="fa-solid fa-print"></i> Imprimir Boleta</button>
                    </div>
                </div>
            </div>
        `;
        
        // Bind Filter events
        document.getElementById('pl-year').addEventListener('change', (e) => { currentYear = parseInt(e.target.value); renderView(); });
        document.getElementById('pl-month').addEventListener('change', (e) => { currentMonth = parseInt(e.target.value); renderView(); });
        document.getElementById('pl-period').addEventListener('change', (e) => { currentPeriod = e.target.value; renderView(); });
        
        // Bind lock/close button
        const lockBtn = document.getElementById('btn-lock-planilla');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                if (confirm(`¿Está seguro de que desea CERRAR el período de planilla para ${currentPeriod} de ${document.getElementById('pl-month').options[currentMonth-1].text} ${currentYear}?\nEsto bloqueará el registro de novedades.`)) {
                    db.planillas_cerradas.push({
                        key,
                        year: currentYear,
                        month: currentMonth,
                        period: currentPeriod,
                        closedAt: Date.now(),
                        data: payrollList
                    });
                    saveDatabase(db);
                    showToast("Planilla cerrada y guardada en el historial contable", "success");
                    renderView();
                }
            });
        }
        
        // Bind reopen button
        const reopenBtn = document.getElementById('btn-reopen-planilla');
        if (reopenBtn) {
            reopenBtn.addEventListener('click', () => {
                if (confirm(`¿Reabrir planilla del período? Volverá a ser editable.`)) {
                    db.planillas_cerradas = db.planillas_cerradas.filter(pc => pc.key !== key);
                    saveDatabase(db);
                    showToast("Planilla reabierta para edición", "info");
                    renderView();
                }
            });
        }
        
        // Bind Export Consolidated Planilla
        document.getElementById('btn-export-consolidated-planilla').addEventListener('click', () => {
            exportPlanillaConsolidada(currentYear, currentMonth, currentPeriod, payrollList);
        });

        // Bind Novedades Click
        document.querySelectorAll('.btn-payroll-novedades').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const emp = payrollList.find(x => x.Tecnico_ID === id);
                
                document.getElementById('nov-tech-id').value = id;
                document.getElementById('nov-empleado-name').textContent = emp.Nombre_Completo;
                
                document.getElementById('nov-horas-extras').value = emp.horasExtras || 0;
                document.getElementById('nov-comisiones').value = emp.comisiones || 0;
                document.getElementById('nov-vacaciones').value = emp.primaVacacional || 0;
                document.getElementById('nov-anticipos').value = emp.anticipos || 0;
                document.getElementById('nov-prestamos').value = emp.prestamos || 0;
                document.getElementById('nov-pgr').value = emp.pgr || 0;
                document.getElementById('nov-otros').value = emp.descuentosOtros || 0;
                
                document.getElementById('novedades-periodo-modal').classList.add('active');
            });
        });
        
        // Save Novedades Form
        const novForm = document.getElementById('novedades-periodo-form');
        novForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('nov-tech-id').value;
            const hExtras = parseFloat(document.getElementById('nov-horas-extras').value || 0);
            const com = parseFloat(document.getElementById('nov-comisiones').value || 0);
            const vac = parseFloat(document.getElementById('nov-vacaciones').value || 0);
            const ant = parseFloat(document.getElementById('nov-anticipos').value || 0);
            const pres = parseFloat(document.getElementById('nov-prestamos').value || 0);
            const pgr = parseFloat(document.getElementById('nov-pgr').value || 0);
            const otros = parseFloat(document.getElementById('nov-otros').value || 0);
            
            // Buscar o crear novedad en el array persistente
            let nov = db.novedades_planilla.find(n => n.techId === id && n.year === currentYear && n.month === currentMonth && n.period === currentPeriod);
            if (!nov) {
                nov = { techId: id, year: currentYear, month: currentMonth, period: currentPeriod };
                db.novedades_planilla.push(nov);
            }
            
            nov.horasExtras = hExtras;
            nov.comisiones = com;
            nov.primaVacacional = vac;
            nov.anticipos = ant;
            nov.prestamos = pres;
            nov.pgr = pgr;
            nov.descuentosOtros = otros;
            
            saveDatabase(db);
            showToast("Ajustes del período guardados", "success");
            document.getElementById('novedades-periodo-modal').classList.remove('active');
            renderView();
        });
        
        // Close modal triggers
        const closeNov = () => document.getElementById('novedades-periodo-modal').classList.remove('active');
        document.getElementById('close-nov-modal').addEventListener('click', closeNov);
        document.getElementById('btn-cancel-nov').addEventListener('click', closeNov);
        
        // Bind Boleta Click
        document.querySelectorAll('.btn-payroll-boleta').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const emp = payrollList.find(x => x.Tecnico_ID === id);
                
                const ws = getWorkshopConfig(db);
                const periodStr = currentPeriod === 'M' ? 'Mensual' : (currentPeriod === '1Q' ? '1ª Quincena' : '2ª Quincena');
                const monthName = document.getElementById('pl-month').options[currentMonth-1].text;
                
                const recContent = document.getElementById('boleta-receipt-content');
                recContent.innerHTML = html`
                    <div style="text-align:center; margin-bottom:1rem; border-bottom:1.5px dashed #000; padding-bottom:0.75rem;">
                        <h2 style="margin:0; font-size:1.4rem; font-weight:800; font-family:'Outfit', sans-serif;">${ws.nombre}</h2>
                        <div style="font-size:0.75rem; margin-top:0.25rem;">${ws.giro}</div>
                        <div style="font-size:0.85rem; font-weight:bold; margin-top:0.5rem; text-transform:uppercase;">Boleta de Pago de Salarios</div>
                        <div style="font-size:0.8rem; margin-top:0.25rem; font-weight:600;">Período: ${periodStr} de ${monthName} de ${currentYear}</div>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:1rem; line-height:1.4;">
                        <div>
                            <strong>Empleado:</strong> ${emp.Nombre_Completo}<br>
                            <strong>Cargo:</strong> ${emp.Especialidad}<br>
                            <strong>ID:</strong> ${emp.Tecnico_ID}
                        </div>
                        <div style="text-align:right;">
                            <strong>Salario Base:</strong> $ ${parseFloat(emp.Salario_Base).toFixed(2)}/mes<br>
                            <strong>Base Período:</strong> $ ${parseFloat(itemBaseSalary(emp)).toFixed(2)}
                        </div>
                    </div>
                    
                    <table style="width:100%; font-size:0.8rem; border-collapse:collapse; margin-bottom:1.25rem;">
                        <thead>
                            <tr style="border-bottom:1px solid #000; font-weight:bold;">
                                <th style="text-align:left; padding:0.25rem 0;">Ingresos / Devengos</th>
                                <th style="text-align:right; padding:0.25rem 0;">Monto</th>
                                <th style="text-align:left; padding:0.25rem 0; padding-left:1rem;">Deducciones / Descuentos</th>
                                <th style="text-align:right; padding:0.25rem 0;">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding:0.2rem 0;">Base del Período</td>
                                <td style="text-align:right;">$ ${parseFloat(itemBaseSalary(emp)).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">ISSS Seguro Social (3%)</td>
                                <td style="text-align:right; color:red;">- $ ${emp.isssEmployee.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;">Horas Extras</td>
                                <td style="text-align:right;">+ $ ${parseFloat(emp.horasExtras || 0).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">AFP Pensiones (7.25%)</td>
                                <td style="text-align:right; color:red;">- $ ${emp.afpEmployee.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;">Comisiones / Bonos</td>
                                <td style="text-align:right;">+ $ ${parseFloat(emp.comisiones || 0).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Retención ISR Renta</td>
                                <td style="text-align:right; color:red;">- $ ${emp.isr.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;">Prima Vacacional</td>
                                <td style="text-align:right;">+ $ ${parseFloat(emp.primaVacacional || 0).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Anticipos de Salario</td>
                                <td style="text-align:right; color:red;">- $ ${parseFloat(emp.anticipos || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;"></td>
                                <td style="text-align:right;"></td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Préstamos Taller</td>
                                <td style="text-align:right; color:red;">- $ ${parseFloat(emp.prestamos || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;"></td>
                                <td style="text-align:right;"></td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Cuota Alimenticia PGR</td>
                                <td style="text-align:right; color:red;">- $ ${parseFloat(emp.pgr || 0).toFixed(2)}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #000;">
                                <td style="padding:0.2rem 0;"></td>
                                <td style="text-align:right;"></td>
                                <td style="padding:0.2rem 0; padding-left:1rem; padding-bottom:0.25rem;">Otros Descuentos</td>
                                <td style="text-align:right; color:red; padding-bottom:0.25rem;">- $ ${parseFloat(emp.descuentosOtros || 0).toFixed(2)}</td>
                            </tr>
                            <tr style="font-weight:bold;">
                                <td style="padding:0.5rem 0;">Total Devengado</td>
                                <td style="text-align:right;">$ ${(itemBaseSalary(emp) + emp.extraEarnings).toFixed(2)}</td>
                                <td style="padding:0.5rem 0; padding-left:1rem;">Total Retenciones</td>
                                <td style="text-align:right;">$ ${(emp.isssEmployee + emp.afpEmployee + emp.isr + emp.totalDescuentosAdicionales).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="background-color:#f1f5f9; padding:0.75rem; display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:1rem; border:1px solid #000;">
                        <span>LÍQUIDO NETO A RECIBIR:</span>
                        <span style="color:#047857;">$ ${parseFloat(emp.netSalary).toFixed(2)}</span>
                    </div>
                    
                    <div style="margin-top:2.5rem; display:flex; justify-content:space-between; font-size:0.7rem;">
                        <div style="width:45%; border-top:1px solid #000; text-align:center; padding-top:0.25rem;">
                            Firma del Empleado<br>DUI: _________________
                        </div>
                        <div style="width:45%; border-top:1px solid #000; text-align:center; padding-top:0.25rem;">
                            Entregado Por (Taller / Caja)<br>${ws.nombre}
                        </div>
                    </div>
                `;
                
                document.getElementById('boleta-print-modal').classList.add('active');
                
                // Bind print action button inside modal
                document.getElementById('btn-print-boleta-action').replaceWith(document.getElementById('btn-print-boleta-action').cloneNode(true));
                document.getElementById('btn-print-boleta-action').addEventListener('click', () => {
                    const printWin = window.open('', '_blank');
                    printWin.document.write(`
                        <html>
                        <head>
                            <title>Boleta de Pago - ${emp.Nombre_Completo}</title>
                            <style>
                                body {
                                    font-family: monospace;
                                    padding: 20px;
                                    background: white;
                                    color: black;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                                table { width: 100%; border-collapse: collapse; }
                                th, td { padding: 4px; }
                                @media print {
                                    body {
                                        padding: 1cm !important;
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
                            <div style="max-width:600px; margin:0 auto; border:1px solid #000; padding:20px;">
                                ${safe(recContent.innerHTML)}
                            </div>
                            <script>window.print();<\/script>
                        </body>
                        </html>
                    `);
                    printWin.document.close();
                    printWin.opener = null;
                });
            });
        });
        
        function itemBaseSalary(emp) {
            return currentPeriod === 'M' ? emp.Salario_Base : emp.Salario_Base / 2;
        }

        const closeBoleta = () => document.getElementById('boleta-print-modal').classList.remove('active');
        document.getElementById('close-boleta-modal').addEventListener('click', closeBoleta);
        document.getElementById('btn-close-boleta').addEventListener('click', closeBoleta);
    }
    
    renderView();
}



export function exportPlanillaConsolidada(year, month, periodType, payrollData) {
    const periodStr = periodType === 'M' ? 'Mensual' : (periodType === '1Q' ? '1ª Quincena' : '2ª Quincena');
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const monthStr = monthNames[month - 1];

    const totals = payrollData.reduce((sum, item) => {
        sum.base += item.Salario_Periodo_Base;
        sum.extras += item.extraEarnings;
        sum.isss += item.isssEmployee;
        sum.afp += item.afpEmployee;
        sum.isr += item.isr;
        sum.other += item.totalDescuentosAdicionales;
        sum.net += item.netSalary;
        sum.patronalISSS += item.isssEmployer;
        sum.patronalAFP += item.afpEmployer;
        sum.insaforp += item.insaforp;
        sum.totalCost += item.employerCost;
        return sum;
    }, { base: 0, extras: 0, isss: 0, afp: 0, isr: 0, other: 0, net: 0, patronalISSS: 0, patronalAFP: 0, insaforp: 0, totalCost: 0 });

    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    const printWin = window.open('', '_blank');
    printWin.document.write(`
        <html>
        <head>
            <title>Planilla Consolidada - ${periodStr} ${monthStr} ${year}</title>
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    font-size: 11px;
                    color: black;
                    background: white;
                    padding: 25px;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                h1 { margin: 0; font-size: 18px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ccc; padding: 6px 8px; }
                th {
                    background-color: #f3f4f6 !important;
                    font-weight: bold;
                    text-align: center;
                    vertical-align: middle;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .text-right { text-align: right; }
                .totals-row { font-weight: bold; background-color: #e5e7eb !important; }
                .footer-signatures { display: flex; justify-content: space-between; margin-top: 50px; }
                .signature-box { width: 30%; border-top: 1px solid #000; text-align: center; padding-top: 5px; font-size: 10px; }
                
                @media print {
                    body {
                        padding: 1.5cm !important;
                        margin: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    @page {
                        size: landscape;
                        margin: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${ws.nombre}</h1>
                <div style="font-size:12px; font-weight:bold; margin-top:4px;">REPORTE DE PLANILLA CONSOLIDADA DE SALARIOS</div>
                <div style="font-size:11px; margin-top:2px;">Período: ${periodStr} de ${monthStr} de ${year}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align:center; vertical-align:middle; white-space:nowrap;">Empleado</th>
                        <th style="text-align:center; vertical-align:middle; white-space:nowrap;">Base Período</th>
                        <th style="text-align:center; vertical-align:middle; white-space:nowrap;">Ingresos Extras</th>
                        <th style="text-align:center; vertical-align:middle; white-space:nowrap;">ISSS Ret.</th>
                        <th style="text-align:center; vertical-align:middle; white-space:nowrap;">AFP Ret.</th>
                        <th style="text-align:center; vertical-align:middle; white-space:nowrap;">ISR Renta</th>
                        <th style="text-align:center; vertical-align:middle; white-space:nowrap;">Otros Descs.</th>
                        <th style="text-align:center; vertical-align:middle; white-space:nowrap;">Líquido a Pagar</th>
                        <th style="text-align:center; vertical-align:middle; white-space:nowrap;">Costo Patronal</th>
                    </tr>
                </thead>
                <tbody>
                    ${safe(payrollData.map(item => `
                        <tr>
                            <td><strong>${item.Nombre_Completo}</strong><br><small style="color:#666;">${item.Especialidad}</small></td>
                            <td>$ ${parseFloat(item.Salario_Periodo_Base).toFixed(2)}</td>
                            <td>$ ${parseFloat(item.extraEarnings).toFixed(2)}</td>
                            <td class="text-right">$ ${item.isssEmployee.toFixed(2)}</td>
                            <td class="text-right">$ ${item.afpEmployee.toFixed(2)}</td>
                            <td class="text-right">$ ${item.isr.toFixed(2)}</td>
                            <td class="text-right">$ ${item.totalDescuentosAdicionales.toFixed(2)}</td>
                            <td class="text-right" style="font-weight:bold;">$ ${item.netSalary.toFixed(2)}</td>
                            <td class="text-right">$ ${item.employerCost.toFixed(2)}</td>
                        </tr>
                    `).join(''))}
                    <tr class="totals-row">
                        <td>TOTALES PLANILLA</td>
                        <td>$ ${totals.base.toFixed(2)}</td>
                        <td>$ ${totals.extras.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.isss.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.afp.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.isr.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.other.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.net.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.totalCost.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top:20px; font-size:10px; background-color:#f9fafb; padding:10px; border:1px solid #e5e7eb;">
                <strong>Resumen de Aportes Patronales para este Período:</strong><br>
                ISSS Patronal (7.50%): $ ${totals.patronalISSS.toFixed(2)} | 
                AFP Patronal (8.75%): $ ${totals.patronalAFP.toFixed(2)} | 
                INSAFORP (1.00%): $ ${totals.insaforp.toFixed(2)} | 
                <strong>Total Aportes Patronales:</strong> $ ${(totals.patronalISSS + totals.patronalAFP + totals.insaforp).toFixed(2)}
            </div>

            <div class="footer-signatures">
                <div class="signature-box">
                    Preparado Por (Contabilidad)<br>${ws.nombre}
                </div>
                <div class="signature-box">
                    Revisado Por (Recursos Humanos)<br>Firma Autorizada
                </div>
                <div class="signature-box">
                    Aprobado Por (Gerencia)<br>Firma Autorizada
                </div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
    `);
    printWin.document.close();
    printWin.opener = null;
}

// Helper function: Convert number to Spanish words (uppercase)


