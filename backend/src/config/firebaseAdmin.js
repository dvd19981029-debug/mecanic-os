const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

let db = null;

try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
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
    console.error("Error al inicializar Firebase Admin SDK:", error);
}

module.exports = { admin, db };
