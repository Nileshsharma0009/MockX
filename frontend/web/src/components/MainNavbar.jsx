import React, { useState } from "react";
import { User, LogOut, Shield, Menu, X, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationInbox";

const MainNavbar = ({ desktopLinks = [], setShowLogin }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [...desktopLinks];
  if (!links.includes("Institutes")) links.push("Institutes");
  if (user?.role === "SUPER_ADMIN" && !links.includes("Dashboard")) links.push("Dashboard");

  const handleNavClick = (item) => {
    setIsMobileMenuOpen(false);
    switch (item) {
      case "Home": navigate("/v2"); break;
      case "Practice": user ? navigate("/v2/mock-tests") : setShowLogin?.(true); break;
      case "Results": user ? navigate("/v2/result-history") : setShowLogin?.(true); break;
      case "Help": navigate("/v2/review-faq"); break;
      case "Institutes":
        if (user?.role === "INSTITUTE_ADMIN") navigate("/v2/institute/dashboard");
        else if (user?.role === "STUDENT") navigate("/v2/institute/student/dashboard");
        else if (user?.role === "SUPER_ADMIN") navigate("/v2/admin/institutes");
        else navigate("/v2/institute/login");
        break;
      case "Dashboard": navigate("/v2/admin"); break;
      default: break;
    }
  };

  return (
    <header className="landing-header mockx-site-header">
      <nav className="landing-nav mockx-site-header__wrap" aria-label="Main navigation">
        <div className="landing-nav-inner mockx-site-header__inner">
          <div className="landing-brand-group">
            <button className="landing-menu-button" type="button" onClick={() => setIsMobileMenuOpen((open) => !open)} aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"} aria-expanded={isMobileMenuOpen}>
              {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <button className="landing-brand mockx-site-brand" type="button" onClick={() => navigate("/v2")} aria-label="MockX home">

              <span><strong>MockX</strong>
              {/* <small>MOCK-TEST PLATFORM</small> */}
              </span>
            </button>
          </div>

          <div className="landing-desktop-links">
            {links.map((item) => <button key={item} type="button" onClick={() => handleNavClick(item)}>{item}</button>)}
          </div>

          <div className="landing-nav-actions">
            {!user ? (
              <button type="button" onClick={() => setShowLogin?.(true)} className="landing-nav-cta">Log in <ArrowUpRight size={15} /></button>
            ) : (
              <div className="landing-user-actions">
                <NotificationBell />
                {user.role === "SUPER_ADMIN" && <Shield className="landing-admin-mark" size={17} aria-label="Super admin" />}
                <span className="landing-user-name"><User size={15} />{user.name}</span>
                <button type="button" onClick={logout} className="landing-logout" aria-label="Log out" title="Log out"><LogOut size={17} /></button>
              </div>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="landing-mobile-menu">
            {links.map((item) => <button key={item} type="button" onClick={() => handleNavClick(item)}>{item}<ArrowUpRight size={15} /></button>)}
          </div>
        )}
      </nav>
    </header>
  );
};

export default MainNavbar;
