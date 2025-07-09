// Helper functions to ensure Firebase is ready before use

// Function to wait for Firebase to be initialized
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebaseReady && window.db && window.auth) {
      resolve(true);
    } else {
      const handleFirebaseReady = () => {
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        // Double-check that Firebase is actually ready
        resolve(window.firebaseReady && window.db && window.auth);
      };
      window.addEventListener('firebaseReady', handleFirebaseReady);
      
      // Fallback timeout after 15 seconds
      setTimeout(() => {
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        console.warn('Firebase initialization timeout');
        resolve(false);
      }, 15000);
    }
  });
}

// Safe wrapper for Firebase operations
async function safeFirebaseOperation(operation) {
  const isReady = await waitForFirebase();
  if (!isReady || !window.db) {
    throw new Error('Firebase is not initialized');
  }
  return operation();
}

// Export for use in the main application
window.waitForFirebase = waitForFirebase;
window.safeFirebaseOperation = safeFirebaseOperation;