import User from "../models/user.model.js";
import PaymentTransaction from "../models/paymentTransaction.model.js";
import Notification from "../models/notification.model.js";
import RecoveryAuditLog from "../models/recoveryAuditLog.model.js";
import Result from "../models/result.model.js";

/* -------------------------------------------------------------
 * 1. RECOVERY AGENT TOOLS
 * ------------------------------------------------------------- */

export const getCustomerDetails = async (userId) => {
  try {
    const user = await User.findById(userId).select("name email phone exam imucetOption hasPaid purchasedExams createdAt");
    return user ? user.toObject() : null;
  } catch (err) {
    console.error("getCustomerDetails error:", err);
    return null;
  }
};

export const getTransactionDetails = async (transactionId) => {
  try {
    const txn = await PaymentTransaction.findById(transactionId).populate("userId", "name email phone");
    return txn ? txn.toObject() : null;
  } catch (err) {
    console.error("getTransactionDetails error:", err);
    return null;
  }
};

export const getPreviousFailedAttempts = async (userId, mockId) => {
  try {
    const attempts = await PaymentTransaction.find({
      userId,
      mockId,
      status: "FAILED"
    }).sort({ createdAt: -1 });
    return attempts.map(a => a.toObject());
  } catch (err) {
    console.error("getPreviousFailedAttempts error:", err);
    return [];
  }
};

export const getRecoveryHistory = async (transactionId) => {
  try {
    const logs = await RecoveryAuditLog.find({ transactionId }).sort({ createdAt: 1 });
    return logs.map(l => l.toObject());
  } catch (err) {
    console.error("getRecoveryHistory error:", err);
    return [];
  }
};

/* -------------------------------------------------------------
 * 2. MERCHANT COPILOT / ADMIN DASHBOARD METRICS TOOLS
 * ------------------------------------------------------------- */

