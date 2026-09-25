import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileQuestion,
  FileText,
  FileSpreadsheet,
  Send,
  BarChart3,
  Menu,
  LogOut,
  Building2,
  Plus,
  Award,
  ChevronRight,
  TrendingUp,
  X,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  getInstituteDashboardStatsApi,
  getBatchesApi,
  getStudentsApi,
  getQuestionBankApi,
  getInstituteMocksApi,
  getAssignmentsApi,
  getStudentWiseAnalyticsApi,
  getTestWiseAnalyticsApi,
  getQuestionWiseAnalyticsApi,
  getInstituteResultsApi,
} from "../../api/institute.api";
import Loader from "../../components/Loader";
import InstituteResultsReport from "./InstituteResultsReport";
import InstituteQuestionBanks from "./InstituteQuestionBanks";
import StudentsAndBatchesSection from "./InstituteStudentsSection";
import CustomMocksSection from "./InstituteMocksSection";
import TestAssignmentsSection from "./InstituteAssignmentsSection";
import AnalyticsSection from "./InstituteAnalyticsSection";


export default function InstitutePortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, students, questions, mocks, assignments, results, analytics
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [analyticsSubTab, setAnalyticsSubTab] = useState("student"); // student, test, question

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadedSectionsRef = useRef({});
  const questionAnalyticsCacheRef = useRef({});
  const [resultsReport, setResultsReport] = useState(null);
  const [resultsReportLoading, setResultsReportLoading] = useState(true);
  const [resultsReportError, setResultsReportError] = useState("");

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
    if (activeTab === "students" && !loadedSectionsRef.current.students) {
      loadBatchesAndStudents({ force: false });
    } else if (
      activeTab === "questions" &&
      !loadedSectionsRef.current.questions
    ) {
      loadQuestionBank();
    } else if (activeTab === "mocks" && !loadedSectionsRef.current.mocks) {
      loadMocks();
    } else if (
      activeTab === "assignments" &&
      !loadedSectionsRef.current.assignments
    ) {
      loadAssignments({ force: false });
    } else if (
      activeTab === "analytics" &&
      !loadedSectionsRef.current.analytics
    ) {
      loadAnalytics({ force: false });
    } else if (activeTab === "results" && !loadedSectionsRef.current.results) {
      loadResultsReport();
    }
  }, [activeTab, user]);

  const loadBatchesAndStudents = async ({ force = true } = {}) => {
    try {
      const [bRes, sRes] = await Promise.all([
        !force && loadedSectionsRef.current.batches
          ? Promise.resolve({ data: batches })
          : getBatchesApi(),
        getStudentsApi(),
      ]);
      setBatches(bRes.data || []);
      setStudents(sRes.data || []);
      loadedSectionsRef.current.students = true;
      loadedSectionsRef.current.batches = true;
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  const loadQuestionBank = async () => {
    try {
      const res = await getQuestionBankApi();
      setQuestions(res.data || []);
      loadedSectionsRef.current.questions = true;
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  };

  const loadMocks = async () => {
    try {
      const res = await getInstituteMocksApi();
      setMocks(res.data || []);
      loadedSectionsRef.current.mocks = true;
    } catch (err) {
      console.error("Failed to load mocks:", err);
    }
  };

  const loadAssignments = async ({ force = true } = {}) => {
    try {
      const [aRes, mRes, bRes] = await Promise.all([
        getAssignmentsApi(),
        !force && loadedSectionsRef.current.mocks
          ? Promise.resolve({ data: mocks })
          : getInstituteMocksApi(),
        !force && loadedSectionsRef.current.batches
          ? Promise.resolve({ data: batches })
          : getBatchesApi(),
      ]);
      setAssignments(aRes.data || []);
      setMocks(mRes.data || []);
      setBatches(bRes.data || []);
      loadedSectionsRef.current.assignments = true;
      loadedSectionsRef.current.mocks = true;
      loadedSectionsRef.current.batches = true;
    } catch (err) {
      console.error("Failed to load assignments:", err);
    }
  };

  const loadAnalytics = async ({ force = true } = {}) => {
    try {
      const [sRes, tRes, mRes] = await Promise.all([
        getStudentWiseAnalyticsApi(),
        getTestWiseAnalyticsApi(),
        !force && loadedSectionsRef.current.mocks
          ? Promise.resolve({ data: mocks })
          : getInstituteMocksApi(),
      ]);
      setStudentAnalytics(sRes.data || []);
      setTestAnalytics(tRes.data || []);
      setMocks(mRes.data || []);
      loadedSectionsRef.current.analytics = true;
      loadedSectionsRef.current.mocks = true;
      if (mRes.data?.length > 0 && !selectedMockForQAnalytics) {
        setSelectedMockForQAnalytics(mRes.data[0]._id);
        loadQuestionWise(mRes.data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  const loadQuestionWise = async (mockId) => {
    if (questionAnalyticsCacheRef.current[mockId]) {
      setQuestionAnalytics(questionAnalyticsCacheRef.current[mockId]);
      return;
    }
    try {
      const res = await getQuestionWiseAnalyticsApi(mockId);
      setQuestionAnalytics(res.data);
      questionAnalyticsCacheRef.current[mockId] = res.data;
    } catch (err) {
      console.error("Failed to load question analytics:", err);
    }
  };

  const loadResultsReport = async () => {
    setResultsReportLoading(true);
    setResultsReportError("");
    try {
      const response = await getInstituteResultsApi();
      setResultsReport(
        response.data || { batches: [], students: [], mocks: [], results: [] },
      );
      loadedSectionsRef.current.results = true;
    } catch (error) {
      setResultsReportError(
        error.response?.data?.message || "Could not load institute results.",
      );
    } finally {
      setResultsReportLoading(false);
    }
  };

  if (loading && !dashboardData) return <Loader />;

  const institute = dashboardData?.institute || {
    name: "Institute Portal",
    code: "INST",
  };
  const stats = dashboardData?.stats || {};

  return (
    <div className="institute-ui min-h-screen bg-slate-50 text-slate-300 font-momo font-style: italic flex flex-col md:flex-row">
   <header className="inst-mobile-topbar sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
  {/* Institute branding */}
  <div className="flex min-w-0 items-center gap-2.5">
    {institute.logo ? (
      <img
        src={institute.logo}
        alt={institute.name}
        className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-slate-100 object-cover"
      />
    ) : (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
        {institute.name.charAt(0)}
      </div>
    )}

    <div className="min-w-0">
      <h2 className="truncate text-sm font-bold text-slate-900">
        {institute.name}
      </h2>

      <span className="text-[9px] font-medium text-slate-500">
        {institute.code}
      </span>
    </div>
  </div>

  {/* Mobile menu */}
  <button
    type="button"
    onClick={() => setMobileMenuOpen((open) => !open)}
    className="ml-3 shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm"
    aria-label={
      mobileMenuOpen
        ? "Close navigation menu"
        : "Open navigation menu"
    }
    aria-expanded={mobileMenuOpen}
  >
    {mobileMenuOpen ? (
      <X className="h-5 w-5" />
    ) : (
      <Menu className="h-5 w-5" />
    )}
  </button>
</header>

      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      {/* ----------------- SIDEBAR ----------------- */}
      <aside
        className={`inst-sidebar p-5 flex flex-col justify-between shrink-0 ${mobileMenuOpen ? "fixed inset-y-0 left-0 z-50 flex w-[85vw] max-w-xs shadow-xl" : "hidden"} md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shadow-none`}
      >
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
              <h2 className=" text-[9px] text-slate-900 truncate">
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
              { id: "results", label: "Results Report", icon: FileSpreadsheet },
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
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
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
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-x-hidden">
        {/* ======================= TAB 1: DASHBOARD ======================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-oklch(12.9% 0.042 264.695)  text-slate-900 tracking-tight">
                Institute Dashboard
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Overview of enrolled students, active exams, and overall batch
                performance.
              </p>
            </div>
{/*  */}
     <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">

  {/* Enrolled Students */}
  <div
    className="
      group relative min-w-0 overflow-hidden
      border border-slate-200 bg-white
      p-2
      shadow-[5px_5px_0px_#12052b]
      transition-all duration-300
      hover:-translate-y-1
      hover:border-indigo-300
      hover:shadow-[7px_7px_0px_#12052b]
      sm:p-5 lg:p-6
      [clip-path:polygon(8%_0,100%_0,100%_90%,92%_100%,0_100%,0_10%)]
    "
  >
    <div className="flex items-start justify-between gap-1">
      <div className="min-w-0">
        <p className="truncate text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
          Enrolled Students
        </p>

        <p className="mt-0.5 text-lg font-medium tracking-tight text-slate-900 sm:mt-1 sm:text-2xl">
          {stats.studentsCount || 0}
        </p>
      </div>

      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-indigo-50 sm:h-11 sm:w-11">
        <Users className="h-3.5 w-3.5 text-indigo-600 sm:h-5 sm:w-5" />
      </div>
    </div>

    <div className="mt-2 flex min-w-0 items-center gap-1 sm:mt-4 sm:gap-2">
      <span className="h-1 w-1 shrink-0 rounded-full bg-indigo-500 sm:h-2 sm:w-2" />
      <p className="truncate text-[9px] font-medium text-slate-600 sm:text-sm">
        In {stats.batchesCount || 0} batches
      </p>
    </div>
  </div>


  {/* Mock Tests */}
  <div
    className="
      group relative min-w-0 overflow-hidden
      border border-slate-200 bg-white
      p-2
      shadow-[5px_5px_0px_#12052b]
      transition-all duration-300
      hover:-translate-y-1
      hover:border-violet-300
      hover:shadow-[7px_7px_0px_#12052b]
      sm:p-5 lg:p-6
      [clip-path:polygon(8%_0,100%_0,100%_90%,92%_100%,0_100%,0_10%)]
    "
  >
    <div className="flex items-start justify-between gap-1">
      <div className="min-w-0">
        <p className="truncate text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
          Mock Tests
        </p>

        <p className="mt-0.5 text-lg font-medium tracking-tight text-slate-900 sm:mt-1 sm:text-2xl">
          {stats.mocksCount || 0}
        </p>
      </div>

      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-violet-50 sm:h-11 sm:w-11">
        <FileText className="h-3.5 w-3.5 text-violet-600 sm:h-5 sm:w-5" />
      </div>
    </div>

    <div className="mt-2 flex min-w-0 items-center gap-1 sm:mt-4 sm:gap-2">
      <span className="h-1 w-1 shrink-0 rounded-full bg-violet-500 sm:h-2 sm:w-2" />
      <p className="truncate text-[9px] font-medium text-slate-600 sm:text-sm">
        {stats.activeAssignmentsCount || 0} active
      </p>
    </div>
  </div>


  {/* Total Attempts */}
  <div
    className="
      group relative min-w-0 overflow-hidden
      border border-slate-200 bg-white
      p-2
      shadow-[5px_5px_0px_#12052b]
      transition-all duration-300
      hover:-translate-y-1
      hover:border-emerald-300
      hover:shadow-[7px_7px_0px_#12052b]
      sm:p-5 lg:p-6
      [clip-path:polygon(8%_0,100%_0,100%_90%,92%_100%,0_100%,0_10%)]
    "
  >
    <div className="flex items-start justify-between gap-1">
      <div className="min-w-0">
        <p className="truncate text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
          Total Attempts
        </p>

        <p className="mt-0.5 text-lg font-medium tracking-tight text-slate-900 sm:mt-1 sm:text-2xl">
          {stats.totalAttempts || 0}
        </p>
      </div>

      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-emerald-50 sm:h-11 sm:w-11">
        <Award className="h-3.5 w-3.5 text-emerald-600 sm:h-5 sm:w-5" />
      </div>
    </div>

    <div className="mt-2 flex min-w-0 items-center gap-1 sm:mt-4 sm:gap-2">
      <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-500 sm:h-2 sm:w-2" />
      <p className="truncate text-[9px] font-medium text-slate-600 sm:text-sm">
        Completed submissions
      </p>
    </div>
  </div>


  {/* Average Accuracy */}
  <div
    className="
      group relative min-w-0 overflow-hidden
      border border-slate-200 bg-white
      p-2
      shadow-[5px_5px_0px_#12052b]
      transition-all duration-300
      hover:-translate-y-1
      hover:border-amber-300
      hover:shadow-[7px_7px_0px_#12052b]
      sm:p-5 lg:p-6
      [clip-path:polygon(8%_0,100%_0,100%_90%,92%_100%,0_100%,0_10%)]
    "
  >
    <div className="flex items-start justify-between gap-1">
      <div className="min-w-0">
        <p className="truncate text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
          Avg Accuracy
        </p>

        <p className="mt-0.5 text-lg font-medium tracking-tight text-slate-900 sm:mt-1 sm:text-2xl">
          {stats.avgAccuracy || 0}%
        </p>
      </div>

      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-amber-50 sm:h-11 sm:w-11">
        <TrendingUp className="h-3.5 w-3.5 text-amber-600 sm:h-5 sm:w-5" />
      </div>
    </div>

    <div className="mt-2 flex min-w-0 items-center gap-1 sm:mt-4 sm:gap-2">
      <span className="h-1 w-1 shrink-0 rounded-full bg-amber-500 sm:h-2 sm:w-2" />

      <p className="truncate text-[9px] font-medium text-slate-600 sm:text-sm">
        Avg Score: {stats.avgScore || 0}
      </p>
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


            {/* <div className="inst-card border border-slate-200 rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Recent Test Attempts
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className="group flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <span>View All Analytics</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {dashboardData?.recentAttempts?.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <FileText className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    No test attempts yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Once students take tests, their scores will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {dashboardData?.recentAttempts?.map((att) => (
                    <div
                      key={att._id}
                      className="group py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
                          <span className="text-xs font-bold text-slate-600">
                            {att.studentName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {att.studentName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-slate-500">
                              {att.studentEmail}
                            </p>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
                              {att.batch}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-bold text-emerald-600">
                            {att.score}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            / {att.total}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(att.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div> */}
          </div>
        )}

        {/* ======================= TAB 2: STUDENTS & BATCHES ======================= */}
        {activeTab === "students" && (
          <StudentsAndBatchesSection
            batches={batches}
            students={students}
            selectedBatch={selectedBatchFilter}
            setSelectedBatch={setSelectedBatchFilter}
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
          <InstituteQuestionBanks
            questions={questions}
            instituteName={institute.name}
            onRefresh={loadQuestionBank}
          />
        )}

        {/* ======================= TAB 4: CUSTOM MOCK TESTS ======================= */}
        {activeTab === "mocks" && (
          <CustomMocksSection
            mocks={mocks}
            instituteName={institute.name}
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

        {activeTab === "results" && (
          <InstituteResultsReport
            instituteName={institute.name}
            report={resultsReport}
            loading={resultsReportLoading}
            error={resultsReportError}
            onRefresh={loadResultsReport}
          />
        )}

        {/* ======================= TAB 7: INSTITUTE ANALYTICS ======================= */}
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
