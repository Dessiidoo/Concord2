import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Radio, ArrowLeft, ArrowRight, Pause, Play, RotateCcw,
  AlertTriangle, Eye, Target, CheckCircle2, Zap, TrendingUp, Brain,
  Languages, Activity, Square,
} from 'lucide-react'
import { supabase, type Session, type Message, type Signal, type IntentShift } from '../lib/supabase'
import { scenarios, type ScenarioMessage } from '../lib/scenarios'

export default function LiveSession() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const navigate = useNavigate()

  const scenario = scenarios.find((s) => s.id === scenarioId)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [messages, setMessages] = useState<ScenarioMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [dbMessageIds, setDbMessageIds] = useState<Record<number, string>>({})
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(60).fill(20))
  const [isSaving, setIsSaving] = useState(false)
  const [sessionCreated, setSessionCreated] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Create session on mount
  useEffect(() => {
    if (!scenario || sessionCreated) return
    const createSession = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          title: scenario.title,
          scenario: scenario.id,
          status: 'active',
          language_a: scenario.languageA,
          language_b: scenario.languageB,
          participant_a: scenario.participantA,
          participant_b: scenario.participantB,
        })
        .select()
        .single()
      if (error) {
        console.error('Failed to create session:', error)
        return
      }
      setSessionId(data.id)
      setSessionCreated(true)
    }
    createSession()
  }, [scenario, sessionCreated])

  // Animate waveform
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setWaveformBars((prev) =>
        prev.map((_, i) => {
          const base = 20 + Math.abs(Math.sin(i * 0.3 + Date.now() / 800)) * 50
          return base + Math.random() * 20
        })
      )
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Play through messages
  useEffect(() => {
    if (!isPlaying || !scenario) return
    if (currentStep >= scenario.messages.length - 1) {
      setIsPlaying(false)
      endSession()
      return
    }

    const delay = currentStep === -1 ? 500 : 3500
    timerRef.current = setTimeout(() => {
      const nextStep = currentStep + 1
      const msg = scenario.messages[nextStep]
      setMessages((prev) => [...prev, msg])
      setCurrentStep(nextStep)
      saveMessageToDb(nextStep, msg)
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPlaying, currentStep, scenario])

  const saveMessageToDb = async (step: number, msg: ScenarioMessage) => {
    if (!sessionId || !scenario) return
    setIsSaving(true)
    try {
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          speaker: msg.speaker,
          speaker_label: msg.speaker === 'A' ? scenario.participantA : scenario.participantB,
          language: msg.language || (msg.speaker === 'A' ? scenario.languageA : scenario.languageB),
          original_text: msg.text,
          translated_text: msg.translatedText || msg.text,
          sequence: step,
        })
        .select()
        .single()

      if (msgError || !msgData) {
        console.error('Failed to save message:', msgError)
        return
      }

      setDbMessageIds((prev) => ({ ...prev, [step]: msgData.id }))

      const { error: sigError } = await supabase.from('signals').insert({
        session_id: sessionId,
        message_id: msgData.id,
        intent: msg.intent,
        alignment: msg.alignment,
        friction: msg.friction,
        urgency: msg.urgency,
        trajectory: msg.trajectory,
        sentiment: msg.sentiment,
        recommendation: msg.recommendation || null,
      })

      if (sigError) console.error('Failed to save signal:', sigError)

      if (msg.intentShift) {
        const { error: shiftError } = await supabase.from('intent_shifts').insert({
          session_id: sessionId,
          message_id: msgData.id,
          from_intent: msg.intentShift.from,
          to_intent: msg.intentShift.to,
          description: msg.intentShift.description,
          severity: msg.intentShift.severity,
        })
        if (shiftError) console.error('Failed to save intent shift:', shiftError)
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const endSession = useCallback(async () => {
    if (!sessionId) return
    await supabase.from('sessions').update({ status: 'completed', ended_at: new Date().toISOString() }).eq('id', sessionId)
  }, [sessionId])

  const handlePlay = () => {
    if (currentStep >= (scenario?.messages.length ?? 0) - 1) return
    setIsPlaying(true)
  }

  const handlePause = () => setIsPlaying(false)

  const handleReset = async () => {
    setIsPlaying(false)
    setMessages([])
    setCurrentStep(-1)
    setDbMessageIds({})
    if (sessionId) {
      await supabase.from('sessions').delete().eq('id', sessionId)
    }
    setSessionId(null)
    setSessionCreated(false)
  }

  if (!scenario) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-ink-300 mb-4">Scenario not found.</p>
        <Link to="/" className="text-accent hover:text-accent-glow">Return to Home</Link>
      </div>
    )
  }

  const latestSignal = messages.length > 0 ? messages[messages.length - 1] : null
  const currentShift = [...messages].reverse().find((m) => m.intentShift)?.intentShift

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm text-ink-300 hover:text-ink-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <div className="text-xs text-ink-400">{scenario.domain}</div>
            <h1 className="text-xl font-bold text-ink-100">{scenario.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button onClick={handlePause} className="p-2.5 rounded-lg glass-light hover:bg-ink-700/60 transition-all">
              <Pause className="w-4 h-4 text-ink-200" />
            </button>
          ) : (
            <button
              onClick={handlePlay}
              disabled={currentStep >= scenario.messages.length - 1}
              className="p-2.5 rounded-lg glass-light hover:bg-ink-700/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 text-ink-200" />
            </button>
          )}
          <button onClick={handleReset} className="p-2.5 rounded-lg glass-light hover:bg-ink-700/60 transition-all">
            <RotateCcw className="w-4 h-4 text-ink-200" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: Transcript + Waveform */}
        <div className="lg:col-span-2 space-y-4">
          {/* Waveform */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-ink-100">Live Waveform</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {isPlaying ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-signal-urgency animate-pulse" />
                    <span className="text-signal-urgency">Live</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-ink-500" />
                    <span className="text-ink-400">{currentStep >= scenario.messages.length - 1 && currentStep >= 0 ? 'Session Ended' : 'Paused'}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-end justify-center gap-0.5 h-20">
              {waveformBars.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t transition-all duration-200 ${
                    isPlaying
                      ? 'bg-gradient-to-t from-accent/40 to-accent'
                      : 'bg-gradient-to-t from-ink-600 to-ink-500'
                  }`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
              <span>{scenario.participantA} ({scenario.languageA.toUpperCase()})</span>
              <span>{scenario.participantB} ({scenario.languageB.toUpperCase()})</span>
            </div>
          </div>

          {/* Transcript */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-ink-100">Transcript</span>
              </div>
              {isSaving && <span className="text-xs text-ink-400">Saving...</span>}
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {messages.length === 0 && (
                <div className="text-center py-12 text-ink-400 text-sm">
                  {isPlaying ? 'Listening...' : 'Press play to begin the conversation simulation.'}
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.speaker === 'A' ? 'justify-start' : 'justify-end'} animate-fade-in`}
                >
                  <div className={`max-w-[80%] ${msg.speaker === 'A' ? 'items-start' : 'items-end'} flex flex-col gap-1`}>
                    <div className="flex items-center gap-2 text-xs text-ink-400">
                      {msg.speaker === 'A' ? (
                        <>
                          <span>{scenario.participantA}</span>
                          {msg.language && msg.language !== 'en' && <Languages className="w-3 h-3" />}
                        </>
                      ) : (
                        <>
                          {msg.language && msg.language !== 'en' && <Languages className="w-3 h-3" />}
                          <span>{scenario.participantB}</span>
                        </>
                      )}
                    </div>
                    <div
                      className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                        msg.speaker === 'A'
                          ? 'bg-signal-intent/10 border border-signal-intent/20 text-ink-100'
                          : 'bg-signal-trajectory/10 border border-signal-trajectory/20 text-ink-100'
                      }`}
                    >
                      <p>{msg.text}</p>
                      {msg.translatedText && (
                        <p className="mt-2 pt-2 border-t border-ink-600/30 text-xs text-ink-300 italic">
                          {msg.translatedText}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        msg.trajectory === 'escalating' ? 'bg-signal-urgency/15 text-signal-urgency' :
                        msg.trajectory === 'diverging' ? 'bg-signal-friction/15 text-signal-friction' :
                        msg.trajectory === 'converging' ? 'bg-signal-alignment/15 text-signal-alignment' :
                        msg.trajectory === 'de-escalating' ? 'bg-signal-alignment/15 text-signal-alignment' :
                        'bg-ink-600/30 text-ink-300'
                      }`}>
                        {msg.trajectory}
                      </span>
                      <span className="text-xs text-ink-400">{msg.intent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Analysis Panel */}
        <div className="space-y-4">
          {/* Current State */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-ink-100">Current State</span>
            </div>
            {latestSignal ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-signal-intent" />
                    <span className="text-xs text-ink-400">Intent</span>
                  </div>
                  <div className="text-base font-semibold text-ink-100">{latestSignal.intent}</div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <SignalBar label="Alignment" value={latestSignal.alignment} colorClass="text-signal-alignment" barClass="bg-signal-alignment" icon={CheckCircle2} />
                  <SignalBar label="Friction" value={latestSignal.friction} colorClass="text-signal-friction" barClass="bg-signal-friction" icon={AlertTriangle} />
                  <SignalBar label="Urgency" value={latestSignal.urgency} colorClass="text-signal-urgency" barClass="bg-signal-urgency" icon={Zap} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-signal-trajectory" />
                    <span className="text-xs text-ink-400">Trajectory</span>
                  </div>
                  <div className="text-sm font-medium text-ink-100 capitalize">{latestSignal.trajectory}</div>
                </div>

                <div>
                  <span className="text-xs text-ink-400">Sentiment</span>
                  <div className="text-sm text-ink-200 mt-1">{latestSignal.sentiment}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-ink-400 text-sm">
                Waiting for conversational input...
              </div>
            )}
          </div>

          {/* Intent Shift */}
          {currentShift && (
            <div className="glass rounded-2xl p-6 glow-amber animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-signal-urgency" />
                <span className="text-sm font-semibold text-signal-urgency">Intent Shift Detected</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1.5 rounded-lg bg-signal-intent/15 text-signal-intent text-sm font-medium">
                  {currentShift.from}
                </span>
                <ArrowRight className="w-4 h-4 text-ink-400" />
                <span className="px-3 py-1.5 rounded-lg bg-signal-friction/15 text-signal-friction text-sm font-medium">
                  {currentShift.to}
                </span>
              </div>
              <p className="text-sm text-ink-200 leading-relaxed mb-4">{currentShift.description}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-400">Severity:</span>
                <span className={`font-medium ${
                  currentShift.severity === 'high' ? 'text-signal-urgency' :
                  currentShift.severity === 'medium' ? 'text-signal-friction' : 'text-ink-300'
                }`}>
                  {currentShift.severity}
                </span>
              </div>
            </div>
          )}

          {/* Recommendation */}
          {latestSignal?.recommendation && (
            <div className="glass rounded-2xl p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-accent">Recommendation</span>
              </div>
              <p className="text-sm text-ink-200 leading-relaxed">{latestSignal.recommendation}</p>
            </div>
          )}

          {/* Session Info */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Square className="w-4 h-4 text-ink-400" />
              <span className="text-sm font-semibold text-ink-100">Session</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-400">Messages</span>
                <span className="text-ink-200">{messages.length} / {scenario.messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-400">Status</span>
                <span className={isPlaying ? 'text-signal-urgency' : currentStep >= scenario.messages.length - 1 && currentStep >= 0 ? 'text-signal-alignment' : 'text-ink-300'}>
                  {isPlaying ? 'Active' : currentStep >= scenario.messages.length - 1 && currentStep >= 0 ? 'Completed' : 'Ready'}
                </span>
              </div>
              {sessionId && (
                <div className="flex justify-between">
                  <span className="text-ink-400">Saved</span>
                  <span className="text-signal-alignment">Yes</span>
                </div>
              )}
            </div>
            {currentStep >= scenario.messages.length - 1 && currentStep >= 0 && (
              <Link
                to="/sessions"
                className="mt-4 w-full flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-all"
              >
                View in Archive
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SignalBar({ label, value, colorClass, barClass, icon: Icon }: { label: string; value: number; colorClass: string; barClass: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
          <span className="text-xs text-ink-400">{label}</span>
        </div>
        <span className={`text-xs font-medium ${colorClass}`}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-ink-700/50 overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
