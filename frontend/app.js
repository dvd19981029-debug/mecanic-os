/**
 * Mecanic OS - Core Application Engine
 * Premium Workshop & Electronic Invoicing Management System
 */

import { 
    showToast, 
    escapeHtml, 
    hashPassword, 
    encryptString, 
    decryptString, 
    sanitizeBackendUrl, 
    getBackendUrl, 
    downloadExcelReport,
    html,
    safe
} from './js/utils.js?v=23';

import {
    calculateElSalvadorPeriodPayroll,
    getBudgetGrandTotal,
    getClientPendingBalance
} from './js/businessLogic.js?v=23';

import {
    updateUserUI,
    updateSidebarBrand,
    startClock,
    updateNotifications,
    updateCloudStatusUI,
    setupMunicipiosSelect,
    setupOfficialCatalogsSelect,
    getGirosOptionsHtml,
    getValidEconomicActivityCode
} from './js/ui.js?v=23';

// Expose critical functions globally to window for legacy compatibility
window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.hashPassword = hashPassword;
window.encryptString = encryptString;
window.decryptString = decryptString;
window.getBackendUrl = getBackendUrl;
window.downloadExcelReport = downloadExcelReport;
window.getDatabase = getDatabase;
window.smartRefreshView = smartRefreshView;
window.updateNotifications = updateNotifications;
window.html = html;
window.safe = safe;
window.initSecureDteConfig = initSecureDteConfig;

window.calculateElSalvadorPeriodPayroll = calculateElSalvadorPeriodPayroll;
window.getBudgetGrandTotal = getBudgetGrandTotal;
window.getClientPendingBalance = getClientPendingBalance;
window.updateUserUI = updateUserUI;
window.updateSidebarBrand = updateSidebarBrand;
window.startClock = startClock;
window.updateCloudStatusUI = updateCloudStatusUI;
window.setupMunicipiosSelect = setupMunicipiosSelect;
window.setupOfficialCatalogsSelect = setupOfficialCatalogsSelect;
window.getGirosOptionsHtml = getGirosOptionsHtml;
window.getValidEconomicActivityCode = getValidEconomicActivityCode;

// Embedded Database from Grupo Gema
const DEFAULT_DATABASE = {
  "clientes": [],
  "vehiculos": [],
  "productos": [],
  "mano_obra": [],
  "presupuestos": [],
  "revisiones": [],
  "tecnicos": []
};

// Encryption and decryption helper utilities for localStorage security
function getSessionKey() {
    return sessionStorage.getItem('mecanic_os_session_key') || '';
}

let cachedDteConfig = null;

async function initSecureDteConfig() {
    const key = getSessionKey();
    const raw = localStorage.getItem('mecanic_os_dte_config');
    if (!raw) {
        cachedDteConfig = { apiKey: '', ambiente: '00', mhCode: '0001', posNumber: '1', backendUrl: '' };
        return;
    }
    
    if (raw.trim().startsWith('{')) {
        try {
            cachedDteConfig = JSON.parse(raw);
            if (key) {
                // Migrate to AES-256 in background
                await setSecureDteConfig(cachedDteConfig);
            }
        } catch (e) {
            cachedDteConfig = { apiKey: '', ambiente: '00', mhCode: '0001', posNumber: '1', backendUrl: '' };
        }
        return;
    }
    
    if (key) {
        try {
            const decrypted = await decryptString(raw, key);
            cachedDteConfig = JSON.parse(decrypted);
        } catch (e) {
            console.error("Error decrypting DTE config:", e);
            cachedDteConfig = { apiKey: '', ambiente: '00', mhCode: '0001', posNumber: '1', backendUrl: '' };
        }
    } else {
        cachedDteConfig = { apiKey: '', ambiente: '00', mhCode: '0001', posNumber: '1', backendUrl: '' };
    }
}

function getSecureDteConfig() {
    if (cachedDteConfig) {
        return cachedDteConfig;
    }
    const raw = localStorage.getItem('mecanic_os_dte_config');
    if (!raw) return { apiKey: '', ambiente: '00', mhCode: '0001', posNumber: '1', backendUrl: '' };
    if (raw.trim().startsWith('{')) {
        try {
            cachedDteConfig = JSON.parse(raw);
            return cachedDteConfig;
        } catch (e) {}
    }
    return { apiKey: '', ambiente: '00', mhCode: '0001', posNumber: '1', backendUrl: '' };
}

async function setSecureDteConfig(config) {
    cachedDteConfig = config;
    const key = getSessionKey();
    const jsonStr = JSON.stringify(config);
    if (key) {
        const encrypted = await encryptString(jsonStr, key);
        localStorage.setItem('mecanic_os_dte_config', encrypted);
    } else {
        localStorage.setItem('mecanic_os_dte_config', jsonStr);
    }
}

