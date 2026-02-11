import React, { useState } from "react";
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
      autoComplete="off"
      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${error ? "border-red-500" : "border-gray-300"
        }`}
      required
    />
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);

const RegistrationForm = ({ onClose, onOpenLogin }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({ email: "", phone: "" });

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    email: "",
    state: "",
    exam: "",
    imucetOption: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    let clean = value;
    if (name === "phone") clean = value.replace(/\D/g, "").slice(0, 10);
    if (name === "age") clean = value.replace(/\D/g, "").slice(0, 2);

    setFormData((prev) => ({ ...prev, [name]: clean }));
    setErrors({ email: "", phone: "" });
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (formData.age < 15 || formData.age > 40) return "Age must be 15–40";
    if (!formData.state) return "Please select your state";
    if (!/^\d{10}$/.test(formData.phone)) return "Phone must be 10 digits";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return "Invalid email";
    if (!formData.exam) return "Please select exam";
    if (formData.exam === "IMUCET" && !formData.imucetOption)
      return "Select IMUCET option";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

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
        phone: formData.phone,
        password: formData.phone, // temp password
        age: formData.age,
        state: formData.state,
        exam: formData.exam,
        imucetOption: formData.imucetOption,
      });

      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      if (msg.toLowerCase().includes("email"))
        setErrors((p) => ({ ...p, email: msg }));
      else if (msg.toLowerCase().includes("phone"))
        setErrors((p) => ({ ...p, phone: msg }));
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-[95%] md:w-full shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 md:p-5 border-b bg-indigo-50 flex justify-between shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Book className="text-indigo-600" /> Create Account
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Registration Successful</h3>
            <p className="mb-4 text-gray-600">
              Password is your phone number.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenLogin?.();
              }}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg"
            >
              Login Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 md:p-6 overflow-y-auto custom-scrollbar">
            {error && (
              <div className="mb-3 text-sm bg-red-50 text-red-700 p-2 rounded">
                {error}
              </div>
            )}

            <FormInput id="name" label="Full Name" value={formData.name} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <FormInput id="age" label="Age" value={formData.age} onChange={handleChange} />
              <FormInput id="phone" label="Phone - will be your password" value={formData.phone} onChange={handleChange} error={errors.phone} />
            </div>
            <FormInput id="email" label="Email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />

            <select name="state" value={formData.state} onChange={handleChange} className="w-full mb-4 border p-2 rounded">
              <option value="">Select State</option>
              {indianStates.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select name="exam" value={formData.exam} onChange={handleChange} className="w-full mb-4 border p-2 rounded">
              <option value="">Select Exam</option>
              <option value="IMUCET">IMUCET</option>
              <option value="MHTCET">MHTCET</option>
            </select>

            {formData.exam === "IMUCET" && (
              <select
                name="imucetOption"
                value={formData.imucetOption}
                onChange={handleChange}
                className="w-full mb-4 border p-2 rounded"
              >
                <option value="">Select IMUCET Option</option>
                <option value="DNS">DNS</option>
                <option value="BSC-NS">BSC-NS</option>
                <option value="B.Tech Marine">B.Tech Marine</option>
                <option value="Naval Architecture">Naval Architecture</option>
              </select>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg"
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
