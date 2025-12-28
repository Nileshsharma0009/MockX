export const getLeaderboard = async (req, res) => {
  const { mockId } = req.params;

  const results = await Result.find({
    mockId,
    isBest: true,
  })
    .populate("userId", "name")
    .sort({ score: -1, createdAt: 1 })
    .limit(100);

  res.json(results);
};
