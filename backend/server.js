const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3005;
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    
    // Configurar cabeceras de CORS para permitir solicitudes cruzadas (Cross-Origin)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-API-Version');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    
    // Manejar preflight pre-vuelo de navegadores
    if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
    }
    
    // 1. API PROXY ENDPOINT FOR FACTURALLAMA
    // 1. BROWSER ERROR LOGGER FOR REMOTE DEBUGGING
    if (req.method === 'POST' && req.url === '/api/log-error') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            console.log("\n❌ [BROWSER EXCEPTION] ❌");
            try {
                const err = JSON.parse(body);
                console.log(`Message: ${err.message}`);
                console.log(`Source: ${err.source} (Line ${err.lineno}, Col ${err.colno})`);
                if (err.stack) console.log(`Stack Trace:\n${err.stack}`);
            } catch (pErr) {
                console.log(body);
            }
            console.log("-------------------------\n");
            res.statusCode = 200;
            res.end('Logged');
        });
        return;
    }

    // HELPER FUNCTION FOR WOMPI API REQUESTS
    function makeWompiRequest(url, method, headers, body) {
        return new Promise((resolve, reject) => {
            const u = new URL(url);
            const options = {
                method: method,
                hostname: u.hostname,
                path: u.pathname + u.search,
                headers: headers
            };
            const req = https.request(options, (res) => {
                let resBody = '';
                res.on('data', chunk => resBody += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        body: resBody
                    });
                });
            });
            req.on('error', err => reject(err));
            if (body) {
                req.write(body);
            }
            req.end();
        });
    }

    // 1.1 WOMPI: CREATE RECURRING PAYMENT LINK
    if (req.method === 'POST' && req.url === '/api/wompi/create-link') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { workshopId, workshopName, planName, amount, diaDePago, wompiConfig } = JSON.parse(body);
                
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
                    // Use host from header or default localhost
                    const host = req.headers.host || `localhost:${PORT}`;
                    const protocol = req.headers['x-forwarded-proto'] || 'http';
                    const redirectUrl = `${protocol}://${host}/#pago-suscripcion-wompi-callback?id=${workshopId}&idEnlace=${mockIdEnlace}&status=success`;
                    
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        simulated: true,
                        idEnlace: mockIdEnlace,
                        urlEnlace: redirectUrl
                    }));
                    return;
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
                    res.statusCode = tokenRes.statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: "AuthError", 
                        message: "Error de autenticación con Wompi. Por favor verifica tus credenciales.", 
                        details: tokenRes.body 
                    }));
                    return;
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
                        res.statusCode = appRes.statusCode;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ 
                            success: false, 
                            error: "AppFetchError", 
                            message: "No se pudo recuperar el ID del aplicativo desde Wompi.", 
                            details: appRes.body 
                        }));
                        return;
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
                    res.statusCode = linkRes.statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: "CreateLinkError", 
                        message: "Error al generar enlace de cobro recurrente en Wompi.", 
                        details: linkRes.body 
                    }));
                    return;
                }
                
                const linkData = JSON.parse(linkRes.body);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: true,
                    simulated: false,
                    idEnlace: linkData.idEnlace,
                    urlEnlace: linkData.urlEnlace
                }));
                
            } catch (err) {
                console.error("Wompi Exception:", err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: "InternalError", message: err.message }));
            }
        });
        return;
    }

    // 1.2 WOMPI: CHECK SUBSCRIPTION STATUS
    if (req.method === 'POST' && req.url === '/api/wompi/check-subscription') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { idEnlace, wompiConfig } = JSON.parse(body);
                
                if (!idEnlace) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "idEnlace es requerido" }));
                    return;
                }
                
                if (idEnlace.startsWith('MOCK-ENLACE-')) {
                    console.log(`Wompi Check: Simulating active subscription for ${idEnlace}`);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        subscribed: true,
                        simulated: true,
                        details: {
                            status: 'activo',
                            nombreCliente: 'Taller Simulado (Modo Pruebas)',
                            fechaAfiliacion: new Date().toISOString()
                        }
                    }));
                    return;
                }
                
                const config = wompiConfig || {};
                const clientId = config.clientId || process.env.WOMPI_CLIENT_ID;
                const clientSecret = config.clientSecret || process.env.WOMPI_CLIENT_SECRET;
                
                if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "Credenciales de Wompi faltantes para verificar la suscripción." }));
                    return;
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
                    res.statusCode = tokenRes.statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: "AuthError", 
                        message: "Error de autenticación con Wompi al verificar suscripción.", 
                        details: tokenRes.body 
                    }));
                    return;
                }
                
                const { access_token } = JSON.parse(tokenRes.body);
                
                // 2. Fetch subscriptions for link
                const subUrl = `https://api.wompi.sv/EnlacePagoRecurrente/${idEnlace}/suscripciones`;
                console.log(`Wompi: Checking subscriptions for link ${idEnlace}...`);
                
                const subRes = await makeWompiRequest(subUrl, 'GET', {
                    'Authorization': `Bearer ${access_token}`
                });
                
                if (subRes.statusCode !== 200) {
                    res.statusCode = subRes.statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: "CheckSubError", 
                        message: "Error al consultar las suscripciones en Wompi.", 
                        details: subRes.body 
                    }));
                    return;
                }
                
                const list = JSON.parse(subRes.body);
                const hasActive = Array.isArray(list) && list.length > 0;
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: true,
                    subscribed: hasActive,
                    simulated: false,
                    list: list
                }));
                
            } catch (err) {
                console.error("Wompi Check Exception:", err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: "InternalError", message: err.message }));
            }
        });
        return;
    }

    // 1.3 WOMPI: DEACTIVATE RECURRING PAYMENT LINK
    if (req.method === 'POST' && req.url === '/api/wompi/deactivate-link') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { idEnlace, wompiConfig } = JSON.parse(body);
                
                if (!idEnlace) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "idEnlace es requerido" }));
                    return;
                }
                
                if (idEnlace.startsWith('MOCK-ENLACE-')) {
                    console.log(`Wompi Deactivate: Simulating deactivation for ${idEnlace}`);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, deactivated: true, simulated: true }));
                    return;
                }
                
                const config = wompiConfig || {};
                const clientId = config.clientId || process.env.WOMPI_CLIENT_ID;
                const clientSecret = config.clientSecret || process.env.WOMPI_CLIENT_SECRET;
                
                if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "Credenciales de Wompi faltantes para desactivar la suscripción." }));
                    return;
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
                    res.statusCode = tokenRes.statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: "AuthError", 
                        message: "Error de autenticación con Wompi al desactivar.", 
                        details: tokenRes.body 
                    }));
                    return;
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
                    res.statusCode = deactivateRes.statusCode;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: "DeactivateError", 
                        message: "Error al desactivar el enlace de cobro en Wompi.", 
                        details: deactivateRes.body 
                    }));
                    return;
                }
                
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    success: true,
                    deactivated: true,
                    simulated: false
                }));
                
            } catch (err) {
                console.error("Wompi Deactivate Exception:", err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: "InternalError", message: err.message }));
            }
        });
        return;
    }

    // 1.4 WOMPI: TEST CONNECTION
    if (req.method === 'POST' && req.url === '/api/wompi/test-connection') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { wompiConfig } = JSON.parse(body);
                const config = wompiConfig || {};
                const clientId = config.clientId;
                const clientSecret = config.clientSecret;
                
                if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "Debe ingresar Client ID y Client Secret para realizar la prueba." }));
                    return;
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
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: "Fallo de autenticación con Wompi.",
                        details: tokenRes.body
                    }));
                    return;
                }
                
                const { access_token } = JSON.parse(tokenRes.body);
                
                // Fetch Aplicativo
                console.log("Wompi Test: Fetching aplicativo...");
                const appRes = await makeWompiRequest('https://api.wompi.sv/Aplicativo', 'GET', {
                    'Authorization': `Bearer ${access_token}`
                });
                
                if (appRes.statusCode === 200) {
                    const appData = JSON.parse(appRes.body);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: `¡Conexión establecida con éxito! Tu aplicativo '${appData.nombre || 'Sin nombre'}' está listo y conectado en Wompi SV.`,
                        appName: appData.nombre,
                        appId: appData.idAplicativo
                    }));
                } else {
                    console.error("Wompi Test Fetch Aplicativo Error:", appRes.body);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ 
                        success: false, 
                        message: "Autenticación exitosa, pero no se pudo consultar el aplicativo. Verifica los permisos de tus llaves.",
                        details: appRes.body
                    }));
                }
            } catch (err) {
                console.error("Wompi Test Exception:", err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: "InternalError", message: err.message }));
            }
        });
        return;
    }

    // 1.5 FACTURALLAMA: TEST CONNECTION
    if (req.method === 'POST' && req.url === '/api/dte/test-connection') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const { apiKey } = JSON.parse(body);
                
                if (!apiKey || apiKey.trim() === '') {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "Debe ingresar una API Key para realizar la prueba." }));
                    return;
                }
                
                if (apiKey.startsWith('simulado_')) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        simulated: true,
                        message: "¡Conexión de prueba simulada exitosamente! (Modo Simulación activo)"
                    }));
                    return;
                }
                
                console.log(`FacturaLlama Test: Verifying API Key ${apiKey.substring(0,8)}...`);
                
                const targetUrl = 'https://api.facturallama.com/dte/12345678-1234-1234-1234-1234567890ab';
                const options = {
                    method: 'GET',
                    headers: {
                        'X-API-Key': apiKey,
                        'X-API-Version': '1',
                        'Content-Type': 'application/json'
                    }
                };
                
                const proxyReq = https.request(targetUrl, options, (proxyRes) => {
                    let proxyBody = '';
                    proxyRes.on('data', chunk => proxyBody += chunk);
                    proxyRes.on('end', () => {
                        console.log(`FacturaLlama Test: Received status ${proxyRes.statusCode}`);
                        
                        let success = false;
                        let message = '';
                        
                        if (proxyRes.statusCode === 404) {
                            success = true;
                            message = "¡Conexión establecida con éxito! Tu API Key de FacturaLlama es válida y activa.";
                        } else if (proxyRes.statusCode === 403) {
                            success = false;
                            message = "API Key inválida. Por favor verifica tus credenciales en FacturaLlama.";
                        } else if (proxyRes.statusCode === 401) {
                            success = false;
                            message = "No autorizado. Asegúrate de que el formato de la API Key sea correcto.";
                        } else {
                            success = true;
                            message = `Conexión con el servidor establecida (Código de estado HTTP: ${proxyRes.statusCode})`;
                        }
                        
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                            success: success,
                            statusCode: proxyRes.statusCode,
                            message: message,
                            details: proxyBody
                        }));
                    });
                });
                
                proxyReq.on('error', (err) => {
                    console.error("FacturaLlama Test Connection Error:", err);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        message: "No se pudo conectar con la API de FacturaLlama.",
                        details: err.message
                    }));
                });
                
                proxyReq.end();
            } catch (err) {
                console.error("FacturaLlama Test Exception:", err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, message: err.message }));
            }
        });
        return;
    }

    if (req.method === 'POST' && req.url === '/api/dte') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        
        req.on('end', () => {
            try {
                const requestData = JSON.parse(body);
                const { apiKey, docType, payload } = requestData;
                
                // If no API Key is provided, fallback to simulated success for testing
                if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('simulado_')) {
                    console.log("FacturaLlama: No API Key provided. Returning mock DTE.");
                    
                    const genCode = "MOCK-DTE-" + Math.floor(Date.now() / 1000).toString() + "-" + Math.floor(Math.random()*10000);
                    const ctrlNum = "DTE-" + (docType === 'ccf' ? '03' : '01') + "-M001P001-" + Math.floor(Math.random()*90000 + 10000);
                    const seal = Math.floor(Math.random()*9000000).toString() + "-APPROVED-" + Math.floor(Math.random()*9000);
                    
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        simulated: true,
                        code: "00",
                        description: "DTE Simulado Exitosamente (Sin API Key)",
                        generationCode: genCode,
                        controlNumber: ctrlNum,
                        receptionSeal: seal,
                        mhDteUrl: `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${genCode}&fechaEmi=${new Date().toISOString().split('T')[0]}`
                    }));
                    return;
                }
                
                // Set up request to FacturaLlama API
                let llamaDocType = (docType || 'fc').toLowerCase();
                if (llamaDocType === 'fe') {
                    llamaDocType = 'fc';
                }
                const targetUrl = `https://api.facturallama.com/dte/${llamaDocType}`;
                console.log(`FacturaLlama: Forwarding request to ${targetUrl}`);
                
                const payloadString = JSON.stringify(payload);
                
                const options = {
                    method: 'POST',
                    headers: {
                        'X-API-Key': apiKey,
                        'X-API-Version': '1',
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payloadString)
                    }
                };
                
                const proxyReq = https.request(targetUrl, options, (proxyRes) => {
                    let proxyBody = '';
                    
                    proxyRes.on('data', (chunk) => {
                        proxyBody += chunk;
                    });
                    
                    proxyRes.on('end', () => {
                        console.log(`FacturaLlama: Received response code ${proxyRes.statusCode}`);
                        res.statusCode = proxyRes.statusCode;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(proxyBody);
                    });
                });
                
                proxyReq.on('error', (err) => {
                    console.error("FacturaLlama Proxy Connection Error:", err);
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: false,
                        error: "Bad Gateway",
                        message: "Error de conexión con la API de FacturaLlama",
                        details: err.message
                    }));
                });
                
                proxyReq.write(payloadString);
                proxyReq.end();
                
            } catch (err) {
                console.error("JSON Parse Error on /api/dte:", err);
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: "Bad Request", message: "Formato JSON inválido" }));
            }
        });
        return;
    }

    // 1.7 FACTURALLAMA: INVALIDATE DTE
    if (req.method === 'POST' && req.url === '/api/dte/invalidate') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { apiKey, payload } = JSON.parse(body);
                
                if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('simulado_')) {
                    console.log("FacturaLlama Invalidate: Simulated invalidation.");
                    const crypto = require('crypto');
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        simulated: true,
                        id: crypto.randomUUID ? crypto.randomUUID() : 'simulated-invalidate-uuid-998877',
                        status: "APPROVED",
                        message: "DTE Anulado Simulado Exitosamente"
                    }));
                    return;
                }
                
                const targetUrl = 'https://api.facturallama.com/dte/invalidate';
                const payloadString = JSON.stringify(payload);
                
                const options = {
                    method: 'POST',
                    headers: {
                        'X-API-Key': apiKey,
                        'X-API-Version': '1',
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payloadString)
                    }
                };
                
                const proxyReq = https.request(targetUrl, options, (proxyRes) => {
                    let proxyBody = '';
                    proxyRes.on('data', chunk => proxyBody += chunk);
                    proxyRes.on('end', () => {
                        res.statusCode = proxyRes.statusCode;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(proxyBody);
                    });
                });
                
                proxyReq.on('error', (err) => {
                    console.error("FacturaLlama Invalidate Proxy Error:", err);
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "Error de conexión con la API de FacturaLlama", details: err.message }));
                });
                
                proxyReq.write(payloadString);
                proxyReq.end();
            } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: "Bad Request", message: "Formato JSON inválido" }));
            }
        });
        return;
    }

    // 1.8 FACTURALLAMA: RETRIEVE DTE
    if (req.method === 'POST' && req.url === '/api/dte/retrieve') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { apiKey, dteId } = JSON.parse(body);
                
                if (!dteId) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "Debe proveer el dteId para consultar." }));
                    return;
                }
                
                if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('simulado_')) {
                    console.log("FacturaLlama Retrieve: Returning simulated DTE details.");
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        success: true,
                        simulated: true,
                        id: dteId,
                        status: "APPROVED",
                        environment: "TEST",
                        type: "FC",
                        controlNumber: "DTE-01-M001P001-99887",
                        message: "Consulta de DTE simulada con éxito"
                    }));
                    return;
                }
                
                const targetUrl = `https://api.facturallama.com/dte/${dteId}`;
                
                const options = {
                    method: 'GET',
                    headers: {
                        'X-API-Key': apiKey,
                        'X-API-Version': '1',
                        'Content-Type': 'application/json'
                    }
                };
                
                const proxyReq = https.request(targetUrl, options, (proxyRes) => {
                    let proxyBody = '';
                    proxyRes.on('data', chunk => proxyBody += chunk);
                    proxyRes.on('end', () => {
                        res.statusCode = proxyRes.statusCode;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(proxyBody);
                    });
                });
                
                proxyReq.on('error', (err) => {
                    console.error("FacturaLlama Retrieve Proxy Error:", err);
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "Error de conexión con la API de FacturaLlama", details: err.message }));
                });
                
                proxyReq.end();
            } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: "Bad Request", message: "Formato JSON inválido" }));
            }
        });
        return;
    }

    // 1.9 FACTURALLAMA: DOWNLOAD DTE PDF
    if (req.method === 'POST' && req.url === '/api/dte/pdf') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { apiKey, dteId } = JSON.parse(body);
                
                if (!dteId) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "Debe proveer el dteId." }));
                    return;
                }
                
                if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('simulado_')) {
                    console.log("FacturaLlama PDF: Returning simulated PDF stream.");
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/pdf');
                    // Return a very minimal valid blank PDF structure as a mock
                    const mockPdf = Buffer.from(
                        "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
                        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
                        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n" +
                        "4 0 obj\n<< /Length 51 >>\nstream\nBT\n/F1 12 Tf\n70 700 Td\n(DTE Simulado PDF - FacturaLlama) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000204 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n306\n%%EOF"
                    );
                    res.end(mockPdf);
                    return;
                }
                
                const targetUrl = `https://api.facturallama.com/dte/${dteId}/download/pdf`;
                
                const options = {
                    method: 'GET',
                    headers: {
                        'X-API-Key': apiKey,
                        'X-API-Version': '1'
                    }
                };
                
                const proxyReq = https.request(targetUrl, options, (proxyRes) => {
                    res.statusCode = proxyRes.statusCode;
                    
                    if (proxyRes.statusCode === 200) {
                        res.setHeader('Content-Type', 'application/pdf');
                        if (proxyRes.headers['content-disposition']) {
                            res.setHeader('Content-Disposition', proxyRes.headers['content-disposition']);
                        }
                        proxyRes.pipe(res);
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        let proxyErrorBody = '';
                        proxyRes.on('data', chunk => proxyErrorBody += chunk);
                        proxyRes.on('end', () => {
                            res.end(proxyErrorBody);
                        });
                    }
                });
                
                proxyReq.on('error', (err) => {
                    console.error("FacturaLlama PDF Proxy Error:", err);
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: false, message: "Error de conexión al obtener PDF", details: err.message }));
                });
                
                proxyReq.end();
            } catch (err) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: "Bad Request", message: "Formato JSON inválido" }));
            }
        });
        return;
    }
    
    // 2. STATIC FILE SERVING
    let safeUrl = req.url.split('?')[0];
    if (safeUrl === '/') {
        safeUrl = '/index.html';
    }
    
    const filePath = path.join(PUBLIC_DIR, safeUrl);
    
    // Check if file exists and is within the public directory
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.statusCode = 403;
        res.end('Access Denied');
        return;
    }
    
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Archivo no encontrado');
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Mecanic OS Dev Server corriendo en:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`==================================================`);
    console.log(`Presiona Ctrl+C para detener el servidor.`);
});
