import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Download,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createQuestionBankQuestionsApi,
  deleteQuestionApi,
} from "../../api/institute.api";
import { exportInstituteQuestionsToA4Pdf } from "../../utils/exportInstituteQuestionsPdf";

const blankQuestion = () => ({
  id: `${Date.now()}-${Math.random()}`,
  topic: "",
  subject: "",
  question: "",
  options: ["", "", "", ""],
  correctOption: 0,
  marks: 4,
  negativeMarks: 1,
});

const legacyBankName = "General Question Bank";

export default function InstituteQuestionBanks({ questions = [], instituteName, onRefresh }) {
  const [selectedBankName, setSelectedBankName] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [bankSort, setBankSort] = useState("name");
  const [questionSearch, setQuestionSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [questionSort, setQuestionSort] = useState("newest");
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showEditor, setShowEditor] = useState(false);
  const [draftBankName, setDraftBankName] = useState("");
  const [draftQuestions, setDraftQuestions] = useState([blankQuestion()]);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [includeCorrectAnswers, setIncludeCorrectAnswers] = useState(false);

  const banks = useMemo(() => {
    const grouped = new Map();
    for (const question of questions) {
      const name = String(question.questionBankName || legacyBankName).trim();
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name).push(question);
    }

    return [...grouped.entries()].map(([name, items]) => ({
      name,
      questions: items,
      topics: [...new Set(items.map((item) => item.topic || item.section || "General"))],
      subjects: [...new Set(items.map((item) => item.subject).filter(Boolean))],
      newestAt: Math.max(...items.map((item) => new Date(item.createdAt || 0).getTime() || 0)),
    }));
  }, [questions]);

  const visibleBanks = useMemo(() => {
    const query = bankSearch.trim().toLowerCase();
    return banks
      .filter((bank) => bank.name.toLowerCase().includes(query))
      .sort((left, right) => {
        if (bankSort === "questions") return right.questions.length - left.questions.length || left.name.localeCompare(right.name);
        if (bankSort === "recent") return right.newestAt - left.newestAt || left.name.localeCompare(right.name);
        return left.name.localeCompare(right.name);
      });
  }, [banks, bankSearch, bankSort]);

  const selectedBank = banks.find((bank) => bank.name === selectedBankName);
  const bankQuestions = selectedBank?.questions || [];
  const topics = selectedBank?.topics || [];
  const subjects = selectedBank?.subjects || [];

  const visibleQuestions = useMemo(() => {
    const query = questionSearch.trim().toLowerCase();
    return bankQuestions
      .filter((question) => {
        const matchesTopic = topicFilter === "ALL" || (question.topic || question.section || "General") === topicFilter;
        const matchesSubject = subjectFilter === "ALL" || question.subject === subjectFilter;
        const matchesSearch = !query || [question.question, question.topic, question.subject]
          .some((value) => String(value || "").toLowerCase().includes(query));
        return matchesTopic && matchesSubject && matchesSearch;
      })
      .sort((left, right) => {
        if (questionSort === "subject") return String(left.subject).localeCompare(String(right.subject));
        if (questionSort === "topic") return String(left.topic || left.section).localeCompare(String(right.topic || right.section));
        return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
      });
  }, [bankQuestions, questionSearch, topicFilter, subjectFilter, questionSort]);

  const startNewBank = () => {
    setDraftBankName("");
    setDraftQuestions([blankQuestion()]);
    setShowEditor(true);
  };

  const startAddingToBank = () => {
    setDraftBankName(selectedBankName);
    setDraftQuestions([blankQuestion()]);
    setShowEditor(true);
  };

  const updateDraftQuestion = (index, key, value) => {
    setDraftQuestions((current) => current.map((question, questionIndex) => (
      questionIndex === index ? { ...question, [key]: value } : question
    )));
  };

  const updateDraftOption = (questionIndex, optionIndex, value) => {
    setDraftQuestions((current) => current.map((question, index) => {
      if (index !== questionIndex) return question;
      const options = [...question.options];
      options[optionIndex] = value;
      return { ...question, options };
    }));
  };

  const saveQuestions = async (event) => {
    event.preventDefault();
    const name = draftBankName.trim();
    if (!name) {
      toast.error("Enter a question bank name");
      return;
    }
    setSavingQuestions(true);
    try {
      await createQuestionBankQuestionsApi({
        questionBankName: name,
        questions: draftQuestions.map(({ id, ...question }) => ({
          ...question,
          topic: question.topic.trim(),
          subject: question.subject.trim(),
          section: question.topic.trim(),
        })),
      });
      setSelectedBankName(name);
      setQuestionSearch("");
      setTopicFilter("ALL");
      setSubjectFilter("ALL");
      setShowEditor(false);
      await onRefresh();
      toast.success(`${draftQuestions.length} question(s) added to ${name}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add questions");
    } finally {
      setSavingQuestions(false);
    }
  };

  const removeQuestion = async (questionId) => {
    if (!window.confirm("Remove this question from the bank?")) return;
    try {
      await deleteQuestionApi(questionId);
      await onRefresh();
      toast.success("Question removed from the bank");
    } catch {
      toast.error("Could not remove this question");
    }
  };

  const downloadBankPdf = async () => {
    if (!selectedBank || exportingPdf) return;
    setExportingPdf(true);
    try {
      const exportQuestions = bankQuestions.map((question) => ({
        ...question,
        section: question.topic || question.section || "General",
      }));
      const exportSections = [...new Set(exportQuestions.map((question) => question.section))]
        .map((topic) => ({ id: topic, name: topic }));
      await exportInstituteQuestionsToA4Pdf({
        instituteName,
        title: selectedBank.name,
        questions: exportQuestions,
        sections: exportSections,
        includeCorrectAnswers,
      });
      toast.success("Question bank PDF downloaded");
    } catch {
      toast.error("Could not create the question bank PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <section className="space-y-5" aria-labelledby="question-bank-title">
      {!selectedBank ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 id="question-bank-title" className="text-2xl font-bold tracking-tight text-slate-900">Institute Question Bank</h1>
              <p className="mt-1 text-sm leading-6 text-slate-600">Private question banks for your academy. Open a bank to browse and export its questions.</p>
            </div>
            <button type="button" onClick={startNewBank} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> New question bank
            </button>
          </div>

          <div className="inst-card grid grid-cols-1 gap-3 rounded-2xl p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={bankSearch} onChange={(event) => setBankSearch(event.target.value)} placeholder="Search question bank name" className="inst-input min-h-11 w-full rounded-xl py-2 pl-9 pr-3 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Sort banks
              <select value={bankSort} onChange={(event) => setBankSort(event.target.value)} className="inst-input mt-1 block min-h-11 w-full rounded-xl px-3 text-sm font-normal">
                <option value="name">Name A to Z</option>
                <option value="recent">Recently updated</option>
                <option value="questions">Most questions</option>
              </select>
            </label>
          </div>

          {visibleBanks.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleBanks.map((bank) => (
                <button key={bank.name} type="button" onClick={() => setSelectedBankName(bank.name)} className="inst-card group rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><BookOpen className="h-5 w-5" /></span>
                    <ChevronDown className="h-5 w-5 -rotate-90 text-slate-400 transition group-hover:text-indigo-600" />
                  </span>
                  <span className="mt-4 block break-words text-base font-bold text-slate-900">{bank.name}</span>
                  <span className="mt-2 block text-sm text-slate-600">{bank.questions.length} questions · {bank.subjects.length} subjects · {bank.topics.length} topics</span>
                  <span className="mt-3 block truncate text-xs text-slate-500">{bank.topics.slice(0, 3).join(" · ")}{bank.topics.length > 3 ? " · …" : ""}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="inst-card rounded-2xl p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-indigo-500" />
              <h2 className="mt-3 font-semibold text-slate-900">{bankSearch ? "No matching question banks" : "No question banks yet"}</h2>
              <p className="mt-1 text-sm text-slate-600">Create a bank, then add one or more questions with their subject and topic.</p>
            </div>
          )}
        </>
      ) : (
        <>
          <button type="button" onClick={() => setSelectedBankName("")} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
            <ArrowLeft className="h-4 w-4" /> All question banks
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Question bank</p>
              <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">{selectedBank.name}</h1>
              <p className="mt-1 text-sm text-slate-600">{bankQuestions.length} questions · {topics.length} topics · {subjects.length} subjects</p>
            </div>
            <button type="button" onClick={startAddingToBank} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add questions
            </button>
          </div>

          <div className="inst-card grid grid-cols-1 gap-3 rounded-2xl p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_190px] sm:p-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={questionSearch} onChange={(event) => setQuestionSearch(event.target.value)} placeholder="Search questions in this bank" className="inst-input min-h-11 w-full rounded-xl py-2 pl-9 pr-3 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">Topic
              <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="inst-input mt-1 block min-h-11 w-full rounded-xl px-3 text-sm font-normal">
                <option value="ALL">All topics</option>{topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Subject
              <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="inst-input mt-1 block min-h-11 w-full rounded-xl px-3 text-sm font-normal">
                <option value="ALL">All subjects</option>{subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Sort questions
              <select value={questionSort} onChange={(event) => setQuestionSort(event.target.value)} className="inst-input mt-1 block min-h-11 w-full rounded-xl px-3 text-sm font-normal">
                <option value="newest">Newest first</option><option value="subject">Subject A to Z</option><option value="topic">Topic A to Z</option>
              </select>
            </label>
          </div>

          <div className="space-y-3">
            {visibleQuestions.length ? visibleQuestions.map((question, index) => {
              const expanded = Boolean(expandedQuestions[String(question._id)]);
              return (
                <article key={question._id} className="inst-card overflow-hidden rounded-2xl">
                  <div className="flex items-start gap-3 p-4 sm:p-5">
                    <button type="button" onClick={() => setExpandedQuestions((current) => ({ ...current, [String(question._id)]: !expanded }))} aria-expanded={expanded} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                      <span className="mt-0.5 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">Q{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold leading-6 text-slate-900">{question.question}</span>
                        <span className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{question.topic || question.section || "General"}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{question.subject}</span>
                        </span>
                      </span>
                      <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-slate-500 transition ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    <button type="button" onClick={() => removeQuestion(question._id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove question"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {expanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:px-5">
                      {question.paragraph && <p className="mb-3 whitespace-pre-wrap rounded-xl border-l-2 border-slate-300 bg-white p-3 text-sm leading-6 text-slate-700">{question.paragraph}</p>}
                      {question.imageUrl && <img src={question.imageUrl} alt="Question illustration" className="mb-3 max-h-64 max-w-full rounded-lg object-contain" />}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(question.options || []).map((option, optionIndex) => {
                          const correct = Number(question.correctOption) === optionIndex;
                          return <div key={`${question._id}-${optionIndex}`} className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${correct ? "border-emerald-200 bg-emerald-50 font-semibold text-emerald-800" : "border-slate-200 bg-white text-slate-700"}`}><span className="shrink-0 font-bold">{String.fromCharCode(65 + optionIndex)}.</span><span>{option}</span></div>;
                        })}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">+{question.marks} / -{question.negativeMarks} marks</p>
                    </div>
                  )}
                </article>
              );
            }) : <div className="inst-card rounded-2xl p-8 text-center text-sm text-slate-600">No questions match these filters.</div>}
          </div>

          <div className="inst-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={includeCorrectAnswers} onChange={(event) => setIncludeCorrectAnswers(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span><span className="block font-semibold">Include correct options in PDF</span><span className="mt-0.5 block text-xs text-slate-500">When enabled, the correct choice is highlighted and its letter is shown.</span></span>
            </label>
            <button type="button" onClick={downloadBankPdf} disabled={!bankQuestions.length || exportingPdf} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Download className="h-4 w-4" /> {exportingPdf ? "Preparing PDF…" : `Download ${selectedBank.name} PDF`}
            </button>
          </div>
        </>
      )}

      {showEditor && (
        <div className="inst-modal-overlay fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
          <div className="inst-modal-panel relative max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-3xl p-4 shadow-2xl sm:p-7">
            <button type="button" onClick={() => setShowEditor(false)} aria-label="Close add questions" className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            <h2 className="pr-10 text-xl font-bold text-slate-900">{selectedBankName ? "Add questions to bank" : "Create question bank"}</h2>
            <p className="mt-1 text-sm text-slate-600">Name the bank and add multiple questions. Every question has its own topic and subject.</p>
            <form onSubmit={saveQuestions} className="mt-5 space-y-5">
              <label className="block text-sm font-semibold text-slate-700">Question bank name
                <input required value={draftBankName} onChange={(event) => setDraftBankName(event.target.value)} list="institute-question-bank-names" placeholder="e.g. Class 12 Chemistry" className="inst-input mt-1.5 min-h-11 w-full rounded-xl px-3 text-sm font-normal" />
                <datalist id="institute-question-bank-names">{banks.map((bank) => <option key={bank.name} value={bank.name} />)}</datalist>
              </label>

              {draftQuestions.map((question, questionIndex) => (
                <section key={question.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="font-bold text-slate-900">Question {questionIndex + 1}</h3>
                    {draftQuestions.length > 1 && <button type="button" onClick={() => setDraftQuestions((current) => current.filter((item) => item.id !== question.id))} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /> Remove</button>}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">Topic
                      <input required value={question.topic} onChange={(event) => updateDraftQuestion(questionIndex, "topic", event.target.value)} placeholder="e.g. Chemical bonding" className="inst-input mt-1.5 min-h-11 w-full rounded-xl px-3 text-sm font-normal" />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">Subject
                      <input required value={question.subject} onChange={(event) => updateDraftQuestion(questionIndex, "subject", event.target.value)} placeholder="e.g. Chemistry" className="inst-input mt-1.5 min-h-11 w-full rounded-xl px-3 text-sm font-normal" />
                    </label>
                  </div>
                  <label className="mt-3 block text-sm font-semibold text-slate-700">Question text
                    <textarea required rows="3" value={question.question} onChange={(event) => updateDraftQuestion(questionIndex, "question", event.target.value)} placeholder="Enter the question" className="inst-input mt-1.5 w-full rounded-xl p-3 text-sm font-normal" />
                  </label>
                  <fieldset className="mt-4 space-y-2">
                    <legend className="mb-2 text-sm font-semibold text-slate-700">Answer options (select the correct option)</legend>
                    {question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${question.id}`} checked={question.correctOption === optionIndex} onChange={() => updateDraftQuestion(questionIndex, "correctOption", optionIndex)} className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                        <span className="w-6 text-xs font-bold text-slate-500">{String.fromCharCode(65 + optionIndex)}.</span>
                        <input required value={option} onChange={(event) => updateDraftOption(questionIndex, optionIndex, event.target.value)} placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`} className="inst-input min-h-10 min-w-0 flex-1 rounded-lg px-3 text-sm" />
                      </label>
                    ))}
                  </fieldset>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="text-sm font-semibold text-slate-700">Marks
                      <input type="number" min="0" step="0.25" value={question.marks} onChange={(event) => updateDraftQuestion(questionIndex, "marks", Number(event.target.value))} className="inst-input mt-1.5 min-h-10 w-full rounded-lg px-3 text-sm font-normal" />
                    </label>
                    <label className="text-sm font-semibold text-slate-700">Negative marks
                      <input type="number" min="0" step="0.25" value={question.negativeMarks} onChange={(event) => updateDraftQuestion(questionIndex, "negativeMarks", Number(event.target.value))} className="inst-input mt-1.5 min-h-10 w-full rounded-lg px-3 text-sm font-normal" />
                    </label>
                  </div>
                </section>
              ))}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setDraftQuestions((current) => [...current, blankQuestion()])} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"><Plus className="h-4 w-4" /> Add another question</button>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowEditor(false)} className="min-h-10 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                  <button type="submit" disabled={savingQuestions} className="min-h-10 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{savingQuestions ? "Saving…" : `Save ${draftQuestions.length} question(s)`}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
