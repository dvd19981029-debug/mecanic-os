const { makeWompiRequest } = require('../utils/httpHelper');

/**
 * Genera un enlace de pago recurrente en Wompi SV.
 */
async function createPaymentLink(req, res) {
    try {
        const { workshopId, workshopName, planName, amount, diaDePago, wompiConfig } = req.body;
        
        const config = wompiConfig || {};
        const clientId = config.clientId || process.env.WOMPI_CLIENT_ID;
        const clientSecret = config.clientSecret || process.env.WOMPI_CLIENT_SECRET;
        let appId = config.appId || process.env.WOMPI_APP_ID;
        
        const isSimulation = !clientId || !clientSecret || 
                            clientId.trim() === '' || clientSecret.trim() === '' || 
                            clientId.startsWith('simulado_') || clientSecret.startsWith('simulado_') ||
                            clientId.startsWith('test_') || clientSecret.startsWith('test_');
        
        if (isSimulation) {
            console.log("Wompi: Running in SIMULATION MODE. Generating local redirect URL.");
            const mockIdEnlace = "MOCK-ENLACE-" + Math.floor(Date.now() / 1000).toString() + "-" + Math.floor(Math.random()*10000);
            
            const host = req.headers.host || 'localhost:3005';
            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const redirectUrl = `${protocol}://${host}/#pago-suscripcion-wompi-callback?id=${workshopId}&idEnlace=${mockIdEnlace}&status=success`;
            
            return res.json({
                success: true,
                simulated: true,
                idEnlace: mockIdEnlace,
                urlEnlace: redirectUrl
            });
        }
        
        console.log(`Wompi: Connecting to Wompi SV with Client ID: ${clientId.substring(0,8)}...`);
        
        // 1. Get OAuth Token
        const tokenUrl = 'https://id.wompi.sv/connect/token';
        const tokenBody = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience: 'wompi_api'
        }).toString();
        
        const tokenRes = await makeWompiRequest(tokenUrl, 'POST', {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(tokenBody)
        }, tokenBody);
        
        if (tokenRes.statusCode !== 200) {
            console.error("Wompi OAuth Token Error:", tokenRes.body);
            return res.status(tokenRes.statusCode).json({ 
                success: false, 
                error: "AuthError", 
                message: "Error de autenticación con Wompi. Por favor verifica tus credenciales.", 
                details: tokenRes.body 
            });
        }
        
        const { access_token } = JSON.parse(tokenRes.body);
        
        // 2. Fetch appId if not provided
        if (!appId || appId.trim() === '') {
            console.log("Wompi: Fetching idAplicativo automatically...");
            const appRes = await makeWompiRequest('https://api.wompi.sv/Aplicativo', 'GET', {
                'Authorization': `Bearer ${access_token}`
            });
            
            if (appRes.statusCode === 200) {
                const appData = JSON.parse(appRes.body);
                appId = appData.idAplicativo;
                console.log("Wompi: Retrieved idAplicativo:", appId);
            } else {
                console.error("Wompi Fetch Aplicativo Error:", appRes.body);
                return res.status(appRes.statusCode).json({ 
                    success: false, 
                    error: "AppFetchError", 
                    message: "No se pudo recuperar el ID del aplicativo desde Wompi.", 
                    details: appRes.body 
                });
            }
        }
        
        // 3. Create EnlacePagoRecurrente
        const createLinkUrl = 'https://api.wompi.sv/EnlacePagoRecurrente';
        const linkPayload = JSON.stringify({
            diaDePago: parseInt(diaDePago) || 1,
            nombre: `Mecanic OS - Plan ${planName}`,
            idAplicativo: appId,
            monto: parseFloat(amount),
            descripcionProducto: `Suscripción mensual a Mecanic OS - Taller ${workshopName}`
        });
        
        console.log("Wompi: Creating EnlacePagoRecurrente...");
        const linkRes = await makeWompiRequest(createLinkUrl, 'POST', {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(linkPayload)
        }, linkPayload);
        
        if (linkRes.statusCode !== 200 && linkRes.statusCode !== 201) {
            console.error("Wompi Create Link Error:", linkRes.body);
            return res.status(linkRes.statusCode).json({ 
                success: false, 
                error: "CreateLinkError", 
                message: "Error al generar enlace de cobro recurrente en Wompi.", 
                details: linkRes.body 
            });
        }
        
        const linkData = JSON.parse(linkRes.body);
        return res.json({
            success: true,
            simulated: false,
            idEnlace: linkData.idEnlace,
            urlEnlace: linkData.urlEnlace
        });
        
    } catch (err) {
        console.error("Wompi Exception:", err);
        return res.status(500).json({ success: false, error: "InternalError", message: err.message });
    }
}

