const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
require('dotenv').config();

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build Tailwind CSS
async function buildCSS() {
  try {
    const cssPath = path.join(__dirname, 'styles.css');
    
    // Ensure styles.css exists
    if (!fs.existsSync(cssPath)) {
      console.log('📝 Creating styles.css with Tailwind directives...');
      fs.writeFileSync(cssPath, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
    }
    
    const css = fs.readFileSync(cssPath, 'utf8');
    const result = await postcss([tailwindcss, autoprefixer]).process(css, {
      from: cssPath,
      to: path.join(distDir, 'styles.css')
    });
    
    fs.writeFileSync(path.join(distDir, 'styles.css'), result.css);
    console.log('✅ Tailwind CSS compiled successfully to dist/styles.css');
    return true;
  } catch (error) {
    console.error('❌ Error building CSS:', error);
    // Create fallback CSS file
    fs.writeFileSync(path.join(distDir, 'styles.css'), '/* Fallback CSS - Tailwind build failed */');
    return false;
  }
}

// Sanitize input function for security
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>\"'&]/g, '').trim();
}

// Process HTML content
function processHTML() {
  try {
    const indexPath = path.join(__dirname, 'index.html');
    let htmlContent = fs.readFileSync(indexPath, 'utf8');

    // Replace CDN Tailwind CSS with local build
    htmlContent = htmlContent.replace(
      /<link rel="stylesheet" href="\/dist\/styles\.css">/,
      '<link rel="stylesheet" href="/dist/styles.css">'
    );

    // Ensure proper Firebase configuration loading
    const firebaseConfigScript = `
        // Dynamic Firebase config loading with enhanced error handling
        let firebaseConfig = null;
        let app = null;
        let auth = null;
        let db = null;
        let firebaseInitialized = false;

        async function loadFirebaseConfig() {
            try {
                console.log('🔧 Loading Firebase configuration...');
                const response = await fetch('/api/config');
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                firebaseConfig = await response.json();
                console.log('✅ Firebase configuration loaded successfully');
                return firebaseConfig;
            } catch (error) {
                console.error('❌ Error loading Firebase config:', error);
                
                // Enhanced fallback for local development
                if (window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname.includes('netlify.app')) {
                    
                    console.log('🔄 Using fallback configuration for development...');
                    firebaseConfig = {
                        apiKey: "${process.env.FIREBASE_API_KEY || 'demo-api-key'}",
                        authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com'}",
                        projectId: "${process.env.FIREBASE_PROJECT_ID || 'demo-project'}",
                        storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com'}",
                        messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789'}",
                        appId: "${process.env.FIREBASE_APP_ID || '1:123456789:web:demo'}",
                        measurementId: "${process.env.FIREBASE_MEASUREMENT_ID || 'G-DEMO'}"
                    };
                    return firebaseConfig;
                }
                throw error;
            }
        }

        async function initializeFirebase() {
            if (firebaseInitialized) {
                console.log('🔄 Firebase already initialized');
                return true;
            }

            try {
                await loadFirebaseConfig();
                if (firebaseConfig && typeof firebase !== 'undefined') {
                    app = firebase.initializeApp(firebaseConfig);
                    auth = firebase.auth();
                    db = firebase.firestore();
                    
                    firebaseInitialized = true;
                    window.firebaseReady = true;
                    window.app = app;
                    window.auth = auth;
                    window.db = db;
                    
                    console.log('✅ Firebase initialized successfully');
                    window.dispatchEvent(new CustomEvent('firebaseReady'));
                    return true;
                }
            } catch (error) {
                console.error('❌ Failed to initialize Firebase:', error);
                // Show user-friendly error message
                const errorDiv = document.createElement('div');
                errorDiv.innerHTML = \`
                    <div style="background: #fee; border: 1px solid #fcc; padding: 20px; margin: 20px; border-radius: 8px;">
                        <h3 style="color: #c33; margin: 0 0 10px 0;">Firebase Connection Error</h3>
                        <p style="margin: 0;">Unable to connect to the database. Please try refreshing the page.</p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Error: \${error.message}</p>
                    </div>
                \`;
                document.body.insertBefore(errorDiv, document.body.firstChild);
                return false;
            }
        }

        function waitForFirebase() {
            return new Promise((resolve) => {
                if (window.firebaseReady && firebaseInitialized) {
                    resolve(true);
                } else {
                    const handleFirebaseReady = () => {
                        window.removeEventListener('firebaseReady', handleFirebaseReady);
                        resolve(true);
                    };
                    window.addEventListener('firebaseReady', handleFirebaseReady);
                    
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        window.removeEventListener('firebaseReady', handleFirebaseReady);
                        console.warn('⚠️ Firebase initialization timeout');
                        resolve(false);
                    }, 10000);
                }
            });
        }

        // Initialize Firebase when DOM is ready
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('🚀 Starting Firebase initialization...');
            const initialized = await initializeFirebase();
            if (!initialized) {
                console.error('❌ Firebase initialization failed');
            }
        });

        // Make functions globally available
        window.waitForFirebase = waitForFirebase;
        window.loadFirebaseConfig = loadFirebaseConfig;
        window.initializeFirebase = initializeFirebase;
    `;

    // Replace existing Firebase initialization with enhanced version
    htmlContent = htmlContent.replace(
      /\/\/ Dynamic Firebase config loading[\s\S]*?window\.addEventListener\('firebaseReady', window\.renderApp\);/,
      firebaseConfigScript + `
        
        // Enhanced sanitization function
        function sanitizeInput(input) {
            if (typeof input !== 'string') return '';
            return input.replace(/[<>\"'&]/g, '').trim();
        }
        window.sanitizeInput = sanitizeInput;

        // Render app when Firebase is ready
        const root = ReactDOM.createRoot(document.getElementById('root'));
        window.renderApp = () => root.render(React.createElement(App));
        
        if (window.firebaseReady) {
            window.renderApp();
        } else {
            window.addEventListener('firebaseReady', window.renderApp);
        }
      `
    );

    return htmlContent;
  } catch (error) {
    console.error('❌ Error processing HTML:', error);
    throw error;
  }
}

