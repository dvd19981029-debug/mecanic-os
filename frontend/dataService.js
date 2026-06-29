/**
 * Mecanic OS - Data Abstraction Layer
 * Handles async database persistence, memory caching, and native Firestore collections sync.
 */

// Define mapping for all collections in Mecanic OS
const collectionConfigs = [
    { name: 'clientes', path: 'clientes', key: 'Codigo_Cliente' },
    { name: 'vehiculos', path: 'vehiculos', key: 'ID_Vehiculo' },
    { name: 'presupuestos', path: 'presupuestos', key: 'ID Presupuesto' },
    { name: 'productos', path: 'productos', key: 'ID_ Producto' },
    { name: 'mano_obra', path: 'mano_obra', key: 'ID_ManoObra' },
    { name: 'revisiones', path: 'revisiones', key: 'ID_Revision' },
    { name: 'tecnicos', path: 'tecnicos', key: 'Tecnico_ID' },
    { name: 'detalle_productos', path: 'detalle_productos', key: 'DPP' },
    { name: 'detalle_mano_obra', path: 'detalle_mano_obra', key: 'ID_DetalleMO' },
    { name: 'abonos_credito', path: 'abonos_credito', key: 'ID_Abono' },
    { name: 'movs_inventario', path: 'movs_inventario', key: 'id_Mov' },
    { name: 'venta_rapida', path: 'venta_rapida', key: 'ID_Venta_Rapida' },
    { name: 'gastos', path: 'gastos', key: 'ID Gasto' },
    { name: 'pagos_vr', path: 'pagos_vr', key: 'ID_Pago' },
    { name: 'pagos', path: 'pagos', key: 'ID Pago' },
    { name: 'promociones', path: 'promociones', key: 'ID_Promocion' },
    { name: 'pagos_comisiones', path: 'pagos_comisiones', key: 'ID_Pago_Comision' },
    { name: 'proveedores', path: 'proveedores', key: 'ID_Proveedor' },
    { name: 'compras', path: 'compras', key: 'ID_Compra' },
    { name: 'abonos_proveedores', path: 'abonos_proveedores', key: 'ID_Abono_Prov' }
];

