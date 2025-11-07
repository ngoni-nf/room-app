// backend/src/firebaseAdmin.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './config/firebaseServiceAccount.json';

// Initialize Firebase Admin
if (!admin.apps.length) {
  let credential;
  
  try {
    // Check if service account file exists
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    } else {
      // Fallback: Try to parse from environment variable
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!serviceAccountJson) {
        throw new Error('Firebase service account not found. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON');
      }
      const serviceAccount = JSON.parse(serviceAccountJson);
      credential = admin.credential.cert(serviceAccount);
    }
    
    admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    console.log('✓ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('✗ Firebase Admin initialization failed:', error.message);
    throw new Error('Failed to initialize Firebase Admin');
  }
}

// Export Firebase services
export const auth = admin.auth();
export const firestore = admin.firestore();
export const messaging = admin.messaging();
export const storage = admin.storage();

export default admin;
