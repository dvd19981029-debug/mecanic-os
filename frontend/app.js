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
    downloadExcelReport 
} from './js/utils.js';

// Expose critical functions globally to window for legacy compatibility
window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.hashPassword = hashPassword;
window.encryptString = encryptString;
window.decryptString = decryptString;
window.getBackendUrl = getBackendUrl;
window.downloadExcelReport = downloadExcelReport;
window.getDatabase = getDatabase;
window.handleRouting = handleRouting;

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

function getSecureDteConfig() {
    const key = getSessionKey();
    const raw = localStorage.getItem('mecanic_os_dte_config');
    if (!raw) return { apiKey: '', ambiente: '00', mhCode: '0001', posNumber: '1', backendUrl: '' };
    
    if (raw.trim().startsWith('{')) {
        if (key) {
            try {
                setSecureDteConfig(JSON.parse(raw));
            } catch (e) {}
        }
        try {
            return JSON.parse(raw);
        } catch(e) {
            return { apiKey: '', ambiente: '00', mhCode: '0001', posNumber: '1', backendUrl: '' };
        }
    }
    
    const decrypted = decryptString(raw, key);
    try {
        return JSON.parse(decrypted);
    } catch (e) {
        return {
            apiKey: '',
            ambiente: '00',
            mhCode: '0001',
            posNumber: '1',
            backendUrl: ''
        };
    }
}

function setSecureDteConfig(config) {
    const key = getSessionKey();
    const jsonStr = JSON.stringify(config);
    if (key) {
        const encrypted = encryptString(jsonStr, key);
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
        setSecureDteConfig({
            apiKey: '',
            ambiente: '00',
            mhCode: '0001',
            posNumber: '1',
            backendUrl: ''
        });
    }

    // Auto-migration: hash existing plain-text technician passwords/PINs
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
}

