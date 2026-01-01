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
    return app(req, res); // 🔥 NOT app.listen
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
