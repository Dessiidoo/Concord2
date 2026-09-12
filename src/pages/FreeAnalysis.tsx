import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Target, AlertTriangle, TrendingUp,
  Brain, Eye, Radio, Send, Trash2, Sparkles, Loader2, Wifi,
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

type Entry = {
  id: number
  text: string
  speaker: 'A' | 'B'
  analysis: Analysis
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
  if (!data.analysis) throw new Error('No analysis returned from server')

  return data.analysis as Analysis
}

export default function FreeAnalysis() {
  const [input, setInput] = useState('')
  const [speaker, setSpeaker] = useState<'A' | 'B'>('A')
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (input.trim().length < 3 || loading) return
    setLoading(true)
    setError(null)

    const history = entries.map((e) => ({ speaker: e.speaker, text: e.text }))

    try {
      const analysis = await callGeminiAnalysis(input.trim(), speaker, history)
      const entry: Entry = {
        id: Date.now(),
        text: input.trim(),
        speaker,
        analysis,
      }
      setEntries((prev) => [...prev, entry])
      setInput('')
      setSpeaker((prev) => (prev === 'A' ? 'B' : 'A'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze message')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setEntries([])
    setInput('')
    setError(null)
    setSpeaker('A')
  }

  const signalBars = (analysis: Analysis) => [
    { label: 'Alignment', value: analysis.alignment, color: 'bg-signal-alignment', text: 'text-signal-alignment' },
    { label: 'Friction', value: analysis.friction, color: 'bg-signal-friction', text: 'text-signal-friction' },
    { label: 'Urgency', value: analysis.urgency, color: 'bg-signal-urgency', text: 'text-signal-urgency' },
  ]

  return (
    <div className="grid-bg min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <Radio className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-100">Freeform Analysis</h1>
              <p className="text-xs text-ink-400">Powered by Gemini AI — type any conversation for real-time analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-signal-alignment/10 text-signal-alignment text-xs font-medium">
              <Wifi className="w-3 h-3" />
              <span>Live AI</span>
            </div>
            {entries.length > 0 && (
              <button
                onClick={clear}
                className="flex items-center gap-2 px-3 py-2 rounded-lg glass-light text-ink-300 hover:text-signal-urgency transition-colors text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex rounded-lg overflow-hidden border border-ink-600">
              <button
                onClick={() => setSpeaker('A')}
                disabled={loading}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${speaker === 'A' ? 'bg-accent text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}
              >
                Speaker A
              </button>
              <button
                onClick={() => setSpeaker('B')}
                disabled={loading}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${speaker === 'B' ? 'bg-accent text-ink-950' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}
              >
                Speaker B
              </button>
            </div>
            <span className="text-xs text-ink-400">— type your message below</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit() }
            }}
            disabled={loading}
            placeholder="Type or paste a conversation message here... (Cmd/Ctrl+Enter to analyze)"
            className="w-full h-32 bg-ink-900/60 rounded-xl border border-ink-600/50 p-4 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 resize-none transition-all disabled:opacity-50"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-ink-500">{input.length} characters</span>
            <button
              onClick={submit}
              disabled={input.trim().length < 3 || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-ink-950 font-semibold text-xs hover:bg-accent-glow transition-all glow-cyan disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Analyze
                </>
              )}
            </button>
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
                  <p className="text-sm font-medium text-signal-urgency mb-1">Analysis Error</p>
                  <p className="text-xs text-ink-300 leading-relaxed">{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {loading && entries.length === 0 && !error && (
          <div className="glass rounded-2xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-accent mx-auto mb-4 animate-spin" />
            <p className="text-sm text-ink-300">Analyzing with Gemini AI...</p>
          </div>
        )}

        {/* Conversation History */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-accent" />
              <h2 className="text-sm font-semibold text-ink-100">Conversation Analysis</h2>
              <span className="text-xs text-ink-500">({entries.length} messages)</span>
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
                      <p className="text-sm text-ink-100 leading-relaxed mb-3">{entry.text}</p>
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
                <span className="text-sm text-ink-300">Analyzing with Gemini AI...</span>
              </motion.div>
            )}
          </div>
        )}

        {entries.length === 0 && !loading && !error && (
          <div className="glass rounded-2xl p-12 text-center">
            <Brain className="w-12 h-12 text-ink-600 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-ink-200 mb-2">Ready for real AI analysis</h3>
            <p className="text-sm text-ink-400 max-w-md mx-auto leading-relaxed">
              Type any conversation message above. Google's Gemini AI will analyze intent, alignment, friction, urgency, and trajectory in real time — no scripts, no pre-written scenarios.
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-ink-500">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Powered by Gemini 2.0 Flash
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
