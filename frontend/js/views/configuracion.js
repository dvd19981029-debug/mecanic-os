/**
 * Mecanic OS - Configuration View Module
 */

import {
    saveDatabase,
    getWorkshopConfig,
    setupMunicipiosSelect,
    setupOfficialCatalogsSelect,
    getGirosOptionsHtml,
    getValidEconomicActivityCode,
    setSecureDteConfig,
    calculateElSalvadorPeriodPayroll,
    getActiveUser
} from '../../app.js?v=69';

import { showToast, html, safe, hashPassword } from '../utils.js?v=69';

// Configuration active tab state
let activeConfigTab = 'taller';

export function renderConfiguracion(container, queryParams) {
    const activeUser = typeof getActiveUser === 'function' ? getActiveUser() : null;
    const isAdmin = activeUser && activeUser.Rol === 'administrador';
    const db = window.getDatabase();
    if (queryParams && queryParams.tab) {
        activeConfigTab = queryParams.tab;
    }
    
    // Load DTE configuration
    const dteCfg = (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.dte_config) ||
                   (typeof window.getSecureDteConfig === 'function' ? window.getSecureDteConfig() : {});

    // Load Firebase configuration
    const fbCfg = JSON.parse(localStorage.getItem('mecanic_os_firebase_config')) || {};

    const ws = getWorkshopConfig(db);

    // Initialize techs properties if missing
    db.tecnicos.forEach(t => {
        if (t.Salario_Base === undefined) {
            t.Salario_Base = t.Tecnico_ID.includes('181025') ? 1200 : 750;
        }
        if (!t.Incapacidades) t.Incapacidades = [];
        if (!t.Vacaciones) t.Vacaciones = [];
        if (!t.Bonos) t.Bonos = [];
    });

    // Helper functions for layouts
    function getTallerHtml() {
        return `
            <div class="view-split" style="display:grid; grid-template-columns: 1.2fr 0.8fr; gap:1.5rem;">
                <div style="display:flex; flex-direction:column; gap:1.5rem;">
                    <div class="glass-card" style="padding:2rem;">
                        <h3 style="font-size:1.2rem; color:var(--primary); border-left:3px solid var(--primary); padding-left:0.5rem; margin-bottom:1.25rem; font-weight:700;">Datos de la Empresa / Taller</h3>
                        <form id="config-taller-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                            <!-- General -->
                            <div class="form-group">
                                <label>Nombre o Razón Social</label>
                                <input type="text" id="cfg-taller-nombre" value="${ws.nombre || ''}" required style="padding:0.6rem;">
                            </div>
                            <div class="form-group">
                                <label>Nombre Comercial</label>
                                <input type="text" id="cfg-taller-nombre-comercial" value="${ws.nombre_comercial || ''}" required style="padding:0.6rem;">
                            </div>
                            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Correo Electrónico</label>
                                    <input type="email" id="cfg-taller-correo" value="${ws.correo || ''}" required style="padding:0.6rem;">
                                </div>
                                <div class="form-group">
                                    <label>Teléfono de Contacto</label>
                                    <input type="text" id="cfg-taller-telefono" value="${ws.telefono || ''}" required style="padding:0.6rem;">
                                </div>
                            </div>
                            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Tipo Persona</label>
                                    <select id="cfg-taller-tipo-persona" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                        <option value="Natural" ${ws.tipo_persona === 'Natural' ? 'selected' : ''}>Natural</option>
                                        <option value="Jurídica" ${ws.tipo_persona === 'Jurídica' ? 'selected' : ''}>Jurídica</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Clasificación Tributaria</label>
                                    <select id="cfg-taller-clasificacion" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                        <option value="Otros" ${ws.clasificacion_tributaria === 'Otros' ? 'selected' : ''}>Otros</option>
                                        <option value="Pequeño contribuyente" ${ws.clasificacion_tributaria === 'Pequeño contribuyente' ? 'selected' : ''}>Pequeño contribuyente</option>
                                        <option value="Mediano contribuyente" ${ws.clasificacion_tributaria === 'Mediano contribuyente' ? 'selected' : ''}>Mediano contribuyente</option>
                                        <option value="Gran contribuyente" ${ws.clasificacion_tributaria === 'Gran contribuyente' ? 'selected' : ''}>Gran contribuyente</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>¿Es sujeto excluido?</label>
                                    <select id="cfg-taller-sujeto-excluido" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                        <option value="No" ${ws.sujeto_excluido === 'No' ? 'selected' : ''}>No</option>
                                        <option value="Sí" ${ws.sujeto_excluido === 'Sí' ? 'selected' : ''}>Sí</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Fiscal -->
                            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Tipo Documento</label>
                                    <select id="cfg-taller-tipo-doc" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                        <option value="NIT" ${ws.tipo_documento === 'NIT' ? 'selected' : ''}>NIT</option>
                                        <option value="DUI" ${ws.tipo_documento === 'DUI' ? 'selected' : ''}>DUI</option>
                                        <option value="Pasaporte" ${ws.tipo_documento === 'Pasaporte' ? 'selected' : ''}>Pasaporte</option>
                                        <option value="Carnet de Extranjería" ${ws.tipo_documento === 'Carnet de Extranjería' ? 'selected' : ''}>Carnet de Extranjería</option>
                                        <option value="Otro" ${ws.tipo_documento === 'Otro' ? 'selected' : ''}>Otro</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Número Documento</label>
                                    <input type="text" id="cfg-taller-num-doc" value="${ws.num_documento || ''}" required style="padding:0.6rem;">
                                </div>
                            </div>
                            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>NRC</label>
                                    <input type="text" id="cfg-taller-nrc" value="${ws.nrc || ''}" required style="padding:0.6rem;">
                                </div>
                                <div class="form-group">
                                    <label>Giro / Actividad</label>
                                    <select id="cfg-taller-giro" required style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px; width: 100%;">
                                        ${getGirosOptionsHtml(ws.actividad_economica || ws.giro)}
                                    </select>
                                </div>
                            </div>

                            <!-- Dirección -->
                            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>País</label>
                                    <select id="cfg-taller-pais" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                        <option value="El Salvador" selected>El Salvador</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Departamento</label>
                                    <select id="cfg-taller-departamento" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                        <option value="Ahuachapán" ${ws.departamento === 'Ahuachapán' ? 'selected' : ''}>Ahuachapán</option>
                                        <option value="Cabañas" ${ws.departamento === 'Cabañas' ? 'selected' : ''}>Cabañas</option>
                                        <option value="Chalatenango" ${ws.departamento === 'Chalatenango' ? 'selected' : ''}>Chalatenango</option>
                                        <option value="Cuscatlán" ${ws.departamento === 'Cuscatlán' ? 'selected' : ''}>Cuscatlán</option>
                                        <option value="La Libertad" ${ws.departamento === 'La Libertad' ? 'selected' : ''}>La Libertad</option>
                                        <option value="La Paz" ${ws.departamento === 'La Paz' ? 'selected' : ''}>La Paz</option>
                                        <option value="La Unión" ${ws.departamento === 'La Unión' ? 'selected' : ''}>La Unión</option>
                                        <option value="Morazán" ${ws.departamento === 'Morazán' ? 'selected' : ''}>Morazán</option>
                                        <option value="San Miguel" ${ws.departamento === 'San Miguel' ? 'selected' : ''}>San Miguel</option>
                                        <option value="San Salvador" ${ws.departamento === 'San Salvador' ? 'selected' : ''}>San Salvador</option>
                                        <option value="San Vicente" ${ws.departamento === 'San Vicente' ? 'selected' : ''}>San Vicente</option>
                                        <option value="Santa Ana" ${ws.departamento === 'Santa Ana' ? 'selected' : ''}>Santa Ana</option>
                                        <option value="Sonsonate" ${ws.departamento === 'Sonsonate' ? 'selected' : ''}>Sonsonate</option>
                                        <option value="Usulután" ${ws.departamento === 'Usulután' ? 'selected' : ''}>Usulután</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Municipio</label>
                                    <select id="cfg-taller-municipio" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Dirección Comercial Detallada</label>
                                <input type="text" id="cfg-taller-direccion" value="${ws.direccion || ''}" required style="padding:0.6rem;">
                            </div>

                            <!-- Logotipo -->
                            <div class="form-group">
                                <label>Cargar Nuevo Logotipo</label>
                                <input type="file" id="cfg-taller-logo" accept="image/*" style="padding:0.4rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                            <div id="cfg-logo-preview-container" style="display:${ws.logo ? 'block' : 'none'}; text-align:center; margin-top:0.5rem;">
                                <span style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.4rem;">Vista Previa del Logotipo:</span>
                                <img id="cfg-logo-preview" src="${ws.logo || ''}" style="max-height:85px; max-width:200px; object-fit:contain; border:1px solid var(--border-color); border-radius:6px; padding:6px; background:#f8fafc;" />
                            </div>

                            <!-- Branding de Documentos -->
                            <h3 style="font-size:1.1rem; color:var(--primary); border-left:3px solid var(--primary); padding-left:0.5rem; margin-top:1.5rem; margin-bottom:1rem; font-weight:700;">Diseño y Branding (PDFs)</h3>
                            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                                <div class="form-group">
                                    <label>Texto Corto para Logo (PDFs)</label>
                                    <input type="text" id="cfg-taller-logotext" value="${ws.logoText || ''}" placeholder="Ej: GRUPO GEMA" required style="padding:0.6rem;">
                                </div>
                                <div class="form-group">
                                    <label>Eslogan / Tagline Logo</label>
                                    <input type="text" id="cfg-taller-tagline" value="${ws.logoTagline || ''}" placeholder="Ej: Mantenimiento de Flotas" required style="padding:0.6rem;">
                                </div>
                            </div>
                            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
                                <div class="form-group">
                                    <label>Formato de Impresión (Presupuestos)</label>
                                    <select id="cfg-taller-formato-presupuesto" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                        <option value="moderno_facturallama" ${ws.formato_presupuesto === 'moderno_facturallama' ? 'selected' : ''}>Moderno (Formato FacturaLlama DTE)</option>
                                        <option value="clasico_mecanicos" ${ws.formato_presupuesto === 'clasico_mecanicos' ? 'selected' : ''}>Clásico Mecanic OS (Tablas Separadas)</option>
                                        <option value="elegante_ejecutivo" ${ws.formato_presupuesto === 'elegante_ejecutivo' ? 'selected' : ''}>Elegante / Ejecutivo (Cabecera Centrada)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Color de Encabezados (PDFs)</label>
                                    <div style="display:flex; gap:0.5rem; align-items:center;">
                                        <input type="color" id="cfg-taller-color-presupuesto" value="${ws.color_presupuesto || '#1e293b'}" style="width:45px; height:38px; padding:0; border:1px solid var(--border-color); border-radius:4px; background:none; cursor:pointer;">
                                        <input type="text" id="cfg-taller-color-presupuesto-text" value="${ws.color_presupuesto || '#1e293b'}" style="padding:0.6rem; flex:1; text-transform:uppercase;" placeholder="#1E293B" required>
                                    </div>
                                </div>
                            </div>
                            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1.25rem;">
                                <div class="form-group">
                                    <label>Modelo de Comisiones del Taller</label>
                                    <select id="cfg-taller-tipo-comision" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                        <option value="general" ${ws.tipo_comision === 'general' || !ws.tipo_comision ? 'selected' : ''}>Comisión General (Por Presupuesto)</option>
                                        <option value="detallada" ${ws.tipo_comision === 'detallada' ? 'selected' : ''}>Comisión Detallada (Por Ítem/Fila de Trabajo)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Teléfono para QR de WhatsApp (Cotizaciones)</label>
                                    <input type="text" id="cfg-taller-qr-whatsapp" value="${ws.qr_whatsapp || ''}" placeholder="Ej: 78121302" style="padding:0.6rem;">
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width:fit-content; align-self:flex-end; padding:0.65rem 1.25rem;"><i class="fa-solid fa-circle-check"></i> Guardar Datos del Taller</button>
                        </form>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:1.5rem;">
                    <div class="glass-card" id="card-roles-permisos">
                        <h3 style="margin-bottom:0.75rem;"><i class="fa-solid fa-user-shield"></i> Gestión de Roles y Permisos</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:1.25rem;">
                            Personaliza los accesos a las diferentes vistas de la plataforma para cada rol. Los cambios se aplicarán de inmediato.
                        </p>
                        
                        <div class="form-group" style="margin-bottom:1.25rem;">
                            <label style="font-weight:600; margin-bottom:0.4rem; display:block;">Seleccionar Rol</label>
                            <select id="permiso-rol-selector" style="padding:0.6rem; width:100%; border-radius:6px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary);">
                                <!-- Options populated dynamically -->
                            </select>
                        </div>

                        <label style="font-weight:600; margin-bottom:0.6rem; display:block;">Vistas y Módulos Autorizados</label>
                        <div id="permisos-checkboxes-container" style="display:flex; flex-direction:column; gap:0.6rem; max-height:280px; overflow-y:auto; padding-right:0.4rem; margin-bottom:1.25rem; border:1px solid rgba(255,255,255,0.05); padding:0.6rem; border-radius:6px; background:rgba(0,0,0,0.1);">
                            <!-- Checkboxes populated dynamically -->
                        </div>

                        <button type="button" class="btn btn-primary" id="btn-save-role-permissions" style="width:100%; justify-content:center; margin-bottom:1.5rem;">
                            <i class="fa-solid fa-circle-check"></i> Guardar Permisos del Rol
                        </button>

                        <div style="margin-top:1.5rem; border-top:1px solid var(--border-color); padding-top:1.25rem;">
                            <h4 style="margin:0 0 0.5rem 0; font-family:'Outfit', sans-serif; font-size:1rem; color:var(--text-primary);"><i class="fa-solid fa-user-gear"></i> Crear Rol Personalizado</h4>
                            <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem;">
                                <input type="text" id="new-custom-role-name" placeholder="Ej: Cajero" style="padding:0.5rem 0.6rem; flex:1; font-size:0.8rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px;">
                                <button type="button" class="btn btn-primary" id="btn-add-custom-role" style="padding:0.25rem 0.75rem; font-size:0.8rem; height:34px; justify-content:center; width:fit-content; min-width:80px;"><i class="fa-solid fa-plus"></i> Añadir</button>
                            </div>
                            <div id="custom-roles-list-tags" style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.5rem;">
                                <!-- Tags creados se inyectan dinámicamente aquí -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getEmpleadosHtml() {
        return `
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                    <h3>Catálogo de Técnicos / Empleados</h3>
                    <button class="btn btn-primary" id="btn-add-tecnico" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-user-plus"></i> Nuevo Empleado</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Especialidad</th>
                                <th>Salario Base</th>
                                <th>Comisiones (% Serv / % Rep)</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safe(db.tecnicos.map(t => `
                                <tr>
                                    <td><strong>${t.Nombre_Completo}</strong></td>
                                    <td>${t.Especialidad || 'Mecánico General'}</td>
                                    <td>$ ${parseFloat(t.Salario_Base).toFixed(2)}</td>
                                    <td>${t.Comision_Servicios !== undefined ? t.Comision_Servicios : 10}% / ${t.Comision_Productos !== undefined ? t.Comision_Productos : 0}%</td>
                                    <td>
                                        <div style="display:flex; gap:0.35rem;">
                                            <button class="btn btn-secondary btn-payroll" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-calculator"></i> Planilla</button>
                                            <button class="btn btn-secondary btn-expediente" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-folder-open"></i> Expediente</button>
                                            <button class="btn btn-secondary btn-edit-tecnico" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                                            <button class="btn btn-secondary btn-delete-tecnico" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `).join(''))}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function getProductosHtml() {
        return `
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3>Catálogo de Repuestos y Productos</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">Administra el catálogo maestro de repuestos para presupuestos y POS.</p>
                    </div>
                    <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="search-productos-input" placeholder="Buscar por descripción o código..." style="padding:0.6rem 1rem; width:280px; border-radius:6px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary);">
                        ${isAdmin ? `
                        <button class="btn btn-secondary" id="btn-template-productos" title="Descargar Plantilla Excel de Carga" style="padding: 0.6rem 0.8rem; background:transparent; border:1px solid var(--border-color); color:var(--text-primary);"><i class="fa-solid fa-file-excel" style="color:var(--success);"></i> Plantilla</button>
                        <button class="btn btn-secondary" id="btn-import-productos" title="Importar desde Excel" style="padding: 0.6rem 0.8rem; background:transparent; border:1px solid var(--border-color); color:var(--text-primary);"><i class="fa-solid fa-file-import" style="color:var(--cyan);"></i> Importar Excel</button>
                        <input type="file" id="import-productos-file" accept=".xlsx, .xls" style="display:none;">
                        ` : ''}
                        <button class="btn btn-primary" id="btn-add-producto"><i class="fa-solid fa-plus"></i> Nuevo Producto</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Presentación</th>
                                <th style="text-align:right;">P. Compra</th>
                                <th style="text-align:right;">Precio Neto</th>
                                <th style="text-align:right;">Precio c/IVA</th>
                                <th style="text-align:center;">% Ganancia</th>
                                <th style="text-align:center;">Stock Mín.</th>
                                <th style="text-align:center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="productos-table-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function getServiciosHtml() {
        const activeUser = typeof getActiveUser === 'function' ? getActiveUser() : null;
        const roleName = activeUser ? activeUser.Nivel_Acceso || "Mecánico" : "Mecánico";
        const searchRole = roleName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isAdmin = searchRole === "administrador";

        return `
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3>Catálogo de Servicios y Mano de Obra</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">Define los servicios técnicos base y sus tarifas por defecto.</p>
                    </div>
                    <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="search-servicios-input" placeholder="Buscar por descripción o código..." style="padding:0.6rem 1rem; width:220px; border-radius:6px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary);">
                        ${isAdmin ? `
                        <button class="btn btn-secondary" id="btn-template-servicios" style="padding:0.6rem 1rem; display:flex; align-items:center; gap:0.5rem; background:transparent; border:1px solid var(--border-color); color:var(--text-primary);"><i class="fa-solid fa-file-excel" style="color:var(--success);"></i> Plantilla</button>
                        <button class="btn btn-secondary" id="btn-import-servicios" style="padding:0.6rem 1rem; display:flex; align-items:center; gap:0.5rem; background:transparent; border:1px solid var(--border-color); color:var(--text-primary);"><i class="fa-solid fa-file-import" style="color:var(--cyan);"></i> Importar Excel</button>
                        <input type="file" id="import-servicios-file" accept=".xlsx, .xls" style="display:none;">
                        ` : ''}
                        <button class="btn btn-primary" id="btn-add-servicio"><i class="fa-solid fa-plus"></i> Nuevo Servicio</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Servicio</th>
                                <th>Descripción</th>
                                <th>Categoría</th>
                                <th>U. Medida</th>
                                <th style="text-align:right;">Precio Base</th>
                                <th style="text-align:center;">Precio Editable</th>
                                <th style="text-align:center;">Aplica IVA</th>
                                <th style="text-align:center;">Estado</th>
                                <th style="text-align:center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="servicios-table-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function getPromocionesHtml() {
        return `
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3>Catálogo de Promociones y Descuentos</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">Configura descuentos fijos o porcentuales para aplicar en presupuestos.</p>
                    </div>
                    <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="search-promociones-input" placeholder="Buscar promoción por nombre..." style="padding:0.6rem 1rem; width:280px; border-radius:6px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary);">
                        <button class="btn btn-primary" id="btn-add-promocion"><i class="fa-solid fa-plus"></i> Nueva Promoción</button>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th style="text-align:right;">Valor</th>
                                <th style="text-align:center;">Vigencia</th>
                                <th style="text-align:center;">Estado</th>
                                <th style="text-align:center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="promociones-table-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Render outer structure
    container.innerHTML = html`
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
            <div class="saas-tabs-container" style="margin-bottom: 0.5rem;">
                <button class="saas-tab-btn ${activeConfigTab === 'taller' ? 'active' : ''}" data-tab="taller"><i class="fa-solid fa-sliders"></i> Taller y Roles</button>
                <button class="saas-tab-btn ${activeConfigTab === 'empleados' ? 'active' : ''}" data-tab="empleados"><i class="fa-solid fa-users-gear"></i> Empleados</button>
                <button class="saas-tab-btn ${activeConfigTab === 'productos' ? 'active' : ''}" data-tab="productos"><i class="fa-solid fa-boxes-stacked"></i> Repuestos / Productos</button>
                <button class="saas-tab-btn ${activeConfigTab === 'servicios' ? 'active' : ''}" data-tab="servicios"><i class="fa-solid fa-screwdriver-wrench"></i> Servicios / Mano de Obra</button>
                <button class="saas-tab-btn ${activeConfigTab === 'promociones' ? 'active' : ''}" data-tab="promociones"><i class="fa-solid fa-tags"></i> Promociones</button>
                <button class="saas-tab-btn ${activeConfigTab === 'checklist' ? 'active' : ''}" data-tab="checklist"><i class="fa-solid fa-list-check"></i> Formulario de Ingreso</button>
            </div>
            
            <div id="config-tab-content-area">
                <!-- Tab specific HTML goes here -->
            </div>
        </div>
        
        <!-- Payroll Modal -->
        <div id="payroll-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Cálculo de Planilla (Leyes de El Salvador)</h2>
                    <button class="close-modal-btn" id="close-payroll-modal">&times;</button>
                </div>
                <div id="payroll-content">
                    <!-- Dynamic calculation -->
                </div>
            </div>
        </div>

        <!-- Expediente Modal -->
        <div id="expediente-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>Expediente Laboral</h2>
                    <button class="close-modal-btn" id="close-expediente-modal">&times;</button>
                </div>
                <div id="expediente-content">
                    <!-- Dynamic content -->
                </div>
            </div>
        </div>

        <!-- Tecnico Modal -->
        <div id="tecnico-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 id="tecnico-modal-title">Registrar Empleado</h2>
                    <button class="close-modal-btn" id="close-tecnico-modal">&times;</button>
                </div>
                <form id="tecnico-form" novalidate style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <input type="hidden" id="tecnico-id">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="tecnico-nombre" required placeholder="Nombre y Apellido">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="tecnico-email" required placeholder="ejemplo@correo.com">
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="text" id="tecnico-telefono" required placeholder="7000-0000">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Especialidad</label>
                            <input type="text" id="tecnico-especialidad" placeholder="Mecánico, Electricista, etc.">
                        </div>
                        <div class="form-group">
                            <label>Nivel de Acceso</label>
                            <select id="tecnico-acceso" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                <!-- Poblado dinámicamente -->
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Salario Base ($)</label>
                            <input type="number" id="tecnico-salario" required min="365" step="1" value="365">
                        </div>
                        <div class="form-group">
                            <label>Contraseña Acceso</label>
                            <input type="password" id="tecnico-pass" required value="1234">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>% Comisión Servicios (Mano de Obra)</label>
                            <input type="number" id="tecnico-comision-servicios" required min="0" max="100" step="0.1" value="10">
                        </div>
                        <div class="form-group">
                            <label>% Comisión Repuestos (Productos)</label>
                            <input type="number" id="tecnico-comision-productos" required min="0" max="100" step="0.1" value="0">
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-tecnico">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Producto Modal -->
        <div id="producto-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 id="producto-modal-title">Registrar Producto / Repuesto</h2>
                    <button class="close-modal-btn" id="close-producto-modal">&times;</button>
                </div>
                <form id="producto-form" novalidate style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <input type="hidden" id="producto-id">
                    <div class="form-group">
                        <label>Descripción / Nombre del Repuesto</label>
                        <input type="text" id="producto-descripcion" required placeholder="Ej. Balatas delanteras">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Precio Compra ($ Sin IVA)</label>
                            <input type="number" id="producto-precio-compra" required min="0" step="0.01" value="0.00">
                        </div>
                        <div class="form-group">
                            <label>% Ganancia (Estimado)</label>
                            <input type="text" id="producto-ganancia-pct" readonly value="N/A" style="background:rgba(255,255,255,0.05); font-weight:bold; padding:0.6rem; border-radius:6px; border:1px solid var(--border-color);">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Precio Venta ($ Sin IVA)</label>
                            <input type="number" id="producto-precio-venta" required min="0" step="0.01" value="0.00">
                        </div>
                        <div class="form-group">
                            <label>Precio Venta con IVA (13% Auto)</label>
                            <input type="text" id="producto-precio-iva" readonly style="background:rgba(255,255,255,0.05); color:var(--text-muted); padding:0.6rem; border-radius:6px; border:1px solid var(--border-color);">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Stock Mínimo</label>
                            <input type="number" id="producto-minimos" required min="0" step="1" value="1">
                        </div>
                        <div class="form-group">
                            <label>Presentación / Tipo Unidad</label>
                            <input type="text" id="producto-presentacion" required value="Unidad" placeholder="Ej. Unidad, Galón, Litro">
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-producto">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Servicio Modal -->
        <div id="servicio-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 id="servicio-modal-title">Registrar Servicio / Mano de Obra</h2>
                    <button class="close-modal-btn" id="close-servicio-modal">&times;</button>
                </div>
                <form id="servicio-form" novalidate style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <input type="hidden" id="servicio-id">
                    <div class="form-group">
                        <label>Descripción del Servicio</label>
                        <input type="text" id="servicio-descripcion" required placeholder="Ej. Cambio de Aceite">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Precio Unitario ($ Sin IVA)</label>
                            <input type="number" id="servicio-precio" required min="0" step="0.01" value="0.00">
                        </div>
                        <div class="form-group">
                            <label>Unidad de Medida</label>
                            <select id="servicio-unidad" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="Servicio">Servicio</option>
                                <option value="Hora">Hora</option>
                                <option value="Día">Día</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="servicio-categoria" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="MO001">Mecánica General</option>
                                <option value="MO002">Electricidad</option>
                                <option value="MO003">Enderezado y Pintura</option>
                                <option value="MO004">Otros Servicios</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Precio Editable en Presupuestos?</label>
                            <select id="servicio-editable" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="SI">Sí</option>
                                <option value="NO">No</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Aplica IVA?</label>
                            <select id="servicio-iva" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="SI">Sí</option>
                                <option value="NO">No</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Estado</label>
                            <select id="servicio-estado" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-servicio">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Promocion Modal -->
        <div id="promocion-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 id="promocion-modal-title">Registrar Promoción</h2>
                    <button class="close-modal-btn" id="close-promocion-modal">&times;</button>
                </div>
                <form id="promocion-form" novalidate style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <input type="hidden" id="promocion-id">
                    <div class="form-group">
                        <label>Nombre de la Promoción</label>
                        <input type="text" id="promocion-nombre" required placeholder="Ej. 10% Descuento Mano de Obra">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tipo de Promoción</label>
                            <select id="promocion-tipo" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="desc_mano_obra">% de descuento en Mano de Obra</option>
                                <option value="desc_productos">% de descuento en productos</option>
                                <option value="monto_fijo">Monto Fijo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Valor</label>
                            <input type="number" id="promocion-valor" required min="0.01" step="0.01" value="0.00">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Fecha de Inicio</label>
                            <input type="date" id="promocion-fecha-inicio" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                        </div>
                        <div class="form-group">
                            <label>Fecha de Fin</label>
                            <input type="date" id="promocion-fecha-fin" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Estado</label>
                            <select id="promocion-estado" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-promocion">Cancelar</button>
                        <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const tabContentArea = document.getElementById('config-tab-content-area');

    // Bind tabs switcher
    container.querySelectorAll('.saas-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeConfigTab = btn.getAttribute('data-tab');
            renderConfiguracion(container);
        });
    });

    // Populate Tab Content
    if (activeConfigTab === 'taller') {
        tabContentArea.innerHTML = getTallerHtml();
        setupMunicipiosSelect('cfg-taller-departamento', 'cfg-taller-municipio', ws.municipio);
        
        // Bind Taller Form
        const configTallerForm = document.getElementById('config-taller-form');
        // Bind file change for logo upload
        const logoInput = document.getElementById('cfg-taller-logo');
        window.saasSelectedLogoBase64 = ws.logo || '';
        
        // Bind color picker sync
        const colorPicker = document.getElementById('cfg-taller-color-presupuesto');
        const colorText = document.getElementById('cfg-taller-color-presupuesto-text');
        if (colorPicker && colorText) {
            colorPicker.addEventListener('input', (e) => {
                colorText.value = e.target.value.toUpperCase();
            });
            colorText.addEventListener('input', (e) => {
                const val = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    colorPicker.value = val;
                }
            });
        }

        if (logoInput) {
            logoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (readerEvent) => {
                        const base64 = readerEvent.target.result;
                        window.saasSelectedLogoBase64 = base64;
                        const previewImg = document.getElementById('cfg-logo-preview');
                        const previewContainer = document.getElementById('cfg-logo-preview-container');
                        if (previewImg && previewContainer) {
                            previewImg.src = base64;
                            previewContainer.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (configTallerForm) {
            configTallerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                db.config_taller = {
                    nombre: document.getElementById('cfg-taller-nombre').value,
                    alias: document.getElementById('cfg-taller-nombre-comercial').value,
                    nombre_comercial: document.getElementById('cfg-taller-nombre-comercial').value,
                    giro: (() => { const el = document.getElementById('cfg-taller-giro'); return el.options[el.selectedIndex].getAttribute('data-desc') || el.value; })(),
                    direccion: document.getElementById('cfg-taller-direccion').value,
                    telefono: document.getElementById('cfg-taller-telefono').value,
                    correo: document.getElementById('cfg-taller-correo').value,
                    nit: document.getElementById('cfg-taller-tipo-doc').value === 'NIT' ? document.getElementById('cfg-taller-num-doc').value : '',
                    nrc: document.getElementById('cfg-taller-nrc').value,
                    logoText: document.getElementById('cfg-taller-logotext').value,
                    logoTagline: document.getElementById('cfg-taller-tagline').value,
                    tipo_persona: document.getElementById('cfg-taller-tipo-persona').value,
                    clasificacion_tributaria: document.getElementById('cfg-taller-clasificacion').value,
                    sujeto_excluido: document.getElementById('cfg-taller-sujeto-excluido').value,
                    tipo_documento: document.getElementById('cfg-taller-tipo-doc').value,
                    num_documento: document.getElementById('cfg-taller-num-doc').value,
                    actividad_economica: document.getElementById('cfg-taller-giro').value,
                    pais: document.getElementById('cfg-taller-pais').value,
                    departamento: document.getElementById('cfg-taller-departamento').value,
                    municipio: document.getElementById('cfg-taller-municipio').value,
                    logo: window.saasSelectedLogoBase64 || '',
                    formato_presupuesto: document.getElementById('cfg-taller-formato-presupuesto').value,
                    color_presupuesto: document.getElementById('cfg-taller-color-presupuesto').value,
                    tipo_comision: document.getElementById('cfg-taller-tipo-comision').value,
                    qr_whatsapp: document.getElementById('cfg-taller-qr-whatsapp').value.trim()
                };

                // Sync with saas_state if matching active session
                if (db.saas_state && db.saas_state.workshopData) {
                    const wsId = db.saas_state.workshopData.id;
                    const wsReg = (db.solicitudes_registro || []).find(s => s.id === wsId);
                    if (wsReg) {
                        Object.assign(wsReg, db.config_taller);
                        db.saas_state.workshopData = wsReg;
                    }
                }

                saveDatabase(db);
                showToast("Datos de la empresa y branding de documentos actualizados", "success");
                if (typeof window.updateSidebarBrand === 'function') {
                    window.updateSidebarBrand();
                }
                renderConfiguracion(container);
            });
        }
        // Roles & Permisos Logic
        const rolSelector = document.getElementById('permiso-rol-selector');
        const checkboxesContainer = document.getElementById('permisos-checkboxes-container');
        const btnSavePermissions = document.getElementById('btn-save-role-permissions');

        const appViewsConfig = [
            { route: 'taller-dashboard', label: 'Panel Taller', icon: 'fa-solid fa-gauge-high' },
            { route: 'clientes-vehiculos', label: 'Clientes y Autos', icon: 'fa-solid fa-users-gear' },
            { route: 'ingresos', label: 'Recepción / Ingresos', icon: 'fa-solid fa-file-signature' },
            { route: 'revision-21', label: 'Hoja 21 Puntos', icon: 'fa-solid fa-clipboard-check' },
            { route: 'presupuestos', label: 'Presupuestos', icon: 'fa-solid fa-file-invoice-dollar' },
            { route: 'trabajos-taller', label: 'Trabajos en Progreso', icon: 'fa-solid fa-screwdriver-wrench' },
            { route: 'kanban', label: 'Control Taller', icon: 'fa-solid fa-cubes-stacked' },
            { route: 'facturador', label: 'Facturar DTE', icon: 'fa-solid fa-wallet' },
            { route: 'venta-rapida', label: 'Venta Rápida', icon: 'fa-solid fa-cart-shopping' },
            { route: 'caja', label: 'Control de Caja', icon: 'fa-solid fa-cash-register' },
            { route: 'cuentas-cobrar', label: 'Cuentas por Cobrar', icon: 'fa-solid fa-hand-holding-dollar' },
            { route: 'inventario', label: 'Inventario / Kárdex', icon: 'fa-solid fa-boxes-stacked' },
            { route: 'gastos', label: 'Gastos y Compras', icon: 'fa-solid fa-receipt' },
            { route: 'planilla', label: 'Planillas y Salarios', icon: 'fa-solid fa-calculator' },
            { route: 'comisiones', label: 'Comisiones de Técnicos', icon: 'fa-solid fa-percent' },
            { route: 'dashboard-bi', label: 'Dashboard BI', icon: 'fa-solid fa-chart-line' },
            { route: 'configuracion', label: 'Ajustes / Catálogos', icon: 'fa-solid fa-sliders' }
        ];

        if (rolSelector && checkboxesContainer && btnSavePermissions) {
            const uniqueRoles = Array.from(new Set([
                'Administrador',
                'Técnico',
                'Recepcionista',
                ...(db.custom_roles || []),
                ...(db.tecnicos || []).map(t => t.Nivel_Acceso).filter(Boolean)
            ]));

            rolSelector.innerHTML = uniqueRoles.map(r => `<option value="${r}">${r}</option>`).join('');

            // Render custom roles tags (pills)
            const renderCustomRolesTags = () => {
                const tagsContainer = document.getElementById('custom-roles-list-tags');
                if (!tagsContainer) return;
                const customRoles = db.custom_roles || [];
                if (customRoles.length === 0) {
                    tagsContainer.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">No hay roles personalizados creados todavía.</span>';
                    return;
                }
                tagsContainer.innerHTML = customRoles.map(role => `
                    <span class="badge" style="display:inline-flex; align-items:center; gap:0.35rem; padding:0.3rem 0.55rem; font-size:0.75rem; background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.25); color:var(--primary); border-radius:4px; font-weight:500;">
                        ${role}
                        <button type="button" class="btn-role-delete-tag" data-role="${role}" style="background:none; border:none; padding:0; cursor:pointer; color:var(--text-muted); font-size:0.85rem; line-height:1; display:flex; align-items:center; justify-content:center; margin-left:0.15rem; width:12px; height:12px; font-weight:bold;">
                            &times;
                        </button>
                    </span>
                `).join('');

                // Bind delete event listeners
                tagsContainer.querySelectorAll('.btn-role-delete-tag').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const roleToDelete = btn.getAttribute('data-role');
                        if (confirm(`¿Estás seguro de que deseas eliminar el rol "${roleToDelete}"? Cualquier empleado asignado a este rol pasará a tener el rol "Técnico".`)) {
                            const currentDb = window.getDatabase();
                            currentDb.custom_roles = (currentDb.custom_roles || []).filter(r => r !== roleToDelete);
                            
                            // Remove permissions config if any
                            if (currentDb.role_permissions && currentDb.role_permissions[roleToDelete]) {
                                delete currentDb.role_permissions[roleToDelete];
                            }
                            
                            // Fallback employees to Técnico
                            let affectedEmployees = 0;
                            (currentDb.tecnicos || []).forEach(t => {
                                if (t.Nivel_Acceso === roleToDelete) {
                                    t.Nivel_Acceso = 'Técnico';
                                    affectedEmployees++;
                                }
                            });
                            
                            saveDatabase(currentDb).then(() => {
                                showToast(`Rol "${roleToDelete}" eliminado.${affectedEmployees > 0 ? ` Se reasignaron ${affectedEmployees} empleado(s) al rol "Técnico".` : ''}`, "success");
                                renderConfiguracion(container);
                            });
                        }
                    });
                });
            };

            renderCustomRolesTags();

            // Bind Add Custom Role button click
            const addCustomRoleBtn = document.getElementById('btn-add-custom-role');
            if (addCustomRoleBtn) {
                addCustomRoleBtn.addEventListener('click', () => {
                    const inputField = document.getElementById('new-custom-role-name');
                    const newRole = inputField ? inputField.value.trim() : '';
                    if (!newRole) {
                        showToast("Por favor, escribe el nombre del nuevo rol.", "danger");
                        return;
                    }
                    
                    const systemRoles = ['Administrador', 'Técnico', 'Recepcionista'];
                    if (systemRoles.some(r => r.toLowerCase() === newRole.toLowerCase())) {
                        showToast("Este es un rol del sistema predeterminado.", "danger");
                        return;
                    }

                    const currentDb = window.getDatabase();
                    currentDb.custom_roles = currentDb.custom_roles || [];
                    
                    if (currentDb.custom_roles.some(r => r.toLowerCase() === newRole.toLowerCase())) {
                        showToast("Este rol ya existe.", "danger");
                        return;
                    }

                    currentDb.custom_roles.push(newRole);
                    saveDatabase(currentDb).then(() => {
                        showToast(`Rol "${newRole}" creado con éxito.`, "success");
                        renderConfiguracion(container);
                    });
                });
            }

            const renderCheckboxes = (role) => {
                let allowed = [];
                if (db.role_permissions && db.role_permissions[role]) {
                    allowed = db.role_permissions[role];
                } else {
                    if (role === "Administrador") {
                        allowed = appViewsConfig.map(v => v.route);
                    } else if (role === "Recepcionista") {
                        allowed = ["taller-dashboard", "clientes-vehiculos", "ingresos", "revision-21", "presupuestos", "kanban", "facturador", "venta-rapida", "caja", "cuentas-cobrar", "comisiones"];
                    } else {
                        allowed = ["taller-dashboard", "clientes-vehiculos", "ingresos", "revision-21", "kanban"];
                    }
                }

                checkboxesContainer.innerHTML = appViewsConfig.map(view => {
                    const isChecked = allowed.includes(view.route) ? 'checked' : '';
                    const isForcedAdminSetting = (role === 'Administrador' && view.route === 'configuracion') ? 'disabled checked' : '';
                    return `
                        <div class="permission-item" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="${view.icon}" style="color: var(--primary); width: 20px; text-align: center;"></i>
                                <div>
                                    <span style="font-weight: 500; font-size: 0.85rem; color:var(--text-primary);">${view.label}</span>
                                    <small style="display: block; color: var(--text-muted); font-size: 0.7rem;">${view.route}</small>
                                </div>
                            </div>
                            <input type="checkbox" class="permission-checkbox" data-route="${view.route}" ${isChecked} ${isForcedAdminSetting} style="width: 20px; height: 20px; cursor: pointer;">
                        </div>
                    `;
                }).join('');
            };

            const initialRole = rolSelector.value;
            if (initialRole) renderCheckboxes(initialRole);

            rolSelector.addEventListener('change', (e) => {
                renderCheckboxes(e.target.value);
            });

            btnSavePermissions.addEventListener('click', () => {
                const currentDb = window.getDatabase();
                const selectedRole = rolSelector.value;
                const checkboxes = checkboxesContainer.querySelectorAll('.permission-checkbox');
                const selectedRoutes = [];
                
                checkboxes.forEach(cb => {
                    if (cb.checked) {
                        selectedRoutes.push(cb.getAttribute('data-route'));
                    }
                });

                if (selectedRole === 'Administrador') {
                    if (!selectedRoutes.includes('configuracion')) selectedRoutes.push('configuracion');
                    if (!selectedRoutes.includes('taller-dashboard')) selectedRoutes.push('taller-dashboard');
                }

                currentDb.role_permissions = currentDb.role_permissions || {};
                currentDb.role_permissions[selectedRole] = selectedRoutes;
                saveDatabase(currentDb);
                showToast(`Permisos para el rol "${selectedRole}" guardados y sincronizados.`, "success");
                
                if (typeof window.updateUserUI === 'function') {
                    window.updateUserUI();
                }

                const activeUser = getActiveUser();
                if (activeUser && (activeUser.Nivel_Acceso || "Mecánico") === selectedRole) {
                    const hash = window.location.hash.substring(1);
                    let currentRoute = hash.split('?')[0] || 'taller-dashboard';
                    if (!selectedRoutes.includes(currentRoute)) {
                        const fallback = selectedRoutes.includes('taller-dashboard') ? 'taller-dashboard' : (selectedRoutes[0] || 'taller-dashboard');
                        window.location.hash = fallback;
                    }
                }
            });
        }
    } else if (activeConfigTab === 'empleados') {
        tabContentArea.innerHTML = getEmpleadosHtml();

        const populateEmployeeRolesDropdown = (selectedRoleValue = 'Técnico') => {
            const accesoSelector = document.getElementById('tecnico-acceso');
            if (accesoSelector) {
                const allRoles = ['Administrador', 'Técnico', 'Recepcionista', ...(db.custom_roles || [])];
                accesoSelector.innerHTML = allRoles.map(r => `<option value="${r}">${r}</option>`).join('');
                accesoSelector.value = selectedRoleValue;
            }
        };

        // Bind Payroll & Expediente buttons
        document.querySelectorAll('.btn-payroll').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const t = db.tecnicos.find(x => x.Tecnico_ID === id);
                const sumBonos = (t.Bonos || []).reduce((sum, b) => sum + parseFloat(b.Monto || 0), 0);
                openPayrollCalculation(t, sumBonos);
            });
        });

        document.querySelectorAll('.btn-expediente').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const t = db.tecnicos.find(x => x.Tecnico_ID === id);
                openExpedienteModal(t);
            });
        });

        // Edit Employee button
        document.querySelectorAll('.btn-edit-tecnico').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const t = db.tecnicos.find(x => x.Tecnico_ID === id);
                if (t) {
                    document.getElementById('tecnico-modal-title').textContent = 'Editar Empleado';
                    document.getElementById('tecnico-id').value = t.Tecnico_ID;
                    document.getElementById('tecnico-nombre').value = t.Nombre_Completo || '';
                    document.getElementById('tecnico-email').value = t.Email || '';
                    document.getElementById('tecnico-telefono').value = t.Telefono || '';
                    document.getElementById('tecnico-especialidad').value = t.Especialidad || 'Mecánico General';
                    populateEmployeeRolesDropdown(t.Nivel_Acceso || 'Técnico');
                    document.getElementById('tecnico-salario').value = t.Salario_Base || 365;
                    document.getElementById('tecnico-pass').value = '********'; // Mask password to hide hash
                    document.getElementById('tecnico-comision-servicios').value = t.Comision_Servicios !== undefined ? t.Comision_Servicios : 10;
                    document.getElementById('tecnico-comision-productos').value = t.Comision_Productos !== undefined ? t.Comision_Productos : 0;
                    document.getElementById('tecnico-modal').classList.add('active');
                }
            });
        });

        // Delete Employee button
        document.querySelectorAll('.btn-delete-tecnico').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const activeUser = getActiveUser();
                if (activeUser && activeUser.Tecnico_ID === id) {
                    showToast("No puedes eliminar al usuario activo", "warning");
                    return;
                }
                if (confirm("¿Está seguro de que desea eliminar a este empleado del catálogo?")) {
                    const currentDb = window.getDatabase();
                    currentDb.tecnicos = currentDb.tecnicos.filter(x => x.Tecnico_ID !== id);
                    saveDatabase(currentDb);
                    showToast("Empleado eliminado del catálogo", "success");
                    renderConfiguracion(container);
                }
            });
        });

        // Add Employee button
        document.getElementById('btn-add-tecnico').addEventListener('click', () => {
            document.getElementById('tecnico-modal-title').textContent = 'Registrar Empleado';
            document.getElementById('tecnico-id').value = '';
            document.getElementById('tecnico-nombre').value = '';
            document.getElementById('tecnico-email').value = '';
            document.getElementById('tecnico-telefono').value = '';
            document.getElementById('tecnico-especialidad').value = 'Mecánico General';
            populateEmployeeRolesDropdown('Técnico');
            document.getElementById('tecnico-salario').value = '365';
            document.getElementById('tecnico-pass').value = '1234';
            document.getElementById('tecnico-comision-servicios').value = '10';
            document.getElementById('tecnico-comision-productos').value = '0';
            document.getElementById('tecnico-modal').classList.add('active');
        });

        // Bind Employee Form Submit
        const tecnicoForm = document.getElementById('tecnico-form');
        tecnicoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('tecnico-id').value;
            const nombre = document.getElementById('tecnico-nombre').value.trim();
            const email = document.getElementById('tecnico-email').value.trim();
            const telefono = document.getElementById('tecnico-telefono').value.trim();
            const especialidad = document.getElementById('tecnico-especialidad').value.trim();
            const acceso = document.getElementById('tecnico-acceso').value;
            const salarioInput = document.getElementById('tecnico-salario');
            const pass = document.getElementById('tecnico-pass').value;
            const comisionServicios = parseFloat(document.getElementById('tecnico-comision-servicios').value) || 0;
            const comisionProductos = parseFloat(document.getElementById('tecnico-comision-productos').value) || 0;

            if (!nombre) {
                showToast("Por favor, ingrese el nombre completo del empleado", "danger");
                document.getElementById('tecnico-nombre').focus();
                return;
            }
            if (!email || !email.includes('@')) {
                showToast("Por favor, ingrese un correo electrónico válido", "danger");
                document.getElementById('tecnico-email').focus();
                return;
            }
            if (!telefono) {
                showToast("Por favor, ingrese el teléfono de contacto", "danger");
                document.getElementById('tecnico-telefono').focus();
                return;
            }
            if (salarioInput.value === "" || parseFloat(salarioInput.value) < 0) {
                showToast("Por favor, ingrese un salario base válido", "danger");
                salarioInput.focus();
                return;
            }
            if (!pass) {
                showToast("Por favor, ingrese la contraseña de acceso", "danger");
                document.getElementById('tecnico-pass').focus();
                return;
            }

            const salario = parseFloat(salarioInput.value || 365);
            
            const currentDb = window.getDatabase();
            if (id) {
                const t = currentDb.tecnicos.find(x => x.Tecnico_ID === id);
                if (t) {
                    t.Nombre_Completo = nombre;
                    t.Email = email;
                    t.Telefono = telefono;
                    t.Especialidad = especialidad;
                    t.Nivel_Acceso = acceso;
                    t.Salario_Base = salario;
                    if (pass !== '********') {
                        t.Contraseña = await hashPassword(pass);
                    }
                    t.Comision_Servicios = comisionServicios;
                    t.Comision_Productos = comisionProductos;
                }
                showToast("Datos de empleado actualizados", "success");
            } else {
                const newId = `TEC-CS-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100000 + Math.random() * 900000)}`;
                const hashedPass = await hashPassword(pass);
                currentDb.tecnicos.push({
                    Tecnico_ID: newId,
                    Nombre_Completo: nombre,
                    Email: email,
                    Telefono: telefono,
                    Especialidad: especialidad,
                    Nivel_Acceso: acceso,
                    Salario_Base: salario,
                    Contraseña: hashedPass,
                    Comision_Servicios: comisionServicios,
                    Comision_Productos: comisionProductos,
                    Incapacidades: [],
                    Vacaciones: [],
                    Bonos: []
                });
                showToast("Nuevo empleado registrado con éxito", "success");
            }
            saveDatabase(currentDb);
            document.getElementById('tecnico-modal').classList.remove('active');
            renderConfiguracion(container);
        });

        // Bind Cancel and Close triggers for employee modal
        const closeTecnicoModal = () => {
            document.getElementById('tecnico-modal').classList.remove('active');
        };
        document.getElementById('close-tecnico-modal').addEventListener('click', closeTecnicoModal);
        document.getElementById('btn-cancel-tecnico').addEventListener('click', closeTecnicoModal);

    } else if (activeConfigTab === 'productos') {
        tabContentArea.innerHTML = getProductosHtml();
        const tableBody = document.getElementById('productos-table-body');
        const searchInput = document.getElementById('search-productos-input');

        function populateProductos(filterText = '') {
            tableBody.innerHTML = '';
            const filtered = db.productos.filter(p => 
                (p.Descripcion || '').toLowerCase().includes(filterText.toLowerCase()) ||
                (p['ID_ Producto'] || '').toLowerCase().includes(filterText.toLowerCase())
            );

            // Display top 50 matches for performance
            const limit = filtered.slice(0, 50);

            if (limit.length === 0) {
                tableBody.innerHTML = html`<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No se encontraron productos o repuestos</td></tr>`;
                return;
            }

            limit.forEach(p => {
                const pCompra = parseFloat(p['Precio Compra'] || 0);
                const pVenta = parseFloat(p['Precio Venta'] || 0);
                let pctText = 'N/A';
                let pctColor = 'var(--text-muted)';
                
                if (pCompra > 0) {
                    const diff = pVenta - pCompra;
                    const pct = (diff / pCompra) * 100;
                    pctText = pct.toFixed(0) + '%';
                    if (pct < 15) pctColor = 'var(--danger)';
                    else if (pct < 30) pctColor = 'var(--warning)';
                    else pctColor = 'var(--success)';
                }

                const tr = document.createElement('tr');
                tr.innerHTML = html`
                    <td><small style="color:var(--text-muted); font-family:monospace;">${p['ID_ Producto']}</small></td>
                    <td><strong>${p.Descripcion}</strong></td>
                    <td>${p.Presentacion || 'Unidad'}</td>
                    <td style="text-align:right; color:var(--text-muted);">$ ${pCompra.toFixed(2)}</td>
                    <td style="text-align:right;">$ ${pVenta.toFixed(2)}</td>
                    <td style="text-align:right; color:var(--cyan);">$ ${parseFloat(p['Precio Venta Unit Iva Inc'] || (pVenta * 1.13) || 0).toFixed(2)}</td>
                    <td style="text-align:center; font-weight:bold; color:${pctColor};">${pctText}</td>
                    <td style="text-align:center;">${p.Minimos || 1}</td>
                    <td style="text-align:center;">
                        <div style="display:flex; gap:0.35rem; justify-content:center;">
                            <button class="btn btn-secondary btn-edit-producto" data-id="${p['ID_ Producto']}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-secondary btn-delete-producto" data-id="${p['ID_ Producto']}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Bind edits
            tableBody.querySelectorAll('.btn-edit-producto').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const p = db.productos.find(x => x['ID_ Producto'] === id);
                    if (p) {
                        document.getElementById('producto-modal-title').textContent = 'Editar Producto / Repuesto';
                        document.getElementById('producto-id').value = p['ID_ Producto'];
                        document.getElementById('producto-descripcion').value = p.Descripcion || '';
                        document.getElementById('producto-precio-compra').value = p['Precio Compra'] || 0;
                        document.getElementById('producto-precio-venta').value = p['Precio Venta'] || 0;
                        document.getElementById('producto-minimos').value = p.Minimos || 1;
                        document.getElementById('producto-presentacion').value = p.Presentacion || 'Unidad';
                        
                        // Update calculations inside modal
                        if (typeof window.updateProductCalculations === 'function') {
                            window.updateProductCalculations();
                        }
                        
                        document.getElementById('producto-modal').classList.add('active');
                    }
                });
            });

            // Bind deletes
            tableBody.querySelectorAll('.btn-delete-producto').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm(`¿Está seguro de que desea eliminar el producto "${id}" del catálogo?`)) {
                        const currentDb = window.getDatabase();
                        currentDb.productos = currentDb.productos.filter(x => x['ID_ Producto'] !== id);
                        saveDatabase(currentDb);
                        showToast("Producto eliminado del catálogo", "success");
                        renderConfiguracion(container);
                    }
                });
            });
        }

        // Init table
        populateProductos();

        // Search listener
        searchInput.addEventListener('input', (e) => {
            populateProductos(e.target.value);
        });

        if (isAdmin) {
            // Template download
            document.getElementById('btn-template-productos').addEventListener('click', () => {
                try {
                    if (typeof XLSX === 'undefined') {
                        showToast("Error: La librería de Excel no está cargada.", "danger");
                        return;
                    }
                    
                    const headers = [
                        'Código Producto (Opcional)',
                        'Descripción',
                        'Unidad de Medida (Pza/Ltro/Gal/etc.)',
                        'Precio Costo ($)',
                        'Precio Venta ($) (Excluye IVA)',
                        'Existencia Inicial (Stock)'
                    ];
                    
                    const samples = [
                        ['PROD-001', 'FILTRO DE ACEITE TOYOTA 90915-YZZN1', 'Pza', 5.50, 10.00, 15],
                        ['PROD-002', 'ACEITE CASTROL EDGE 5W30 1GL', 'Gal', 25.00, 45.00, 8],
                        ['', 'BUJIA DENSO IRIDIUM POWER', 'Pza', 4.50, 8.50, 24]
                    ];
                    
                    const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);
                    ws['!cols'] = [
                        { wch: 25 },
                        { wch: 45 },
                        { wch: 30 },
                        { wch: 18 },
                        { wch: 18 },
                        { wch: 22 }
                    ];
                    
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Productos");
                    
                    XLSX.writeFile(wb, "Plantilla_Carga_Productos.xlsx");
                    showToast("Plantilla de carga de productos descargada", "success");
                } catch (err) {
                    console.error(err);
                    showToast("Error al generar la plantilla: " + err.message, "danger");
                }
            });

            // File Import
            const fileInput = document.getElementById('import-productos-file');
            document.getElementById('btn-import-productos').addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                if (typeof XLSX === 'undefined') {
                    showToast("Error: La librería de Excel no está cargada. Intente de nuevo.", "danger");
                    fileInput.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        const data = new Uint8Array(arrayBuffer);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        if (rows.length <= 1) {
                            showToast("El archivo está vacío o no contiene filas de datos.", "warning");
                            fileInput.value = '';
                            return;
                        }
                        
                        const importedList = [];
                        let errors = [];
                        
                        for (let i = 1; i < rows.length; i++) {
                            const row = rows[i];
                            if (!row || row.length === 0) continue;
                            if (row.every(cell => cell === null || cell === undefined || cell === '')) continue;
                            
                            const code = row[0] ? String(row[0]).trim() : '';
                            const desc = row[1] ? String(row[1]).trim() : '';
                            const unit = row[2] ? String(row[2]).trim() : 'Pza';
                            const costBase = row[3];
                            const priceBase = row[4];
                            const stockQty = row[5];
                            
                            if (!desc) {
                                errors.push(`Fila ${i + 1}: La descripción está vacía.`);
                                continue;
                            }
                            
                            const parsedCost = parseFloat(costBase);
                            if (isNaN(parsedCost) || parsedCost < 0) {
                                errors.push(`Fila ${i + 1} ("${desc.substring(0, 15)}..."): Precio costo inválido.`);
                                continue;
                            }
                            
                            const parsedPrice = parseFloat(priceBase);
                            if (isNaN(parsedPrice) || parsedPrice < 0) {
                                errors.push(`Fila ${i + 1} ("${desc.substring(0, 15)}..."): Precio venta inválido.`);
                                continue;
                            }
                            
                            const parsedStock = parseInt(stockQty);
                            if (isNaN(parsedStock) || parsedStock < 0) {
                                errors.push(`Fila ${i + 1} ("${desc.substring(0, 15)}..."): Stock inicial inválido.`);
                                continue;
                            }
                            
                            importedList.push({
                                code: code,
                                descripcion: desc,
                                unit: unit,
                                costo: parsedCost,
                                precio: parsedPrice,
                                stock: parsedStock
                            });
                        }
                        
                        if (errors.length > 0) {
                            const errorMsg = errors.slice(0, 3).join(' | ');
                            showToast(`Errores en archivo: ${errorMsg}. Se abortó la importación.`, "danger");
                            fileInput.value = '';
                            return;
                        }
                        
                        if (importedList.length === 0) {
                            showToast("No se encontraron registros válidos para importar.", "warning");
                            fileInput.value = '';
                            return;
                        }
                        
                        const currentDb = window.getDatabase();
                        let newCount = 0;
                        let updateCount = 0;
                        
                        importedList.forEach(item => {
                            const existing = currentDb.productos.find(p => {
                                if (item.code && String(p['ID_ Producto'] || '').trim().toLowerCase() === item.code.toLowerCase()) return true;
                                return String(p.Descripcion || '').trim().toLowerCase() === item.descripcion.toLowerCase();
                            });
                            if (existing) {
                                updateCount++;
                            } else {
                                newCount++;
                            }
                        });
                        
                        const confirmMsg = `¿Deseas proceder con la importación?\n\n` + 
                                           `- Repuestos Nuevos a registrar: ... ${newCount}\n` +
                                           `- Repuestos Existentes a actualizar (precios/stock): ${updateCount}\n\n` +
                                           `Esta acción modificará la base de datos y se sincronizará con la nube.`;
                                           
                        if (confirm(confirmMsg)) {
                            let indexCounter = 0;
                            
                            importedList.forEach(item => {
                                const existing = currentDb.productos.find(p => {
                                    if (item.code && String(p['ID_ Producto'] || '').trim().toLowerCase() === item.code.toLowerCase()) return true;
                                    return String(p.Descripcion || '').trim().toLowerCase() === item.descripcion.toLowerCase();
                                });
                                
                                if (existing) {
                                    existing.Descripcion = item.descripcion;
                                    existing.Presentacion = item.unit;
                                    existing['Unidad de Medida'] = item.unit;
                                    existing['Precio Compra'] = item.costo;
                                    existing['Precio Venta'] = item.precio;
                                    existing['Precio Unit'] = item.precio;
                                    existing['Precio Venta Unit Iva Inc'] = parseFloat((item.precio * 1.13).toFixed(2));
                                    existing['Precio Unit Iva Inc'] = parseFloat((item.precio * 1.13).toFixed(2));
                                    
                                    const diff = item.stock - (existing.Minimos || 0);
                                    if (diff !== 0) {
                                        const type = diff > 0 ? 'ENTRADA' : 'SALIDA';
                                        const absDiff = Math.abs(diff);
                                        
                                        existing.Minimos = item.stock;
                                        
                                        currentDb['29 Movs de Inventario'] = currentDb['29 Movs de Inventario'] || [];
                                        currentDb['29 Movs de Inventario'].unshift({
                                            id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + indexCounter++,
                                            id_producto: existing['ID_ Producto'],
                                            descripcion: existing.Descripcion,
                                            Cant_Mov: absDiff,
                                            "Fecha Mov": Date.now(),
                                            Tipo: type,
                                            "Valor ($)": item.costo,
                                            Observacion: "Ajuste por importación masiva Excel"
                                        });
                                    }
                                } else {
                                    let assignedId = item.code;
                                    if (!assignedId) {
                                        const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                                        const hhmmss = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
                                        assignedId = `PROD-CS-${yymmdd}-${hhmmss}-${indexCounter++}`;
                                    }
                                    
                                    currentDb.productos.push({
                                        "ID_ Producto": assignedId,
                                        "Descripcion": item.descripcion,
                                        "Precio Compra": item.costo,
                                        "Precio Venta": item.precio,
                                        "Precio Unit": item.precio,
                                        "Precio Venta Unit Iva Inc": parseFloat((item.precio * 1.13).toFixed(2)),
                                        "Precio Unit Iva Inc": parseFloat((item.precio * 1.13).toFixed(2)),
                                        "Minimos": item.stock,
                                        "Presentacion": item.unit,
                                        "Unidad de Medida": item.unit,
                                        "Categoría": "100101",
                                        "Margen": 0,
                                        "Descuento": "NO",
                                        "Usuario": activeUser ? activeUser.Tecnico_ID : ''
                                    });
                                    
                                    if (item.stock > 0) {
                                        currentDb['29 Movs de Inventario'] = currentDb['29 Movs de Inventario'] || [];
                                        currentDb['29 Movs de Inventario'].unshift({
                                            id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + indexCounter++,
                                            id_producto: assignedId,
                                            descripcion: item.descripcion,
                                            Cant_Mov: item.stock,
                                            "Fecha Mov": Date.now(),
                                            Tipo: "ENTRADA",
                                            "Valor ($)": item.costo,
                                            Observacion: "Inventario inicial por importación masiva Excel"
                                        });
                                    }
                                }
                            });
                            
                            saveDatabase(currentDb);
                            showToast("Catálogo de productos importado correctamente.", "success");
                            fileInput.value = '';
                            renderConfiguracion(container);
                        } else {
                            fileInput.value = '';
                        }
                    } catch (err) {
                        console.error(err);
                        showToast("Error al importar el archivo: " + err.message, "danger");
                        fileInput.value = '';
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        }

        // Define global calculation function for the product modal
        window.updateProductCalculations = function() {
            const pCompraInput = document.getElementById('producto-precio-compra');
            const pVentaInput = document.getElementById('producto-precio-venta');
            const pIvaInput = document.getElementById('producto-precio-iva');
            const pGananciaInput = document.getElementById('producto-ganancia-pct');

            if (!pCompraInput || !pVentaInput || !pIvaInput || !pGananciaInput) return;

            const pCompra = parseFloat(pCompraInput.value || 0);
            const pVenta = parseFloat(pVentaInput.value || 0);
            
            // 1. Calculate price with IVA (13%)
            pIvaInput.value = '$ ' + parseFloat(pVenta * 1.13).toFixed(2);
            
            // 2. Calculate profit percentage
            if (pCompra > 0) {
                const diff = pVenta - pCompra;
                const pct = (diff / pCompra) * 100;
                pGananciaInput.value = pct.toFixed(1) + '%';
                
                if (pct < 15) {
                    pGananciaInput.style.color = 'var(--danger)';
                } else if (pct < 30) {
                    pGananciaInput.style.color = 'var(--warning)';
                } else {
                    pGananciaInput.style.color = 'var(--success)';
                }
            } else {
                pGananciaInput.value = 'N/A';
                pGananciaInput.style.color = 'var(--text-muted)';
            }
        };

        // Add Product Trigger
        document.getElementById('btn-add-producto').addEventListener('click', () => {
            document.getElementById('producto-modal-title').textContent = 'Registrar Producto / Repuesto';
            document.getElementById('producto-id').value = '';
            document.getElementById('producto-descripcion').value = '';
            document.getElementById('producto-precio-compra').value = '0.00';
            document.getElementById('producto-precio-venta').value = '0.00';
            document.getElementById('producto-minimos').value = '1';
            document.getElementById('producto-presentacion').value = 'Unidad';
            
            // Reset calculations inside modal
            updateProductCalculations();
            
            document.getElementById('producto-modal').classList.add('active');
        });

        // Auto-calculate values on input
        document.getElementById('producto-precio-compra').addEventListener('input', updateProductCalculations);
        document.getElementById('producto-precio-venta').addEventListener('input', updateProductCalculations);

        // Bind Submit
        const prodForm = document.getElementById('producto-form');
        prodForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('producto-id').value;
            const desc = document.getElementById('producto-descripcion').value.trim();
            const compraInput = document.getElementById('producto-precio-compra');
            const precioInput = document.getElementById('producto-precio-venta');
            const minimosInput = document.getElementById('producto-minimos');
            const presInput = document.getElementById('producto-presentacion');

            if (!desc) {
                showToast("Por favor, ingrese la descripción o nombre del repuesto", "danger");
                document.getElementById('producto-descripcion').focus();
                return;
            }
            if (compraInput.value === "" || parseFloat(compraInput.value) < 0) {
                showToast("Por favor, ingrese un precio de compra válido (mayor o igual a 0)", "danger");
                compraInput.focus();
                return;
            }
            if (precioInput.value === "" || parseFloat(precioInput.value) < 0) {
                showToast("Por favor, ingrese un precio de venta válido (mayor o igual a 0)", "danger");
                precioInput.focus();
                return;
            }
            if (minimosInput.value === "" || parseInt(minimosInput.value) < 0) {
                showToast("Por favor, ingrese un stock mínimo válido (mayor o igual a 0)", "danger");
                minimosInput.focus();
                return;
            }
            if (!presInput.value.trim()) {
                showToast("Por favor, ingrese la presentación o tipo de unidad", "danger");
                presInput.focus();
                return;
            }

            const compra = parseFloat(compraInput.value || 0);
            const precio = parseFloat(precioInput.value || 0);
            const minimos = parseInt(minimosInput.value || 1);
            const pres = presInput.value.trim() || 'Unidad';

            const currentDb = window.getDatabase();
            if (id) {
                // Edit
                const p = currentDb.productos.find(x => x['ID_ Producto'] === id);
                if (p) {
                    p.Descripcion = desc;
                    p['Precio Compra'] = compra;
                    p['Precio Venta'] = precio;
                    p['Precio Unit'] = precio;
                    p['Precio Venta Unit Iva Inc'] = parseFloat((precio * 1.13).toFixed(2));
                    p['Precio Unit Iva Inc'] = parseFloat((precio * 1.13).toFixed(2));
                    p.Minimos = minimos;
                    p.Presentacion = pres;
                }
                showToast("Producto actualizado en catálogo", "success");
            } else {
                // Add
                const yymmdd = new Date().toISOString().slice(2, 10).replace(/-/g, '');
                const hhmmss = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
                const newId = `PROD-CS-${yymmdd}-${hhmmss}`;
                currentDb.productos.push({
                    "ID_ Producto": newId,
                    "Descripcion": desc,
                    "Precio Compra": compra,
                    "Precio Venta": precio,
                    "Precio Unit": precio,
                    "Precio Venta Unit Iva Inc": parseFloat((precio * 1.13).toFixed(2)),
                    "Precio Unit Iva Inc": parseFloat((precio * 1.13).toFixed(2)),
                    "Minimos": minimos,
                    "Presentacion": pres,
                    "Categoría": "100101",
                    "Margen": 0,
                    "Descuento": "NO",
                    "Usuario": getActiveUser() ? getActiveUser().Tecnico_ID : ''
                });
                showToast("Nuevo producto registrado con éxito", "success");
            }
            saveDatabase(currentDb);
            document.getElementById('producto-modal').classList.remove('active');
            renderConfiguracion(container);
        });

        // Close triggers
        const closeProdModal = () => {
            document.getElementById('producto-modal').classList.remove('active');
        };
        document.getElementById('close-producto-modal').addEventListener('click', closeProdModal);
        document.getElementById('btn-cancel-producto').addEventListener('click', closeProdModal);

    } else if (activeConfigTab === 'servicios') {
        tabContentArea.innerHTML = getServiciosHtml();
        const tableBody = document.getElementById('servicios-table-body');
        const searchInput = document.getElementById('search-servicios-input');

        function populateServicios(filterText = '') {
            tableBody.innerHTML = '';
            const filtered = db.mano_obra.filter(mo => 
                (mo.Descripcion || '').toLowerCase().includes(filterText.toLowerCase()) ||
                (mo.ID_ManoObra || '').toString().includes(filterText)
            );

            if (filtered.length === 0) {
                tableBody.innerHTML = html`<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No se encontraron servicios de mano de obra</td></tr>`;
                return;
            }

            filtered.forEach(mo => {
                const tr = document.createElement('tr');
                tr.innerHTML = html`
                    <td><small style="color:var(--text-muted); font-family:monospace;">${mo.ID_ManoObra}</small></td>
                    <td><strong>${mo.Descripcion}</strong></td>
                    <td>${mo.Categoria || 'MO001'}</td>
                    <td>${mo.UnidadMedida || 'Servicio'}</td>
                    <td style="text-align:right;">$ ${parseFloat(mo.PrecioUnitario || 0).toFixed(2)}</td>
                    <td style="text-align:center;"><span class="badge ${mo.PrecioEditable === 'NO' ? 'badge-danger' : 'badge-success'}">${mo.PrecioEditable || 'SI'}</span></td>
                    <td style="text-align:center;"><span class="badge ${mo.AplicaIVA === 'NO' ? 'badge-danger' : 'badge-success'}">${mo.AplicaIVA || 'SI'}</span></td>
                    <td style="text-align:center;"><span class="badge ${mo.Estado === 'Inactivo' ? 'badge-danger' : 'badge-success'}">${mo.Estado || 'Activo'}</span></td>
                    <td style="text-align:center;">
                        <div style="display:flex; gap:0.35rem; justify-content:center;">
                            <button class="btn btn-secondary btn-edit-servicio" data-id="${mo.ID_ManoObra}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-secondary btn-delete-servicio" data-id="${mo.ID_ManoObra}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Bind edits
            tableBody.querySelectorAll('.btn-edit-servicio').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const mo = db.mano_obra.find(x => x.ID_ManoObra.toString() === id.toString());
                    if (mo) {
                        document.getElementById('servicio-modal-title').textContent = 'Editar Servicio / Mano de Obra';
                        document.getElementById('servicio-id').value = mo.ID_ManoObra;
                        document.getElementById('servicio-descripcion').value = mo.Descripcion || '';
                        document.getElementById('servicio-precio').value = mo.PrecioUnitario || 0;
                        document.getElementById('servicio-unidad').value = mo.UnidadMedida || 'Servicio';
                        document.getElementById('servicio-categoria').value = mo.Categoria || 'MO001';
                        document.getElementById('servicio-editable').value = mo.PrecioEditable || 'SI';
                        document.getElementById('servicio-iva').value = mo.AplicaIVA || 'SI';
                        document.getElementById('servicio-estado').value = mo.Estado || 'Activo';
                        
                        document.getElementById('servicio-modal').classList.add('active');
                    }
                });
            });

            // Bind deletes
            tableBody.querySelectorAll('.btn-delete-servicio').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm(`¿Está seguro de que desea eliminar el servicio "${id}" del catálogo?`)) {
                        const currentDb = window.getDatabase();
                        currentDb.mano_obra = currentDb.mano_obra.filter(x => x.ID_ManoObra.toString() !== id.toString());
                        saveDatabase(currentDb);
                        showToast("Servicio de mano de obra eliminado", "success");
                        renderConfiguracion(container);
                    }
                });
            });
        }

        // Init table
        populateServicios();

        // Search listener
        searchInput.addEventListener('input', (e) => {
            populateServicios(e.target.value);
        });


        const activeUser = typeof getActiveUser === 'function' ? getActiveUser() : null;
        const roleName = activeUser ? activeUser.Nivel_Acceso || "Mecánico" : "Mecánico";
        const searchRole = roleName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isAdmin = searchRole === "administrador";

        if (isAdmin) {

        // Template button listener
        document.getElementById('btn-template-servicios').addEventListener('click', () => {
            if (typeof XLSX === 'undefined') {
                showToast("Error: La librería de Excel no está cargada. Intente de nuevo.", "danger");
                return;
            }
            try {
                // Header rows
                const headers = ['Descripción', 'Precio Base', 'Unidad de Medida', 'Categoría', 'Precio Editable (SI/NO)', 'Aplica IVA (SI/NO)', 'Estado (Activo/Inactivo)'];
                
                // Sample rows to guide the user
                const samples = [
                    ['CAMBIO DE ACEITE Y FILTRO', 15.00, 'Servicio', 'MO001', 'SI', 'SI', 'Activo'],
                    ['REPARACION DE ALTERNADOR', 45.50, 'Servicio', 'MO001', 'SI', 'SI', 'Activo'],
                    ['DIAGNOSTICO COMPUTARIZADO', 20.00, 'Servicio', 'MO002', 'NO', 'SI', 'Activo']
                ];
                
                const data = [headers, ...samples];
                const ws = XLSX.utils.aoa_to_sheet(data);
                
                // Adjust column widths for professional display
                ws['!cols'] = [
                    { wch: 35 }, // Descripción
                    { wch: 12 }, // Precio Base
                    { wch: 18 }, // Unidad de Medida
                    { wch: 12 }, // Categoría
                    { wch: 22 }, // Precio Editable
                    { wch: 18 }, // Aplica IVA
                    { wch: 22 }  // Estado
                ];
                
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Servicios");
                XLSX.writeFile(wb, "Plantilla_Mano_de_Obra.xlsx");
                showToast("Plantilla descargada correctamente", "success");
            } catch (err) {
                console.error(err);
                showToast("Error al generar la plantilla: " + err.message, "danger");
            }
        });

        // Trigger file input click when Import button is clicked
        const fileInput = document.getElementById('import-servicios-file');
        document.getElementById('btn-import-servicios').addEventListener('click', () => {
            fileInput.click();
        });

        // Parse file input
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            if (typeof XLSX === 'undefined') {
                showToast("Error: La librería de Excel no está cargada. Intente de nuevo.", "danger");
                fileInput.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const data = new Uint8Array(arrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (rows.length <= 1) {
                        showToast("El archivo está vacío o no contiene filas de datos.", "warning");
                        fileInput.value = '';
                        return;
                    }
                    
                    const importedList = [];
                    let errors = [];
                    
                    // Loop starting from row 1 (skipping headers at row 0)
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || row.length === 0) continue;
                        
                        // If the whole row is empty, skip it
                        if (row.every(cell => cell === null || cell === undefined || cell === '')) continue;
                        
                        const desc = row[0] ? String(row[0]).trim() : '';
                        const priceBase = row[1];
                        const unit = row[2] ? String(row[2]).trim() : 'Servicio';
                        const cat = row[3] ? String(row[3]).trim() : 'MO001';
                        const editable = row[4] ? String(row[4]).trim().toUpperCase() : 'SI';
                        const iva = row[5] ? String(row[5]).trim().toUpperCase() : 'SI';
                        const estado = row[6] ? String(row[6]).trim() : 'Activo';
                        
                        // Validate required values
                        if (!desc) {
                            errors.push(`Fila ${i + 1}: La descripción está vacía.`);
                            continue;
                        }
                        
                        const parsedPrice = parseFloat(priceBase);
                        if (isNaN(parsedPrice) || parsedPrice < 0) {
                            errors.push(`Fila ${i + 1} ("${desc.substring(0, 15)}..."): Precio base inválido o menor a 0.`);
                            continue;
                        }
                        
                        importedList.push({
                            descripcion: desc,
                            precioUnitario: parsedPrice,
                            unidadMedida: unit,
                            categoria: cat,
                            precioEditable: editable === 'NO' ? 'NO' : 'SI',
                            aplicaIva: iva === 'NO' ? 'NO' : 'SI',
                            estado: (estado === 'Inactivo' || estado === 'INACTIVO') ? 'Inactivo' : 'Activo'
                        });
                    }
                    
                    if (errors.length > 0) {
                        const errorMsg = errors.slice(0, 3).join(' | ');
                        showToast(`Errores en archivo: ${errorMsg}. Se abortó la importación.`, "danger");
                        fileInput.value = '';
                        return;
                    }
                    
                    if (importedList.length === 0) {
                        showToast("No se encontraron registros válidos para importar.", "warning");
                        fileInput.value = '';
                        return;
                    }
                    
                    const currentDb = window.getDatabase();
                    let newCount = 0;
                    let updateCount = 0;
                    
                    importedList.forEach(item => {
                        const existing = currentDb.mano_obra.find(mo => 
                            String(mo.Descripcion || '').trim().toLowerCase() === item.descripcion.toLowerCase()
                        );
                        if (existing) {
                            updateCount++;
                        } else {
                            newCount++;
                        }
                    });
                    
                    const confirmMsg = `¿Deseas proceder con la importación?\n\n` + 
                                       `- Servicios Nuevos a registrar: ${newCount}\n` +
                                       `- Servicios Existentes a actualizar (precios/datos): ${updateCount}\n\n` +
                                       `Esta acción modificará la base de datos y se sincronizará con la nube.`;
                                       
                    if (confirm(confirmMsg)) {
                        let nextId = currentDb.mano_obra.length > 0 ? Math.max(...currentDb.mano_obra.map(x => parseInt(x.ID_ManoObra) || 0)) + 1 : 320001;
                        
                        importedList.forEach(item => {
                            const existing = currentDb.mano_obra.find(mo => 
                                String(mo.Descripcion || '').trim().toLowerCase() === item.descripcion.toLowerCase()
                            );
                            if (existing) {
                                existing.PrecioUnitario = item.precioUnitario;
                                existing.UnidadMedida = item.unidadMedida;
                                existing.Categoria = item.categoria;
                                existing.PrecioEditable = item.precioEditable;
                                existing.AplicaIVA = item.aplicaIva;
                                existing.Estado = item.estado;
                            } else {
                                currentDb.mano_obra.push({
                                    "ID_ManoObra": nextId++,
                                    "Descripcion": item.descripcion,
                                    "PrecioUnitario": item.precioUnitario,
                                    "UnidadMedida": item.unidadMedida,
                                    "Categoria": item.categoria,
                                    "PrecioEditable": item.precioEditable,
                                    "AplicaIVA": item.aplicaIva,
                                    "Estado": item.estado,
                                    "FechaCreacion": Date.now() / (1000 * 60 * 60 * 24) + 25569
                                });
                            }
                        });
                        
                        saveDatabase(currentDb);
                        showToast(`Importación completada con éxito: ${newCount} agregados, ${updateCount} actualizados`, "success");
                        renderConfiguracion(container);
                    }
                } catch (err) {
                    console.error(err);
                    showToast("Error al procesar el archivo Excel: " + err.message, "danger");
                } finally {
                    fileInput.value = '';
                }
            };
            
            reader.readAsArrayBuffer(file);
        });


        }
        // Add Servicio Trigger
        document.getElementById('btn-add-servicio').addEventListener('click', () => {
            document.getElementById('servicio-modal-title').textContent = 'Registrar Servicio / Mano de Obra';
            document.getElementById('servicio-id').value = '';
            document.getElementById('servicio-descripcion').value = '';
            document.getElementById('servicio-precio').value = '0.00';
            document.getElementById('servicio-unidad').value = 'Servicio';
            document.getElementById('servicio-categoria').value = 'MO001';
            document.getElementById('servicio-editable').value = 'SI';
            document.getElementById('servicio-iva').value = 'SI';
            document.getElementById('servicio-estado').value = 'Activo';
            document.getElementById('servicio-modal').classList.add('active');
        });

        // Bind Submit
        const servForm = document.getElementById('servicio-form');
        servForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('servicio-id').value;
            const desc = document.getElementById('servicio-descripcion').value.trim();
            const precioInput = document.getElementById('servicio-precio');
            const unidad = document.getElementById('servicio-unidad').value;
            const cat = document.getElementById('servicio-categoria').value;
            const editable = document.getElementById('servicio-editable').value;
            const iva = document.getElementById('servicio-iva').value;
            const estado = document.getElementById('servicio-estado').value;

            if (!desc) {
                showToast("Por favor, ingrese la descripción del servicio", "danger");
                document.getElementById('servicio-descripcion').focus();
                return;
            }
            if (precioInput.value === "" || parseFloat(precioInput.value) < 0) {
                showToast("Por favor, ingrese un precio unitario válido (mayor o igual a 0)", "danger");
                precioInput.focus();
                return;
            }

            const precio = parseFloat(precioInput.value || 0);

            const currentDb = window.getDatabase();
            if (id) {
                // Edit
                const mo = currentDb.mano_obra.find(x => x.ID_ManoObra.toString() === id.toString());
                if (mo) {
                    mo.Descripcion = desc;
                    mo.PrecioUnitario = precio;
                    mo.UnidadMedida = unidad;
                    mo.Categoria = cat;
                    mo.PrecioEditable = editable;
                    mo.AplicaIVA = iva;
                    mo.Estado = estado;
                }
                showToast("Servicio de mano de obra actualizado", "success");
            } else {
                // Add
                const nextId = currentDb.mano_obra.length > 0 ? Math.max(...currentDb.mano_obra.map(x => parseInt(x.ID_ManoObra) || 0)) + 1 : 320001;
                currentDb.mano_obra.push({
                    "ID_ManoObra": nextId,
                    "Descripcion": desc,
                    "PrecioUnitario": precio,
                    "UnidadMedida": unidad,
                    "Categoria": cat,
                    "PrecioEditable": editable,
                    "AplicaIVA": iva,
                    "Estado": estado,
                    "FechaCreacion": Date.now() / (1000 * 60 * 60 * 24) + 25569
                });
                showToast("Nuevo servicio de mano de obra registrado", "success");
            }
            saveDatabase(currentDb);
            document.getElementById('servicio-modal').classList.remove('active');
            renderConfiguracion(container);
        });

        // Close triggers
        const closeServModal = () => {
            document.getElementById('servicio-modal').classList.remove('active');
        };
        document.getElementById('close-servicio-modal').addEventListener('click', closeServModal);
        document.getElementById('btn-cancel-servicio').addEventListener('click', closeServModal);
    } else if (activeConfigTab === 'promociones') {
        tabContentArea.innerHTML = getPromocionesHtml();
        const tableBody = document.getElementById('promociones-table-body');
        const searchInput = document.getElementById('search-promociones-input');

        function populatePromociones(filterText = '') {
            tableBody.innerHTML = '';
            const filtered = (db.promociones || []).filter(p => 
                (p.Nombre || '').toLowerCase().includes(filterText.toLowerCase()) ||
                (p.ID_Promocion || '').toLowerCase().includes(filterText.toLowerCase())
            );

            if (filtered.length === 0) {
                tableBody.innerHTML = html`<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No se encontraron promociones</td></tr>`;
                return;
            }

            filtered.forEach(p => {
                const tr = document.createElement('tr');
                let tipoLabel = '';
                if (p.Tipo === 'desc_mano_obra') tipoLabel = '% en Mano de Obra';
                else if (p.Tipo === 'desc_productos') tipoLabel = '% en Productos';
                else if (p.Tipo === 'monto_fijo') tipoLabel = 'Monto Fijo';
                
                const valorFormat = p.Tipo === 'monto_fijo' ? `$ ${parseFloat(p.Valor || 0).toFixed(2)}` : `${parseFloat(p.Valor || 0)} %`;
                const vigencia = (p.Fecha_Inicio || p.Fecha_Fin) ? `${p.Fecha_Inicio || 'Inmediato'} al ${p.Fecha_Fin || 'Indefinido'}` : 'Indefinido';

                tr.innerHTML = html`
                    <td><small style="color:var(--text-muted); font-family:monospace;">${p.ID_Promocion}</small></td>
                    <td><strong>${p.Nombre}</strong></td>
                    <td>${tipoLabel}</td>
                    <td style="text-align:right;">${valorFormat}</td>
                    <td style="text-align:center;">${vigencia}</td>
                    <td style="text-align:center;"><span class="badge ${p.Estado === 'Inactivo' ? 'badge-danger' : 'badge-success'}">${p.Estado || 'Activo'}</span></td>
                    <td style="text-align:center;">
                        <div style="display:flex; gap:0.35rem; justify-content:center;">
                            <button class="btn btn-secondary btn-edit-promocion" data-id="${p.ID_Promocion}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-secondary btn-delete-promocion" data-id="${p.ID_Promocion}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Bind edits
            tableBody.querySelectorAll('.btn-edit-promocion').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const p = db.promociones.find(x => x.ID_Promocion.toString() === id.toString());
                    if (p) {
                        document.getElementById('promocion-modal-title').textContent = 'Editar Promoción';
                        document.getElementById('promocion-id').value = p.ID_Promocion;
                        document.getElementById('promocion-nombre').value = p.Nombre || '';
                        document.getElementById('promocion-tipo').value = p.Tipo || 'desc_mano_obra';
                        document.getElementById('promocion-valor').value = p.Valor || 0;
                        document.getElementById('promocion-fecha-inicio').value = p.Fecha_Inicio || '';
                        document.getElementById('promocion-fecha-fin').value = p.Fecha_Fin || '';
                        document.getElementById('promocion-estado').value = p.Estado || 'Activo';
                        
                        document.getElementById('promocion-modal').classList.add('active');
                    }
                });
            });

            // Bind deletes
            tableBody.querySelectorAll('.btn-delete-promocion').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm(`¿Está seguro de que desea eliminar la promoción "${id}"?`)) {
                        const currentDb = window.getDatabase();
                        currentDb.promociones = currentDb.promociones.filter(x => x.ID_Promocion.toString() !== id.toString());
                        saveDatabase(currentDb);
                        showToast("Promoción eliminada con éxito", "success");
                        renderConfiguracion(container);
                    }
                });
            });
        }

        // Init table
        populatePromociones();

        // Search listener
        searchInput.addEventListener('input', (e) => {
            populatePromociones(e.target.value);
        });

        // Add Promocion Trigger
        document.getElementById('btn-add-promocion').addEventListener('click', () => {
            document.getElementById('promocion-modal-title').textContent = 'Registrar Promoción';
            document.getElementById('promocion-id').value = '';
            document.getElementById('promocion-nombre').value = '';
            document.getElementById('promocion-tipo').value = 'desc_mano_obra';
            document.getElementById('promocion-valor').value = '0.00';
            document.getElementById('promocion-fecha-inicio').value = '';
            document.getElementById('promocion-fecha-fin').value = '';
            document.getElementById('promocion-estado').value = 'Activo';
            document.getElementById('promocion-modal').classList.add('active');
        });

        // Bind Submit
        const promoForm = document.getElementById('promocion-form');
        promoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('promocion-id').value;
            const nombre = document.getElementById('promocion-nombre').value.trim();
            const tipo = document.getElementById('promocion-tipo').value;
            const valorInput = document.getElementById('promocion-valor');
            const fechaInicio = document.getElementById('promocion-fecha-inicio').value;
            const fechaFin = document.getElementById('promocion-fecha-fin').value;
            const estado = document.getElementById('promocion-estado').value;

            if (!nombre) {
                showToast("Por favor, ingrese el nombre de la promoción", "danger");
                document.getElementById('promocion-nombre').focus();
                return;
            }
            if (valorInput.value === "" || parseFloat(valorInput.value) <= 0) {
                showToast("Por favor, ingrese un valor válido para la promoción (mayor a 0)", "danger");
                valorInput.focus();
                return;
            }

            const valor = parseFloat(valorInput.value || 0);
            const currentDb = window.getDatabase();

            if (id) {
                // Edit
                const p = currentDb.promociones.find(x => x.ID_Promocion.toString() === id.toString());
                if (p) {
                    p.Nombre = nombre;
                    p.Tipo = tipo;
                    p.Valor = valor;
                    p.Fecha_Inicio = fechaInicio;
                    p.Fecha_Fin = fechaFin;
                    p.Estado = estado;
                }
                showToast("Promoción actualizada", "success");
            } else {
                // Add
                const nextId = 'PROMO-' + Math.floor(Date.now() / 1000).toString().substring(4) + '-' + Math.floor(Math.random() * 90 + 10);
                currentDb.promociones.push({
                    "ID_Promocion": nextId,
                    "Nombre": nombre,
                    "Tipo": tipo,
                    "Valor": valor,
                    "Fecha_Inicio": fechaInicio,
                    "Fecha_Fin": fechaFin,
                    "Estado": estado,
                    "FechaCreacion": Date.now()
                });
                showToast("Nueva promoción registrada con éxito", "success");
            }
            saveDatabase(currentDb);
            document.getElementById('promocion-modal').classList.remove('active');
            renderConfiguracion(container);
        });
    } else if (activeConfigTab === 'checklist') {
        renderChecklistConfig(tabContentArea, db);
    }

    // Expediente (Vacaciones, Incapacidades, Bonos) modal logic
    function openExpedienteModal(tech) {
        const modal = document.getElementById('expediente-modal');
        const content = document.getElementById('expediente-content');
        
        let activeTab = 'incapacidades';
        
        function renderExpedienteTabs() {
            let listHTML = '';
            let formHTML = '';
            
            if (activeTab === 'incapacidades') {
                listHTML = (tech.Incapacidades || []).length === 0
                    ? '<p style="color:var(--text-muted); font-size:0.85rem; padding:1rem 0; text-align:center;">No hay incapacidades registradas</p>'
                    : `<table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-top:0.5rem;">
                        <thead><tr style="background-color:var(--bg-input);"><th style="padding:0.5rem;">Inicio</th><th style="padding:0.5rem;">Fin</th><th style="padding:0.5rem;">Días</th><th style="padding:0.5rem;">Diagnóstico</th><th style="padding:0.5rem;">Ref. ISSS</th></tr></thead>
                        <tbody>
                            ${safe(tech.Incapacidades.map(inc => {
                                const diff = Math.ceil((new Date(inc.Fin) - new Date(inc.Inicio)) / (1000 * 60 * 60 * 24)) + 1;
                                return `<tr><td style="padding:0.5rem;">${inc.Inicio}</td><td style="padding:0.5rem;">${inc.Fin}</td><td style="padding:0.5rem;">${diff} días</td><td style="padding:0.5rem;">${inc.Diagnostico}</td><td style="padding:0.5rem;">${inc.RefISSS || 'N/A'}</td></tr>`;
                            }).join(''))}
                        </tbody>
                       </table>`;
                       
                formHTML = `
                    <form id="expediente-form-add" style="margin-top:1rem; display:flex; flex-direction:column; gap:0.75rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                        <h4 style="color:var(--primary);">Registrar Incapacidad Médica</h4>
                        <div class="form-row">
                            <div class="form-group"><label>Fecha Inicio</label><input type="date" id="exp-inc-start" required></div>
                            <div class="form-group"><label>Fecha Fin</label><input type="date" id="exp-inc-end" required></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Diagnóstico / Motivo</label><input type="text" id="exp-inc-diag" placeholder="Ej. Accidente, Gripe..." required></div>
                            <div class="form-group"><label>Número de Licencia ISSS</label><input type="text" id="exp-inc-ref" placeholder="Certificado #"></div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:fit-content; align-self:flex-end;"><i class="fa-solid fa-save"></i> Registrar Incapacidad</button>
                    </form>
                `;
            } else if (activeTab === 'vacaciones') {
                listHTML = (tech.Vacaciones || []).length === 0
                    ? '<p style="color:var(--text-muted); font-size:0.85rem; padding:1rem 0; text-align:center;">No hay vacaciones registradas</p>'
                    : `<table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-top:0.5rem;">
                        <thead><tr style="background-color:var(--bg-input);"><th style="padding:0.5rem;">Inicio</th><th style="padding:0.5rem;">Fin</th><th style="padding:0.5rem;">Días</th><th style="padding:0.5rem;">Detalles</th></tr></thead>
                        <tbody>
                            ${safe(tech.Vacaciones.map(v => {
                                const diff = Math.ceil((new Date(v.Fin) - new Date(v.Inicio)) / (1000 * 60 * 60 * 24)) + 1;
                                return `<tr><td style="padding:0.5rem;">${v.Inicio}</td><td style="padding:0.5rem;">${v.Fin}</td><td style="padding:0.5rem;">${diff} días</td><td style="padding:0.5rem;">${v.Detalles || 'Período regular'}</td></tr>`;
                            }).join(''))}
                        </tbody>
                       </table>`;
                       
                formHTML = `
                    <form id="expediente-form-add" style="margin-top:1rem; display:flex; flex-direction:column; gap:0.75rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                        <h4 style="color:var(--primary);">Registrar Vacaciones Tomadas</h4>
                        <div class="form-row">
                            <div class="form-group"><label>Fecha Inicio</label><input type="date" id="exp-vac-start" required></div>
                            <div class="form-group"><label>Fecha Fin</label><input type="date" id="exp-vac-end" required></div>
                        </div>
                        <div class="form-group"><label>Comentarios / Prima Vacacional (30%)</label><input type="text" id="exp-vac-notes" placeholder="Ej. Con prima 30% cancelada..."></div>
                        <button type="submit" class="btn btn-primary" style="width:fit-content; align-self:flex-end;"><i class="fa-solid fa-save"></i> Registrar Vacación</button>
                    </form>
                `;
            } else {
                listHTML = (tech.Bonos || []).length === 0
                    ? '<p style="color:var(--text-muted); font-size:0.85rem; padding:1rem 0; text-align:center;">No hay bonos o extras registrados</p>'
                    : `<table style="width:100%; font-size:0.85rem; border-collapse:collapse; margin-top:0.5rem;">
                        <thead><tr style="background-color:var(--bg-input);"><th style="padding:0.5rem;">Fecha</th><th style="padding:0.5rem;">Monto</th><th style="padding:0.5rem;">Concepto</th></tr></thead>
                        <tbody>
                            ${safe(tech.Bonos.map(b => `<tr><td style="padding:0.5rem;">${new Date(b.Fecha).toLocaleDateString('es-SV')}</td><td style="padding:0.5rem; font-weight:700; color:var(--cyan);">$ ${parseFloat(b.Monto).toFixed(2)}</td><td style="padding:0.5rem;">${b.Concepto}</td></tr>`).join(''))}
                        </tbody>
                       </table>`;
                       
                formHTML = `
                    <form id="expediente-form-add" style="margin-top:1rem; display:flex; flex-direction:column; gap:0.75rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                        <h4 style="color:var(--primary);">Registrar Extra / Bono / Comisión</h4>
                        <div class="form-row">
                            <div class="form-group"><label>Monto del Pago Extra ($)</label><input type="number" id="exp-bon-monto" min="0.01" step="0.01" required></div>
                            <div class="form-group"><label>Concepto del Pago</label><input type="text" id="exp-bon-concepto" placeholder="Ej. Comisión por labor, Bono trimestral" required></div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:fit-content; align-self:flex-end;"><i class="fa-solid fa-save"></i> Registrar Pago Extra</button>
                    </form>
                `;
            }
            
            content.innerHTML = html`
                <div style="margin-top:1rem; display:flex; flex-direction:column; gap:1rem;">
                    <div>
                        <strong style="font-size:1.15rem; color:var(--cyan);">${tech.Nombre_Completo}</strong>
                        <p style="font-size:0.8rem; color:var(--text-secondary);">Historial Laboral del Taller</p>
                    </div>
                    
                    <div style="display:flex; border-bottom:1px solid var(--border-color); gap:0.5rem; padding-bottom:0.25rem;">
                        <button class="btn ${activeTab === 'incapacidades' ? 'btn-primary' : 'btn-secondary'}" id="tab-inc" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-bed-pulse"></i> Incapacidades</button>
                        <button class="btn ${activeTab === 'vacaciones' ? 'btn-primary' : 'btn-secondary'}" id="tab-vac" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-umbrella-beach"></i> Vacaciones</button>
                        <button class="btn ${activeTab === 'bonos' ? 'btn-primary' : 'btn-secondary'}" id="tab-bon" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-hand-holding-dollar"></i> Bonos y Extras</button>
                    </div>
                    
                    <div class="table-container" style="max-height:220px; overflow-y:auto; border:1px solid var(--border-color); border-radius:var(--radius-sm);">
                        ${safe(listHTML)}
                    </div>
                    
                    ${safe(formHTML)}
                </div>
            `;
            
            document.getElementById('tab-inc').addEventListener('click', () => { activeTab = 'incapacidades'; renderExpedienteTabs(); });
            document.getElementById('tab-vac').addEventListener('click', () => { activeTab = 'vacaciones'; renderExpedienteTabs(); });
            document.getElementById('tab-bon').addEventListener('click', () => { activeTab = 'bonos'; renderExpedienteTabs(); });
            
            const formAdd = document.getElementById('expediente-form-add');
            if (formAdd) {
                formAdd.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    if (activeTab === 'incapacidades') {
                        const start = document.getElementById('exp-inc-start').value;
                        const end = document.getElementById('exp-inc-end').value;
                        const diag = document.getElementById('exp-inc-diag').value;
                        const ref = document.getElementById('exp-inc-ref').value;
                        
                        tech.Incapacidades.unshift({ Inicio: start, Fin: end, Diagnostico: diag, RefISSS: ref });
                        showToast("Incapacidad registrada en expediente", "success");
                    } else if (activeTab === 'vacaciones') {
                        const start = document.getElementById('exp-vac-start').value;
                        const end = document.getElementById('exp-vac-end').value;
                        const notes = document.getElementById('exp-vac-notes').value;
                        
                        tech.Vacaciones.unshift({ Inicio: start, Fin: end, Detalles: notes });
                        showToast("Vacaciones registradas en expediente", "success");
                    } else {
                        const amt = parseFloat(document.getElementById('exp-bon-monto').value);
                        const conc = document.getElementById('exp-bon-concepto').value;
                        
                        tech.Bonos.unshift({ Fecha: Date.now(), Monto: amt, Concepto: conc });
                        showToast("Bono/Comisión extra registrado", "success");
                    }
                    
                    saveDatabase(db);
                    renderExpedienteTabs();
                });
            }
        }
        
        renderExpedienteTabs();
        modal.classList.add('active');
    }

    function openPayrollCalculation(tech, initialBonos = 0) {
        const payrollContent = document.getElementById('payroll-content');
        
        function updateCalcView(sal, bonos) {
            const calc = calculateElSalvadorPeriodPayroll(sal, bonos, 'M');
            payrollContent.innerHTML = html`
                <div style="display:flex; flex-direction:column; gap:1.25rem; margin-top:1rem;">
                    <div>
                        <strong style="font-size:1.1rem; color:var(--primary);">${tech.Nombre_Completo}</strong>
                        <p style="font-size:0.8rem; color:var(--text-secondary);">${tech.Especialidad || 'Mecánico'} • ${tech.Nivel_Acceso}</p>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Salario Base ($)</label>
                            <input type="number" id="calc-salario-base" value="${sal}" step="50" min="365">
                        </div>
                        <div class="form-group">
                            <label>Bonos / Extras / Comisiones ($)</label>
                            <input type="number" id="calc-bonos" value="${bonos}" step="10" min="0">
                        </div>
                    </div>
                    
                    <div style="border-top:1px solid var(--border-color); padding-top:1rem;">
                        <h4 style="margin-bottom:0.75rem; color:var(--text-secondary);">Deducciones de Ley (Empleado)</h4>
                        <table style="width:100%; font-size:0.85rem; border:none; margin-bottom:1rem;">
                            <tr style="border:none;"><td style="padding:0.35rem 0; border:none;">Ingresos Totales:</td><td style="text-align:right; font-weight:600; border:none;">$ ${calc.totalGravado.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.35rem 0; border:none;">ISSS Seguro Social (3.0%):</td><td style="text-align:right; color:var(--danger); border:none;">- $ ${calc.isssEmployee.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.35rem 0; border:none;">AFP Pensiones (7.25%):</td><td style="text-align:right; color:var(--danger); border:none;">- $ ${calc.afpEmployee.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.35rem 0; border:none;">Impuesto Renta Retención (ISR):</td><td style="text-align:right; color:var(--danger); border:none;">- $ ${calc.isr.toFixed(2)}</td></tr>
                            <tr style="border:none; font-weight:bold; font-size:1rem; border-top:1px solid var(--border-color);"><td style="padding:0.5rem 0; border:none;">Salario Neto a Recibir:</td><td style="text-align:right; color:var(--success); border:none;">$ ${calc.netSalary.toFixed(2)}</td></tr>
                        </table>
                    </div>
                    
                    <div style="border-top:1px solid var(--border-color); padding-top:1rem; background-color:rgba(255,255,255,0.01); padding:1rem; border-radius:var(--radius-md);">
                        <h4 style="margin-bottom:0.5rem; color:var(--text-secondary);">Aportaciones Patronales (Costo Taller)</h4>
                        <table style="width:100%; font-size:0.85rem; border:none; margin-bottom:0.5rem;">
                            <tr style="border:none;"><td style="padding:0.25rem 0; border:none;">ISSS Patronal (7.50%):</td><td style="text-align:right; border:none;">$ ${calc.isssEmployer.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.25rem 0; border:none;">AFP Patronal (8.75%):</td><td style="text-align:right; border:none;">$ ${calc.afpEmployer.toFixed(2)}</td></tr>
                            <tr style="border:none;"><td style="padding:0.25rem 0; border:none;">INSAFORP (1.00%):</td><td style="text-align:right; border:none;">$ ${calc.insaforp.toFixed(2)}</td></tr>
                            <tr style="border:none; font-weight:bold; border-top:1px solid var(--border-color);"><td style="padding:0.5rem 0; border:none;">Costo Mensual Total:</td><td style="text-align:right; color:var(--cyan); border:none;">$ ${calc.employerCost.toFixed(2)}</td></tr>
                        </table>
                    </div>
                    
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                        <button class="btn btn-secondary" id="btn-calc-close">Cerrar</button>
                        <button class="btn btn-primary" id="btn-calc-save-sal"><i class="fa-solid fa-floppy-disk"></i> Guardar Salario Base</button>
                    </div>
                </div>
            `;
            
            document.getElementById('calc-salario-base').addEventListener('change', (e) => {
                const s = parseFloat(e.target.value || 0);
                updateCalcView(s, parseFloat(document.getElementById('calc-bonos').value || 0));
            });
            document.getElementById('calc-bonos').addEventListener('change', (e) => {
                const b = parseFloat(e.target.value || 0);
                updateCalcView(parseFloat(document.getElementById('calc-salario-base').value || 0), b);
            });
            
            document.getElementById('btn-calc-close').addEventListener('click', () => {
                document.getElementById('payroll-modal').classList.remove('active');
            });
            
            document.getElementById('btn-calc-save-sal').addEventListener('click', () => {
                const s = parseFloat(document.getElementById('calc-salario-base').value || 0);
                tech.Salario_Base = s;
                saveDatabase(db);
                showToast("Salario base actualizado para planilla", "success");
                document.getElementById('payroll-modal').classList.remove('active');
                renderConfiguracion(container);
            });
        }
        
        updateCalcView(tech.Salario_Base, initialBonos);
        document.getElementById('payroll-modal').classList.add('active');
    }
}
function renderChecklistConfig(container, db) {
    if (!db.ingreso_config) {
        db.ingreso_config = {
            pilotos: [
                { id: "Check_Engine", label: "Check Engine", color: "#f97316" },
                { id: "TPMS", label: "TPMS", color: "#eab308" },
                { id: "ABS", label: "ABS", color: "#f97316" },
                { id: "Airbag", label: "Airbag", color: "#ef4444" },
                { id: "Brakes", label: "Brakes", color: "#ef4444" },
                { id: "Seatbelt", label: "Seatbelt", color: "#ef4444" }
            ],
            checklist: [
                { id: "Enciende", label: "Enciende", default: "Y" },
                { id: "Bateria", label: "Batería", default: "Y" },
                { id: "Brazos_Escobillas", label: "Brazos Escobillas", default: "Y" },
                { id: "Espejos", label: "Espejos", default: "Y" },
                { id: "Cristales", label: "Cristales", default: "Y" },
                { id: "Vidrios_Dañados", label: "Vidrios Dañados", default: "N" },
                { id: "Antena", label: "Antena", default: "Y" },
                { id: "Tapon_Gas_Con_Llave", label: "Tapón Gas Con Llave", default: "Y" },
                { id: "Gato_y_Herramientas", label: "Gato y Herramientas", default: "Y" },
                { id: "Triangulos", label: "Triángulos", default: "Y" },
                { id: "Radio", label: "Radio", default: "Y" },
                { id: "Aire_Acondicionado", label: "Aire Acondicionado", default: "Y" },
                { id: "Emblemas", label: "Emblemas", default: "Y" },
                { id: "Estado_Tapiceria", label: "Estado Tapicería", default: "Y" }
            ]
        };
        saveDatabase(db);
    }

    container.innerHTML = html`
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
            
            <!-- Column Left: Warning Lights (Pilotos) -->
            <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; gap:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; margin-bottom:0.5rem;">
                    <h3 style="color:var(--primary); margin:0;"><i class="fa-solid fa-triangle-exclamation"></i> Testigos del Tablero (Pilotos)</h3>
                    <button class="btn btn-primary" id="btn-cfg-add-piloto" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-plus"></i> Añadir Testigo</button>
                </div>

                <div style="overflow-y:auto; max-height:480px; display:flex; flex-direction:column; gap:0.5rem;">
                    ${safe(db.ingreso_config.pilotos.map(p => {
                        return html`
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px;">
                                <div style="display:flex; align-items:center; gap:0.75rem;">
                                    <span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${p.color || '#fff'}; border:1px solid rgba(255,255,255,0.2);"></span>
                                    <strong>${p.label}</strong>
                                    <span style="font-family:monospace; font-size:0.75rem; color:var(--text-secondary);">(${p.id})</span>
                                </div>
                                <div style="display:flex; gap:0.35rem;">
                                    <button class="btn btn-secondary btn-cfg-edit-piloto" data-id="${p.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-secondary btn-cfg-delete-piloto" data-id="${p.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        `;
                    }).join(''))}
                </div>
            </div>

            <!-- Column Right: Checklist Items -->
            <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; gap:1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; margin-bottom:0.5rem;">
                    <h3 style="color:var(--primary); margin:0;"><i class="fa-solid fa-list-check"></i> Checklist de Inventario</h3>
                    <button class="btn btn-primary" id="btn-cfg-add-checklist" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-plus"></i> Añadir Punto</button>
                </div>

                <div style="overflow-y:auto; max-height:480px; display:flex; flex-direction:column; gap:0.5rem;">
                    ${safe(db.ingreso_config.checklist.map(c => {
                        return html`
                            <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px;">
                                <div style="display:flex; align-items:center; gap:0.75rem;">
                                    <strong>${c.label}</strong>
                                    <span style="font-family:monospace; font-size:0.75rem; color:var(--text-secondary);">(${c.id})</span>
                                    <span class="badge" style="font-size:0.7rem; padding:0.1rem 0.4rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-secondary);">${c.tipo === 'bueno_detalle' ? 'Bueno / Detalle' : 'SÍ / NO'}</span>
                                    <span class="badge ${c.default === 'Y' ? 'badge-success' : 'badge-danger'}" style="font-size:0.7rem; padding:0.1rem 0.4rem;">
                                        Por Defecto: ${c.default === 'Y' ? (c.tipo === 'bueno_detalle' ? 'BUENO' : 'SÍ') : (c.tipo === 'bueno_detalle' ? 'DETALLES' : 'NO')}
                                    </span>
                                </div>
                                <div style="display:flex; gap:0.35rem;">
                                    <button class="btn btn-secondary btn-cfg-edit-checklist" data-id="${c.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-secondary btn-cfg-delete-checklist" data-id="${c.id}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        `;
                    }).join(''))}
                </div>
            </div>

        </div>

        <!-- Piloto Modal -->
        <div id="cfg-piloto-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 450px;">
                <div class="modal-header">
                    <h2 id="cfg-piloto-modal-title">Añadir Testigo (Piloto)</h2>
                    <button class="close-modal-btn" id="close-cfg-piloto-modal">&times;</button>
                </div>
                <form id="cfg-piloto-form" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <input type="hidden" id="cfg-piloto-original-id">
                    <div class="form-group">
                        <label>Nombre en Español *</label>
                        <input type="text" id="cfg-piloto-label" required placeholder="Ej: Presión de Aceite" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                    </div>
                    <div class="form-group">
                        <label>ID Único (Sin espacios/acentos) *</label>
                        <input type="text" id="cfg-piloto-id" required placeholder="Ej: Presion_Aceite" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                    </div>
                    <div class="form-group">
                        <label>Color del Testigo (Al encenderse)</label>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <input type="color" id="cfg-piloto-color" value="#ef4444" style="border:none; width:45px; height:40px; background:none; cursor:pointer;">
                            <input type="text" id="cfg-piloto-color-text" value="#EF4444" style="flex:1; padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cfg-cancel-piloto">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Testigo</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Checklist Item Modal -->
        <div id="cfg-checklist-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 450px;">
                <div class="modal-header">
                    <h2 id="cfg-checklist-modal-title">Añadir Punto de Inspección</h2>
                    <button class="close-modal-btn" id="close-cfg-checklist-modal">&times;</button>
                </div>
                <form id="cfg-checklist-form" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                    <input type="hidden" id="cfg-checklist-original-id">
                    <div class="form-group">
                        <label>Nombre del Elemento *</label>
                        <input type="text" id="cfg-checklist-label" required placeholder="Ej: Llanta de Repuesto" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                    </div>
                    <div class="form-group">
                        <label>ID Único (Sin espacios/acentos) *</label>
                        <input type="text" id="cfg-checklist-id" required placeholder="Ej: Llanta_Repuesto" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                    </div>
                    <div class="form-group">
                        <label>Tipo de Respuesta *</label>
                        <select id="cfg-checklist-tipo" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                            <option value="si_no">SÍ / NO (Ej: Antena, Herramientas)</option>
                            <option value="bueno_detalle">Bueno / Con Detalles (Ej: Tapicería, Cristales)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Estado por Defecto</label>
                        <select id="cfg-checklist-default" style="padding:0.6rem; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-primary);">
                            <option value="Y">SÍ / BUENO (Positivo)</option>
                            <option value="N">NO / CON DETALLES (Negativo)</option>
                        </select>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cfg-cancel-checklist">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Punto</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Sync color inputs
    const pColor = document.getElementById('cfg-piloto-color');
    const pColorText = document.getElementById('cfg-piloto-color-text');
    if (pColor && pColorText) {
        pColor.addEventListener('input', (e) => pColorText.value = e.target.value.toUpperCase());
        pColorText.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) pColor.value = e.target.value;
        });
    }

    // Auto-generate pilot ID from label
    const pLabelInput = document.getElementById('cfg-piloto-label');
    const pIdInput = document.getElementById('cfg-piloto-id');
    if (pLabelInput && pIdInput) {
        pLabelInput.addEventListener('input', (e) => {
            if (!pIdInput.readOnly) {
                pIdInput.value = e.target.value
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '_')
                    .replace(/[^a-zA-Z0-9_]/g, '');
            }
        });
    }

    // Auto-generate checklist ID from label
    const cLabelInput = document.getElementById('cfg-checklist-label');
    const cIdInput = document.getElementById('cfg-checklist-id');
    if (cLabelInput && cIdInput) {
        cLabelInput.addEventListener('input', (e) => {
            if (!cIdInput.readOnly) {
                cIdInput.value = e.target.value
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '_')
                    .replace(/[^a-zA-Z0-9_]/g, '');
            }
        });
    }

    // Modal controls for Pilotos
    const pModal = document.getElementById('cfg-piloto-modal');
    const pForm = document.getElementById('cfg-piloto-form');
    document.getElementById('btn-cfg-add-piloto').addEventListener('click', () => {
        document.getElementById('cfg-piloto-modal-title').textContent = 'Añadir Testigo (Piloto)';
        document.getElementById('cfg-piloto-original-id').value = '';
        document.getElementById('cfg-piloto-id').value = '';
        document.getElementById('cfg-piloto-id').readOnly = false;
        document.getElementById('cfg-piloto-label').value = '';
        pColor.value = '#ef4444';
        pColorText.value = '#EF4444';
        pModal.classList.add('active');
    });

    document.getElementById('close-cfg-piloto-modal').addEventListener('click', () => pModal.classList.remove('active'));
    document.getElementById('btn-cfg-cancel-piloto').addEventListener('click', () => pModal.classList.remove('active'));

    pForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const origId = document.getElementById('cfg-piloto-original-id').value;
        const newId = document.getElementById('cfg-piloto-id').value.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const label = document.getElementById('cfg-piloto-label').value.trim();
        const color = pColorText.value.trim();

        if (!newId || !label) return;

        if (origId) {
            // Edit
            const item = db.ingreso_config.pilotos.find(x => x.id === origId);
            if (item) {
                item.label = label;
                item.color = color;
            }
        } else {
            // Add
            if (db.ingreso_config.pilotos.some(x => x.id === newId)) {
                showToast("Este ID ya está en uso", "danger");
                return;
            }
            db.ingreso_config.pilotos.push({ id: newId, label, color });
        }

        saveDatabase(db);
        pModal.classList.remove('active');
        showToast("Configuración de testigos actualizada", "success");
        renderChecklistConfig(container, db);
    });

    container.querySelectorAll('.btn-cfg-edit-piloto').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const item = db.ingreso_config.pilotos.find(x => x.id === id);
            if (item) {
                document.getElementById('cfg-piloto-modal-title').textContent = 'Editar Testigo';
                document.getElementById('cfg-piloto-original-id').value = item.id;
                document.getElementById('cfg-piloto-id').value = item.id;
                document.getElementById('cfg-piloto-id').readOnly = true;
                document.getElementById('cfg-piloto-label').value = item.label;
                pColor.value = item.color || '#ffffff';
                pColorText.value = (item.color || '#ffffff').toUpperCase();
                pModal.classList.add('active');
            }
        });
    });

    container.querySelectorAll('.btn-cfg-delete-piloto').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (confirm(`¿Eliminar testigo "${id}" de la lista?`)) {
                db.ingreso_config.pilotos = db.ingreso_config.pilotos.filter(x => x.id !== id);
                saveDatabase(db);
                showToast("Testigo eliminado", "success");
                renderChecklistConfig(container, db);
            }
        });
    });

    // Modal controls for Checklist
    const cModal = document.getElementById('cfg-checklist-modal');
    const cForm = document.getElementById('cfg-checklist-form');
    document.getElementById('btn-cfg-add-checklist').addEventListener('click', () => {
        document.getElementById('cfg-checklist-modal-title').textContent = 'Añadir Punto de Inspección';
        document.getElementById('cfg-checklist-original-id').value = '';
        document.getElementById('cfg-checklist-id').value = '';
        document.getElementById('cfg-checklist-id').readOnly = false;
        document.getElementById('cfg-checklist-label').value = '';
        document.getElementById('cfg-checklist-tipo').value = 'si_no';
        document.getElementById('cfg-checklist-default').value = 'Y';
        cModal.classList.add('active');
    });

    document.getElementById('close-cfg-checklist-modal').addEventListener('click', () => cModal.classList.remove('active'));
    document.getElementById('btn-cfg-cancel-checklist').addEventListener('click', () => cModal.classList.remove('active'));

    cForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const origId = document.getElementById('cfg-checklist-original-id').value;
        const newId = document.getElementById('cfg-checklist-id').value.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const label = document.getElementById('cfg-checklist-label').value.trim();
        const tipo = document.getElementById('cfg-checklist-tipo').value;
        const def = document.getElementById('cfg-checklist-default').value;

        if (!newId || !label) return;

        if (origId) {
            // Edit
            const item = db.ingreso_config.checklist.find(x => x.id === origId);
            if (item) {
                item.label = label;
                item.tipo = tipo;
                item.default = def;
            }
        } else {
            // Add
            if (db.ingreso_config.checklist.some(x => x.id === newId)) {
                showToast("Este ID ya está en uso", "danger");
                return;
            }
            db.ingreso_config.checklist.push({ id: newId, label, tipo, default: def });
        }

        saveDatabase(db);
        cModal.classList.remove('active');
        showToast("Configuración de checklist actualizada", "success");
        renderChecklistConfig(container, db);
    });

    container.querySelectorAll('.btn-cfg-edit-checklist').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const item = db.ingreso_config.checklist.find(x => x.id === id);
            if (item) {
                document.getElementById('cfg-checklist-modal-title').textContent = 'Editar Punto de Inspección';
                document.getElementById('cfg-checklist-original-id').value = item.id;
                document.getElementById('cfg-checklist-id').value = item.id;
                document.getElementById('cfg-checklist-id').readOnly = true;
                document.getElementById('cfg-checklist-label').value = item.label;
                document.getElementById('cfg-checklist-tipo').value = item.tipo || 'si_no';
                document.getElementById('cfg-checklist-default').value = item.default || 'Y';
                cModal.classList.add('active');
            }
        });
    });

    container.querySelectorAll('.btn-cfg-delete-checklist').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (confirm(`¿Eliminar punto de inspección "${id}"?`)) {
                db.ingreso_config.checklist = db.ingreso_config.checklist.filter(x => x.id !== id);
                saveDatabase(db);
                showToast("Punto de inspección eliminado", "success");
                renderChecklistConfig(container, db);
            }
        });
    });
}

export { activeConfigTab };
