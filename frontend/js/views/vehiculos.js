import {
    getDatabase,
    saveDatabase,
    getActiveUser
} from '../../app.js';
import {
    showToast,
    escapeHtml
} from '../utils.js';

export function renderVehiculos(container) {
    const db = getDatabase();

    // Data structures
    const vehiculosList = db['02 Vehiculos'] || db.vehiculos || [];
    const clientesList = db['01 Clientes'] || db.clientes || [];
    const ingresosList = db['03 Hojas de Ingreso'] || [];
    const presupuestosList = db['04 Presupuestos'] || [];
    const trabajosList = db['05 Trabajos en Progreso'] || [];
    const revisionesList = db['21 Puntos'] || [];

    // Map clients by Code / ID for fast lookup
    const clientMap = new Map();
    clientesList.forEach(c => {
        const id = c.ID_Cliente || c.Codigo_Cliente || c.id;
        if (id) clientMap.set(id, c);
        if (c.Nombre) clientMap.set(c.Nombre.toLowerCase(), c);
    });

    // Helper to resolve client for a vehicle
    function getVehicleClient(v) {
        const clientId = v.ID_Cliente || v.Cliente_ID || v.Cliente;
        if (clientId && clientMap.has(clientId)) {
            return clientMap.get(clientId);
        }
        if (v.Propietario && clientMap.has(v.Propietario.toLowerCase())) {
            return clientMap.get(v.Propietario.toLowerCase());
        }
        return {
            Nombre: v.Propietario || v.Nombre_Cliente || 'Consumidor Final',
            Telefono: v.Telefono || v.Contacto || 'N/A',
            Email: v.Email || ''
        };
    }

    // Helper to get stats for a vehicle
    function getVehicleStats(placa) {
        if (!placa) return { ingresosCount: 0, presupuestosCount: 0, trabajosCount: 0, revisionesCount: 0, enTaller: false, ingresos: [], presupuestos: [], trabajos: [], revisiones: [] };
        const pUpper = placa.trim().toUpperCase();

        const vIngresos = ingresosList.filter(i => (i.Placa || i.ID_Vehiculo || '').trim().toUpperCase() === pUpper);
        const vPresupuestos = presupuestosList.filter(p => (p.Placa || p.ID_Vehiculo || '').trim().toUpperCase() === pUpper);
        const vTrabajos = trabajosList.filter(t => (t.Placa || t.ID_Vehiculo || '').trim().toUpperCase() === pUpper);
        const vRevisiones = revisionesList.filter(r => (r.Placa || r.ID_Vehiculo || '').trim().toUpperCase() === pUpper);

        const enTaller = vIngresos.some(i => i.Estado === 'EN_PROCESO' || i.Estado === 'PENDIENTE') ||
                         vTrabajos.some(t => t.Estado !== 'ENTREGADO' && t.Estado !== 'FINALIZADO');

        return {
            ingresosCount: vIngresos.length,
            presupuestosCount: vPresupuestos.length,
            trabajosCount: vTrabajos.length,
            revisionesCount: vRevisiones.length,
            enTaller,
            ingresos: vIngresos,
            presupuestos: vPresupuestos,
            trabajos: vTrabajos,
            revisiones: vRevisiones
        };
    }

    // Brands list for dropdown
    const brandsSet = new Set();
    vehiculosList.forEach(v => { if (v.Marca) brandsSet.add(v.Marca.trim().toUpperCase()); });
    const brandsList = Array.from(brandsSet).sort();

    // Stats calculations
    const totalVehicles = vehiculosList.length;
    let vehiclesInShop = 0;
    vehiculosList.forEach(v => {
        if (getVehicleStats(v.Placa || v.ID_Vehiculo).enTaller) vehiclesInShop++;
    });

    container.innerHTML = html`
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
            <div>
                <h1 style="margin:0; font-family:'Outfit', sans-serif; font-size:1.75rem; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
                    <i class="fa-solid fa-car" style="color:var(--primary);"></i> Gestión & Expedientes de Vehículos
                </h1>
                <p style="color:var(--text-secondary); margin:0.25rem 0 0 0; font-size:0.9rem;">
                    Catálogo completo de vehículos registrados e historial técnico de servicios.
                </p>
            </div>
            <div>
                <button class="btn btn-primary" id="btn-add-vehicle-direct" style="padding:0.6rem 1.25rem; font-weight:600;">
                    <i class="fa-solid fa-plus"></i> Registrar Vehículo
                </button>
            </div>
        </div>

        <!-- Metric Cards -->
        <div class="metrics-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1.25rem; margin-bottom:1.75rem;">
            <div class="glass-card" style="padding:1.25rem; display:flex; align-items:center; gap:1rem;">
                <div style="width:48px; height:48px; border-radius:12px; background:rgba(99, 102, 241, 0.15); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
                    <i class="fa-solid fa-car-side"></i>
                </div>
                <div>
                    <span style="font-size:0.8rem; color:var(--text-secondary); display:block;">Total Vehículos</span>
                    <strong style="font-size:1.5rem; font-family:'Outfit', sans-serif; color:var(--text-primary);">${totalVehicles}</strong>
                </div>
            </div>

            <div class="glass-card" style="padding:1.25rem; display:flex; align-items:center; gap:1rem;">
                <div style="width:48px; height:48px; border-radius:12px; background:rgba(16, 185, 129, 0.15); color:var(--success); display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
                    <i class="fa-solid fa-screwdriver-wrench"></i>
                </div>
                <div>
                    <span style="font-size:0.8rem; color:var(--text-secondary); display:block;">Actualmente en Taller</span>
                    <strong style="font-size:1.5rem; font-family:'Outfit', sans-serif; color:var(--success);">${vehiclesInShop}</strong>
                </div>
            </div>

            <div class="glass-card" style="padding:1.25rem; display:flex; align-items:center; gap:1rem;">
                <div style="width:48px; height:48px; border-radius:12px; background:rgba(6, 182, 212, 0.15); color:var(--cyan); display:flex; align-items:center; justify-content:center; font-size:1.4rem;">
                    <i class="fa-solid fa-tags"></i>
                </div>
                <div>
                    <span style="font-size:0.8rem; color:var(--text-secondary); display:block;">Marcas Atendidas</span>
                    <strong style="font-size:1.5rem; font-family:'Outfit', sans-serif; color:var(--cyan);">${brandsList.length}</strong>
                </div>
            </div>
        </div>

        <!-- Filter and Search Bar -->
        <div class="glass-card" style="padding:1.25rem; margin-bottom:1.5rem;">
            <div style="display:flex; gap:1rem; flex-wrap:wrap; align-items:center; justify-content:space-between;">
                <div class="search-bar-container" style="flex-grow:1; max-width:400px; margin:0;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="veh-search-input" placeholder="Buscar por Placa, Marca, Modelo, VIN, Propietario...">
                </div>

                <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
                    <select id="veh-brand-filter" style="padding:0.6rem 1rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px; font-size:0.85rem;">
                        <option value="">Todas las Marcas (${brandsList.length})</option>
                        ${safe(brandsList.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join(''))}
                    </select>

                    <select id="veh-status-filter" style="padding:0.6rem 1rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:6px; font-size:0.85rem;">
                        <option value="">Todos los Estados</option>
                        <option value="en_taller">En Taller Actualmente</option>
                        <option value="fuera">Fuera de Taller</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Table Card -->
        <div class="glass-card" style="padding:1.25rem;">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Placa / ID</th>
                            <th>Vehículo</th>
                            <th>Año / Color</th>
                            <th>Propietario / Cliente</th>
                            <th>VIN / Motor</th>
                            <th>Historial</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="veh-table-body">
                        <!-- Dynamic Injection -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Expediente Modal / Drawer -->
        <div id="veh-expediente-modal" class="modal" style="display:none;">
            <div class="modal-content glass-card" style="max-width:900px; width:95%; max-height:90vh; overflow-y:auto; padding:1.75rem;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                    <div>
                        <h2 id="exp-modal-title" style="margin:0; font-family:'Outfit', sans-serif; font-size:1.5rem; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
                            <i class="fa-solid fa-car" style="color:var(--primary);"></i> Expediente del Vehículo
                        </h2>
                        <span id="exp-modal-subtitle" style="color:var(--text-secondary); font-size:0.85rem;">Historial completo de servicios y reparaciones</span>
                    </div>
                    <button class="close-modal-btn" id="close-veh-expediente-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.75rem; cursor:pointer; padding:0 0.5rem;">&times;</button>
                </div>

                <div id="exp-modal-body">
                    <!-- Injected dynamically -->
                </div>
            </div>
        </div>
    `;

    // Render Table Function
    function renderVehiclesTable() {
        const tableBody = document.getElementById('veh-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const searchText = (document.getElementById('veh-search-input').value || '').trim().toLowerCase();
        const selectedBrand = (document.getElementById('veh-brand-filter').value || '').trim().toUpperCase();
        const selectedStatus = document.getElementById('veh-status-filter').value;

        const filtered = vehiculosList.filter(v => {
            const placa = (v.Placa || v.ID_Vehiculo || '').toLowerCase();
            const marca = (v.Marca || '').toLowerCase();
            const modelo = (v.Modelo || '').toLowerCase();
            const anio = (v.Año || v.Anio || '').toString().toLowerCase();
            const vin = (v.VIN || v.Chasis || v.N_Chasis || '').toLowerCase();
            const motor = (v.Motor || v.N_Motor || '').toLowerCase();
            const color = (v.Color || '').toLowerCase();

            const client = getVehicleClient(v);
            const clientName = (client.Nombre || '').toLowerCase();

            const matchesSearch = !searchText || (
                placa.includes(searchText) ||
                marca.includes(searchText) ||
                modelo.includes(searchText) ||
                anio.includes(searchText) ||
                vin.includes(searchText) ||
                motor.includes(searchText) ||
                color.includes(searchText) ||
                clientName.includes(searchText)
            );

            const matchesBrand = !selectedBrand || (v.Marca || '').trim().toUpperCase() === selectedBrand;

            const stats = getVehicleStats(v.Placa || v.ID_Vehiculo);
            let matchesStatus = true;
            if (selectedStatus === 'en_taller') matchesStatus = stats.enTaller;
            if (selectedStatus === 'fuera') matchesStatus = !stats.enTaller;

            return matchesSearch && matchesBrand && matchesStatus;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:3rem; color:var(--text-muted);">No se encontraron vehículos registrados que coincidan con la búsqueda.</td></tr>`;
            return;
        }

        filtered.forEach(v => {
            const placa = v.Placa || v.ID_Vehiculo || 'S/N';
            const client = getVehicleClient(v);
            const stats = getVehicleStats(placa);

            const tr = document.createElement('tr');
            tr.innerHTML = html`
                <td>
                    <strong style="font-family:monospace; font-size:0.95rem; background:rgba(99,102,241,0.1); color:var(--primary); padding:0.25rem 0.6rem; border-radius:4px; border:1px solid rgba(99,102,241,0.2);">
                        ${escapeHtml(placa)}
                    </strong>
                </td>
                <td>
                    <strong style="color:var(--text-primary); display:block;">${escapeHtml(v.Marca || '')} ${escapeHtml(v.Modelo || '')}</strong>
                    <span style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(v.Tipo || 'Automóvil')}</span>
                </td>
                <td>
                    <span>${escapeHtml(v.Año || v.Anio || 'N/A')}</span>
                    ${safe(v.Color ? `<div style="font-size:0.75rem; color:var(--text-secondary);"><i class="fa-solid fa-palette" style="font-size:0.7rem;"></i> ${escapeHtml(v.Color)}</div>` : '')}
                </td>
                <td>
                    <strong style="display:block; color:var(--text-primary); font-size:0.85rem;">${escapeHtml(client.Nombre || 'Consumidor Final')}</strong>
                    <span style="font-size:0.75rem; color:var(--text-secondary);"><i class="fa-solid fa-phone" style="font-size:0.7rem;"></i> ${escapeHtml(client.Telefono || 'N/A')}</span>
                </td>
                <td>
                    <span style="font-family:monospace; font-size:0.75rem; color:var(--text-secondary); display:block;" title="VIN / Chasis">VIN: ${escapeHtml(v.VIN || v.Chasis || 'N/A')}</span>
                    <span style="font-family:monospace; font-size:0.75rem; color:var(--text-muted); display:block;" title="Motor">Mot: ${escapeHtml(v.Motor || v.N_Motor || 'N/A')}</span>
                </td>
                <td>
                    <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
                        <span class="badge-tag badge-secondary" title="Recepciones de taller" style="font-size:0.7rem;"><i class="fa-solid fa-file-signature"></i> ${stats.ingresosCount}</span>
                        <span class="badge-tag badge-secondary" title="Presupuestos emitidos" style="font-size:0.7rem;"><i class="fa-solid fa-file-invoice-dollar"></i> ${stats.presupuestosCount}</span>
                        <span class="badge-tag badge-secondary" title="Trabajos de reparación" style="font-size:0.7rem;"><i class="fa-solid fa-screwdriver-wrench"></i> ${stats.trabajosCount}</span>
                    </div>
                </td>
                <td>
                    ${safe(stats.enTaller
                        ? `<span class="badge-tag badge-success" style="font-size:0.75rem; font-weight:600;"><i class="fa-solid fa-circle-dot"></i> En Taller</span>`
                        : `<span class="badge-tag badge-secondary" style="font-size:0.75rem;"><i class="fa-solid fa-circle-check"></i> Fuera</span>`
                    )}
                </td>
                <td>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                        <button class="btn btn-primary btn-expediente-veh" data-placa="${escapeHtml(placa)}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600; display:inline-flex; align-items:center; gap:0.35rem;">
                            <i class="fa-solid fa-folder-open"></i> Expediente
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Bind Expediente button click
        tableBody.querySelectorAll('.btn-expediente-veh').forEach(btn => {
            btn.addEventListener('click', () => {
                const placa = btn.getAttribute('data-placa');
                openVehicleExpedienteModal(placa);
            });
        });
    }

    // Open Expediente Modal
    function openVehicleExpedienteModal(placa) {
        const veh = vehiculosList.find(v => (v.Placa || v.ID_Vehiculo || '').trim().toUpperCase() === placa.trim().toUpperCase()) || { Placa: placa };
        const client = getVehicleClient(veh);
        const stats = getVehicleStats(placa);

        const modal = document.getElementById('veh-expediente-modal');
        const modalTitle = document.getElementById('exp-modal-title');
        const modalSub = document.getElementById('exp-modal-subtitle');
        const modalBody = document.getElementById('exp-modal-body');

        modalTitle.innerHTML = `<i class="fa-solid fa-car" style="color:var(--primary);"></i> Expediente del Vehículo: <span style="font-family:monospace; color:var(--primary);">${escapeHtml(placa)}</span>`;
        modalSub.textContent = `${veh.Marca || ''} ${veh.Modelo || ''} ${veh.Año || veh.Anio || ''} • Propietario: ${client.Nombre || 'Consumidor Final'}`;

        let activeTab = 'ingresos';

        function renderModalTabs() {
            modalBody.innerHTML = html`
                <!-- Header Info Card -->
                <div style="background:var(--bg-input); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.5rem; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
                    <div>
                        <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">Vehículo</span>
                        <strong style="font-size:1.1rem; color:var(--text-primary);">${escapeHtml(veh.Marca || '')} ${escapeHtml(veh.Modelo || '')} (${escapeHtml(veh.Año || veh.Anio || 'N/A')})</strong>
                        <span style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-top:0.2rem;">Color: ${escapeHtml(veh.Color || 'N/A')} • Transmisión: ${escapeHtml(veh.Transmision || 'N/A')}</span>
                    </div>
                    <div>
                        <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">Propietario / Cliente</span>
                        <strong style="font-size:1rem; color:var(--text-primary);">${escapeHtml(client.Nombre || 'Consumidor Final')}</strong>
                        <span style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-top:0.2rem;"><i class="fa-solid fa-phone"></i> ${escapeHtml(client.Telefono || 'N/A')}</span>
                    </div>
                    <div>
                        <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">Identificación Técnica</span>
                        <span style="font-family:monospace; font-size:0.8rem; color:var(--text-primary); display:block;">VIN: ${escapeHtml(veh.VIN || veh.Chasis || 'N/A')}</span>
                        <span style="font-family:monospace; font-size:0.8rem; color:var(--text-secondary); display:block;">Motor: ${escapeHtml(veh.Motor || veh.N_Motor || 'N/A')}</span>
                    </div>
                </div>

                <!-- Tabs Navigation -->
                <div style="display:flex; gap:0.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; margin-bottom:1.25rem; flex-wrap:wrap;">
                    <button class="btn ${activeTab === 'ingresos' ? 'btn-primary' : 'btn-secondary'}" id="exp-tab-ingresos" style="padding:0.45rem 0.9rem; font-size:0.85rem;">
                        <i class="fa-solid fa-file-signature"></i> Recepciones / Ingresos (${stats.ingresosCount})
                    </button>
                    <button class="btn ${activeTab === 'trabajos' ? 'btn-primary' : 'btn-secondary'}" id="exp-tab-trabajos" style="padding:0.45rem 0.9rem; font-size:0.85rem;">
                        <i class="fa-solid fa-screwdriver-wrench"></i> Ordenes de Trabajo (${stats.trabajosCount})
                    </button>
                    <button class="btn ${activeTab === 'presupuestos' ? 'btn-primary' : 'btn-secondary'}" id="exp-tab-presupuestos" style="padding:0.45rem 0.9rem; font-size:0.85rem;">
                        <i class="fa-solid fa-file-invoice-dollar"></i> Presupuestos (${stats.presupuestosCount})
                    </button>
                    <button class="btn ${activeTab === 'revisiones' ? 'btn-primary' : 'btn-secondary'}" id="exp-tab-revisiones" style="padding:0.45rem 0.9rem; font-size:0.85rem;">
                        <i class="fa-solid fa-clipboard-check"></i> Inspecciones 21 Puntos (${stats.revisionesCount})
                    </button>
                </div>

                <!-- Tab Content Area -->
                <div id="exp-tab-content">
                    ${safe(renderTabContent(activeTab, stats))}
                </div>
            `;

            // Bind Tab Click Handlers
            document.getElementById('exp-tab-ingresos').onclick = () => { activeTab = 'ingresos'; renderModalTabs(); };
            document.getElementById('exp-tab-trabajos').onclick = () => { activeTab = 'trabajos'; renderModalTabs(); };
            document.getElementById('exp-tab-presupuestos').onclick = () => { activeTab = 'presupuestos'; renderModalTabs(); };
            document.getElementById('exp-tab-revisiones').onclick = () => { activeTab = 'revisiones'; renderModalTabs(); };
        }

        renderModalTabs();
        modal.style.display = 'flex';
        modal.classList.add('active');

        // Close button handler
        const closeBtn = document.getElementById('close-veh-expediente-modal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
                modal.classList.remove('active');
            };
        }
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
            }
        };
    }

    // Helper to render active tab content inside expediente modal
    function renderTabContent(tab, stats) {
        if (tab === 'ingresos') {
            if (stats.ingresos.length === 0) {
                return `<p style="text-align:center; color:var(--text-muted); padding:2rem;">No hay registros de ingreso en recepción para este vehículo.</p>`;
            }
            return html`
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha Ingreso</th>
                                <th>Kilometraje</th>
                                <th>Falla / Motivo Reportado</th>
                                <th>Nivel Combustible</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(stats.ingresos.map(ing => {
                                const dateStr = ing['Marca Temporal'] ? new Date(ing['Marca Temporal']).toLocaleString('es-SV') : (ing.Fecha || 'N/A');
                                return html`
                                    <tr>
                                        <td><strong>${dateStr}</strong></td>
                                        <td><span style="font-family:monospace;">${escapeHtml(ing.Kilometraje || 'N/A')} Km</span></td>
                                        <td>${escapeHtml(ing[' Falla / Motivo de Ingreso'] || ing.Falla || ing.Motivo || 'Revisión General')}</td>
                                        <td>${escapeHtml(ing.Combustible || 'N/A')}</td>
                                        <td><span class="badge-tag badge-secondary">${escapeHtml(ing.Estado || 'Procesado')}</span></td>
                                    </tr>
                                `;
                            }).join(''))}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (tab === 'trabajos') {
            if (stats.trabajos.length === 0) {
                return `<p style="text-align:center; color:var(--text-muted); padding:2rem;">No hay órdenes de trabajo registradas para este vehículo.</p>`;
            }
            return html`
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Trabajo / Servicio</th>
                                <th>Técnico Asignado</th>
                                <th>Total ($)</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(stats.trabajos.map(t => {
                                const dateStr = t['Marca Temporal'] ? new Date(t['Marca Temporal']).toLocaleDateString('es-SV') : (t.Fecha || 'N/A');
                                return html`
                                    <tr>
                                        <td>${dateStr}</td>
                                        <td><strong>${escapeHtml(t.Servicio || t.Trabajo || t.Descripcion || 'Mantenimiento General')}</strong></td>
                                        <td>${escapeHtml(t.Tecnico || t.Mecanico || 'No Asignado')}</td>
                                        <td><strong>$ ${(parseFloat(t.Total || t.total || 0)).toFixed(2)}</strong></td>
                                        <td><span class="badge-tag ${t.Estado === 'FINALIZADO' || t.Estado === 'ENTREGADO' ? 'badge-success' : 'badge-secondary'}">${escapeHtml(t.Estado || 'En Proceso')}</span></td>
                                    </tr>
                                `;
                            }).join(''))}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (tab === 'presupuestos') {
            if (stats.presupuestos.length === 0) {
                return `<p style="text-align:center; color:var(--text-muted); padding:2rem;">No hay presupuestos emitidos para este vehículo.</p>`;
            }
            return html`
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código Presupuesto</th>
                                <th>Fecha</th>
                                <th>Subtotal</th>
                                <th>IVA (13%)</th>
                                <th>Total ($)</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(stats.presupuestos.map(p => {
                                const dateStr = p['Marca Temporal'] ? new Date(p['Marca Temporal']).toLocaleDateString('es-SV') : (p.Fecha || 'N/A');
                                const statusClass = p.Estado === 'APROBADO' ? 'badge-success' : (p.Estado === 'RECHAZADO' ? 'badge-danger' : 'badge-secondary');
                                return html`
                                    <tr>
                                        <td><strong style="font-family:monospace; color:var(--primary);">${escapeHtml(p.ID_Presupuesto || p.id || 'N/A')}</strong></td>
                                        <td>${dateStr}</td>
                                        <td>$ ${(parseFloat(p.Subtotal || p.subtotal || 0)).toFixed(2)}</td>
                                        <td>$ ${(parseFloat(p.IVA || p.iva || 0)).toFixed(2)}</td>
                                        <td><strong>$ ${(parseFloat(p.Total || p.total || 0)).toFixed(2)}</strong></td>
                                        <td><span class="badge-tag ${statusClass}">${escapeHtml(p.Estado || 'PENDIENTE')}</span></td>
                                    </tr>
                                `;
                            }).join(''))}
                        </tbody>
                    </table>
                </div>
            `;
        }

        if (tab === 'revisiones') {
            if (stats.revisiones.length === 0) {
                return `<p style="text-align:center; color:var(--text-muted); padding:2rem;">No hay hojas de inspección de 21 Puntos registradas para este vehículo.</p>`;
            }
            return html`
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha Inspección</th>
                                <th>Inspector / Técnico</th>
                                <th>Resumen de Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(stats.revisiones.map(r => {
                                const dateStr = r['Marca Temporal'] ? new Date(r['Marca Temporal']).toLocaleString('es-SV') : (r.Fecha || 'N/A');
                                return html`
                                    <tr>
                                        <td><strong>${dateStr}</strong></td>
                                        <td>${escapeHtml(r.Tecnico || r.Inspector || 'Taller')}</td>
                                        <td><span class="badge-tag badge-secondary">Inspección de 21 Puntos Completada</span></td>
                                        <td>
                                            <a href="#revision-21" class="btn btn-secondary" style="padding:0.25rem 0.5rem; font-size:0.75rem;">
                                                <i class="fa-solid fa-eye"></i> Ver Inspección
                                            </a>
                                        </td>
                                    </tr>
                                `;
                            }).join(''))}
                        </tbody>
                    </table>
                </div>
            `;
        }

        return '';
    }

    // Event listeners setup
    document.getElementById('veh-search-input').oninput = renderVehiclesTable;
    document.getElementById('veh-brand-filter').onchange = renderVehiclesTable;
    document.getElementById('veh-status-filter').onchange = renderVehiclesTable;

    document.getElementById('btn-add-vehicle-direct').onclick = () => {
        window.location.hash = 'clientes-vehiculos';
    };

    // Initial render
    renderVehiclesTable();
}
