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
    calculateElSalvadorPeriodPayroll,
    safe
} from '../../app.js?v=61';
import {
    showToast,
    escapeHtml,
    hashPassword,
    encryptString,
    decryptString,
    sanitizeBackendUrl,
    getBackendUrl,
    downloadExcelReport
} from '../utils.js?v=61';
import { renderSaaSAdminLogin } from './auth.js?v=61';

export async function renderRegistroSaaS(container) {
    const db = getDatabase();
    const plans = await dataService.saas.getPlans();
    const coupons = await dataService.saas.getCoupons();
    window.saasSelectedLogoBase64 = ''; // Reset selected logo

    container.innerHTML = html`
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
                    <div class="form-group" style="margin-bottom:1rem;">
                        <label>Nombre Comercial</label>
                        <input type="text" id="reg-taller-nombre-comercial" required placeholder="Ej: Taller San José" style="padding:0.6rem;">
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
                                ${safe(getGirosOptionsHtml())}
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
                                ${safe(plans.map(p => `<option value="${p.nombre}" data-price="${p.precio}">${p.nombre} ($${p.precio}/mes)</option>`).join(''))}
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
            msgDiv.innerHTML = html`<span style="color:var(--success);"><i class="fa-solid fa-circle-check"></i> Cupón "${selectedCoupon.codigo}" aplicado (${selectedCoupon.descripcion}). Cuota: <strong>$${finalPrice.toFixed(2)}/mes</strong> (Antes $${originalPrice.toFixed(2)})</span>`;
        } else {
            msgDiv.innerHTML = html`<span style="color:var(--text-secondary);">Cuota estándar: $${originalPrice.toFixed(2)}/mes</span>`;
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
                msgDiv.innerHTML = html`<span style="color:var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Código inválido o expirado</span>`;
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
        const email = document.getElementById('reg-taller-correo').value;
        const pass = document.getElementById('reg-prop-pass').value;
        
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
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const origHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando taller...';

        const registerRequest = async (uid) => {
            const requestData = {
                id: uid,
                nombre: document.getElementById('reg-taller-nombre').value,
                alias: document.getElementById('reg-taller-nombre-comercial').value,
                nombre_comercial: document.getElementById('reg-taller-nombre-comercial').value,
                giro: (() => { const el = document.getElementById('reg-taller-giro'); return el.options[el.selectedIndex].getAttribute('data-desc') || el.value; })(),
                direccion: document.getElementById('reg-taller-direccion').value,
                telefono: document.getElementById('reg-taller-telefono').value,
                correo: email,
                nit: document.getElementById('reg-taller-tipo-doc').value === 'NIT' ? document.getElementById('reg-taller-num-doc').value : '',
                nrc: document.getElementById('reg-taller-nrc').value,
                logoText: document.getElementById('reg-taller-nombre-comercial').value.substring(0, 15).toUpperCase(),
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
            
            try {
                await dataService.saas.createRequest(requestData);
                // Cerrar sesión inmediatamente para que no queden autenticados
                if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                    await firebase.auth().signOut();
                }
                
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
            } catch (err) {
                console.error("Error al registrar el taller:", err);
                showToast("Error al guardar la solicitud: " + err.message, "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = origHtml;
            }
        };

        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            firebase.auth().createUserWithEmailAndPassword(email, pass)
                .then((userCredential) => {
                    registerRequest(userCredential.user.uid);
                })
                .catch((error) => {
                    console.error("Error al crear usuario en Firebase Auth:", error);
                    showToast(`Error al crear la cuenta: ${error.message}`, "error");
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origHtml;
                });
        } else {
            const mockUid = 'REQ-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            registerRequest(mockUid);
        }
    });
}