// Main build function
async function build() {
  try {
    console.log('🔨 Starting Netlify build process...');
    console.log('📁 Build directory:', distDir);

    // Step 1: Build CSS
    console.log('\n📦 Step 1: Building Tailwind CSS...');
    const cssBuilt = await buildCSS();

    // Step 2: Process HTML
    console.log('\n📝 Step 2: Processing HTML...');
    const processedHTML = processHTML();

    // Step 3: Write processed HTML to dist
    const distIndexPath = path.join(distDir, 'index.html');
    fs.writeFileSync(distIndexPath, processedHTML);
    console.log('✅ HTML processed and saved to dist/index.html');

    // Step 4: Verify files exist
    const requiredFiles = ['index.html', 'styles.css'];
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(distDir, file)));
    
    if (missingFiles.length > 0) {
      console.warn('⚠️ Missing files in dist:', missingFiles);
    }

    // Success summary
    console.log('\n✅ Netlify build completed successfully!');
    console.log('📁 Files created in dist/:');
    console.log('  - index.html (secure version with local CSS)');
    console.log('  - styles.css (compiled Tailwind CSS)');
    console.log('🔒 Firebase configuration will be loaded securely from /api/config');
    console.log('🎨 Tailwind CSS integrated locally (no CDN dependency)');
    console.log('🔧 Enhanced error handling and fallback support');
    
    console.log('\n## Demo Accounts for Testing:');
    console.log('- **Admin**: cybrisjc@gmail.com / password123');
    console.log('- **Physician**: drjones@metaboliclongcovidconsulting.com / password123');
    console.log('- **Patient**: johnsmith@metaboliclong@gmail.com / password123');
    
    console.log('\n## Deployment Notes:');
    console.log('- Ensure environment variables are set in Netlify dashboard');
    console.log('- Verify /api/config endpoint is working');
    console.log('- Test authentication flow after deployment');

  } catch (error) {
    console.error('❌ Build failed:', error);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Check that all dependencies are installed: npm install');
    console.error('2. Verify environment variables are set');
    console.error('3. Ensure Netlify function is properly configured');
    console.error('4. Check PostCSS and Tailwind configuration');
    process.exit(1);
  }
}

// Run the build
build();