function generateUserSignature(user) {
    if (!user) return '';
    const secret = localStorage.getItem('mecanic_os_workshop_uid') || 'mecanic_os_secret_salt';
    const payload = `${user.Nombre_Completo || ''}|${user.Nivel_Acceso || ''}|${user.Tecnico_ID || user.Codigo_Cliente || ''}|${secret}`;
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
        const char = payload.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

// Database Initialization in LocalStorage
async function initDatabase() {
    try {
        // Migration: Clear any old mock databases on first load
        if (!localStorage.getItem('mecanic_os_db_cleared_v3')) {
            localStorage.removeItem('mecanic_os_db');
            localStorage.removeItem('mecanic_os_pos_cart');
            localStorage.removeItem('mecanic_os_dte_config');
            localStorage.removeItem('mecanic_os_firebase_config');
            setActiveUser(null);
            localStorage.setItem('mecanic_os_db_cleared_v3', 'true');
            window.location.hash = 'landing';
            window.location.reload();
            return;
        }
        
        // Check for auxiliary data
        if (!localStorage.getItem('mecanic_os_pos_cart')) {
            localStorage.setItem('mecanic_os_pos_cart', JSON.stringify([]));
        }

        if (!localStorage.getItem('mecanic_os_dte_config')) {
            await setSecureDteConfig({
                apiKey: '',
                ambiente: '00',
                mhCode: '0001',
                posNumber: '1',
                backendUrl: ''
            });
        }
    } catch (e) {
        console.warn("Storage settings could not be set/read:", e);
    }

    // Initialize/Decrypt DTE config from local storage in memory cache
    try {
        await initSecureDteConfig();
    } catch (e) {
        console.warn("DTE Config could not be decrypted:", e);
    }

    // Auto-migration: hash existing plain-text technician passwords/PINs
    try {
        const db = getDatabase();
        if (db && db.tecnicos && Array.isArray(db.tecnicos)) {
            let migrated = false;
            for (let i = 0; i < db.tecnicos.length; i++) {
                const t = db.tecnicos[i];
                if (t.Contraseña && t.Contraseña.length < 64) {
                    t.Contraseña = await hashPassword(t.Contraseña);
                    migrated = true;
                }
            }
            if (migrated) {
                console.log("Database Migration: Plain-text passwords successfully hashed to SHA-256.");
                await saveDatabase(db);
            }
        }
    } catch (e) {
        console.error("Migration error:", e);
    }
}

function getDatabase() {
    return dataService.cache || {
        clientes: [],
        vehiculos: [],
        presupuestos: [],
        revisiones: [],
        tecnicos: [],
        saas_state: { status: 'guest' },
        cajas_sesiones: [],
        detalle_productos: [],
        detalle_mano_obra: [],
        promociones: [],
        proveedores: [],
        gastos: [],
        compras: [],
        abonos_proveedores: []
    };
}

async function saveDatabase(db) {
    await dataService.save(db);
}

// ----------------------------------------------------
// GOOGLE FIREBASE REAL-TIME SYNC ENGINE
// ----------------------------------------------------

let isFirebaseConnected = false;
let dbFirestore = null;
let currentFirebaseUser = null;

Object.defineProperty(window, 'dbFirestore', {
    get() { return dbFirestore; },
    set(val) { dbFirestore = val; },
    configurable: true
});

Object.defineProperty(window, 'isFirebaseConnected', {
    get() { return isFirebaseConnected; },
    set(val) { isFirebaseConnected = val; },
    configurable: true
});

Object.defineProperty(window, 'currentFirebaseUser', {
    get() { return currentFirebaseUser; },
    set(val) { currentFirebaseUser = val; },
    configurable: true
});

let firebaseUnsubscribe = null;
let preventFirestoreSync = false;
let lastSyncTime = null;

// Default Firebase Configuration (Centralized SaaS)
const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCjim6oYgaTPAy4kg_MvnrEKVW2KDu0Pz4",
    authDomain: "gema-661cb.firebaseapp.com",
    projectId: "gema-661cb",
    storageBucket: "gema-661cb.firebasestorage.app",
    messagingSenderId: "817173968961",
    appId: "1:817173968961:web:17d976e69f85893886aec0"
};

function getFirebaseConfig() {
    let customCfg = null;
    try {
        customCfg = JSON.parse(localStorage.getItem('mecanic_os_firebase_config'));
    } catch (e) {}
    return customCfg || DEFAULT_FIREBASE_CONFIG;
}

