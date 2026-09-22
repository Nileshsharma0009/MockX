import Result from "../models/result.model.js";

/* ----------------------------------
   GET ALL RESULTS (ResultStat)
----------------------------------- */
export const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(results);
  } catch (err) {
    console.error("getMyResults error:", err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
};





export const getResultByMock = async (req, res) => {
  try {
    const { mockId } = req.params;

    const result = await Result.findOne({
      userId: req.user._id,
      mockId,
    }).populate(
      "userId",
      "name email phone age state exam imucetOption"
    );

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(result);
  } catch (err) {
    console.error("getResultByMock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.resultId)
      .populate("userId", "name email phone state age exam imucetOption role instituteId");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // 🔒 If this is an institute-owned result, check access permissions
    if (result.instituteId) {
      const user = req.user;
      const isSuperAdmin = user?.role === "SUPER_ADMIN" || (user?.role === "admin" && user?.email === "admin@mockx.com");
      const isOwnerStudent = user && user._id.toString() === result.userId?._id?.toString();
      const isInstAdmin = user && user.instituteId && user.instituteId.toString() === result.instituteId.toString();

      if (!isSuperAdmin && !isOwnerStudent && !isInstAdmin) {
        return res.status(403).json({ message: "Access denied to this institute test result." });
      }
    }

    res.json(result);
  } catch (err) {
    console.error("getResultById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



