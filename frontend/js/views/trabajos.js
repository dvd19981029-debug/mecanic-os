import {
    getDatabase,
    saveDatabase,
    getActiveUser,
    getWorkshopConfig
} from '../../app.js?v=33';
import {
    showToast,
    escapeHtml
} from '../utils.js?v=33';

export function renderTrabajosTaller(container) {
    const db = getDatabase();
    
    container.innerHTML = html`
        <div class="glass-card" style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div>
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-screwdriver-wrench" style="color: var(--primary);"></i>
                        Vehículos en Progreso (Taller)
                    </h2>
                    <p style="color: var(--text-secondary); margin: 0.25rem 0 0 0; font-size: 0.85rem;">
                        Listado de vehículos aprobados en reparación activa. Los mecánicos pueden completar trabajos aquí para enviarlos a facturación.
                    </p>
                </div>
                <div class="search-bar-container" style="max-width: 350px; flex-grow: 1; margin: 0;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="jobs-search" placeholder="Buscar por placa, cliente o mecánico...">
                </div>
            </div>
        </div>

        <div id="jobs-grid-container" class="kanban-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
            <!-- Loaded dynamically -->
        </div>
    `;

    const searchInput = document.getElementById('jobs-search');
    const gridContainer = document.getElementById('jobs-grid-container');

    function populateJobsList(filter = '') {
        gridContainer.innerHTML = '';
        
        // Filter budgets in state 2 (Aprobado / Reparación)
        const activeBudgets = db.presupuestos.filter(p => parseInt(p.Estado || 1) === 2);
        
        const filtered = activeBudgets.filter(p => {
            const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === p.ID_Vehiculo) || {};
            const tech = db.tecnicos.find(t => t.Tecnico_ID === p.Tecnico_Asignado) || {};
            
            const term = filter.toLowerCase().trim();
            return (p['ID Presupuesto'] || '').toLowerCase().includes(term) ||
                   (p.Nombre || '').toLowerCase().includes(term) ||
                   (p.Placas || '').toLowerCase().includes(term) ||
                   (vehicle.Marca || '').toLowerCase().includes(term) ||
                   (vehicle.Modelo || '').toLowerCase().includes(term) ||
                   (tech.Nombre_Completo || '').toLowerCase().includes(term);
        });

        // Sort by date descending (newest first)
        filtered.sort((a, b) => new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime());

        if (filtered.length === 0) {
            gridContainer.style.display = 'block';
            gridContainer.innerHTML = html`
                <div class="glass-card" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="fa-solid fa-square-minus" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <h3>No hay vehículos en reparación activa</h3>
                    <p style="font-size: 0.85rem; margin-top: 0.25rem;">Los autos aparecerán aquí una vez que sus cotizaciones sean aprobadas.</p>
                </div>
            `;
            return;
        }

        gridContainer.style.display = 'grid';

        filtered.forEach(p => {
            const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === p.ID_Vehiculo) || { Placas: p.Placas || 'N/A', Marca: 'N/A', Modelo: 'N/A' };
            const tech = db.tecnicos.find(t => t.Tecnico_ID === p.Tecnico_Asignado) || { Nombre_Completo: 'Sin técnico' };
            
            const products = (db.detalle_productos || []).filter(dp => dp['ID_Presupuesto DPP'] === p['ID Presupuesto']);
            const labor = (db.detalle_mano_obra || []).filter(dm => dm['ID_Presupuesto MO'] === p['ID Presupuesto']);

            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';
            card.style.gap = '1rem';
            card.style.borderLeft = '4px solid var(--primary)';
            card.style.padding = '1.25rem';
            
            card.innerHTML = html`
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem; gap: 0.5rem;">
                        <span class="badge-tag badge-primary" style="font-size: 0.75rem; font-weight: bold; letter-spacing: 0.5px;">${escapeHtml(vehicle.Placas || 'P-0000')}</span>
                        <small style="color: var(--text-muted); font-size: 0.7rem;">${new Date(p.Fecha).toLocaleDateString('es-SV', {day:'2-digit', month:'short'})}</small>
                    </div>
                    
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary); font-weight: 600;">${escapeHtml(p.Nombre)}</h3>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0.15rem 0 0.75rem 0;">
                        ${escapeHtml(vehicle.Marca)} ${escapeHtml(vehicle.Modelo)} ${escapeHtml(vehicle.Año || vehicle.Anio || '')}
                    </p>
                    
                    <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 0.65rem 0.85rem; margin-bottom: 1rem; font-size: 0.8rem;">
                        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.35rem;">
                            <span style="color: var(--text-muted); font-weight: 500;">Técnico:</span>
                            <span style="color: var(--text-primary); font-weight: 600;"><i class="fa-solid fa-user-gear" style="font-size: 0.75rem;"></i> ${escapeHtml(tech.Nombre_Completo)}</span>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); font-weight: 500;">Diagnóstico / Fallas:</span>
                            <p style="margin: 0.2rem 0 0 0; color: var(--text-secondary); line-height: 1.3;">
                                ${escapeHtml(p.Fallas_Detectadas || 'Diagnóstico general')}
                            </p>
                        </div>
                    </div>

                    <!-- Tasks and Parts Section -->
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${labor.length > 0 ? safe(html`
                            <div>
                                <h4 style="margin: 0 0 0.25rem 0; font-size: 0.75rem; text-transform: uppercase; color: #a855f7; letter-spacing: 0.5px; font-weight: bold;"><i class="fa-solid fa-screwdriver-wrench"></i> Mano de Obra / Servicios (${labor.length})</h4>
                                <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
                                    ${safe(labor.map(l => `<li>${escapeHtml(l.Descripcion)} <span style="color: var(--text-muted); font-size: 0.75rem;">(Cant: ${l.Cantidad})</span></li>`).join(''))}
                                </ul>
                            </div>
                        `) : ''}

                        ${products.length > 0 ? safe(html`
                            <div>
                                <h4 style="margin: 0 0 0.25rem 0; font-size: 0.75rem; text-transform: uppercase; color: var(--primary); letter-spacing: 0.5px; font-weight: bold;"><i class="fa-solid fa-box-open"></i> Repuestos a Instalar (${products.length})</h4>
                                <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
                                    ${safe(products.map(pr => `<li>${escapeHtml(pr.Descripcion)} <span style="color: var(--text-muted); font-size: 0.75rem;">(Cant: ${pr.Cantidad})</span></li>`).join(''))}
                                </ul>
                            </div>
                        `) : ''}
                    </div>
                </div>

                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                    <a href="#presupuestos?id=${escapeHtml(p['ID Presupuesto'])}" class="btn btn-secondary" style="flex: 1; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; text-decoration: none; padding: 0.45rem; font-size: 0.8rem;">
                        <i class="fa-solid fa-eye"></i> Ver Ficha
                    </a>
                    <button class="btn btn-primary btn-finalize-job" data-id="${p['ID Presupuesto']}" style="flex: 1.5; background: #a855f7; border: none; color: white; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.45rem; font-size: 0.8rem;">
                        <i class="fa-solid fa-circle-check"></i> Finalizar Trabajo
                    </button>
                </div>
            `;
            
            // Add click listener for Finalize Job button
            card.querySelector('.btn-finalize-job').addEventListener('click', (e) => {
                const budgetId = e.currentTarget.getAttribute('data-id');
                const targetBudget = db.presupuestos.find(x => x['ID Presupuesto'] === budgetId);
                if (targetBudget) {
                    if (confirm(`¿Confirmas que se han completado todas las reparaciones del vehículo ${targetBudget.Placas || ''} de ${targetBudget.Nombre || ''}? El vehículo se enviará a caja para su cobro.`)) {
                        targetBudget.Estado = 5; // Trabajos Finalizados
                        saveDatabase(db);
                        showToast("Trabajos completados con éxito. Vehículo enviado a caja.", "success");
                        populateJobsList(searchInput.value);
                    }
                }
            });

            gridContainer.appendChild(card);
        });
    }

    searchInput.addEventListener('input', (e) => populateJobsList(e.target.value));
    populateJobsList();
}
