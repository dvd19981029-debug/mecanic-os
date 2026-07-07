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
} from '../../app.js?v=30';
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
} from '../utils.js?v=30';

export function renderLockScreen(container) {
    const db = getDatabase();
    const saas = db.saas_state || {};
    const workshop = saas.workshopData || {};
    const workshopName = workshop.nombre || 'Mecanic OS';
    const logoTagline = workshop.logoTagline || 'Control de Acceso';
    
    // Clear any previous active user just in case
    setActiveUser(null);

    function showProfiles() {
        const tecnicos = db.tecnicos || [];
        container.innerHTML = html`
            <div style="max-width: 800px; margin: 4rem auto; padding: 2.5rem; text-align: center;">
                <div style="margin-bottom: 3rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <div style="font-size: 3rem; color: var(--primary); margin-bottom: 0.5rem;"><i class="fa-solid fa-gears"></i></div>
                    <h1 style="font-family:'Outfit', sans-serif; font-size: 2.25rem; font-weight: 800; color: var(--text-primary); margin: 0;">${workshopName}</h1>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">${logoTagline}</p>
                </div>
                
                <h2 style="font-family:'Outfit', sans-serif; font-size: 1.25rem; font-weight: 600; margin-bottom: 2rem; color: var(--text-primary);">Selecciona tu Perfil de Empleado</h2>
                
                <div id="lock-profiles-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; justify-content: center; max-width: 650px; margin: 0 auto;">
                    ${safe(tecnicos.map(t => {
                        const avatar = t.Foto_Perfil || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
                        return html`
                            <div class="user-card lock-profile-card" data-id="${t.Codigo_Cliente || t.Nombre_Completo || t.Email}" style="background: var(--bg-card); border: 1px solid var(--border-color); padding: 1.5rem; border-radius: var(--radius-md); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 1rem; transition: var(--transition-fast);">
                                <img src="${avatar}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
                                <div style="text-align: center;">
                                    <strong style="font-size: 0.95rem; display: block; color: var(--text-primary);">${t.Nombre_Completo}</strong>
                                    <small style="color: var(--text-secondary); font-size: 0.75rem;">${t.Nivel_Acceso}</small>
                                </div>
                            </div>
                        `;
                    }))}
                </div>
                
                <div style="margin-top: 3.5rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem;">
                    <button id="btn-lock-disconnect" class="btn btn-secondary" style="font-size: 0.8rem; border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.01); padding: 0.5rem 1rem;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Desconectar Taller de esta PC</button>
                </div>
            </div>
        `;

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
                const selectedTech = tecnicos.find(t => (t.Codigo_Cliente || t.Nombre_Completo || t.Email) === techId);
                if (selectedTech) {
                    showPasscodeForm(selectedTech);
                }
            });
        });

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
                    setActiveUser(null);
                    localStorage.removeItem('mecanic_os_workshop_uid');
                    dataService.disconnect();
                    if (typeof firebase !== 'undefined') {
                        firebase.auth().signOut().catch(() => {});
                    }
                    showToast("Taller desconectado con éxito", "info");
                    window.location.hash = 'landing';
                    handleRouting();
                }
            });
        }
    }

    function showPasscodeForm(tech) {
        const avatar = tech.Foto_Perfil || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100";
        container.innerHTML = html`
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

        document.getElementById('lock-passcode-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const enteredPass = document.getElementById('lock-user-password').value;
            const realPass = tech.Contraseña || '';
            const hashedEntered = await hashPassword(enteredPass);
            
            if (hashedEntered === realPass || enteredPass === realPass) {
                if (enteredPass === realPass) {
                    tech.Contraseña = hashedEntered;
                    saveDatabase(db);
                }
                sessionStorage.setItem('mecanic_os_session_key', hashedEntered);
                await window.initSecureDteConfig();
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

    const isFirebaseAuthed = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);

    if (db.tecnicos && db.tecnicos.length > 0) {
        showProfiles();
    } else if (isFirebaseAuthed) {
        // Authenticated to Firebase but still syncing/loading technicians
        container.innerHTML = html`
            <div style="max-width: 450px; margin: 8rem auto; padding: 3rem; text-align: center; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                <div style="font-size: 3rem; color: var(--primary); margin-bottom: 1.5rem;"><i class="fa-solid fa-circle-notch fa-spin"></i></div>
                <h2 style="font-family:'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0;">Sincronizando Taller</h2>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">Cargando los perfiles de empleados desde la nube...</p>
            </div>
        `;
    } else {
        // Not authenticated at all, show login form
        container.innerHTML = html`
            <div style="max-width: 450px; margin: 5rem auto; padding: 2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
                <div style="text-align: center; margin-bottom: 2.5rem;">
                    <div style="font-size: 3rem; color: var(--primary); margin-bottom: 0.5rem;"><i class="fa-solid fa-gears"></i></div>
                    <h1 style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--text-primary); margin: 0;">${workshopName}</h1>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.25rem;">${logoTagline}</p>
                </div>
                
                <form id="lock-login-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
                    <div class="form-group">
                        <label style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 500;">Correo Electrónico</label>
                        <input type="email" id="lock-email" required placeholder="correo@ejemplo.com" style="padding: 0.75rem; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 6px; font-size: 1rem; margin-top: 0.4rem;">
                    </div>
                    <div class="form-group">
                        <label style="color: var(--text-secondary); font-size: 0.85rem; font-weight: 500;">Contraseña</label>
                        <input type="password" id="lock-password" required placeholder="••••••••" style="padding: 0.75rem; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; border-radius: 6px; font-size: 1rem; margin-top: 0.4rem;">
                    </div>
                    
                    <button type="submit" id="btn-lock-login" class="btn btn-primary" style="padding: 0.85rem; justify-content: center; font-size: 1rem; font-weight: 600; margin-top: 0.5rem;">
                        <i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
                    </button>
                </form>
                
                <div style="margin-top: 2.5rem; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem;">
                    <button id="btn-lock-disconnect" class="btn btn-secondary" style="font-size: 0.8rem; border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.01); padding: 0.5rem 1rem;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Desconectar Taller de esta PC</button>
                </div>
            </div>
        `;

        setTimeout(() => {
            const input = document.getElementById('lock-email');
            if (input) input.focus();
        }, 100);

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
                    setActiveUser(null);
                    localStorage.removeItem('mecanic_os_workshop_uid');
                    dataService.disconnect();
                    if (typeof firebase !== 'undefined') {
                        firebase.auth().signOut().catch(() => {});
                    }
                    showToast("Taller desconectado con éxito", "info");
                    window.location.hash = 'landing';
                    handleRouting();
                }
            });
        }

        const lockLoginForm = container.querySelector('#lock-login-form');
        if (lockLoginForm) {
            lockLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('lock-email').value.trim();
                const pass = document.getElementById('lock-password').value;
                const btn = document.getElementById('btn-lock-login');
                
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Iniciando...';
                
                performUnifiedLogin(email, pass, btn, (success) => {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión';
                    if (success) {
                        window.location.hash = 'taller-dashboard';
                        handleRouting();
                    }
                });
            });
        }
    }
}


export function renderSaaSAdminLogin(container) {
    container.innerHTML = html`
        <div style="max-width: 450px; margin: 8rem auto; padding: 2.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.4); text-align: center;">
            <div style="font-size: 3.5rem; color: var(--primary); margin-bottom: 1rem;">
                <i class="fa-solid fa-user-shield"></i>
            </div>
            <h2 style="font-family:'Outfit', sans-serif; font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Super Administrador SaaS</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 2rem;">Ingresa la contraseña maestra para acceder a la consola central de Mecanic OS</p>
            
            <form id="saas-admin-login-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div class="form-group" style="text-align: left;">
                    <label>Correo de Administrador</label>
                    <input type="email" id="saas-admin-email" required placeholder="admin@mecanicos.com" value="amejia2998@gmail.com" style="padding: 0.75rem; font-size: 1rem; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: #fff; border-radius: 6px;">
                </div>
                <div class="form-group" style="text-align: left;">
                    <label>Contraseña Maestra</label>
                    <div style="position: relative; display: flex; align-items: center;">
                        <input type="password" id="saas-admin-pass" required placeholder="••••••••" style="padding: 0.75rem; padding-right: 2.5rem; font-size: 1rem; width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.2); border: 1px solid var(--border-color); color: #fff; border-radius: 6px;">
                        <button type="button" id="toggle-saas-pass" style="position: absolute; right: 0.75rem; background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; padding: 0;">
                            <i class="fa-solid fa-eye"></i>
                        </button>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="padding: 0.8rem; font-size: 1rem; font-weight: 600; margin-top: 0.5rem;"><i class="fa-solid fa-right-to-bracket"></i> Ingresar a la Consola</button>
                
                <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.8rem; margin: 0.5rem 0;">
                    <span style="flex: 1; height: 1px; background: var(--border-color);"></span>
                    <span>O TAMBIÉN</span>
                    <span style="flex: 1; height: 1px; background: var(--border-color);"></span>
                </div>
                
                <button type="button" id="btn-saas-google-login" class="btn btn-secondary" style="padding: 0.8rem; font-size: 1rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: var(--text-primary); transition: background 0.2s;"><i class="fa-brands fa-google" style="color: #4285f4;"></i> Iniciar Sesión con Google</button>
                
                <a href="#landing" style="color: var(--text-secondary); font-size: 0.85rem; text-decoration: none; margin-top: 0.5rem;"><i class="fa-solid fa-arrow-left"></i> Volver al Inicio</a>
            </form>
        </div>
    `;

    const form = document.getElementById('saas-admin-login-form');
    if (form) {
        // Toggle password visibility
        const togglePassBtn = document.getElementById('toggle-saas-pass');
        if (togglePassBtn) {
            togglePassBtn.addEventListener('click', () => {
                const passInput = document.getElementById('saas-admin-pass');
                const icon = togglePassBtn.querySelector('i');
                if (passInput.type === 'password') {
                    passInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }

        const googleLoginBtn = document.getElementById('btn-saas-google-login');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                if (typeof firebase === 'undefined') {
                    showToast("Firebase no inicializado", "error");
                    return;
                }
                const provider = new firebase.auth.GoogleAuthProvider();
                firebase.auth().signInWithPopup(provider)
                    .then((result) => {
                        const user = result.user;
                        const authorizedAdmins = ['dvd19981029@gmail.com', 'amejia2998@gmail.com'];
                        if (authorizedAdmins.includes(user.email.toLowerCase())) {
                            sessionStorage.setItem('mecanic_os_saas_admin_auth', 'true');
                            showToast("Acceso concedido como Super Administrador", "success");
                            handleRouting();
                        } else {
                            showToast("Acceso denegado: Usuario de Google no autorizado", "danger");
                            firebase.auth().signOut();
                        }
                    })
                    .catch((error) => {
                        console.error("Google login error:", error);
                        showToast("Error de autenticación con Google: " + error.message, "error");
                    });
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('saas-admin-email').value.trim();
            const pass = document.getElementById('saas-admin-pass').value;
            
            if (typeof firebase === 'undefined') {
                showToast("Firebase no inicializado", "error");
                return;
            }
            
            const authorizedAdmins = ['dvd19981029@gmail.com', 'amejia2998@gmail.com'];
            if (!authorizedAdmins.includes(email.toLowerCase())) {
                showToast("Acceso denegado: Correo de administrador no autorizado", "danger");
                return;
            }
            
            // Permitir contraseña maestra 'SuperAdminOS' directamente
            if (pass === 'SuperAdminOS') {
                sessionStorage.setItem('mecanic_os_saas_admin_auth', 'true');
                showToast("Acceso concedido como Super Administrador", "success");
                handleRouting();
                return;
            }
            
            // Iniciar sesión con la cuenta de administrador oficial en Firebase Auth
            firebase.auth().signInWithEmailAndPassword(email, pass)
                .then(() => {
                    sessionStorage.setItem('mecanic_os_saas_admin_auth', 'true');
                    showToast("Acceso concedido como Super Administrador", "success");
                    handleRouting();
                })
                .catch((error) => {
                    console.error("Error de login de SuperAdmin:", error);
                    showToast("Contraseña de administrador incorrecta", "error");
                    const passInput = document.getElementById('saas-admin-pass');
                    if (passInput) {
                        passInput.value = '';
                        passInput.focus();
                    }
                });
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


