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
} from '../../app.js?v=51';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport
} from '../utils.js?v=51';

export function renderRevision21(container, queryParams) {
    const db = getDatabase();
    
    if (!window.saasActiveInspeccionTab) {
        window.saasActiveInspeccionTab = 'registrar';
    }
    const activeTab = window.saasActiveInspeccionTab;
    const checkpoints = getInspectionCheckpoints(db);

    container.innerHTML = html`
        <div class="inspection-container glass-card" style="max-width:1100px; margin:2rem auto; padding:2rem;">
            <h2>Hoja de Recepción Física y Diagnóstico de Vehículo</h2>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">Registra el ingreso del vehículo, semáforo de revisión inicial e historial.</p>
            
            <div class="saas-tabs-container" style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                <button class="saas-tab-btn ${activeTab === 'registrar' ? 'active' : ''}" onclick="window.switchInspeccionTab('registrar')"><i class="fa-solid fa-file-signature"></i> Nueva Inspección</button>
                <button class="saas-tab-btn ${activeTab === 'historial' ? 'active' : ''}" onclick="window.switchInspeccionTab('historial')"><i class="fa-solid fa-list-check"></i> Historial (${(db.revisiones || []).length})</button>
                <button class="saas-tab-btn ${activeTab === 'configurar' ? 'active' : ''}" onclick="window.switchInspeccionTab('configurar')"><i class="fa-solid fa-gears"></i> Configurar Criterios</button>
            </div>
            
            <div class="inspeccion-tab-body">
                ${safe(activeTab === 'registrar' ? renderRegistrarTab(db, checkpoints) : '')}
                ${safe(activeTab === 'historial' ? renderHistorialTab(db) : '')}
                ${safe(activeTab === 'configurar' ? renderConfigurarTab(db, checkpoints) : '')}
            </div>
        </div>

        <div id="view-inspection-modal" class="modal"></div>
    `;

    if (activeTab === 'registrar') {
        const clientSelect = document.getElementById('ins-client-select');
        const vehicleSelect = document.getElementById('ins-vehicle-select');
        const odoInput = document.getElementById('ins-odo');
        const form = document.getElementById('inspection-form');

        if (queryParams.client) {
            clientSelect.value = queryParams.client;
            updateVehicleDropdown(queryParams.client);
        }

        clientSelect.addEventListener('change', (e) => {
            updateVehicleDropdown(e.target.value);
        });

        function updateVehicleDropdown(clientCode) {
            vehicleSelect.innerHTML = '';
            if (!clientCode) {
                vehicleSelect.innerHTML = '<option value="">-- Selecciona un cliente primero --</option>';
                vehicleSelect.disabled = true;
                return;
            }

            const vehicles = db.vehiculos.filter(v => v.Codigo_Cliente === clientCode);
            if (vehicles.length === 0) {
                vehicleSelect.innerHTML = '<option value="">-- Sin vehículos registrados --</option>';
                vehicleSelect.disabled = true;
                return;
            }

            vehicleSelect.disabled = false;
            vehicles.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.ID_Vehiculo;
                opt.textContent = `${v.Placas} - ${v.Marca} ${v.Modelo} (${v.Año})`;
                vehicleSelect.appendChild(opt);
            });

            if (vehicles[0] && vehicles[0].Odometro) {
                odoInput.value = vehicles[0].Odometro;
            }
        }

        document.querySelectorAll('.checkpoint-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const parent = btn.parentElement;
                parent.querySelectorAll('.checkpoint-btn').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const clientCode = clientSelect.value;
            const vehId = vehicleSelect.value;
            const odo = odoInput.value;
            const fallas = document.getElementById('ins-fallas').value;
            const obsG = document.getElementById('ins-observaciones').value;
            
            const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === vehId);
            const client = db.clientes.find(c => c.Codigo_Cliente === clientCode);
            const revId = "REV21-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
            
            const details = {};
            document.querySelectorAll('.checkpoint-row[data-key]').forEach(row => {
                const key = row.getAttribute('data-key');
                const state = row.querySelector('.checkpoint-btn.active').getAttribute('data-value');
                const obs = row.querySelector('.checkpoint-obs').value;
                details[key] = { estado: state, obs: obs };
            });

            const newRevision = {
                ID_Revision: revId,
                "Estado Revision": "Terminada",
                Fecha: new Date().toISOString().split('T')[0],
                Codigo_Cliente: clientCode,
                Correo: client.Correo,
                "Telefono 1 ": client['Telefono 1 '],
                ID_Vehiculo: vehId,
                Placas: vehicle.Placas,
                Marca: vehicle.Marca,
                Modelo: vehicle.Modelo,
                Año: vehicle.Año,
                Odometro: odo,
                Fallas_Reportadas: fallas,
                Observaciones_Generales: obsG,
                Chequeos: details
            };

            db.revisiones.unshift(newRevision);
            
            const presId = "PRES-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
            const newBudget = {
                "ID Presupuesto": presId,
                Fecha: Date.now(),
                Codigo_Cliente: clientCode,
                Nombre: client.Nombre,
                "Telefono 1 ": client['Telefono 1 '] || '',
                Direccion: client.Direccion || '',
                "Categoría Contribuyente": client['Categoría Contribuyente'] || 'OTROS',
                ID_Vehiculo: vehId,
                Placas: vehicle.Placas,
                Kilometraje: odo,
                Estado: 1, 
                "% Impuesto": client['% Impuesto'] || 0.13,
                AplicaPercepcion: client.AplicaPercepcion || 0,
                AplicaRetencion: client.AplicaRetencion || 0,
                "Revision 21 puntos": revId,
                "Tecnico Asignado": db.tecnicos[0] ? db.tecnicos[0].Tecnico_ID : '',
                Fallas_Detectadas: fallas,
                "Pagado?": "NO"
            };

            db.presupuestos.unshift(newBudget);
            saveDatabase(db);
            
            showToast("Revisión guardada y cotización creada correctamente", "success");
            window.location.hash = `#presupuestos?id=${presId}`;
        });
    }

    if (activeTab === 'historial') {
        const searchInput = document.getElementById('ins-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const rows = document.querySelectorAll('.inspection-history-row');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    if (text.includes(query)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        }
    }
}// 4. PRESUPUESTOS (COTIZADOR) VIEW