function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn("Firebase SDK no cargado (offline o sin script). Iniciando en modo offline.");
        updateCloudStatusUI(false, "offline");
        return;
    }

    const config = getFirebaseConfig();
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(config);
        }
        dbFirestore = firebase.firestore();
        isFirebaseConnected = true;
    } catch (err) {
        console.error("Error al inicializar Firebase:", err);
        updateCloudStatusUI(false, "offline");
    }
}

function initFirebaseAuthListener() {
    if (typeof firebase === 'undefined') return;
    
    try {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user && !user.isAnonymous) {
                // --- Dueño del taller autenticado con Firebase ---
                currentFirebaseUser = user;
                // Guardar UID del taller para que empleados puedan conectarse
                localStorage.setItem('mecanic_os_workshop_uid', user.uid);
                updateCloudStatusUI(true, "active");
                dataService.startSync(user.uid, false); // false = puede escribir
                await dataService.checkAndMigrate(user.uid);
            } else if (user && user.isAnonymous) {
                // --- Empleado con sesión anónima de Firebase ---
                // Buscar el UID del taller del dueño (guardado en localStorage)
                const workshopUid = getWorkshopOwnerUid();
                if (workshopUid) {
                    currentFirebaseUser = user; // Para que Firestore acepte las peticiones
                    updateCloudStatusUI(true, "active");
                    dataService.startSync(workshopUid, true); // true = modo empleado
                    console.log('Mecanic OS: Empleado conectado en tiempo real al taller:', workshopUid);
                } else {
                    // No hay taller configurado en este dispositivo
                    currentFirebaseUser = null;
                    updateCloudStatusUI(false, "logged-out");
                    dataService.disconnect(); // Logout completo
                }
            } else {
                // --- Sin sesión Firebase ---
                currentFirebaseUser = null;
                const workshopUid = getWorkshopOwnerUid();
                if (workshopUid) {
                    // Si no hay sesión Firebase, se mantiene en modo lectura/local con cache
                    dataService.startSync(workshopUid, true); // true = employeeMode (lectura)
                    updateCloudStatusUI(true, "offline");
                } else {
                    updateCloudStatusUI(false, "logged-out");
                    dataService.disconnect(); // Logout completo, sin taller
                }
            }
        });
    } catch (err) {
        console.error("Error al registrar el listener de autenticación:", err);
    }
}

// Obtener el UID del dueño del taller activo en este dispositivo
function getWorkshopOwnerUid() {
    // 1. Primero buscar en localStorage (puesto por el dueño al hacer login)
    const stored = localStorage.getItem('mecanic_os_workshop_uid');
    if (stored) return stored;
    // 2. Buscar en el saas_state del cache
    const db = dataService && dataService.cache;
    if (db && db.saas_state && db.saas_state.status === 'active' && db.saas_state.workshopData && db.saas_state.workshopData.uid) {
        const uid = db.saas_state.workshopData.uid;
        localStorage.setItem('mecanic_os_workshop_uid', uid); // Guardar para uso futuro
        return uid;
    }
    return null;
}

// Helper function to check if the user is in the middle of editing, typing, or has active unsaved form sessions
function isUserEditing() {
    // 1. Check if user is actively focused on any input/select/textarea
    if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return true;
    }
    
    // 2. Check if there are active search queries in search inputs (to prevent clearing search results)
    const searchInputs = document.querySelectorAll('input');
    for (const input of searchInputs) {
        const id = (input.id || '').toLowerCase();
        const className = (input.className || '').toLowerCase();
        if ((id.includes('search') || className.includes('search') || input.type === 'search') && input.value.trim() !== '') {
            return true;
        }
    }
    
    const hash = window.location.hash;
    
    // 3. Check if user is in budget editor
    if (hash.includes('presupuestos?id=') || hash.includes('presupuestos?action=new')) {
        return true;
    }
    
    // 4. Check if user is in DTE invoice workspace
    if (hash.includes('facturador?presId=')) {
        return true;
    }
    
    // 5. Check if user is in active inspection sheet
    if (hash.includes('revision-21') && window.saasActiveInspeccionTab === 'registrar') {
        return true;
    }
    
    // 6. Check if user is in quick sale POS
    if (hash.includes('venta-rapida')) {
        return true;
    }
    
    // 7. Check if any modal is currently open
    const activeModals = document.querySelectorAll('.modal');
    for (const modal of activeModals) {
        if (modal.classList.contains('active') || modal.classList.contains('show') || (modal.style.display && modal.style.display !== 'none')) {
            return true;
        }
    }
    
    return false;
}

