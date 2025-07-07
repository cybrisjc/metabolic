# Firebase Hosting Setup Instructions

## Prerequisites

Before starting, ensure you have:
- A Google account
- Node.js installed on your local machine
- Your project files downloaded from the development environment

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**:
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create a new project**:
   - Click "Create a project"
   - Enter project name: `long-covid-symptom-journal` (or your preferred name)
   - Choose whether to enable Google Analytics (optional)
   - Click "Create project"

3. **Wait for project creation** to complete

## Step 2: Enable Required Services

1. **Enable Authentication**:
   - In the Firebase Console, go to "Authentication"
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password" provider
   - Click "Save"

2. **Enable Firestore Database**:
   - Go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location closest to your users
   - Click "Done"

3. **Enable Hosting**:
   - Go to "Hosting"
   - Click "Get started"
   - Follow the setup wizard (we'll configure this later)

## Step 3: Get Firebase Configuration

1. **Get your Firebase config**:
   - In Firebase Console, go to "Project settings" (gear icon)
   - Scroll down to "Your apps" section
   - Click "Add app" and select the web icon (`</>`)
   - Register your app with a nickname (e.g., "Long COVID Journal")
   - Copy the Firebase configuration object

2. **Save the configuration**:
   ```javascript
   // Your Firebase config will look like this:
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456",
     measurementId: "G-XXXXXXXXXX"
   };
   ```

## Step 4: Local Setup (On Your Computer)

1. **Download your project files** from the development environment

2. **Install Node.js** (if not already installed):
   - Download from [https://nodejs.org/](https://nodejs.org/)
   - Install the LTS version

3. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

4. **Navigate to your project folder**:
   ```bash
   cd path/to/your/long-covid-symptom-journal
   ```

5. **Install project dependencies**:
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

## Step 5: Configure Environment Variables

1. **Create environment files**:
   ```bash
   cp .env.example .env
   cp functions/.env.example functions/.env
   ```

2. **Update `.env` file** with your Firebase configuration:
   ```env
   FIREBASE_API_KEY=your_api_key_here
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789
   FIREBASE_APP_ID=1:123456789:web:abcdef123456
   FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Update `functions/.env` file** with the same configuration

## Step 6: Firebase Authentication and Project Setup

1. **Login to Firebase**:
   ```bash
   firebase login
   ```
   - This will open a browser window
   - Sign in with your Google account
   - Grant permissions

2. **Initialize Firebase in your project**:
   ```bash
   firebase init
   ```
   
   **Select the following options**:
   - Use arrow keys to select: `Functions`, `Hosting`
   - Press spacebar to select, then Enter
   - Choose "Use an existing project"
   - Select your Firebase project from the list
   
   **For Functions setup**:
   - Choose JavaScript
   - Use ESLint: Yes
   - Install dependencies: Yes
   
   **For Hosting setup**:
   - Public directory: `dist`
   - Single-page app: Yes
   - Set up automatic builds: No
   - Overwrite index.html: No

## Step 7: Configure Firebase Functions Environment

1. **Set environment variables for Functions**:
   ```bash
   firebase functions:config:set \
     firebase.api_key="your_api_key" \
     firebase.auth_domain="your_project.firebaseapp.com" \
     firebase.project_id="your_project_id" \
     firebase.storage_bucket="your_project.appspot.com" \
     firebase.messaging_sender_id="123456789" \
     firebase.app_id="1:123456789:web:abcdef123456" \
     firebase.measurement_id="G-XXXXXXXXXX"
   ```

2. **Verify configuration**:
   ```bash
   firebase functions:config:get
   ```

## Step 8: Build and Deploy

1. **Build the project**:
   ```bash
   npm run build
   ```
   - This creates a secure version in the `dist` folder

2. **Deploy to Firebase**:
   ```bash
   firebase deploy
   ```
   - This deploys both Functions and Hosting

3. **Get your live URL**:
   - After deployment, Firebase will show your Hosting URL
   - It will be something like: `https://your-project-id.web.app`

## Step 9: Verify Deployment

1. **Test the application**:
   - Visit your Firebase Hosting URL
   - Try logging in with the test credentials
   - Verify that Firebase configuration loads properly

2. **Check Firebase Console**:
   - Go to Hosting section to see deployment status
   - Go to Functions section to see if the `getConfig` function is deployed

## Step 10: Custom Domain (Optional)

1. **Add custom domain**:
   - In Firebase Console, go to Hosting
   - Click "Add custom domain"
   - Enter your domain (e.g., `app.getwellagain.org`)
   - Follow DNS configuration instructions

2. **Update DNS settings** with your domain registrar:
   - Add the provided DNS records
   - Wait for DNS propagation (can take up to 24 hours)

## Troubleshooting

### Common Issues:

1. **Permission errors during npm install**:
   ```bash
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   ```

2. **Firebase CLI not found**:
   - Restart your terminal
   - Check if Firebase CLI is in your PATH

3. **Functions deployment fails**:
   - Check that all environment variables are set
   - Verify Node.js version (should be 18+)

4. **Config not loading**:
   - Check browser console for errors
   - Verify Functions are deployed: `firebase functions:list`

### Useful Commands:

- **View logs**: `firebase functions:log`
- **Local testing**: `firebase emulators:start`
- **Redeploy**: `firebase deploy`
- **Deploy only functions**: `firebase deploy --only functions`
- **Deploy only hosting**: `firebase deploy --only hosting`

## Security Notes

- Never commit `.env` files to version control
- The build process removes sensitive data from client-side code
- Firebase configuration is served securely through Cloud Functions
- Always use environment variables for sensitive data

## Next Steps

After successful deployment:
1. Test all functionality thoroughly
2. Set up monitoring and analytics
3. Configure backup strategies
4. Plan for scaling if needed

Your Long COVID Symptom Journal should now be live and secure!