import { Link, useLocation, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Activity, Radio, Archive, Home, Presentation, MessageSquare, Mic } from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const isLanding = location.pathname === '/'
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/sessions', label: 'Archive', icon: Archive },
    { to: '/pitch', label: 'Pitch Deck', icon: Presentation },
    { to: '/analyze', label: 'Freeform', icon: MessageSquare },
    { to: '/voice', label: 'Voice', icon: Mic },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isLanding ? 'glass' : 'glass'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent/20 to-signal-intent/20 group-hover:from-accent/30 group-hover:to-signal-intent/30 transition-all" />
              <Activity className="w-5 h-5 text-accent relative z-10" />
            </div>
            <div>
              <span className="font-semibold text-ink-100 text-lg tracking-tight">CONCORD</span>
              <span className="text-ink-400 text-xs ml-2 hidden sm:inline">Conversational Intelligence</span>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.to || (item.to === '/sessions' && location.pathname.startsWith('/sessions')) || (item.to === '/analyze' && location.pathname.startsWith('/analyze')) || (item.to === '/voice' && location.pathname.startsWith('/voice'))
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'text-accent bg-accent/10'
                      : 'text-ink-300 hover:text-ink-100 hover:bg-ink-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-ink-700/30 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink-400">
          <span>CONCORD — Conversational Intelligence for High-Stakes Communication</span>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-4">
            <span className="text-ink-300 font-medium">Loretta Chapman</span>
            <span className="font-mono">
              {now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} · {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
