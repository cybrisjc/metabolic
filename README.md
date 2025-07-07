# Long COVID Symptom Journal - Secure Firebase Setup

## Overview

The Long COVID Symptom Journal is a web application built with React and Tailwind CSS to help users track and manage Long COVID symptoms. This version includes secure Firebase configuration management to protect sensitive credentials.

## Security Features

- **Environment Variables**: Firebase configuration is stored in environment variables, not in the source code
- **Cloud Functions**: Firebase config is served through a secure Cloud Function
- **Build Process**: Sensitive data is removed from the client-side code during build
- **Git Ignore**: Environment files are excluded from version control

## Setup Instructions

### 1. Prerequisites

- Node.js (v18 or higher)
- Firebase CLI (installation instructions below)
- A Firebase project

### 2. Initial Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd long-covid-symptom-journal
   ```

2. **Configure npm for global packages** (to avoid permission errors):
   ```bash
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   ```
   
   Add the export line to your shell profile file:
   ```bash
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```
   
   *Note: Replace `~/.bashrc` with `~/.zshrc` if you're using zsh shell*

3. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

4. **Install project dependencies**:
   ```bash
   npm install
   cd functions
   npm install
   cd ..
   ```

5. **Firebase Setup**:
   ```bash
   firebase login
   firebase use --add  # Select your Firebase project
   ```

### 3. Environment Configuration

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   cp functions/.env.example functions/.env
   ```

2. **Update environment variables**:
   - Edit `.env` with your Firebase project configuration
   - Edit `functions/.env` with the same configuration
   - Get these values from your Firebase Console > Project Settings > General

3. **Set Firebase Functions environment variables**:
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

### 4. Development

1. **Build the secure version**:
   ```bash
   npm run build
   ```

2. **Start local development**:
   ```bash
   firebase emulators:start
   ```

3. **Test locally**:
   - Open `http://localhost:5000` to view the app
   - The Firebase config will be loaded securely from the Cloud Function

### 5. Deployment

1. **Deploy to Firebase Hosting**:
   ```bash
   npm run deploy
   ```

2. **Verify deployment**:
   - Visit your Firebase Hosting URL
   - Check that the app loads without exposing Firebase credentials in the source

## Security Benefits

### Before (Insecure)
- Firebase credentials hardcoded in `index.html`
- Sensitive data visible in browser source
- Credentials exposed in GitHub repository

### After (Secure)
- Firebase credentials stored as environment variables
- Config served through secure Cloud Function
- No sensitive data in client-side code
- Environment files excluded from Git

## File Structure

```
├── .env                    # Environment variables (not in Git)
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
├── build.js               # Build script for secure deployment
├── firebase.json          # Firebase configuration
├── functions/
│   ├── .env               # Functions environment (not in Git)
│   ├── .env.example       # Functions environment template
│   ├── index.js           # Cloud Function for config
│   └── package.json       # Functions dependencies
├── index.html             # Original app file
├── dist/
│   └── index.html         # Secure built version
└── package.json           # Main dependencies
```

## Usage

The app functionality remains the same:

1. **Login Credentials**:
   - **Admin**: Username: `admin`, Password: `admin123`
   - **Physician**: Username: `drjones`, Password: `doctor123`
   - **Patient**: Username: `sarahb`, Password: `sarah123`

2. **Features**:
   - **Patients**: Log symptoms, view history and insights
   - **Physicians**: View assigned patients' data
   - **Admins**: Manage users and symptoms

## Troubleshooting

### Config Loading Issues
- Check Firebase Functions logs: `firebase functions:log`
- Verify environment variables are set correctly
- Ensure Cloud Function is deployed: `firebase deploy --only functions`

### Local Development
- Use Firebase emulators for local testing
- Check that `.env` files are properly configured
- Verify Firebase project is selected: `firebase use`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes (never commit `.env` files)
4. Test with `npm run build` and `firebase emulators:start`
5. Submit a pull request

## License

This project is licensed under the MIT License.