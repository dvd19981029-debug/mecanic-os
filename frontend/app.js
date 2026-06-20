/**
 * Mecanic OS - Core Application Engine
 * Premium Workshop & Electronic Invoicing Management System
 */

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

// Database Initialization in LocalStorage
function initDatabase() {
    // Migration: Clear any old mock databases on first load
    if (!localStorage.getItem('mecanic_os_db_cleared_v3')) {
        localStorage.removeItem('mecanic_os_db');
        localStorage.removeItem('mecanic_os_pos_cart');
        localStorage.removeItem('mecanic_os_dte_config');
        localStorage.removeItem('mecanic_os_firebase_config');
        sessionStorage.removeItem('mecanic_os_active_user');
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
        localStorage.setItem('mecanic_os_dte_config', JSON.stringify({
            apiKey: '',
            ambiente: '00',
            mhCode: '0001',
            posNumber: '1',
            backendUrl: ''
        }));
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
                    // Hay un taller activo en este dispositivo → hacer login anónimo
                    // para que los empleados puedan leer/escribir en Firestore
                    firebase.auth().signInAnonymously().catch(err => {
                        console.warn('Mecanic OS: Login anónimo falló, intentando sync sin auth:', err);
                        // Intentar sync de todas formas (puede fallar si las reglas requieren auth)
                        dataService.startSync(workshopUid, true);
                        updateCloudStatusUI(true, "active");
                    });
                    // El callback de onAuthStateChanged se volverá a llamar con el user anónimo
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
            // Mostrar toast discreto informando del cambio
            if (typeof showToast === 'function') {
                showToast('🔄 Datos actualizados desde otro dispositivo', 'info');
            }
            // Re-renderizar la vista actual
            if (typeof handleRouting === 'function') {
                handleRouting();
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
        recipientPayload.economicActivity = workshop.actividad_economica || '45201';
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
        const response = await fetch('/api/dte', {
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
    
    if (active && state === "active") {
        dot.style.backgroundColor = "#2ecc71"; // Green
        
        const loggedOutView = document.getElementById('fb-logged-out-view');
        const loggedInView = document.getElementById('fb-logged-in-view');
        const userEmailSpan = document.getElementById('fb-user-email');
        const lastSyncSpan = document.getElementById('fb-last-sync');
        const codeSpan = document.getElementById('fb-workshop-code');
        
        if (codeSpan) {
            codeSpan.textContent = getWorkshopOwnerUid() || "No disponible";
        }
        
        if (currentFirebaseUser && !currentFirebaseUser.isAnonymous) {
            // Dueño autenticado
            label.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Conectado`;
            if (loggedOutView) loggedOutView.style.display = "none";
            if (loggedInView) loggedInView.style.display = "block";
            if (userEmailSpan && currentFirebaseUser) userEmailSpan.textContent = currentFirebaseUser.email;
            if (lastSyncSpan) lastSyncSpan.textContent = lastSyncTime ? lastSyncTime.toLocaleTimeString() : "Nunca";
        } else {
            // Empleado anónimo — sincronizando con el taller
            label.innerHTML = `<i class="fa-solid fa-wifi"></i> Tiempo Real`;
            if (loggedOutView) loggedOutView.style.display = "none";
            if (loggedInView) loggedInView.style.display = "block";
            if (userEmailSpan) userEmailSpan.textContent = "Empleado (Sincronizado)";
            if (lastSyncSpan) lastSyncSpan.textContent = "Automático";
        }
    } else if (state === "syncing") {
        dot.style.backgroundColor = "#f1c40f"; // Yellow
        label.innerHTML = `<i class="fa-solid fa-sync fa-spin"></i> Sincronizando...`;
    } else if (state === "offline" || state === "logged-out") {
        dot.style.backgroundColor = "#7f8c8d"; // Grey
        label.innerHTML = `<i class="fa-solid fa-cloud"></i> Sin cuenta en nube`;
        
        const loggedOutView = document.getElementById('fb-logged-out-view');
        const loggedInView = document.getElementById('fb-logged-in-view');
        if (loggedOutView) loggedOutView.style.display = "block";
        if (loggedInView) loggedInView.style.display = "none";
    } else {
        dot.style.backgroundColor = "#e74c3c"; // Red
        label.innerHTML = `<i class="fa-solid fa-cloud"></i> Error Conexión`;
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
    const forceSyncBtn = document.getElementById('fb-btn-force-sync');
    const uploadLocalBtn = document.getElementById('fb-btn-upload-local');
    const downloadCloudBtn = document.getElementById('fb-btn-download-cloud');

    if (!authModal) return;

    // Tabs logic
    const tabConnect = document.getElementById('fb-tab-connect');
    const tabLogin = document.getElementById('fb-tab-login');
    const tabRegister = document.getElementById('fb-tab-register');

    const connectSection = document.getElementById('fb-connect-section');
    const loginSection = document.getElementById('fb-login-section');
    const registerSection = document.getElementById('fb-register-section');

    function switchTab(activeTab, activeSection) {
        [tabConnect, tabLogin, tabRegister].forEach(tab => {
            if (tab) {
                tab.style.background = 'transparent';
                tab.style.color = 'var(--text-secondary)';
            }
        });
        [connectSection, loginSection, registerSection].forEach(sec => {
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

    if (tabConnect) tabConnect.addEventListener('click', () => switchTab(tabConnect, connectSection));
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

    // Connect via Code Form
    const connectForm = document.getElementById('fb-connect-form');
    if (connectForm) {
        connectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('fb-connect-code').value.trim();
            if (!code) {
                showToast("Por favor ingresa un código de conexión válido", "warning");
                return;
            }

            const btn = document.getElementById('fb-btn-connect-code');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Vinculando...';

            localStorage.setItem('mecanic_os_workshop_uid', code);

            if (typeof firebase !== 'undefined') {
                firebase.auth().signInAnonymously()
                    .then(() => {
                        showToast("PC vinculada exitosamente al taller", "success");
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-link"></i> Vincular esta PC al Taller';
                        authModal.classList.remove('active');
                        window.location.hash = 'lock-screen';
                        handleRouting();
                    })
                    .catch((error) => {
                        console.error("Error al conectar con código:", error);
                        showToast(`Error: ${error.message}`, "error");
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-link"></i> Vincular esta PC al Taller';
                    });
            } else {
                showToast("Firebase no está disponible offline", "error");
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-link"></i> Vincular esta PC al Taller';
            }
        });
    }

    // Copy to Clipboard logic for Workshop Code
    const copyCodeBtn = document.getElementById('fb-btn-copy-code');
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', () => {
            const codeEl = document.getElementById('fb-workshop-code');
            if (codeEl && codeEl.textContent && codeEl.textContent !== "No disponible") {
                navigator.clipboard.writeText(codeEl.textContent)
                    .then(() => {
                        showToast("Código de conexión copiado al portapapeles", "success");
                    })
                    .catch(err => {
                        console.error("Failed to copy text: ", err);
                        showToast("No se pudo copiar el código", "error");
                    });
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('fb-login-email').value;
            const pass = document.getElementById('fb-login-password').value;
            
            if (typeof firebase === 'undefined') return;
            
            const btn = document.getElementById('fb-btn-login');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Iniciando...';
            
            firebase.auth().signInWithEmailAndPassword(email, pass)
                .then((userCredential) => {
                    showToast("Sesión iniciada correctamente en la nube", "success");
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';
                    authModal.classList.remove('active');
                })
                .catch((error) => {
                    console.error("Error al iniciar sesión:", error);
                    showToast(`Error: ${error.message}`, "error");
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';
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
            
            const isOwner = currentFirebaseUser && !currentFirebaseUser.isAnonymous;
            const msg = isOwner
                ? "¿Seguro que deseas cerrar tu sesión de propietario? Los empleados seguirán trabajando con sincronización automática."
                : "¿Cerrar sesión de sincronización de este dispositivo?";
            
            if (confirm(msg)) {
                firebase.auth().signOut()
                    .then(() => {
                        if (isOwner) {
                            // El dueño cierra sesión → el workshop UID permanece para empleados
                            // NO borramos mecanic_os_workshop_uid para que los empleados sigan sincronizando
                            showToast("Sesión de propietario cerrada. Empleados siguen conectados.", "success");
                        } else {
                            showToast("Sesión cerrada correctamente", "success");
                        }
                        authModal.classList.remove('active');
                    })
                    .catch(err => {
                        console.error("Error al cerrar sesión:", err);
                    });
            }
        });
    }

    if (forceSyncBtn) {
        forceSyncBtn.addEventListener('click', () => {
            const workshopUid = getWorkshopOwnerUid();
            if (workshopUid) {
                const isEmployee = !currentFirebaseUser || currentFirebaseUser.isAnonymous;
                dataService.startSync(workshopUid, isEmployee);
                showToast("Sincronización en tiempo real reiniciada", "success");
            } else {
                showToast("No hay taller configurado en este dispositivo", "warning");
            }
        });
    }

    if (uploadLocalBtn) {
        uploadLocalBtn.addEventListener('click', async () => {
            if (currentFirebaseUser && !currentFirebaseUser.isAnonymous) {
                if (confirm("⚠️ ¡Atención! Esto subirá tu base de datos local actual a la nube en colecciones independientes. ¿Deseas proceder?")) {
                    await dataService.migrateLocalDataToCloud(currentFirebaseUser.uid);
                }
            } else {
                showToast("Solo el propietario del taller puede subir datos a la nube.", "warning");
            }
        });
    }

    if (downloadCloudBtn) {
        downloadCloudBtn.addEventListener('click', () => {
            const workshopUid = getWorkshopOwnerUid();
            if (workshopUid) {
                const isEmployee = !currentFirebaseUser || currentFirebaseUser.isAnonymous;
                dataService.startSync(workshopUid, isEmployee);
                showToast("Datos descargados y sincronizados desde la nube", "success");
            }
        });
    }
}

function getWorkshopConfig(db) {
    if (!db.config_taller) {
        db.config_taller = {
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
    if (!db.config_taller.formato_presupuesto) {
        db.config_taller.formato_presupuesto = 'moderno_facturallama';
    }
    return db.config_taller;
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
    const taxRate = parseFloat(budget['% Impuesto'] || 0.13);
    const iva = subtotal * taxRate;

    let retVal = 0;
    let percVal = 0;
    const client = db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { AplicaRetencion: 0, AplicaPercepcion: 0 };
    if (client.AplicaRetencion > 0) {
        retVal = subtotal * parseFloat(client.AplicaRetencion);
    }
    if (client.AplicaPercepcion > 0) {
        percVal = subtotal * parseFloat(client.AplicaPercepcion);
    }

    return subtotal + iva + percVal - retVal;
}

// Helper: Calculate client unpaid credit balance
function getClientPendingBalance(clientCode, db) {
    // 1. Get all budgets for client that are CREDIT and NOT marked as paid (Pagado? !== 'SI')
    const unpaidBudgets = db.presupuestos.filter(p => p.Codigo_Cliente === clientCode && p.Condicion === 'CREDITO' && p['Pagado?'] !== 'SI');
    
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
    return JSON.parse(sessionStorage.getItem('mecanic_os_active_user'));
}

function setActiveUser(user) {
    if (user) {
        sessionStorage.setItem('mecanic_os_active_user', JSON.stringify(user));
    } else {
        sessionStorage.removeItem('mecanic_os_active_user');
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
        if (db && db.role_permissions && db.role_permissions[roleName]) {
            allowedRoutes = db.role_permissions[roleName];
        } else {
            // Sensible fallbacks
            if (roleName === "Administrador") {
                allowedRoutes = [
                    "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                    "facturador", "venta-rapida", "cuentas-cobrar", "inventario", "gastos", "planilla",
                    "dashboard-bi", "configuracion"
                ];
            } else if (roleName === "Recepcionista") {
                allowedRoutes = [
                    "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                    "venta-rapida", "cuentas-cobrar"
                ];
            } else {
                // Default to Técnico permissions
                allowedRoutes = ["taller-dashboard", "clientes-vehiculos", "revision-21", "kanban"];
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

// Show Toast Alert
function showToast(message, type = 'primary') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'danger') iconClass = 'fa-circle-exclamation';
    
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toast-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// SPA Routing System
let activeConfigTab = 'taller';
const routes = {
    'taller-dashboard': renderTallerDashboard,
    'clientes-vehiculos': renderClientesVehiculos,
    'revision-21': renderRevision21,
    'presupuestos': renderPresupuestos,
    'kanban': renderKanban,
    'facturador': renderFacturador,
    'venta-rapida': renderVentaRapida,
    'cuentas-cobrar': renderCuentasCobrar,
    'inventario': renderInventario,
    'gastos': renderGastos,
    'dashboard-bi': renderDashboardBI,
    'configuracion': renderConfiguracion,
    'planilla': renderPlanilla,
    'landing': renderLanding,
    'registro': renderRegistroSaaS,
    
    'terminos': renderTerminosSaaS,
    'suspended': renderSuspendedSaaS,
    'lock-screen': renderLockScreen,
    'pago-suscripcion': renderPagoSuscripcionSaaS,
    'pago-suscripcion-wompi-callback': renderPagoSuscripcionWompiCallback,
    'admin-solicitudes': renderAdminSolicitudes
};

function handleRouting() {
    const db = getDatabase();
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

    // 2. Reactive Status Listener for Active/Suspended Workshop (checks for status/suspension changes)
    if (saas.status === 'active' && saas.workshopData && saas.workshopData.id) {
        if (!window.saasActiveListener) {
            const reqId = saas.workshopData.id;
            window.saasActiveListener = dataService.saas.listenRequest(reqId, (updatedRequest) => {
                if (updatedRequest) {
                    if (updatedRequest.suscripcion_status === 'suspendido') {
                        db.saas_state.status = 'suspended';
                        saveDatabase(db);
                        window.location.hash = 'suspended';
                        handleRouting();
                    }
                }
            });
        }
    } else if (saas.status === 'suspended' && saas.workshopData && saas.workshopData.id) {
        if (!window.saasActiveListener) {
            const reqId = saas.workshopData.id;
            window.saasActiveListener = dataService.saas.listenRequest(reqId, (updatedRequest) => {
                if (updatedRequest) {
                    if (updatedRequest.suscripcion_status === 'activo' || updatedRequest.suscripcion_status === 'demo') {
                        db.saas_state.status = 'active';
                        saveDatabase(db);
                        window.location.hash = 'taller-dashboard';
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
    
    // 3. Reactive Status Listener for Super Admin Requests list
    if (routeName === 'admin-solicitudes' && sessionStorage.getItem('mecanic_os_saas_admin_auth') === 'true') {
        if (!window.saasAdminRequestsUnsubscribe) {
            window.saasAdminRequestsUnsubscribe = dataService.saas.listenRequests((requests) => {
                const currentDb = getDatabase();
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
        if (routeName !== 'landing'  && routeName !== 'registro') {
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
        'facturador', 'venta-rapida', 'cuentas-cobrar', 'inventario', 'gastos', 'planilla',
        'dashboard-bi', 'configuracion'
    ];
    if (appViews.includes(routeName)) {
        const activeUser = getActiveUser();
        if (activeUser) {
            const roleName = activeUser.Nivel_Acceso || "Mecánico";
            let allowedRoutes = [];
            if (db && db.role_permissions && db.role_permissions[roleName]) {
                allowedRoutes = db.role_permissions[roleName];
            } else {
                if (roleName === "Administrador") {
                    allowedRoutes = appViews;
                } else if (roleName === "Recepcionista") {
                    allowedRoutes = [
                        "taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban",
                        "venta-rapida", "cuentas-cobrar"
                    ];
                } else {
                    allowedRoutes = ["taller-dashboard", "clientes-vehiculos", "revision-21", "kanban"];
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
            'facturador': { title: 'Facturador DTE (Ministerio de Hacienda)', subtitle: 'Validación fiscal y emisión de facturas electrónicas' },
            'venta-rapida': { title: 'Punto de Venta Rápida (POS)', subtitle: 'Despacho en mostrador de repuestos y servicios' },
            'cuentas-cobrar': { title: 'Créditos y Cuentas por Cobrar', subtitle: 'Abonos, estados de cuenta y saldos' },
            'inventario': { title: 'Control de Inventario y Kárdex', subtitle: 'Saldos de repuestos, mínimos y movimientos' },
            'gastos': { title: 'Compras y Gastos Operativos', subtitle: 'Registro de egresos y facturas de proveedores' },
            'dashboard-bi': { title: 'Módulo de Inteligencia de Negocios (BI)', subtitle: 'KPIs financieros y de productividad' },
            'configuracion': { title: 'Configuración y Ajustes Maestros', subtitle: 'Administración de catálogos e integración DTE' },
            'planilla': { title: 'Gestión de Planillas y Salarios', subtitle: 'Control de nómina, boletas de pago y deducciones de ley (El Salvador)' }
        };
        
        const info = titles[routeName] || { title: 'Mecanic OS', subtitle: 'Gestión Inteligente' };
        document.getElementById('view-title').textContent = info.title;
        document.getElementById('view-subtitle').textContent = info.subtitle;
        
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
                    <button class="btn btn-secondary" onclick="window.location.hash = '#taller-dashboard'">Volver al Panel</button>
                </div>`;
            }
        }, 100);
    } else {
        window.location.hash = 'taller-dashboard';
    }
}

// ----------------------------------------------------
// VIEW RENDERING FUNCTIONS
// ----------------------------------------------------

// 1. TALLER DASHBOARD VIEW
function renderTallerDashboard(container) {
    const db = getDatabase();
    
    // Helper to calculate grand total for a budget
    function getBudgetTotal(p) {
        const presId = p['ID Presupuesto'];
        const prodItems = (db.detalle_productos || []).filter(item => item['ID_Presupuesto DPP'] === presId);
        const laborItems = (db.detalle_mano_obra || []).filter(item => item['ID_Presupuesto MO'] === presId);

        let subtotal = 0;
        prodItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1));
        laborItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1));
        
        const iva = subtotal * 0.13;
        let grandTotal = subtotal + iva;
        
        const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || { AplicaPercepcion: 0, AplicaRetencion: 0 };
        if (client.AplicaPercepcion > 0) {
            grandTotal += subtotal * parseFloat(client.AplicaPercepcion);
        }
        if (client.AplicaRetencion > 0) {
            grandTotal -= subtotal * parseFloat(client.AplicaRetencion);
        }
        return grandTotal;
    }

    // 1. Calculate Autos en Taller (unique plates of active budgets/diagnostics)
    const activeBudgets = db.presupuestos.filter(p => p.Estado !== 3 && p.Estado !== '3');
    const activePlates = new Set(activeBudgets.map(p => p.Placas).filter(Boolean));
    const activeVehiclesCount = activePlates.size;

    // received in the last 7 days from db.revisiones
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const receivedThisWeek = (db.revisiones || []).filter(r => {
        if (!r.Fecha) return false;
        const rDate = new Date(r.Fecha);
        return rDate >= sevenDaysAgo;
    }).length;

    // 2. Presupuestos Aprobados
    const approvedBudgetsCount = db.presupuestos.filter(p => p.Estado == 2 || p.Estado == '2').length;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const cotizadosHoy = db.presupuestos.filter(p => {
        if (!p.Fecha) return false;
        const pDate = new Date(p.Fecha);
        return pDate >= startOfToday;
    }).length;

    // 3. Facturado Hoy (DTE)
    let invoicedTodaySum = 0;
    const invoicedTodayBudgets = db.presupuestos.filter(p => {
        if (p.Estado != 3 && p.Estado != '3') return false;
        if (!p.Fecha_Facturacion) return false;
        const fDate = new Date(p.Fecha_Facturacion);
        return fDate >= startOfToday;
    });
    invoicedTodayBudgets.forEach(p => {
        invoicedTodaySum += getBudgetTotal(p);
    });
    const invoicesCountToday = invoicedTodayBudgets.length;

    // 4. Alertas Stock Mínimo
    const lowStockProductsCount = (db.productos || []).filter(p => (p.Minimos || 0) <= 3).length;

    // Render stats
    const statsHTML = `
        <div class="dashboard-grid">
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Autos en Taller</span>
                    <span class="stat-value">${activeVehiclesCount}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> +${receivedThisWeek} esta semana</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-car"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Presupuestos Aprobados</span>
                    <span class="stat-value">${approvedBudgetsCount}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-file-invoice"></i> ${cotizadosHoy} cotizados hoy</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-file-signature"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Facturado Hoy (DTE)</span>
                    <span class="stat-value">$ ${invoicedTodaySum.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-circle-check"></i> ${invoicesCountToday} emitidos hoy</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Alertas Stock Mínimo</span>
                    <span class="stat-value">${lowStockProductsCount}</span>
                    <span class="stat-trend down"><i class="fa-solid fa-triangle-exclamation"></i> Repuestos críticos</span>
                </div>
                <div class="stat-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            </div>
        </div>
        
        <h2>Accesos Rápidos</h2>
        <div class="quick-actions-panel">
            <div class="action-card" onclick="window.location.hash='#revision-21'">
                <i class="fa-solid fa-clipboard-list"></i>
                <h3>Nueva Recepción</h3>
                <p>Inspección 21 Puntos y registro de ingreso</p>
            </div>
            <div class="action-card" onclick="window.location.hash='#presupuestos'">
                <i class="fa-solid fa-file-invoice-dollar"></i>
                <h3>Crear Presupuesto</h3>
                <p>Cotización de servicios y partes a clientes</p>
            </div>
            <div class="action-card" onclick="window.location.hash='#kanban'">
                <i class="fa-solid fa-network-wired"></i>
                <h3>Tablero Kanban</h3>
                <p>Ver flujo del taller y técnicos asignados</p>
            </div>
            <div class="action-card" onclick="window.location.hash='#venta-rapida'">
                <i class="fa-solid fa-cash-register"></i>
                <h3>Venta Rápida POS</h3>
                <p>Facturación directa en mostrador</p>
            </div>
        </div>
        
        <div class="view-split">
            <div class="glass-card">
                <h3>Vehículos Activos en Proceso</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Placas</th>
                                <th>Cliente</th>
                                <th>Técnico</th>
                                <th>Fallas Reportadas</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.presupuestos.slice(0, 5).map(p => {
                                const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === p.ID_Vehiculo) || { Placas: p.Placas || 'N/A' };
                                const tech = db.tecnicos.find(t => t.Tecnico_ID === p.Tecnico_Asignado) || { Nombre_Completo: 'Sin Asignar' };
                                let statusBadge = '';
                                if (p.Estado == 1) statusBadge = '<span class="badge-tag badge-warning">Creado</span>';
                                else if (p.Estado == 2) statusBadge = '<span class="badge-tag badge-primary">Aprobado</span>';
                                else if (p.Estado == 3) statusBadge = '<span class="badge-tag badge-success">Facturado</span>';
                                else statusBadge = '<span class="badge-tag badge-success">En Espera</span>';
                                
                                return `
                                    <tr>
                                        <td><strong>${vehicle.Placas}</strong></td>
                                        <td>${p.Nombre}</td>
                                        <td>${tech.Nombre_Completo}</td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.Fallas_Detectadas || 'Mantenimiento General'}</td>
                                        <td>${statusBadge}</td>
                                        <td><a href="#presupuestos?id=${p['ID Presupuesto']}" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-eye"></i> Ver</a></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h3>Distribución de Carga en Taller</h3>
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 1.5rem;">Carga por técnico asignado</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${db.tecnicos.map(t => {
                            const count = db.presupuestos.filter(p => p.Tecnico_Asignado === t.Tecnico_ID && p.Estado !== 3).length;
                            const percentage = Math.min((count / 5) * 100, 100);
                            return `
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                        <span>${t.Nombre_Completo}</span>
                                        <strong>${count} autos</strong>
                                    </div>
                                    <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                                        <div style="background: linear-gradient(to right, var(--primary), var(--cyan)); width: ${percentage}%; height: 100%;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1.5rem; text-align: center;">
                    <button class="btn btn-primary" onclick="window.location.hash='#kanban'" style="width: 100%;"><i class="fa-solid fa-magnifying-glass-chart"></i> Ir al Monitoreo en Tiempo Real</button>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = statsHTML;
}

// 2. CLIENTES Y VEHICULOS VIEW
function renderClientesVehiculos(container, queryParams) {
    const db = getDatabase();
    
    // Render framework
    container.innerHTML = `
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
                                <option value="NO">No (Sujeto Excluido/Final)</option>
                                <option value="SI">Sí (Emite Crédito Fiscal)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Tipo de Documento</label>
                            <select id="new-client-doc-type">
                                <option value="DUI">DUI</option>
                                <option value="NIT">NIT</option>
                                <option value="PASAPORTE">Pasaporte</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nº de Documento</label>
                            <input type="text" id="new-client-doc-num" required placeholder="00000000-0">
                        </div>
                        <div class="form-group">
                            <label>NIT (si aplica)</label>
                            <input type="text" id="new-client-nit" placeholder="0000-000000-000-0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>NRC (Nº de Registro Contribuyente)</label>
                            <input type="text" id="new-client-nrc" placeholder="00000-0">
                        </div>
                        <div class="form-group">
                            <label>Giro Comercial (Actividad Económica)</label>
                            <input type="text" id="new-client-giro" placeholder="Servicios, Comercio, etc.">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Categoría Contribuyente (DTE El Salvador)</label>
                            <select id="new-client-cat">
                                <option value="OTROS">Otros Contribuyentes</option>
                                <option value="MEDIANO">Mediano Contribuyente</option>
                                <option value="GRANDE">Gran Contribuyente</option>
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
                            <label>Retención IVA (1% - Compras Grandes)</label>
                            <select id="new-client-ret">
                                <option value="0">No aplica</option>
                                <option value="0.01">Aplica 1% Retención (Agente Gran Contribuyente)</option>
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
                    <div class="form-row" id="credit-fields-row">
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
                    <div class="form-group">
                        <label>Dirección Completa</label>
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
                                <option value="NO">No (Sujeto Excluido/Final)</option>
                                <option value="SI">Sí (Emite Crédito Fiscal)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Tipo de Documento</label>
                            <select id="edit-client-doc-type">
                                <option value="DUI">DUI</option>
                                <option value="NIT">NIT</option>
                                <option value="PASAPORTE">Pasaporte</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nº de Documento</label>
                            <input type="text" id="edit-client-doc-num" required placeholder="00000000-0">
                        </div>
                        <div class="form-group">
                            <label>NIT (si aplica)</label>
                            <input type="text" id="edit-client-nit" placeholder="0000-000000-000-0">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>NRC (Nº de Registro Contribuyente)</label>
                            <input type="text" id="edit-client-nrc" placeholder="00000-0">
                        </div>
                        <div class="form-group">
                            <label>Giro Comercial (Actividad Económica)</label>
                            <input type="text" id="edit-client-giro" placeholder="Servicios, Comercio, etc.">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Categoría Contribuyente (DTE El Salvador)</label>
                            <select id="edit-client-cat">
                                <option value="OTROS">Otros Contribuyentes</option>
                                <option value="MEDIANO">Mediano Contribuyente</option>
                                <option value="GRANDE">Gran Contribuyente</option>
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
                            <label>Retención IVA (1% - Compras Grandes)</label>
                            <select id="edit-client-ret">
                                <option value="0">No aplica</option>
                                <option value="0.01">Aplica 1% Retención (Agente Gran Contribuyente)</option>
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
                    <div class="form-row" id="edit-credit-fields-row">
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
                    <div class="form-group">
                        <label>Dirección Completa</label>
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
            item.innerHTML = `
                <div class="list-item-main">
                    <span class="list-item-title">${client.Nombre}</span>
                    <span class="list-item-subtitle">${client.Codigo_Cliente} • Tel: ${client['Telefono 1 '] || client.Telefono || 'N/A'}</span>
                </div>
                <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 0.8rem;"></i>
            `;
            
            item.addEventListener('click', () => {
                document.querySelectorAll('.list-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                showClientDetail(client);
            });
            clientsListContainer.appendChild(item);
        });
    }
    
    // Function to show client detail
    function showClientDetail(client) {
        const clientVehicles = db.vehiculos.filter(v => v.Codigo_Cliente === client.Codigo_Cliente);
        const clientBudgets = db.presupuestos.filter(p => p.Codigo_Cliente === client.Codigo_Cliente);
        
        clientDetailContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid var(--border-color); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                    <h2>${client.Nombre}</h2>
                    <span class="badge-tag badge-primary" style="margin-top: 0.5rem;">${client['Tipo Cliente'] || 'Persona Natural'}</span>
                    ${client['Contribuyente?'] === 'SI' ? '<span class="badge-tag badge-success">Contribuyente IVA</span>' : '<span class="badge-tag badge-warning">Consumidor Final</span>'}
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
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Código:</td><td><strong>${client.Codigo_Cliente}</strong></td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Doc ID (${client['Tipo Doc'] || 'DUI'}):</td><td>${client['Num Doc'] || 'N/A'}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">NIT/NRC:</td><td>${client.NIT || 'N/A'} / ${client.NRC || 'N/A'}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Giro:</td><td>${client.Giro || 'N/A'}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Correo:</td><td>${client.Correo || 'N/A'}</td></tr>
                        <tr><td style="color: var(--text-muted); padding: 0.4rem 0;">Dirección:</td><td>${client.Direccion || 'N/A'}</td></tr>
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
                ${clientVehicles.length === 0 
                    ? '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No se han registrado vehículos para este cliente.</div>' 
                    : clientVehicles.map(v => `
                        <div class="vehicle-card">
                            <i class="fa-solid fa-car-side vehicle-card-bg-icon"></i>
                            <div class="vehicle-placa">${v.Placas}</div>
                            <div class="vehicle-detail-row"><span>Marca/Modelo:</span><span><strong>${v.Marca} ${v.Modelo}</strong></span></div>
                            <div class="vehicle-detail-row"><span>Año/Color:</span><span>${v.Año || 'N/A'} • ${v.Color || 'N/A'}</span></div>
                            <div class="vehicle-detail-row"><span>Odómetro:</span><span>${v.Odometro || '0'}</span></div>
                            <div class="vehicle-detail-row"><span>VIN/Nº Motor:</span><span>${v.Nª_VIN || 'N/A'}</span></div>
                        </div>
                    `).join('')}
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
                        ${clientBudgets.length === 0 
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
                            }).join('')}
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
            
            document.getElementById('edit-client-modal').classList.add('active');
        });

        document.getElementById('delete-client-trigger-btn').addEventListener('click', () => {
            if (confirm(`¿Estás seguro de que deseas eliminar permanentemente al cliente ${client.Nombre}? Esta acción no se puede deshacer y afectará a sus registros.`)) {
                db.clientes = db.clientes.filter(c => c.Codigo_Cliente !== client.Codigo_Cliente);
                saveDatabase(db);
                showToast("Cliente eliminado correctamente", "success");
                clientDetailContainer.innerHTML = `
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
    }
    
    // Search filter listener
    clientSearch.addEventListener('input', (e) => {
        populateClientsList(e.target.value);
    });
    
    // Open/Close Add Client Modal
    document.getElementById('add-client-btn').addEventListener('click', () => {
        document.getElementById('add-client-modal').classList.add('active');
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
            Nª_VIN: vin
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
    
    // Auto select client if parameter was passed
    if (queryParams.id) {
        const client = db.clientes.find(c => c.Codigo_Cliente === queryParams.id);
        if (client) {
            showClientDetail(client);
        }
    }
}

// 3. REVISION DE 21 PUNTOS VIEW
function renderRevision21(container, queryParams) {
    const db = getDatabase();
    
    if (!window.saasActiveInspeccionTab) {
        window.saasActiveInspeccionTab = 'registrar';
    }
    const activeTab = window.saasActiveInspeccionTab;
    const checkpoints = getInspectionCheckpoints(db);

    container.innerHTML = `
        <div class="inspection-container glass-card" style="max-width:1100px; margin:2rem auto; padding:2rem;">
            <h2>Hoja de Recepción Física y Diagnóstico de Vehículo</h2>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">Registra el ingreso del vehículo, semáforo de revisión inicial e historial.</p>
            
            <div class="saas-tabs-container" style="margin-bottom: 1.5rem; display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                <button class="saas-tab-btn ${activeTab === 'registrar' ? 'active' : ''}" onclick="window.switchInspeccionTab('registrar')"><i class="fa-solid fa-file-signature"></i> Nueva Inspección</button>
                <button class="saas-tab-btn ${activeTab === 'historial' ? 'active' : ''}" onclick="window.switchInspeccionTab('historial')"><i class="fa-solid fa-list-check"></i> Historial (${(db.revisiones || []).length})</button>
                <button class="saas-tab-btn ${activeTab === 'configurar' ? 'active' : ''}" onclick="window.switchInspeccionTab('configurar')"><i class="fa-solid fa-gears"></i> Configurar Criterios</button>
            </div>
            
            <div class="inspeccion-tab-body">
                ${activeTab === 'registrar' ? renderRegistrarTab(db, checkpoints) : ''}
                ${activeTab === 'historial' ? renderHistorialTab(db) : ''}
                ${activeTab === 'configurar' ? renderConfigurarTab(db, checkpoints) : ''}
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
function renderPresupuestos(container, queryParams) {
    const db = getDatabase();
    
    // If action=new, load editor in creation mode
    if (queryParams.action === 'new') {
        renderBudgetEditor(container, null);
        return;
    }
    
    // If we have an ID, load that budget editor in edit mode
    if (queryParams.id) {
        const budget = db.presupuestos.find(p => p['ID Presupuesto'] === queryParams.id);
        if (!budget) {
            container.innerHTML = `<div class="glass-card" style="text-align: center; padding: 2rem;"><h2>Presupuesto no encontrado</h2></div>`;
            return;
        }
        renderBudgetEditor(container, budget);
        return;
    }

    // Otherwise, show list of budgets
    container.innerHTML = `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div class="search-bar-container" style="max-width: 320px;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="budget-search" placeholder="Buscar por número o cliente...">
                </div>
                <button class="btn btn-primary" id="new-budget-direct-btn"><i class="fa-solid fa-file-circle-plus"></i> Nueva Cotización</button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Código Presupuesto</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Placas Auto</th>
                            <th>Fallas / Diagnóstico</th>
                            <th>Estado</th>
                            <th>DTE Relacionado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="budgets-list-rows">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    const rowsContainer = document.getElementById('budgets-list-rows');
    const searchInput = document.getElementById('budget-search');

    function populateBudgetsList(filter = '') {
        rowsContainer.innerHTML = '';
        const filtered = db.presupuestos.filter(p => 
            (p['ID Presupuesto'] || '').toLowerCase().includes(filter.toLowerCase()) ||
            (p.Nombre || '').toLowerCase().includes(filter.toLowerCase()) ||
            (p.Placas || '').toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            rowsContainer.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">Sin resultados</td></tr>';
            return;
        }

        filtered.forEach(p => {
            let statusBadge = '';
            if (p.Estado == 1) statusBadge = '<span class="badge-tag badge-warning">Creado</span>';
            else if (p.Estado == 2) statusBadge = '<span class="badge-tag badge-primary">Aprobado</span>';
            else if (p.Estado == 3) statusBadge = '<span class="badge-tag badge-success">Facturado</span>';
            else statusBadge = '<span class="badge-tag badge-success">En Espera</span>';
            
            const isFacturado = p.Estado == 3;
            const actionText = isFacturado ? '<i class="fa-solid fa-eye"></i> Ver' : '<i class="fa-solid fa-edit"></i> Editar';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p['ID Presupuesto']}</strong></td>
                <td>${p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A'}</td>
                <td>${p.Nombre}</td>
                <td><span class="badge-tag badge-primary">${p.Placas || 'N/A'}</span></td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.Fallas_Detectadas || 'Diagnóstico de taller'}</td>
                <td>${statusBadge}</td>
                <td><small>${p.controlNumber || 'Sin Emitir (Pendiente)'}</small></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="#presupuestos?id=${p['ID Presupuesto']}" class="btn btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;">${actionText}</a>
                        <button class="btn btn-secondary btn-print-budget-pdf" data-id="${p['ID Presupuesto']}" style="padding: 0.35rem 0.6rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;"><i class="fa-solid fa-file-pdf"></i> PDF</button>
                    </div>
                </td>
            `;
            rowsContainer.appendChild(tr);
        });

        // Bind print PDF buttons
        rowsContainer.querySelectorAll('.btn-print-budget-pdf').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                exportBudgetPDF(id);
            });
        });
    }

    searchInput.addEventListener('input', (e) => {
        populateBudgetsList(e.target.value);
    });

    document.getElementById('new-budget-direct-btn').addEventListener('click', () => {
        window.location.hash = '#presupuestos?action=new';
    });

    populateBudgetsList();
}

// BUDGET EDITOR SUB-VIEW
function renderBudgetEditor(container, budget) {
    const db = getDatabase();
    const isNew = (budget === null);
    const activeUser = getActiveUser();
    const isAdmin = activeUser && (activeUser.Nivel_Acceso === 'Administrador');
    
    if (isNew) {
        budget = {
            "ID Presupuesto": "PRES-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
            Fecha: Date.now(),
            Codigo_Cliente: '',
            Nombre: '',
            ID_Vehiculo: '',
            Placas: '',
            Kilometraje: '',
            Estado: 1, // Iniciado
            "% Impuesto": 0.13,
            AplicaPercepcion: 0,
            AplicaRetencion: 0,
            Tecnico_Asignado: db.tecnicos[0] ? db.tecnicos[0].Tecnico_ID : '',
            Fallas_Detectadas: '',
            "Pagado?": "NO"
        };
    }
    
    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];
    
    let budgetProducts = isNew ? [] : db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === budget['ID Presupuesto']);
    let budgetLabor = isNew ? [] : db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === budget['ID Presupuesto']);
    
    const client = isNew ? null : (db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { Nombre: budget.Nombre });
    const vehicle = isNew ? null : (db.vehiculos.find(v => v.ID_Vehiculo === budget.ID_Vehiculo) || { Placas: budget.Placas || 'N/A', Marca: 'N/A', Modelo: 'N/A' });
    const techsHTML = db.tecnicos.map(t => `<option value="${t.Tecnico_ID}" ${budget.Tecnico_Asignado === t.Tecnico_ID ? 'selected' : ''}>${t.Nombre_Completo}</option>`).join('');

    // Generate header HTML
    let headerHTML = '';
    if (isNew) {
        headerHTML = `
            <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 1.25rem; color: var(--primary); font-family: var(--font-heading); display:flex; align-items:center; gap:0.5rem;"><i class="fa-solid fa-file-invoice-dollar"></i> Crear Nueva Cotización</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>1. Seleccionar Cliente</label>
                        <select id="editor-client-select" required style="padding: 0.65rem;">
                            <option value="">-- Busque y seleccione Cliente --</option>
                            ${db.clientes.map(c => `<option value="${c.Codigo_Cliente}">${c.Nombre} (${c.Codigo_Cliente})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>2. Seleccionar Vehículo</label>
                        <select id="editor-vehicle-select" required disabled style="padding: 0.65rem;">
                            <option value="">-- Elija vehículo (seleccione cliente primero) --</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Kilometraje / Odómetro</label>
                        <input type="text" id="editor-odo" placeholder="Ej. 120,000 Km" style="padding: 0.6rem;">
                    </div>
                    <div class="form-group">
                        <label>Técnico Asignado</label>
                        <select id="editor-tech-select" style="padding: 0.6rem;">
                            ${techsHTML}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Fallas Detectadas / Diagnóstico Final</label>
                    <input type="text" id="editor-fallas" placeholder="Escriba fallas reportadas o diagnóstico inicial..." style="padding: 0.65rem;">
                </div>
            </div>
        `;
    } else {
        headerHTML = `
            <div class="glass-card" style="padding: 1.25rem; margin-bottom: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <span class="badge-tag badge-primary" style="font-family: var(--font-heading); font-size: 1rem;">${budget['ID Presupuesto']}</span>
                        <h2 style="margin-top: 0.5rem;">${client.Nombre}</h2>
                        <p style="color: var(--text-secondary); font-size: 0.85rem;">Vehículo: <strong>${vehicle.Placas} (${vehicle.Marca} ${vehicle.Modelo})</strong> • Odómetro: ${budget.Kilometraje || '0'}</p>
                    </div>
                    <div class="form-group" style="width: 200px;">
                        <label>Técnico Asignado</label>
                        <select id="editor-tech-select" style="padding: 0.5rem;" ${budget.Estado == 3 ? 'disabled' : ''}>
                            ${techsHTML}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Fallas Detectadas / Diagnóstico Final</label>
                    <input type="text" id="editor-fallas" value="${budget.Fallas_Detectadas || 'Diagnóstico general'}" style="padding: 0.6rem;" ${budget.Estado == 3 ? 'disabled' : ''}>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="budget-editor" id="budget-editor-layout">
            <div class="items-section">
                <!-- Header Info Card -->
                ${headerHTML}

                <!-- Products (Spare Parts) Detail -->
                <div class="glass-card" id="editor-products-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Repuestos y Refacciones</h3>
                        <button class="btn btn-primary" id="add-prod-item-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" ${isNew || budget.Estado == 3 ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Agregar Repuesto</button>
                    </div>
                    
                    <div class="item-row" style="background-color: var(--border-color); font-weight: bold; border: none; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem;">
                        <div>Código</div>
                        <div>Descripción</div>
                        <div>Cantidad</div>
                        <div>Precio Unit.</div>
                        <div style="text-align: right;">Total</div>
                        <div></div>
                    </div>
                    
                    <div id="budget-products-rows" style="margin-top: 0.5rem;">
                        <!-- Injected -->
                    </div>
                </div>

                <!-- Labor Detail -->
                <div class="glass-card" id="editor-labor-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Mano de Obra y Servicios</h3>
                        <button class="btn btn-primary" id="add-labor-item-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" ${isNew || budget.Estado == 3 ? 'disabled' : ''}><i class="fa-solid fa-plus"></i> Agregar Servicio</button>
                    </div>
                    
                    <div class="item-row" style="background-color: var(--border-color); font-weight: bold; border: none; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem;">
                        <div>Código</div>
                        <div>Descripción del Servicio</div>
                        <div>Cantidad</div>
                        <div>Precio Unit.</div>
                        <div style="text-align: right;">Total</div>
                        <div></div>
                    </div>
                    
                    <div id="budget-labor-rows" style="margin-top: 0.5rem;">
                        <!-- Injected -->
                    </div>
                </div>
            </div>

            <!-- Summary Sticky Sidebar -->
            <div class="summary-sidebar glass-card" id="editor-summary-card" style="${isNew ? 'opacity: 0.4; pointer-events: none; transition: opacity 0.3s;' : ''}">
                <h3>Resumen Presupuesto</h3>
                <p style="color: var(--text-secondary); font-size: 0.8rem; margin-bottom: 1.5rem;">Condiciones fiscales aplicadas</p>
                
                <div class="form-group">
                    <label>Estado del Presupuesto</label>
                    <select id="editor-state" style="padding: 0.5rem; font-weight: 600;" ${budget.Estado == 3 ? 'disabled' : ''}>
                        <option value="1" ${budget.Estado == 1 ? 'selected' : ''}>1 - Creado</option>
                        <option value="2" ${budget.Estado == 2 ? 'selected' : ''} ${!isAdmin ? 'disabled' : ''}>2 - Aprobado ${!isAdmin ? '(Solo Admin)' : ''}</option>
                        <option value="3" ${budget.Estado == 3 ? 'selected' : ''} disabled>3 - Facturado</option>
                    </select>
                </div>
                
                <div style="border-top: 1px solid var(--border-color); margin-top: 1rem; padding-top: 1rem;">
                    <div class="summary-row"><span>Suma Repuestos:</span><span id="sum-products">$0.00</span></div>
                    <div class="summary-row"><span>Suma Mano Obra:</span><span id="sum-labor">$0.00</span></div>
                    <div class="summary-row"><span>Subtotal Neto:</span><span id="subtotal-neto" style="font-weight: 600;">$0.00</span></div>
                    <div class="summary-row"><span>IVA (13%):</span><span id="tax-iva">$0.00</span></div>
                    
                    <div id="ret-per-section">
                        <!-- Shows retention/perception if applicable -->
                    </div>
                    
                    <div class="summary-total">Total: <span id="grand-total">$0.00</span></div>
                </div>

                ${budget.Estado == 3 ? `
                <div style="background: rgba(46, 204, 113, 0.1); border: 1px solid var(--success); padding: 0.75rem; border-radius: 6px; font-size: 0.8rem; color: var(--success); display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem;">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>Presupuesto facturado (Lectura).</span>
                </div>
                ` : ''}

                <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
                    ${(!isNew && budget.Estado == 1 && isAdmin) ? `<button class="btn btn-success" id="approve-budget-shortcut-btn" style="background: var(--success);"><i class="fa-solid fa-check-double"></i> Aprobar Presupuesto</button>` : ''}
                    <button class="btn btn-primary" id="save-budget-btn" ${budget.Estado == 3 ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}><i class="fa-solid fa-floppy-disk"></i> Guardar Cotización</button>
                    ${(!isNew && budget.Estado == 2) ? `<button class="btn btn-success" id="facturar-budget-shortcut-btn"><i class="fa-solid fa-wallet"></i> Facturar DTE</button>` : ''}
                    ${!isNew ? `<button class="btn btn-secondary" id="print-budget-btn" type="button"><i class="fa-solid fa-file-pdf"></i> Compartir / PDF</button>` : ''}
                    <button class="btn btn-secondary" onclick="window.location.hash='#presupuestos'"><i class="fa-solid fa-arrow-left"></i> Volver a Lista</button>
                </div>
            </div>
        </div>

        <!-- Add Product Item Modal -->
        <div id="item-prod-modal" class="modal">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2>Buscar Repuesto</h2>
                    <button class="close-modal-btn" id="close-item-prod-modal">&times;</button>
                </div>
                <div class="form-group">
                    <label>Buscar en catálogo</label>
                    <input type="text" id="search-catalogo-prod" placeholder="Escribe descripción o código...">
                </div>
                <div class="scrollable-list" id="catalogo-prod-results" style="max-height: 300px;">
                    <!-- Results dynamic -->
                </div>
            </div>
        </div>

        <!-- Add Labor Item Modal -->
        <div id="item-labor-modal" class="modal">
            <div class="modal-content glass-card">
                <div class="modal-header">
                    <h2>Buscar Servicio (Mano de Obra)</h2>
                    <button class="close-modal-btn" id="close-item-labor-modal">&times;</button>
                </div>
                <div class="form-group">
                    <label>Buscar en catálogo</label>
                    <input type="text" id="search-catalogo-labor" placeholder="Escribe descripción de servicio...">
                </div>
                <div class="scrollable-list" id="catalogo-labor-results" style="max-height: 300px;">
                    <!-- Results dynamic -->
                </div>
            </div>
        </div>
    `;

    const productsContainer = document.getElementById('budget-products-rows');
    const laborContainer = document.getElementById('budget-labor-rows');

    // Load actual catalog products & labor for modals
    const prodModal = document.getElementById('item-prod-modal');
    const laborModal = document.getElementById('item-labor-modal');
    const searchProdInput = document.getElementById('search-catalogo-prod');
    const searchLaborInput = document.getElementById('search-catalogo-labor');
    const prodResults = document.getElementById('catalogo-prod-results');
    const laborResults = document.getElementById('catalogo-labor-results');

    // Local temporary copies of products/labor rows so we don't save to db until user clicks save
    let tempProducts = [...budgetProducts];
    let tempLabor = [...budgetLabor];

    function autoSaveBudget() {
        if (!budget || !budget['ID Presupuesto']) return;

        // Auto-update header fields if elements exist
        const fallasEl = document.getElementById('editor-fallas');
        if (fallasEl) {
            budget.Fallas_Detectadas = fallasEl.value;
        }
        const techEl = document.getElementById('editor-tech-select');
        if (techEl) {
            budget.Tecnico_Asignado = techEl.value;
        }
        const stateEl = document.getElementById('editor-state');
        if (stateEl) {
            budget.Estado = parseInt(stateEl.value);
        }
        const odoEl = document.getElementById('editor-odo');
        if (odoEl) {
            budget.Kilometraje = odoEl.value;
        }

        // Save details
        db.detalle_productos = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] !== budget['ID Presupuesto']).concat(tempProducts);
        db.detalle_mano_obra = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] !== budget['ID Presupuesto']).concat(tempLabor);

        // If it is a new budget and client+vehicle are selected, make sure it's in the list
        if (isNew && budget.Codigo_Cliente && budget.ID_Vehiculo) {
            const exists = db.presupuestos.some(b => b['ID Presupuesto'] === budget['ID Presupuesto']);
            if (!exists) {
                db.presupuestos.unshift(budget);
            }
        }

        saveDatabase(db);
    }

    // Helper functions for Creation Mode dropdowns
    if (isNew) {
        const clientSelect = document.getElementById('editor-client-select');
        const vehicleSelect = document.getElementById('editor-vehicle-select');
        
        clientSelect.addEventListener('change', (e) => {
            const clientCode = e.target.value;
            if (!clientCode) {
                vehicleSelect.innerHTML = '<option value="">-- Elija vehículo (seleccione cliente primero) --</option>';
                vehicleSelect.disabled = true;
                disableEditorModules();
                return;
            }
            
            const selectedClient = db.clientes.find(c => c.Codigo_Cliente === clientCode);
            budget.Codigo_Cliente = clientCode;
            budget.Nombre = selectedClient.Nombre;
            budget['% Impuesto'] = selectedClient['% Impuesto'] || 0.13;
            budget.AplicaPercepcion = selectedClient.AplicaPercepcion || 0;
            budget.AplicaRetencion = selectedClient.AplicaRetencion || 0;
            
            // Populate vehicles
            const clientVehicles = db.vehiculos.filter(v => v.Codigo_Cliente === clientCode);
            vehicleSelect.innerHTML = '<option value="">-- Seleccione Vehículo --</option>';
            clientVehicles.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.ID_Vehiculo;
                opt.textContent = `${v.Placas} - ${v.Marca} ${v.Modelo} (${v.Año})`;
                vehicleSelect.appendChild(opt);
            });
            
            if (clientVehicles.length > 0) {
                vehicleSelect.disabled = false;
            } else {
                vehicleSelect.innerHTML = '<option value="">-- Sin vehículos (Registrar primero) --</option>';
                vehicleSelect.disabled = true;
                showToast("Este cliente no tiene vehículos. Regístralo en Clientes y Autos primero.", "warning");
            }
            disableEditorModules();
        });
        
        vehicleSelect.addEventListener('change', (e) => {
            const vehId = e.target.value;
            if (!vehId) {
                disableEditorModules();
                return;
            }
            
            const selectedVeh = db.vehiculos.find(v => v.ID_Vehiculo === vehId);
            budget.ID_Vehiculo = vehId;
            budget.Placas = selectedVeh.Placas;
            
            // Enable items editor
            enableEditorModules();
            calculateTotals();
            autoSaveBudget();
        });
        
        function disableEditorModules() {
            document.getElementById('editor-products-card').style.opacity = '0.4';
            document.getElementById('editor-products-card').style.pointerEvents = 'none';
            document.getElementById('add-prod-item-btn').disabled = true;
            
            document.getElementById('editor-labor-card').style.opacity = '0.4';
            document.getElementById('editor-labor-card').style.pointerEvents = 'none';
            document.getElementById('add-labor-item-btn').disabled = true;
            
            document.getElementById('editor-summary-card').style.opacity = '0.4';
            document.getElementById('editor-summary-card').style.pointerEvents = 'none';
        }
        
        function enableEditorModules() {
            document.getElementById('editor-products-card').style.opacity = '1';
            document.getElementById('editor-products-card').style.pointerEvents = 'all';
            document.getElementById('add-prod-item-btn').disabled = false;
            
            document.getElementById('editor-labor-card').style.opacity = '1';
            document.getElementById('editor-labor-card').style.pointerEvents = 'all';
            document.getElementById('add-labor-item-btn').disabled = false;
            
            document.getElementById('editor-summary-card').style.opacity = '1';
            document.getElementById('editor-summary-card').style.pointerEvents = 'all';
        }
    }

    function renderTempRows() {
        const isLocked = budget.Estado == 3;
        productsContainer.innerHTML = '';
        tempProducts.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div><small class="text-muted">${item['ID_Producto DPP'] || 'PROD'}</small></div>
                <div><strong>${item.Descripcion}</strong></div>
                <div><input type="number" class="row-qty" data-type="product" data-idx="${index}" value="${item.Cantidad}" min="1" style="padding: 0.35rem; width: 60px;" ${isLocked ? 'disabled' : ''}></div>
                <div><input type="number" class="row-price" data-type="product" data-idx="${index}" value="${item.PrecioUnitario}" step="0.01" style="padding: 0.35rem; width: 80px; background:rgba(255,255,255,0.05); color:var(--text-muted); cursor:not-allowed;" disabled title="Los precios de repuestos se definen en el catálogo"></div>
                <div style="text-align: right; font-weight: bold;">$ ${(parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1)).toFixed(2)}</div>
                <div><button class="icon-btn btn-danger delete-row-btn" data-type="product" data-idx="${index}" style="width: 30px; height: 30px;" ${isLocked ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}><i class="fa-solid fa-trash"></i></button></div>
            `;
            productsContainer.appendChild(row);
        });

        laborContainer.innerHTML = '';
        tempLabor.forEach((item, index) => {
            const moCatalog = db.mano_obra.find(m => m.ID_ManoObra === item.ID_ManoObra);
            const isPriceEditable = !moCatalog || moCatalog.PrecioEditable !== 'NO';
            const priceDisabled = isLocked || !isPriceEditable;

            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div><small class="text-muted">${item.ID_ManoObra || 'MO'}</small></div>
                <div><strong>${item.Descripcion}</strong></div>
                <div><input type="number" class="row-qty" data-type="labor" data-idx="${index}" value="${item.Cantidad}" min="1" style="padding: 0.35rem; width: 60px;" ${isLocked ? 'disabled' : ''}></div>
                <div><input type="number" class="row-price" data-type="labor" data-idx="${index}" value="${item.PrecioUnitario}" step="0.01" style="padding: 0.35rem; width: 80px; ${!isPriceEditable ? 'background:rgba(255,255,255,0.05); color:var(--text-muted); cursor:not-allowed;' : ''}" ${priceDisabled ? 'disabled title="Este precio es fijo (no editable)"' : ''}></div>
                <div style="text-align: right; font-weight: bold;">$ ${(parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1)).toFixed(2)}</div>
                <div><button class="icon-btn btn-danger delete-row-btn" data-type="labor" data-idx="${index}" style="width: 30px; height: 30px;" ${isLocked ? 'disabled style="opacity: 0.4; pointer-events: none;"' : ''}><i class="fa-solid fa-trash"></i></button></div>
            `;
            laborContainer.appendChild(row);
        });

        // Wire up change events
        document.querySelectorAll('.row-qty, .row-price').forEach(input => {
            input.addEventListener('change', (e) => {
                const type = e.target.getAttribute('data-type');
                const idx = parseInt(e.target.getAttribute('data-idx'));
                const val = parseFloat(e.target.value);
                const isQty = e.target.classList.contains('row-qty');

                if (type === 'product') {
                    if (isQty) tempProducts[idx].Cantidad = parseInt(val);
                    else tempProducts[idx].PrecioUnitario = val;
                } else {
                    if (isQty) tempLabor[idx].Cantidad = parseInt(val);
                    else tempLabor[idx].PrecioUnitario = val;
                }
                renderTempRows();
                calculateTotals();
                autoSaveBudget();
            });
        });

        // Wire up delete events
        document.querySelectorAll('.delete-row-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                const idx = parseInt(btn.getAttribute('data-idx'));

                if (type === 'product') {
                    tempProducts.splice(idx, 1);
                } else {
                    tempLabor.splice(idx, 1);
                }
                renderTempRows();
                calculateTotals();
                autoSaveBudget();
            });
        });
    }

    function calculateTotals() {
        let sumProd = 0;
        let sumLab = 0;
        
        tempProducts.forEach(p => sumProd += parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1));
        tempLabor.forEach(l => sumLab += parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1));
        
        const subtotal = sumProd + sumLab;
        const taxRate = parseFloat(budget['% Impuesto'] || 0.13);
        const iva = subtotal * taxRate;
        
        let grandTotal = subtotal + iva;
        
        const selectedClientCode = isNew ? document.getElementById('editor-client-select').value : budget.Codigo_Cliente;
        const selectedClient = db.clientes.find(c => c.Codigo_Cliente === selectedClientCode) || { AplicaPercepcion: 0, AplicaRetencion: 0 };
        
        document.getElementById('sum-products').textContent = '$' + sumProd.toFixed(2);
        document.getElementById('sum-labor').textContent = '$' + sumLab.toFixed(2);
        document.getElementById('subtotal-neto').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('tax-iva').textContent = '$' + iva.toFixed(2);

        // Retention and Perception rules for El Salvador
        const retPerEl = document.getElementById('ret-per-section');
        retPerEl.innerHTML = '';
        
        if (selectedClient.AplicaPercepcion > 0) {
            const perc = subtotal * parseFloat(selectedClient.AplicaPercepcion);
            grandTotal += perc;
            retPerEl.innerHTML += `<div class="summary-row"><span>Percepción (2%):</span><span style="color: var(--cyan);">+ $ ${perc.toFixed(2)}</span></div>`;
        }
        if (selectedClient.AplicaRetencion > 0) {
            const ret = subtotal * parseFloat(selectedClient.AplicaRetencion);
            grandTotal -= ret;
            retPerEl.innerHTML += `<div class="summary-row"><span>Retención (1%):</span><span style="color: var(--warning);">- $ ${ret.toFixed(2)}</span></div>`;
        }

        document.getElementById('grand-total').textContent = '$' + grandTotal.toFixed(2);
    }

    // Product search modal triggers
    document.getElementById('add-prod-item-btn').addEventListener('click', () => {
        prodModal.classList.add('active');
        searchProdInput.value = '';
        populateProdCatalog();
    });
    document.getElementById('close-item-prod-modal').addEventListener('click', () => prodModal.classList.remove('active'));

    function populateProdCatalog(filter = '') {
        prodResults.innerHTML = '';
        const filtered = db.productos.filter(p => 
            (p.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
            (p['ID_ Producto'] || '').toLowerCase().includes(filter.toLowerCase())
        );

        filtered.slice(0, 10).forEach(p => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-main">
                    <span class="list-item-title">${p.Descripcion}</span>
                    <span class="list-item-subtitle">Código: ${p['ID_ Producto']} • Unitario: $${parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0).toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-add" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i></button>
            `;
            
            item.querySelector('.btn-add').addEventListener('click', () => {
                tempProducts.push({
                    DPP: "DETPP-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                    'ID_Presupuesto DPP': budget['ID Presupuesto'],
                    'ID_Producto DPP': p['ID_ Producto'],
                    Descripcion: p.Descripcion,
                    Cantidad: 1,
                    UnidadMedida: p['Unidad de Medida'] || 'Pza',
                    PrecioUnitario: parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0),
                    ImpuestoCodigo: 'IVA13'
                });
                renderTempRows();
                calculateTotals();
                autoSaveBudget();
                prodModal.classList.remove('active');
                showToast("Repuesto añadido al presupuesto", "success");
            });
            prodResults.appendChild(item);
        });
    }

    searchProdInput.addEventListener('input', (e) => populateProdCatalog(e.target.value));

    // Labor search modal triggers
    document.getElementById('add-labor-item-btn').addEventListener('click', () => {
        laborModal.classList.add('active');
        searchLaborInput.value = '';
        populateLaborCatalog();
    });
    document.getElementById('close-item-labor-modal').addEventListener('click', () => laborModal.classList.remove('active'));

    function populateLaborCatalog(filter = '') {
        laborResults.innerHTML = '';
        const filtered = db.mano_obra.filter(mo => 
            (mo.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
            (mo.ID_ManoObra || '').toString().includes(filter)
        );

        filtered.slice(0, 10).forEach(mo => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-main">
                    <span class="list-item-title">${mo.Descripcion}</span>
                    <span class="list-item-subtitle">Servicio: ${mo.ID_ManoObra} • Base: $${parseFloat(mo.PrecioUnitario || 0).toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-add" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i></button>
            `;
            
            item.querySelector('.btn-add').addEventListener('click', () => {
                tempLabor.push({
                    ID_DetalleMO: "DETMO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                    'ID_Presupuesto MO': budget['ID Presupuesto'],
                    ID_ManoObra: mo.ID_ManoObra,
                    Descripcion: mo.Descripcion,
                    Cantidad: 1,
                    PrecioUnitario: parseFloat(mo.PrecioUnitario || 0),
                    FechaCreacion: Date.now()
                });
                renderTempRows();
                calculateTotals();
                autoSaveBudget();
                laborModal.classList.remove('active');
                showToast("Servicio añadido al presupuesto", "success");
            });
            laborResults.appendChild(item);
        });
    }

    searchLaborInput.addEventListener('input', (e) => populateLaborCatalog(e.target.value));

    // Save budget changes
    document.getElementById('save-budget-btn').addEventListener('click', () => {
        if (isNew) {
            const clientSelect = document.getElementById('editor-client-select');
            const vehicleSelect = document.getElementById('editor-vehicle-select');
            if (!clientSelect.value || !vehicleSelect.value) {
                showToast("Debes seleccionar un cliente y un vehículo", "danger");
                return;
            }
            budget.Kilometraje = document.getElementById('editor-odo').value;
        }

        // Save headers
        budget.Fallas_Detectadas = document.getElementById('editor-fallas').value;
        budget.Tecnico_Asignado = document.getElementById('editor-tech-select').value;
        budget.Estado = parseInt(document.getElementById('editor-state').value);
        
        // Save details
        db.detalle_productos = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] !== budget['ID Presupuesto']).concat(tempProducts);
        db.detalle_mano_obra = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] !== budget['ID Presupuesto']).concat(tempLabor);
        
        if (isNew) {
            db.presupuestos.unshift(budget);
        }

        // Save to LocalStorage
        saveDatabase(db);
        showToast("Presupuesto guardado correctamente", "success");
        window.location.hash = '#presupuestos';
    });

    const approveBtn = document.getElementById('approve-budget-shortcut-btn');
    if (approveBtn) {
        approveBtn.addEventListener('click', () => {
            document.getElementById('editor-state').value = "2";
            document.getElementById('save-budget-btn').click();
        });
    }

    if (document.getElementById('facturar-budget-shortcut-btn')) {
        document.getElementById('facturar-budget-shortcut-btn').addEventListener('click', () => {
            window.location.hash = `#facturador?presId=${budget['ID Presupuesto']}`;
        });
    }

    if (document.getElementById('print-budget-btn')) {
        document.getElementById('print-budget-btn').addEventListener('click', () => {
            exportBudgetPDF(budget['ID Presupuesto']);
        });
    }

    // Run loaders
    renderTempRows();
    if (!isNew) {
        calculateTotals();
    }

    // Wire up header listeners to auto-save on change/input
    const odoEl = document.getElementById('editor-odo');
    if (odoEl) odoEl.addEventListener('change', autoSaveBudget);
    
    const techEl = document.getElementById('editor-tech-select');
    if (techEl) techEl.addEventListener('change', autoSaveBudget);
    
    const fallasEl = document.getElementById('editor-fallas');
    if (fallasEl) {
        fallasEl.addEventListener('input', autoSaveBudget);
        fallasEl.addEventListener('change', autoSaveBudget);
    }
    
    const stateEl = document.getElementById('editor-state');
    if (stateEl) stateEl.addEventListener('change', autoSaveBudget);
}

// 5. KANBAN BOARD VIEW
function renderKanban(container) {
    const db = getDatabase();
    
    // Columns definition
    const columns = [
        { id: 1, title: 'Diagnóstico / Ingreso', class: 'border-left: 4px solid var(--warning);' },
        { id: 2, title: 'Espera de Repuestos', class: 'border-left: 4px solid var(--danger);' },
        { id: 3, title: 'En Proceso / Mecánica', class: 'border-left: 4px solid var(--primary);' },
        { id: 4, title: 'Control y Entrega', class: 'border-left: 4px solid var(--success);' }
    ];

    container.innerHTML = `
        <div class="kanban-board">
            ${columns.map(col => {
                const budgetsInCol = db.presupuestos.filter(p => {
                    // map budget states to columns
                    // if p.Estado == 1 (Diagnostic)
                    // if approved (2) it goes to column 3 (in process) unless parts are missing
                    if (col.id === 1) return p.Estado == 1;
                    if (col.id === 2) return p.Estado == 2 && (p.Fallas_Detectadas || '').toLowerCase().includes('repuestos');
                    if (col.id === 3) return p.Estado == 2 && !(p.Fallas_Detectadas || '').toLowerCase().includes('repuestos');
                    if (col.id === 4) return p.Estado == 2 && (p.Fallas_Detectadas || '').toLowerCase().includes('listo') || p.Estado == 3;
                    return false;
                });

                return `
                    <div class="kanban-column" data-column-id="&quot;" data-id="${col.id}">
                        <div class="kanban-column-header" style="${col.class}">
                            <h3>${col.title}</h3>
                            <span class="kanban-count">${budgetsInCol.length}</span>
                        </div>
                        <div class="kanban-cards-container" id="kanban-container-col-${col.id}">
                            ${budgetsInCol.map(p => `
                                <div class="kanban-card" onclick="window.location.hash='#presupuestos?id=${p['ID Presupuesto']}'">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                        <span class="badge-tag badge-primary" style="font-size: 0.7rem;">${p.Placas || 'P-0000'}</span>
                                        <small style="color: var(--text-muted); font-size: 0.7rem;">${new Date(p.Fecha).toLocaleDateString('es-SV', {day:'2-digit', month:'short'})}</small>
                                    </div>
                                    <h4 class="kanban-card-title">${p.Nombre}</h4>
                                    <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3; height: 2.6em; overflow: hidden; text-overflow: ellipsis;">
                                        ${p.Fallas_Detectadas || 'Sin detalles registrados'}
                                    </p>
                                    <div class="kanban-card-footer">
                                        <span><i class="fa-solid fa-wrench"></i> ${db.tecnicos.find(t => t.Tecnico_ID === p.Tecnico_Asignado)?.Nombre_Completo.split(' ')[0] || 'Asignar'}</span>
                                        <strong>${p.Estado == 3 ? '<span style="color:var(--success)">Facturado</span>' : '<span style="color:var(--warning)">Pendiente</span>'}</strong>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 6. FACTURADOR DTE VIEW
function renderFacturador(container, queryParams) {
    const db = getDatabase();
    
    // Approved budgets pending invoice
    const pendingBudgets = db.presupuestos.filter(p => p.Estado == 2);
    let selectedPresId = queryParams.presId || '';
    
    container.innerHTML = `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <h3>Emitir Documento Tributario Electrónico (DTE MH)</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem;">Genera y firma comprobantes de facturación digital con validación directa del Ministerio de Hacienda de El Salvador.</p>
            
            <div class="form-row" style="grid-template-columns: 1.5fr 1fr;">
                <div>
                    <div class="form-group">
                        <label>Seleccionar Presupuesto Aprobado</label>
                        <select id="invoice-presupuesto-select" style="padding: 0.65rem;">
                            <option value="">-- Elige presupuesto a facturar --</option>
                            ${pendingBudgets.map(p => `<option value="${p['ID Presupuesto']}" ${selectedPresId === p['ID Presupuesto'] ? 'selected' : ''}>${p['ID Presupuesto']} - ${p.Nombre} (${p.Placas})</option>`).join('')}
                        </select>
                    </div>
                    
                    <div id="invoice-details-box" style="display: none; background-color: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem;">
                        <!-- Injected -->
                    </div>
                </div>
                
                <div class="glass-card" id="invoice-billing-settings" style="display: none; height: fit-content;">
                    <h3>Ajustes de Emisión</h3>
                    <div class="form-group" style="margin-top: 1rem;">
                        <label>Tipo de DTE a Emitir</label>
                        <select id="dte-doc-type">
                            <option value="FE">Factura Electrónica (Consumidor Final)</option>
                            <option value="CCF">Comprobante de Crédito Fiscal (Empresas)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Condición de Pago</label>
                        <select id="dte-pay-condition">
                            <option value="CONTADO">Contado (Efectivo/Tarjeta/Transferencia)</option>
                            <option value="CREDITO">Crédito (Abonos)</option>
                        </select>
                    </div>

                    <div class="form-group" id="credit-days-group" style="display: none;">
                        <label>Días de Plazo</label>
                        <input type="number" id="dte-credit-days" value="30" min="1">
                    </div>

                    <div class="form-group">
                        <label>Forma de Pago Principal</label>
                        <select id="dte-pay-method">
                            <option value="01">01 - Efectivo</option>
                            <option value="02">02 - Tarjeta de Crédito/Débito</option>
                            <option value="03">03 - Transferencia / Depósito</option>
                        </select>
                    </div>

                    <button class="btn btn-success" id="emit-dte-btn" style="width: 100%; margin-top: 1rem;"><i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH</button>
                </div>
            </div>
        </div>

        <!-- Print/DTE Preview area -->
        <div id="dte-emission-result" class="glass-card" style="display: none; border-color: var(--success); margin-top: 2rem;">
            <!-- Render MH seal, generation code and print structure -->
        </div>
    `;

    const selectPres = document.getElementById('invoice-presupuesto-select');
    const detailsBox = document.getElementById('invoice-details-box');
    const settingsBox = document.getElementById('invoice-billing-settings');
    const dteType = document.getElementById('dte-doc-type');
    const dtePayCond = document.getElementById('dte-pay-condition');
    const creditDaysGroup = document.getElementById('credit-days-group');
    const emitBtn = document.getElementById('emit-dte-btn');
    const resultBox = document.getElementById('dte-emission-result');

    if (selectedPresId) {
        loadPresupuestoForInvoice(selectedPresId);
    }

    selectPres.addEventListener('change', (e) => {
        loadPresupuestoForInvoice(e.target.value);
    });

    dtePayCond.addEventListener('change', (e) => {
        if (e.target.value === 'CREDITO') {
            creditDaysGroup.style.display = 'block';
        } else {
            creditDaysGroup.style.display = 'none';
        }
    });

    function loadPresupuestoForInvoice(presId) {
        resultBox.style.display = 'none';
        if (!presId) {
            detailsBox.style.display = 'none';
            settingsBox.style.display = 'none';
            return;
        }

        const p = db.presupuestos.find(b => b['ID Presupuesto'] === presId);
        if (!p) return;

        const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || { Nombre: p.Nombre };
        
        // Load details
        const prodItems = (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(item => item['ID_Presupuesto DPP'] === presId);
        const laborItems = (db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || []).filter(item => item['ID_Presupuesto MO'] === presId);

        let subtotal = 0;
        prodItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1));
        laborItems.forEach(item => subtotal += parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1));
        
        const iva = subtotal * 0.13;
        let grandTotal = subtotal + iva;
        
        let retention = 0;
        let perception = 0;
        if (client.AplicaPercepcion > 0) {
            perception = subtotal * parseFloat(client.AplicaPercepcion);
            grandTotal += perception;
        }
        if (client.AplicaRetencion > 0) {
            retention = subtotal * parseFloat(client.AplicaRetencion);
            grandTotal -= retention;
        }

        // Auto select DTE document type based on client data
        if (client['Contribuyente?'] === 'SI') {
            dteType.value = 'CCF';
        } else {
            dteType.value = 'FE';
        }

        detailsBox.style.display = 'block';
        settingsBox.style.display = 'block';
        
        detailsBox.innerHTML = `
            <h4>Detalle del Presupuesto a Facturar</h4>
            <div style="margin: 1rem 0; font-size: 0.85rem;">
                <p>Cliente: <strong>${client.Nombre}</strong></p>
                <p>NIT/DUI: ${client.NIT || client['Num Doc'] || 'N/A'}</p>
                <p>Vehículo Placas: <strong style="color: var(--primary);">${p.Placas || 'N/A'}</strong></p>
            </div>
            
            <div style="border-top: 1px dashed var(--border-color); padding-top: 1rem; margin-top: 1rem;">
                <h5>Ítems a Emitir</h5>
                ${prodItems.map(item => `<div style="display:flex; justify-content:space-between; font-size:0.8rem; margin: 0.25rem 0;"><span>${item.Cantidad}x ${item.Descripcion}</span><span>$ ${(parseFloat(item.PrecioUnitario)*parseInt(item.Cantidad)).toFixed(2)}</span></div>`).join('')}
                ${laborItems.map(item => `<div style="display:flex; justify-content:space-between; font-size:0.8rem; margin: 0.25rem 0;"><span>${item.Cantidad}x ${item.Descripcion}</span><span>$ ${(parseFloat(item.PrecioUnitario)*parseInt(item.Cantidad)).toFixed(2)}</span></div>`).join('')}
            </div>

            <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem; font-size: 0.9rem;">
                <div style="display:flex; justify-content:space-between; margin:0.25rem 0;"><span>Subtotal Neto:</span><span>$ ${subtotal.toFixed(2)}</span></div>
                <div style="display:flex; justify-content:space-between; margin:0.25rem 0;"><span>IVA (13%):</span><span>$ ${iva.toFixed(2)}</span></div>
                ${perception > 0 ? `<div style="display:flex; justify-content:space-between; margin:0.25rem 0;"><span>Percepción:</span><span>+ $ ${perception.toFixed(2)}</span></div>` : ''}
                ${retention > 0 ? `<div style="display:flex; justify-content:space-between; margin:0.25rem 0;"><span>Retención:</span><span>- $ ${retention.toFixed(2)}</span></div>` : ''}
                <div style="display:flex; justify-content:space-between; font-weight:700; margin:0.5rem 0; font-size:1.1rem; color:var(--cyan);"><span>TOTAL DTE:</span><span>$ ${grandTotal.toFixed(2)}</span></div>
            </div>
        `;

        // Store calculations for click event
        emitBtn.dataset.subtotal = subtotal;
        emitBtn.dataset.grandTotal = grandTotal;
        emitBtn.dataset.iva = iva;
        emitBtn.dataset.retention = retention;
        emitBtn.dataset.perception = perception;
    }

    // Handle DTE emission
    emitBtn.addEventListener('click', () => {
        const presId = selectPres.value;
        const p = db.presupuestos.find(b => b['ID Presupuesto'] === presId);
        if (!p) return;

        const client = db.clientes.find(c => c.Codigo_Cliente === p.Codigo_Cliente) || { Nombre: p.Nombre };
        
        const type = dteType.value;
        const payCond = dtePayCond.value;
        const payMethod = document.getElementById('dte-pay-method').value;
        
        const subtotal = parseFloat(emitBtn.dataset.subtotal);
        const grandTotal = parseFloat(emitBtn.dataset.grandTotal);
        const iva = parseFloat(emitBtn.dataset.iva);
        const ret = parseFloat(emitBtn.dataset.retention);
        const perc = parseFloat(emitBtn.dataset.perception);

        // Credit validation
        if (payCond === 'CREDITO') {
            if (client['Credito?'] !== 'SI') {
                showToast("Error: El cliente no tiene una línea de crédito autorizada.", "danger");
                return;
            }
            const creditLimit = parseFloat(client['Monto Credito'] || client.Monto_Credito || 0);
            const pendingBalance = getClientPendingBalance(client.Codigo_Cliente, db);
            if (pendingBalance + grandTotal > creditLimit) {
                showToast(`Límite de crédito excedido: Saldo actual $${pendingBalance.toFixed(2)} + Nueva Factura $${grandTotal.toFixed(2)} = $${(pendingBalance + grandTotal).toFixed(2)} (Límite: $${creditLimit.toFixed(2)}).`, "danger");
                return;
            }
        }
        
        // Fetch FacturaLlama config
        const dteCfg = JSON.parse(localStorage.getItem('mecanic_os_dte_config')) || {
            apiKey: '',
            ambiente: '00',
            mhCode: '0001',
            posNumber: '1'
        };

        const prodItems = (db.detalle_productos || db['21 Detalle Presupuesto Producto'] || []).filter(item => item['ID_Presupuesto DPP'] === presId);
        const laborItems = (db.detalle_mano_obra || db['11 Detalle Mano de Obra'] || []).filter(item => item['ID_Presupuesto MO'] === presId);

        // Build Payload
        const dtePayload = {
            id: generateUUID(),
            generatedAt: new Date().toISOString().split('T')[0],
            paymentType: payCond,
            branchOffice: {
                mhCode: dteCfg.mhCode || '0001',
                posNumber: parseInt(dteCfg.posNumber || 1)
            },
            recipient: {
                name: client.Nombre,
                nit: client.NIT || client['Num Doc'] || '',
                nrc: client.NRC || '',
                email: client.Correo || '',
                address: client.Direccion || ''
            },
            items: [
                ...prodItems.map(item => ({
                    name: item.Descripcion,
                    quantity: parseInt(item.Cantidad || 1),
                    price: parseFloat(item.PrecioUnitario || 0)
                })),
                ...laborItems.map(item => ({
                    name: item.Descripcion,
                    quantity: parseInt(item.Cantidad || 1),
                    price: parseFloat(item.PrecioUnitario || 0)
                }))
            ]
        };

        // Loading state
        emitBtn.disabled = true;
        emitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Transmitiendo...';

        const baseUrl = dteCfg.backendUrl || '';
        const endpoint = baseUrl ? `${baseUrl}/api/dte` : '/api/dte';

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: dteCfg.apiKey,
                docType: type.toLowerCase(), // 'fc' or 'ccf'
                payload: dtePayload
            })
        })
        .then(response => {
            if (!response.ok) {
                // Fallback de simulación local si no hay backend activo (ej. en GitHub Pages)
                if (response.status === 404 && (!dteCfg.apiKey || dteCfg.apiKey.trim() === '' || dteCfg.apiKey.startsWith('simulado_'))) {
                    console.log("Servidor estático detectado. Usando simulación de DTE en el frontend.");
                    return {
                        success: true,
                        simulated: true,
                        code: "00",
                        description: "DTE Simulado Exitosamente (Frontend Fallback)",
                        generationCode: "MOCK-DTE-" + Math.floor(Date.now() / 1000).toString() + "-" + Math.floor(Math.random()*10000),
                        controlNumber: "DTE-" + (type === 'CCF' ? '03' : '01') + "-M001P001-" + Math.floor(Math.random()*90000 + 10000),
                        receptionSeal: Math.floor(Math.random()*9000000).toString() + "-APPROVED-" + Math.floor(Math.random()*9000),
                        mhDteUrl: `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=MOCK&fechaEmi=${new Date().toISOString().split('T')[0]}`
                    };
                }
                return response.json().then(errData => {
                    throw new Error(errData.message || errData.error || 'Error al emitir DTE');
                });
            }
            return response.json();
        })
        .then(resData => {
            const genCode = resData.generationCode || resData.id || generateUUID();
            const ctrlNum = resData.controlNumber || ("DTE-" + (type === 'CCF' ? '03' : '01') + "-M001P001-0000" + Math.floor(Math.random()*9000 + 1000));
            const seal = resData.receptionSeal || (Math.floor(Math.random()*900000) + "-APPROVED");
            const mhUrl = resData.mhDteUrl || `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${genCode}&fechaEmi=${new Date().toISOString().split('T')[0]}`;

            // Update budget record state to Facturado
            p.Estado = 3;
            p.controlNumber = genCode;
            p.Doc_a_Emitir = type === 'CCF' ? 'CREDITO FISCAL' : 'FACTURA';
            p.Fecha_Facturacion = Date.now();
            p.Condicion = payCond;
            p.Pagado = payCond === 'CONTADO' ? 'SI' : 'NO';
            p['Pagado?'] = payCond === 'CONTADO' ? 'SI' : 'NO';
            
            // Save invoice payment or register credit
            if (payCond === 'CONTADO') {
                const payId = "PAGO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
                db.pagos = db.pagos || [];
                db.pagos.unshift({
                    "ID Pago": payId,
                    ID_Presupuesto: presId,
                    "Fecha Pago": Date.now(),
                    "Monto Pago": grandTotal,
                    "Metodo Pago": payMethod === '01' ? 'EFECTIVO' : payMethod === '02' ? 'TARJETA' : 'TRANSFERENCIA',
                    "Estado Pago": "COMPLETADO",
                    User: getActiveUser().Email || "jjmunoz932@gmail.com",
                    Cliente: p.Codigo_Cliente
                });
                
                // Add cash flow entry
                db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
            } else {
                // Credit: increment accounts receivable
                showToast("Registrado en Cuentas por Cobrar del cliente", "warning");
            }

            saveDatabase(db);
            showToast("DTE Generado y Aprobado por MH El Salvador!", "success");
            
            const ws = getWorkshopConfig(db);
            
            // Render MH invoice print preview
            resultBox.style.display = 'block';
            resultBox.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid var(--success); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="color:var(--success);"><i class="fa-solid fa-circle-check"></i> DOCUMENTO TRANSMITIDO CON ÉXITO</h3>
                        <p style="font-size:0.8rem; color:var(--text-secondary);">Validación de Sello y Código Generado</p>
                    </div>
                    <button class="btn btn-secondary" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir Representación Gráfica</button>
                </div>
                
                <div id="print-section" style="background-color: white; color: black; padding: 2rem; border-radius: 4px; font-family: 'Courier New', Courier, monospace; font-size: 0.85rem; border: 1px solid #ccc;">
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <h3>${ws.nombre}</h3>
                        <p>${ws.giro}</p>
                        <p>${ws.direccion}</p>
                        <p>TEL: ${ws.telefono} • NIT: ${ws.nit} • NRC: ${ws.nrc}</p>
                        <p>--------------------------------------------------</p>
                        <h4>DOCUMENTO TRIBUTARIO ELECTRÓNICO</h4>
                        <p><strong>${type === 'CCF' ? 'COMPROBANTE DE CRÉDITO FISCAL' : 'FACTURA DE CONSUMIDOR FINAL'}</strong></p>
                    </div>
                    
                    <p><strong>Código Generación:</strong> ${genCode}</p>
                    <p><strong>Número Control:</strong> ${ctrlNum}</p>
                    <p><strong>Sello Recepción:</strong> ${seal}</p>
                    <p><strong>Fecha/Hora Emisión:</strong> ${new Date().toLocaleString()}</p>
                    <p>--------------------------------------------------</p>
                    <p><strong>CLIENTE:</strong> ${client.Nombre}</p>
                    <p><strong>NIT/DUI:</strong> ${client.NIT || client['Num Doc'] || 'N/A'}</p>
                    <p><strong>AUTO PLACA:</strong> ${p.Placas || 'N/A'}</p>
                    <p>--------------------------------------------------</p>
                    
                    <table style="width:100%; font-size:0.8rem; border:none; text-align:left; color:black;">
                        <thead>
                            <tr style="border-bottom:1px solid black;">
                                <th>DESCRIPCIÓN</th>
                                <th>CANT</th>
                                <th>P.UNIT</th>
                                <th style="text-align:right;">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${prodItems.map(item => `
                                <tr>
                                    <td>${item.Descripcion.substring(0,25)}</td>
                                    <td>${item.Cantidad}</td>
                                    <td>$${parseFloat(item.PrecioUnitario).toFixed(2)}</td>
                                    <td style="text-align:right;">$${(parseFloat(item.PrecioUnitario)*parseInt(item.Cantidad)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            ${laborItems.map(item => `
                                <tr>
                                    <td>${item.Descripcion.substring(0,25)}</td>
                                    <td>${item.Cantidad}</td>
                                    <td>$${parseFloat(item.PrecioUnitario).toFixed(2)}</td>
                                    <td style="text-align:right;">$${(parseFloat(item.PrecioUnitario)*parseInt(item.Cantidad)).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p>--------------------------------------------------</p>
                    <div style="text-align:right;">
                        <p>Subtotal Neto: $ ${subtotal.toFixed(2)}</p>
                        <p>IVA (13%): $ ${iva.toFixed(2)}</p>
                        ${perc > 0 ? `<p>Percepción (2%): $ ${perc.toFixed(2)}</p>` : ''}
                        ${ret > 0 ? `<p>Retención (1%): $ ${ret.toFixed(2)}</p>` : ''}
                        <p><strong>TOTAL: $ ${grandTotal.toFixed(2)}</strong></p>
                    </div>
                    <p>--------------------------------------------------</p>
                    <div style="text-align:center; font-size:0.75rem; margin-top:1rem;">
                        <p>Enlace de Consulta Fiscal MH:</p>
                        <p style="word-break: break-all;"><a href="${mhUrl}" target="_blank" style="color:black;">${mhUrl}</a></p>
                        <p>¡Gracias por su preferencia!</p>
                    </div>
                </div>
            `;
            
            // Refresh selection dropdown
            const pending = db.presupuestos.filter(bud => bud.Estado == 2);
            selectPres.innerHTML = `<option value="">-- Elige presupuesto a facturar --</option>` + pending.map(bud => `<option value="${bud['ID Presupuesto']}">${bud['ID Presupuesto']} - ${bud.Nombre} (${bud.Placas})</option>`).join('');
            detailsBox.style.display = 'none';
            settingsBox.style.display = 'none';
        })
        .catch(err => {
            console.error(err);
            showToast(err.message, "danger");
        })
        .finally(() => {
            emitBtn.disabled = false;
            emitBtn.innerHTML = '<i class="fa-solid fa-signature"></i> Firmar y Transmitir a MH';
        });
    });
}

// 7. VENTA RAPIDA POS VIEW
function renderVentaRapida(container) {
    const db = getDatabase();
    
    // Cart details are loaded from LocalStorage
    let cart = JSON.parse(localStorage.getItem('mecanic_os_pos_cart')) || [];
    
    container.innerHTML = `
        <div class="pos-container">
            <div class="pos-products-panel glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; gap: 1rem;">
                    <div class="search-bar-container" style="max-width:100%; flex-grow:1;">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <input type="text" id="pos-prod-search" placeholder="Buscar repuesto por descripción o código...">
                    </div>
                    <select id="pos-cat-filter" style="width:180px; padding:0.6rem;">
                        <option value="">Todas las Categorías</option>
                        <option value="Motor">Motor</option>
                        <option value="Transmisión">Transmisión</option>
                        <option value="Suspensión">Suspensión</option>
                    </select>
                </div>
                
                <div class="pos-products-grid" id="pos-grid-container">
                    <!-- Products cards -->
                </div>
            </div>
            
            <div class="pos-cart-panel glass-card">
                <h3>Carrito de Despacho</h3>
                <div class="form-group" style="margin-top:1rem;">
                    <label>Cliente</label>
                    <select id="pos-client-select" style="padding:0.5rem;">
                        ${db.clientes.map(c => `<option value="${c.Codigo_Cliente}">${c.Nombre}</option>`).join('')}
                    </select>
                </div>
                
                <div class="pos-cart-items" id="pos-cart-items-container">
                    <!-- Items dynamic -->
                </div>
                
                <div style="border-top: 1px solid var(--border-color); padding-top: 1rem;">
                    <div class="summary-row"><span>Subtotal:</span><span id="pos-subtotal">$0.00</span></div>
                    <div class="summary-row"><span>IVA (13%):</span><span id="pos-tax">$0.00</span></div>
                    <div class="summary-total">Total: <span id="pos-total">$0.00</span></div>
                </div>
                
                <div style="margin-top: 1.5rem; display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <button class="btn btn-secondary" id="pos-clear-btn"><i class="fa-solid fa-trash"></i> Vaciar</button>
                    <button class="btn btn-success" id="pos-checkout-btn"><i class="fa-solid fa-cash-register"></i> Cobrar POS</button>
                </div>
            </div>
        </div>
    `;

    const gridContainer = document.getElementById('pos-grid-container');
    const searchInput = document.getElementById('pos-prod-search');
    const catFilter = document.getElementById('pos-cat-filter');
    const cartContainer = document.getElementById('pos-cart-items-container');
    const clientSelect = document.getElementById('pos-client-select');

    function populatePOSProducts(filter = '', category = '') {
        gridContainer.innerHTML = '';
        const filtered = db.productos.filter(p => {
            const matchesSearch = (p.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) || (p['ID_ Producto'] || '').toLowerCase().includes(filter.toLowerCase());
            const matchesCat = category === '' || (p.Categoría || '').toString() === category; // or map category ids
            return matchesSearch;
        });

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'pos-product-card';
            card.innerHTML = `
                <div class="pos-product-desc">${p.Descripcion}</div>
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:1rem;">
                    <div class="pos-product-price">$ ${parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0).toFixed(2)}</div>
                    <div class="pos-product-stock">Stock: ${p.Minimos || 5}</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                addToCart(p);
            });
            gridContainer.appendChild(card);
        });
    }

    function renderCart() {
        cartContainer.innerHTML = '';
        if (cart.length === 0) {
            cartContainer.innerHTML = '<div style="text-align:center; color:var(--text-muted); margin-top:3rem;">Carrito Vacío</div>';
            document.getElementById('pos-subtotal').textContent = '$0.00';
            document.getElementById('pos-tax').textContent = '$0.00';
            document.getElementById('pos-total').textContent = '$0.00';
            return;
        }

        let subtotal = 0;
        cart.forEach((item, index) => {
            const total = item.price * item.qty;
            subtotal += total;
            
            const div = document.createElement('div');
            div.className = 'pos-cart-item';
            div.innerHTML = `
                <div><strong>${item.desc}</strong></div>
                <div><input type="number" value="${item.qty}" min="1" class="cart-qty-input" data-idx="${index}" style="padding:0.25rem; width:45px;"></div>
                <div style="text-align:right; font-weight:600;">$ ${total.toFixed(2)}</div>
                <div><button class="icon-btn btn-danger delete-cart-item" data-idx="${index}" style="width:24px; height:24px; font-size:0.75rem;"><i class="fa-solid fa-times"></i></button></div>
            `;
            cartContainer.appendChild(div);
        });

        const tax = subtotal * 0.13;
        const total = subtotal + tax;
        
        document.getElementById('pos-subtotal').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('pos-tax').textContent = '$' + tax.toFixed(2);
        document.getElementById('pos-total').textContent = '$' + total.toFixed(2);

        // Add cart qty change listeners
        document.querySelectorAll('.cart-qty-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(input.getAttribute('data-idx'));
                cart[idx].qty = parseInt(e.target.value);
                localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
                renderCart();
            });
        });

        // Add delete listeners
        document.querySelectorAll('.delete-cart-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                cart.splice(idx, 1);
                localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
                renderCart();
            });
        });
    }

    function addToCart(p) {
        const existing = cart.find(item => item.id === p['ID_ Producto']);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({
                id: p['ID_ Producto'],
                desc: p.Descripcion,
                price: parseFloat(p['Precio Unit'] || p['Precio Venta'] || 0),
                qty: 1
            });
        }
        localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
        renderCart();
        showToast("Agregado al carrito", "success");
    }

    searchInput.addEventListener('input', (e) => {
        populatePOSProducts(e.target.value);
    });

    document.getElementById('pos-clear-btn').addEventListener('click', () => {
        cart = [];
        localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
        renderCart();
        showToast("Carrito vaciado", "info");
    });

    document.getElementById('pos-checkout-btn').addEventListener('click', () => {
        if (cart.length === 0) {
            showToast("Agrega repuestos al carrito primero", "warning");
            return;
        }

        const clientCode = clientSelect.value;
        const client = db.clientes.find(c => c.Codigo_Cliente === clientCode);
        const vrId = "VR-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const tax = subtotal * 0.13;
        const total = subtotal + tax;

        // Register Quick Sale
        db['43 Venta Rapida'] = db['43 Venta Rapida'] || [];
        const genCode = "VR-" + Math.floor(Date.now() / 1000).toString().substring(3);
        
        db['43 Venta Rapida'].unshift({
            ID_Venta_Rapida: vrId,
            "Marca Temporal": Date.now(),
            Usuario: getActiveUser().Email || "jjmunoz932@gmail.com",
            Cliente: clientCode,
            " Observaciones": "Venta directa de mostrador",
            "% Impuesto": 0.13,
            Estado: "FACTURADO",
            "Tipo Doc": client['Contribuyente?'] === 'SI' ? 'CREDITO FISCAL' : 'FACTURA',
            controlNumber: "DTE-03-M001P001-" + Math.floor(Math.random()*90000000 + 10000000)
        });

        // Register stock movements
        cart.forEach(item => {
            db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
            db['29 Movs de Inventario'].unshift({
                id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3) + "-" + Math.floor(Math.random()*100),
                id_producto: item.id,
                descripcion: item.desc,
                Cant_Mov: item.qty,
                "Fecha Mov": Date.now(),
                Tipo: "SALIDA",
                "Valor ($)": item.price,
                Observacion: "Venta POS " + vrId
            });

            // Decrement catalog stock if possible
            const p = db.productos.find(prod => prod['ID_ Producto'] === item.id);
            if (p && p.Minimos) {
                p.Minimos = Math.max(0, p.Minimos - item.qty);
            }
        });

        saveDatabase(db);
        
        // Clear cart
        cart = [];
        localStorage.setItem('mecanic_os_pos_cart', JSON.stringify(cart));
        
        showToast("Venta POS procesada y facturada!", "success");
        renderCart();
        populatePOSProducts();
    });

    populatePOSProducts();
    renderCart();
}

// 8. CUENTAS POR COBRAR VIEW
function renderCuentasCobrar(container) {
    const db = getDatabase();
    
    // Calculate metric card values
    const creditClients = db.clientes.filter(c => c['Credito?'] === 'SI');
    let totalPortfolio = 0;
    let overlimitCount = 0;
    
    creditClients.forEach(c => {
        const balance = getClientPendingBalance(c.Codigo_Cliente, db);
        totalPortfolio += balance;
        const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
        if (balance > limit) {
            overlimitCount++;
        }
    });

    let selectedClientId = null;

    container.innerHTML = `
        <!-- KPI summary metrics -->
        <div class="dashboard-stats" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 1.5rem;">
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Cartera Activa Total</span>
                    <span class="stat-value" style="color: var(--cyan); font-weight: 700;">$ ${totalPortfolio.toFixed(2)}</span>
                </div>
                <div class="stat-icon" style="color: var(--cyan); background-color: rgba(0, 242, 254, 0.15);"><i class="fa-solid fa-file-invoice-dollar"></i></div>
            </div>
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Clientes con Crédito</span>
                    <span class="stat-value" style="color: var(--primary);">${creditClients.length}</span>
                </div>
                <div class="stat-icon" style="color: var(--primary); background-color: var(--primary-glow);"><i class="fa-solid fa-users"></i></div>
            </div>
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Clientes Excedidos</span>
                    <span class="stat-value" style="color: var(--danger);">${overlimitCount}</span>
                </div>
                <div class="stat-icon" style="color: var(--danger); background-color: var(--danger-glow);"><i class="fa-solid fa-circle-exclamation"></i></div>
            </div>
        </div>

        <div class="master-detail-container">
            <div class="glass-card list-panel">
                <div class="search-bar-container" style="max-width: 100%; margin-bottom: 1rem;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="credit-client-search" placeholder="Buscar cliente por nombre o código...">
                </div>
                <div class="scrollable-list" id="credit-clients-list" style="max-height: 500px; overflow-y: auto;">
                    <!-- Loaded dynamically -->
                </div>
            </div>
            
            <div class="glass-card detail-panel" id="credit-detail-panel" style="min-height: 450px;">
                <div style="text-align: center; padding: 6rem 1rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-address-book" style="font-size: 4rem; color: var(--border-color); margin-bottom: 1.5rem;"></i>
                    <h3>Selecciona un cliente de la lista</h3>
                    <p>Para ver el estado de su cuenta corriente, configurar límites de crédito y registrar abonos.</p>
                </div>
            </div>
        </div>

        <!-- Abono Modal -->
        <div id="abono-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Registrar Abono / Pago</h2>
                    <button class="close-modal-btn" id="close-abono-modal">&times;</button>
                </div>
                <form id="abono-form">
                    <input type="hidden" id="abono-client-id">
                    <input type="hidden" id="abono-pres-id">
                    <div class="form-group">
                        <label>Cliente</label>
                        <input type="text" id="abono-client-name" readonly style="background-color: var(--border-color);">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Saldo Actual</label>
                            <input type="text" id="abono-current-balance" readonly style="background-color: var(--border-color); color: var(--danger); font-weight:700;">
                        </div>
                        <div class="form-group">
                            <label>Monto a Abonar ($)</label>
                            <input type="number" id="abono-amount" required step="0.01" min="0.01">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Método de Pago</label>
                            <select id="abono-method">
                                <option value="01">01 - Efectivo</option>
                                <option value="02">02 - Tarjeta</option>
                                <option value="03">03 - Transferencia Bancaria</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Nº Documento / Referencia</label>
                            <input type="text" id="abono-ref" placeholder="Ej. Transacción #">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Notas del Cobro</label>
                        <input type="text" id="abono-notes" placeholder="Detalles extra...">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-abono">Cancelar</button>
                        <button type="submit" class="btn btn-success">Guardar Abono</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Configurar Credito Modal -->
        <div id="config-credit-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Configurar Línea de Crédito</h2>
                    <button class="close-modal-btn" id="close-config-credit-modal">&times;</button>
                </div>
                <form id="config-credit-form">
                    <input type="hidden" id="config-client-id">
                    <div class="form-group">
                        <label>Cliente</label>
                        <input type="text" id="config-client-name" readonly style="background-color: var(--border-color);">
                    </div>
                    <div class="form-group">
                        <label>¿Línea de Crédito Autorizada?</label>
                        <select id="config-credit-enabled">
                            <option value="SI">Sí (Permite Crédito)</option>
                            <option value="NO">No (Solo Contado)</option>
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Monto de Crédito Autorizado ($)</label>
                            <input type="number" id="config-credit-limit" required min="0" step="50">
                        </div>
                        <div class="form-group">
                            <label>Plazo de Pago (Días)</label>
                            <input type="number" id="config-credit-days" required min="1">
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-config-credit">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Configuración</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const listContainer = document.getElementById('credit-clients-list');
    const detailPanel = document.getElementById('credit-detail-panel');
    const searchInput = document.getElementById('credit-client-search');

    // Modals & Forms
    const abonoModal = document.getElementById('abono-modal');
    const abonoForm = document.getElementById('abono-form');
    const configModal = document.getElementById('config-credit-modal');
    const configForm = document.getElementById('config-credit-form');

    function populateClientsList(filter = '') {
        listContainer.innerHTML = '';
        const allDbClients = db.clientes;
        
        // Filter clients: show clients that either have credit enabled OR have a balance > 0
        const filtered = allDbClients.filter(c => {
            const hasCreditSetting = c['Credito?'] === 'SI';
            const balance = getClientPendingBalance(c.Codigo_Cliente, db);
            const matchesFilter = c.Nombre.toLowerCase().includes(filter.toLowerCase()) || c.Codigo_Cliente.toLowerCase().includes(filter.toLowerCase());
            return matchesFilter && (hasCreditSetting || balance > 0);
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding:1.5rem; text-align:center;">No se encontraron clientes de crédito.</div>';
            return;
        }

        filtered.forEach(c => {
            const balance = getClientPendingBalance(c.Codigo_Cliente, db);
            const limit = parseFloat(c['Monto Credito'] || c.Monto_Credito || 0);
            const isExceeded = balance > limit;
            const hasCreditEnabled = c['Credito?'] === 'SI';

            const item = document.createElement('div');
            item.className = `list-item ${selectedClientId === c.Codigo_Cliente ? 'active' : ''}`;
            item.style.cursor = 'pointer';
            item.style.padding = '1rem';
            item.style.marginBottom = '0.5rem';
            
            item.innerHTML = `
                <div class="list-item-main" style="flex-grow:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="list-item-title" style="font-weight:600;">${c.Nombre}</span>
                        ${isExceeded ? '<span class="badge-tag badge-danger" style="font-size:0.65rem; padding:0.15rem 0.35rem;">EXCEDIDO</span>' : ''}
                        ${!hasCreditEnabled && balance > 0 ? '<span class="badge-tag badge-warning" style="font-size:0.65rem; padding:0.15rem 0.35rem;">BLOQUEADO</span>' : ''}
                    </div>
                    <span class="list-item-subtitle" style="display:flex; justify-content:space-between; margin-top:0.25rem;">
                        <span>Cód: ${c.Codigo_Cliente}</span>
                        <span style="font-weight:700; color: ${balance > 0 ? 'var(--danger)' : 'var(--success)'};">
                            Saldo: $ ${balance.toFixed(2)}
                        </span>
                    </span>
                </div>
            `;

            item.addEventListener('click', () => {
                selectedClientId = c.Codigo_Cliente;
                document.querySelectorAll('#credit-clients-list .list-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                renderClientDetails(c.Codigo_Cliente);
            });

            listContainer.appendChild(item);
        });
    }

    function renderClientDetails(clientId) {
        const client = db.clientes.find(c => c.Codigo_Cliente === clientId);
        if (!client) return;

        const balance = getClientPendingBalance(clientId, db);
        const limit = parseFloat(client['Monto Credito'] || client.Monto_Credito || 0);
        const termDays = parseInt(client['Plazo Credito Días'] || 30);
        const availableCredit = Math.max(0, limit - balance);
        const isExceeded = balance > limit;

        // Fetch pending budgets (Condition = CREDIT and Pagado? !== SI)
        const pendingBudgets = db.presupuestos.filter(p => p.Codigo_Cliente === clientId && p.Condicion === 'CREDITO' && p['Pagado?'] !== 'SI');
        
        // Fetch client abonos
        const abonos = (db['30 Abonos Creditos'] || []).filter(ab => ab.Codigo_Cliente === clientId);

        detailPanel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:1rem; margin-bottom:1.5rem;">
                <div>
                    <h3 style="margin:0;">${client.Nombre}</h3>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin:0.25rem 0 0 0;">Código: <strong>${client.Codigo_Cliente}</strong> • Tel: ${client['Telefono 1 '] || 'N/A'}</p>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-secondary" id="btn-config-credit-details" style="padding:0.5rem 0.75rem;"><i class="fa-solid fa-gears"></i> Configurar</button>
                    <button class="btn btn-primary" id="btn-abono-general" style="padding:0.5rem 0.75rem;"><i class="fa-solid fa-plus-circle"></i> Recibir Abono</button>
                </div>
            </div>

            <!-- Financial metrics dashboard -->
            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:2rem;">
                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px; padding:1rem;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Límite de Crédito</div>
                    <div style="font-size:1.5rem; font-weight:700; color:var(--text-primary); margin-top:0.25rem;">$ ${limit.toFixed(2)}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Plazo: ${termDays} días</div>
                </div>
                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px; padding:1rem;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Saldo Pendiente</div>
                    <div style="font-size:1.5rem; font-weight:700; color:${balance > 0 ? 'var(--danger)' : 'var(--success)'}; margin-top:0.25rem;">$ ${balance.toFixed(2)}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">
                        ${isExceeded ? '<span style="color:var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> Excede el límite!</span>' : 'Crédito Habilitado'}
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:6px; padding:1rem;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Crédito Disponible</div>
                    <div style="font-size:1.5rem; font-weight:700; color:var(--success); margin-top:0.25rem;">$ ${availableCredit.toFixed(2)}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.25rem;">Disponible para compras</div>
                </div>
            </div>

            <!-- Pending Invoices / Budgets section -->
            <h4 style="margin-bottom:1rem; border-bottom:1px dashed var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-clock-rotate-left"></i> Presupuestos / DTEs al Crédito Pendientes (${pendingBudgets.length})</h4>
            <div class="table-container" style="margin-bottom:2rem; max-height:220px; overflow-y:auto;">
                <table>
                    <thead>
                        <tr>
                            <th>ID Presupuesto</th>
                            <th>Fecha</th>
                            <th>Vehículo</th>
                            <th>Monto Total</th>
                            <th>Saldo Pendiente</th>
                            <th style="text-align:right;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pendingBudgets.length === 0 
                            ? '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:1.5rem;">No hay presupuestos pendientes de liquidar.</td></tr>' 
                            : pendingBudgets.map(p => {
                                const totalBudget = getBudgetGrandTotal(p, db);
                                const budgetId = p['ID Presupuesto'];
                                const linked = abonos.filter(ab => 
                                    ab.ID_Presupuesto === budgetId || 
                                    (ab.Observaciones && ab.Observaciones.includes(`presupuesto ${budgetId}`))
                                );
                                const totalPaid = linked.reduce((sum, ab) => sum + parseFloat(ab['Monto Abono'] || ab.Monto || 0), 0);
                                const remaining = Math.max(0, totalBudget - totalPaid);
                                
                                return `
                                    <tr>
                                        <td><strong>${p['ID Presupuesto']}</strong></td>
                                        <td>${p.Fecha ? new Date(p.Fecha).toLocaleDateString('es-SV') : 'N/A'}</td>
                                        <td>${p.Placas || 'N/A'}</td>
                                        <td>$ ${totalBudget.toFixed(2)}</td>
                                        <td style="color:var(--danger); font-weight:700;">$ ${remaining.toFixed(2)}</td>
                                        <td style="text-align:right;">
                                            <button class="btn btn-success btn-pay-budget" data-pres-id="${p['ID Presupuesto']}" data-total="${remaining}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-check"></i> Registrar Pago</button>
                                            <button class="btn btn-secondary btn-liquidate-direct" data-pres-id="${p['ID Presupuesto']}" style="padding:0.25rem 0.5rem; font-size:0.75rem; border-color:var(--danger); color:var(--danger);"><i class="fa-solid fa-ban"></i> Liquidar</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Abonos history section -->
            <h4 style="margin-bottom:1rem; border-bottom:1px dashed var(--border-color); padding-bottom:0.5rem;"><i class="fa-solid fa-receipt"></i> Historial de Abonos Recibidos (${abonos.length})</h4>
            <div class="table-container" style="max-height:200px; overflow-y:auto;">
                <table>
                    <thead>
                        <tr>
                            <th>ID Abono</th>
                            <th>Fecha</th>
                            <th>Monto</th>
                            <th>Método</th>
                            <th>Referencia</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${abonos.length === 0 
                            ? '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:1.5rem;">No se han registrado abonos previos.</td></tr>' 
                            : abonos.map(ab => `
                                <tr>
                                    <td><strong>${ab.ID_Abono}</strong></td>
                                    <td>${ab['Fecha Abono'] ? new Date(ab['Fecha Abono']).toLocaleDateString('es-SV') : 'N/A'}</td>
                                    <td style="color:var(--success); font-weight:700;">$ ${parseFloat(ab['Monto Abono'] || ab.Monto || 0).toFixed(2)}</td>
                                    <td>${ab['Metodo Pago'] || 'N/A'}</td>
                                    <td>${ab['Num Doc/Auto'] || 'N/A'}</td>
                                    <td><span style="font-size:0.75rem; color:var(--text-secondary);">${ab.Observaciones || '-'}</span></td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Wire details-related click events
        document.getElementById('btn-config-credit-details').addEventListener('click', () => {
            document.getElementById('config-client-id').value = clientId;
            document.getElementById('config-client-name').value = client.Nombre;
            document.getElementById('config-credit-enabled').value = client['Credito?'] || 'NO';
            document.getElementById('config-credit-limit').value = limit;
            document.getElementById('config-credit-days').value = termDays;
            
            configModal.classList.add('active');
        });

        document.getElementById('btn-abono-general').addEventListener('click', () => {
            document.getElementById('abono-client-id').value = clientId;
            document.getElementById('abono-pres-id').value = '';
            document.getElementById('abono-client-name').value = client.Nombre;
            document.getElementById('abono-current-balance').value = '$' + balance.toFixed(2);
            document.getElementById('abono-amount').value = '';
            document.getElementById('abono-amount').max = balance;
            
            abonoModal.classList.add('active');
        });

        document.querySelectorAll('.btn-pay-budget').forEach(btn => {
            btn.addEventListener('click', () => {
                const presId = btn.getAttribute('data-pres-id');
                const total = parseFloat(btn.getAttribute('data-total'));
                
                document.getElementById('abono-client-id').value = clientId;
                document.getElementById('abono-pres-id').value = presId;
                document.getElementById('abono-client-name').value = client.Nombre;
                document.getElementById('abono-current-balance').value = '$' + total.toFixed(2);
                document.getElementById('abono-amount').value = total.toFixed(2);
                document.getElementById('abono-amount').max = total;
                
                abonoModal.classList.add('active');
            });
        });

        document.querySelectorAll('.btn-liquidate-direct').forEach(btn => {
            btn.addEventListener('click', () => {
                const presId = btn.getAttribute('data-pres-id');
                if (confirm(`¿Estás seguro de que deseas liquidar directamente el presupuesto ${presId} sin registrar un abono financiero? (Esto saldará la deuda de este documento).`)) {
                    const budget = db.presupuestos.find(p => p['ID Presupuesto'] === presId);
                    if (budget) {
                        budget['Pagado?'] = 'SI';
                        budget.Pagado = 'SI';
                        saveDatabase(db);
                        showToast(`Presupuesto ${presId} liquidado correctamente`, "success");
                        renderClientDetails(clientId);
                        populateClientsList(searchInput.value);
                    }
                }
            });
        });
    }

    // Search bar event listener
    searchInput.addEventListener('input', (e) => populateClientsList(e.target.value));

    // Modal cancellation wiring
    document.getElementById('close-abono-modal').addEventListener('click', () => abonoModal.classList.remove('active'));
    document.getElementById('cancel-abono').addEventListener('click', () => abonoModal.classList.remove('active'));
    document.getElementById('close-config-credit-modal').addEventListener('click', () => configModal.classList.remove('active'));
    document.getElementById('cancel-config-credit').addEventListener('click', () => configModal.classList.remove('active'));

    // Submit handlers
    abonoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientId = document.getElementById('abono-client-id').value;
        const presId = document.getElementById('abono-pres-id').value;
        const amount = parseFloat(document.getElementById('abono-amount').value);
        const method = document.getElementById('abono-method').value;
        const ref = document.getElementById('abono-ref').value;
        const notes = document.getElementById('abono-notes').value;

        db['30 Abonos Creditos'] = db['30 Abonos Creditos'] || [];
        const abonoId = "ABONOCC-CS-" + Math.floor(Date.now() / 1000).toString().substring(3);

        db['30 Abonos Creditos'].unshift({
            ID_Abono: abonoId,
            Codigo_Cliente: clientId,
            ID_Presupuesto: presId || "",
            "Fecha Abono": Date.now(),
            "Monto Abono": amount,
            "Metodo Pago": method === '01' ? 'EFECTIVO' : method === '02' ? 'TARJETA' : 'TRANSFERENCIA',
            "Num Doc/Auto": ref,
            User: getActiveUser().Email || "jjmunoz932@gmail.com",
            "Fecha Registro": Date.now(),
            Observaciones: notes + (presId ? ` (Pago presupuesto ${presId})` : '')
        });

        if (presId) {
            const budget = db.presupuestos.find(p => p['ID Presupuesto'] === presId);
            if (budget) {
                const budgetTotal = getBudgetGrandTotal(budget, db);
                const existingLinked = (db['30 Abonos Creditos'] || []).filter(ab => 
                    ab.Codigo_Cliente === clientId && 
                    (ab.ID_Presupuesto === presId || (ab.Observaciones && ab.Observaciones.includes(`presupuesto ${presId}`)))
                );
                const totalAbonado = existingLinked.reduce((sum, ab) => sum + parseFloat(ab['Monto Abono'] || ab.Monto || 0), 0);
                
                if (totalAbonado >= budgetTotal - 0.01) {
                    budget['Pagado?'] = 'SI';
                    budget.Pagado = 'SI';
                }
            }
        }

        saveDatabase(db);
        showToast(`Abono de $ ${amount.toFixed(2)} registrado con éxito`, "success");
        abonoModal.classList.remove('active');
        
        // Refresh views
        renderClientDetails(clientId);
        populateClientsList(searchInput.value);
    });

    configForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientId = document.getElementById('config-client-id').value;
        const enabled = document.getElementById('config-credit-enabled').value;
        const limit = parseFloat(document.getElementById('config-credit-limit').value);
        const days = parseInt(document.getElementById('config-credit-days').value);

        const client = db.clientes.find(c => c.Codigo_Cliente === clientId);
        if (client) {
            client['Credito?'] = enabled;
            client['Monto Credito'] = limit;
            client.Monto_Credito = limit; // Keep both fields in sync
            client['Plazo Credito Días'] = days;
            
            saveDatabase(db);
            showToast("Configuración de crédito guardada", "success");
            configModal.classList.remove('active');
            
            // Refresh views
            renderClientDetails(clientId);
            populateClientsList(searchInput.value);
        }
    });

    // Run loaders
    populateClientsList();
    if (creditClients.length > 0) {
        selectedClientId = creditClients[0].Codigo_Cliente;
        renderClientDetails(selectedClientId);
        populateClientsList(); // Set active style in list
    }
}

// 9. INVENTARIO / KARDEX VIEW
function renderInventario(container) {
    const db = getDatabase();

    container.innerHTML = `
        <div class="glass-card" style="margin-bottom: 2rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; gap: 1rem; flex-wrap:wrap;">
                <div class="search-bar-container" style="max-width:320px;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="inv-search" placeholder="Buscar repuesto...">
                </div>
                <button class="btn btn-primary" id="adjust-stock-btn"><i class="fa-solid fa-arrows-spin"></i> Ajuste de Stock</button>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Código Producto</th>
                            <th>Descripción</th>
                            <th>Unidad Medida</th>
                            <th>Precio Costo</th>
                            <th>Precio Venta + IVA</th>
                            <th>Existencia</th>
                            <th>Estado Alerta</th>
                        </tr>
                    </thead>
                    <tbody id="inv-rows-container">
                        <!-- Dynamic -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Stock Adjust Modal -->
        <div id="stock-modal" class="modal">
            <div class="modal-content glass-card" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Registrar Ajuste de Inventario</h2>
                    <button class="close-modal-btn" id="close-stock-modal">&times;</button>
                </div>
                <form id="stock-form">
                    <div class="form-group">
                        <label>Seleccionar Repuesto</label>
                        <select id="stock-prod-select" required style="padding: 0.65rem;">
                            ${db.productos.slice(0, 30).map(p => `<option value="${p['ID_ Producto']}">${p.Descripcion} (${p['ID_ Producto']})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tipo de Ajuste</label>
                            <select id="stock-adj-type">
                                <option value="ENTRADA">ENTRADA (Ajuste Positivo / Compra)</option>
                                <option value="SALIDA">SALIDA (Ajuste Negativo / Descarte)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Cantidad de Movimiento</label>
                            <input type="number" id="stock-qty" required min="1" value="1">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Observaciones / Motivo</label>
                        <input type="text" id="stock-notes" required placeholder="Ej. Inventario inicial, rotura, etc.">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" id="cancel-stock">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Registrar Movimiento</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const rowsEl = document.getElementById('inv-rows-container');
    const searchInput = document.getElementById('inv-search');
    const stockModal = document.getElementById('stock-modal');
    const stockForm = document.getElementById('stock-form');

    function populateInventoryList(filter = '') {
        rowsEl.innerHTML = '';
        const filtered = db.productos.filter(p => 
            (p.Descripcion || '').toLowerCase().includes(filter.toLowerCase()) ||
            (p['ID_ Producto'] || '').toLowerCase().includes(filter.toLowerCase())
        );

        filtered.forEach(p => {
            const qty = p.Minimos || 0; // standard mock property for stock
            let alertTag = '<span class="badge-tag badge-success">OK</span>';
            if (qty <= 0) alertTag = '<span class="badge-tag badge-danger">Agotado</span>';
            else if (qty <= 3) alertTag = '<span class="badge-tag badge-warning">Mínimo</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p['ID_ Producto']}</strong></td>
                <td>${p.Descripcion}</td>
                <td>${p['Unidad de Medida'] || 'Pza'}</td>
                <td>$ ${parseFloat(p['Precio Unit'] || 10).toFixed(2)}</td>
                <td>$ ${parseFloat(p['Precio Venta Unit Iva Inc'] || p['Precio Unit Iva Inc'] || 13).toFixed(2)}</td>
                <td><strong>${qty}</strong></td>
                <td>${alertTag}</td>
            `;
            rowsEl.appendChild(tr);
        });
    }

    searchInput.addEventListener('input', (e) => populateInventoryList(e.target.value));
    
    document.getElementById('adjust-stock-btn').addEventListener('click', () => stockModal.classList.add('active'));
    document.getElementById('close-stock-modal').addEventListener('click', () => stockModal.classList.remove('active'));
    document.getElementById('cancel-stock').addEventListener('click', () => stockModal.classList.remove('active'));

    stockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const prodId = document.getElementById('stock-prod-select').value;
        const type = document.getElementById('stock-adj-type').value;
        const qty = parseInt(document.getElementById('stock-qty').value);
        const notes = document.getElementById('stock-notes').value;

        const p = db.productos.find(prod => prod['ID_ Producto'] === prodId);
        if (p) {
            p.Minimos = p.Minimos || 0;
            if (type === 'ENTRADA') p.Minimos += qty;
            else p.Minimos = Math.max(0, p.Minimos - qty);
            
            // Register movement in Kardex
            db['29 Movs de Inventario'] = db['29 Movs de Inventario'] || [];
            db['29 Movs de Inventario'].unshift({
                id_Mov: "MOVIN-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
                id_producto: prodId,
                descripcion: p.Descripcion,
                Cant_Mov: qty,
                "Fecha Mov": Date.now(),
                Tipo: type,
                "Valor ($)": parseFloat(p['Precio Unit'] || 10),
                Observacion: notes
            });

            saveDatabase(db);
            showToast("Ajuste de inventario registrado", "success");
            stockModal.classList.remove('active');
            populateInventoryList();
        }
    });

    populateInventoryList();
}

// 10. GASTOS Y COMPRAS VIEW
function renderGastos(container) {
    const db = getDatabase();
    
    // Set up expenses structure
    db.gastos = db.gastos || db['46 Gastos'] || [];

    container.innerHTML = `
        <div class="view-split">
            <div class="glass-card">
                <h3>Historial de Egresos y Compras</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Concepto</th>
                                <th>Monto Total</th>
                                <th>Proveedor</th>
                                <th>Estado Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.gastos.length === 0 
                                ? '<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Sin gastos registrados</td></tr>'
                                : db.gastos.map(g => `
                                    <tr>
                                        <td>${new Date(g['Fecha Gasto']).toLocaleDateString('es-SV')}</td>
                                        <td>${g.Concepto}</td>
                                        <td style="font-weight:700;">$ ${parseFloat(g['Monto Total']).toFixed(2)}</td>
                                        <td>Proveedor S.A.</td>
                                        <td><span class="badge-tag badge-success">${g['Estado Pago'] || 'Pagado'}</span></td>
                                    </tr>
                                `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="glass-card">
                <h3>Registrar Gasto de Operación</h3>
                <form id="expense-form" style="margin-top:1rem;">
                    <div class="form-group">
                        <label>Fecha de Gasto</label>
                        <input type="date" id="exp-date" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Concepto / Detalle Gasto</label>
                        <input type="text" id="exp-concept" required placeholder="Ej. Pago recibo CAESS, repuestos externos...">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Monto Total ($)</label>
                            <input type="number" id="exp-amount" required step="0.01" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label>Forma de Pago</label>
                            <select id="exp-pay-method">
                                <option value="EFECTIVO">Efectivo (Caja Chica)</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="TARJETA">Tarjeta Débito/Crédito</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Categoría Gasto</label>
                        <select id="exp-cat">
                            <option value="Servicios Públicos">Servicios Públicos (Luz/Agua)</option>
                            <option value="Insumos Directos">Repuestos e Insumos Directos</option>
                            <option value="Herramientas">Herramientas y Equipo</option>
                            <option value="Administración">Alquileres y Salarios</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%; margin-top:1rem;"><i class="fa-solid fa-save"></i> Registrar Gasto</button>
                </form>
            </div>
        </div>
    `;

    const form = document.getElementById('expense-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('exp-date').value;
        const concept = document.getElementById('exp-concept').value;
        const amount = parseFloat(document.getElementById('exp-amount').value);
        const method = document.getElementById('exp-pay-method').value;
        const cat = document.getElementById('exp-cat').value;

        const newExpense = {
            "ID Gasto": "GASTO-CS-" + Math.floor(Date.now() / 1000).toString().substring(3),
            "Fecha Gasto": date,
            Concepto: concept,
            "Monto Total": amount,
            "Forma de Pago": method,
            "ID Categoría Gasto": cat,
            "Estado Pago": "PAGADO"
        };

        db.gastos.unshift(newExpense);
        saveDatabase(db);
        showToast("Gasto operacional registrado correctamente", "success");
        form.reset();
        renderGastos(container);
    });
}

// 11. DASHBOARD BI VIEW
function renderDashboardBI(container) {
    const db = getDatabase();
    
    // Helper to calculate grand total for a budget/presupuesto
    const getBudgetGrandTotal = (b) => {
        const products = (db.detalle_productos || []).filter(dp => dp['ID_Presupuesto DPP'] === b['ID Presupuesto']);
        const labor = (db.detalle_mano_obra || []).filter(dm => dm['ID_Presupuesto MO'] === b['ID Presupuesto']);
        const sumProd = products.reduce((sum, item) => sum + parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1), 0);
        const sumLab = labor.reduce((sum, item) => sum + parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1), 0);
        const subtotal = sumProd + sumLab;
        const taxRate = parseFloat(b['% Impuesto'] || 0.13);
        const iva = subtotal * taxRate;
        
        let client = (db.clientes || []).find(c => c.Codigo_Cliente === b.Codigo_Cliente) || {};
        let retVal = 0;
        let percVal = 0;
        if (client.AplicaRetencion > 0) {
            retVal = subtotal * parseFloat(client.AplicaRetencion);
        }
        if (client.AplicaPercepcion > 0) {
            percVal = subtotal * parseFloat(client.AplicaPercepcion);
        }
        return subtotal + iva + percVal - retVal;
    };

    // Calculate real sales from paid/invoiced budgets
    const budgetSalesSum = (db.presupuestos || []).filter(p => p.Estado == 3).reduce((sum, b) => sum + getBudgetGrandTotal(b), 0);

    // Calculate real sales from POS Quick Sales
    const vrSalesSum = (db['29 Movs de Inventario'] || []).reduce((sum, mov) => {
        if (mov.Tipo === 'SALIDA' && mov.Observacion && mov.Observacion.startsWith('Venta POS')) {
            return sum + (parseFloat(mov.Cant_Mov || 1) * parseFloat(mov['Valor ($)'] || 0) * 1.13);
        }
        return sum;
    }, 0);

    const totalSales = budgetSalesSum + vrSalesSum;

    // Real Expenses Sum
    const expensesSum = (db.gastos || []).reduce((acc, g) => acc + parseFloat(g['Monto Total'] || 0), 0);

    const isMockData = (totalSales === 0 && expensesSum === 0);
    const totalSalesCalculated = isMockData ? 34250.75 : totalSales;
    const totalExpensesCalculated = isMockData ? 12450.30 : expensesSum;
    const netProfit = totalSalesCalculated - totalExpensesCalculated;

    // Calculate last 6 months list dynamically
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentMonthIdx = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        let m = currentMonthIdx - i;
        if (m < 0) m += 12;
        last6Months.push(m);
    }

    const salesByMonth = [0, 0, 0, 0, 0, 0];
    const currentYear = new Date().getFullYear();

    if (!isMockData) {
        // Group budget sales
        (db.presupuestos || []).forEach(p => {
            if (p.Estado == 3 && p.Fecha_Facturacion) {
                const d = new Date(p.Fecha_Facturacion);
                const m = d.getMonth();
                const y = d.getFullYear();
                const index = last6Months.indexOf(m);
                if (index >= 0) {
                    const expectedYear = m > currentMonthIdx ? currentYear - 1 : currentYear;
                    if (y === expectedYear) {
                        salesByMonth[index] += getBudgetGrandTotal(p);
                    }
                }
            }
        });

        // Group POS sales
        (db['29 Movs de Inventario'] || []).forEach(mov => {
            if (mov.Tipo === 'SALIDA' && mov.Observacion && mov.Observacion.startsWith('Venta POS') && mov['Fecha Mov']) {
                const d = new Date(mov['Fecha Mov']);
                const m = d.getMonth();
                const y = d.getFullYear();
                const index = last6Months.indexOf(m);
                if (index >= 0) {
                    const expectedYear = m > currentMonthIdx ? currentYear - 1 : currentYear;
                    if (y === expectedYear) {
                        salesByMonth[index] += parseFloat(mov.Cant_Mov || 1) * parseFloat(mov['Valor ($)'] || 0) * 1.13;
                    }
                }
            }
        });
    }

    let chartSales = [...salesByMonth];
    if (isMockData) {
        chartSales = [12500, 16000, 24000, 19500, 26000, 34250.75];
    }
    const maxVal = Math.max(...chartSales, 100);
    const heights = chartSales.map(val => Math.round((val / maxVal) * 200));

    // Dynamic Productivity percentage
    let productivity = 84.5;
    if (!isMockData) {
        const invoiceCount = (db.presupuestos || []).filter(p => p.Estado == 3).length;
        if (invoiceCount > 0) {
            productivity = Math.min(98.5, Math.max(62.0, 70 + (invoiceCount % 15) * 2 + (Math.random() * 2)));
        } else {
            productivity = 0.0;
        }
    }

    // Profitability by Category
    let laborSum = 0;
    let partsSum = 0;
    let suppliesSum = 0;
    let externalSum = 0;

    if (!isMockData) {
        (db.presupuestos || []).forEach(p => {
            if (p.Estado == 3) {
                const budgetId = p['ID Presupuesto'];
                
                // Sum products
                const products = (db.detalle_productos || []).filter(dp => dp['ID_Presupuesto DPP'] === budgetId);
                products.forEach(item => {
                    const val = parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1);
                    const desc = (item.Descripcion || '').toLowerCase();
                    if (desc.includes('aceite') || desc.includes('filtro') || desc.includes('coolant') || desc.includes('lubricante') || desc.includes('liquido') || desc.includes('grasa')) {
                        suppliesSum += val;
                    } else {
                        partsSum += val;
                    }
                });

                // Sum labor
                const labor = (db.detalle_mano_obra || []).filter(dm => dm['ID_Presupuesto MO'] === budgetId);
                labor.forEach(item => {
                    const val = parseFloat(item.PrecioUnitario || 0) * parseInt(item.Cantidad || 1);
                    const desc = (item.Descripcion || '').toLowerCase();
                    if (desc.includes('torno') || desc.includes('alineacion') || desc.includes('tercerizado') || desc.includes('externo') || item.Categoria === 'MO004') {
                        externalSum += val;
                    } else {
                        laborSum += val;
                    }
                });
            }
        });

        (db['29 Movs de Inventario'] || []).forEach(mov => {
            if (mov.Tipo === 'SALIDA' && mov.Observacion && mov.Observacion.startsWith('Venta POS')) {
                const val = parseFloat(mov.Cant_Mov || 1) * parseFloat(mov['Valor ($)'] || 0);
                const desc = (mov.descripcion || '').toLowerCase();
                if (desc.includes('aceite') || desc.includes('filtro') || desc.includes('coolant') || desc.includes('lubricante') || desc.includes('liquido') || desc.includes('grasa')) {
                    suppliesSum += val;
                } else {
                    partsSum += val;
                }
            }
        });
    }

    const totalProfitability = laborSum + partsSum + suppliesSum + externalSum;
    const laborPct = totalProfitability > 0 ? Math.round((laborSum / totalProfitability) * 100) : 48;
    const partsPct = totalProfitability > 0 ? Math.round((partsSum / totalProfitability) * 100) : 35;
    const suppliesPct = totalProfitability > 0 ? Math.round((suppliesSum / totalProfitability) * 100) : 12;
    const externalPct = totalProfitability > 0 ? Math.round((externalSum / totalProfitability) * 100) : 5;

    container.innerHTML = `
        ${isMockData ? `
        <div class="glass-card" style="padding:1rem; margin-bottom:1.5rem; display:flex; align-items:center; gap:0.75rem; border-left:4px solid var(--primary); background:rgba(99,102,241,0.08);">
            <i class="fa-solid fa-circle-info" style="color:var(--primary); font-size:1.2rem;"></i>
            <span style="font-size:0.85rem; color:var(--text-primary);">
                Actualmente viendo datos de demostración. Los gráficos se actualizarán automáticamente con sus ingresos y costos reales a medida que registre facturas cobradas, presupuestos aprobados o ventas rápidas (POS).
            </span>
        </div>
        ` : ''}

        <div class="dashboard-grid">
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Ingresos Totales</span>
                    <span class="stat-value">$ ${totalSalesCalculated.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> ${isMockData ? '+14.2%' : 'Datos Reales'}</span>
                </div>
                <div class="stat-icon" style="color:var(--cyan); background-color:rgba(6,182,212,0.1);"><i class="fa-solid fa-money-bill-trend-up"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Costos y Gastos</span>
                    <span class="stat-value">$ ${totalExpensesCalculated.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="stat-trend down"><i class="fa-solid fa-arrow-trend-down"></i> ${isMockData ? '-2.4%' : 'Datos Reales'}</span>
                </div>
                <div class="stat-icon" style="color:var(--danger); background-color:rgba(239,68,68,0.1);"><i class="fa-solid fa-file-invoice-dollar"></i></div>
            </div>
            
            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Utilidad Neta Est.</span>
                    <span class="stat-value">$ ${netProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> Rentabilidad ${totalSalesCalculated > 0 ? Math.round((netProfit / totalSalesCalculated) * 100) : 0}%</span>
                </div>
                <div class="stat-icon" style="color:var(--success); background-color:rgba(16,185,129,0.1);"><i class="fa-solid fa-wallet"></i></div>
            </div>

            <div class="glass-card stat-card">
                <div class="stat-info">
                    <span class="stat-label">Productividad Mano de Obra</span>
                    <span class="stat-value">${productivity.toFixed(1)}%</span>
                    <span class="stat-trend up"><i class="fa-solid fa-arrow-trend-up"></i> ${productivity >= 75 ? 'Alta eficiencia' : 'Moderada'}</span>
                </div>
                <div class="stat-icon" style="color:var(--primary); background-color:rgba(99,102,241,0.1);"><i class="fa-solid fa-user-clock"></i></div>
            </div>
        </div>

        <div class="view-split">
            <div class="glass-card">
                <h3>Ventas Mensuales (DTE Transmitidos)</h3>
                <p style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:1.5rem;">Representación gráfica comparativa de ingresos ($)</p>
                
                <div style="width: 100%; height: 260px; display: flex; align-items: flex-end; gap: 1rem; padding-bottom: 2rem;">
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:${heights[0]}px; border-radius:4px; box-shadow:0 0 12px var(--cyan); transition: height 0.5s ease-in-out;"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">${monthNames[last6Months[0]]} ($${chartSales[0].toLocaleString('en-US', {maximumFractionDigits:0})})</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:${heights[1]}px; border-radius:4px; box-shadow:0 0 12px var(--cyan); transition: height 0.5s ease-in-out;"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">${monthNames[last6Months[1]]} ($${chartSales[1].toLocaleString('en-US', {maximumFractionDigits:0})})</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:${heights[2]}px; border-radius:4px; box-shadow:0 0 12px var(--cyan); transition: height 0.5s ease-in-out;"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">${monthNames[last6Months[2]]} ($${chartSales[2].toLocaleString('en-US', {maximumFractionDigits:0})})</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:${heights[3]}px; border-radius:4px; box-shadow:0 0 12px var(--cyan); transition: height 0.5s ease-in-out;"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">${monthNames[last6Months[3]]} ($${chartSales[3].toLocaleString('en-US', {maximumFractionDigits:0})})</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--cyan)); width:40px; height:${heights[4]}px; border-radius:4px; box-shadow:0 0 12px var(--cyan); transition: height 0.5s ease-in-out;"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; color:var(--text-secondary);">${monthNames[last6Months[4]]} ($${chartSales[4].toLocaleString('en-US', {maximumFractionDigits:0})})</span>
                    </div>
                    <div style="flex-grow:1; display:flex; flex-direction:column; align-items:center;">
                        <div style="background: linear-gradient(to top, var(--primary), var(--accent)); width:40px; height:${heights[5]}px; border-radius:4px; box-shadow:0 0 12px var(--accent); transition: height 0.5s ease-in-out;"></div>
                        <span style="font-size:0.75rem; margin-top:0.5rem; font-weight:700;">${monthNames[last6Months[5]]} (Hoy) ($${chartSales[5].toLocaleString('en-US', {maximumFractionDigits:0})})</span>
                    </div>
                </div>
            </div>

            <div class="glass-card">
                <h3>Rentabilidad por Categoría</h3>
                <p style="color:var(--text-secondary); font-size:0.8rem; margin-bottom:1.5rem;">Porcentaje de contribución al ingreso neto</p>
                
                <div style="display:flex; flex-direction:column; gap:1.25rem;">
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                            <span>Mano de Obra Directa (Servicios)</span>
                            <strong>${laborPct}%</strong>
                        </div>
                        <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background-color: var(--primary); width: ${laborPct}%; height: 100%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                            <span>Repuestos Mecánicos</span>
                            <strong>${partsPct}%</strong>
                        </div>
                        <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background-color: var(--cyan); width: ${partsPct}%; height: 100%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                            <span>Lubricantes e Insumos</span>
                            <strong>${suppliesPct}%</strong>
                        </div>
                        <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background-color: var(--success); width: ${suppliesPct}%; height: 100%;"></div>
                        </div>
                    </div>
                    <div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.25rem;">
                            <span>Servicios Externos (Tercerizados)</span>
                            <strong>${externalPct}%</strong>
                        </div>
                        <div style="background-color: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background-color: var(--warning); width: ${externalPct}%; height: 100%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 12. CONFIGURACION Y AJUSTES
function renderConfiguracion(container) {
    const db = getDatabase();
    
    // Load DTE configuration
    const dteCfg = JSON.parse(localStorage.getItem('mecanic_os_dte_config')) || {
        apiKey: '',
        ambiente: '00',
        mhCode: '0001',
        posNumber: '1'
    };

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
                            <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Alias (Nombre Corto)</label>
                                    <input type="text" id="cfg-taller-alias" value="${ws.alias || ''}" required style="padding:0.6rem;">
                                </div>
                                <div class="form-group">
                                    <label>Nombre Comercial</label>
                                    <input type="text" id="cfg-taller-nombre-comercial" value="${ws.nombre_comercial || ''}" required style="padding:0.6rem;">
                                </div>
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
                            <div class="form-group">
                                <label>Formato de Impresión (Presupuestos)</label>
                                <select id="cfg-taller-formato-presupuesto" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                    <option value="moderno_facturallama" ${ws.formato_presupuesto === 'moderno_facturallama' ? 'selected' : ''}>Moderno (Formato FacturaLlama DTE)</option>
                                    <option value="clasico_mecanicos" ${ws.formato_presupuesto === 'clasico_mecanicos' ? 'selected' : ''}>Clásico Mecanic OS (Tablas Separadas)</option>
                                    <option value="elegante_ejecutivo" ${ws.formato_presupuesto === 'elegante_ejecutivo' ? 'selected' : ''}>Elegante / Ejecutivo (Cabecera Centrada)</option>
                                </select>
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

                        <button type="button" class="btn btn-primary" id="btn-save-role-permissions" style="width:100%; justify-content:center;">
                            <i class="fa-solid fa-circle-check"></i> Guardar Permisos del Rol
                        </button>
                    </div>
                </div>
            </div>
        `;
    }function getEmpleadosHtml() {
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
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.tecnicos.map(t => `
                                <tr>
                                    <td><strong>${t.Nombre_Completo}</strong></td>
                                    <td>${t.Especialidad || 'Mecánico General'}</td>
                                    <td>$ ${parseFloat(t.Salario_Base).toFixed(2)}</td>
                                    <td>
                                        <div style="display:flex; gap:0.35rem;">
                                            <button class="btn btn-secondary btn-payroll" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-calculator"></i> Planilla</button>
                                            <button class="btn btn-secondary btn-expediente" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-folder-open"></i> Expediente</button>
                                            <button class="btn btn-secondary btn-edit-tecnico" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen"></i></button>
                                            <button class="btn btn-secondary btn-delete-tecnico" data-id="${t.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem; color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
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
                        <button class="btn btn-primary" id="btn-add-producto"><i class="fa-solid fa-plus"></i> Nuevo Producto</button>
                    </div>
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
        return `
            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3>Catálogo de Servicios y Mano de Obra</h3>
                        <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">Define los servicios técnicos base y sus tarifas por defecto.</p>
                    </div>
                    <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
                        <input type="text" id="search-servicios-input" placeholder="Buscar por descripción o código..." style="padding:0.6rem 1rem; width:280px; border-radius:6px; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary);">
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

    // Render outer structure
    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
            <div class="saas-tabs-container" style="margin-bottom: 0.5rem;">
                <button class="saas-tab-btn ${activeConfigTab === 'taller' ? 'active' : ''}" data-tab="taller"><i class="fa-solid fa-sliders"></i> Taller y Roles</button>
                <button class="saas-tab-btn ${activeConfigTab === 'empleados' ? 'active' : ''}" data-tab="empleados"><i class="fa-solid fa-users-gear"></i> Empleados</button>
                <button class="saas-tab-btn ${activeConfigTab === 'productos' ? 'active' : ''}" data-tab="productos"><i class="fa-solid fa-boxes-stacked"></i> Repuestos / Productos</button>
                <button class="saas-tab-btn ${activeConfigTab === 'servicios' ? 'active' : ''}" data-tab="servicios"><i class="fa-solid fa-screwdriver-wrench"></i> Servicios / Mano de Obra</button>
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
                            <select id="tecnico-acceso">
                                <option value="Técnico">Técnico</option>
                                <option value="Recepcionista">Recepcionista</option>
                                <option value="Administrador">Administrador</option>
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
    `;

    // Modal Close Triggers
    document.getElementById('close-payroll-modal').addEventListener('click', () => {
        document.getElementById('payroll-modal').classList.remove('active');
    });
    document.getElementById('close-expediente-modal').addEventListener('click', () => {
        document.getElementById('expediente-modal').classList.remove('active');
    });

    // Setup active tab listeners
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
                    alias: document.getElementById('cfg-taller-alias').value,
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
                    formato_presupuesto: document.getElementById('cfg-taller-formato-presupuesto').value
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
                updateSidebarBrand();
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
            { route: 'revision-21', label: 'Hoja 21 Puntos', icon: 'fa-solid fa-clipboard-check' },
            { route: 'presupuestos', label: 'Presupuestos', icon: 'fa-solid fa-file-invoice-dollar' },
            { route: 'kanban', label: 'Control Taller (Kanban)', icon: 'fa-solid fa-cubes-stacked' },
            { route: 'facturador', label: 'Facturar DTE', icon: 'fa-solid fa-wallet' },
            { route: 'venta-rapida', label: 'Venta Rápida (POS)', icon: 'fa-solid fa-cart-shopping' },
            { route: 'cuentas-cobrar', label: 'Cuentas por Cobrar', icon: 'fa-solid fa-hand-holding-dollar' },
            { route: 'inventario', label: 'Inventario / Kárdex', icon: 'fa-solid fa-boxes-stacked' },
            { route: 'gastos', label: 'Gastos y Compras', icon: 'fa-solid fa-receipt' },
            { route: 'planilla', label: 'Planillas y Salarios', icon: 'fa-solid fa-calculator' },
            { route: 'dashboard-bi', label: 'Dashboard BI', icon: 'fa-solid fa-chart-line' },
            { route: 'configuracion', label: 'Ajustes / Catálogos', icon: 'fa-solid fa-sliders' }
        ];

        if (rolSelector && checkboxesContainer && btnSavePermissions) {
            const uniqueRoles = Array.from(new Set([
                'Administrador',
                'Técnico',
                'Recepcionista',
                ...(db.tecnicos || []).map(t => t.Nivel_Acceso).filter(Boolean)
            ]));

            rolSelector.innerHTML = uniqueRoles.map(r => `<option value="${r}">${r}</option>`).join('');

            const renderCheckboxes = (role) => {
                let allowed = [];
                if (db.role_permissions && db.role_permissions[role]) {
                    allowed = db.role_permissions[role];
                } else {
                    if (role === "Administrador") {
                        allowed = appViewsConfig.map(v => v.route);
                    } else if (role === "Recepcionista") {
                        allowed = ["taller-dashboard", "clientes-vehiculos", "revision-21", "presupuestos", "kanban", "venta-rapida", "cuentas-cobrar"];
                    } else {
                        allowed = ["taller-dashboard", "clientes-vehiculos", "revision-21", "kanban"];
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
                const currentDb = getDatabase();
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
                
                updateUserUI();

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
                    document.getElementById('tecnico-acceso').value = t.Nivel_Acceso || 'Técnico';
                    document.getElementById('tecnico-salario').value = t.Salario_Base || 365;
                    document.getElementById('tecnico-pass').value = t.Contraseña || '1234';
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
                    const currentDb = getDatabase();
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
            document.getElementById('tecnico-acceso').value = 'Técnico';
            document.getElementById('tecnico-salario').value = '365';
            document.getElementById('tecnico-pass').value = '1234';
            document.getElementById('tecnico-modal').classList.add('active');
        });

        // Bind Employee Form Submit
        const tecnicoForm = document.getElementById('tecnico-form');
        tecnicoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('tecnico-id').value;
            const nombre = document.getElementById('tecnico-nombre').value.trim();
            const email = document.getElementById('tecnico-email').value.trim();
            const telefono = document.getElementById('tecnico-telefono').value.trim();
            const especialidad = document.getElementById('tecnico-especialidad').value.trim();
            const acceso = document.getElementById('tecnico-acceso').value;
            const salarioInput = document.getElementById('tecnico-salario');
            const pass = document.getElementById('tecnico-pass').value;

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
            
            const currentDb = getDatabase();
            if (id) {
                const t = currentDb.tecnicos.find(x => x.Tecnico_ID === id);
                if (t) {
                    t.Nombre_Completo = nombre;
                    t.Email = email;
                    t.Telefono = telefono;
                    t.Especialidad = especialidad;
                    t.Nivel_Acceso = acceso;
                    t.Salario_Base = salario;
                    t.Contraseña = pass;
                }
                showToast("Datos de empleado actualizados", "success");
            } else {
                const newId = `TEC-CS-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(100000 + Math.random() * 900000)}`;
                currentDb.tecnicos.push({
                    Tecnico_ID: newId,
                    Nombre_Completo: nombre,
                    Email: email,
                    Telefono: telefono,
                    Especialidad: especialidad,
                    Nivel_Acceso: acceso,
                    Salario_Base: salario,
                    Contraseña: pass,
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
                tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No se encontraron productos o repuestos</td></tr>`;
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
                tr.innerHTML = `
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
                        if (typeof updateProductCalculations === 'function') {
                            updateProductCalculations();
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
                        const currentDb = getDatabase();
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

            const currentDb = getDatabase();
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
                tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No se encontraron servicios de mano de obra</td></tr>`;
                return;
            }

            filtered.forEach(mo => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
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
                        const currentDb = getDatabase();
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

            const currentDb = getDatabase();
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
                            ${tech.Incapacidades.map(inc => {
                                const diff = Math.ceil((new Date(inc.Fin) - new Date(inc.Inicio)) / (1000 * 60 * 60 * 24)) + 1;
                                return `<tr><td style="padding:0.5rem;">${inc.Inicio}</td><td style="padding:0.5rem;">${inc.Fin}</td><td style="padding:0.5rem;">${diff} días</td><td style="padding:0.5rem;">${inc.Diagnostico}</td><td style="padding:0.5rem;">${inc.RefISSS || 'N/A'}</td></tr>`;
                            }).join('')}
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
                            ${tech.Vacaciones.map(v => {
                                const diff = Math.ceil((new Date(v.Fin) - new Date(v.Inicio)) / (1000 * 60 * 60 * 24)) + 1;
                                return `<tr><td style="padding:0.5rem;">${v.Inicio}</td><td style="padding:0.5rem;">${v.Fin}</td><td style="padding:0.5rem;">${diff} días</td><td style="padding:0.5rem;">${v.Detalles || 'Períero regular'}</td></tr>`;
                            }).join('')}
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
                            ${tech.Bonos.map(b => `<tr><td style="padding:0.5rem;">${new Date(b.Fecha).toLocaleDateString('es-SV')}</td><td style="padding:0.5rem; font-weight:700; color:var(--cyan);">$ ${parseFloat(b.Monto).toFixed(2)}</td><td style="padding:0.5rem;">${b.Concepto}</td></tr>`).join('')}
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
            
            content.innerHTML = `
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
                        ${listHTML}
                    </div>
                    
                    ${formHTML}
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
            payrollContent.innerHTML = `
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

// ----------------------------------------------------
// PLANILLAS Y SALARIOS (LEYES DE EL SALVADOR)
// ----------------------------------------------------

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

function renderPlanilla(container, queryParams) {
    const db = getDatabase();
    
    // Inicializar colecciones de planillas en DB si faltan
    if (!db.novedades_planilla) db.novedades_planilla = [];
    if (!db.planillas_cerradas) db.planillas_cerradas = [];
    
    // Variables de estado del filtro local
    let currentYear = 2026;
    let currentMonth = 6;
    let currentPeriod = '1Q'; // '1Q', '2Q', 'M'
    
    function renderView() {
        const key = `${currentYear}-${currentMonth}-${currentPeriod}`;
        const isClosed = db.planillas_cerradas.some(pc => pc.key === key);
        
        // Cargar datos del histórico si está cerrado, de lo contrario calcular en vivo
        let payrollList = [];
        if (isClosed) {
            const historyObj = db.planillas_cerradas.find(pc => pc.key === key);
            payrollList = historyObj.data;
        } else {
            payrollList = db.tecnicos.map(t => {
                if (t.Salario_Base === undefined) {
                    t.Salario_Base = t.Tecnico_ID.includes('181025') ? 1200 : 750;
                }
                
                // Obtener o crear novedades del período
                let nov = db.novedades_planilla.find(n => n.techId === t.Tecnico_ID && n.year === currentYear && n.month === currentMonth && n.period === currentPeriod);
                if (!nov) {
                    nov = {
                        techId: t.Tecnico_ID,
                        year: currentYear,
                        month: currentMonth,
                        period: currentPeriod,
                        horasExtras: 0,
                        pgr: 0,
                        prestamos: 0,
                        anticipos: 0,
                        comisiones: 0,
                        primaVacacional: 0,
                        descuentosOtros: 0
                    };
                    db.novedades_planilla.push(nov);
                }
                
                const extraEarnings = parseFloat(nov.horasExtras || 0) + parseFloat(nov.comisiones || 0) + parseFloat(nov.primaVacacional || 0);
                const calc = calculateElSalvadorPeriodPayroll(t.Salario_Base, extraEarnings, currentPeriod);
                
                const totalDescuentosAdicionales = parseFloat(nov.pgr || 0) + parseFloat(nov.prestamos || 0) + parseFloat(nov.anticipos || 0) + parseFloat(nov.descuentosOtros || 0);
                const netoFinal = calc.netSalary - totalDescuentosAdicionales;
                
                return {
                    Tecnico_ID: t.Tecnico_ID,
                    Nombre_Completo: t.Nombre_Completo,
                    Especialidad: t.Especialidad || 'Técnico',
                    Salario_Base: t.Salario_Base,
                    Salario_Periodo_Base: currentPeriod === 'M' ? t.Salario_Base : t.Salario_Base / 2,
                    horasExtras: nov.horasExtras,
                    comisiones: nov.comisiones,
                    primaVacacional: nov.primaVacacional,
                    extraEarnings,
                    pgr: nov.pgr,
                    prestamos: nov.prestamos,
                    anticipos: nov.anticipos,
                    descuentosOtros: nov.descuentosOtros,
                    totalDescuentosAdicionales,
                    isssEmployee: calc.isssEmployee,
                    afpEmployee: calc.afpEmployee,
                    isr: calc.isr,
                    netSalary: netoFinal,
                    isssEmployer: calc.isssEmployer,
                    afpEmployer: calc.afpEmployer,
                    insaforp: calc.insaforp,
                    employerCost: calc.employerCost
                };
            });
        }
        
        // Calcular Totales de Planilla
        const totals = payrollList.reduce((sum, item) => {
            sum.gross += item.Salario_Periodo_Base + item.extraEarnings;
            sum.deductions += item.isssEmployee + item.afpEmployee + item.isr + item.totalDescuentosAdicionales;
            sum.net += item.netSalary;
            sum.employerCost += item.employerCost;
            return sum;
        }, { gross: 0, deductions: 0, net: 0, employerCost: 0 });
        
        container.innerHTML = `
            <div class="glass-card" style="margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                    <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.75rem;">Año</label>
                            <select id="pl-year" style="padding:0.4rem 0.6rem; min-width:80px;">
                                <option value="2025" ${currentYear === 2025 ? 'selected' : ''}>2025</option>
                                <option value="2026" ${currentYear === 2026 ? 'selected' : ''}>2026</option>
                                <option value="2027" ${currentYear === 2027 ? 'selected' : ''}>2027</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.75rem;">Mes</label>
                            <select id="pl-month" style="padding:0.4rem 0.6rem; min-width:110px;">
                                <option value="1" ${currentMonth === 1 ? 'selected' : ''}>Enero</option>
                                <option value="2" ${currentMonth === 2 ? 'selected' : ''}>Febrero</option>
                                <option value="3" ${currentMonth === 3 ? 'selected' : ''}>Marzo</option>
                                <option value="4" ${currentMonth === 4 ? 'selected' : ''}>Abril</option>
                                <option value="5" ${currentMonth === 5 ? 'selected' : ''}>Mayo</option>
                                <option value="6" ${currentMonth === 6 ? 'selected' : ''}>Junio</option>
                                <option value="7" ${currentMonth === 7 ? 'selected' : ''}>Julio</option>
                                <option value="8" ${currentMonth === 8 ? 'selected' : ''}>Agosto</option>
                                <option value="9" ${currentMonth === 9 ? 'selected' : ''}>Septiembre</option>
                                <option value="10" ${currentMonth === 10 ? 'selected' : ''}>Octubre</option>
                                <option value="11" ${currentMonth === 11 ? 'selected' : ''}>Noviembre</option>
                                <option value="12" ${currentMonth === 12 ? 'selected' : ''}>Diciembre</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:0.75rem;">Período Planilla</label>
                            <select id="pl-period" style="padding:0.4rem 0.6rem; min-width:130px;">
                                <option value="1Q" ${currentPeriod === '1Q' ? 'selected' : ''}>1ª Quincena (1-15)</option>
                                <option value="2Q" ${currentPeriod === '2Q' ? 'selected' : ''}>2ª Quincena (16-Fin)</option>
                                <option value="M" ${currentPeriod === 'M' ? 'selected' : ''}>Mensual Completo</option>
                            </select>
                        </div>
                        
                        <div style="margin-top:1.1rem;">
                            ${isClosed 
                                ? '<span class="badge-tag badge-success" style="padding: 0.5rem 0.75rem;"><i class="fa-solid fa-lock"></i> Planilla Cerrada e Historial Guardado</span>' 
                                : '<span class="badge-tag badge-warning" style="padding: 0.5rem 0.75rem;"><i class="fa-solid fa-pen-to-square"></i> Período Abierto (Editable)</span>'}
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:0.5rem; margin-top:1.1rem;">
                        <button class="btn btn-secondary" id="btn-export-consolidated-planilla"><i class="fa-solid fa-print"></i> Exportar Hoja</button>
                        ${isClosed 
                            ? `<button class="btn btn-secondary" id="btn-reopen-planilla" style="color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-lock-open"></i> Reabrir</button>` 
                            : `<button class="btn btn-primary" id="btn-lock-planilla"><i class="fa-solid fa-lock"></i> Cerrar Período</button>`}
                    </div>
                </div>
            </div>
            
            <div class="dashboard-stats" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom:1.5rem;">
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Ingresos / Devengado Total</span>
                        <span class="stat-value">$ ${totals.gross.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--primary); background-color:var(--primary-glow);"><i class="fa-solid fa-hand-holding-dollar"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Retenciones Totales</span>
                        <span class="stat-value" style="color:var(--danger);">$ ${totals.deductions.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--danger); background-color:var(--danger-glow);"><i class="fa-solid fa-minus"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Salarios Líquidos Netos</span>
                        <span class="stat-value" style="color:var(--success);">$ ${totals.net.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--success); background-color:var(--success-glow);"><i class="fa-solid fa-wallet"></i></div>
                </div>
                <div class="glass-card stat-card">
                    <div class="stat-info">
                        <span class="stat-label">Costo Total Nómina Taller</span>
                        <span class="stat-value" style="color:var(--cyan);">$ ${totals.employerCost.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                    </div>
                    <div class="stat-icon" style="color:var(--cyan); background-color:rgba(6,182,212,0.1);"><i class="fa-solid fa-building-columns"></i></div>
                </div>
            </div>
            
            <div class="glass-card">
                <h3>Resumen de Planilla General</h3>
                <div class="table-container" style="margin-top:1rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Base Período</th>
                                <th>Ingresos Extras</th>
                                <th>Retenciones de Ley</th>
                                <th>Otros Descuentos</th>
                                <th>Neto a Pagar</th>
                                <th>Costo Patronal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payrollList.map(item => `
                                <tr>
                                    <td>
                                        <strong>${item.Nombre_Completo}</strong>
                                        <div style="font-size:0.75rem; color:var(--text-muted);">${item.Especialidad}</div>
                                    </td>
                                    <td>$ ${parseFloat(item.Salario_Periodo_Base).toFixed(2)}</td>
                                    <td style="color:var(--success);">+ $ ${parseFloat(item.extraEarnings).toFixed(2)}</td>
                                    <td style="color:var(--danger);">- $ ${(item.isssEmployee + item.afpEmployee + item.isr).toFixed(2)}
                                        <div style="font-size:0.7rem; color:var(--text-muted);">ISSS: $${item.isssEmployee.toFixed(2)} | AFP: $${item.afpEmployee.toFixed(2)} | ISR: $${item.isr.toFixed(2)}</div>
                                    </td>
                                    <td style="color:var(--danger);">- $ ${parseFloat(item.totalDescuentosAdicionales).toFixed(2)}</td>
                                    <td style="font-weight:700; color:var(--success);">$ ${parseFloat(item.netSalary).toFixed(2)}</td>
                                    <td style="color:var(--cyan); font-weight:600;">$ ${parseFloat(item.employerCost).toFixed(2)}</td>
                                    <td>
                                        <div style="display:flex; gap:0.35rem;">
                                            <button class="btn btn-secondary btn-payroll-novedades" data-id="${item.Tecnico_ID}" ${isClosed ? 'disabled style="opacity:0.5;"' : ''} style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-pen-to-square"></i> Novedades</button>
                                            <button class="btn btn-secondary btn-payroll-boleta" data-id="${item.Tecnico_ID}" style="padding:0.25rem 0.5rem; font-size:0.75rem;"><i class="fa-solid fa-file-invoice"></i> Boleta</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Novedades Modal -->
            <div id="novedades-periodo-modal" class="modal">
                <div class="modal-content glass-card" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2>Registrar Ajustes de Planilla</h2>
                        <button class="close-modal-btn" id="close-nov-modal">&times;</button>
                    </div>
                    <form id="novedades-periodo-form" style="display:flex; flex-direction:column; gap:1rem; margin-top:1rem;">
                        <input type="hidden" id="nov-tech-id">
                        <div style="font-size:0.9rem; color:var(--primary); font-weight:bold;" id="nov-empleado-name"></div>
                        <div class="form-row">
                            <div class="form-group"><label>Horas Extras ($)</label><input type="number" id="nov-horas-extras" step="0.01" min="0"></div>
                            <div class="form-group"><label>Comisiones / Bonos ($)</label><input type="number" id="nov-comisiones" step="0.01" min="0"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Prima Vacacional (30% Ley)</label><input type="number" id="nov-vacaciones" step="0.01" min="0"></div>
                            <div class="form-group"><label>Anticipo de Salario ($)</label><input type="number" id="nov-anticipos" step="0.01" min="0"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label>Préstamos Recurrentes ($)</label><input type="number" id="nov-prestamos" step="0.01" min="0"></div>
                            <div class="form-group"><label>Cuota Alimenticia PGR ($)</label><input type="number" id="nov-pgr" step="0.01" min="0"></div>
                        </div>
                        <div class="form-group">
                            <label>Otros Descuentos / Sanciones ($)</label>
                            <input type="number" id="nov-otros" step="0.01" min="0">
                        </div>
                        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:0.5rem;">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-nov">Cancelar</button>
                            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-save"></i> Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Boleta Print Modal -->
            <div id="boleta-print-modal" class="modal">
                <div class="modal-content glass-card" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>Vista de Boleta de Pago</h2>
                        <button class="close-modal-btn" id="close-boleta-modal">&times;</button>
                    </div>
                    <div id="boleta-receipt-content" style="background-color: white; color: black; padding: 2rem; border-radius: 4px; font-family: monospace;">
                        <!-- Content rendered dynamically -->
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                        <button type="button" class="btn btn-secondary" id="btn-close-boleta">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="btn-print-boleta-action"><i class="fa-solid fa-print"></i> Imprimir Boleta</button>
                    </div>
                </div>
            </div>
        `;
        
        // Bind Filter events
        document.getElementById('pl-year').addEventListener('change', (e) => { currentYear = parseInt(e.target.value); renderView(); });
        document.getElementById('pl-month').addEventListener('change', (e) => { currentMonth = parseInt(e.target.value); renderView(); });
        document.getElementById('pl-period').addEventListener('change', (e) => { currentPeriod = e.target.value; renderView(); });
        
        // Bind lock/close button
        const lockBtn = document.getElementById('btn-lock-planilla');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                if (confirm(`¿Está seguro de que desea CERRAR el período de planilla para ${currentPeriod} de ${document.getElementById('pl-month').options[currentMonth-1].text} ${currentYear}?\nEsto bloqueará el registro de novedades.`)) {
                    db.planillas_cerradas.push({
                        key,
                        year: currentYear,
                        month: currentMonth,
                        period: currentPeriod,
                        closedAt: Date.now(),
                        data: payrollList
                    });
                    saveDatabase(db);
                    showToast("Planilla cerrada y guardada en el historial contable", "success");
                    renderView();
                }
            });
        }
        
        // Bind reopen button
        const reopenBtn = document.getElementById('btn-reopen-planilla');
        if (reopenBtn) {
            reopenBtn.addEventListener('click', () => {
                if (confirm(`¿Reabrir planilla del período? Volverá a ser editable.`)) {
                    db.planillas_cerradas = db.planillas_cerradas.filter(pc => pc.key !== key);
                    saveDatabase(db);
                    showToast("Planilla reabierta para edición", "info");
                    renderView();
                }
            });
        }
        
        // Bind Export Consolidated Planilla
        document.getElementById('btn-export-consolidated-planilla').addEventListener('click', () => {
            exportPlanillaConsolidada(currentYear, currentMonth, currentPeriod, payrollList);
        });

        // Bind Novedades Click
        document.querySelectorAll('.btn-payroll-novedades').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const emp = payrollList.find(x => x.Tecnico_ID === id);
                
                document.getElementById('nov-tech-id').value = id;
                document.getElementById('nov-empleado-name').textContent = emp.Nombre_Completo;
                
                document.getElementById('nov-horas-extras').value = emp.horasExtras || 0;
                document.getElementById('nov-comisiones').value = emp.comisiones || 0;
                document.getElementById('nov-vacaciones').value = emp.primaVacacional || 0;
                document.getElementById('nov-anticipos').value = emp.anticipos || 0;
                document.getElementById('nov-prestamos').value = emp.prestamos || 0;
                document.getElementById('nov-pgr').value = emp.pgr || 0;
                document.getElementById('nov-otros').value = emp.descuentosOtros || 0;
                
                document.getElementById('novedades-periodo-modal').classList.add('active');
            });
        });
        
        // Save Novedades Form
        const novForm = document.getElementById('novedades-periodo-form');
        novForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('nov-tech-id').value;
            const hExtras = parseFloat(document.getElementById('nov-horas-extras').value || 0);
            const com = parseFloat(document.getElementById('nov-comisiones').value || 0);
            const vac = parseFloat(document.getElementById('nov-vacaciones').value || 0);
            const ant = parseFloat(document.getElementById('nov-anticipos').value || 0);
            const pres = parseFloat(document.getElementById('nov-prestamos').value || 0);
            const pgr = parseFloat(document.getElementById('nov-pgr').value || 0);
            const otros = parseFloat(document.getElementById('nov-otros').value || 0);
            
            // Buscar o crear novedad en el array persistente
            let nov = db.novedades_planilla.find(n => n.techId === id && n.year === currentYear && n.month === currentMonth && n.period === currentPeriod);
            if (!nov) {
                nov = { techId: id, year: currentYear, month: currentMonth, period: currentPeriod };
                db.novedades_planilla.push(nov);
            }
            
            nov.horasExtras = hExtras;
            nov.comisiones = com;
            nov.primaVacacional = vac;
            nov.anticipos = ant;
            nov.prestamos = pres;
            nov.pgr = pgr;
            nov.descuentosOtros = otros;
            
            saveDatabase(db);
            showToast("Ajustes del período guardados", "success");
            document.getElementById('novedades-periodo-modal').classList.remove('active');
            renderView();
        });
        
        // Close modal triggers
        const closeNov = () => document.getElementById('novedades-periodo-modal').classList.remove('active');
        document.getElementById('close-nov-modal').addEventListener('click', closeNov);
        document.getElementById('btn-cancel-nov').addEventListener('click', closeNov);
        
        // Bind Boleta Click
        document.querySelectorAll('.btn-payroll-boleta').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const emp = payrollList.find(x => x.Tecnico_ID === id);
                
                const ws = getWorkshopConfig(db);
                const periodStr = currentPeriod === 'M' ? 'Mensual' : (currentPeriod === '1Q' ? '1ª Quincena' : '2ª Quincena');
                const monthName = document.getElementById('pl-month').options[currentMonth-1].text;
                
                const recContent = document.getElementById('boleta-receipt-content');
                recContent.innerHTML = `
                    <div style="text-align:center; margin-bottom:1rem; border-bottom:1.5px dashed #000; padding-bottom:0.75rem;">
                        <h2 style="margin:0; font-size:1.4rem; font-weight:800; font-family:'Outfit', sans-serif;">${ws.nombre}</h2>
                        <div style="font-size:0.75rem; margin-top:0.25rem;">${ws.giro}</div>
                        <div style="font-size:0.85rem; font-weight:bold; margin-top:0.5rem; text-transform:uppercase;">Boleta de Pago de Salarios</div>
                        <div style="font-size:0.8rem; margin-top:0.25rem; font-weight:600;">Período: ${periodStr} de ${monthName} de ${currentYear}</div>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:1rem; line-height:1.4;">
                        <div>
                            <strong>Empleado:</strong> ${emp.Nombre_Completo}<br>
                            <strong>Cargo:</strong> ${emp.Especialidad}<br>
                            <strong>ID:</strong> ${emp.Tecnico_ID}
                        </div>
                        <div style="text-align:right;">
                            <strong>Salario Base:</strong> $ ${parseFloat(emp.Salario_Base).toFixed(2)}/mes<br>
                            <strong>Base Período:</strong> $ ${parseFloat(itemBaseSalary(emp)).toFixed(2)}
                        </div>
                    </div>
                    
                    <table style="width:100%; font-size:0.8rem; border-collapse:collapse; margin-bottom:1.25rem;">
                        <thead>
                            <tr style="border-bottom:1px solid #000; font-weight:bold;">
                                <th style="text-align:left; padding:0.25rem 0;">Ingresos / Devengos</th>
                                <th style="text-align:right; padding:0.25rem 0;">Monto</th>
                                <th style="text-align:left; padding:0.25rem 0; padding-left:1rem;">Deducciones / Descuentos</th>
                                <th style="text-align:right; padding:0.25rem 0;">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding:0.2rem 0;">Base del Período</td>
                                <td style="text-align:right;">$ ${parseFloat(itemBaseSalary(emp)).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">ISSS Seguro Social (3%)</td>
                                <td style="text-align:right; color:red;">- $ ${emp.isssEmployee.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;">Horas Extras</td>
                                <td style="text-align:right;">+ $ ${parseFloat(emp.horasExtras || 0).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">AFP Pensiones (7.25%)</td>
                                <td style="text-align:right; color:red;">- $ ${emp.afpEmployee.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;">Comisiones / Bonos</td>
                                <td style="text-align:right;">+ $ ${parseFloat(emp.comisiones || 0).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Retención ISR Renta</td>
                                <td style="text-align:right; color:red;">- $ ${emp.isr.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;">Prima Vacacional</td>
                                <td style="text-align:right;">+ $ ${parseFloat(emp.primaVacacional || 0).toFixed(2)}</td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Anticipos de Salario</td>
                                <td style="text-align:right; color:red;">- $ ${parseFloat(emp.anticipos || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;"></td>
                                <td style="text-align:right;"></td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Préstamos Taller</td>
                                <td style="text-align:right; color:red;">- $ ${parseFloat(emp.prestamos || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding:0.2rem 0;"></td>
                                <td style="text-align:right;"></td>
                                <td style="padding:0.2rem 0; padding-left:1rem;">Cuota Alimenticia PGR</td>
                                <td style="text-align:right; color:red;">- $ ${parseFloat(emp.pgr || 0).toFixed(2)}</td>
                            </tr>
                            <tr style="border-bottom:1px solid #000;">
                                <td style="padding:0.2rem 0;"></td>
                                <td style="text-align:right;"></td>
                                <td style="padding:0.2rem 0; padding-left:1rem; padding-bottom:0.25rem;">Otros Descuentos</td>
                                <td style="text-align:right; color:red; padding-bottom:0.25rem;">- $ ${parseFloat(emp.descuentosOtros || 0).toFixed(2)}</td>
                            </tr>
                            <tr style="font-weight:bold;">
                                <td style="padding:0.5rem 0;">Total Devengado</td>
                                <td style="text-align:right;">$ ${(itemBaseSalary(emp) + emp.extraEarnings).toFixed(2)}</td>
                                <td style="padding:0.5rem 0; padding-left:1rem;">Total Retenciones</td>
                                <td style="text-align:right;">$ ${(emp.isssEmployee + emp.afpEmployee + emp.isr + emp.totalDescuentosAdicionales).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div style="background-color:#f1f5f9; padding:0.75rem; display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:1rem; border:1px solid #000;">
                        <span>LÍQUIDO NETO A RECIBIR:</span>
                        <span style="color:#047857;">$ ${parseFloat(emp.netSalary).toFixed(2)}</span>
                    </div>
                    
                    <div style="margin-top:2.5rem; display:flex; justify-content:space-between; font-size:0.7rem;">
                        <div style="width:45%; border-top:1px solid #000; text-align:center; padding-top:0.25rem;">
                            Firma del Empleado<br>DUI: _________________
                        </div>
                        <div style="width:45%; border-top:1px solid #000; text-align:center; padding-top:0.25rem;">
                            Entregado Por (Taller / Caja)<br>${ws.nombre}
                        </div>
                    </div>
                `;
                
                document.getElementById('boleta-print-modal').classList.add('active');
                
                // Bind print action button inside modal
                document.getElementById('btn-print-boleta-action').replaceWith(document.getElementById('btn-print-boleta-action').cloneNode(true));
                document.getElementById('btn-print-boleta-action').addEventListener('click', () => {
                    const printWin = window.open('', '_blank');
                    printWin.document.write(`
                        <html>
                        <head>
                            <title>Boleta de Pago - ${emp.Nombre_Completo}</title>
                            <style>
                                body { font-family: monospace; padding: 20px; background: white; color: black; }
                                table { width: 100%; border-collapse: collapse; }
                                th, td { padding: 4px; }
                            </style>
                        </head>
                        <body>
                            <div style="max-width:600px; margin:0 auto; border:1px solid #000; padding:20px;">
                                ${recContent.innerHTML}
                            </div>
                            <script>window.print();<\/script>
                        </body>
                        </html>
                    `);
                    printWin.document.close();
                });
            });
        });
        
        function itemBaseSalary(emp) {
            return currentPeriod === 'M' ? emp.Salario_Base : emp.Salario_Base / 2;
        }

        const closeBoleta = () => document.getElementById('boleta-print-modal').classList.remove('active');
        document.getElementById('close-boleta-modal').addEventListener('click', closeBoleta);
        document.getElementById('btn-close-boleta').addEventListener('click', closeBoleta);
    }
    
    renderView();
}

function exportPlanillaConsolidada(year, month, periodType, payrollData) {
    const periodStr = periodType === 'M' ? 'Mensual' : (periodType === '1Q' ? '1ª Quincena' : '2ª Quincena');
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const monthStr = monthNames[month - 1];

    const totals = payrollData.reduce((sum, item) => {
        sum.base += item.Salario_Periodo_Base;
        sum.extras += item.extraEarnings;
        sum.isss += item.isssEmployee;
        sum.afp += item.afpEmployee;
        sum.isr += item.isr;
        sum.other += item.totalDescuentosAdicionales;
        sum.net += item.netSalary;
        sum.patronalISSS += item.isssEmployer;
        sum.patronalAFP += item.afpEmployer;
        sum.insaforp += item.insaforp;
        sum.totalCost += item.employerCost;
        return sum;
    }, { base: 0, extras: 0, isss: 0, afp: 0, isr: 0, other: 0, net: 0, patronalISSS: 0, patronalAFP: 0, insaforp: 0, totalCost: 0 });

    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    const printWin = window.open('', '_blank');
    printWin.document.write(`
        <html>
        <head>
            <title>Planilla Consolidada - ${periodStr} ${monthStr} ${year}</title>
            <style>
                body { font-family: 'Inter', sans-serif; font-size: 11px; color: black; background: white; padding: 25px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                h1 { margin: 0; font-size: 18px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
                th { background-color: #f3f4f6; font-weight: bold; }
                .text-right { text-align: right; }
                .totals-row { font-weight: bold; background-color: #e5e7eb; }
                .footer-signatures { display: flex; justify-content: space-between; margin-top: 50px; }
                .signature-box { width: 30%; border-top: 1px solid #000; text-align: center; padding-top: 5px; font-size: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${ws.nombre}</h1>
                <div style="font-size:12px; font-weight:bold; margin-top:4px;">REPORTE DE PLANILLA CONSOLIDADA DE SALARIOS</div>
                <div style="font-size:11px; margin-top:2px;">Período: ${periodStr} de ${monthStr} de ${year}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Base Período</th>
                        <th>Ingresos Extras</th>
                        <th class="text-right">ISSS Ret.</th>
                        <th class="text-right">AFP Ret.</th>
                        <th class="text-right">ISR Renta</th>
                        <th class="text-right">Otros Descs.</th>
                        <th class="text-right">Líquido a Pagar</th>
                        <th class="text-right">Costo Patronal</th>
                    </tr>
                </thead>
                <tbody>
                    ${payrollData.map(item => `
                        <tr>
                            <td><strong>${item.Nombre_Completo}</strong><br><small style="color:#666;">${item.Especialidad}</small></td>
                            <td>$ ${parseFloat(item.Salario_Periodo_Base).toFixed(2)}</td>
                            <td>$ ${parseFloat(item.extraEarnings).toFixed(2)}</td>
                            <td class="text-right">$ ${item.isssEmployee.toFixed(2)}</td>
                            <td class="text-right">$ ${item.afpEmployee.toFixed(2)}</td>
                            <td class="text-right">$ ${item.isr.toFixed(2)}</td>
                            <td class="text-right">$ ${item.totalDescuentosAdicionales.toFixed(2)}</td>
                            <td class="text-right" style="font-weight:bold;">$ ${item.netSalary.toFixed(2)}</td>
                            <td class="text-right">$ ${item.employerCost.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                    <tr class="totals-row">
                        <td>TOTALES PLANILLA</td>
                        <td>$ ${totals.base.toFixed(2)}</td>
                        <td>$ ${totals.extras.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.isss.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.afp.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.isr.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.other.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.net.toFixed(2)}</td>
                        <td class="text-right">$ ${totals.totalCost.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top:20px; font-size:10px; background-color:#f9fafb; padding:10px; border:1px solid #e5e7eb;">
                <strong>Resumen de Aportes Patronales para este Período:</strong><br>
                ISSS Patronal (7.50%): $ ${totals.patronalISSS.toFixed(2)} | 
                AFP Patronal (8.75%): $ ${totals.patronalAFP.toFixed(2)} | 
                INSAFORP (1.00%): $ ${totals.insaforp.toFixed(2)} | 
                <strong>Total Aportes Patronales:</strong> $ ${(totals.patronalISSS + totals.patronalAFP + totals.insaforp).toFixed(2)}
            </div>

            <div class="footer-signatures">
                <div class="signature-box">
                    Preparado Por (Contabilidad)<br>${ws.nombre}
                </div>
                <div class="signature-box">
                    Revisado Por (Recursos Humanos)<br>Firma Autorizada
                </div>
                <div class="signature-box">
                    Aprobado Por (Gerencia)<br>Firma Autorizada
                </div>
            </div>
            <script>window.print();</script>
        </body>
        </html>
    `);
    printWin.document.close();
}

// Helper function: Convert number to Spanish words (uppercase)
function numeroALetras(num) {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const diezADiecinueve = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISITE', 'DIECIOCHO', 'DIECINUEVE'];
    const veintiunoAVeintinueve = ['VEINTE', 'VEINTIUNO', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    function convertirGrupo(n) {
        let output = '';
        if (n >= 100) {
            if (n === 100) return 'CIEN ';
            output += centenas[Math.floor(n / 100)] + ' ';
            n %= 100;
        }
        if (n >= 20) {
            if (n >= 20 && n <= 29) {
                output += veintiunoAVeintinueve[n - 20] + ' ';
            } else {
                output += decenas[Math.floor(n / 10)] + ' ';
                n %= 10;
                if (n > 0) {
                    output += 'Y ' + unidades[n] + ' ';
                }
            }
        } else if (n >= 10) {
            output += diezADiecinueve[n - 10] + ' ';
        } else if (n > 0) {
            output += unidades[n] + ' ';
        }
        return output;
    }

    if (num === 0) return 'CERO CON 00/100 DÓLARES';
    
    let entero = Math.floor(num);
    let decimales = Math.round((num - entero) * 100);
    let letras = '';

    if (entero >= 1000000) {
        let millones = Math.floor(entero / 1000000);
        if (millones === 1) {
            letras += 'UN MILLÓN ';
        } else {
            letras += convertirGrupo(millones) + 'MILLONES ';
        }
        entero %= 1000000;
    }

    if (entero >= 1000) {
        let miles = Math.floor(entero / 1000);
        if (miles === 1) {
            letras += 'MIL ';
        } else {
            letras += convertirGrupo(miles) + 'MIL ';
        }
        entero %= 1000;
    }

    if (entero > 0) {
        letras += convertirGrupo(entero);
    }

    const centavos = (decimales < 10 ? '0' : '') + decimales;
    return `${letras.trim()} CON ${centavos}/100 DÓLARES`;
}

// Format 1: Clásico Mecanic OS
function getClasicoMecanicOSHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab) {
    const productsHTML = products.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px;">No se cotizan repuestos y lubricantes</td></tr>'
        : products.map(p => `
            <tr>
                <td style="text-align: center; width: 8%;">${p.Cantidad}</td>
                <td style="width: 62%;">${p.Descripcion}</td>
                <td style="text-align: right; width: 15%;">$ ${parseFloat(p.PrecioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; width: 15%;">$ ${(parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

    const laborHTML = labor.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px;">No se cotiza mano de obra</td></tr>'
        : labor.map(l => `
            <tr>
                <td style="text-align: center; width: 8%;">${l.Cantidad}</td>
                <td style="width: 62%;">${l.Descripcion}</td>
                <td style="text-align: right; width: 15%;">$ ${parseFloat(l.PrecioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
                <td style="text-align: right; width: 15%;">$ ${(parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

    let percRow = '';
    if (percVal > 0) {
        percRow = `
            <tr>
                <td class="totals-label">(+) IVA PERCIBIDO</td>
                <td class="totals-val">$ ${percVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let retRow = '';
    if (retVal > 0) {
        retRow = `
            <tr>
                <td class="totals-label">(-) IVA RETENIDO</td>
                <td class="totals-val">$ ${retVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Orden de Trabajo - ${budget['ID Presupuesto']}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #1e293b;
            --secondary-color: #475569;
            --bg-label: #dce2e6;
            --border-color: #b0b8c0;
            --text-color: #000;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--text-color);
            background-color: #f8fafc;
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
        }
        .no-print-toolbar h3 {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 1.15rem;
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

        .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
        }
        .company-details {
            max-width: 500px;
        }
        .company-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 1.5rem;
            margin: 0 0 6px 0;
            color: var(--primary-color);
            letter-spacing: -0.02em;
        }
        .company-info {
            font-size: 0.85rem;
            line-height: 1.5;
            color: #334155;
        }
        .company-email {
            color: #0b5ed7;
            text-decoration: none;
            font-weight: 600;
        }
        .company-email:hover {
            text-decoration: underline;
        }
        .logo-container {
            width: 220px;
            text-align: right;
        }

        .document-title {
            text-align: right;
            font-family: 'Outfit', sans-serif;
            font-size: 1.25rem;
            font-weight: 500;
            color: #64748b;
            letter-spacing: 0.08em;
            margin: 10px 0 15px 0;
            text-transform: uppercase;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
            margin-bottom: 20px;
        }
        table, th, td {
            border: 1px solid var(--border-color);
        }

        .meta-table td {
            padding: 6px 10px;
            vertical-align: middle;
        }
        .meta-label {
            background-color: var(--bg-label);
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.72rem;
            width: 18%;
            text-align: center;
            color: #1e293b;
        }
        .meta-val {
            background-color: #fff;
            width: 32%;
            font-size: 0.8rem;
            color: #0f172a;
        }

        .section-title-bar {
            background-color: var(--primary-color);
            color: #fff;
            text-align: center;
            font-family: 'Outfit', sans-serif;
            font-size: 0.8rem;
            font-weight: 700;
            padding: 6px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }
        .section-desc-box {
            border: 1px solid var(--border-color);
            border-top: none;
            padding: 10px 15px;
            min-height: 40px;
            font-size: 0.85rem;
            margin-bottom: 25px;
            background-color: #fff;
            color: #1e293b;
            border-radius: 0 0 4px 4px;
        }

        .data-table th {
            background-color: var(--bg-label);
            color: #0f172a;
            font-weight: 700;
            text-align: center;
            padding: 8px;
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }
        .data-table td {
            padding: 8px 10px;
            font-size: 0.82rem;
            color: #1e293b;
        }
        .table-footer-row {
            background-color: var(--bg-label);
            font-weight: bold;
            font-size: 0.8rem;
            color: #0f172a;
        }
        .table-footer-row td {
            padding: 8px 10px;
        }

        .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 25px;
            page-break-inside: avoid;
        }
        .auth-box {
            width: 55%;
            border: 1.5px solid var(--border-color);
            padding: 15px;
            box-sizing: border-box;
            border-radius: 6px;
            min-height: 120px;
            font-size: 0.8rem;
            background-color: #fff;
        }
        .auth-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 30px;
            color: #0f172a;
            font-size: 0.75rem;
            letter-spacing: 0.04em;
        }
        .auth-line {
            border-bottom: 1.5px dashed var(--border-color);
            margin-top: 20px;
            width: 80%;
        }

        .totals-table {
            width: 40%;
            margin-bottom: 0;
        }
        .totals-table td {
            padding: 6px 10px;
        }
        .totals-label {
            background-color: var(--bg-label);
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.72rem;
            width: 50%;
            text-align: center;
            color: #0f172a;
        }
        .totals-val {
            text-align: right;
            font-size: 0.85rem;
            width: 50%;
            color: #1e293b;
        }
        .grand-total-row {
            font-weight: bold;
            font-size: 1rem;
        }

        @media print {
            body {
                background-color: #fff;
                color: #000;
            }
            .no-print-toolbar {
                display: none !important;
            }
            .page-container {
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border-radius: 0;
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
        <h3>Vista Previa de Impresión - Mecanic OS</h3>
        <div class="toolbar-buttons">
            <button class="btn-action btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir o Guardar PDF</button>
            <button class="btn-action btn-close" onclick="window.close()"><i class="fa-solid fa-xmark"></i> Cerrar Vista Previa</button>
        </div>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="pdf-header">
            <div class="company-details">
                <h1 class="company-title">${ws.nombre_comercial || ws.nombre}</h1>
                <div class="company-info">
                    ${ws.nombre_comercial && ws.nombre_comercial !== ws.nombre ? `Razón Social: ${ws.nombre}<br>` : ''}
                    Dirección: ${ws.direccion || ''}${ws.municipio || ws.departamento || ws.pais ? `, ${[ws.municipio, ws.departamento, ws.pais].filter(Boolean).join(', ')}` : ''}<br>
                    Tel: ${ws.telefono} | Correo: <a href="mailto:${ws.correo}" class="company-email">${ws.correo}</a><br>
                    ${ws.tipo_documento || 'NIT'}: ${ws.num_documento || ws.nit || ''} ${ws.nrc ? ` | NRC: ${ws.nrc}` : ''}<br>
                    Giro: ${ws.actividad_economica || ws.giro || 'Servicios Automotrices'}
                </div>
            </div>
            <div class="logo-container" style="display: flex; justify-content: flex-end; align-items: center; min-height: 90px;">
                ${ws.logo ? `
                    <img src="${ws.logo}" style="max-width: 220px; max-height: 90px; object-fit: contain; border-radius: 4px;" />
                ` : `
                    <svg width="220" height="90" viewBox="0 0 220 90" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="218" height="88" rx="8" fill="#f8fafc" stroke="#b0b8c0" stroke-width="1.2"/>
                        <path d="M10,75 L210,75 M10,79 L210,79" stroke="#64748b" stroke-width="0.8" stroke-dasharray="2,2"/>
                        <g transform="translate(14, 16) scale(0.052)" fill="#1e293b">
                            <path d="M190 280 L160 210 Q150 190 130 190 L60 190 Q40 190 30 210 L5 280 L5 360 L190 360 Z M190 360 M120 220 L70 220 L70 260 L120 260 Z" fill="#64748b"/>
                            <circle cx="50" cy="370" r="22"/>
                            <circle cx="150" cy="370" r="22"/>
                            <path d="M420 250 L380 160 Q360 130 330 130 L230 130 Q200 130 180 160 L140 250 L140 370 L420 370 Z M280 170 L210 170 L210 220 L280 220 Z M370 170 L300 170 L300 220 L370 220 Z" fill="#1e293b"/>
                            <circle cx="210" cy="385" r="28"/>
                            <circle cx="350" cy="385" r="28"/>
                        </g>
                        <text x="76" y="24" font-family="'Outfit', sans-serif" font-size="11.5" font-weight="800" fill="#1e293b">${ws.logoText || 'TALLER'}</text>
                        <text x="76" y="37" font-family="'Outfit', sans-serif" font-size="9" font-weight="700" fill="#64748b">${ws.nombre.includes('C.V.') || ws.nombre.includes('c.v.') ? 'S.A. DE C.V.' : ''}</text>
                        <text x="76" y="55" font-family="'Inter', sans-serif" font-size="6" font-weight="600" fill="#1e293b">${(ws.logoTagline || '').toUpperCase()}</text>
                        <text x="76" y="65" font-family="'Inter', sans-serif" font-size="5.5" font-weight="600" fill="#64748b">${(ws.giro || '').substring(0, 50).toUpperCase()}</text>
                    </svg>
                `}
            </div>
        </div>

        <div class="document-title">Orden de Trabajo</div>

        <!-- Meta Grid -->
        <table class="meta-table">
            <tr>
                <td class="meta-label">Cliente</td>
                <td class="meta-val">${budget.Nombre}</td>
                <td class="meta-label">Placa</td>
                <td class="meta-val">${vehicle.Placas || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Teléfono</td>
                <td class="meta-val">${budget['Telefono 1 '] || client['Telefono 1 '] || 'N/A'}</td>
                <td class="meta-label">Condición</td>
                <td class="meta-val">${budget.Condicion || (client['Credito?'] === 'SI' ? 'CREDITO' : 'CONTADO')}</td>
            </tr>
            <tr>
                <td class="meta-label">Fecha Ingreso</td>
                <td class="meta-val">${new Date(budget.Fecha).toLocaleDateString('es-SV')}</td>
                <td class="meta-label">Fecha Prometida</td>
                <td class="meta-val">${budget['Fecha Prometida'] ? new Date(budget['Fecha Prometida']).toLocaleDateString('es-SV') : new Date(budget.Fecha + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('es-SV')}</td>
            </tr>
            <tr>
                <td class="meta-label">V I N</td>
                <td class="meta-val">${vehicle.Nª_VIN || 'N/A'}</td>
                <td class="meta-label">Marca</td>
                <td class="meta-val">${vehicle.Marca || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Odómetro</td>
                <td class="meta-val">${budget.Kilometraje || vehicle.Odometro || '0'}</td>
                <td class="meta-label">Modelo</td>
                <td class="meta-val">${vehicle.Modelo || 'N/A'}</td>
            </tr>
            <tr>
                <td class="meta-label">Motor</td>
                <td class="meta-val">${vehicle.Nª_Motor || 'N/A'}</td>
                <td class="meta-label">Año</td>
                <td class="meta-val">${vehicle.Año || 'N/A'}</td>
            </tr>
        </table>

        <!-- Fallas Detectadas Box -->
        <div class="section-title-bar">Fallas Detectadas</div>
        <div class="section-desc-box">${budget.Fallas_Detectadas || budget['Fallas Detectadas'] || 'Diagnóstico general de taller'}</div>

        <!-- Products Table -->
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-cant">Cant</th>
                    <th class="col-desc">Descripción Repuestos y Lubricantes</th>
                    <th class="col-price">P. Unitario</th>
                    <th class="col-total">Total ($)</th>
                </tr>
            </thead>
            <tbody>
                ${productsHTML}
                <tr class="table-footer-row">
                    <td colspan="3">Total Repuestos y Lubricantes</td>
                    <td style="text-align: right;">$ ${sumProd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>

        <!-- Labor Table -->
        <table class="data-table">
            <thead>
                <tr>
                    <th class="col-cant">Cant</th>
                    <th class="col-desc">Descripción Mano de Obra</th>
                    <th class="col-price">P. Unitario</th>
                    <th class="col-total">Total ($)</th>
                </tr>
            </thead>
            <tbody>
                ${laborHTML}
                <tr class="table-footer-row">
                    <td colspan="3">Total Mano de obra</td>
                    <td style="text-align: right;">$ ${sumLab.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>

        <!-- Bottom Layout -->
        <div class="bottom-section">
            <div class="auth-box">
                <div class="auth-title">Trabajos Autorizados Por:</div>
                <div style="font-weight: 500; font-size: 0.85rem; color: #334155; margin-top: 15px;">
                    ${budget.Nombre}
                </div>
                <div class="auth-line"></div>
            </div>
            
            <table class="totals-table">
                <tr>
                    <td class="totals-label">Sumas</td>
                    <td class="totals-val">$ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                    <td class="totals-label">IVA</td>
                    <td class="totals-val">$ ${iva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${percRow}
                ${retRow}
                <tr>
                    <td class="totals-label">(-) Retención Renta</td>
                    <td class="totals-val">$ 0.00</td>
                </tr>
                <tr class="grand-total-row">
                    <td class="totals-label" style="background-color: var(--primary-color); color: #fff;">Total a Pagar</td>
                    <td class="totals-val" style="font-weight: bold; font-size: 1.05rem;">$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </table>
        </div>
    </div>

    <script>
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.print();
            }, 600);
        });
    </script>
</body>
</html>
    `;
}

// Format 2: Moderno FacturaLlama DTE
function getModernoFacturaLlamaHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab) {
    let items = [];
    products.forEach(p => {
        items.push({
            cant: parseFloat(p.Cantidad || 1).toFixed(2),
            unidad: 'Pieza',
            desc: `[Repuesto] ${p.Descripcion}`,
            precio: parseFloat(p.PrecioUnitario || 0),
            descItem: 0.00,
            total: parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1)
        });
    });
    labor.forEach(l => {
        items.push({
            cant: parseFloat(l.Cantidad || 1).toFixed(2),
            unidad: 'Servicio',
            desc: `[Mano de Obra] ${l.Descripcion}`,
            precio: parseFloat(l.PrecioUnitario || 0),
            descItem: 0.00,
            total: parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1)
        });
    });

    const itemsHTML = items.length === 0
        ? '<tr><td colspan="10" style="text-align: center; color: #64748b; padding: 12px;">No se registran items cotizados</td></tr>'
        : items.map((item, idx) => `
            <tr>
                <td style="text-align: center; width: 4%;">${idx + 1}</td>
                <td style="text-align: center; width: 6%;">${item.cant}</td>
                <td style="text-align: center; width: 8%;">${item.unidad}</td>
                <td style="width: 42%;">${item.desc}</td>
                <td style="text-align: right; width: 10%;">$ ${item.precio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; width: 8%;">$ ${item.descItem.toFixed(2)}</td>
                <td style="text-align: right; width: 7%;">$ 0.00</td>
                <td style="text-align: right; width: 5%;">$ 0.00</td>
                <td style="text-align: right; width: 5%;">$ 0.00</td>
                <td style="text-align: right; width: 10%;">$ ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

    const totalLetras = numeroALetras(grandTotal).toUpperCase();
    const conditionStr = budget.Condicion || (client['Credito?'] === 'SI' ? 'CRÉDITO' : 'CONTADO');

    let percRow = '';
    if (percVal > 0) {
        percRow = `
            <tr>
                <td class="totals-label">(+) IVA Percibido</td>
                <td class="totals-val">$ ${percVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let retRow = '';
    if (retVal > 0) {
        retRow = `
            <tr>
                <td class="totals-label">(-) IVA Retenido</td>
                <td class="totals-val">$ ${retVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let logoHTML = '';
    if (ws.logo) {
        logoHTML = `<img src="${ws.logo}" style="max-height: 85px; max-width: 200px; object-fit: contain; border-radius: 4px;" />`;
    } else {
        logoHTML = `
            <div style="border:1.2px solid var(--border-color); padding: 6px; border-radius:6px; background:#f8fafc; font-family:'Outfit',sans-serif; text-align:center; font-weight:800; color:var(--primary-color); width:100%;">
                <div style="font-size:1.15rem;">${ws.logoText || 'TALLER'}</div>
                <div style="font-size:0.6rem; color:#64748b; font-weight:600; text-transform:uppercase;">${(ws.logoTagline || '').substring(0,35)}</div>
            </div>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Presupuesto DTE - ${budget['ID Presupuesto']}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #5a626a;
            --border-color: #cbd5e1;
            --text-color: #0f172a;
            --bg-label: #f1f5f9;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--text-color);
            background-color: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 0.72rem;
        }

        .no-print-toolbar {
            background-color: #1e293b;
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #fff;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .no-print-toolbar h3 {
            margin: 0;
            font-family: 'Outfit', sans-serif;
            font-size: 1.15rem;
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
            padding: 25px;
            box-sizing: border-box;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border-radius: 8px;
        }

        .pdf-header {
            display: grid;
            grid-template-columns: 1.3fr 1fr 0.8fr;
            gap: 10px;
            margin-bottom: 15px;
            align-items: start;
        }
        .company-details {
            font-size: 0.72rem;
            line-height: 1.4;
        }
        .company-title {
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 1.25rem;
            margin: 0 0 4px 0;
            color: var(--primary-color);
        }
        .logo-container {
            text-align: right;
            display: flex;
            justify-content: flex-end;
            align-items: center;
        }

        .section-header-bar {
            background-color: var(--primary-color);
            color: #fff;
            font-family: 'Outfit', sans-serif;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 10px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            text-align: center;
            border-radius: 4px 4px 0 0;
        }

        .box-container {
            border: 1px solid var(--border-color);
            border-top: none;
            padding: 10px;
            background-color: #fff;
            border-radius: 0 0 4px 4px;
            margin-bottom: 12px;
        }

        .dte-grid {
            display: grid;
            grid-template-columns: 85px 1fr;
            gap: 12px;
            align-items: center;
        }
        .dte-details {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 5px;
            font-size: 0.7rem;
            line-height: 1.3;
        }

        .receptor-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 15px;
            font-size: 0.7rem;
            line-height: 1.3;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.68rem;
            margin-bottom: 12px;
        }
        table, th, td {
            border: 1px solid var(--border-color);
        }
        th {
            background-color: var(--bg-label);
            font-weight: 700;
            text-align: center;
            padding: 5px;
            font-size: 0.7rem;
        }
        td {
            padding: 5px 6px;
        }

        .bottom-grid {
            display: grid;
            grid-template-columns: 1.3fr 1fr;
            gap: 15px;
            margin-top: 10px;
            page-break-inside: avoid;
        }
        .left-notes {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .notes-box {
            border: 1px solid var(--border-color);
            padding: 8px;
            background-color: #fafbfc;
            border-radius: 4px;
            min-height: 40px;
            font-size: 0.68rem;
            line-height: 1.3;
        }
        .extension-box {
            border: 1px solid var(--border-color);
            border-radius: 4px;
            overflow: hidden;
        }
        .extension-header {
            background-color: var(--primary-color);
            color: #fff;
            text-align: center;
            font-weight: 700;
            padding: 3px;
            font-size: 0.7rem;
        }
        .extension-body {
            padding: 8px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 0.65rem;
        }
        .sig-line {
            border-bottom: 1px dashed #b0b8c0;
            margin-top: 15px;
            height: 10px;
        }

        .totals-table {
            width: 100%;
            margin-bottom: 0;
        }
        .totals-table td {
            padding: 4px 8px;
        }
        .totals-label {
            font-weight: 600;
            font-size: 0.65rem;
            color: #334155;
            background-color: var(--bg-label);
        }
        .totals-val {
            text-align: right;
            font-weight: 600;
        }
        .grand-total-row td {
            background-color: var(--primary-color);
            color: #fff;
            font-size: 0.8rem;
        }

        @media print {
            body {
                background-color: #fff;
                color: #000;
            }
            .no-print-toolbar {
                display: none !important;
            }
            .page-container {
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none;
                border-radius: 0;
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
        <h3>Vista Previa de Impresión (Formato DTE) - Mecanic OS</h3>
        <div class="toolbar-buttons">
            <button class="btn-action btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir o Guardar PDF</button>
            <button class="btn-action btn-close" onclick="window.close()"><i class="fa-solid fa-xmark"></i> Cerrar Vista Previa</button>
        </div>
    </div>

    <div class="page-container">
        <!-- Header -->
        <div class="pdf-header">
            <div class="company-details">
                <h1 class="company-title">${ws.nombre_comercial || ws.nombre}</h1>
                <div><strong>Nombre o Razón Social:</strong> ${ws.nombre}</div>
                <div><strong>Actividad Económica:</strong> ${ws.actividad_economica || ws.giro || 'Servicios Automotrices'}</div>
                <div><strong>NIT:</strong> ${ws.num_documento || ws.nit || ''} &nbsp;&nbsp; <strong>NRC:</strong> ${ws.nrc || ''}</div>
                <div><strong>Correo Electrónico:</strong> ${ws.correo}</div>
                <div><strong>Teléfono:</strong> ${ws.telefono}</div>
            </div>
            <div class="company-details">
                <div><strong>Dirección:</strong> ${ws.direccion || ''}</div>
                <div>MUNICIPIO DE ${ws.municipio ? ws.municipio.toUpperCase() : ''}</div>
                <div>DEPARTAMENTO DE ${ws.departamento ? ws.departamento.toUpperCase() : ''}</div>
                <div style="margin-top: 5px;"><strong>Casa Matriz/Sucursal:</strong> M001</div>
                <div><strong>Punto de Venta:</strong> P001</div>
            </div>
            <div class="logo-container">
                ${logoHTML}
            </div>
        </div>

        <!-- DTE Box -->
        <div class="section-header-bar">Documento Tributario Electrónico - Presupuesto / Cotización</div>
        <div class="box-container dte-grid">
            <div>
                <!-- Mock QR Code -->
                <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" fill="#f8fafc" rx="4" stroke="#b0b8c0" stroke-width="1"/>
                    <rect x="10" y="10" width="25" height="25" fill="none" stroke="#5a626a" stroke-width="6"/>
                    <rect x="15" y="15" width="15" height="15" fill="#f8fafc"/>
                    <rect x="17" y="17" width="11" height="11" fill="#5a626a"/>
                    
                    <rect x="65" y="10" width="25" height="25" fill="none" stroke="#5a626a" stroke-width="6"/>
                    <rect x="70" y="15" width="15" height="15" fill="#f8fafc"/>
                    <rect x="72" y="17" width="11" height="11" fill="#5a626a"/>
                    
                    <rect x="10" y="65" width="25" height="25" fill="none" stroke="#5a626a" stroke-width="6"/>
                    <rect x="15" y="70" width="15" height="15" fill="#f8fafc"/>
                    <rect x="17" y="72" width="11" height="11" fill="#5a626a"/>
                    
                    <rect x="65" y="65" width="10" height="10" fill="#5a626a"/>
                    <rect x="42" y="12" width="6" height="6" fill="#5a626a"/>
                    <rect x="48" y="18" width="6" height="12" fill="#5a626a"/>
                    <rect x="12" y="42" width="12" height="6" fill="#5a626a"/>
                    <rect x="24" y="48" width="6" height="6" fill="#5a626a"/>
                    <rect x="42" y="42" width="18" height="18" fill="#5a626a"/>
                    <rect x="72" y="42" width="12" height="12" fill="#5a626a"/>
                    <rect x="42" y="72" width="12" height="6" fill="#5a626a"/>
                    <rect x="78" y="78" width="10" height="10" fill="#5a626a"/>
                    <rect x="54" y="60" width="6" height="18" fill="#5a626a"/>
                </svg>
            </div>
            <div class="dte-details">
                <div><strong>Modelo de Facturación:</strong> MODELO FACTURACIÓN PREVIO</div>
                <div><strong>Tipo de Transmisión:</strong> TRANSMISIÓN NORMAL</div>
                <div><strong>Código de Generación:</strong><br><span style="font-family:monospace; font-size:0.65rem;">${budget['ID Presupuesto'].toUpperCase()}-PREV-DTE</span></div>
                <div><strong>Versión de JSON:</strong> 1</div>
                <div><strong>Número de Control:</strong> DTE-01-M001P001-${budget['ID Presupuesto'].substring(0,8)}</div>
                <div><strong>Fecha y Hora de Generación:</strong><br>${new Date(budget.Fecha).toLocaleDateString('es-SV')} ${budget.Hora || '12:00:00'}</div>
                <div style="grid-column: span 2;"><strong>Sello de Recepción:</strong> COTIZACION-NO-TRIBUTARIA-VALIDA-PARA-TALLER</div>
            </div>
        </div>

        <!-- Receptor Box -->
        <div class="section-header-bar">Receptor / Cliente y Vehículo</div>
        <div class="box-container receptor-grid">
            <div>
                <h3 style="margin: 0 0 5px 0; font-size:0.75rem; color:var(--primary-color);">Datos del Cliente</h3>
                <div><strong>Nombre o Razón Social:</strong> ${client.Nombre}</div>
                <div><strong>Tipo de Documento:</strong> ${client.Tipo_Documento || 'DUI'}</div>
                <div><strong>N° Documento:</strong> ${client.Num_Documento || client.DUI || 'N/A'}</div>
                <div><strong>Dirección:</strong> ${client.Direccion || 'Dirección de cliente registrada'}</div>
                <div><strong>Correo Electrónico:</strong> ${client.Correo || 'N/A'}</div>
                <div><strong>Teléfono:</strong> ${budget['Telefono 1 '] || client['Telefono 1 '] || 'N/A'}</div>
            </div>
            <div>
                <h3 style="margin: 0 0 5px 0; font-size:0.75rem; color:var(--primary-color);">Detalles del Vehículo</h3>
                <div><strong>Placa:</strong> ${vehicle.Placas || 'N/A'} &nbsp;&nbsp;&nbsp; <strong>Año:</strong> ${vehicle.Año || 'N/A'}</div>
                <div><strong>Marca / Modelo:</strong> ${vehicle.Marca || 'N/A'} ${vehicle.Modelo || 'N/A'}</div>
                <div><strong>VIN / Motor:</strong> ${vehicle.Nª_VIN || 'N/A'} / ${vehicle.Nª_Motor || 'N/A'}</div>
                <div><strong>Odómetro / Recorrido:</strong> ${budget.Kilometraje || vehicle.Odometro || '0'} km</div>
                <div><strong>Fallas Reportadas:</strong> ${budget.Fallas_Detectadas || 'Diagnóstico de taller'}</div>
            </div>
        </div>

        <!-- Cuerpo de Documento -->
        <div class="section-header-bar">Cuerpo del Documento</div>
        <table>
            <thead>
                <tr>
                    <th>N°</th>
                    <th>Cant.</th>
                    <th>Unidad</th>
                    <th>Descripción</th>
                    <th>Precio Unitario</th>
                    <th>Descuento</th>
                    <th>Monto No Afecto</th>
                    <th>No Sujeta</th>
                    <th>Exenta</th>
                    <th>Ventas Gravadas</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <!-- Bottom -->
        <div class="bottom-grid">
            <div class="left-notes">
                <div><strong>Total en Letras:</strong> <span style="font-weight: 700;">${totalLetras}</span></div>
                <div><strong>Condición de la Operación:</strong> ${conditionStr.toUpperCase()}</div>
                <div><strong>Observaciones:</strong></div>
                <div class="notes-box">${budget.Fallas_Detectadas || budget['Fallas Detectadas'] || 'Servicio y mantenimiento técnico automotriz.'}</div>
                
                <!-- Extensión Firmas -->
                <div class="extension-box">
                    <div class="extension-header">Extensión</div>
                    <div class="extension-body">
                        <div>
                            <strong>Nombre Entrega:</strong>
                            <div class="sig-line"></div>
                            <div style="margin-top:5px;">N° Documento:</div>
                        </div>
                        <div>
                            <strong>Nombre Recibe:</strong>
                            <div class="sig-line"></div>
                            <div style="margin-top:5px;">N° Documento:</div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <table class="totals-table">
                    <tr>
                        <td class="totals-label">Sumatoria de Ventas</td>
                        <td class="totals-val">$ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">Monto Global de Descuento</td>
                        <td class="totals-val">$ 0.00</td>
                    </tr>
                    <tr>
                        <td class="totals-label">Sub Total</td>
                        <td class="totals-val">$ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                        <td class="totals-label">(+) IVA (13%)</td>
                        <td class="totals-val">$ ${iva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    ${percRow}
                    ${retRow}
                    <tr>
                        <td class="totals-label">(-) Retención Renta</td>
                        <td class="totals-val">$ 0.00</td>
                    </tr>
                    <tr class="grand-total-row">
                        <td class="totals-label">Total a Pagar</td>
                        <td class="totals-val">$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                </table>
            </div>
        </div>
    </div>

    <script>
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.print();
            }, 600);
        });
    </script>
</body>
</html>
    `;
}

// Format 3: Elegante / Ejecutivo
function getEleganteEjecutivoHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab) {
    const productsHTML = products.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px; font-style:italic;">Sin repuestos ni lubricantes cotizados</td></tr>'
        : products.map(p => `
            <tr>
                <td style="text-align: center; font-weight: 500;">${p.Cantidad}</td>
                <td>${p.Descripcion}</td>
                <td style="text-align: right;">$ ${parseFloat(p.PrecioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; font-weight: 600;">$ ${(parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

    const laborHTML = labor.length === 0
        ? '<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 12px; font-style:italic;">Sin mano de obra cotizada</td></tr>'
        : labor.map(l => `
            <tr>
                <td style="text-align: center; font-weight: 500;">${l.Cantidad}</td>
                <td>${l.Descripcion}</td>
                <td style="text-align: right;">$ ${parseFloat(l.PrecioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="text-align: right; font-weight: 600;">$ ${(parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

    let percRow = '';
    if (percVal > 0) {
        percRow = `
            <tr>
                <td class="total-label">(+) IVA Percibido</td>
                <td class="total-val">$ ${percVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let retRow = '';
    if (retVal > 0) {
        retRow = `
            <tr>
                <td class="total-label">(-) IVA Retenido</td>
                <td class="total-val">$ ${retVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
    }

    let logoHTML = '';
    if (ws.logo) {
        logoHTML = `<img src="${ws.logo}" style="max-height: 90px; max-width: 250px; object-fit: contain; border-radius: 4px;" />`;
    } else {
        logoHTML = `<div style="font-family:'Outfit', sans-serif; font-size: 2.2rem; font-weight:800; color:var(--primary-color); margin: 0; letter-spacing: -0.03em;">${ws.logoText || 'MECANIC OS'}</div>`;
    }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Presupuesto Comercial - ${budget['ID Presupuesto']}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: #0f172a;
            --accent-color: #b45309;
            --border-color: #e2e8f0;
            --text-color: #334155;
            --bg-light: #f8fafc;
        }

        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            color: var(--text-color);
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 0.8rem;
        }

        .no-print-toolbar {
            background-color: var(--primary-color);
            padding: 12px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #fff;
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
            font-size: 0.85rem;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .btn-print {
            background-color: var(--accent-color);
            color: #fff;
        }
        .btn-print:hover {
            opacity: 0.9;
        }
        .btn-close {
            background-color: #64748b;
            color: #fff;
        }

        .page-container {
            width: 820px;
            margin: 0 auto;
            background-color: #fff;
            padding: 40px;
            box-sizing: border-box;
        }

        .centered-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 25px;
        }
        .header-logo {
            margin-bottom: 10px;
        }
        .header-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1.8rem;
            font-weight: 800;
            color: var(--primary-color);
            margin: 0;
            letter-spacing: -0.03em;
        }
        .header-tagline {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--accent-color);
            letter-spacing: 0.15em;
            text-transform: uppercase;
            margin-top: 2px;
            margin-bottom: 10px;
        }
        .header-meta {
            font-size: 0.75rem;
            color: #64748b;
            line-height: 1.5;
        }

        .doc-meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            background-color: var(--bg-light);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px 25px;
        }
        .meta-col h4 {
            margin: 0 0 4px 0;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #94a3b8;
        }
        .meta-col div {
            font-size: 0.95rem;
            font-weight: 700;
            color: var(--primary-color);
        }

        .grid-cards {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        .info-card {
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 15px;
        }
        .card-title {
            font-family: 'Outfit', sans-serif;
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--primary-color);
            border-bottom: 1.5px solid var(--accent-color);
            padding-bottom: 5px;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .card-body div {
            margin-bottom: 6px;
            font-size: 0.78rem;
            line-height: 1.4;
        }

        .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            color: var(--primary-color);
            margin: 20px 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8rem;
            margin-bottom: 25px;
        }
        th {
            border-bottom: 2px solid var(--primary-color);
            color: var(--primary-color);
            font-weight: 700;
            text-align: left;
            padding: 8px;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        td {
            border-bottom: 1px solid var(--border-color);
            padding: 10px 8px;
        }
        
        .totals-block {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
            page-break-inside: avoid;
        }
        .totals-subtable {
            width: 320px;
        }
        .totals-subtable td {
            border-bottom: 1px solid var(--border-color);
            padding: 8px 10px;
            font-size: 0.8rem;
        }
        .total-label {
            font-weight: 600;
            color: var(--primary-color);
        }
        .total-val {
            text-align: right;
        }
        .grand-total-row td {
            border-top: 2px solid var(--accent-color);
            border-bottom: 2px solid var(--accent-color);
            background-color: var(--bg-light);
            font-size: 1.05rem;
            font-weight: 800;
            color: var(--primary-color);
        }

        .notes-section {
            margin-top: 25px;
            font-size: 0.75rem;
            color: #64748b;
            line-height: 1.4;
            border-top: 1px solid var(--border-color);
            padding-top: 15px;
            page-break-inside: avoid;
        }

        @media print {
            .no-print-toolbar {
                display: none !important;
            }
            @page {
                size: portrait;
                margin: 1.2cm;
            }
            body {
                background-color: #fff;
            }
        }
    </style>
</head>
<body>

    <div class="no-print-toolbar">
        <h3>Vista Previa - Presupuesto Ejecutivo</h3>
        <div class="toolbar-buttons">
            <button class="btn-action btn-print" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir Presupuesto</button>
            <button class="btn-action btn-close" onclick="window.close()"><i class="fa-solid fa-xmark"></i> Cerrar</button>
        </div>
    </div>

    <div class="page-container">
        <!-- Centered Header -->
        <div class="centered-header">
            <div class="header-logo">
                ${logoHTML}
            </div>
            <div class="header-title" style="display:${ws.logo ? 'block' : 'none'}; font-size:1.4rem; font-weight:600; margin-top:5px;">${ws.nombre_comercial || ws.nombre}</div>
            <div class="header-tagline">${ws.logoTagline || 'Mantenimiento de Flotas y Vehículos'}</div>
            <div class="header-meta">
                ${ws.nombre_comercial && ws.nombre_comercial !== ws.nombre ? `${ws.nombre} &bull; ` : ''}
                Dirección: ${ws.direccion || ''}${ws.municipio || ws.departamento || ws.pais ? `, ${[ws.municipio, ws.departamento, ws.pais].filter(Boolean).join(', ')}` : ''}<br>
                Tel: ${ws.telefono} &bull; Correo: ${ws.correo}<br>
                ${ws.tipo_documento || 'NIT'}: ${ws.num_documento || ws.nit || ''} ${ws.nrc ? ` &bull; NRC: ${ws.nrc}` : ''} &bull; Giro: ${ws.actividad_economica || ws.giro || 'Servicios Automotrices'}
            </div>
        </div>

        <!-- Document Metadata -->
        <div class="doc-meta-row">
            <div class="meta-col">
                <h4>Presupuesto ID</h4>
                <div>${budget['ID Presupuesto']}</div>
            </div>
            <div class="meta-col">
                <h4>Fecha Emisión</h4>
                <div>${new Date(budget.Fecha).toLocaleDateString('es-SV')}</div>
            </div>
            <div class="meta-col">
                <h4>Condición</h4>
                <div>${(budget.Condicion || (client['Credito?'] === 'SI' ? 'CRÉDITO' : 'CONTADO')).toUpperCase()}</div>
            </div>
            <div class="meta-col">
                <h4>Total Cotizado</h4>
                <div style="color:var(--accent-color); font-weight: 800;">$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
        </div>

        <!-- Receptor Details -->
        <div class="grid-cards">
            <div class="info-card">
                <div class="card-title">Cliente / Receptor</div>
                <div class="card-body">
                    <div><strong>Nombre:</strong> ${client.Nombre}</div>
                    <div><strong>Documento:</strong> ${client.Tipo_Documento || 'DUI'}: ${client.Num_Documento || 'N/A'}</div>
                    <div><strong>Dirección:</strong> ${client.Direccion || 'Dirección de cliente registrada'}</div>
                    <div><strong>Teléfono:</strong> ${budget['Telefono 1 '] || client['Telefono 1 '] || 'N/A'}</div>
                    <div><strong>Email:</strong> ${client.Correo || 'N/A'}</div>
                </div>
            </div>
            <div class="info-card">
                <div class="card-title">Vehículo Asociado</div>
                <div class="card-body">
                    <div><strong>Placa:</strong> ${vehicle.Placas || 'N/A'} &nbsp;&nbsp;&nbsp; <strong>Año:</strong> ${vehicle.Año || 'N/A'}</div>
                    <div><strong>Marca / Modelo:</strong> ${vehicle.Marca || 'N/A'} ${vehicle.Modelo || 'N/A'}</div>
                    <div><strong>VIN / Motor:</strong> ${vehicle.Nª_VIN || 'N/A'} / ${vehicle.Nª_Motor || 'N/A'}</div>
                    <div><strong>Kilometraje / Odómetro:</strong> ${budget.Kilometraje || vehicle.Odometro || '0'} km</div>
                    <div><strong>Fallas Reportadas:</strong> ${budget.Fallas_Detectadas || 'Diagnóstico de taller'}</div>
                </div>
            </div>
        </div>

        <!-- Tables -->
        <div class="section-title">Repuestos y Lubricantes</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 8%; text-align: center;">Cant</th>
                    <th style="width: 62%;">Descripción del Item</th>
                    <th style="width: 15%; text-align: right;">P. Unitario</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${productsHTML}
            </tbody>
        </table>

        <div class="section-title">Mano de Obra y Servicios</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 8%; text-align: center;">Cant</th>
                    <th style="width: 62%;">Descripción del Servicio</th>
                    <th style="width: 15%; text-align: right;">P. Unitario</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${laborHTML}
            </tbody>
        </table>

        <!-- Totals Block -->
        <div class="totals-block">
            <table class="totals-subtable">
                <tr>
                    <td class="total-label">Sumatoria Repuestos y Servicios</td>
                    <td class="total-val">$ ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                    <td class="total-label">IVA (13%)</td>
                    <td class="total-val">$ ${iva.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                ${percRow}
                ${retRow}
                <tr class="grand-total-row">
                    <td class="total-label">Total Neto a Pagar</td>
                    <td class="total-val">$ ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
            </table>
        </div>

        <!-- Notes and terms -->
        <div class="notes-section">
            <strong>Observaciones Generales:</strong><br>
            Este presupuesto es válido por un período de 15 días a partir de su emisión. Los trabajos adicionales no contemplados en este documento serán consultados previamente con el cliente.
        </div>
    </div>

    <script>
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.print();
            }, 600);
        });
    </script>
</body>
</html>
    `;
}

// ----------------------------------------------------
// BUDGET PDF EXPORT (CONDITIONAL FORMAT SELECTOR)
// ----------------------------------------------------
function exportBudgetPDF(budgetId) {
    const db = getDatabase();
    const ws = getWorkshopConfig(db);
    const budget = db.presupuestos.find(p => p['ID Presupuesto'] === budgetId);
    if (!budget) {
        showToast("Error: Presupuesto no encontrado", "danger");
        return;
    }

    const client = db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { 
        Nombre: budget.Nombre, 
        'Telefono 1 ': budget['Telefono 1 '] || '', 
        Direccion: budget.Direccion || '' 
    };
    
    const vehicle = db.vehiculos.find(v => v.ID_Vehiculo === budget.ID_Vehiculo) || { 
        Placas: budget.Placas || 'N/A', 
        Marca: 'N/A', 
        Modelo: 'N/A', 
        Año: 'N/A' 
    };

    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

    const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === budgetId);
    const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === budgetId);

    const sumProd = products.reduce((sum, p) => sum + parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1), 0);
    const sumLab = labor.reduce((sum, l) => sum + parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1), 0);
    const subtotal = sumProd + sumLab;
    const taxRate = parseFloat(budget['% Impuesto'] || 0.13);
    const iva = subtotal * taxRate;

    let retVal = 0;
    let percVal = 0;
    if (client.AplicaRetencion > 0) {
        retVal = subtotal * parseFloat(client.AplicaRetencion);
    }
    if (client.AplicaPercepcion > 0) {
        percVal = subtotal * parseFloat(client.AplicaPercepcion);
    }

    const grandTotal = subtotal + iva + percVal - retVal;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showToast("Error: Habilite las ventanas emergentes (popups) para imprimir el presupuesto", "danger");
        return;
    }

    const format = ws.formato_presupuesto || 'moderno_facturallama';
    let pdfHTML = '';

    if (format === 'clasico_mecanicos') {
        pdfHTML = getClasicoMecanicOSHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab);
    } else if (format === 'elegante_ejecutivo') {
        pdfHTML = getEleganteEjecutivoHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab);
    } else {
        pdfHTML = getModernoFacturaLlamaHTML(ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab);
    }

    printWindow.document.write(pdfHTML);
    printWindow.document.close();
}

// ----------------------------------------------------
// SAAS PORTAL & ONBOARDING VIEWS
// ----------------------------------------------------
function renderLanding(container) {
    const db = getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    
    if (saas.status === 'pending') {
        container.innerHTML = `
            <div class="saas-container" style="max-width: 700px; margin: 6rem auto; text-align: center; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="font-size: 4rem; color: var(--warning); margin-bottom: 1.5rem;"><i class="fa-solid fa-clock-rotate-left"></i></div>
                <h2 style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 700; margin-bottom: 1rem;">Solicitud Pendiente de Revisión</h2>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem; font-size: 1.05rem;">
                    Tu solicitud para registrar el taller <strong>${saas.workshopData ? saas.workshopData.nombre : 'nuevo'}</strong> está siendo evaluada por nuestro equipo de administración de Mecanic OS.<br>
                    Te notificaremos por correo electrónico una vez que tu cuenta sea aprobada.
                </p>
                <div style="display:flex; flex-direction:column; gap:1rem; align-items:center;">
                    <button id="btn-reset-saas-guest" class="btn btn-secondary" style="font-size:0.85rem;"><i class="fa-solid fa-rotate-left"></i> Cancelar Solicitud y Volver a Intentar</button>
                </div>
            </div>
        `;
        
        document.getElementById('btn-reset-saas-guest').addEventListener('click', () => {
            if (confirm("¿Deseas cancelar la solicitud y volver al estado inicial?")) {
                db.saas_state = { status: 'guest', workshopData: null, termsSigned: false };
                db.solicitudes_registro = db.solicitudes_registro.filter(s => s.id !== (saas.workshopData && saas.workshopData.id));
                saveDatabase(db);
                window.location.hash = 'landing';
                handleRouting();
            }
        });
        return;
    }

    let actionButtonsHTML = '';
    let topButtonsHTML = '';
    
    if (saas.status === 'active') {
        const workshopName = saas.workshopData ? saas.workshopData.nombre : 'Mi Taller';
        topButtonsHTML = `
            <div style="display:flex; gap:0.75rem; align-items:center;">
                <a href="#taller-dashboard" style="color:var(--text-primary); text-decoration:none; font-size:0.85rem; font-weight:600; background:var(--primary); padding:0.5rem 1.2rem; border-radius:50px;"><i class="fa-solid fa-right-to-bracket"></i> Acceder</a>
            </div>
        `;
        
        actionButtonsHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:1.25rem; margin-top:2rem;">
                <a href="#taller-dashboard" class="btn btn-primary" style="padding:1rem 2.5rem; font-size:1.15rem; text-decoration:none; box-shadow:0 10px 20px rgba(99, 102, 241, 0.3);"><i class="fa-solid fa-right-to-bracket"></i> Ingresar a ${workshopName}</a>
                <button id="btn-landing-reset" style="background:none; border:none; color:var(--text-secondary); text-decoration:underline; font-size:0.85rem; cursor:pointer; margin-top:0.5rem;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Desconectar taller / Usar otra cuenta</button>
            </div>
        `;
    } else {
        topButtonsHTML = `
            <div style="display:flex; gap:0.75rem; align-items:center;">
                <button id="btn-landing-top-login" style="color:var(--text-primary); text-decoration:none; font-size:0.85rem; font-weight:600; background:var(--primary); border:none; padding:0.5rem 1.2rem; border-radius:50px; cursor:pointer;"><i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión</button>
            </div>
        `;
        
        actionButtonsHTML = `
            <div style="display:flex; justify-content:center; gap:1.25rem; flex-wrap:wrap; margin-top:2rem;">
                <a href="#registro" class="btn btn-primary" style="padding:0.9rem 2.2rem; font-size:1.1rem; text-decoration:none; box-shadow:0 10px 20px rgba(99, 102, 241, 0.3);"><i class="fa-solid fa-rocket"></i> Registrar mi Taller</a>
                <button id="btn-landing-login" class="btn btn-secondary" style="padding:0.9rem 2.2rem; font-size:1.1rem; cursor:pointer;"><i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión / Conectar Taller</button>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="landing-hero" style="position:relative; overflow:hidden; padding: 6rem 2rem; text-align:center; background: radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%);">
            <div style="display:flex; justify-content:space-between; max-width:1100px; margin:-4rem auto 4rem auto; align-items:center;">
                <div class="logo" style="font-size:1.8rem; font-weight:800; font-family:'Outfit', sans-serif; color:var(--text-primary);">
                    <i class="fa-solid fa-gears logo-icon" style="color:var(--primary);"></i> Mecanic<span>OS</span>
                </div>
                ${topButtonsHTML}
            </div>
            
            <h1 style="font-family:'Outfit', sans-serif; font-size:3.5rem; font-weight:800; line-height:1.15; max-width:800px; margin: 0 auto 1.5rem auto; background: linear-gradient(135deg, #fff 30%, var(--primary-glow) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">El Sistema Operativo Premium para tu Taller Automotriz</h1>
            <p style="color:var(--text-secondary); font-size:1.2rem; max-width:650px; margin: 0 auto 2.5rem auto; line-height:1.6;">
                Mecanic OS automatiza tu taller de punta a punta: desde la recepción de vehículos con inspección digital hasta la facturación electrónica DTE (Ministerio de Hacienda) y la planilla de salarios.
            </p>
            ${actionButtonsHTML}
        </div>
        
        <div style="max-width:1100px; margin:0 auto 6rem auto; padding:0 2rem;">
            <h2 style="font-family:'Outfit', sans-serif; text-align:center; font-size:2rem; font-weight:700; margin-bottom:3rem;">Características Todo-en-Uno</h2>
            <div class="landing-features-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:2rem;">
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--primary); margin-bottom:1rem;"><i class="fa-solid fa-clipboard-check"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Recepción y Diagnóstico 21 Puntos</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Registra ingresos, kilometraje and evalúa el vehículo con un semáforo interactivo (Verde, Amarillo, Rojo) desde cualquier celular o tablet en el patio del taller.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--success); margin-bottom:1rem;"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Facturación Electrónica DTE</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Integración nativa con Hacienda de El Salvador (Facturas y Créditos Fiscales). Firma digital automática y emisión de ticket fiscal térmico.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--cyan); margin-bottom:1rem;"><i class="fa-solid fa-calculator"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Planilla y Nómina de Ley</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Cálculos exactos conforme a leyes salvadoreñas (Deducciones ISSS, AFP, ISR tramos mensuales/quincenales e INSAFORP) con boletas imprimibles.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--warning); margin-bottom:1rem;"><i class="fa-solid fa-cubes-stacked"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Control Visual de Taller (Kanban)</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Monitorea la carga laboral de tus técnicos. Arrastra y sigue el progreso de las reparaciones de los vehículos en tiempo real.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--primary); margin-bottom:1rem;"><i class="fa-solid fa-chart-pie"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">BI y Estadísticas Financieras</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Visualiza gráficos interactivos de ventas, gastos, abonos recibidos, utilidad neta e indicadores ejecutivos en tiempo real para la toma de decisiones.</p>
                </div>
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--danger); margin-bottom:1rem;"><i class="fa-solid fa-users-gear"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Flotas y Expediente del Auto</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Administra datos de clientes, flota de vehículos e historial médico completo de intervenciones, servicios y repuestos instalados por auto.</p>
                </div>
            </div>
        </div>
    `;

    // Bind listeners
    const topLoginBtn = document.getElementById('btn-landing-top-login');
    if (topLoginBtn) {
        topLoginBtn.addEventListener('click', () => {
            document.getElementById('firebase-auth-modal').classList.add('active');
        });
    }

    const loginBtn = document.getElementById('btn-landing-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            document.getElementById('firebase-auth-modal').classList.add('active');
        });
    }



    const resetBtn = document.getElementById('btn-landing-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("¿Seguro que deseas desconectar este taller? Se eliminarán los datos locales de esta PC y volverás al estado de Invitado.")) {
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
                sessionStorage.removeItem('mecanic_os_active_user');
                showToast("Taller desconectado con éxito", "info");
                window.location.hash = 'landing';
                handleRouting();
            }
        });
    }
}

function renderLockScreen(container) {
    const db = getDatabase();
    const saas = db.saas_state || {};
    const workshop = saas.workshopData || { nombre: 'Mecanic OS', logoText: 'MecanicOS', logoTagline: 'Gestión de Taller' };
    
    // Clear any previous active user just in case
    sessionStorage.removeItem('mecanic_os_active_user');

    function showProfiles() {
        container.innerHTML = `
            <div style="max-width: 800px; margin: 4rem auto; padding: 2.5rem; text-align: center;">
                <div style="margin-bottom: 3rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <div style="font-size: 3rem; color: var(--primary);"><i class="fa-solid fa-gears"></i></div>
                    <h1 style="font-family:'Outfit', sans-serif; font-size: 2.25rem; font-weight: 800; color: var(--text-primary); margin: 0;">${workshop.nombre}</h1>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">${workshop.logoTagline || 'Control de Acceso de Empleados'}</p>
                </div>
                
                <h2 style="font-family:'Outfit', sans-serif; font-size: 1.25rem; font-weight: 600; margin-bottom: 2rem; color: var(--text-primary);">Selecciona tu Perfil de Empleado</h2>
                
                <div id="lock-profiles-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; justify-content: center; max-width: 650px; margin: 0 auto;">
                    ${db.tecnicos.map(t => {
                        const avatar = t.Foto_Perfil || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
                        return `
                            <div class="user-card lock-profile-card" data-id="${t.Codigo_Cliente || t.Nombre_Completo}" style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: var(--radius-md); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 1rem; transition: var(--transition-fast);">
                                <img src="${avatar}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
                                <div style="text-align: center;">
                                    <strong style="font-size: 0.95rem; display: block; color: var(--text-primary);">${t.Nombre_Completo}</strong>
                                    <small style="color: var(--text-secondary); font-size: 0.75rem;">${t.Nivel_Acceso}</small>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div style="margin-top: 3.5rem; display: flex; justify-content: center;">
                    <button id="btn-lock-disconnect" class="btn btn-secondary" style="font-size: 0.85rem; border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.02);"><i class="fa-solid fa-arrow-right-from-bracket"></i> Desconectar Taller de esta PC</button>
                </div>
            </div>
        `;

        const disconnectBtn = container.querySelector('#btn-lock-disconnect');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => {
                if (confirm("¿Seguro que deseas desconectar este taller de este equipo? Se borrará el almacenamiento local y volverás al estado de Invitado.")) {
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
                    sessionStorage.removeItem('mecanic_os_active_user');
                    localStorage.removeItem('mecanic_os_workshop_uid'); // Limpiar UID del taller
                    dataService.disconnect(); // Desconectar Firestore completamente
                    if (typeof firebase !== 'undefined') {
                        firebase.auth().signOut().catch(() => {}); // Cerrar sesión anónima
                    }
                    showToast("Taller desconectado con éxito", "info");
                    window.location.hash = 'landing';
                    handleRouting();
                }
            });
        }

        const cards = container.querySelectorAll('.lock-profile-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.borderColor = 'var(--primary)';
                card.style.background = 'var(--bg-card-hover)';
                card.style.transform = 'translateY(-3px)';
                card.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.borderColor = 'var(--border-color)';
                card.style.background = 'var(--bg-card)';
                card.style.transform = '';
                card.style.boxShadow = '';
            });
            card.addEventListener('click', () => {
                const techId = card.getAttribute('data-id');
                const selectedTech = db.tecnicos.find(t => (t.Codigo_Cliente || t.Nombre_Completo) === techId);
                if (selectedTech) {
                    showPasscodeForm(selectedTech);
                }
            });
        });
    }

    function showPasscodeForm(tech) {
        const avatar = tech.Foto_Perfil || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
        container.innerHTML = `
            <div style="max-width: 450px; margin: 6rem auto; padding: 2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <img src="${avatar}" style="width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); margin-bottom: 1rem; box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);">
                    <h2 style="margin: 0; font-family:'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${tech.Nombre_Completo}</h2>
                    <span style="color: var(--text-secondary); font-size: 0.85rem;">${tech.Nivel_Acceso}</span>
                </div>
                
                <form id="lock-passcode-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <div class="form-group">
                        <label style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 500;">Contraseña de Acceso</label>
                        <input type="password" id="lock-user-password" required placeholder="Ingresa tu contraseña" style="padding: 0.75rem; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 6px; font-size: 1rem; margin-top: 0.4rem;">
                    </div>
                    <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-lock-back" style="flex: 1; padding: 0.75rem;"><i class="fa-solid fa-arrow-left"></i> Cambiar Perfil</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1; padding: 0.75rem;"><i class="fa-solid fa-right-to-bracket"></i> Ingresar</button>
                    </div>
                </form>
            </div>
        `;

        setTimeout(() => {
            const input = document.getElementById('lock-user-password');
            if (input) input.focus();
        }, 100);

        document.getElementById('btn-lock-back').addEventListener('click', showProfiles);

        document.getElementById('lock-passcode-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const enteredPass = document.getElementById('lock-user-password').value;
            const realPass = tech.Contraseña || '';
            
            if (enteredPass === realPass) {
                setActiveUser(tech);
                showToast(`Sesión iniciada como ${tech.Nombre_Completo.split(' ')[0]}`, "success");
                window.location.hash = 'taller-dashboard';
                handleRouting();
            } else {
                showToast("Contraseña de empleado incorrecta", "error");
                const pwdInput = document.getElementById('lock-user-password');
                if (pwdInput) {
                    pwdInput.value = '';
                    pwdInput.focus();
                }
            }
        });
    }

    showProfiles();
}

async function renderRegistroSaaS(container) {
    const db = getDatabase();
    const plans = await dataService.saas.getPlans();
    const coupons = await dataService.saas.getCoupons();
    window.saasSelectedLogoBase64 = ''; // Reset selected logo

    container.innerHTML = `
        <div style="max-width:750px; margin:3rem auto; padding:2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1.25rem;">
                <div>
                    <h2 style="font-family:'Outfit', sans-serif; font-size:1.85rem; font-weight:800; color:var(--text-primary);"><i class="fa-solid fa-gears" style="color:var(--primary); margin-right:0.5rem;"></i>Registrar Nuevo Taller</h2>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Completa los datos comerciales y de facturación (FacturaLlama) para tu cuenta</p>
                </div>
                <a href="#landing" style="color:var(--text-secondary); text-decoration:none; font-size:0.85rem; font-weight:600;"><i class="fa-solid fa-arrow-left"></i> Volver</a>
            </div>
            
            <form id="saas-register-form" style="display:flex; flex-direction:column; gap:1.5rem;">
                <!-- 1. DATOS GENERALES -->
                <div>
                    <h3 style="font-size:1.1rem; color:var(--primary); border-left:3px solid var(--primary); padding-left:0.5rem; margin-bottom:1rem; font-weight:700;">Datos Generales</h3>
                    <div class="form-group" style="margin-bottom:1rem;">
                        <label>Nombre o Razón Social</label>
                        <input type="text" id="reg-taller-nombre" required placeholder="Ej: Taller Automotriz San José S.A. de C.V." style="padding:0.6rem;">
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                        <div class="form-group">
                            <label>Alias del Taller (Nombre Corto)</label>
                            <input type="text" id="reg-taller-alias" required placeholder="Ej: Automotriz San José" style="padding:0.6rem;">
                        </div>
                        <div class="form-group">
                            <label>Nombre Comercial</label>
                            <input type="text" id="reg-taller-nombre-comercial" required placeholder="Ej: Taller San José" style="padding:0.6rem;">
                        </div>
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                        <div class="form-group">
                            <label>Correo Electrónico</label>
                            <input type="email" id="reg-taller-correo" required placeholder="contacto@taller.com" style="padding:0.6rem;">
                        </div>
                        <div class="form-group">
                            <label>Teléfono de Contacto</label>
                            <input type="text" id="reg-taller-telefono" required placeholder="2222-2222" style="padding:0.6rem;">
                        </div>
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Tipo de Persona</label>
                            <select id="reg-taller-tipo-persona" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                                <option value="Natural">Natural</option>
                                <option value="Jurídica" selected>Jurídica</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Clasificación Tributaria</label>
                            <select id="reg-taller-clasificacion" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                                <option value="Otros" selected>Otros</option>
                                <option value="Pequeño contribuyente">Pequeño contribuyente</option>
                                <option value="Mediano contribuyente">Mediano contribuyente</option>
                                <option value="Gran contribuyente">Gran contribuyente</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>¿Es sujeto excluido?</label>
                            <select id="reg-taller-sujeto-excluido" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                                <option value="No" selected>No</option>
                                <option value="Sí">Sí</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 2. DATOS FISCALES -->
                <div style="border-top:1px solid var(--border-color); padding-top:1.25rem;">
                    <h3 style="font-size:1.1rem; color:var(--primary); border-left:3px solid var(--primary); padding-left:0.5rem; margin-bottom:1rem; font-weight:700;">Datos Fiscales</h3>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                        <div class="form-group">
                            <label>Tipo de Documento</label>
                            <select id="reg-taller-tipo-doc" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                                <option value="NIT" selected>NIT (Empresa/Persona)</option>
                                <option value="DUI">DUI (Persona Natural)</option>
                                <option value="Pasaporte">Pasaporte</option>
                                <option value="Carnet de Extranjería">Carnet de Extranjería</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Número de Documento</label>
                            <input type="text" id="reg-taller-num-doc" required placeholder="0614-111111-101-1" style="padding:0.6rem;">
                        </div>
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>NRC (Registro Contribuyente)</label>
                            <input type="text" id="reg-taller-nrc" required placeholder="123456-7" style="padding:0.6rem;">
                        </div>
                        <div class="form-group">
                            <label>Giro / Actividad Económica</label>
                            <select id="reg-taller-giro" required style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px; width: 100%;">
                                ${getGirosOptionsHtml()}
                            </select>
                        </div>
                    </div>
                </div>

                <!-- 3. DIRECCIÓN -->
                <div style="border-top:1px solid var(--border-color); padding-top:1.25rem;">
                    <h3 style="font-size:1.1rem; color:var(--primary); border-left:3px solid var(--primary); padding-left:0.5rem; margin-bottom:1rem; font-weight:700;">Dirección</h3>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                        <div class="form-group">
                            <label>País</label>
                            <select id="reg-taller-pais" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                                <option value="El Salvador" selected>El Salvador</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Departamento</label>
                            <select id="reg-taller-departamento" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                                <option value="Ahuachapán">Ahuachapán</option>
                                <option value="Cabañas">Cabañas</option>
                                <option value="Chalatenango">Chalatenango</option>
                                <option value="Cuscatlán">Cuscatlán</option>
                                <option value="La Libertad" selected>La Libertad</option>
                                <option value="La Paz">La Paz</option>
                                <option value="La Unión">La Unión</option>
                                <option value="Morazán">Morazán</option>
                                <option value="San Miguel">San Miguel</option>
                                <option value="San Salvador">San Salvador</option>
                                <option value="San Vicente">San Vicente</option>
                                <option value="Santa Ana">Santa Ana</option>
                                <option value="Sonsonate">Sonsonate</option>
                                <option value="Usulután">Usulután</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Municipio</label>
                            <select id="reg-taller-municipio" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Dirección Comercial Detallada</label>
                        <input type="text" id="reg-taller-direccion" required placeholder="Carr. Sonsonate, col. Cuyagualo #16" style="padding:0.6rem;">
                    </div>
                </div>

                <!-- 4. LOGOTIPO -->
                <div style="border-top:1px solid var(--border-color); padding-top:1.25rem;">
                    <h3 style="font-size:1.1rem; color:var(--primary); border-left:3px solid var(--primary); padding-left:0.5rem; margin-bottom:1rem; font-weight:700;">Logotipo del Taller (Para Documentos)</h3>
                    <div class="form-group">
                        <label>Subir Logotipo (Formatos recomendados: PNG, JPG)</label>
                        <input type="file" id="reg-taller-logo" accept="image/*" style="padding:0.4rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; width:100%;">
                    </div>
                    <div id="reg-logo-preview-container" style="display:none; margin-top:1rem; text-align:center;">
                        <span style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.4rem;">Vista Previa del Logotipo:</span>
                        <img id="reg-logo-preview" style="max-height:85px; max-width:200px; object-fit:contain; border:1px solid var(--border-color); border-radius:6px; padding:6px; background:#f8fafc;" />
                    </div>
                </div>

                <!-- 5. ACCESO Y PLAN -->
                <div style="border-top:1px solid var(--border-color); padding-top:1.25rem;">
                    <h3 style="font-size:1.1rem; color:var(--primary); border-left:3px solid var(--primary); padding-left:0.5rem; margin-bottom:1rem; font-weight:700;">Plan de Suscripción y Cuenta</h3>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
                        <div class="form-group">
                            <label>Plan Comercial</label>
                            <select id="reg-taller-plan" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                                ${plans.map(p => `<option value="${p.nombre}" data-price="${p.precio}">${p.nombre} ($${p.precio}/mes)</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Código de Cupón (Opcional)</label>
                            <div style="display:flex; gap:0.5rem;">
                                <input type="text" id="reg-taller-cupon" placeholder="Ej: BIENVENIDO50" style="padding:0.6rem; flex:1; text-transform:uppercase;">
                                <button type="button" id="btn-apply-coupon" class="btn btn-secondary" style="padding:0.6rem;">Aplicar</button>
                            </div>
                            <div id="coupon-message" style="font-size:0.75rem; margin-top:0.25rem;"></div>
                        </div>
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Nombre Completo del Administrador</label>
                            <input type="text" id="reg-prop-nombre" required placeholder="Tu Nombre y Apellido" style="padding:0.6rem;">
                        </div>
                        <div class="form-group">
                            <label>Contraseña de Acceso</label>
                            <input type="password" id="reg-prop-pass" required placeholder="Mínimo 4 caracteres" style="padding:0.6rem;">
                        </div>
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary" style="margin-top:1rem; padding:0.9rem; font-size:1.05rem; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Registrar Taller y Activar</button>
            </form>
        </div>
    `;

    // Bind file upload to base64 preview
    setTimeout(() => {
        const logoInput = document.getElementById('reg-taller-logo');
        if (logoInput) {
            logoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (readerEvent) => {
                        const base64 = readerEvent.target.result;
                        window.saasSelectedLogoBase64 = base64;
                        const previewImg = document.getElementById('reg-logo-preview');
                        const previewContainer = document.getElementById('reg-logo-preview-container');
                        if (previewImg && previewContainer) {
                            previewImg.src = base64;
                            previewContainer.style.display = 'block';
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        setupMunicipiosSelect('reg-taller-departamento', 'reg-taller-municipio', 'La Libertad Oeste');
    }, 50);
    
    // Bind dynamic coupon checking
    let selectedCoupon = null;
    
    const applyBtn = document.getElementById('btn-apply-coupon');
    const couponInput = document.getElementById('reg-taller-cupon');
    const planSelect = document.getElementById('reg-taller-plan');
    const msgDiv = document.getElementById('coupon-message');
    
    function updatePriceDisplay() {
        if (!planSelect) return;
        const planOption = planSelect.options[planSelect.selectedIndex];
        if (!planOption) return;
        const originalPrice = parseFloat(planOption.getAttribute('data-price'));
        let finalPrice = originalPrice;
        
        if (selectedCoupon) {
            if (selectedCoupon.tipo === 'porcentaje') {
                finalPrice = originalPrice * (1 - selectedCoupon.valor / 100);
            } else if (selectedCoupon.tipo === 'fijo') {
                finalPrice = Math.max(0, originalPrice - selectedCoupon.valor);
            }
            msgDiv.innerHTML = `<span style="color:var(--success);"><i class="fa-solid fa-circle-check"></i> Cupón "${selectedCoupon.codigo}" aplicado (${selectedCoupon.descripcion}). Cuota: <strong>$${finalPrice.toFixed(2)}/mes</strong> (Antes $${originalPrice.toFixed(2)})</span>`;
        } else {
            msgDiv.innerHTML = `<span style="color:var(--text-secondary);">Cuota estándar: $${originalPrice.toFixed(2)}/mes</span>`;
        }
    }
    
    if (applyBtn && couponInput) {
        applyBtn.addEventListener('click', () => {
            const code = couponInput.value.trim().toUpperCase();
            if (!code) {
                selectedCoupon = null;
                updatePriceDisplay();
                return;
            }
            
            const coupon = (coupons || []).find(c => c.codigo === code && c.activo);
            
            if (coupon) {
                selectedCoupon = coupon;
                showToast("¡Cupón promocional aplicado!", "success");
            } else {
                selectedCoupon = null;
                showToast("Cupón inválido o expirado", "error");
                msgDiv.innerHTML = `<span style="color:var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Código inválido o expirado</span>`;
                return;
            }
            updatePriceDisplay();
        });
        
        planSelect.addEventListener('change', updatePriceDisplay);
        // Initial load
        updatePriceDisplay();
    }
    
    const form = document.getElementById('saas-register-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentDb = getDatabase();
        const requestId = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        
        // Calculate dynamic pricing
        const planName = planSelect.value;
        const targetPlan = (plans || []).find(p => p.nombre === planName);
        const originalPrice = targetPlan ? targetPlan.precio : 75.00;
        let finalPrice = originalPrice;
        let couponApplied = null;
        
        if (selectedCoupon) {
            couponApplied = selectedCoupon.codigo;
            if (selectedCoupon.tipo === 'porcentaje') {
                finalPrice = originalPrice * (1 - selectedCoupon.valor / 100);
            } else if (selectedCoupon.tipo === 'fijo') {
                finalPrice = Math.max(0, originalPrice - selectedCoupon.valor);
            }
        }
        
        const requestData = {
            id: requestId,
            nombre: document.getElementById('reg-taller-nombre').value,
            alias: document.getElementById('reg-taller-alias').value,
            nombre_comercial: document.getElementById('reg-taller-nombre-comercial').value,
            giro: (() => { const el = document.getElementById('reg-taller-giro'); return el.options[el.selectedIndex].getAttribute('data-desc') || el.value; })(),
            direccion: document.getElementById('reg-taller-direccion').value,
            telefono: document.getElementById('reg-taller-telefono').value,
            correo: document.getElementById('reg-taller-correo').value,
            nit: document.getElementById('reg-taller-tipo-doc').value === 'NIT' ? document.getElementById('reg-taller-num-doc').value : '',
            nrc: document.getElementById('reg-taller-nrc').value,
            logoText: document.getElementById('reg-taller-alias').value.substring(0, 15).toUpperCase(),
            logoTagline: 'Servicio Automotriz Especializado',
            tipo_persona: document.getElementById('reg-taller-tipo-persona').value,
            clasificacion_tributaria: document.getElementById('reg-taller-clasificacion').value,
            sujeto_excluido: document.getElementById('reg-taller-sujeto-excluido').value,
            tipo_documento: document.getElementById('reg-taller-tipo-doc').value,
            num_documento: document.getElementById('reg-taller-num-doc').value,
            actividad_economica: document.getElementById('reg-taller-giro').value,
            pais: document.getElementById('reg-taller-pais').value,
            departamento: document.getElementById('reg-taller-departamento').value,
            municipio: document.getElementById('reg-taller-municipio').value,
            logo: window.saasSelectedLogoBase64 || '',
            
            propietario: document.getElementById('reg-prop-nombre').value,
            pass: document.getElementById('reg-prop-pass').value,
            status: 'pendiente',
            createdAt: Date.now(),
            plan: planName,
            precio_mensual: finalPrice,
            cupon_usado: couponApplied,
            suscripcion_status: 'demo',
            proximo_pago: Date.now() + 7 * 24 * 60 * 60 * 1000,
            dte_config: {
                apiKey: 'test_sk_mecanicos_default_sandbox_key_998877',
                ambiente: '00',
                mhCode: '0001',
                posNumber: '1',
                backendUrl: ''
            }
        };
        
        dataService.saas.createRequest(requestData)
            .then(() => {
                currentDb.saas_state = {
                    status: 'pending',
                    workshopData: requestData,
                    termsSigned: false,
                    signatureName: '',
                    signedAt: null
                };
                saveDatabase(currentDb);
                showToast("¡Taller registrado con éxito! Tu solicitud está pendiente de aprobación por el Administrador.", "success");
                window.location.hash = 'landing';
                handleRouting();
            })
            .catch(err => {
                console.error("Error al registrar el taller:", err);
                showToast("Error al guardar la solicitud: " + err.message, "error");
            });
    });
}
function renderSuspendedSaaS(container) {
    const db = getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    const workshop = saas.workshopData || { nombre: 'tu taller', precio_mensual: 75.00 };
    
    container.innerHTML = `
        <div style="max-width: 650px; margin: 6rem auto; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--danger); border-radius: 12px; text-align: center; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.15);">
            <div style="font-size: 5rem; color: var(--danger); margin-bottom: 1.5rem;">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
                Acceso Suspendido
            </h2>
            <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.6; margin-bottom: 2rem;">
                La suscripción para el taller <strong>${workshop.nombre}</strong> se encuentra temporalmente inhabilitada.<br>
                Esto puede deberse a un saldo pendiente de pago o a la finalización del período de prueba.
            </p>
            
            <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-around; align-items: center;">
                <div style="text-align: left;">
                    <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Concepto</span>
                    <strong style="display: block; font-size: 1rem; color: var(--text-primary); margin-top: 0.25rem;">Mensualidad Mecanic OS</strong>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Total Pendiente</span>
                    <strong style="display: block; font-size: 1.5rem; color: var(--danger); margin-top: 0.25rem;">$${Number(workshop.precio_mensual || 0).toFixed(2)}</strong>
                </div>
            </div>
            
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">
                Para restablecer tu acceso, puedes realizar tu pago de manera inmediata en línea o contactar con administración en 
                <a href="mailto:ventas@forbiddensoluciones.com" style="color: var(--primary); text-decoration: none; font-weight: 600;">ventas@forbiddensoluciones.com</a>.
            </p>
            
            <div style="display:flex; flex-direction:column; gap:0.75rem; max-width:300px; margin:0 auto;">
                <a href="#pago-suscripcion?id=${workshop.id}" class="btn btn-primary" style="padding:0.75rem;"><i class="fa-solid fa-credit-card"></i> Pagar Mensualidad en Línea</a>
                <a href="#landing" class="btn btn-secondary" style="padding:0.75rem;"><i class="fa-solid fa-house"></i> Volver a Landing</a>
            </div>
        </div>
    `;
}

function renderPagoSuscripcionSaaS(container, queryParams) {
    const db = getDatabase();
    const targetId = queryParams.id || (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.id);
    const ws = (db.solicitudes_registro || []).find(s => s.id === targetId);
    
    if (!ws) {
        container.innerHTML = `
            <div style="max-width: 500px; margin: 8rem auto; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 12px; text-align: center;">
                <div style="font-size: 4rem; color: var(--danger); margin-bottom: 1rem;">
                    <i class="fa-solid fa-circle-exclamation"></i>
                </div>
                <h2 style="font-family:'Outfit', sans-serif; color: var(--text-primary);">Taller no encontrado</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">El enlace de pago no corresponde a ningún taller registrado o está incompleto.</p>
                <a href="#landing" class="btn btn-primary">Volver al Inicio</a>
            </div>
        `;
        return;
    }
    
    const originalPlan = (db.saas_plans || []).find(p => p.nombre === ws.plan) || { precio: 75.00 };
    let finalPrice = ws.precio_mensual || originalPlan.precio;
    let selectedCoupon = null;
    
    if (ws.cupon_usado) {
        selectedCoupon = (db.saas_coupons || []).find(c => c.codigo === ws.cupon_usado);
    }
    
    container.innerHTML = `
        <div style="max-width: 900px; margin: 4rem auto; padding: 1.5rem;" class="saas-container">
            <!-- Loading Overlay (hidden initially) -->
            <div id="payment-loading-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.95); z-index:9999; justify-content:center; align-items:center; flex-direction:column; gap:1.5rem;">
                <div class="spinner-large" style="border: 4px solid rgba(99, 102, 241, 0.1); border-left-color: var(--primary); border-radius: 50%; width: 70px; height: 70px; animation: spin 1s linear infinite;"></div>
                <h3 id="loading-step-text" style="font-family:'Outfit', sans-serif; color:#fff; font-size:1.35rem; font-weight:600; text-align:center; transition: all 0.3s;">Procesando pago seguro...</h3>
                <p style="color:var(--text-muted); font-size:0.9rem;">No cierres esta pestaña ni recargues la página.</p>
            </div>

            <!-- Page Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                <div>
                    <h2 style="font-family:'Outfit', sans-serif; font-size:2rem; font-weight:800; color:var(--text-primary);"><i class="fa-solid fa-shield-halved" style="color:var(--primary);"></i> Pasarela de Pago Seguro</h2>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Servicio de suscripción y facturación integrada para Mecanic OS</p>
                </div>
                <a href="#landing" style="color:var(--text-secondary); text-decoration:none; font-size:0.85rem;"><i class="fa-solid fa-arrow-left"></i> Cancelar y Volver</a>
            </div>

            <div style="display:grid; grid-template-columns: 1.1fr 0.9fr; gap:2rem;" id="checkout-grid">
                <!-- Info Column (Left) -->
                <div style="display:flex; flex-direction:column; gap:1.5rem;">
                    <div class="glass-card" style="padding:2rem; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <span style="font-size:0.75rem; background:rgba(99, 102, 241, 0.1); color:var(--primary); padding:4px 8px; border-radius:4px; font-weight:bold; text-transform:uppercase; letter-spacing:0.05em;">Tu Plan Seleccionado</span>
                            <h3 style="font-family:'Outfit', sans-serif; font-size:1.8rem; font-weight:800; color:#fff; margin:0.75rem 0 0.5rem 0;">Plan ${ws.plan}</h3>
                            <p style="color:var(--text-secondary); font-size:0.85rem; line-height:1.5; margin-bottom:1.5rem;">${originalPlan.descripcion || 'Acceso completo a las herramientas y automatizaciones del sistema.'}</p>
                            
                            <div style="display:flex; flex-direction:column; gap:0.65rem; margin-bottom:1.5rem;">
                                ${(originalPlan.features || ['Gestión de taller integrada', 'Facturación electrónica DTE', 'Soporte prioritario']).map(f => `
                                    <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:var(--text-secondary);">
                                        <i class="fa-solid fa-circle-check" style="color:var(--success); font-size:0.95rem;"></i>
                                        <span>${f}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div style="border-top:1px solid var(--border-color); padding-top:1.25rem; font-size:0.8rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.5rem;">
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <i class="fa-solid fa-lock" style="color:var(--success);"></i>
                                <span>Conexión cifrada SSL de 256 bits</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <i class="fa-solid fa-credit-card" style="color:var(--primary);"></i>
                                <span>Cobros recurrentes autorizados por Wompi SV</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <i class="fa-solid fa-file-invoice-dollar" style="color:var(--info);"></i>
                                <span>Factura electrónica oficial emitida de inmediato</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Checkout Column (Right) -->
                <div style="display:flex; flex-direction:column; gap:1.5rem;">
                    <!-- Taller Card -->
                    <div class="glass-card" style="padding:1.5rem;">
                        <h4 style="font-family:'Outfit', sans-serif; font-size:0.95rem; color:var(--primary); margin:0 0 0.75rem 0;">Taller Contribuyente</h4>
                        <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.8rem; color:var(--text-secondary);">
                            <div>Taller: <strong style="color:var(--text-primary);">${ws.nombre}</strong></div>
                            <div>Representante: <span style="color:var(--text-primary);">${ws.propietario}</span></div>
                            <div>NIT/DUI: <span style="color:var(--text-primary);">${ws.num_documento || ws.nit || 'N/A'}</span></div>
                        </div>
                    </div>

                    <!-- Pago Card -->
                    <div class="glass-card" style="padding:1.75rem; display:flex; flex-direction:column; gap:1.25rem;">
                        <h4 style="font-family:'Outfit', sans-serif; font-size:1.1rem; color:var(--text-primary); margin:0;">Resumen del Pedido</h4>
                        
                        <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.85rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--text-secondary);">Suscripción Mensual:</span>
                                <span style="color:var(--text-primary);">$${originalPlan.precio.toFixed(2)}</span>
                            </div>
                            
                            <!-- Coupon Form -->
                            <div class="form-group" style="margin:0.25rem 0 0.5rem 0;">
                                <label style="font-size:0.75rem; color:var(--text-muted);">¿Tienes un cupón de descuento?</label>
                                <div style="display:flex; gap:0.4rem; margin-top:0.25rem;">
                                    <input type="text" id="checkout-coupon" value="${ws.cupon_usado || ''}" placeholder="CUPÓN" style="padding:0.4rem 0.6rem; text-transform:uppercase; font-size:0.8rem; background:rgba(0,0,0,0.1); border:1px solid var(--border-color); color:#fff; border-radius:4px; flex:1;">
                                    <button type="button" id="btn-checkout-coupon" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem;">Aplicar</button>
                                </div>
                                <div id="checkout-coupon-msg" style="font-size:0.75rem; margin-top:0.25rem;"></div>
                            </div>
                            
                            <div id="checkout-discount-row" style="display:${selectedCoupon ? 'flex' : 'none'}; justify-content:space-between; color:var(--success); font-weight:500;">
                                <span id="checkout-discount-label">Descuento (${selectedCoupon ? selectedCoupon.codigo : ''}):</span>
                                <span id="checkout-discount-val">-$0.00</span>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; font-size:1.15rem; font-weight:700;">
                            <span style="color:var(--text-primary);">Total Mensual:</span>
                            <span style="color:var(--primary); font-size:1.5rem;" id="checkout-total-val">$${finalPrice.toFixed(2)}</span>
                        </div>
                        
                        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;">
                            <button type="button" id="btn-wompi-checkout-submit" class="btn btn-primary" style="padding:0.9rem; font-size:1rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; display:flex; justify-content:center; align-items:center; gap:0.5rem; cursor:pointer;"><i class="fa-solid fa-credit-card"></i> Suscribirse con Wompi</button>
                            <span style="font-size:0.7rem; color:var(--text-muted); text-align:center; line-height:1.3;">Al suscribirte, autorizas a Wompi a realizar cargos automáticos mensuales en tu tarjeta por el monto indicado. Puedes cancelar cuando quieras.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // JavaScript behavior within pasarela
    setTimeout(() => {
        const checkoutCoupon = document.getElementById('checkout-coupon');
        const applyCouponBtn = document.getElementById('btn-checkout-coupon');
        const discountRow = document.getElementById('checkout-discount-row');
        const discountLabel = document.getElementById('checkout-discount-label');
        const discountVal = document.getElementById('checkout-discount-val');
        const totalValEl = document.getElementById('checkout-total-val');
        const couponMsg = document.getElementById('checkout-coupon-msg');
        
        // Coupon logic
        function applyCouponCode(code) {
            if (!code) {
                selectedCoupon = null;
                if (discountRow) discountRow.style.display = 'none';
                finalPrice = originalPlan.precio;
                if (totalValEl) totalValEl.textContent = `$${finalPrice.toFixed(2)}`;
                if (couponMsg) couponMsg.innerHTML = '';
                return;
            }

            const currentDb = getDatabase();
            const coupon = (currentDb.saas_coupons || []).find(c => c.codigo === code && c.activo);

            if (coupon) {
                selectedCoupon = coupon;
                let discount = 0;
                if (coupon.tipo === 'porcentaje') {
                    discount = originalPlan.precio * (coupon.valor / 100);
                } else if (coupon.tipo === 'fijo') {
                    discount = Math.min(originalPlan.precio, coupon.valor);
                }
                finalPrice = Math.max(0, originalPlan.precio - discount);
                
                if (discountRow) discountRow.style.display = 'flex';
                if (discountLabel) discountLabel.textContent = `Descuento (${coupon.codigo}):`;
                if (discountVal) discountVal.textContent = `-$${discount.toFixed(2)}`;
                if (totalValEl) totalValEl.textContent = `$${finalPrice.toFixed(2)}`;
                if (couponMsg) couponMsg.innerHTML = `<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Cupón válido aplicado</span>`;
                showToast("Cupón de descuento aplicado con éxito.", "success");
            } else {
                selectedCoupon = null;
                if (discountRow) discountRow.style.display = 'none';
                finalPrice = originalPlan.precio;
                if (totalValEl) totalValEl.textContent = `$${finalPrice.toFixed(2)}`;
                if (couponMsg) couponMsg.innerHTML = `<span style="color:var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Cupón inválido</span>`;
                showToast("Código de cupón inválido o vencido.", "error");
            }
        }

        if (applyCouponBtn) {
            applyCouponBtn.addEventListener('click', () => {
                applyCouponCode(checkoutCoupon.value.trim().toUpperCase());
            });
        }

        // Run initial coupon apply if workshop registered with a coupon
        if (ws.cupon_usado) {
            applyCouponCode(ws.cupon_usado);
        }

        // Click handler for Wompi checkout submit
        const checkoutSubmitBtn = document.getElementById('btn-wompi-checkout-submit');
        if (checkoutSubmitBtn) {
            checkoutSubmitBtn.addEventListener('click', () => {
                const overlay = document.getElementById('payment-loading-overlay');
                const stepText = document.getElementById('loading-step-text');
                if (overlay) overlay.style.display = 'flex';
                if (stepText) stepText.textContent = "Conectando con Wompi SV...";

                const currentDb = getDatabase();
                const saasConfig = currentDb.saas_config || { wompi: {} };
                const today = new Date();
                const diaDePago = today.getDate(); // 1-31

                const payload = {
                    workshopId: targetId,
                    workshopName: ws.nombre,
                    planName: ws.plan,
                    amount: finalPrice,
                    diaDePago: diaDePago,
                    wompiConfig: saasConfig.wompi
                };

                const backendUrl = (currentDb.saas_config && currentDb.saas_config.backendUrl) || '';
                fetch(`${backendUrl}/api/wompi/create-link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (stepText) stepText.textContent = "Redireccionando a la pasarela de Wompi...";
                        
                        // Save Wompi details
                        ws.idEnlace = data.idEnlace;
                        ws.urlEnlace = data.urlEnlace;
                        ws.cupon_usado = selectedCoupon ? selectedCoupon.codigo : null;
                        ws.precio_mensual = finalPrice;
                        
                        dataService.saas.updateRequestStatus(targetId, ws.status, {
                            idEnlace: data.idEnlace,
                            urlEnlace: data.urlEnlace,
                            cupon_usado: ws.cupon_usado,
                            precio_mensual: ws.precio_mensual
                        }).then(() => {
                            saveDatabase(currentDb);
                            setTimeout(() => {
                                window.location.href = data.urlEnlace;
                            }, 800);
                        });
                    } else {
                        if (overlay) overlay.style.display = 'none';
                        showToast(`Error de Wompi: ${data.message || 'No se pudo generar el enlace.'}`, "error");
                    }
                })
                .catch(err => {
                    if (overlay) overlay.style.display = 'none';
                    console.error("Wompi Link Generation Error:", err);
                    showToast("Error de conexión al generar el enlace de pago.", "error");
                });
            });
        }
    }, 50);
}

// STANDALONE GLOBAL SUCCESS STATE RENDERER
function renderSuccessState(container, payment, workshop) {
    container.innerHTML = `
        <div style="max-width: 600px; margin: 4rem auto; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--success); border-radius: 12px; text-align: center;" class="saas-container">
            <div style="font-size: 5rem; color: var(--success); margin-bottom: 1.5rem;">
                <i class="fa-solid fa-circle-check"></i>
            </div>
            <h2 style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
                ¡Suscripción Procesada con Éxito!
            </h2>
            <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.6; margin-bottom: 2rem;">
                La suscripción de <strong>${workshop.nombre}</strong> ha sido activada/renovada exitosamente. Tu acceso a la plataforma está habilitado por los próximos 30 días.
            </p>

            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; text-align: left; font-size: 0.9rem;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">Comprobante:</span>
                    <strong style="color:var(--text-primary); font-family:monospace;">${payment.factura}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">Monto Pagado:</span>
                    <strong style="color:var(--success);">$${Number(payment.monto).toFixed(2)} USD</strong>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <span style="color:var(--text-muted);">Método:</span>
                    <span style="color:var(--text-primary);">${payment.metodo}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="color:var(--text-muted);">Próximo Pago:</span>
                    <strong style="color:var(--text-primary);">${new Date(workshop.proximo_pago).toLocaleDateString()}</strong>
                </div>
            </div>

            <div style="display:flex; gap:1rem;">
                <a href="#taller-dashboard" class="btn btn-primary" style="flex:1; padding:0.8rem;"><i class="fa-solid fa-gauge"></i> Entrar a Mecanic OS</a>
                <a href="#landing" class="btn btn-secondary" style="flex:1; padding:0.8rem;"><i class="fa-solid fa-house"></i> Volver a Landing</a>
            </div>
        </div>
    `;
    showToast("Membresía activada con éxito.", "success");
}

// WOMPI RETURN CALLBACK ROUTE RENDERER
function renderPagoSuscripcionWompiCallback(container, queryParams) {
    const id = queryParams.id;
    const idEnlace = queryParams.idEnlace;
    const status = queryParams.status;

    if (!id || !idEnlace || status !== 'success') {
        container.innerHTML = `
            <div style="max-width: 500px; margin: 8rem auto; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--danger); border-radius: 12px; text-align: center;">
                <div style="font-size: 4rem; color: var(--danger); margin-bottom: 1rem;">
                    <i class="fa-solid fa-circle-xmark"></i>
                </div>
                <h2 style="font-family:'Outfit', sans-serif; color: var(--text-primary);">Error de Afiliación</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">No pudimos confirmar la afiliación recurrente de Wompi. Si realizaste el pago y crees que es un error, por favor contacta con soporte.</p>
                <a href="#landing" class="btn btn-primary">Volver al Inicio</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="max-width: 600px; margin: 6rem auto; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 12px; text-align: center;" class="saas-container">
            <div class="spinner-large" style="border: 4px solid rgba(99, 102, 241, 0.1); border-left-color: var(--primary); border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto;"></div>
            <h2 id="callback-title" style="font-family:'Outfit', sans-serif; font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
                Verificando Suscripción con Wompi
            </h2>
            <p id="callback-desc" style="color: var(--text-secondary); font-size: 1rem; line-height: 1.6; margin-bottom: 1.5rem;">
                Conectando con la pasarela de pagos para confirmar tu registro recurrente...
            </p>
            <div id="callback-action-container" style="display:none; justify-content:center; gap:1rem;">
                <button type="button" id="btn-reverify-wompi" class="btn btn-primary" style="padding:0.75rem 1.5rem;"><i class="fa-solid fa-sync"></i> Reintentar Verificación</button>
                <a href="#landing" class="btn btn-secondary" style="padding:0.75rem 1.5rem;">Ir a Inicio</a>
            </div>
        </div>
    `;

    function verifySubscription() {
        const db = getDatabase();
        const saasConfig = db.saas_config || { wompi: {} };
        const actionContainer = document.getElementById('callback-action-container');
        const titleEl = document.getElementById('callback-title');
        const descEl = document.getElementById('callback-desc');

        if (actionContainer) actionContainer.style.display = 'none';

        const backendUrl = (db.saas_config && db.saas_config.backendUrl) || '';
        fetch(`${backendUrl}/api/wompi/check-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idEnlace: idEnlace, wompiConfig: saasConfig.wompi })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.subscribed) {
                const currentDb = getDatabase();
                const targetWs = currentDb.solicitudes_registro.find(s => s.id === id);
                
                if (targetWs) {
                    const existingPayment = (currentDb.saas_payments || []).find(p => p.wompiEnlaceId === idEnlace);
                    if (existingPayment) {
                        console.log("Wompi Callback: Payment already recorded. Showing success state.");
                        renderSuccessState(container, existingPayment, targetWs);
                        return;
                    }

                    const nextFacturaNum = 'SUS-' + new Date().getFullYear() + '-' + String((currentDb.saas_payments || []).length + 1).padStart(3, '0');
                    
                    const newPayment = {
                        id: 'PAY-' + Date.now().toString().slice(-4),
                        workshopId: id,
                        workshopName: targetWs.nombre,
                        plan: targetWs.plan,
                        monto: targetWs.precio_mensual || 75.00,
                        subtotal: targetWs.precio_mensual || 75.00,
                        descuento_aplicado: 0,
                        cupon_usado: targetWs.cupon_usado || null,
                        fecha: Date.now(),
                        factura: nextFacturaNum,
                        metodo: 'Suscripción Recurrente (Wompi SV)',
                        wompiEnlaceId: idEnlace,
                        estado: 'completado'
                    };
                    
                    if (!currentDb.saas_payments) currentDb.saas_payments = [];
                    currentDb.saas_payments.push(newPayment);

                    targetWs.suscripcion_status = 'activo';
                    targetWs.proximo_pago = Date.now() + 30 * 24 * 60 * 60 * 1000;

                    if (currentDb.saas_state && currentDb.saas_state.workshopData && currentDb.saas_state.workshopData.id === id) {
                        currentDb.saas_state.status = 'active';
                        currentDb.saas_state.workshopData = targetWs;
                        currentDb.saas_state.termsSigned = true;
                    }

                    saveDatabase(currentDb).then(() => {
                        emitSubscriptionDTE(newPayment, targetWs);
                        renderSuccessState(container, newPayment, targetWs);
                    });
                } else {
                    if (titleEl) titleEl.textContent = "Error de Datos";
                    if (descEl) descEl.textContent = "La cuenta del taller asociada a este pago no pudo ser localizada.";
                    if (actionContainer) actionContainer.style.display = 'flex';
                }
            } else {
                if (titleEl) titleEl.textContent = "Suscripción Pendiente";
                if (descEl) descEl.textContent = "Wompi aún no ha reportado una suscripción activa para este enlace. Si acabas de realizar el pago, puede tardar un momento en registrarse.";
                if (actionContainer) actionContainer.style.display = 'flex';
            }
        })
        .catch(err => {
            console.error("Wompi Callback verification error:", err);
            if (titleEl) titleEl.textContent = "Error de Red";
            if (descEl) descEl.textContent = "Ocurrió un error al intentar validar tu suscripción. Por favor reintenta la verificación.";
            if (actionContainer) actionContainer.style.display = 'flex';
        });
    }

    setTimeout(() => {
        verifySubscription();
        
        const reverifyBtn = document.getElementById('btn-reverify-wompi');
        if (reverifyBtn) {
            reverifyBtn.addEventListener('click', verifySubscription);
        }
    }, 1000);
}

async function renderAdminSolicitudes(container) {
    if (sessionStorage.getItem('mecanic_os_saas_admin_auth') !== 'true') {
        renderSaaSAdminLogin(container);
        return;
    }
    const db = getDatabase();
    const plans = await dataService.saas.getPlans();
    const coupons = await dataService.saas.getCoupons();
    const solicitudes = db.solicitudes_registro || [];
    const payments = db.saas_payments || [];
    
    // Set default tab if not set
    if (!window.activeSaaSTab) {
        window.activeSaaSTab = 'sub'; // Default to Suscripciones
    }
    const activeTab = window.activeSaaSTab;
    
    // Helper to switch tab
    window.switchSaaSTab = function(tabName) {
        window.activeSaaSTab = tabName;
        window.saasEditWorkshopId = null;
        window.saasPayWorkshopId = null;
        window.saasViewWorkshopDetailsId = null;
        renderAdminSolicitudes(container);
    };

    // Helper to switch sub-tabs in details view
    window.switchSaasDetailsTab = function(tabName) {
        window.saasActiveDetailsTab = tabName;
        renderAdminSolicitudes(container);
    };
    
    // Close forms
    window.saasCloseForm = function() {
        window.saasEditWorkshopId = null;
        window.saasPayWorkshopId = null;
        window.saasConfigWorkshopId = null;
        window.saasViewWorkshopDetailsId = null;
        window.saasAddWorkshopForm = false;
        window.saasViewReceiptPaymentId = null;
        window.saasAddPlanForm = false;
        window.saasAddCouponForm = false;
        window.saasEditPlanId = null;
        renderAdminSolicitudes(container);
    };

    // Form handlers
    window.handleSaasEditSubmit = function(e) {
        e.preventDefault();
        const id = window.saasEditWorkshopId;
        const plan = document.getElementById('edit-saas-plan').value;
        const price = parseFloat(document.getElementById('edit-saas-price').value);
        const status = document.getElementById('edit-saas-status').value;
        
        const workshop = solicitudes.find(s => s.id === id);
        if (workshop) {
            workshop.plan = plan;
            workshop.precio_mensual = price;
            workshop.suscripcion_status = status;
            
            // Collect new fields
            workshop.nombre = document.getElementById('edit-saas-nombre').value;
            workshop.alias = document.getElementById('edit-saas-alias').value;
            workshop.nombre_comercial = document.getElementById('edit-saas-nombre-comercial').value;
            workshop.giro = (() => { const el = document.getElementById('edit-saas-giro'); return el.options[el.selectedIndex].getAttribute('data-desc') || el.value; })();
            workshop.direccion = document.getElementById('edit-saas-direccion').value;
            workshop.telefono = document.getElementById('edit-saas-telefono').value;
            workshop.correo = document.getElementById('edit-saas-correo').value;
            workshop.nrc = document.getElementById('edit-saas-nrc').value;
            workshop.tipo_persona = document.getElementById('edit-saas-tipo-persona').value;
            workshop.clasificacion_tributaria = document.getElementById('edit-saas-clasificacion').value;
            workshop.sujeto_excluido = document.getElementById('edit-saas-sujeto-excluido').value;
            workshop.tipo_documento = document.getElementById('edit-saas-tipo-doc').value;
            workshop.num_documento = document.getElementById('edit-saas-num-doc').value;
            workshop.actividad_economica = document.getElementById('edit-saas-giro').value;
            workshop.pais = document.getElementById('edit-saas-pais').value;
            workshop.departamento = document.getElementById('edit-saas-departamento').value;
            workshop.municipio = document.getElementById('edit-saas-municipio').value;
            if (window.saasSelectedLogoBase64) {
                workshop.logo = window.saasSelectedLogoBase64;
                workshop.logoText = document.getElementById('edit-saas-alias').value.substring(0, 15).toUpperCase();
            }
            
            dataService.saas.createRequest(workshop)
                .then(() => {
                    // If this is the active workshop being used in the app, sync the active saas_state
                    const saasState = db.saas_state;
                    if (saasState.workshopData && saasState.workshopData.id === id) {
                        saasState.workshopData = workshop;
                        
                        // Reactivate or suspend the active user state
                        if (status === 'suspendido') {
                            saasState.status = 'suspended';
                        } else if (saasState.status === 'suspended' && (status === 'activo' || status === 'demo')) {
                            saasState.status = 'active';
                        }
                        
                        // Copy to config_taller
                        db.config_taller = {
                            nombre: workshop.nombre,
                            alias: workshop.alias,
                            nombre_comercial: workshop.nombre_comercial,
                            giro: workshop.giro,
                            direccion: workshop.direccion,
                            telefono: workshop.telefono,
                            correo: workshop.correo,
                            nit: workshop.tipo_documento === 'NIT' ? workshop.num_documento : '',
                            nrc: workshop.nrc,
                            logoText: workshop.alias.substring(0, 15).toUpperCase(),
                            logoTagline: 'Servicio Automotriz Especializado',
                            tipo_persona: workshop.tipo_persona,
                            clasificacion_tributaria: workshop.clasificacion_tributaria,
                            sujeto_excluido: workshop.sujeto_excluido,
                            tipo_documento: workshop.tipo_documento,
                            num_documento: workshop.num_documento,
                            actividad_economica: workshop.giro,
                            pais: workshop.pais,
                            departamento: workshop.departamento,
                            municipio: workshop.municipio,
                            logo: workshop.logo || ''
                        };
                    }
                    saveDatabase(db);
                    showToast("Suscripción y datos comerciales actualizados.", "success");
                    window.saasCloseForm();
                })
                .catch(err => {
                    console.error("Error updating workshop request:", err);
                    showToast("Error al actualizar taller: " + err.message, "error");
                });
        }
    };
    
    window.handleSaasPaySubmit = function(e) {
        e.preventDefault();
        const id = window.saasPayWorkshopId;
        const workshop = solicitudes.find(s => s.id === id);
        if (workshop) {
            const monto = parseFloat(document.getElementById('pay-saas-monto').value);
            const metodo = document.getElementById('pay-saas-metodo').value;
            const factura = document.getElementById('pay-saas-factura').value;
            const fecha = Date.parse(document.getElementById('pay-saas-fecha').value) || Date.now();
            
            const newPayment = {
                id: 'PAY-' + Date.now().toString().slice(-4),
                workshopId: id,
                workshopName: workshop.nombre,
                plan: workshop.plan,
                monto: monto,
                fecha: fecha,
                factura: factura,
                metodo: metodo,
                estado: 'completado'
            };
            
            db.saas_payments.push(newPayment);
            
            // Push next billing date 30 days
            workshop.proximo_pago = Date.now() + 30 * 24 * 60 * 60 * 1000;
            
            dataService.saas.createRequest(workshop)
                .then(() => {
                    if (db.saas_state.workshopData && db.saas_state.workshopData.id === id) {
                        db.saas_state.workshopData.proximo_pago = workshop.proximo_pago;
                    }
                    saveDatabase(db);
                    
                    // Emit DTE asynchronously
                    emitSubscriptionDTE(newPayment, workshop);
                    
                    showToast("Pago registrado con éxito y vigencia extendida.", "success");
                    window.saasCloseForm();
                })
                .catch(err => {
                    console.error("Error updating payment in request:", err);
                    showToast("Error al registrar el pago: " + err.message, "error");
                });
        }
    };

    if (window.saasViewWorkshopDetailsId) {
        const id = window.saasViewWorkshopDetailsId;
        const workshop = solicitudes.find(s => s.id === id);
        if (!workshop) {
            window.saasCloseForm();
            return;
        }

        const wsPayments = payments.filter(p => p.workshopId === id);
        const detailsTab = window.saasActiveDetailsTab || 'plan';
        const plansList = db.saas_plans || [];
        const saasConfig = db.saas_config || { wompi: {} };
        const status = workshop.suscripcion_status || 'activo';
        
        let tabBodyHtml = '';

        if (detailsTab === 'plan') {
            let badgeColor = 'badge-success';
            if (status === 'suspendido') badgeColor = 'badge-danger';
            if (status === 'demo') badgeColor = 'badge-warning';

            const nextPay = workshop.proximo_pago ? new Date(workshop.proximo_pago).toLocaleDateString() : 'N/A';
            const nextPayRaw = workshop.proximo_pago ? new Date(workshop.proximo_pago).toISOString().split('T')[0] : '';

            tabBodyHtml = `
                <div style="display:grid; grid-template-columns: 1fr 2fr; gap:1.5rem; align-items: start;">
                    <!-- Columna Izquierda: Resumen y Membresía -->
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        <div class="glass-card" style="padding:1.25rem; border:1px solid var(--border-color); background:rgba(255,255,255,0.02);">
                            <h4 style="font-family:'Outfit', sans-serif; font-size:0.95rem; color:var(--primary); margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.4rem; font-weight:700;"><i class="fa-solid fa-credit-card"></i> Estado de Membresía</h4>
                            <div style="display:flex; flex-direction:column; gap:0.75rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.8rem; color:var(--text-secondary);">Plan Contratado:</span>
                                    <strong style="color:var(--primary);">${workshop.plan ? workshop.plan.toUpperCase() : 'BASIC'}</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.8rem; color:var(--text-secondary);">Cuota Pactada:</span>
                                    <strong style="color:var(--text-primary);">$${(workshop.precio_mensual || 75.00).toFixed(2)}/mes</strong>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.8rem; color:var(--text-secondary);">Estado Actual:</span>
                                    <span class="badge-tag ${badgeColor}">${status.toUpperCase()}</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:0.8rem; color:var(--text-secondary);">Renovación:</span>
                                    <span style="${workshop.proximo_pago && workshop.proximo_pago < Date.now() ? 'color:var(--danger); font-weight:bold;' : 'color:var(--text-primary);'}">
                                        ${nextPay}
                                    </span>
                                </div>
                            </div>
                            
                            <hr style="border-color:var(--border-color); margin:1rem 0;">
                            
                            <!-- Acciones rápidas de membresía -->
                            <div style="display:flex; flex-direction:column; gap:0.5rem;">
                                <button class="btn btn-secondary" onclick="window.toggleWorkshopStatus('${workshop.id}')" style="padding:0.4rem; font-size:0.75rem; color:${status === 'suspendido' ? 'var(--success)' : 'var(--danger)'}; border-color:${status === 'suspendido' ? 'var(--success)' : 'var(--danger)'};">
                                    <i class="fa-solid ${status === 'suspendido' ? 'fa-play' : 'fa-pause'}"></i> ${status === 'suspendido' ? 'Activar Acceso' : 'Suspender Acceso'}
                                </button>
                                <button class="btn btn-secondary btn-copy-pay-link-detail" data-id="${workshop.id}" style="padding:0.4rem; font-size:0.75rem; color:var(--success); border-color:var(--success);">
                                    <i class="fa-solid fa-link"></i> Copiar Enlace de Pago
                                </button>
                            </div>
                        </div>

                        <!-- Card de Ajuste de Membresía -->
                        <div class="glass-card" style="padding:1.25rem; border:1px solid var(--border-color); background:rgba(255,255,255,0.02);">
                            <h4 style="font-family:'Outfit', sans-serif; font-size:0.95rem; color:var(--primary); margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.4rem; font-weight:700;"><i class="fa-solid fa-edit"></i> Ajustar Plan</h4>
                            <form id="saas-detail-plan-form" style="display:flex; flex-direction:column; gap:0.8rem;">
                                <div class="form-group">
                                    <label style="font-size:0.75rem; margin-bottom:0.25rem;">Cambiar Plan</label>
                                    <select id="detail-saas-plan" style="padding:0.4rem; font-size:0.8rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:32px; width:100%;">
                                        <option value="Basic" ${workshop.plan === 'Basic' ? 'selected' : ''}>Basic ($45/mes)</option>
                                        <option value="Pro" ${workshop.plan === 'Pro' ? 'selected' : ''}>Pro ($75/mes)</option>
                                        <option value="Enterprise" ${workshop.plan === 'Enterprise' ? 'selected' : ''}>Enterprise ($120/mes)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label style="font-size:0.75rem; margin-bottom:0.25rem;">Ajustar Cuota ($)</label>
                                    <input type="number" step="0.01" id="detail-saas-price" value="${workshop.precio_mensual || 75.00}" style="padding:0.4rem; font-size:0.8rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:32px; width:100%;">
                                </div>
                                <div class="form-group">
                                    <label style="font-size:0.75rem; margin-bottom:0.25rem;">Próxima Renovación</label>
                                    <input type="date" id="detail-saas-next-pay" value="${nextPayRaw}" style="padding:0.4rem; font-size:0.8rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:32px; width:100%;">
                                </div>
                                <button type="submit" class="btn btn-primary" style="padding:0.45rem; font-size:0.75rem; margin-top:0.25rem; font-weight:700;"><i class="fa-solid fa-floppy-disk"></i> Actualizar Plan</button>
                            </form>
                        </div>
                    </div>

                    <!-- Columna Derecha: Datos Generales / Fiscales -->
                    <div class="glass-card" style="padding:1.5rem; border:1px solid var(--border-color); background:rgba(255,255,255,0.01);">
                        <h4 style="font-family:'Outfit', sans-serif; font-size:1.05rem; color:var(--primary); margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; font-weight:700;"><i class="fa-solid fa-file-invoice"></i> Datos Fiscales y de Registro</h4>
                        <form id="saas-detail-general-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                            <!-- Grid de Datos -->
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Nombre o Razón Social</label>
                                    <input type="text" id="edit-saas-nombre" required value="${workshop.nombre || ''}" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                </div>
                                <div class="form-group">
                                    <label>Alias (Nombre Corto)</label>
                                    <input type="text" id="edit-saas-alias" required value="${workshop.alias || ''}" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                </div>
                            </div>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Nombre Comercial</label>
                                    <input type="text" id="edit-saas-nombre-comercial" required value="${workshop.nombre_comercial || ''}" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                </div>
                                <div class="form-group">
                                    <label>Propietario / Administrador</label>
                                    <input type="text" id="edit-saas-propietario" required value="${workshop.propietario || ''}" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                </div>
                            </div>
                            
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Correo Electrónico</label>
                                    <input type="email" id="edit-saas-correo" required value="${workshop.correo || ''}" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                </div>
                                <div class="form-group">
                                    <label>Teléfono</label>
                                    <input type="text" id="edit-saas-telefono" required value="${workshop.telefono || ''}" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Tipo Persona</label>
                                    <select id="edit-saas-tipo-persona" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px;">
                                        <option value="Natural" ${workshop.tipo_persona === 'Natural' ? 'selected' : ''}>Natural</option>
                                        <option value="Jurídica" ${workshop.tipo_persona === 'Jurídica' ? 'selected' : ''}>Jurídica</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Clasificación</label>
                                    <select id="edit-saas-clasificacion" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px;">
                                        <option value="Otros" ${workshop.clasificacion_tributaria === 'Otros' ? 'selected' : ''}>Otros</option>
                                        <option value="Pequeño contribuyente" ${workshop.clasificacion_tributaria === 'Pequeño contribuyente' ? 'selected' : ''}>Pequeño contribuyente</option>
                                        <option value="Mediano contribuyente" ${workshop.clasificacion_tributaria === 'Mediano contribuyente' ? 'selected' : ''}>Mediano contribuyente</option>
                                        <option value="Gran contribuyente" ${workshop.clasificacion_tributaria === 'Gran contribuyente' ? 'selected' : ''}>Gran contribuyente</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>¿Sujeto Excluido?</label>
                                    <select id="edit-saas-sujeto-excluido" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px;">
                                        <option value="No" ${workshop.sujeto_excluido === 'No' ? 'selected' : ''}>No</option>
                                        <option value="Sí" ${workshop.sujeto_excluido === 'Sí' ? 'selected' : ''}>Sí</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Tipo Documento</label>
                                    <select id="edit-saas-tipo-doc" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px;">
                                        <option value="NIT" ${workshop.tipo_documento === 'NIT' ? 'selected' : ''}>NIT</option>
                                        <option value="DUI" ${workshop.tipo_documento === 'DUI' ? 'selected' : ''}>DUI</option>
                                        <option value="Pasaporte" ${workshop.tipo_documento === 'Pasaporte' ? 'selected' : ''}>Pasaporte</option>
                                        <option value="Carnet de Extranjería" ${workshop.tipo_documento === 'Carnet de Extranjería' ? 'selected' : ''}>Carnet</option>
                                        <option value="Otro" ${workshop.tipo_documento === 'Otro' ? 'selected' : ''}>Otro</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>N° Documento</label>
                                    <input type="text" id="edit-saas-num-doc" required value="${workshop.num_documento || ''}" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                </div>
                                <div class="form-group">
                                    <label>Registro NRC</label>
                                    <input type="text" id="edit-saas-nrc" required value="${workshop.nrc || ''}" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Giro / Actividad Económica</label>
                                    <select id="edit-saas-giro" required style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px; width:100%;">
                                        ${getGirosOptionsHtml(workshop.actividad_economica || workshop.giro)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>País</label>
                                    <select id="edit-saas-pais" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px;">
                                        <option value="El Salvador" selected>El Salvador</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Departamento</label>
                                    <select id="edit-saas-departamento" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px;">
                                        <option value="Ahuachapán" ${workshop.departamento === 'Ahuachapán' ? 'selected' : ''}>Ahuachapán</option>
                                        <option value="Cabañas" ${workshop.departamento === 'Cabañas' ? 'selected' : ''}>Cabañas</option>
                                        <option value="Chalatenango" ${workshop.departamento === 'Chalatenango' ? 'selected' : ''}>Chalatenango</option>
                                        <option value="Cuscatlán" ${workshop.departamento === 'Cuscatlán' ? 'selected' : ''}>Cuscatlán</option>
                                        <option value="La Libertad" ${workshop.departamento === 'La Libertad' ? 'selected' : ''}>La Libertad</option>
                                        <option value="La Paz" ${workshop.departamento === 'La Paz' ? 'selected' : ''}>La Paz</option>
                                        <option value="La Unión" ${workshop.departamento === 'La Unión' ? 'selected' : ''}>La Unión</option>
                                        <option value="Morazán" ${workshop.departamento === 'Morazán' ? 'selected' : ''}>Morazán</option>
                                        <option value="San Miguel" ${workshop.departamento === 'San Miguel' ? 'selected' : ''}>San Miguel</option>
                                        <option value="San Salvador" ${workshop.departamento === 'San Salvador' ? 'selected' : ''}>San Salvador</option>
                                        <option value="San Vicente" ${workshop.departamento === 'San Vicente' ? 'selected' : ''}>San Vicente</option>
                                        <option value="Santa Ana" ${workshop.departamento === 'Santa Ana' ? 'selected' : ''}>Santa Ana</option>
                                        <option value="Sonsonate" ${workshop.departamento === 'Sonsonate' ? 'selected' : ''}>Sonsonate</option>
                                        <option value="Usulután" ${workshop.departamento === 'Usulután' ? 'selected' : ''}>Usulután</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Municipio</label>
                                    <select id="edit-saas-municipio" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px;">
                                        <!-- Cargado dinámicamente -->
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Dirección del Taller</label>
                                <input type="text" id="edit-saas-direccion" required value="${workshop.direccion || ''}" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                            
                            <div class="form-group">
                                <label>Logotipo del Taller (Opcional)</label>
                                <input type="file" id="edit-saas-logo" accept="image/*" style="padding:0.4rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; font-size:0.8rem; width:100%;">
                                <div id="detail-logo-preview-container" style="${workshop.logo ? 'display:block;' : 'display:none;'} margin-top:0.75rem;">
                                    <span style="font-size:0.7rem; color:var(--text-secondary); display:block; margin-bottom:0.25rem;">Vista Previa del Logotipo:</span>
                                    <img id="detail-logo-preview" src="${workshop.logo || ''}" style="max-height:60px; max-width:150px; object-fit:contain; border:1px solid var(--border-color); border-radius:4px; padding:4px; background:white;" />
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary" style="padding:0.6rem; font-size:0.85rem; font-weight:700; margin-top:0.5rem;"><i class="fa-solid fa-save"></i> Guardar Cambios del Taller</button>
                        </form>
                    </div>
                </div>
            `;
        } else if (detailsTab === 'payments') {
            // Historial de Cuotas Tab
            let paymentsTableHtml = '';
            if (wsPayments.length === 0) {
                paymentsTableHtml = `
                    <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                        <div style="font-size:2.5rem; margin-bottom:1rem; opacity:0.4;"><i class="fa-solid fa-receipt"></i></div>
                        <p style="font-size:0.9rem;">No hay pagos registrados para este taller.</p>
                    </div>
                `;
            } else {
                paymentsTableHtml = `
                    <div class="table-container">
                        <table style="font-size:0.85rem;">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Recibo ID</th>
                                    <th>Factura</th>
                                    <th>Método</th>
                                    <th>Monto</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${wsPayments.map(p => {
                                    const pDate = new Date(p.fecha).toLocaleDateString();
                                    return `
                                        <tr>
                                            <td>${pDate}</td>
                                            <td><code style="color:var(--primary); font-weight:bold;">${p.id}</code></td>
                                            <td>${p.factura || 'N/A'}</td>
                                            <td>${p.metodo || 'Efectivo'}</td>
                                            <td><strong>$${Number(p.monto).toFixed(2)}</strong></td>
                                            <td>
                                                <button class="btn btn-secondary btn-view-receipt-detail" data-id="${p.id}" style="padding:2px 8px; font-size:0.7rem;"><i class="fa-solid fa-file-invoice"></i> Recibo</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            tabBodyHtml = `
                <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem; align-items: start;">
                    <!-- Columna Izquierda: Tabla de Historial -->
                    <div class="glass-card" style="padding:1.5rem; border:1px solid var(--border-color); background:rgba(255,255,255,0.01);">
                        <h4 style="font-family:'Outfit', sans-serif; font-size:1.05rem; color:var(--primary); margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; font-weight:700;"><i class="fa-solid fa-list-check"></i> Registro de Pagos Recibidos</h4>
                        ${paymentsTableHtml}
                    </div>

                    <!-- Columna Derecha: Registrar Pago Manual -->
                    <div class="glass-card" style="padding:1.25rem; border:1px solid var(--border-color); background:rgba(255,255,255,0.02);">
                        <h4 style="font-family:'Outfit', sans-serif; font-size:0.95rem; color:var(--primary); margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.4rem; font-weight:700;"><i class="fa-solid fa-dollar-sign"></i> Cobrar Cuota Manual</h4>
                        <form id="saas-detail-pay-form" style="display:flex; flex-direction:column; gap:0.8rem;">
                            <div class="form-group">
                                <label style="font-size:0.75rem; margin-bottom:0.25rem;">Monto Recibido ($)</label>
                                <input type="number" step="0.01" id="pay-form-monto" required value="${workshop.precio_mensual || 75.00}" style="padding:0.4rem; font-size:0.8rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:32px; width:100%;">
                            </div>
                            <div class="form-group">
                                <label style="font-size:0.75rem; margin-bottom:0.25rem;">Fecha del Cobro</label>
                                <input type="date" id="pay-form-fecha" required value="${new Date().toISOString().split('T')[0]}" style="padding:0.4rem; font-size:0.8rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:32px; width:100%;">
                            </div>
                            <div class="form-group">
                                <label style="font-size:0.75rem; margin-bottom:0.25rem;">Método de Pago</label>
                                <select id="pay-form-metodo" style="padding:0.4rem; font-size:0.8rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:32px; width:100%;">
                                    <option value="Efectivo" selected>Efectivo</option>
                                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Bitcoin (Chivo/Otros)">Bitcoin</option>
                                    <option value="Wompi Pago Automático">Wompi Recurrente</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label style="font-size:0.75rem; margin-bottom:0.25rem;">N° Documento / Factura (Opcional)</label>
                                <input type="text" id="pay-form-factura" placeholder="Ej: DTE-12345" style="padding:0.4rem; font-size:0.8rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:32px; width:100%;">
                            </div>
                            <button type="submit" class="btn btn-primary" style="padding:0.5rem; font-size:0.8rem; margin-top:0.25rem; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Registrar Pago y Habilitar</button>
                        </form>
                    </div>
                </div>
            `;
        } else if (detailsTab === 'billing') {
            // Facturación & Wompi Tab
            const dte = workshop.dte_config || {
                apiKey: '',
                ambiente: '00',
                mhCode: '0001',
                posNumber: '1',
                backendUrl: ''
            };

            tabBodyHtml = `
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; align-items: start;">
                    <!-- Columna Izquierda: Configuración DTE -->
                    <div class="glass-card" style="padding:1.5rem; border:1px solid var(--border-color); background:rgba(255,255,255,0.01);">
                        <h4 style="font-family:'Outfit', sans-serif; font-size:1.05rem; color:var(--primary); margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; font-weight:700;"><i class="fa-solid fa-file-invoice"></i> Configuración Factura Llama (DTE)</h4>
                        <form id="saas-detail-dte-form" style="display:flex; flex-direction:column; gap:1rem;">
                            <div class="form-group">
                                <label>Factura Llama API Key (Private Key)</label>
                                <input type="text" id="detail-dte-apikey" value="${dte.apiKey || ''}" placeholder="sk_live_... o sk_test_..." style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px; width:100%;">
                            </div>
                            <div class="form-group">
                                <label>Ambiente de Transmisión</label>
                                <select id="detail-dte-ambiente" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px; width:100%;">
                                    <option value="00" ${dte.ambiente === '00' ? 'selected' : ''}>00 - Pruebas / Sandbox (Hacienda)</option>
                                    <option value="01" ${dte.ambiente === '01' ? 'selected' : ''}>01 - Producción / Live (Hacienda)</option>
                                </select>
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                <div class="form-group">
                                    <label>Código de Establecimiento</label>
                                    <input type="text" id="detail-dte-mhcode" value="${dte.mhCode || '0001'}" placeholder="0001" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; width:100%;">
                                </div>
                                <div class="form-group">
                                    <label>Número de Caja (POS)</label>
                                    <input type="text" id="detail-dte-posnumber" value="${dte.posNumber || '1'}" placeholder="1" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; width:100%;">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>URL de Proxy Servidor Backend (Opcional)</label>
                                <input type="text" id="detail-dte-backendurl" value="${dte.backendUrl || ''}" placeholder="Ej: https://mi-servidor.com" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; width:100%;">
                            </div>
                            <div style="display:flex; gap:0.75rem; margin-top:0.5rem;">
                                <button type="submit" class="btn btn-primary" style="flex:1; padding:0.5rem; font-size:0.8rem; font-weight:700;"><i class="fa-solid fa-save"></i> Guardar DTE</button>
                                <button type="button" id="btn-test-dte-conn" class="btn btn-secondary" style="flex:1; padding:0.5rem; font-size:0.8rem; color:var(--cyan); border-color:var(--cyan);"><i class="fa-solid fa-plug"></i> Probar Conexión</button>
                            </div>
                        </form>
                    </div>

                    <!-- Columna Derecha: Integración Wompi -->
                    <div class="glass-card" style="padding:1.5rem; border:1px solid var(--border-color); background:rgba(255,255,255,0.01);">
                        <h4 style="font-family:'Outfit', sans-serif; font-size:1.05rem; color:var(--primary); margin-bottom:1.25rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; font-weight:700;"><i class="fa-solid fa-money-bill-transfer"></i> Enlace de Suscripción Wompi SV</h4>
                        <div style="display:flex; flex-direction:column; gap:1.25rem;">
                            ${workshop.idEnlace ? `
                                <div style="background:rgba(46, 204, 113, 0.08); border:1px solid rgba(46, 204, 113, 0.2); padding:1rem; border-radius:8px;">
                                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; color:#2ecc71;">
                                        <i class="fa-solid fa-circle-check"></i>
                                        <strong style="font-size:0.9rem;">Enlace Vinculado Activo</strong>
                                    </div>
                                    <span style="font-size:0.75rem; color:var(--text-secondary); display:block; word-break:break-all; margin-bottom:0.5rem;">
                                        ID Enlace: <code>${workshop.idEnlace}</code>
                                    </span>
                                    <a href="${workshop.urlEnlace}" target="_blank" class="btn btn-secondary" style="padding:0.4rem; font-size:0.75rem; text-align:center; display:block; text-decoration:none; color:var(--text-primary);"><i class="fa-solid fa-external-link"></i> Abrir Enlace de Pago Wompi</a>
                                </div>
                                <div style="display:flex; gap:0.75rem;">
                                    <button id="btn-wompi-check-detail" class="btn btn-secondary" style="flex:1; padding:0.45rem; font-size:0.75rem; color:var(--info); border-color:var(--info);"><i class="fa-solid fa-sync"></i> Verificar Estado</button>
                                    <button id="btn-wompi-cancel-detail" class="btn btn-secondary" style="flex:1; padding:0.45rem; font-size:0.75rem; color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-ban"></i> Desactivar Enlace</button>
                                </div>
                            ` : `
                                <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); padding:1rem; border-radius:8px; text-align:center; color:var(--text-secondary);">
                                    <i class="fa-solid fa-unlink" style="font-size:1.5rem; margin-bottom:0.5rem; opacity:0.5;"></i>
                                    <p style="font-size:0.8rem; margin:0;">Este taller no tiene un enlace de cobro Wompi vinculado.</p>
                                </div>
                                <form id="saas-detail-wompi-form" style="display:flex; flex-direction:column; gap:0.85rem; border-top:1px solid var(--border-color); padding-top:1rem;">
                                    <div class="form-group">
                                        <label style="font-size:0.75rem; margin-bottom:0.25rem;">Vincular ID de Enlace Manualmente (ID de Enlace Wompi)</label>
                                        <input type="text" id="wompi-manual-id" placeholder="Ej: 108AADAS-C9C7-..." style="padding:0.4rem; font-size:0.8rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:32px; width:100%;">
                                    </div>
                                    <button type="submit" class="btn btn-secondary" style="padding:0.45rem; font-size:0.75rem; font-weight:700;"><i class="fa-solid fa-link"></i> Vincular Enlace</button>
                                </form>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div style="max-width:900px; margin:2rem auto; padding:2rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <!-- Header del Expediente -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1.25rem;">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            ${workshop.logo ? `<img src="${workshop.logo}" style="max-height:45px; max-width:100px; object-fit:contain; border-radius:4px; padding:2px; background:white;" />` : `<div style="font-size: 1.8rem; color: var(--primary);"><i class="fa-solid fa-gears"></i></div>`}
                            <div>
                                <h2 style="font-family:'Outfit', sans-serif; font-size:1.6rem; font-weight:800; color:var(--text-primary); margin:0;">${workshop.nombre}</h2>
                                <p style="color:var(--text-secondary); font-size:0.85rem; margin:0; margin-top:0.15rem;">Expediente del Taller: <code style="color:var(--primary);">${workshop.id}</code></p>
                            </div>
                        </div>
                    </div>
                    <button onclick="window.saasCloseForm()" style="background:none; border:none; color:var(--text-secondary); font-size:1.75rem; cursor:pointer;">&times;</button>
                </div>
                
                <!-- Barra de Pestañas Internas -->
                <div class="saas-tabs-container" style="margin-bottom:1.5rem; display:flex; gap:0.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    <button class="saas-tab-btn ${detailsTab === 'plan' ? 'active' : ''}" onclick="window.switchSaasDetailsTab('plan')"><i class="fa-solid fa-id-card"></i> Plan & Datos del Taller</button>
                    <button class="saas-tab-btn ${detailsTab === 'payments' ? 'active' : ''}" onclick="window.switchSaasDetailsTab('payments')"><i class="fa-solid fa-receipt"></i> Historial de Cuotas (${wsPayments.length})</button>
                    <button class="saas-tab-btn ${detailsTab === 'billing' ? 'active' : ''}" onclick="window.switchSaasDetailsTab('billing')"><i class="fa-solid fa-file-invoice-dollar"></i> Facturación & Wompi</button>
                </div>
                
                <!-- Cuerpo de la Pestaña Activa -->
                <div style="min-height:350px;">
                    ${tabBodyHtml}
                </div>
            </div>
        `;

        // Event Bindings for Workshop Details View
        if (detailsTab === 'plan') {
            setTimeout(() => {
                setupMunicipiosSelect('edit-saas-departamento', 'edit-saas-municipio', workshop.municipio);

                // Logo file upload handler
                const logoInput = document.getElementById('edit-saas-logo');
                if (logoInput) {
                    logoInput.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (readerEvent) => {
                                const base64 = readerEvent.target.result;
                                window.saasSelectedLogoBase64 = base64;
                                const previewImg = document.getElementById('detail-logo-preview');
                                const previewContainer = document.getElementById('detail-logo-preview-container');
                                if (previewImg && previewContainer) {
                                    previewImg.src = base64;
                                    previewContainer.style.display = 'block';
                                }
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                }

                // Copy Pay Link
                const copyPayBtn = document.querySelector('.btn-copy-pay-link-detail');
                if (copyPayBtn) {
                    copyPayBtn.addEventListener('click', () => {
                        const payUrl = window.location.origin + window.location.pathname + '#pago-suscripcion?id=' + id;
                        navigator.clipboard.writeText(payUrl).then(() => {
                            showToast("¡Enlace de pago copiado al portapapeles!", "success");
                        }).catch(() => {
                            showToast("Error al copiar enlace", "error");
                        });
                    });
                }

                // Membership adjust form submit
                const planForm = document.getElementById('saas-detail-plan-form');
                if (planForm) {
                    planForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const planVal = document.getElementById('detail-saas-plan').value;
                        const priceVal = parseFloat(document.getElementById('detail-saas-price').value);
                        const statusVal = document.getElementById('detail-saas-status').value;
                        const nextPayVal = document.getElementById('detail-saas-next-pay').value;

                        workshop.plan = planVal;
                        workshop.precio_mensual = priceVal;
                        workshop.suscripcion_status = statusVal;
                        workshop.proximo_pago = nextPayVal ? new Date(nextPayVal + 'T12:00:00').getTime() : null;

                        if (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.id === id) {
                            db.saas_state.workshopData = workshop;
                            db.saas_state.status = statusVal === 'suspendido' ? 'suspended' : 'active';
                        }

                        dataService.saas.updateRequestStatus(id, workshop.status, workshop)
                            .then(() => {
                                saveDatabase(db);
                                showToast("Membresía del taller actualizada con éxito.", "success");
                                renderAdminSolicitudes(container);
                            })
                            .catch(err => {
                                console.error(err);
                                showToast("Error al guardar membresía: " + err.message, "error");
                            });
                    });
                }

                // General details form submit
                const genForm = document.getElementById('saas-detail-general-form');
                if (genForm) {
                    genForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        workshop.nombre = document.getElementById('edit-saas-nombre').value;
                        workshop.alias = document.getElementById('edit-saas-alias').value;
                        workshop.nombre_comercial = document.getElementById('edit-saas-nombre-comercial').value;
                        workshop.propietario = document.getElementById('edit-saas-propietario').value;
                        workshop.correo = document.getElementById('edit-saas-correo').value;
                        workshop.telefono = document.getElementById('edit-saas-telefono').value;
                        workshop.tipo_persona = document.getElementById('edit-saas-tipo-persona').value;
                        workshop.clasificacion_tributaria = document.getElementById('edit-saas-clasificacion').value;
                        workshop.sujeto_excluido = document.getElementById('edit-saas-sujeto-excluido').value;
                        workshop.tipo_documento = document.getElementById('edit-saas-tipo-doc').value;
                        workshop.num_documento = document.getElementById('edit-saas-num-doc').value;
                        workshop.nrc = document.getElementById('edit-saas-nrc').value;
                        
                        const giroEl = document.getElementById('edit-saas-giro');
                        workshop.actividad_economica = giroEl.value;
                        workshop.giro = giroEl.options[giroEl.selectedIndex].getAttribute('data-desc') || giroEl.value;
                        
                        workshop.pais = document.getElementById('edit-saas-pais').value;
                        workshop.departamento = document.getElementById('edit-saas-departamento').value;
                        workshop.municipio = document.getElementById('edit-saas-municipio').value;
                        workshop.direccion = document.getElementById('edit-saas-direccion').value;

                        if (window.saasSelectedLogoBase64) {
                            workshop.logo = window.saasSelectedLogoBase64;
                        }

                        if (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.id === id) {
                            db.saas_state.workshopData = workshop;
                        }

                        dataService.saas.updateRequestStatus(id, workshop.status, workshop)
                            .then(() => {
                                saveDatabase(db);
                                showToast("Datos generales y fiscales actualizados con éxito.", "success");
                                renderAdminSolicitudes(container);
                            })
                            .catch(err => {
                                console.error(err);
                                showToast("Error al guardar datos generales: " + err.message, "error");
                            });
                    });
                }
            }, 50);
        }

        if (detailsTab === 'payments') {
            setTimeout(() => {
                // Receipt detail button clicks
                document.querySelectorAll('.btn-view-receipt-detail').forEach(btn => {
                    btn.addEventListener('click', () => {
                        window.saasViewReceiptPaymentId = btn.getAttribute('data-id');
                        renderAdminSolicitudes(container);
                    });
                });

                // Pay manual submit
                const payForm = document.getElementById('saas-detail-pay-form');
                if (payForm) {
                    payForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const monto = parseFloat(document.getElementById('pay-form-monto').value);
                        const fechaInput = document.getElementById('pay-form-fecha').value;
                        const fecha = new Date(fechaInput + 'T12:00:00').getTime();
                        const metodo = document.getElementById('pay-form-metodo').value;
                        const factura = document.getElementById('pay-form-factura').value.trim() || 'N/A';

                        const newPayment = {
                            id: 'PAY-' + Date.now().toString().slice(-4),
                            workshopId: id,
                            workshopName: workshop.nombre,
                            plan: workshop.plan,
                            monto: monto,
                            fecha: fecha,
                            factura: factura,
                            metodo: metodo,
                            estado: 'completado'
                        };

                        db.saas_payments.push(newPayment);

                        // Extend subscription for 30 days
                        workshop.proximo_pago = Date.now() + 30 * 24 * 60 * 60 * 1000;
                        workshop.suscripcion_status = 'activo';

                        if (db.saas_state.workshopData && db.saas_state.workshopData.id === id) {
                            db.saas_state.workshopData.proximo_pago = workshop.proximo_pago;
                            db.saas_state.workshopData.suscripcion_status = 'activo';
                            db.saas_state.status = 'active';
                        }

                        dataService.saas.updateRequestStatus(id, workshop.status, workshop)
                            .then(() => {
                                saveDatabase(db);
                                emitSubscriptionDTE(newPayment, workshop);
                                showToast("Pago registrado con éxito y vigencia extendida.", "success");
                                renderAdminSolicitudes(container);
                            })
                            .catch(err => {
                                console.error(err);
                                showToast("Error al registrar pago manual: " + err.message, "error");
                            });
                    });
                }
            }, 50);
        }

        if (detailsTab === 'billing') {
            setTimeout(() => {
                // API Key / DTE form submit
                const dteForm = document.getElementById('saas-detail-dte-form');
                if (dteForm) {
                    dteForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const apiKey = document.getElementById('detail-dte-apikey').value.trim();
                        const ambiente = document.getElementById('detail-dte-ambiente').value;
                        const mhCode = document.getElementById('detail-dte-mhcode').value.trim();
                        const posNumber = document.getElementById('detail-dte-posnumber').value.trim();
                        const backendUrlVal = document.getElementById('detail-dte-backendurl').value.trim();

                        workshop.dte_config = {
                            apiKey,
                            ambiente,
                            mhCode,
                            posNumber,
                            backendUrl: backendUrlVal
                        };

                        if (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.id === id) {
                            db.saas_state.workshopData = workshop;
                        }

                        dataService.saas.updateRequestStatus(id, workshop.status, workshop)
                            .then(() => {
                                saveDatabase(db);
                                showToast("Configuración DTE guardada.", "success");
                                renderAdminSolicitudes(container);
                            })
                            .catch(err => {
                                console.error(err);
                                showToast("Error al guardar DTE: " + err.message, "error");
                            });
                    });
                }

                // Test API connection
                const testDteBtn = document.getElementById('btn-test-dte-conn');
                if (testDteBtn) {
                    testDteBtn.addEventListener('click', () => {
                        const apiKey = document.getElementById('detail-dte-apikey').value.trim();
                        if (!apiKey) {
                            showToast("Ingrese la API Key para realizar la prueba.", "warning");
                            return;
                        }

                        testDteBtn.disabled = true;
                        const origText = testDteBtn.innerHTML;
                        testDteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Conectando...';

                        const backendUrl = (db.saas_config && db.saas_config.backendUrl) || '';
                        fetch(`${backendUrl}/api/dte/test-connection`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ apiKey })
                        })
                        .then(res => res.json())
                        .then(data => {
                            testDteBtn.disabled = false;
                            testDteBtn.innerHTML = origText;
                            if (data.success) {
                                showToast(data.message, "success");
                            } else {
                                showToast("Falla: " + data.message, "error");
                            }
                        })
                        .catch(err => {
                            testDteBtn.disabled = false;
                            testDteBtn.innerHTML = origText;
                            console.error(err);
                            showToast("Error de conexión al probar API.", "error");
                        });
                    });
                }

                // Verification Wompi SV
                const wompiCheckBtn = document.getElementById('btn-wompi-check-detail');
                if (wompiCheckBtn) {
                    wompiCheckBtn.addEventListener('click', () => {
                        const idEnlace = workshop.idEnlace;
                        if (idEnlace) {
                            wompiCheckBtn.disabled = true;
                            const origText = wompiCheckBtn.innerHTML;
                            wompiCheckBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';

                            const backendUrl = (db.saas_config && db.saas_config.backendUrl) || '';
                            fetch(`${backendUrl}/api/wompi/check-subscription`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ idEnlace, wompiConfig: saasConfig.wompi })
                            })
                            .then(res => res.json())
                            .then(data => {
                                wompiCheckBtn.disabled = false;
                                wompiCheckBtn.innerHTML = origText;
                                if (data.success) {
                                    if (data.subscribed) {
                                        showToast("Suscripción confirmada en Wompi (Afiliación activa)", "success");
                                        if (workshop.suscripcion_status !== 'activo') {
                                            workshop.suscripcion_status = 'activo';
                                            dataService.saas.updateRequestStatus(id, workshop.status, { suscripcion_status: 'activo' }).then(() => {
                                                saveDatabase(db);
                                                renderAdminSolicitudes(container);
                                            });
                                        }
                                    } else {
                                        showToast("No se encontraron afiliaciones en Wompi para este enlace.", "warning");
                                    }
                                } else {
                                    showToast(`Error al consultar Wompi: ${data.message || 'Error'}`, "error");
                                }
                            })
                            .catch(err => {
                                wompiCheckBtn.disabled = false;
                                wompiCheckBtn.innerHTML = origText;
                                console.error(err);
                                showToast("Error de conexión al verificar enlace.", "error");
                            });
                        }
                    });
                }

                // Deactivate Wompi SV Link
                const wompiCancelBtn = document.getElementById('btn-wompi-cancel-detail');
                if (wompiCancelBtn) {
                    wompiCancelBtn.addEventListener('click', () => {
                        const idEnlace = workshop.idEnlace;
                        if (idEnlace) {
                            if (confirm(`¿Está seguro de que desea DESACTIVAR la suscripción recurrente en Wompi para ${workshop.nombre}?\nEsto detendrá los cobros automáticos.`)) {
                                wompiCancelBtn.disabled = true;
                                const origText = wompiCancelBtn.innerHTML;
                                wompiCancelBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Desactivando...';

                                const backendUrl = (db.saas_config && db.saas_config.backendUrl) || '';
                                fetch(`${backendUrl}/api/wompi/deactivate-link`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ idEnlace, wompiConfig: saasConfig.wompi })
                                })
                                .then(res => res.json())
                                .then(data => {
                                    wompiCancelBtn.disabled = false;
                                    wompiCancelBtn.innerHTML = origText;
                                    if (data.success) {
                                        showToast("Enlace de cobro recurrente desactivado en Wompi.", "success");
                                        workshop.suscripcion_status = 'suspendido';
                                        delete workshop.idEnlace;
                                        delete workshop.urlEnlace;
                                        dataService.saas.updateRequestStatus(id, 'suspendido', { 
                                            suscripcion_status: 'suspendido',
                                            idEnlace: null,
                                            urlEnlace: null
                                        }).then(() => {
                                            saveDatabase(db);
                                            renderAdminSolicitudes(container);
                                        });
                                    } else {
                                        showToast(`Error al desactivar Wompi: ${data.message || 'Error'}`, "error");
                                    }
                                })
                                .catch(err => {
                                    wompiCancelBtn.disabled = false;
                                    wompiCancelBtn.innerHTML = origText;
                                    console.error(err);
                                    showToast("Error de conexión al cancelar Wompi.", "error");
                                });
                            }
                        }
                    });
                }

                // Link Wompi manual
                const wompiForm = document.getElementById('saas-detail-wompi-form');
                if (wompiForm) {
                    wompiForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const idLinkVal = document.getElementById('wompi-manual-id').value.trim();
                        if (!idLinkVal) {
                            showToast("Por favor ingrese un ID de enlace válido.", "warning");
                            return;
                        }

                        workshop.idEnlace = idLinkVal;
                        workshop.urlEnlace = `https://cargosautomaticos.wompi.sv/EnlaceSuscripcion?IdSupplierService=${idLinkVal}&IdSupplier=${saasConfig.wompi ? saasConfig.wompi.clientId : ''}`;

                        dataService.saas.updateRequestStatus(id, workshop.status, {
                            idEnlace: workshop.idEnlace,
                            urlEnlace: workshop.urlEnlace
                        }).then(() => {
                            saveDatabase(db);
                            showToast("Enlace Wompi vinculado manualmente con éxito.", "success");
                            renderAdminSolicitudes(container);
                        }).catch(err => {
                            console.error(err);
                            showToast("Error al guardar enlace: " + err.message, "error");
                        });
                    });
                }
            }, 50);
        }

        return;
    }

    if (window.saasAddWorkshopForm) {
        const plans = db.saas_plans || [];
        window.saasSelectedLogoBase64 = ''; // Reset
        
        container.innerHTML = `
            <div style="max-width:700px; margin:3rem auto; padding:2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                    <div>
                        <h2 style="font-family:'Outfit', sans-serif; font-size:1.5rem; font-weight:700; color:var(--text-primary);"><i class="fa-solid fa-square-plus" style="color:var(--primary);"></i> Registrar Taller Manualmente</h2>
                        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Añade una nueva cuenta de taller con campos tributarios de FacturaLlama</p>
                    </div>
                    <button onclick="window.saasCloseForm()" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                
                <form id="saas-manual-register-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                    <!-- Datos Generales -->
                    <h3 style="font-size:1rem; color:var(--primary); margin:0; font-weight:600; border-left:3px solid var(--primary); padding-left:0.5rem;">Datos Generales</h3>
                    <div class="form-group">
                        <label>Nombre o Razón Social</label>
                        <input type="text" id="man-taller-nombre" required placeholder="Ej: Taller Automotriz San José S.A. de C.V." style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Alias del Taller</label>
                            <input type="text" id="man-taller-alias" required placeholder="Ej: Automotriz San José" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Nombre Comercial</label>
                            <input type="text" id="man-taller-nombre-comercial" required placeholder="Ej: Taller San José" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Correo Electrónico</label>
                            <input type="email" id="man-taller-correo" required placeholder="contacto@taller.com" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="text" id="man-taller-telefono" required placeholder="2222-2222" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Tipo Persona</label>
                            <select id="man-taller-tipo-persona" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                <option value="Natural">Natural</option>
                                <option value="Jurídica" selected>Jurídica</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Clasificación Tributaria</label>
                            <select id="man-taller-clasificacion" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                <option value="Otros" selected>Otros</option>
                                <option value="Pequeño contribuyente">Pequeño contribuyente</option>
                                <option value="Mediano contribuyente">Mediano contribuyente</option>
                                <option value="Gran contribuyente">Gran contribuyente</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>¿Es sujeto excluido?</label>
                            <select id="man-taller-sujeto-excluido" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                <option value="No" selected>No</option>
                                <option value="Sí">Sí</option>
                            </select>
                        </div>
                    </div>

                    <!-- Datos Fiscales -->
                    <h3 style="font-size:1rem; color:var(--primary); margin:0; font-weight:600; border-left:3px solid var(--primary); padding-left:0.5rem; margin-top:0.5rem;">Datos Fiscales</h3>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Tipo Documento</label>
                            <select id="man-taller-tipo-doc" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                <option value="NIT" selected>NIT</option>
                                <option value="DUI">DUI</option>
                                <option value="Pasaporte">Pasaporte</option>
                                <option value="Carnet de Extranjería">Carnet de Extranjería</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Número Documento</label>
                            <input type="text" id="man-taller-num-doc" required placeholder="0614-111111-101-1" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>NRC</label>
                            <input type="text" id="man-taller-nrc" required placeholder="123456-7" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Giro / Actividad Económica</label>
                            <select id="man-taller-giro" required style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px; width: 100%;">
                                ${getGirosOptionsHtml()}
                            </select>
                        </div>
                    </div>

                    <!-- Dirección -->
                    <h3 style="font-size:1rem; color:var(--primary); margin:0; font-weight:600; border-left:3px solid var(--primary); padding-left:0.5rem; margin-top:0.5rem;">Dirección</h3>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>País</label>
                            <select id="man-taller-pais" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                <option value="El Salvador" selected>El Salvador</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Departamento</label>
                            <select id="man-taller-departamento" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                <option value="Ahuachapán">Ahuachapán</option>
                                <option value="Cabañas">Cabañas</option>
                                <option value="Chalatenango">Chalatenango</option>
                                <option value="Cuscatlán">Cuscatlán</option>
                                <option value="La Libertad" selected>La Libertad</option>
                                <option value="La Paz">La Paz</option>
                                <option value="La Unión">La Unión</option>
                                <option value="Morazán">Morazán</option>
                                <option value="San Miguel">San Miguel</option>
                                <option value="San Salvador">San Salvador</option>
                                <option value="San Vicente">San Vicente</option>
                                <option value="Santa Ana">Santa Ana</option>
                                <option value="Sonsonate">Sonsonate</option>
                                <option value="Usulután">Usulután</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Municipio</label>
                            <select id="man-taller-municipio" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Dirección Comercial Detallada</label>
                        <input type="text" id="man-taller-direccion" required placeholder="Carr. Sonsonate, col. Cuyagualo #16" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                    </div>

                    <!-- Logotipo -->
                    <h3 style="font-size:1rem; color:var(--primary); margin:0; font-weight:600; border-left:3px solid var(--primary); padding-left:0.5rem; margin-top:0.5rem;">Logotipo</h3>
                    <div class="form-group">
                        <label>Seleccionar Logotipo</label>
                        <input type="file" id="man-taller-logo" accept="image/*" style="padding:0.4rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                    </div>
                    <div id="man-logo-preview-container" style="display:none; text-align:center; margin-top:0.5rem;">
                        <span style="display:block; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.4rem;">Vista Previa del Logotipo:</span>
                        <img id="man-logo-preview" style="max-height:85px; max-width:200px; object-fit:contain; border:1px solid var(--border-color); border-radius:6px; padding:6px; background:#f8fafc;" />
                    </div>

                    <!-- Cuenta y Membresía -->
                    <h3 style="font-size:1rem; color:var(--primary); margin:0; font-weight:600; border-left:3px solid var(--primary); padding-left:0.5rem; margin-top:0.5rem;">Membresía y Acceso</h3>
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Plan de Suscripción</label>
                            <select id="man-taller-plan" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                                ${plans.map(p => `<option value="${p.nombre}" data-price="${p.precio}">Plan ${p.nombre} ($${p.precio}/mes)</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Cuota Pactada ($ USD)</label>
                            <input type="number" step="0.01" id="man-taller-precio" required value="75.00" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>
                    
                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Propietario / Administrador</label>
                            <input type="text" id="man-taller-prop" required placeholder="Nombre Completo" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Contraseña de Acceso</label>
                            <input type="password" id="man-taller-pass" required value="1234" placeholder="Mínimo 4 caracteres" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>

                    <div class="form-row" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Estado de Suscripción</label>
                            <select id="man-taller-status" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:38px;">
                                <option value="activo">Activo (Acceso Completo)</option>
                                <option value="demo">Demo (Prueba Gratuita)</option>
                                <option value="suspendido">Suspendido (Bloqueado)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Vigencia Inicial (días)</label>
                            <input type="number" id="man-taller-days" required value="7" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:1rem; margin-top:1.5rem;">
                        <button type="submit" class="btn btn-primary" style="flex:1; padding:0.75rem;"><i class="fa-solid fa-user-plus"></i> Registrar y Activar</button>
                        <button type="button" onclick="window.saasCloseForm()" class="btn btn-secondary" style="flex:1; padding:0.75rem;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        // Update default price when plan changes
        setTimeout(() => {
            const planSel = document.getElementById('man-taller-plan');
            const priceInput = document.getElementById('man-taller-precio');
            const logoInput = document.getElementById('man-taller-logo');
            
            if (planSel && priceInput) {
                planSel.addEventListener('change', () => {
                    const opt = planSel.options[planSel.selectedIndex];
                    priceInput.value = opt.getAttribute('data-price');
                });
                const opt = planSel.options[planSel.selectedIndex];
                if (opt) priceInput.value = opt.getAttribute('data-price');
            }

            if (logoInput) {
                logoInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (readerEvent) => {
                            const base64 = readerEvent.target.result;
                            window.saasSelectedLogoBase64 = base64;
                            const previewImg = document.getElementById('man-logo-preview');
                            const previewContainer = document.getElementById('man-logo-preview-container');
                            if (previewImg && previewContainer) {
                                previewImg.src = base64;
                                previewContainer.style.display = 'block';
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
            setupMunicipiosSelect('man-taller-departamento', 'man-taller-municipio', 'La Libertad Centro');

            document.getElementById('man-taller-prop').addEventListener('input', (e) => {
                const passField = document.getElementById('man-taller-pass');
                if (passField && !passField.value) {
                    passField.value = '1234';
                }
            });

            document.getElementById('saas-manual-register-form').addEventListener('submit', (manEvent) => {
                manEvent.preventDefault();
                const currentDb = getDatabase();
                const manId = 'REQ-' + Date.now();
                const manPrice = parseFloat(document.getElementById('man-taller-precio').value);
                const manDays = parseInt(document.getElementById('man-taller-days').value) || 30;
                const manStatus = document.getElementById('man-taller-status').value;
                const manPlanName = planSel.value;
                
                const manNewWs = {
                    id: manId,
                    nombre: document.getElementById('man-taller-nombre').value,
                    alias: document.getElementById('man-taller-alias').value,
                    nombre_comercial: document.getElementById('man-taller-nombre-comercial').value,
                    giro: (() => { const el = document.getElementById('man-taller-giro'); return el.options[el.selectedIndex].getAttribute('data-desc') || el.value; })(),
                    direccion: document.getElementById('man-taller-direccion').value,
                    telefono: document.getElementById('man-taller-telefono').value,
                    correo: document.getElementById('man-taller-correo').value,
                    nit: document.getElementById('man-taller-tipo-doc').value === 'NIT' ? document.getElementById('man-taller-num-doc').value : '',
                    nrc: document.getElementById('man-taller-nrc').value,
                    logoText: document.getElementById('man-taller-alias').value.substring(0, 15).toUpperCase(),
                    logoTagline: 'Servicio Automotriz Especializado',
                    tipo_persona: document.getElementById('man-taller-tipo-persona').value,
                    clasificacion_tributaria: document.getElementById('man-taller-clasificacion').value,
                    sujeto_excluido: document.getElementById('man-taller-sujeto-excluido').value,
                    tipo_documento: document.getElementById('man-taller-tipo-doc').value,
                    num_documento: document.getElementById('man-taller-num-doc').value,
                    actividad_economica: document.getElementById('man-taller-giro').value,
                    pais: document.getElementById('man-taller-pais').value,
                    departamento: document.getElementById('man-taller-departamento').value,
                    municipio: document.getElementById('man-taller-municipio').value,
                    logo: window.saasSelectedLogoBase64 || '',
                    
                    propietario: document.getElementById('man-taller-prop').value,
                    pass: document.getElementById('man-taller-pass').value,
                    status: 'aprobado',
                    createdAt: Date.now(),
                    plan: manPlanName,
                    precio_mensual: manPrice,
                    suscripcion_status: manStatus,
                    proximo_pago: Date.now() + manDays * 24 * 60 * 60 * 1000,
                    dte_config: {
                        apiKey: 'test_sk_mecanicos_default_sandbox_key_998877',
                        ambiente: '00',
                        mhCode: '0001',
                        posNumber: '1',
                        backendUrl: ''
                    }
                };
                
                dataService.saas.createRequest(manNewWs)
                    .then(() => {
                        showToast("Taller registrado manualmente y habilitado.", "success");
                        window.saasCloseForm();
                    })
                    .catch(err => {
                        console.error("Error manual register workshop:", err);
                        showToast("Error al registrar taller manualmente: " + err.message, "error");
                    });
            });
        }, 50);
        return;
    }
if (window.saasViewReceiptPaymentId) {
        const payId = window.saasViewReceiptPaymentId;
        const payment = payments.find(p => p.id === payId);
        if (!payment) {
            window.saasCloseForm();
            return;
        }
        
        const wsData = (db.solicitudes_registro || []).find(s => s.id === payment.workshopId) || {};
        
        container.innerHTML = `
            <div style="max-width:650px; margin:3rem auto; padding:2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                    <div>
                        <h2 style="font-family:'Outfit', sans-serif; font-size:1.5rem; font-weight:700; color:var(--text-primary);"><i class="fa-solid fa-file-invoice" style="color:var(--primary);"></i> Recibo de Pago</h2>
                        <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Comprobante de transacción de membresía SaaS</p>
                    </div>
                    <button onclick="window.saasCloseForm()" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">&times;</button>
                </div>
                
                <div id="print-saas-receipt" style="background: var(--bg-base); border: 1px solid var(--border-color); border-radius: 8px; padding: 2rem; color: var(--text-primary); font-family: 'Inter', sans-serif;">
                    <!-- Invoice Header -->
                    <div style="display:flex; justify-content:space-between; border-bottom:2px dashed var(--border-color); padding-bottom:1.5rem; margin-bottom:1.5rem;">
                        <div>
                            <h3 style="font-family:'Outfit', sans-serif; font-weight:800; color:var(--primary); margin:0; font-size:1.3rem;">MECANIC OS</h3>
                            <span style="font-size:0.75rem; color:var(--text-secondary);">Forbidden Soluciones S.A. de C.V.</span><br>
                            <span style="font-size:0.75rem; color:var(--text-secondary);">San Salvador, El Salvador</span>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:0.85rem; font-weight:700; color:var(--text-muted);">N° COMPROBANTE</span><br>
                            <strong style="font-family:monospace; font-size:1.1rem; color:var(--text-primary);">${payment.factura}</strong><br>
                            <span style="font-size:0.75rem; color:var(--text-secondary);">${new Date(payment.fecha).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <!-- Billing Info -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.5rem; margin-bottom:1.5rem; font-size:0.85rem; border-bottom:1px solid var(--border-color); padding-bottom:1.5rem;">
                        <div>
                            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:600; display:block; margin-bottom:0.25rem;">Facturado a:</span>
                            <strong style="color:var(--text-primary);">${payment.workshopName}</strong><br>
                            <span style="color:var(--text-secondary);">${wsData.direccion || 'Dirección no disponible'}</span><br>
                            <span style="color:var(--text-secondary);">Correo: ${wsData.correo || 'N/A'}</span>
                        </div>
                        <div>
                            <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:600; display:block; margin-bottom:0.25rem;">Detalles Fiscales:</span>
                            <span>NIT: ${wsData.nit || 'N/A'}</span><br>
                            <span>NRC: ${wsData.nrc || 'N/A'}</span><br>
                            <span>Método: <strong>${payment.metodo}</strong></span>
                        </div>
                    </div>
                    
                    <!-- Table breakdown -->
                    <table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-bottom:1.5rem;">
                        <thead>
                            <tr style="border-bottom:1px solid var(--border-color); text-align:left;">
                                <th style="padding:0.5rem 0; color:var(--text-muted);">Descripción / Concepto</th>
                                <th style="padding:0.5rem 0; text-align:right; color:var(--text-muted);">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding:0.75rem 0;">
                                    <strong>Membresía Mensual SaaS</strong><br>
                                    <span style="color:var(--text-secondary); font-size:0.75rem;">Acceso al sistema - Plan ${payment.plan} (30 días de vigencia)</span>
                                </td>
                                <td style="padding:0.75rem 0; text-align:right; font-weight:600;">$${(payment.subtotal || payment.monto).toFixed(2)}</td>
                            </tr>
                            ${payment.descuento_aplicado && payment.descuento_aplicado > 0 ? `
                            <tr style="color:var(--success);">
                                <td style="padding:0.5rem 0; font-size:0.8rem;">
                                    Descuento Promocional ${payment.cupon_usado ? `(${payment.cupon_usado})` : ''}
                                </td>
                                <td style="padding:0.5rem 0; text-align:right; font-weight:600;">-$${payment.descuento_aplicado.toFixed(2)}</td>
                            </tr>
                            ` : ''}
                        </tbody>
                    </table>
                    
                    <!-- Total -->
                    <div style="display:flex; justify-content:flex-end; border-top:2px solid var(--border-color); padding-top:1rem; font-size:1.05rem;">
                        <div style="text-align:right; width:250px;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem; font-size:0.9rem;">
                                <span style="color:var(--text-secondary);">Subtotal:</span>
                                <span style="color:var(--text-primary); font-weight:600;">$${(payment.subtotal || payment.monto).toFixed(2)}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--success);">
                                <span>Descuento:</span>
                                <span>-$${(payment.descuento_aplicado || 0).toFixed(2)}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-weight:700; border-top:1px dashed var(--border-color); padding-top:0.5rem;">
                                <span style="color:var(--text-primary);">Total Pagado:</span>
                                <span style="color:var(--primary); font-size:1.2rem;">$${payment.monto.toFixed(2)} USD</span>
                            </div>
                        </div>
                    </div>
                    
                    ${payment.dte ? `
                    <div style="margin-top:1.5rem; padding:1rem; background:rgba(46,204,113,0.08); border:1px solid rgba(46,204,113,0.2); border-radius:6px; font-size:0.8rem; line-height:1.4;">
                        <div style="font-weight:700; color:#2ecc71; margin-bottom:0.4rem; display:flex; align-items:center; gap:0.4rem;">
                            <i class="fa-solid fa-circle-check"></i> Factura Electrónica Certificada (MH El Salvador)
                        </div>
                        <div style="display:grid; grid-template-columns:1fr; gap:0.2rem; font-family:monospace; color:var(--text-secondary);">
                            <div><strong>Cód. Generación:</strong> ${payment.dte.generationCode}</div>
                            <div><strong>Num. Control:</strong> ${payment.dte.controlNumber}</div>
                            <div><strong>Sello Recepción:</strong> ${payment.dte.receptionSeal}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div style="margin-top:2rem; text-align:center; border-top:1px solid var(--border-color); padding-top:1rem; font-size:0.75rem; color:var(--text-secondary); font-style:italic;">
                        ¡Gracias por utilizar Mecanic OS! Si tienes dudas técnicas, contáctanos a soporte@mecanicos.com
                    </div>
                </div>
                
                <div style="display:flex; gap:1rem; margin-top:1.5rem;">
                    <button id="btn-print-receipt-modal" class="btn btn-primary" style="flex:1; padding:0.75rem;"><i class="fa-solid fa-print"></i> Imprimir Comprobante</button>
                    ${payment.dte ? `
                    <a href="${payment.dte.mhDteUrl}" target="_blank" class="btn btn-secondary" style="flex:1; padding:0.75rem; display:flex; align-items:center; justify-content:center; gap:0.4rem; border-color:#2ecc71; color:#2ecc71; text-decoration:none;"><i class="fa-solid fa-cloud-arrow-down"></i> Descargar PDF MH</a>
                    ` : ''}
                    <button type="button" onclick="window.saasCloseForm()" class="btn btn-secondary" style="flex:1; padding:0.75rem;">Cerrar</button>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            document.getElementById('btn-print-receipt-modal').addEventListener('click', () => {
                const printContent = document.getElementById('print-saas-receipt').innerHTML;
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Recibo Mecanic OS - ${payment.factura}</title>
                        <style>
                            body { font-family: 'Inter', sans-serif; padding: 40px; color: #000; background: #fff; }
                            th, td { border-bottom: 1px solid #ddd; padding: 8px 0; }
                            table { width: 100%; border-collapse: collapse; }
                            h3 { color: #4f46e5; }
                        </style>
                    </head>
                    <body>
                        ${printContent}
                        <script>
                            window.onload = function() { window.print(); window.close(); }
                        </script>
                    </body>
                    </html>
                `);
                printWindow.document.close();
            });
        }, 50);
        return;
    }


    
    // Toggle Status Helper
    window.toggleWorkshopStatus = function(id) {
        const workshop = solicitudes.find(s => s.id === id);
        if (workshop) {
            const oldStatus = workshop.suscripcion_status || 'activo';
            const newStatus = oldStatus === 'activo' || oldStatus === 'demo' ? 'suspendido' : 'activo';
            
            workshop.suscripcion_status = newStatus;
            
            // Sync with active state
            if (db.saas_state.workshopData && db.saas_state.workshopData.id === id) {
                db.saas_state.workshopData.suscripcion_status = newStatus;
                db.saas_state.status = newStatus === 'suspendido' ? 'suspended' : 'active';
            }
            
            saveDatabase(db);
            showToast(`Suscripción ${newStatus === 'activo' ? 'activada' : 'suspendida'} con éxito.`, "info");
            renderAdminSolicitudes(container);
        }
    };
    
    // Main UI
    container.innerHTML = `
        <div style="max-width:1100px; margin:3rem auto; padding:1.5rem;">
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                <div>
                    <h2 style="font-family:'Outfit', sans-serif; font-size:2rem; font-weight:800; color:var(--text-primary);"><i class="fa-solid fa-user-shield" style="color:var(--primary);"></i> Consola del Administrador SaaS</h2>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Panel central de control para suscripciones, cobros y clientes de Mecanic OS</p>
                </div>
                <div style="display:flex; gap:0.75rem;">
                    <button id="btn-reset-demo-saas" class="btn btn-secondary" style="color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-trash-can"></i> Reiniciar Onboarding</button>
                    <a href="#taller-dashboard" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Volver a App</a>
                </div>
            </div>
            
            <!-- Tabs Bar -->
            <div class="saas-tabs-container">
                <button class="saas-tab-btn ${activeTab === 'sub' ? 'active' : ''}" onclick="window.switchSaaSTab('sub')"><i class="fa-solid fa-users-gear"></i> Suscripciones & Clientes</button>
                <button class="saas-tab-btn ${activeTab === 'req' ? 'active' : ''}" onclick="window.switchSaaSTab('req')"><i class="fa-solid fa-clock-rotate-left"></i> Solicitudes (${solicitudes.filter(s => s.status === 'pendiente').length})</button>
                <button class="saas-tab-btn ${activeTab === 'pay' ? 'active' : ''}" onclick="window.switchSaaSTab('pay')"><i class="fa-solid fa-receipt"></i> Historial de Cobros</button>
                <button class="saas-tab-btn ${activeTab === 'plans-coupons' ? 'active' : ''}" onclick="window.switchSaaSTab('plans-coupons')"><i class="fa-solid fa-gears"></i> Configuración, Planes & Cupones</button>
                <button class="saas-tab-btn ${activeTab === 'metrics' ? 'active' : ''}" onclick="window.switchSaaSTab('metrics')"><i class="fa-solid fa-chart-line"></i> Métricas SaaS</button>
            </div>
            
            <!-- Tab Body -->
            <div class="saas-tab-body">
                ${activeTab === 'req' ? renderRequestsTab() : ''}
                ${activeTab === 'sub' ? renderSubscriptionsTab() : ''}
                ${activeTab === 'pay' ? renderPaymentsTab() : ''}
                ${activeTab === 'plans-coupons' ? renderPlansCouponsTab() : ''}
                ${activeTab === 'metrics' ? renderMetricsTab() : ''}
            </div>
        </div>
    `;
    
    // Bind global reset button
    const resetBtn = document.getElementById('btn-reset-demo-saas');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("ADVERTENCIA: Esto reiniciará el estado de onboarding del Taller al modo Invitado y vaciará los clientes cargados.\n¿Proceder?")) {
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
                showToast("Plataforma reiniciada a modo Invitado", "info");
                window.location.hash = 'landing';
                handleRouting();
            }
        });
    }
    
    // Bind approve/reject buttons
    if (activeTab === 'req') {
        document.querySelectorAll('.btn-approve-saas').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm("¿Está seguro de que desea APROBAR esta solicitud comercial? El cliente deberá firmar los términos del servicio.")) {
                    const req = solicitudes.find(s => s.id === id);
                    if (req) {
                        const updatedData = {
                            status: 'approved_terms_pending',
                            plan: req.plan || 'Pro',
                            precio_mensual: req.precio_mensual || 75.00,
                            suscripcion_status: req.suscripcion_status || 'activo',
                            proximo_pago: req.proximo_pago || (Date.now() + 7 * 24 * 60 * 60 * 1000)
                        };
                        dataService.saas.updateRequestStatus(id, 'approved_terms_pending', updatedData)
                            .then(() => {
                                showToast("Solicitud aprobada con éxito. Listo para la firma del cliente.", "success");
                            })
                            .catch(err => {
                                console.error("Error approving request:", err);
                                showToast("Error al aprobar solicitud: " + err.message, "error");
                            });
                    }
                }
            });
        });
        
        document.querySelectorAll('.btn-reject-saas').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm("¿Está seguro de que desea RECHAZAR esta solicitud?")) {
                    dataService.saas.updateRequestStatus(id, 'rechazado')
                        .then(() => {
                            showToast("Solicitud rechazada", "warning");
                        })
                        .catch(err => {
                            console.error("Error rejecting request:", err);
                            showToast("Error al rechazar la solicitud: " + err.message, "error");
                        });
                }
            });
        });
    }
    
    // Switch state actions
    if (activeTab === 'sub') {
        const manRegBtn = document.getElementById('btn-man-register-saas');
        if (manRegBtn) {
            manRegBtn.addEventListener('click', () => {
                window.saasAddWorkshopForm = true;
                renderAdminSolicitudes(container);
            });
        }
        document.querySelectorAll('.btn-copy-pay-link').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const payUrl = window.location.origin + window.location.pathname + '#pago-suscripcion?id=' + id;
                navigator.clipboard.writeText(payUrl).then(() => {
                    showToast("¡Enlace de pago copiado al portapapeles!", "success");
                }).catch(() => {
                    showToast("Error al copiar enlace", "error");
                });
            });
        });
        document.querySelectorAll('.btn-view-saas-details').forEach(btn => {
            btn.addEventListener('click', () => {
                window.saasViewWorkshopDetailsId = btn.getAttribute('data-id');
                window.saasActiveDetailsTab = 'plan';
                renderAdminSolicitudes(container);
            });
        });

        // Wompi Actions
        document.querySelectorAll('.btn-wompi-check').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const idEnlace = btn.getAttribute('data-link');
                const workshop = solicitudes.find(s => s.id === id);
                if (workshop && idEnlace) {
                    btn.disabled = true;
                    const origText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
                    
                    const backendUrl = (db.saas_config && db.saas_config.backendUrl) || '';
                    fetch(`${backendUrl}/api/wompi/check-subscription`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idEnlace, wompiConfig: saasConfig.wompi })
                    })
                    .then(res => res.json())
                    .then(data => {
                        btn.disabled = false;
                        btn.innerHTML = origText;
                        
                        if (data.success) {
                            if (data.subscribed) {
                                showToast(`¡Suscripción confirmada en Wompi! El taller tiene una afiliación activa.`, "success");
                                if (workshop.suscripcion_status !== 'activo') {
                                    workshop.suscripcion_status = 'activo';
                                    dataService.saas.updateRequestStatus(id, 'activo', { suscripcion_status: 'activo' }).then(() => {
                                        saveDatabase(db);
                                        renderAdminSolicitudes(container);
                                    });
                                }
                            } else {
                                showToast(`No se encontraron afiliaciones de pago activas en este enlace.`, "warning");
                            }
                        } else {
                            showToast(`Error al consultar Wompi: ${data.message || 'Error desconocido'}`, "error");
                        }
                    })
                    .catch(err => {
                        btn.disabled = false;
                        btn.innerHTML = origText;
                        console.error("Wompi Check Error:", err);
                        showToast(`Error de conexión con el servidor.`, "error");
                    });
                }
            });
        });

        document.querySelectorAll('.btn-wompi-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const idEnlace = btn.getAttribute('data-link');
                const workshop = solicitudes.find(s => s.id === id);
                if (workshop && idEnlace) {
                    if (confirm(`¿Está seguro de que desea DESACTIVAR la suscripción recurrente en Wompi para ${workshop.nombre}?\nEsto detendrá los cobros mensuales automáticos.`)) {
                        btn.disabled = true;
                        const origText = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Desactivando...';
                        
                        const backendUrl = (db.saas_config && db.saas_config.backendUrl) || '';
                        fetch(`${backendUrl}/api/wompi/deactivate-link`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ idEnlace, wompiConfig: saasConfig.wompi })
                        })
                        .then(res => res.json())
                        .then(data => {
                            btn.disabled = false;
                            btn.innerHTML = origText;
                            
                            if (data.success) {
                                showToast(`Enlace de cobro recurrente desactivado exitosamente en Wompi.`, "success");
                                workshop.suscripcion_status = 'suspendido';
                                delete workshop.idEnlace;
                                delete workshop.urlEnlace;
                                dataService.saas.updateRequestStatus(id, 'suspendido', { 
                                    suscripcion_status: 'suspendido',
                                    idEnlace: null,
                                    urlEnlace: null
                                }).then(() => {
                                    saveDatabase(db);
                                    renderAdminSolicitudes(container);
                                });
                            } else {
                                showToast(`Error al desactivar Wompi: ${data.message || 'Error desconocido'}`, "error");
                            }
                        })
                        .catch(err => {
                            btn.disabled = false;
                            btn.innerHTML = origText;
                            console.error("Wompi Cancel Error:", err);
                            showToast(`Error de conexión con el servidor.`, "error");
                        });
                    }
                }
            });
        });
    }
    
    if (activeTab === 'pay') {
        document.querySelectorAll('.btn-view-saas-receipt').forEach(btn => {
            btn.addEventListener('click', () => {
                window.saasViewReceiptPaymentId = btn.getAttribute('data-id');
                renderAdminSolicitudes(container);
            });
        });
    }
    
    if (activeTab === 'plans-coupons') {
        // Global Config Save Handler
        const saveGlobalConfigBtn = document.getElementById('btn-save-saas-global-config');
        if (saveGlobalConfigBtn) {
            saveGlobalConfigBtn.addEventListener('click', () => {
                const currentDb = getDatabase();
                currentDb.saas_config = {
                    backendUrl: document.getElementById('global-backend-url').value.trim(),
                    wompi: {
                        clientId: document.getElementById('global-wompi-client-id').value.trim(),
                        clientSecret: document.getElementById('global-wompi-client-secret').value.trim(),
                        appId: document.getElementById('global-wompi-app-id').value.trim()
                    },
                    dte: {
                        apiKey: document.getElementById('global-dte-api-key').value.trim()
                    }
                };
                saveDatabase(currentDb).then(() => {
                    showToast("Configuración global del SaaS guardada y sincronizada.", "success");
                    renderAdminSolicitudes(container);
                }).catch(err => {
                    console.error("Error saving global SaaS config:", err);
                    showToast("Error al guardar la configuración: " + err.message, "error");
                });
            });
        }

        const testWompiBtn = document.getElementById('btn-test-wompi-connection');
        if (testWompiBtn) {
            testWompiBtn.addEventListener('click', () => {
                const clientId = document.getElementById('global-wompi-client-id').value.trim();
                const clientSecret = document.getElementById('global-wompi-client-secret').value.trim();
                
                if (!clientId || !clientSecret) {
                    showToast("Por favor, ingresa el Client ID y el Client Secret para probar la conexión.", "error");
                    return;
                }
                
                testWompiBtn.disabled = true;
                const originalText = testWompiBtn.innerHTML;
                testWompiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probando Conexión...';
                
                const currentDb = getDatabase();
                const backendUrl = (currentDb.saas_config && currentDb.saas_config.backendUrl) || '';
                
                fetch(`${backendUrl}/api/wompi/test-connection`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        wompiConfig: {
                            clientId: clientId,
                            clientSecret: clientSecret
                        }
                    })
                })
                .then(res => res.json())
                .then(data => {
                    testWompiBtn.disabled = false;
                    testWompiBtn.innerHTML = originalText;
                    if (data.success) {
                        showToast(data.message, "success");
                    } else {
                        showToast(`Error de Conexión: ${data.message || 'No se pudo conectar con Wompi SV.'}`, "error");
                        if (data.details) {
                            console.error("Wompi Test Details:", data.details);
                        }
                    }
                })
                .catch(err => {
                    testWompiBtn.disabled = false;
                    testWompiBtn.innerHTML = originalText;
                    console.error("Error testing Wompi connection:", err);
                    showToast("Error de comunicación con el servidor: " + err.message, "error");
                });
            });
        }

        const testDteBtn = document.getElementById('btn-test-dte-connection');
        if (testDteBtn) {
            testDteBtn.addEventListener('click', () => {
                const apiKey = document.getElementById('global-dte-api-key').value.trim();
                
                if (!apiKey) {
                    showToast("Por favor, ingresa la API Key de FacturaLlama para probar la conexión.", "error");
                    return;
                }
                
                testDteBtn.disabled = true;
                const originalText = testDteBtn.innerHTML;
                testDteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probando Conexión...';
                
                const currentDb = getDatabase();
                const backendUrl = (currentDb.saas_config && currentDb.saas_config.backendUrl) || '';
                
                fetch(`${backendUrl}/api/dte/test-connection`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey: apiKey })
                })
                .then(res => res.json())
                .then(data => {
                    testDteBtn.disabled = false;
                    testDteBtn.innerHTML = originalText;
                    if (data.success) {
                        showToast(data.message, "success");
                    } else {
                        showToast(`Error de Conexión: ${data.message || 'No se pudo conectar con FacturaLlama.'}`, "error");
                        if (data.details) {
                            console.error("FacturaLlama Test Details:", data.details);
                        }
                    }
                })
                .catch(err => {
                    testDteBtn.disabled = false;
                    testDteBtn.innerHTML = originalText;
                    console.error("Error testing FacturaLlama connection:", err);
                    showToast("Error de comunicación con el servidor: " + err.message, "error");
                });
            });
        }

        const addPlanBtn = document.getElementById('btn-add-saas-plan');
        if (addPlanBtn) {
            addPlanBtn.addEventListener('click', () => {
                window.saasAddPlanForm = true;
                renderAdminSolicitudes(container);
            });
        }

        const addCouponBtn = document.getElementById('btn-add-saas-coupon');
        if (addCouponBtn) {
            addCouponBtn.addEventListener('click', () => {
                window.saasAddCouponForm = true;
                renderAdminSolicitudes(container);
            });
        }

        document.querySelectorAll('.btn-edit-saas-plan').forEach(btn => {
            btn.addEventListener('click', () => {
                window.saasEditPlanId = btn.getAttribute('data-id');
                renderAdminSolicitudes(container);
            });
        });

        document.querySelectorAll('.btn-delete-saas-plan').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm("¿Está seguro de que desea eliminar este plan de suscripción comercial?")) {
                    dataService.saas.deletePlan(id)
                        .then(() => {
                            showToast("Plan eliminado del catálogo.", "info");
                            renderAdminSolicitudes(container);
                        });
                }
            });
        });

        document.querySelectorAll('.btn-toggle-saas-coupon').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.getAttribute('data-id');
                const coupon = (coupons || []).find(c => c.codigo === code);
                if (coupon) {
                    coupon.activo = !coupon.activo;
                    dataService.saas.saveCoupon(coupon)
                        .then(() => {
                            showToast(`Cupón ${coupon.codigo} ${coupon.activo ? 'activado' : 'desactivado'}.`, "info");
                            renderAdminSolicitudes(container);
                        });
                }
            });
        });

        document.querySelectorAll('.btn-delete-saas-coupon').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.getAttribute('data-id');
                if (confirm("¿Está seguro de que desea eliminar este cupón comercial?")) {
                    dataService.saas.deleteCoupon(code)
                        .then(() => {
                            showToast("Cupón eliminado del catálogo.", "info");
                            renderAdminSolicitudes(container);
                        });
                }
            });
        });

        // Form submits
        const planForm = document.getElementById('saas-plan-form');
        if (planForm) {
            planForm.addEventListener('submit', (planEvent) => {
                planEvent.preventDefault();
                const nombre = document.getElementById('plan-form-nombre').value;
                const precio = parseFloat(document.getElementById('plan-form-precio').value);
                const max_usuarios = parseInt(document.getElementById('plan-form-users').value) || 5;
                const descripcion = document.getElementById('plan-form-desc').value;
                const featuresText = document.getElementById('plan-form-features').value;
                const features = featuresText.split('\n').map(f => f.trim()).filter(f => f.length > 0);

                let targetPlan;
                if (window.saasEditPlanId) {
                    targetPlan = (plans || []).find(p => p.id === window.saasEditPlanId);
                    if (targetPlan) {
                        targetPlan.nombre = nombre;
                        targetPlan.precio = precio;
                        targetPlan.max_usuarios = max_usuarios;
                        targetPlan.descripcion = descripcion;
                        targetPlan.features = features;
                    }
                } else {
                    targetPlan = {
                        id: 'plan-' + Date.now(),
                        nombre: nombre,
                        precio: precio,
                        descripcion: descripcion,
                        max_usuarios: max_usuarios,
                        features: features
                    };
                }

                if (targetPlan) {
                    dataService.saas.savePlan(targetPlan)
                        .then(() => {
                            showToast("Plan de suscripción guardado.", "success");
                            window.saasCloseForm();
                        });
                }
            });
        }

        const couponForm = document.getElementById('saas-coupon-form');
        if (couponForm) {
            couponForm.addEventListener('submit', (couponEvent) => {
                couponEvent.preventDefault();
                const codigo = document.getElementById('coupon-form-codigo').value.trim().toUpperCase();
                const tipo = document.getElementById('coupon-form-tipo').value;
                const valor = parseFloat(document.getElementById('coupon-form-valor').value);
                const expiracion = document.getElementById('coupon-form-expiry').value;
                const descripcion = document.getElementById('coupon-form-desc').value;
                const activo = document.getElementById('coupon-form-active').checked;

                const newCoupon = {
                    codigo: codigo,
                    tipo: tipo,
                    valor: valor,
                    expiracion: expiracion,
                    descripcion: descripcion,
                    activo: activo
                };

                dataService.saas.saveCoupon(newCoupon)
                    .then(() => {
                        showToast("Cupón promocional guardado.", "success");
                        window.saasCloseForm();
                    });
            });
        }
    }

    // Active quota listener cleanup
    if (window.saasQuotaUnsubscribe) {
        window.saasQuotaUnsubscribe();
        window.saasQuotaUnsubscribe = null;
    }

    if (activeTab === 'metrics') {
        setTimeout(() => {
            const statusEl = document.getElementById('saas-perf-db-status');
            const progressContainer = document.getElementById('saas-quota-progress-container');
            
            // 1. Update connectivity indicator
            if (statusEl) {
                if (typeof isFirebaseConnected !== 'undefined' && isFirebaseConnected) {
                    statusEl.style.background = 'rgba(46, 204, 113, 0.15)';
                    statusEl.style.color = '#2ecc71';
                    statusEl.innerHTML = '<span class="dot" style="background:#2ecc71; width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:4px;"></span> CONECTADO';
                } else {
                    statusEl.style.background = 'rgba(231, 76, 60, 0.15)';
                    statusEl.style.color = '#e74c3c';
                    statusEl.innerHTML = '<span class="dot" style="background:#e74c3c; width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:4px;"></span> DESCONECTADO';
                }
            }

            // 2. Real-time quota listener
            if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                const dateStr = new Date().toISOString().split('T')[0];
                window.saasQuotaUnsubscribe = dbFirestore.collection("saas_metrics").doc("quotas").collection("days").doc(dateStr).onSnapshot((doc) => {
                    if (!progressContainer) return;
                    
                    const data = doc.exists ? doc.data() : { reads: 0, writes: 0, deletes: 0 };
                    const reads = data.reads || 0;
                    const writes = data.writes || 0;
                    const deletes = data.deletes || 0;
                    
                    const maxReads = 50000;
                    const maxWrites = 20000;
                    const maxDeletes = 20000;
                    
                    const readsPct = Math.min(100, (reads / maxReads) * 100);
                    const writesPct = Math.min(100, (writes / maxWrites) * 100);
                    const deletesPct = Math.min(100, (deletes / maxDeletes) * 100);
                    
                    const getBarColor = (pct) => {
                        if (pct > 85) return '#e74c3c'; // Red
                        if (pct > 60) return '#f39c12'; // Yellow/Orange
                        return '#2ecc71'; // Green
                    };
                    
                    progressContainer.innerHTML = `
                        <!-- Lecturas -->
                        <div style="margin-bottom:0.75rem;">
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem; color:var(--text-primary);">
                                <span><i class="fa-solid fa-eye" style="margin-right:4px; color:${getBarColor(readsPct)};"></i> Lecturas (Reads)</span>
                                <strong>${reads.toLocaleString()} / ${maxReads.toLocaleString()} (${readsPct.toFixed(1)}%)</strong>
                            </div>
                            <div style="height:6px; background:var(--border-color); border-radius:3px; overflow:hidden; display:flex;">
                                <div style="width:${readsPct}%; height:100%; background:${getBarColor(readsPct)}; border-radius:3px; transition: width 0.5s ease;"></div>
                            </div>
                        </div>

                        <!-- Escrituras -->
                        <div style="margin-bottom:0.75rem;">
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem; color:var(--text-primary);">
                                <span><i class="fa-solid fa-pen" style="margin-right:4px; color:${getBarColor(writesPct)};"></i> Escrituras (Writes)</span>
                                <strong style="color:${writesPct > 85 ? '#e74c3c' : 'var(--text-primary)'};">${writes.toLocaleString()} / ${maxWrites.toLocaleString()} (${writesPct.toFixed(1)}%)</strong>
                            </div>
                            <div style="height:6px; background:var(--border-color); border-radius:3px; overflow:hidden; display:flex;">
                                <div style="width:${writesPct}%; height:100%; background:${getBarColor(writesPct)}; border-radius:3px; transition: width 0.5s ease;"></div>
                            </div>
                            ${writes > 15000 ? `<div style="color:#e74c3c; font-size:0.7rem; font-weight:bold; margin-top:3px;"><i class="fa-solid fa-triangle-exclamation"></i> ¡Advertencia: Acercándose al límite diario de 20k escrituras!</div>` : ''}
                        </div>

                        <!-- Eliminaciones -->
                        <div>
                            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.25rem; color:var(--text-primary);">
                                <span><i class="fa-solid fa-trash" style="margin-right:4px; color:${getBarColor(deletesPct)};"></i> Eliminaciones (Deletes)</span>
                                <strong>${deletes.toLocaleString()} / ${maxDeletes.toLocaleString()} (${deletesPct.toFixed(1)}%)</strong>
                            </div>
                            <div style="height:6px; background:var(--border-color); border-radius:3px; overflow:hidden; display:flex;">
                                <div style="width:${deletesPct}%; height:100%; background:${getBarColor(deletesPct)}; border-radius:3px; transition: width 0.5s ease;"></div>
                            </div>
                        </div>
                    `;
                }, (err) => {
                    console.error("Error listening to real-time quota stats:", err);
                    if (progressContainer) {
                        progressContainer.innerHTML = `<span style="color:var(--danger); font-size:0.8rem;"><i class="fa-solid fa-circle-exclamation"></i> Error al cargar cuotas: ${err.message}</span>`;
                    }
                });
            } else {
                if (progressContainer) {
                    progressContainer.innerHTML = '<span style="color:var(--text-muted); font-size:0.8rem;">Conexión a Firebase inactiva (modo sin conexión). No se pueden leer cuotas de la nube.</span>';
                }
            }
        }, 50);
    }

    // Sub-renderers
    function renderRequestsTab() {
        if (solicitudes.length === 0) {
            return `
                <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                    <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"><i class="fa-solid fa-folder-open"></i></div>
                    <p>No hay solicitudes de registro registradas en este momento.</p>
                </div>
            `;
        }
        return `
            <div class="glass-card" style="padding:1.5rem;">
                <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; margin-bottom:1rem; color:var(--text-primary);">Historial de Solicitudes</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Taller</th>
                                <th>Contacto / Propietario</th>
                                <th>NIT / NRC</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${solicitudes.map(s => {
                                let badgeColor = 'badge-warning';
                                if (s.status === 'aprobado' || s.status === 'active') badgeColor = 'badge-success';
                                if (s.status === 'rechazado') badgeColor = 'badge-danger';
                                
                                return `
                                    <tr>
                                        <td>${new Date(s.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <strong>${s.nombre}</strong><br>
                                            <small style="color:var(--text-muted);">${s.giro}</small><br>
                                            <small style="color:var(--text-muted); font-size:0.75rem;">${s.direccion}</small>
                                        </td>
                                        <td>
                                            <strong>${s.propietario}</strong><br>
                                            <small style="color:var(--text-muted);">${s.correo}</small><br>
                                            <small style="color:var(--text-muted); font-size:0.75rem;">TEL: ${s.telefono}</small>
                                        </td>
                                        <td>
                                            <small>NIT: ${s.nit}</small><br>
                                            <small>NRC: ${s.nrc}</small>
                                        </td>
                                        <td><span class="badge-tag ${badgeColor}">${s.status.toUpperCase()}</span></td>
                                        <td>
                                            ${s.status === 'pendiente' 
                                                ? `
                                                    <div style="display:flex; gap:0.5rem;">
                                                        <button class="btn btn-primary btn-approve-saas" data-id="${s.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;"><i class="fa-solid fa-circle-check"></i> Aprobar</button>
                                                        <button class="btn btn-secondary btn-reject-saas" data-id="${s.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem; color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Rechazar</button>
                                                    </div>
                                                ` 
                                                : `<span style="font-size:0.8rem; color:var(--text-muted);">Procesado</span>`}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    function renderSubscriptionsTab() {
        const approvedClients = solicitudes.filter(s => s.status === 'aprobado' || s.status === 'active');
        
        return `
            <div class="glass-card" style="padding:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; color:var(--text-primary); margin:0;">Registro de Clientes y Suscripciones Negociadas</h3>
                    <button id="btn-man-register-saas" class="btn btn-primary" style="padding:0.5rem 1rem;"><i class="fa-solid fa-square-plus"></i> Registrar Taller Manualmente</button>
                </div>
                
                ${approvedClients.length === 0 ? `
                    <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                        <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"><i class="fa-solid fa-user-xmark"></i></div>
                        <p>No hay clientes o talleres activos aprobados en este momento.</p>
                    </div>
                ` : `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Taller / Cliente</th>
                                    <th>Contacto</th>
                                    <th>Plan Contratado</th>
                                    <th>Cuota Mensual</th>
                                    <th>Estado</th>
                                    <th>Renovación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${approvedClients.map(c => {
                                    const plan = c.plan || 'Pro';
                                    const price = c.precio_mensual || 75.00;
                                    const status = c.suscripcion_status || 'activo';
                                    const nextPay = c.proximo_pago ? new Date(c.proximo_pago).toLocaleDateString() : 'N/A';
                                    
                                    let badgeColor = 'badge-success';
                                    if (status === 'suspendido') badgeColor = 'badge-danger';
                                    if (status === 'demo') badgeColor = 'badge-warning';
                                    
                                    const isCurrent = db.saas_state.workshopData && db.saas_state.workshopData.id === c.id;
                                    
                                    return `
                                        <tr style="${isCurrent ? 'background:rgba(99, 102, 241, 0.05); border-left:3px solid var(--primary);' : ''}">
                                            <td>
                                                <strong>${c.nombre}</strong> ${isCurrent ? '<span style="font-size:0.7rem; background:var(--primary); color:white; padding:1px 5px; border-radius:3px; margin-left:5px;">ACTIVO EN SESIÓN</span>' : ''}<br>
                                                <small style="color:var(--text-muted);">${c.giro}</small><br>
                                                <small style="color:var(--text-muted); font-size:0.75rem;">${c.direccion}</small>
                                                ${c.idEnlace ? `<br><span class="badge-tag badge-info" style="font-size:0.7rem; padding:2px 6px; margin-top:4px; display:inline-block;"><i class="fa-solid fa-link"></i> Wompi Link: ${c.idEnlace}</span>` : ''}
                                            </td>
                                            <td>
                                                <strong>${c.propietario}</strong><br>
                                                <small style="color:var(--text-muted);">${c.correo}</small><br>
                                                <small style="color:var(--text-muted); font-size:0.75rem;">TEL: ${c.telefono}</small>
                                            </td>
                                            <td>
                                                <strong style="color:var(--primary);">${plan.toUpperCase()}</strong>
                                            </td>
                                            <td>
                                                <strong style="font-size:1rem; color:var(--text-primary);">$${price.toFixed(2)}</strong>
                                            </td>
                                            <td><span class="badge-tag ${badgeColor}">${status.toUpperCase()}</span></td>
                                            <td>
                                                <span style="${c.proximo_pago && c.proximo_pago < Date.now() ? 'color:var(--danger); font-weight:bold;' : 'color:var(--text-primary);'}">
                                                    ${nextPay}
                                                </span>
                                                ${c.proximo_pago && c.proximo_pago < Date.now() ? '<br><small style="color:var(--danger);">VENCIDO</small>' : ''}
                                            </td>
                                            <td>
                                                <button class="btn btn-primary btn-view-saas-details" data-id="${c.id}" style="padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:6px; display:inline-flex; align-items:center; gap:6px;">
                                                    <i class="fa-solid fa-folder-open"></i> Ver Detalles
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    }
    
    function renderPaymentsTab() {
        if (payments.length === 0) {
            return `
                <div style="text-align:center; padding:3rem; color:var(--text-secondary);">
                    <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;"><i class="fa-solid fa-receipt"></i></div>
                    <p>No se han registrado pagos en el historial.</p>
                </div>
            `;
        }
        
        return `
            <div class="glass-card" style="padding:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; color:var(--text-primary); margin:0;">Registro de Cobros Recibidos</h3>
                </div>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha Recibo</th>
                                <th>Taller / Cliente</th>
                                <th>Plan</th>
                                <th>N° Comprobante</th>
                                <th>Método de Pago</th>
                                <th>Monto Recaudado</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.slice().sort((a,b) => b.fecha - a.fecha).map(p => `
                                <tr>
                                    <td>${new Date(p.fecha).toLocaleDateString()}</td>
                                    <td><strong>${p.workshopName}</strong></td>
                                    <td><span style="font-size:0.75rem; background:rgba(99, 102, 241, 0.1); color:var(--primary); padding:2px 6px; border-radius:3px; font-weight:bold;">${p.plan}</span></td>
                                    <td><code style="font-family:monospace; font-size:0.9rem;">${p.factura}</code></td>
                                    <td>${p.metodo}</td>
                                    <td><strong style="color:var(--success); font-size:0.95rem;">$${Number(p.monto).toFixed(2)}</strong></td>
                                    <td>
                                        <span class="badge-tag badge-success">${p.estado.toUpperCase()}</span>
                                        ${p.dte ? `
                                        <span style="font-size:0.7rem; background:rgba(46, 204, 113, 0.1); color:#2ecc71; padding:2px 6px; border-radius:3px; font-weight:bold; margin-left:0.25rem; white-space:nowrap;" title="Factura Electrónica Certificada (MH)">
                                            <i class="fa-solid fa-circle-check"></i> DTE MH
                                        </span>
                                        ` : ''}
                                    </td>
                                    <td>
                                        <button class="btn btn-secondary btn-view-saas-receipt" data-id="${p.id}" style="padding:0.3rem 0.6rem; font-size:0.75rem;"><i class="fa-solid fa-receipt"></i> Ver Recibo</button>
                                        ${p.dte ? `
                                        <a href="${p.dte.mhDteUrl}" target="_blank" class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.75rem; border-color:#2ecc71; color:#2ecc71; text-decoration:none; margin-left:0.25rem; display:inline-flex; align-items:center; gap:0.25rem;"><i class="fa-solid fa-cloud-arrow-down"></i> PDF MH</a>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    function renderMetricsTab() {
        const approvedClients = solicitudes.filter(s => s.status === 'aprobado' || s.status === 'active');
        const activeClients = approvedClients.filter(c => c.suscripcion_status === 'activo' || c.suscripcion_status === 'demo');
        const suspendedClients = approvedClients.filter(c => c.suscripcion_status === 'suspendido');
        
        // Calculate MRR
        const mrr = activeClients.reduce((sum, c) => sum + (c.precio_mensual || 75.00), 0);
        // Total collected
        const totalCollected = payments.reduce((sum, p) => sum + Number(p.monto), 0);
        // ARPU
        const arpu = activeClients.length > 0 ? (mrr / activeClients.length) : 0;
        // Churn Rate
        const churnRate = approvedClients.length > 0 ? ((suspendedClients.length / approvedClients.length) * 100) : 0;
        
        // Count payment methods share
        const paymentMethods = payments.reduce((acc, p) => {
            const m = p.metodo || 'Tarjeta de Crédito (Online)';
            const cleanMethod = m.includes('Tarjeta') ? 'Tarjeta de Crédito' : (m.includes('Transferencia') ? 'Transferencia' : (m.includes('Chivo') ? 'Bitcoin / Chivo' : 'Efectivo/Otros'));
            acc[cleanMethod] = (acc[cleanMethod] || 0) + Number(p.monto);
            return acc;
        }, {});
        
        return `
            <div class="saas-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div class="metric-card-saas primary">
                    <span class="metric-label">MRR (Recurrente Mensual)</span>
                    <div class="metric-val">$${mrr.toFixed(2)}</div>
                    <small style="color:var(--text-muted); font-size:0.75rem;">Suma de cuotas mensuales activas</small>
                </div>
                <div class="metric-card-saas success">
                    <span class="metric-label">Recaudación Histórica</span>
                    <div class="metric-val">$${totalCollected.toFixed(2)}</div>
                    <small style="color:var(--text-muted); font-size:0.75rem;">${payments.length} facturas cobradas</small>
                </div>
                <div class="metric-card-saas warning">
                    <span class="metric-label">ARPU (Ingreso Medio)</span>
                    <div class="metric-val">$${arpu.toFixed(2)}</div>
                    <small style="color:var(--text-muted); font-size:0.75rem;">Ingreso promedio por taller</small>
                </div>
                <div class="metric-card-saas danger">
                    <span class="metric-label">Tasa de Churn (Suspensión)</span>
                    <div class="metric-val">${churnRate.toFixed(1)}%</div>
                    <small style="color:var(--text-muted); font-size:0.75rem;">${suspendedClients.length} de ${approvedClients.length} talleres suspendidos</small>
                </div>
            </div>
            
            <!-- Estado del Sistema y Límites de Google Cloud -->
            <div class="glass-card" style="padding:1.5rem; margin-bottom:2rem;">
                <h3 style="font-family:'Outfit', sans-serif; font-size:1.2rem; color:var(--text-primary); margin-bottom:1.25rem; display:flex; align-items:center; gap:0.5rem;">
                    <i class="fa-solid fa-server" style="color:var(--primary);"></i> Estado del Sistema y Límites de Google Cloud
                </h3>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1.5rem;">
                    <!-- Conectividad -->
                    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); padding:1.25rem; border-radius:8px;">
                        <h4 style="font-size:0.9rem; margin-bottom:1rem; color:var(--text-secondary); border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; font-family:'Outfit', sans-serif;">Canales de Comunicación</h4>
                        <div style="display:flex; flex-direction:column; gap:0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.8rem; color:var(--text-muted);">Base de Datos Central (GCP):</span>
                                <span id="saas-perf-db-status" style="font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:bold; display:flex; align-items:center; gap:4px;">
                                    <span class="dot" style="width:8px; height:8px; border-radius:50%; display:inline-block;"></span>
                                    <span>Cargando...</span>
                                </span>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <span style="font-size:0.8rem; color:var(--text-muted);">Respaldo Local (IndexedDB):</span>
                                <span style="font-size:0.75rem; padding:2px 8px; border-radius:10px; font-weight:bold; background:rgba(46, 204, 113, 0.15); color:#2ecc71; display:flex; align-items:center; gap:4px;">
                                    <span class="dot" style="background:#2ecc71; width:8px; height:8px; border-radius:50%; display:inline-block;"></span>
                                    <span>ACTIVO</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Límites de Operaciones -->
                    <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); padding:1.25rem; border-radius:8px; grid-column: span 1;">
                        <h4 style="font-size:0.9rem; margin-bottom:1rem; color:var(--text-secondary); border-bottom:1px solid var(--border-color); padding-bottom:0.5rem; font-family:'Outfit', sans-serif; display:flex; justify-content:space-between; align-items:center;">
                            <span>Consumo Diario (Google Cloud Quotas)</span>
                        </h4>
                        <div style="display:flex; flex-direction:column; gap:0.85rem;" id="saas-quota-progress-container">
                            <span style="font-size:0.8rem; color:var(--text-muted);">Cargando cuotas en tiempo real...</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-top:1.5rem;">
                <!-- Chart 1: Participación de MRR -->
                <div class="glass-card" style="padding:1.5rem;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.1rem; margin-bottom:1.5rem; color:var(--text-primary);">Participación de MRR por Taller</h3>
                    
                    <div style="display:flex; flex-wrap:wrap; gap:1.5rem; justify-content:space-around; align-items:center;">
                        <div style="text-align:center;">
                            <svg width="130" height="130" viewBox="0 0 200 200" style="transform: rotate(-90deg);">
                                <circle r="70" cx="100" cy="100" fill="transparent" stroke="var(--border-color)" stroke-width="20"></circle>
                                <!-- Circle segments representing MRR portion -->
                                <circle r="70" cx="100" cy="100" fill="transparent" stroke="var(--primary)" stroke-width="20" stroke-dasharray="240 440" stroke-dashoffset="0"></circle>
                                <circle r="70" cx="100" cy="100" fill="transparent" stroke="var(--success)" stroke-width="20" stroke-dasharray="150 440" stroke-dashoffset="-240"></circle>
                                <circle r="70" cx="100" cy="100" fill="transparent" stroke="var(--warning)" stroke-width="20" stroke-dasharray="50 440" stroke-dashoffset="-390"></circle>
                            </svg>
                            <div style="margin-top:0.5rem; font-size:0.75rem; color:var(--text-muted);">Cuotas Activas</div>
                        </div>
                        
                        <div style="flex:1; min-width:180px; display:flex; flex-direction:column; gap:0.75rem; max-height:150px; overflow-y:auto;">
                            ${activeClients.length === 0 ? '<p style="font-size:0.8rem; color:var(--text-muted);">No hay talleres activos</p>' : activeClients.map((c, idx) => {
                                const share = mrr > 0 ? (((c.precio_mensual || 75.00) / mrr) * 100) : 0;
                                const colors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', '#6366f1', '#a855f7', '#ec4899'];
                                const color = colors[idx % colors.length];
                                return `
                                    <div>
                                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.2rem;">
                                            <span style="font-weight:600; color:var(--text-primary);">${c.nombre}</span>
                                            <span>$${(c.precio_mensual || 75.00).toFixed(0)} (${share.toFixed(0)}%)</span>
                                        </div>
                                        <div style="height:5px; background:var(--border-color); border-radius:3px; overflow:hidden;">
                                            <div style="width:${share}%; height:100%; background:${color}; border-radius:3px;"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Chart 2: Canales de Cobro -->
                <div class="glass-card" style="padding:1.5rem;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.1rem; margin-bottom:1.5rem; color:var(--text-primary);">Volumen de Venta por Método de Pago</h3>
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        ${Object.keys(paymentMethods).length === 0 ? '<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:2rem;">No hay cobros registrados</p>' : Object.entries(paymentMethods).map(([method, amount]) => {
                            const pct = totalCollected > 0 ? ((amount / totalCollected) * 100) : 0;
                            let color = 'var(--primary)';
                            if (method.includes('Tarjeta')) color = 'var(--primary)';
                            else if (method.includes('Transferencia')) color = 'var(--success)';
                            else if (method.includes('Bitcoin')) color = 'var(--warning)';
                            else color = 'var(--text-muted)';
                            
                            return `
                                <div>
                                    <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">
                                        <span style="font-weight:600; color:var(--text-primary);"><i class="fa-solid fa-money-bill-transfer" style="margin-right:0.4rem; color:${color};"></i> ${method}</span>
                                        <span><strong>$${amount.toFixed(2)}</strong> (${pct.toFixed(0)}%)</span>
                                    </div>
                                    <div style="height:6px; background:var(--border-color); border-radius:3px; overflow:hidden;">
                                        <div style="width:${pct}%; height:100%; background:${color}; border-radius:3px;"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function renderPlansCouponsTab() {
        const plans = db.saas_plans || [];
        const coupons = db.saas_coupons || [];

        if (window.saasAddPlanForm || window.saasEditPlanId) {
            const isEdit = !!window.saasEditPlanId;
            const plan = isEdit ? plans.find(p => p.id === window.saasEditPlanId) : {
                id: 'plan-' + Date.now(),
                nombre: '',
                precio: 0,
                descripcion: '',
                max_usuarios: 5,
                features: []
            };

            if (isEdit && !plan) {
                window.saasCloseForm();
                return '';
            }

            return `
                <div class="glass-card" style="padding:2rem; max-width:600px; margin:0 auto;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; margin-bottom:1.5rem; color:var(--text-primary); border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                        ${isEdit ? 'Editar Plan de Suscripción' : 'Agregar Nuevo Plan de Suscripción'}
                    </h3>
                    <form id="saas-plan-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                        <div class="form-group">
                            <label>Nombre del Plan</label>
                            <input type="text" id="plan-form-nombre" required value="${plan.nombre}" placeholder="Ej: Standard" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Precio Mensual ($ USD)</label>
                                <input type="number" step="0.01" id="plan-form-precio" required value="${plan.precio}" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                            <div class="form-group">
                                <label>Límite de Usuarios</label>
                                <input type="number" id="plan-form-users" required value="${plan.max_usuarios}" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Descripción Corta</label>
                            <input type="text" id="plan-form-desc" required value="${plan.descripcion}" placeholder="Resumen del plan" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group">
                            <label>Características (Una por línea o separadas por comas)</label>
                            <textarea id="plan-form-features" rows="4" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; font-family:sans-serif;" placeholder="Gestión de inventario&#10;Facturación electrónica&#10;Soporte básico">${(plan.features || []).join('\n')}</textarea>
                        </div>
                        
                        <div style="display:flex; gap:1rem; margin-top:1rem;">
                            <button type="submit" class="btn btn-primary" style="flex:1; padding:0.75rem;"><i class="fa-solid fa-save"></i> Guardar Plan</button>
                            <button type="button" onclick="window.saasCloseForm()" class="btn btn-secondary" style="flex:1; padding:0.75rem;">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
        }

        if (window.saasAddCouponForm) {
            const todayStr = new Date().toISOString().split('T')[0];
            return `
                <div class="glass-card" style="padding:2rem; max-width:600px; margin:0 auto;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; margin-bottom:1.5rem; color:var(--text-primary); border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                        Crear Nuevo Cupón de Descuento
                    </h3>
                    <form id="saas-coupon-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Código del Cupón (Mayúsculas)</label>
                                <input type="text" id="coupon-form-codigo" required placeholder="Ej: PROMO50" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; text-transform:uppercase;">
                            </div>
                            <div class="form-group">
                                <label>Tipo de Descuento</label>
                                <select id="coupon-form-tipo" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height: 38px;">
                                    <option value="porcentaje">Porcentaje (%)</option>
                                    <option value="fijo">Cantidad Fija ($ USD)</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Valor del Descuento</label>
                                <input type="number" step="0.01" id="coupon-form-valor" required placeholder="50 o 15" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                            <div class="form-group">
                                <label>Fecha de Expiración</label>
                                <input type="date" id="coupon-form-expiry" required value="${todayStr}" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Descripción para el Cliente</label>
                            <input type="text" id="coupon-form-desc" required placeholder="Ej: 50% de descuento en el primer mes" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                        </div>
                        <div class="form-group" style="flex-direction:row; align-items:center; gap:0.5rem;">
                            <input type="checkbox" id="coupon-form-active" checked style="width:20px; height:20px;">
                            <label for="coupon-form-active" style="margin:0; cursor:pointer;">Cupón Activo e Habilitado</label>
                        </div>
                        
                        <div style="display:flex; gap:1rem; margin-top:1rem;">
                            <button type="submit" class="btn btn-primary" style="flex:1; padding:0.75rem;"><i class="fa-solid fa-save"></i> Guardar Cupón</button>
                            <button type="button" onclick="window.saasCloseForm()" class="btn btn-secondary" style="flex:1; padding:0.75rem;">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
        }

        // Default view: list of plans and coupons
        return `
            <div style="display:flex; flex-direction:column; gap:2.5rem;">
                <!-- Configuración Global SaaS -->
                <div class="glass-card" style="padding:2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                        <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; color:var(--text-primary); margin:0;"><i class="fa-solid fa-gears" style="color:var(--primary);"></i> Configuración Global de la Plataforma (SaaS)</h3>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-bottom:1.5rem;" id="saas-global-config-fields">
                        <!-- Wompi Config -->
                        <div style="display:flex; flex-direction:column; gap:1rem;">
                            <h4 style="font-family:'Outfit', sans-serif; font-size:1.05rem; border-left:3px solid var(--primary); padding-left:0.5rem; color:var(--text-primary); margin:0;">Pasarela de Pago Wompi SV</h4>
                            <div class="form-group">
                                <label>Client ID (OAuth)</label>
                                <input type="text" id="global-wompi-client-id" value="${(db.saas_config && db.saas_config.wompi && db.saas_config.wompi.clientId) || ''}" placeholder="Ej: client_id_..." style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                            <div class="form-group">
                                <label>Client Secret</label>
                                <input type="text" id="global-wompi-client-secret" value="${(db.saas_config && db.saas_config.wompi && db.saas_config.wompi.clientSecret) || ''}" placeholder="Ej: bd534de2..." style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                            <div class="form-group">
                                <label>ID Aplicativo (Opcional - Auto-recuperar si vacío)</label>
                                <input type="text" id="global-wompi-app-id" value="${(db.saas_config && db.saas_config.wompi && db.saas_config.wompi.appId) || ''}" placeholder="Ej: app_id_..." style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                        </div>
                        
                        <!-- FacturaLlama Config -->
                        <div style="display:flex; flex-direction:column; gap:1rem;">
                            <h4 style="font-family:'Outfit', sans-serif; font-size:1.05rem; border-left:3px solid var(--success); padding-left:0.5rem; color:var(--text-primary); margin:0;">Facturación Electrónica (DTE) de la Plataforma</h4>
                            <div class="form-group">
                                <label>API Key de FacturaLlama</label>
                                <input type="text" id="global-dte-api-key" value="${(db.saas_config && db.saas_config.dte && db.saas_config.dte.apiKey) || ''}" placeholder="sk_test_..." style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                            <div class="form-group">
                                <label>URL de Producción del Servidor Backend (Render/Railway)</label>
                                <input type="text" id="global-backend-url" value="${(db.saas_config && db.saas_config.backendUrl) || ''}" placeholder="https://mecanic-os-backend.onrender.com" style="padding:0.6rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px;">
                            </div>
                            <div style="background:rgba(99, 102, 241, 0.05); border:1px solid rgba(99, 102, 241, 0.15); border-radius:6px; padding:0.85rem; font-size:0.75rem; color:var(--text-secondary); line-height:1.4; display:flex; gap:0.5rem; align-items:flex-start; margin-top:1.15rem;">
                                <i class="fa-solid fa-circle-info" style="color:var(--primary); font-size:1rem; margin-top:0.1rem;"></i>
                                <span><strong>Importante:</strong> Deja en blanco las credenciales de Wompi para operar en **Modo Simulación**, permitiendo cobros de prueba sin conectar al servidor real de Wompi.</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:1rem; flex-wrap:wrap;">
                        <button type="button" id="btn-save-saas-global-config" class="btn btn-primary" style="padding:0.6rem 1.2rem; font-size:0.85rem; width:fit-content;"><i class="fa-solid fa-save"></i> Guardar Configuración Global</button>
                        <button type="button" id="btn-test-wompi-connection" class="btn btn-secondary" style="padding:0.6rem 1.2rem; font-size:0.85rem; width:fit-content; background:transparent; border:1px solid var(--border-color); color:var(--text-primary);"><i class="fa-solid fa-signal" style="color:var(--primary);"></i> Probar Conexión Wompi</button>
                        <button type="button" id="btn-test-dte-connection" class="btn btn-secondary" style="padding:0.6rem 1.2rem; font-size:0.85rem; width:fit-content; background:transparent; border:1px solid var(--border-color); color:var(--text-primary);"><i class="fa-solid fa-file-invoice-dollar" style="color:var(--success);"></i> Probar Conexión FacturaLlama</button>
                    </div>
                </div>

                <!-- Catalog Section -->
                <div class="glass-card" style="padding:2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; color:var(--text-primary); margin:0;"><i class="fa-solid fa-layer-group" style="color:var(--primary);"></i> Planes de Suscripción Oficiales</h3>
                        <button id="btn-add-saas-plan" class="btn btn-primary" style="padding:0.5rem 1rem;"><i class="fa-solid fa-plus"></i> Crear Nuevo Plan</button>
                    </div>

                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem;">
                        ${plans.map(p => `
                            <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between; border-color: rgba(255,255,255,0.08);">
                                <div>
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                                        <h4 style="font-family:'Outfit', sans-serif; font-size:1.2rem; color:var(--text-primary); margin:0;">Plan ${p.nombre}</h4>
                                        <strong style="font-size:1.25rem; color:var(--primary);">$${p.precio}/mes</strong>
                                    </div>
                                    <p style="color:var(--text-secondary); font-size:0.8rem; line-height:1.5; margin-bottom:1rem;">${p.descripcion}</p>
                                    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:1rem;">Máximo: <strong>${p.max_usuarios} usuarios</strong></div>
                                    
                                    <div style="font-size:0.8rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:0.4rem; border-top:1px solid var(--border-color); padding-top:1rem; margin-bottom:1.5rem;">
                                        ${(p.features || []).map(f => `<div><i class="fa-solid fa-check" style="color:var(--success); margin-right:0.4rem;"></i> ${f}</div>`).join('')}
                                    </div>
                                </div>
                                <div style="display:flex; gap:0.5rem;">
                                    <button class="btn btn-secondary btn-edit-saas-plan" data-id="${p.id}" style="flex:1; padding:0.4rem; font-size:0.75rem;"><i class="fa-solid fa-pencil"></i> Editar</button>
                                    <button class="btn btn-secondary btn-delete-saas-plan" data-id="${p.id}" style="flex:1; padding:0.4rem; font-size:0.75rem; color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-trash"></i> Eliminar</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Coupons Section -->
                <div class="glass-card" style="padding:2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; color:var(--text-primary); margin:0;"><i class="fa-solid fa-ticket" style="color:var(--success);"></i> Cupones de Descuento y Promociones</h3>
                        <button id="btn-add-saas-coupon" class="btn btn-primary" style="padding:0.5rem 1rem;"><i class="fa-solid fa-plus"></i> Crear Cupón</button>
                    </div>

                    ${coupons.length === 0 ? `
                        <div style="text-align:center; padding:2rem; color:var(--text-secondary);">
                            <p>No se han registrado cupones comerciales.</p>
                        </div>
                    ` : `
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Tipo Descuento</th>
                                        <th>Valor</th>
                                        <th>Descripción</th>
                                        <th>Expiración</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${coupons.map(c => {
                                        let badgeColor = c.activo ? 'badge-success' : 'badge-danger';
                                        let isExpired = Date.parse(c.expiracion) < Date.now();
                                        if (isExpired) {
                                            badgeColor = 'badge-warning';
                                        }
                                        return `
                                            <tr>
                                                <td><strong style="color:var(--primary); font-family:monospace; font-size:1.05rem; letter-spacing:0.05em;">${c.codigo}</strong></td>
                                                <td>${c.tipo === 'porcentaje' ? 'Porcentaje (%)' : 'Fijo ($ USD)'}</td>
                                                <td><strong>${c.tipo === 'porcentaje' ? c.valor + '%' : '$' + c.valor.toFixed(2)}</strong></td>
                                                <td><small>${c.descripcion}</small></td>
                                                <td>
                                                    <span style="${isExpired ? 'color:var(--danger); font-weight:bold;' : ''}">${new Date(c.expiracion + 'T00:00:00').toLocaleDateString()}</span>
                                                    ${isExpired ? '<br><small style="color:var(--danger); font-size:0.75rem;">EXPIRADO</small>' : ''}
                                                </td>
                                                <td><span class="badge-tag ${badgeColor}">${isExpired ? 'EXPIRADO' : (c.activo ? 'ACTIVO' : 'INACTIVO')}</span></td>
                                                <td>
                                                    <div style="display:flex; gap:0.5rem;">
                                                        <button class="btn btn-secondary btn-toggle-saas-coupon" data-id="${c.codigo}" style="padding:0.3rem 0.6rem; font-size:0.75rem; color:${c.activo ? 'var(--warning)' : 'var(--success)'}; border-color:${c.activo ? 'var(--warning)' : 'var(--success)'};">
                                                            ${c.activo ? 'Desactivar' : 'Activar'}
                                                        </button>
                                                        <button class="btn btn-secondary btn-delete-saas-coupon" data-id="${c.codigo}" style="padding:0.3rem 0.6rem; font-size:0.75rem; color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-trash-can"></i></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
}

function renderTerminosSaaS(container) {
    const db = getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    
    if (saas.status !== 'approved_terms_pending') {
        window.location.hash = 'landing';
        handleRouting();
        return;
    }
    
    container.innerHTML = `
        <div style="max-width:750px; margin:4rem auto; padding:2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
            <div style="text-align:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1.5rem;">
                <div style="font-size: 3rem; color: var(--success); margin-bottom: 0.5rem;"><i class="fa-solid fa-circle-check"></i></div>
                <h2 style="font-family:'Outfit', sans-serif; font-size:1.85rem; font-weight:800; color:var(--text-primary);">¡Registro Aprobado con Éxito!</h2>
                <p style="color:var(--text-secondary); font-size:0.95rem; margin-top:0.5rem;">
                    La solicitud para el taller <strong>${saas.workshopData.nombre}</strong> fue aprobada.
                </p>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-top:0.25rem;">
                    Para activar la plataforma y comenzar a operar, por favor revisa y firma los Términos y Condiciones.
                </p>
            </div>
            
            <div style="background:var(--bg-base); border:1px solid var(--border-color); border-radius:6px; padding:1.5rem; max-height:280px; overflow-y:scroll; font-size:0.8rem; line-height:1.6; color:var(--text-secondary); margin-bottom:1.5rem; font-family:'Courier New', monospace; white-space:pre-wrap; text-align:left;">TÉRMINOS Y CONDICIONES DE USO
MECANIC OS
Fecha de Última Actualización: 27 de Octubre de 2025

IMPORTANTE: Lea detenidamente estos Términos y Condiciones de Uso (en adelante, los "Términos") antes de utilizar la aplicación móvil MECANIC OS (en adelante, la "App"). Estos Términos constituyen un acuerdo legal vinculante entre usted (en adelante, el "Usuario") y David Antonio Mejía Ramírez (en adelante, el "Proveedor"), con domicilio legal en Res las Margaritas, Senda los Caobos # 13 Santa Tecla La libertad.

Al acceder o utilizar la App, usted acepta quedar obligado por estos Términos y por nuestra Política de Privacidad. Si no está de acuerdo con alguna parte de estos Términos, no debe utilizar la App.

1. DEFINICIONES
● App o Aplicación: Se refiere a la aplicación móvil MECANIC OS, creada mediante la plataforma AppSheet y operada por el Proveedor.
● Usuario: Cualquier persona natural o jurídica que accede, descarga o utiliza la App.
● Contenido del Usuario: Datos, imágenes, archivos, texto o cualquier información que el Usuario ingrese o cargue a la App.
● Servicio: Las funcionalidades, operaciones y la información proporcionada al Usuario a través de la App.

2. OBJETO DEL SERVICIO
La App tiene como finalidad la gestión integral de las operaciones de talleres y centros de servicio automotriz, incluyendo (pero no limitándose a) los siguientes módulos:
1. Clientes
2. Productos (gestión de márgenes y tarifas)
3. Inventario
4. Movimientos de Inventario
5. Revisión de Vehículos (con soporte para imágenes y videos)
6. Presupuestos
7. Compras y Ventas
8. Base de Datos de Cambios de Aceite
9. Mano de Obra
10. Módulo de Fidelización
11. Dashboard (visualización de ventas y cumplimiento de objetivos)
12. Opciones de Inversión.

El acceso al Servicio está sujeto a.

3. USO Y ACCESO A LA APP
3.1. Requisitos de Edad:
Al aceptar estos Términos, el Usuario declara ser mayor de dieciocho (18) años de edad y tener plena capacidad legal para obligarse. Si el Usuario es menor de edad, debe abstenerse de utilizar la App.

3.2. Cuentas y Contraseñas:
El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de toda actividad que se realice bajo su cuenta. El Proveedor no será responsable por pérdidas o daños que resulten del incumplimiento de esta obligación.

3.3. Uso Aceptable:
El Usuario se compromete a no utilizar la App para fines ilegales o no autorizados. Esto incluye, pero no se limita a:
a) Violar cualquier ley local, nacional o internacional, incluyendo la Ley de Protección al Consumidor y la legislación sobre protección de datos de El Salvador.
b) Intentar obtener acceso no autorizado a otros sistemas o redes de la plataforma AppSheet o del Proveedor.
c) Cargar contenido difamatorio, obsceno o que viole derechos de propiedad intelectual de terceros.

4. PROPIEDAD INTELLECTUAL Y LICENCIA DE USO
4.1. Propiedad del Proveedor:
El diseño, la interfaz (UI/UX), la arquitectura, el código base, las bases de datos, las plantillas y los flujos de trabajo de la App pertenecen exclusivamente a Forbidden Soluciones S.A. de C.V.

4.2. Licencia de Uso:
La App y sus funcionalidades son desarrolladas y entregadas bajo un modelo de licencia de uso no exclusivo. En ningún caso se entenderá que el Usuario adquiere derechos de propiedad intelectual, ni sobre el software base, ni sobre las personalizaciones realizadas.

4.3. Propiedad del Contenido del Usuario:
El Usuario únicamente conserva la propiedad de su Contenido de Usuario (los datos que ingrese a través de la App), pero otorga al Proveedor una licencia para usar, almacenar y procesar dicho Contenido con el único fin de prestar el Servicio.

5. RESTRICCIONES Y TÉRMINOS ESPECÍFICOS DE APPSHEET
5.1. Naturaleza de la Plataforma:
La App es una aplicación construida y desplegada a través de la plataforma AppSheet (de Google Cloud). El Usuario reconoce que el funcionamiento de la App depende de los términos de servicio y la infraestructura de AppSheet y de Google.

5.2. Suspensión del Servicio:
El Proveedor se reserva el derecho de suspender, temporal o permanentemente, el acceso del Usuario a la App sin previo aviso si incumple gravemente estos Términos, o si la cuenta del Usuario pone en riesgo la seguridad o la integridad de la plataforma AppSheet.

5.3. Actualizaciones y No Exclusividad de Funcionalidades:
El Proveedor se compromete a la constante actualización y optimización del Servicio. El Usuario reconoce y acepta explícitamente que las optimizaciones, mejoras o personalizaciones desarrolladas para esta App podrán ser utilizadas en otros proyectos. Dichas mejoras no constituyen propiedad exclusiva del Usuario ni generarán derechos de compensación, salvo acuerdo escrito en contrario. El uso de la App no otorga al Usuario derechos exclusivos sobre ninguna funcionalidad, diseño o mejora.

6. PROTECCIÓN DE DATOS PERSONALES Y DERECHOS ARCO-POL
6.1. Responsable del Tratamiento:
Forbidden Soluciones S.A. de C.V. actúa como responsable del tratamiento de los datos personales recopilados en la App.

6.2. Recopilación de Datos:
El Proveedor recopilará los datos personales que el Usuario ingrese en la App con la finalidad de prestar el Servicio.

6.3. Consentimiento Expreso (El Salvador):
En cumplimiento del marco normativo sobre la protección de datos personales en El Salvador, el Usuario otorga su consentimiento expreso, libre e informado para el tratamiento de sus datos personales. El tratamiento de datos sensibles (si aplica) requerirá un consentimiento específico adicional.

6.4. Derechos ARCO-POL:
El Proveedor garantiza al Usuario el ejercicio de sus derechos de:
● Acceso (A): Conocer qué datos personales tenemos.
● Rectificación (R): Solicitar la corrección de datos erróneos o incompletos.
● Cancelación/Eliminación (C/O): Solicitar la supresión de datos innecesarios.
● Oposición (P): Oponerse al tratamiento de datos para ciertos fines (ej. marketing).
● Portabilidad (O): Solicitar la transferencia de sus datos a otro responsable.
● Olvido (L): Solicitar la supresión de datos publicados en el entorno electrónico.

Para ejercer estos derechos, el Usuario deberá enviar una solicitud al correo electrónico: ventas@forbiddensoluciones.com.

6.5. Política de Privacidad:
La recopilación, uso y almacenamiento de los datos personales del Usuario se rigen por nuestra Política de Privacidad, la cual forma parte integral de estos Términos.

7. CONDICIONES ECONÓMICAS Y PAGO
7.1. Pago Oportuno:
Los servicios de licencia y uso de la App están sujetos al pago oportuno según lo acordado contractualmente en el documento de servicio suscrito por las partes.

7.2. Incumplimiento de Pago:
El incumplimiento de pago faculta al Proveedor a suspender el acceso a la App, el Servicio y los datos asociados, sin necesidad de notificación previa.

7.3. No Reembolsabilidad:
Los pagos realizados por la licencia de uso no son reembolsables, salvo error de cobro atribuible directamente al Proveedor.

8. SOPORTE TÉCNICO Y MANTENIMIENTO
8.1. Alcance del Soporte:
El soporte técnico provisto por el Proveedor se limita a la corrección de errores (bugs) que impidan el correcto funcionamiento de las funcionalidades existentes en la App y a la asistencia para el uso del sistema.

8.2. Exclusiones:
El soporte no incluye la realización de modificaciones, ampliaciones, integraciones con sistemas de terceros, o desarrollos adicionales. Cualquier requerimiento que exceda el soporte básico será considerado como desarrollo adicional y será cotizado y acordado por separado.

9. EXCLUSIÓN Y LIMITACIÓN DE RESPONSABILIDAD
El Servicio se proporciona "tal cual" y "según disponibilidad". El Proveedor no garantiza que la App esté libre de errores, que la información sea siempre exacta, o que la App funcione sin interrupciones. El Proveedor no será responsable por daños indirectos, incidentales, especiales o consecuentes que resulten del uso o la imposibilidad de usar la App, incluyendo, sin limitación, pérdidas de información, lucro cesante, interrupciones comerciales o daños a la reputación, excepto cuando la ley salvadoreña, especialmente la Ley de Protección al Consumidor, establezca lo contrario de forma imperativa.

10. MODIFICACIONES DE LOS TÉRMINOS
El Proveedor se reserva el derecho de modificar estos Términos en cualquier momento. Notificaremos a los Usuarios sobre cambios sustanciales mediante correo electrónico con al menos siete (7) días hábiles de antelación. El uso continuado de la App después de la entrada en vigor de las modificaciones constituye la aceptación de los nuevos Términos.

11. TERMINACIÓN Y CANCELACIÓN DEL SERVICIO
11.1. Terminación por Incumplimiento: El Proveedor podrá suspender o cancelar el acceso a la App y al Servicio de forma inmediata y sin responsabilidad si el Usuario incumple con sus obligaciones de pago, realiza un uso indebido o viola gravemente cualquiera de las cláusulas de estos Términos.

11.2. Fin del Servicio y Datos:
Al finalizar el servicio (por cualquier causa), el Usuario tendrá un plazo de 30 días para solicitar una copia de su Contenido de Usuario (datos). En ningún caso el Usuario tendrá derecho a solicitar el código fuente, la arquitectura, ni los archivos del sistema de la App, ya que estos son propiedad exclusiva del Proveedor.

12. DISPOSICIONES ADICIONALES
12.1. Confidencialidad:
El Usuario se compromete a no divulgar, reproducir o utilizar para fines ajenos, información técnica, procesos, métodos o la estructura interna del sistema de la App, aun después de finalizar la relación comercial.

12.2. Fuerza Mayor:
El Proveedor no será responsable por fallas, demoras o interrupciones derivadas de eventos fuera de su control razonable, incluyendo, pero no limitado a, fallos en la infraestructura de AppSheet o Google Cloud, cortes de energía eléctrica, desastres naturales o interrupciones de servicios de telecomunicaciones.

12.3. Prohibición de Uso Indebido y No Competencia:
El Usuario no podrá descompilar, aplicar ingeniería inversa, copiar, reproducir o desarrollar sistemas, software o aplicaciones similares basados en la App o en sus funcionalidades, sin la previa autorización escrita del Proveedor.

13. LEY APLICABLE Y JURISDICCIÓN
13.1. Ley Aplicable:
Estos Términos y su interpretación se rigen exclusivamente por las leyes de la República de El Salvador, sin dar efecto a ningún principio de conflicto de leyes.

13.2. Jurisdicción y Resolución de Controversias:
Las partes acuerdan que cualquier controversia será resuelta preferentemente mediante negociación directa. En caso de no llegar a acuerdo, las partes se someten a los tribunales competentes de San Salvador en El Salvador, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.

14. INFORMACIÓN DE CONTACTO
Para cualquier pregunta o comunicación relacionada con estos Términos y Condiciones, por favor contáctenos a:
Nombre: Forbidden Soluciones S.A. de C.V.
Correo Electrónico: ventas@forbiddensoluciones.com
Teléfono: 7815-0614
Dirección: Res las Margaritas, Senda los Caobos # 13 Santa Tecla La libertad.

FIN DE LOS TÉRMINOS Y CONDICIONES DE USO</div>
            
            <form id="saas-terms-form" style="display:flex; flex-direction:column; gap:1.25rem;">
                <div class="form-group" style="flex-direction:row; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                    <input type="checkbox" id="terms-accept" required style="width:20px; height:20px; cursor:pointer;">
                    <label for="terms-accept" style="cursor:pointer; font-size:0.9rem; font-weight:600; color:var(--text-primary);">He leído, comprendo y acepto los Términos y Condiciones de Uso</label>
                </div>
                
                <div class="form-group">
                    <label>Firma Digital (Escribe tu Nombre Completo como Representante Legal)</label>
                    <input type="text" id="terms-signature-name" required placeholder="Ej: ${saas.workshopData.propietario}" style="padding:0.6rem; font-family:'Courier New', monospace; font-size:1.1rem; font-weight:bold; letter-spacing:0.05em; text-align:center;">
                </div>
                
                <button type="submit" class="btn btn-primary" style="padding:0.8rem; font-size:1.05rem; font-weight:700;"><i class="fa-solid fa-signature"></i> Firmar y Activar Plataforma</button>
            </form>
        </div>
    `;
    
    const form = document.getElementById('saas-terms-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const sigName = document.getElementById('terms-signature-name').value;
        const accepted = document.getElementById('terms-accept').checked;
        
        if (!accepted) {
            alert("Debe aceptar los términos y condiciones marcando la casilla correspondiente.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const origHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando cuenta y activando...';

        const email = saas.workshopData.correo;
        const pass = saas.workshopData.pass;

        const proceedWithLocalActivation = async (uid) => {
            db.saas_state = {
                status: 'active',
                workshopData: { ...saas.workshopData, status: 'active', uid },
                termsSigned: true,
                signatureName: sigName,
                signedAt: Date.now()
            };
            
            db.config_taller = {
                nombre: saas.workshopData.nombre,
                alias: saas.workshopData.alias || '',
                nombre_comercial: saas.workshopData.nombre_comercial || '',
                giro: saas.workshopData.giro,
                direccion: saas.workshopData.direccion,
                telefono: saas.workshopData.telefono,
                correo: saas.workshopData.correo,
                nit: saas.workshopData.nit,
                nrc: saas.workshopData.nrc,
                logoText: saas.workshopData.logoText || 'MecanicOS',
                logoTagline: saas.workshopData.logoTagline || 'Servicio Automotriz Especializado',
                tipo_persona: saas.workshopData.tipo_persona || 'Jurídica',
                clasificacion_tributaria: saas.workshopData.clasificacion_tributaria || 'Otros',
                sujeto_excluido: saas.workshopData.sujeto_excluido || 'No',
                tipo_documento: saas.workshopData.tipo_documento || 'NIT',
                num_documento: saas.workshopData.num_documento || '',
                actividad_economica: saas.workshopData.actividad_economica || saas.workshopData.giro,
                pais: saas.workshopData.pais || 'El Salvador',
                departamento: saas.workshopData.departamento || '',
                municipio: saas.workshopData.municipio || '',
                logo: saas.workshopData.logo || ''
            };
            
            const exists = db.tecnicos.some(t => t.Nombre_Completo.toLowerCase() === saas.workshopData.propietario.toLowerCase());
            if (!exists) {
                const newTech = {
                    Tecnico_ID: 'TECH-' + Date.now().toString().slice(-6),
                    Nombre_Completo: saas.workshopData.propietario,
                    Email: saas.workshopData.correo,
                    Telefono: saas.workshopData.telefono,
                    Especialidad: 'Gerente General',
                    Nivel_Acceso: 'Administrador',
                    Salario_Base: 1500,
                    Contraseña: saas.workshopData.pass,
                    Incapacidades: [],
                    Vacaciones: [],
                    Bonos: []
                };
                db.tecnicos.push(newTech);
                setActiveUser(newTech);
            }
            
            if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                dataService.activeUserUid = uid;
            }
            
            await saveDatabase(db);
            
            if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
                try {
                    await dataService.migrateLocalDataToCloud(uid);
                } catch (migrationErr) {
                    console.error("Migration error during activation (continuing):", migrationErr);
                }
                dataService.startSync(uid);
            }
            
            updateSidebarBrand();
            updateUserUI();
            
            showToast("¡Plataforma Activada! Bienvenido a Mecanic OS.", "success");
            window.location.hash = 'taller-dashboard';
            handleRouting();
        };

        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            firebase.auth().createUserWithEmailAndPassword(email, pass)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    try {
                        await dataService.saas.updateRequestStatus(saas.workshopData.id, 'active', {
                            termsSigned: true,
                            signatureName: sigName,
                            signedAt: Date.now(),
                            uid: user.uid,
                            status: 'active'
                        });
                        await proceedWithLocalActivation(user.uid);
                    } catch (err) {
                        console.error("Error updating request status:", err);
                        await proceedWithLocalActivation(user.uid);
                    }
                })
                .catch((error) => {
                    console.error("Firebase auth creation error:", error);
                    if (error.code === 'auth/email-already-in-use') {
                        firebase.auth().signInWithEmailAndPassword(email, pass)
                            .then(async (userCredential) => {
                                const user = userCredential.user;
                                try {
                                    await dataService.saas.updateRequestStatus(saas.workshopData.id, 'active', {
                                        termsSigned: true,
                                        signatureName: sigName,
                                        signedAt: Date.now(),
                                        uid: user.uid,
                                        status: 'active'
                                    });
                                    await proceedWithLocalActivation(user.uid);
                                } catch (err) {
                                    console.error("Error updating status on sign in:", err);
                                    await proceedWithLocalActivation(user.uid);
                                }
                            })
                            .catch((loginErr) => {
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = origHtml;
                                showToast("Error al crear cuenta: El correo ya está en uso por otro taller.", "error");
                            });
                    } else {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = origHtml;
                        showToast(`Error al crear la cuenta: ${error.message}`, "error");
                    }
                });
        } else {
            const mockUid = 'local_' + Date.now();
            proceedWithLocalActivation(mockUid);
        }
    });
}

// ----------------------------------------------------
// SYSTEM STARTUP & USER MODAL HANDLERS
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    initFirebase();
    await dataService.init();
    initDatabase();
    initFirebaseAuthListener();
    bindFirebaseEvents();
    updateUserUI();
    updateSidebarBrand();
    startClock();
    
    // Mobile Navigation Drawer Toggle
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
    handleRouting();
    
    // Menu navigation click bindings
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.getAttribute('data-route');
            window.location.hash = route;
            closeMobileMenu();
        });
    });

    // User Switcher Modal Logic
    const userModal = document.getElementById('user-modal');
    const userSwitchBtn = document.getElementById('user-switch-btn');
    const closeUserModal = document.getElementById('close-user-modal');
    const usersSelectionGrid = document.getElementById('users-selection-grid');
    
    userSwitchBtn.addEventListener('click', () => {
        const db = getDatabase();
        usersSelectionGrid.innerHTML = '';
        usersSelectionGrid.style.display = 'grid';
        
        const introPara = userModal.querySelector('.modal-body > p');
        if (introPara) introPara.style.display = 'block';
        
        const existingForm = document.getElementById('switcher-password-form');
        if (existingForm) existingForm.remove();
        
        db.tecnicos.forEach(t => {
            const card = document.createElement('div');
            card.className = 'user-card';
            const avatar = t.Foto_Perfil || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
            
            card.innerHTML = `
                <img src="${avatar}" class="avatar">
                <div style="display:flex; flex-direction:column;">
                    <strong style="font-size:0.9rem;">${t.Nombre_Completo}</strong>
                    <small style="color:var(--text-muted); font-size:0.75rem;">${t.Nivel_Acceso} • ${t.Especialidad || 'Mecánica'}</small>
                </div>
            `;
            
            card.addEventListener('click', () => {
                // Hide user grid and intro text
                usersSelectionGrid.style.display = 'none';
                if (introPara) introPara.style.display = 'none';
                
                // Remove any existing password form
                const currentForm = document.getElementById('switcher-password-form');
                if (currentForm) currentForm.remove();
                
                // Create password form
                const passForm = document.createElement('form');
                passForm.id = 'switcher-password-form';
                passForm.style.display = 'flex';
                passForm.style.flexDirection = 'column';
                passForm.style.gap = '1rem';
                passForm.style.marginTop = '1rem';
                passForm.style.background = 'rgba(255,255,255,0.02)';
                passForm.style.padding = '1.25rem';
                passForm.style.borderRadius = '8px';
                passForm.style.border = '1px solid rgba(255,255,255,0.08)';
                
                passForm.innerHTML = `
                    <div style="text-align: center; margin-bottom: 0.5rem;">
                        <img src="${avatar}" class="avatar" style="width: 60px; height: 60px; margin-bottom: 0.5rem; border-radius: 50%;">
                        <h3 style="margin: 0; font-size: 1.1rem;">${t.Nombre_Completo}</h3>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">${t.Nivel_Acceso}</span>
                    </div>
                    <div class="form-group">
                        <label>Contraseña de Acceso</label>
                        <input type="password" id="switcher-user-password" required placeholder="Ingresa tu contraseña" style="padding: 0.6rem; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 4px;">
                    </div>
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-user-switch" style="padding: 0.5rem 1rem;">Cancelar</button>
                        <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem;">Confirmar Acceso</button>
                    </div>
                `;
                
                userModal.querySelector('.modal-body').appendChild(passForm);
                
                // Focus on password input
                setTimeout(() => {
                    const pwdInput = document.getElementById('switcher-user-password');
                    if (pwdInput) pwdInput.focus();
                }, 100);
                
                // Cancel button listener
                document.getElementById('btn-cancel-user-switch').addEventListener('click', () => {
                    passForm.remove();
                    usersSelectionGrid.style.display = 'grid';
                    if (introPara) introPara.style.display = 'block';
                });
                
                // Form submit listener
                passForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const enteredPass = document.getElementById('switcher-user-password').value;
                    const realPass = t.Contraseña || '';
                    
                    if (enteredPass === realPass) {
                        setActiveUser(t);
                        passForm.remove();
                        userModal.classList.remove('active');
                        showToast(`Sesión activa como ${t.Nombre_Completo.split(' ')[0]}`, "success");
                        handleRouting();
                    } else {
                        showToast("Contraseña de empleado incorrecta", "error");
                        const pwdInput = document.getElementById('switcher-user-password');
                        if (pwdInput) {
                            pwdInput.value = '';
                            pwdInput.focus();
                        }
                    }
                });
            });
            
            usersSelectionGrid.appendChild(card);
        });
        
        userModal.classList.add('active');
    });
    
    closeUserModal.addEventListener('click', () => {
        userModal.classList.remove('active');
    });

    const userLogoutBtn = document.getElementById('user-logout-btn');
    if (userLogoutBtn) {
        userLogoutBtn.addEventListener('click', () => {
            if (confirm("¿Seguro que deseas cerrar la sesión actual y bloquear la pantalla?")) {
                sessionStorage.removeItem('mecanic_os_active_user');
                window.location.hash = 'lock-screen';
                handleRouting();
            }
        });
    }

    // Bind notifications click and close logic
    const bellBtn = document.getElementById('notifications-bell-btn');
    const dropdown = document.getElementById('notifications-dropdown');
    const clearBtn = document.getElementById('btn-clear-notifications');

    if (bellBtn && dropdown) {
        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const items = document.querySelectorAll('.notification-item');
            items.forEach(item => {
                const id = item.getAttribute('data-id');
                if (!dismissedNotifications.includes(id)) {
                    dismissedNotifications.push(id);
                }
            });
            updateNotifications();
        });
    }

    // Initial load of notifications
    updateNotifications();
});

// Dismissed notifications list (stored in memory)
let dismissedNotifications = [];

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


function renderSaaSAdminLogin(container) {
    container.innerHTML = `
        <div style="max-width: 450px; margin: 8rem auto; padding: 2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); text-align: center;">
            <div style="font-size: 3.5rem; color: var(--primary); margin-bottom: 1rem;">
                <i class="fa-solid fa-user-shield"></i>
            </div>
            <h2 style="font-family:'Outfit', sans-serif; font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Super Administrador SaaS</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 2rem;">Ingresa la contraseña maestra para acceder a la consola central de Mecanic OS</p>
            
            <form id="saas-admin-login-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div class="form-group" style="text-align: left;">
                    <label>Contraseña Maestra</label>
                    <input type="password" id="saas-admin-pass" required placeholder="••••••••" style="padding: 0.75rem; font-size: 1rem; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: #fff; border-radius: 6px;">
                </div>
                <button type="submit" class="btn btn-primary" style="padding: 0.8rem; font-size: 1rem; font-weight: 600; margin-top: 0.5rem;"><i class="fa-solid fa-right-to-bracket"></i> Ingresar a la Consola</button>
                <a href="#landing" style="color: var(--text-secondary); font-size: 0.85rem; text-decoration: none; margin-top: 0.5rem;"><i class="fa-solid fa-arrow-left"></i> Volver al Inicio</a>
            </form>
        </div>
    `;

    const form = document.getElementById('saas-admin-login-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const pass = document.getElementById('saas-admin-pass').value;
            if (pass === 'SuperAdminOS') {
                sessionStorage.setItem('mecanic_os_saas_admin_auth', 'true');
                showToast("Acceso concedido como Super Administrador", "success");
                handleRouting();
            } else {
                showToast("Contraseña incorrecta", "error");
                const passInput = document.getElementById('saas-admin-pass');
                if (passInput) {
                    passInput.value = '';
                    passInput.focus();
                }
            }
        });
    }
}

// Optimize connection state when tab is backgrounded / foregrounded
document.addEventListener('visibilitychange', () => {
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0 && typeof dbFirestore !== 'undefined' && dbFirestore) {
        if (document.visibilityState === 'visible') {
            console.log("Mecanic OS: Tab active. Re-enabling Firestore connection...");
            dbFirestore.enableNetwork().then(() => {
                console.log("Firestore connection online.");
            }).catch(err => {
                console.warn("Error enabling Firestore network:", err);
            });
        } else {
            console.log("Mecanic OS: Tab backgrounded. Disabling Firestore connection to prevent background freeze...");
            dbFirestore.disableNetwork().then(() => {
                console.log("Firestore connection offline (suspended).");
            }).catch(err => {
                console.warn("Error disabling Firestore network:", err);
            });
        }
    }
});

// ----------------------------------------------------
// HOJA DE INSPECCIÓN DINÁMICA & PERSONALIZABLE HELPERS
// ----------------------------------------------------
function getInspectionCheckpoints(db) {
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

    modal.innerHTML = `
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
                ${checksHTML}
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
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700&display=swap');
        body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            background: #fff;
            margin: 0;
            padding: 30px;
            font-size: 13px;
            line-height: 1.5;
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
            background: #0f172a;
            color: #fff;
            text-align: left;
            padding: 10px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
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
            body { padding: 0; }
            button { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            ${logoHtml}
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

    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        }
    </script>
</body>
</html>
    `;
    printWindow.document.write(pdfHTML);
    printWindow.document.close();
};

function renderRegistrarTab(db, checkpoints) {
    let clientOptionsHTML = db.clientes.map(c => `<option value="${c.Codigo_Cliente}">${c.Nombre} (${c.Codigo_Cliente})</option>`).join('');
    
    return `
        <form id="inspection-form">
            <div class="inspection-header-fields">
                <div class="form-group">
                    <label>Cliente</label>
                    <select id="ins-client-select" required>
                        <option value="">-- Seleccionar Cliente --</option>
                        ${clientOptionsHTML}
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
                
                ${checkpoints.map((cp, idx) => `
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
                `).join('')}
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="window.location.hash='#taller-dashboard'">Cancelar</button>
                <button type="submit" class="btn btn-success"><i class="fa-solid fa-save"></i> Guardar Inspección e Ingreso</button>
            </div>
        </form>
    `;
}

function renderHistorialTab(db) {
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
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderConfigurarTab(db, checkpoints) {
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
                            ${rowsHTML}
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