export function renderSuspendedSaaS(container) {
    const db = getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    const workshop = saas.workshopData || {};
    const workshopName = workshop.nombre || 'tu taller';
    
    container.innerHTML = html`
        <div style="max-width: 650px; margin: 6rem auto; padding: 3rem; background: var(--bg-sidebar); border: 1px solid var(--danger); border-radius: 12px; text-align: center; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.15);">
            <div style="font-size: 5rem; color: var(--danger); margin-bottom: 1.5rem;">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 style="font-family:'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
                Acceso Suspendido
            </h2>
            <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.6; margin-bottom: 2rem;">
                La suscripción para el taller <strong>${workshopName}</strong> se encuentra temporalmente inhabilitada.<br>
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



export function renderPagoSuscripcionSaaS(container, queryParams) {
    const db = getDatabase();
    const targetId = queryParams.id || (db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.id);
    const ws = (db.solicitudes_registro || []).find(s => s.id === targetId);
    
    if (!ws) {
        container.innerHTML = html`
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
    
    container.innerHTML = html`
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
                                ${safe((originalPlan.features || ['Gestión de taller integrada', 'Facturación electrónica DTE', 'Soporte prioritario']).map(f => `
                                    <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:var(--text-secondary);">
                                        <i class="fa-solid fa-circle-check" style="color:var(--success); font-size:0.95rem;"></i>
                                        <span>${f}</span>
                                    </div>
                                `).join(''))}
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
                if (couponMsg) couponMsg.innerHTML = html`<span style="color:var(--success);"><i class="fa-solid fa-check"></i> Cupón válido aplicado</span>`;
                showToast("Cupón de descuento aplicado con éxito.", "success");
            } else {
                selectedCoupon = null;
                if (discountRow) discountRow.style.display = 'none';
                finalPrice = originalPlan.precio;
                if (totalValEl) totalValEl.textContent = `$${finalPrice.toFixed(2)}`;
                if (couponMsg) couponMsg.innerHTML = html`<span style="color:var(--danger);"><i class="fa-solid fa-circle-xmark"></i> Cupón inválido</span>`;
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

                const backendUrl = getBackendUrl(currentDb);
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


export function renderSuccessState(container, payment, workshop) {
    container.innerHTML = html`
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


export function renderPagoSuscripcionWompiCallback(container, queryParams) {
    const id = queryParams.id;
    const idEnlace = queryParams.idEnlace;
    const status = queryParams.status;

    if (!id || !idEnlace || status !== 'success') {
        container.innerHTML = html`
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

    container.innerHTML = html`
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

        const backendUrl = getBackendUrl(db);
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



export async function renderAdminSolicitudes(container) {
    if (sessionStorage.getItem('mecanic_os_saas_admin_auth') !== 'true') {
        renderSaaSAdminLogin(container);
        return;
    }
    const db = getDatabase();
    const currentUser = (typeof firebase !== 'undefined' && firebase.apps.length > 0) ? firebase.auth().currentUser : null;
    const isFirebaseAdmin = currentUser && ['dvd19981029@gmail.com', 'amejia2998@gmail.com'].includes((currentUser.email || '').toLowerCase());
    
    // Wire up central requests listener
    if (typeof dbFirestore !== 'undefined' && dbFirestore && !window.saasRequestsListenerWired) {
        window.saasRequestsListenerWired = true;
        dataService.saas.listenRequests((requests) => {
            if (window.location.hash !== '#admin-solicitudes') return;
            const isEditing = window.saasEditWorkshopId || window.saasPayWorkshopId || window.saasConfigWorkshopId || window.saasViewWorkshopDetailsId || window.saasAddWorkshopForm || window.saasViewReceiptPaymentId || window.saasAddPlanForm || window.saasAddCouponForm || window.saasEditPlanId;
            if (!isEditing) {
                renderAdminSolicitudes(container);
            }
        });
        return;
    }
    
    // Load and sync central SaaS config from /saas_metrics/config
    if (typeof dbFirestore !== 'undefined' && dbFirestore) {
        try {
            const configDoc = await dbFirestore.collection("saas_metrics").doc("config").get();
            if (configDoc.exists) {
                const saasConfigGlobal = configDoc.data();
                db.saas_config = saasConfigGlobal;
                localStorage.setItem('mecanic_os_db', JSON.stringify(db));
            } else if (db.saas_config && db.saas_config.wompi && db.saas_config.wompi.clientId) {
                // Migrate local config of logged-in user to central cloud doc
                await dbFirestore.collection("saas_metrics").doc("config").set(db.saas_config);
                console.log("Migrated local SaaS config to central cloud config.");
            }
        } catch (e) {
            console.error("Error syncing central SaaS config:", e);
        }
    }

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
                                        ${safe(getGirosOptionsHtml(workshop.actividad_economica || workshop.giro))}
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
                                ${safe(wsPayments.map(p => {
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
                                }).join(''))}
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
                        ${safe(paymentsTableHtml)}
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
                                <label>URL de Servidor Backend / Proxy (Opcional - Usar Global si vacío)</label>
                                <input type="text" id="detail-dte-backendurl" value="${dte.backendUrl || ''}" placeholder="https://mecanic-os-backend.onrender.com" style="padding:0.5rem; font-size:0.85rem; background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); border-radius:4px; height:34px; width:100%;">
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
                            ${safe(workshop.idEnlace ? `
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
                            `)}
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html`
            <div style="max-width:900px; margin:2rem auto; padding:2rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <!-- Header del Expediente -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1.25rem;">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            ${safe(workshop.logo ? `<img src="${workshop.logo}" style="max-height:45px; max-width:100px; object-fit:contain; border-radius:4px; padding:2px; background:white;" />` : `<div style="font-size: 1.8rem; color: var(--primary);"><i class="fa-solid fa-gears"></i></div>`)}
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
                    ${safe(tabBodyHtml)}
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
                        const backendUrl = document.getElementById('detail-dte-backendurl').value.trim();

                        workshop.dte_config = {
                            apiKey,
                            ambiente: apiKey.startsWith('live_') ? '01' : '00',
                            mhCode: '0001',
                            posNumber: '1',
                            backendUrl
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
                        const customBackendUrl = document.getElementById('detail-dte-backendurl').value.trim();
                        if (!apiKey) {
                            showToast("Ingrese la API Key para realizar la prueba.", "warning");
                            return;
                        }

                        testDteBtn.disabled = true;
                        const origText = testDteBtn.innerHTML;
                        testDteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Conectando...';

                        const backendUrl = customBackendUrl || getBackendUrl(db);
                        fetch(`${backendUrl}/api/dte/test-connection`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ apiKey, workshopId: workshopId })
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

                            const backendUrl = (workshop.dte_config && workshop.dte_config.backendUrl) || getBackendUrl(db);
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

                                const backendUrl = (workshop.dte_config && workshop.dte_config.backendUrl) || getBackendUrl(db);
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
        
        container.innerHTML = html`
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
                                ${safe(getGirosOptionsHtml())}
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
                                ${safe(plans.map(p => `<option value="${p.nombre}" data-price="${p.precio}">Plan ${p.nombre} ($${p.precio}/mes)</option>`).join(''))}
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
        
        container.innerHTML = html`
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
                            ${safe(payment.descuento_aplicado && payment.descuento_aplicado > 0 ? `
                            <tr style="color:var(--success);">
                                <td style="padding:0.5rem 0; font-size:0.8rem;">
                                    Descuento Promocional ${payment.cupon_usado ? `(${payment.cupon_usado})` : ''}
                                </td>
                                <td style="padding:0.5rem 0; text-align:right; font-weight:600;">-$${payment.descuento_aplicado.toFixed(2)}</td>
                            </tr>
                            ` : '')}
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
                    
                    ${safe(payment.dte ? `
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
                    ` : '')}
                    
                    <div style="margin-top:2rem; text-align:center; border-top:1px solid var(--border-color); padding-top:1rem; font-size:0.75rem; color:var(--text-secondary); font-style:italic;">
                        ¡Gracias por utilizar Mecanic OS! Si tienes dudas técnicas, contáctanos a soporte@mecanicos.com
                    </div>
                </div>
                
                <div style="display:flex; gap:1rem; margin-top:1.5rem;">
                    <button id="btn-print-receipt-modal" class="btn btn-primary" style="flex:1; padding:0.75rem;"><i class="fa-solid fa-print"></i> Imprimir Comprobante</button>
                    ${safe(payment.dte ? `
                    <a href="${payment.dte.mhDteUrl}" target="_blank" class="btn btn-secondary" style="flex:1; padding:0.75rem; display:flex; align-items:center; justify-content:center; gap:0.4rem; border-color:#2ecc71; color:#2ecc71; text-decoration:none;"><i class="fa-solid fa-cloud-arrow-down"></i> Descargar PDF MH</a>
                    ` : '')}
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
                            body {
                                font-family: 'Inter', sans-serif;
                                padding: 40px;
                                color: #000;
                                background: #fff;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                            th, td { border-bottom: 1px solid #ddd; padding: 8px 0; }
                            table { width: 100%; border-collapse: collapse; }
                            h3 { color: #4f46e5 !important; }
                            
                            @media print {
                                body {
                                    padding: 1.5cm !important;
                                    margin: 0 !important;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                                @page {
                                    margin: 0;
                                }
                            }
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
                printWindow.opener = null;
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
    container.innerHTML = html`
        <div style="max-width:1100px; margin:3rem auto; padding:1.5rem;">
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                <div>
                    <h2 style="font-family:'Outfit', sans-serif; font-size:2rem; font-weight:800; color:var(--text-primary);"><i class="fa-solid fa-user-shield" style="color:var(--primary);"></i> Consola del Administrador SaaS</h2>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin-top:0.25rem;">Panel central de control para suscripciones, cobros y clientes de Mecanic OS</p>
                </div>
                <div style="display:flex; gap:0.75rem;">
                    <button id="btn-logout-saas-admin" class="btn btn-secondary" style="color:var(--warning); border-color:var(--warning);"><i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión Admin</button>
                    <button id="btn-reset-demo-saas" class="btn btn-secondary" style="color:var(--danger); border-color:var(--danger);"><i class="fa-solid fa-trash-can"></i> Reiniciar Onboarding</button>
                    <a href="#taller-dashboard" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Volver a App</a>
                </div>
            </div>
            
            ${safe(!isFirebaseAdmin ? `
                <div style="background:rgba(231, 76, 60, 0.08); border:1px solid rgba(231, 76, 60, 0.3); color:#ff7675; padding:1.25rem; border-radius:8px; margin-bottom:1.5rem; display:flex; align-items:flex-start; gap:0.75rem; font-size:0.9rem; line-height:1.5; text-align:left;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:1.4rem; color:#e74c3c; margin-top:0.1rem;"></i>
                    <div style="flex:1;">
                        <strong style="color:#fff; font-family:'Outfit', sans-serif; font-size:1rem; display:block; margin-bottom:0.4rem;">⚠️ Advertencia: Sesión de Google Cloud Firebase no iniciada como Administrador</strong>
                        Has ingresado usando la contraseña maestra local. Firebase no tiene una sesión de red activa con privilegios de lectura para tu cuenta.
                        <br><br>
                        <strong>Para ver la base de datos de la nube y corregir este estado:</strong>
                        <ol style="margin: 0.5rem 0 0 1.25rem; padding: 0;">
                            <li>Haz clic en el botón <strong>"Cerrar Sesión Admin"</strong> arriba a la derecha.</li>
                            <li>Ingresa nuevamente tu correo (<code>${currentUser ? currentUser.email : 'tu-correo-admin@gmail.com'}</code>).</li>
                            <li>Digita tu <strong>contraseña real de Firebase Auth</strong> (no escribas <code>SuperAdminOS</code>, ya que ese código solo funciona a nivel local en tu navegador).</li>
                        </ol>
                    </div>
                </div>
            ` : '')}
            
            <!-- Tabs Bar -->
            <div class="saas-tabs-container">
                <button class="saas-tab-btn ${activeTab === 'sub' ? 'active' : ''}" onclick="window.switchSaaSTab('sub')"><i class="fa-solid fa-users-gear"></i> Suscripciones & Clientes</button>
                <button class="saas-tab-btn ${activeTab === 'req' ? 'active' : ''}" onclick="window.switchSaaSTab('req')"><i class="fa-solid fa-clock-rotate-left"></i> Solicitudes (${solicitudes.filter(s => s.status === 'pendiente').length})</button>
                <button class="saas-tab-btn ${activeTab === 'pay' ? 'active' : ''}" onclick="window.switchSaaSTab('pay')"><i class="fa-solid fa-receipt"></i> Historial de Cobros</button>
                <button class="saas-tab-btn ${activeTab === 'plans-coupons' ? 'active' : ''}" onclick="window.switchSaaSTab('plans-coupons')"><i class="fa-solid fa-gears"></i> Configuración, Planes & Cupones</button>
                <button class="saas-tab-btn ${activeTab === 'metrics' ? 'active' : ''}" onclick="window.switchSaaSTab('metrics')"><i class="fa-solid fa-chart-line"></i> Métricas SaaS</button>
                <button class="saas-tab-btn ${activeTab === 'dte-logs' ? 'active' : ''}" onclick="window.switchSaaSTab('dte-logs')"><i class="fa-solid fa-server"></i> Logs Servidor (DTE)</button>
            </div>
            
            <!-- Tab Body -->
            <div class="saas-tab-body">
                ${safe(activeTab === 'req' ? renderRequestsTab() : '')}
                ${safe(activeTab === 'sub' ? renderSubscriptionsTab() : '')}
                ${safe(activeTab === 'pay' ? renderPaymentsTab() : '')}
                ${safe(activeTab === 'plans-coupons' ? renderPlansCouponsTab() : '')}
                ${safe(activeTab === 'metrics' ? renderMetricsTab() : '')}
                ${safe(activeTab === 'dte-logs' ? renderDteLogsTab() : '')}
            </div>
        </div>
    `;
    
    // Bind logout button
    const logoutAdminBtn = document.getElementById('btn-logout-saas-admin');
    if (logoutAdminBtn) {
        logoutAdminBtn.addEventListener('click', () => {
            sessionStorage.removeItem('mecanic_os_saas_admin_auth');
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                firebase.auth().signOut().then(() => {
                    window.location.reload();
                });
            } else {
                window.location.reload();
            }
        });
    }
    
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
                    
                    const backendUrl = getBackendUrl(db);
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
                        
                        const backendUrl = getBackendUrl(db);
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
                        clientSecret: '', // Centralized in server environment variables
                        appId: document.getElementById('global-wompi-app-id').value.trim()
                    },
                    dte: {
                        apiKey: '' // Centralized in server environment variables
                    }
                };
                saveDatabase(currentDb).then(async () => {
                    // Save to central cloud document /saas_metrics/config
                    if (typeof dbFirestore !== 'undefined' && dbFirestore) {
                        try {
                            await dbFirestore.collection("saas_metrics").doc("config").set(currentDb.saas_config);
                            console.log("Central SaaS config successfully saved to cloud.");
                        } catch (err) {
                            console.error("Error saving global SaaS config to Firestore:", err);
                        }
                    }
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
                
                testWompiBtn.disabled = true;
                const originalText = testWompiBtn.innerHTML;
                testWompiBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probando Conexión...';
                
                const currentDb = getDatabase();
                const backendUrl = getBackendUrl(currentDb);
                
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
                
                testDteBtn.disabled = true;
                const originalText = testDteBtn.innerHTML;
                testDteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Probando Conexión...';
                
                const currentDb = getDatabase();
                const backendUrl = getBackendUrl(currentDb);
                
                fetch(`${backendUrl}/api/dte/test-connection`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey: apiKey, workshopId: 'admin_test' })
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
                    
                    progressContainer.innerHTML = html`
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
                            ${safe(writes > 15000 ? `<div style="color:#e74c3c; font-size:0.7rem; font-weight:bold; margin-top:3px;"><i class="fa-solid fa-triangle-exclamation"></i> ¡Advertencia: Acercándose al límite diario de 20k escrituras!</div>` : '')}
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
                        progressContainer.innerHTML = html`<span style="color:var(--danger); font-size:0.8rem;"><i class="fa-solid fa-circle-exclamation"></i> Error al cargar cuotas: ${err.message}</span>`;
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
                            ${safe(solicitudes.map(s => {
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
                            }).join(''))}
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
                
                ${safe(approvedClients.length === 0 ? `
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
                `)}
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
                            ${safe(payments.slice().sort((a,b) => b.fecha - a.fecha).map(p => `
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
                            `).join(''))}
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
                            ${safe(activeClients.length === 0 ? '<p style="font-size:0.8rem; color:var(--text-muted);">No hay talleres activos</p>' : activeClients.map((c, idx) => {
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
                            }).join(''))}
                        </div>
                    </div>
                </div>
                
                <!-- Chart 2: Canales de Cobro -->
                <div class="glass-card" style="padding:1.5rem;">
                    <h3 style="font-family:'Outfit', sans-serif; font-size:1.1rem; margin-bottom:1.5rem; color:var(--text-primary);">Volumen de Venta por Método de Pago</h3>
                    <div style="display:flex; flex-direction:column; gap:1rem;">
                        ${safe(Object.keys(paymentMethods).length === 0 ? '<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:2rem;">No hay cobros registrados</p>' : Object.entries(paymentMethods).map(([method, amount]) => {
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
                        }).join(''))}
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
                                <input type="text" id="global-wompi-client-secret" value="" disabled placeholder="Configurado en servidor (WOMPI_CLIENT_SECRET)" style="padding:0.6rem; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-muted); border-radius:4px; cursor:not-allowed;">
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
                                <input type="text" id="global-dte-api-key" value="" disabled placeholder="Configurada en servidor (FACTURALLAMA_API_KEY)" style="padding:0.6rem; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-muted); border-radius:4px; cursor:not-allowed;">
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
                        ${safe(plans.map(p => `
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
                        `).join(''))}
                    </div>
                </div>

                <!-- Coupons Section -->
                <div class="glass-card" style="padding:2rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3 style="font-family:'Outfit', sans-serif; font-size:1.25rem; color:var(--text-primary); margin:0;"><i class="fa-solid fa-ticket" style="color:var(--success);"></i> Cupones de Descuento y Promociones</h3>
                        <button id="btn-add-saas-coupon" class="btn btn-primary" style="padding:0.5rem 1rem;"><i class="fa-solid fa-plus"></i> Crear Cupón</button>
                    </div>

                    ${safe(coupons.length === 0 ? `
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
                    `)}
                </div>
            </div>
        `;
    }

    function renderDteLogsTab() {
        // Ejecutar carga asíncrona de logs
        setTimeout(async () => {
            const logsContainer = document.getElementById('saas-dte-logs-container');
            if (!logsContainer) return;
            
            if (typeof dbFirestore === 'undefined' || !dbFirestore) {
                logsContainer.innerHTML = `
                    <div style="text-align: center; color: var(--text-muted); padding: 3rem;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--warning); margin-bottom: 1rem;"></i>
                        <div>Firebase Firestore no está inicializado en este entorno de desarrollo.</div>
                    </div>
                `;
                return;
            }

            try {
                const logsSnap = await dbFirestore.collection('dte_api_logs')
                    .orderBy('timestamp', 'desc')
                    .limit(100)
                    .get();
                
                if (logsSnap.empty) {
                    logsContainer.innerHTML = `
                        <div style="text-align: center; color: var(--text-muted); padding: 3rem;">
                            <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
                            <div>No se han registrado peticiones al servidor todavía.</div>
                        </div>
                    `;
                    return;
                }

                let html = `
                    <div class="table-responsive">
                        <table class="saas-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid var(--border-color); padding: 0.5rem;">
                                    <th style="padding: 0.75rem;">Fecha / Hora</th>
                                    <th style="padding: 0.75rem;">Taller / Emisor</th>
                                    <th style="padding: 0.75rem;">Acción</th>
                                    <th style="padding: 0.75rem;">Tipo DTE</th>
                                    <th style="padding: 0.75rem;">Estado HTTP</th>
                                    <th style="padding: 0.75rem; text-align: center;">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                window.saasDteLogsData = window.saasDteLogsData || {};

                logsSnap.forEach(doc => {
                    const log = doc.data();
                    const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
                    const isSuccess = log.responseStatus >= 200 && log.responseStatus < 300;
                    const statusColor = isSuccess ? '#2ecc71' : '#e74c3c';
                    const docTypeLabel = (log.docType || '').toUpperCase();
                    
                    const logId = doc.id;
                    window.saasDteLogsData[logId] = log;

                    html += `
                        <tr style="border-bottom: 1px solid var(--border-color);">
                            <td style="padding: 0.75rem;">${dateStr}</td>
                            <td style="padding: 0.75rem;"><strong>${escapeHtml(log.workshopId || 'desconocido')}</strong></td>
                            <td style="padding: 0.75rem;"><span class="badge" style="background: rgba(52, 152, 219, 0.15); color: #3498db; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">${escapeHtml(log.action || 'DTE')}</span></td>
                            <td style="padding: 0.75rem;">${escapeHtml(docTypeLabel)}</td>
                            <td style="padding: 0.75rem;">
                                <span style="color: ${statusColor}; font-weight: bold; display: inline-flex; align-items: center; gap: 0.25rem;">
                                    <i class="fa-solid ${isSuccess ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
                                    ${log.responseStatus || 'N/A'}
                                </span>
                            </td>
                            <td style="padding: 0.75rem; text-align: center;">
                                <button class="btn btn-primary" onclick="window.viewDteJsonLog('${logId}')" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: 4px;">
                                    <i class="fa-solid fa-code"></i> Ver JSONs
                                </button>
                            </td>
                        </tr>
                    `;
                });

                html += `
                            </tbody>
                        </table>
                    </div>
                `;
                logsContainer.innerHTML = html;
            } catch (err) {
                console.error("Error fetching DTE logs:", err);
                logsContainer.innerHTML = `
                    <div style="text-align: center; color: var(--danger); padding: 3rem;">
                        <i class="fa-solid fa-circle-exclamation" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
                        <div>Error al cargar logs: ${escapeHtml(err.message)}</div>
                    </div>
                `;
            }
        }, 50);

        return `
            <div class="saas-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; margin-top: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                    <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.25rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-server" style="color: var(--primary);"></i> Historial de Peticiones del Servidor (Logs DTE)
                    </h3>
                    <button class="btn btn-secondary" onclick="window.switchSaaSTab('dte-logs')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: 4px;">
                        <i class="fa-solid fa-sync"></i> Refrescar
                    </button>
                </div>
                <div id="saas-dte-logs-container">
                    <div style="text-align: center; color: var(--text-muted); padding: 3rem;">
                        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2.5rem; color: var(--primary); margin-bottom: 1rem;"></i>
                        <div>Cargando logs del servidor...</div>
                    </div>
                </div>
            </div>
        `;
    }

    window.viewDteJsonLog = function(logId) {
        const log = (window.saasDteLogsData || {})[logId];
        if (!log) return;
        
        const modal = document.createElement('div');
        modal.className = 'custom-modal active';
        modal.id = 'dte-log-modal';
        modal.style.zIndex = '9999';
        
        const reqJson = JSON.stringify(log.requestPayload, null, 2);
        const resJson = typeof log.responseBody === 'object' 
            ? JSON.stringify(log.responseBody, null, 2) 
            : String(log.responseBody || 'No response body');
            
        modal.innerHTML = `
            <div class="modal-wrapper" style="max-width: 90%; width: 1200px; height: 85vh; display: flex; flex-direction: column; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; border-bottom: 1px solid var(--border-color);">
                    <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.2rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fa-solid fa-code" style="color: var(--primary);"></i> Petición DTE - ${escapeHtml(log.action || 'Detalle')} (${new Date(log.timestamp).toLocaleString()})
                    </h3>
                    <button class="modal-close" style="background: none; border: none; font-size: 1.75rem; cursor: pointer; color: var(--text-muted); hover { color: var(--text-primary); }">&times;</button>
                </div>
                <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; background: var(--bg-body);">
                    <div style="display: flex; flex-direction: column; height: 100%;">
                        <h4 style="margin: 0 0 0.5rem 0; font-family: 'Outfit', sans-serif; color: var(--text-secondary); display: flex; align-items: center; gap: 0.25rem; font-size: 0.95rem;">
                            <i class="fa-solid fa-arrow-up" style="color: #3498db;"></i> JSON Enviado (Petición)
                        </h4>
                        <pre style="flex: 1; background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; overflow: auto; border: 1px solid var(--border-color); margin: 0; line-height: 1.4; white-space: pre-wrap; word-break: break-all;">${escapeHtml(reqJson || 'No payload')}</pre>
                    </div>
                    <div style="display: flex; flex-direction: column; height: 100%;">
                        <h4 style="margin: 0 0 0.5rem 0; font-family: 'Outfit', sans-serif; color: var(--text-secondary); display: flex; align-items: center; gap: 0.25rem; font-size: 0.95rem;">
                            <i class="fa-solid fa-arrow-down" style="color: #2ecc71;"></i> JSON Recibido (Respuesta - HTTP ${log.responseStatus})
                        </h4>
                        <pre style="flex: 1; background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; overflow: auto; border: 1px solid var(--border-color); margin: 0; line-height: 1.4; white-space: pre-wrap; word-break: break-all;">${escapeHtml(resJson || 'No response body')}</pre>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 1.25rem; border-top: 1px solid var(--border-color); text-align: right; background: var(--bg-card); border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                    <button class="btn btn-secondary close-btn" style="padding: 0.5rem 1.25rem; border-radius: 4px;">Cerrar Visor</button>
                </div>
            </div>
        `;
        
        const close = () => { modal.remove(); };
        modal.querySelector('.modal-close').addEventListener('click', close);
        modal.querySelector('.close-btn').addEventListener('click', close);
        document.body.appendChild(modal);
    };
}



