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

// Step 1: Fix Firebase CDN imports - use the compat versions for browser compatibility
const firebaseImportsFixed = htmlContent.replace(
  /<script src="https:\/\/www\.gstatic\.com\/firebasejs\/[^"]*\/firebase-app\.js"><\/script>/g,
  '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>'
).replace(
  /<script src="https:\/\/www\.gstatic\.com\/firebasejs\/[^"]*\/firebase-auth\.js"><\/script>/g,
  '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>'
).replace(
  /<script src="https:\/\/www\.gstatic\.com\/firebasejs\/[^"]*\/firebase-firestore\.js"><\/script>/g,
  '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>'
);

// Read the Firebase helper script
const helperPath = path.join(__dirname, 'firebase-ready-helper.js');
const helperScript = fs.readFileSync(helperPath, 'utf8');

const configReplaced = firebaseImportsFixed.replace(
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
        
        // Enable Google Auth provider
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
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

// Step 5: Fix React rendering and Firebase initialization
const withSafeOperations = withHelper.replace(
  // Make sure Firebase variables are globally accessible
  /(let app = null;\s*let auth = null;\s*let db = null;)/,
  `$1
  
  // Make Firebase variables globally accessible
  window.app = null;
  window.auth = null;
  window.db = null;`
).replace(
  // Update Firebase initialization to set global variables
  /(app = firebase\.initializeApp\(firebaseConfig\);\s*auth = firebase\.auth\(\);\s*db = firebase\.firestore\(\);)/,
  `app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Set global variables
        window.app = app;
        window.auth = auth;
        window.db = db;`
).replace(
  // Ensure React root renders after Firebase is ready
  /(window\.dispatchEvent\(new CustomEvent\('firebaseReady'\)\);)/,
  `$1
        
        // Trigger React rendering after Firebase is ready
        if (typeof window.renderApp === 'function') {
          window.renderApp();
        }`
).replace(
  // Add React rendering trigger
  /(const root = ReactDOM\.createRoot\(document\.getElementById\('root'\)\);[\s\S]*?root\.render\(<App \/>\);)/,
  `// Create root but don't render immediately
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  // Function to render the app
  window.renderApp = function() {
    root.render(<App />);
  };
  
  // Render immediately if Firebase is already ready, otherwise wait
  if (window.firebaseReady) {
    window.renderApp();
  } else {
    // Listen for Firebase ready event
    window.addEventListener('firebaseReady', () => {
      window.renderApp();
    });
    
    // Fallback: render after 3 seconds even if Firebase isn't ready
    setTimeout(() => {
      if (!window.firebaseReady) {
        console.warn('Rendering app without Firebase (demo mode)');
        window.renderApp();
      }
    }, 3000);
  }`
).replace(
  // Wrap Firebase-dependent operations
  /(async function loadUserSymptoms\(\) \{)/g,
  `$1
    // Wait for Firebase to be ready before proceeding
    const isReady = await waitForFirebase();
    if (!isReady || !window.db) {
      console.error('Firebase not ready for loadUserSymptoms');
      return;
    }`
).replace(
  /(const handleAddUser = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }`
).replace(
  /(const handleUpdateUser = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }`
).replace(
  /(const handleDeleteUser = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }`
).replace(
  /(const handleAddSymptom = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }`
).replace(
  /(const handleUpdateSymptom = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }`
).replace(
  /(const handleDeleteSymptom = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }`
).replace(
  /(const saveSymptomEntry = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }`
).replace(
  /(const loadSymptomHistory = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }`
).replace(
  /(const loadPatientData = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }`
).replace(
  // Fix authentication to use email/password instead of username/password
  /(const handleLogin = async \([^)]*\) => \{)/g,
  `$1
    try {
      await waitForFirebase();
      if (!window.auth) {
        throw new Error('Authentication not available');
      }
      
      // Convert username to email format for Firebase Auth
      let email = username;
      if (!username.includes('@')) {
        // Map usernames to email addresses
        const userEmailMap = {
          'admin': 'admin@longcovidtracker.app',
          'drjones': 'drjones@longcovidtracker.app',
          'sarahb': 'sarahb@longcovidtracker.app'
        };
        email = userEmailMap[username] || username + '@longcovidtracker.app';
      }`
).replace(
  // Update the login logic to use Firebase Auth
  /(\/\/ Simulate authentication logic)/,
  `// Use Firebase Authentication
      try {
        const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Get user role from Firestore
        const userDoc = await window.db.collection('users').doc(user.uid).get();
        let userData;
        
        if (userDoc.exists) {
          userData = userDoc.data();
        } else {
          // Create default user data if doesn't exist
          const defaultUserData = {
            email: user.email,
            username: username,
            role: username === 'admin' ? 'admin' : (username === 'drjones' ? 'physician' : 'patient'),
            createdAt: new Date().toISOString()
          };
          
          await window.db.collection('users').doc(user.uid).set(defaultUserData);
          userData = defaultUserData;
        }
        
        // Set current user
        setCurrentUser({
          id: user.uid,
          username: userData.username || username,
          email: user.email,
          role: userData.role
        });
        
        setIsLoggedIn(true);
        setLoginError('');
        
      } catch (authError) {
        console.error('Authentication error:', authError);
        
        // If user doesn't exist, try to create them (for initial setup)
        if (authError.code === 'auth/user-not-found') {
          try {
            const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Create user document in Firestore
            const userData = {
              email: user.email,
              username: username,
              role: username === 'admin' ? 'admin' : (username === 'drjones' ? 'physician' : 'patient'),
              createdAt: new Date().toISOString()
            };
            
            await window.db.collection('users').doc(user.uid).set(userData);
            
            setCurrentUser({
              id: user.uid,
              username: username,
              email: user.email,
              role: userData.role
            });
            
            setIsLoggedIn(true);
            setLoginError('');
            
          } catch (createError) {
            console.error('User creation error:', createError);
            setLoginError('Invalid credentials or account creation failed');
          }
        } else {
          setLoginError('Invalid credentials');
        }
      }`
).replace(
  // Update logout to use Firebase Auth
  /(const handleLogout = \(\) => \{)/,
  `const handleLogout = async () => {
    try {
      if (window.auth) {
        await window.auth.signOut();
      }`
).replace(
  // Update the main App component to use the new login
  /(const App = \(\) => \{[\s\S]*?if \(!isLoggedIn\) \{[\s\S]*?return[\s\S]*?\})/,
  `const App = () => {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [currentUser, setCurrentUser] = React.useState(null);

    React.useEffect(() => {
      const checkAuthState = async () => {
        await waitForFirebase();
        if (window.auth) {
          window.auth.onAuthStateChanged(async (user) => {
            if (user) {
              // Get user data from Firestore
              try {
                const userDoc = await window.db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                  const userData = userDoc.data();
                  setCurrentUser({
                    id: user.uid,
                    name: userData.name,
                    email: user.email,
                    role: userData.role,
                    photoURL: userData.photoURL
                  });
                  setIsLoggedIn(true);
                }
              } catch (error) {
                console.error('Error fetching user data:', error);
              }
            } else {
              setCurrentUser(null);
              setIsLoggedIn(false);
            }
          });
        }
      };
      
      checkAuthState();
    }, []);

    if (!isLoggedIn) {
      return <LoginForm setIsLoggedIn={setIsLoggedIn} setCurrentUser={setCurrentUser} />;
    }`
).replace(
  // Update user management functions to work with Firebase Auth and proper user data structure
  /(const handleAddUser = async \([^)]*\) => \{)/,
  `const handleAddUser = async (userData) => {
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Firebase not available');
      }
      
      // Create user document in Firestore (for admin management)
      const userDoc = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: new Date().toISOString(),
        isManaged: true // Flag to indicate this user was created by admin
      };
      
      // Generate a document ID for the user
      const docRef = await window.db.collection('users').add(userDoc);
      
      // Update local users state
      setUsers(prev => [...prev, { id: docRef.id, ...userDoc }]);
      
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', role: 'patient' });
      
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user: ' + error.message);
    }
  };`
).replace(
  // Update user management modal to use name instead of username
  /(Add User Modal[\s\S]*?<input[\s\S]*?value=\{newUser\.username\}[\s\S]*?onChange=\{[^}]*setNewUser[^}]*username[^}]*\})/,
  `Add User Modal
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-96">
                <h3 className="text-lg font-semibold mb-4">Add New User</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}`
).replace(
  // Update user state initialization
  /(const \[newUser, setNewUser\] = React\.useState\(\{[\s\S]*?\}\);)/,
  `const [newUser, setNewUser] = React.useState({
    name: '',
    email: '',
    role: 'patient'
  });`
).replace(
  // Update users loading to get all users from Firestore
  /(const loadUsers = async \(\) => \{)/,
  `const loadUsers = async () => {
    try {
      await waitForFirebase();
      if (!window.db) {
        throw new Error('Database not available');
      }
      
      const usersSnapshot = await window.db.collection('users').get();
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };`
);

// Write the secure version to dist directory
fs.writeFileSync(path.join(distDir, 'index.html'), withSafeOperations);

console.log('✅ Netlify build completed successfully!');
console.log('📁 Secure version created in dist/index.html');
console.log('🔒 Firebase configuration will be loaded securely from Netlify function');
console.log('🔧 Fixed duplicate variable declarations');
console.log('');
console.log('## Demo Accounts (Email/Password):');
console.log('- **Admin**: admin@longcovidtracker.app / admin123');
console.log('- **Physician**: drjones@longcovidtracker.app / doctor123');
console.log('- **Patient**: sarahb@longcovidtracker.app / sarah123');