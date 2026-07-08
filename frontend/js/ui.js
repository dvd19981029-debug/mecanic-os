/**
 * Mecanic OS - UI Manipulation Helper Module
 * Contains functions that interact with the browser DOM and view states.
 */

import { getDatabase, saveDatabase, getActiveUser, getWorkshopConfig } from '../app.js?v=49';

// Local list of dismissed notification IDs
let dismissedNotifications = [];

// SALVADOR_TERRITORY constant moved to ui.js locally
const SALVADOR_TERRITORY = {
    "Ahuachapán": ["Ahuachapán Norte", "Ahuachapán Centro", "Ahuachapán Sur"],
    "Cabañas": ["Cabañas Este", "Cabañas Oeste"],
    "Chalatenango": ["Chalatenango Norte", "Chalatenango Centro", "Chalatenango Sur"],
    "Cuscatlán": ["Cuscatlán Norte", "Cuscatlán Sur"],
    "La Libertad": ["La Libertad Norte", "La Libertad Centro", "La Libertad Oeste", "La Libertad Este", "La Libertad Costa", "La Libertad Sur"],
    "La Paz": ["La Paz Centro", "La Paz Oeste", "La Paz Este"],
    "La Unión": ["La Unión Norte", "La Unión Sur"],
    "Morazán": ["Morazán Norte", "Morazán Sur"],
    "San Miguel": ["San Miguel Norte", "San Miguel Centro", "San Miguel Oeste"],
    "San Salvador": ["San Salvador Norte", "San Salvador Oeste", "San Salvador Centro", "San Salvador Este", "San Salvador Sur"],
    "San Vicente": ["San Vicente Norte", "San Vicente Sur"],
    "Santa Ana": ["Santa Ana Norte", "Santa Ana Centro", "Santa Ana Este", "Santa Ana Oeste"],
    "Sonsonate": ["Sonsonate Norte", "Sonsonate Centro", "Sonsonate Este", "Sonsonate Oeste"],
    "Usulután": ["Usulután Norte", "Usulután Este", "Usulután Oeste"]
};

