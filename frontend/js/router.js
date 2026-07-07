/**
 * Mecanic OS - Routing & Navigation Module
 */

import { renderTallerDashboard } from './views/dashboard.js?v=31';
import { renderConfiguracion } from './views/configuracion.js?v=31';
import { renderLanding } from './views/landing.js?v=31';
import { renderClientesVehiculos } from './views/clientes_vehiculos.js?v=31';
import { renderRevision21 } from './views/revision21.js?v=31';
import { renderPresupuestos } from './views/presupuestos.js?v=31';
import { renderKanban } from './views/kanban.js?v=31';
import { renderFacturador } from './views/facturador.js?v=31';
import { renderVentaRapida } from './views/venta_rapida.js?v=31';
import { renderCaja } from './views/caja.js?v=31';
import { renderCuentasCobrar } from './views/cuentas_cobrar.js?v=31';
import { renderInventario } from './views/inventario.js?v=31';
import { renderGastos } from './views/gastos.js?v=31';
import { renderDashboardBI } from './views/dashboard_bi.js?v=31';
import { renderPlanilla } from './views/planilla.js?v=31';
import { renderComisiones } from './views/comisiones.js?v=31';
import { renderTrabajosTaller } from './views/trabajos.js?v=31';
import {
    renderRegistroSaaS,
    renderTerminosSaaS,
    renderSuspendedSaaS,
    renderPagoSuscripcionSaaS,
    renderPagoSuscripcionWompiCallback,
    renderAdminSolicitudes
} from './views/saas.js?v=31';
import {
    renderLockScreen,
    renderSaaSAdminLogin
} from './views/auth.js?v=31';

import {
    getActiveUser,
    saveDatabase,
    setSecureDteConfig
} from '../app.js?v=31';

import { showToast } from './utils.js?v=31';

const routes = {
    'taller-dashboard': renderTallerDashboard,
    'clientes-vehiculos': renderClientesVehiculos,
    'revision-21': renderRevision21,
    'presupuestos': renderPresupuestos,
    'trabajos-taller': renderTrabajosTaller,
    'kanban': renderKanban,
    'facturador': renderFacturador,
    'venta-rapida': renderVentaRapida,
    'caja': renderCaja,
    'cuentas-cobrar': renderCuentasCobrar,
    'inventario': renderInventario,
    'gastos': renderGastos,
    'planilla': renderPlanilla,
    'comisiones': renderComisiones,
    'dashboard-bi': renderDashboardBI,
    'configuracion': renderConfiguracion,
    'landing': renderLanding,
    'registro': renderRegistroSaaS,
    'terminos': renderTerminosSaaS,
    'suspended': renderSuspendedSaaS,
    'lock-screen': renderLockScreen,
    'pago-suscripcion': renderPagoSuscripcionSaaS,
    'pago-suscripcion-wompi-callback': renderPagoSuscripcionWompiCallback,
    'admin-solicitudes': renderAdminSolicitudes
};

