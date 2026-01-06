import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ResultStat from "./pages/ResultStat.jsx";

import "./index.css";
import ResultHistory from "./pages/ResultHistory.jsx";
import ResultDetail from "./pages/ResultDetail.jsx";
import First from "./components/First.jsx";
import MockTestPage from "./components/MocktestPage.jsx";
import App from "./App.jsx";
import ResultPage from "./components/ResultPage.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AuthModals from "./pages/AuthModals.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
      <BrowserRouter>
    <AuthProvider>

        {/* ✅ AUTH MODALS LIVE HERE */}
        <AuthModals />

        <Routes>
          
          <Route path="/" element={<First />} />
          <Route path="/result-history" element={<ProtectedRoute><ResultHistory /></ProtectedRoute>} />

          <Route
            path="/mock-tests"
            element={
              <ProtectedRoute>
                <MockTestPage />
              </ProtectedRoute>
            }
          />
         {/* <Route
  path="/result/:mockId"
  element={
    <ProtectedRoute>
      <ResultDetail />
    </ProtectedRoute>
  }
/> */}

<Route path="/result/:resultId" element={<ResultPage />} />

          <Route
            path="/test"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />

          
          <Route
  path="/result-stat"
  element={

      <ResultStat />
    
  }
/>

        </Routes>

    </AuthProvider>
      </BrowserRouter>
  </StrictMode>
);
