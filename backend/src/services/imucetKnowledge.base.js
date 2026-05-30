export const IMUCET_STATIC_CHUNKS = [
  {
    id: "imucet-overview",
    label: "IMUCET overview",
    type: "knowledge",
    subject: null,
    text:
      "IMUCET preparation should balance Mathematics, Physics, Chemistry, English, Aptitude, and General Knowledge. A strong plan usually combines concept revision, timed practice, previous mock analysis, and repeated weak-area correction.",
  },
  {
    id: "imucet-how-to-prepare",
    label: "IMUCET preparation strategy",
    type: "knowledge",
    subject: null,
    text:
      "For IMUCET preparation, start with syllabus mapping, split subjects into strong and weak areas, study concepts first, then solve sectional questions, and finally take full mocks under time pressure. Accuracy should improve before speed. Weekly review should identify repeated mistakes and the lowest-scoring subject.",
  },
  {
    id: "imucet-maths",
    label: "IMUCET mathematics preparation",
    type: "knowledge",
    subject: "math",
    text:
      "Mathematics preparation should focus on formula recall, algebra, arithmetic speed, and repeated problem solving. Students should maintain a formula sheet and practice mixed sets in timed conditions.",
  },
  {
    id: "imucet-physics",
    label: "IMUCET physics preparation",
    type: "knowledge",
    subject: "phy",
    text:
      "Physics preparation should focus on concept clarity, unit handling, formula application, and avoiding calculation mistakes. Revision should include theory plus short numerical practice blocks.",
  },
  {
    id: "imucet-chemistry",
    label: "IMUCET chemistry preparation",
    type: "knowledge",
    subject: "chem",
    text:
      "Chemistry preparation should include quick revision notes, reactions and facts memorization, and frequent short quizzes. Weak retention topics should be revised repeatedly.",
  },
  {
    id: "imucet-english-gk-aptitude",
    label: "IMUCET English GK aptitude preparation",
    type: "knowledge",
    subject: null,
    text:
      "English improves through comprehension, vocabulary revision, and grammar drills. General Knowledge needs current affairs and static fact revision. Aptitude improves through pattern recognition, reasoning drills, and timed practice.",
  },
  {
    id: "imucet-last-30-days",
    label: "IMUCET final month plan",
    type: "knowledge",
    subject: null,
    text:
      "In the last 30 days before IMUCET, reduce random topic switching, focus on revision and mocks, maintain an error log, and revise the weakest subject daily. Do not spend most of the time on passive reading alone.",
  },
];

// TODO: Replace or extend these static chunks with PDF-derived chunks.
// Suggested future flow:
// 1. extract text from the uploaded PDF
// 2. split into chunks
// 3. store embeddings in Pinecone
// 4. fetch top matches here during retrieval