const dataService = {
    cache: null,
    lastSyncedState: null,
    activeUserUid: null,      // UID de Firebase Auth del dueño (para writes propios)
    workshopOwnerUid: null,   // UID del taller (puede ser del dueño o compartido por empleados)
    readOnlyMode: false,      // true cuando el dispositivo es de un empleado (sin Firebase Auth propio)
    listeners: [],

    async getStorageItem(key) {
        if (typeof localforage !== 'undefined') {
            try {
                return await localforage.getItem(key);
            } catch (e) {
                console.error("localforage.getItem failed:", e);
            }
        }
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
    },

    async setStorageItem(key, value) {
        if (typeof localforage !== 'undefined') {
            try {
                return await localforage.setItem(key, value);
            } catch (e) {
                console.error("localforage.setItem failed:", e);
            }
        }
        return localStorage.setItem(key, JSON.stringify(value));
    },

    async removeStorageItem(key) {
        if (typeof localforage !== 'undefined') {
            try {
                return await localforage.removeItem(key);
            } catch (e) {
                console.error("localforage.removeItem failed:", e);
            }
        }
        return localStorage.removeItem(key);
    },

    // Initialize database cache from storage and setup Firestore persistence
    async init() {
        if (typeof localforage !== 'undefined') {
            localforage.config({
                name: 'MecanicOS',
                storeName: 'database'
            });
        }

        // Automatic transparent migration from localStorage to IndexedDB
        let dbData = null;
        const oldDbStr = localStorage.getItem('mecanic_os_db');
        if (oldDbStr) {
            console.log("IndexedDB Migration: Found legacy localStorage database. Migrating...");
            try {
                dbData = JSON.parse(oldDbStr);
                await this.setStorageItem('mecanic_os_db', dbData);
                
                const dteConfig = localStorage.getItem('mecanic_os_dte_config');
                if (dteConfig) {
                    await this.setStorageItem('mecanic_os_dte_config', JSON.parse(dteConfig));
                    await this.removeStorageItem('mecanic_os_dte_config');
                }
                const fbConfig = localStorage.getItem('mecanic_os_firebase_config');
                if (fbConfig) {
                    await this.setStorageItem('mecanic_os_firebase_config', JSON.parse(fbConfig));
                    await this.removeStorageItem('mecanic_os_firebase_config');
                }
                await this.removeStorageItem('mecanic_os_db');
                console.log("IndexedDB Migration: Completed successfully.");
            } catch (e) {
                console.error("IndexedDB Migration Error:", e);
            }
        } else {
            dbData = await this.getStorageItem('mecanic_os_db');
        }
        const defaultRolePermissions = {
            "Administrador": [
                "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                "facturador", "venta-rapida", "cuentas-cobrar", "inventario", "gastos", "planilla",
                "dashboard-bi", "configuracion", "comisiones"
            ],
            "Técnico": [
                "taller-dashboard", "clientes-vehiculos", "revision-21", "kanban", "comisiones"
            ],
            "Recepcionista": [
                "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                "facturador", "venta-rapida", "cuentas-cobrar", "comisiones"
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

        if (!dbData) {
            // Fallback default schema structure
            this.cache = {
                clientes: [],
                vehiculos: [],
                productos: [],
                mano_obra: [],
                presupuestos: [],
                revisiones: [],
                tecnicos: [],
                pagos_comisiones: [],
                promociones: [],
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
                saas_coupons: defaultCoupons,
                saas_config: {
                    wompi: { clientId: '', clientSecret: '', appId: '' },
                    dte: { apiKey: 'test_sk_mecanicos_default_sandbox_key_998877' }
                },
                proveedores: [],
                compras: [],
                abonos_proveedores: []
            };
            await this.setStorageItem('mecanic_os_db', this.cache);
        } else {
            this.cache = dbData;
            
            // Self-healing database check for missing objects
            let changed = false;
            if (!this.cache.clientes) { this.cache.clientes = []; changed = true; }
            if (!this.cache.vehiculos) { this.cache.vehiculos = []; changed = true; }
            if (!this.cache.productos) { this.cache.productos = []; changed = true; }
            if (!this.cache.mano_obra) { this.cache.mano_obra = []; changed = true; }
            if (!this.cache.presupuestos) { this.cache.presupuestos = []; changed = true; }
            if (!this.cache.revisiones) { this.cache.revisiones = []; changed = true; }
            if (!this.cache.tecnicos) { this.cache.tecnicos = []; changed = true; }
            if (!this.cache.pagos_comisiones) { this.cache.pagos_comisiones = []; changed = true; }
            if (!this.cache.pagos) { this.cache.pagos = []; changed = true; }
            if (!this.cache.promociones) { this.cache.promociones = []; changed = true; }
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
            if (!this.cache.proveedores) { this.cache.proveedores = []; changed = true; }
            if (!this.cache.compras) { this.cache.compras = []; changed = true; }
            if (!this.cache.abonos_proveedores) { this.cache.abonos_proveedores = []; changed = true; }
            if (!this.cache.saas_plans) { this.cache.saas_plans = defaultPlans; changed = true; }
            if (!this.cache.saas_coupons) { this.cache.saas_coupons = defaultCoupons; changed = true; }
            if (!this.cache.saas_config) {
                this.cache.saas_config = {
                    wompi: { clientId: '', clientSecret: '', appId: '' },
                    dte: { apiKey: 'test_sk_mecanicos_default_sandbox_key_998877' }
                };
                changed = true;
            }
            
            // Self-healing: Deduplicate collections based on primary keys to resolve local storage inconsistencies
            collectionConfigs.forEach(config => {
                if (this.cache[config.name] && Array.isArray(this.cache[config.name])) {
                    const seen = new Set();
                    this.cache[config.name] = this.cache[config.name].filter(item => {
                        const val = item[config.key];
                        if (!val) return true;
                        if (seen.has(val)) {
                            changed = true;
                            return false;
                        }
                        seen.add(val);
                        return true;
                    });
                }
            });
            
            if (changed) {
                await this.setStorageItem('mecanic_os_db', this.cache);
            }
        }

        // Establish memory references for all aliased tables
        this.cache.detalle_productos = this.cache['21 Detalle Presupuesto Producto'] || this.cache.detalle_productos || [];
        this.cache['21 Detalle Presupuesto Producto'] = this.cache.detalle_productos;

        this.cache.detalle_mano_obra = this.cache['11 Detalle Mano de Obra'] || this.cache.detalle_mano_obra || [];
        this.cache['11 Detalle Mano de Obra'] = this.cache.detalle_mano_obra;

        this.cache.abonos_credito = this.cache['30 Abonos Creditos'] || this.cache.abonos_credito || [];
        this.cache['30 Abonos Creditos'] = this.cache.abonos_credito;

        this.cache.movs_inventario = this.cache['29 Movs de Inventario'] || this.cache.movs_inventario || [];
        this.cache['29 Movs de Inventario'] = this.cache.movs_inventario;

        this.cache.venta_rapida = this.cache['43 Venta Rapida'] || this.cache.venta_rapida || [];
        this.cache['43 Venta Rapida'] = this.cache.venta_rapida;

        this.cache.gastos = this.cache['46 Gastos'] || this.cache.gastos || [];
        this.cache['46 Gastos'] = this.cache.gastos;

        this.cache.pagos_vr = this.cache['45 Pagos VR'] || this.cache.pagos_vr || [];
        this.cache['45 Pagos VR'] = this.cache.pagos_vr;

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

        this.lastSyncedState = JSON.parse(JSON.stringify(this.cache));
        return this.cache;
    },

    // Save cache state back to storage asynchronously with automated granular diffing
    async save(db) {
        const oldCache = this.lastSyncedState || {};
        this.cache = db;

        // Re-align aliased array references in memory, preferring legacy key data if modified by frontend
        this.cache.detalle_productos = this.cache['21 Detalle Presupuesto Producto'] || this.cache.detalle_productos || [];
        this.cache['21 Detalle Presupuesto Producto'] = this.cache.detalle_productos;

        this.cache.detalle_mano_obra = this.cache['11 Detalle Mano de Obra'] || this.cache.detalle_mano_obra || [];
        this.cache['11 Detalle Mano de Obra'] = this.cache.detalle_mano_obra;

        this.cache.abonos_credito = this.cache['30 Abonos Creditos'] || this.cache.abonos_credito || [];
        this.cache['30 Abonos Creditos'] = this.cache.abonos_credito;

        this.cache.movs_inventario = this.cache['29 Movs de Inventario'] || this.cache.movs_inventario || [];
        this.cache['29 Movs de Inventario'] = this.cache.movs_inventario;

        this.cache.venta_rapida = this.cache['43 Venta Rapida'] || this.cache.venta_rapida || [];
        this.cache['43 Venta Rapida'] = this.cache.venta_rapida;

        this.cache.gastos = this.cache['46 Gastos'] || this.cache.gastos || [];
        this.cache['46 Gastos'] = this.cache.gastos;

        this.cache.pagos_vr = this.cache['45 Pagos VR'] || this.cache.pagos_vr || [];
        this.cache['45 Pagos VR'] = this.cache.pagos_vr;

        // Perform I/O write operations asynchronously using setTimeout
        return new Promise((resolve) => {
            setTimeout(async () => {
                if (this.activeUserUid) {
                    const prunedDb = { ...db };
                    collectionConfigs.forEach(config => {
                        delete prunedDb[config.name];
                    });
                    delete prunedDb['21 Detalle Presupuesto Producto'];
                    delete prunedDb['11 Detalle Mano de Obra'];
                    delete prunedDb['30 Abonos Creditos'];
                    delete prunedDb['29 Movs de Inventario'];
                    delete prunedDb['43 Venta Rapida'];
                    delete prunedDb['46 Gastos'];
                    delete prunedDb['45 Pagos VR'];
                    await this.setStorageItem('mecanic_os_db', prunedDb);
                } else {
                    await this.setStorageItem('mecanic_os_db', db);
                }
                
                if (db && db.saas_state && db.saas_state.workshopData) {
                    const wsData = db.saas_state.workshopData;
                    if (wsData.dte_config) {
                        await this.setStorageItem('mecanic_os_dte_config', wsData.dte_config);
                    }
                    if (wsData.firebase_config) {
                        await this.setStorageItem('mecanic_os_firebase_config', wsData.firebase_config);
                    } else if (db.saas_state.status === 'guest') {
                        await this.removeStorageItem('mecanic_os_firebase_config');
                    }
                }

                // If logged in, sync metadata and collection differences to Firestore
                if (this.activeUserUid && typeof dbFirestore !== 'undefined' && dbFirestore) {
                    try {
                        const docRef = dbFirestore.collection("workshops").doc(this.activeUserUid);

                        // 1. Sync metadata to root document
                        await docRef.set({
                            config_taller: db.config_taller || {},
                            saas_state: db.saas_state || {},
                            role_permissions: db.role_permissions || {},
                            saas_payments: db.saas_payments || [],
                            saas_config: db.saas_config || {},
                            updatedAt: new Date().toISOString(),
                            updatedBy: (typeof currentFirebaseUser !== 'undefined' && currentFirebaseUser) ? currentFirebaseUser.email : 'system'
                        }, { merge: mergeEnabled() });
                        this.saas.logOp('writes', 1);

                        function mergeEnabled() { return true; }

                        // 2. Perform automated granular diffing per subcollection
                        for (const config of collectionConfigs) {
                            const oldItems = oldCache[config.name] || [];
                            const newItems = db[config.name] || [];

                            // Find added or modified items
                            for (const newItem of newItems) {
                                const keyVal = newItem[config.key];
                                if (!keyVal) continue;

                                const oldItem = oldItems.find(x => x[config.key] === keyVal);
                                if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                                    // Save single document
                                    await docRef.collection(config.path).doc(keyVal.toString()).set(newItem);
                                    this.saas.logOp('writes', 1);
                                }
                            }

                            // Find deleted items
                            for (const oldItem of oldItems) {
                                const keyVal = oldItem[config.key];
                                if (!keyVal) continue;

                                const exists = newItems.some(x => x[config.key] === keyVal);
                                if (!exists) {
                                    // Delete single document
                                    await docRef.collection(config.path).doc(keyVal.toString()).delete();
                                    this.saas.logOp('deletes', 1);
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Firestore Auto-Sync Error:", e);
                    }
                }

                // Update lastSyncedState to match the newly saved state
                this.lastSyncedState = JSON.parse(JSON.stringify(db));

                // Trigger notifications badge updates in UI
                if (typeof updateNotifications === 'function') {
                    updateNotifications();
                }
                resolve();
            }, 0);
        });
    },

    // Firestore Collections Real-Time Sync Subscribers
    // uid: UID del taller (del dueño)
    // employeeMode: true cuando es un empleado sin Firebase Auth propio
    startSync(uid, employeeMode = false) {
        if (!uid || typeof dbFirestore === 'undefined' || !dbFirestore) return;
        
        const isSwitchingWorkshop = this.workshopOwnerUid && this.workshopOwnerUid !== uid;
        if (isSwitchingWorkshop) {
            // Limpiar caché local de colecciones para evitar cruces de datos (multi-taller)
            if (this.cache) {
                collectionConfigs.forEach(config => {
                    this.cache[config.name] = [];
                });
                this.cache['21 Detalle Presupuesto Producto'] = this.cache.detalle_productos;
                this.cache['11 Detalle Mano de Obra'] = this.cache.detalle_mano_obra;
                this.cache['30 Abonos Creditos'] = this.cache.abonos_credito;
                this.cache['29 Movs de Inventario'] = this.cache.movs_inventario;
                this.cache['43 Venta Rapida'] = this.cache.venta_rapida;
                this.cache['46 Gastos'] = this.cache.gastos;
                this.cache['45 Pagos VR'] = this.cache.pagos_vr;
            }
            this.lastSyncedState = null;
        }

        this.workshopOwnerUid = uid;
        this.readOnlyMode = employeeMode;
        this.stopSync(); // Cancelar listeners anteriores (NO limpia activeUserUid)
        // IMPORTANTE: setear activeUserUid DESPUÉS de stopSync para que no se pierda
        this.activeUserUid = uid;

        const docRef = dbFirestore.collection("workshops").doc(uid);

        const handleSyncError = (error) => {
            console.error("Mecanic OS: Firestore Sync Error:", error);
            if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
                if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                    console.log("Mecanic OS: Auth session expired or permission denied. Refreshing token to reconnect...");
                    firebase.auth().currentUser.getIdToken(true).then(() => {
                        console.log("Mecanic OS: Firebase token refreshed successfully. Restoring sync listeners...");
                        const ownerUid = getWorkshopOwnerUid();
                        if (ownerUid) {
                            this.startSync(ownerUid, this.readOnlyMode);
                        }
                    }).catch(err => {
                        console.error("Mecanic OS: Failed to refresh Firebase token:", err);
                    });
                }
            }
        };

        // 1. Listen to Root document updates (Metadata & Configs)
        const rootListener = docRef.onSnapshot(async (doc) => {
            this.saas.logOp('reads', 1);
            if (doc.exists) {
                const data = doc.data();
                let changed = false;
                if (data.config_taller && JSON.stringify(this.cache.config_taller) !== JSON.stringify(data.config_taller)) { 
                    this.cache.config_taller = data.config_taller; 
                    changed = true; 
                }
                if (data.saas_state && JSON.stringify(this.cache.saas_state) !== JSON.stringify(data.saas_state)) { 
                    this.cache.saas_state = data.saas_state; 
                    changed = true; 
                }
                if (data.role_permissions && JSON.stringify(this.cache.role_permissions) !== JSON.stringify(data.role_permissions)) { 
                    this.cache.role_permissions = data.role_permissions; 
                    changed = true; 
                }
                if (data.saas_payments && JSON.stringify(this.cache.saas_payments) !== JSON.stringify(data.saas_payments)) { 
                    this.cache.saas_payments = data.saas_payments; 
                    changed = true; 
                }
                if (data.saas_config && JSON.stringify(this.cache.saas_config) !== JSON.stringify(data.saas_config)) { 
                    this.cache.saas_config = data.saas_config; 
                    changed = true; 
                }
                
                if (changed) {
                    await this.setStorageItem('mecanic_os_db', this.cache);
                    this.lastSyncedState = JSON.parse(JSON.stringify(this.cache));
                    if (typeof handleRouting === 'function') handleRouting();
                }
            }
        }, handleSyncError);
        this.listeners.push(rootListener);

        // 2. Setup reactive listeners dynamically for all subcollections
        collectionConfigs.forEach(config => {
            const listener = docRef.collection(config.path).onSnapshot(async (snapshot) => {
                this.saas.logOp('reads', snapshot.docChanges().length || 1);
                let updated = false;
                // fromCache=true significa que el cambio ya se aplicó localmente (este mismo dispositivo)
                // fromCache=false significa que vino de otro dispositivo → necesitamos refrescar la UI
                const isRemoteChange = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
                snapshot.docChanges().forEach((change) => {
                    const item = change.doc.data();
                    if (!this.cache[config.name]) this.cache[config.name] = [];
                    const idx = this.cache[config.name].findIndex(x => x[config.key] === item[config.key]);
                    
                    if (change.type === "added" || change.type === "modified") {
                        if (idx >= 0) {
                            // Only update if the item data has actually changed
                            if (JSON.stringify(this.cache[config.name][idx]) !== JSON.stringify(item)) {
                                this.cache[config.name][idx] = item;
                                updated = true;
                            }
                        } else {
                            this.cache[config.name].push(item);
                            updated = true;
                        }
                    } else if (change.type === "removed") {
                        if (idx >= 0) {
                            this.cache[config.name].splice(idx, 1);
                            updated = true;
                        }
                    }
                });
                if (updated) {
                    // Sync alias references in memory
                    this.cache['21 Detalle Presupuesto Producto'] = this.cache.detalle_productos;
                    this.cache['11 Detalle Mano de Obra'] = this.cache.detalle_mano_obra;
                    this.cache['30 Abonos Creditos'] = this.cache.abonos_credito;
                    this.cache['29 Movs de Inventario'] = this.cache.movs_inventario;
                    this.cache['43 Venta Rapida'] = this.cache.venta_rapida;
                    this.cache['46 Gastos'] = this.cache.gastos;
                    this.cache['45 Pagos VR'] = this.cache.pagos_vr;

                    if (this.activeUserUid) {
                        const prunedDb = { ...this.cache };
                        collectionConfigs.forEach(c => {
                            delete prunedDb[c.name];
                        });
                        delete prunedDb['21 Detalle Presupuesto Producto'];
                        delete prunedDb['11 Detalle Mano de Obra'];
                        delete prunedDb['30 Abonos Creditos'];
                        delete prunedDb['29 Movs de Inventario'];
                        delete prunedDb['43 Venta Rapida'];
                        delete prunedDb['46 Gastos'];
                        delete prunedDb['45 Pagos VR'];
                        await this.setStorageItem('mecanic_os_db', prunedDb);
                    } else {
                        await this.setStorageItem('mecanic_os_db', this.cache);
                    }
                    this.lastSyncedState = JSON.parse(JSON.stringify(this.cache));
                    // Solo refrescar UI si el cambio vino de otro dispositivo
                    if (isRemoteChange && typeof smartRefreshView === 'function') {
                        smartRefreshView(config.name);
                    } else if (isRemoteChange && typeof handleRouting === 'function') {
                        handleRouting();
                    }
                    // Siempre actualizar notificaciones
                    if (typeof updateNotifications === 'function') {
                        updateNotifications();
                    }
                }
            }, handleSyncError);
            this.listeners.push(listener);
        });
    },

    // Solo cancela los listeners de Firestore (NO limpia activeUserUid).
    // Llamar disconnect() para un cierre de sesión completo.
    stopSync() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
        // activeUserUid se preserva intencionalmente para que save() siga escribiendo
    },

    // Desconectar completamente (cierre de sesión / logout real)
    async disconnect() {
        this.stopSync();
        this.activeUserUid = null;
        this.workshopOwnerUid = null;
        this.readOnlyMode = false;
        
        // Limpieza profunda de memoria para evitar fugas o cruces de datos entre talleres
        if (this.cache) {
            collectionConfigs.forEach(config => {
                this.cache[config.name] = [];
            });
            this.cache['21 Detalle Presupuesto Producto'] = this.cache.detalle_productos;
            this.cache['11 Detalle Mano de Obra'] = this.cache.detalle_mano_obra;
            this.cache['30 Abonos Creditos'] = this.cache.abonos_credito;
            this.cache['29 Movs de Inventario'] = this.cache.movs_inventario;
            this.cache['43 Venta Rapida'] = this.cache.venta_rapida;
            this.cache['46 Gastos'] = this.cache.gastos;
            this.cache['45 Pagos VR'] = this.cache.pagos_vr;
            this.cache.config_taller = null;
            this.cache.saas_state = {
                status: 'guest',
                workshopData: null,
                termsSigned: false,
                signatureName: '',
                signedAt: null
            };
            this.cache.solicitudes_registro = [];
            this.cache.saas_payments = [];
        }
        await this.setStorageItem('mecanic_os_db', this.cache);
        await this.removeStorageItem('mecanic_os_workshop_uid');
        await this.removeStorageItem('mecanic_os_dte_config');
        await this.removeStorageItem('mecanic_os_firebase_config');
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
            saas_config: this.cache.saas_config || {},
            updatedAt: new Date().toISOString(),
            updatedBy: (typeof currentFirebaseUser !== 'undefined' && currentFirebaseUser) ? currentFirebaseUser.email : 'system-migration'
        }, { merge: true });

        // 2. Upload all collections in chunks of 100
        for (const config of collectionConfigs) {
            const items = this.cache[config.name] || [];
            for (let i = 0; i < items.length; i += 100) {
                const batch = db.batch();
                const chunk = items.slice(i, i + 100);
                chunk.forEach(item => {
                    const keyVal = item[config.key];
                    if (keyVal) {
                        const ref = docRef.collection(config.path).doc(keyVal.toString());
                        batch.set(ref, item);
                    }
                });
                await batch.commit();
            }
        }

        if (typeof showToast === 'function') {
            showToast("Migración a la nube completada exitosamente", "success");
        }
        console.log("Firestore Sync: Migration complete.");
    },

    // Clientes operations
    clientes: {
        async getAll() { return dataService.cache.clientes || []; },
        async save(cliente) {
            if (!dataService.cache.clientes) dataService.cache.clientes = [];
            const idx = dataService.cache.clientes.findIndex(c => c.Codigo_Cliente === cliente.Codigo_Cliente);
            if (idx >= 0) { dataService.cache.clientes[idx] = cliente; } else { dataService.cache.clientes.push(cliente); }
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
        async getAll() { return dataService.cache.vehiculos || []; },
        async save(vehiculo) {
            if (!dataService.cache.vehiculos) dataService.cache.vehiculos = [];
            const idx = dataService.cache.vehiculos.findIndex(v => v.ID_Vehiculo === vehiculo.ID_Vehiculo);
            if (idx >= 0) { dataService.cache.vehiculos[idx] = vehiculo; } else { dataService.cache.vehiculos.push(vehiculo); }
            await dataService.save(dataService.cache);
            return vehiculo;
        }
    },

    // Presupuestos operations
    presupuestos: {
        async getAll() { return dataService.cache.presupuestos || []; },
        async save(presupuesto) {
            if (!dataService.cache.presupuestos) dataService.cache.presupuestos = [];
            const idx = dataService.cache.presupuestos.findIndex(p => p['ID Presupuesto'] === presupuesto['ID Presupuesto']);
            if (idx >= 0) { dataService.cache.presupuestos[idx] = presupuesto; } else { dataService.cache.presupuestos.push(presupuesto); }
            await dataService.save(dataService.cache);
            return presupuesto;
        },
        async delete(id) {
            if (!dataService.cache.presupuestos) return;
            dataService.cache.presupuestos = dataService.cache.presupuestos.filter(p => p['ID Presupuesto'] !== id);
            await dataService.save(dataService.cache);
        }
    },

    // Global SaaS operations
    saas: {
        localOps: { reads: 0, writes: 0, deletes: 0 },
        syncTimeout: null,

        logOp(type, count = 1) {
            if (!this.localOps) this.localOps = { reads: 0, writes: 0, deletes: 0 };
            this.localOps[type] += count;
            if (!this.syncTimeout) {
                this.syncTimeout = setTimeout(() => {
                    this.syncOpsToCloud();
                }, 5000);
            }
        },

        async syncOpsToCloud() {
            this.syncTimeout = null;
            if (typeof dbFirestore === 'undefined' || !dbFirestore) return;
            try {
                const dateStr = new Date().toISOString().split('T')[0];
                const updates = {};
                let hasUpdates = false;
                
                if (this.localOps.reads > 0) {
                    updates.reads = firebase.firestore.FieldValue.increment(this.localOps.reads);
                    this.localOps.reads = 0;
                    hasUpdates = true;
                }
                if (this.localOps.writes > 0) {
                    updates.writes = firebase.firestore.FieldValue.increment(this.localOps.writes);
                    this.localOps.writes = 0;
                    hasUpdates = true;
                }
                if (this.localOps.deletes > 0) {
                    updates.deletes = firebase.firestore.FieldValue.increment(this.localOps.deletes);
                    this.localOps.deletes = 0;
                    hasUpdates = true;
                }
                
                if (hasUpdates) {
                    await dbFirestore.collection("saas_metrics").doc("quotas").collection("days").doc(dateStr).set(updates, { merge: true });
                }
            } catch (e) {
                console.error("Error syncing quota metrics:", e);
            }
        },

        async getPlans() {
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                try {
                    const snap = await dbFirestore.collection("saas_plans").get();
                    if (!snap.empty) {
                        dataService.saas.logOp('reads', snap.size || 1);
                        const plans = [];
                        snap.forEach(doc => plans.push(doc.data()));
                        dataService.cache.saas_plans = plans;
                        await dataService.setStorageItem('mecanic_os_db', dataService.cache);
                        return plans;
                    }
                } catch (e) {
                    console.error("Error fetching plans from Firestore:", e);
                }
            }
            return dataService.cache.saas_plans || [];
        },
        async getCoupons() {
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                try {
                    const snap = await dbFirestore.collection("saas_coupons").get();
                    if (!snap.empty) {
                        dataService.saas.logOp('reads', snap.size || 1);
                        const coupons = [];
                        snap.forEach(doc => coupons.push(doc.data()));
                        dataService.cache.saas_coupons = coupons;
                        await dataService.setStorageItem('mecanic_os_db', dataService.cache);
                        return coupons;
                    }
                } catch (e) {
                    console.error("Error fetching coupons from Firestore:", e);
                }
            }
            return dataService.cache.saas_coupons || [];
        },
        async savePlan(plan) {
            if (!dataService.cache.saas_plans) dataService.cache.saas_plans = [];
            const idx = dataService.cache.saas_plans.findIndex(p => p.id === plan.id);
            if (idx >= 0) {
                dataService.cache.saas_plans[idx] = plan;
            } else {
                dataService.cache.saas_plans.push(plan);
            }
            await dataService.setStorageItem('mecanic_os_db', dataService.cache);
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                try {
                    await dbFirestore.collection("saas_plans").doc(plan.id).set(plan);
                    dataService.saas.logOp('writes', 1);
                } catch (e) {
                    console.error("Error saving plan to Firestore:", e);
                }
            }
        },
        async deletePlan(planId) {
            if (dataService.cache.saas_plans) {
                dataService.cache.saas_plans = dataService.cache.saas_plans.filter(p => p.id !== planId);
                await dataService.setStorageItem('mecanic_os_db', dataService.cache);
            }
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                try {
                    await dbFirestore.collection("saas_plans").doc(planId).delete();
                    dataService.saas.logOp('deletes', 1);
                } catch (e) {
                    console.error("Error deleting plan from Firestore:", e);
                }
            }
        },
        async saveCoupon(coupon) {
            if (!dataService.cache.saas_coupons) dataService.cache.saas_coupons = [];
            const idx = dataService.cache.saas_coupons.findIndex(c => c.codigo === coupon.codigo);
            if (idx >= 0) {
                dataService.cache.saas_coupons[idx] = coupon;
            } else {
                dataService.cache.saas_coupons.push(coupon);
            }
            await dataService.setStorageItem('mecanic_os_db', dataService.cache);
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                try {
                    await dbFirestore.collection("saas_coupons").doc(coupon.codigo).set(coupon);
                    dataService.saas.logOp('writes', 1);
                } catch (e) {
                    console.error("Error saving coupon to Firestore:", e);
                }
            }
        },
        async deleteCoupon(code) {
            if (dataService.cache.saas_coupons) {
                dataService.cache.saas_coupons = dataService.cache.saas_coupons.filter(c => c.codigo !== code);
                await dataService.setStorageItem('mecanic_os_db', dataService.cache);
            }
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                try {
                    await dbFirestore.collection("saas_coupons").doc(code).delete();
                    dataService.saas.logOp('deletes', 1);
                } catch (e) {
                    console.error("Error deleting coupon from Firestore:", e);
                }
            }
        },
        async createRequest(requestData) {
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                try {
                    await dbFirestore.collection("saas_requests").doc(requestData.id).set(requestData);
                    dataService.saas.logOp('writes', 1);
                } catch (e) {
                    console.error("Error creating request in Firestore:", e);
                    throw e;
                }
            } else {
                if (!dataService.cache.solicitudes_registro) dataService.cache.solicitudes_registro = [];
                dataService.cache.solicitudes_registro.push(requestData);
                await dataService.setStorageItem('mecanic_os_db', dataService.cache);
            }
        },
        async updateRequestStatus(requestId, status, additionalData = {}) {
            const updateObj = { status, ...additionalData };
            if (dataService.cache.solicitudes_registro) {
                const req = dataService.cache.solicitudes_registro.find(s => s.id === requestId);
                if (req) {
                    Object.assign(req, updateObj);
                    await dataService.setStorageItem('mecanic_os_db', dataService.cache);
                }
            }
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                try {
                    await dbFirestore.collection("saas_requests").doc(requestId).update(updateObj);
                    dataService.saas.logOp('writes', 1);
                } catch (e) {
                    console.error("Error updating request status in Firestore:", e);
                    try {
                        await dbFirestore.collection("saas_requests").doc(requestId).set(updateObj, { merge: true });
                        dataService.saas.logOp('writes', 1);
                    } catch (err2) {
                        console.error("Fallback set merge failed:", err2);
                        throw err2;
                    }
                }
            }
        },
        listenRequest(requestId, callback) {
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                return dbFirestore.collection("saas_requests").doc(requestId).onSnapshot((doc) => {
                    if (doc.exists) {
                        callback(doc.data());
                    } else {
                        callback(null);
                    }
                }, (err) => {
                    console.error("listenRequest error:", err);
                });
            } else {
                const interval = setInterval(() => {
                    const req = (dataService.cache.solicitudes_registro || []).find(s => s.id === requestId);
                    callback(req || null);
                }, 1000);
                return () => clearInterval(interval);
            }
        },
        listenRequests(callback) {
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                return dbFirestore.collection("saas_requests").orderBy("createdAt", "desc").onSnapshot(async (snapshot) => {
                    const requests = [];
                    snapshot.forEach(doc => {
                        requests.push(doc.data());
                    });
                    dataService.cache.solicitudes_registro = requests;
                    await dataService.setStorageItem('mecanic_os_db', dataService.cache);
                    callback(requests);
                }, (err) => {
                    console.error("listenRequests error:", err);
                    callback(dataService.cache.solicitudes_registro || []);
                });
            } else {
                callback(dataService.cache.solicitudes_registro || []);
                return () => {};
            }
        }
    }
};
