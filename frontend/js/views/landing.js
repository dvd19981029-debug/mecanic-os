import { saveDatabase, setActiveUser } from '../../app.js?v=69';
import { showToast, html, safe, escapeHtml } from '../utils.js?v=69';

export function renderLanding(container) {
    const db = window.getDatabase ? window.getDatabase() : {};
    const saas = (db && db.saas_state) || { status: 'guest' };
    
    // Vista si la solicitud del taller está en estado de revisión
    if (saas.status === 'pending') {
        container.innerHTML = html`
            <div class="saas-container" style="max-width: 650px; margin: 6rem auto; text-align: center; padding: 3rem 2rem; background: var(--bg-card); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
                <div style="width: 80px; height: 80px; margin: 0 auto 1.5rem auto; background: rgba(245, 158, 11, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--warning); font-size: 2.5rem; border: 1px solid rgba(245, 158, 11, 0.3);">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </div>
                <h2 style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 1rem;">Solicitud en Revisión</h2>
                <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 2rem; font-size: 1.05rem;">
                    Tu solicitud para registrar el taller <strong style="color: #fff;">${(saas.workshopData && saas.workshopData.nombre) || 'Nuevo Taller'}</strong> está siendo validada por el equipo de administración de Mecanic OS.<br><br>
                    Te notificaremos por correo electrónico una vez que tu cuenta sea aprobada para que puedas firmar los términos y comenzar a facturar.
                </p>
                <div style="display:flex; flex-direction:column; gap:1rem; align-items:center;">
                    <button id="btn-reset-saas-guest" class="btn btn-secondary" style="font-size:0.9rem; padding: 0.6rem 1.25rem;">
                        <i class="fa-solid fa-rotate-left"></i> Cancelar Solicitud y Volver al Inicio
                    </button>
                </div>
            </div>
        `;
        
        const resetPendingBtn = document.getElementById('btn-reset-saas-guest');
        if (resetPendingBtn) {
            resetPendingBtn.addEventListener('click', () => {
                if (confirm("¿Deseas cancelar la solicitud y volver al estado inicial?")) {
                    db.saas_state = { status: 'guest', workshopData: null, termsSigned: false };
                    if (db.solicitudes_registro) {
                        db.solicitudes_registro = db.solicitudes_registro.filter(s => s.id !== (saas.workshopData && saas.workshopData.id));
                    }
                    saveDatabase(db);
                    window.location.hash = 'landing';
                    if (typeof handleRouting === 'function') handleRouting();
                }
            });
        }
        return;
    }

    let actionButtonsHTML = '';
    let topButtonsHTML = '';
    
    if (saas.status === 'active') {
        const workshopName = (saas.workshopData && saas.workshopData.nombre) || 'Mecanic OS';
        topButtonsHTML = `
            <div class="landing-header-btns" style="display:flex; gap:0.5rem; align-items:center;">
                <a href="#taller-dashboard" class="btn btn-primary" style="font-size:0.8rem; font-weight:700; padding:0.45rem 1rem; border-radius:50px; display:inline-flex; align-items:center; gap:0.35rem; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); white-space:nowrap;">
                    <i class="fa-solid fa-gauge-high"></i> <span class="nav-btn-text">Mi Panel</span>
                </a>
            </div>
        `;
        
        actionButtonsHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; gap:1.25rem; margin-top:2.5rem;">
                <a href="#taller-dashboard" class="btn btn-primary" style="padding:1.1rem 2.8rem; font-size:1.2rem; font-weight:700; text-decoration:none; box-shadow:0 12px 28px rgba(99, 102, 241, 0.4); border-radius: 12px; display: inline-flex; align-items: center; gap: 0.6rem;">
                    <i class="fa-solid fa-right-to-bracket"></i> Ingresar a ${escapeHtml(workshopName)}
                </a>
                <button id="btn-landing-reset" style="background:none; border:none; color:var(--text-secondary); text-decoration:underline; font-size:0.85rem; cursor:pointer; margin-top:0.25rem;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Desconectar taller de esta PC / Usar otra cuenta
                </button>
            </div>
        `;
    } else {
        topButtonsHTML = `
            <div class="landing-header-btns" style="display:flex; gap:0.4rem; align-items:center;">
                <a href="#lock-screen" class="landing-nav-link" style="color:var(--text-primary); text-decoration:none; font-size:0.78rem; font-weight:600; padding:0.45rem 0.8rem; border-radius:50px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-color); white-space:nowrap; display:inline-flex; align-items:center; gap:0.3rem;">
                    <i class="fa-solid fa-right-to-bracket"></i> <span>Entrar</span>
                </a>
                <a href="#registro" class="btn btn-primary landing-nav-reg" style="font-size:0.78rem; font-weight:700; padding:0.45rem 0.95rem; border-radius:50px; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35); white-space:nowrap; display:inline-flex; align-items:center; gap:0.3rem;">
                    <i class="fa-solid fa-rocket"></i> <span>Registrar</span>
                </a>
            </div>
        `;
        
        actionButtonsHTML = `
            <div class="hero-actions-container" style="display:flex; justify-content:center; gap:1rem; flex-wrap:wrap; margin-top:2.5rem;">
                <a href="#registro" class="btn btn-primary hero-btn-main" style="padding:0.9rem 2rem; font-size:1.05rem; font-weight:700; text-decoration:none; box-shadow:0 12px 28px rgba(99, 102, 241, 0.4); border-radius:12px; display:inline-flex; align-items:center; justify-content:center; gap:0.5rem;">
                    <i class="fa-solid fa-rocket"></i> Empezar Prueba Gratuita
                </a>
                <a href="#lock-screen" class="btn btn-secondary hero-btn-sec" style="padding:0.9rem 1.8rem; font-size:1.05rem; font-weight:600; text-decoration:none; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);">
                    <i class="fa-solid fa-right-to-bracket"></i> Acceso a Taller
                </a>
            </div>
        `;
    }
    
    container.innerHTML = html`
        <div class="landing-page-wrapper" style="overflow-y: auto; height: 100vh; background: var(--bg-base); color: var(--text-primary); scroll-behavior: smooth;">
            
            <style>
                @media (max-width: 640px) {
                    .landing-top-nav {
                        padding: 0.65rem 0.85rem !important;
                    }
                    .landing-logo span {
                        font-size: 1.3rem !important;
                    }
                    .landing-logo i {
                        font-size: 1.2rem !important;
                    }
                    .landing-header-btns a {
                        padding: 0.35rem 0.65rem !important;
                        font-size: 0.72rem !important;
                    }
                    .landing-hero {
                        padding: 3rem 1rem 2.5rem 1rem !important;
                    }
                    .hero-actions-container {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0.75rem !important;
                        max-width: 320px !important;
                        margin: 2rem auto 0 auto !important;
                    }
                    .hero-btn-main, .hero-btn-sec {
                        width: 100% !important;
                        padding: 0.85rem 1.25rem !important;
                        font-size: 0.95rem !important;
                    }
                    .landing-stats-grid {
                        grid-template-columns: 1fr !important;
                        gap: 1.25rem !important;
                        padding: 1.25rem 1rem !important;
                        margin-top: 3rem !important;
                    }
                    .landing-stats-grid > div {
                        border: none !important;
                        border-bottom: 1px solid rgba(255,255,255,0.06) !important;
                        padding-bottom: 1rem !important;
                    }
                    .landing-stats-grid > div:last-child {
                        border-bottom: none !important;
                        padding-bottom: 0 !important;
                    }
                }
            </style>

            <!-- TOP NAVBAR -->
            <header class="landing-top-nav" style="position: sticky; top: 0; z-index: 100; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); background: rgba(10, 13, 22, 0.85); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 0.85rem 1.5rem;">
                <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <div class="logo landing-logo" style="font-size:1.6rem; font-weight:800; font-family:'Outfit', sans-serif; display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
                        <i class="fa-solid fa-gears" style="color:var(--primary); font-size: 1.4rem;"></i>
                        <span>Mecanic<span style="color: var(--primary);">OS</span></span>
                    </div>

                    ${safe(topButtonsHTML)}
                </div>
            </header>

            <!-- HERO SECTION -->
            <section class="landing-hero" style="position:relative; overflow:hidden; padding: 4.5rem 1.5rem 3.5rem 1.5rem; text-align:center; background: radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.05) 40%, transparent 70%);">
                
                <!-- BADGE PILOTO -->
                <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); padding: 0.35rem 1rem; border-radius: 50px; margin-bottom: 1.75rem; max-width: 95%;">
                    <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--success); box-shadow: 0 0 8px var(--success); flex-shrink: 0;"></span>
                    <span style="font-size: 0.8rem; font-weight: 600; color: #c7d2fe; letter-spacing: 0.2px;">Diseñado para Talleres en El Salvador</span>
                </div>
                
                <h1 style="font-family:'Outfit', sans-serif; font-size: clamp(2.1rem, 5vw, 3.8rem); font-weight:800; line-height:1.18; max-width:900px; margin: 0 auto 1.25rem auto; background: linear-gradient(135deg, #ffffff 40%, #a5b4fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    El Sistema Operativo Todo-en-Uno para tu Taller Automotriz
                </h1>
                
                <p style="color:var(--text-secondary); font-size: clamp(0.95rem, 2vw, 1.2rem); max-width:760px; margin: 0 auto 2rem auto; line-height:1.6;">
                    Controla recepción vehicular, presupuestos con semáforo, inventario con kárdex, facturación electrónica DTE certificada por Hacienda y planilla de ley en una sola plataforma en la nube.
                </p>
                
                ${safe(actionButtonsHTML)}

                <!-- STATS STRIP -->
                <div class="landing-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; max-width: 1000px; margin: 4rem auto 0 auto; padding: 1.5rem 1.75rem; background: rgba(21, 26, 48, 0.7); border: 1px solid var(--border-color); border-radius: 16px; backdrop-filter: blur(10px);">
                    <div style="text-align: center;">
                        <div style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--primary);">100% DTE</div>
                        <div style="color: var(--text-secondary); font-size: 0.82rem; margin-top: 0.25rem;">Hacienda El Salvador (MH)</div>
                    </div>
                    <div style="text-align: center; border-left: 1px solid rgba(255,255,255,0.06); border-right: 1px solid rgba(255,255,255,0.06);">
                        <div style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--success);">&lt; 3 Seg</div>
                        <div style="color: var(--text-secondary); font-size: 0.82rem; margin-top: 0.25rem;">Emisión & Firma de Facturas</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--cyan);">21 Puntos</div>
                        <div style="color: var(--text-secondary); font-size: 0.82rem; margin-top: 0.25rem;">Diagnóstico Digital en Móvil</div>
                    </div>
                </div>
            </section>

            <!-- PROBLEMAS QUE RESUELVE -->
            <section id="soluciones" style="padding: 5rem 1.5rem; max-width: 1200px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 3.5rem;">
                    <span style="color: var(--primary); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Problemas Reales, Soluciones Claras</span>
                    <h2 style="font-family:'Outfit', sans-serif; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; margin-top: 0.5rem;">
                        ¿Por qué los talleres eligen Mecanic OS?
                    </h2>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
                    <div class="glass-card" style="padding: 2rem; border-radius: 14px; border: 1px solid rgba(239, 68, 68, 0.2); background: linear-gradient(180deg, rgba(239, 68, 68, 0.04) 0%, rgba(21, 26, 48, 0.6) 100%);">
                        <div style="color: var(--danger); font-size: 1.8rem; margin-bottom: 1rem;"><i class="fa-solid fa-triangle-exclamation"></i></div>
                        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.75rem; color: #fff;">Sin Mecanic OS (El Caos Típico)</h3>
                        <ul style="list-style: none; padding: 0; margin: 0; color: var(--text-secondary); font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.75rem;">
                            <li style="display: flex; gap: 0.5rem; align-items: flex-start;"><i class="fa-solid fa-xmark" style="color: var(--danger); margin-top: 3px;"></i> Hojas de papel perdidas, reclamos de rayones no documentados.</li>
                            <li style="display: flex; gap: 0.5rem; align-items: flex-start;"><i class="fa-solid fa-xmark" style="color: var(--danger); margin-top: 3px;"></i> Facturar en el portal de Hacienda es lento y se digitan datos dos veces.</li>
                            <li style="display: flex; gap: 0.5rem; align-items: flex-start;"><i class="fa-solid fa-xmark" style="color: var(--danger); margin-top: 3px;"></i> No se sabe con certeza qué repuestos hay en stock ni cuánto se le debe pagar a cada mecánico.</li>
                            <li style="display: flex; gap: 0.5rem; align-items: flex-start;"><i class="fa-solid fa-xmark" style="color: var(--danger); margin-top: 3px;"></i> Descuadre de caja al cierre del día.</li>
                        </ul>
                    </div>

                    <div class="glass-card" style="padding: 2rem; border-radius: 14px; border: 1px solid rgba(16, 185, 129, 0.3); background: linear-gradient(180deg, rgba(16, 185, 129, 0.06) 0%, rgba(21, 26, 48, 0.8) 100%); box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1);">
                        <div style="color: var(--success); font-size: 1.8rem; margin-bottom: 1rem;"><i class="fa-solid fa-circle-check"></i></div>
                        <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.75rem; color: #fff;">Con Mecanic OS (Control Total)</h3>
                        <ul style="list-style: none; padding: 0; margin: 0; color: #e2e8f0; font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.75rem;">
                            <li style="display: flex; gap: 0.5rem; align-items: flex-start;"><i class="fa-solid fa-check" style="color: var(--success); margin-top: 3px;"></i> Ingreso digital con fotos de inventario, nivel de gasolina y firma del cliente en pantalla.</li>
                            <li style="display: flex; gap: 0.5rem; align-items: flex-start;"><i class="fa-solid fa-check" style="color: var(--success); margin-top: 3px;"></i> Facturación Electrónica en 1 clic que liquida el presupuesto y emite DTE con QR oficial.</li>
                            <li style="display: flex; gap: 0.5rem; align-items: flex-start;"><i class="fa-solid fa-check" style="color: var(--success); margin-top: 3px;"></i> Kárdex automatizado, alerta de stock mínimo y cálculo exacto de comisiones y nómina legal.</li>
                            <li style="display: flex; gap: 0.5rem; align-items: flex-start;"><i class="fa-solid fa-check" style="color: var(--success); margin-top: 3px;"></i> Control de apertura y corte de caja diario con registro ciego de billetes.</li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- MÓDULOS DEL SISTEMA -->
            <section id="modulos" style="padding: 4rem 1.5rem; background: rgba(15, 19, 34, 0.6); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
                <div style="max-width: 1200px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 3.5rem;">
                        <span style="color: var(--cyan); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Módulos Integrados</span>
                        <h2 style="font-family:'Outfit', sans-serif; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; margin-top: 0.5rem;">
                            Todo lo que necesitas para operar tu taller
                        </h2>
                        <p style="color: var(--text-secondary); max-width: 600px; margin: 0.5rem auto 0 auto; font-size: 0.95rem;">
                            Diseñado específicamente para el flujo real de trabajo: Patio ➔ Taller ➔ Caja ➔ Contabilidad.
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                        
                        <!-- Card 1 -->
                        <div class="glass-card" style="padding: 1.75rem; border-radius: 14px; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(99, 102, 241, 0.4)';" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)';">
                            <div style="width: 48px; height: 48px; background: rgba(99, 102, 241, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.4rem; margin-bottom: 1.25rem;">
                                <i class="fa-solid fa-file-signature"></i>
                            </div>
                            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Recepción & Hoja de Ingreso</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">
                                Registra datos del vehículo, inventario físico de accesorios, kilometraje, nivel de combustible y firma digital de conformidad del cliente al recibir el auto.
                            </p>
                        </div>

                        <!-- Card 2 -->
                        <div class="glass-card" style="padding: 1.75rem; border-radius: 14px; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(16, 185, 129, 0.4)';" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)';">
                            <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--success); font-size: 1.4rem; margin-bottom: 1.25rem;">
                                <i class="fa-solid fa-clipboard-check"></i>
                            </div>
                            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Inspección 21 Puntos</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">
                                Diagnóstico visual interactivo por semáforo (Verde, Amarillo, Rojo) de frenos, suspensión, fluidos, luces y llantas para entregar un reporte profesional al cliente.
                            </p>
                        </div>

                        <!-- Card 3 -->
                        <div class="glass-card" style="padding: 1.75rem; border-radius: 14px; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(6, 182, 212, 0.4)';" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)';">
                            <div style="width: 48px; height: 48px; background: rgba(6, 182, 212, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--cyan); font-size: 1.4rem; margin-bottom: 1.25rem;">
                                <i class="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Presupuestos y Cotizaciones</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">
                                Generador de presupuestos con cálculo automático de repuestos, mano de obra, descuentos, promociones, IVA y retenciones. Exportación e impresión limpia.
                            </p>
                        </div>

                        <!-- Card 4 -->
                        <div class="glass-card" style="padding: 1.75rem; border-radius: 14px; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(245, 158, 11, 0.4)';" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)';">
                            <div style="width: 48px; height: 48px; background: rgba(245, 158, 11, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--warning); font-size: 1.4rem; margin-bottom: 1.25rem;">
                                <i class="fa-solid fa-cubes-stacked"></i>
                            </div>
                            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Control Visual de Taller (Kanban)</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">
                                Tablero para seguir el estado de cada vehículo (En Espera, En Reparación, Esperando Repuestos, Terminado) y asignar técnicos responsables.
                            </p>
                        </div>

                        <!-- Card 5 -->
                        <div class="glass-card" style="padding: 1.75rem; border-radius: 14px; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(16, 185, 129, 0.4)';" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)';">
                            <div style="width: 48px; height: 48px; background: rgba(16, 185, 129, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--success); font-size: 1.4rem; margin-bottom: 1.25rem;">
                                <i class="fa-solid fa-wallet"></i>
                            </div>
                            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Facturador DTE & Venta Rápida</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">
                                Emisión de Facturas Electrónicas (FE) y Crédito Fiscal (CCF) con transmisión al Ministerio de Hacienda en tiempo real, descarga de JSON firmado y ticket térmico.
                            </p>
                        </div>

                        <!-- Card 6 -->
                        <div class="glass-card" style="padding: 1.75rem; border-radius: 14px; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(168, 85, 247, 0.4)';" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)';">
                            <div style="width: 48px; height: 48px; background: rgba(168, 85, 247, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 1.4rem; margin-bottom: 1.25rem;">
                                <i class="fa-solid fa-cash-register"></i>
                            </div>
                            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Caja Diaria & Cuentas x Cobrar</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">
                                Apertura con saldo base, control de cobros en efectivo/tarjeta/transferencia, arqueo de billetes y seguimiento de créditos otorgados a clientes con abonos.
                            </p>
                        </div>

                        <!-- Card 7 -->
                        <div class="glass-card" style="padding: 1.75rem; border-radius: 14px; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(99, 102, 241, 0.4)';" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)';">
                            <div style="width: 48px; height: 48px; background: rgba(99, 102, 241, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.4rem; margin-bottom: 1.25rem;">
                                <i class="fa-solid fa-boxes-stacked"></i>
                            </div>
                            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Inventario & Kárdex</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">
                                Catálogo de repuestos, costos, precios de venta, control de existencias mínimas y registro automático de entradas por compra y salidas por facturación.
                            </p>
                        </div>

                        <!-- Card 8 -->
                        <div class="glass-card" style="padding: 1.75rem; border-radius: 14px; transition: transform 0.2s, border-color 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(6, 182, 212, 0.4)';" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)';">
                            <div style="width: 48px; height: 48px; background: rgba(6, 182, 212, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--cyan); font-size: 1.4rem; margin-bottom: 1.25rem;">
                                <i class="fa-solid fa-users-gear"></i>
                            </div>
                            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Planilla Legal SV & Comisiones</h3>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">
                                Cálculo exacto de retenciones de ley de El Salvador (ISSS, AFP, ISR por tramos) y pago de comisiones porcentuales a mecánicos por trabajo terminado.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            <!-- SECCIÓN DTE HACIENDA -->
            <section id="dte-hacienda" style="padding: 5rem 1.5rem; max-width: 1100px; margin: 0 auto;">
                <div class="glass-card" style="padding: 3rem 2.5rem; border-radius: 20px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%); border: 1px solid rgba(16, 185, 129, 0.3); display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2.5rem; align-items: center;">
                    <div>
                        <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(16, 185, 129, 0.15); padding: 0.35rem 1rem; border-radius: 50px; color: var(--success); font-weight: 700; font-size: 0.8rem; margin-bottom: 1rem;">
                            <i class="fa-solid fa-shield-check"></i> Cumplimiento Tributario
                        </div>
                        <h2 style="font-family:'Outfit', sans-serif; font-size: 2.2rem; font-weight: 800; line-height: 1.2; margin-bottom: 1rem;">
                            Facturación Electrónica DTE Lista para Usar
                        </h2>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
                            Olvídate de multas o sistemas complicados. Mecanic OS se conecta de forma directa con la API del Ministerio de Hacienda de El Salvador para firmar y validar tus DTEs en segundos.
                        </p>
                        <div style="display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem; color: #e2e8f0;">
                            <div style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check-double" style="color: var(--success);"></i> Factura Electrónica (DTE-01) y Crédito Fiscal (DTE-03)</div>
                            <div style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check-double" style="color: var(--success);"></i> Validación automática de NIT / DUI y Número de Registro (NRC)</div>
                            <div style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check-double" style="color: var(--success);"></i> Generación automática de Código de Generación (UUID) y Sello de Recepción</div>
                            <div style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check-double" style="color: var(--success);"></i> Impresión en tickets térmicos de 80mm/58mm con Código QR fiscal</div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(15, 19, 34, 0.9); border: 1px solid var(--border-color); border-radius: 14px; padding: 1.75rem; box-shadow: 0 15px 35px rgba(0,0,0,0.5);">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1rem;">
                            <span style="font-weight: 700; color: #fff; font-size: 0.9rem;"><i class="fa-solid fa-receipt" style="color: var(--primary);"></i> Vista Previa Ticket Fiscal</span>
                            <span class="badge-tag badge-success" style="font-size: 0.7rem;">MH APROBADO</span>
                        </div>
                        <div style="font-family: monospace; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6;">
                            <div style="text-align: center; color: #fff; font-weight: bold; margin-bottom: 0.5rem;">AUTO SERVICIO EXPRESS, S.A. DE C.V.</div>
                            <div style="text-align: center; font-size: 0.75rem;">NIT: 0614-220190-102-1 | NRC: 245100-2</div>
                            <div style="text-align: center; font-size: 0.75rem; margin-bottom: 0.5rem;">DTE-03-M001P001-00001048</div>
                            <div style="border-top: 1px dashed rgba(255,255,255,0.15); margin: 0.5rem 0;"></div>
                            <div style="display: flex; justify-content: space-between;"><span>Cambio Aceite Sintético 5W30</span><span>$ 45.00</span></div>
                            <div style="display: flex; justify-content: space-between;"><span>Filtro de Aceite Original</span><span>$ 8.50</span></div>
                            <div style="display: flex; justify-content: space-between;"><span>Mano de Obra Servicio</span><span>$ 15.00</span></div>
                            <div style="border-top: 1px dashed rgba(255,255,255,0.15); margin: 0.5rem 0;"></div>
                            <div style="display: flex; justify-content: space-between; color: #fff; font-weight: bold; font-size: 0.9rem;"><span>TOTAL A PAGAR:</span><span style="color: var(--cyan);">$ 68.50</span></div>
                            <div style="text-align: center; margin-top: 1rem; color: var(--success); font-size: 0.75rem;">
                                <i class="fa-solid fa-qrcode" style="font-size: 2rem; display: block; margin-bottom: 0.25rem; color: #fff;"></i>
                                Sello MH: 2026B748-APROBADO
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- PLANES DE SUSCRIPCIÓN -->
            <section id="planes" style="padding: 5rem 1.5rem; max-width: 1100px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 3.5rem;">
                    <span style="color: var(--primary); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Modalidades de Inversión</span>
                    <h2 style="font-family:'Outfit', sans-serif; font-size: clamp(1.8rem, 3.5vw, 2.5rem); font-weight: 800; margin-top: 0.5rem;">
                        Elige la modalidad que mejor se adapte a tu taller
                    </h2>
                    <p style="color: var(--text-secondary); max-width: 600px; margin: 0.5rem auto 0 auto; font-size: 0.95rem;">
                        Transparencia total sin costos ocultos. Ambos planes incluyen todas las funcionalidades del sistema y conexión directa con Hacienda.
                    </p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; align-items: stretch;">
                    
                    <!-- Opción A: Licencia Mensual -->
                    <div class="glass-card" style="padding: 2.5rem 2rem; border-radius: 20px; display: flex; flex-direction: column; justify-content: space-between; background: rgba(21, 26, 48, 0.7); border: 1px solid var(--border-color); position: relative;">
                        <div>
                            <div style="display: inline-block; background: rgba(99, 102, 241, 0.15); color: var(--primary); font-size: 0.75rem; font-weight: 800; padding: 0.3rem 1rem; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1rem;">
                                OPCIÓN A
                            </div>
                            <h3 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff;">Licencia Mensual</h3>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.75rem; line-height: 1.5;">
                                <em>Ideal si buscan una inversión inicial baja y flexibilidad operativa total.</em>
                            </p>

                            <!-- Tabla de Inversión -->
                            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; margin-bottom: 2rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color);">
                                    <div>
                                        <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Pago Inicial (Único)</div>
                                        <div style="color: var(--text-secondary); font-size: 0.8rem;">Costo de Implementación</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <span style="font-family:'Outfit', sans-serif; font-size: 1.4rem; font-weight: 800; color: #fff;">$100.00</span>
                                        <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">+ IVA</span>
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: rgba(99, 102, 241, 0.08);">
                                    <div>
                                        <div style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">Pago Recurrente</div>
                                        <div style="color: var(--text-secondary); font-size: 0.8rem;">Mensualidad (Sistema + Factura Electrónica)</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <span style="font-family:'Outfit', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--primary);">$50.00</span>
                                        <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">+ IVA / mes</span>
                                    </div>
                                </div>
                            </div>

                            <ul style="list-style: none; padding: 0; margin: 0 0 2rem 0; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.88rem; color: #cbd5e1;">
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check" style="color: var(--primary);"></i> Sistema Operativo Mecanic OS completo</li>
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check" style="color: var(--primary);"></i> Facturación Electrónica DTE (MH El Salvador)</li>
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check" style="color: var(--primary);"></i> Recepción con Hoja de Ingreso y 21 Puntos</li>
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check" style="color: var(--primary);"></i> Inventario, Kárdex y Control de Caja</li>
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check" style="color: var(--primary);"></i> Soporte y Actualizaciones continuas en la nube</li>
                            </ul>
                        </div>

                        <a href="#registro" class="btn btn-secondary" style="width: 100%; justify-content: center; font-weight: 700; padding: 0.9rem; font-size: 1rem; border-radius: 10px;">
                            Seleccionar Licencia Mensual
                        </a>
                    </div>

                    <!-- Opción B: Licencia Vitalicia (Pago Único) -->
                    <div class="glass-card" style="padding: 2.5rem 2rem; border-radius: 20px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(21, 26, 48, 0.95) 100%); border: 2px solid var(--success); box-shadow: 0 15px 35px rgba(16, 185, 129, 0.2); position: relative;">
                        <div style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--success); color: #fff; font-size: 0.75rem; font-weight: 800; padding: 0.35rem 1.4rem; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                            RECOMENDADA • SÉ DUEÑO DEL SOFTWARE
                        </div>
                        <div>
                            <div style="display: inline-block; background: rgba(16, 185, 129, 0.2); color: var(--success); font-size: 0.75rem; font-weight: 800; padding: 0.3rem 1rem; border-radius: 50px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1rem;">
                                OPCIÓN B
                            </div>
                            <h3 style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff;">Licencia Vitalicia (Pago Único)</h3>
                            <p style="color: #e2e8f0; font-size: 0.9rem; margin-bottom: 1.75rem; line-height: 1.5;">
                                <em>La mejor opción para ser dueños de la licencia, pagando mensualmente solo el servicio de facturación y nube.</em>
                            </p>

                            <!-- Tabla de Inversión -->
                            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; overflow: hidden; margin-bottom: 2rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.08);">
                                    <div>
                                        <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Pago Inicial (Pago Único)</div>
                                        <div style="color: var(--text-secondary); font-size: 0.8rem;">Costo de Licencia e Implementación</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <span style="font-family:'Outfit', sans-serif; font-size: 1.5rem; font-weight: 800; color: var(--success);">$600.00</span>
                                        <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">+ IVA</span>
                                    </div>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: rgba(16, 185, 129, 0.1);">
                                    <div>
                                        <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Pago Recurrente Mínimo</div>
                                        <div style="color: var(--text-secondary); font-size: 0.8rem;">Mantenimiento Mensual (Factura Electrónica + Cloud)</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <span style="font-family:'Outfit', sans-serif; font-size: 1.6rem; font-weight: 800; color: var(--cyan);">$19.99</span>
                                        <span style="color: var(--text-muted); font-size: 0.75rem; display: block;">+ IVA / mes</span>
                                    </div>
                                </div>
                            </div>

                            <ul style="list-style: none; padding: 0; margin: 0 0 2rem 0; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.88rem; color: #fff;">
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check-double" style="color: var(--success);"></i> <strong>Propiedad permanente</strong> de la licencia del software</li>
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check-double" style="color: var(--success);"></i> <strong>Ahorro masivo recurrente</strong> ($19.99/mes vs $50/mes)</li>
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check-double" style="color: var(--success);"></i> Servidor en la Nube y Base de Datos Firebase incluida</li>
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check-double" style="color: var(--success);"></i> Conexión Directa con Ministerio de Hacienda (DTE ilimitados)</li>
                                <li style="display: flex; gap: 0.5rem; align-items: center;"><i class="fa-solid fa-check-double" style="color: var(--success);"></i> Todos los módulos: Taller, Nómina, Kárdex, BI y Caja</li>
                            </ul>
                        </div>

                        <a href="#registro" class="btn btn-primary" style="width: 100%; justify-content: center; font-weight: 700; padding: 0.95rem; font-size: 1rem; border-radius: 10px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); background: var(--success);">
                            <i class="fa-solid fa-rocket"></i> Adquirir Licencia Vitalicia
                        </a>
                    </div>

                </div>
            </section>

            <!-- CALL TO ACTION FINAL -->
            <section style="padding: 5rem 1.5rem; text-align: center; background: radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%);">
                <div style="max-width: 750px; margin: 0 auto;">
                    <h2 style="font-family:'Outfit', sans-serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; margin-bottom: 1rem;">
                        Transforma la gestión de tu taller hoy mismo
                    </h2>
                    <p style="color: var(--text-secondary); font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem;">
                        Únete a los talleres mecánicos que ya modernizaron su operación, ahorran horas en trámites de Hacienda y aumentaron su rentabilidad con Mecanic OS.
                    </p>
                    <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
                        <a href="#registro" class="btn btn-primary" style="padding: 1rem 2.8rem; font-size: 1.15rem; font-weight: 700; border-radius: 12px; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);">
                            <i class="fa-solid fa-rocket"></i> Registrar Mi Taller Ahora
                        </a>
                    </div>
                </div>
            </section>

            <!-- FOOTER -->
            <footer style="border-top: 1px solid var(--border-color); padding: 3rem 1.5rem; background: rgba(10, 13, 22, 0.95); font-size: 0.85rem; color: var(--text-muted);">
                <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-family:'Outfit', sans-serif; font-size: 1.2rem; font-weight: 700; color: #fff;">
                        <i class="fa-solid fa-gears" style="color: var(--primary);"></i> Mecanic OS
                    </div>
                    <div>
                        © ${new Date().getFullYear()} Mecanic OS. Todos los derechos reservados. Desarrollado para El Salvador.
                    </div>
                    <div style="display: flex; gap: 1.5rem;">
                        <a href="#terminos" style="color: var(--text-secondary); text-decoration: none;">Términos de Servicio</a>
                        <a href="#admin-solicitudes" style="color: var(--text-secondary); text-decoration: none;">Acceso Admin</a>
                    </div>
                </div>
            </footer>

        </div>
    `;

    // Botón de desconexión si ya está logueado en la landing
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
                if (typeof handleRouting === 'function') handleRouting();
            }
        });
    }
}
