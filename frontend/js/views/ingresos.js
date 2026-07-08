import {
    getDatabase,
    saveDatabase,
    getActiveUser,
    getWorkshopConfig
} from '../../app.js?v=56';

import { html, safe, escapeHtml, showToast } from '../utils.js?v=56';

const DEFAULT_INGRESO_CONFIG = {
    pilotos: [
        { id: "Check_Engine", label: "Check Engine", color: "#f97316" },
        { id: "TPMS", label: "TPMS", color: "#eab308" },
        { id: "ABS", label: "ABS", color: "#f97316" },
        { id: "Airbag", label: "Airbag", color: "#ef4444" },
        { id: "Brakes", label: "Brakes", color: "#ef4444" },
        { id: "Seatbelt", label: "Seatbelt", color: "#ef4444" }
    ],
    checklist: [
        { id: "Enciende", label: "Enciende", default: "Y", tipo: "si_no" },
        { id: "Bateria", label: "Batería", default: "Y", tipo: "bueno_detalle" },
        { id: "Brazos_Escobillas", label: "Brazos Escobillas", default: "Y", tipo: "bueno_detalle" },
        { id: "Espejos", label: "Espejos", default: "Y", tipo: "bueno_detalle" },
        { id: "Cristales", label: "Cristales", default: "Y", tipo: "bueno_detalle" },
        { id: "Vidrios_Dañados", label: "Vidrios Dañados", default: "N", tipo: "si_no" },
        { id: "Antena", label: "Antena", default: "Y", tipo: "si_no" },
        { id: "Tapon_Gas_Con_Llave", label: "Tapón Gas Con Llave", default: "Y", tipo: "si_no" },
        { id: "Gato_y_Herramientas", label: "Gato y Herramientas", default: "Y", tipo: "si_no" },
        { id: "Triangulos", label: "Triángulos", default: "Y", tipo: "si_no" },
        { id: "Radio", label: "Radio", default: "Y", tipo: "bueno_detalle" },
        { id: "Aire_Acondicionado", label: "Aire Acondicionado", default: "Y", tipo: "bueno_detalle" },
        { id: "Emblemas", label: "Emblemas", default: "Y", tipo: "bueno_detalle" },
        { id: "Estado_Tapiceria", label: "Estado Tapicería", default: "Y", tipo: "bueno_detalle" }
    ]
};

export function renderIngresos(container) {
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.includes('?') ? hash.substring(hash.indexOf('?')) : '');
    const newMode = params.get('new') === 'true';
    const editId = params.get('edit');
    const viewId = params.get('id');

    if (newMode || editId) {
        renderEditor(container, editId);
    } else if (viewId) {
        renderDetails(container, viewId);
    } else {
        renderList(container);
    }
}

