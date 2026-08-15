const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

let db = null;
let initError = null;

try {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
        // Limpiar comillas curvas y espacios especiales comunes de copiar/pegar
        serviceAccountJson = serviceAccountJson
            .replace(/[\u201c\u201d\u201e]/g, '"')
            .replace(/[\u2018\u2019]/g, "'")
            .trim();
            
        const serviceAccount = JSON.parse(serviceAccountJson);
        const app = admin.initializeApp({
            credential: admin.cert(serviceAccount)
        });
        db = getFirestore(app);
        console.log("Firebase Admin SDK inicializado exitosamente mediante cuenta de servicio.");
    } else {
        // Inicialización por defecto en caso de estar en entorno GCP / Firebase Hosting
        const app = admin.initializeApp();
        db = getFirestore(app);
        console.log("Firebase Admin SDK inicializado con credenciales por defecto.");
    }
} catch (error) {
    initError = {
        message: error.message,
        stack: error.stack
    };
    console.error("==================================================");
    console.error("❌ ERROR AL INICIALIZAR FIREBASE ADMIN SDK:");
    console.error(error.message);
    console.error("==================================================");
}

module.exports = { admin, db, initError };