// Update User info in UI
export function updateUserUI() {
    const user = getActiveUser();
    const avatarEl = document.getElementById('current-user-avatar');
    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');
    
    if (user) {
        nameEl.textContent = user.Nombre_Completo || user.Nombre || "Usuario";
        const roleName = user.Nivel_Acceso || "Mecánico";
        roleEl.textContent = roleName;
        if (user.Foto_Perfil) {
            avatarEl.src = user.Foto_Perfil;
        } else {
            avatarEl.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
        }

        // --- FILTER SIDEBAR MENU BASED ON ROLE PERMISSIONS ---
        const db = getDatabase();
        let allowedRoutes = [];
        let normalizedRole = roleName ? roleName.trim() : '';
        let foundPermissions = false;
        
        if (db && db.role_permissions) {
            const keys = Object.keys(db.role_permissions);
            const matchKey = keys.find(k => k.toLowerCase() === normalizedRole.toLowerCase() || 
                k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedRole.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            if (matchKey) {
                allowedRoutes = db.role_permissions[matchKey];
                // Migración dinámica: si el rol tiene acceso a presupuestos, dale acceso a trabajos-taller por defecto
                let migrated = false;
                if ((allowedRoutes.includes('presupuestos') || allowedRoutes.includes('kanban')) && !allowedRoutes.includes('trabajos-taller')) {
                    allowedRoutes.push('trabajos-taller');
                    migrated = true;
                }
                // Si el rol tiene acceso a planillas/gastos o es administrador/tecnico, dale acceso a comisiones por defecto
                const searchRole = normalizedRole.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if ((allowedRoutes.includes('planilla') || allowedRoutes.includes('gastos') || searchRole === "administrador" || searchRole === "tecnico") && !allowedRoutes.includes('comisiones')) {
                    allowedRoutes.push('comisiones');
                    migrated = true;
                }
                if (migrated) {
                    db.role_permissions[matchKey] = allowedRoutes;
                    saveDatabase(db);
                }
                foundPermissions = true;
            }
        }
        
        if (!foundPermissions) {
            // Sensible fallbacks
            const searchRole = normalizedRole.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (searchRole === "administrador") {
                allowedRoutes = [
                    "taller-dashboard", "clientes-vehiculos", "ingresos", "revision-21", "presupuestos", "trabajos-taller", "kanban",
                    "facturador", "venta-rapida", "caja", "cuentas-cobrar", "inventario", "gastos", "planilla",
                    "comisiones", "dashboard-bi", "configuracion"
                ];
            } else if (searchRole === "recepcionista") {
                allowedRoutes = [
                    "taller-dashboard", "clientes-vehiculos", "ingresos", "revision-21", "presupuestos", "trabajos-taller", "kanban",
                    "facturador", "venta-rapida", "caja", "cuentas-cobrar", "comisiones"
                ];
            } else {
                // Default to Técnico permissions (now including presupuestos and trabajos-taller)
                allowedRoutes = ["taller-dashboard", "clientes-vehiculos", "ingresos", "revision-21", "presupuestos", "trabajos-taller", "kanban", "comisiones"];
            }
        }

        // Update display of each menu-item
        document.querySelectorAll('.menu-item').forEach(item => {
            const route = item.getAttribute('data-route');
            if (route) {
                if (allowedRoutes.includes(route)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            }
        });

        // Hide/show menu sections based on whether they contain any visible items
        let lastSectionEl = null;
        let sectionHasVisibleItem = false;
        
        const sidebarMenu = document.querySelector('.sidebar-menu');
        if (sidebarMenu) {
            Array.from(sidebarMenu.children).forEach(child => {
                if (child.classList.contains('menu-section')) {
                    if (lastSectionEl) {
                        lastSectionEl.style.display = sectionHasVisibleItem ? '' : 'none';
                    }
                    lastSectionEl = child;
                    sectionHasVisibleItem = false;
                } else if (child.classList.contains('menu-item')) {
                    if (child.style.display !== 'none') {
                        sectionHasVisibleItem = true;
                    }
                }
            });
            if (lastSectionEl) {
                lastSectionEl.style.display = sectionHasVisibleItem ? '' : 'none';
            }
        }
    }
}

// Update Sidebar brand name
export function updateSidebarBrand() {
    const db = getDatabase();
    if (db) {
        const ws = getWorkshopConfig(db);
        const brandEl = (document && typeof document.querySelector === 'function') ? document.querySelector('.brand-tag') : null;
        if (brandEl) {
            brandEl.textContent = ws.logoText || 'MecanicOS';
        }
    }
}

// Live Clock
export function startClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;
    function updateClock() {
        const now = new Date();
        const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        clockEl.textContent = now.toLocaleDateString('es-SV', options);
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// Update notifications list
export function updateNotifications() {
    const db = getDatabase();
    if (!db) return;

    const notifications = [];

    // 1. Check for low stock products (quantity <= 3)
    if (db.productos) {
        db.productos.forEach(p => {
            const stock = p.Minimos || 0;
            if (stock <= 3) {
                const id = `stock-${p['ID_ Producto']}-${stock}`;
                if (!dismissedNotifications.includes(id)) {
                    notifications.push({
                        id: id,
                        type: 'warning',
                        icon: '<i class="fa-solid fa-triangle-exclamation" style="color: var(--warning);"></i>',
                        title: 'Stock Bajo',
                        desc: `El repuesto "${p.Descripcion}" tiene stock bajo (${stock} unidades).`,
                        time: 'Inventario'
                    });
                }
            }
        });
    }

    // 2. Check for pending budgets (Estado === 1 / "Creado")
    if (db.presupuestos) {
        db.presupuestos.forEach(p => {
            if (p.Estado == 1 || p.Estado == '1') {
                const id = `budget-pending-${p['ID Presupuesto']}`;
                if (!dismissedNotifications.includes(id)) {
                    notifications.push({
                        id: id,
                        type: 'info',
                        icon: '<i class="fa-solid fa-file-signature" style="color: var(--primary);"></i>',
                        title: 'Presupuesto Creado',
                        desc: `Presupuesto ${p['ID Presupuesto']} de ${p.Nombre} está pendiente de aprobación.`,
                        time: 'Operaciones'
                    });
                }
            }
        });
    }

    // Update UI elements
    const badge = document.getElementById('alert-badge');
    const dropdownBody = document.getElementById('notifications-dropdown-body');

    if (badge) {
        badge.textContent = notifications.length;
        if (notifications.length > 0) {
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    if (dropdownBody) {
        if (notifications.length === 0) {
            dropdownBody.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">
                    <i class="fa-regular fa-bell-slash" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block; color: var(--text-muted);"></i>
                    No tienes notificaciones pendientes
                </div>
            `;
        } else {
            dropdownBody.innerHTML = notifications.map(n => `
                <div class="notification-item" data-id="${n.id}" style="cursor: pointer;">
                    <div class="notification-item-icon">${n.icon}</div>
                    <div class="notification-item-info">
                        <span class="notification-item-title">${n.title}</span>
                        <span class="notification-item-desc">${n.desc}</span>
                        <span class="notification-item-time">${n.time}</span>
                    </div>
                </div>
            `).join('');
            
            // Add click event to dismiss individual notifications
            dropdownBody.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.getAttribute('data-id');
                    dismissedNotifications.push(id);
                    updateNotifications();
                });
            });
        }
    }
}

// Update cloud connection status UI
export function updateCloudStatusUI(active, state = "") {
    const dot = document.getElementById('cloud-sync-dot');
    const label = document.getElementById('cloud-sync-label');
    
    if (!dot || !label) return;
    
    const loggedOutView = document.getElementById('fb-logged-out-view');
    const loggedInView = document.getElementById('fb-logged-in-view');
    const userEmailSpan = document.getElementById('fb-user-email');
    const currentFirebaseUser = window.currentFirebaseUser;
    
    if (active && state === "active") {
        if (currentFirebaseUser && !currentFirebaseUser.isAnonymous) {
            // Dueño autenticado
            dot.style.backgroundColor = "#2ecc71"; // Green
            label.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> BD Online`;
            if (loggedOutView) loggedOutView.style.display = "none";
            if (loggedInView) loggedInView.style.display = "block";
            if (userEmailSpan) userEmailSpan.textContent = currentFirebaseUser.email;
        } else {
            // Empleado anónimo (sync en background) pero tratamos la UI como desconectada para login
            dot.style.backgroundColor = "#7f8c8d"; // Grey
            label.innerHTML = `<i class="fa-solid fa-cloud"></i> BD Local (Sin nube)`;
            if (loggedOutView) loggedOutView.style.display = "block";
            if (loggedInView) loggedInView.style.display = "none";
        }
    } else if (state === "syncing") {
        dot.style.backgroundColor = "#f1c40f"; // Yellow
        label.innerHTML = `<i class="fa-solid fa-sync fa-spin"></i> Sincronizando BD...`;
    } else if (state === "offline" || state === "logged-out") {
        dot.style.backgroundColor = "#7f8c8d"; // Grey
        label.innerHTML = `<i class="fa-solid fa-cloud"></i> BD Local (Sin nube)`;
        if (loggedOutView) loggedOutView.style.display = "block";
        if (loggedInView) loggedInView.style.display = "none";
    } else {
        dot.style.backgroundColor = "#e74c3c"; // Red
        label.innerHTML = `<i class="fa-solid fa-cloud"></i> Error de BD`;
    }
}

// Setup department and municipality dropdown link
export function setupMunicipiosSelect(deptSelectId, muniSelectId, selectedMuniValue = '') {
    const deptSelect = document.getElementById(deptSelectId);
    const muniSelect = document.getElementById(muniSelectId);
    if (!deptSelect || !muniSelect) return;

    function populate() {
        const dept = deptSelect.value;
        const munis = SALVADOR_TERRITORY[dept] || [];
        muniSelect.innerHTML = munis.map(m => `<option value="${m}">${m}</option>`).join('');
        
        if (selectedMuniValue && munis.includes(selectedMuniValue)) {
            muniSelect.value = selectedMuniValue;
        } else if (munis.length > 0) {
            muniSelect.value = munis[0];
        }
    }

    deptSelect.addEventListener('change', () => {
        const dept = deptSelect.value;
        const munis = SALVADOR_TERRITORY[dept] || [];
        muniSelect.innerHTML = munis.map(m => `<option value="${m}">${m}</option>`).join('');
        if (munis.length > 0) {
            muniSelect.value = munis[0];
        }
    });

    populate();
}

// Setup official DTE departments and municipalities catalogs
export function setupOfficialCatalogsSelect(deptSelectId, muniSelectId, selectedDeptValue = '', selectedMuniValue = '') {
    const deptSelect = document.getElementById(deptSelectId);
    const muniSelect = document.getElementById(muniSelectId);
    if (!deptSelect || !muniSelect || typeof DEPARTAMENTOS_CATALOG === 'undefined' || typeof MUNICIPIOS_CATALOG === 'undefined') return;

    // Populate departments
    deptSelect.innerHTML = '<option value="">-- Seleccione Departamento --</option>' + 
        DEPARTAMENTOS_CATALOG.map(d => `<option value="${d.id}">${d.nombre.toUpperCase()}</option>`).join('');

    function updateMunicipios(deptId, preselectedValue = '') {
        if (!deptId) {
            muniSelect.innerHTML = '<option value="">-- Seleccione Municipio --</option>';
            muniSelect.disabled = true;
            return;
        }
        
        const filtered = MUNICIPIOS_CATALOG.filter(m => m.departamentoId === deptId);
        muniSelect.innerHTML = '<option value="">-- Seleccione Municipio --</option>' +
            filtered.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
        muniSelect.disabled = false;
        
        if (preselectedValue) {
            muniSelect.value = preselectedValue;
        }
    }

    deptSelect.addEventListener('change', (e) => {
        updateMunicipios(e.target.value);
    });

    if (selectedDeptValue) {
        deptSelect.value = selectedDeptValue;
        updateMunicipios(selectedDeptValue, selectedMuniValue);
    } else {
        updateMunicipios('');
    }
}

// Return Giros Options HTML select
export function getGirosOptionsHtml(selectedValue = '') {
    const list = [
        { code: "45201", desc: "Mantenimiento y reparación mecánica de vehículos" },
        { code: "45202", desc: "Mantenimiento y reparación eléctrica de vehículos" },
        { code: "45203", desc: "Mantenimiento y reparación de motocicletas" },
        { code: "45204", desc: "Lavado y pulido de vehículos (carwash)" },
        { code: "45205", desc: "Alineación y balanceo de vehículos automotores" },
        { code: "45206", desc: "Reparación de carrocería y pintura (enderezado)" },
        { code: "45300", desc: "Comercio de repuestos y accesorios de vehículos" },
        { code: "45101", desc: "Comercio de vehículos automotores nuevos y usados" },
        { code: "62020", desc: "Consultoría y gestión de servicios informáticos" },
        { code: "99999", desc: "Otras actividades de servicios automotrices/comercio" }
    ];
    
    // Normalize selected value for comparison
    const normSelected = String(selectedValue || '').trim().toLowerCase();
    
    return list.map(item => {
        const isSelected = normSelected === item.code.toLowerCase() || normSelected === item.desc.toLowerCase();
        return `<option value="${item.code}" data-desc="${item.desc}" ${isSelected ? 'selected' : ''}>${item.code} - ${item.desc}</option>`;
    }).join('');
}

// Validate economic activity code
export function getValidEconomicActivityCode(val) {
    if (!val) return '45201'; // Default: Mantenimiento y reparación mecánica de vehículos
    const clean = String(val).trim();
    if (/^\d{5}$/.test(clean)) {
        return clean;
    }
    const list = [
        { code: "45201", desc: "Mantenimiento y reparación mecánica de vehículos" },
        { code: "45202", desc: "Mantenimiento y reparación eléctrica de vehículos" },
        { code: "45203", desc: "Mantenimiento y reparación de motocicletas" },
        { code: "45204", desc: "Lavado y pulido de vehículos (carwash)" },
        { code: "45205", desc: "Alineación y balanceo de vehículos automotores" },
        { code: "45206", desc: "Reparación de carrocería y pintura (enderezado)" },
        { code: "45300", desc: "Comercio de repuestos y accesorios de vehículos" },
        { code: "45101", desc: "Comercio de vehículos automotores nuevos y usados" },
        { code: "62020", desc: "Consultoría y gestión de servicios informáticos" }
    ];
    const matched = list.find(item => item.desc.toLowerCase() === clean.toLowerCase() || clean.toLowerCase().includes(item.desc.toLowerCase()));
    if (matched) {
        return matched.code;
    }
    return '45201';
}
