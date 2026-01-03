// Quick test script to verify Firebase connection
const admin = require('firebase-admin');

require('dotenv').config();

try {
    if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('Missing required Firebase environment variables');
    }

    const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

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
