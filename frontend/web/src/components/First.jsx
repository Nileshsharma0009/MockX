import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Building2, Check, Clock3, FileText, Target } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import RegistrationForm from "./Registration.jsx";
import LoginModal from "./LoginModal";
import { useAuth } from "../context/AuthContext";
import Footer from "./Footer.jsx";
import MainNavbar from "./MainNavbar.jsx";
import "../styles/landing-page.css";

const features = [
  {
    icon: Clock3,
    eyebrow: "Practice",
    title: "Timed mock tests",
    description: "Work through exams with a timer and a focused test-taking experience.",
  },
  {
    icon: FileText,
    eyebrow: "Review",
    title: "Clear result reports",
    description: "See your score, answers, and performance details after you submit.",
  },
  {
    icon: BarChart3,
    eyebrow: "Improve",
    title: "Performance insights",
    description: "Use attempt and subject-level analysis to decide what to practice next.",
  },
  {
    icon: Building2,
    eyebrow: "For institutes",
    title: "Tools for your academy",
    description: "Manage students, question banks, custom mocks, assignments, and results.",
  },
];

const preparationComparison = [
  {
    id: "hard-way",
    label: "WITHOUT MOCK TESTS",
    title: "The Hard Way",
    items: [
      "No real sense of exam pressure or time constraints",
      "Difficult to identify weak topics and recurring mistakes",
      "Overconfidence or underconfidence without feedback",
      "Poor time management during the actual exam",
      "Exam day feels unfamiliar and stressful",
    ],
  },
  {
    id: "smart-way",
    label: "WITH MOCKX PLATFORM",
    title: "The Smart Way",
    items: [
      "Experience real exam-level pressure early",
      "Clear insights with AI-driven performance analysis",
      "Data-driven confidence based on actual accuracy",
      "Master a section-wise time-allocation strategy",
      "Arrive on exam day feeling calmer and more familiar",
    ],
  },
];

const First = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [showLogin, setShowLogin] = useState(false);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mockx-landing min-h-screen overflow-x-hidden">
      <MainNavbar
        desktopLinks={["Home", "Practice", "Results", "Help"]}
        setShowLogin={setShowLogin}
      />

      <main>
 <section className="landing-hero">
  <div className="landing-container landing-hero-grid">

    <motion.div
      className="landing-hero-copy"
      initial={reduceMotion ? false : { opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.48, ease: "easeOut", delay: 0.08 }}
    >
      <p className="landing-kicker">
        <span /> MOCKX · MOCK-TEST PLATFORM
      </p>

      <h1>
        Make practice<br />
        <span>feel like progress.</span>
      </h1>

      <p className="landing-hero-description">
        Take a timed mock, understand your result, and choose what to work on next.
        MockX brings practice and progress into one place.
      </p>

      <div className="landing-hero-actions">
        <button
          type="button"
          onClick={() => user ? navigate("/v2/mock-tests") : setShowForm(true)}
          className="landing-primary"
        >
          {user ? "Explore mock tests" : "Create your account"}
          <ArrowRight size={18} />
        </button>

        <button
          type="button"
          onClick={() =>
            user ? navigate("/v2/result-history") : setShowLogin(true)
          }
          className="landing-secondary"
        >
          {user ? "View my results" : "Log in"}
        </button>
      </div>

      <div className="landing-hero-note">
        <span className="landing-note-mark">✳</span>
        <span>
          For independent learners and institutes running structured practice.
        </span>
      </div>
    </motion.div>

    <motion.figure
      className="landing-hero-art landing-product-art"
      initial={reduceMotion ? false : { opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: "easeOut", delay: 0.16 }}
    >
      <img
        src="/Assets/asset1.png"
        alt="MockX exam interface with a timer, question navigation, and performance by topic"
      />

      <figcaption>
        From a focused attempt to a useful result review.
      </figcaption>
    </motion.figure>

  </div>
