/**
 * Mecanic OS - Data Abstraction Layer
 * Handles async database persistence, memory caching, and native Firestore collections sync.
 */

const dataService = {
    cache: null,
    activeUserUid: null,
    listeners: [],

    // Initialize database cache from storage and setup Firestore persistence
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

        // Initialize Firestore Native Offline Persistence if Firebase SDK is present
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            try {
                await firebase.firestore().enablePersistence();
                console.log("Firestore Sync: Persistence enabled successfully.");
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn("Firestore Sync: Persistence failed (multiple tabs open).");
                } else if (err.code === 'unimplemented') {
                    console.warn("Firestore Sync: Persistence unimplemented by browser.");
                }
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
            setTimeout(async () => {
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

                // If logged in, sync metadata (settings, saas states) to root document
                if (this.activeUserUid && typeof dbFirestore !== 'undefined' && dbFirestore) {
                    try {
                        await dbFirestore.collection("workshops").doc(this.activeUserUid).set({
                            config_taller: db.config_taller || {},
                            saas_state: db.saas_state || {},
                            role_permissions: db.role_permissions || {},
                            saas_payments: db.saas_payments || [],
                            updatedAt: new Date().toISOString(),
                            updatedBy: (typeof currentFirebaseUser !== 'undefined' && currentFirebaseUser) ? currentFirebaseUser.email : 'system'
                        }, { merge: true });
                    } catch (e) {
                        console.error("Firestore Root Sync Error:", e);
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

    // Firestore Collections Real-Time Sync Subscribers
    startSync(uid) {
        if (!uid || typeof dbFirestore === 'undefined' || !dbFirestore) return;
        this.activeUserUid = uid;
        this.stopSync(); // Unsubscribe active listeners first

        const docRef = dbFirestore.collection("workshops").doc(uid);

        // 1. Listen to Root document updates (Metadata & Configs)
        const rootListener = docRef.onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                let changed = false;
                if (data.config_taller) { this.cache.config_taller = data.config_taller; changed = true; }
                if (data.saas_state) { this.cache.saas_state = data.saas_state; changed = true; }
                if (data.role_permissions) { this.cache.role_permissions = data.role_permissions; changed = true; }
                if (data.saas_payments) { this.cache.saas_payments = data.saas_payments; changed = true; }
                
                if (changed) {
                    localStorage.setItem('mecanic_os_db', JSON.stringify(this.cache));
                    if (typeof handleRouting === 'function') handleRouting();
                }
            }
        });
        this.listeners.push(rootListener);

        // 2. Listen to Clientes subcollection updates
        const clientesListener = docRef.collection("clientes").onSnapshot((snapshot) => {
            let updated = false;
            snapshot.docChanges().forEach((change) => {
                const cliente = change.doc.data();
                const idx = this.cache.clientes.findIndex(c => c.Codigo_Cliente === cliente.Codigo_Cliente);
                if (change.type === "added" || change.type === "modified") {
                    if (idx >= 0) {
                        this.cache.clientes[idx] = cliente;
                    } else {
                        this.cache.clientes.push(cliente);
                    }
                    updated = true;
                } else if (change.type === "removed") {
                    if (idx >= 0) {
                        this.cache.clientes.splice(idx, 1);
                        updated = true;
                    }
                }
            });
            if (updated) {
                localStorage.setItem('mecanic_os_db', JSON.stringify(this.cache));
                if (typeof handleRouting === 'function') handleRouting();
            }
        });
        this.listeners.push(clientesListener);

        // 3. Listen to Vehiculos subcollection updates
        const vehiculosListener = docRef.collection("vehiculos").onSnapshot((snapshot) => {
            let updated = false;
            snapshot.docChanges().forEach((change) => {
                const vehiculo = change.doc.data();
                const idx = this.cache.vehiculos.findIndex(v => v.ID_Vehiculo === vehiculo.ID_Vehiculo);
                if (change.type === "added" || change.type === "modified") {
                    if (idx >= 0) {
                        this.cache.vehiculos[idx] = vehiculo;
                    } else {
                        this.cache.vehiculos.push(vehiculo);
                    }
                    updated = true;
                } else if (change.type === "removed") {
                    if (idx >= 0) {
                        this.cache.vehiculos.splice(idx, 1);
                        updated = true;
                    }
                }
            });
            if (updated) {
                localStorage.setItem('mecanic_os_db', JSON.stringify(this.cache));
                if (typeof handleRouting === 'function') handleRouting();
            }
        });
        this.listeners.push(vehiculosListener);

        // 4. Listen to Presupuestos subcollection updates
        const presupuestosListener = docRef.collection("presupuestos").onSnapshot((snapshot) => {
            let updated = false;
            snapshot.docChanges().forEach((change) => {
                const presupuesto = change.doc.data();
                const idx = this.cache.presupuestos.findIndex(p => p['ID Presupuesto'] === presupuesto['ID Presupuesto']);
                if (change.type === "added" || change.type === "modified") {
                    if (idx >= 0) {
                        this.cache.presupuestos[idx] = presupuesto;
                    } else {
                        this.cache.presupuestos.push(presupuesto);
                    }
                    updated = true;
                } else if (change.type === "removed") {
                    if (idx >= 0) {
                        this.cache.presupuestos.splice(idx, 1);
                        updated = true;
                    }
                }
            });
            if (updated) {
                localStorage.setItem('mecanic_os_db', JSON.stringify(this.cache));
                if (typeof handleRouting === 'function') handleRouting();
            }
        });
        this.listeners.push(presupuestosListener);
    },

    stopSync() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
        this.activeUserUid = null;
    },

    // Check if Firestore collections are empty and perform auto-migration of local data (Phase 3)
    async checkAndMigrate(uid) {
        if (!uid || typeof dbFirestore === 'undefined' || !dbFirestore) return;
        try {
            const clientsSnap = await dbFirestore.collection("workshops").doc(uid).collection("clientes").limit(1).get();
            if (clientsSnap.empty && this.cache.clientes && this.cache.clientes.length > 0) {
                console.log("Firestore Sync: Remote database is empty. Starting local database upload migration...");
                if (typeof showToast === 'function') {
                    showToast("Sincronizando base de datos local hacia la nube...", "info");
                }
                await this.migrateLocalDataToCloud(uid);
            }
        } catch (err) {
            console.error("Firestore Migration check failed:", err);
        }
    },

    // Perform batch write migrations from cache to Firestore subcollections
    async migrateLocalDataToCloud(uid) {
        const db = dbFirestore;
        const docRef = db.collection("workshops").doc(uid);

        // 1. Upload root settings document
        await docRef.set({
            config_taller: this.cache.config_taller || {},
            saas_state: this.cache.saas_state || {},
            role_permissions: this.cache.role_permissions || {},
            saas_payments: this.cache.saas_payments || [],
            updatedAt: new Date().toISOString(),
            updatedBy: (typeof currentFirebaseUser !== 'undefined' && currentFirebaseUser) ? currentFirebaseUser.email : 'system-migration'
        }, { merge: true });

        // 2. Upload Clientes in chunks of 100
        const clients = this.cache.clientes || [];
        for (let i = 0; i < clients.length; i += 100) {
            const batch = db.batch();
            const chunk = clients.slice(i, i + 100);
            chunk.forEach(cliente => {
                const ref = docRef.collection("clientes").doc(cliente.Codigo_Cliente);
                batch.set(ref, cliente);
            });
            await batch.commit();
        }

        // 3. Upload Vehiculos in chunks of 100
        const vehicles = this.cache.vehiculos || [];
        for (let i = 0; i < vehicles.length; i += 100) {
            const batch = db.batch();
            const chunk = vehicles.slice(i, i + 100);
            chunk.forEach(vehiculo => {
                const ref = docRef.collection("vehiculos").doc(vehiculo.ID_Vehiculo);
                batch.set(ref, vehiculo);
            });
            await batch.commit();
        }

        // 4. Upload Presupuestos in chunks of 100
        const budgets = this.cache.presupuestos || [];
        for (let i = 0; i < budgets.length; i += 100) {
            const batch = db.batch();
            const chunk = budgets.slice(i, i + 100);
            chunk.forEach(budget => {
                const ref = docRef.collection("presupuestos").doc(budget['ID Presupuesto']);
                batch.set(ref, budget);
            });
            await batch.commit();
        }

        if (typeof showToast === 'function') {
            showToast("Migración a la nube completada exitosamente", "success");
        }
        console.log("Firestore Sync: Migration complete.");
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

            // Write to Firestore subcollection if logged in
            if (dataService.activeUserUid && typeof dbFirestore !== 'undefined' && dbFirestore) {
                await dbFirestore.collection("workshops").doc(dataService.activeUserUid)
                    .collection("clientes").doc(cliente.Codigo_Cliente).set(cliente);
            }
            return cliente;
        },
        async delete(codigo) {
            if (!dataService.cache.clientes) return;
            dataService.cache.clientes = dataService.cache.clientes.filter(c => c.Codigo_Cliente !== codigo);
            await dataService.save(dataService.cache);

            // Delete from Firestore subcollection if logged in
            if (dataService.activeUserUid && typeof dbFirestore !== 'undefined' && dbFirestore) {
                await dbFirestore.collection("workshops").doc(dataService.activeUserUid)
                    .collection("clientes").doc(codigo).delete();
            }
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

            // Write to Firestore subcollection if logged in
            if (dataService.activeUserUid && typeof dbFirestore !== 'undefined' && dbFirestore) {
                await dbFirestore.collection("workshops").doc(dataService.activeUserUid)
                    .collection("vehiculos").doc(vehiculo.ID_Vehiculo).set(vehiculo);
            }
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

            // Write to Firestore subcollection if logged in
            if (dataService.activeUserUid && typeof dbFirestore !== 'undefined' && dbFirestore) {
                await dbFirestore.collection("workshops").doc(dataService.activeUserUid)
                    .collection("presupuestos").doc(presupuesto['ID Presupuesto']).set(presupuesto);
            }
            return presupuesto;
        },
        async delete(id) {
            if (!dataService.cache.presupuestos) return;
            dataService.cache.presupuestos = dataService.cache.presupuestos.filter(p => p['ID Presupuesto'] !== id);
            await dataService.save(dataService.cache);

            // Delete from Firestore subcollection if logged in
            if (dataService.activeUserUid && typeof dbFirestore !== 'undefined' && dbFirestore) {
                await dbFirestore.collection("workshops").doc(dataService.activeUserUid)
                    .collection("presupuestos").doc(id).delete();
            }
        }
    }
};
