const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Read the original index.html
const indexPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Create a secure version that fetches config from API
const secureHtmlContent = htmlContent.replace(
  /const firebaseConfig = \{[\s\S]*?\};/,
  `// Firebase config will be loaded dynamically
  let firebaseConfig = null;
  
  // Function to load Firebase config securely
  async function loadFirebaseConfig() {
    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error('Failed to load Firebase configuration');
      }
      firebaseConfig = await response.json();
      return firebaseConfig;
    } catch (error) {
      console.error('Error loading Firebase config:', error);
      // Fallback to environment variables for local development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        firebaseConfig = {
          apiKey: "${process.env.FIREBASE_API_KEY || ''}",
          authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
          projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
          storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
          messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
          appId: "${process.env.FIREBASE_APP_ID || ''}",
          measurementId: "${process.env.FIREBASE_MEASUREMENT_ID || ''}"
        };
        return firebaseConfig;
      }
      throw error;
    }
  }`
);

// Update Firebase initialization to be async
const updatedHtmlContent = secureHtmlContent.replace(
  /firebase\.initializeApp\(firebaseConfig\);/,
  `// Firebase will be initialized after config is loaded
  let app = null;
  let auth = null;
  let db = null;
  
  // Initialize Firebase after loading config
  async function initializeFirebase() {
    try {
      await loadFirebaseConfig();
      if (firebaseConfig) {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log('Firebase initialized successfully');
        return true;
      }
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      return false;
    }
  }
  
  // Call initialization when DOM is loaded
  document.addEventListener('DOMContentLoaded', async () => {
    const initialized = await initializeFirebase();
    if (!initialized) {
      console.error('Firebase initialization failed');
      // You might want to show an error message to the user
    }
  });`
);

// Write the secure version to dist directory
fs.writeFileSync(path.join(distDir, 'index.html'), updatedHtmlContent);

console.log('✅ Build completed successfully!');
console.log('📁 Secure version created in dist/index.html');
console.log('🔒 Firebase configuration will be loaded securely from Cloud Function');