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

    // Enforce owner, same-institute admin, or platform-admin access for every result.
    const user = req.user;
    const owner = result.userId;
    const ownerId = owner?._id?.toString?.() || owner?.toString?.();
    const requesterId = user?._id?.toString?.();
    const isOwner = Boolean(requesterId && ownerId && requesterId === ownerId);
    const isPlatformAdmin = user?.role === "SUPER_ADMIN";

    const instituteId = user?.instituteId?.toString?.();
    const ownerInstituteId = owner?.instituteId?.toString?.();
    const resultInstituteId = result.instituteId?.toString?.();
    const isInstituteAdmin =
      user?.role === "INSTITUTE_ADMIN" &&
      instituteId &&
      ownerInstituteId === instituteId &&
      (!resultInstituteId || resultInstituteId === instituteId);

    if (!isOwner && !isInstituteAdmin && !isPlatformAdmin) {
      return res.status(403).json({ message: "Access denied to this test result." });
    }

    res.json(result);
  } catch (err) {
    console.error("getResultById error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



