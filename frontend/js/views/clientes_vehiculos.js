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
} from '../../app.js?v=22';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport
} from '../utils.js?v=22';

export function renderClientesVehiculos(container, queryParams) {
    const db = getDatabase();
    
    // Render framework
    container.innerHTML = html`
        <div class="master-detail-container">
            <div class="glass-card list-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                    <div class="search-bar-container" style="max-width: 100%;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="client-search" placeholder="Buscar cliente por nombre o doc...">
                    </div>
                    <button class="btn btn-primary" id="add-client-btn" style="padding: 0.6rem 1rem;"><i class="fa-solid fa-user-plus"></i></button>
                </div>
                
                <div class="scrollable-list" id="clients-list-container">
                    <!-- Loaded dynamically -->
                </div>
            </div>
            
            <div class="glass-card detail-panel" id="client-detail-container">
                <div style="text-align: center; padding: 4rem 1rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-id-card-user" style="font-size: 4rem; color: var(--border-color); margin-bottom: 1.5rem;"></i>
                    <h3>Selecciona un cliente de la lista</h3>
                    <p>Para ver su información fiscal, flota de vehículos e historial del taller.</p>
                </div>
            </div>
        </div>

        <!-- Add Client Modal -->
        <div id="add-client-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>Registrar Nuevo Cliente</h2>
                    <button class="close-modal-btn" id="close-add-client-modal">&times;</button>
                </div>
                <form id="add-client-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre Completo / Razón Social</label>
                            <input type="text" id="new-client-name" required placeholder="Nombre completo">
                        </div>
                        <div class="form-group">
                            <label>Tipo de Cliente</label>
                            <select id="new-client-type">
                                <option value="NATURAL">Persona Natural</option>
                                <option value="JURIDICA">Persona Jurídica (Empresa)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Contribuyente (IVA)?</label>
                            <select id="new-client-contrib">
                                <option value="NO">No (Consumidor Final)</option>
                                <option value="SI">Sí (Crédito Fiscal)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Línea de Crédito Autorizada?</label>
                            <select id="new-client-has-credit">
                                <option value="NO">No (Solo Contado)</option>
                                <option value="SI">Sí (Permite Crédito)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tipo de Documento</label>
                            <select id="new-client-doc-type">
                                <option value="DUI">DUI</option>
                                <option value="NIT">NIT</option>
                                <option value="PASAPORTE">Pasaporte</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Nº de Documento</label>
                            <input type="text" id="new-client-doc-num" required placeholder="00000000-0">
                        </div>
                    </div>
                    
                    <!-- Sección de Contribuyente (Oculta por defecto) -->
                    <div id="new-client-contrib-section" style="display: none; border-left: 3px solid var(--primary); padding-left: 1rem; margin: 1.25rem 0; background: rgba(255,255,255,0.01); padding-top: 0.75rem; padding-bottom: 0.75rem; border-radius: 0 8px 8px 0;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>NIT (Contribuyente)</label>
                                <input type="text" id="new-client-nit" placeholder="0000-000000-000-0">
                            </div>
                            <div class="form-group">
                                <label>NRC (Nº de Registro Contribuyente)</label>
                                <input type="text" id="new-client-nrc" placeholder="00000-0">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Giro Comercial (Actividad Económica)</label>
                                <input type="text" id="new-client-giro" list="giros-list" placeholder="Escribe para buscar giro...">
                            </div>
                            <div class="form-group">
                                <label>Categoría Contribuyente (DTE El Salvador)</label>
                                <select id="new-client-cat">
                                    <option value="OTROS">Otros Contribuyentes</option>
                                    <option value="MEDIANO">Mediano Contribuyente</option>
                                    <option value="GRANDE">Gran Contribuyente</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Retención IVA (1% - Compras Grandes)</label>
                                <select id="new-client-ret">
                                    <option value="0">No aplica</option>
                                    <option value="0.01">Aplica 1% Retención (Gran Contribuyente)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Percepción IVA (2%)</label>
                                <select id="new-client-perc">
                                    <option value="0">No aplica</option>
                                    <option value="0.02">Aplica 2% Percepción</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-row" id="credit-fields-row" style="display: none;">
                        <div class="form-group">
                            <label>Monto de Crédito ($)</label>
                            <input type="number" id="new-client-credit-limit" value="0" min="0" step="100">
                        </div>
                        <div class="form-group">
                            <label>Plazo de Crédito (Días)</label>
                            <input type="number" id="new-client-credit-days" value="30" min="0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Correo Electrónico (Envío DTE)</label>
                            <input type="email" id="new-client-email" required placeholder="cliente@correo.com">
                        </div>
                        <div class="form-group">
                            <label>Teléfono 1</label>
                            <input type="text" id="new-client-phone" required placeholder="7000-0000">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Departamento</label>
                            <select id="new-client-departamento" required>
                                <option value="">-- Seleccione Departamento --</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Municipio / Distrito</label>
                            <select id="new-client-municipio" required disabled>
                                <option value="">-- Seleccione Municipio --</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Dirección Completa (Detallada)</label>
                        <input type="text" id="new-client-address" required placeholder="Calle, pasaje, colonia, casa #">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-add-client">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Registrar Cliente</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Edit Client Modal -->
        <div id="edit-client-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 700px;">
                <div class="modal-header">
                    <h2>Editar Datos del Cliente</h2>
                    <button class="close-modal-btn" id="close-edit-client-modal">&times;</button>
                </div>
                <form id="edit-client-form">
                    <input type="hidden" id="edit-client-code">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre Completo / Razón Social</label>
                            <input type="text" id="edit-client-name" required placeholder="Nombre completo">
                        </div>
                        <div class="form-group">
                            <label>Tipo de Cliente</label>
                            <select id="edit-client-type">
                                <option value="NATURAL">Persona Natural</option>
                                <option value="JURIDICA">Persona Jurídica (Empresa)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Contribuyente (IVA)?</label>
                            <select id="edit-client-contrib">
                                <option value="NO">No (Consumidor Final)</option>
                                <option value="SI">Sí (Crédito Fiscal)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Línea de Crédito Autorizada?</label>
                            <select id="edit-client-has-credit">
                                <option value="NO">No (Solo Contado)</option>
                                <option value="SI">Sí (Permite Crédito)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tipo de Documento</label>
                            <select id="edit-client-doc-type">
                                <option value="DUI">DUI</option>
                                <option value="NIT">NIT</option>
                                <option value="PASAPORTE">Pasaporte</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Nº de Documento</label>
                            <input type="text" id="edit-client-doc-num" required placeholder="00000000-0">
                        </div>
                    </div>
                    
                    <!-- Sección de Contribuyente (Oculta por defecto) -->
                    <div id="edit-client-contrib-section" style="display: none; border-left: 3px solid var(--primary); padding-left: 1rem; margin: 1.25rem 0; background: rgba(255,255,255,0.01); padding-top: 0.75rem; padding-bottom: 0.75rem; border-radius: 0 8px 8px 0;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>NIT (Contribuyente)</label>
                                <input type="text" id="edit-client-nit" placeholder="0000-000000-000-0">
                            </div>
                            <div class="form-group">
                                <label>NRC (Nº de Registro Contribuyente)</label>
                                <input type="text" id="edit-client-nrc" placeholder="00000-0">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Giro Comercial (Actividad Económica)</label>
                                <input type="text" id="edit-client-giro" list="giros-list" placeholder="Escribe para buscar giro...">
                            </div>
                            <div class="form-group">
                                <label>Categoría Contribuyente (DTE El Salvador)</label>
                                <select id="edit-client-cat">
                                    <option value="OTROS">Otros Contribuyentes</option>
                                    <option value="MEDIANO">Mediano Contribuyente</option>
                                    <option value="GRANDE">Gran Contribuyente</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Retención IVA (1% - Compras Grandes)</label>
                                <select id="edit-client-ret">
                                    <option value="0">No aplica</option>
                                    <option value="0.01">Aplica 1% Retención (Gran Contribuyente)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Percepción IVA (2%)</label>
                                <select id="edit-client-perc">
                                    <option value="0">No aplica</option>
                                    <option value="0.02">Aplica 2% Percepción</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-row" id="edit-credit-fields-row" style="display: none;">
                        <div class="form-group">
                            <label>Monto de Crédito ($)</label>
                            <input type="number" id="edit-client-credit-limit" value="0" min="0" step="100">
                        </div>
                        <div class="form-group">
                            <label>Plazo de Crédito (Días)</label>
                            <input type="number" id="edit-client-credit-days" value="30" min="0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Correo Electrónico (Envío DTE)</label>
                            <input type="email" id="edit-client-email" required placeholder="cliente@correo.com">
                        </div>
                        <div class="form-group">
                            <label>Teléfono 1</label>
                            <input type="text" id="edit-client-phone" required placeholder="7000-0000">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Departamento</label>
                            <select id="edit-client-departamento" required>
                                <option value="">-- Seleccione Departamento --</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Municipio / Distrito</label>
                            <select id="edit-client-municipio" required disabled>
                                <option value="">-- Seleccione Municipio --</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Dirección Completa (Detallada)</label>
                        <input type="text" id="edit-client-address" required placeholder="Calle, pasaje, colonia, casa #">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-edit-client">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Add Vehicle Modal -->
        <div id="add-vehicle-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Agregar Vehículo a Flota</h2>
                    <button class="close-modal-btn" id="close-add-vehicle-modal">&times;</button>
                </div>
                <form id="add-vehicle-form">
                    <input type="hidden" id="vehicle-client-code">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Número de Placas</label>
                            <input type="text" id="new-veh-placa" required placeholder="P 000000, C 00000">
                        </div>
                        <div class="form-group">
                            <label>Marca</label>
                            <input type="text" id="new-veh-marca" required placeholder="Toyota, Freightliner, Hino">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Modelo</label>
                            <input type="text" id="new-veh-modelo" required placeholder="Hilux, Cascadia, M3">
                        </div>
                        <div class="form-group">
                            <label>Año</label>
                            <input type="number" id="new-veh-year" required placeholder="2018">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Color</label>
                            <input type="text" id="new-veh-color" placeholder="Blanco, Gris, Rojo">
                        </div>
                        <div class="form-group">
                            <label>Odómetro (Kilometraje/Millas)</label>
                            <input type="text" id="new-veh-odo" placeholder="125,000 Km">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Número de Motor</label>
                            <input type="text" id="new-veh-motor" placeholder="Código de Motor">
                        </div>
                        <div class="form-group">
                            <label>Nº de Chasis / VIN</label>
                            <input type="text" id="new-veh-vin" placeholder="17 dígitos">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nº de Equipo</label>
                            <input type="text" id="new-veh-equipo" placeholder="Ej. E-114">
                        </div>
                        <div class="form-group">
                            <!-- Placeholder to keep grid layout -->
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-add-vehicle">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Registrar Vehículo</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    const clientsListContainer = document.getElementById('clients-list-container');
    const clientSearch = document.getElementById('client-search');
    const clientDetailContainer = document.getElementById('client-detail-container');
    
    // Function to render the client items
    function populateClientsList(filter = '') {
        clientsListContainer.innerHTML = '';
        const filtered = db.clientes.filter(c => 
            (c.Nombre || '').toLowerCase().includes(filter.toLowerCase()) ||
            (c.Codigo_Cliente || '').toLowerCase().includes(filter.toLowerCase()) ||
            (c.Num_Doc || '').toLowerCase().includes(filter.toLowerCase())
        );
        
        if (filtered.length === 0) {
            clientsListContainer.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Sin coincidencias</div>';
            return;
        }
        
        filtered.forEach(client => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.setAttribute('data-id', client.Codigo_Cliente);
            item.innerHTML = html`
                <div class="list-item-main">
                    <span class="list-item-title">${escapeHtml(client.Nombre)}</span>
                    <span class="list-item-subtitle">${escapeHtml(client.Codigo_Cliente)} • Tel: ${escapeHtml(client['Telefono 1 '] || client.Telefono || 'N/A')}</span>
                </div>
                <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 0.8rem;"></i>
            `;
            
            item.addEventListener('click', () => {
                document.querySelectorAll('.list-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                showClientDetail(client);
                // On mobile, scroll to details panel smoothly
                if (window.innerWidth <= 900) {
                    clientDetailContainer.scrollIntoView({ behavior: 'smooth' });
                }
            });
            clientsListContainer.appendChild(item);
        });
    }
    
    // Function to show client detail
    function showClientDetail(client) {
        const clientVehicles = db.vehiculos.filter(v => v.Codigo_Cliente === client.Codigo_Cliente);
        const clientBudgets = db.presupuestos.filter(p => p.Codigo_Cliente === client.Codigo_Cliente);
        
        clientDetailContainer.innerHTML = html`
            <button class="btn btn-secondary mobile-only-btn" id="client-detail-back-btn" style="margin-bottom: 1.25rem; display: none; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-arrow-left"></i> Volver a la Lista</button>
            <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                    <h2>${escapeHtml(client.Nombre)}</h2>
                    <span class="badge-tag badge-primary" style="margin-top: 0.5rem;">${escapeHtml(client['Tipo Cliente'] || 'Persona Natural')}</span>
                    ${safe(client['Contribuyente?'] === 'SI' ? '<span class="badge-tag badge-success">Contribuyente IVA</span>' : '<span class="badge-tag badge-warning">Consumidor Final</span>')}
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-secondary" id="edit-client-trigger-btn" style="background:rgba(255,255,255,0.05); border:1px solid var(--border-color); color:var(--text-primary);"><i class="fa-solid fa-user-pen"></i> Editar</button>
                    <button class="btn btn-secondary" id="delete-client-trigger-btn" style="background:rgba(220,53,69,0.1); border:1px solid rgba(220,53,69,0.4); color:#ff6b6b;"><i class="fa-solid fa-user-xmark"></i> Eliminar</button>
                    <button class="btn btn-secondary" id="add-vehicle-trigger-btn"><i class="fa-solid fa-car-side"></i> Agregar Auto</button>
                    <button class="btn btn-primary" id="start-ins-trigger-btn"><i class="fa-solid fa-clipboard-check"></i> Nueva Recepción</button>
                </div>
            </div>
            
            <div class="form-row">
                <div>
                    <h4 style="margin-bottom: 0.75rem; color: var(--text-secondary);">Datos Fiscales y Contacto</h4>
                    <table style="width: 100%; font-size: 0.85rem;">
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Código:</td><td><strong>${escapeHtml(client.Codigo_Cliente)}</strong></td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Doc ID (${escapeHtml(client['Tipo Doc'] || 'DUI')}):</td><td>${escapeHtml(client['Num Doc'] || 'N/A')}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">NIT/NRC:</td><td>${escapeHtml(client.NIT || 'N/A')} / ${escapeHtml(client.NRC || 'N/A')}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Giro:</td><td>${escapeHtml(client.Giro || 'N/A')}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Correo:</td><td>${escapeHtml(client.Correo || 'N/A')}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Departamento:</td><td>${(() => {
                            if (client.Departamento && typeof DEPARTAMENTOS_CATALOG !== 'undefined') {
                                const d = DEPARTAMENTOS_CATALOG.find(x => x.id === client.Departamento);
                                return d ? d.nombre.toUpperCase() : escapeHtml(client.Departamento);
                            }
                            return 'N/A';
                        })()}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Municipio:</td><td>${(() => {
                            if (client.Municipio && typeof MUNICIPIOS_CATALOG !== 'undefined') {
                                const m = MUNICIPIOS_CATALOG.find(x => x.id === client.Municipio && x.departamentoId === client.Departamento);
                                return m ? m.nombre.toUpperCase() : escapeHtml(client.Municipio);
                            }
                            return 'N/A';
                        })()}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Dirección Detalle:</td><td>${escapeHtml(client.Direccion || 'N/A')}</td></tr>
                    </table>
                </div>
                
                <div style="border-left: 1px solid var(--border-color); padding-left: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem; color: var(--text-secondary);">Estado Financiero</h4>
                    <table style="width: 100%; font-size: 0.85rem;">
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Crédito Autorizado:</td><td><strong>${client['Credito?'] || 'NO'}</strong></td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Monto Crédito:</td><td>$ ${(parseFloat(client['Monto Credito'] || client.Monto_Credito || 0)).toFixed(2)}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Saldo Pendiente:</td><td style="color: var(--danger); font-weight: bold;">$ ${getClientPendingBalance(client.Codigo_Cliente, db).toFixed(2)}</td></tr>
                    </table>
                </div>
            </div>
            
            <h3 style="margin-top: 2rem;">Flota de Vehículos (${clientVehicles.length})</h3>
            <div class="vehicles-grid">
                ${safe(clientVehicles.length === 0 
                    ? '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No se han registrado vehículos para este cliente.</div>' 
                    : clientVehicles.map(v => `
                        <div class="vehicle-card">
                            <i class="fa-solid fa-car-side vehicle-card-bg-icon"></i>
                            <div class="vehicle-placa">${escapeHtml(v.Placas)}</div>
                            <div class="vehicle-detail-row"><span>Marca/Modelo:</span><span><strong>${escapeHtml(v.Marca)} ${escapeHtml(v.Modelo)}</strong></span></div>
                            <div class="vehicle-detail-row"><span>Año/Color:</span><span>${escapeHtml(v.Año || 'N/A')} • ${escapeHtml(v.Color || 'N/A')}</span></div>
                            <div class="vehicle-detail-row"><span>Nº Equipo:</span><span><strong>${escapeHtml(v.N_Equipo || 'N/A')}</strong></span></div>
                            <div class="vehicle-detail-row"><span>Odómetro:</span><span>${escapeHtml(v.Odometro || '0')}</span></div>
                            <div class="vehicle-detail-row"><span>VIN/Nº Motor:</span><span>${escapeHtml(v.Nª_VIN || 'N/A')}</span></div>
                        </div>
                    `).join(''))}
            </div>

            <h3 style="margin-top: 2rem;">Historial de Presupuestos e Inicios (${clientBudgets.length})</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID Presupuesto</th>
                            <th>Fecha</th>
                            <th>Placas</th>
                            <th>Trabajo Diagnóstico</th>
                            <th>Total</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${safe(clientBudgets.length === 0 
                            ? '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Sin presupuestos previos</td></tr>'
                            : clientBudgets.map(p => {
                                let statusBadge = '';
                                if (p.Estado == 1) statusBadge = '<span class="badge-tag badge-warning">Creado</span>';
                                else if (p.Estado == 2) statusBadge = '<span class="badge-tag badge-primary">Aprobado</span>';
                                else if (p.Estado == 3) statusBadge = '<span class="badge-tag badge-success">Facturado</span>';
                                return `
                                    <tr>
                                        <td><strong>${p['ID Presupuesto']}</strong></td>
                                        <td>${p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A'}</td>
                                        <td>${p.Placas || 'N/A'}</td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.Fallas_Detectadas || p['Fallas Detectadas'] || 'Diagnóstico de taller'}</td>
                                        <td style="font-weight: 600;">$ ${getBudgetGrandTotal(p, db).toFixed(2)}</td>
                                        <td>${statusBadge}</td>
                                    </tr>
                                `;
                            }).join(''))}
                    </tbody>
                </table>
            </div>
        `;
        
        // Wire up triggers inside detail panel
        document.getElementById('edit-client-trigger-btn').addEventListener('click', () => {
            document.getElementById('edit-client-code').value = client.Codigo_Cliente;
            document.getElementById('edit-client-name').value = client.Nombre;
            document.getElementById('edit-client-type').value = client['Tipo Cliente'] || 'NATURAL';
            document.getElementById('edit-client-contrib').value = client['Contribuyente?'] || 'NO';
            document.getElementById('edit-client-doc-type').value = client['Tipo Doc'] || 'DUI';
            document.getElementById('edit-client-doc-num').value = client['Num Doc'] || '';
            document.getElementById('edit-client-nit').value = client.NIT || '';
            document.getElementById('edit-client-nrc').value = client.NRC || '';
            document.getElementById('edit-client-giro').value = client.Giro || '';
            document.getElementById('edit-client-cat').value = client['Categoría Contribuyente'] || 'OTROS';
            document.getElementById('edit-client-has-credit').value = client['Credito?'] || 'NO';
            document.getElementById('edit-client-ret').value = client.AplicaRetencion || '0';
            document.getElementById('edit-client-perc').value = client.AplicaPercepcion || '0';
            document.getElementById('edit-client-credit-limit').value = client['Monto Credito'] || client.Monto_Credito || 0;
            document.getElementById('edit-client-credit-days').value = client['Plazo Credito Días'] || 30;
            document.getElementById('edit-client-email').value = client.Correo || '';
            document.getElementById('edit-client-phone').value = client['Telefono 1 '] || '';
            document.getElementById('edit-client-address').value = client.Direccion || '';
            
            // Populate and select department & municipality
            setupOfficialCatalogsSelect('edit-client-departamento', 'edit-client-municipio', client.Departamento || '', client.Municipio || '');

            // Show/hide contributor section based on current client state
            const isContrib = client['Contribuyente?'] === 'SI';
            document.getElementById('edit-client-contrib-section').style.display = isContrib ? 'block' : 'none';

            // Show/hide credit section based on current client state
            const hasCredit = client['Credito?'] === 'SI';
            document.getElementById('edit-credit-fields-row').style.display = hasCredit ? 'flex' : 'none';

            document.getElementById('edit-client-modal').classList.add('active');
        });

        document.getElementById('delete-client-trigger-btn').addEventListener('click', () => {
            if (confirm(`¿Estás seguro de que deseas eliminar permanentemente al cliente ${client.Nombre}? Esta acción no se puede deshacer y afectará a sus registros.`)) {
                db.clientes = db.clientes.filter(c => c.Codigo_Cliente !== client.Codigo_Cliente);
                saveDatabase(db);
                showToast("Cliente eliminado correctamente", "success");
                clientDetailContainer.innerHTML = html`
                    <div style="text-align: center; padding: 4rem 1rem; color: var(--text-secondary);">
                        <i class="fa-solid fa-id-card-user" style="font-size: 4rem; color: var(--border-color); margin-bottom: 1.5rem;"></i>
                        <h3>Selecciona un cliente de la lista</h3>
                        <p>Para ver su información fiscal, flota de vehículos e historial del taller.</p>
                    </div>
                `;
                populateClientsList(clientSearch.value);
            }
        });

        document.getElementById('add-vehicle-trigger-btn').addEventListener('click', () => {
            document.getElementById('vehicle-client-code').value = client.Codigo_Cliente;
            document.getElementById('add-vehicle-modal').classList.add('active');
        });
        
        document.getElementById('start-ins-trigger-btn').addEventListener('click', () => {
            window.location.hash = `#revision-21?client=${client.Codigo_Cliente}`;
        });

        // Mobile back button event listener
        const backBtn = document.getElementById('client-detail-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                clientsListContainer.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }
    
    // Search filter listener
    clientSearch.addEventListener('input', (e) => {
        populateClientsList(e.target.value);
    });
    
    // Open/Close Add Client Modal
    document.getElementById('add-client-btn').addEventListener('click', () => {
        document.getElementById('add-client-modal').classList.add('active');
        document.getElementById('new-client-contrib-section').style.display = 'none'; // reset to default
        document.getElementById('new-client-has-credit').value = 'NO';
        document.getElementById('credit-fields-row').style.display = 'none';
        document.getElementById('new-client-credit-limit').value = 0;
        document.getElementById('new-client-credit-days').value = 0;
        setupOfficialCatalogsSelect('new-client-departamento', 'new-client-municipio');
    });
    
    document.getElementById('close-add-client-modal').addEventListener('click', () => {
        document.getElementById('add-client-modal').classList.remove('active');
    });
    document.getElementById('cancel-add-client').addEventListener('click', () => {
        document.getElementById('add-client-modal').classList.remove('active');
    });
    
    // Open/Close Add Vehicle Modal
    document.getElementById('close-add-vehicle-modal').addEventListener('click', () => {
        document.getElementById('add-vehicle-modal').classList.remove('active');
    });
    document.getElementById('cancel-add-vehicle').addEventListener('click', () => {
        document.getElementById('add-vehicle-modal').classList.remove('active');
    });
    // Handle Add Client Submit
    document.getElementById('add-client-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newCode = "CLIENT-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
        const name = document.getElementById('new-client-name').value;
        const type = document.getElementById('new-client-type').value;
        const contrib = document.getElementById('new-client-contrib').value;
        const docType = document.getElementById('new-client-doc-type').value;
        const docNum = document.getElementById('new-client-doc-num').value;
        const nit = document.getElementById('new-client-nit').value;
        const nrc = document.getElementById('new-client-nrc').value;
        const giro = document.getElementById('new-client-giro').value;
        const email = document.getElementById('new-client-email').value;
        const phone = document.getElementById('new-client-phone').value;
        const address = document.getElementById('new-client-address').value;
        const departamento = document.getElementById('new-client-departamento').value;
        const municipio = document.getElementById('new-client-municipio').value;
        
        // DTE & Credit settings
        const cat = document.getElementById('new-client-cat').value;
        const hasCredit = document.getElementById('new-client-has-credit').value;
        const ret = parseFloat(document.getElementById('new-client-ret').value || 0);
        const perc = parseFloat(document.getElementById('new-client-perc').value || 0);
        const creditLimit = parseFloat(document.getElementById('new-client-credit-limit').value || 0);
        const creditDays = parseInt(document.getElementById('new-client-credit-days').value || 30);
        
        const newClient = {
            Codigo_Cliente: newCode,
            Nombre: name.toUpperCase(),
            "Tipo Cliente": type,
            "Contribuyente?": contrib,
            "Tipo Doc": docType,
            "Num Doc": docNum,
            NIT: nit,
            NRC: nrc,
            Giro: giro,
            Correo: email,
            "Telefono 1 ": phone,
            Direccion: address,
            Departamento: departamento,
            Municipio: municipio,
            "Categoría Contribuyente": cat,
            "Credito?": hasCredit,
            AplicaRetencion: ret,
            AplicaPercepcion: perc,
            "Monto Credito": creditLimit,
            "Plazo Credito Días": creditDays,
            "% Impuesto": 0.13,
            Usuario: getActiveUser() ? getActiveUser().Tecnico_ID : ''
        };
        
        db.clientes.unshift(newClient);
        saveDatabase(db);
        showToast("Cliente registrado correctamente", "success");
        document.getElementById('add-client-modal').classList.remove('active');
        document.getElementById('add-client-form').reset();
        document.getElementById('credit-fields-row').style.display = 'none'; // hide credit inputs again
        populateClientsList();
    });

    // Close/Cancel Edit Client Modal
    if (document.getElementById('close-edit-client-modal')) {
        document.getElementById('close-edit-client-modal').addEventListener('click', () => {
            document.getElementById('edit-client-modal').classList.remove('active');
        });
    }
    if (document.getElementById('cancel-edit-client')) {
        document.getElementById('cancel-edit-client').addEventListener('click', () => {
            document.getElementById('edit-client-modal').classList.remove('active');
        });
    }
    // Handle Edit Client Submit
    if (document.getElementById('edit-client-form')) {
        document.getElementById('edit-client-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('edit-client-code').value;
            const client = db.clientes.find(c => c.Codigo_Cliente === code);
            if (client) {
                client.Nombre = document.getElementById('edit-client-name').value.toUpperCase();
                client['Tipo Cliente'] = document.getElementById('edit-client-type').value;
                client['Contribuyente?'] = document.getElementById('edit-client-contrib').value;
                client['Tipo Doc'] = document.getElementById('edit-client-doc-type').value;
                client['Num Doc'] = document.getElementById('edit-client-doc-num').value;
                client.NIT = document.getElementById('edit-client-nit').value;
                client.NRC = document.getElementById('edit-client-nrc').value;
                client.Giro = document.getElementById('edit-client-giro').value;
                client['Categoría Contribuyente'] = document.getElementById('edit-client-cat').value;
                client['Credito?'] = document.getElementById('edit-client-has-credit').value;
                client.AplicaRetencion = parseFloat(document.getElementById('edit-client-ret').value || 0);
                client.AplicaPercepcion = parseFloat(document.getElementById('edit-client-perc').value || 0);
                client['Monto Credito'] = parseFloat(document.getElementById('edit-client-credit-limit').value || 0);
                client.Monto_Credito = client['Monto Credito'];
                client['Plazo Credito Días'] = parseInt(document.getElementById('edit-client-credit-days').value || 30);
                client.Correo = document.getElementById('edit-client-email').value;
                client['Telefono 1 '] = document.getElementById('edit-client-phone').value;
                client.Direccion = document.getElementById('edit-client-address').value;
                client.Departamento = document.getElementById('edit-client-departamento').value;
                client.Municipio = document.getElementById('edit-client-municipio').value;
                
                saveDatabase(db);
                showToast("Datos del cliente actualizados correctamente", "success");
                document.getElementById('edit-client-modal').classList.remove('active');
                
                // Refresh views
                showClientDetail(client);
                populateClientsList();
            }
        });
    }
    
    // Handle Add Vehicle Submit
    document.getElementById('add-vehicle-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const clientCode = document.getElementById('vehicle-client-code').value;
        const client = db.clientes.find(c => c.Codigo_Cliente === clientCode);
        const newVehId = "VEHICULO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
        
        const placa = document.getElementById('new-veh-placa').value.toUpperCase();
        const marca = document.getElementById('new-veh-marca').value.toUpperCase();
        const modelo = document.getElementById('new-veh-modelo').value.toUpperCase();
        const year = document.getElementById('new-veh-year').value;
        const color = document.getElementById('new-veh-color').value.toUpperCase();
        const odo = document.getElementById('new-veh-odo').value;
        const motor = document.getElementById('new-veh-motor').value.toUpperCase();
        const vin = document.getElementById('new-veh-vin').value.toUpperCase();
        const equipo = document.getElementById('new-veh-equipo') ? document.getElementById('new-veh-equipo').value.trim().toUpperCase() : '';
        
        const newVehicle = {
            ID_Vehiculo: newVehId,
            Codigo_Cliente: clientCode,
            Nombre_Cliente: client.Nombre,
            Placas: placa,
            Marca: marca,
            Modelo: modelo,
            Año: year,
            Color: color,
            Odometro: odo,
            Nª_Motor: motor,
            Nª_VIN: vin,
            N_Equipo: equipo
        };
        
        db.vehiculos.unshift(newVehicle);
        saveDatabase(db);
        showToast("Vehículo agregado a la flota", "success");
        document.getElementById('add-vehicle-modal').classList.remove('active');
        document.getElementById('add-vehicle-form').reset();
        showClientDetail(client);
    });

    // Run initial loaders
    populateClientsList();

    // Populate Giros datalist dynamically
    let girosDatalist = document.getElementById('giros-list');
    if (!girosDatalist) {
        girosDatalist = document.createElement('datalist');
        girosDatalist.id = 'giros-list';
        document.body.appendChild(girosDatalist);
    }
    if (girosDatalist && typeof GIROS_CATALOG !== 'undefined') {
        girosDatalist.innerHTML = GIROS_CATALOG.map(g => `<option value="${g.codigo} - ${g.descripcion}"></option>`).join('');
    }

    // Toggle new client contributor fields dynamically
    const newClientContrib = document.getElementById('new-client-contrib');
    const newClientContribSec = document.getElementById('new-client-contrib-section');
    if (newClientContrib && newClientContribSec) {
        newClientContrib.addEventListener('change', (e) => {
            newClientContribSec.style.display = e.target.value === 'SI' ? 'block' : 'none';
        });
    }

    // Toggle edit client contributor fields dynamically
    const editClientContrib = document.getElementById('edit-client-contrib');
    const editClientContribSec = document.getElementById('edit-client-contrib-section');
    if (editClientContrib && editClientContribSec) {
        editClientContrib.addEventListener('change', (e) => {
            editClientContribSec.style.display = e.target.value === 'SI' ? 'block' : 'none';
        });
    }

    // Toggle new client credit fields dynamically
    const newClientHasCredit = document.getElementById('new-client-has-credit');
    const newCreditFieldsRow = document.getElementById('credit-fields-row');
    if (newClientHasCredit && newCreditFieldsRow) {
        newClientHasCredit.addEventListener('change', (e) => {
            const hasCredit = e.target.value === 'SI';
            newCreditFieldsRow.style.display = hasCredit ? 'flex' : 'none';
            if (!hasCredit) {
                document.getElementById('new-client-credit-limit').value = 0;
                document.getElementById('new-client-credit-days').value = 0;
            } else {
                document.getElementById('new-client-credit-limit').value = 500;
                document.getElementById('new-client-credit-days').value = 30;
            }
        });
    }

    // Toggle edit client credit fields dynamically
    const editClientHasCredit = document.getElementById('edit-client-has-credit');
    const editCreditFieldsRow = document.getElementById('edit-credit-fields-row');
    if (editClientHasCredit && editCreditFieldsRow) {
        editClientHasCredit.addEventListener('change', (e) => {
            const hasCredit = e.target.value === 'SI';
            editCreditFieldsRow.style.display = hasCredit ? 'flex' : 'none';
            if (!hasCredit) {
                document.getElementById('edit-client-credit-limit').value = 0;
                document.getElementById('edit-client-credit-days').value = 0;
            } else {
                document.getElementById('edit-client-credit-limit').value = 500;
                document.getElementById('edit-client-credit-days').value = 30;
            }
        });
    }
    
    // Auto select client if parameter was passed
    if (queryParams.id) {
        const client = db.clientes.find(c => c.Codigo_Cliente === queryParams.id);
        if (client) {
            showClientDetail(client);
        }
    }
}

// 3. REVISION DE 21 PUNTOS VIEW


