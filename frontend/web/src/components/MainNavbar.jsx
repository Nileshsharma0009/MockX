import React, { useState } from "react";
import { User, LogOut, Shield, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MainNavbar = ({ desktopLinks, setShowLogin }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Unified list of all possible links for Mobile View
    const mobileLinks = ["Home", "Practice", "Ai-Analyzer", "Results", "Help"];

    const handleNavClick = (item) => {
        setIsMobileMenuOpen(false); // Close menu on click
        switch (item) {
            case "Home":
                navigate("/");
                break;
            case "Practice":
                if (!user) {
                    if (setShowLogin) setShowLogin(true);
                } else {
                    navigate("/mock-tests");
                }
                break;
            case "Ai-Analyzer":
                if (!user) {
                    if (setShowLogin) setShowLogin(true);
                } else {
                    navigate("/result-stat");
                }
                break;
            case "Results":
                if (!user) {
                    if (setShowLogin) setShowLogin(true);
                } else {
                    navigate("/result-history");
                }
                break;
            case "Help":
                navigate("/review-faq");
                break;
            default:
                break;
        }
    };

    return (
        <header className="py-4 px-4 md:px-12 relative z-20">
            <nav className="flex items-center justify-between max-w-7xl mx-auto rounded-2xl bg-white/70 border border-gray-200 backdrop-blur-xl px-6 py-3 shadow-md">

                {/* LEFT: Mobile Menu Button & Logo */}
                <div className="flex items-center gap-3">
                    <button
                        className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    <div className="cursor-pointer" onClick={() => navigate("/")}>
                        <span className="text-2xl font-extrabold tracking-tight text-gray-900">MockX</span>
                        <p className="text-[10px] text-gray-500 tracking-[0.18em] uppercase">IMUCET • Mock Tests</p>
                    </div>
                </div>

                {/* CENTER: Desktop Navigation (Specific to Page) */}
                <div className="hidden md:flex space-x-8 text-gray-600 font-medium text-sm">
                    {desktopLinks.map((item) => (
                        <button
                            key={item}
                            onClick={() => handleNavClick(item)}
                            className="hover:text-sky-600 transition duration-200"
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {/* RIGHT: User Profile / Login */}
                <div className="flex items-center gap-3">
                    {!user ? (
                        <button
                            onClick={() => setShowLogin && setShowLogin(true)}
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

            {/* MOBILE NAVIGATION DROPDOWN (Unified) */}
            {isMobileMenuOpen && (
                <div className="absolute left-0 right-0 top-full z-50 md:hidden px-4">
                    {/* Backdrop to close when clicking outside could be added here if needed, 
               but for now relying on menu item click or toggle button */}
                    <div className="w-full bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-4 flex flex-col space-y-1 animate-in slide-in-from-top-2 mt-2">
                        {mobileLinks.map((item) => (
                            <button
                                key={item}
                                onClick={() => handleNavClick(item)}
                                className="w-full text-left px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 transition duration-200 flex items-center justify-between group"
                            >
                                <span>{item}</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">→</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};

export default MainNavbar;
