import React from "react";

const Loader = () => (
  <div className="mockx-loader" role="status" aria-live="polite">
    <span className="mockx-loader-spinner" aria-hidden="true" />
    <span className="mockx-loader-brand">Mock<span>X</span></span>
    <span className="mockx-loader-message">Loading your workspace…</span>
  </div>
);

export default Loader;
