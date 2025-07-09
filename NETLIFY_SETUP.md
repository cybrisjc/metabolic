# Netlify Deployment Setup Instructions

## Overview

This guide will help you deploy the Long COVID Symptom Journal to Netlify with secure Firebase configuration management.

## Prerequisites

- A Netlify account (free tier available)
- Your Firebase project configuration
- The project files from this repository

## Step 1: Prepare Your Firebase Project

1. **Create Firebase Project** (if not already done):
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database

2. **Get Firebase Configuration**:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Add a web app or view existing config
   - Copy the configuration values

## Step 2: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify**:
   - Visit [netlify.com](https://netlify.com)
   - Sign up or log in

2. **Deploy from Git**:
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your repository
   - Configure build settings:
     - **Build command**: `npm run build:netlify`
     - **Publish directory**: `dist`
   - Click "Deploy site"

3. **Set Environment Variables**:
   - Go to Site settings > Environment variables
   - Add the following variables:
     ```
     FIREBASE_API_KEY=your_api_key_here
     FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     FIREBASE_MESSAGING_SENDER_ID=123456789
     FIREBASE_APP_ID=1:123456789:web:abcdef123456
     FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
     ```

4. **Redeploy**:
   - Go to Deploys tab
   - Click "Trigger deploy" > "Deploy site"

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize site**:
   ```bash
   netlify init
   ```

4. **Set environment variables**:
   ```bash
   netlify env:set FIREBASE_API_KEY "your_api_key_here"
   netlify env:set FIREBASE_AUTH_DOMAIN "your_project.firebaseapp.com"
   netlify env:set FIREBASE_PROJECT_ID "your_project_id"
   netlify env:set FIREBASE_STORAGE_BUCKET "your_project.appspot.com"
   netlify env:set FIREBASE_MESSAGING_SENDER_ID "123456789"
   netlify env:set FIREBASE_APP_ID "1:123456789:web:abcdef123456"
   netlify env:set FIREBASE_MEASUREMENT_ID "G-XXXXXXXXXX"
   ```

5. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

## Step 3: Configure Custom Domain (Optional)

1. **In Netlify Dashboard**:
   - Go to Site settings > Domain management
   - Click "Add custom domain"
   - Enter your domain (e.g., `app.getwellagain.org`)

2. **Update DNS Settings**:
   - Add a CNAME record pointing to your Netlify subdomain
   - Or follow Netlify's DNS configuration instructions

3. **Enable HTTPS**:
   - Netlify automatically provides SSL certificates
   - Ensure "Force HTTPS" is enabled

## Step 4: Verify Deployment

1. **Test the Application**:
   - Visit your Netlify URL
   - Check browser console for any errors
   - Try logging in with test credentials:
     - Admin: `admin` / `admin123`
     - Physician: `drjones` / `doctor123`
     - Patient: `sarahb` / `sarah123`

2. **Check Firebase Connection**:
   - Verify that Firebase configuration loads properly
   - Test authentication and data storage

## Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check that all environment variables are set
   - Verify Node.js version (18+ recommended)
   - Check build logs in Netlify dashboard

2. **Firebase Config Not Loading**:
   - Verify environment variables are set correctly
   - Check browser network tab for API calls to `/api/config`
   - Look for errors in browser console

3. **Function Errors**:
   - Check Netlify function logs in dashboard
   - Verify the function is deployed correctly
   - Test the function endpoint directly: `your-site.netlify.app/api/config`

### Useful Commands:

- **Local development**: `netlify dev`
- **View logs**: `netlify logs`
- **List environment variables**: `netlify env:list`
- **Redeploy**: `netlify deploy --prod`

## Security Features

- **Environment Variables**: Firebase credentials stored securely in Netlify
- **Serverless Functions**: Configuration served through Netlify Functions
- **No Exposed Credentials**: Client-side code contains no sensitive data
- **HTTPS**: Automatic SSL certificate from Netlify

## File Structure for Netlify

```
├── netlify.toml              # Netlify configuration
├── netlify/
│   └── functions/
│       └── config.js         # Serverless function for Firebase config
├── build-netlify.js          # Netlify-specific build script
├── dist/                     # Built files (auto-generated)
│   └── index.html           # Secure version for deployment
└── package.json             # Updated with Netlify build script
```

## Next Steps

After successful deployment:

1. **Test Thoroughly**: Verify all functionality works
2. **Monitor Performance**: Use Netlify Analytics
3. **Set Up Monitoring**: Configure error tracking
4. **Plan Scaling**: Consider upgrade plans if needed

Your Long COVID Symptom Journal should now be live on Netlify with secure Firebase configuration!

## Support

- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Netlify Community**: [community.netlify.com](https://community.netlify.com)
- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)