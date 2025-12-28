import React, { useState } from "react";
import axios from "axios";
import { X, Book, CheckCircle } from "lucide-react";
import { signupUser } from "../api/auth.api";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Puducherry",
];

const FormInput = ({ id, label, type = "text", value, onChange, error }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={onChange}
      required
      autoComplete="off"
      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
        error ? "border-red-500" : "border-gray-300"
      }`}
    />
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);

const RegistrationForm = ({ onClose, onOpenLogin }) => {
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ email: "", phone: "" });

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    state: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let clean = value;

    if (name === "phone") clean = value.replace(/\D/g, "").slice(0, 10);
    if (name === "age") clean = value.replace(/\D/g, "").slice(0, 2);

    // Reset field-specific errors when user starts typing again
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((p) => ({ ...p, [name]: clean }));
    setError("");
  };

  const sendOTP = async () => {
    try {
      setError("");
      setOtpLoading(true);
      await axios.post("http://localhost:5000/api/auth/resend-otp", {
        email: formData.email,
      });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setOtpLoading(true);
      await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: formData.email,
        otp,
      });
      setEmailVerified(true);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (formData.age < 15 || formData.age > 40) return "Age must be 15–40";
    if (!formData.state) return "Please select your state";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Enter a valid email";
    if (!/^\d{10}$/.test(formData.phone)) return "Phone number must be 10 digits";
    if (!emailVerified) return "Please verify your email";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Reset all errors before submission
    setErrors({ email: "", phone: "" });
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await signupUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone, // Ensure phone is sent to backend
        password: formData.phone, 
        state: formData.state,
        age: formData.age
      });
      setSuccess(true);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Registration failed";
      const lower = message.toLowerCase();

      // Check for specific database conflict keywords
      if (lower.includes("phone") || lower.includes("mobile")) {
        setErrors((prev) => ({ ...prev, phone: message }));
      } else if (lower.includes("email")) {
        setErrors((prev) => ({ ...prev, email: message }));
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b bg-indigo-50 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Book className="text-indigo-600" />
            Create Account
          </h2>
          <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded-full">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Registration Successful</h3>
            <p className="text-gray-600 mb-6">Your account has been created successfully.</p>
            <button
              onClick={() => {
                onClose();
                onOpenLogin?.();
              }}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Login Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 max-h-[85vh] overflow-y-auto">
            {error && (
              <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <FormInput
              id="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="age"
                label="Age"
                value={formData.age}
                onChange={handleChange}
              />
              <FormInput
                id="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />
            </div>

            <FormInput
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
             
              

            
               {!emailVerified && (
  <div className="flex gap-2 mb-4">
    {!otpSent ? (
      <button
        type="button"
        onClick={sendOTP}
        disabled={!formData.email || otpLoading}
        className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {otpLoading ? "Sending..." : "Send OTP"}
      </button>
    ) : (
      <>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="border px-3 py-2 rounded flex-1"
        />
        <button
          type="button"
          onClick={verifyOTP}
          disabled={!otp || otpLoading}
          className="bg-green-600 text-white px-4 rounded disabled:opacity-50"
        >
          Verify
        </button>
      </>
    )}
  </div>
)}

{emailVerified && (
  <p className="text-green-600 mb-3 text-sm">
    ✅ Email verified successfully
  </p>
)}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select State</option>
                {indianStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50 mt-2"
            >
              {loading ? "Registering..." : "Complete Registration"}
            </button>

            <div className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <span
                onClick={() => {
                  onClose();
                  onOpenLogin?.();
                }}
                className="text-indigo-600 font-bold cursor-pointer hover:underline"
              >
                Login
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;