export const getRecoveryMetrics = async () => {
  try {
    const allTxns = await PaymentTransaction.find();

    // Group by userId + mockId
    const groups = {};
    for (const t of allTxns) {
      if (!t.userId || !t.mockId) continue;
      const key = `${t.userId.toString()}_${t.mockId}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(t);
    }

    let totalRevenueAtRisk = 0;
    let recoveriesAttempted = 0;
    let successfulRecoveries = 0;
    let recoveredAmount = 0;
    let ignoredUsers = 0;
    let unresolvedCases = 0;

    for (const key in groups) {
      const list = groups[key];
      
      // Determine if this user-product combo ever succeeded
      const isRecovered = list.some(t => t.status === "SUCCESS" || t.recovery?.status === "RECOVERED");
      
      // Determine if AI recovery was attempted on any failed/pending txn in this combo
      const wasAttempted = list.some(t => (t.recovery?.status && t.recovery.status !== "NOT_STARTED") || (t.recovery?.attempts > 0));
      
      // Determine if user opted out on any txn in this combo
      const isIgnored = list.some(t => t.recovery?.status === "NOT_INTERESTED" || t.recovery?.status === "STOPPED");

      // Get the latest amount (from the latest transaction in this group)
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const latestTxn = list[0];
      const amount = latestTxn.amount || 0;

      if (isRecovered) {
        recoveredAmount += amount;
        if (wasAttempted) {
          successfulRecoveries += 1;
        }
      } else {
        // If not recovered, the amount of the product is at risk
        totalRevenueAtRisk += amount;
        
        if (isIgnored) {
          ignoredUsers += 1;
        } else if (wasAttempted) {
          unresolvedCases += 1;
        }
      }

      if (wasAttempted) {
        recoveriesAttempted += 1;
      }
    }

    const recoveryRate = recoveriesAttempted > 0
      ? parseFloat(((successfulRecoveries / recoveriesAttempted) * 100).toFixed(1))
      : 0;

    // Messages Sent (Notifications sent of type payment_failed)
    const messagesSent = await Notification.countDocuments({
      type: "payment_failed"
    });

    return {
      totalRevenueAtRisk,
      recoveriesAttempted,
      successfulRecoveries,
      recoveredAmount,
      recoveryRate,
      messagesSent,
      ignoredUsers,
      unresolvedCases
    };
  } catch (err) {
    console.error("getRecoveryMetrics error:", err);
    return null;
  }
};

export const getRevenueInfo = async (startDate = null, endDate = null) => {
  try {
    const query = { status: "SUCCESS" };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const successTxns = await PaymentTransaction.find(query);
    const totalRevenue = successTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalSalesCount = successTxns.length;

    const allTxnsCount = await PaymentTransaction.countDocuments();
    const failedCount = await PaymentTransaction.countDocuments({ status: "FAILED" });
    const successRate = allTxnsCount > 0
      ? parseFloat(((totalSalesCount / allTxnsCount) * 100).toFixed(1))
      : 0;

    return {
      totalRevenue,
      totalSalesCount,
      failedCount,
      successRate
    };
  } catch (err) {
    console.error("getRevenueInfo error:", err);
    return null;
  }
};

export const getPaymentTrends = async (days = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const trends = await PaymentTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: cutoffDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } },
            status: "$status"
          },
          count: { $sum: 1 },
          amount: { $sum: "$amount" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          successCount: {
            $sum: { $cond: [{ $eq: ["$_id.status", "SUCCESS"] }, "$count", 0] }
          },
          successAmount: {
            $sum: { $cond: [{ $eq: ["$_id.status", "SUCCESS"] }, "$amount", 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$_id.status", "FAILED"] }, "$count", 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$_id.status", "PENDING"] }, "$count", 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return trends;
  } catch (err) {
    console.error("getPaymentTrends error:", err);
    return [];
  }
};

export const getCustomerBehavior = async () => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const paidUsers = await User.countDocuments({ role: "user", hasPaid: true });
    const conversionRate = totalUsers > 0
      ? parseFloat(((paidUsers / totalUsers) * 100).toFixed(1))
      : 0;

    // Users with multiple transaction attempts
    const multiAttemptUsers = await PaymentTransaction.aggregate([
      {
        $group: {
          _id: "$userId",
          attempts: { $sum: 1 }
        }
      },
      {
        $match: {
          attempts: { $gt: 1 }
        }
      },
      {
        $count: "count"
      }
    ]);

    return {
      totalUsers,
      paidUsers,
      conversionRate,
      multiAttemptUsersCount: multiAttemptUsers?.[0]?.count || 0
    };
  } catch (err) {
    console.error("getCustomerBehavior error:", err);
    return null;
  }
};

export const getPopularProducts = async () => {
  try {
    const popular = await PaymentTransaction.aggregate([
      {
        $match: { status: "SUCCESS" }
      },
      {
        $group: {
          _id: "$mockId",
          salesCount: { $sum: 1 },
          revenue: { $sum: "$amount" }
        }
      },
      {
        $sort: { salesCount: -1 }
      }
    ]);
    return popular;
  } catch (err) {
    console.error("getPopularProducts error:", err);
    return [];
  }
};

export const getPendingCheckouts = async () => {
  try {
    const pending = await PaymentTransaction.find({ status: "PENDING" })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
    return pending.map(p => p.toObject());
  } catch (err) {
    console.error("getPendingCheckouts error:", err);
    return [];
  }
};

export const getPeakTimes = async () => {
  try {
    const peak = await PaymentTransaction.aggregate([
      {
        $match: { status: "SUCCESS" }
      },
      {
        $project: {
          hour: { $hour: { date: "$createdAt", timezone: "+05:30" } }
        }
      },
      {
        $group: {
          _id: "$hour",
          salesCount: { $sum: 1 }
        }
      },
      {
        $sort: { salesCount: -1 }
      }
    ]);
    return peak;
  } catch (err) {
    console.error("getPeakTimes error:", err);
    return [];
  }
};

export const getUnusualChanges = async () => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    // Today's failure stats
    const todayTxns = await PaymentTransaction.countDocuments({ createdAt: { $gte: dayAgo } });
    const todayFailed = await PaymentTransaction.countDocuments({ createdAt: { $gte: dayAgo }, status: "FAILED" });
    const todayFailureRate = todayTxns > 0 ? (todayFailed / todayTxns) * 100 : 0;

    // Past 7 days average failure rate (prior to the last 24h)
    const prevTxns = await PaymentTransaction.countDocuments({ createdAt: { $gte: eightDaysAgo, $lt: dayAgo } });
    const prevFailed = await PaymentTransaction.countDocuments({ createdAt: { $gte: eightDaysAgo, $lt: dayAgo }, status: "FAILED" });
    const prevFailureRate = prevTxns > 0 ? (prevFailed / prevTxns) * 100 : 0;

    const diff = todayFailureRate - prevFailureRate;

    return {
      todayFailureRate: parseFloat(todayFailureRate.toFixed(1)),
      previousFailureRate: parseFloat(prevFailureRate.toFixed(1)),
      changePercentage: parseFloat(diff.toFixed(1)),
      isAnomaly: diff > 15 // Spiked by more than 15%
    };
  } catch (err) {
    console.error("getUnusualChanges error:", err);
    return null;
  }
};

export const getUserDropOffAnalysis = async () => {
  try {
    const successTxns = await PaymentTransaction.find({ status: "SUCCESS" }).sort({ createdAt: 1 });
    const users = await User.find({ role: "user" });

    const totalUsersCount = users.length;
    const purchaseCountMap = {}; // userId -> count of success purchases
    const firstPurchaseMap = {}; // userId -> date
    const lastPurchaseMap = {};  // userId -> date

    for (const txn of successTxns) {
      if (!txn.userId) continue;
      const uid = txn.userId.toString();
      purchaseCountMap[uid] = (purchaseCountMap[uid] || 0) + 1;
      if (!firstPurchaseMap[uid]) {
        firstPurchaseMap[uid] = txn.createdAt;
      }
      lastPurchaseMap[uid] = txn.createdAt;
    }

    // 1. Purchase frequency distribution
    let zeroPurchases = 0;
    let onePurchase = 0;
    let twoPurchases = 0;
    let threePlusPurchases = 0;

    for (const user of users) {
      const count = purchaseCountMap[user._id.toString()] || 0;
      if (count === 0) zeroPurchases++;
      else if (count === 1) onePurchase++;
      else if (count === 2) twoPurchases++;
      else threePlusPurchases++;
    }

    // 2. Average intervals between purchases for repeat buyers
    let totalDaysBetween = 0;
    let repeatBuyersCount = 0;
    for (const uid in lastPurchaseMap) {
      const count = purchaseCountMap[uid];
      if (count > 1) {
        const diffTime = Math.abs(new Date(lastPurchaseMap[uid]) - new Date(firstPurchaseMap[uid]));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDaysBetween += diffDays;
        repeatBuyersCount++;
      }
    }
    const avgLifetimeDays = repeatBuyersCount > 0 ? parseFloat((totalDaysBetween / repeatBuyersCount).toFixed(1)) : 0;

    // 3. User dormancy segmentation based on last purchase date
    let active30d = 0; // last purchase within 30 days
    let slipping60d = 0; // last purchase between 30 and 60 days
    let dormant = 0; // last purchase > 60 days

    const now = new Date();
    for (const uid in lastPurchaseMap) {
      const lastDate = new Date(lastPurchaseMap[uid]);
      const diffTime = Math.abs(now - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        active30d++;
      } else if (diffDays <= 60) {
        slipping60d++;
      } else {
        dormant++;
      }
    }

    return {
      totalUsersCount,
      purchaseDistribution: {
        zero: zeroPurchases,
        one: onePurchase,
        two: twoPurchases,
        threePlus: threePlusPurchases
      },
      avgLifetimeDays,
      repeatBuyersCount,
      dormancySegmentation: {
        active30d,
        slipping60d,
        dormant
      }
    };
  } catch (err) {
    console.error("getUserDropOffAnalysis error:", err);
    return null;
  }
};
