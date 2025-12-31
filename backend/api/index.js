import serverless from "serverless-http";
import app from "../app.js";
import connectDB from "../config/db.js";

let isConnected = false;

const handler = serverless(app);

export default async function (req, res) {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
      console.log("✅ MongoDB connected (serverless)");
    }

    return handler(req, res);
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
