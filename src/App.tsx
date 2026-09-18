import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { PhoneConfigProvider } from './components/PhoneViewer/PhoneConfigProvider'
import { StoryTracker } from './components/PhoneViewer/usePhoneScroll'
import { HomePage } from './pages/HomePage'
import { CamerasPage } from './pages/CamerasPage'
import { PerformancePage } from './pages/PerformancePage'
import { DisplayPage } from './pages/DisplayPage'
import { SoftwarePage } from './pages/SoftwarePage'
import { SpecificationsPage } from './pages/SpecificationsPage'

/** Resets scroll on route change; scrolls to an in-page anchor when present. */
function ScrollManager() {
  const location = useLocation()
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      if (el) {
        el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <PhoneConfigProvider>
        <ScrollManager />
        <StoryTracker />
        <div className="min-h-screen bg-night text-ink antialiased">
          <Navbar />
          <main id="main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/cameras" element={<CamerasPage />} />
              <Route path="/performance" element={<PerformancePage />} />
              <Route path="/display" element={<DisplayPage />} />
              <Route path="/software" element={<SoftwarePage />} />
              <Route path="/specifications" element={<SpecificationsPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </PhoneConfigProvider>
    </BrowserRouter>
  )
}

export default App