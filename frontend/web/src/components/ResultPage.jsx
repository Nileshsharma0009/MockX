import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";
import { ArrowLeft } from "lucide-react";

import "../ResultPage.css";

export default function ResultPage() {
  const { resultId } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [score, setScore] = useState(null);
  const [total, setTotal] = useState(null);
  const [mockTestName, setMockTestName] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const contentRef = useRef(null);

  /* =========================
      LOAD RESULT FROM DATABASE
      ========================= */
  useEffect(() => {
    const loadResult = async () => {
      try {
        if (!resultId) {
          navigate("/mock-tests", { replace: true });
          return;
        }

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE}/api/results/public/${resultId}`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("Result not found");

        const data = await res.json();

        setUserData(data.userId);
        setScore(data.score);
        setTotal(data.total);
        setMockTestName(data.mockId?.toUpperCase());
        setCreatedAt(data.createdAt);
      } catch (err) {
        console.error("Result load failed:", err.message);
        navigate("/mock-tests", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [resultId, navigate]);

  /* =========================
      PERFORMANCE LABEL
      ========================= */
  const performance = useMemo(() => {
    if (score == null) return { text: "No Data", cls: "needs-improvement" };
    if (score >= 160) return { text: "Excellent", cls: "excellent" };
    if (score >= 120) return { text: "Good", cls: "good" };
    if (score >= 80) return { text: "Average", cls: "average" };
    return { text: "Needs Improvement", cls: "needs-improvement" };
  }, [score]);

  /* =========================
      DOWNLOAD RESULT AS IMAGE
      ========================= */

      const downloadPDF = () => {
  if (!contentRef.current) return;

  const element = contentRef.current;

  const opt = {
    margin:       10,            // mm
    filename:     `${mockTestName}_Result.pdf`,
    image:        { type: "jpeg", quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak:    { mode: ["avoid-all", "css", "legacy"] }
  };

  html2pdf().set(opt).from(element).save();
};

  const downloadJPG = async () => {
    if (!contentRef.current) return;

    setIsDownloading(true);
    const canvas = await html2canvas(contentRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/jpeg", 0.95);

    const a = document.createElement("a");
    a.href = img;
    a.download = `${mockTestName.replace(/\s+/g, "_")}_Result.jpg`;
    a.click();

    setIsDownloading(false);
  };

  const formattedDateTime = createdAt
    ? new Date(createdAt).toLocaleString()
    : "-";

  if (loading) {
    return (
      <div className="mt-32 text-center text-gray-500">
        Loading result...
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="mt-32 text-center text-red-500">
        Result not available
      </div>
    );
  }

  return (
    <div className="result-page-root">
      {/* Simple Header with Back Button */}
      <header className="fixed top-0 left-0 right-0 py-4 px-4 md:px-12 z-50 bg-white/95 border-b border-gray-200">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">MockX Result</h1>
          <div className="w-20" /> {/* Spacer for alignment */}
        </div>
      </header>

      <div className="container pt-24">
        <div ref={contentRef} className="pdf-content">
          <img
            className="result-watermark"
            src="/MockX_Result.jpg"
            alt="watermark"
            onError={() => {}}
          />

          <div className="header-top">
            <h1>MockX Mock Test</h1>
          </div>

          <div className="header-section">
            <h2>Result</h2>
            <p className="certificate-text">
              This is to certify that the following candidate has completed the mock test
            </p>
          </div>

          {/* Candidate Info */}
          <div className="info">
            <h3>Candidate Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Full Name</div>
                <div className="info-value">{userData.name}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Email</div>
                <div className="info-value">{userData.email}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Phone</div>
                <div className="info-value">{userData.phone || "-"}</div>
              </div>
              <div className="info-item">
                <div className="info-label">State</div>
                <div className="info-value">{userData.state || "-"}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Exam</div>
                <div className="info-value">{userData.exam || "-"}</div>
              </div>
              {userData.exam === "IMUCET" && (
                <div className="info-item">
                  <div className="info-label">IMUCET Option</div>
                  <div className="info-value">
                    {userData.imucetOption || "-"}
                  </div>
                </div>
              )}
              <div className="info-item">
                <div className="info-label">Mock Test</div>
                <div className="info-value">{mockTestName}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Attempted On</div>
                <div className="info-value">{formattedDateTime}</div>
              </div>
            </div>
          </div>

          {/* Score Section */}
          <div className="score">
            <h3>Your Test Results</h3>
            <div className="main-score">
              {score}/200
            </div>
            {/* <div className={`performance-badge ${performance.cls}`}>
              {performance.text}
            </div> */}
            <div className="score-details">
              <div className="score-item">
                <div className="score-number">{score}</div>
                <div className="score-label">Score</div>
              </div>
              <div className="score-item">
               <div className="score-number">
  {total
    ? `${Math.max(0, (score / total) * 100).toFixed(1)}%`
    : "-"}
</div>

                <div className="score-label">Percentage</div>
                
              </div>
              <div className={`performance-badge ${performance.cls}`}>
              {performance.text}
            </div>
            </div>
          </div>


  <div className="footer-section">
          <div className="note">
            <p>
               Thanks for taking the mock test! Your feedback helps us improve the experience for everyone.
            </p>
            <div id="extra" className="extra-links">
              <a href="https://forms.gle/SHub4HFjEep6adfm9" target="_blank" rel="noreferrer">feedBack</a>
              <a href="https://telegram.me/KoToNe_0" target="_blank" rel="noreferrer">contact</a>
              <a href="https://telegram.me/+PbIXyPZwU6llZGRl" target="_blank" rel="noreferrer">join</a>
            </div>
          </div>

          <div className="footer-section">
            Powered by MockX — All Rights Reserved.
          </div>
        </div>
        </div>

        <div className="download-wrapper">
          {/* <button
            onClick={downloadJPG}
            className="download-btn"
            disabled={isDownloading}
          >
            {isDownloading ? "Preparing..." : "Download Result"}
          </button> */}

          <button
  onClick={downloadPDF}
  className="download-btn"
   disabled={isDownloading}
>
   {isDownloading ? "Preparing..." : "Download Result"}
</button>

        </div>
      </div>
    </div>
  );
}