function getDatabase() {
    return dataService.cache;
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

function setupMunicipiosSelect(deptSelectId, muniSelectId, selectedMuniValue = '') {
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

function setupOfficialCatalogsSelect(deptSelectId, muniSelectId, selectedDeptValue = '', selectedMuniValue = '') {
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

function getGirosOptionsHtml(selectedValue = '') {
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

function getValidEconomicActivityCode(val) {
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

function updateCloudStatusUI(active, state = "") {
    const dot = document.getElementById('cloud-sync-dot');
    const label = document.getElementById('cloud-sync-label');
    
    if (!dot || !label) return;
    
    const loggedOutView = document.getElementById('fb-logged-out-view');
    const loggedInView = document.getElementById('fb-logged-in-view');
    const userEmailSpan = document.getElementById('fb-user-email');
    
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
                // Clear workshop session state to prevent auto-login loops
                localStorage.removeItem('mecanic_os_workshop_uid');
                
                const db = getDatabase();
                if (db) {
                    db.saas_state = {
                        status: 'guest',
                        workshopData: null,
                        termsSigned: false,
                        signatureName: '',
                        signedAt: null
                    };
                    db.config_taller = null;
                    db.solicitudes_registro = [];
                    db.saas_payments = [];
                    saveDatabase(db);
                }
                
                setActiveUser(null);

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
function getBudgetGrandTotal(budget, db) {
    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

    const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === budget['ID Presupuesto']);
    const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === budget['ID Presupuesto']);

    const sumProd = products.reduce((sum, p) => sum + parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1), 0);
    const sumLab = labor.reduce((sum, l) => sum + parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1), 0);
    const subtotal = sumProd + sumLab;
    
    // Manual discount
    let discount = parseFloat(budget.Descuento || 0);
    
    // Dynamic Promotion discount
    if (budget.ID_Promocion) {
        const promo = (db.promociones || []).find(p => p.ID_Promocion === budget.ID_Promocion);
        if (promo) {
            let promoDiscount = 0;
            if (promo.Tipo === 'desc_mano_obra') {
                promoDiscount = sumLab * (parseFloat(promo.Valor || 0) / 100);
            } else if (promo.Tipo === 'desc_productos') {
                promoDiscount = sumProd * (parseFloat(promo.Valor || 0) / 100);
            } else if (promo.Tipo === 'monto_fijo') {
                promoDiscount = parseFloat(promo.Valor || 0);
            }
            discount = Math.max(discount, promoDiscount);
        }
    }
    
    discount = Math.min(discount, subtotal);
    const subtotalConDescuento = Math.max(0, subtotal - discount);
    
    const taxRate = parseFloat(budget['% Impuesto'] !== undefined ? budget['% Impuesto'] : 0.13);
    const iva = subtotalConDescuento * taxRate;

    let retVal = 0;
    let percVal = 0;
    const client = db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { AplicaRetencion: 0, AplicaPercepcion: 0 };
    if (client.AplicaRetencion > 0) {
        retVal = subtotalConDescuento * parseFloat(client.AplicaRetencion);
    }
    if (client.AplicaPercepcion > 0) {
        percVal = subtotalConDescuento * parseFloat(client.AplicaPercepcion);
    }

    const rawTotal = subtotalConDescuento + iva + percVal - retVal;
    return Math.round(rawTotal * 100) / 100;
}

// Helper: Calculate client unpaid credit balance
function getClientPendingBalance(clientCode, db) {
    // 1. Get all budgets for client that are CREDIT, status is FACTURADO (Estado === 3) and NOT marked as paid (Pagado? !== 'SI')
    const unpaidBudgets = db.presupuestos.filter(p => 
        p.Codigo_Cliente === clientCode && 
        (p.Estado === 3 || p.Estado === '3') && 
        p.Condicion === 'CREDITO' && 
        p['Pagado?'] !== 'SI'
    );
    
    // All abonos for this client
    const clientAbonos = (db['30 Abonos Creditos'] || []).filter(ab => ab.Codigo_Cliente === clientCode);
    
    // Sum remaining balances of unpaid budgets
    let totalUnpaidRemaining = 0;
    unpaidBudgets.forEach(b => {
        const budgetId = b['ID Presupuesto'];
        const budgetTotal = getBudgetGrandTotal(b, db);
        
        // Sum abonos linked to this specific budget (by ID_Presupuesto or fallback in Observaciones)
        const linkedAbonos = clientAbonos.filter(ab => 
            ab.ID_Presupuesto === budgetId || 
            (ab.Observaciones && ab.Observaciones.includes(`presupuesto ${budgetId}`))
        );
        const totalLinkedAmount = linkedAbonos.reduce((sum, ab) => sum + parseFloat(ab['Monto Abono'] || ab.Monto || 0), 0);
        
        totalUnpaidRemaining += Math.max(0, budgetTotal - totalLinkedAmount);
    });
    
    // Sum general abonos (not linked to any budget, or linked to a budget that is NOT in unpaidBudgets, meaning it is paid)
    const generalAbonos = clientAbonos.filter(ab => {
        if (ab.ID_Presupuesto) {
            return false;
        }
        if (ab.Observaciones && ab.Observaciones.includes('presupuesto ')) {
            return false;
        }
        return true;
    });
    
    const totalGeneralAbonos = generalAbonos.reduce((sum, ab) => sum + parseFloat(ab['Monto Abono'] || ab.Monto || 0), 0);
    
    return Math.max(0, totalUnpaidRemaining - totalGeneralAbonos);
}

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

// Update User info in UI
function updateUserUI() {
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
                foundPermissions = true;
            }
        }
        
        if (!foundPermissions) {
            // Sensible fallbacks
            const searchRole = normalizedRole.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (searchRole === "administrador") {
                allowedRoutes = [
                    "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                    "facturador", "venta-rapida", "caja", "cuentas-cobrar", "inventario", "gastos", "planilla",
                    "comisiones", "dashboard-bi", "configuracion"
                ];
            } else if (searchRole === "recepcionista") {
                allowedRoutes = [
                    "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                    "facturador", "venta-rapida", "caja", "cuentas-cobrar", "comisiones"
                ];
            } else {
                // Default to Técnico permissions (now including presupuestos)
                allowedRoutes = ["taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban", "comisiones"];
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

function updateSidebarBrand() {
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
function startClock() {
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

// ----------------------------------------------------
// VIEW RENDERING FUNCTIONS
// ----------------------------------------------------

// 1. TALLER DASHBOARD VIEW
// 2. CLIENTES Y VEHICULOS VIEW
function calculateElSalvadorPeriodPayroll(baseSalary, extraEarnings = 0, periodType = 'M') {
    // Si es quincenal, el salario base se divide entre 2 para el período
    const currentBase = periodType === 'M' ? baseSalary : baseSalary / 2;
    const totalGravado = currentBase + extraEarnings;
    
    // Topes de ISSS según período
    const isssLimit = periodType === 'M' ? 1000 : 500;
    
    const isssEmployee = Math.min(totalGravado, isssLimit) * 0.03;
    const afpEmployee = totalGravado * 0.0725;
    
    const rentBase = totalGravado - isssEmployee - afpEmployee;
    let isr = 0;
    
    if (periodType === 'M') {
        // ISR Mensual
        if (rentBase > 2038.10) {
            isr = (rentBase - 2038.10) * 0.30 + 288.57;
        } else if (rentBase > 895.24) {
            isr = (rentBase - 895.24) * 0.20 + 60.00;
        } else if (rentBase > 472.00) {
            isr = (rentBase - 472.00) * 0.10 + 17.67;
        }
    } else {
        // ISR Quincenal
        if (rentBase > 1019.05) {
            isr = (rentBase - 1019.05) * 0.30 + 144.28;
        } else if (rentBase > 447.62) {
            isr = (rentBase - 447.62) * 0.20 + 30.00;
        } else if (rentBase > 236.00) {
            isr = (rentBase - 236.00) * 0.10 + 8.83;
        }
    }
    
    const totalDeductions = isssEmployee + afpEmployee + isr;
    const netSalary = totalGravado - totalDeductions;
    
    const isssEmployer = Math.min(totalGravado, isssLimit) * 0.075;
    const afpEmployer = totalGravado * 0.0875;
    const insaforpLimit = periodType === 'M' ? 1000 : 500;
    const insaforp = totalGravado >= insaforpLimit ? totalGravado * 0.01 : 0;
    const employerCost = totalGravado + isssEmployer + afpEmployer + insaforp;
    
    return {
        totalGravado,
        isssEmployee,
        afpEmployee,
        isr,
        totalDeductions,
        netSalary,
        isssEmployer,
        afpEmployer,
        insaforp,
        employerCost
    };
}


function updateNotifications() {
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
    initUserSwitcher,
    getWorkshopConfig,
    setupMunicipiosSelect,
    setupOfficialCatalogsSelect,
    getGirosOptionsHtml,
    getValidEconomicActivityCode,
    calculateElSalvadorPeriodPayroll,
    getBudgetGrandTotal,
    getClientPendingBalance,
    generateUUID,
    updateNotifications
};



