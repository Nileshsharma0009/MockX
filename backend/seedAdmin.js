import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/user.model.js";
dotenv.config({ path: "./.env" });
const seedAdmin = async () => {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    console.error("Missing MONGODB_URL environment variable");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const email = "nilesh@mockx.com";
    const password = "admin123";
    const name = "Nilesh";

    let admin = await User.findOne({ email });
    if (admin) {
      console.log("Admin user already exists. Updating role to admin...");
      admin.role = "admin";
      await admin.save();
      console.log("Admin user updated successfully.");
    } else {
      console.log("Creating new admin user...");
      const hashPassword = await bcrypt.hash(password, 10);
      admin = await User.create({
        name,
        email,
        password: hashPassword,
        role: "admin",
        isVerified: true
      });
      console.log("Admin user created successfully.");
    }

    console.log(`Login details:\nEmail: ${email}\nPassword: ${password}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error.message);
    process.exit(1);
  }
};

seedAdmin();
