// backend/src/index.js
import dotenv from "dotenv";
dotenv.config();

import http from "http";

import connectDB from "./config/db.js";
import { checkStalledCheckouts } from "./ai/recoveryAgent.js";
import { initSocket } from "./services/socketService.js";
import { getValidatedJwtSecret } from "./config/token.js";

// Validate auth secrets after dotenv loads, before binding the server.
getValidatedJwtSecret();

// Load application environment before constructing CORS and optional ping behavior.
const { default: app } = await import("./app.js");

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, () => { 
      console.log(`🚀 Server running on port ${PORT}`);
      
      // Check for stalled checkouts every 1 minute
      setInterval(() => {
        checkStalledCheckouts().catch(err => console.error("Stalled checkouts check failed:", err));
      }, 60000);
      
      // Also check immediately on start
      checkStalledCheckouts().catch(err => console.error("Initial stalled checkouts check failed:", err));
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();



