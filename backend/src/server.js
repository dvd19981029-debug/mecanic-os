require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Mecanic OS Dev Server corriendo en:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`==================================================`);
    console.log(`Presiona Ctrl+C para detener el servidor.`);
});
