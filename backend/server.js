const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');

const app = express();
const PORT = 3005;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large JSON database payloads

// MongoDB Model
const workshopSchema = new mongoose.Schema({
    workshopId: { type: String, required: true, unique: true },
    database: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String }
});

const Workshop = mongoose.model('Workshop', workshopSchema);

// MongoDB Connection (Use a local DB for development/testing if no URI provided)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mecanicos';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Serve static frontend files
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(PUBLIC_DIR));

// BROWSER ERROR LOGGER FOR REMOTE DEBUGGING
app.post('/api/log-error', (req, res) => {
    console.log("\n❌ [BROWSER EXCEPTION] ❌");
    const err = req.body;
    console.log(`Message: ${err.message}`);
    console.log(`Source: ${err.source} (Line ${err.lineno}, Col ${err.colno})`);
    if (err.stack) console.log(`Stack Trace:\n${err.stack}`);
    console.log("-------------------------\n");
    res.status(200).send('Logged');
});

// API PROXY ENDPOINT FOR FACTURALLAMA
app.post('/api/dte', (req, res) => {
    try {
        const { apiKey, docType, payload } = req.body;

        // If no API Key is provided, fallback to simulated success for testing
        if (!apiKey || apiKey.trim() === '' || apiKey.startsWith('simulado_')) {
            console.log("FacturaLlama: No API Key provided. Returning mock DTE.");

            const genCode = "MOCK-DTE-" + Math.floor(Date.now() / 1000).toString() + "-" + Math.floor(Math.random()*10000);
            const ctrlNum = "DTE-" + (docType === 'ccf' ? '03' : '01') + "-M001P001-" + Math.floor(Math.random()*90000 + 10000);
            const seal = Math.floor(Math.random()*9000000).toString() + "-APPROVED-" + Math.floor(Math.random()*9000);

            return res.status(200).json({
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
                res.status(proxyRes.statusCode).json(JSON.parse(proxyBody));
            });
        });
        
        proxyReq.on('error', (err) => {
            console.error("FacturaLlama Proxy Connection Error:", err);
            res.status(502).json({
                success: false,
                error: "Bad Gateway",
                message: "Error de conexión con la API de FacturaLlama",
                details: err.message
            });
        });

        proxyReq.write(payloadString);
        proxyReq.end();

    } catch (err) {
        console.error("JSON Parse Error on /api/dte:", err);
        res.status(400).json({ success: false, error: "Bad Request", message: "Formato JSON inválido" });
    }
});

// MULTITENANT BACKEND SYNC ENDPOINTS

// Upload/Sync Database to Cloud
app.post('/api/sync/:workshopId', async (req, res) => {
    try {
        const { workshopId } = req.params;
        const { database, email } = req.body;

        if (!database) {
            return res.status(400).json({ success: false, message: 'Database payload is required' });
        }

        const updatedWorkshop = await Workshop.findOneAndUpdate(
            { workshopId },
            {
                database,
                updatedAt: new Date(),
                updatedBy: email || 'unknown'
            },
            { new: true, upsert: true }
        );

        console.log(`✅ Successfully synced database for workshop: ${workshopId}`);
        res.status(200).json({ success: true, message: 'Database synced to cloud successfully', updatedAt: updatedWorkshop.updatedAt });
    } catch (err) {
        console.error(`❌ Error syncing database for workshop ${req.params.workshopId}:`, err);
        res.status(500).json({ success: false, message: 'Server error syncing database' });
    }
});

// Download/Fetch Database from Cloud
app.get('/api/sync/:workshopId', async (req, res) => {
    try {
        const { workshopId } = req.params;
        const workshop = await Workshop.findOne({ workshopId });

        if (!workshop) {
            return res.status(404).json({ success: false, message: 'Workshop database not found in cloud' });
        }

        console.log(`✅ Successfully fetched database for workshop: ${workshopId}`);
        res.status(200).json({
            success: true,
            database: workshop.database,
            updatedAt: workshop.updatedAt
        });
    } catch (err) {
        console.error(`❌ Error fetching database for workshop ${req.params.workshopId}:`, err);
        res.status(500).json({ success: false, message: 'Server error fetching database' });
    }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Mecanic OS Express Server running on:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`==================================================`);
    console.log(`Press Ctrl+C to stop the server.`);
});
