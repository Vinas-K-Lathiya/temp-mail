const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeFirebase, createUser, getEmails, markEmailAsRead, getFirestore } = require('./firebase-config');
const { handleIncomingEmail } = require('./email-handler');

// Initialize Firebase
// Initialize Firebase
try {
    initializeFirebase();
} catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Routes

// Create new temporary email account
app.post('/api/create-account', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        // Validate username (alphanumeric and hyphens only)
        if (!/^[a-zA-Z0-9-_]+$/.test(username)) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens, and underscores' });
        }

        const user = await createUser(username);
        res.json({ success: true, user });
    } catch (error) {
        console.error('❌ Error creating account:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Failed to create account', details: error.message });
    }
});

// Get emails for a user
app.get('/api/emails/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const emails = await getEmails(username);
        res.json({ success: true, emails });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

// Mark email as read
app.post('/api/emails/:emailId/read', async (req, res) => {
    try {
        const { emailId } = req.params;
        await markEmailAsRead(emailId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking email as read:', error);
        res.status(500).json({ error: 'Failed to mark email as read' });
    }
});

// Mailgun webhook endpoint for receiving emails
app.post('/api/webhook/mailgun', handleIncomingEmail);

// Real-time email updates endpoint (Server-Sent Events)
app.get('/api/emails/:username/stream', async (req, res) => {
    const { username } = req.params;

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Listen to Firestore changes
    const db = getFirestore();
    const unsubscribe = db.collection('emails')
        .where('username', '==', username)
        .orderBy('receivedAt', 'desc')
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const email = {
                        id: change.doc.id,
                        ...change.doc.data(),
                        receivedAt: change.doc.data().receivedAt?.toDate()
                    };
                    res.write(`data: ${JSON.stringify(email)}\n\n`);
                }
            });
        });

    // Clean up on client disconnect
    req.on('close', () => {
        unsubscribe();
        res.end();
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Visit http://localhost:${PORT}`);
    console.log(`📧 Domain: ${process.env.DOMAIN || 'diamondquizify.info'}`);
});