export function getInspectionCheckpoints(db) {
    const ws = getWorkshopConfig(db);
    if (!ws.checkpoints_inspeccion || !Array.isArray(ws.checkpoints_inspeccion) || ws.checkpoints_inspeccion.length === 0) {
        ws.checkpoints_inspeccion = [
            { key: 'Freno de Mano', title: 'Freno de Mano (Recorrido / Regular)' },
            { key: 'AC', title: 'A/C Ventilación y filtro de cabina' },
            { key: 'Parabrisas', title: 'Parabrisas y Aspersores de agua' },
            { key: 'Luces', title: 'Luces exteriores y pito (claxon)' },
            { key: 'Fajas', title: 'Fajas de motor (alternador/bomba)' },
            { key: 'Refrigerante', title: 'Nivel y estado de Refrigerante' },
            { key: 'Bateria', title: 'Alternador, Batería y bornes' },
            { key: 'FugasMotor', title: 'Fugas de aceite / Niveles en Motor' },
            { key: 'FugasCajaCorona', title: 'Fugas de aceite en Caja y Corona' },
            { key: 'LiquidoFreno', title: 'Líquido de Frenos (Nivel/Fugas)' },
            { key: 'Llantas', title: 'Llantas (Estado, presiones, rotación)' },
            { key: 'Amortiguadores', title: 'Fugas en Amortiguadores' },
            { key: 'Embrague', title: 'Pedal de Embrague y Freno (Juego libre)' },
            { key: 'CajaDiferenciales', title: 'Fugas de Aceite en Caja y Diferenciales' },
            { key: 'Escape', title: 'Tuberías de Combustible y Escape' },
            { key: 'Combustible', title: 'Filtro de Aire / Conexiones Combustible' },
            { key: 'Suspension', title: 'Verificación de Suspensión Del/Tras' },
            { key: 'Direccion', title: 'Juego libre de Dirección y terminales' },
            { key: 'Cojinetes', title: 'Cojinetes de Bufa y Grasa' },
            { key: 'Arranque', title: 'Desmontar Arranque / Alternador (Mantenimiento)' },
            { key: 'Inyectores', title: 'Calibración de Inyectores / Bomba Inyecc.' }
        ];
        saveDatabase(db);
    }
    return ws.checkpoints_inspeccion;
}

