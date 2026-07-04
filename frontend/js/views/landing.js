import { saveDatabase, setActiveUser } from '../../app.js?v=24';
import { showToast, html, safe } from '../utils.js?v=24';

export function renderLanding(container) {
    const db = window.getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    
    if (saas.status === 'pending') {
        container.innerHTML = html`
            <div class="saas-container" style="max-width: 700px; margin: 6rem auto; text-align: center; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 8px;">
                <div style="font-size: 4rem; color: var(--warning); margin-bottom: 1.5rem;"><i class="fa-solid fa-clock-rotate-left"></i></div>
                <h2 style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 700; margin-bottom: 1rem;">Solicitud Pendiente de Revisión</h2>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem; font-size: 1.05rem;">
                    Tu solicitud para registrar el taller <strong>${(saas.workshopData && saas.workshopData.nombre) || 'nuevo'}</strong> está siendo evaluada por nuestro equipo de administración de Mecanic OS.<br>
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
        const workshopName = (saas.workshopData && saas.workshopData.nombre) || 'Mecanic OS';
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
    
    container.innerHTML = html`
        <div class="landing-hero" style="position:relative; overflow:hidden; padding: 6rem 2rem; text-align:center; background: radial-gradient(circle at top, rgba(99, 102, 241, 0.15) 0%, transparent 60%);">
            <div style="display:flex; justify-content:space-between; max-width:1100px; margin:-4rem auto 4rem auto; align-items:center;">
                <div class="logo" style="font-size:1.8rem; font-weight:800; font-family:'Outfit', sans-serif; color:var(--text-primary);">
                    <i class="fa-solid fa-gears logo-icon" style="color:var(--primary);"></i> Mecanic<span>OS</span>
                </div>
                ${safe(topButtonsHTML)}
            </div>
            
            <h1 style="font-family:'Outfit', sans-serif; font-size:3.5rem; font-weight:800; line-height:1.15; max-width:800px; margin: 0 auto 1.5rem auto; background: linear-gradient(135deg, #fff 30%, var(--primary-glow) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">El Sistema Operativo Premium para tu Taller Automotriz</h1>
            <p style="color:var(--text-secondary); font-size:1.2rem; max-width:650px; margin: 0 auto 2.5rem auto; line-height:1.6;">
                Mecanic OS automatiza tu taller de punta a punta: desde la recepción de vehículos con inspección digital hasta la facturación electrónica DTE (Ministerio de Hacienda) y la planilla de salarios.
            </p>
            ${safe(actionButtonsHTML)}
        </div>
        
        <div style="max-width:1100px; margin:0 auto 6rem auto; padding:0 2rem;">
            <h2 style="font-family:'Outfit', sans-serif; text-align:center; font-size:2rem; font-weight:700; margin-bottom:3rem;">Características Todo-en-Uno</h2>
            <div class="landing-features-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:2rem;">
                <div class="glass-card" style="padding:2rem; border-radius:12px;">
                    <div style="font-size:2rem; color:var(--primary); margin-bottom:1rem;"><i class="fa-solid fa-clipboard-check"></i></div>
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Recepción y Diagnóstico 21 Puntos</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Registra ingresos, kilometraje y evalúa el vehículo con un semáforo interactivo (Verde, Amarillo, Rojo) desde cualquier celular o tablet en el patio del taller.</p>
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
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; font-weight:600; margin-bottom:0.75rem;">Control Visual del Taller</h3>
                    <p style="color:var(--text-secondary); line-height:1.5; font-size:0.9rem;">Monitorea la carga laboral de tus técnicos. Sigue el progreso de las reparaciones de los vehículos en tiempo real de acuerdo al estado del presupuesto.</p>
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
            if (typeof firebase !== 'undefined' && firebase.auth().currentUser && !firebase.auth().currentUser.isAnonymous) {
                window.location.hash = 'taller-dashboard';
                handleRouting();
            } else {
                document.getElementById('firebase-auth-modal').classList.add('active');
                const loginTab = document.getElementById('fb-tab-login');
                if (loginTab) loginTab.click();
            }
        });
    }

    const loginBtn = document.getElementById('btn-landing-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (typeof firebase !== 'undefined' && firebase.auth().currentUser && !firebase.auth().currentUser.isAnonymous) {
                window.location.hash = 'taller-dashboard';
                handleRouting();
            } else {
                document.getElementById('firebase-auth-modal').classList.add('active');
                const loginTab = document.getElementById('fb-tab-login');
                if (loginTab) loginTab.click();
            }
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
                setActiveUser(null);
                
                // Clear workshop session state to prevent auto-login loops
                localStorage.removeItem('mecanic_os_workshop_uid');
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
