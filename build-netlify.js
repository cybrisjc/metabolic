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

// Read the Firebase helper script
const helperPath = path.join(__dirname, 'firebase-ready-helper.js');
const helperScript = fs.readFileSync(helperPath, 'utf8');

// Step 1: Replace Firebase config object
const configReplaced = htmlContent.replace(
  /const firebaseConfig = \{[\s\S]*?\};/,
  `// Firebase config will be loaded dynamically
  let firebaseConfig = null;
  
  // Function to load Firebase config securely from Netlify function
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
      // Fallback for local development
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

// Step 2: Remove ALL Firebase variable declarations more thoroughly
let variablesRemoved = configReplaced;

// Remove const declarations
variablesRemoved = variablesRemoved.replace(/const\s+app\s*=\s*firebase\.initializeApp\([^)]*\);?\s*/g, '');
variablesRemoved = variablesRemoved.replace(/const\s+auth\s*=\s*firebase\.auth\(\);?\s*/g, '');
variablesRemoved = variablesRemoved.replace(/const\s+db\s*=\s*firebase\.firestore\(\);?\s*/g, '');

// Remove let declarations
variablesRemoved = variablesRemoved.replace(/let\s+app\s*=\s*firebase\.initializeApp\([^)]*\);?\s*/g, '');
variablesRemoved = variablesRemoved.replace(/let\s+auth\s*=\s*firebase\.auth\(\);?\s*/g, '');
variablesRemoved = variablesRemoved.replace(/let\s+db\s*=\s*firebase\.firestore\(\);?\s*/g, '');

// Remove var declarations
variablesRemoved = variablesRemoved.replace(/var\s+app\s*=\s*firebase\.initializeApp\([^)]*\);?\s*/g, '');
variablesRemoved = variablesRemoved.replace(/var\s+auth\s*=\s*firebase\.auth\(\);?\s*/g, '');
variablesRemoved = variablesRemoved.replace(/var\s+db\s*=\s*firebase\.firestore\(\);?\s*/g, '');

// Remove standalone Firebase initialization calls
variablesRemoved = variablesRemoved.replace(/firebase\.initializeApp\([^)]*\);?\s*/g, '');

// Remove any remaining duplicate variable declarations that might be scattered
variablesRemoved = variablesRemoved.replace(/^\s*(const|let|var)\s+(app|auth|db)\s*=.*?;?\s*$/gm, '');

// Step 3: Add the new async Firebase initialization in the right place
const finalContent = variablesRemoved.replace(
  /(\/\/ Firebase config will be loaded dynamically[\s\S]*?}\s*})/,
  `$1
  
  // Firebase variables - will be initialized asynchronously
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
    console.log('Initializing application...');
    
    try {
      const initialized = await initializeFirebase();
      if (initialized) {
        console.log('Application initialized successfully');
        // Set a global flag that Firebase is ready
        window.firebaseReady = true;
        
        // Dispatch a custom event to notify components that Firebase is ready
        window.dispatchEvent(new CustomEvent('firebaseReady'));
        
        // Also trigger any callback if it exists
        if (typeof window.onFirebaseReady === 'function') {
          window.onFirebaseReady();
        }
      } else {
        console.warn('Firebase initialization failed, running in demo mode');
        window.firebaseReady = false;
      }
    } catch (error) {
      console.error('Application initialization error:', error);
      window.firebaseReady = false;
      // Show user-friendly error but don't break the app
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = \`
        <div style="position: fixed; top: 20px; right: 20px; background: #fee; border: 1px solid #fcc; color: #c66; padding: 15px; border-radius: 5px; z-index: 1000; max-width: 300px;">
          <strong>Notice:</strong> Running in demo mode. Some features may be limited.
          <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; color: #c66; cursor: pointer;">×</button>
        </div>
      \`;
      document.body.appendChild(errorDiv);
    }
  });`
);

// Step 4: Inject the Firebase helper script before the main script
const withHelper = finalContent.replace(
  /(<script type="text\/babel">)/,
  `<script>
${helperScript}
</script>
$1`
);

// Step 5: Wrap Firebase-dependent operations to wait for initialization
const withSafeOperations = withHelper.replace(
  /(async function loadUserSymptoms\(\) \{)/g,
  `$1
    // Wait for Firebase to be ready before proceeding
    const isReady = await waitForFirebase();
    if (!isReady) {
      console.error('Firebase not ready for loadUserSymptoms');
      return;
    }`
).replace(
  /(const handleAddUser = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();`
).replace(
  /(const handleUpdateUser = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();`
).replace(
  /(const handleDeleteUser = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();`
);

// Write the secure version to dist directory
fs.writeFileSync(path.join(distDir, 'index.html'), withSafeOperations);

console.log('✅ Netlify build completed successfully!');
console.log('📁 Secure version created in dist/index.html');
console.log('🔒 Firebase configuration will be loaded securely from Netlify function');
console.log('🔧 Fixed duplicate variable declarations');