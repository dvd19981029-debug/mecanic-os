const { db } = require('./config/firebaseAdmin');

async function test() {
    if (!db) {
        console.error("Firestore database is null");
        process.exit(1);
    }
    try {
        console.log("Querying dte_api_logs...");
        const snap = await db.collection('dte_api_logs').orderBy('timestamp', 'desc').limit(5).get();
        console.log(`Found ${snap.size} logs in dte_api_logs`);
        snap.forEach(doc => {
            console.log(`Document ID: ${doc.id}`);
            console.log(JSON.stringify(doc.data(), null, 2));
        });
        
        console.log("Querying saas_requests...");
        const reqSnap = await db.collection('saas_requests').limit(2).get();
        console.log(`Found ${reqSnap.size} requests`);
    } catch (err) {
        console.error("Error running test:", err);
    }
    process.exit(0);
}

test();
