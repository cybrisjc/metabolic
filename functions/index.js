const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");

// Cloud Function to serve Firebase configuration
exports.getConfig = onRequest({
  cors: true,
}, (req, res) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    // Get Firebase config from environment variables
    const config = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    };

    // Validate that all required config values are present
    const requiredFields = ["apiKey", "authDomain", "projectId"];
    const missingFields = requiredFields.filter((field) => !config[field]);

    if (missingFields.length > 0) {
      logger.error("Missing required Firebase config fields:", missingFields);
      res.status(500).json({
        error: "Server configuration error",
        message: "Missing required configuration fields",
      });
      return;
    }

    // Set security headers
    res.set({
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    // Return the configuration
    res.json(config);
    logger.info("Firebase config served successfully");
  } catch (error) {
    logger.error("Error serving Firebase config:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to load configuration",
    });
  }
});