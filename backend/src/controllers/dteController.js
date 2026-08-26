const https = require('https');
const crypto = require('crypto');
const { db } = require('../config/firebaseAdmin');

async function saveDteLog(action, workshopId, docType, requestPayload, responseStatus, responseBody, endpoint) {
    if (!db) return;
    try {
        let resolvedWorkshopId = workshopId || 'desconocido';
        
        // Si no se proveyó el id de taller, intentar extraerlo del payload del emisor o del NIT
        if (resolvedWorkshopId === 'desconocido' && requestPayload) {
            const emisor = requestPayload.emisor || {};
            if (emisor.nit) {
                resolvedWorkshopId = emisor.nit;
            } else if (emisor.nombre) {
                resolvedWorkshopId = emisor.nombre;
            }
        }

        // Parsear cuerpo de respuesta para no guardar strings si es JSON
        let parsedResBody = responseBody;
        if (typeof responseBody === 'string') {
            try {
                parsedResBody = JSON.parse(responseBody);
            } catch (e) {
                // Mantener como string
            }
        }

        await db.collection('dte_api_logs').add({
            action,
            workshopId: resolvedWorkshopId,
            docType: docType || 'desconocido',
            endpoint: endpoint || '',
            requestPayload: requestPayload || null,
            responseStatus: responseStatus || 0,
            responseBody: parsedResBody || null,
            timestamp: new Date().toISOString()
        });
        console.log(`DTE Log saved successfully for action: ${action}`);
    } catch (err) {
        console.error("Error saving DTE API Log:", err);
    }
}

/**
 * Prueba de conexión a la API de FacturaLlama.
 */
async function testConnection(req, res) {
    try {
        const { apiKey } = req.body;
        
        const resolvedApiKey = (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('simulado_') && !apiKey.startsWith('test_sk_mecanicos_default')) 
                                ? apiKey 
                                : process.env.FACTURALLAMA_API_KEY;
                                
        if (!resolvedApiKey || resolvedApiKey.trim() === '') {
            return res.status(400).json({ success: false, message: "Debe ingresar una API Key para realizar la prueba o configurar FACTURALLAMA_API_KEY en el servidor." });
        }
        
        if (resolvedApiKey.startsWith('simulado_')) {
            const mockRes = {
                success: true,
                simulated: true,
                message: "¡Conexión de prueba simulada exitosamente! (Modo Simulación activo)"
            };
            saveDteLog("Prueba Conexión (Simulado)", req.body.workshopId, "prueba", null, 200, mockRes, "MOCK / SIMULADO");
            return res.json(mockRes);
        }
        
        console.log(`FacturaLlama Test: Verifying API Key ${resolvedApiKey.substring(0,8)}...`);
        
        const targetUrl = 'https://api.facturallama.com/dte/12345678-1234-1234-1234-1234567890ab';
        const options = {
            method: 'GET',
            headers: {
                'X-API-Key': resolvedApiKey,
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
                if (proxyRes.statusCode === 200 || proxyRes.statusCode === 404) {
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
                
                const responseData = {
                    success: success,
                    statusCode: proxyRes.statusCode,
                    message: message,
                    details: proxyBody
                };

                saveDteLog("Prueba Conexión", req.body.workshopId, "prueba", null, proxyRes.statusCode, responseData, targetUrl);

                return res.json(responseData);
            });
        });
        
        proxyReq.on('error', (err) => {
            console.error("FacturaLlama Test Connection Error:", err);
            return res.json({
                success: false,
                message: "No se pudo conectar con la API de FacturaLlama.",
                details: err.message
            });
        });
        
        proxyReq.end();
    } catch (err) {
        console.error("FacturaLlama Test Exception:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
}

/**
 * Emite un nuevo DTE a FacturaLlama (FC, CCF, etc).
 */
async function emitDte(req, res) {
    try {
        const { apiKey, docType, payload } = req.body;
        
        const resolvedApiKey = (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('simulado_') && !apiKey.startsWith('test_sk_mecanicos_default')) 
                                ? apiKey 
                                : process.env.FACTURALLAMA_API_KEY;
                                
        if (!resolvedApiKey || resolvedApiKey.trim() === '') {
            console.log("FacturaLlama: No API Key provided or resolved. Returning mock DTE.");
            
            const genCode = "MOCK-DTE-" + Math.floor(Date.now() / 1000).toString() + "-" + Math.floor(Math.random()*10000);
            const ctrlNum = "DTE-" + (docType === 'ccf' ? '03' : '01') + "-M001P001-" + Math.floor(Math.random()*90000 + 10000);
            const seal = Math.floor(Math.random()*9000000).toString() + "-APPROVED-" + Math.floor(Math.random()*9000);
            
            const mockRes = {
                success: true,
                simulated: true,
                code: "00",
                description: "DTE Simulado Exitosamente (Sin API Key)",
                generationCode: genCode,
                controlNumber: ctrlNum,
                receptionSeal: seal,
                mhDteUrl: `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${genCode}&fechaEmi=${new Date().toISOString().split('T')[0]}`
            };
            saveDteLog("Emisión DTE (Simulado)", req.body.workshopId, llamaDocType, payload, 200, mockRes, "MOCK / SIMULADO");
            return res.json(mockRes);
        }
        
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
                'X-API-Key': resolvedApiKey,
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
                res.status(proxyRes.statusCode);
                res.setHeader('Content-Type', 'application/json');
                saveDteLog("Emisión DTE", req.body.workshopId, llamaDocType, payload, proxyRes.statusCode, proxyBody, targetUrl);
                return res.send(proxyBody);
            });
        });
        
        proxyReq.on('error', (err) => {
            console.error("FacturaLlama Proxy Connection Error:", err);
            return res.status(502).json({
                success: false,
                error: "Bad Gateway",
                message: "Error de conexión con la API de FacturaLlama",
                details: err.message
            });
        });
        
        proxyReq.write(payloadString);
        proxyReq.end();
        
    } catch (err) {
        console.error("Exception on emitDte:", err);
        return res.status(500).json({ success: false, error: "InternalError", message: err.message });
    }
}

