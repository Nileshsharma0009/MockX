

import { jsPDF } from "jspdf";

// ============================================================
// PDF CONFIG
// ============================================================

const PAGE_MARGIN = 5;
const TOP_MARGIN = 5;
const FOOTER_MARGIN = 8;

const IDENTITY_COLUMN_WIDTHS = [24, 32, 50];

const MOCK_COLUMN_MIN_WIDTH = 36;
const MOCK_COLUMN_MAX_WIDTH = 60;

const COLORS = {
  ink: [15, 23, 42],
  muted: [71, 85, 105],
  border: [203, 213, 225],
  header: [30, 41, 59],
  accent: [79, 70, 229],
  light: [248, 250, 252],
  white: [255, 255, 255],
};

// ============================================================
// HELPERS
// ============================================================

function safeFilename(value) {
  return String(value || "report")
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase() || "report";
}

function splitLines(pdf, value, width, maxLines = 2) {
  const lines = pdf.splitTextToSize(
    String(value ?? "-"),
    Math.max(8, width)
  );

  if (lines.length <= maxLines) {
    return lines;
  }

  const shortened = lines.slice(0, maxLines);

  const last = shortened[maxLines - 1];

  shortened[maxLines - 1] =
    last.length > 3
      ? `${last.slice(0, -3)}...`
      : "...";

  return shortened;
}

function displayDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN");
}

function resultLines(result) {
  if (!result) {
    return ["Not attempted"];
  }

  const score = Number(result.score) || 0;
  const total = Number(result.total) || 0;

  const percentage =
    total > 0
      ? Math.round((score / total) * 100)
      : 0;

  const date = displayDate(result.createdAt);

  return [
    `${score} / ${total}`,
    `${percentage}%${date ? `  |  ${date}` : ""}`,
  ];
}

// ============================================================
// TEXT
// ============================================================

function drawText(
  pdf,
  lines,
  x,
  y,
  width,
  {
    fontSize = 7,
    color = COLORS.ink,
    bold = false,
    align = "left",
  } = {}
) {
  pdf.setFont(
    "helvetica",
    bold ? "bold" : "normal"
  );

  pdf.setFontSize(fontSize);
  pdf.setTextColor(...color);

  const lineHeight = fontSize * 0.42;

  lines.forEach((line, index) => {
    const textX =
      align === "center"
        ? x + width / 2
        : x + 2.5;

    pdf.text(
      String(line),
      textX,
      y + 4 + index * lineHeight,
      {
        align,
      }
    );
  });
}

// ============================================================
// PAGE HEADER
// ============================================================

function drawPageHeader(
  pdf,
  {
    instituteName,
    batchLabel,
    mockLabel,
    groupStart,
    groupEnd,
    mockCount,
  }
) {
  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const contentWidth =
    pageWidth - PAGE_MARGIN * 2;

  // ----------------------------------------------------------
  // Institute Name
  // ----------------------------------------------------------

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(15);
  pdf.setTextColor(...COLORS.ink);

  pdf.text(
    String(instituteName || "Institute"),
    PAGE_MARGIN,
    TOP_MARGIN + 5
  );

  // ----------------------------------------------------------
  // Batch + Mock
  // ----------------------------------------------------------

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.muted);

  pdf.text(
    `Batch: ${batchLabel || "-"}   |   Mock test: ${
      mockLabel || "-"
    }`,
    PAGE_MARGIN,
    TOP_MARGIN + 12
  );

  // ----------------------------------------------------------
  // Generated Date
  // ----------------------------------------------------------

  pdf.text(
    `Generated ${new Date().toLocaleDateString("en-IN")}`,
    pageWidth - PAGE_MARGIN,
    TOP_MARGIN + 12,
    {
      align: "right",
    }
  );

  // ----------------------------------------------------------
  // Mock Pagination
  // ----------------------------------------------------------

  if (mockCount > 0) {
    pdf.setFontSize(7);
    pdf.setTextColor(...COLORS.muted);

    pdf.text(
      `Mock tests ${groupStart + 1}-${groupEnd} of ${mockCount}`,
      pageWidth - PAGE_MARGIN,
      TOP_MARGIN + 20,
      {
        align: "right",
      }
    );
  }

  return TOP_MARGIN + 25;
}

// ============================================================
// TABLE HEADER
// ============================================================

