/**
 * Mecanic OS - Data Abstraction Layer
 * Handles async database persistence and memory caching.
 */

const dataService = {
    cache: null,

    // Initialize database cache from storage
    async init() {
        let dbStr = localStorage.getItem('mecanic_os_db');
        const defaultRolePermissions = {
            "Administrador": [
                "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                "facturador", "venta-rapida", "cuentas-cobrar", "inventario", "gastos", "planilla",
                "dashboard-bi", "configuracion"
            ],
            "Técnico": [
                "taller-dashboard", "clientes-vehiculos", "revision-21", "kanban"
            ],
            "Recepcionista": [
                "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                "venta-rapida", "cuentas-cobrar"
            ]
        };

        const defaultPlans = [
            { id: 'plan-basic', nombre: 'Basic', precio: 45.00, descripcion: 'Ideal para talleres pequeños o independientes', max_usuarios: 3, features: ['Gestión de clientes y vehículos', 'Presupuestos estándar', 'Kanban básico'] },
            { id: 'plan-pro', nombre: 'Pro', precio: 75.00, descripcion: 'Recomendado para talleres en crecimiento con DTE', max_usuarios: 10, features: ['Todo lo de Basic', 'Facturador DTE (MH El Salvador)', 'Control de Inventario y Kárdex', 'Punto de Venta (POS)', 'Reportes BI básicos'] },
            { id: 'plan-enterprise', nombre: 'Enterprise', precio: 120.00, descripcion: 'Para talleres grandes o redes de sucursales', max_usuarios: 99, features: ['Todo lo de Pro', 'Base de Datos dedicada (Firebase)', 'Soporte Premium 24/7', 'Planilla y Salarios avanzados', 'API de integración externa'] }
        ];

        const defaultCoupons = [
            { codigo: 'BIENVENIDO50', tipo: 'porcentaje', valor: 50, descripcion: '50% de descuento en el primer pago', activo: true, expiracion: '2026-12-31' },
            { codigo: 'MECANICFREE', tipo: 'porcentaje', valor: 100, descripcion: '100% de descuento (acceso gratuito temporal)', activo: true, expiracion: '2026-12-31' },
            { codigo: 'OS15OFF', tipo: 'fijo', valor: 15, descripcion: '$15 de descuento fijo', activo: true, expiracion: '2026-12-31' }
        ];

        if (!dbStr) {
            // Fallback default schema structure
            this.cache = {
                clientes: [],
                vehiculos: [],
                productos: [],
                mano_obra: [],
                presupuestos: [],
                revisiones: [],
                tecnicos: [],
                role_permissions: defaultRolePermissions,
                saas_state: {
                    status: 'guest',
                    workshopData: null,
                    termsSigned: false,
                    signatureName: '',
                    signedAt: null
                },
                solicitudes_registro: [],
                saas_payments: [],
                saas_plans: defaultPlans,
                saas_coupons: defaultCoupons
            };
            localStorage.setItem('mecanic_os_db', JSON.stringify(this.cache));
        } else {
            this.cache = JSON.parse(dbStr);
            
            // Self-healing database check for missing objects
            let changed = false;
            if (!this.cache.clientes) { this.cache.clientes = []; changed = true; }
            if (!this.cache.vehiculos) { this.cache.vehiculos = []; changed = true; }
            if (!this.cache.productos) { this.cache.productos = []; changed = true; }
            if (!this.cache.mano_obra) { this.cache.mano_obra = []; changed = true; }
            if (!this.cache.presupuestos) { this.cache.presupuestos = []; changed = true; }
            if (!this.cache.revisiones) { this.cache.revisiones = []; changed = true; }
            if (!this.cache.tecnicos) { this.cache.tecnicos = []; changed = true; }
            if (!this.cache.role_permissions) { this.cache.role_permissions = defaultRolePermissions; changed = true; }
            if (!this.cache.saas_state) {
                this.cache.saas_state = {
                    status: 'guest',
                    workshopData: null,
                    termsSigned: false,
                    signatureName: '',
                    signedAt: null
                };
                changed = true;
            }
            if (!this.cache.solicitudes_registro) { this.cache.solicitudes_registro = []; changed = true; }
            if (!this.cache.saas_payments) { this.cache.saas_payments = []; changed = true; }
            if (!this.cache.saas_plans) { this.cache.saas_plans = defaultPlans; changed = true; }
            if (!this.cache.saas_coupons) { this.cache.saas_coupons = defaultCoupons; changed = true; }
            
            if (changed) {
                localStorage.setItem('mecanic_os_db', JSON.stringify(this.cache));
            }
        }
        return this.cache;
    },

    // Save cache state back to storage asynchronously
    async save(db) {
        // Update the in-memory cache synchronously so reads immediately see updates
        this.cache = db;

        // Perform I/O write operations asynchronously using setTimeout
        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.setItem('mecanic_os_db', JSON.stringify(db));
                
                if (db && db.saas_state && db.saas_state.workshopData) {
                    const wsData = db.saas_state.workshopData;
                    if (wsData.dte_config) {
                        localStorage.setItem('mecanic_os_dte_config', JSON.stringify(wsData.dte_config));
                    }
                    if (wsData.firebase_config) {
                        localStorage.setItem('mecanic_os_firebase_config', JSON.stringify(wsData.firebase_config));
                    } else if (db.saas_state.status === 'guest') {
                        localStorage.removeItem('mecanic_os_firebase_config');
                    }
                }

                // Call background Firebase Cloud Sync if active
                if (typeof isFirebaseConnected !== 'undefined' && isFirebaseConnected && 
                    typeof currentFirebaseUser !== 'undefined' && currentFirebaseUser && 
                    typeof preventFirestoreSync !== 'undefined' && !preventFirestoreSync) {
                    if (typeof syncToFirestore === 'function') {
                        syncToFirestore(db);
                    }
                }

                // Trigger notifications badge updates in UI
                if (typeof updateNotifications === 'function') {
                    updateNotifications();
                }
                resolve();
            }, 0);
        });
    },

    // Clientes operations
    clientes: {
        async getAll() {
            return dataService.cache.clientes || [];
        },
        async save(cliente) {
            if (!dataService.cache.clientes) dataService.cache.clientes = [];
            const idx = dataService.cache.clientes.findIndex(c => c.Codigo_Cliente === cliente.Codigo_Cliente);
            if (idx >= 0) {
                dataService.cache.clientes[idx] = cliente;
            } else {
                dataService.cache.clientes.push(cliente);
            }
            await dataService.save(dataService.cache);
            return cliente;
        },
        async delete(codigo) {
            if (!dataService.cache.clientes) return;
            dataService.cache.clientes = dataService.cache.clientes.filter(c => c.Codigo_Cliente !== codigo);
            await dataService.save(dataService.cache);
        }
    },

    // Vehiculos operations
    vehiculos: {
        async getAll() {
            return dataService.cache.vehiculos || [];
        },
        async save(vehiculo) {
            if (!dataService.cache.vehiculos) dataService.cache.vehiculos = [];
            const idx = dataService.cache.vehiculos.findIndex(v => v.ID_Vehiculo === vehiculo.ID_Vehiculo);
            if (idx >= 0) {
                dataService.cache.vehiculos[idx] = vehiculo;
            } else {
                dataService.cache.vehiculos.push(vehiculo);
            }
            await dataService.save(dataService.cache);
            return vehiculo;
        }
    },

    // Presupuestos operations
    presupuestos: {
        async getAll() {
            return dataService.cache.presupuestos || [];
        },
        async save(presupuesto) {
            if (!dataService.cache.presupuestos) dataService.cache.presupuestos = [];
            const idx = dataService.cache.presupuestos.findIndex(p => p['ID Presupuesto'] === presupuesto['ID Presupuesto']);
            if (idx >= 0) {
                dataService.cache.presupuestos[idx] = presupuesto;
            } else {
                dataService.cache.presupuestos.push(presupuesto);
            }
            await dataService.save(dataService.cache);
            return presupuesto;
        },
        async delete(id) {
            if (!dataService.cache.presupuestos) return;
            dataService.cache.presupuestos = dataService.cache.presupuestos.filter(p => p['ID Presupuesto'] !== id);
            await dataService.save(dataService.cache);
        }
    }
};