// Refresh inteligente: cuando Firestore detecta cambios de otro dispositivo,
// refresca la vista actual sin interrumpir al usuario si está en un formulario activo.
let _smartRefreshDebounce = null;
function smartRefreshView(changedCollection) {
    // Debounce: agrupar múltiples cambios simultáneos en una sola actualización
    clearTimeout(_smartRefreshDebounce);
    _smartRefreshDebounce = setTimeout(() => {
        const currentHash = window.location.hash.substring(1).split('?')[0];
        
        // Mapeo: qué colecciones afectan a qué vistas
        const collectionViewMap = {
            'clientes': ['clientes-vehiculos', 'taller-dashboard', 'cuentas-cobrar', 'facturador'],
            'vehiculos': ['clientes-vehiculos', 'taller-dashboard'],
            'presupuestos': ['presupuestos', 'kanban', 'taller-dashboard', 'cuentas-cobrar', 'dashboard-bi'],
            'detalle_productos': ['presupuestos', 'inventario'],
            'detalle_mano_obra': ['presupuestos'],
            'productos': ['inventario', 'presupuestos', 'venta-rapida', 'taller-dashboard'],
            'mano_obra': ['presupuestos', 'revision-21'],
            'revisiones': ['revision-21', 'taller-dashboard', 'kanban'],
            'tecnicos': ['configuracion', 'planilla'],
            'abonos_credito': ['cuentas-cobrar', 'presupuestos'],
            'movs_inventario': ['inventario'],
            'venta_rapida': ['venta-rapida', 'taller-dashboard', 'dashboard-bi'],
            'gastos': ['gastos', 'dashboard-bi'],
            'pagos_vr': ['venta-rapida'],
        };
        
        const affectedViews = collectionViewMap[changedCollection] || [];
        const viewNeedsRefresh = affectedViews.includes(currentHash);
        
        if (viewNeedsRefresh) {
            // Si el usuario está editando activamente o tiene un formulario/búsqueda abierta,
            // no refrescamos la vista actual para evitar interrumpirle y que pierda datos.
            if (isUserEditing()) {
                console.log("smartRefreshView: Se omitió el refresco de pantalla para proteger la sesión de edición activa del usuario.");
            } else {
                // Mostrar toast discreto informando del cambio
                if (typeof showToast === 'function') {
                    showToast('🔄 Datos actualizados desde otro dispositivo', 'info');
                }
                // Re-renderizar la vista actual
                if (typeof handleRouting === 'function') {
                    handleRouting();
                }
            }
        }
        
        // Siempre actualizar notificaciones y sidebar
        if (typeof updateNotifications === 'function') updateNotifications();
        if (typeof updateSidebarBrand === 'function') updateSidebarBrand();
    }, 300); // Esperar 300ms para agrupar cambios
}







const DEPARTAMENTOS_CODES = {
    "Ahuachapán": "01",
    "Santa Ana": "02",
    "Sonsonate": "03",
    "Chalatenango": "04",
    "La Libertad": "05",
    "San Salvador": "06",
    "Cuscatlán": "07",
    "La Paz": "08",
    "Cabañas": "09",
    "San Vicente": "10",
    "Usulután": "11",
    "San Miguel": "12",
    "Morazán": "13",
    "La Unión": "14"
};

const MUNICIPIOS_CODES = {
    "Ahuachapán Norte": "13", "Ahuachapán Centro": "14", "Ahuachapán Sur": "15",
    "Santa Ana Norte": "14", "Santa Ana Centro": "15", "Santa Ana Este": "16", "Santa Ana Oeste": "17",
    "Sonsonate Norte": "17", "Sonsonate Centro": "18", "Sonsonate Este": "19", "Sonsonate Oeste": "20",
    "Chalatenango Norte": "34", "Chalatenango Centro": "35", "Chalatenango Sur": "36",
    "La Libertad Norte": "23", "La Libertad Centro": "24", "La Libertad Oeste": "25", "La Libertad Este": "26", "La Libertad Costa": "27", "La Libertad Sur": "28",
    "San Salvador Norte": "20", "San Salvador Oeste": "21", "San Salvador Este": "22", "San Salvador Centro": "23", "San Salvador Sur": "24",
    "Cuscatlán Norte": "17", "Cuscatlán Sur": "18",
    "La Paz Oeste": "23", "La Paz Centro": "24", "La Paz Este": "25",
    "Cabañas Oeste": "10", "Cabañas Este": "11",
    "San Vicente Norte": "14", "San Vicente Sur": "15",
    "Usulután Norte": "24", "Usulután Este": "25", "Usulután Oeste": "26",
    "San Miguel Norte": "21", "San Miguel Centro": "22", "San Miguel Oeste": "23",
    "Morazán Norte": "27", "Morazán Sur": "28",
    "La Unión Norte": "19", "La Unión Sur": "20"
};





