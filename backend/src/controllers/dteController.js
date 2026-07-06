const https = require('https');
const crypto = require('crypto');
const { db } = require('../config/firebaseAdmin');

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
            return res.json({
                success: true,
                simulated: true,
                message: "¡Conexión de prueba simulada exitosamente! (Modo Simulación activo)"
            });
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
                
                return res.json({
                    success: success,
                    statusCode: proxyRes.statusCode,
                    message: message,
                    details: proxyBody
                });
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
            
            return res.json({
                success: true,
                simulated: true,
                code: "00",
                description: "DTE Simulado Exitosamente (Sin API Key)",
                generationCode: genCode,
                controlNumber: ctrlNum,
                receptionSeal: seal,
                mhDteUrl: `https://admin.factura.gob.sv/consultaPublica?ambiente=01&codGen=${genCode}&fechaEmi=${new Date().toISOString().split('T')[0]}`
            });
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
            return res.json({
                success: true,
                simulated: true,
                id: crypto.randomUUID ? crypto.randomUUID() : 'simulated-invalidate-uuid-998877',
                status: "APPROVED",
                message: "DTE Anulado Simulado Exitosamente"
            });
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
            return res.json({
                success: true,
                simulated: true,
                id: dteId,
                status: "APPROVED",
                environment: "TEST",
                type: "FC",
                controlNumber: "DTE-01-M001P001-99887",
                message: "Consulta de DTE simulada con éxito"
            });
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

module.exports = {
    testConnection,
    emitDte,
    invalidateDte,
    retrieveDte,
    downloadDtePdf,
    receiveIncomingDte
};
