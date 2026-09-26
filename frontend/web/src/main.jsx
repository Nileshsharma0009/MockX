

// Programmatic service worker unregistration to prevent old cached assets/scripts blocking Razorpay
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log("Unregistered service worker:", registration);
    }
  });
}

import { StrictMode, lazy, Suspense, useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import "./index.css";
import "./styles/institute-ui.css";
import "./styles/mockx-app.css";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AuthModals from "./pages/AuthModals.jsx";
import { Toaster } from "react-hot-toast";
import Loader from "./components/Loader.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const V2_ROUTES = {
  home: "/v2",
  mockTests: "/v2/mock-tests",
  mockTest: (examId) => `/v2/mock-tests/${examId}`,
  test: "/v2/test",
  result: (resultId) => `/v2/result/${resultId}`,
  resultHistory: "/v2/result-history",
  resultStat: "/v2/result-stat",
  admin: "/v2/admin",
  instituteLogin: "/v2/institute/login",
  instituteDashboard: "/v2/institute/dashboard",
  instituteStudentDashboard: "/v2/institute/student/dashboard",
  adminInstitutes: "/v2/admin/institutes",
  reviewFaq: "/v2/review-faq",
  testError: "/v2/test-error",
  loader: "/v2/loader",
};


function getPageClass(pathname) {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/v2/admin") return "mockx-page-admin-dashboard";
  if (normalizedPath === "/v2/admin/institutes") return "mockx-page-admin-institutes";
  if (normalizedPath.startsWith("/v2/admin/") || normalizedPath === "/admin" || normalizedPath.startsWith("/admin/")) return "mockx-admin-exempt";
  if (pathname === "/v2") return "mockx-page-home";
  if (pathname === "/v2/test") return "mockx-page-exam";
  if (pathname.startsWith("/v2/mock-tests/")) return "mockx-page-mock-detail";
  if (pathname === "/v2/mock-tests") return "mockx-page-catalog";
  if (pathname.startsWith("/v2/result/")) return "mockx-page-result";
  if (pathname === "/v2/result-history") return "mockx-page-history";
  if (pathname === "/v2/result-stat") return "mockx-page-analytics";
  if (pathname === "/v2/institute/login") return "mockx-page-institute-login";
  if (pathname === "/v2/institute/dashboard") return "mockx-page-institute-admin";
  if (pathname === "/v2/institute/student/dashboard") return "mockx-page-student-portal";
  if (pathname === "/v2/review-faq") return "mockx-page-help";
  return "mockx-page-generic";
}

function RouteMotion({ children, routeKey, enabled }) {
  const pageRef = useRef(null);
  const shouldAnimate = enabled && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  useLayoutEffect(() => {
    if (!shouldAnimate || !pageRef.current) return undefined;
    let context;
    let cancelled = false;
    import("gsap").then(({ gsap }) => {
      if (cancelled || !pageRef.current) return;
      context = gsap.context(() => {
        const headings = pageRef.current.querySelectorAll("h1");
        if (headings.length) gsap.fromTo(headings, { autoAlpha: 0, y: 10 }, {
          autoAlpha: 1, y: 0, duration: 0.36, stagger: 0.045, ease: "power2.out",
          clearProps: "opacity,visibility,transform",
        });
        const cards = pageRef.current.querySelectorAll(".inst-card");
        if (cards.length) gsap.fromTo(cards, { autoAlpha: 0, y: 14 }, {
          autoAlpha: 1, y: 0, duration: 0.38, stagger: 0.055, delay: 0.08,
          ease: "power2.out", clearProps: "opacity,visibility,transform",
        });
      }, pageRef);
    }).catch(() => {});
    return () => {
      cancelled = true;
      context?.revert();
    };
  }, [shouldAnimate, routeKey]);

  if (!shouldAnimate) return children;
  return (
    <div ref={pageRef} key={routeKey} className="mockx-route-motion">
      {children}
    </div>
  );
}
/* ---------------- LAZY LOADED PAGES ---------------- */

// Landing / light pages
const First = lazy(() => import("./components/First.jsx"));
const ExamCatalogPage = lazy(() => import("./components/ExamCatalogPage.jsx"));
const ReviewFaqPage = lazy(() => import("./pages/ReviewFaqPage.jsx"));

