import React, { useState } from "react";
import RegistrationForm from "./Registration.jsx";

const HomePage = () => {
  const [showForm, setShowForm] = useState(false);

  const handleRegisterSuccess = (data) => {
    console.log("User Registered:", data);
    setShowForm(false); // Close after register
    // redirect or open test page here if needed
  }; 
  

  return (
    <div className="p-6">
      {/* Register Button */}
      <button
        onClick={() => setShowForm(true)}
       className="relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300 ease-in-out text-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-75"
      >
        Register
      </button>

      {/* Show Registration Form only when showForm is true */}
      {showForm && (
        <RegistrationForm 
          onClose={() => setShowForm(false)} 
          onRegisterSuccess={handleRegisterSuccess} 
        />
      )}
    </div>
  );
};

export default HomePage;