/**
 * Anula un DTE en FacturaLlama.
 */
async function invalidateDte(req, res) {
    try {
        const { apiKey, payload } = req.body;
        
        const resolvedApiKey = (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('simulado_') && !apiKey.startsWith('test_sk_mecanicos_default')) 
                                ? apiKey 
                                : process.env.FACTURALLAMA_API_KEY;
                                
        if (!resolvedApiKey || resolvedApiKey.trim() === '') {
            console.log("FacturaLlama Invalidate: Simulated invalidation.");
            const mockRes = {
                success: true,
                simulated: true,
                id: crypto.randomUUID ? crypto.randomUUID() : 'simulated-invalidate-uuid-998877',
                status: "APPROVED",
                message: "DTE Anulado Simulado Exitosamente"
            };
            saveDteLog("Anulación DTE (Simulado)", req.body.workshopId, "anulacion", payload, 200, mockRes, "MOCK / SIMULADO");
            return res.json(mockRes);
        }
        
        const targetUrl = 'https://api.facturallama.com/dte/invalidate';
        const payloadString = JSON.stringify(payload);
        
        const options = {
            method: 'POST',
            headers: {
                'X-API-Key': resolvedApiKey,
                'X-API-Version': '1',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payloadString)
            }
        };
        
        const proxyReq = https.request(targetUrl, options, (proxyRes) => {
            let proxyBody = '';
            proxyRes.on('data', chunk => proxyBody += chunk);
            proxyRes.on('end', () => {
                res.status(proxyRes.statusCode);
                res.setHeader('Content-Type', 'application/json');
                saveDteLog("Anulación DTE", req.body.workshopId, "anulacion", payload, proxyRes.statusCode, proxyBody, targetUrl);
                return res.send(proxyBody);
            });
        });
        
        proxyReq.on('error', (err) => {
            console.error("FacturaLlama Invalidate Proxy Error:", err);
            return res.status(502).json({ success: false, message: "Error de conexión con la API de FacturaLlama", details: err.message });
        });
        
        proxyReq.write(payloadString);
        proxyReq.end();
    } catch (err) {
        console.error("Exception on invalidateDte:", err);
        return res.status(500).json({ success: false, error: "InternalError", message: err.message });
    }
}

/**
 * Consulta los detalles de un DTE emitido en FacturaLlama.
 */
async function retrieveDte(req, res) {
    try {
        const { apiKey, dteId } = req.body;
        
        if (!dteId) {
            return res.status(400).json({ success: false, message: "Debe proveer el dteId para consultar." });
        }
        
        const resolvedApiKey = (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('simulado_') && !apiKey.startsWith('test_sk_mecanicos_default')) 
                                ? apiKey 
                                : process.env.FACTURALLAMA_API_KEY;
                                
        if (!resolvedApiKey || resolvedApiKey.trim() === '') {
            console.log("FacturaLlama Retrieve: Returning simulated DTE details.");
            const mockRes = {
                success: true,
                simulated: true,
                id: dteId,
                status: "APPROVED",
                environment: "TEST",
                type: "FC",
                controlNumber: "DTE-01-M001P001-99887",
                message: "Consulta de DTE simulada con éxito"
            };
            saveDteLog("Consulta DTE (Simulado)", req.body.workshopId, "consulta", { dteId }, 200, mockRes, "MOCK / SIMULADO");
            return res.json(mockRes);
        }
        
        const targetUrl = `https://api.facturallama.com/dte/${dteId}`;
        
        const options = {
            method: 'GET',
            headers: {
                'X-API-Key': resolvedApiKey,
                'X-API-Version': '1',
                'Content-Type': 'application/json'
            }
        };
        
        const proxyReq = https.request(targetUrl, options, (proxyRes) => {
            let proxyBody = '';
            proxyRes.on('data', chunk => proxyBody += chunk);
            proxyRes.on('end', () => {
                res.status(proxyRes.statusCode);
                res.setHeader('Content-Type', 'application/json');
                saveDteLog("Consulta DTE", req.body.workshopId, "consulta", { dteId }, proxyRes.statusCode, proxyBody, targetUrl);
                return res.send(proxyBody);
            });
        });
        
        proxyReq.on('error', (err) => {
            console.error("FacturaLlama Retrieve Proxy Error:", err);
            return res.status(502).json({ success: false, message: "Error de conexión con la API de FacturaLlama", details: err.message });
        });
        
        proxyReq.end();
    } catch (err) {
        console.error("Exception on retrieveDte:", err);
        return res.status(500).json({ success: false, error: "InternalError", message: err.message });
    }
}

/**
 * Descarga el PDF oficial de un DTE desde FacturaLlama.
 */
