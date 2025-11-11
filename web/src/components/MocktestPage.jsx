import React, { useState, useEffect } from "react";
import MockTestCard from "./MockTestCard";
import mockTests from "../data/mocktest.js"; // ✅ import external data

const Navbar = () => (
  <nav className="w-full bg-white shadow-sm fixed top-0 left-0 z-50">
    <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎓</span>
        <h1 className="text-xl font-bold text-gray-800">IMU-MOCK</h1>
      </div>
      <ul className="flex space-x-8 text-gray-700 font-medium">
        <li className="hover:text-indigo-600 cursor-pointer transition">Home</li>
        <li className="hover:text-indigo-600 cursor-pointer transition">Practice</li>
        <li className="hover:text-indigo-600 cursor-pointer transition">Results</li>
        <li className="hover:text-indigo-600 cursor-pointer transition">Help</li>
      </ul>
    </div>
  </nav>
);

const MockTestPage = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000); // update every 30s
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-gray-100 pt-32 px-6 md:px-20 pb-20">
      <Navbar />
      <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-800 mb-14 tracking-tight">
        🚀 Step towards success
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
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
            <MockTestCard
              key={test.id}
              {...test}
              available={available}
              date={formattedDate}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MockTestPage;
