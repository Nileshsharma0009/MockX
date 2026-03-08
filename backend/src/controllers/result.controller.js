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

    if (!result) {z
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(result);
  } catch (err) {
    console.error("getResultByMock error:", err);
    res.status(500).json({ message: "Server error" });
  }
};







export const getResultById = async (req, res) => {
  const result = await Result.findById(req.params.resultId)
    .populate("userId", "name email phone state age exam imucetOption");

  if (!result) {
    return res.status(404).json({ message: "Result not found" });
  }

  res.json(result);
};