/**
 * Consulta el estado de la suscripción de un enlace de pago en Wompi SV.
 */
async function checkSubscription(req, res) {
    try {
        const { idEnlace, wompiConfig } = req.body;
        
        if (!idEnlace) {
            return res.status(400).json({ success: false, message: "idEnlace es requerido" });
        }
        
        if (idEnlace.startsWith('MOCK-ENLACE-')) {
            console.log(`Wompi Check: Simulating active subscription for ${idEnlace}`);
            return res.json({
                success: true,
                subscribed: true,
                simulated: true,
                details: {
                    status: 'activo',
                    nombreCliente: 'Taller Simulado (Modo Pruebas)',
                    fechaAfiliacion: new Date().toISOString()
                }
            });
        }
        
        const config = wompiConfig || {};
        const clientId = config.clientId || process.env.WOMPI_CLIENT_ID;
        const clientSecret = config.clientSecret || process.env.WOMPI_CLIENT_SECRET;
        
        if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
            return res.status(400).json({ success: false, message: "Credenciales de Wompi faltantes para verificar la suscripción." });
        }
        
        // 1. Get OAuth Token
        const tokenUrl = 'https://id.wompi.sv/connect/token';
        const tokenBody = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience: 'wompi_api'
        }).toString();
        
        const tokenRes = await makeWompiRequest(tokenUrl, 'POST', {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(tokenBody)
        }, tokenBody);
        
        if (tokenRes.statusCode !== 200) {
            return res.status(tokenRes.statusCode).json({ 
                success: false, 
                error: "AuthError", 
                message: "Error de autenticación con Wompi al verificar suscripción.", 
                details: tokenRes.body 
            });
        }
        
        const { access_token } = JSON.parse(tokenRes.body);
        
        // 2. Fetch subscriptions for link
        const subUrl = `https://api.wompi.sv/EnlacePagoRecurrente/${idEnlace}/suscripciones`;
        console.log(`Wompi: Checking subscriptions for link ${idEnlace}...`);
        
        const subRes = await makeWompiRequest(subUrl, 'GET', {
            'Authorization': `Bearer ${access_token}`
        });
        
        if (subRes.statusCode !== 200) {
            return res.status(subRes.statusCode).json({ 
                success: false, 
                error: "CheckSubError", 
                message: "Error al consultar las suscripciones en Wompi.", 
                details: subRes.body 
            });
        }
        
        const list = JSON.parse(subRes.body);
        const hasActive = Array.isArray(list) && list.length > 0;
        
        return res.json({
            success: true,
            subscribed: hasActive,
            simulated: false,
            list: list
        });
        
    } catch (err) {
        console.error("Wompi Check Exception:", err);
        return res.status(500).json({ success: false, error: "InternalError", message: err.message });
    }
}

/**
 * Desactiva un enlace de pago recurrente en Wompi SV.
 */
