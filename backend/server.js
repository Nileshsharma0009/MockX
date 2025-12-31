// import dotenv from "dotenv";
// import connectDB from "./config/db.js";
// import app from "./app.js";

// dotenv.config();

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   await connectDB();
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on port ${PORT}`);
//   });
// };

// startServer();


import express from "express";

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "API is running 🚀" });
});
app.get("/", (req, res) => {
  res.json({ status: "server is running 🚀" });
});

export default app;
