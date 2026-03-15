const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, '../../../frontend/web/public/imu4.json');
const rawQuestions = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const questions = Object.values(rawQuestions) // A, B
  .flatMap((section) =>
    Object.values(section) // english, gk, aptitude...
      .flat()
  );

console.log("Total questions extracted:", questions.length);

let missingCount = 0;
questions.forEach((q, index) => {
  if (!q || !q.id) {
    missingCount++;
    console.log(`Missing ID at flattened index ${index}:`, q);
  }
});

console.log("Total missing IDs:", missingCount);
