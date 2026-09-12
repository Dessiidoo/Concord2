import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LiveSession from './pages/LiveSession'
import Sessions from './pages/Sessions'
import SessionDetail from './pages/SessionDetail'
import PitchDeck from './pages/PitchDeck'
import FreeAnalysis from './pages/FreeAnalysis'
import LiveVoice from './pages/LiveVoice'
import Layout from './components/Layout'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/sessions/:id" element={<SessionDetail />} />
        <Route path="/live/:scenarioId" element={<LiveSession />} />
        <Route path="/pitch" element={<PitchDeck />} />
        <Route path="/analyze" element={<FreeAnalysis />} />
        <Route path="/voice" element={<LiveVoice />} />
      </Route>
    </Routes>
  )
}
