const express = require('express');
const cors = require('cors');
const path = require('path');

const wompiRoutes = require('./routes/wompiRoutes');
const dteRoutes = require('./routes/dteRoutes');
const utilsRoutes = require('./routes/utilsRoutes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Registrar rutas de la API
app.use('/api/wompi', wompiRoutes);
app.use('/api/dte', dteRoutes);
app.use('/api', utilsRoutes); // Mapea /api/log-error y /api/export/excel

// Servida de archivos estáticos del frontend
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

// Fallback SPA: sirve index.html para rutas no encontradas en el frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports = app;
