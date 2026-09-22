import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileQuestion,
  FileText,
  Send,
  BarChart3,
  LogOut,
  Building2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  X,
  RefreshCw,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  Calendar,
  Layers,
  Upload,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  getInstituteDashboardStatsApi,
  getBatchesApi,
  createBatchApi,
  deleteBatchApi,
  getStudentsApi,
  createStudentApi,
  bulkCreateStudentsApi,
  toggleStudentStatusApi,
  deleteStudentApi,
  getStudentPerformanceApi,
  getQuestionBankApi,
  createQuestionApi,
  deleteQuestionApi,
  createCustomMockApi,
  getInstituteMocksApi,
  deleteCustomMockApi,
  createAssignmentApi,
  getAssignmentsApi,
  deleteAssignmentApi,
  getStudentWiseAnalyticsApi,
  getTestWiseAnalyticsApi,
  getQuestionWiseAnalyticsApi,
} from "../../api/institute.api";
import Loader from "../../components/Loader";

export default function InstitutePortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, students, questions, mocks, assignments, analytics
  const [analyticsSubTab, setAnalyticsSubTab] = useState("student"); // student, test, question

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Batches & Students
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showBulkStudentModal, setShowBulkStudentModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [selectedStudentPerf, setSelectedStudentPerf] = useState(null);

  // Question Bank
  const [questions, setQuestions] = useState([]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // Custom Mocks
  const [mocks, setMocks] = useState([]);
  const [showCreateMockModal, setShowCreateMockModal] = useState(false);

  // Test Assignments
  const [assignments, setAssignments] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Analytics
  const [studentAnalytics, setStudentAnalytics] = useState([]);
  const [testAnalytics, setTestAnalytics] = useState([]);
  const [questionAnalytics, setQuestionAnalytics] = useState(null);
  const [selectedMockForQAnalytics, setSelectedMockForQAnalytics] =
    useState("");

  /* ------------------- Initial Load ------------------- */
  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await getInstituteDashboardStatsApi();
      setDashboardData(res.data);
    } catch (err) {
      console.error("Dashboard load failed:", err);
      toast.error("Failed to load institute dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (user?.role || "").toUpperCase();
    if (!user || role !== "INSTITUTE_ADMIN") {
      toast.error("Access denied. Institute Admin login required.");
      navigate("/v2/institute/login");
      return;
    }
    loadDashboard();
  }, [user, navigate]);

  // Tab change triggers
  useEffect(() => {
    if (!user) return;
    if (activeTab === "students") {
      loadBatchesAndStudents();
    } else if (activeTab === "questions") {
      loadQuestionBank();
    } else if (activeTab === "mocks") {
      loadMocks();
    } else if (activeTab === "assignments") {
      loadAssignments();
    } else if (activeTab === "analytics") {
      loadAnalytics();
    }
  }, [activeTab, user]);

  const loadBatchesAndStudents = async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        getBatchesApi(),
        getStudentsApi({ batch: selectedBatchFilter }),
      ]);
      setBatches(bRes.data || []);
      setStudents(sRes.data || []);
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const loadQuestionBank = async () => {
    try {
      const res = await getQuestionBankApi();
      setQuestions(res.data || []);
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  };

  const loadMocks = async () => {
    try {
      const res = await getInstituteMocksApi();
      setMocks(res.data || []);
    } catch (err) {
      console.error("Failed to load mocks:", err);
    }
  };

  const loadAssignments = async () => {
    try {
      const [aRes, mRes, bRes] = await Promise.all([
        getAssignmentsApi(),
        getInstituteMocksApi(),
        getBatchesApi(),
      ]);
      setAssignments(aRes.data || []);
      setMocks(mRes.data || []);
      setBatches(bRes.data || []);
    } catch (err) {
      console.error("Failed to load assignments:", err);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [sRes, tRes, mRes] = await Promise.all([
        getStudentWiseAnalyticsApi(),
        getTestWiseAnalyticsApi(),
        getInstituteMocksApi(),
      ]);
      setStudentAnalytics(sRes.data || []);
      setTestAnalytics(tRes.data || []);
      setMocks(mRes.data || []);
      if (mRes.data?.length > 0 && !selectedMockForQAnalytics) {
        setSelectedMockForQAnalytics(mRes.data[0]._id);
        loadQuestionWise(mRes.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  const loadQuestionWise = async (mockId) => {
    try {
      const res = await getQuestionWiseAnalyticsApi(mockId);
      setQuestionAnalytics(res.data);
    } catch (err) {
      console.error("Failed to load question analytics:", err);
    }
  };

  if (loading && !dashboardData) return <Loader />;

  const institute = dashboardData?.institute || {
    name: "Institute Portal",
    code: "INST",
  };
  const stats = dashboardData?.stats || {};

  return (
    <div className="institute-ui min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row">
      {/* ----------------- SIDEBAR ----------------- */}
      <aside className="inst-sidebar w-full md:w-64 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Institute Branding */}
          <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-200">
            {institute.logo ? (
              <img
                src={institute.logo}
                alt={institute.name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30 shrink-0">
                {institute.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm text-slate-900 truncate">
                {institute.name}
              </h2>
              <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold mt-0.5">
                {institute.code}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "students", label: "Students & Batches", icon: Users },
              { id: "questions", label: "Question Bank", icon: FileQuestion },
              { id: "mocks", label: "Custom Mocks", icon: FileText },
              { id: "assignments", label: "Test Assignments", icon: Send },
              {
                id: "analytics",
                label: "Institute Analytics",
                icon: BarChart3,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive ? "inst-nav-active" : "inst-nav-idle"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="pt-4 border-t border-slate-200 mt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ----------------- MAIN CONTENT AREA ----------------- */}
      <main className="flex-1 min-w-0 p-6 md:p-8 overflow-y-auto">
        {/* ======================= TAB 1: DASHBOARD ======================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Institute Dashboard
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Overview of enrolled students, active exams, and overall batch
                performance.
              </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="inst-card border border-slate-200 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Enrolled Students</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {stats.studentsCount || 0}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  In {stats.batchesCount || 0} batches
                </div>
              </div>

              <div className="inst-card border border-slate-200 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Custom Mock Tests</span>
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {stats.mocksCount || 0}
                </div>
                <div className="text-[11px] text-purple-400 font-medium mt-1">
                  {stats.activeAssignmentsCount || 0} active assignments
                </div>
              </div>

              <div className="inst-card border border-slate-200 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Total Attempts</span>
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {stats.totalAttempts || 0}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">
                  Completed submissions
                </div>
              </div>

              <div className="inst-card border border-slate-200 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Average Accuracy</span>
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-slate-900">
                  {stats.avgAccuracy || 0}%
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  Avg Score: {stats.avgScore || 0}
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-gradient-to-r from-indigo-50 via-violet-50 to-white border border-indigo-100 rounded-3xl p-6">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Quick Actions</span>
              </div>
              <p className="text-slate-900 font-extrabold text-sm mb-4">
                What would you like to set up today?
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setActiveTab("students");
                    setShowAddStudentModal(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>Add New Student</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("mocks");
                    setShowCreateMockModal(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Build Custom Mock</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("assignments");
                    setShowAssignModal(true);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-purple-400" />
                  <span>Assign Test to Batch</span>
                </button>
              </div>
            </div>

            {/* Recent Attempts Stream */}
            <div className="inst-card border border-slate-200 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-base">
                  Recent Test Attempts
                </h3>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>View All Analytics</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {dashboardData?.recentAttempts?.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No test attempts submitted yet. Once students take tests,
                  their scores will stream here live.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {dashboardData?.recentAttempts?.map((att) => (
                    <div
                      key={att._id}
                      className="py-3.5 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-xs">
                          {att.studentName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {att.studentEmail} •{" "}
                          <span className="text-indigo-400 font-medium">
                            {att.batch}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-emerald-400">
                          {att.score} / {att.total}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(att.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB 2: STUDENTS & BATCHES ======================= */}
        {activeTab === "students" && (
          <StudentsAndBatchesSection
            batches={batches}
            students={students}
            selectedBatch={selectedBatchFilter}
            setSelectedBatch={(b) => {
              setSelectedBatchFilter(b);
              getStudentsApi({ batch: b }).then((res) =>
                setStudents(res.data || []),
              );
            }}
            searchQuery={studentSearch}
            setSearchQuery={setStudentSearch}
            onRefresh={loadBatchesAndStudents}
            showAddStudentModal={showAddStudentModal}
            setShowAddStudentModal={setShowAddStudentModal}
            showBulkStudentModal={showBulkStudentModal}
            setShowBulkStudentModal={setShowBulkStudentModal}
            showAddBatchModal={showAddBatchModal}
            setShowAddBatchModal={setShowAddBatchModal}
            selectedStudentPerf={selectedStudentPerf}
            setSelectedStudentPerf={setSelectedStudentPerf}
          />
        )}

        {/* ======================= TAB 3: QUESTION BANK ======================= */}
        {activeTab === "questions" && (
          <QuestionBankSection
            questions={questions}
            searchQuery={questionSearch}
            setSearchQuery={setQuestionSearch}
            onRefresh={loadQuestionBank}
            showAddModal={showAddQuestionModal}
            setShowAddModal={setShowAddQuestionModal}
          />
        )}

        {/* ======================= TAB 4: CUSTOM MOCK TESTS ======================= */}
        {activeTab === "mocks" && (
          <CustomMocksSection
            mocks={mocks}
            onRefresh={loadMocks}
            showCreateModal={showCreateMockModal}
            setShowCreateModal={setShowCreateMockModal}
            questionsBank={questions}
          />
        )}

        {/* ======================= TAB 5: TEST ASSIGNMENTS ======================= */}
        {activeTab === "assignments" && (
          <TestAssignmentsSection
            assignments={assignments}
            mocks={mocks}
            batches={batches}
            onRefresh={loadAssignments}
            showAssignModal={showAssignModal}
            setShowAssignModal={setShowAssignModal}
          />
        )}

        {/* ======================= TAB 6: INSTITUTE ANALYTICS ======================= */}
        {activeTab === "analytics" && (
          <AnalyticsSection
            subTab={analyticsSubTab}
            setSubTab={setAnalyticsSubTab}
            studentAnalytics={studentAnalytics}
            testAnalytics={testAnalytics}
            questionAnalytics={questionAnalytics}
            mocks={mocks}
            selectedMock={selectedMockForQAnalytics}
            onSelectMock={(mId) => {
              setSelectedMockForQAnalytics(mId);
              loadQuestionWise(mId);
            }}
          />
        )}
      </main>
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: STUDENTS & BATCHES SECTION
   ========================================================================== */
function StudentsAndBatchesSection({
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
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentRollNo?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Students & Batches
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Organize students into batches and manage their individual
            credentials and exam performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddBatchModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>New Batch</span>
          </button>
          <button
            onClick={() => setShowBulkStudentModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-all flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-sky-400" />
            <span>Bulk CSV</span>
          </button>
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Batches Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <button
          onClick={() => setSelectedBatch("")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
            selectedBatch === ""
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:text-indigo-700 border border-slate-200"
          }`}
        >
          All Students ({students.length})
        </button>
        {batches.map((b) => (
          <div key={b._id} className="inline-flex items-center gap-1 shrink-0">
            <button
              onClick={() => setSelectedBatch(b.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedBatch === b.name
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:text-indigo-700 border border-slate-200"
              }`}
            >
              {b.name} ({b.studentCount || 0})
            </button>
            <button
              onClick={() => handleDeleteBatch(b._id)}
              className="text-slate-400 hover:text-rose-500 p-1"
              title="Delete batch"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by name, email, roll no..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Students Table */}
      <div className="inst-card border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-5">Student</th>
              <th className="py-3.5 px-4">Batch</th>
              <th className="py-3.5 px-4">Roll No</th>
              <th className="py-3.5 px-4">Tests Taken</th>
              <th className="py-3.5 px-4">Avg Score</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  No students found. Add a student or import via CSV.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s) => (
                <tr
                  key={s._id}
                  className="hover:bg-slate-100/30 transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-extrabold text-slate-900">
                      {s.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{s.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-indigo-300">
                    {s.batch || "-"}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {s.studentRollNo || "-"}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {s.attemptsCount || 0}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">
                    {s.avgScore || 0}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        s.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right space-x-1.5">
                    <button
                      onClick={() => handleViewPerformance(s._id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                      title="View Performance History"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(s._id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                      title={
                        s.status === "ACTIVE"
                          ? "Suspend student"
                          : "Activate student"
                      }
                    >
                      {s.status === "ACTIVE" ? (
                        <UserX className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(s._id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300"
                      title="Delete student"
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

      {/* CREATE STUDENT MODAL */}
      {showAddStudentModal && (
        <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-lg relative">
            <button
              onClick={() => setShowAddStudentModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Add Single Student
            </h3>
            <form onSubmit={handleCreateStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Batch
                  </label>
                  <select
                    value={newStudent.batch}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, batch: e.target.value })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
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
        <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-lg relative">
            <button
              onClick={() => setShowBulkStudentModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Bulk CSV Student Import
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Paste lines in format:{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-300">
                Name, Email, Password, Phone, Batch, RollNo
              </code>
            </p>

            <form onSubmit={handleBulkCreate} className="space-y-3.5">
              <textarea
                rows="7"
                required
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                placeholder="Aryan Patel, aryan@apex.edu, student123, 9876543210, Morning Stars (JEE-26), APEX-01&#10;Priya Sharma, priya@apex.edu, student123, 9876543211, Morning Stars (JEE-26), APEX-02"
                className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkStudentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
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
        <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-lg relative">
            <button
              onClick={() => setShowAddBatchModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Create New Batch
            </h3>
            <form onSubmit={handleCreateBatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JEE 2026 Droppers"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Intensive weekend problem solving"
                  value={newBatchDesc}
                  onChange={(e) => setNewBatchDesc(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
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
        <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-lg relative">
            <button
              onClick={() => setSelectedStudentPerf(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
                Student Performance Card
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                {selectedStudentPerf.student?.name}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {selectedStudentPerf.student?.email} • Batch:{" "}
                <span className="text-indigo-300 font-bold">
                  {selectedStudentPerf.student?.batch || "Unassigned"}
                </span>
              </p>
            </div>

            {/* Summary badges */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center mb-6">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Attempted
                </div>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {selectedStudentPerf.summary?.attemptsCount || 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Avg Score
                </div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">
                  {selectedStudentPerf.summary?.avgScore || 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Best Score
                </div>
                <div className="text-lg font-black text-purple-400 mt-0.5">
                  {selectedStudentPerf.summary?.bestScore || 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  Avg Accuracy
                </div>
                <div className="text-lg font-black text-sky-400 mt-0.5">
                  {selectedStudentPerf.summary?.avgAccuracy || 0}%
                </div>
              </div>
            </div>

            {/* Test History */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Test Attempt History
            </h4>
            {selectedStudentPerf.history?.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">
                No tests submitted yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {selectedStudentPerf.history?.map((h) => (
                  <div
                    key={h._id}
                    className="p-3.5 rounded-2xl bg-slate-100/50 border border-slate-200/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {h.mockId}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(h.createdAt).toLocaleDateString()} at{" "}
                        {new Date(h.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-400">
                        {h.score} / {h.total} marks ({h.percentage}%)
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        Accuracy: {h.accuracy}%
                      </div>
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

/* ==========================================================================
   SUB-COMPONENT: QUESTION BANK SECTION
   ========================================================================== */
function QuestionBankSection({
  questions,
  searchQuery,
  setSearchQuery,
  onRefresh,
  showAddModal,
  setShowAddModal,
}) {
  const [newQ, setNewQ] = useState({
    section: "phy",
    subject: "physics",
    question: "",
    options: ["", "", "", ""],
    correctOption: 0,
    marks: 4,
    negativeMarks: 1,
  });

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await createQuestionApi(newQ);
      toast.success("Question added to private question bank!");
      setShowAddModal(false);
      setNewQ({
        section: "phy",
        subject: "physics",
        question: "",
        options: ["", "", "", ""],
        correctOption: 0,
        marks: 4,
        negativeMarks: 1,
      });
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add question");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove question from bank?")) return;
    try {
      await deleteQuestionApi(id);
      toast.success("Question removed");
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete question");
    }
  };

  const filtered = questions.filter((q) =>
    q.question?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Institute Question Bank
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Private repository of questions exclusive to your academy. Institute
            B cannot see these questions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search question text..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="inst-card border border-slate-200 rounded-3xl p-12 text-center text-slate-500 text-xs">
            No questions in your bank yet. Click "Add Question" to start
            building your private exam vault.
          </div>
        ) : (
          filtered.map((q, idx) => (
            <div
              key={q._id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg relative group"
            >
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    Q{idx + 1}.
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold text-[10px] uppercase">
                    {q.section} • {q.subject}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    +{q.marks} / -{q.negativeMarks} marks
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(q._id)}
                  className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="font-semibold text-slate-800 text-sm leading-relaxed mb-4">
                {q.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options?.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.correctOption;
                  return (
                    <div
                      key={oIdx}
                      className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 border ${
                        isCorrect
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-bold"
                          : "bg-slate-100/40 border-slate-200/50 text-slate-600"
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD QUESTION MODAL */}
      {showAddModal && (
        <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-xl p-6 shadow-lg relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Add Private Question
            </h3>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Section ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. phy, chem, math"
                    value={newQ.section}
                    onChange={(e) =>
                      setNewQ({ ...newQ, section: e.target.value })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="physics"
                    value={newQ.subject}
                    onChange={(e) =>
                      setNewQ({ ...newQ, subject: e.target.value })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Question Text *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Enter problem statement..."
                  value={newQ.question}
                  onChange={(e) =>
                    setNewQ({ ...newQ, question: e.target.value })
                  }
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs text-slate-900"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Options (Select Correct)
                </label>
                {newQ.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={newQ.correctOption === i}
                      onChange={() => setNewQ({ ...newQ, correctOption: i })}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newQ.options];
                        newOpts[i] = e.target.value;
                        setNewQ({ ...newQ, options: newOpts });
                      }}
                      className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Marks (+)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newQ.marks}
                    onChange={(e) =>
                      setNewQ({ ...newQ, marks: Number(e.target.value) })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Negative Marks (-)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newQ.negativeMarks}
                    onChange={(e) =>
                      setNewQ({
                        ...newQ,
                        negativeMarks: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save to Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   SUB-COMPONENT: CUSTOM MOCK TESTS SECTION
   ========================================================================== */
function CustomMocksSection({
  mocks,
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
          name: String(sec.name || sec.id || "").trim() || `Section ${index + 1}`,
          questionCount: Number(sec.questionCount || 0),
        };
      });

    const validSectionIds = new Set(sanitizedSections.map((s) => s.id));
    const normalizedQuestions = mockForm.questions.map((q, index) => {
      const matchedSection = sanitizedSections.find((sec) => sec.id === q.section || sec.name === q.section);
      return {
        ...q,
        section: matchedSection ? matchedSection.id : sanitizedSections[index % sanitizedSections.length]?.id || "section1",
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

                          const updatedQuestions = mockForm.questions.map((q) =>
                            q.section === previousId
                              ? { ...q, section: normalizeSectionId(nextValue, idx) }
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
                            const fallbackSection = updated[0]?.id || "section1";
                            const adjustedQuestions = mockForm.questions.map((q) =>
                              q.section === removedId ? { ...q, section: fallbackSection } : q,
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

/* ==========================================================================
   SUB-COMPONENT: TEST ASSIGNMENTS SECTION
   ========================================================================== */
function TestAssignmentsSection({
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

/* ==========================================================================
   SUB-COMPONENT: MULTI-DIMENSIONAL ANALYTICS SECTION
   ========================================================================== */
function AnalyticsSection({
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