async function downloadDtePdf(req, res) {
    try {
        const { apiKey, dteId } = req.body;
        
        if (!dteId) {
            return res.status(400).json({ success: false, message: "Debe proveer el dteId." });
        }
        
        const resolvedApiKey = (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('simulado_') && !apiKey.startsWith('test_sk_mecanicos_default')) 
                                ? apiKey 
                                : process.env.FACTURALLAMA_API_KEY;
                                
        if (!resolvedApiKey || resolvedApiKey.trim() === '') {
            console.log("FacturaLlama PDF: Returning simulated PDF stream.");
            res.setHeader('Content-Type', 'application/pdf');
            // Return a very minimal valid blank PDF structure as a mock
            const mockPdf = Buffer.from(
                "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
                "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
                "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n" +
                "4 0 obj\n<< /Length 51 >>\nstream\nBT\n/F1 12 Tf\n70 700 Td\n(DTE Simulado PDF - FacturaLlama) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000204 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n306\n%%EOF"
            );
            return res.send(mockPdf);
        }
        
        const targetUrl = `https://api.facturallama.com/dte/${dteId}/download/pdf`;
        
        const options = {
            method: 'GET',
            headers: {
                'X-API-Key': resolvedApiKey,
                'X-API-Version': '1'
            }
        };
        
        const proxyReq = https.request(targetUrl, options, (proxyRes) => {
            res.status(proxyRes.statusCode);
            
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
                    return res.send(proxyErrorBody);
                });
            }
        });
        
        proxyReq.on('error', (err) => {
            console.error("FacturaLlama PDF Proxy Error:", err);
            return res.status(502).json({ success: false, message: "Error de conexión al obtener PDF", details: err.message });
        });
        
        proxyReq.end();
    } catch (err) {
        console.error("Exception on downloadDtePdf:", err);
        return res.status(500).json({ success: false, error: "InternalError", message: err.message });
    }
}

/**
 * Recibe un DTE entrante desde Google Apps Script (GAS) y lo registra en el taller correspondiente.
 */
async function receiveIncomingDte(req, res) {
    try {
        const webhookToken = req.headers['x-webhook-token'];
        const expectedToken = process.env.WEBHOOK_TOKEN || 'test_webhook_secret_key_mecanicos';
        
        if (!webhookToken || webhookToken !== expectedToken) {
            console.warn("Intento de webhook no autorizado.");
            return res.status(401).json({ success: false, message: "Token de webhook no autorizado." });
        }
        
        const { dteJson } = req.body;
        if (!dteJson) {
            return res.status(400).json({ success: false, message: "No se proporcionó el dteJson en la petición." });
        }
        
        const ident = dteJson.identificacion || {};
        const emisor = dteJson.emisor || {};
        const receptor = dteJson.receptor || {};
        const resumen = dteJson.resumen || {};
        const cuerpo = dteJson.cuerpoDocumento || [];
        
        const selloRecepcion = ident.selloRecepcion || ident.codigoGeneracion || ("INCOMING-MOCK-" + Date.now());
        const emisorNombre = emisor.nombre || "Proveedor Desconocido";
        const totalPagar = resumen.totalPagar || 0.00;
        const fechaEmision = ident.fecEmi || new Date().toISOString().split('T')[0];
        const numeroControl = ident.numeroControl || "";
        
        const tipoDte = ident.tipoDte || "";
        let tipoDocumento = "DTE";
        if (tipoDte === "01") tipoDocumento = "Factura";
        else if (tipoDte === "03") tipoDocumento = "Crédito Fiscal";
        else if (tipoDte === "05") tipoDocumento = "Nota de Crédito";
        else if (tipoDte === "14") tipoDocumento = "Sujeto Excluido";
        
        let workshopId = req.body.workshopId || req.headers['x-workshop-id'];
        
        if (!db) {
            console.warn("Firebase Admin DB no inicializado. Simulando recepción exitosa.");
            return res.json({
                success: true,
                simulated: true,
                message: "DTE recibido exitosamente (Entorno de desarrollo - Firebase no inicializado)",
                selloRecepcion: selloRecepcion
            });
        }
        
        if (!workshopId) {
            // Obtener el número de documento del receptor para mapearlo a un taller
            const receptorDoc = (receptor.numDocumento || receptor.nit || "").trim().replace(/[^0-9A-Za-z]/g, "").toLowerCase();
            
            if (!receptorDoc) {
                return res.status(400).json({ success: false, message: "No se pudo identificar el NIT/DUI del receptor en el DTE." });
            }
            
            // Buscar el taller correspondiente recorriendo saas_requests
            const snapshot = await db.collection('saas_requests').get();
            snapshot.forEach(doc => {
                const data = doc.data();
                const workshopDoc = (data.num_documento || data.nit || "").trim().replace(/[^0-9A-Za-z]/g, "").toLowerCase();
                if (workshopDoc === receptorDoc) {
                    workshopId = doc.id;
                }
            });
            
            if (!workshopId) {
                console.warn(`No se encontró ningún taller registrado con el NIT/DUI del receptor: ${receptorDoc}`);
                return res.status(404).json({ success: false, message: "No se encontró ningún taller con el NIT/DUI del receptor especificado." });
            }
        }
        
        // Verificar si ya existe en Firestore para evitar sobrescritura (doble envío)
        const docRef = db.collection('workshops')
            .doc(workshopId)
            .collection('dte_recibidos')
            .doc(selloRecepcion);
            
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            console.log(`El DTE ${selloRecepcion} ya existe en el taller ${workshopId}. Saltando importación.`);
            return res.json({
                success: true,
                message: "El DTE ya está registrado en el taller (Deduplicado).",
                selloRecepcion: selloRecepcion,
                taller: workshopId,
                alreadyExists: true
            });
        }
        
        // Formatear items del DTE para el frontend
        const parsedItems = cuerpo.map(item => ({
            numItem: item.numItem || 1,
            cantidad: item.cantidad || 1,
            descripcion: item.descripcion || "Item general",
            precioUnitario: item.precioUni || 0.00,
            ventaGravada: item.ventaGravada || 0.00
        }));
        
        // Crear documento en la subcolección dte_recibidos del taller
        const dteRecord = {
            id_dte: selloRecepcion,
            numeroDte: selloRecepcion,
            numeroControl: numeroControl,
            fecha: fechaEmision,
            emisor: emisorNombre,
            nitEmisor: emisor.nit || "",
            monto: totalPagar,
            estado: 'pendiente_aplicar',
            items: parsedItems,
            tipoDte: tipoDte,
            tipoDocumento: tipoDocumento,
            rawJson: JSON.stringify(dteJson),
            createdAt: Date.now()
        };
        
        try {
            await db.collection('workshops')
                .doc(workshopId)
                .collection('dte_recibidos')
                .doc(selloRecepcion)
                .create(dteRecord);
        } catch (err) {
            // Código de error 6 representa ALREADY_EXISTS en gRPC / Firestore Admin
            if (err.code === 6 || err.message.includes('already exists')) {
                console.log(`El DTE ${selloRecepcion} ya existe (Deduplicación atómica). Saltando.`);
                return res.json({
                    success: true,
                    message: "El DTE ya está registrado en el taller (Deduplicado atómico).",
                    selloRecepcion: selloRecepcion,
                    taller: workshopId,
                    alreadyExists: true
                });
            }
            throw err;
        }
            
        console.log(`DTE ${selloRecepcion} registrado exitosamente para el taller ${workshopId}`);
        return res.json({
            success: true,
            message: "DTE recibido y registrado exitosamente en el taller.",
            selloRecepcion: selloRecepcion,
            taller: workshopId
        });
        
    } catch (err) {
        console.error("Exception on receiveIncomingDte:", err);
        return res.status(500).json({ success: false, error: "InternalError", message: err.message });
    }
}