</section>

        <section className="landing-features landing-container" aria-labelledby="features-title">
          <div className="landing-section-heading">
            <p className="landing-kicker"><span /> THE MOCKX WORKFLOW</p>
            <h2 id="features-title">Everything you need to make practice count.</h2>
            <p>From taking a test to understanding the result, MockX keeps your preparation in one place.</p>
          </div>
          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, eyebrow, title, description }, index) => (
              <motion.article
                className="landing-feature-card"
                key={title}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.38, delay: index * 0.06, ease: "easeOut" }}
              >
                <div className="landing-feature-top"><span>0{index + 1}</span><Icon size={22} strokeWidth={1.7} /></div>
                <p className="landing-feature-eyebrow">{eyebrow}</p>
                <h3>{title}</h3>
                <p className="landing-feature-description">{description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="landing-compare" aria-labelledby="landing-compare-title">
          <div className="landing-container">
            <motion.div
              className="landing-compare-heading"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <p className="landing-kicker"><span /> THE DIFFERENCE PRACTICE MAKES</p>
       
              <p>Build exam familiarity before the real day, one focused MockX attempt at a time.</p>
            </motion.div>

            <div className="landing-compare-grid">
              {preparationComparison.map((way, index) => (
                <motion.article
                  key={way.id}
                  className={`landing-compare-card ${index === 1 ? "landing-compare-card-smart" : "landing-compare-card-hard"}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.42, delay: reduceMotion ? 0 : index * 0.12, ease: "easeOut" }}
                >
                  <p className="landing-compare-label">{way.label}</p>
                  <h3>{way.title}</h3>
                  <ul>
                    {way.items.map((item, itemIndex) => (
                      <motion.li
                        key={item}
                        initial={reduceMotion ? false : { opacity: 0, x: index === 0 ? -8 : 8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.28, delay: reduceMotion ? 0 : index * 0.12 + itemIndex * 0.045, ease: "easeOut" }}
                      >
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-teal-band">
          <div className="landing-container landing-teal-grid">
            <div>
              <p className="landing-kicker landing-kicker-light"><span /> PREPARATION, WITH PURPOSE</p>
              <h2>Make each attempt useful.</h2>
            </div>
            <div className="landing-teal-copy">
              <p>Practising is only part of the work. MockX helps you review what happened, notice where to focus, and start your next attempt with a clearer plan.</p>
              <ul>
                <li><Check size={17} /> Timed practice and a familiar exam flow</li>
                <li><Check size={17} /> Results and answer review after submission</li>
                <li><Check size={17} /> Institute tools for classes and assigned tests</li>
              </ul>
              <button type="button" onClick={() => navigate("/v2/mock-tests")} className="landing-teal-link">Explore mock tests <ArrowRight size={17} /></button>
            </div>
          </div>
        </section>

        <section className="landing-steps landing-container">
          <div className="landing-section-heading">
            <p className="landing-kicker"><span /> A SIMPLE ROUTINE</p>
            <h2>Practice. Review. Repeat.</h2>
            <p>Use each mock test as a practical step in your preparation.</p>
          </div>
          <div className="landing-step-grid">
            {[
              { icon: Target, title: "Choose a mock", description: "Pick an available test that fits what you are studying." },
              { icon: Clock3, title: "Take the test", description: "Answer questions in the timed test environment." },
              { icon: BarChart3, title: "Review your result", description: "Check your score and use the report to plan what comes next." },
            ].map(({ icon: Icon, title, description }, index) => (
              <motion.article
                key={title}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.38, delay: index * 0.07, ease: "easeOut" }}
              >
                <span>0{index + 1}</span><Icon size={24} /><h3>{title}</h3><p>{description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="landing-audience-section">
          <div className="landing-container landing-audience-grid">
            <figure className="landing-audience-art">
              <img src="/Assets/asset2.png" alt="MockX student, teacher, and institute admin views connected in one platform" loading="lazy" />
              <figcaption>One platform with role-based spaces for students and institutes.</figcaption>
            </figure>
            <div className="landing-audience-copy">
              <p className="landing-kicker"><span /> FOR LEARNERS AND INSTITUTES</p>
              <h2>Practice on your own. Organise it together.</h2>
              <p>Students can take available mocks and review their attempts. Institutes can build custom tests, manage question banks, assign work to students, and follow results from their portal.</p>
              <div className="landing-audience-actions">
                <button type="button" onClick={() => user ? navigate("/v2/mock-tests") : setShowForm(true)} className="landing-secondary">Explore mock tests <ArrowRight size={16} /></button>
                <button type="button" onClick={() => navigate("/v2/institute/login")} className="landing-secondary">Institute portal <ArrowRight size={16} /></button>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-container landing-final-inner">
            <div><p className="landing-kicker"><span /> YOUR NEXT ATTEMPT STARTS HERE</p><h2>Put your preparation into practice.</h2></div>
            <button type="button" onClick={() => user ? navigate("/v2/mock-tests") : setShowForm(true)} className="landing-primary">{user ? "Browse mock tests" : "Get started with MockX"}<ArrowRight size={18} /></button>
          </div>
        </section>
      </main>

      <Footer />
      {showForm && <RegistrationForm onClose={() => setShowForm(false)} onOpenLogin={() => { setShowForm(false); setShowLogin(true); }} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onOpenRegister={() => { setShowLogin(false); setShowForm(true); }} />}
    </div>
  );
};

export default First;
