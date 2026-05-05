import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ChatAssistant from './components/ChatAssistant'
import LandingPage from './pages/LandingPage'
import SurveyPage from './pages/SurveyPage'
import ResultPage from './pages/ResultPage'
import AdminPanel from './pages/AdminPanel'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="page-wrapper">
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/survey"  element={<SurveyPage />} />
          <Route path="/result"  element={<ResultPage />} />
          <Route path="/admin"   element={<AdminPanel />} />
        </Routes>
      </main>
      <ChatAssistant />
    </BrowserRouter>
  )
}
