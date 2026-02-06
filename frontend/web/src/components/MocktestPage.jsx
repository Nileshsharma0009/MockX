import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Ensure path is correct
import { User, LogOut, Shield, Menu, X } from "lucide-react";
import MainNavbar from "./MainNavbar.jsx";

import MocktestCard from "./MocktestCard.jsx";
import mockTests from "../data/mocktest.js";
import LoginModal from "./LoginModal";



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
    <div className="min-h-screen bg-slate-50 relative">

      {/* Passing the fixed variables to Navbar */}
      <MainNavbar
        desktopLinks={["Home", "Ai-Analyzer", "Results", "Help"]}
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