function drawTableHeader(
  pdf,
  {
    x,
    y,
    widths,
    mocks,
  }
) {
  const headers = [
    "Batch",
    "Roll number",
    "Student",
  ];

  let cursorX = x;

  const height = 13;

  widths.forEach((width, index) => {
    // Header background
    pdf.setFillColor(...COLORS.accent);

    pdf.setDrawColor(...COLORS.white);

    pdf.rect(
      cursorX,
      y,
      width,
      height,
      "FD"
    );

    // Identity columns
    if (index < headers.length) {
      drawText(
        pdf,
        [headers[index]],
        cursorX,
        y + 2,
        width,
        {
          fontSize: 7,
          color: COLORS.white,
          bold: true,
        }
      );
    }

    // Mock columns
    else {
      const mock =
        mocks[index - headers.length];

      const titleLines = splitLines(
        pdf,
        mock.title || "Mock test",
        width - 5,
        2
      );

      drawText(
        pdf,
        titleLines,
        cursorX,
        y + 0.5,
        width,
        {
          fontSize: 6.5,
          color: COLORS.white,
          bold: true,
          align: "center",
        }
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(6);

      pdf.setTextColor(
        ...COLORS.white
      );

      pdf.text(
        `${mock.totalMarks ?? "-"} marks`,
        cursorX + width / 2,
        y + 11,
        {
          align: "center",
        }
      );
    }

    cursorX += width;
  });

  return y + height;
}

// ============================================================
// STUDENT ROW
// ============================================================

function drawStudentRow(
  pdf,
  {
    student,
    rowIndex,
    x,
    y,
    widths,
    mocks,
    resultsByStudentMock,
  }
) {
  // ----------------------------------------------------------
  // Student Information
  // ----------------------------------------------------------

  const baseCells = [
    splitLines(
      pdf,
      student.batch || "Unassigned",
      widths[0] - 5,
      2
    ),

    splitLines(
      pdf,
      student.rollNo || "-",
      widths[1] - 5,
      2
    ),

    [
      ...splitLines(
        pdf,
        student.name || "Unnamed student",
        widths[2] - 5,
        1
      ),

      ...splitLines(
        pdf,
        student.email || "",
        widths[2] - 5,
        1
      ).filter(Boolean),
    ],
  ];

  // ----------------------------------------------------------
  // Mock Results
  // ----------------------------------------------------------

  const resultCells = mocks.map(
    (mock) =>
      resultLines(
        resultsByStudentMock.get(
          `${student._id}:${mock._id}`
        )
      )
  );

  const cells = [
    ...baseCells,
    ...resultCells,
  ];

  // ----------------------------------------------------------
  // Row Height
  // ----------------------------------------------------------

  const rowHeight = Math.max(
    10,
    ...cells.map(
      (lines) =>
        4 + lines.length * 3.5
    )
  );

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  const bottomLimit =
    pageHeight -
    PAGE_MARGIN -
    FOOTER_MARGIN;

  if (
    y + rowHeight >
    bottomLimit
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // Draw Cells
  // ----------------------------------------------------------

  let cursorX = x;

  cells.forEach(
    (lines, index) => {
      const width = widths[index];

      // Alternating row color
      pdf.setFillColor(
        ...(rowIndex % 2 === 0
          ? COLORS.white
          : COLORS.light)
      );

      pdf.setDrawColor(
        ...COLORS.border
      );

      pdf.rect(
        cursorX,
        y,
        width,
        rowHeight,
        "FD"
      );

      // ------------------------------------------------------
      // Result Styling
      // ------------------------------------------------------

      const isResultColumn =
        index >= 3;

      const notAttempted =
        isResultColumn &&
        lines[0] ===
          "Not attempted";

      drawText(
        pdf,
        lines,
        cursorX,
        y + 1,
        width,
        {
          fontSize:
            index === 2
              ? lines.length > 1
                ? 6.5
                : 7.5
              : 6.8,

          color: notAttempted
            ? COLORS.muted
            : COLORS.ink,

          bold:
            isResultColumn &&
            !notAttempted,

          align:
            isResultColumn
              ? "center"
              : "left",
        }
      );

      cursorX += width;
    }
  );

  return y + rowHeight;
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

export function exportInstituteResultsPdf({
  instituteName,
  batchLabel,
  mockLabel,
  students = [],
  mocks = [],
  resultsByStudentMock,
  submittedCount = 0,
}) {
  // ==========================================================
  // A4 LANDSCAPE
  // ==========================================================

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const contentWidth =
    pageWidth - PAGE_MARGIN * 2;

  // ==========================================================
  // COLUMN WIDTH CALCULATION
  // ==========================================================

  const identityWidth =
    IDENTITY_COLUMN_WIDTHS.reduce(
      (sum, width) =>
        sum + width,
      0
    );

  const availableMockWidth =
    contentWidth -
    identityWidth;

  const mocksPerPage =
    Math.max(
      1,
      Math.floor(
        availableMockWidth /
          MOCK_COLUMN_MIN_WIDTH
      )
    );

  // ==========================================================
  // SPLIT MOCKS INTO GROUPS
  // ==========================================================

  const mockGroups = mocks.length
    ? Array.from(
        {
          length: Math.ceil(
            mocks.length /
              mocksPerPage
          ),
        },
        (_, index) =>
          mocks.slice(
            index *
              mocksPerPage,
            (index + 1) *
              mocksPerPage
          )
      )
    : [[]];

  let hasPage = false;

  // ==========================================================
  // CREATE PAGES
  // ==========================================================

  mockGroups.forEach(
    (mockGroup, groupIndex) => {
      const groupStart =
        groupIndex *
        mocksPerPage;

      const groupEnd =
        groupStart +
        mockGroup.length;

      // ------------------------------------------------------
      // Mock column width
      // ------------------------------------------------------

      const mockColumnWidth =
        mockGroup.length
          ? Math.min(
              MOCK_COLUMN_MAX_WIDTH,
              availableMockWidth /
                mockGroup.length
            )
          : 0;

      // ------------------------------------------------------
      // All column widths
      // ------------------------------------------------------

      const widths = [
        ...IDENTITY_COLUMN_WIDTHS,
        ...mockGroup.map(
          () => mockColumnWidth
        ),
      ];

      // ------------------------------------------------------
      // Table width
      // ------------------------------------------------------

      const tableWidth =
        widths.reduce(
          (sum, width) =>
            sum + width,
          0
        );

      // Center table
      const tableX =
        PAGE_MARGIN +
        (contentWidth -
          tableWidth) /
          2;

      // ======================================================
      // START PAGE
      // ======================================================

      const startPage = () => {
        if (hasPage) {
          pdf.addPage(
            "a4",
            "landscape"
          );
        }

        hasPage = true;

        // Header
        const tableTop =
          drawPageHeader(
            pdf,
            {
              instituteName,
              batchLabel,
              mockLabel,
              groupStart,
              groupEnd,
              mockCount:
                mocks.length,
            }
          );

        // Table header
        return drawTableHeader(
          pdf,
          {
            x: tableX,
            y: tableTop,
            widths,
            mocks: mockGroup,
          }
        );
      };

      // ======================================================
      // STUDENT ROWS
      // ======================================================

      let y = startPage();

      for (
        let studentIndex = 0;
        studentIndex <
        students.length;
        studentIndex += 1
      ) {
        let nextY =
          drawStudentRow(
            pdf,
            {
              student:
                students[
                  studentIndex
                ],

              rowIndex:
                studentIndex,

              x: tableX,

              y,

              widths,

              mocks:
                mockGroup,

              resultsByStudentMock,
            }
          );

        // ----------------------------------------------------
        // Not enough room -> new page
        // ----------------------------------------------------

        if (
          nextY === null
        ) {
          y = startPage();

          nextY =
            drawStudentRow(
              pdf,
              {
                student:
                  students[
                    studentIndex
                  ],

                rowIndex:
                  studentIndex,

                x: tableX,

                y,

                widths,

                mocks:
                  mockGroup,

                resultsByStudentMock,
              }
            );
        }

        if (
          nextY !== null
        ) {
          y = nextY;
        }
      }
    }
  );

  // ==========================================================
  // FOOTER
  // ==========================================================

  const pageCount =
    pdf.getNumberOfPages();

  for (
    let pageNumber = 1;
    pageNumber <= pageCount;
    pageNumber += 1
  ) {
    pdf.setPage(
      pageNumber
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(7);

    pdf.setTextColor(
      ...COLORS.muted
    );

    const footerY =
      pdf.internal.pageSize.getHeight() -
      PAGE_MARGIN +
      2;

    // Left footer
    pdf.text(
      "MockX institute results  |  Sorted by roll number",
      PAGE_MARGIN,
      footerY
    );

    // Right footer
    pdf.text(
      `Page ${pageNumber} of ${pageCount}`,
      pageWidth -
        PAGE_MARGIN,
      footerY,
      {
        align: "right",
      }
    );
  }

  // ==========================================================
  // FILE NAME
  // ==========================================================

  const filename = [
    "mockx_results",
    safeFilename(
      instituteName
    ),
    safeFilename(
      batchLabel
    ),
    safeFilename(
      mockLabel
    ),
  ].join("_");

  // ==========================================================
  // DOWNLOAD
  // ==========================================================

  pdf.save(
    `${filename}.pdf`
  );
}