import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";

import First from "./components/First.jsx";
import MockTestPage from "./components/MocktestPage.jsx";
import App from "./App.jsx";
import ResultPage from "./components/ResultPage.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AuthModals from "./pages/AuthModals.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>

        {/* ✅ AUTH MODALS LIVE HERE */}
        <AuthModals />

        <Routes>
          
          <Route path="/" element={<First />} />

          <Route
            path="/mock-tests"
            element={
              <ProtectedRoute>
                <MockTestPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/test"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />

          <Route path="/result" element={<ResultPage />} />
        </Routes>

      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
