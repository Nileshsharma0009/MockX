import React, { useState, useEffect } from 'react';
import RegistrationForm from './Registration.jsx';
// Icons
import { Clock, GraduationCap, BarChart3, Trophy, Book } from 'lucide-react';

// --- Typewriter Component ---
const Typewriter = ({ words, typingSpeed = 150, deletingSpeed = 100, delay = 1000 }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (index === words.length) setIndex(0);

    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), delay);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words, typingSpeed, deletingSpeed, delay]);

  return (
<span className="inline-block min-w-[150px] font-extrabold text-sky-400/90">
      {`${words[index].substring(0, subIndex)}`}
      <span className="border-r-2   border-indigo-600  animate-blink" />
    </span>
  );
};

// --- Feature Card Component ---
const FeatureCard = ({ icon: Icon, title, description, iconColor, bgColor }) => (
  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition duration-300 border border-gray-100 h-full flex flex-col items-start text-left">
    <div className={`p-4 rounded-xl mb-6 ${bgColor} w-fit`}>
      <Icon className={`w-9 h-9 ${iconColor}`} strokeWidth={2.5} />
    </div>
    <h3 className="text-2xl font-bold mb-3 text-gray-800">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-base">{description}</p>
  </div>
);

// --- Main Component ---
const First = () => {
  const [showForm, setShowForm] = useState(false);

  const handleRegisterSuccess = (data) => {
    console.log('User Registered:', data);
    setShowForm(false);
    // redirect or open test page here if needed
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 font-sans text-gray-900 overflow-hidden relative">
      {/* Background blobs (optional keyframes required in tailwind config) */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-1/4 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000" />

      {/* Header / Navbar */}
      <header className="py-6 px-4 md:px-12 relative z-10 bg-white bg-opacity-80 backdrop-blur-sm shadow-sm">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <Book className="w-7 h-7 text-indigo-700" strokeWidth={2.5} />
            <span className="text-2xl font-extrabold tracking-tight text-gray-800">TESTIFY</span>
          </div>

          <div className="hidden md:flex space-x-8 text-gray-600 font-medium text-lg">
            <a href="#" className="hover:text-indigo-700 transition duration-200 ease-in-out">Home</a>
            <a href="#" className="hover:text-indigo-700 transition duration-200 ease-in-out">Practice</a>
            <a href="#" className="hover:text-indigo-700 transition duration-200 ease-in-out">Results</a>
            <a href="#" className="hover:text-indigo-700 transition duration-200 ease-in-out">Help</a>
          </div>
        </nav>
      </header>

      {/* Main Hero */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-20 text-center relative z-10">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8 text-gray-800">
          Ace Your <Typewriter words={['IMUCET', 'Dream']} />
        </h1>

        {/* Register Button (opens modal) */}
        <div className="p-6">
          <button
            onClick={() => setShowForm(true)}
            aria-label="Register for IMUCET preparation"
            className="relative group overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-bold py-3 px-12 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition duration-300 ease-in-out text-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-75"
          >
            <span className="relative z-10">Register</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </button>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={Clock}
            title="180-Minute Tests"
            description="Full-length mock tests with proper time tracking."
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
          />
          <FeatureCard
            icon={GraduationCap}
            title="200 Questions"
            description="Structured papers with real-exam difficulty levels."
            iconColor="text-indigo-600"
            bgColor="bg-indigo-50"
          />
          <FeatureCard
            icon={BarChart3}
            title="Progress Tracking"
            description="Review stats and boost your accuracy."
            iconColor="text-green-600"
            bgColor="bg-green-50"
          />
          <FeatureCard
            icon={Trophy}
            title="Instant Results"
            description="Get detailed analysis immediately after completion."
            iconColor="text-yellow-600"
            bgColor="bg-yellow-50"
          />
        </div>
      </section>

      {/* Chat bubble */}
      <div className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-pink-500 border-2 border-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 ease-out z-20">
        <span className="text-white text-2xl">💬</span>
      </div>

      {/* Registration modal (conditionally rendered) */}
      {showForm && (
        <RegistrationForm
          onClose={() => setShowForm(false)}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
    </div>
  );
};

export default First;