window.switchInspeccionTab = function(tabName) {
    window.saasActiveInspeccionTab = tabName;
    const container = document.getElementById('view-container');
    if (container) {
        const hash = window.location.hash;
        const queryParams = {};
        if (hash.includes('?')) {
            const parts = hash.split('?')[1].split('&');
            parts.forEach(p => {
                const [k, v] = p.split('=');
                queryParams[k] = decodeURIComponent(v || '');
            });
        }
        renderRevision21(container, queryParams);
    }
};

window.deleteInspectionCriterio = function(key) {
    if (confirm("¿Estás seguro de que deseas eliminar este criterio de la hoja de revisión?\nNota: No afectará las revisiones pasadas pero no aparecerá en las nuevas.")) {
        const db = getDatabase();
        const ws = getWorkshopConfig(db);
        if (ws.checkpoints_inspeccion) {
            ws.checkpoints_inspeccion = ws.checkpoints_inspeccion.filter(cp => cp.key !== key);
            saveDatabase(db);
            showToast("Criterio eliminado con éxito", "success");
            window.switchInspeccionTab('configurar');
        }
    }
};

window.addInspectionCriterio = function(e) {
    e.preventDefault();
    const titleVal = document.getElementById('new-criterio-title').value.trim();
    if (!titleVal) return;
    
    const keyVal = titleVal.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "");
    
    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    
    if (!ws.checkpoints_inspeccion) {
        ws.checkpoints_inspeccion = [];
    }
    
    const exists = ws.checkpoints_inspeccion.some(cp => cp.key.toLowerCase() === keyVal.toLowerCase() || cp.title.toLowerCase() === titleVal.toLowerCase());
    if (exists) {
        showToast("Este criterio o uno muy similar ya existe.", "warning");
        return;
    }
    
    ws.checkpoints_inspeccion.push({ key: keyVal, title: titleVal });
    saveDatabase(db);
    showToast("Nuevo criterio agregado correctamente", "success");
    window.switchInspeccionTab('configurar');
};

window.resetInspectionCriterios = function() {
    if (confirm("¿Estás seguro de que deseas restablecer los criterios al listado predeterminado de 21 Puntos?")) {
        const db = getDatabase();
        const ws = getWorkshopConfig(db);
        ws.checkpoints_inspeccion = [
            { key: 'Freno de Mano', title: 'Freno de Mano (Recorrido / Regular)' },
            { key: 'AC', title: 'A/C Ventilación y filtro de cabina' },
            { key: 'Parabrisas', title: 'Parabrisas y Aspersores de agua' },
            { key: 'Luces', title: 'Luces exteriores y pito (claxon)' },
            { key: 'Fajas', title: 'Fajas de motor (alternador/bomba)' },
            { key: 'Refrigerante', title: 'Nivel y estado de Refrigerante' },
            { key: 'Bateria', title: 'Alternador, Batería y bornes' },
            { key: 'FugasMotor', title: 'Fugas de aceite / Niveles en Motor' },
            { key: 'FugasCajaCorona', title: 'Fugas de aceite en Caja y Corona' },
            { key: 'LiquidoFreno', title: 'Líquido de Frenos (Nivel/Fugas)' },
            { key: 'Llantas', title: 'Llantas (Estado, presiones, rotación)' },
            { key: 'Amortiguadores', title: 'Fugas en Amortiguadores' },
            { key: 'Embrague', title: 'Pedal de Embrague y Freno (Juego libre)' },
            { key: 'CajaDiferenciales', title: 'Fugas de Aceite en Caja y Diferenciales' },
            { key: 'Escape', title: 'Tuberías de Combustible y Escape' },
            { key: 'Combustible', title: 'Filtro de Aire / Conexiones Combustible' },
            { key: 'Suspension', title: 'Verificación de Suspensión Del/Tras' },
            { key: 'Direccion', title: 'Juego libre de Dirección y terminales' },
            { key: 'Cojinetes', title: 'Cojinetes de Bufa y Grasa' },
            { key: 'Arranque', title: 'Desmontar Arranque / Alternador (Mantenimiento)' },
            { key: 'Inyectores', title: 'Calibración de Inyectores / Bomba Inyecc.' }
        ];
        saveDatabase(db);
        showToast("Plantilla restablecida a 21 Puntos predeterminados", "info");
        window.switchInspeccionTab('configurar');
    }
};

