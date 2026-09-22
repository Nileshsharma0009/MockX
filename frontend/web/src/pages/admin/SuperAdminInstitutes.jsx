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
    if (!user || (role !== "SUPER_ADMIN" && !(role === "ADMIN" && user.email === "admin@mockx.com"))) {
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
    <div className="institute-ui min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-600/30">
            MX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900">MockX Super Admin</h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                Platform Root
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Coaching Institute & Academy Fleet Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/v2/admin")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
          >
            Back to Admin Dashboard
          </button>
          <button
            onClick={() => navigate("/v2/admin")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
          >
            Merchant Dashboard
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors ml-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="inst-card border border-slate-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Total Institutes</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{institutes.length}</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">
              {institutes.filter((i) => i.status === "ACTIVE").length} Active
            </div>
          </div>

          <div className="inst-card border border-slate-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Total Students Enrolled</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{totalStudents}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Across all academies</div>
          </div>

          <div className="inst-card border border-slate-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Custom Mock Tests</span>
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{totalMocks}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Created by institutes</div>
          </div>

          <div className="inst-card border border-slate-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Total Test Attempts</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{totalAttempts}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Submissions recorded</div>
          </div>
        </div>

        {/* Action Header & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, email..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={loadInstitutes}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Institute</span>
            </button>
          </div>
        </div>

        {/* Institute Directory Cards */}
        {filteredInstitutes.length === 0 ? (
          <div className="inst-card border border-slate-200 rounded-3xl p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="font-bold text-slate-900 text-base">No Institutes Found</p>
            <p className="text-slate-400 text-xs mt-1">
              {searchQuery ? "No institute matches your search query." : "Get started by registering your first coaching institute."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                Register Institute
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredInstitutes.map((inst) => (
              <div
                key={inst._id}
                className="inst-card inst-card-hover border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top line: Logo, Code, Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {inst.logo ? (
                        <img
                          src={inst.logo}
                          alt={inst.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-200 bg-slate-800"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black flex items-center justify-center text-base">
                          {inst.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                          {inst.name}
                        </h3>
                        <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-[10px] font-bold mt-1">
                          {inst.code}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(inst)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                        inst.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20"
                      }`}
                      title="Click to toggle status"
                    >
                      {inst.status}
                    </button>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-200/80 pt-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{inst.email}</span>
                    </div>
                    {inst.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{inst.phone}</span>
                      </div>
                    )}
                    {inst.admin && (
                      <div className="flex items-center gap-2 text-indigo-700 font-medium pt-1">
                        <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Admin: {inst.admin.name} ({inst.admin.email})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom stats & action */}
                <div>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200 text-center mb-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Students</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">{inst.studentCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Mocks</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">{inst.mockCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Attempts</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">{inst.attemptCount || 0}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate("/v2/institute/login")}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Onboard Academy</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Create New Institute</h2>
              <p className="text-slate-400 text-xs mt-1">
                Creates the institute profile and provisions the Institute Admin login credentials.
              </p>
            </div>

            <form onSubmit={handleCreateInstitute} className="space-y-6">
              {/* Institute Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-3">
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
