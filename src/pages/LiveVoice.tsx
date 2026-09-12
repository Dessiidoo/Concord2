import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Radio, Activity, Target, AlertTriangle, TrendingUp,
  Eye, Brain, Loader2, Trash2, Wifi, Square, Waves,
  CheckCircle2, Zap,
} from 'lucide-react'

type Analysis = {
  intent: string
  alignment: number
  friction: number
  urgency: number
  trajectory: 'converging' | 'diverging' | 'stable' | 'escalating' | 'de-escalating'
  sentiment: string
  recommendation: string
  intentShift: boolean
  shiftDescription: string
}

type Entry = {i
  id: number
  text: string
  speaker: 'A' | 'B'
  analysis: Analysis
  timestamp: string
}

const trajectoryColors: Record<string, string> = {
  converging: 'text-signal-alignment',
  diverging: 'text-signal-friction',
  stable: 'text-ink-300',
  escalating: 'text-signal-urgency',
  'de-escalating': 'text-signal-alignment',
}

const trajectoryLabels: Record<string, string> = {
  converging: 'Converging',
  diverging: 'Diverging',
  stable: 'Stable',
  escalating: 'Escalating',
  'de-escalating': 'De-escalating',
}

const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-conversation`

async function callGeminiAnalysis(message: string, speaker: string, history: { speaker: string; text: string }[]): Promise<Analysis> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ message, speaker, history }),
  })
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errBody.error || `Request failed (${response.status})`)
  }
  const data = await response.json()
  if (data.error) throw new Error(data.error)
  if (!data.analysis) throw new Error('No analysis returned')
  return data.analysis as Analysis
}

type SpeechRecognitionType = {
  new (): SpeechRecognitionInstance
}
interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: { transcript: string }
}

function getSpeechRecognition(): SpeechRecognitionType | null {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionType; webkitSpeechRecognition?: SpeechRecognitionType }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export default function LiveVoice() {
  const [speaker, setSpeaker] = useState<'A' | 'B'>('A')
  const [entries, setEntries] = useState<Entry[]>([])
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(true)
  const [autoMode, setAutoMode] = useState(false)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const entriesRef = useRef<Entry[]>([])
  const speakerRef = useRef<'A' | 'B'>('A')
  const autoModeRef = useRef(false)

  entriesRef.current = entries
  speakerRef.current = speaker
  autoModeRef.current = autoMode

  useEffect(() => {
    const SR = getSpeechRecognition()
    if (!SR) {
      setSupported(false)
      return
    }
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        setTranscript((prev) => prev + final)
        setInterimTranscript('')

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => {
          submitTranscript()
        }, 1500)
      } else {
        setInterimTranscript(interim)
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => {
          submitTranscript()
        }, 2500)
      }
    }

    recognition.onerror = (e: Event) => {
      const err = e as unknown as { error?: string }
      if (err.error === 'no-speech' || err.error === 'aborted') return
      if (err.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone permission in your browser.')
        setListening(false)
        setAutoMode(false)
      } else {
        setError(`Speech recognition error: ${err.error || 'unknown'}`)
      }
    }

    recognition.onend = () => {
      if (autoModeRef.current) {
        try { recognition.start() } catch { /* already started */ }
      } else {
        setListening(false)
      }
    }

    recognitionRef.current = recognition

    return () => {
      autoModeRef.current = false
      try { recognition.abort() } catch { /* noop */ }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }
  }, [])

  const transcriptRef = useRef('')
  const loadingRef = useRef(false)
  transcriptRef.current = transcript + interimTranscript

  const submitTranscript = useCallback(async () => {
    const text = transcriptRef.current.trim()
    if (text.length < 3 || loadingRef.current) return

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    loadingRef.current = true
    setLoading(true)
    setError(null)

    const currentSpeaker = speakerRef.current
    const history = entriesRef.current.map((e) => ({ speaker: e.speaker, text: e.text }))

    try {
      const analysis = await callGeminiAnalysis(text, currentSpeaker, history)
      const entry: Entry = {
        id: Date.now(),
        text,
        speaker: currentSpeaker,
        analysis,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      }
      setEntries((prev) => [...prev, entry])
      setTranscript('')
      setSpeaker((prev) => (prev === 'A' ? 'B' : 'A'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  const startListening = () => {
    if (!recognitionRef.current) return
    setError(null)
    setAutoMode(true)
    autoModeRef.current = true
    setListening(true)
    setTranscript('')
    setInterimTranscript('')
    try { recognitionRef.current.start() } catch { /* already started */ }
  }

  const stopListening = () => {
    setAutoMode(false)
    autoModeRef.current = false
    setListening(false)
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* noop */ }
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (transcript.trim().length >= 3) {
      submitTranscript()
    }
  }

  const clearAll = () => {
    setEntries([])
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setSpeaker('A')
  }

  const latestAnalysis = entries.length > 0 ? entries[entries.length - 1].analysis : null

  const signalBars = (a: Analysis) => [
    { label: 'Alignment', value: a.alignment, color: 'bg-signal-alignment', text: 'text-signal-alignment', icon: CheckCircle2 },
    { label: 'Friction', value: a.friction, color: 'bg-signal-friction', text: 'text-signal-friction', icon: AlertTriangle },
    { label: 'Urgency', value: a.urgency, color: 'bg-signal-urgency', text: 'text-signal-urgency', icon: Zap },
  ]

  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <Radio className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-100">Live Voice Analysis</h1>
              <p className="text-xs text-ink-400">Speak into your microphone — Concord AI analyzes in real time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {supported && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-signal-alignment/10 text-signal-alignment text-xs font-medium">
                <Wifi className="w-3 h-3" />
                <span>AI Live</span>
              </div>
            )}
            {entries.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-3 py-2 rounded-lg glass-light text-ink-300 hover:text-signal-urgency transition-colors text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {!supported && (
          <div className="glass rounded-2xl p-8 text-center border border-signal-friction/30 mb-6">
            <AlertTriangle className="w-10 h-10 text-signal-friction mx-auto mb-3" />
            <h3 className="text-base font-semibold text-ink-100 mb-2">Voice Recognition Not Available</h3>
            <p className="text-sm text-ink-400 max-w-md mx-auto leading-relaxed">
              Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari for live voice analysis.
              You can still use the Freeform Analysis page to type messages manually.
            </p>
          </div>
        )}

        {supported && (
          <>
            {/* Tension Dashboard */}
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              {/* Live Signal Gauges */}
              <div className="lg:col-span-2 glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-ink-100">Tension Dashboard</span>
                  </div>
                  {listening && (
                    <div className="flex items-center gap-1.5 text-xs text-signal-urgency">
                      <span className="w-2 h-2 rounded-full bg-signal-urgency animate-pulse" />
                      Listening
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {latestAnalysis ? signalBars(latestAnalysis).map((bar) => {
                    const Icon = bar.icon
                    return (
                      <div key={bar.label} className="text-center">
                        <div className={`relative w-24 h-24 mx-auto mb-2`}>
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(54,64,96,0.3)" strokeWidth="6" />
                            <motion.circle
                              cx="50" cy="50" r="42" fill="none" stroke="currentColor"
                              strokeWidth="6" strokeLinecap="round"
                              className={bar.text}
                              initial={{ strokeDasharray: '0 264' }}
                              animate={{ strokeDasharray: `${(bar.value / 100) * 264} 264` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Icon className={`w-4 h-4 ${bar.text} mb-1`} />
                            <span className={`text-lg font-bold font-mono ${bar.text}`}>{bar.value}</span>
                          </div>
                        </div>
                        <span className="text-xs text-ink-400 font-medium">{bar.label}</span>
                      </div>
                    )
                  }) : (
                    [0, 1, 2].map((i) => (
                      <div key={i} className="text-center">
                        <div className="w-24 h-24 mx-auto mb-2 flex items-center justify-center">
                          <div className="w-full h-full rounded-full border-4 border-ink-700/30 flex items-center justify-center">
                            <span className="text-2xl font-bold text-ink-600 font-mono">—</span>
                          </div>
                        </div>
                        <span className="text-xs text-ink-500">{['Alignment', 'Friction', 'Urgency'][i]}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Trajectory + Intent */}
                {latestAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 pt-5 border-t border-ink-700/30 grid grid-cols-2 gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-signal-intent" />
                      <span className="text-xs text-ink-400">Intent</span>
                      <span className="text-sm font-semibold text-ink-100 ml-auto">{latestAnalysis.intent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className={`w-4 h-4 ${trajectoryColors[latestAnalysis.trajectory]}`} />
                      <span className="text-xs text-ink-400">Trajectory</span>
                      <span className={`text-sm font-semibold ml-auto ${trajectoryColors[latestAnalysis.trajectory]}`}>
                        {trajectoryLabels[latestAnalysis.trajectory]}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Intent Shift Alert */}
                <AnimatePresence>
                  {latestAnalysis?.intentShift && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-signal-urgency/8 border border-signal-urgency/20"
                    >
                      <AlertTriangle className="w-4 h-4 text-signal-urgency flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-signal-urgency block mb-0.5">Intent Shift Detected</span>
                        <p className="text-xs text-ink-200 leading-relaxed">{latestAnalysis.shiftDescription}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recommendation */}
                {latestAnalysis && (
                  <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-accent/8 border border-accent/20">
                    <Eye className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-ink-200 leading-relaxed">{latestAnalysis.recommendation}</p>
                  </div>
                )}
              </div>

              {/* Mic Control */}
              <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
                <div className="text-xs text-ink-400 mb-4">Current Speaker</div>
                <div className="flex rounded-lg overflow-hidden border border-ink-600 mb-6">
                  <button
                    onClick={() => setSpeaker('A')}
                    disabled={listening}
                    className={`px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50 ${speaker === 'A' ? 'bg-accent text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}
                  >
                    Speaker A
                  </button>
                  <button
                    onClick={() => setSpeaker('B')}
                    disabled={listening}
                    className={`px-4 py-2 text-sm font-bold transition-colors disabled:opacity-50 ${speaker === 'B' ? 'bg-accent text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}
                  >
                    Speaker B
                  </button>
                </div>

                {/* Mic Button */}
                <button
                  onClick={listening ? stopListening : startListening}
                  disabled={loading || !supported}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                    listening
                      ? 'bg-signal-urgency/20 border-2 border-signal-urgency glow-red'
                      : 'bg-accent/15 border-2 border-accent/40 hover:bg-accent/25 hover:border-accent/60 glow-cyan'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {listening ? (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-signal-urgency/40"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <Square className="w-8 h-8 text-signal-urgency" />
                    </>
                  ) : (
                    <Mic className="w-8 h-8 text-accent" />
                  )}
                </button>
                <span className="text-xs text-ink-400 mt-4 text-center">
                  {listening ? 'Tap to stop' : 'Tap to start speaking'}
                </span>

                {/* Live Transcript */}
                {(listening || transcript || interimTranscript) && (
                  <div className="mt-4 w-full">
                    <div className="glass-light rounded-xl p-3 min-h-[80px] max-h-[120px] overflow-y-auto">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Waves className="w-3 h-3 text-accent animate-pulse" />
                        <span className="text-xs text-ink-500">Live transcript</span>
                      </div>
                      <p className="text-sm text-ink-100 leading-relaxed">
                        {transcript}
                        <span className="text-ink-400 italic">{interimTranscript}</span>
                        {loading && <span className="text-accent ml-1"><Loader2 className="w-3 h-3 inline animate-spin" /></span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass rounded-xl p-4 mb-6 border border-signal-urgency/30"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-signal-urgency flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-signal-urgency mb-1">Error</p>
                      <p className="text-xs text-ink-300 leading-relaxed">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversation Log */}
            {entries.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-semibold text-ink-100">Conversation Log</h2>
                  <span className="text-xs text-ink-500">({entries.length} messages analyzed)</span>
                </div>
                <AnimatePresence initial={false}>
                  {entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`glass rounded-xl p-5 ${entry.analysis.intentShift ? 'ring-1 ring-signal-urgency/30' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.speaker === 'A' ? 'bg-signal-intent/15' : 'bg-signal-trajectory/15'}`}>
                          <span className="text-sm font-bold text-ink-100">{entry.speaker}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm text-ink-100 leading-relaxed flex-1">{entry.text}</p>
                            <span className="text-xs text-ink-500 font-mono flex-shrink-0">{entry.timestamp}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="px-2.5 py-1 rounded-lg bg-signal-intent/10 text-signal-intent text-xs font-medium">
                              {entry.analysis.intent}
                            </span>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${trajectoryColors[entry.analysis.trajectory]} bg-ink-700/40`}>
                              {trajectoryLabels[entry.analysis.trajectory]}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-ink-700/40 text-ink-300 text-xs font-medium">
                              {entry.analysis.sentiment}
                            </span>
                            {entry.analysis.intentShift && (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-signal-urgency/15 text-signal-urgency text-xs font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                Intent Shift
                              </span>
                            )}
                          </div>
                          {entry.analysis.intentShift && entry.analysis.shiftDescription && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-signal-urgency/8 border border-signal-urgency/20 mb-3">
                              <AlertTriangle className="w-4 h-4 text-signal-urgency flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-ink-200 leading-relaxed">{entry.analysis.shiftDescription}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {signalBars(entry.analysis).map((bar) => (
                              <div key={bar.label}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-ink-400">{bar.label}</span>
                                  <span className={`text-xs font-mono font-semibold ${bar.text}`}>{bar.value}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-ink-700/50 overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${bar.color}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${bar.value}%` }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/8 border border-accent/20">
                            <Eye className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-ink-200 leading-relaxed">{entry.analysis.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass rounded-xl p-5 flex items-center gap-3"
                  >
                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    <span className="text-sm text-ink-300">Gemini AI is analyzing...</span>
                  </motion.div>
                )}
              </div>
            )}

            {entries.length === 0 && !listening && !loading && (
              <div className="glass rounded-2xl p-12 text-center">
                <Mic className="w-12 h-12 text-ink-600 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-ink-200 mb-2">Ready for live voice analysis</h3>
                <p className="text-sm text-ink-400 max-w-md mx-auto leading-relaxed mb-4">
                  Select a speaker, tap the microphone, and start talking. CONCORD transcribes your speech and sends it to Gemini AI for real-time analysis — alignment, friction, urgency, trajectory, and intent shifts, all live.
                </p>
                <p className="text-xs text-ink-500">Auto-switches speakers after each message. Works best in Chrome.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
