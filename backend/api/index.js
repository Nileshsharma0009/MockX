import app from "../app.js";
import connectDB from "../config/db.js";

let isConnected = false;

export default async function handler(req, res) {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
      console.log("✅ MongoDB connected");
    }

    // 🔑 IMPORTANT
    app.handle(req, res);
  } catch (error) {
    console.error("❌ Server crash:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
