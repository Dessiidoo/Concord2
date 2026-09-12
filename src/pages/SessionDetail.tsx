import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, Eye, Target, CheckCircle2, Zap, TrendingUp,
  Brain, Languages, Radio, Clock,
} from 'lucide-react'
import { supabase, type Session, type Message, type Signal, type IntentShift } from '../lib/supabase'
import { scenarios } from '../lib/scenarios'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [signals, setSignals] = useState<Signal[]>([])
  const [shifts, setShifts] = useState<IntentShift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      const [{ data: sess }, { data: msgs }, { data: sigs }, { data: sfts }] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', id).maybeSingle(),
        supabase.from('messages').select('*').eq('session_id', id).order('sequence', { ascending: true }),
        supabase.from('signals').select('*').eq('session_id', id).order('created_at', { ascending: true }),
        supabase.from('intent_shifts').select('*').eq('session_id', id).order('created_at', { ascending: true }),
      ])
      setSession(sess as Session | null)
      setMessages(msgs || [])
      setSignals(sigs || [])
      setShifts(sfts || [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-ink-400 text-sm">Loading session...</div>
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-ink-300 mb-4">Session not found.</p>
        <Link to="/sessions" className="text-accent hover:text-accent-glow">Back to Archive</Link>
      </div>
    )
  }

  const scenario = scenarios.find((s) => s.id === session.scenario)
  const signalMap = new Map(signals.map((s) => [s.message_id, s]))
  const shiftMap = new Map(shifts.map((s) => [s.message_id, s]))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/sessions" className="flex items-center gap-1 text-sm text-ink-300 hover:text-ink-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Archive
          </Link>
          <div>
            <div className="text-xs text-ink-400">{scenario?.domain || 'Custom'}</div>
            <h1 className="text-xl font-bold text-ink-100">{session.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className={`px-2 py-0.5 rounded ${
            session.status === 'completed' ? 'bg-signal-alignment/15 text-signal-alignment' : 'bg-signal-urgency/15 text-signal-urgency'
          }`}>
            {session.status}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Transcript with inline signals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-ink-100">Conversation Transcript</span>
              <span className="text-xs text-ink-400 ml-auto">{messages.length} messages</span>
            </div>
            <div className="space-y-4">
              {messages.map((msg) => {
                const signal = signalMap.get(msg.id)
                const shift = shiftMap.get(msg.id)
                return (
                  <div key={msg.id} className="animate-fade-in">
                    <div className={`flex ${msg.speaker === 'A' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] flex flex-col gap-1 ${msg.speaker === 'A' ? 'items-start' : 'items-end'}`}>
                        <div className="flex items-center gap-2 text-xs text-ink-400">
                          <span>{msg.speaker_label}</span>
                          {msg.language !== 'en' && <Languages className="w-3 h-3" />}
                        </div>
                        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                          msg.speaker === 'A'
                            ? 'bg-signal-intent/10 border border-signal-intent/20 text-ink-100'
                            : 'bg-signal-trajectory/10 border border-signal-trajectory/20 text-ink-100'
                        }`}>
                          <p>{msg.original_text}</p>
                          {msg.translated_text && msg.translated_text !== msg.original_text && (
                            <p className="mt-2 pt-2 border-t border-ink-600/30 text-xs text-ink-300 italic">
                              {msg.translated_text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline signal */}
                    {signal && (
                      <div className={`mt-2 ml-4 ${msg.speaker === 'B' ? 'mr-4 text-right' : ''}`}>
                        <div className="inline-flex items-center gap-3 text-xs text-ink-400 glass-light rounded-lg px-3 py-1.5">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-signal-intent" />
                            {signal.intent}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-signal-alignment" />
                            {signal.alignment}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-signal-friction" />
                            {signal.friction}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-signal-urgency" />
                            {signal.urgency}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-signal-trajectory" />
                            {signal.trajectory}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Inline intent shift */}
                    {shift && (
                      <div className="mt-2 ml-4 glass rounded-lg p-3 border border-signal-urgency/30 glow-amber">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-signal-urgency" />
                          <span className="text-xs font-semibold text-signal-urgency">Intent Shift</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded bg-signal-intent/15 text-signal-intent text-xs font-medium">
                            {shift.from_intent}
                          </span>
                          <span className="text-ink-400 text-xs">→</span>
                          <span className="px-2 py-1 rounded bg-signal-friction/15 text-signal-friction text-xs font-medium">
                            {shift.to_intent}
                          </span>
                        </div>
                        <p className="text-xs text-ink-200 leading-relaxed">{shift.description}</p>
                      </div>
                    )}

                    {/* Inline recommendation */}
                    {signal?.recommendation && (
                      <div className={`mt-2 ml-4 glass-light rounded-lg p-3 border-l-2 border-accent`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-semibold text-accent">Recommendation</span>
                        </div>
                        <p className="text-xs text-ink-200 leading-relaxed">{signal.recommendation}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          {/* Participants */}
          <div className="glass rounded-2xl p-6">
            <span className="text-sm font-semibold text-ink-100 mb-3 block">Participants</span>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-200">{session.participant_a}</span>
                <span className="text-xs text-ink-400">{session.language_a.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-200">{session.participant_b}</span>
                <span className="text-xs text-ink-400">{session.language_b.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Intent Shifts Summary */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-ink-100">Intent Shifts</span>
              <span className="text-xs text-ink-400 ml-auto">{shifts.length} detected</span>
            </div>
            {shifts.length === 0 ? (
              <p className="text-sm text-ink-400">No significant intent shifts were detected in this session.</p>
            ) : (
              <div className="space-y-3">
                {shifts.map((shift) => (
                  <div key={shift.id} className="glass-light rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded bg-signal-intent/15 text-signal-intent text-xs font-medium">
                        {shift.from_intent}
                      </span>
                      <span className="text-ink-400 text-xs">→</span>
                      <span className="px-2 py-0.5 rounded bg-signal-friction/15 text-signal-friction text-xs font-medium">
                        {shift.to_intent}
                      </span>
                    </div>
                    <p className="text-xs text-ink-200 leading-relaxed">{shift.description}</p>
                    <div className="mt-2 text-xs">
                      <span className="text-ink-400">Severity: </span>
                      <span className={`font-medium ${
                        shift.severity === 'high' ? 'text-signal-urgency' :
                        shift.severity === 'medium' ? 'text-signal-friction' : 'text-ink-300'
                      }`}>{shift.severity}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Final State */}
          {signals.length > 0 && (() => {
            const last = signals[signals.length - 1]
            return (
              <div className="glass rounded-2xl p-6">
                <span className="text-sm font-semibold text-ink-100 mb-4 block">Final State</span>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-3.5 h-3.5 text-signal-intent" />
                      <span className="text-xs text-ink-400">Intent</span>
                    </div>
                    <span className="text-sm text-ink-100">{last.intent}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-signal-trajectory" />
                      <span className="text-xs text-ink-400">Trajectory</span>
                    </div>
                    <span className="text-sm text-ink-100 capitalize">{last.trajectory}</span>
                  </div>
                  <div>
                    <span className="text-xs text-ink-400">Sentiment</span>
                    <p className="text-sm text-ink-200 mt-1">{last.sentiment}</p>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
