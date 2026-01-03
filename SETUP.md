# 🚀 Quick Setup Guide

## Before You Start

You need to set up Firebase and Mailgun accounts. Follow these steps:

### 1. Firebase Setup (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or use existing project
3. Enter project name and click Continue
4. **Enable Firestore Database**:
   - In Firebase Console, click "Firestore Database"
   - Click "Create Database"
   - Choose "Start in test mode" for now
   - Select a location (choose closest to you)
5. **Get Service Account Credentials**:
   - Go to Project Settings (gear icon) → Service Accounts
   - Click "Generate New Private Key"
   - Save the downloaded JSON file as `firebase-service-account.json` in this folder
   - OR copy the values to create a `.env` file (see below)

### 2. Mailgun Setup (10 minutes)

1. Sign up at [Mailgun](https://www.mailgun.com/) (free tier available)
2. Verify your email address
3. **Add Your Domain**:
   - Go to Sending → Domains
   - Click "Add New Domain"
   - Enter: `diamondquizify.info`
   - Follow DNS configuration instructions
4. **Get API Key**:
   - Go to Settings → API Keys
   - Copy your "Private API key"

### 3. Configure DNS Records for diamondquizify.info

Add these records in your domain registrar (where you bought the domain):

**MX Records** (for receiving emails):
```
Type: MX    Name: @    Value: mxa.mailgun.org    Priority: 10
Type: MX    Name: @    Value: mxb.mailgun.org    Priority: 10
```

**TXT Records** (for verification - get these from Mailgun dashboard):
```
Type: TXT    Name: @    Value: [SPF record from Mailgun]
Type: TXT    Name: [DKIM selector]    Value: [DKIM value from Mailgun]
```

**CNAME Record** (for tracking):
```
Type: CNAME    Name: email    Value: mailgun.org
```

⚠️ **Note**: DNS changes can take 24-48 hours to propagate.

### 4. Create Environment File

Create a file named `.env` in the `c:\Users\pc\temp_mail` folder with this content:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Mailgun Configuration
MAILGUN_API_KEY=your-mailgun-private-api-key-here
MAILGUN_DOMAIN=diamondquizify.info

# Server Configuration
PORT=3000
DOMAIN=diamondquizify.info
NODE_ENV=development
```

**How to fill this:**
- Open the `firebase-service-account.json` file you downloaded
- Copy `project_id` → `FIREBASE_PROJECT_ID`
- Copy `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n characters)
- Copy `client_email` → `FIREBASE_CLIENT_EMAIL`
- Paste your Mailgun API key → `MAILGUN_API_KEY`

### 5. Run the Application Locally

```bash
npm start
```

Open your browser and go to: `http://localhost:3000`

### 6. Test Locally (Without Real Emails)

For local testing, you can simulate receiving an email using this PowerShell command:

```powershell
$body = @{
    sender = "test@example.com"
    recipient = "akash@diamondquizify.info"
    subject = "Test Email"
    "body-plain" = "This is a test email message"
}

Invoke-WebRequest -Uri "http://localhost:3000/api/webhook/mailgun" -Method POST -Body $body
```

## 🌐 Deploy to Render (For Live Emails)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - TempMail system"
git remote add origin https://github.com/YOUR-USERNAME/tempmail.git
git push -u origin main
```

### 2. Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Sign up or log in
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render will detect `render.yaml` automatically
6. **Add Environment Variables**:
   - Click "Environment" tab
   - Add all variables from your `.env` file:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_PRIVATE_KEY` (paste the entire key with \n)
     - `FIREBASE_CLIENT_EMAIL`
     - `MAILGUN_API_KEY`
     - `MAILGUN_DOMAIN` (already set to diamondquizify.info)
7. Click "Create Web Service"

### 3. Configure Mailgun Webhook

1. Go to Mailgun Dashboard → Sending → Webhooks
2. Click "Add Webhook"
3. **Webhook URL**: `https://your-app-name.onrender.com/api/webhook/mailgun`
   (Replace with your actual Render URL)
4. **Event Type**: Select "Incoming Messages"
5. Save

### 4. Point Your Domain to Render

In your domain registrar, add:

```
Type: A        Name: @      Value: [Render IP - shown in dashboard]
Type: CNAME    Name: www    Value: your-app-name.onrender.com
```

### 5. Test with Real Emails!

1. Visit `https://diamondquizify.info`
2. Create email: `akash@diamondquizify.info`
3. Use it to register on BC Game or any other service
4. Watch emails arrive in real-time! 🎉

## 🐛 Troubleshooting

### "Firebase initialization error"
- Check that your `.env` file exists and has correct values
- Make sure `FIREBASE_PRIVATE_KEY` includes the quotes and \n characters
- Verify Firebase project exists and Firestore is enabled

### "Emails not receiving"
- Check DNS records are configured correctly (use [MXToolbox](https://mxtoolbox.com/))
- Verify Mailgun webhook is pointing to correct URL
- Check Mailgun logs for delivery issues
- DNS changes can take 24-48 hours

### "Cannot connect to server"
- Make sure you ran `npm install`
- Check that port 3000 is not in use
- Verify `.env` file is in the correct location

## 📧 Need Help?

Check the full `README.md` for detailed documentation!