async function deactivateLink(req, res) {
    try {
        const { idEnlace, wompiConfig } = req.body;
        
        if (!idEnlace) {
            return res.status(400).json({ success: false, message: "idEnlace es requerido" });
        }
        
        if (idEnlace.startsWith('MOCK-ENLACE-')) {
            console.log(`Wompi Deactivate: Simulating deactivation for ${idEnlace}`);
            return res.json({ success: true, deactivated: true, simulated: true });
        }
        
        const config = wompiConfig || {};
        const clientId = config.clientId || process.env.WOMPI_CLIENT_ID;
        const clientSecret = config.clientSecret || process.env.WOMPI_CLIENT_SECRET;
        
        if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
            return res.status(400).json({ success: false, message: "Credenciales de Wompi faltantes para desactivar la suscripción." });
        }
        
        // 1. Get OAuth Token
        const tokenUrl = 'https://id.wompi.sv/connect/token';
        const tokenBody = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience: 'wompi_api'
        }).toString();
        
        const tokenRes = await makeWompiRequest(tokenUrl, 'POST', {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(tokenBody)
        }, tokenBody);
        
        if (tokenRes.statusCode !== 200) {
            return res.status(tokenRes.statusCode).json({ 
                success: false, 
                error: "AuthError", 
                message: "Error de autenticación con Wompi al desactivar.", 
                details: tokenRes.body 
            });
        }
        
        const { access_token } = JSON.parse(tokenRes.body);
        
        // 2. Deactivate link
        const deactivateUrl = `https://api.wompi.sv/EnlacePagoRecurrente/${idEnlace}`;
        console.log(`Wompi: Deactivating recurring link ${idEnlace}...`);
        
        const deactivateRes = await makeWompiRequest(deactivateUrl, 'POST', {
            'Authorization': `Bearer ${access_token}`,
            'Content-Length': '0'
        });
        
        if (deactivateRes.statusCode !== 200 && deactivateRes.statusCode !== 204) {
            return res.status(deactivateRes.statusCode).json({ 
                success: false, 
                error: "DeactivateError", 
                message: "Error al desactivar el enlace de cobro en Wompi.", 
                details: deactivateRes.body 
            });
        }
        
        return res.json({
            success: true,
            deactivated: true,
            simulated: false
        });
        
    } catch (err) {
        console.error("Wompi Deactivate Exception:", err);
        return res.status(500).json({ success: false, error: "InternalError", message: err.message });
    }
}

/**
 * Prueba de conexión a la API de Wompi.
 */
async function testConnection(req, res) {
    try {
        const { wompiConfig } = req.body;
        const config = wompiConfig || {};
        const clientId = (config.clientId && config.clientId.trim() !== '') ? config.clientId : process.env.WOMPI_CLIENT_ID;
        const clientSecret = (config.clientSecret && config.clientSecret.trim() !== '') ? config.clientSecret : process.env.WOMPI_CLIENT_SECRET;
        
        if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
            return res.status(400).json({ success: false, message: "Debe ingresar Client ID and Client Secret para realizar la prueba o configurarlos en el servidor." });
        }
        
        // Get OAuth Token
        const tokenUrl = 'https://id.wompi.sv/connect/token';
        const tokenBody = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
            audience: 'wompi_api'
        }).toString();
        
        console.log(`Wompi Test: Authenticating client ID ${clientId.substring(0,8)}...`);
        const tokenRes = await makeWompiRequest(tokenUrl, 'POST', {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(tokenBody)
        }, tokenBody);
        
        if (tokenRes.statusCode !== 200) {
            console.error("Wompi Test Auth Error:", tokenRes.body);
            return res.json({ 
                success: false, 
                message: "Fallo de autenticación con Wompi.",
                details: tokenRes.body
            });
        }
        
        const { access_token } = JSON.parse(tokenRes.body);
        
        // Fetch Aplicativo
        console.log("Wompi Test: Fetching aplicativo...");
        const appRes = await makeWompiRequest('https://api.wompi.sv/Aplicativo', 'GET', {
            'Authorization': `Bearer ${access_token}`
        });
        
        if (appRes.statusCode === 200) {
            const appData = JSON.parse(appRes.body);
            return res.json({ 
                success: true, 
                message: `¡Conexión establecida con éxito! Tu aplicativo '${appData.nombre || 'Sin nombre'}' está listo y conectado en Wompi SV.`,
                appName: appData.nombre,
                appId: appData.idAplicativo
            });
        } else {
            console.error("Wompi Test Fetch Aplicativo Error:", appRes.body);
            return res.json({ 
                success: false, 
                message: "Autenticación exitosa, pero no se pudo consultar el aplicativo. Verifica los permisos de tus llaves.",
                details: appRes.body
            });
        }
    } catch (err) {
        console.error("Wompi Test Exception:", err);
        return res.status(500).json({ success: false, error: "InternalError", message: err.message });
    }
}

module.exports = {
    createPaymentLink,
    checkSubscription,
    deactivateLink,
    testConnection
};