export function handleRouting() {
    if (window.isDteTransmitting) {
        showToast("Transmisión DTE en curso. Por favor, espere a que finalice.", "warning");
        const activeId = window.currentFacturadorPresId ? `?presId=${window.currentFacturadorPresId}` : '';
        window.location.hash = `#facturador${activeId}`;
        return;
    }
    try {
        const db = window.getDatabase();
        
        // Auto-activate SaaS status if firebase user is authenticated as owner
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && !firebase.auth().currentUser.isAnonymous) {
            const fUser = firebase.auth().currentUser;
            if (!db.saas_state || db.saas_state.status !== 'active') {
                db.saas_state = db.saas_state || {};
                db.saas_state.status = 'active';
                db.saas_state.workshopData = db.saas_state.workshopData || {};
                db.saas_state.workshopData.uid = fUser.uid;
                db.saas_state.workshopData.correo = fUser.email;
                db.saas_state.termsSigned = true;
                saveDatabase(db);
            }
        }
        
        const saas = db.saas_state || { status: 'guest' };
        
        // 1. Reactive Status Listener for Pending Guest Solicitud
        if (saas.status === 'pending' && saas.workshopData && saas.workshopData.id) {
            if (!window.saasLandingUnsubscribe) {
                const reqId = saas.workshopData.id;
                window.saasLandingUnsubscribe = dataService.saas.listenRequest(reqId, (updatedRequest) => {
                    if (updatedRequest) {
                        if (updatedRequest.status === 'approved_terms_pending') {
                            if (window.saasLandingUnsubscribe) {
                                window.saasLandingUnsubscribe();
                                window.saasLandingUnsubscribe = null;
                            }
                            db.saas_state.status = 'approved_terms_pending';
                            db.saas_state.workshopData = updatedRequest;
                            saveDatabase(db);
                            showToast("¡Tu solicitud ha sido aprobada! Procediendo a la firma de términos.", "success");
                            window.location.hash = 'terminos';
                            handleRouting();
                        } else if (updatedRequest.status === 'rechazado') {
                            if (window.saasLandingUnsubscribe) {
                                window.saasLandingUnsubscribe();
                                window.saasLandingUnsubscribe = null;
                            }
                            db.saas_state = { status: 'guest', workshopData: null, termsSigned: false };
                            saveDatabase(db);
                            showToast("Tu solicitud ha sido rechazada por el administrador.", "error");
                            window.location.hash = 'landing';
                            handleRouting();
                        }
                    }
                });
            }
        } else {
            if (window.saasLandingUnsubscribe) {
                window.saasLandingUnsubscribe();
                window.saasLandingUnsubscribe = null;
            }
        }

        // 2. Reactive Status Listener for Active/Suspended Workshop
        if (saas.status === 'active' && saas.workshopData && saas.workshopData.id) {
            if (!window.saasActiveListener) {
                const reqId = saas.workshopData.id;
                window.saasActiveListener = dataService.saas.listenRequest(reqId, (updatedRequest) => {
                    if (updatedRequest) {
                        let changed = false;
                        
                        // Sync DTE config if changed
                        const localDte = db.saas_state.workshopData.dte_config || {};
                        const remoteDte = updatedRequest.dte_config || {};
                        if (JSON.stringify(localDte) !== JSON.stringify(remoteDte)) {
                            db.saas_state.workshopData.dte_config = remoteDte;
                            if (remoteDte.apiKey) {
                                setSecureDteConfig(remoteDte);
                            }
                            changed = true;
                        }
                        
                        // Sync SaaS properties
                        const saasFields = ['suscripcion_status', 'plan', 'precio_mensual', 'proximo_pago'];
                        saasFields.forEach(field => {
                            if (updatedRequest[field] !== undefined && db.saas_state.workshopData[field] !== updatedRequest[field]) {
                                db.saas_state.workshopData[field] = updatedRequest[field];
                                changed = true;
                            }
                        });
                        
                        if (updatedRequest.suscripcion_status === 'suspendido') {
                            db.saas_state.status = 'suspended';
                            changed = true;
                        }
                        
                        if (changed) {
                            saveDatabase(db);
                            if (db.saas_state.status === 'suspended') {
                                window.location.hash = 'suspended';
                            }
                            handleRouting();
                        }
                    }
                });
            }
        } else {
            if (window.saasActiveListener) {
                window.saasActiveListener();
                window.saasActiveListener = null;
            }
        }
        
        let hash = window.location.hash.substring(1);
        if (!hash) {
            hash = 'landing';
        }
        
        // Handle parameterized routes (e.g. #presupuestos?id=XXX)
        let routeName = hash;
        let queryParams = {};
        if (hash.includes('?')) {
            const parts = hash.split('?');
            routeName = parts[0];
            const rawParams = parts[1].split('&');
            rawParams.forEach(param => {
                const pair = param.split('=');
                queryParams[pair[0]] = decodeURIComponent(pair[1]);
            });
        }

        // Guard: Prevent re-rendering the budget editor if it's already active and editing the same budget
        if (routeName === 'presupuestos' && document.getElementById('budget-editor-layout')) {
            const targetId = queryParams.id || (queryParams.action === 'new' ? 'new' : '');
            const currentId = window.currentEditingBudgetId;
            if ((queryParams.action === 'new' && currentId) || (targetId && targetId === currentId)) {
                console.log("handleRouting: Bypassing re-render for active budget editor to prevent input loss.");
                return;
            }
        }
        
        // 3. Reactive Status Listener for Super Admin Requests list
        let saasAdminAuth = false;
        try {
            saasAdminAuth = sessionStorage.getItem('mecanic_os_saas_admin_auth') === 'true';
        } catch (err) {
            console.warn("sessionStorage read failed:", err);
        }
        if (routeName === 'admin-solicitudes' && saasAdminAuth) {
            if (!window.saasAdminRequestsUnsubscribe) {
                window.saasAdminRequestsUnsubscribe = dataService.saas.listenRequests((requests) => {
                    const currentDb = window.getDatabase();
                    currentDb.solicitudes_registro = requests;
                    const container = document.getElementById('view-container');
                    if (window.location.hash.substring(1).split('?')[0] === 'admin-solicitudes' && container && !window.saasEditWorkshopId && !window.saasPayWorkshopId && !window.saasConfigWorkshopId && !window.saasAddWorkshopForm && !window.saasViewReceiptPaymentId) {
                        renderAdminSolicitudes(container);
                    }
                });
            }
        } else {
            if (window.saasAdminRequestsUnsubscribe) {
                window.saasAdminRequestsUnsubscribe();
                window.saasAdminRequestsUnsubscribe = null;
            }
        }
        
        // Rutas públicas y de onboarding (incluye la pantalla de bloqueo)
        const publicSaasRoutes = ['landing', 'registro', 'admin-solicitudes', 'terminos', 'suspended', 'lock-screen', 'pago-suscripcion', 'pago-suscripcion-wompi-callback'];
        
        // Force Lock Screen if active workshop but no employee session, AND trying to access operational views
        if (saas.status === 'active' && !getActiveUser() && !publicSaasRoutes.includes(routeName)) {
            window.location.hash = 'lock-screen';
            return;
        }
        
        if (saas.status === 'guest') {
            if (!publicSaasRoutes.includes(routeName)) {
                window.location.hash = 'landing';
                return;
            }
        } else if (saas.status === 'pending') {
            if (routeName !== 'landing' && routeName !== 'registro') {
                window.location.hash = 'landing';
                return;
            }
        } else if (saas.status === 'approved_terms_pending') {
            if (routeName !== 'terminos' && routeName !== 'pago-suscripcion-wompi-callback') {
                window.location.hash = 'terminos';
                return;
            }
        } else if (saas.status === 'suspended') {
            if (routeName !== 'suspended' && routeName !== 'pago-suscripcion' && routeName !== 'pago-suscripcion-wompi-callback') {
                window.location.hash = 'suspended';
                return;
            }
        }
        
        // Check role permissions for application views
        const appViews = [
            'taller-dashboard', 'clientes-vehiculos', 'revision-21', 'presupuestos', 'kanban',
            'facturador', 'venta-rapida', 'caja', 'cuentas-cobrar', 'inventario', 'gastos', 'planilla',
            'comisiones', 'dashboard-bi', 'configuracion'
        ];
        if (appViews.includes(routeName)) {
            const activeUser = getActiveUser();
            if (activeUser) {
                const roleName = activeUser.Nivel_Acceso || "Mecánico";
                let allowedRoutes = [];
                let normalizedRole = roleName ? roleName.trim() : '';
                let foundPermissions = false;
 
                if (db && db.role_permissions) {
                    const keys = Object.keys(db.role_permissions);
                    const matchKey = keys.find(k => k.toLowerCase() === normalizedRole.toLowerCase() || 
                        k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedRole.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
                    if (matchKey) {
                        allowedRoutes = db.role_permissions[matchKey];
                        foundPermissions = true;
                    }
                }
 
                if (!foundPermissions) {
                    const searchRole = normalizedRole.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (searchRole === "administrador") {
                        allowedRoutes = appViews;
                    } else if (searchRole === "recepcionista") {
                        allowedRoutes = [
                            "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                            "facturador", "venta-rapida", "caja", "cuentas-cobrar", "comisiones"
                        ];
                    } else {
                        allowedRoutes = ["taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban", "comisiones"];
                    }
                }
 
                if (!allowedRoutes.includes(routeName)) {
                    showToast("Acceso restringido: No tienes permisos para ver esta sección.", "error");
                    const fallback = allowedRoutes.find(r => appViews.includes(r)) || 'taller-dashboard';
                    window.location.hash = fallback;
                    return;
                }
            }
        }
        
        const isFullScreenRoute = ['landing', 'registro', 'terminos', 'admin-solicitudes', 'suspended', 'lock-screen', 'pago-suscripcion', 'pago-suscripcion-wompi-callback'].includes(routeName);
        const sidebarEl = document.getElementById('app-sidebar');
        const headerEl = document.querySelector('.top-header');
        const appContainer = document.querySelector('.app-container');
        const overlayEl = document.getElementById('sidebar-overlay');
        
        if (isFullScreenRoute) {
            if (sidebarEl) sidebarEl.style.display = 'none';
            if (headerEl) headerEl.style.display = 'none';
            if (overlayEl) overlayEl.style.display = 'none';
            if (appContainer) appContainer.style.gridTemplateColumns = '1fr';
        } else {
            if (sidebarEl) sidebarEl.style.display = '';
            if (headerEl) headerEl.style.display = '';
            if (appContainer) appContainer.style.gridTemplateColumns = '';
        }
        
        const renderFn = routes[routeName];
        if (renderFn) {
            // Update active menu class
            document.querySelectorAll('.menu-item').forEach(item => {
                if (item.getAttribute('data-route') === routeName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // Dynamic view titles
            const titles = {
                'taller-dashboard': { title: 'Panel de Control de Taller', subtitle: 'Operaciones diarias y accesos directos' },
                'clientes-vehiculos': { title: 'Directorio de Clientes y Vehículos', subtitle: 'Historiales clínicos y gestión de flota' },
                'revision-21': { title: 'Hoja de Inspección de 21 Puntos', subtitle: 'Recepción digital y diagnóstico semáforo' },
                'presupuestos': { title: 'Presupuestos y Cotizaciones', subtitle: 'Cálculo de costos y emisión de cotizaciones' },
                'kanban': { title: 'Tablero de Control del Taller', subtitle: 'Monitoreo de flujo y estado de reparaciones' },
                'facturador': { title: 'Facturador DTE', subtitle: 'Validación fiscal y emisión de facturas electrónicas' },
                'venta-rapida': { title: 'Punto de Venta Rápida (POS)', subtitle: 'Despacho en mostrador de repuestos y servicios' },
                'caja': { title: 'Control de Caja y Turnos (POS)', subtitle: 'Apertura, egresos de efectivo, cortes de caja y conciliación' },
                'cuentas-cobrar': { title: 'Créditos y Cuentas por Cobrar', subtitle: 'Abonos, estados de cuenta y saldos' },
                'inventario': { title: 'Control de Inventario y Kárdex', subtitle: 'Saldos de repuestos, mínimos y movimientos' },
                'gastos': { title: 'Compras y Gastos Operativos', subtitle: 'Registro de egresos y facturas de proveedores' },
                'dashboard-bi': { title: 'Módulo de Inteligencia de Negocios (BI)', subtitle: 'KPIs financieros y de productividad' },
                'configuracion': { title: 'Configuración y Ajustes Maestros', subtitle: 'Administración de catálogos e integración DTE' },
                'planilla': { title: 'Gestión de Planillas y Salarios', subtitle: 'Control de nómina, boletas de pago y deducciones de ley (El Salvador)' },
                'comisiones': { title: 'Comisiones de Técnicos', subtitle: 'Seguimiento de mano de obra y comisiones por reparación' }
            };
            
            const info = titles[routeName] || { title: 'Mecanic OS', subtitle: 'Gestión Inteligente' };
            document.getElementById('view-title').textContent = info.title;
            document.getElementById('view-subtitle').textContent = info.subtitle;
 
            // Hide status indicators in the header only when in the facturador route to prevent clutter
            const headerRight = document.querySelector('.header-right');
            if (headerRight) {
                if (routeName === 'facturador') {
                    headerRight.style.display = 'none';
                } else {
                    headerRight.style.display = 'flex';
                }
            }
            
            const container = document.getElementById('view-container');
            container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando vista...</div>';
            
            setTimeout(async () => {
                try {
                    await renderFn(container, queryParams);
                } catch (err) {
                    console.error("Error rendering view:", err);
                    container.innerHTML = `<div class="glass-card" style="border-color: var(--danger); text-align: center; padding: 3rem;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: var(--danger); margin-bottom: 1rem;"></i>
                        <h2>Error al cargar la vista</h2>
                        <p style="color: var(--text-secondary); margin: 1rem 0;">${err.message}</p>
                        <pre style="text-align: left; background: rgba(0,0,0,0.5); padding: 0.75rem; border-radius: 4px; font-size: 0.75rem; overflow-x: auto; max-width: 600px; margin: 1rem auto; white-space: pre-wrap; word-break: break-all; color: #ff7675;">${err.stack || err}</pre>
                        <button class="btn btn-secondary" onclick="window.location.hash = '#taller-dashboard'">Volver al Panel</button>
                    </div>`;
                }
            }, 100);
        } else {
            window.location.hash = 'taller-dashboard';
        }
    } catch (routerErr) {
        console.error("Router error:", routerErr);
        const container = document.getElementById('view-container');
        if (container) {
            container.innerHTML = `
                <div style="color: #ff7675; text-align: center; padding: 3rem; font-family: sans-serif;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <h3 style="margin: 0 0 0.5rem 0;">Error de Enrutamiento</h3>
                    <p style="margin: 0 0 1rem 0; font-size: 0.9rem; color: #b2bec3;">${routerErr.message || routerErr}</p>
                    <pre style="text-align: left; background: rgba(0,0,0,0.5); padding: 0.75rem; border-radius: 4px; font-size: 0.75rem; overflow-x: auto; max-width: 600px; margin: 1rem auto; white-space: pre-wrap; word-break: break-all; color: #ff7675;">${routerErr.stack || routerErr}</pre>
                    <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: #ffeaa7;">Reintentando conexión automáticamente en 5s...</p>
                    <button onclick="window.location.reload()" style="background: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Reintentar Ahora
                    </button>
                </div>
            `;
        }
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }
}

export function initRouter() {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const closeBtn = document.getElementById('mobile-menu-close');

    function closeMobileMenu() {
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMobileMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }

    // Router bindings
    window.addEventListener('hashchange', () => {
        closeMobileMenu();
        handleRouting();
    });
    
    // Menu navigation click bindings
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.getAttribute('data-route');
            window.location.hash = route;
            closeMobileMenu();
        });
    });

    // Run first routing cycle
    handleRouting();
}

// Expose handleRouting globally for legacy scripts (like dataService.js)
window.handleRouting = handleRouting;
