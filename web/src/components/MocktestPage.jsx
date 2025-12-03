import React, { useState, useEffect } from "react";
import { Book } from "lucide-react";
import MocktestCard from "./MocktestCard.jsx";
import mockTests from "../data/mocktest.js"; // ✅ import external data

const Navbar = () => (
  <>
    {/* Header */}
    <header className="py-4 px-4 md:px-12 relative z-10">
      <nav className="flex items-center justify-between max-w-7xl mx-auto rounded-2xl bg-white/70 border border-gray-200 backdrop-blur-xl px-4 md:px-6 py-3 shadow-md">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-md shadow-sky-200">
            <Book className="w-6 h-6 text-white" strokeWidth={2.4} />
          </div>
          <div>
            <span className="text-2xl font-extrabold tracking-tight text-gray-900">IMUmate</span>
            <p className="text-[10px] text-gray-500 tracking-[0.18em] uppercase">
              IMUCET • Mock Tests
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="hidden md:flex space-x-8 text-gray-600 font-medium text-sm">
          {["Home", "Practice", "Results", "Help"].map((item) => (
            <a key={item} href="#" className="hover:text-sky-600 transition duration-200">
              {item}
            </a>
          ))}
        </div>
      </nav>
    </header>
  </>
);

const MockTestPage = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000); // update every 30s
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-gray-100">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-20 md:pt-24 px-6 md:px-8 pb-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-800 mb-6 tracking-tight">
          🚀 Step towards success
        </h1>

        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/80 border border-sky-200 px-6 py-2 shadow-md">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm md:text-base font-semibold text-sky-700 uppercase tracking-[0.18em]">
              IMUCET Mock Test Series
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-4">
          {mockTests.map((test) => {
            const releaseTime = new Date(test.releaseDate);
            const available = now >= releaseTime;

            const formattedDate = releaseTime.toLocaleString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Kolkata",
            });

            return (
              <MocktestCard
                key={test.id}
                {...test}
                available={available}
                date={formattedDate}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default MockTestPage;
