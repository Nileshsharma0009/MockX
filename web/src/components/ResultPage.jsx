import React, { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import "../ResultPage.css";

export default function ResultPage() {
  const [userData, setUserData] = useState(null);
  const [score, setScore] = useState(null);
  const [mockTestName, setMockTestName] = useState("Mock Test");
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef(null);

  // load from localStorage (safe)
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("userData") || "null");
      setUserData(u);

      const rawScore = localStorage.getItem("testScore");
      const rawResult = localStorage.getItem("testResult");
      if (rawScore !== null && rawScore !== undefined) {
        const s = parseFloat(rawScore);
        setScore(Number.isFinite(s) ? s : null);
      } else if (rawResult) {
        const parsed = JSON.parse(rawResult);
        const tot = parsed?.totalScore ?? parsed?.score ?? null;
        setScore(tot != null ? Number(tot) : null);
      } else {
        setScore(null);
      }

      const m = localStorage.getItem("mockTestName") || localStorage.getItem("mockName");
      if (m) setMockTestName(m);
    } catch (e) {
      console.error("Failed to parse localStorage:", e);
    }
  }, []);

  // performance badge based on numeric score out of 200
  const performance = useMemo(() => {
    if (score == null || isNaN(score)) return { text: "No Data", cls: "needs-improvement" };
    const s = score;
    if (s >= 160) return { text: "Excellent", cls: "excellent" };
    if (s >= 120) return { text: "Good", cls: "good" };
    if (s >= 80) return { text: "Average", cls: "average" };
    return { text: "Needs Improvement", cls: "needs-improvement" };
  }, [score]);

  // send to Google Sheet (fire-and-forget). keep no-cors if necessary
  useEffect(() => {
    if (!userData || score == null) return;
    const payload = {
      name: userData?.name,
      age: userData?.age,
      state: userData?.state,
      email: userData?.email,
      exam: userData?.exam,
      phone: userData?.phone,
      imucetOption: userData?.imucetOption,
      score,
      mockTestName,
      timestamp: new Date().toISOString(),
    };

    const SHEET_URL = import.meta.env.VITE_SHEET_URL;
    if (!SHEET_URL) {
      console.warn("Google Sheets URL not configured. Skipping sheet submission.");
      return;
    }
    try {
      fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(() => console.log("Sent (or queued) to sheet (no-cors)."));
    } catch (err) {
      console.error("Sheet send error:", err);
    }
  }, [userData, score, mockTestName]);

  // download rendered card as high-res jpg
  const downloadJPG = async () => {
    if (!contentRef.current) return;
    setIsDownloading(true);
    try {
      const el = contentRef.current;
      const scale = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight,
      });

      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (!blob) {
            alert("Failed to create image. Try again.");
            setIsDownloading(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${(mockTestName || "IMUmate_Result").replace(/\s+/g, "_")}.jpg`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1500);
          setIsDownloading(false);
        }, "image/jpeg", 0.95);
      } else {
        const img = canvas.toDataURL("image/jpeg", 0.95);
        const a = document.createElement("a");
        a.href = img;
        a.download = `${(mockTestName || "IMUmate_Result").replace(/\s+/g, "_")}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setIsDownloading(false);
      }
    } catch (err) {
      console.error("download error", err);
      alert("Failed to download image. Use Print as PDF as a fallback.");
      setIsDownloading(false);
    }
  };

  const now = new Date();
  const formattedDateTime = now.toLocaleDateString() + ", " + now.toLocaleTimeString();

  return (
    <div className="result-page-root">
      <div className="container">
        <div id="pdf-content" ref={contentRef} className="pdf-content">
          <div className="result-card">
            {/* optional watermark image behind card (you can adjust path) */}
            <img
              className="result-watermark"
              alt="watermark"
              // default path: put the image in public/TESTIFY_Result.jpg or adjust as needed
              src="/IMUmate_Result.jpg"
              onError={() => {
                /* ignore if not available */
              }}
            />

            <div className="header-top">
              <h1>IMUmate Mock Test</h1>
            </div>

            <div className="header-section">
              <h2>Result</h2>
              <p className="certificate-text">
                This is to certify that the following candidate has completed the mock test
              </p>
            </div>

            <div className="info" id="userInfo">
              <h3>Candidate Information</h3>
              {userData ? (
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Full Name</div>
                    <div className="info-value">{userData.name}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Age</div>
                    <div className="info-value">{userData.age ? `${userData.age} years` : "-"}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">State</div>
                    <div className="info-value">{userData.state ?? "-"}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Email</div>
                    <div className="info-value">{userData.email ?? "-"}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">Exam</div>
                    <div className="info-value">{userData.exam ?? "-"}</div>
                  </div>
                  {userData.exam === "IMUCET" && userData.imucetOption ? (
                    <div className="info-item">
                      <div className="info-label">IMUCET Option</div>
                      <div className="info-value">{userData.imucetOption}</div>
                    </div>
                  ) : null}

                  <div className="info-item">
                    <div className="info-label">Phone</div>
                    <div className="info-value">{userData.phone ?? "-"}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">Mock Test</div>
                    <div className="info-value">{mockTestName}</div>
                  </div> 
                  
                </div>
              ) : (
                <p className="text-muted">User data not found.</p>
              )}
            </div>

            <div className="score" id="scoreDisplay">
              <h3>Your Test Results</h3>
              <div className="main-score">{score != null ? `${score}/200` : "-/200"}</div>
              <div className="result-date-time">Test taken on: {formattedDateTime}</div>

              <div className="score-details">
                <div className="score-item">
                  <div className="score-number">{score != null ? score : "-"}</div>
                  <div className="score-label">Total Score</div>
                </div>
                <div className="score-item">
                  <div className="score-number">
                    {score != null ? ((score / 200) * 100).toFixed(1) + "%" : "-"}
                  </div>
                  <div className="score-label">Percentage</div>
                </div>
                <div className="score-item">
                  <div className="score-number">{score != null ? Math.max(0, Math.round(score)) + "/200" : "0/200"}</div>
                  <div className="score-label">Correct Answers</div>
                </div>
              </div>

              <div className={`performance-badge ${performance.cls}`}>{performance.text}</div>
            </div>

            <div className="note-wrapper">
              <div className="note">
                <p>
                  1) Great job completing your mock test! No matter the score, it reflects your current progress.
                  Keep practicing—success is built step by step!
                </p>
              </div>

              <div className="note">
                <p>
                  2) Thanks for taking the mock test! Your feedback helps us improve the experience for everyone. Feel
                  free to share your thoughts!
                </p>

                <div id="extra" className="extra-links">
                  <a href="https://forms.gle/SHub4HFjEep6adfm9" target="_blank" rel="noreferrer">feedBack</a>
                  <a href="https://telegram.me/KoToNe_0" target="_blank" rel="noreferrer">contact</a>
                  <a href="https://telegram.me/+PbIXyPZwU6llZGRl" target="_blank" rel="noreferrer">join</a>
                </div>
              </div>
            </div>

            <div className="test-title">🎉 Thank You for Taking the Test!</div>
            <div className="footer-section">Powered by IMUmate — All Rights Reserved.</div>
          </div>
        </div>

        <div className="download-wrapper">
          <button onClick={downloadJPG} className="download-btn" disabled={isDownloading}>
            {isDownloading ? "Preparing..." : "Download Result"}
          </button>
        </div>
      </div>
    </div>
  );
}
