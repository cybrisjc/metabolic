// Helper functions to ensure Firebase is ready before use

// Function to wait for Firebase to be initialized
function waitForFirebase() {
  return new Promise((resolve) => {
    if (window.firebaseReady && window.db) {
      resolve(true);
    } else {
      const handleFirebaseReady = () => {
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        resolve(true);
      };
      window.addEventListener('firebaseReady', handleFirebaseReady);
      
      // Fallback timeout after 10 seconds
      setTimeout(() => {
        window.removeEventListener('firebaseReady', handleFirebaseReady);
        console.warn('Firebase initialization timeout');
        resolve(false);
      }, 10000);
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