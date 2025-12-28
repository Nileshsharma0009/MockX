// import mongoose from "mongoose";

// const connectDB = async () => {
//   const uri = process.env.MONGODB_URL;

//   if (!uri) {
//     console.error("❌ Missing MONGODB_URL in .env");
//     process.exit(1);
//   }

//   try {
//     await mongoose.connect(uri, {
//       serverSelectionTimeoutMS: 5000,
//     });
//     console.log("✅ MongoDB connected");
//   } catch (error) {
//     console.error("❌ MongoDB connection error:");
//     console.error(error.message);
//     process.exit(1);
//   }
// };

// export default connectDB;


import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URL;

  if (!uri) {
    throw new Error("❌ Missing MONGODB_URL environment variable");
  }

  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error; // let Vercel handle the error
  }
};

export default connectDB;
