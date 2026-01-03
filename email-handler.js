const { simpleParser } = require('mailparser');
const { saveEmail } = require('./firebase-config');

// Parse incoming email from Mailgun webhook
const parseMailgunEmail = async (mailgunData) => {
    try {
        const emailData = {
            from: mailgunData.sender || mailgunData.from,
            subject: mailgunData.subject || 'No Subject',
            text: mailgunData['body-plain'] || mailgunData['stripped-text'] || '',
            html: mailgunData['body-html'] || mailgunData['stripped-html'] || '',
            recipient: mailgunData.recipient
        };

        return emailData;
    } catch (error) {
        console.error('Error parsing Mailgun email:', error);
        throw error;
    }
};

// Extract username from email address
const extractUsername = (email) => {
    // Extract username from email like "akash@diamondquizify.info"
    const match = email.match(/^([^@]+)@/);
    return match ? match[1] : null;
};

// Handle incoming email webhook from Mailgun
const handleIncomingEmail = async (req, res) => {
    try {
        console.log('📧 Received email webhook from Mailgun');

        // Parse the email data from Mailgun
        const emailData = await parseMailgunEmail(req.body);

        // Extract username from recipient
        const username = extractUsername(emailData.recipient);

        if (!username) {
            console.error('❌ Could not extract username from recipient:', emailData.recipient);
            return res.status(400).json({ error: 'Invalid recipient' });
        }

        console.log(`📬 Email for user: ${username}`);
        console.log(`   From: ${emailData.from}`);
        console.log(`   Subject: ${emailData.subject}`);

        // Save email to Firebase
        const emailId = await saveEmail(username, emailData);

        res.status(200).json({
            success: true,
            message: 'Email received and stored',
            emailId: emailId
        });

    } catch (error) {
        console.error('❌ Error handling incoming email:', error);
        res.status(500).json({ error: 'Failed to process email' });
    }
};

module.exports = {
    handleIncomingEmail,
    parseMailgunEmail,
    extractUsername
};
