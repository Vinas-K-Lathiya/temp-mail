const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
    try {
        if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
            throw new Error('Missing required Firebase environment variables');
        }

        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

        // Debug logging (safe)
        console.log('Key length:', privateKey.length);
        console.log('Key starts with:', privateKey.substring(0, 20));
        console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
        console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);

        const serviceAccount = {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: privateKey,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
        };

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        console.log('Firebase Admin Apps:', admin.apps.length);

        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        throw error;
    }
};

// Get Firestore instance
const getFirestore = () => {
    return admin.firestore();
};

// Create or get user
const createUser = async (username) => {
    const db = getFirestore();
    const email = `${username}@${process.env.DOMAIN || 'diamondquizify.info'}`;

    try {
        const userRef = db.collection('users').doc(username);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            await userRef.set({
                username: username,
                email: email,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Created new user: ${email}`);
        }

        return { username, email };
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Save email to Firestore
const saveEmail = async (username, emailData) => {
    const db = getFirestore();

    try {
        const emailRef = await db.collection('emails').add({
            username: username,
            from: emailData.from,
            subject: emailData.subject,
            textBody: emailData.text,
            htmlBody: emailData.html,
            receivedAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        });

        console.log(`✅ Email saved with ID: ${emailRef.id}`);
        return emailRef.id;
    } catch (error) {
        console.error('Error saving email:', error);
        throw error;
    }
};

// Get emails for a user
const getEmails = async (username) => {
    const db = getFirestore();

    try {
        // Try with orderBy first
        try {
            const emailsSnapshot = await db.collection('emails')
                .where('username', '==', username)
                .orderBy('receivedAt', 'desc')
                .get();

            const emails = [];
            emailsSnapshot.forEach(doc => {
                emails.push({
                    id: doc.id,
                    ...doc.data(),
                    receivedAt: doc.data().receivedAt?.toDate()
                });
            });

            return emails;
        } catch (indexError) {
            // If index doesn't exist, fetch without orderBy and sort in memory
            console.log('⚠️ Firestore index not found, fetching without orderBy');
            const emailsSnapshot = await db.collection('emails')
                .where('username', '==', username)
                .get();

            const emails = [];
            emailsSnapshot.forEach(doc => {
                emails.push({
                    id: doc.id,
                    ...doc.data(),
                    receivedAt: doc.data().receivedAt?.toDate()
                });
            });

            // Sort in memory
            emails.sort((a, b) => {
                if (!a.receivedAt) return 1;
                if (!b.receivedAt) return -1;
                return b.receivedAt - a.receivedAt;
            });

            return emails;
        }
    } catch (error) {
        console.error('Error getting emails:', error);
        throw error;
    }
};

// Mark email as read
const markEmailAsRead = async (emailId) => {
    const db = getFirestore();

    try {
        await db.collection('emails').doc(emailId).update({
            read: true
        });
        console.log(`✅ Email ${emailId} marked as read`);
    } catch (error) {
        console.error('Error marking email as read:', error);
        throw error;
    }
};

module.exports = {
    initializeFirebase,
    getFirestore,
    createUser,
    saveEmail,
    getEmails,
    markEmailAsRead
};
