

export default function AnalyticsSection({
  subTab,
  setSubTab,
  studentAnalytics,
  testAnalytics,
  questionAnalytics,
  mocks,
  selectedMock,
  onSelectMock,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Institute Performance Analytics
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Detailed student leaderboards, test-wise comparative metrics, and
          question-level difficulty diagnostics.
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "student", label: "Student-wise Analytics" },
          { id: "test", label: "Test-wise Analytics" },
          { id: "question", label: "Question-wise Diagnostics" },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setSubTab(st.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === st.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "bg-slate-100 text-slate-600 hover:text-indigo-700 border border-slate-200"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* 1. Student-wise Leaderboard */}
      {subTab === "student" && (
        <div className="inst-card border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-5">Rank</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Batch</th>
                <th className="py-3.5 px-4">Tests Attempted</th>
                <th className="py-3.5 px-4">Avg Score</th>
                <th className="py-3.5 px-4">Best Score</th>
                <th className="py-3.5 px-5 text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {studentAnalytics.map((s, idx) => (
                <tr
                  key={s._id}
                  className="hover:bg-slate-100/30 transition-colors"
                >
                  <td className="py-3.5 px-5 font-black text-slate-400">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-900">
                      {s.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{s.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-indigo-300">
                    {s.batch}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {s.testsAttempted}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">
                    {s.avgScore}
                  </td>
                  <td className="py-3.5 px-4 font-black text-purple-400">
                    {s.bestScore}
                  </td>
                  <td className="py-3.5 px-5 text-right font-black text-sky-400">
                    {s.avgAccuracy}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Test-wise Analytics */}
      {subTab === "test" && (
        <div className="space-y-4">
          {testAnalytics.map((t) => (
            <div
              key={t.mockId}
              className="inst-card border border-slate-200 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {t.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {t.duration} mins • Total Marks: {t.totalMarks}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-indigo-400">
                    {t.attempted} of {t.assigned} students attempted
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Attempted
                  </div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {t.attempted}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Not Attempted
                  </div>
                  <div className="text-base font-black text-amber-400 mt-0.5">
                    {t.notAttempted}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Highest Score
                  </div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {t.highestScore}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Lowest Score
                  </div>
                  <div className="text-base font-black text-rose-400 mt-0.5">
                    {t.lowestScore}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Average Score
                  </div>
                  <div className="text-base font-black text-purple-400 mt-0.5">
                    {t.avgScore}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Question-wise Diagnostics */}
      {subTab === "question" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              Select Mock Test:
            </span>
            <select
              value={selectedMock}
              onChange={(e) => onSelectMock(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
            >
              {mocks.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {questionAnalytics && (
            <div className="space-y-3.5">
              <p className="text-xs text-slate-400">
                Total Submissions Evaluated:{" "}
                <span className="font-bold text-slate-900">
                  {questionAnalytics.totalSubmissions}
                </span>
              </p>

              {questionAnalytics.questions?.map((q) => (
                <div
                  key={q.questionCode}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400">
                        Q{q.index}.
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-indigo-300 font-bold text-[10px] uppercase">
                        {q.section} • {q.subject}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-emerald-400">
                        Correct: {q.correctPct}%
                      </span>
                      <span className="text-rose-400">
                        Wrong: {q.wrongPct}%
                      </span>
                      <span className="text-slate-500">
                        Skipped: {q.skippedPct}%
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-800 text-xs font-semibold mb-3">
                    {q.questionText}
                  </p>

                  {/* Visual Accuracy Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      style={{ width: `${q.correctPct}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Correct: ${q.correctPct}%`}
                    />
                    <div
                      style={{ width: `${q.wrongPct}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`Wrong: ${q.wrongPct}%`}
                    />
                    <div
                      style={{ width: `${q.skippedPct}%` }}
                      className="bg-slate-600 h-full transition-all"
                      title={`Skipped: ${q.skippedPct}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