async function emitSubscriptionDTE(payment, workshop) {
    if (!workshop) return;
    
    const isCCF = !!(workshop.nrc && workshop.nrc.trim() !== '');
    const docType = isCCF ? 'ccf' : 'fc';
    
    const deptName = workshop.departamento || 'San Salvador';
    const muniName = workshop.municipio || 'San Salvador Centro';
    const deptCode = DEPARTAMENTOS_CODES[deptName] || '06';
    
    const muniNameUpper = muniName.trim().toUpperCase();
    const matchedMuniKey = Object.keys(MUNICIPIOS_CODES).find(k => k.toUpperCase() === muniNameUpper);
    const muniCode = matchedMuniKey ? MUNICIPIOS_CODES[matchedMuniKey] : '23';
    
    const cleanPhone = (workshop.telefono || '').replace(/\D/g, '').slice(0, 8);
    const docNumClean = (workshop.num_documento || workshop.nit || '000000000').replace(/\D/g, '');
    
    const finalPrice = parseFloat(payment.monto || 0);
    const subtotal = isCCF ? parseFloat((finalPrice / 1.13).toFixed(2)) : finalPrice;
    
    const dteId = generateUUID();
    
    let recipientPayload = {
        name: workshop.nombre || 'Workshop Owner',
        email: workshop.correo || 'facturacion@mecanicos.com',
        address: {
            department: deptCode,
            municipality: muniCode,
            complement: (workshop.direccion || 'San Salvador').substring(0, 200)
        }
    };
    
    if (cleanPhone.length === 8) {
        recipientPayload.phone = cleanPhone;
    }
    
    if (isCCF) {
        recipientPayload.contributorType = workshop.tipo_persona === 'Jurídica' ? 'JURIDICA' : 'NATURAL';
        recipientPayload.economicActivity = getValidEconomicActivityCode(workshop.actividad_economica);
        recipientPayload.nrc = workshop.nrc.replace(/\D/g, '').slice(0, 8);
        recipientPayload.identificationDocument = {
            type: workshop.tipo_documento === 'DUI' ? 'DUI' : 'NIT',
            number: docNumClean
        };
    } else {
        recipientPayload.identificationDocument = {
            type: workshop.tipo_documento === 'DUI' ? 'DUI' : 'NIT',
            number: docNumClean
        };
    }
    
    const dtePayload = {
        id: dteId,
        paymentType: 'CONTADO',
        branchOffice: {
            mhCode: '0001',
            posNumber: 1
        },
        recipient: recipientPayload,
        items: [
            {
                type: 'SERVICIOS',
                description: `Suscripción Mensual Mecanic OS - Plan ${workshop.plan || 'Pro'}`,
                quantity: 1,
                unitPrice: subtotal,
                saleType: 'GRAVADA'
            }
        ]
    };
    const db = getDatabase();
    const SAAS_DTE_API_KEY = (db.saas_config && db.saas_config.dte && db.saas_config.dte.apiKey) || 'test_sk_mecanicos_default_sandbox_key_998877';
    
    console.log(`DTE Emission: Transmitting ${docType.toUpperCase()} for SaaS subscription:`, dtePayload);
    
    try {
        const response = await fetch(`${getBackendUrl(db)}/api/dte`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: SAAS_DTE_API_KEY,
                docType: docType,
                payload: dtePayload
            })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || errData.error || 'Error de FacturaLlama');
        }
        
        const resData = await response.json();
        console.log("DTE Emission: Success:", resData);
        
        payment.dte = {
            generationCode: resData.generationCode || resData.id || dteId,
            controlNumber: resData.controlNumber || `DTE-${docType.toUpperCase()}-M001P001-${Math.floor(Math.random()*90000 + 10000)}`,
            receptionSeal: resData.receptionSeal || `${Math.floor(Math.random()*9000000)}-APPROVED`,
            mhDteUrl: resData.mhDteUrl || `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${resData.generationCode || dteId}&fechaEmi=${new Date().toISOString().split('T')[0]}`
        };
        
        const db = getDatabase();
        if (db.saas_payments) {
            const idx = db.saas_payments.findIndex(p => p.id === payment.id);
            if (idx >= 0) {
                db.saas_payments[idx] = payment;
                saveDatabase(db);
            }
        }
        
        showToast(`Factura Electrónica (${docType.toUpperCase()}) emitida y certificada por Hacienda`, "success");
    } catch (err) {
        console.error("DTE Emission Failed:", err);
        showToast("No se pudo certificar el DTE con Hacienda: " + err.message, "warning");
    }
}


