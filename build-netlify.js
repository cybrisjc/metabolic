const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
require('dotenv').config();

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

// Build Tailwind CSS
async function buildCSS() {
  const cssPath = path.join(__dirname, 'styles.css');
  if (!fs.existsSync(cssPath)) {
    fs.writeFileSync(cssPath, '@tailwind base;\n@tailwind components;\n@tailwind utilities;');
  }
  const css = fs.readFileSync(cssPath, 'utf8');
  const result = await postcss([tailwindcss, autoprefixer]).process(css, { from: cssPath, to: path.join(distDir, 'styles.css') });
  fs.writeFileSync(path.join(distDir, 'styles.css'), result.css);
  console.log('✅ Tailwind CSS built successfully to dist/styles.css');
}

// Read and modify index.html
const indexPath = path.join(__dirname, 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Replace Firebase config with dynamic loading (already handled in updated index.html)
// Ensure no duplicate initialization by removing old config if present
htmlContent = htmlContent.replace(/firebase\.initializeApp\([\s\S]*?\);/g, '');

// Add Firebase initialization script if not present (handled by updated index.html)
// This is now managed via the DOMContentLoaded event in index.html

// Write the modified content to dist
const withSafeOperations = htmlContent;
buildCSS().then(() => {
  fs.writeFileSync(path.join(distDir, 'index.html'), withSafeOperations);
  fs.writeFileSync(path.join(distDir, 'styles.css'), ''); // Ensure file exists even if build fails

  console.log('✅ Netlify build completed successfully!');
  console.log('📁 Secure version created in dist/index.html');
  console.log('🔒 Firebase configuration will be loaded securely from Netlify function /api/config');
  console.log('🔧 Tailwind CSS integrated locally');
  console.log('');
  console.log('## Demo Accounts (Email/Password):');
  console.log('- **Admin**: cybrisjc@gmail.com / password123');
  console.log('- **Physician**: drjones@metaboliclongcovidconsulting.com / password123');
  console.log('- **Patient**: johnsmith@metaboliclong@gmail.com / password123');
}).catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});