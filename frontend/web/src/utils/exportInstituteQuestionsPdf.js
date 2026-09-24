import { jsPDF } from "jspdf";

const safeFilename = (value) => String(value || "questions")
  .trim()
  .replace(/[^a-z0-9_-]+/gi, "_")
  .replace(/^_+|_+$/g, "")
  .toLowerCase() || "questions";

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PX_PER_MM = 96 / 25.4;
const RENDER_SCALE = 2;
const LEFT = 15 * PX_PER_MM;
const RIGHT = 15 * PX_PER_MM;
const TOP = 14 * PX_PER_MM;
const BOTTOM = 14 * PX_PER_MM;

function wrapText(context, value, maxWidth) {
  const paragraphs = String(value ?? "").split(/\r\n|\r|\n/);
  const lines = [];

  paragraphs.forEach((paragraph) => {
    let line = "";
    const tokens = paragraph.match(/\s+|[^\s]+/gu) || [""];
    for (const token of tokens) {
      if (/^\s+$/u.test(token)) {
        if (!line) continue;
        if (context.measureText(line + token).width <= maxWidth) line += token;
        else {
          lines.push(line.trimEnd());
          line = "";
        }
        continue;
      }

      if (context.measureText(line + token).width <= maxWidth) {
        line += token;
        continue;
      }

      if (line) {
        lines.push(line.trimEnd());
        line = "";
      }

      for (const character of Array.from(token)) {
        if (line && context.measureText(line + character).width > maxWidth) {
          lines.push(line);
          line = character;
        } else {
          line += character;
        }
      }
    }
    lines.push(line.trimEnd());
  });

  return lines.length ? lines : [""];
}

function drawLines(context, lines, x, y, lineHeight) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return lines.length * lineHeight;
}

