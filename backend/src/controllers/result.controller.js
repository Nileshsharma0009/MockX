import Result from "../models/result.model.js";

export const getBestResult = async (req, res) => {
  const { mockId } = req.params;

  const result = await Result.findOne({
    userId: req.user._id,
    mockId,
    isBest: true,
  });

  if (!result) {
    return res.status(404).json({ message: "No result found" });
  }

  res.json(result);
};
