import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Archive, ArrowRight, Clock, Radio, Building2, Shield, Globe } from 'lucide-react'
import { supabase, type Session } from '../lib/supabase'
import { scenarios } from '../lib/scenarios'

const domainIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Government & Diplomacy': Shield,
  'Enterprise': Building2,
  'Defense & Security': Radio,
  'Global Organizations': Globe,
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Failed to fetch sessions:', error)
      }
      setSessions(data || [])
      setLoading(false)
    }
    fetchSessions()
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Archive className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink-100">Session Archive</h1>
          <p className="text-sm text-ink-400">Recorded conversations and their analysis</p>
        </div>
      </div>

      {/* Quick Launch */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-ink-300 mb-3">Launch a new simulation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {scenarios.map((scenario) => {
            const Icon = domainIcons[scenario.domain] || Radio
            return (
              <Link
                key={scenario.id}
                to={`/live/${scenario.id}`}
                className="glass rounded-xl p-4 hover:bg-ink-800/60 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink-100 group-hover:text-accent transition-colors">{scenario.title}</div>
                    <div className="text-xs text-ink-400 mt-1">{scenario.domain}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Past Sessions */}
      <div>
        <h2 className="text-sm font-semibold text-ink-300 mb-3">Recorded sessions</h2>
        {loading ? (
          <div className="text-center py-12 text-ink-400 text-sm">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Archive className="w-10 h-10 text-ink-500 mx-auto mb-3" />
            <p className="text-ink-300 text-sm">No sessions recorded yet. Launch a simulation above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => {
              const scenario = scenarios.find((s) => s.id === session.scenario)
              const Icon = (scenario && domainIcons[scenario.domain]) || Radio
              return (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="glass rounded-xl p-5 hover:bg-ink-800/60 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-accent" />
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      session.status === 'completed' ? 'bg-signal-alignment/15 text-signal-alignment' :
                      session.status === 'active' ? 'bg-signal-urgency/15 text-signal-urgency' :
                      'bg-ink-600/30 text-ink-300'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-ink-100 group-hover:text-accent transition-colors mb-1">
                    {session.title}
                  </h3>
                  <div className="text-xs text-ink-400 mb-3">{session.participant_a} vs {session.participant_b}</div>
                  <div className="flex items-center justify-between text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-1 text-accent">
                      View
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
