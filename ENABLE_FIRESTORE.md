# 🔥 Enable Firestore Database - Quick Guide

Your Firebase credentials are configured correctly, but **Firestore Database needs to be enabled** in the Firebase Console.

## Steps to Enable Firestore

1. **Go to Firebase Console**:
   - Open: https://console.firebase.google.com/project/temp-mail-f08ee/firestore

![Firebase Console - Enable Firestore](C:/Users/pc/.gemini/antigravity/brain/43d637b2-a568-428a-b463-2d8fe0bc1471/firestore_enable_guide_1767382518186.png)

2. **Create Firestore Database**:
   - Click the **"Create database"** button
   
3. **Choose Security Rules**:
   - Select **"Start in test mode"** (for development)
   - Click **"Next"**
   
4. **Select Location**:
   - Choose a location closest to you (e.g., "asia-south1" for India)
   - Click **"Enable"**
   
5. **Wait for Setup**:
   - Firestore will take 1-2 minutes to provision
   - You'll see a message "Cloud Firestore is being provisioned"

6. **Verify Setup**:
   - Once complete, you'll see the Firestore Data tab
   - Collections will be empty (that's normal)

## After Enabling Firestore

1. **Restart the server**:
   - Press `Ctrl+C` in the terminal to stop the server
   - Run `npm start` again

2. **Test the application**:
   - Go to `http://localhost:3000`
   - Create an account with username "akash"
   - You should see the inbox appear!

## What Happens Next

Once Firestore is enabled:
- ✅ Account creation will work
- ✅ You'll see your email: `akash@diamondquizify.info`
- ✅ The inbox will display (currently empty)
- ✅ Real-time updates will be active

## Current Status

- ✅ Firebase credentials: **Configured**
- ✅ Server: **Running on port 3000**
- ✅ Frontend: **Working perfectly**
- ⏳ Firestore Database: **Needs to be enabled** (follow steps above)

---

**Quick Link**: [Enable Firestore Now](https://console.firebase.google.com/project/temp-mail-f08ee/firestore)