async function performUnifiedLogin(email, pass, btn, onComplete) {
    if (typeof firebase === 'undefined') {
        if (typeof onComplete === 'function') onComplete(false);
        return;
    }

    const db = getDatabase();
    const hashedPass = await hashPassword(pass);
    let localTech = (db.tecnicos || []).find(t => (t.Email || '').toLowerCase() === email.toLowerCase() && (t.Contraseña === hashedPass || t.Contraseña === pass));
    if (localTech && localTech.Contraseña === pass) {
        localTech.Contraseña = hashedPass;
        saveDatabase(db);
    }

    const proceedAsAdmin = () => {
        firebase.auth().signInWithEmailAndPassword(email, pass)
            .then((userCredential) => {
                const ownerUid = userCredential.user.uid;
                localStorage.setItem('mecanic_os_workshop_uid', ownerUid);
                sessionStorage.setItem('mecanic_os_session_key', hashedPass);
                
                dataService.startSync(ownerUid, false); // false = admin mode
                
                const db = getDatabase();
                db.saas_state = db.saas_state || {};
                db.saas_state.status = 'active';
                db.saas_state.workshopData = db.saas_state.workshopData || {};
                db.saas_state.workshopData.uid = ownerUid;
                db.saas_state.workshopData.correo = email;
                db.saas_state.termsSigned = true;
                saveDatabase(db);
                
                // Do not set active user directly, let them select their profile from the lock screen (streaming-style)
                setActiveUser(null);
                
                showToast("Taller conectado correctamente", "success");
                if (typeof onComplete === 'function') onComplete(true);
            })
            .catch((error) => {
                console.error("Error al iniciar sesión como admin:", error);
                showToast("Usuario o contraseña incorrectos", "error");
                if (typeof onComplete === 'function') onComplete(false);
            });
    };

    // 1. Check local database first (extremely robust, supports offline, case-insensitive and bypasses index issues)
    if (localTech) {
        const workshopUid = localStorage.getItem('mecanic_os_workshop_uid') || (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.uid);
        if (workshopUid) {
            // Ya no hacemos login anónimo. Usamos la sesión activa del dueño (si existe).
            const db = getDatabase();
            db.saas_state = db.saas_state || {};
            db.saas_state.status = 'active';
            db.saas_state.workshopData = db.saas_state.workshopData || {};
            db.saas_state.workshopData.uid = workshopUid;
            db.saas_state.termsSigned = true;
            saveDatabase(db);
            
            sessionStorage.setItem('mecanic_os_session_key', hashedPass);
            dataService.startSync(workshopUid, true); // true = employeeMode
            setActiveUser(localTech);
            
            showToast(`Sesión iniciada correctamente como ${localTech.Nombre_Completo}`, "success");
            if (typeof onComplete === 'function') onComplete(true);
            return;
        }
    }

    // 2. Query Firestore if not found in local db
    if (typeof dbFirestore !== 'undefined' && dbFirestore && firebase.auth().currentUser) {
        const workshopUid = localStorage.getItem('mecanic_os_workshop_uid') || (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.uid);
        
        const queryFirestoreCollection = (colRef) => {
            return colRef.where("Email", "==", email).get()
                .then((snapshot) => {
                    let matchedTech = null;
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.Contraseña === hashedPass || data.Contraseña === pass) {
                            matchedTech = { data, ref: doc.ref };
                            if (data.Contraseña === pass) {
                                doc.ref.update({ Contraseña: hashedPass }).catch(e => console.error("Error migrating Firestore password:", e));
                            }
                        }
                    });
                    return matchedTech;
                });
        };

        const handleMatchedTech = (matchedTech) => {
            const pathSegments = matchedTech.ref.path.split('/');
            const targetWorkshopUid = pathSegments[1];
            
            localStorage.setItem('mecanic_os_workshop_uid', targetWorkshopUid);
            sessionStorage.setItem('mecanic_os_session_key', hashedPass);
            
            const db = getDatabase();
            db.saas_state = db.saas_state || {};
            db.saas_state.status = 'active';
            db.saas_state.workshopData = db.saas_state.workshopData || {};
            db.saas_state.workshopData.uid = targetWorkshopUid;
            db.saas_state.termsSigned = true;
            saveDatabase(db);
            
            dataService.startSync(targetWorkshopUid, true); // true = employeeMode
            setActiveUser(matchedTech.data);
            
            showToast(`Sesión iniciada correctamente como ${matchedTech.data.Nombre_Completo}`, "success");
            if (typeof onComplete === 'function') onComplete(true);
        };

        const handleCollectionGroupFallback = () => {
            return dbFirestore.collectionGroup("tecnicos")
                .where("Email", "==", email)
                .get()
                .then(snapshot => {
                    let collectionGroupTech = null;
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (data.Contraseña === hashedPass || data.Contraseña === pass) {
                            collectionGroupTech = { data, ref: doc.ref };
                            if (data.Contraseña === pass) {
                                doc.ref.update({ Contraseña: hashedPass }).catch(e => console.error("Error migrating collectionGroup password:", e));
                            }
                        }
                    });
                    if (collectionGroupTech) {
                        handleMatchedTech(collectionGroupTech);
                    } else {
                        proceedAsAdmin();
                    }
                })
                .catch((err) => {
                    console.error("Error en collectionGroup para login de técnico:", err);
                    proceedAsAdmin();
                });
        };

        if (workshopUid) {
            queryFirestoreCollection(dbFirestore.collection("workshops").doc(workshopUid).collection("tecnicos"))
                .then(matchedTech => {
                    if (matchedTech) {
                        handleMatchedTech(matchedTech);
                    } else {
                        handleCollectionGroupFallback();
                    }
                })
                .catch((err) => {
                    console.error("Error buscando en colección de técnicos local del taller:", err);
                    handleCollectionGroupFallback();
                });
        } else {
            handleCollectionGroupFallback();
        }
    } else {
        // Fallback: Si no hay conexión o no hay sesión de Firebase activa, intentamos directamente proceedAsAdmin
        proceedAsAdmin();
    }
}

