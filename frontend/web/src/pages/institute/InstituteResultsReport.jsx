import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, RefreshCw, Search } from "lucide-react";
import { exportInstituteResultsPdf } from "../../utils/exportInstituteResultsPdf";

const emptyReport = { batches: [], students: [], mocks: [], results: [] };

function safeFilename(value) {
  return String(value || "report").trim().replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase();
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function resultCell(result) {
  if (!result) return "Not attempted";
  const score = Number(result.score) || 0;
  const total = Number(result.total) || 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const submitted = result.createdAt ? new Date(result.createdAt).toLocaleDateString() : "";
  return `${score}/${total} (${percentage}%)${submitted ? ` - ${submitted}` : ""}`;
}

function compareStudentsByRollNumber(first, second) {
  const firstRollNo = String(first.rollNo || "").trim();
  const secondRollNo = String(second.rollNo || "").trim();
  const missingRollNumbers = new Set(["", "-", "–", "—"]);
  const firstHasRollNo = !missingRollNumbers.has(firstRollNo);
  const secondHasRollNo = !missingRollNumbers.has(secondRollNo);

  if (firstHasRollNo !== secondHasRollNo) return firstHasRollNo ? -1 : 1;

  const rollOrder = firstRollNo.localeCompare(secondRollNo, "en", {
    numeric: true,
    sensitivity: "base",
  });
  return rollOrder || String(first.name || "").localeCompare(String(second.name || ""), "en", { sensitivity: "base" });
}

export default function InstituteResultsReport({ instituteName, report: reportData, loading, error, onRefresh }) {
  const report = reportData || emptyReport;
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [selectedMock, setSelectedMock] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const filteredMocks = useMemo(
    () => selectedMock === "ALL" ? report.mocks : report.mocks.filter((mock) => mock._id === selectedMock),
    [report.mocks, selectedMock]
  );
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return report.students.filter((student) => {
      const matchesBatch = selectedBatch === "ALL" || student.batch === selectedBatch;
      const matchesSearch = !query || [student.name, student.email, student.rollNo, student.batch]
        .some((value) => String(value || "").toLowerCase().includes(query));
      return matchesBatch && matchesSearch;
    }).sort(compareStudentsByRollNumber);
  }, [report.students, selectedBatch, search]);

  const resultsByStudentMock = useMemo(() => {
    const map = new Map();
    // The API sorts newest first; retain the latest result if legacy duplicates exist.
    for (const result of report.results) {
      const key = `${result.studentId}:${result.mockId}`;
      if (!map.has(key)) map.set(key, result);
    }
    return map;
  }, [report.results]);

  const submittedCount = useMemo(() => filteredStudents.reduce((count, student) => (
    count + filteredMocks.filter((mock) => resultsByStudentMock.has(`${student._id}:${mock._id}`)).length
  ), 0), [filteredStudents, filteredMocks, resultsByStudentMock]);

  const downloadCsv = () => {
    const header = ["Batch", "Roll No", "Student", "Email", ...filteredMocks.map((mock) => `${mock.title} - Score / Total`)];
    const rows = filteredStudents.map((student) => [
      student.batch,
      student.rollNo,
      student.name,
      student.email,
      ...filteredMocks.map((mock) => resultCell(resultsByStudentMock.get(`${student._id}:${mock._id}`))),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvValue).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mockx_results_${safeFilename(selectedBatch === "ALL" ? "all_batches" : selectedBatch)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    if (!filteredStudents.length || isExporting) return;
    setIsExporting(true);
    setPdfError("");
    try {
      const batchLabel = selectedBatch === "ALL" ? "All batches" : selectedBatch;
      const mockLabel = selectedMock === "ALL" ? "All mock tests" : filteredMocks[0]?.title || "Mock test";
      exportInstituteResultsPdf({
        instituteName: instituteName || report.institute?.name || "Institute",
        batchLabel,
        mockLabel,
        students: filteredStudents,
        mocks: filteredMocks,
        resultsByStudentMock,
        submittedCount,
      });
    } catch (exportError) {
      console.error("Institute results PDF export failed:", exportError);
      setPdfError("PDF export failed. Please try again or download the CSV report.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && !reportData) {
    return <div className="inst-card rounded-2xl p-8 text-center text-sm text-slate-600">Loading student results...</div>;
  }

  return (
    <section className="space-y-5 sm:space-y-6" aria-labelledby="institute-results-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Performance report</p>
          <h1 id="institute-results-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Student Results</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Compare submitted scores by batch and mock test. Students are ordered by roll number, with each score column representing a mock test.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh data
          </button>
          <button type="button" onClick={downloadCsv} disabled={!filteredStudents.length} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            <FileSpreadsheet className="h-4 w-4" /> Download CSV
          </button>
          <button type="button" onClick={downloadPdf} disabled={!filteredStudents.length || isExporting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" /> {isExporting ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {pdfError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{pdfError}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="inst-card rounded-2xl p-4 sm:p-5">
          <p className="text-sm font-medium text-slate-600">Students in view</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{filteredStudents.length}</p>
        </div>
        <div className="inst-card rounded-2xl p-4 sm:p-5">
          <p className="text-sm font-medium text-slate-600">Mock tests in view</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{filteredMocks.length}</p>
        </div>
        <div className="inst-card rounded-2xl p-4 sm:p-5">
          <p className="text-sm font-medium text-slate-600">Submitted results</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{submittedCount}</p>
        </div>
      </div>

      <div className="inst-card rounded-2xl p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
          <label className="block text-sm font-semibold text-slate-700">
            Batch
            <select value={selectedBatch} onChange={(event) => setSelectedBatch(event.target.value)} className="inst-input mt-1.5 min-h-11 w-full rounded-xl px-3 text-sm font-normal">
              <option value="ALL">All batches</option>
              {report.batches.map((batch) => <option key={batch} value={batch}>{batch}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Mock test
            <select value={selectedMock} onChange={(event) => setSelectedMock(event.target.value)} className="inst-input mt-1.5 min-h-11 w-full rounded-xl px-3 text-sm font-normal">
              <option value="ALL">All mock tests</option>
              {report.mocks.map((mock) => <option key={mock._id} value={mock._id}>{mock.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Find student
            <span className="relative mt-1.5 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Roll no, name, or email" className="inst-input min-h-11 w-full rounded-xl py-2 pl-9 pr-3 text-sm font-normal" />
            </span>
          </label>
        </div>
      </div>

      <div className="inst-results-report">
        <div className="inst-card overflow-hidden rounded-2xl">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2 text-slate-900">
              <FileText className="h-4 w-4 shrink-0 text-indigo-600" />
              <h2 className="text-base font-bold sm:text-lg">{instituteName || report.institute?.name || "Institute"} results matrix</h2>
            </div>
            <p className="text-sm text-slate-600">{selectedBatch === "ALL" ? "All batches" : selectedBatch} <span className="px-1 text-slate-400">/</span> {selectedMock === "ALL" ? "All mock tests" : filteredMocks[0]?.title}</p>
          </div>
          {!report.mocks.length ? (
            <div className="p-8 text-center text-sm text-slate-600">No institute mock tests are available for reporting yet.</div>
          ) : !filteredStudents.length ? (
            <div className="p-8 text-center text-sm text-slate-600">No students match the selected filters.</div>
          ) : (
            <div className="inst-report-scroll overflow-x-auto">
              <table className="inst-report-table min-w-[900px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3">Batch</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3">Roll no.</th>
                    <th className="sticky left-0 z-10 min-w-48 border-b border-slate-200 bg-slate-50 px-4 py-3">Student</th>
                    {filteredMocks.map((mock) => (
                      <th key={mock._id} className="min-w-40 border-b border-slate-200 px-4 py-3 normal-case tracking-normal">
                        <span className="block font-bold text-slate-800">{mock.title}</span>
                        <span className="mt-1 block text-xs font-medium text-slate-600">{mock.totalMarks ?? "-"} marks</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="odd:bg-white even:bg-slate-50/70 hover:bg-indigo-50/40">
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-slate-700">{student.batch}</td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-slate-700">{student.rollNo}</td>
                      <td className="sticky left-0 border-b border-slate-100 bg-inherit px-4 py-3">
                        <span className="block font-semibold text-slate-900">{student.name}</span>
                        <span className="block text-xs text-slate-600">{student.email}</span>
                      </td>
                      {filteredMocks.map((mock) => {
                        const result = resultsByStudentMock.get(`${student._id}:${mock._id}`);
                        const percentage = result && result.total > 0 ? Math.round((result.score / result.total) * 100) : null;
                        return (
                          <td key={mock._id} className="whitespace-nowrap border-b border-slate-100 px-4 py-3">
                            {result ? (
                              <>
                                <span className="block font-bold text-slate-900">{result.score} <span className="font-medium text-slate-600">/ {result.total}</span></span>
                                <span className="block text-xs text-slate-600">{percentage}% · {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : "Submitted"}</span>
                              </>
                            ) : <span className="text-slate-500">Not attempted</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-600 sm:px-5">
            Report includes submitted scores only. Students without a submission are shown as not attempted.
          </div>
        </div>
      </div>
    </section>
  );
}
