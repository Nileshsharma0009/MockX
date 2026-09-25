import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Award, CalendarDays, BarChart3, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import MainNavbar from "../components/MainNavbar.jsx";
import LoginModal from "../components/LoginModal.jsx";
import { API_BASE } from "../api/apiBase.js";

const ResultHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/v2", { replace: true });
      return;
    }

    let active = true;
    fetch(`${API_BASE}/api/results/my`, { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load results");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const records = Array.isArray(data) ? data : [];
        records.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
        setResults(records);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [user, navigate]);

  if (loading) return <Loader />;

  return (
    <div className="results-history-page min-h-screen">
      <MainNavbar desktopLinks={["Home", "Practice", "Results", "Help"]} setShowLogin={setShowLogin} />
      <main className="results-history-main">
        <header className="results-history-heading">
          <div>
            <p className="results-history-eyebrow">YOUR ACTIVITY</p>
            <h1>Result history</h1>
            <p>Review your completed mock tests and track your progress.</p>
          </div>
          <div className="results-history-count"><Award size={18} /><span>{results.length} {results.length === 1 ? "result" : "results"}</span></div>
        </header>

        {loadError ? (
          <section className="results-history-state" role="alert">
            <HelpCircle size={24} />
            <h2>Results could not be loaded</h2>
            <p>Check your connection and try again.</p>
            <button type="button" onClick={() => window.location.reload()}>Try again</button>
          </section>
        ) : results.length === 0 ? (
          <section className="results-history-state">
            <BarChart3 size={26} />
            <h2>Your results will appear here</h2>
            <p>Complete a mock test to start building your performance history.</p>
            <button type="button" onClick={() => navigate("/v2/mock-tests")}>Explore mock tests <ArrowRight size={16} /></button>
          </section>
        ) : (
          <section className="results-history-grid" aria-label="Your mock test results">
            {results.map((result) => {
              const total = Number(result.total) || 0;
              const score = Number(result.score) || 0;
              const accuracy = total > 0 ? Math.round((score / total) * 100) : null;
              const title = result.mockTitle || result.title || result.mockName || (result.mockId ? `Mock ${result.mockId}` : "Mock test");
              const dateValue = result.createdAt || result.updatedAt;
              const date = dateValue && !Number.isNaN(new Date(dateValue).valueOf())
                ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(dateValue))
                : "Date unavailable";

              return (
                <article className="results-history-card" key={result._id}>
                  <div className="results-history-card-top">
                    <span className="results-history-label">COMPLETED MOCK</span>
                    <span className="results-history-score">{score}<small>{total ? ` / ${total}` : " marks"}</small></span>
                  </div>
                  <h2>{title}</h2>
                  <div className="results-history-meta">
                    <span><CalendarDays size={15} />{date}</span>
                    {accuracy !== null && <span><BarChart3 size={15} />{accuracy}% score</span>}
                  </div>
                  <button type="button" onClick={() => navigate(`/result/${result._id}`)}>
                    View result <ArrowRight size={16} />
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </main>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onOpenRegister={() => setShowLogin(false)} />}
    </div>
  );
};

export default ResultHistory;