function fetchPdfBuffer(dteId, apiKey) {
    return new Promise((resolve, reject) => {
        const targetUrl = `https://api.facturallama.com/dte/${dteId}/download/pdf`;
        const options = {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'X-API-Version': '1'
            }
        };

        const proxyReq = https.request(targetUrl, options, (proxyRes) => {
            if (proxyRes.statusCode !== 200) {
                return reject(new Error(`FacturaLlama HTTP ${proxyRes.statusCode}`));
            }
            const chunks = [];
            proxyRes.on('data', chunk => chunks.push(chunk));
            proxyRes.on('end', () => resolve(Buffer.concat(chunks)));
        });

        proxyReq.setTimeout(4000, () => {
            proxyReq.destroy(new Error("Timeout obteniendo PDF de FacturaLlama"));
        });

        proxyReq.on('error', reject);
        proxyReq.end();
    });
}

function fetchJsonBuffer(dteId, apiKey) {
    return new Promise((resolve, reject) => {
        const targetUrl = `https://api.facturallama.com/dte/${dteId}/download/json`;
        const options = {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey,
                'X-API-Version': '1'
            }
        };

        const proxyReq = https.request(targetUrl, options, (proxyRes) => {
            if (proxyRes.statusCode !== 200) {
                const fallbackUrl = `https://api.facturallama.com/dte/${dteId}`;
                const fallbackReq = https.request(fallbackUrl, options, (fRes) => {
                    if (fRes.statusCode !== 200) return reject(new Error(`Status ${fRes.statusCode}`));
                    const chunks = [];
                    fRes.on('data', chunk => chunks.push(chunk));
                    fRes.on('end', () => resolve(Buffer.concat(chunks)));
                });
                fallbackReq.setTimeout(3000, () => fallbackReq.destroy(new Error("Timeout JSON fallback")));
                fallbackReq.on('error', reject);
                fallbackReq.end();
                return;
            }
            const chunks = [];
            proxyRes.on('data', chunk => chunks.push(chunk));
            proxyRes.on('end', () => resolve(Buffer.concat(chunks)));
        });

        proxyReq.setTimeout(4000, () => {
            proxyReq.destroy(new Error("Timeout obteniendo JSON de FacturaLlama"));
        });

        proxyReq.on('error', reject);
        proxyReq.end();
    });
}

function postToAppsScript(targetUrl, payload) {
    return new Promise((resolve, reject) => {
        const dataStr = JSON.stringify(payload);

        function makeRequest(currentUrl, redirectCount = 0) {
            if (redirectCount > 5) return reject(new Error("Demasiados redireccionamientos en Google Apps Script"));

            const parsedUrl = new URL(currentUrl);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : require('http');

            const options = {
                method: redirectCount === 0 ? 'POST' : 'GET',
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname + parsedUrl.search,
                headers: redirectCount === 0 ? {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(dataStr)
                } : {}
            };

            const req = client.request(options, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return makeRequest(res.headers.location, redirectCount + 1);
                }

                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(body));
                        } catch (e) {
                            resolve({ success: true, body });
                        }
                    } else {
                        reject(new Error(`Google Apps Script HTTP ${res.statusCode}: ${body}`));
                    }
                });
            });

            req.setTimeout(12000, () => req.destroy(new Error("Timeout conectando a Google Apps Script")));
            req.on('error', reject);
            if (redirectCount === 0) {
                req.write(dataStr);
            }
            req.end();
        }

        makeRequest(targetUrl);
    });
}

function sendViaResendHttpApi({ apiKey, from, to, replyTo, subject, html, pdfBuffer, jsonBuffer, controlNum }) {
    return new Promise((resolve, reject) => {
        const payload = {
            from: from || "Mecanic OS DTE <onboarding@resend.dev>",
            to: [to],
            reply_to: replyTo || undefined,
            subject: subject,
            html: html,
            attachments: []
        };

        if (pdfBuffer) {
            payload.attachments.push({
                filename: `DTE_${controlNum.replace(/[^0-9A-Za-z]/g, '_')}.pdf`,
                content: pdfBuffer.toString('base64')
            });
        }
        if (jsonBuffer) {
            payload.attachments.push({
                filename: `DTE_${controlNum.replace(/[^0-9A-Za-z]/g, '_')}.json`,
                content: jsonBuffer.toString('base64')
            });
        }

        const dataStr = JSON.stringify(payload);
        const proxyReq = https.request('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataStr)
            }
        }, (proxyRes) => {
            let body = '';
            proxyRes.on('data', chunk => body += chunk);
            proxyRes.on('end', () => {
                if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
                    try { resolve(JSON.parse(body)); } catch (e) { resolve({ id: 'resend_ok' }); }
                } else {
                    reject(new Error(`Resend API HTTP ${proxyRes.statusCode}: ${body}`));
                }
            });
        });

        proxyReq.setTimeout(8000, () => proxyReq.destroy(new Error("Timeout en petición Resend API")));
        proxyReq.on('error', reject);
        proxyReq.write(dataStr);
        proxyReq.end();
    });
}

