// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import ResultStat from "./pages/ResultStat.jsx";

// import "./index.css";
// import ResultHistory from "./pages/ResultHistory.jsx";
// import ResultDetail from "./pages/ResultDetail.jsx";
// import First from "./components/First.jsx";
// import MockTestPage from "./components/MocktestPage.jsx";
// import App from "./App.jsx";
// import ResultPage from "./components/ResultPage.jsx";
// import ExamCatalogPage from "./components/ExamCatalogPage.jsx";
// import ReviewFaqPage from "./pages/ReviewFaqPage.jsx";

// import ProtectedRoute from "./routes/ProtectedRoute.jsx";
// import { AuthProvider } from "./context/AuthContext.jsx";
// import AuthModals from "./pages/AuthModals.jsx";

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//       <BrowserRouter>
//     <AuthProvider>

//         {/* ✅ AUTH MODALS LIVE HERE */}
//         <AuthModals />

//         <Routes>
          
//           <Route path="/" element={<First />} />
//           <Route path="/result-history" element={<ProtectedRoute><ResultHistory /></ProtectedRoute>} />
// {/* 
//           <Route
//             path="/mock-tests"
//             element={
//               <ProtectedRoute>
//                 <MockTestPage />
//               </ProtectedRoute>
//             }
//           /> */}
//          {/* <Route
//   path="/result/:mockId"
//   element={
//     <ProtectedRoute>
//       <ResultDetail />
//     </ProtectedRoute>
//   }
// /> */}

// <Route path="/mock-tests" element={<ExamCatalogPage />} />

// <Route path="/mock-tests/imucet" element={<MockTestPage />} />

// <Route path="/result/:resultId" element={<ResultPage />} />

//           <Route
//             path="/test"
//             element={
//               <ProtectedRoute>
//                 <App />
//               </ProtectedRoute>
//             }
//           />

          
//           <Route
//   path="/result-stat"
//   element={

//       <ResultStat />
    
//   }
// />


// <Route path="/review-faq" element={<ReviewFaqPage />} />
//         </Routes>

//     </AuthProvider>
//       </BrowserRouter>
//   </StrictMode>
// );
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import "./index.css";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AuthModals from "./pages/AuthModals.jsx";
import { Toaster } from "react-hot-toast";
import Loader from "./components/Loader.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

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

  return (
    <ErrorBoundary key={location.pathname}>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* 🏠 HOME (FAST) */}
          <Route path="/" element={<First />} />

          {/* 📚 MOCK CATALOG */}
          <Route path="/mock-tests" element={<ExamCatalogPage />} />

          {/* 🧪 SPECIFIC EXAM PAGE */}
          <Route path="/mock-tests/imucet" element={<MockTestPage />} />

          {/* 📝 TEST ENGINE (VERY HEAVY) */}
          <Route
            path="/test"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />

          {/* 📊 RESULTS */}
          <Route
            path="/result/:resultId"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result-history"
            element={
              <ProtectedRoute>
                <ResultHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result/:mockId"
            element={
              <ProtectedRoute>
                <ResultDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result-stat"
            element={
              <ProtectedRoute>
                <ResultStat />
              </ProtectedRoute>
            }
          />

          <Route path="/review-faq" element={<ReviewFaqPage />} />

          {/* 🛑 SECRET ROUTE TO TRIGGER ERROR BOUNDARY */}
          <Route path="/test-error" element={<TestError />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
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
