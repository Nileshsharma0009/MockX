import React {useState } from "react"; 
import { Mail, Eye, EyeOff, X } from "lucide-react"; from "lucide-react"; 
import { useAuth } from "../context/AuthContext";

export default function LoginModal () {
    const {Login } = useAuth(); 

    const handleSubmit =  async () => {
        e.preventDefault() ;
        setError ("")
    }

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
  
        {/* Modal */}
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
  
          {/* Header */}
          <div className="text-center mb-6">
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
              <label className="text-xs font-semibold text-gray-600">Email</label>
              <div className="relative mt-1">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
  
            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-600">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full pr-10 pl-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 
              text-white font-semibold py-2.5 rounded-lg 
              hover:shadow-lg transition"
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
                className="text-indigo-600 font-medium cursor-pointer hover:underline"
              >
                Register
              </span>
            </div>
          </form>
        </div>
      </div>
    );

}