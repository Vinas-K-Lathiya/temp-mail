// Application State
let currentUser = null;
let emails = [];
let eventSource = null;

// DOM Elements
const createSection = document.getElementById('createSection');
const inboxSection = document.getElementById('inboxSection');
const usernameInput = document.getElementById('usernameInput');
const createBtn = document.getElementById('createBtn');
const currentEmailSpan = document.getElementById('currentEmail');
const emptyStateEmail = document.getElementById('emptyStateEmail');
const emailList = document.getElementById('emailList');
const totalEmailsSpan = document.getElementById('totalEmails');
const unreadEmailsSpan = document.getElementById('unreadEmails');
const newAccountBtn = document.getElementById('newAccountBtn');
const copyEmailBtn = document.getElementById('copyEmailBtn');
const emailModal = document.getElementById('emailModal');
const closeModalBtn = document.getElementById('closeModal');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem('tempmail_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showInbox();
        loadEmails();
        startRealTimeUpdates();
    }

    // Event Listeners
    createBtn.addEventListener('click', createAccount);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createAccount();
    });
    newAccountBtn.addEventListener('click', createNewAccount);
    copyEmailBtn.addEventListener('click', copyEmailToClipboard);
    closeModalBtn.addEventListener('click', closeModal);
    emailModal.addEventListener('click', (e) => {
        if (e.target === emailModal) closeModal();
    });
});

// Create Account
async function createAccount() {
    const username = usernameInput.value.trim();

    if (!username) {
        showToast('Please enter a username', 'error');
        return;
    }

    if (username.length < 3) {
        showToast('Username must be at least 3 characters', 'error');
        return;
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(username)) {
        showToast('Username can only contain letters, numbers, hyphens, and underscores', 'error');
        return;
    }

    // Show loading state
    const originalText = createBtn.innerHTML;
    createBtn.innerHTML = '<div class="loading"></div>';
    createBtn.disabled = true;

    try {
        const response = await fetch('/api/create-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('tempmail_user', JSON.stringify(currentUser));
            showToast(`Email created: ${currentUser.email}`, 'success');
            showInbox();
            loadEmails();
            startRealTimeUpdates();
        } else {
            showToast(data.error || 'Failed to create account', 'error');
        }
    } catch (error) {
        console.error('Error creating account:', error);
        showToast('Failed to create account. Please try again.', 'error');
    } finally {
        createBtn.innerHTML = originalText;
        createBtn.disabled = false;
    }
}

// Show Inbox
function showInbox() {
    createSection.style.display = 'none';
    inboxSection.style.display = 'block';
    currentEmailSpan.textContent = currentUser.email;
    emptyStateEmail.textContent = currentUser.email;
}

// Create New Account
function createNewAccount() {
    if (confirm('Are you sure you want to create a new account? Your current inbox will still be accessible.')) {
        currentUser = null;
        emails = [];
        localStorage.removeItem('tempmail_user');

        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }

        createSection.style.display = 'block';
        inboxSection.style.display = 'none';
        usernameInput.value = '';
        emailList.innerHTML = '<div class="empty-state"><svg width="64" height="64" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="32" fill="rgba(102, 126, 234, 0.1)"/><path d="M20 26L32 34L44 26" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="18" y="24" width="28" height="20" rx="3" stroke="#667eea" stroke-width="2"/></svg><h3>No emails yet</h3><p>Emails will appear here instantly</p></div>';
    }
}

// Load Emails
async function loadEmails() {
    try {
        const response = await fetch(`/api/emails/${currentUser.username}`);
        const data = await response.json();

        if (data.success) {
            emails = data.emails;
            renderEmails();
            updateStats();
        }
    } catch (error) {
        console.error('Error loading emails:', error);
        showToast('Failed to load emails', 'error');
    }
}

// Render Emails
function renderEmails() {
    if (emails.length === 0) {
        emailList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="32" fill="rgba(102, 126, 234, 0.1)"/>
                    <path d="M20 26L32 34L44 26" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <rect x="18" y="24" width="28" height="20" rx="3" stroke="#667eea" stroke-width="2"/>
                </svg>
                <h3>No emails yet</h3>
                <p>Emails sent to <span id="emptyStateEmail">${currentUser.email}</span> will appear here instantly</p>
            </div>
        `;
        return;
    }

    emailList.innerHTML = emails.map(email => {
        const date = email.receivedAt ? new Date(email.receivedAt) : new Date();
        const preview = email.textBody ? email.textBody.substring(0, 100) : 'No preview available';

        return `
            <div class="email-item ${email.read ? '' : 'unread'}" data-email-id="${email.id}">
                <div class="email-header">
                    <div class="email-from">${escapeHtml(email.from)}</div>
                    <div class="email-date">${formatDate(date)}</div>
                </div>
                <div class="email-subject">${escapeHtml(email.subject)}</div>
                <div class="email-preview">${escapeHtml(preview)}</div>
            </div>
        `;
    }).join('');

    // Add click listeners
    document.querySelectorAll('.email-item').forEach(item => {
        item.addEventListener('click', () => {
            const emailId = item.dataset.emailId;
            const email = emails.find(e => e.id === emailId);
            if (email) {
                openEmailModal(email);
            }
        });
    });
}

// Update Stats
function updateStats() {
    totalEmailsSpan.textContent = emails.length;
    const unreadCount = emails.filter(e => !e.read).length;
    unreadEmailsSpan.textContent = unreadCount;
}

// Open Email Modal
async function openEmailModal(email) {
    document.getElementById('modalSubject').textContent = email.subject;
    document.getElementById('modalFrom').textContent = email.from;
    document.getElementById('modalDate').textContent = formatDate(new Date(email.receivedAt));

    // Display email content
    const iframe = document.getElementById('emailFrame');
    const content = email.htmlBody || `<pre style="font-family: sans-serif; white-space: pre-wrap;">${escapeHtml(email.textBody)}</pre>`;
    iframe.srcdoc = content;

    emailModal.classList.add('active');

    // Mark as read
    if (!email.read) {
        try {
            await fetch(`/api/emails/${email.id}/read`, { method: 'POST' });
            email.read = true;
            renderEmails();
            updateStats();
        } catch (error) {
            console.error('Error marking email as read:', error);
        }
    }
}

// Close Modal
function closeModal() {
    emailModal.classList.remove('active');
}

// Copy Email to Clipboard
async function copyEmailToClipboard() {
    try {
        await navigator.clipboard.writeText(currentUser.email);
        showToast('Email address copied to clipboard!', 'success');
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showToast('Failed to copy email address', 'error');
    }
}

// Start Real-Time Updates using Server-Sent Events
function startRealTimeUpdates() {
    if (eventSource) {
        eventSource.close();
    }

    eventSource = new EventSource(`/api/emails/${currentUser.username}/stream`);

    eventSource.onmessage = (event) => {
        try {
            const newEmail = JSON.parse(event.data);
            console.log('📧 New email received:', newEmail);

            // Add to emails array if not already present
            if (!emails.find(e => e.id === newEmail.id)) {
                emails.unshift(newEmail);
                renderEmails();
                updateStats();
                showToast(`New email from ${newEmail.from}`, 'success');

                // Play notification sound (optional)
                playNotificationSound();
            }
        } catch (error) {
            console.error('Error processing new email:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();

        // Retry connection after 5 seconds
        setTimeout(() => {
            if (currentUser) {
                startRealTimeUpdates();
            }
        }, 5000);
    };
}

// Play Notification Sound
function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

// Show Toast Notification
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility Functions
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (eventSource) {
        eventSource.close();
    }
});