function loadImage(url) {
  if (!/^https?:\/\//i.test(url || "")) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export async function exportInstituteQuestionsToA4Pdf({
  instituteName,
  title,
  questions = [],
  sections = [],
  includeCorrectAnswers = false,
}) {
  const pageWidth = PAGE_WIDTH_MM * PX_PER_MM;
  const pageHeight = PAGE_HEIGHT_MM * PX_PER_MM;
  const contentWidth = pageWidth - LEFT - RIGHT;
  const bottomLimit = pageHeight - BOTTOM;
  const sectionNames = new Map(sections.map((section) => [String(section.id), section.name]));
  const groupedQuestions = new Map();

  questions.forEach((question) => {
    const sectionId = String(question.section || "general");
    if (!groupedQuestions.has(sectionId)) groupedQuestions.set(sectionId, []);
    groupedQuestions.get(sectionId).push(question);
  });

  const configuredOrder = sections.map((section) => String(section.id));
  const sectionIds = [
    ...configuredOrder.filter((sectionId) => groupedQuestions.has(sectionId)),
    ...[...groupedQuestions.keys()].filter((sectionId) => !configuredOrder.includes(sectionId)),
  ];

  const pages = [];
  let page;
  let context;
  let cursorY;

  const createPage = () => {
    page = document.createElement("canvas");
    page.width = Math.round(pageWidth * RENDER_SCALE);
    page.height = Math.round(pageHeight * RENDER_SCALE);
    context = page.getContext("2d");
    context.scale(RENDER_SCALE, RENDER_SCALE);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageWidth, pageHeight);
    pages.push(page);
    cursorY = TOP;
  };

  const drawSectionHeading = (name) => {
    const boxHeight = 10 * PX_PER_MM;
    context.fillStyle = "#eef2ff";
    context.fillRect(LEFT, cursorY, contentWidth, boxHeight);
    context.fillStyle = "#4f46e5";
    context.fillRect(LEFT, cursorY, 1.2 * PX_PER_MM, boxHeight);
    context.font = "700 18px Arial, 'Segoe UI', sans-serif";
    context.fillStyle = "#312e81";
    context.fillText(name, LEFT + 12, cursorY + 27);
    cursorY += boxHeight + 14;
  };

  createPage();
  context.textAlign = "center";
  context.font = "700 16px Arial, 'Segoe UI', sans-serif";
  context.fillStyle = "#4f46e5";
  context.fillText(String(instituteName || "MockX"), pageWidth / 2, cursorY + 4);
  cursorY += 13;

  context.font = "700 27px Arial, 'Segoe UI', sans-serif";
  context.fillStyle = "#111827";
  const titleLines = wrapText(context, title || "Question Paper", contentWidth);
  cursorY += drawLines(context, titleLines, pageWidth / 2, cursorY + 14, 34) + 5;
  context.font = "14px Arial, 'Segoe UI', sans-serif";
  context.fillStyle = "#64748b";
  context.fillText(`${questions.length} questions  |  ${new Date().toLocaleDateString()}`, pageWidth / 2, cursorY + 1);
  cursorY += 17;
  context.fillStyle = "#4f46e5";
  context.fillRect(LEFT, cursorY, contentWidth, 2);
  cursorY += 20;
  context.textAlign = "left";

  if (!sectionIds.length) {
    context.font = "16px Arial, 'Segoe UI', sans-serif";
    context.fillStyle = "#64748b";
    context.fillText("No questions are available in this source.", LEFT, cursorY + 16);
  }

  for (let sectionIndex = 0; sectionIndex < sectionIds.length; sectionIndex += 1) {
    const sectionId = sectionIds[sectionIndex];
    if (sectionIndex > 0) createPage();
    const sectionQuestions = groupedQuestions.get(sectionId);
    const sectionName = String(sectionNames.get(sectionId) || sectionQuestions[0]?.subject || sectionId);
    drawSectionHeading(sectionName);

    for (let questionIndex = 0; questionIndex < sectionQuestions.length; questionIndex += 1) {
      const question = sectionQuestions[questionIndex];
      const prompt = String(question.question ?? "Question text unavailable");
      context.font = "16px Arial, 'Segoe UI', sans-serif";
      const promptLines = wrapText(context, prompt, contentWidth - 86);
      context.font = "14px Arial, 'Segoe UI', sans-serif";
      const paragraphLines = question.paragraph
        ? wrapText(context, question.paragraph, contentWidth - 25)
        : [];
      const options = (question.options || []).map((option, optionIndex) => {
        const label = `${String.fromCharCode(65 + optionIndex)}. `;
        return {
          label,
          lines: wrapText(context, `${label}${String(option ?? "")}`, contentWidth - 28),
          isCorrect: Number(question.correctOption) === optionIndex,
        };
      });
      const image = await loadImage(question.imageUrl);
      const imageHeight = image ? Math.min(260, (contentWidth - 28) * image.height / image.width) + 10 : 0;
      const estimatedHeight = Math.max(22, promptLines.length * 22)
        + paragraphLines.length * 19
        + options.reduce((height, option) => height + option.lines.length * 20 + 2, 0)
        + (includeCorrectAnswers ? 23 : 0)
        + imageHeight + 48;

      if (cursorY + estimatedHeight > bottomLimit && cursorY > TOP + 20) {
        createPage();
        drawSectionHeading(sectionName);
      }

      context.font = "12px Arial, 'Segoe UI', sans-serif";
      context.fillStyle = "#64748b";
      context.fillText(`Subject: ${String(question.subject || "General")}`, LEFT + 36, cursorY + 11);
      cursorY += 17;
      context.font = "700 16px Arial, 'Segoe UI', sans-serif";
      context.fillStyle = "#4338ca";
      context.fillText(`Q${questionIndex + 1}.`, LEFT, cursorY + 16);
      context.font = "16px Arial, 'Segoe UI', sans-serif";
      context.fillStyle = "#172033";
      cursorY += drawLines(context, promptLines, LEFT + 36, cursorY + 16, 22);
      context.textAlign = "right";
      context.font = "13px Arial, 'Segoe UI', sans-serif";
      context.fillStyle = "#64748b";
      context.fillText(`${String(question.marks ?? 1)} marks`, pageWidth - RIGHT, cursorY - (promptLines.length - 1) * 22 - 3);
      context.textAlign = "left";
      cursorY += 6;

      if (paragraphLines.length) {
        context.font = "italic 14px Arial, 'Segoe UI', sans-serif";
        context.fillStyle = "#475569";
        context.fillRect(LEFT + 8, cursorY - 2, 2, paragraphLines.length * 19 + 6);
        cursorY += drawLines(context, paragraphLines, LEFT + 18, cursorY + 12, 19) + 8;
      }

      if (image) {
        const maxWidth = contentWidth - 28;
        const drawWidth = Math.min(maxWidth, image.width);
        const drawHeight = Math.min(260, drawWidth * image.height / image.width);
        context.drawImage(image, LEFT + 18, cursorY, drawWidth, drawHeight);
        cursorY += drawHeight + 10;
      }

      for (const option of options) {
        const showCorrect = includeCorrectAnswers && option.isCorrect;
        context.font = `${showCorrect ? "700 " : ""}14px Arial, 'Segoe UI', sans-serif`;
        context.fillStyle = showCorrect ? "#047857" : "#334155";
        cursorY += drawLines(context, option.lines, LEFT + 18, cursorY + 13, 20) + 2;
      }

      if (includeCorrectAnswers) {
        const correctIndex = Number(question.correctOption);
        const correctAnswer = Number.isInteger(correctIndex)
          ? String.fromCharCode(65 + correctIndex)
          : "-";
        context.font = "700 13px Arial, 'Segoe UI', sans-serif";
        context.fillStyle = "#047857";
        context.fillText(`Correct answer: ${correctAnswer}`, LEFT + 18, cursorY + 13);
        cursorY += 18;
      }

      cursorY += 7;
      context.fillStyle = "#e2e8f0";
      context.fillRect(LEFT, cursorY, contentWidth, 1);
      cursorY += 12;
    }
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  pages.forEach((canvas, pageIndex) => {
    if (pageIndex > 0) pdf.addPage("a4", "portrait");
    const context = canvas.getContext("2d");
    context.save();
    context.scale(RENDER_SCALE, RENDER_SCALE);
    context.textAlign = "right";
    context.font = "13px Arial, 'Segoe UI', sans-serif";
    context.fillStyle = "#64748b";
    context.fillText(`${pageIndex + 1} / ${pages.length}`, pageWidth - RIGHT, pageHeight - 7 * PX_PER_MM);
    context.restore();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
    canvas.width = 1;
    canvas.height = 1;
  });

  pdf.save(`${safeFilename(title)}.pdf`);
}