// -------------------------------------------------------------------------
// TRAY / LIST OF INGEST FORMS
// -------------------------------------------------------------------------
function renderList(container) {
    const db = getDatabase();
    if (!db.ingresos) db.ingresos = [];
    const ws = getWorkshopConfig(db);

    container.innerHTML = html`
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div>
                <h1 style="margin:0; font-size:1.8rem; color:var(--primary);"><i class="fa-solid fa-file-signature"></i> Recepción / Ingresos</h1>
                <p style="margin:0; color:var(--text-secondary); font-size:0.9rem;">Registros de entrada de vehículos al taller</p>
            </div>
            <a href="#ingresos?new=true" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Registrar Ingreso</a>
        </div>

        <div class="glass-card" style="padding:1.5rem; margin-bottom:1.5rem;">
            <div style="display:flex; gap:1rem; margin-bottom:1.5rem;">
                <input type="text" id="search-ingresos" placeholder="Buscar por placa, cliente o código..." style="flex:1; padding:0.6rem 1rem; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary); border-radius:6px; font-size:0.9rem;">
            </div>

            <div style="overflow-x:auto;">
                <table class="table" style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:2px solid var(--border-color);">
                            <th style="padding:0.75rem;">Código</th>
                            <th style="padding:0.75rem;">Fecha</th>
                            <th style="padding:0.75rem;">Vehículo</th>
                            <th style="padding:0.75rem;">Cliente</th>
                            <th style="padding:0.75rem;">Kilometraje</th>
                            <th style="padding:0.75rem;">Gasolina</th>
                            <th style="padding:0.75rem; text-align:right;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="ingresos-list-body">
                        <!-- Filled by JS -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('search-ingresos');
    const tbody = document.getElementById('ingresos-list-body');

    function populateTable(filter = '') {
        tbody.innerHTML = '';
        const items = db.ingresos || [];
        
        // Filter
        const filtered = items.filter(ing => {
            const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === ing.ID_Vehiculo) || {};
            const client = db.clientes.find(c => c.Codigo_Cliente === ing.Codigo_Cliente) || {};
            const query = filter.toLowerCase();
            return (
                (ing.ID_Ingreso || '').toLowerCase().includes(query) ||
                (vehicle.Placa || '').toLowerCase().includes(query) ||
                (client.Nombre || '').toLowerCase().includes(query) ||
                (vehicle.Marca || '').toLowerCase().includes(query) ||
                (vehicle.Modelo || '').toLowerCase().includes(query)
            );
        });

        if (filtered.length === 0) {
            tbody.innerHTML = html`
                <tr>
                    <td colspan="7" style="padding:2rem; text-align:center; color:var(--text-secondary);">No se encontraron registros de ingreso</td>
                </tr>
            `;
            return;
        }

        // Sort by Date (newest first)
        filtered.sort((a,b) => new Date(b.Fecha_Ingreso) - new Date(a.Fecha_Ingreso));

        filtered.forEach(ing => {
            const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === ing.ID_Vehiculo) || {};
            const client = db.clientes.find(c => c.Codigo_Cliente === ing.Codigo_Cliente) || {};
            const dateStr = new Date(ing.Fecha_Ingreso).toLocaleString('es-SV', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
            });

            // Check if budget is already created from this check-in
            const hasBudget = db.presupuestos && db.presupuestos.some(p => p.Ingreso_ID === ing.ID_Ingreso);

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = html`
                <td style="padding:0.75rem; font-weight:700; color:var(--primary);">${ing.ID_Ingreso}</td>
                <td style="padding:0.75rem;">${dateStr}</td>
                <td style="padding:0.75rem;">${vehicle.Placa || 'S/P'} - ${vehicle.Marca || ''} ${vehicle.Modelo || ''}</td>
                <td style="padding:0.75rem;">${client.Nombre || 'N/A'}</td>
                <td style="padding:0.75rem;">${parseFloat(ing.Kilometraje || 0).toLocaleString()} Km</td>
                <td style="padding:0.75rem;"><span class="badge" style="background:var(--primary-hover); color:#fff; font-size:0.8rem; padding:0.25rem 0.5rem; border-radius:4px;">${ing.Gasolina || 'N/D'}</span></td>
                <td style="padding:0.75rem; text-align:right; display:flex; justify-content:flex-end; gap:0.5rem; align-items:center;">
                    <a href="#ingresos?id=${ing.ID_Ingreso}" class="btn btn-secondary" style="padding:0.35rem 0.6rem; font-size:0.8rem;"><i class="fa-solid fa-eye"></i> Detalle</a>
                    <button class="btn btn-secondary btn-print" data-id="${ing.ID_Ingreso}" style="padding:0.35rem 0.6rem; font-size:0.8rem;"><i class="fa-solid fa-print"></i></button>
                    ${safe(hasBudget ? `
                        <span style="font-size:0.75rem; color:var(--text-secondary); font-style:italic; padding:0 0.5rem;"><i class="fa-solid fa-circle-check" style="color:var(--success);"></i> Cotizado</span>
                    ` : `
                        <button class="btn btn-primary btn-to-budget" data-id="${ing.ID_Ingreso}" style="padding:0.35rem 0.6rem; font-size:0.8rem;"><i class="fa-solid fa-file-invoice-dollar"></i> Cotizar</button>
                    `)}
                </td>
            `;

            tr.querySelector('.btn-print').addEventListener('click', () => printIngresoPDF(ing));
            if (!hasBudget) {
                tr.querySelector('.btn-to-budget').addEventListener('click', () => {
                    promoteCheckinToBudget(ing);
                });
            }

            tbody.appendChild(tr);
        });
    }

    searchInput.addEventListener('input', (e) => populateTable(e.target.value));
    populateTable();
}

// -------------------------------------------------------------------------
// PROMOTES A CHECK-IN TO AN ESTIMATE
// -------------------------------------------------------------------------
function promoteCheckinToBudget(ing) {
    const db = getDatabase();
    const client = db.clientes.find(c => c.Codigo_Cliente === ing.Codigo_Cliente) || {};
    const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === ing.ID_Vehiculo) || {};

    const newPresId = "PRES-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100);

    const activeUser = getActiveUser();
    const techId = ing.Tecnico_ID || (activeUser ? activeUser.Tecnico_ID : '');

    const newBudget = {
        'ID Presupuesto': newPresId,
        Nombre: client.Nombre || '',
        'Codigo Cliente': ing.Codigo_Cliente,
        Placa: vehicle.Placa || '',
        'ID_Vehiculo': ing.ID_Vehiculo,
        Kilometraje: ing.Kilometraje || '',
        Fallas_Detectadas: ing.Observaciones || 'Ingreso de Vehículo. Pilotos detectados: ' + Object.keys(ing.Pilotos || {}).filter(k => ing.Pilotos[k]).join(', '),
        Estado: 1, // Creado
        Fecha: new Date().toISOString().split('T')[0],
        Tecnico_Asignado: techId,
        Ingreso_ID: ing.ID_Ingreso
    };

    if (!db.presupuestos) db.presupuestos = [];
    db.presupuestos.unshift(newBudget);
    saveDatabase(db);

    showToast("Presupuesto enlazado creado de forma correcta", "success");
    window.location.hash = `#presupuestos?edit=${newPresId}`;
}

