import {
    getDatabase,
    saveDatabase,
    getActiveUser,
    getBudgetGrandTotal,
    setupMarcasModelosSelect
} from '../../app.js';
import {
    showToast,
    escapeHtml
} from '../utils.js';
import { exportBudgetPDF } from './presupuestos.js';


export function renderVehiculos(container) {
    const db = getDatabase();

    // Data structures - Combine db.vehiculos and db['02 Vehiculos'] removing duplicates
    const rawVehicles = [...(db.vehiculos || []), ...(db['02 Vehiculos'] || [])];
    const vehiculosMap = new Map();
    rawVehicles.forEach(v => {
        const key = v.ID_Vehiculo || v.Placas || v.Placa || JSON.stringify(v);
        if (!vehiculosMap.has(key)) vehiculosMap.set(key, v);
    });
    const vehiculosList = Array.from(vehiculosMap.values());

    const clientesList = db.clientes || db['01 Clientes'] || [];
    const ingresosList = db.ingresos || db['03 Hojas de Ingreso'] || [];
    const presupuestosList = db.presupuestos || db['04 Presupuestos'] || [];
    const trabajosList = db.trabajos || db['05 Trabajos en Progreso'] || [];
    const revisionesList = db.revisiones || db['21 Puntos'] || [];

    // Helper to get Placa
    function getVehiclePlaca(v) {
        if (!v) return 'S/N';
        return (v.Placas || v.Placa || v.placas || v['Número de Placas'] || v.ID_Vehiculo || 'S/N').trim();
    }

    // Map clients by Code / ID / Name for fast lookup
    const clientMap = new Map();
    clientesList.forEach(c => {
        const id = c.ID_Cliente || c.Codigo_Cliente || c.id;
        if (id) clientMap.set(id, c);
        if (c.Nombre) clientMap.set(c.Nombre.toLowerCase(), c);
    });

    // Helper to resolve client for a vehicle
    function getVehicleClient(v) {
        const clientId = v.ID_Cliente || v.Cliente_ID || v.Cliente || v.Codigo_Cliente;
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

    // Helper to get stats and history for a vehicle
    function getVehicleStats(v) {
        if (!v) return { ingresosCount: 0, presupuestosCount: 0, trabajosCount: 0, revisionesCount: 0, enTaller: false, ingresos: [], presupuestos: [], trabajos: [], revisiones: [] };
        
        const placa = getVehiclePlaca(v).toUpperCase();
        const idVeh = (v.ID_Vehiculo || '').trim().toUpperCase();

        const match = (item) => {
            if (!item) return false;
            const itemPlaca = (item.Placas || item.Placa || item.placas || item['Número de Placas'] || item.ID_Vehiculo || '').trim().toUpperCase();
            const itemVehId = (item.ID_Vehiculo || '').trim().toUpperCase();
            return (placa && placa !== 'S/N' && itemPlaca === placa) || (idVeh && itemVehId === idVeh);
        };

        const vIngresos = ingresosList.filter(match);
        const vPresupuestos = presupuestosList.filter(match);
        
        // Work orders correspond to budgets that reached production/repair/billing (states: 2 = En Reparación, 5 = Finalizado, 3 = Facturado) or legacy db.trabajos
        const legacyTrabajos = trabajosList.filter(match);
        const budgetTrabajos = vPresupuestos.filter(p => {
            const st = parseInt(p.Estado || 0);
            return [2, 3, 5].includes(st);
        });
        const vTrabajos = budgetTrabajos.length > 0 ? budgetTrabajos : legacyTrabajos;

        const vRevisiones = revisionesList.filter(match);

        const vPresupuestosActive = vPresupuestos.some(p => {
            const st = parseInt(p.Estado || 0);
            return st === 2;
        });

        const vIngresosActive = vIngresos.some(i => {
            const st = (i.Estado || '').toString().trim().toUpperCase();
            return st === 'EN_PROCESO' || st === 'PENDIENTE' || st === 'EN PROCESO' || st === 'EN TALLER' || st === 'PROCESO';
        });

        const vTrabajosActive = vTrabajos.some(t => {
            const st = parseInt(t.Estado || 0);
            return st === 2;
        });

        const enTaller = vPresupuestosActive || vIngresosActive || vTrabajosActive;

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
        if (getVehicleStats(v).enTaller) vehiclesInShop++;
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
                    <input type="text" id="veh-search-input" placeholder="Buscar por Placa, N° Equipo, Marca, Modelo, VIN, Propietario...">
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
                            <th>PLACA</th>
                            <th>VEHÍCULO</th>
                            <th>N° EQUIPO</th>
                            <th>AÑO / COLOR</th>
                            <th>PROPIETARIO / CLIENTE</th>
                            <th>VIN / MOTOR</th>
                            <th>HISTORIAL</th>
                            <th>ESTADO</th>
                            <th>ACCIONES</th>
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

        <!-- Modal Editar Vehículo -->
        <div id="veh-edit-modal" class="modal" style="display:none; align-items:center; justify-content:center;">
            <div class="modal-content glass-card" style="max-width:650px; width:95%; max-height:90vh; overflow-y:auto; padding:1.75rem;">
                <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                    <h3 style="margin:0; font-family:'Outfit', sans-serif; font-size:1.3rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:0.5rem;">
                        <i class="fa-solid fa-pen-to-square" style="color:var(--primary);"></i> Editar Registro de Vehículo
                    </h3>
                    <button class="close-modal-btn" id="close-veh-edit-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>

                <form id="veh-edit-form" style="display:flex; flex-direction:column; gap:1rem;">
                    <input type="hidden" id="edit-v-key">

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">Número de Placas / Identificador *</label>
                            <input type="text" id="edit-v-placa" required style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-weight:700;">
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">Número de Equipo</label>
                            <input type="text" id="edit-v-equipo" placeholder="Ej: PU-620" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">Marca *</label>
                            <input type="text" id="edit-v-marca" required placeholder="Ej: TOYOTA" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">Modelo *</label>
                            <input type="text" id="edit-v-modelo" required placeholder="Ej: HILUX" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">Año</label>
                            <input type="text" id="edit-v-year" placeholder="2024" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">Color</label>
                            <input type="text" id="edit-v-color" placeholder="Ej: BLANCO" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">Tipo</label>
                            <input type="text" id="edit-v-tipo" placeholder="Automóvil, Pick-up, etc." style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">VIN / Chasis</label>
                            <input type="text" id="edit-v-vin" placeholder="N° VIN" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-family:monospace;">
                        </div>
                        <div class="form-group">
                            <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">Número de Motor</label>
                            <input type="text" id="edit-v-motor" placeholder="N° Motor" style="width:100%; padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary); font-family:monospace;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">Cliente / Propietario Asignado</label>
                        <select id="edit-v-cliente" style="width:100%; height:38px; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; color:var(--text-primary);">
                            <option value="">-- Sin Cliente Asignado / Consumidor Final --</option>
                            ${safe(clientesList.map(c => `<option value="${escapeHtml(c.ID_Cliente || c.Codigo_Cliente || '')}">${escapeHtml(c.Nombre || '')} (${escapeHtml(c.Codigo_Cliente || 'N/A')})</option>`).join(''))}
                        </select>
                    </div>

                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.75rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-veh-edit">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Guardar Cambios</button>
                    </div>
                </form>
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
            const placa = getVehiclePlaca(v).toLowerCase();
            const idVeh = (v.ID_Vehiculo || '').toLowerCase();
            const marca = (v.Marca || '').toLowerCase();
            const modelo = (v.Modelo || '').toLowerCase();
            const anio = (v.Año || v.Anio || '').toString().toLowerCase();
            const vin = (v.VIN || v.Chasis || v.N_Chasis || v.Nª_VIN || '').toLowerCase();
            const motor = (v.Motor || v.N_Motor || '').toLowerCase();
            const color = (v.Color || '').toLowerCase();
            const nEquipo = (v.N_Equipo || v.N_equipo || v.Num_Equipo || v.Equipo || v.No_Equipo || v['N° Equipo'] || v['Número de Equipo'] || '').toString().toLowerCase();

            const client = getVehicleClient(v);
            const clientName = (client.Nombre || '').toLowerCase();

            const matchesSearch = !searchText || (
                placa.includes(searchText) ||
                idVeh.includes(searchText) ||
                marca.includes(searchText) ||
                modelo.includes(searchText) ||
                anio.includes(searchText) ||
                vin.includes(searchText) ||
                motor.includes(searchText) ||
                color.includes(searchText) ||
                nEquipo.includes(searchText) ||
                clientName.includes(searchText)
            );

            const matchesBrand = !selectedBrand || (v.Marca || '').trim().toUpperCase() === selectedBrand;

            const stats = getVehicleStats(v);
            let matchesStatus = true;
            if (selectedStatus === 'en_taller') matchesStatus = stats.enTaller;
            if (selectedStatus === 'fuera') matchesStatus = !stats.enTaller;

            return matchesSearch && matchesBrand && matchesStatus;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:3rem; color:var(--text-muted);">No se encontraron vehículos registrados que coincidan con la búsqueda.</td></tr>`;
            return;
        }

        filtered.forEach(v => {
            const placa = getVehiclePlaca(v);
            const idVeh = v.ID_Vehiculo || '';
            const nEquipoVal = (v.N_Equipo || v.N_equipo || v.Num_Equipo || v.Equipo || v.No_Equipo || v['N° Equipo'] || v['Número de Equipo'] || '').toString().trim();
            const client = getVehicleClient(v);
            const stats = getVehicleStats(v);

            const tr = document.createElement('tr');
            tr.innerHTML = html`
                <td>
                    <strong style="font-family:monospace; font-size:1.05rem; background:rgba(99,102,241,0.15); color:var(--primary); padding:0.3rem 0.75rem; border-radius:6px; border:1px solid rgba(99,102,241,0.3); display:inline-block;">
                        <i class="fa-solid fa-id-card" style="font-size:0.85rem; margin-right:0.35rem;"></i>${escapeHtml(placa)}
                    </strong>
                    ${safe(idVeh && idVeh !== placa ? `<span style="display:block; font-family:monospace; font-size:0.7rem; color:var(--text-muted); margin-top:0.2rem;">ID: ${escapeHtml(idVeh)}</span>` : '')}
                </td>
                <td>
                    <strong style="color:var(--text-primary); display:block; font-size:0.95rem;">${escapeHtml(v.Marca || '')} ${escapeHtml(v.Modelo || '')}</strong>
                    <span style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(v.Tipo || 'Automóvil')}</span>
                </td>
                <td>
                    ${safe(nEquipoVal ? `<span style="font-family:monospace; font-weight:700; font-size:0.85rem; color:var(--cyan); border:1px solid rgba(6,182,212,0.3); background:rgba(6,182,212,0.1); padding:0.25rem 0.6rem; border-radius:5px; display:inline-block;"><i class="fa-solid fa-hashtag" style="font-size:0.75rem; margin-right:0.2rem;"></i>${escapeHtml(nEquipoVal)}</span>` : '<span style="color:var(--text-muted); font-size:0.8rem;">-</span>')}
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
                        <button class="btn btn-secondary btn-edit-veh" data-key="${escapeHtml(v.ID_Vehiculo || placa)}" title="Editar Vehículo" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600; display:inline-flex; align-items:center; gap:0.35rem;">
                            <i class="fa-solid fa-pen-to-square"></i> Editar
                        </button>
                        <button class="btn btn-primary btn-expediente-veh" data-key="${escapeHtml(v.ID_Vehiculo || placa)}" style="padding:0.35rem 0.65rem; font-size:0.8rem; font-weight:600; display:inline-flex; align-items:center; gap:0.35rem;">
                            <i class="fa-solid fa-folder-open"></i> Expediente
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Bind Edit & Expediente button clicks
        tableBody.querySelectorAll('.btn-edit-veh').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-key');
                const veh = vehiculosList.find(v => (v.ID_Vehiculo || getVehiclePlaca(v)) === key);
                openEditVehicleModal(veh);
            });
        });

        tableBody.querySelectorAll('.btn-expediente-veh').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-key');
                const veh = vehiculosList.find(v => (v.ID_Vehiculo || getVehiclePlaca(v)) === key);
                openVehicleExpedienteModal(veh);
            });
        });
    }

    // Open Edit Vehicle Modal Function
    function openEditVehicleModal(veh) {
        if (!veh) return;
        const key = veh.ID_Vehiculo || getVehiclePlaca(veh);
        const placa = getVehiclePlaca(veh);
        const nEquipoVal = (veh.N_Equipo || veh.N_equipo || veh.Num_Equipo || veh.Equipo || veh.No_Equipo || veh['N° Equipo'] || veh['Número de Equipo'] || '').toString().trim();
        const client = getVehicleClient(veh);

        document.getElementById('edit-v-key').value = key;
        document.getElementById('edit-v-placa').value = placa;
        document.getElementById('edit-v-equipo').value = nEquipoVal;
        document.getElementById('edit-v-year').value = veh.Año || veh.Anio || '';
        document.getElementById('edit-v-color').value = veh.Color || '';
        document.getElementById('edit-v-tipo').value = veh.Tipo || 'Automóvil';
        document.getElementById('edit-v-vin').value = veh.VIN || veh.Chasis || veh.N_Chasis || veh.Nª_VIN || '';
        document.getElementById('edit-v-motor').value = veh.Motor || veh.N_Motor || veh.Nª_Motor || '';

        setupMarcasModelosSelect('edit-v-marca', 'edit-v-modelo', veh.Marca || '', veh.Modelo || '');

        const clientSel = document.getElementById('edit-v-cliente');
        const currClientId = veh.ID_Cliente || veh.Cliente_ID || veh.Cliente || veh.Codigo_Cliente || (client ? (client.ID_Cliente || client.Codigo_Cliente) : '');
        clientSel.value = currClientId || '';

        document.getElementById('veh-edit-modal').style.display = 'flex';
    }

    // Open Expediente Modal
    function openVehicleExpedienteModal(veh) {
        if (!veh) return;
        const placa = getVehiclePlaca(veh);
        const client = getVehicleClient(veh);
        const stats = getVehicleStats(veh);

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

            // Bind PDF Export buttons
            modalBody.querySelectorAll('.btn-exp-pdf').forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    const bId = btn.getAttribute('data-id');
                    if (bId && bId !== 'N/A') {
                        exportBudgetPDF(bId);
                    }
                };
            });
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

    // Helper to format date / timestamp safely
    function formatExpedienteDate(val) {
        if (!val) return 'N/A';
        try {
            const num = Number(val);
            if (!isNaN(num) && num > 1000000000) {
                return new Date(num).toLocaleDateString('es-SV', { year: 'numeric', month: 'short', day: 'numeric' });
            }
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('es-SV', { year: 'numeric', month: 'short', day: 'numeric' });
            }
        } catch (e) {
            console.error(e);
        }
        return String(val);
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
                                const dateStr = formatExpedienteDate(ing['Marca Temporal'] || ing.Fecha);
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
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    ${safe(stats.trabajos.map(t => {
                        const code = t['ID Presupuesto'] || t.ID_Presupuesto || t.id || 'N/A';
                        const dateStr = formatExpedienteDate(t.Fecha || t['Marca Temporal']);
                        const tech = (db.tecnicos || []).find(tec => tec.Tecnico_ID === t.Tecnico_Asignado) || { Nombre_Completo: t.Tecnico || t.Mecanico || 'Taller General' };
                        
                        const pLabor = (db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || []).filter(dm => dm['ID_Presupuesto MO'] === code);
                        const pProducts = (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(dp => dp['ID_Presupuesto DPP'] === code);
                        
                        let total = 0;
                        try {
                            total = getBudgetGrandTotal(t, db);
                        } catch (e) {
                            total = parseFloat(t.Total || t.total || 0);
                        }

                        const statusNum = parseInt(t.Estado || 0);
                        let badgeClass = 'badge-secondary';
                        let statusText = 'En Proceso';
                        if (statusNum === 2) { badgeClass = 'badge-warning'; statusText = 'En Reparación'; }
                        else if (statusNum === 5) { badgeClass = 'badge-primary'; statusText = 'Trabajo Finalizado'; }
                        else if (statusNum === 3) { badgeClass = 'badge-success'; statusText = 'Facturado / Entregado'; }

                        return html`
                            <div class="glass-card" style="padding:1.1rem; border:1px solid var(--border-color); border-left:4px solid var(--primary); background:rgba(255,255,255,0.02);">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                                    <div>
                                        <div style="display:flex; align-items:center; gap:0.5rem;">
                                            <strong style="font-family:monospace; font-size:1.05rem; color:var(--primary);">${escapeHtml(code)}</strong>
                                            <span class="badge-tag ${badgeClass}">${statusText}</span>
                                        </div>
                                        <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">
                                            <i class="fa-regular fa-calendar"></i> ${dateStr} • 
                                            <i class="fa-solid fa-user-gear"></i> Técnico: <strong>${escapeHtml(tech.Nombre_Completo || 'Sin Asignar')}</strong>
                                        </div>
                                    </div>
                                    <div style="text-align:right;">
                                        <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">Total del Trabajo</span>
                                        <strong style="font-size:1.2rem; color:var(--text-primary);">$ ${total.toFixed(2)}</strong>
                                    </div>
                                </div>

                                ${t.Fallas_Detectadas ? html`
                                    <div style="background:rgba(0,0,0,0.2); border-radius:6px; padding:0.6rem 0.8rem; margin-bottom:0.75rem; font-size:0.82rem;">
                                        <span style="color:var(--text-muted); font-weight:600;"><i class="fa-solid fa-stethoscope"></i> Diagnóstico / Motivo:</span>
                                        <p style="margin:0.2rem 0 0 0; color:var(--text-secondary);">${escapeHtml(t.Fallas_Detectadas)}</p>
                                    </div>
                                ` : ''}

                                <!-- Services & Labor Performed -->
                                ${pLabor.length > 0 ? html`
                                    <div style="margin-bottom:0.6rem;">
                                        <h5 style="margin:0 0 0.35rem 0; font-size:0.75rem; text-transform:uppercase; color:#a855f7; letter-spacing:0.5px; font-weight:700;">
                                            <i class="fa-solid fa-screwdriver-wrench"></i> Mano de Obra y Servicios Realizados (${pLabor.length})
                                        </h5>
                                        <div style="background:rgba(255,255,255,0.015); border:1px solid var(--border-color); border-radius:6px; overflow:hidden;">
                                            <table style="width:100%; font-size:0.8rem; border-collapse:collapse;">
                                                <tbody>
                                                    ${safe(pLabor.map(l => html`
                                                        <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                                                            <td style="padding:0.4rem 0.6rem; color:var(--text-primary);">${escapeHtml(l.Descripcion || 'Servicio Mecánico')}</td>
                                                            <td style="padding:0.4rem 0.6rem; color:var(--text-muted); text-align:center; width:80px;">Cant: ${l.Cantidad || 1}</td>
                                                            <td style="padding:0.4rem 0.6rem; font-family:monospace; text-align:right; width:90px; color:var(--text-secondary);">$ ${(parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1)).toFixed(2)}</td>
                                                        </tr>
                                                    `).join(''))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ` : ''}

                                <!-- Parts and Products Installed -->
                                ${pProducts.length > 0 ? html`
                                    <div style="margin-bottom:0.75rem;">
                                        <h5 style="margin:0 0 0.35rem 0; font-size:0.75rem; text-transform:uppercase; color:var(--primary); letter-spacing:0.5px; font-weight:700;">
                                            <i class="fa-solid fa-box-open"></i> Repuestos e Insumos Instalados (${pProducts.length})
                                        </h5>
                                        <div style="background:rgba(255,255,255,0.015); border:1px solid var(--border-color); border-radius:6px; overflow:hidden;">
                                            <table style="width:100%; font-size:0.8rem; border-collapse:collapse;">
                                                <tbody>
                                                    ${safe(pProducts.map(pr => html`
                                                        <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                                                            <td style="padding:0.4rem 0.6rem; color:var(--text-primary);">${escapeHtml(pr.Descripcion || 'Repuesto')}</td>
                                                            <td style="padding:0.4rem 0.6rem; color:var(--text-muted); text-align:center; width:80px;">Cant: ${pr.Cantidad || 1}</td>
                                                            <td style="padding:0.4rem 0.6rem; font-family:monospace; text-align:right; width:90px; color:var(--text-secondary);">$ ${(parseFloat(pr.PrecioUnitario || 0) * parseInt(pr.Cantidad || 1)).toFixed(2)}</td>
                                                        </tr>
                                                    `).join(''))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ` : ''}

                                <div style="display:flex; justify-content:flex-end; gap:0.5rem; border-top:1px solid var(--border-color); padding-top:0.65rem; margin-top:0.5rem;">
                                    <button class="btn btn-secondary btn-exp-pdf" data-id="${escapeHtml(code)}" style="padding:0.35rem 0.75rem; font-size:0.78rem; display:inline-flex; align-items:center; gap:0.35rem;">
                                        <i class="fa-solid fa-file-pdf" style="color:#e74c3c;"></i> Imprimir PDF
                                    </button>
                                    <a href="#presupuestos?id=${escapeHtml(code)}" class="btn btn-secondary" style="padding:0.35rem 0.75rem; font-size:0.78rem; display:inline-flex; align-items:center; gap:0.35rem; text-decoration:none;">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Ficha Completa
                                    </a>
                                </div>
                            </div>
                        `;
                    }).join(''))}
                </div>
            `;
        }

        if (tab === 'presupuestos') {
            if (stats.presupuestos.length === 0) {
                return `<p style="text-align:center; color:var(--text-muted); padding:2rem;">No hay presupuestos emitidos para este vehículo.</p>`;
            }
            return html`
                <div style="display:flex; flex-direction:column; gap:1rem;">
                    ${safe(stats.presupuestos.map(p => {
                        const code = p['ID Presupuesto'] || p.ID_Presupuesto || p.id || 'N/A';
                        const dateStr = formatExpedienteDate(p.Fecha || p['Marca Temporal']);
                        
                        const pLabor = (db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || []).filter(dm => dm['ID_Presupuesto MO'] === code);
                        const pProducts = (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(dp => dp['ID_Presupuesto DPP'] === code);
                        
                        const sumProd = pProducts.reduce((sum, item) => sum + parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1), 0);
                        const sumLab = pLabor.reduce((sum, item) => sum + parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1), 0);
                        const subtotal = sumProd + sumLab;
                        
                        let grandTotal = 0;
                        try {
                            grandTotal = getBudgetGrandTotal(p, db);
                        } catch (e) {
                            grandTotal = parseFloat(p.Total || p.total || subtotal);
                        }
                        const iva = Math.max(0, grandTotal - subtotal);

                        const statusNum = parseInt(p.Estado || 0);
                        let badgeClass = 'badge-secondary';
                        let statusText = 'Cotización / Creado';
                        if (statusNum === 2) { badgeClass = 'badge-warning'; statusText = 'Aprobado / Reparación'; }
                        else if (statusNum === 3) { badgeClass = 'badge-success'; statusText = 'Facturado'; }
                        else if (statusNum === 4) { badgeClass = 'badge-danger'; statusText = 'Anulado / Rechazado'; }
                        else if (statusNum === 5) { badgeClass = 'badge-primary'; statusText = 'Trabajo Finalizado'; }
                        else if (p.Estado === 'APROBADO') { badgeClass = 'badge-success'; statusText = 'Aprobado'; }
                        else if (p.Estado === 'RECHAZADO') { badgeClass = 'badge-danger'; statusText = 'Rechazado'; }

                        return html`
                            <div class="glass-card" style="padding:1.1rem; border:1px solid var(--border-color); background:rgba(255,255,255,0.02);">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                                    <div>
                                        <div style="display:flex; align-items:center; gap:0.5rem;">
                                            <strong style="font-family:monospace; font-size:1.05rem; color:var(--primary);">${escapeHtml(code)}</strong>
                                            <span class="badge-tag ${badgeClass}">${statusText}</span>
                                        </div>
                                        <span style="font-size:0.8rem; color:var(--text-secondary); display:block; margin-top:0.25rem;">
                                            <i class="fa-regular fa-calendar"></i> Fecha: <strong>${dateStr}</strong>
                                        </span>
                                    </div>
                                    <div style="display:flex; gap:1.25rem; text-align:right;">
                                        <div>
                                            <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">Subtotal</span>
                                            <span style="font-family:monospace; font-size:0.95rem; color:var(--text-primary);">$ ${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">IVA (13%)</span>
                                            <span style="font-family:monospace; font-size:0.95rem; color:var(--text-secondary);">$ ${iva.toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span style="font-size:0.75rem; color:var(--text-secondary); display:block;">Total</span>
                                            <strong style="font-size:1.15rem; color:var(--primary);">$ ${grandTotal.toFixed(2)}</strong>
                                        </div>
                                    </div>
                                </div>

                                <!-- Collapsible detail of works -->
                                <details style="background:rgba(0,0,0,0.2); border-radius:6px; padding:0.5rem 0.75rem; margin-top:0.5rem; font-size:0.82rem;">
                                    <summary style="cursor:pointer; font-weight:600; color:var(--text-primary); outline:none;">
                                        <i class="fa-solid fa-list-check"></i> Ver Desglose de Trabajos y Repuestos (${pLabor.length + pProducts.length} ítems)
                                    </summary>
                                    <div style="margin-top:0.6rem; display:flex; flex-direction:column; gap:0.5rem;">
                                        ${p.Fallas_Detectadas ? html`
                                            <p style="margin:0; color:var(--text-secondary); font-size:0.8rem;">
                                                <strong>Diagnóstico:</strong> ${escapeHtml(p.Fallas_Detectadas)}
                                            </p>
                                        ` : ''}

                                        ${pLabor.length > 0 ? html`
                                            <div>
                                                <strong style="color:#a855f7; font-size:0.75rem; text-transform:uppercase;">Mano de Obra (${pLabor.length}):</strong>
                                                <ul style="margin:0.2rem 0 0 1.25rem; padding:0; color:var(--text-secondary);">
                                                    ${safe(pLabor.map(l => `<li>${escapeHtml(l.Descripcion)} (Cant: ${l.Cantidad || 1}) - $ ${(parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1)).toFixed(2)}</li>`).join(''))}
                                                </ul>
                                            </div>
                                        ` : ''}

                                        ${pProducts.length > 0 ? html`
                                            <div>
                                                <strong style="color:var(--primary); font-size:0.75rem; text-transform:uppercase;">Repuestos e Insumos (${pProducts.length}):</strong>
                                                <ul style="margin:0.2rem 0 0 1.25rem; padding:0; color:var(--text-secondary);">
                                                    ${safe(pProducts.map(pr => `<li>${escapeHtml(pr.Descripcion)} (Cant: ${pr.Cantidad || 1}) - $ ${(parseFloat(pr.PrecioUnitario || 0) * parseInt(pr.Cantidad || 1)).toFixed(2)}</li>`).join(''))}
                                                </ul>
                                            </div>
                                        ` : ''}
                                    </div>
                                </details>

                                <div style="display:flex; justify-content:flex-end; gap:0.5rem; border-top:1px solid var(--border-color); padding-top:0.65rem; margin-top:0.65rem;">
                                    <button class="btn btn-secondary btn-exp-pdf" data-id="${escapeHtml(code)}" style="padding:0.35rem 0.75rem; font-size:0.78rem; display:inline-flex; align-items:center; gap:0.35rem;">
                                        <i class="fa-solid fa-file-pdf" style="color:#e74c3c;"></i> Imprimir PDF
                                    </button>
                                    <a href="#presupuestos?id=${escapeHtml(code)}" class="btn btn-secondary" style="padding:0.35rem 0.75rem; font-size:0.78rem; display:inline-flex; align-items:center; gap:0.35rem; text-decoration:none;">
                                        <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver Ficha Completa
                                    </a>
                                </div>
                            </div>
                        `;
                    }).join(''))}
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
                                const dateStr = formatExpedienteDate(r['Marca Temporal'] || r.Fecha);
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

    // Edit modal listeners setup
    const editModal = document.getElementById('veh-edit-modal');
    const closeEditBtn = document.getElementById('close-veh-edit-modal');
    const cancelEditBtn = document.getElementById('cancel-veh-edit');
    const editForm = document.getElementById('veh-edit-form');

    if (closeEditBtn) closeEditBtn.onclick = () => { editModal.style.display = 'none'; };
    if (cancelEditBtn) cancelEditBtn.onclick = () => { editModal.style.display = 'none'; };

    if (editForm) {
        editForm.onsubmit = (e) => {
            e.preventDefault();
            const key = document.getElementById('edit-v-key').value;
            const target = vehiculosList.find(v => (v.ID_Vehiculo || getVehiclePlaca(v)) === key);
            if (!target) {
                showToast("No se encontró el vehículo para actualizar", "danger");
                return;
            }

            const newPlaca = document.getElementById('edit-v-placa').value.trim();
            const newEquipo = document.getElementById('edit-v-equipo').value.trim();
            const newMarca = document.getElementById('edit-v-marca').value.trim();
            const newModelo = document.getElementById('edit-v-modelo').value.trim();
            const newYear = document.getElementById('edit-v-year').value.trim();
            const newColor = document.getElementById('edit-v-color').value.trim();
            const newTipo = document.getElementById('edit-v-tipo').value.trim();
            const newVin = document.getElementById('edit-v-vin').value.trim();
            const newMotor = document.getElementById('edit-v-motor').value.trim();
            const newClientId = document.getElementById('edit-v-cliente').value;

            // Auto-register brand / model if new
            if (newMarca) {
                db.marcas_vehiculos = db.marcas_vehiculos || [];
                db.modelos_vehiculos = db.modelos_vehiculos || [];
                let foundMarca = db.marcas_vehiculos.find(m => m.nombre.toLowerCase() === newMarca.toLowerCase());
                if (!foundMarca) {
                    foundMarca = {
                        id: 'marca-' + newMarca.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                        nombre: newMarca,
                        activa: true
                    };
                    db.marcas_vehiculos.push(foundMarca);
                }
                if (newModelo) {
                    let foundModelo = db.modelos_vehiculos.find(m => 
                        (m.marca_id === foundMarca.id || m.marca_nombre?.toLowerCase() === foundMarca.nombre.toLowerCase()) && 
                        m.nombre.toLowerCase() === newModelo.toLowerCase()
                    );
                    if (!foundModelo) {
                        db.modelos_vehiculos.push({
                            id: 'mod-' + Math.random().toString(36).substring(2, 9),
                            marca_id: foundMarca.id,
                            marca_nombre: foundMarca.nombre,
                            nombre: newModelo
                        });
                    }
                }
            }

            // Update target in memory
            target.Placas = newPlaca;
            target.Placa = newPlaca;
            target['Número de Placas'] = newPlaca;
            target.Marca = newMarca;
            target.Modelo = newModelo;
            target.Año = newYear;
            target.Anio = newYear;
            target.Color = newColor;
            target.Tipo = newTipo;
            target.N_Equipo = newEquipo;
            target.Num_Equipo = newEquipo;
            target.Equipo = newEquipo;
            target.VIN = newVin;
            target.Nª_VIN = newVin;
            target.Chasis = newVin;
            target.Motor = newMotor;
            target.N_Motor = newMotor;
            target.Nª_Motor = newMotor;
            target.ID_Cliente = newClientId;
            target.Cliente_ID = newClientId;

            // Update in db.vehiculos / db['02 Vehiculos']
            db.vehiculos = db.vehiculos || [];
            const idx = db.vehiculos.findIndex(x => (x.ID_Vehiculo || x.Placas || x.Placa) === (target.ID_Vehiculo || target.Placas || target.Placa) || (x.ID_Vehiculo || x.Placas || x.Placa) === key);
            if (idx >= 0) {
                db.vehiculos[idx] = { ...db.vehiculos[idx], ...target };
            } else {
                db.vehiculos.unshift(target);
            }

            saveDatabase(db);
            showToast("Vehículo actualizado con éxito", "success");
            editModal.style.display = 'none';
            renderVehiclesTable();
        };
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