// Auth / result pages
const ResultHistory = lazy(() => import("./pages/ResultHistory.jsx"));
const ResultStat = lazy(() => import("./pages/ResultStat.jsx"));
const ResultPage = lazy(() => import("./components/ResultPage.jsx"));
const ResultDetail = lazy(() => import("./pages/ResultDetail.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const SuperAdminInstitutes = lazy(() => import("./pages/admin/SuperAdminInstitutes.jsx"));
const InstituteLogin = lazy(() => import("./pages/institute/InstituteLogin.jsx"));
const InstitutePortal = lazy(() => import("./pages/institute/InstitutePortal.jsx"));
const StudentInstitutePortal = lazy(() => import("./pages/student/StudentInstitutePortal.jsx"));

// Test Components (For debugging)
const TestError = lazy(() => import("./pages/TestError.jsx"));

// HEAVY pages (test-related)
const MockTestPage = lazy(() => import("./components/MocktestPage.jsx"));
const App = lazy(() => import("./App.jsx")); // Test engine

/* ---------------- FALLBACK UI ---------------- */

/* ---------------- ROUTE WRAPPER ---------------- */
// This wrapper ensures that if you navigate (e.g., click Back in the browser), 
// the ErrorBoundary resets itself automatically, instead of staying stuck!
const AppRoutes = () => {
  const location = useLocation();
  const pageClass = getPageClass(location.pathname);
  const motionEnabled = pageClass !== "mockx-admin-exempt" && pageClass !== "mockx-page-exam";

  return (
    <div className={"mockx-app " + pageClass}>
      <ErrorBoundary key={location.pathname}>
      <Suspense fallback={<Loader />}>
        <RouteMotion routeKey={location.pathname} enabled={motionEnabled}>
          <Routes>
          <Route path="/" element={<Navigate to={V2_ROUTES.home} replace />} />
          <Route path="/mock-tests" element={<Navigate to={V2_ROUTES.mockTests} replace />} />
          <Route path="/mock-tests/:examId" element={<Navigate to={location.pathname.replace("/mock-tests", V2_ROUTES.mockTests)} replace />} />
          <Route path="/test" element={<Navigate to={`${V2_ROUTES.test}${location.search}`} replace />} />
          <Route path="/result/:resultId" element={<Navigate to={V2_ROUTES.result(location.pathname.split('/').pop())} replace />} />
          <Route path="/result-history" element={<Navigate to={V2_ROUTES.resultHistory} replace />} />
          <Route path="/result-stat" element={<Navigate to={V2_ROUTES.resultStat} replace />} />
          <Route path="/admin" element={<Navigate to={V2_ROUTES.admin} replace />} />
          <Route path="/institute/login" element={<Navigate to={V2_ROUTES.instituteLogin} replace />} />
          <Route path="/institute/dashboard" element={<Navigate to={V2_ROUTES.instituteDashboard} replace />} />
          <Route path="/institute/student/dashboard" element={<Navigate to={V2_ROUTES.instituteStudentDashboard} replace />} />
          <Route path="/admin/institutes" element={<Navigate to={V2_ROUTES.adminInstitutes} replace />} />
          <Route path="/review-faq" element={<Navigate to={V2_ROUTES.reviewFaq} replace />} />
          <Route path="/test-error" element={<Navigate to={V2_ROUTES.testError} replace />} />
          <Route path="/loader" element={<Navigate to={V2_ROUTES.loader} replace />} />

          {/* 🏠 HOME (FAST) */}
          <Route path="/v2" element={<First />} />

          {/* 📚 MOCK CATALOG */}
          <Route path="/v2/mock-tests" element={<ExamCatalogPage />} />

          {/* 🧪 SPECIFIC EXAM PAGE */}
          <Route path="/v2/mock-tests/:examId" element={<MockTestPage />} />

          {/* 📝 TEST ENGINE (VERY HEAVY) */}
          <Route
            path="/v2/test"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />

          {/* 📊 RESULTS */}
          <Route
            path="/v2/result/:resultId"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/v2/result-history"
            element={
              <ProtectedRoute>
                <ResultHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/v2/result/:mockId"
            element={
              <ProtectedRoute>
                <ResultDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/v2/result-stat"
            element={
              <ProtectedRoute>
                <ResultStat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/v2/admin"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 🏫 INSTITUTE MANAGEMENT & STUDENT PORTAL */}
          <Route path="/v2/institute/login" element={<InstituteLogin />} />
          <Route
            path="/v2/institute/dashboard"
            element={
              <ProtectedRoute>
                <InstitutePortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/v2/institute/student/dashboard"
            element={
              <ProtectedRoute>
                <StudentInstitutePortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/v2/admin/institutes"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <SuperAdminInstitutes />
              </ProtectedRoute>
            }
          />

          <Route path="/v2/review-faq" element={<ReviewFaqPage />} />

          {/* 🛑 SECRET ROUTE TO TRIGGER ERROR BOUNDARY */}
          <Route path="/v2/test-error" element={<TestError />} />

          {/* ⏳ ROUTE TO VIEW LOADER DIRECTLY */}
          <Route path="/v2/loader" element={<Loader />} />
          <Route path="*" element={<Navigate to={V2_ROUTES.home} replace />} />
          </Routes>
        </RouteMotion>
      </Suspense>
      </ErrorBoundary>
    </div>
  );
};

/* ---------------- APP ROOT ---------------- */

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>

        <Toaster position="top-right" />
        {/* 🔐 Auth modals should stay global */}
        <AuthModals />

        <AppRoutes />

      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
