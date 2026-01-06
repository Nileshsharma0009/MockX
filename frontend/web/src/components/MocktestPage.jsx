import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Ensure path is correct
import { User, LogOut, Shield } from "lucide-react";

import MocktestCard from "./MocktestCard.jsx";
import mockTests from "../data/mocktest.js";
import LoginModal from "./LoginModal";

/* -------------------------------------------------
   UNIFIED NAVBAR (Fixed "User" Reference)
------------------------------------------------- */
const Navbar = ({ user, logout, setShowLogin }) => {
  const navigate = useNavigate();
  
  const handleNavClick = (item) => {
    switch (item) {
      case "Home":
        navigate("/");
        break;
     
      case "Results":
        if (!user) setShowLogin(true);
        else navigate("/result-history");
        break;
      case "Help":
        alert("Help page coming soon");
        break;
      case "Ai-Analyzer":
        if (!user) setShowLogin(true);
        else navigate("/result-stat");
        break;
      default:
        break;
    }
  };

  return (
    <header className="py-4 px-4 md:px-12 relative z-50">
      <nav className="flex items-center justify-between max-w-7xl mx-auto rounded-2xl bg-white/70 border border-gray-200 backdrop-blur-xl px-6 py-3 shadow-md">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-200">
            <span className="text-white font-extrabold text-lg">IM</span>
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">MockX</span>
            <p className="text-[10px] text-gray-500 tracking-[0.18em] uppercase">IMUCET • Mock Tests</p>
          </div>
        </div>

        {/* Menu */}
        <div className="hidden md:flex space-x-8 text-gray-600 font-medium text-sm">
          {["Home", "Ai-Analyzer", "Results", "Help"].map((item) => (
            <button 
              key={item} 
              onClick={() => handleNavClick(item)} 
              className="hover:text-sky-600 transition duration-200"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-3">
          {!user ? (
            <button 
              onClick={() => setShowLogin(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold shadow hover:shadow-lg hover:scale-105 transition"
            >
              <User className="w-4 h-4" /> Login
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {user.role === "admin" && <Shield className="w-4 h-4 text-indigo-600" />}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-800">{user.name}</span>
              </div>
              <LogOut 
                onClick={logout} 
                className="w-5 h-5 cursor-pointer text-red-500 hover:text-red-600 transition" 
                title="Logout" 
              />
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

/* -------------------------------------------------
   MAIN PAGE
------------------------------------------------- */
const MockTestPage = () => {
  const [now, setNow] = useState(new Date());
  const [showLogin, setShowLogin] = useState(false);

  const navigate = useNavigate();
  // Fixed: Destructuring user and logout from useAuth()
  const { user, logout } = useAuth(); 

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Passing the fixed variables to Navbar */}
      <Navbar 
        user={user} 
        logout={logout} 
        setShowLogin={setShowLogin} 
      />

      <main className="max-w-6xl mx-auto pt-10 px-6 pb-20">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-6">
          🚀 Step towards success
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-12">
          {mockTests.map((test) => {
            const releaseTime = new Date(test.releaseDate);
            const available = now >= releaseTime;
            return (
              <MocktestCard
                key={test.id}
                {...test}
                available={available}
                date={releaseTime.toLocaleDateString("en-IN")}
              />
            );
          })}
        </div>
      </main>

      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onOpenRegister={() => setShowLogin(false)} 
        />
      )}
    </div>
  );
};

export default MockTestPage;