/**
 * Reenvía un DTE por correo electrónico al cliente.
 */
async function resendDteEmail(req, res) {
    try {
        const { apiKey, dteId, recipientEmail, clienteNombre, numeroControl, codigoGeneracion, mhDteUrl, tipoDocumento, montoTotal, workshopId, workshopName } = req.body;

        if (!recipientEmail || !recipientEmail.includes('@')) {
            return res.status(400).json({ success: false, message: "Debe proveer un correo electrónico válido para el envío." });
        }

        const targetDteId = dteId || codigoGeneracion;
        if (!targetDteId) {
            return res.status(400).json({ success: false, message: "No se especificó el código del DTE a enviar." });
        }

        const resolvedApiKey = (apiKey && apiKey.trim() !== '' && !apiKey.startsWith('simulado_') && !apiKey.startsWith('test_sk_mecanicos_default')) 
                                ? apiKey 
                                : process.env.FACTURALLAMA_API_KEY;

        let pdfBuffer = null;
        let jsonBuffer = null;

        if (resolvedApiKey) {
            const [pdfRes, jsonRes] = await Promise.allSettled([
                fetchPdfBuffer(targetDteId, resolvedApiKey),
                fetchJsonBuffer(targetDteId, resolvedApiKey)
            ]);
            if (pdfRes.status === 'fulfilled') pdfBuffer = pdfRes.value;
            else console.warn("No se pudo obtener PDF de FacturaLlama:", pdfRes.reason?.message);

            if (jsonRes.status === 'fulfilled') jsonBuffer = jsonRes.value;
            else console.warn("No se pudo obtener JSON de FacturaLlama:", jsonRes.reason?.message);
        }

        // Multi-tenant resolution: buscar datos del taller específico en Firestore
        let smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
        let smtpPort = parseInt(process.env.SMTP_PORT || "587");
        let smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || "";
        let smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || "";
        smtpPass = (smtpPass || '').replace(/\s+/g, '');
        let senderName = workshopName || "MISTER CARS, S.A.S de C.V.";
        let replyToEmail = null;

        if (db && workshopId && workshopId !== 'desconocido') {
            try {
                const wsDoc = await db.collection("workshops").doc(workshopId).get();
                if (wsDoc.exists) {
                    const wsData = wsDoc.data();
                    senderName = wsData.Razon_Social || wsData.Nombre_Taller || wsData.Nombre_Comercial || wsData.nombre || workshopName || "MISTER CARS, S.A.S de C.V.";
                    replyToEmail = wsData.correo_notificaciones || wsData.Correo || wsData.correo || wsData.email || null;

                    if (wsData.smtp_config && wsData.smtp_config.user && wsData.smtp_config.pass) {
                        smtpHost = wsData.smtp_config.host || "smtp.gmail.com";
                        smtpPort = parseInt(wsData.smtp_config.port || "587");
                        smtpUser = wsData.smtp_config.user;
                        smtpPass = (wsData.smtp_config.pass || '').replace(/\s+/g, '');
                    }
                }
            } catch (errWs) {
                console.warn("No se pudo obtener la configuración del taller desde Firestore:", errWs.message);
            }
        }

        const docTitle = tipoDocumento || "Comprobante de Crédito Fiscal";
        const controlNum = numeroControl || targetDteId;
        const linkMh = mhDteUrl || `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${targetDteId}&fechaEmi=${new Date().toISOString().split('T')[0]}`;

        const htmlBody = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
                <div style="background: #1e293b; padding: 24px; text-align: center; border-bottom: 2px solid #6d28d9;">
                    <h2 style="margin: 0; color: #a78bfa; font-size: 20px; text-transform: uppercase;">${senderName}</h2>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Documento Tributario Electrónico (DTE)</p>
                </div>
                
                <div style="padding: 28px;">
                    <p style="font-size: 16px; margin-top: 0;">Estimado(a) <strong>${clienteNombre || 'Cliente'}</strong>,</p>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
                        Le enviamos la representación gráfica de su <strong>${docTitle}</strong> emitido por <strong>${senderName}</strong>.
                    </p>

                    <div style="background: rgba(255,255,255,0.05); padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
                        <table style="width: 100%; font-size: 14px; color: #e2e8f0; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;">N° Control:</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: bold; font-family: monospace;">${controlNum}</td>
                            </tr>
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;">Código Generación:</td>
                                <td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 12px;">${targetDteId}</td>
                            </tr>
                            ${montoTotal ? `
                            <tr>
                                <td style="padding: 6px 0; color: #94a3b8;">Monto Total:</td>
                                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #4ade80; font-size: 16px;">$${parseFloat(montoTotal).toFixed(2)}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>

                    <div style="text-align: center; margin: 26px 0;">
                        <a href="${linkMh}" target="_blank" style="background: #6d28d9; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">
                            Consultar DTE en el Ministerio de Hacienda &rarr;
                        </a>
                    </div>

                    <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0;">
                        Este mensaje ha sido enviado por Mecanic OS a solicitud de ${senderName}.
                    </p>
                </div>
            </div>
        `;

        // 1. Prioridad A: Google Apps Script Web App (HTTPS Puerto 443 - Envío Nativo por Gmail)
        const appScriptUrl = process.env.APPSCRIPT_SENDER_URL || process.env.APPSCRIPT_URL;
        if (appScriptUrl && appScriptUrl.trim() !== '') {
            try {
                const appScriptResult = await postToAppsScript(appScriptUrl.trim(), {
                    action: 'sendDteEmail',
                    recipientEmail: recipientEmail,
                    senderName: `${senderName} - DTE`,
                    replyTo: replyToEmail || smtpUser || 'ventas@forbiddensoluciones.com',
                    subject: `Documento Tributario Electrónico (${controlNum}) - ${senderName}`,
                    htmlBody: htmlBody,
                    pdfBase64: pdfBuffer ? pdfBuffer.toString('base64') : null,
                    pdfName: `DTE_${controlNum.replace(/[^0-9A-Za-z]/g, '_')}.pdf`,
                    jsonBase64: jsonBuffer ? jsonBuffer.toString('base64') : null,
                    jsonName: `DTE_${controlNum.replace(/[^0-9A-Za-z]/g, '_')}.json`
                });

                if (appScriptResult && appScriptResult.success !== false) {
                    console.log(`DTE enviado vía Google Apps Script a ${recipientEmail}`);
                    saveDteLog("Reenvío Correo DTE (Apps Script)", workshopId, tipoDocumento || "DTE", { recipientEmail, targetDteId }, 200, appScriptResult, "APPSCRIPT");
                    return res.json({ success: true, message: `DTE reenviado exitosamente a ${recipientEmail} vía Apps Script`, details: appScriptResult });
                }
            } catch (asErr) {
                console.warn("Google Apps Script envio falló, intentando fallback:", asErr.message);
            }
        }

        // 1. Método A: Si se configuró RESEND_API_KEY en Render (HTTP API sobre puerto 443 - Inmune a bloqueos)
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey && resendApiKey.trim() !== '') {
            try {
                const resendResult = await sendViaResendHttpApi({
                    apiKey: resendApiKey,
                    from: `"${senderName}" <onboarding@resend.dev>`,
                    to: recipientEmail,
                    replyTo: replyToEmail || smtpUser || undefined,
                    subject: `Documento Tributario Electrónico (${controlNum}) - ${senderName}`,
                    html: htmlBody,
                    pdfBuffer,
                    jsonBuffer,
                    controlNum
                });
                console.log(`DTE enviado vía Resend HTTP API a ${recipientEmail}:`, resendResult.id);
                saveDteLog("Reenvío Correo DTE (Resend API)", workshopId, tipoDocumento || "DTE", { recipientEmail, targetDteId }, 200, resendResult, "RESEND_API");
                return res.json({ success: true, message: `DTE reenviado exitosamente a ${recipientEmail}`, resendId: resendResult.id });
            } catch (resendErr) {
                console.warn("Resend HTTP API falló, intentando SMTP fallback:", resendErr.message);
            }
        }

        // 2. Método B: Transportador SMTP Nodemailer
        if (!smtpPass || !smtpUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Servicio de correo no configurado para este taller. Agregue credenciales SMTP o RESEND_API_KEY en Render." 
            });
        }

        let nodemailer;
        try {
            nodemailer = require('nodemailer');
        } catch (e) {
            return res.status(500).json({ success: false, message: "El módulo nodemailer no está disponible en el servidor." });
        }

        const isGmail = smtpHost.includes('gmail') || smtpUser.endsWith('@gmail.com') || smtpUser.endsWith('@forbiddensoluciones.com');

        const transportConfig = isGmail ? {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // STARTTLS
            requireTLS: true,
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 12000
        } : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass
            },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 12000
        };

        const attachmentsList = [];
        if (pdfBuffer) {
            attachmentsList.push({
                filename: `DTE_${controlNum.replace(/[^0-9A-Za-z]/g, '_')}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        }
        if (jsonBuffer) {
            attachmentsList.push({
                filename: `DTE_${controlNum.replace(/[^0-9A-Za-z]/g, '_')}.json`,
                content: jsonBuffer,
                contentType: 'application/json'
            });
        }

        const mailOptions = {
            from: `"${senderName}" <${smtpUser}>`,
            to: recipientEmail,
            replyTo: replyToEmail || smtpUser,
            subject: `Documento Tributario Electrónico (${controlNum}) - ${senderName}`,
            html: htmlBody,
            attachments: attachmentsList
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`DTE Email reenviado exitosamente a ${recipientEmail}:`, info.messageId);

        saveDteLog("Reenvío Correo DTE", workshopId, tipoDocumento || "DTE", { recipientEmail, targetDteId }, 200, { messageId: info.messageId }, "EMAIL");

        return res.json({
            success: true,
            message: `DTE reenviado exitosamente a ${recipientEmail}`,
            messageId: info.messageId
        });

    } catch (err) {
        console.error("Exception on resendDteEmail:", err);
        return res.status(500).json({ success: false, message: "Error al enviar el correo: " + err.message });
    }
}

/**
 * Envía un Presupuesto / Cotización en PDF por correo electrónico al cliente.
 * 100% Multi-Tenant: Aísla el remitente, datos del taller, logo y teléfono de WhatsApp.
 */
async function sendBudgetEmail(req, res) {
    try {
        const {
            recipientEmail,
            clienteNombre,
            budgetId,
            vehiculoInfo,
            montoTotal,
            subtotal,
            iva,
            pdfBase64,
            workshopId,
            workshopName,
            workshopPhone,
            workshopAddress,
            observaciones
        } = req.body;

        if (!recipientEmail || !recipientEmail.includes('@')) {
            return res.status(400).json({ success: false, message: "Debe proveer un correo electrónico válido para el envío." });
        }

        if (!budgetId) {
            return res.status(400).json({ success: false, message: "No se especificó el ID del presupuesto a enviar." });
        }

        // Multi-tenant resolution: buscar datos del taller específico en Firestore
        let smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
        let smtpPort = parseInt(process.env.SMTP_PORT || "587");
        let smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || "";
        let smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS || "";
        smtpPass = (smtpPass || '').replace(/\s+/g, '');
        
        let senderName = workshopName || "Taller Automotriz";
        let senderPhone = workshopPhone || "";
        let senderAddress = workshopAddress || "";
        let senderLogo = null;
        let replyToEmail = null;

        if (db && workshopId && workshopId !== 'desconocido') {
            try {
                const wsDoc = await db.collection("workshops").doc(workshopId).get();
                if (wsDoc.exists) {
                    const wsData = wsDoc.data();
                    senderName = wsData.Nombre_Comercial || wsData.Razon_Social || wsData.Nombre_Taller || wsData.nombre || senderName;
                    senderPhone = wsData.telefono || wsData.Telefono || senderPhone;
                    senderAddress = wsData.direccion || wsData.Direccion || senderAddress;
                    senderLogo = wsData.logo || wsData.Logo || null;
                    replyToEmail = wsData.correo_notificaciones || wsData.Correo || wsData.correo || wsData.email || null;

                    if (wsData.smtp_config && wsData.smtp_config.user && wsData.smtp_config.pass) {
                        smtpHost = wsData.smtp_config.host || "smtp.gmail.com";
                        smtpPort = parseInt(wsData.smtp_config.port || "587");
                        smtpUser = wsData.smtp_config.user;
                        smtpPass = (wsData.smtp_config.pass || '').replace(/\s+/g, '');
                    }
                }
            } catch (errWs) {
                console.warn("No se pudo obtener la configuración del taller desde Firestore:", errWs.message);
            }
        }

        // Clean phone for WhatsApp button
        const cleanPhone = (senderPhone || '').replace(/[^0-9]/g, '');
        const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('503') ? cleanPhone : '503' + cleanPhone}?text=${encodeURIComponent(`Hola, recibí el presupuesto ${budgetId} para mi vehículo. Me gustaría consultar detalles.`)}` : null;

        const vehiculoText = vehiculoInfo || "Vehículo en Taller";
        const totalFormatted = montoTotal ? parseFloat(montoTotal).toFixed(2) : '0.00';
        const pdfFileName = `Presupuesto_${budgetId.replace(/[^0-9A-Za-z_-]/g, '_')}.pdf`;
        const pdfBuffer = pdfBase64 ? Buffer.from(pdfBase64, 'base64') : null;

        const htmlBody = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <!-- Header con Branding del Taller -->
                <div style="background: #1e293b; padding: 26px 24px; text-align: center; border-bottom: 2px solid #3b82f6;">
                    ${senderLogo ? `
                        <div style="margin-bottom: 12px;">
                            <img src="${senderLogo}" alt="${senderName}" style="max-height: 60px; max-width: 220px; object-fit: contain;">
                        </div>
                    ` : ''}
                    <h2 style="margin: 0; color: #60a5fa; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${senderName}</h2>
                    <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Presupuesto de Mantenimiento & Reparación Automotriz</p>
                </div>
                
                <div style="padding: 30px 24px;">
                    <p style="font-size: 16px; margin-top: 0; color: #f8fafc;">Estimado(a) <strong>${clienteNombre || 'Cliente'}</strong>,</p>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 22px;">
                        <strong>${senderName}</strong> ha preparado la cotización de los trabajos y repuestos requeridos para su vehículo. A continuación le presentamos el resumen económico:
                    </p>

                    <!-- Tarjeta de Resumen -->
                    <div style="background: rgba(255,255,255,0.04); padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #334155;">
                        <table style="width: 100%; font-size: 14px; color: #e2e8f0; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 7px 0; color: #94a3b8; width: 40%;">N° Presupuesto:</td>
                                <td style="padding: 7px 0; text-align: right; font-weight: bold; font-family: monospace; color: #60a5fa;">${budgetId}</td>
                            </tr>
                            <tr>
                                <td style="padding: 7px 0; color: #94a3b8;">Vehículo / Placa:</td>
                                <td style="padding: 7px 0; text-align: right; font-weight: bold;">${vehiculoText}</td>
                            </tr>
                            ${subtotal ? `
                            <tr>
                                <td style="padding: 7px 0; color: #94a3b8;">Subtotal:</td>
                                <td style="padding: 7px 0; text-align: right; color: #cbd5e1;">$${parseFloat(subtotal).toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            ${iva ? `
                            <tr>
                                <td style="padding: 7px 0; color: #94a3b8;">IVA (13%):</td>
                                <td style="padding: 7px 0; text-align: right; color: #cbd5e1;">$${parseFloat(iva).toFixed(2)}</td>
                            </tr>
                            ` : ''}
                            <tr style="border-top: 1px solid #475569;">
                                <td style="padding: 10px 0 4px 0; color: #ffffff; font-weight: 700; font-size: 15px;">Monto Total Estimado:</td>
                                <td style="padding: 10px 0 4px 0; text-align: right; font-weight: 800; color: #4ade80; font-size: 20px;">$${totalFormatted}</td>
                            </tr>
                        </table>
                    </div>

                    ${observaciones && observaciones.trim() !== '' && observaciones !== 'Ninguna.' ? `
                    <div style="background: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; font-size: 13px; color: #93c5fd;">
                        <strong>Observaciones:</strong> ${observaciones}
                    </div>
                    ` : ''}

                    <div style="background: rgba(16, 185, 129, 0.08); border: 1px dashed rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 24px;">
                        <span style="color: #34d399; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
                            📎 El presupuesto detallado en PDF viene adjunto a este correo electrónico.
                        </span>
                    </div>

                    <!-- Botón de Contacto / WhatsApp -->
                    ${waLink ? `
                    <div style="text-align: center; margin: 26px 0;">
                        <a href="${waLink}" target="_blank" style="background: #10b981; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                            💬 Aprobar o Consultar por WhatsApp &rarr;
                        </a>
                    </div>
                    ` : ''}

                    <!-- Footer Taller -->
                    <div style="border-top: 1px solid #334155; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
                        <strong style="color: #94a3b8;">${senderName}</strong><br>
                        ${senderAddress ? `${senderAddress}<br>` : ''}
                        ${senderPhone ? `Tel: ${senderPhone}` : ''}
                    </div>

                    <p style="font-size: 11px; color: #475569; text-align: center; margin-top: 16px; margin-bottom: 0;">
                        Generado y enviado a través de Mecanic OS a solicitud de ${senderName}.
                    </p>
                </div>
            </div>
        `;

        const subject = `📋 Presupuesto de Reparación [${budgetId}] - ${senderName}`;

        // 1. Canal Prioritario A: Google Apps Script Web App (Puerto 443 HTTPS - Inmune a bloqueos)
        const appScriptUrl = process.env.APPSCRIPT_SENDER_URL || 
                             process.env.APPSCRIPT_URL || 
                             "https://script.google.com/macros/s/AKfycbx00qV4gn8RUXwpgTzykBcyCjZzjozkPJYbp1Fdmg-9cEbC35s20f3IbpxKbtWyp9f_gA/exec";

        if (appScriptUrl && appScriptUrl.trim() !== '') {
            try {
                const appScriptResult = await postToAppsScript(appScriptUrl.trim(), {
                    action: 'sendBudgetEmail',
                    recipientEmail: recipientEmail,
                    senderName: `${senderName} - Presupuestos`,
                    replyTo: replyToEmail || smtpUser || 'ventas@forbiddensoluciones.com',
                    subject: subject,
                    htmlBody: htmlBody,
                    pdfBase64: pdfBase64 || null,
                    pdfName: pdfFileName
                });

                if (appScriptResult && appScriptResult.success !== false) {
                    console.log(`Presupuesto ${budgetId} enviado vía Google Apps Script a ${recipientEmail}`);
                    saveDteLog("Envío Correo Presupuesto (Apps Script)", workshopId, "PRESUPUESTO", { recipientEmail, budgetId }, 200, appScriptResult, "APPSCRIPT");
                    return res.json({ success: true, message: `Presupuesto enviado exitosamente a ${recipientEmail}`, details: appScriptResult });
                }
            } catch (asErr) {
                console.warn("Google Apps Script envio de presupuesto falló, intentando fallback:", asErr.message);
            }
        }

        // 2. Canal B: Resend HTTP API
        const resendApiKey = process.env.RESEND_API_KEY;
        if (resendApiKey && resendApiKey.trim() !== '') {
            try {
                const resendResult = await sendViaResendHttpApi({
                    apiKey: resendApiKey,
                    from: `"${senderName}" <onboarding@resend.dev>`,
                    to: recipientEmail,
                    replyTo: replyToEmail || smtpUser || undefined,
                    subject: subject,
                    html: htmlBody,
                    pdfBuffer: pdfBuffer,
                    controlNum: budgetId
                });
                console.log(`Presupuesto ${budgetId} enviado vía Resend API a ${recipientEmail}:`, resendResult.id);
                saveDteLog("Envío Correo Presupuesto (Resend API)", workshopId, "PRESUPUESTO", { recipientEmail, budgetId }, 200, resendResult, "RESEND_API");
                return res.json({ success: true, message: `Presupuesto enviado exitosamente a ${recipientEmail}`, resendId: resendResult.id });
            } catch (resendErr) {
                console.warn("Resend API falló para presupuesto, intentando SMTP fallback:", resendErr.message);
            }
        }

        // 3. Canal C: Nodemailer SMTP (con soporte 465 SSL y 587 STARTTLS)
        if (!smtpPass || !smtpUser) {
            return res.status(400).json({ 
                success: false, 
                message: "Servicio de correo no configurado en este taller. Configure credenciales SMTP o APPSCRIPT_SENDER_URL." 
            });
        }

        let nodemailer;
        try {
            nodemailer = require('nodemailer');
        } catch (e) {
            return res.status(500).json({ success: false, message: "El módulo nodemailer no está disponible." });
        }

        const isGmail = smtpHost.includes('gmail') || smtpUser.endsWith('@gmail.com') || smtpUser.endsWith('@forbiddensoluciones.com');
        const transportConfig = isGmail ? {
            service: 'gmail',
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 8000,
            greetingTimeout: 4000,
            socketTimeout: 10000
        } : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 8000,
            greetingTimeout: 4000,
            socketTimeout: 10000
        };

        const transporter = nodemailer.createTransport(transportConfig);
        const attachmentsList = [];
        if (pdfBuffer) {
            attachmentsList.push({
                filename: pdfFileName,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        }

        const mailOptions = {
            from: `"${senderName}" <${smtpUser}>`,
            to: recipientEmail,
            replyTo: replyToEmail || smtpUser,
            subject: subject,
            html: htmlBody,
            attachments: attachmentsList
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Presupuesto ${budgetId} enviado por SMTP a ${recipientEmail}:`, info.messageId);

        saveDteLog("Envío Correo Presupuesto (SMTP)", workshopId, "PRESUPUESTO", { recipientEmail, budgetId }, 200, { messageId: info.messageId }, "EMAIL");

        return res.json({
            success: true,
            message: `Presupuesto enviado exitosamente a ${recipientEmail}`,
            messageId: info.messageId
        });

    } catch (err) {
        console.error("Exception on sendBudgetEmail:", err);
        return res.status(500).json({ success: false, message: "Error al enviar el presupuesto por correo: " + err.message });
    }
}

module.exports = {
    testConnection,
    emitDte,
    invalidateDte,
    retrieveDte,
    downloadDtePdf,
    receiveIncomingDte,
    resendDteEmail,
    sendBudgetEmail
};