window.viewInspectionDetails = function(revId) {
    const db = getDatabase();
    const revision = db.revisiones.find(r => r.ID_Revision === revId);
    if (!revision) {
        showToast("Error: Inspección no encontrada", "error");
        return;
    }
    
    const client = db.clientes.find(c => c.Codigo_Cliente === revision.Codigo_Cliente) || { Nombre: 'Cliente Desconocido' };
    const modal = document.getElementById('view-inspection-modal');
    if (!modal) return;
    
    const checks = revision.Chequeos || {};
    let checksHTML = '';
    const checkpoints = getInspectionCheckpoints(db);
    const keys = Object.keys(checks);
    
    let index = 1;
    if (keys.length > 0) {
        checksHTML = Object.entries(checks).map(([key, val]) => {
            const title = (checkpoints.find(cp => cp.key === key) || { title: key }).title;
            let badgeColor = 'var(--success)';
            let label = 'OK';
            if (val.estado === 'REVISAR') { badgeColor = 'var(--warning)'; label = 'REP'; }
            if (val.estado === 'CRITICO') { badgeColor = 'var(--danger)'; label = 'MAL'; }
            
            return `
                <div style="display: grid; grid-template-columns: 1.5fr 100px 1.5fr; border-bottom: 1px solid var(--border-color); padding: 0.6rem 0; font-size: 0.85rem;">
                    <div style="font-weight: 500;">${index++}. ${title}</div>
                    <div style="text-align: center;"><span style="background: ${badgeColor}; color: #fff; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">${label}</span></div>
                    <div style="color: var(--text-secondary); font-style: italic;">${val.obs || 'Sin observaciones'}</div>
                </div>
            `;
        }).join('');
    } else {
        checksHTML = `<div style="text-align:center; padding:1rem; color:var(--text-secondary);">No se registraron chequeos detallados en esta hoja.</div>`;
    }

    modal.innerHTML = html`
        <div class="modal-content glass-card" style="max-width: 800px; padding: 2rem;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                <div>
                    <h2 style="margin: 0; font-size: 1.4rem;"><i class="fa-solid fa-clipboard-check" style="color: var(--primary);"></i> Detalle de Inspección</h2>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">ID: <strong>${revision.ID_Revision}</strong> | Fecha: <strong>${revision.Fecha}</strong></span>
                </div>
                <button class="close-modal-btn" onclick="window.closeInspectionDetails()" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; background: var(--bg-sidebar); padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color);">
                <div>
                    <h4 style="margin:0 0 0.5rem 0; color:var(--primary); font-size:0.9rem;">Cliente</h4>
                    <p style="margin: 0; font-size: 0.85rem; font-weight: 600;">${client.Nombre}</p>
                    <p style="margin: 0.2rem 0 0 0; font-size: 0.8rem; color:var(--text-secondary);">Tel: ${revision['Telefono 1 '] || 'N/A'} | Correo: ${revision.Correo || 'N/A'}</p>
                </div>
                <div>
                    <h4 style="margin:0 0 0.5rem 0; color:var(--primary); font-size:0.9rem;">Vehículo</h4>
                    <p style="margin: 0; font-size: 0.85rem; font-weight: 600;">${revision.Marca || ''} ${revision.Modelo || ''} (${revision.Año || ''})</p>
                    <p style="margin: 0.2rem 0 0 0; font-size: 0.8rem; color:var(--text-secondary);">Placas: <strong>${revision.Placas || 'N/A'}</strong> | Kilometraje: <strong>${revision.Odometro || 'N/A'}</strong></p>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin:0 0 0.5rem 0; color:var(--primary); font-size:0.9rem;">Fallas Reportadas por el Cliente</h4>
                <p style="margin: 0; font-size: 0.85rem; background: var(--bg-input); padding: 0.6rem; border-radius: 4px; border: 1px solid var(--border-color);">${revision.Fallas_Reportadas || 'Ninguna'}</p>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin:0 0 0.5rem 0; color:var(--primary); font-size:0.9rem;">Observaciones Generales</h4>
                <p style="margin: 0; font-size: 0.85rem; background: var(--bg-input); padding: 0.6rem; border-radius: 4px; border: 1px solid var(--border-color);">${revision.Observaciones_Generales || 'Ninguna'}</p>
            </div>

            <h4 style="margin: 1.5rem 0 0.5rem 0; color: var(--primary); font-size: 0.9rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.25rem;">Resultados del Semáforo de Inspección</h4>
            <div class="checkpoint-detail-list" style="max-height: 250px; overflow-y: auto; padding-right: 0.5rem; margin-bottom: 1.5rem;">
                <div style="display: grid; grid-template-columns: 1.5fr 100px 1.5fr; font-weight: bold; border-bottom: 2px solid var(--border-color); padding-bottom: 0.4rem; font-size: 0.85rem; color: var(--text-primary);">
                    <div>Punto de Inspección</div>
                    <div style="text-align: center;">Estado</div>
                    <div>Observaciones Técnicas</div>
                </div>
                ${safe(checksHTML)}
            </div>

            <div style="display:flex; gap:1rem; justify-content:flex-end; border-top:1px solid var(--border-color); padding-top:1.25rem;">
                <button class="btn btn-secondary" onclick="window.closeInspectionDetails()">Cerrar</button>
                <button class="btn btn-secondary" onclick="window.exportInspectionPDF('${revision.ID_Revision}')" style="color: var(--cyan); border-color: var(--cyan);"><i class="fa-solid fa-file-pdf"></i> Guardar PDF / Imprimir</button>
                <button class="btn btn-primary" onclick="window.createBudgetFromInspection('${revision.ID_Revision}')"><i class="fa-solid fa-plus"></i> Generar Cotización</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
};

window.closeInspectionDetails = function() {
    const modal = document.getElementById('view-inspection-modal');
    if (modal) modal.classList.remove('active');
};

window.createBudgetFromInspection = function(revId) {
    const db = getDatabase();
    const revision = db.revisiones.find(r => r.ID_Revision === revId);
    if (!revision) {
        showToast("Error: Inspección no encontrada", "error");
        return;
    }
    
    window.closeInspectionDetails();
    
    const client = db.clientes.find(c => c.Codigo_Cliente === revision.Codigo_Cliente) || { Nombre: revision.Codigo_Cliente };
    
    const presId = "PRES-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
    const newBudget = {
        "ID Presupuesto": presId,
        Fecha: Date.now(),
        Codigo_Cliente: revision.Codigo_Cliente,
        Nombre: client.Nombre || '',
        "Telefono 1 ": client['Telefono 1 '] || '',
        Direccion: client.Direccion || '',
        "Categoría Contribuyente": client['Categoría Contribuyente'] || 'OTROS',
        ID_Vehiculo: revision.ID_Vehiculo,
        Placas: revision.Placas,
        Kilometraje: revision.Odometro,
        Estado: 1, 
        "% Impuesto": client['% Impuesto'] || 0.13,
        AplicaPercepcion: client.AplicaPercepcion || 0,
        AplicaRetencion: client.AplicaRetencion || 0,
        "Revision 21 puntos": revId,
        "Tecnico Asignado": db.tecnicos[0] ? db.tecnicos[0].Tecnico_ID : '',
        Fallas_Detectadas: revision.Fallas_Reportadas,
        "Pagado?": "NO"
    };

    db.presupuestos.unshift(newBudget);
    saveDatabase(db);
    
    showToast("Cotización generada correctamente desde la inspección", "success");
    window.location.hash = `#presupuestos?id=${presId}`;
};

