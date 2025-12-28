export function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  

export function shuffleWithGroups(questions) {
  const groups = {};
  const noGroup = [];

  // Split grouped vs non-grouped questions
  questions.forEach((q) => {
    if (q.groupId) {
      if (!groups[q.groupId]) groups[q.groupId] = [];
      groups[q.groupId].push(q);
    } else {
      noGroup.push(q);
    }
  });

  // Make blocks: each group is a block, each single q is its own block
  const blocks = [
    ...Object.values(groups),        // arrays of grouped questions
    ...noGroup.map((q) => [q])       // wrap single questions
  ];

  // Fisher-Yates shuffle over blocks
  for (let i = blocks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
  }

  // Flatten back into a single array
  return blocks.flat();
}