import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Eye, EyeOff, X, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "../styles/auth-modal.css";

export default function LoginModal({ onClose, onOpenRegister }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      const loggedUser = await login(email, password); // 🔥 updates UI instantly
      onClose(); // close modal

      const role = (loggedUser?.role || "").toUpperCase();
      if (role === "INSTITUTE_ADMIN") {
        navigate("/v2/institute/dashboard");
      } else if (role === "STUDENT") {
        navigate("/v2/institute/student/dashboard");
      } else if (role === "SUPER_ADMIN") {
        navigate("/v2/admin/institutes");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center mockx-auth-overlay">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-fadeIn max-h-[90vh] overflow-y-auto mockx-auth-panel">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6 mockx-auth-heading">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-sm text-gray-500">
            Login to continue your mock tests
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mockx-auth-label">Email</label>
            <div className="relative mt-1">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mockx-auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mockx-auth-label">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pr-10 pl-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mockx-auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition mockx-auth-submit"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <span
              onClick={() => {
                onClose();
                onOpenRegister?.(); // close login modal
                // open register modal OR navigate
              }}
              className="text-indigo-600 font-medium cursor-pointer hover:underline mockx-auth-link"
            >
              Register
            </span>
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-3 text-center">
            {/* <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/institute/login");
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100/80 text-xs font-bold text-indigo-700 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Coaching Institute & Student Login →</span>
            </button> */}

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/v2/institute/login");
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-50 to-cyan-50 hover:from-sky-100 hover:to-cyan-100 border border-sky-100/80 text-xs font-bold text-sky-700 flex items-center justify-center gap-2 transition-all shadow-sm mockx-auth-institute-link"
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Institutes Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