function bindFirebaseEvents() {
    const cloudIndicator = document.getElementById('cloud-sync-indicator');
    const authModal = document.getElementById('firebase-auth-modal');
    const closeBtn = document.getElementById('close-firebase-modal');
    const showRegister = document.getElementById('fb-show-register');
    const showLogin = document.getElementById('fb-show-login');
    const loginForm = document.getElementById('fb-login-form');
    const registerForm = document.getElementById('fb-register-form');
    const logoutBtn = document.getElementById('fb-btn-logout');

    if (!authModal) return;

    // Tabs logic
    const tabLogin = document.getElementById('fb-tab-login');
    const tabRegister = document.getElementById('fb-tab-register');

    const loginSection = document.getElementById('fb-login-section');
    const registerSection = document.getElementById('fb-register-section');

    function switchTab(activeTab, activeSection) {
        [tabLogin, tabRegister].forEach(tab => {
            if (tab) {
                tab.style.background = 'transparent';
                tab.style.color = 'var(--text-secondary)';
            }
        });
        [loginSection, registerSection].forEach(sec => {
            if (sec) sec.style.display = 'none';
        });

        if (activeTab) {
            activeTab.style.background = 'var(--primary)';
            activeTab.style.color = '#fff';
        }
        if (activeSection) {
            activeSection.style.display = 'block';
        }
    }

    if (tabLogin) tabLogin.addEventListener('click', () => switchTab(tabLogin, loginSection));
    if (tabRegister) tabRegister.addEventListener('click', () => switchTab(tabRegister, registerSection));

    if (cloudIndicator) {
        cloudIndicator.addEventListener('click', () => {
            authModal.classList.add('active');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            authModal.classList.remove('active');
        });
    }

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tabRegister, registerSection);
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tabLogin, loginSection);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('fb-login-email').value.trim();
            const pass = document.getElementById('fb-login-password').value;
            const btn = document.getElementById('fb-btn-login');
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Iniciando...';
            
            performUnifiedLogin(email, pass, btn, (success) => {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';
                if (success) {
                    authModal.classList.remove('active');
                    window.location.hash = 'taller-dashboard';
                    handleRouting();
                }
            });
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('fb-register-name').value;
            const email = document.getElementById('fb-register-email').value;
            const pass = document.getElementById('fb-register-password').value;
            
            if (typeof firebase === 'undefined') return;
            
            const btn = document.getElementById('fb-btn-register');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando cuenta...';
            
            firebase.auth().createUserWithEmailAndPassword(email, pass)
                .then((userCredential) => {
                    showToast("Taller registrado y conectado exitosamente", "success");
                    
                    const db = getDatabase();
                    if (db) {
                        if (!db.config_taller) db.config_taller = {};
                        db.config_taller.nombre = name;
                        db.config_taller.correo = email;
                        saveDatabase(db);
                    }
                    
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Crear Cuenta y Taller';
                    authModal.classList.remove('active');
                })
                .catch((error) => {
                    console.error("Error al registrar:", error);
                    showToast(`Error: ${error.message}`, "error");
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Crear Cuenta y Taller';
                });
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof firebase === 'undefined') return;
            
            const msg = "¿Seguro que deseas cerrar la sesión en este dispositivo? Se desconectará por completo del taller.";
            
            if (confirm(msg)) {
                setActiveUser(null);
                
                // Disconnect safely to prevent deleting cloud settings
                dataService.disconnect().then(() => {
                    if (typeof firebase !== 'undefined') {
                        firebase.auth().signOut()
                            .then(() => {
                                showToast("Sesión cerrada correctamente", "success");
                                authModal.classList.remove('active');
                                window.location.hash = 'landing';
                                handleRouting();
                            })
                            .catch(err => {
                                console.error("Error al cerrar sesión:", err);
                            });
                    } else {
                        showToast("Sesión cerrada correctamente", "success");
                        authModal.classList.remove('active');
                        window.location.hash = 'landing';
                        handleRouting();
                    }
                });
            }
        });
    }
}

