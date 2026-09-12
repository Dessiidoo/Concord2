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

type Entry = {
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
  
  // Safely initialized at the top of the component
  const finalSpeechBufferRef = useRef('')
  const loadingRef = useRef(false)

  entriesRef.current = entries
  speakerRef.current = speaker
  autoModeRef.current = autoMode

  const submitTranscript = useCallback(async () => {
    const text = finalSpeechBufferRef.current.trim()
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
      
      finalSpeechBufferRef.current = ''
      setTranscript('')
      setInterimTranscript('')
      setSpeaker((prev) => (prev === 'A' ? 'B' : 'A'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const SR = getSpeechRecognition()
    if (!SR) {
      setSupported(false)
      return
    }
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = false 

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let freshFinalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          freshFinalText += result[0].transcript
        }
      }

      if (freshFinalText.trim()) {
        finalSpeechBufferRef.current = freshFinalText.trim()
        setTranscript(freshFinalText.trim())
        setInterimTranscript('')

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => {
          submitTranscript()
        }, 1200)
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
  }, [submitTranscript])

  const startListening = () => {
    if (!recognitionRef.current) return
    setError(null)
    setAutoMode(true)
    autoModeRef.current = true
    setListening(true)
    setTranscript('')
    setInterimTranscript('')
    finalSpeechBufferRef.current = ''
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
    if (finalSpeechBufferRef.current.trim().length >= 3) {
      submitTranscript()
    }
  }

  const clearAll = () => {
    setEntries([])
    setTranscript('')
    setInterimTranscript('')
    finalSpeechBufferRef.current = ''
    setError(null)
    setSpeaker('A')
  }

  const latestAnalysis = entries.length > 0 ? entries[entries.length - 1].analysis : null

  const signalBars = (a: Analysis) => [
  { label: 'Alignment', value: a.alignment, color: 'bg-signal-alignment', text: 'text-signal-alignment', icon: CheckCircle2 },
  { label: 'Friction', value: a.friction, color: 'bg-signal-friction', text: 'text-signal-friction', icon: AlertTriangle },
  { label: 'Urgency', value: a.urgency, color: 'bg-signal-urgency', text: 'text-signal-urgency', icon: Zap }
]
