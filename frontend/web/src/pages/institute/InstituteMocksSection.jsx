import { useState } from "react";
import { Plus, Download, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { createCustomMockApi, getInstituteMockByIdApi, deleteCustomMockApi } from "../../api/institute.api";
import { exportInstituteQuestionsToA4Pdf } from "../../utils/exportInstituteQuestionsPdf";

export default function CustomMocksSection({
  mocks,
  instituteName,
  onRefresh,
  showCreateModal,
  setShowCreateModal,
  questionsBank,
}) {
  const [mockForm, setMockForm] = useState({
    title: "",
    description: "",
    duration: 60,
    marking: { correct: 4, incorrect: 1 },
    sections: [
      { id: "phy", name: "Physics", questionCount: 1 },
      { id: "math", name: "Mathematics", questionCount: 1 },
    ],
    // Quick inline questions for test creation
    questions: [
      {
        section: "phy",
        subject: "physics",
        question: "What is Newton's second law of motion?",
        options: ["F = ma", "F = mv", "F = m/a", "F = 0"],
        correctOption: 0,
      },
      {
        section: "math",
        subject: "mathematics",
        question: "What is the slope of y = 3x + 7?",
        options: ["3", "7", "0", "-3"],
        correctOption: 0,
      },
    ],
  });
  const [exportingMockId, setExportingMockId] = useState("");

  const handleExportMockQuestions = async (mock) => {
    if (exportingMockId) return;
    setExportingMockId(mock._id);
    try {
      const response = await getInstituteMockByIdApi(mock._id);
      const questions = response.data?.questions || [];
      if (!questions.length) {
        toast.error("This mock does not have any questions to export");
        return;
      }
      await exportInstituteQuestionsToA4Pdf({
        instituteName,
        title: mock.title,
        questions,
        sections: response.data?.mock?.sections || mock.sections || [],
      });
      toast.success("Mock question paper PDF downloaded");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not export this mock PDF");
    } finally {
      setExportingMockId("");
    }
  };

  const normalizeSectionId = (value, fallbackIndex) => {
    const clean = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return clean || `section${fallbackIndex + 1}`;
  };

  const handleCreateMock = async (e) => {
    e.preventDefault();

    const sanitizedSections = mockForm.sections
      .filter((sec) => (sec.id || "").trim() || (sec.name || "").trim())
      .map((sec, index) => {
        const sectionId = normalizeSectionId(sec.id || sec.name, index);
        return {
          id: sectionId,
          name:
            String(sec.name || sec.id || "").trim() || `Section ${index + 1}`,
          questionCount: Number(sec.questionCount || 0),
        };
      });

    const validSectionIds = new Set(sanitizedSections.map((s) => s.id));
    const normalizedQuestions = mockForm.questions.map((q, index) => {
      const matchedSection = sanitizedSections.find(
        (sec) => sec.id === q.section || sec.name === q.section,
      );
      return {
        ...q,
        section: matchedSection
          ? matchedSection.id
          : sanitizedSections[index % sanitizedSections.length]?.id ||
            "section1",
        subject: q.subject || matchedSection?.name || "general",
      };
    });

    if (sanitizedSections.length === 0) {
      toast.error("Add at least one section with a code and subject name.");
      return;
    }

    try {
      await createCustomMockApi({
        ...mockForm,
        sections: sanitizedSections,
        questions: normalizedQuestions,
      });
      toast.success("Custom Mock Test created! Ready to be assigned.");
      setShowCreateModal(false);
      onRefresh();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create custom mock",
      );
    }
  };

  const handleDeleteMock = async (mockId) => {
    if (!window.confirm("Delete this custom mock test and all its questions?"))
      return;
    try {
      await deleteCustomMockApi(mockId);
      toast.success("Mock test deleted");
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete mock");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Custom Mock Tests
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Build custom exams with flexible duration, marking rules (+/-), and
            sections. Runs on the existing dynamic MockX exam engine.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Build Custom Mock</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mocks.length === 0 ? (
          <div className="col-span-full inst-card border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-xs">
            No custom mocks created yet. Click "Build Custom Mock" to configure
            an exam for your students.
          </div>
        ) : (
          mocks.map((m) => (
            <div
              key={m._id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                    {m.title}
                  </h3>
                  <button
                    onClick={() => handleDeleteMock(m._id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Delete mock"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-400 text-xs line-clamp-2 mb-4">
                  {m.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                    ⏱ {m.duration} mins
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    +{m.marking?.correct} / -{m.marking?.incorrect} Marks
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                    {m.totalQuestions} Questions ({m.totalMarks} Total)
                  </span>
                </div>

                <div className="border-t border-slate-200/80 pt-3 mb-4">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">
                    Sections
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.sections?.map((sec) => (
                      <span
                        key={sec.id}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]"
                      >
                        {sec.name} ({sec.questionCount || 0})
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleExportMockQuestions(m)}
                  disabled={Boolean(exportingMockId) || !m.totalQuestions}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {exportingMockId === m._id ? "Preparing PDF…" : "Download A4 question paper"}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400">
                <span>{m.attemptsCount || 0} Attempts recorded</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {m._id}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE CUSTOM MOCK MODAL */}
      {showCreateModal && (
        <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-lg relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Build Custom Mock Test
            </h3>
            <p className="text-slate-400 text-xs mb-5">
              Configured mock tests run directly in the existing dynamic exam
              engine with timer and negative marking.
            </p>

            <form onSubmit={handleCreateMock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Weekly JEE Practice #02"
                  value={mockForm.title}
                  onChange={(e) =>
                    setMockForm({ ...mockForm, title: e.target.value })
                  }
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Physics + Maths Practice | High-yield concepts"
                  value={mockForm.description}
                  onChange={(e) =>
                    setMockForm({ ...mockForm, description: e.target.value })
                  }
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Duration (Mins) *
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    value={mockForm.duration}
                    onChange={(e) =>
                      setMockForm({
                        ...mockForm,
                        duration: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Correct Mark (+)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={mockForm.marking.correct}
                    onChange={(e) =>
                      setMockForm({
                        ...mockForm,
                        marking: {
                          ...mockForm.marking,
                          correct: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Negative Penalty (-)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={mockForm.marking.incorrect}
                    onChange={(e) =>
                      setMockForm({
                        ...mockForm,
                        marking: {
                          ...mockForm.marking,
                          incorrect: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Sections */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Sections Configured
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setMockForm({
                        ...mockForm,
                        sections: [
                          ...mockForm.sections,
                          {
                            id: `section${mockForm.sections.length + 1}`,
                            name: "",
                            questionCount: 0,
                          },
                        ],
                      })
                    }
                    className="text-indigo-600 hover:text-indigo-500 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {mockForm.sections.map((sec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Code"
                        value={sec.id}
                        onChange={(e) => {
                          const previousId = sec.id;
                          const updated = [...mockForm.sections];
                          const nextValue = e.target.value;
                          updated[idx].id = nextValue;

                          const updatedQuestions = mockForm.questions.map(
                            (q) =>
                              q.section === previousId
                                ? {
                                    ...q,
                                    section: normalizeSectionId(nextValue, idx),
                                  }
                                : q,
                          );

                          setMockForm({
                            ...mockForm,
                            sections: updated,
                            questions: updatedQuestions,
                          });
                        }}
                        className="w-28 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Subject Name"
                        value={sec.name}
                        onChange={(e) => {
                          const updated = [...mockForm.sections];
                          updated[idx].name = e.target.value;
                          setMockForm({ ...mockForm, sections: updated });
                        }}
                        className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                      />
                      {mockForm.sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const removedId = mockForm.sections[idx].id;
                            const updated = mockForm.sections.filter(
                              (_, sectionIndex) => sectionIndex !== idx,
                            );
                            const fallbackSection =
                              updated[0]?.id || "section1";
                            const adjustedQuestions = mockForm.questions.map(
                              (q) =>
                                q.section === removedId
                                  ? { ...q, section: fallbackSection }
                                  : q,
                            );
                            setMockForm({
                              ...mockForm,
                              sections: updated.length
                                ? updated
                                : [
                                    {
                                      id: "section1",
                                      name: "",
                                      questionCount: 0,
                                    },
                                  ],
                              questions: adjustedQuestions,
                            });
                          }}
                          className="text-slate-400 hover:text-rose-400 p-1.5"
                          title="Remove section"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions preview */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Questions for this Mock ({mockForm.questions.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMockForm({
                        ...mockForm,
                        questions: [
                          ...mockForm.questions,
                          {
                            section: mockForm.sections[0]?.id || "section1",
                            subject: mockForm.sections[0]?.name || "general",
                            question: `Question ${mockForm.questions.length + 1}`,
                            options: [
                              "Option A",
                              "Option B",
                              "Option C",
                              "Option D",
                            ],
                            correctOption: 0,
                          },
                        ],
                      });
                    }}
                    className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {mockForm.questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="bg-slate-100 p-3 rounded-xl border border-slate-200/60"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-slate-400">
                          Question #{qIdx + 1}
                        </span>
                        <select
                          value={q.section}
                          onChange={(e) => {
                            const updated = [...mockForm.questions];
                            updated[qIdx].section = e.target.value;
                            setMockForm({ ...mockForm, questions: updated });
                          }}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] text-indigo-300"
                        >
                          {mockForm.sections.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.id})
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => {
                          const updated = [...mockForm.questions];
                          updated[qIdx].question = e.target.value;
                          setMockForm({ ...mockForm, questions: updated });
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 mb-2"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name={`q_${qIdx}_correct`}
                              checked={q.correctOption === oIdx}
                              onChange={() => {
                                const updated = [...mockForm.questions];
                                updated[qIdx].correctOption = oIdx;
                                setMockForm({
                                  ...mockForm,
                                  questions: updated,
                                });
                              }}
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...mockForm.questions];
                                updated[qIdx].options[oIdx] = e.target.value;
                                setMockForm({
                                  ...mockForm,
                                  questions: updated,
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-md px-2 py-0.5 text-[11px] text-slate-900"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Create Mock Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
