import React from "react";
import { Bot, BookOpenCheck, Target } from "lucide-react";

const getWeakestSubject = (subjectStats = {}, subjectsMap = {}) => {
  const entries = Object.entries(subjectStats).filter(
    ([, stats]) => (stats?.attempted || 0) > 0
  );

  if (!entries.length) return null;

  const [key, stats] = entries.sort((a, b) => {
    const aAccuracy = a[1].attempted
      ? Math.round((a[1].correct / a[1].attempted) * 100)
      : 0;
    const bAccuracy = b[1].attempted
      ? Math.round((b[1].correct / b[1].attempted) * 100)
      : 0;

    return aAccuracy - bAccuracy;
  })[0];

  const accuracy = stats.attempted
    ? Math.round((stats.correct / stats.attempted) * 100)
    : 0;

  return {
    name: subjectsMap[key]?.name || key.toUpperCase(),
    accuracy,
    attempted: stats.attempted || 0,
    correct: stats.correct || 0,
  };
};

const AIChatPanel = ({ isOpenDesktop = true, selected, subjectsMap = {} }) => {
  const weakestSubject = getWeakestSubject(selected?.subjectStats, subjectsMap);
  const scorePercent = selected?.score != null && Number(selected?.total) > 0
    ? Math.max(0, Math.min(100, Math.round((selected.score / selected.total) * 100)))
    : null;

  return (
    <section className={`study-assistant ${isOpenDesktop ? "study-assistant--desktop" : "study-assistant--embedded"}`} aria-label="Performance insights">
      {isOpenDesktop && (
        <header className="study-assistant-header">
          <span className="study-assistant-icon" aria-hidden="true"><Bot size={19} /></span>
          <div className="study-assistant-heading">
            <p className="study-assistant-eyebrow">MockX study assistant</p>
            <h2>Performance insights</h2>
          </div>
          <span className="study-assistant-status"><span /> Result based</span>
        </header>
      )}

      <div className="study-assistant-content">
        <div className="study-assistant-message">
          <span className="study-assistant-message-icon" aria-hidden="true"><Bot size={16} /></span>
          <div>
            <p className="study-assistant-message-label">Your latest attempt</p>
            <p className="study-assistant-message-copy">
              {weakestSubject
                ? `A useful place to focus next is ${weakestSubject.name}. You answered ${weakestSubject.correct} of ${weakestSubject.attempted} attempted questions correctly.`
                : "Choose a completed mock with subject results to see a focused review suggestion here."}
            </p>
          </div>
        </div>

        <div className="study-assistant-result">
          <div className="study-assistant-result-heading">
            <div>
              <p className="study-assistant-eyebrow">Result snapshot</p>
              <h3>{selected?.mockId || "No mock selected"}</h3>
            </div>
            <BookOpenCheck size={19} aria-hidden="true" />
          </div>

          {scorePercent !== null ? (
            <div className="study-assistant-score">
              <div className="study-assistant-score-label">
                <span>Score</span>
                <strong>{selected.score}/{selected.total}</strong>
              </div>
              <div className="study-assistant-progress" role="progressbar" aria-label="Score percentage" aria-valuemin="0" aria-valuemax="100" aria-valuenow={scorePercent}>
                <span style={{ width: `${scorePercent}%` }} />
              </div>
              <p>{scorePercent}% of available marks</p>
            </div>
          ) : (
            <p className="study-assistant-empty">Score details are not available for this result.</p>
          )}
        </div>

        <div className="study-assistant-focus">
          <span className="study-assistant-focus-icon" aria-hidden="true"><Target size={17} /></span>
          <div>
            <p className="study-assistant-eyebrow">Review focus</p>
            <strong>{weakestSubject ? weakestSubject.name : "Subject insights unavailable"}</strong>
            <p>{weakestSubject ? `${weakestSubject.accuracy}% accuracy · ${weakestSubject.attempted} attempted` : "Subject-wise performance will appear when available."}</p>
          </div>
        </div>
        <p className="study-assistant-note">Suggestions are calculated from this result’s recorded score and subject data.</p>
      </div>
    </section>
  );
};

export default AIChatPanel;
