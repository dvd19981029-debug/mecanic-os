const https = require('https');
const crypto = require('crypto');

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

module.exports = {
    testConnection,
    emitDte,
    invalidateDte,
    retrieveDte,
    downloadDtePdf
};
