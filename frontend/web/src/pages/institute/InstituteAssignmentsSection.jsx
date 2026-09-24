import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { createAssignmentApi, deleteAssignmentApi } from "../../api/institute.api";

export default function TestAssignmentsSection({
  assignments,
  mocks,
  batches,
  onRefresh,
  showAssignModal,
  setShowAssignModal,
}) {
  const [assignForm, setAssignForm] = useState({
    mockId: "",
    assignToType: "ALL",
    batch: "",
    availableFrom: "",
    availableUntil: "",
  });

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await createAssignmentApi(assignForm);
      toast.success("Test assigned to students successfully!");
      setShowAssignModal(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign test");
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm("Cancel this test assignment?")) return;
    try {
      await deleteAssignmentApi(id);
      toast.success("Assignment cancelled");
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete assignment");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Test Assignments
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Assign custom mock tests to All students or specific Batches with
            scheduled start and end dates.
          </p>
        </div>

        <button
          onClick={() => setShowAssignModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Test</span>
        </button>
      </div>

      <div className="inst-card border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-5">Mock Test</th>
              <th className="py-3.5 px-4">Target Audience</th>
              <th className="py-3.5 px-4">Students</th>
              <th className="py-3.5 px-4">Attempts</th>
              <th className="py-3.5 px-4">Availability Window</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  No active assignments. Click "Assign Test" to schedule an
                  exam.
                </td>
              </tr>
            ) : (
              assignments.map((a) => (
                <tr
                  key={a._id}
                  className="hover:bg-slate-100/30 transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-extrabold text-slate-900">
                      {a.mockTitle}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {a.duration} mins • {a.totalQuestions} questions
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {a.assignToType === "ALL" && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                        All Students
                      </span>
                    )}
                    {a.assignToType === "BATCH" && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                        Batch: {a.batch}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {a.assignedCount}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">
                    {a.attemptedCount}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-400">
                    <div>
                      From:{" "}
                      {a.availableFrom
                        ? new Date(a.availableFrom).toLocaleDateString()
                        : "Always"}
                    </div>
                    <div>
                      Until:{" "}
                      {a.availableUntil
                        ? new Date(a.availableUntil).toLocaleDateString()
                        : "No Expiry"}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        a.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleDeleteAssignment(a._id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300"
                      title="Cancel Assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ASSIGN TEST MODAL */}
      {showAssignModal && (
        <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-lg relative">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Assign Test to Students
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Mock Test *
                </label>
                <select
                  required
                  value={assignForm.mockId}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, mockId: e.target.value })
                  }
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="">-- Choose a mock test --</option>
                  {mocks.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.duration} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Assign To *
                </label>
                <select
                  value={assignForm.assignToType}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      assignToType: e.target.value,
                    })
                  }
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="ALL">All Enrolled Students</option>
                  <option value="BATCH">Specific Batch Only</option>
                </select>
              </div>

              {assignForm.assignToType === "BATCH" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Select Batch *
                  </label>
                  <select
                    required
                    value={assignForm.batch}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, batch: e.target.value })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="">-- Select batch --</option>
                    {batches.map((b) => (
                      <option key={b._id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Available From
                  </label>
                  <input
                    type="datetime-local"
                    value={assignForm.availableFrom}
                    onChange={(e) =>
                      setAssignForm({
                        ...assignForm,
                        availableFrom: e.target.value,
                      })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Available Until
                  </label>
                  <input
                    type="datetime-local"
                    value={assignForm.availableUntil}
                    onChange={(e) =>
                      setAssignForm({
                        ...assignForm,
                        availableUntil: e.target.value,
                      })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Assign Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
