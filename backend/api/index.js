import app from "../app.js";
import connectDB from "../config/db.js";

let isConnected = false;

export default async function handler(req, res) {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
      console.log("✅ MongoDB connected (serverless)");
    }

    return app(req, res);
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
