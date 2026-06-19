import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './hooks/useToast'
import Navbar from './components/Navbar'
import Toast from './components/Toast'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import Saved from './pages/Saved'

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen" style={{ background: '#0A0F1E' }}>
        <Navbar />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <Toast />
      </div>
    </ToastProvider>
  )
}