// -------------------------------------------------------------------------
// DETAIL/VIEW SCREEN
// -------------------------------------------------------------------------
function renderDetails(container, id) {
    const db = getDatabase();
    const ing = db.ingresos.find(i => i.ID_Ingreso === id);
    if (!ing) {
        showToast("Registro de ingreso no encontrado", "danger");
        window.location.hash = '#ingresos';
        return;
    }

    const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === ing.ID_Vehiculo) || {};
    const client = db.clientes.find(c => c.Codigo_Cliente === ing.Codigo_Cliente) || {};
    const dateStr = new Date(ing.Fecha_Ingreso).toLocaleString('es-SV');
    const config = db.ingreso_config || DEFAULT_INGRESO_CONFIG;

    container.innerHTML = html`
        <div class="view-header" style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <a href="#ingresos" class="btn btn-secondary" style="padding:0.4rem 0.8rem; margin-bottom:0.5rem; display:inline-block;"><i class="fa-solid fa-arrow-left"></i> Volver</a>
                <h1 style="margin:0; font-size:1.8rem; color:var(--primary);">Detalles de Ingreso: ${ing.ID_Ingreso}</h1>
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-secondary" id="btn-print-detail"><i class="fa-solid fa-print"></i> Imprimir PDF</button>
                <a href="#ingresos?edit=${ing.ID_Ingreso}" class="btn btn-primary"><i class="fa-solid fa-edit"></i> Editar</a>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
            <!-- Left Card: Info -->
            <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; gap:1rem;">
                <h3 style="color:var(--primary); margin:0; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-circle-info"></i> Información General</h3>
                <div><strong>Fecha y Hora:</strong> ${dateStr}</div>
                <div><strong>Cliente:</strong> ${client.Nombre} (${client.Correo || 'S/C'})</div>
                <div><strong>Vehículo Placas:</strong> ${vehicle.Placa} - ${vehicle.Marca} ${vehicle.Modelo} ${vehicle.Anio}</div>
                <div><strong>Kilometraje:</strong> ${parseFloat(ing.Kilometraje || 0).toLocaleString()} Km</div>
                <div><strong>Tipo Combustible:</strong> ${ing.Combustible || 'GASOLINA'}</div>
                <div><strong>Nivel de Combustible:</strong> <span class="badge" style="background:var(--primary-hover); color:#fff; font-size:0.8rem; padding:0.25rem 0.5rem; border-radius:4px;">${ing.Gasolina || 'N/D'}</span></div>
                
                <h3 style="color:var(--primary); margin:1rem 0 0 0; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-triangle-exclamation"></i> Pilotos de Tablero</h3>
                <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.5rem;">
                    ${safe(Object.keys(ing.Pilotos || {}).map(k => {
                        const active = ing.Pilotos[k];
                        const cfgItem = config.pilotos.find(p => p.id === k);
                        const c = cfgItem ? cfgItem.color : 'var(--primary)';
                        const label = cfgItem ? cfgItem.label : k.replace(/_/g, ' ');
                        if (!active) return '';
                        return html`
                            <span style="padding:0.4rem 0.8rem; border-radius:30px; background:${c}15; border:1px solid ${c}; color:${c}; font-size:0.8rem; font-weight:700;">
                                <i class="fa-solid fa-triangle-exclamation"></i> ${label}
                            </span>
                        `;
                    }).join('') || '<span style="color:var(--text-secondary); font-style:italic;">Ningún piloto encendido</span>')}
                </div>
            </div>

            <!-- Right Card: Checklist -->
            <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                <h3 style="color:var(--primary); margin:0; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; margin-bottom:0.5rem;"><i class="fa-solid fa-list-check"></i> Inventario de Recepción</h3>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.85rem;">
                    ${safe(Object.keys(ing.Checklist || {}).map(k => {
                        const val = ing.Checklist[k];
                        const isY = val === 'Y';
                        const cfgItem = config.checklist.find(c => c.id === k);
                        const label = cfgItem ? cfgItem.label : k.replace(/_/g, ' ');
                        const tipo = cfgItem ? cfgItem.tipo : 'si_no';
                        const badgeColor = isY ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
                        const textC = isY ? '#10b981' : '#ef4444';
                        const displayText = isY ? (tipo === 'bueno_detalle' ? 'BUENO' : 'SÍ') : (tipo === 'bueno_detalle' ? 'DETALLES' : 'NO');
                        return html`
                            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem; background:rgba(255,255,255,0.02); border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                                <span>${label}</span>
                                <span style="padding:0.15rem 0.5rem; border-radius:4px; font-weight:700; background:${badgeColor}; color:${textC};">${displayText}</span>
                            </div>
                        `;
                    }).join(''))}
                </div>
            </div>
        </div>

        <div class="glass-card" style="padding:1.5rem; margin-top:1.5rem;">
            <h3 style="color:var(--primary); margin:0 0 1rem 0; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-pen-nib"></i> Firmas y Observaciones</h3>
            <div style="margin-bottom:1.5rem;">
                <strong>Observaciones Técnicas:</strong>
                <p style="margin:0.5rem 0 0 0; background:rgba(255,255,255,0.02); padding:1rem; border-radius:6px; border:1px solid var(--border-color); color:var(--text-primary);">${ing.Observaciones || 'Sin observaciones adicionales.'}</p>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
                <div style="text-align:center;">
                    <div style="border:1px dashed var(--border-color); border-radius:6px; height:180px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.02);">
                        ${safe(ing.Firma_Asesor ? `<img src="${ing.Firma_Asesor}" style="max-height:100%; max-width:100%;">` : `<span style="color:var(--text-secondary); font-style:italic;">Sin firma registrada</span>`)}
                    </div>
                    <span style="display:block; margin-top:0.5rem; font-weight:700;">Firma del Asesor</span>
                </div>
                <div style="text-align:center;">
                    <div style="border:1px dashed var(--border-color); border-radius:6px; height:180px; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.02);">
                        ${safe(ing.Firma_Cliente ? `<img src="${ing.Firma_Cliente}" style="max-height:100%; max-width:100%;">` : `<span style="color:var(--text-secondary); font-style:italic;">Sin firma registrada</span>`)}
                    </div>
                    <span style="display:block; margin-top:0.5rem; font-weight:700;">Firma del Cliente</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-print-detail').addEventListener('click', () => printIngresoPDF(ing));
}

// -------------------------------------------------------------------------
// EDITOR SCREEN (NEW/EDIT)
// -------------------------------------------------------------------------
function renderEditor(container, editId) {
    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    const isEdit = !!editId;
    let ing = null;

    const config = db.ingreso_config || DEFAULT_INGRESO_CONFIG;

    if (isEdit) {
        ing = db.ingresos.find(i => i.ID_Ingreso === editId);
        if (!ing) {
            showToast("Registro de ingreso no encontrado", "danger");
            window.location.hash = '#ingresos';
            return;
        }
        if (!ing.Pilotos) ing.Pilotos = {};
        config.pilotos.forEach(p => {
            if (ing.Pilotos[p.id] === undefined) ing.Pilotos[p.id] = false;
        });
        if (!ing.Checklist) ing.Checklist = {};
        config.checklist.forEach(c => {
            if (ing.Checklist[c.id] === undefined) ing.Checklist[c.id] = c.default || 'Y';
        });
    } else {
        const nextId = "ING-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*10);
        const initialPilotos = {};
        config.pilotos.forEach(p => {
            initialPilotos[p.id] = false;
        });
        const initialChecklist = {};
        config.checklist.forEach(c => {
            initialChecklist[c.id] = c.default || 'Y';
        });

        ing = {
            ID_Ingreso: nextId,
            Fecha_Ingreso: new Date().toISOString(),
            ID_Vehiculo: '',
            Codigo_Cliente: '',
            Kilometraje: '',
            Gasolina: '1/2',
            Combustible: 'GASOLINA',
            Pilotos: initialPilotos,
            Checklist: initialChecklist,
            Observaciones: '',
            Firma_Asesor: '',
            Firma_Cliente: '',
            Tecnico_ID: ''
        };
    }

    container.innerHTML = html`
        <div class="view-header" style="margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <a href="#ingresos" class="btn btn-secondary" style="padding:0.4rem 0.8rem; margin-bottom:0.5rem; display:inline-block;"><i class="fa-solid fa-arrow-left"></i> Cancelar</a>
                <h1 style="margin:0; font-size:1.8rem; color:var(--primary);">${isEdit ? 'Editar Recepción' : 'Nueva Recepción de Vehículo'}</h1>
            </div>
            <button type="button" class="btn btn-primary" id="btn-save-ingreso"><i class="fa-solid fa-save"></i> Guardar Recepción</button>
        </div>

        <form id="ingreso-form" style="display:flex; flex-direction:column; gap:1.5rem;">
            <style>
                .toggle-btn, .fuel-btn {
                    background: rgba(255,255,255,0.03) !important;
                    color: var(--text-secondary) !important;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .toggle-btn:hover, .fuel-btn:hover {
                    background: rgba(255,255,255,0.08) !important;
                }
                .toggle-btn.active, .fuel-btn.active {
                    background: var(--primary) !important;
                    color: #ffffff !important;
                    font-weight: bold !important;
                }
            </style>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem;">
                
                <!-- Col Left: Info -->
                <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; gap:1.2rem;">
                    <h3 style="color:var(--primary); margin:0; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-circle-info"></i> Información del Vehículo</h3>
                    
                    <div class="form-group">
                        <label>Código de Ingreso</label>
                        <input type="text" value="${ing.ID_Ingreso}" readonly style="padding:0.5rem; background:rgba(255,255,255,0.02); color:var(--text-secondary); border:1px solid var(--border-color); border-radius:4px; width:100%;">
                    </div>

                    <div class="form-group">
                        <label>Seleccionar Vehículo / Auto *</label>
                        <select id="ing-vehicle-select" required style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; width:100%; height:38px;">
                            <option value="">-- Seleccionar --</option>
                            ${safe((db.vehiculos || []).map(v => {
                                const client = db.clientes.find(c => c.Codigo_Cliente === v.Codigo_Cliente) || {};
                                const selected = v.ID_Vehiculo === ing.ID_Vehiculo ? 'selected' : '';
                                return html`<option value="${v.ID_Vehiculo}" ${selected}>${v.Placa || 'S/P'} - ${v.Marca || ''} ${v.Modelo || ''} (Cliente: ${client.Nombre || 'S/N'})</option>`;
                            }).join(''))}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Kilometraje Actual *</label>
                        <input type="number" id="ing-odo" required value="${ing.Kilometraje}" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; width:100%;">
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Tipo de Combustible *</label>
                            <div class="toggle-group" id="fuel-type-toggle" style="display:flex; border:1px solid var(--border-color); border-radius:4px; overflow:hidden; height:36px;">
                                <button type="button" class="toggle-btn ${ing.Combustible === 'GASOLINA' ? 'active' : ''}" data-val="GASOLINA" style="flex:1; border:none; cursor:pointer;">GASOLINA</button>
                                <button type="button" class="toggle-btn ${ing.Combustible === 'DIESEL' ? 'active' : ''}" data-val="DIESEL" style="flex:1; border:none; cursor:pointer;">DIESEL</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Nivel de Combustible (Gasolina) *</label>
                            <div class="fuel-gauge-container" style="display:grid; grid-template-columns:repeat(5, 1fr); border:1px solid var(--border-color); border-radius:4px; overflow:hidden; height:36px;">
                                ${safe(['Vacio', '1/4', '1/2', '3/4', 'Lleno'].map(val => {
                                    const active = ing.Gasolina === val ? 'active' : '';
                                    return html`<button type="button" class="fuel-btn ${active}" data-value="${val}" style="border:none; font-size:0.8rem; cursor:pointer;">${val === 'Vacio' ? 'E' : val === 'Lleno' ? 'F' : val}</button>`;
                                }).join(''))}
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Técnico Asignado para Inspección</label>
                        <select id="ing-tech-select" style="padding:0.5rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; width:100%; height:38px;">
                            <option value="">-- Sin asignar --</option>
                            ${safe((db.empleados || []).filter(e => e.Puesto === 'Mecánico' || e.Puesto === 'Mecanico').map(e => {
                                const selected = e.Tecnico_ID === ing.Tecnico_ID ? 'selected' : '';
                                return html`<option value="${e.Tecnico_ID}" ${selected}>${e.Nombre}</option>`;
                            }).join(''))}
                        </select>
                    </div>

                    <!-- Warning lights section -->
                    <h3 style="color:var(--primary); margin:1rem 0 0 0; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-triangle-exclamation"></i> Testigos del Tablero (Pilotos)</h3>
                    <div class="pilotos-container" style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-top:0.5rem;">
                        ${safe(config.pilotos.map(p => {
                            const active = ing.Pilotos ? (ing.Pilotos[p.id] || false) : false;
                            const c = p.color || 'var(--primary)';
                            const bg = active ? c + '15' : 'rgba(255,255,255,0.03)';
                            const border = active ? c : 'var(--border-color)';
                            const color = active ? c : 'var(--text-secondary)';
                            const activeClass = active ? 'active' : '';

                            return html`
                                <button type="button" class="piloto-btn ${activeClass}" data-piloto="${p.id}" data-color="${c}" style="padding:0.5rem 1rem; border-radius:30px; border:1px solid ${border}; background:${bg}; color:${color}; font-weight:600; display:flex; align-items:center; gap:0.5rem; cursor:pointer; transition:all 0.2s;">
                                    <i class="fa-solid fa-triangle-exclamation"></i> ${p.label}
                                </button>
                            `;
                        }).join(''))}
                    </div>
                </div>

                <!-- Col Right: Inventory checklist -->
                <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                    <h3 style="color:var(--primary); margin:0; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; margin-bottom:0.5rem;"><i class="fa-solid fa-list-check"></i> Checklist de Inventario</h3>
                    <div style="overflow-y:auto; max-height:480px; padding-right:0.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                        ${safe(config.checklist.map(c => {
                            const val = ing.Checklist ? (ing.Checklist[c.id] || c.default || 'Y') : (c.default || 'Y');
                            const isY = val === 'Y';
                            const labelYes = c.tipo === 'bueno_detalle' ? 'BUENO' : 'SÍ';
                            const labelNo = c.tipo === 'bueno_detalle' ? 'DETALLES' : 'NO';
                            return html`
                                <div class="checklist-row" style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0.75rem; background:rgba(255,255,255,0.02); border-radius:4px; border:1px solid rgba(255,255,255,0.04);">
                                    <span style="font-size:0.85rem; font-weight:500;">${c.label}</span>
                                    <div class="checklist-toggle" data-key="${c.id}" style="display:flex; border:1px solid var(--border-color); border-radius:4px; overflow:hidden; height:28px;">
                                        <button type="button" class="check-btn ${isY ? 'active' : ''}" data-val="Y" style="padding:0 0.75rem; border:none; font-size:0.75rem; background:${isY ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)'}; color:${isY ? '#10b981' : 'var(--text-secondary)'}; font-weight:700; cursor:pointer;">${labelYes}</button>
                                        <button type="button" class="check-btn ${!isY ? 'active' : ''}" data-val="N" style="padding:0 0.75rem; border:none; font-size:0.75rem; background:${!isY ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)'}; color:${!isY ? '#ef4444' : 'var(--text-secondary)'}; font-weight:700; cursor:pointer;">${labelNo}</button>
                                    </div>
                                </div>
                            `;
                        }).join(''))}
                    </div>
                </div>

            </div>

            <!-- Signature pads & observations -->
            <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; gap:1.2rem;">
                <h3 style="color:var(--primary); margin:0; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-pen-nib"></i> Firmas y Observaciones</h3>
                
                <div class="form-group">
                    <label>Observaciones de Recepción / Daños Identificados</label>
                    <textarea id="ing-obs" rows="3" placeholder="Detalles de golpes, rayones, fallas reportadas por el cliente..." style="padding:0.6rem; background:var(--bg-input); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; width:100%; resize:vertical;">${ing.Observaciones || ''}</textarea>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
                    <!-- Advisor Signature -->
                    <div style="text-align:center;">
                        <span style="display:block; margin-bottom:0.5rem; font-weight:700;"><i class="fa-solid fa-user-tie"></i> Firma del Asesor</span>
                        <div style="position:relative; border:1px solid var(--border-color); border-radius:6px; background:rgba(0,0,0,0.25); overflow:hidden;">
                            <canvas id="signature-advisor" style="width:100%; height:180px; display:block; cursor:crosshair;"></canvas>
                            <button type="button" id="clear-signature-advisor" class="btn btn-secondary" style="position:absolute; bottom:0.5rem; right:0.5rem; padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-eraser"></i> Limpiar</button>
                        </div>
                    </div>

                    <!-- Client Signature -->
                    <div style="text-align:center;">
                        <span style="display:block; margin-bottom:0.5rem; font-weight:700;"><i class="fa-solid fa-signature"></i> Firma del Cliente</span>
                        <div style="position:relative; border:1px solid var(--border-color); border-radius:6px; background:rgba(0,0,0,0.25); overflow:hidden;">
                            <canvas id="signature-client" style="width:100%; height:180px; display:block; cursor:crosshair;"></canvas>
                            <button type="button" id="clear-signature-client" class="btn btn-secondary" style="position:absolute; bottom:0.5rem; right:0.5rem; padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-eraser"></i> Limpiar</button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    `;

    // Fuel Type Toggle actions
    document.querySelectorAll('#fuel-type-toggle .toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#fuel-type-toggle .toggle-btn').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            ing.Combustible = btn.getAttribute('data-val');
        });
    });

    // Fuel Gauge actions
    document.querySelectorAll('.fuel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fuel-btn').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            ing.Gasolina = btn.getAttribute('data-value');
        });
    });

    // Warning Light toggle actions
    document.querySelectorAll('.piloto-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const key = btn.getAttribute('data-piloto');
            const active = btn.classList.contains('active');
            const color = btn.getAttribute('data-color');
            
            ing.Pilotos[key] = active;
            if (active) {
                btn.style.background = color + '15';
                btn.style.borderColor = color;
                btn.style.color = color;
            } else {
                btn.style.background = 'rgba(255,255,255,0.03)';
                btn.style.borderColor = 'var(--border-color)';
                btn.style.color = 'var(--text-secondary)';
            }
        });
    });

    // Checklist toggles
    document.querySelectorAll('.checklist-toggle').forEach(container => {
        const key = container.getAttribute('data-key');
        container.querySelectorAll('.check-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.check-btn').forEach(el => {
                    el.classList.remove('active');
                    el.style.background = 'rgba(255,255,255,0.03)';
                    el.style.color = 'var(--text-secondary)';
                });
                btn.classList.add('active');
                const val = btn.getAttribute('data-val');
                ing.Checklist[key] = val;

                if (val === 'Y') {
                    btn.style.background = 'rgba(16, 185, 129, 0.15)';
                    btn.style.color = '#10b981';
                } else {
                    btn.style.background = 'rgba(239, 68, 68, 0.15)';
                    btn.style.color = '#ef4444';
                }
            });
        });
    });

    // Initialize Canvas signatures
    let advisorCanvas, clientCanvas;
    // Delay slightly to ensure layout has rendered and widths are correct
    setTimeout(() => {
        advisorCanvas = initSignatureCanvas('signature-advisor', 'clear-signature-advisor', ing.Firma_Asesor);
        clientCanvas = initSignatureCanvas('signature-client', 'clear-signature-client', ing.Firma_Cliente);
    }, 100);

    // Save action
    document.getElementById('btn-save-ingreso').addEventListener('click', () => {
        const vehSelect = document.getElementById('ing-vehicle-select');
        const odoInput = document.getElementById('ing-odo');
        
        if (!vehSelect.value) {
            showToast("Debe seleccionar un vehículo", "danger");
            return;
        }
        if (!odoInput.value) {
            showToast("Debe especificar el kilometraje", "danger");
            return;
        }

        // Read signature canvases
        let advisorData = '';
        if (advisorCanvas) {
            // Check if user drew something
            const ctx = advisorCanvas.getContext('2d');
            const buffer = ctx.getImageData(0,0, advisorCanvas.width, advisorCanvas.height);
            const isBlank = !Array.from(buffer.data).some(colorVal => colorVal !== 0);
            if (!isBlank) advisorData = advisorCanvas.toDataURL();
        }

        let clientData = '';
        if (clientCanvas) {
            const ctx = clientCanvas.getContext('2d');
            const buffer = ctx.getImageData(0,0, clientCanvas.width, clientCanvas.height);
            const isBlank = !Array.from(buffer.data).some(colorVal => colorVal !== 0);
            if (!isBlank) clientData = clientCanvas.toDataURL();
        }

        // Find associated client
        const veh = db.vehiculos.find(v => v.ID_Vehiculo === vehSelect.value);

        ing.ID_Vehiculo = vehSelect.value;
        ing.Codigo_Cliente = veh ? veh.Codigo_Cliente : '';
        ing.Kilometraje = parseFloat(odoInput.value) || 0;
        ing.Observaciones = document.getElementById('ing-obs').value.trim();
        ing.Tecnico_ID = document.getElementById('ing-tech-select').value;
        if (advisorData) ing.Firma_Asesor = advisorData;
        if (clientData) ing.Firma_Cliente = clientData;

        if (!db.ingresos) db.ingresos = [];

        if (isEdit) {
            const idx = db.ingresos.findIndex(i => i.ID_Ingreso === editId);
            if (idx !== -1) db.ingresos[idx] = ing;
        } else {
            db.ingresos.push(ing);
        }

        // Also update vehicle's current odometer
        if (veh) {
            veh.Odometro = ing.Kilometraje;
        }

        saveDatabase(db);
        showToast("Recepción guardada de forma correcta", "success");
        window.location.hash = '#ingresos';
    });
}

// -------------------------------------------------------------------------
// CANVAS INSIDE EDITOR INITIALIZATION
// -------------------------------------------------------------------------
function initSignatureCanvas(canvasId, clearBtnId, savedBase64) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // Resize canvas first (resets context configuration)
    canvas.width = canvas.parentElement.offsetWidth || 400;
    canvas.height = 180;

    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';

    // Prefill signature if editing
    if (savedBase64) {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = savedBase64;
    }

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    function getCoordinates(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }

    function startDraw(e) {
        drawing = true;
        const coords = getCoordinates(e);
        lastX = coords.x;
        lastY = coords.y;
    }

    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        const coords = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        lastX = coords.x;
        lastY = coords.y;
    }

    function stopDraw() {
        drawing = false;
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);

    const clearBtn = document.getElementById(clearBtnId);
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }

    return canvas;
}

// -------------------------------------------------------------------------
// PRINT PRE-FORMATTED Mister Cars PDF
// -------------------------------------------------------------------------
function printIngresoPDF(ing) {
    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    const client = db.clientes.find(c => c.Codigo_Cliente === ing.Codigo_Cliente) || {};
    const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === ing.ID_Vehiculo) || {};
    const dateStr = new Date(ing.Fecha_Ingreso).toLocaleString('es-SV');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast("Error: Habilite ventanas emergentes para imprimir", "danger");
        return;
    }

    const config = db.ingreso_config || DEFAULT_INGRESO_CONFIG;

    const checklistRows = Object.keys(ing.Checklist || {}).map(k => {
        const val = ing.Checklist[k];
        const cfgItem = config.checklist.find(c => c.id === k);
        const label = cfgItem ? cfgItem.label : k.replace(/_/g, ' ');
        const tipo = cfgItem ? cfgItem.tipo : 'si_no';
        const displayText = val === 'Y' ? (tipo === 'bueno_detalle' ? 'BUENO' : 'SÍ') : (tipo === 'bueno_detalle' ? 'DETALLES' : 'NO');
        return `
            <tr>
                <td style="padding: 4px; font-size: 11px; border-bottom: 1px solid #ddd;">${label}</td>
                <td style="padding: 4px; font-size: 11px; text-align: center; border-bottom: 1px solid #ddd; font-weight: bold; color: ${val === 'Y' ? '#16a34a' : '#dc2626'};">${displayText}</td>
            </tr>
        `;
    }).join('');

    const pilotosStr = Object.keys(ing.Pilotos || {}).filter(k => ing.Pilotos[k]).map(k => {
        const cfgItem = config.pilotos.find(p => p.id === k);
        return cfgItem ? cfgItem.label : k.replace(/_/g, ' ');
    }).join(', ') || 'Ninguno';

    let logoHTML = '';
    if (ws.logo) {
        logoHTML = `<img src="${ws.logo}" style="max-height: 70px; max-width: 250px; object-fit: contain; border-radius: 4px;" />`;
    } else {
        logoHTML = `
            <span class="logo-text">${ws.logoText || ws.nombre_comercial || ws.nombre || 'Mecanic OS'}</span><br>
            <span style="font-size:10px; color:#6b7280;">${ws.logoTagline || 'Centro de Servicio Automotriz'}</span>
        `;
    }

    const pdfHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Orden de Ingreso ${ing.ID_Ingreso}</title>
            <style>
                body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; font-size: 12px; }
                .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .logo-text { font-size: 24px; font-weight: bold; color: #1e3a8a; }
                .order-title { font-size: 16px; font-weight: bold; text-align: right; color: #b91c1c; }
                .section-title { font-size: 12px; font-weight: bold; background: #f3f4f6; padding: 6px; margin: 15px 0 8px 0; border-left: 4px solid #1e3a8a; }
                .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                .info-table td { padding: 5px; border: 1px solid #e5e7eb; vertical-align: top; }
                .checklist-table { width: 100%; border-collapse: collapse; }
                .checklist-table th { background: #f3f4f6; text-align: left; padding: 5px; font-size: 11px; }
                .footer-text { font-size: 9px; color: #6b7280; text-align: justify; margin-top: 20px; line-height: 1.3; }
                .signature-box { width: 48%; border: 1px dashed #9ca3af; height: 100px; display: inline-block; text-align: center; }
                .signature-container { display: flex; justify-content: space-between; margin-top: 20px; }
            </style>
        </head>
        <body>
            <table class="header-table">
                <tr>
                    <td>
                        ${logoHTML}
                    </td>
                    <td class="order-title">
                        ORDEN DE INGRESO<br>
                        N° ${ing.ID_Ingreso}
                    </td>
                </tr>
            </table>

            <div class="section-title">DATOS DEL CLIENTE Y VEHÍCULO</div>
            <table class="info-table">
                <tr>
                    <td style="width: 50%;"><strong>Cliente:</strong> ${client.Nombre || ''}</td>
                    <td style="width: 50%;"><strong>Placa:</strong> ${vehicle.Placa || ''}</td>
                </tr>
                <tr>
                    <td><strong>Teléfono:</strong> ${client['Telefono 1 '] || ''}</td>
                    <td><strong>Marca/Modelo/Año:</strong> ${vehicle.Marca || ''} ${vehicle.Modelo || ''} ${vehicle.Anio || ''}</td>
                </tr>
                <tr>
                    <td><strong>Fecha Ingreso:</strong> ${dateStr}</td>
                    <td><strong>Kilometraje:</strong> ${parseFloat(ing.Kilometraje || 0).toLocaleString()} Km</td>
                </tr>
                <tr>
                    <td><strong>Nivel Combustible:</strong> ${ing.Gasolina || ''} (${ing.Combustible || ''})</td>
                    <td><strong>Pilotos Activos:</strong> ${pilotosStr}</td>
                </tr>
            </table>

            <div class="section-title">INVENTARIO DE RECEPCIÓN (CHECKLIST)</div>
            <table class="checklist-table">
                <thead>
                    <tr>
                        <th style="width: 70%;">Punto Inspeccionado</th>
                        <th style="width: 30%; text-align: center;">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${checklistRows}
                </tbody>
            </table>

            <div class="section-title">OBSERVACIONES Y DAÑOS PREVIOS</div>
            <div style="border: 1px solid #e5e7eb; padding: 10px; min-height: 50px; border-radius: 4px;">
                ${ing.Observaciones || 'Ninguna observación reportada.'}
            </div>

            <div class="footer-text">
                <strong>Términos y condiciones de ${ws.nombre_comercial || ws.nombre || 'Mecanic OS'}:</strong> El cliente autoriza la realización de las pruebas de carretera correspondientes por parte del personal del taller. ${(ws.nombre_comercial || ws.nombre || 'El taller')} no se hace responsable de daños causados por desastres naturales, incendios, robos o vandalismo fortuito fuera de su control. Todo repuesto reemplazado pasará a ser propiedad del cliente, a menos que este autorice su desecho. ${(ws.nombre_comercial || ws.nombre || 'El taller')} no se responsabiliza por objetos personales de valor no reportados formalmente al momento de la entrega.
            </div>

            <div class="signature-container">
                <div class="signature-box">
                    ${ing.Firma_Asesor ? `<img src="${ing.Firma_Asesor}" style="max-height:80px; max-width:100%; margin-top:10px; filter: invert(1);">` : ''}
                    <div style="border-top:1px solid #000; margin-top:5px; font-size:10px; font-weight:bold;">Firma del Asesor</div>
                </div>
                <div class="signature-box">
                    ${ing.Firma_Cliente ? `<img src="${ing.Firma_Cliente}" style="max-height:80px; max-width:100%; margin-top:10px; filter: invert(1);">` : ''}
                    <div style="border-top:1px solid #000; margin-top:5px; font-size:10px; font-weight:bold;">Firma del Cliente</div>
                </div>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(pdfHTML);
    printWindow.document.close();
}
