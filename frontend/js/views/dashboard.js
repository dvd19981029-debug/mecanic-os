/**
 * Mecanic OS - Dashboard View Module
 */

import { saveDatabase } from '../../app.js?v=40';

export function renderTallerDashboard(container) {
    const db = window.getDatabase();
    
    // Helper to calculate grand total for a budget
    function getBudgetTotal(p) {
        const presId = p['ID Presupuesto'];
        const prodItems = (db.detalle_productos || []).filter(item => item['ID_Presupuesto DPP'] === presId);
        const laborItems = (db.detalle_mano_obra || []).filter(item => item['ID_Presupuesto MO'] === presId);

        let subtotal = 0;
        prodItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1));
        laborItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1));
        
        const iva = subtotal * 0.13;
        let grandTotal = subtotal + iva;
        
        const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || { AplicaPercepcion: 0, AplicaRetencion: 0 };
        if (client.AplicaPercepcion > 0) {
            grandTotal += subtotal * parseFloat(client.AplicaPercepcion);
        }
        if (client.AplicaRetencion > 0) {
            grandTotal -= subtotal * parseFloat(client.AplicaRetencion);
        }
        return grandTotal;
    }

    // 1. Calculate Autos en Taller (unique plates of active budgets/diagnostics)
    const activeBudgets = db.presupuestos.filter(p => p.Estado !== 3 && p.Estado !== '3' && p.Estado !== 4 && p.Estado !== '4');
    const activePlates = new Set(activeBudgets.map(p => p.Placas).filter(Boolean));
    const activeVehiclesCount = activePlates.size;

    // received in the last 7 days from db.revisiones
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const receivedThisWeek = (db.revisiones || []).filter(r => {
        if (!r.Fecha) return false;
        const rDate = new Date(r.Fecha);
        return rDate >= sevenDaysAgo;
    }).length;

    // 2. Presupuestos Aprobados
    const approvedBudgetsCount = db.presupuestos.filter(p => p.Estado == 2 || p.Estado == '2').length;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const cotizadosHoy = db.presupuestos.filter(p => {
        if (!p.Fecha) return false;
        const pDate = new Date(p.Fecha);
        return pDate >= startOfToday;
    }).length;

    // 3. Facturado Hoy (DTE)
    let invoicedTodaySum = 0;
    const invoicedTodayBudgets = db.presupuestos.filter(p => {
        if (p.Estado != 3 && p.Estado != '3') return false;
        if (!p.Fecha_Facturacion) return false;
        const fDate = new Date(p.Fecha_Facturacion);
        return fDate >= startOfToday;
    });
    invoicedTodayBudgets.forEach(p => {
        invoicedTodaySum += getBudgetTotal(p);
    });
    const invoicesCountToday = invoicedTodayBudgets.length;

    // 4. Alertas Stock Mínimo
    const lowStockProductsCount = (db.productos || []).filter(p => (p.Minimos || 0) <= 3).length;

    // Render stats
    const statsHTML = `
        <div class="dashboard-grid">
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Autos en Taller</span>
                    <span class="stat-value">${activeVehiclesCount}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +${receivedThisWeek} esta semana</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-car"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Presupuestos Aprobados</span>
                    <span class="stat-value">${approvedBudgetsCount}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-file-invoice"></i> ${cotizadosHoy} cotizados hoy</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-file-signature"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Facturado Hoy (DTE)</span>
                    <span class="stat-value">$ ${invoicedTodaySum.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-circle-check"></i> ${invoicesCountToday} emitidos hoy</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Alertas Stock Mínimo</span>
                    <span class="stat-value">${lowStockProductsCount}</span>
                    <span class="stat-trend down"><i class="fa-solid fa-triangle-exclamation"></i> Repuestos críticos</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            </div>
        </div>
        
        <h2>Accesos Rápidos</h2>
        <div class="quick-actions-panel">
            <div class="action-card" onclick="window.location.hash='#revision-21'">
                <i class="fa-solid fa-clipboard-list"></i>
                <h3>Nueva Recepción</h3>
                <p>Inspección 21 Puntos y registro de ingreso</p>
            </div>
            <div class="action-card" onclick="window.location.hash='#presupuestos'">
                <i class="fa-solid fa-file-invoice-dollar"></i>
                <h3>Crear Presupuesto</h3>
                <p>Cotización de servicios y partes a clientes</p>
            </div>
            <div class="action-card" onclick="window.location.hash='#kanban'">
                <i class="fa-solid fa-network-wired"></i>
                <h3>Control Taller</h3>
                <p>Ver flujo del taller y técnicos asignados</p>
            </div>
            <div class="action-card" onclick="window.location.hash='#venta-rapida'">
                <i class="fa-solid fa-cash-register"></i>
                <h3>Venta Rápida POS</h3>
                <p>Facturación directa en mostrador</p>
            </div>
        </div>
        
        <div class="view-split">
            <div class="glass-card">
                <h3>Vehículos Activos en Proceso</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Placas</th>
                                <th>Cliente</th>
                                <th>Técnico</th>
                                <th>Fallas Reportadas</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(db.presupuestos.filter(p => p.Estado != 3 && p.Estado != '3' && p.Estado != 4 && p.Estado != '4').slice(0, 5).map(p => {
                                const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === p.ID_Vehiculo) || { Placas: p.Placas || 'N/A' };
                                const tech = db.tecnicos.find(t => t.Tecnico_ID === p.Tecnico_Asignado) || { Nombre_Completo: 'Sin Asignar' };
                                let statusBadge = '';
                                if (p.Estado == 1) statusBadge = '<span class="badge-tag badge-warning">Creado</span>';
                                else if (p.Estado == 2) statusBadge = '<span class="badge-tag badge-primary">Aprobado</span>';
                                else if (p.Estado == 3) statusBadge = '<span class="badge-tag badge-success">Facturado</span>';
                                else if (p.Estado == 4) statusBadge = '<span class="badge-tag badge-danger">Anulado</span>';
                                else statusBadge = '<span class="badge-tag badge-success">En Espera</span>';
                                
                                return `
                                    <tr>
                                        <td><strong>${vehicle.Placas}</strong></td>
                                        <td>${p.Nombre}</td>
                                        <td>${tech.Nombre_Completo}</td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.Fallas_Detectadas || 'Mantenimiento General'}</td>
                                        <td>${statusBadge}</td>
                                        <td><a href="#presupuestos?id=${p['ID Presupuesto']}" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-eye"></i> Ver</a></td>
                                    </tr>
                                `;
                            }).join(''))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h3>Distribución de Carga en Taller</h3>
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 1.5rem;">Carga por técnico asignado</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${safe(db.tecnicos.map(t => {
                            const count = db.presupuestos.filter(p => p.Tecnico_Asignado === t.Tecnico_ID && p.Estado !== 3 && p.Estado !== '3' && p.Estado !== 4 && p.Estado !== '4').length;
                            const percentage = Math.min((count / 5) * 100, 100);
                            return `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                        <span>${t.Nombre_Completo}</span>
                                        <strong>${count} autos</strong>
                                    </div>
                                    <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                                        <div style="background: linear-gradient(to right, var(--primary), var(--cyan)); width: ${percentage}%; height: 100%;"></div>
                                    </div>
                                </div>
                            `;
                        }).join(''))}
                    </div>
                </div>
                
                <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1.5rem; text-align: center;">
                    <button class="btn btn-primary" onclick="window.location.hash='#kanban'" style="width: 100%;"><i class="fa-solid fa-magnifying-glass-chart"></i> Ir al Monitoreo en Tiempo Real</button>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = statsHTML;
}
