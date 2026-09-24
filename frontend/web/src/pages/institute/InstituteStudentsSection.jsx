import { useState } from "react";
import { Users, FileText, Plus, Search, X, Trash2, UserCheck, UserX, Eye, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { createBatchApi, deleteBatchApi, createStudentApi, bulkCreateStudentsApi, toggleStudentStatusApi, deleteStudentApi, getStudentPerformanceApi } from "../../api/institute.api";

export default function StudentsAndBatchesSection({
  batches,
  students,
  selectedBatch,
  setSelectedBatch,
  searchQuery,
  setSearchQuery,
  onRefresh,
  showAddStudentModal,
  setShowAddStudentModal,
  showBulkStudentModal,
  setShowBulkStudentModal,
  showAddBatchModal,
  setShowAddBatchModal,
  selectedStudentPerf,
  setSelectedStudentPerf,
}) {
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    batch: "",
    studentRollNo: "",
  });

  const [bulkCsvText, setBulkCsvText] = useState("");
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchDesc, setNewBatchDesc] = useState("");

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await createStudentApi(newStudent);
      toast.success("Student created successfully!");
      setShowAddStudentModal(false);
      setNewStudent({
        name: "",
        email: "",
        password: "",
        phone: "",
        batch: "",
        studentRollNo: "",
      });
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create student");
    }
  };

  const handleBulkCreate = async (e) => {
    e.preventDefault();
    try {
      // Parse CSV: name, email, password, phone, batch, rollNo
      const lines = bulkCsvText.split("\n").filter((l) => l.trim().length > 0);
      const studentList = [];
      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 3) {
          studentList.push({
            name: parts[0],
            email: parts[1],
            password: parts[2],
            phone: parts[3] || "",
            batch: parts[4] || "",
            studentRollNo: parts[5] || "",
          });
        }
      }

      if (studentList.length === 0) {
        toast.error("Please enter valid CSV rows (Name, Email, Password, ...)");
        return;
      }

      const res = await bulkCreateStudentsApi(studentList);
      toast.success(res.data?.message || "Bulk import complete!");
      setShowBulkStudentModal(false);
      setBulkCsvText("");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk import failed");
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await createBatchApi({ name: newBatchName, description: newBatchDesc });
      toast.success("Batch created successfully!");
      setShowAddBatchModal(false);
      setNewBatchName("");
      setNewBatchDesc("");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create batch");
    }
  };

  const handleDeleteBatch = async (bId) => {
    if (
      !window.confirm(
        "Are you sure? Students in this batch will become unassigned.",
      )
    )
      return;
    try {
      await deleteBatchApi(bId);
      toast.success("Batch removed");
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete batch");
    }
  };

  const handleToggleStatus = async (sId) => {
    try {
      const res = await toggleStudentStatusApi(sId);
      toast.success(res.data?.message || "Student status changed");
      onRefresh();
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  const handleDeleteStudent = async (sId) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    try {
      await deleteStudentApi(sId);
      toast.success("Student deleted");
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete student");
    }
  };

  const handleViewPerformance = async (sId) => {
    try {
      const res = await getStudentPerformanceApi(sId);
      setSelectedStudentPerf(res.data);
    } catch (err) {
      toast.error("Failed to load performance");
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesBatch = !selectedBatch || s.batch === selectedBatch;
    return (
      matchesBatch && (
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.studentRollNo?.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
 
{/* Page Header */}
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div className="min-w-0">
    <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
      Students & Batches
    </h1>

    <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
      Organize students into batches and manage their credentials and exam performance.
    </p>
  </div>

  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
    <button
      onClick={() => setShowAddBatchModal(true)}
      className="group flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-purple-300 hover:bg-purple-50 sm:px-4 sm:text-sm"
    >
      <Plus className="h-4 w-4 shrink-0 text-purple-600 transition-transform group-hover:scale-110" />
      <span>New Batch</span>
    </button>

    <button
      onClick={() => setShowBulkStudentModal(true)}
      className="group flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50 sm:px-4 sm:text-sm"
    >
      <Upload className="h-4 w-4 shrink-0 text-sky-600 transition-transform group-hover:scale-110" />
      <span>Bulk CSV</span>
    </button>

    <button
      onClick={() => setShowAddStudentModal(true)}
      className="group col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-indigo-600 sm:col-span-1 sm:px-4 sm:text-sm"
    >
      <Plus className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
      <span>Add Student</span>
    </button>
  </div>
</div>

  {/* Batches Pill Bar */}
  <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
    <button
      onClick={() => setSelectedBatch("")}
      className={`px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all ${
        selectedBatch === ""
          ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20"
          : "bg-white text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200"
      }`}
    >
      All Students ({students.length})
    </button>
    {batches.map((b) => (
      <div
        key={b._id}
        className="inline-flex items-center gap-1 shrink-0 group"
      >
        <button
          onClick={() => setSelectedBatch(b.name)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            selectedBatch === b.name
              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20"
              : "bg-white text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200"
          }`}
        >
          {b.name} ({b.studentCount || 0})
        </button>
        <button
          onClick={() => handleDeleteBatch(b._id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
          title="Delete batch"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>

  {/* Search Input */}
  <div className="relative w-full max-w-sm">
    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center">
      <Search className="w-4 h-4 text-slate-400" />
    </div>
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Filter by name, email, roll no..."
      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
    />
  </div>

  {/* Students Table */}
{/* Students Table */}
<div className="inst-card overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
  {/* Horizontal scroll area */}
  <div className="w-full overflow-x-auto">
    <table className="w-full min-w-[750px] text-left text-sm text-slate-600">
      <thead className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
        <tr>
          <th className="whitespace-nowrap px-4 py-3 sm:px-5 sm:py-4">
            Student
          </th>

          <th className="whitespace-nowrap px-4 py-3 sm:py-4">
            Batch
          </th>

          <th className="whitespace-nowrap px-4 py-3 sm:py-4">
            Roll No
          </th>

          <th className="whitespace-nowrap px-4 py-3 sm:py-4">
            Tests Taken
          </th>

          <th className="whitespace-nowrap px-4 py-3 sm:py-4">
            Avg Score
          </th>

          <th className="whitespace-nowrap px-4 py-3 sm:py-4">
            Status
          </th>

          <th className="whitespace-nowrap px-4 py-3 text-right sm:px-5 sm:py-4">
            Actions
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-slate-100">
        {filteredStudents.length === 0 ? (
          <tr>
            <td colSpan="7" className="px-4 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                <Users className="h-6 w-6 text-slate-400" />
              </div>

              <p className="text-sm font-semibold text-slate-700">
                No students found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Add a student or import via CSV to get started
              </p>
            </td>
          </tr>
        ) : (
          filteredStudents.map((s) => (
            <tr
              key={s._id}
              className="group transition-colors hover:bg-slate-50/80"
            >
              {/* Student */}
              <td className="px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex min-w-[220px] items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 sm:h-10 sm:w-10">
                    <span className="text-xs font-bold text-indigo-700 sm:text-sm">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="max-w-[180px] truncate text-xs font-semibold text-slate-900 sm:text-sm">
                      {s.name}
                    </p>

                    <p className="max-w-[200px] truncate text-[11px] text-slate-500 sm:text-xs">
                      {s.email}
                    </p>
                  </div>
                </div>
              </td>

              {/* Batch */}
              <td className="whitespace-nowrap px-4 py-3 sm:py-4">
                {s.batch ? (
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/10 sm:text-xs">
                    {s.batch}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>

              {/* Roll No */}
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-600 sm:py-4 sm:text-xs">
                {s.studentRollNo || "—"}
              </td>

              {/* Tests Taken */}
              <td className="whitespace-nowrap px-4 py-3 sm:py-4">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 sm:text-xs">
                  {s.attemptsCount || 0}
                </span>
              </td>

              {/* Avg Score */}
              <td className="whitespace-nowrap px-4 py-3 sm:py-4">
                <span className="text-xs font-bold text-emerald-600 sm:text-sm">
                  {s.avgScore || 0}
                </span>
              </td>

              {/* Status */}
              <td className="whitespace-nowrap px-4 py-3 sm:py-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:text-xs ${
                    s.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                      : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20"
                  }`}
                >
                  {s.status}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-right sm:px-5 sm:py-4">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleViewPerformance(s._id)}
                    className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-indigo-100 hover:text-indigo-700 sm:p-2"
                    title="View Performance History"
                  >
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(s._id)}
                    className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-amber-100 hover:text-amber-700 sm:p-2"
                    title={
                      s.status === "ACTIVE"
                        ? "Suspend student"
                        : "Activate student"
                    }
                  >
                    {s.status === "ACTIVE" ? (
                      <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteStudent(s._id)}
                    className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-rose-100 hover:text-rose-700 sm:p-2"
                    title="Delete student"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  {/* Mobile scroll hint */}
  {filteredStudents.length > 0 && (
    <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-[10px] text-slate-400 sm:hidden">
      ← Swipe horizontally to view all student details →
    </div>
  )}
</div>

  {/* CREATE STUDENT MODAL */}
  {showAddStudentModal && (
    <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn bg-slate-900/50 backdrop-blur-sm">
      <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative bg-white">
        <button
          onClick={() => setShowAddStudentModal(false)}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-900">
            Add Single Student
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Enter student details to create a new account
          </p>
        </div>
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="Aryan Patel"
              value={newStudent.name}
              onChange={(e) =>
                setNewStudent({ ...newStudent, name: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="aryan@apex.edu"
              value={newStudent.email}
              onChange={(e) =>
                setNewStudent({ ...newStudent, email: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newStudent.password}
              onChange={(e) =>
                setNewStudent({ ...newStudent, password: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Batch
              </label>
              <select
                value={newStudent.batch}
                onChange={(e) =>
                  setNewStudent({ ...newStudent, batch: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">Unassigned</option>
                {batches.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Roll No
              </label>
              <input
                type="text"
                placeholder="APEX-001"
                value={newStudent.studentRollNo}
                onChange={(e) =>
                  setNewStudent({
                    ...newStudent,
                    studentRollNo: e.target.value,
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddStudentModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Create Student
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* BULK CSV MODAL */}
  {showBulkStudentModal && (
    <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn bg-slate-900/50 backdrop-blur-sm">
      <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative bg-white">
        <button
          onClick={() => setShowBulkStudentModal(false)}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-900">
            Bulk CSV Student Import
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Paste lines in format:{" "}
            <code className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono">
              Name, Email, Password, Phone, Batch, RollNo
            </code>
          </p>
        </div>

        <form onSubmit={handleBulkCreate} className="space-y-4">
          <textarea
            rows="7"
            required
            value={bulkCsvText}
            onChange={(e) => setBulkCsvText(e.target.value)}
            placeholder="Aryan Patel, aryan@apex.edu, student123, 9876543210, Morning Stars (JEE-26), APEX-01&#10;Priya Sharma, priya@apex.edu, student123, 9876543211, Morning Stars (JEE-26), APEX-02"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowBulkStudentModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
            >
              Upload & Create All
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* CREATE BATCH MODAL */}
  {showAddBatchModal && (
    <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn bg-slate-900/50 backdrop-blur-sm">
      <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative bg-white">
        <button
          onClick={() => setShowAddBatchModal(false)}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-900">
            Create New Batch
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Add a new batch to organize students
          </p>
        </div>
        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Batch Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. JEE 2026 Droppers"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Intensive weekend problem solving"
              value={newBatchDesc}
              onChange={(e) => setNewBatchDesc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddBatchModal(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all"
            >
              Create Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* STUDENT PERFORMANCE MODAL */}
  {selectedStudentPerf && (
    <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn bg-slate-900/50 backdrop-blur-sm">
      <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative bg-white">
        <button
          onClick={() => setSelectedStudentPerf(null)}
          className="absolute top-6 right-6 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-indigo-600 text-xs font-bold uppercase tracking-wider">
            Student Performance Card
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            {selectedStudentPerf.student?.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {selectedStudentPerf.student?.email} • Batch:{" "}
            <span className="text-indigo-600 font-semibold">
              {selectedStudentPerf.student?.batch || "Unassigned"}
            </span>
          </p>
        </div>

        {/* Summary badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-2xl border border-slate-200 text-center mb-6">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Attempted
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {selectedStudentPerf.summary?.attemptsCount || 0}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Avg Score
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {selectedStudentPerf.summary?.avgScore || 0}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Best Score
            </div>
            <div className="text-2xl font-black text-purple-600 mt-1">
              {selectedStudentPerf.summary?.bestScore || 0}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Avg Accuracy
            </div>
            <div className="text-2xl font-black text-sky-600 mt-1">
              {selectedStudentPerf.summary?.avgAccuracy || 0}%
            </div>
          </div>
        </div>

        {/* Test History */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Test Attempt History
        </h4>
        {selectedStudentPerf.history?.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">
              No tests submitted yet
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedStudentPerf.history?.map((h) => (
              <div
                key={h._id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {h.mockId}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(h.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}{" "}
                    at{" "}
                    {new Date(h.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">
                    {h.score} / {h.total} marks
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Accuracy: {h.accuracy}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )}
</div>
  );
}
