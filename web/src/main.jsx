import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import First from './components/First.jsx'
import MockTestPage from "./components/MocktestPage.jsx"
import App from './App.jsx'
import ResultPage from './components/ResultPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<First />} />
        <Route path="/mock-tests" element={<MockTestPage />} />
        <Route path="/test" element={<App />} /> 
        <Route path="/result" element={<ResultPage />} /> 
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