export function renderTerminosSaaS(container) {
    const db = getDatabase();
    const saas = db.saas_state || { status: 'guest' };
    
    if (saas.status !== 'approved_terms_pending') {
        window.location.hash = 'landing';
        handleRouting();
        return;
    }
    
    container.innerHTML = html`
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
                    <label>Contraseña de Acceso (Ingresa la contraseña que definiste al registrarte)</label>
                    <input type="password" id="terms-access-password" required placeholder="Tu contraseña" style="padding:0.6rem;">
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
        const enteredPass = document.getElementById('terms-access-password').value;
        
        if (!accepted) {
            alert("Debe aceptar los términos y condiciones marcando la casilla correspondiente.");
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const origHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Iniciando sesión y activando...';

        const email = saas.workshopData.correo;

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
                    Contraseña: await hashPassword("1234"), // default PIN is "1234" hashed
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
            
            showToast("¡Plataforma Activada! Tu PIN de acceso es '1234'. Cámbialo en Ajustes.", "success");
            window.location.hash = 'taller-dashboard';
            handleRouting();
        };

        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            firebase.auth().signInWithEmailAndPassword(email, enteredPass)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    try {
                        const hashedEntered = await hashPassword(enteredPass);
                        sessionStorage.setItem('mecanic_os_session_key', hashedEntered);
                        await window.initSecureDteConfig();
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
                    console.error("Firebase auth login error:", error);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origHtml;
                    showToast(`Error al iniciar sesión: ${error.message}`, "error");
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

export function initUserSwitcher() {
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
            
            card.innerHTML = html`
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
                
                passForm.innerHTML = html`
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
                passForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const enteredPass = document.getElementById('switcher-user-password').value;
                    const realPass = t.Contraseña || '';
                    const hashedEntered = await hashPassword(enteredPass);
                    
                    if (hashedEntered === realPass || enteredPass === realPass) {
                        if (enteredPass === realPass) {
                            t.Contraseña = hashedEntered;
                            saveDatabase(db);
                        }
                        sessionStorage.setItem('mecanic_os_session_key', hashedEntered);
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
                setActiveUser(null);
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
}

// Dismissed notifications list (stored in memory)
let dismissedNotifications = [];



