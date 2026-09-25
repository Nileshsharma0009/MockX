import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="landing-footer">
    <div className="landing-container">
      <div className="landing-footer-main">
        <div className="landing-footer-brand">
          <Link to="/v2" className="landing-brand" aria-label="MockX home">
            <span className="landing-brand-mark">M</span>
            <span><strong>MockX</strong><small>MOCK-TEST PLATFORM</small></span>
          </Link>
          <p>Take a mock test, review your result, and decide what to practice next.</p>
        </div>
        <div className="landing-footer-links">
          <div><h3>For students</h3><Link to="/v2/mock-tests">Mock tests <ArrowUpRight size={14} /></Link><Link to="/v2/result-history">My results <ArrowUpRight size={14} /></Link><Link to="/v2/review-faq">Help and FAQs <ArrowUpRight size={14} /></Link></div>
          <div><h3>For institutes</h3><Link to="/v2/institute/login">Institute portal <ArrowUpRight size={14} /></Link><a href="mailto:mockxhelp@gmail.com">Contact MockX <ArrowUpRight size={14} /></a></div>
        </div>
      </div>
      <div className="landing-footer-bottom"><span>© {new Date().getFullYear()} MockX</span><span>Built for better exam practice.</span></div>
    </div>
  </footer>
);

export default Footer;