const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3005;
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
                const targetUrl = `https://api.facturallama.com/dte/${docType || 'fc'}`;
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
