const { initCronJobs } = require('./services/cronJobs');
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3005;


// Inicializar tareas en segundo plano (Vigilante de Cuotas Wompi)
initCronJobs();

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Mecanic OS Dev Server corriendo en:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`==================================================`);
    console.log(`Presiona Ctrl+C para detener el servidor.`);
});