function getWorkshopConfig(db) {
    if (!db || !db.config_taller) {
        return {
            nombre: 'GRUPO GEMA, S.A. DE C.V.',
            alias: 'Grupo Gema',
            nombre_comercial: 'Grupo Gema Taller',
            giro: 'Servicio de Mantenimiento al Transporte Terrestre',
            direccion: 'Carr. Sonsonate, col. Cuyagualo #16, Colon, La Libertad',
            telefono: '7625-0906',
            correo: 'grupogem2024@outlook.com',
            nit: '0614-111111-101-1',
            nrc: '123456-7',
            logoText: 'GRUPO GEMA',
            logoTagline: 'Mantenimiento de Flotas y Vehículos',
            tipo_persona: 'Jurídica',
            clasificacion_tributaria: 'Otros',
            sujeto_excluido: 'No',
            tipo_documento: 'NIT',
            num_documento: '0614-111111-101-1',
            actividad_economica: 'Servicio de Mantenimiento al Transporte Terrestre',
            pais: 'El Salvador',
            departamento: 'La Libertad',
            municipio: 'Colón',
            logo: '',
            formato_presupuesto: 'moderno_facturallama'
        };
    }
    const cfg = Object.assign({}, db.config_taller);
    if (!cfg.formato_presupuesto) {
        cfg.formato_presupuesto = 'moderno_facturallama';
    }
    return cfg;
}

// Helper: Calculate total for any budget in db


// Helper: Calculate client unpaid credit balance


function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getActiveUser() {
    try {
        const userStr = sessionStorage.getItem('mecanic_os_active_user');
        const signature = sessionStorage.getItem('mecanic_os_active_sig');
        if (!userStr) return null;
        const user = JSON.parse(userStr);
        if (!signature || generateUserSignature(user) !== signature) {
            console.error("Session security check failed: Signature mismatch or missing.");
            setActiveUser(null);
            return null;
        }
        return user;
    } catch (e) {
        return null;
    }
}

function setActiveUser(user) {
    if (user) {
        sessionStorage.setItem('mecanic_os_active_user', JSON.stringify(user));
        sessionStorage.setItem('mecanic_os_active_sig', generateUserSignature(user));
    } else {
        sessionStorage.removeItem('mecanic_os_active_user');
        sessionStorage.removeItem('mecanic_os_active_sig');
        sessionStorage.removeItem('mecanic_os_session_key');
    }
    updateUserUI();
}





// Live Clock


// ----------------------------------------------------
// VIEW RENDERING FUNCTIONS
// ----------------------------------------------------

// 1. TALLER DASHBOARD VIEW
// 2. CLIENTES Y VEHICULOS VIEW






export {
    getDatabase,
    getActiveUser,
    setActiveUser,
    saveDatabase,
    setSecureDteConfig,
    getSecureDteConfig,
    initFirebase,
    initDatabase,
    initFirebaseAuthListener,
    bindFirebaseEvents,
    updateUserUI,
    updateSidebarBrand,
    startClock,
    getWorkshopConfig,
    setupMunicipiosSelect,
    setupOfficialCatalogsSelect,
    getGirosOptionsHtml,
    getValidEconomicActivityCode,
    calculateElSalvadorPeriodPayroll,
    getBudgetGrandTotal,
    getClientPendingBalance,
    generateUUID,
    updateNotifications,
    html,
    safe,
    initSecureDteConfig,
    DEPARTAMENTOS_CODES,
    MUNICIPIOS_CODES
};

// Prevent tab/page close during active DTE transmission
window.addEventListener('beforeunload', (e) => {
    if (window.isDteTransmitting) {
        e.preventDefault();
        e.returnValue = 'Transmisión DTE en curso. Si sale o recarga la página, podría interrumpirse la facturación. ¿Desea salir?';
        return e.returnValue;
    }
});



