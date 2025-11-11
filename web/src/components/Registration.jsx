import React, { useState } from 'react';
import { X, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry"
];

// Move FormInput outside to prevent recreation on every render
const FormInput = ({ id, label, type = "text", value, onChange, required = true, children, name = id }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {type === 'select' ? (
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      >
        {children}
      </select>
    ) : (
      <input
        id={id}
        name={name}
        type={type}
        value={value ?? ''}
        onChange={onChange}
        required={required}
        autoComplete="off"
        spellCheck="false"
        maxLength={name === 'phone' ? 10 : name === 'age' ? 2 : undefined}
        pattern={name === 'phone' ? '[0-9]*' : undefined}
        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      />
    )}
  </div>
);

const RegistrationForm = ({ onClose, onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    state: '',
    exam: '',
    imucetOption: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 🔑 FIX: This handler is now much cleaner and respects all input types and spaces.
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let cleanValue = value;

    // Specific cleaning for inputs (though validation is still key)
    if (name === 'phone') {
      cleanValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'age') {
      cleanValue = value.replace(/\D/g, '').slice(0, 2);
    } else if (name === 'name') {
      // Allow spaces for multiple words, just normalize multiple spaces to single space
      // Don't trim - allow leading/trailing spaces while typing
      cleanValue = value.replace(/\s+/g, ' ');
    } else if (name === 'email') {
      // Allow typing freely in email field
      cleanValue = value;
    }

    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: cleanValue
      };

      // FIX 2: Correctly reset imucetOption if exam is deselected or changed
      if (name === 'exam' && cleanValue !== 'IMUCET') {
        newState.imucetOption = '';
      }
      return newState;
    });
  };

  const validateForm = () => {
    const { name, age, email, phone, state, exam, imucetOption } = formData;

    const nameRegex = /^[A-Za-z\s]+$/; // <-- Allow letters AND spaces
    if (!name.trim() || !nameRegex.test(name.trim())) {
      setMessage("Full Name should contain only letters and spaces.");
      return false;
    }

    if (!age || age < 15 || age > 40) {
      setMessage("Age must be between 15 and 40.");
      return false;
    }

    if (!state) {
      setMessage("Please select your State.");
      return false;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Enter a valid Email address.");
      return false;
    }

    if (!/^\d{10}$/.test(phone)) {
      setMessage("Phone number must be 10 digits.");
      return false;
    }

    if (!exam) {
      setMessage("Please select an Exam.");
      return false;
    }

    if (exam === 'IMUCET' && !imucetOption) {
      setMessage("Please select an IMUCET option.");
      return false;
    }

    setMessage('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    setTimeout(() => {
      try {
        const dataToSave = { ...formData };
        localStorage.setItem("isRegistered", "true");
        localStorage.setItem("userData", JSON.stringify(dataToSave));

        onRegisterSuccess?.(dataToSave);
        onClose(); // Close the registration form
        navigate("/mock-tests"); // Redirect to mock test page
      } catch (error) {
        setMessage("Failed to save data.");
        console.error("LocalStorage Error:", error);
        setIsLoading(false);
      }
    }, 800);
  };

  const isImucetSelected = formData.exam === 'IMUCET';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl max-w-lg w-full shadow-lg animate-modal-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b bg-indigo-50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Book className="mr-2 text-indigo-600" /> Register for Mock Test
          </h2>
          <button onClick={onClose} className="hover:bg-gray-100 p-1 rounded-full">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
          {message && <div className="mb-4 text-sm p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{message}</div>}

          <FormInput id="name" label="Full Name" value={formData.name} onChange={handleInputChange} />
          <div className="grid grid-cols-2 gap-4">
            <FormInput id="age" label="Age" type="number" value={formData.age} onChange={handleInputChange} />
            <FormInput id="phone" label="Phone Number" type="text" value={formData.phone} onChange={handleInputChange} />
          </div>
          <FormInput id="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} />

          <FormInput id="state" label="State" type="select" value={formData.state} onChange={handleInputChange}>
            <option value="">Select State</option>
            {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
          </FormInput>

          <FormInput id="exam" label="Exam" type="select" value={formData.exam} onChange={handleInputChange}>
            <option value="">Select Exam</option>
            <option value="IMUCET">IMUCET</option>
          </FormInput>

          {isImucetSelected && (
            <FormInput id="imucetOption" label="IMUCET Option" type="select" value={formData.imucetOption} onChange={handleInputChange}>
              <option value="">Select Option</option>
              <option value="DNS">DNS</option>
              <option value="BSC-NS">BSC-NS</option>
              <option value="Others">Others</option>
            </FormInput>
          )}

          <button type="submit" disabled={isLoading}
            className="mt-5 w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition duration-200 disabled:bg-indigo-400"
          >
            {isLoading ? "Registering..." : "Register & Start"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationForm;