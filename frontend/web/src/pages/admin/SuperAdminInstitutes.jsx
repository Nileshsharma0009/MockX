import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Plus,
  Search,
  Shield,
  Users,
  FileText,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  X,
  RefreshCw,
  Eye,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  getAllInstitutesApi,
  createInstituteApi,
  updateInstituteApi,
} from "../../api/institute.api";
import Loader from "../../components/Loader";

export default function SuperAdminInstitutes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    address: "",
    logo: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminPhone: "",
  });

  const loadInstitutes = async () => {
    setLoading(true);
    try {
      const res = await getAllInstitutesApi();
      setInstitutes(res.data || []);
    } catch (err) {
      console.error("Failed to load institutes:", err);
      toast.error("Failed to load institutes directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = (user?.role || "").toUpperCase();
    if (!user || role !== "SUPER_ADMIN") {
      toast.error("Access denied. Super Admin privileges required.");
      navigate("/v2/institute/login");
      return;
    }
    loadInstitutes();
  }, [user, navigate]);

  const handleCreateInstitute = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createInstituteApi(formData);
      toast.success("Institute and Admin account created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        code: "",
        email: "",
        phone: "",
        address: "",
        logo: "",
        adminName: "",
        adminEmail: "",
        adminPassword: "",
        adminPhone: "",
      });
      loadInstitutes();
    } catch (err) {
      console.error("Failed to create institute:", err);
      toast.error(err.response?.data?.message || "Failed to create institute");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (inst) => {
    const newStatus = inst.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await updateInstituteApi(inst._id, { status: newStatus });
      toast.success(`Institute status updated to ${newStatus}`);
      setInstitutes((prev) =>
        prev.map((i) => (i._id === inst._id ? { ...i, status: newStatus } : i))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    }
  };

  const filteredInstitutes = institutes.filter((inst) => {
    const q = searchQuery.toLowerCase();
    return (
      inst.name?.toLowerCase().includes(q) ||
      inst.code?.toLowerCase().includes(q) ||
      inst.email?.toLowerCase().includes(q) ||
      inst.admin?.name?.toLowerCase().includes(q)
    );
  });

  const totalStudents = institutes.reduce((sum, i) => sum + (i.studentCount || 0), 0);
  const totalMocks = institutes.reduce((sum, i) => sum + (i.mockCount || 0), 0);
  const totalAttempts = institutes.reduce((sum, i) => sum + (i.attemptCount || 0), 0);

  if (loading) return <Loader />;

  return (
    <div className="institute-ui min-h-screen  font :momo font-style: italic bg-slate-50 text-slate-800 pb-16">
      {/* Top Navbar */}
     <header className="mockx-site-header sticky top-0 z-30">
  <div className="mockx-site-header__inner mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:px-6 lg:px-8">

    {/* =====================================================
        BRAND
    ===================================================== */}
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">

      {/* MX Logo */}
      {/* <div className="mockx-site-brand-mark flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-medium sm:h-10 sm:w-10 sm:rounded-xl sm:text-sm">
        MX
      </div> */}

      {/* Title */}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">


          {/* <h1 className="truncate text-[10px] font-medium tracking-tight text-slate-900  sm:font-semibold">
            MockX Super Admin
          </h1> */}
<p className="truncate text-[14px]  tracking-tight text-slate-900 sm:text-sm sm:font-semibold">
  MockX Super Admin
</p>
          {/* Desktop badge */}
          <span className="hidden rounded-md border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[8px] uppercase tracking-wide text-indigo-700 sm:inline-flex sm:px-2 sm:text-[10px]">
            Platform administration
          </span>
        </div>

        {/* Desktop description */}
        <p className="mt-0.5 hidden text-[9px] text-slate-500 sm:block sm:text-[10px]">
          Manage the MockX platform
        </p>
      </div>
    </div>

    {/* =====================================================
        NAVIGATION
    ===================================================== */}
    <nav
      aria-label="Super admin navigation"
      className="flex shrink-0 items-center gap-1.5 sm:gap-2"
    >

      {/* Admin Dashboard */}
      {/* <button
        type="button"
        onClick={() => navigate("/v2/admin")}
        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[9px] text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-xs sm:font-medium"
      >
     

        <span className="hidden sm:inline">
          Admin Dashboard
        </span>
      </button> */}

      {/* Institutes */}
      <button
        type="button"
        aria-current="page"
        onClick={() => navigate("/v2/admin/")}
        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-indigo-600 px-2 text-[9px] text-white shadow-sm transition-colors hover:bg-indigo-700 sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-xs sm:font-medium"
      >
        {/* <Building2 className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" /> */}

      Admin
      </button>

      {/* Logout */}
      <button
        type="button"
        onClick={logout}
        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[9px] text-rose-600 transition-colors hover:border-rose-200 hover:bg-rose-50 sm:h-9 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:text-xs sm:font-medium"
      >
        <LogOut className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />

        <span>Logout</span>
      </button>
    </nav>
  </div>
</header>

      {/* Main Container */}
  <main className="mx-auto max-w-7xl px-3 pt-5 sm:px-6 sm:pt-8">
  {/* =========================================================
      METRIC CARDS
  ========================================================= */}
  <div className="mb-6 grid grid-cols-2 gap-2 sm:mb-8 sm:gap-4 lg:grid-cols-4">

    {/* Total Institutes */}
    <div className="inst-card min-w-0 rounded-xl border border-slate-200 p-3 shadow-sm sm:rounded-2xl sm:p-5 sm:shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-1 text-slate-500">
        <span className="min-w-0 text-[9px]  leading-tight sm:text-xs ">
          Total Institutes
        </span>

        <Building2 className="h-3.5 w-3.5 shrink-0 text-indigo-600 sm:h-4 sm:w-4" />
      </div>

      <div className="text-xl font- text-slate-900 sm:text-2xl ">
        {institutes.length}
      </div>

      <div className="mt-1 text-[9px] font-medium text-emerald-600 sm:text-[11px]">
        {institutes.filter((i) => i.status === "ACTIVE").length} Active
      </div>
    </div>

    {/* Total Students */}
    <div className="inst-card min-w-0 rounded-xl border border-slate-200 p-3 shadow-sm sm:rounded-2xl sm:p-5 sm:shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-1 text-slate-500">
        <span className="min-w-0 text-[9px]  leading-tight sm:text-xs ">
          Total Students Enrolled
        </span>

        <Users className="h-3.5 w-3.5 shrink-0 text-emerald-600 sm:h-4 sm:w-4" />
      </div>

      <div className="text-xl  text-slate-900 sm:text-3xl">
        {totalStudents}
      </div>

      <div className="mt-1 text-[9px] font-medium text-slate-500 sm:text-[11px]">
        Across all academies
      </div>
    </div>

    {/* Custom Mock Tests */}
    <div className="inst-card min-w-0 rounded-xl border border-slate-200 p-3 shadow-sm sm:rounded-2xl sm:p-5 sm:shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-1 text-slate-500">
        <span className="min-w-0 text-[9px]  leading-tight sm:text-xs ">
          Custom Mock Tests
        </span>

        <FileText className="h-3.5 w-3.5 shrink-0 text-purple-600 sm:h-4 sm:w-4" />
      </div>

      <div className="text-xl  text-slate-900 sm:text-3xl ">
        {totalMocks}
      </div>

      <div className="mt-1 text-[9px]  text-slate-500 sm:text-[11px]">
        Created by institutes
      </div>
    </div>

    {/* Total Test Attempts */}
    <div className="inst-card min-w-0 rounded-xl border border-slate-200 p-3 shadow-sm sm:rounded-2xl sm:p-5 sm:shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-1 text-slate-500">
        <span className="min-w-0 text-[9px]  leading-tight sm:text-xs ">
          Total Test Attempts
        </span>

        <Activity className="h-3.5 w-3.5 shrink-0 text-sky-600 sm:h-4 sm:w-4" />
      </div>

      <div className="text-xl  text-slate-900 sm:text-3xl ">
        {totalAttempts}
      </div>

      <div className="mt-1 text-[9px] text-slate-500 sm:text-[11px]">
        Submissions recorded
      </div>
    </div>
  </div>

  {/* =========================================================
      ACTION HEADER + SEARCH
  ========================================================= */}
  <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">

    {/* Search */}
    <div className="relative w-full sm:w-80">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 sm:left-3.5 sm:h-4 sm:w-4" />

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by name, code, email..."
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-[11px] text-slate-900 placeholder-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:pl-10 sm:pr-4 sm:text-xs"
      />
    </div>

    {/* Actions */}
    <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">

      <button
        onClick={loadInstitutes}
        className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition-colors hover:bg-slate-50 sm:p-2"
        title="Refresh"
      >
        <RefreshCw className="h-4 w-4" />
      </button>

      <button
        onClick={() => setShowCreateModal(true)}
        className="ml-auto flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-2.5 text-[11px]  text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-violet-500 sm:flex-none sm:px-4 sm:text-xs"
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span>Register New Institute</span>
      </button>
    </div>
  </div>

  {/* =========================================================
      EMPTY STATE
  ========================================================= */}
  {filteredInstitutes.length === 0 ? (
    <div className="inst-card rounded-2xl border border-slate-200 p-6 text-center shadow-sm sm:rounded-3xl sm:p-12">
      <Building2 className="mx-auto mb-3 h-10 w-10 text-slate-600 sm:h-12 sm:w-12" />

      <p className="text-sm  text-slate-900 sm:text-base">
        No Institutes Found
      </p>

      <p className="mx-auto mt-1 max-w-md text-[11px] leading-5 text-slate-500 sm:text-xs">
        {searchQuery
          ? "No institute matches your search query."
          : "Get started by registering your first coaching institute."}
      </p>

      {!searchQuery && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs  text-white transition-colors hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Register Institute
        </button>
      )}
    </div>
  ) : (

    /* =========================================================
       INSTITUTE DIRECTORY
    ========================================================= */
    <div className="admin-institute-directory grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-4">

      {filteredInstitutes.map((inst) => (
        <div
          key={inst._id}
          className="admin-institute-card inst-card group flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 p-4 shadow-sm transition-all hover:border-slate-300 sm:rounded-3xl sm:p-6"
        >
          <div className="min-w-0">

            {/* =================================================
                TOP LINE
            ================================================= */}
            <div className="mb-4 flex items-start justify-between gap-2 sm:gap-3">

              {/* Logo + Name */}
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">

                {inst.logo ? (
                  <img
                    src={inst.logo}
                    alt={inst.name}
                    className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover sm:h-12 sm:w-12 sm:rounded-2xl"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-sm font-black text-indigo-500 sm:h-12 sm:w-12 sm:rounded-2xl sm:text-base">
                    {inst.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="break-words text-sm  leading-snug text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-base">
                    {inst.name}
                  </h3>

                  <span className="mt-1 inline-block max-w-full break-all rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-indigo-700 sm:px-2 sm:text-[10px]">
                    {inst.code}
                  </span>
                </div>
              </div>

              {/* Status */}
              <button
                onClick={() => handleToggleStatus(inst)}
                className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-wide transition-all sm:px-2.5 sm:py-1 sm:text-[10px] ${
                  inst.status === "ACTIVE"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-500"
                    : "border-rose-500/20 bg-rose-500/10 text-rose-500 hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500"
                }`}
                title="Click to toggle status"
              >
                {inst.status}
              </button>
            </div>

            {/* =================================================
                CONTACT INFO
            ================================================= */}
            <div className="mb-4 space-y-2 border-t border-slate-200/80 pt-3 text-[11px] text-slate-500 sm:text-xs">

              {/* Email */}
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />

                <span className="min-w-0 break-all leading-4">
                  {inst.email}
                </span>
              </div>

              {/* Phone */}
              {inst.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />

                  <span className="break-words">
                    {inst.phone}
                  </span>
                </div>
              )}

              {/* Admin */}
              {inst.admin && (
                <div className="flex items-start gap-2 pt-1 font-medium text-indigo-700">
                  <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />

                  <span className="min-w-0 break-words leading-4">
                    Admin: {inst.admin.name}{" "}
                    <span className="text-slate-500">
                      ({inst.admin.email})
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              BOTTOM STATS + ACTION
          ================================================= */}
          <div>

            {/* Stats */}
            <div className="mb-3 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center sm:mb-4 sm:gap-2 sm:p-3">

              <div className="min-w-0">
                <div className="text-[8px] font-bold uppercase tracking-wide text-slate-500 sm:text-[10px]">
                  Students
                </div>

                <div className="mt-0.5 text-xs  text-slate-900 sm:text-sm">
                  {inst.studentCount || 0}
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-[8px] font-bold uppercase tracking-wide text-slate-500 sm:text-[10px]">
                  Mocks
                </div>

                <div className="mt-0.5 text-xs  text-slate-900 sm:text-sm">
                  {inst.mockCount || 0}
                </div>
              </div>

              <div className="min-w-0">
                <div className="text-[8px] font-bold uppercase tracking-wide text-slate-500 sm:text-[10px]">
                  Attempts
                </div>

                <div className="mt-0.5 text-xs  text-slate-900 sm:text-sm">
                  {inst.attemptCount || 0}
                </div>
              </div>
            </div>

            {/* Login Portal */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/v2/institute/login")}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:text-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Login Portal</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</main>

      {/* CREATE INSTITUTE MODAL */}
      {showCreateModal && (
        <div className="inst-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="inst-modal-panel border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-xs font-semibold mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Onboard Academy</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Create New Institute</h2>
              <p className="text-slate-500 text-xs mt-1">
                Creates the institute profile and provisions the Institute Admin login credentials.
              </p>
            </div>

            <form onSubmit={handleCreateInstitute} className="space-y-6">
              {/* Institute Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">
                  1. Institute Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Institute Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex IIT Academy"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Unique Institute Code * (e.g. APEX01)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="APEX01"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Institute Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contact@apexacademy.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Institute Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Campus Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Plot 14, Knowledge Corridor, Kota, Rajasthan"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Logo URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Details */}
              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-3">
                  2. Institute Admin Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. R. K. Sharma"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Admin Email (Username) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@apexacademy.com"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Admin Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {creating ? "Creating Institute..." : "Create Institute & Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
