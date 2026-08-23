import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/user.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import { runRecoveryAgentForTransaction } from "../ai/recoveryAgent.js";
import RecoveryAuditLog from "../models/recoveryAuditLog.model.js";

const runTest = async () => {
  console.log("🔄 Connecting to Database...");
  await connectDB();

  try {
    // 1. Find a test user
    console.log("🔍 Finding a test user...");
    let user = await User.findOne({ role: "user" });
    
    if (!user) {
      console.log("✨ No user found. Creating a test student user...");
      user = new User({
        name: "Test Student",
        email: "student_test@example.com",
        password: "password123",
        role: "user",
        phone: "9876543210",
        exam: "imucet"
      });
      await user.save();
      console.log(`✅ Created test user: ${user.email}`);
    } else {
      console.log(`✅ Found test user: ${user.name} (${user.email})`);
    }

    // 2. Create a simulated failed payment transaction
    console.log("💳 Creating a simulated failed payment transaction...");
    const orderId = `order_test_${Date.now()}`;
    const transaction = new PaymentTransaction({
      orderId,
      userId: user._id,
      mockId: "imucet",
      amount: 499,
      status: "FAILED",
      failureDetails: {
        code: "BAD_GATEWAY",
        description: "Payment gateway timeout. Simulation."
      }
    });
    await transaction.save();
    console.log(`✅ Created failed transaction: ${transaction.orderId} (ID: ${transaction._id})`);

    // 3. Trigger the AI Revenue Recovery Agent
    console.log("🚀 Triggering the AI Revenue Recovery Agent...");
    const result = await runRecoveryAgentForTransaction(transaction._id);
    console.log("✨ Agent Execution Completed!");

    // 4. Fetch the resulting audit logs
    console.log("\n📋 Fetching Audit Logs for this recovery session:");
    const logs = await RecoveryAuditLog.find({ transactionId: transaction._id }).sort({ createdAt: 1 });
    logs.forEach((log, index) => {
      console.log(`\n[Step ${index + 1}] Action: ${log.action} | Time: ${log.createdAt.toLocaleTimeString()}`);
      console.log(`Details:`, JSON.stringify(log.details, null, 2));
    });

  } catch (err) {
    console.error("❌ Test run failed:", err);
  } finally {
    console.log("\n🔌 Closing database connection...");
    await mongoose.connection.close();
    console.log("👋 Done!");
    process.exit(0);
  }
};

runTest();
