// Quick test script to verify Firebase connection
const admin = require('firebase-admin');

try {
    const serviceAccount = require('./firebase-service-account.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase initialized successfully');

    const db = admin.firestore();

    // Test creating a document
    db.collection('test').doc('test123').set({
        test: 'Hello World',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log('✅ Successfully wrote to Firestore!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Error writing to Firestore:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    });

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
}