window.exportInspectionPDF = function(revId) {
    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    const revision = db.revisiones.find(r => r.ID_Revision === revId);
    if (!revision) {
        showToast("Error: Inspección no encontrada", "error");
        return;
    }
    
    const client = db.clientes.find(c => c.Codigo_Cliente === revision.Codigo_Cliente) || { Nombre: 'Cliente Desconocido', DUI: '', NIT: '' };
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast("Error: Habilite las ventanas emergentes (popups) para imprimir el reporte.", "danger");
        return;
    }
    
    const logoHtml = ws.logo ? `<img src="${ws.logo}" style="max-height:85px; max-width:220px; object-fit:contain;" />` : `<h2 style="margin:0; color:#4f46e5; font-family:'Outfit', sans-serif;">${ws.nombre || 'MECANIC OS'}</h2>`;
    
    const checks = revision.Chequeos || {};
    const checkpoints = getInspectionCheckpoints(db);
    let index = 1;
    const checksRows = Object.entries(checks).map(([key, val]) => {
        const title = (checkpoints.find(cp => cp.key === key) || { title: key }).title;
        let badgeColor = '#22c55e'; 
        let badgeText = 'OK - BUENO';
        if (val.estado === 'REVISAR') { badgeColor = '#eab308'; badgeText = 'REP - REVISAR'; }
        if (val.estado === 'CRITICO') { badgeColor = '#ef4444'; badgeText = 'MAL - CRÍTICO'; }
        
        return `
            <tr>
                <td style="border-bottom: 1px solid #e2e8f0; padding: 8px 10px; font-weight: 500; font-size: 12px; width: 40%;">${index++}. ${title}</td>
                <td style="border-bottom: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; width: 20%;">
                    <span style="background: ${badgeColor}; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">${badgeText}</span>
                </td>
                <td style="border-bottom: 1px solid #e2e8f0; padding: 8px 10px; font-style: italic; font-size: 12px; color: #475569; width: 40%;">${val.obs || 'Sin observaciones'}</td>
            </tr>
        `;
    }).join('');

    const pdfHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Reporte de Inspección - ${revision.ID_Revision}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .no-print-toolbar {
            background-color: #1e293b;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #fff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            font-family: 'Inter', sans-serif;
        }
        .no-print-toolbar h3 {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            font-weight: 600;
        }
        .toolbar-buttons {
            display: flex;
            gap: 12px;
        }
        .btn-action {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .btn-print {
            background-color: #10b981;
            color: #fff;
        }
        .btn-print:hover {
            background-color: #059669;
        }
        .btn-close {
            background-color: #64748b;
            color: #fff;
        }
        .btn-close:hover {
            background-color: #475569;
        }
        .page-container {
            width: 820px;
            margin: 30px auto;
            background-color: #fff;
            padding: 40px;
            box-sizing: border-box;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border-radius: 8px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header-left {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .header-right {
            text-align: right;
        }
        .doc-title {
            font-family: 'Outfit', sans-serif;
            font-size: 20px;
            font-weight: 700;
            color: #1e3a8a;
            margin: 0;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
        }
        .meta-card {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 15px;
            background: #f8fafc;
        }
        .meta-card h3 {
            margin: 0 0 8px 0;
            font-size: 12px;
            text-transform: uppercase;
            color: #4f46e5;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
        }
        .meta-card p {
            margin: 4px 0;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 25px;
        }
        th {
            background: #0f172a !important;
            color: #fff !important;
            text-align: center;
            vertical-align: middle;
            white-space: nowrap;
            padding: 10px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            color: #1e3a8a;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 4px;
            margin-top: 25px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .block-text {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 15px;
            font-size: 12px;
            margin-bottom: 20px;
        }
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 100px;
            margin-top: 60px;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            font-size: 11px;
            color: #475569;
        }
        @media print {
            body {
                background-color: #fff !important;
                color: #000 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .no-print-toolbar {
                display: none !important;
            }
            .page-container {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
            }
            @page {
                size: portrait;
                margin: 1.2cm;
            }
        }
    </style>
</head>
<body>
    <div class="no-print-toolbar">
        <h3>Hoja de Recepción e Inspección - ${revision.ID_Revision}</h3>
        <div class="toolbar-buttons">
            <button class="btn-action btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir o Guardar PDF</button>
            <button class="btn-action btn-close" onclick="window.close()"><i class="fa-solid fa-xmark"></i> Cerrar Vista</button>
        </div>
    </div>
    <div class="page-container">
        <div class="header">
            <div class="header-left">
                ${safe(logoHtml)}
                <div style="font-size:11px; color:#475569; margin-top:5px;">
                    <strong>${ws.nombre || ''}</strong><br>
                    ${ws.direccion || ''}<br>
                    Teléfono: ${ws.telefono || ''} | Correo: ${ws.correo || ''}
                </div>
            </div>
            <div class="header-right">
                <h1 class="doc-title">HOJA DE RECEPCIÓN E INSPECCIÓN</h1>
                <div style="margin-top:8px; font-size:12px;">
                    <span>ID Reporte: <strong>${revision.ID_Revision}</strong></span><br>
                    <span>Fecha: <strong>${revision.Fecha}</strong></span>
                </div>
            </div>
        </div>

        <div class="meta-grid">
            <div class="meta-card">
                <h3>Datos del Cliente</h3>
                <p><strong>Nombre:</strong> ${client.Nombre}</p>
                <p><strong>Documento:</strong> ${client.DUI || client.NIT || revision.Correo || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${revision['Telefono 1 '] || 'N/A'}</p>
                <p><strong>Correo:</strong> ${revision.Correo || 'N/A'}</p>
            </div>
            <div class="meta-card">
                <h3>Datos del Vehículo</h3>
                <p><strong>Marca / Modelo:</strong> ${revision.Marca || 'N/A'} ${revision.Modelo || ''}</p>
                <p><strong>Año:</strong> ${revision.Año || 'N/A'}</p>
                <p><strong>Número de Placas:</strong> ${revision.Placas || 'N/A'}</p>
                <p><strong>Kilometraje / Odómetro:</strong> ${revision.Odometro || 'N/A'}</p>
            </div>
        </div>

        <div class="section-title">Fallas Reportadas por el Cliente / Motivo de Ingreso</div>
        <div class="block-text">
            ${revision.Fallas_Reportadas || 'No se reportaron fallas específicas.'}
        </div>

        <div class="section-title">Resultados del Semáforo de Revisión Técnica</div>
        <table>
            <thead>
                <tr>
                    <th style="text-align: left; padding: 10px;">Punto de Inspección</th>
                    <th style="text-align: center; padding: 10px;">Estado de Inspección</th>
                    <th style="text-align: left; padding: 10px;">Observaciones / Detalles Técnicos</th>
                </tr>
            </thead>
            <tbody>
                ${checksRows}
            </tbody>
        </table>

        <div class="section-title">Observaciones Generales de la Inspección</div>
        <div class="block-text">
            ${revision.Observaciones_Generales || 'Ninguna observación adicional.'}
        </div>

        <div class="signatures">
            <div>
                <div style="height: 60px;"></div>
                <div class="signature-line">Firma del Técnico Evaluador</div>
            </div>
            <div>
                <div style="height: 60px;"></div>
                <div class="signature-line">Firma de Recepción del Cliente</div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
    printWindow.document.write(pdfHTML);
    printWindow.document.close();
    printWindow.opener = null;
};



export function renderRegistrarTab(db, checkpoints) {
    let clientOptionsHTML = db.clientes.map(c => `<option value="${c.Codigo_Cliente}">${c.Nombre} (${c.Codigo_Cliente})</option>`).join('');
    
    return `
        <form id="inspection-form">
            <div class="inspection-header-fields">
                <div class="form-group">
                    <label>Cliente</label>
                    <select id="ins-client-select" required>
                        <option value="">-- Seleccionar Cliente --</option>
                        ${safe(clientOptionsHTML)}
                    </select>
                </div>
                <div class="form-group">
                    <label>Vehículo (Placas)</label>
                    <select id="ins-vehicle-select" required disabled>
                        <option value="">-- Selecciona un cliente primero --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Kilometraje / Odómetro</label>
                    <input type="text" id="ins-odo" required placeholder="Ej. 125,400 Km">
                </div>
            </div>

            <div class="inspection-header-fields" style="grid-template-columns: 1fr 1fr;">
                <div class="form-group">
                    <label>Fallas Reportadas por el Cliente / Motivo de Visita</label>
                    <textarea id="ins-fallas" rows="2" required placeholder="Escriba las fallas reportadas..."></textarea>
                </div>
                <div class="form-group">
                    <label>Otras Observaciones Generales</label>
                    <textarea id="ins-observaciones" rows="2" placeholder="Golpes en carrocería, accesorios faltantes, etc."></textarea>
                </div>
            </div>

            <div class="checkpoint-list">
                <div class="checkpoint-row" style="background-color: var(--border-color); border-radius: var(--radius-sm); font-weight: bold; border: none; padding: 0.75rem 1rem;">
                    <div>Punto de Inspección</div>
                    <div style="text-align: center;">Estado (Semáforo)</div>
                    <div>Observaciones Técnicas Específicas</div>
                </div>
                
                ${safe(checkpoints.map((cp, idx) => `
                    <div class="checkpoint-row" data-key="${cp.key}">
                        <div class="checkpoint-info">
                            <span class="checkpoint-title">${idx + 1}. ${cp.title}</span>
                        </div>
                        <div class="checkpoint-selector">
                            <button type="button" class="checkpoint-btn btn-good active" data-value="BUENO">OK</button>
                            <button type="button" class="checkpoint-btn btn-warning" data-value="REVISAR">REP</button>
                            <button type="button" class="checkpoint-btn btn-bad" data-value="CRITICO">MAL</button>
                        </div>
                        <div>
                            <input type="text" class="checkpoint-obs" placeholder="Detalles de falla si aplica..." style="padding: 0.5rem; font-size: 0.85rem;">
                        </div>
                    </div>
                `).join(''))}
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="window.location.hash='#taller-dashboard'">Cancelar</button>
                <button type="submit" class="btn btn-success"><i class="fa-solid fa-save"></i> Guardar Inspección e Ingreso</button>
            </div>
        </form>
    `;
}



export function renderHistorialTab(db) {
    const revisions = db.revisiones || [];
    
    let rowsHTML = '';
    if (revisions.length === 0) {
        rowsHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; color: var(--border-color);"></i>
                    No se han registrado inspecciones aún.
                </td>
            </tr>
        `;
    } else {
        rowsHTML = revisions.map(r => {
            const client = db.clientes.find(c => c.Codigo_Cliente === r.Codigo_Cliente) || { Nombre: 'Cliente Desconocido' };
            const vehicleText = `${r.Marca || ''} ${r.Modelo || ''} (${r.Año || ''}) [Placas: ${r.Placas || 'N/A'}]`;
            return `
                <tr class="inspection-history-row" data-id="${r.ID_Revision}">
                    <td style="font-weight: 600;">${r.ID_Revision}</td>
                    <td>${r.Fecha}</td>
                    <td>${client.Nombre}</td>
                    <td>${vehicleText}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary btn-sm" onclick="window.viewInspectionDetails('${r.ID_Revision}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;"><i class="fa-solid fa-eye"></i> Ver</button>
                            <button class="btn btn-secondary btn-sm" onclick="window.exportInspectionPDF('${r.ID_Revision}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; color: var(--cyan); border-color: var(--cyan);"><i class="fa-solid fa-file-pdf"></i> PDF</button>
                            <button class="btn btn-primary btn-sm" onclick="window.createBudgetFromInspection('${r.ID_Revision}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i> Cotizar</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    return `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <div class="form-group" style="flex: 1; min-width: 250px; margin: 0;">
                    <input type="text" id="ins-search-input" placeholder="Buscar por Cliente, Placa o ID..." style="padding: 0.6rem; width: 100%; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-input); color: var(--text-primary);">
                </div>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID Inspección</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Vehículo</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="ins-history-tbody">
                        ${safe(rowsHTML)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}



export function renderConfigurarTab(db, checkpoints) {
    let rowsHTML = checkpoints.map((cp, idx) => {
        return `
            <tr>
                <td style="font-weight: 600; width: 50px;">${idx + 1}</td>
                <td>
                    <span style="font-weight: 500; color: var(--text-primary);">${cp.title}</span>
                    <br>
                    <small style="color: var(--text-secondary); font-size: 0.75rem;">Llave técnica: <code>${cp.key}</code></small>
                </td>
                <td style="text-align: right; width: 100px;">
                    <button class="btn btn-secondary btn-sm" onclick="window.deleteInspectionCriterio('${cp.key}')" style="color: var(--danger); border-color: var(--danger); padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-trash-can"></i> Eliminar</button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem; align-items: start;">
            <div class="glass-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="font-size: 1.1rem; color: var(--primary); margin: 0;"><i class="fa-solid fa-list-check"></i> Criterios Activos (${checkpoints.length})</h3>
                    <button class="btn btn-secondary btn-sm" onclick="window.resetInspectionCriterios()" style="font-size: 0.75rem; color: var(--warning); border-color: var(--warning);"><i class="fa-solid fa-arrow-rotate-left"></i> Restablecer 21 Puntos</button>
                </div>
                
                <div class="table-container" style="max-height: 450px; overflow-y: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Criterio de Inspección</th>
                                <th style="text-align: right;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(rowsHTML)}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="glass-card" style="padding: 1.5rem;">
                <h3 style="font-size: 1.1rem; color: var(--primary); margin-bottom: 1.25rem;"><i class="fa-solid fa-circle-plus"></i> Agregar Nuevo Criterio</h3>
                <form id="add-criterio-form" onsubmit="window.addInspectionCriterio(event)" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="form-group">
                        <label>Título del Punto de Inspección</label>
                        <input type="text" id="new-criterio-title" required placeholder="Ej. Estado del Extintor de Incendios" style="padding: 0.6rem; width: 100%; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-input); color: var(--text-primary);">
                        <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">Escribe una descripción clara del elemento a inspeccionar en el vehículo.</small>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="padding: 0.75rem;"><i class="fa-solid fa-plus"></i> Guardar Criterio</button>
                </form>
            </div>
        </div>
    `;
}



