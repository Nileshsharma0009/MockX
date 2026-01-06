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



// export const getResultByMockId = async (req, res) => {
//   try {
//     const { mockId } = req.params;

//     const result = await Result.findOne({
//       userId: req.user._id,
//       mockId,
//     }).populate("userId", "name email");

//     if (!result) {
//       return res.status(404).json({ message: "Result not found" });
//     }

//     res.json(result);
//   } catch (err) {
//     console.error("GET RESULT ERROR:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

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



/* ----------------------------------
   GET BEST RESULT OF A MOCK
----------------------------------- */
// export const getBestResult = async (req, res) => {
//   try {
//     const { mockId } = req.params;

//     const result = await Result.findOne({
//       userId: req.user._id,
//       mockId,
//       isBest: true, // optional if single attempt
//     });

//     if (!result) {
//       return res.status(404).json({ message: "No result found" });
//     }

//     res.json(result);
//   } catch (err) {
//     console.error("getBestResult error:", err);
//     res.status(500).json({ message: "Failed to fetch best result" });
//   }
// };



// export const getResultByAttempt = async (req, res) => {
//   const { attemptId } = req.params;

//   const attempt = await Result.findById(attemptId)
//     .populate("userId", "name email phone age state exam imucetOption");

//   if (!attempt) {
//     return res.status(404).json({ message: "Result not found" });
//   }

//   res.json({
//     mockId: attempt.mockId,
//     score: attempt.score,
//     user: attempt.userId, // populated user
//     createdAt: attempt.createdAt,
//   });
// }; 

export const getResultById = async (req, res) => {
  const result = await Result.findById(req.params.resultId)
    .populate("userId", "name email phone state age exam imucetOption");

  if (!result) {
    return res.status(404).json({ message: "Result not found" });
  }

  res.json(result);
};


// export const getResultByAttempt = async (req, res) => {
//   try {
//     const { attemptId } = req.params;

//     const attempt = await TestAttempt.findById(attemptId)
//       .populate("user", "name email");

//     if (!attempt) {
//       return res.status(404).json({ message: "Result not found" });
//     }

//     return res.status(200).json(attempt);
//   } catch (error) {
//     console.error("getResult error:", error);
//     res.status(500).json({ message: "Failed to load result" });
//   }
// };
