import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Radio, Activity, Brain, Zap, TrendingUp,
  Target, CheckCircle2, AlertTriangle, Eye, Languages, Shield,
  Building2, Globe, Waves, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { scenarios } from '../lib/scenarios'

type Slide = {
  id: string
  kind: 'title' | 'problem' | 'concept' | 'signals' | 'flow' | 'shift' | 'multilingual' | 'applications' | 'closing'
  title?: string
  subtitle?: string
}

const slides: Slide[] = [
  { id: 's1', kind: 'title' },
  { id: 's2', kind: 'problem', title: 'The Opportunity', subtitle: 'Conversations shift before words become confrontational' },
  { id: 's3', kind: 'concept', title: 'The Concept', subtitle: 'An analytical layer for live conversation' },
  { id: 's4', kind: 'signals', title: 'Six Signals', subtitle: 'What CONCORD tracks in real time' },
  { id: 's5', kind: 'flow', title: 'How It Works', subtitle: 'From conversation to adaptation' },
  { id: 's6', kind: 'shift', title: 'Intent Shift Detection', subtitle: 'Surfacing changes as they happen' },
  { id: 's7', kind: 'multilingual', title: 'Multilingual Intelligence', subtitle: 'A shared analytical layer across languages' },
  { id: 's8', kind: 'applications', title: 'Potential Applications', subtitle: 'Where CONCORD creates value' },
  { id: 's9', kind: 'closing' },
]

const signals = [
  { icon: Target, label: 'Intent', color: 'text-signal-intent', bg: 'bg-signal-intent/15', desc: 'What each participant is driving toward' },
  { icon: CheckCircle2, label: 'Alignment', color: 'text-signal-alignment', bg: 'bg-signal-alignment/15', desc: 'Are parties moving together or apart?' },
  { icon: AlertTriangle, label: 'Friction', color: 'text-signal-friction', bg: 'bg-signal-friction/15', desc: 'Where resistance is building' },
  { icon: Zap, label: 'Urgency', color: 'text-signal-urgency', bg: 'bg-signal-urgency/15', desc: 'Is pressure rising or falling?' },
  { icon: TrendingUp, label: 'Trajectory', color: 'text-signal-trajectory', bg: 'bg-signal-trajectory/15', desc: 'Where the conversation is heading' },
  { icon: Brain, label: 'Intent Shifts', color: 'text-accent', bg: 'bg-accent/15', desc: 'When the direction changes' },
]

const domains = [
  { icon: Shield, title: 'Government & Diplomacy', desc: 'International negotiations, diplomatic meetings, crisis dialogue, cross-government coordination.' },
  { icon: Building2, title: 'Enterprise', desc: 'Customer service, sales, executive communications, negotiations, conflict resolution.' },
  { icon: Radio, title: 'Defense & Security', desc: 'Liaison communications, multinational coordination, negotiation environments.' },
  { icon: Globe, title: 'Global Organizations', desc: 'Humanitarian operations, international partnerships, cross-cultural communication.' },
]

const flowSteps = [
  { label: 'Conversation', icon: Radio, desc: 'Conversational input is processed' },
  { label: 'Analysis', icon: Brain, desc: 'Contextual signals are evaluated' },
  { label: 'Signal', icon: Activity, desc: 'Meaningful changes are identified' },
  { label: 'Adaptation', icon: Eye, desc: 'Recommendations are surfaced' },
]

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
}

export default function PitchDeck() {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)

  const go = useCallback((next: number) => {
    setDir(next > index ? 1 : -1)
    setIndex(Math.max(0, Math.min(slides.length - 1, next)))
  }, [index])

  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev() }
      if (e.key === 'Home') { e.preventDefault(); go(0) }
      if (e.key === 'End') { e.preventDefault(); go(slides.length - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, go])

  const slide = slides[index]
  const progress = ((index + 1) / slides.length) * 100

  return (
    <div className="fixed inset-0 bg-ink-950 grid-bg overflow-hidden flex flex-col">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-signal-intent/8 rounded-full blur-3xl pointer-events-none" />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-ink-700/30 z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-signal-intent"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-40 flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent/20 to-signal-intent/20 group-hover:from-accent/30 group-hover:to-signal-intent/30 transition-all" />
            <Activity className="w-4 h-4 text-accent relative z-10" />
          </div>
          <span className="font-semibold text-ink-100 text-sm tracking-tight">CONCORD</span>
        </Link>
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span className="font-mono">{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
          <span className="hidden sm:inline text-ink-500">·</span>
          <span className="hidden sm:inline">Use ← → to navigate</span>
        </div>
      </div>

      {/* Slide area */}
      <div className="relative flex-1 flex items-center justify-center px-6 pb-20">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide.id}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-5xl"
          >
            {slide.kind === 'title' && <TitleSlide />}
            {slide.kind === 'problem' && <ProblemSlide />}
            {slide.kind === 'concept' && <ConceptSlide />}
            {slide.kind === 'signals' && <SignalsSlide signals={signals} />}
            {slide.kind === 'flow' && <FlowSlide steps={flowSteps} />}
            {slide.kind === 'shift' && <ShiftSlide />}
            {slide.kind === 'multilingual' && <MultilingualSlide />}
            {slide.kind === 'applications' && <ApplicationsSlide domains={domains} />}
            {slide.kind === 'closing' && <ClosingSlide />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="relative z-40 flex items-center justify-center gap-6 pb-6">
        <button
          onClick={prev}
          disabled={index === 0}
          className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-ink-300 hover:text-ink-100 hover:bg-ink-700/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-8 bg-accent' : 'w-1.5 bg-ink-600 hover:bg-ink-500'
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          disabled={index === slides.length - 1}
          className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-ink-300 hover:text-ink-100 hover:bg-ink-700/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

function TitleSlide() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-xs font-medium text-ink-300 mb-8"
      >
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        Real-time Conversational Intelligence Platform
      </motion.div>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
      >
        See the conversation
        <br />
        <span className="gradient-text">change while it happens.</span>
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="text-lg sm:text-xl text-ink-300 max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        CONCORD analyzes the evolving dynamics of a conversation in real time —
        surfacing shifts in intent, alignment, friction, and urgency before they become obvious.
      </motion.p>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="flex items-center justify-center gap-3"
      >
        <Link
          to={`/live/${scenarios[0].id}`}
          className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-ink-950 font-semibold text-sm hover:bg-accent-glow transition-all glow-cyan"
        >
          <Radio className="w-4 h-4" />
          Launch Live Session
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="mt-16 flex items-center justify-center gap-2 text-xs text-ink-500"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Press the right arrow or spacebar to begin
      </motion.div>
    </div>
  )
}

function ProblemSlide() {
  return (
    <div>
      <SlideHeader title="The Opportunity" subtitle="Conversations shift before words become confrontational" />
      <div className="grid sm:grid-cols-3 gap-4 mt-12">
        {[
          { icon: AlertTriangle, color: 'text-signal-friction', bg: 'bg-signal-friction/15', title: 'Silent Shifts', desc: 'A conversation can move from cooperation to resistance in seconds — without any single statement that signals the change.' },
          { icon: Languages, color: 'text-signal-intent', bg: 'bg-signal-intent/15', title: 'Language Barriers', desc: 'In multilingual settings, tone, nuance, and intent are even harder to read in real time.' },
          { icon: Zap, color: 'text-signal-urgency', bg: 'bg-signal-urgency/15', title: 'High Stakes', desc: 'By the time a shift becomes obvious, the window to adapt may already be closing.' },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
              className="glass rounded-xl p-6"
            >
              <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <h3 className="text-base font-semibold text-ink-100 mb-2">{item.title}</h3>
              <p className="text-sm text-ink-300 leading-relaxed">{item.desc}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function ConceptSlide() {
  return (
    <div>
      <SlideHeader title="The Concept" subtitle="An analytical layer for live conversation" />
      <div className="mt-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass rounded-2xl p-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Brain className="w-8 h-8 text-accent" />
          </div>
          <p className="text-xl text-ink-100 leading-relaxed mb-6">
            CONCORD does not replace human judgment.
          </p>
          <p className="text-lg text-ink-300 leading-relaxed mb-8">
            It provides an additional layer of situational awareness —
            helping participants understand where the conversation is moving,
            while it is still happening.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass-light rounded-xl p-5">
              <div className="text-xs text-ink-400 mb-2">Translation answers</div>
              <div className="text-base font-semibold text-ink-100">What was said?</div>
            </div>
            <div className="glass-light rounded-xl p-5">
              <div className="text-xs text-ink-400 mb-2">CONCORD adds</div>
              <div className="text-base font-semibold text-accent">What appears to be changing?</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SignalsSlide({ signals }: { signals: typeof import('../lib/scenarios')['scenarios'] extends never ? never : { icon: typeof Target; label: string; color: string; bg: string; desc: string }[] }) {
  return (
    <div>
      <SlideHeader title="Six Signals" subtitle="What CONCORD tracks in real time" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {signals.map((signal, i) => {
          const Icon = signal.icon
          return (
            <motion.div
              key={signal.label}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
              className="glass rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${signal.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${signal.color}`} />
                </div>
                <h3 className="text-base font-semibold text-ink-100">{signal.label}</h3>
              </div>
              <p className="text-sm text-ink-300 leading-relaxed">{signal.desc}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function FlowSlide({ steps }: { steps: { label: string; icon: typeof Radio; desc: string }[] }) {
  return (
    <div>
      <SlideHeader title="How It Works" subtitle="From conversation to adaptation" />
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-3 mt-16">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <motion.div
              key={step.label}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="glass rounded-xl p-6 text-center w-44">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <div className="text-sm font-semibold text-ink-100 mb-1">{step.label}</div>
                <div className="text-xs text-ink-400">{step.desc}</div>
              </div>
              {i < steps.length - 1 && <ArrowRight className="w-5 h-5 text-ink-500 hidden sm:block" />}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function ShiftSlide() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % scenarios.length), 3500)
    return () => clearInterval(t)
  }, [])
  const scenario = scenarios[active]
  const shift = scenario.messages.find((m) => m.intentShift)
  return (
    <div>
      <SlideHeader title="Intent Shift Detection" subtitle="Surfacing changes as they happen" />
      <div className="mt-10 grid lg:grid-cols-4 gap-3">
        {scenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            className={`glass rounded-xl p-4 text-left transition-all ${active === i ? 'ring-2 ring-accent/40 glow-cyan' : 'hover:bg-ink-800/60'}`}
          >
            <div className="text-xs text-ink-400 mb-1">{s.domain}</div>
            <div className="text-sm font-semibold text-ink-100">{s.title}</div>
          </button>
        ))}
      </div>
      {shift && shift.intentShift && (
        <motion.div
          key={scenario.id}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mt-6 glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="px-4 py-1.5 rounded-lg bg-signal-intent/15 text-signal-intent font-medium text-sm">
              {shift.intentShift.from}
            </span>
            <ArrowRight className="w-5 h-5 text-ink-400" />
            <span className="px-4 py-1.5 rounded-lg bg-signal-friction/15 text-signal-friction font-medium text-sm">
              {shift.intentShift.to}
            </span>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-signal-urgency/8 border border-signal-urgency/20 mb-4">
            <AlertTriangle className="w-5 h-5 text-signal-urgency flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink-200 leading-relaxed">{shift.intentShift.description}</p>
          </div>
          {shift.recommendation && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/8 border border-accent/20">
              <Eye className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-ink-200 leading-relaxed">{shift.recommendation}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function MultilingualSlide() {
  return (
    <div>
      <SlideHeader title="Multilingual Intelligence" subtitle="A shared analytical layer across languages" />
      <div className="mt-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass rounded-2xl p-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Languages className="w-8 h-8 text-accent" />
          </div>
          <p className="text-lg text-ink-300 leading-relaxed text-center mb-8">
            Participants may communicate in their own languages while CONCORD provides
            a shared analytical layer across the interaction.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass-light rounded-xl p-6 text-center">
              <div className="text-xs text-ink-400 mb-2">Translation answers</div>
              <div className="text-lg font-semibold text-ink-100">What was said?</div>
            </div>
            <div className="glass-light rounded-xl p-6 text-center">
              <div className="text-xs text-ink-400 mb-2">CONCORD adds</div>
              <div className="text-lg font-semibold text-accent">What appears to be changing?</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function ApplicationsSlide({ domains }: { domains: { icon: typeof Shield; title: string; desc: string }[] }) {
  return (
    <div>
      <SlideHeader title="Potential Applications" subtitle="Where CONCORD creates value" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
        {domains.map((domain, i) => {
          const Icon = domain.icon
          return (
            <motion.div
              key={domain.title}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
              className="glass rounded-xl p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-ink-100 mb-2">{domain.title}</h3>
              <p className="text-sm text-ink-300 leading-relaxed">{domain.desc}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function ClosingSlide() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-xs font-medium text-ink-300 mb-8"
      >
        <Waves className="w-3.5 h-3.5 text-accent" />
        CONCORD
      </motion.div>
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-5xl sm:text-6xl font-bold tracking-tight mb-6"
      >
        See the conversation <span className="gradient-text">change.</span>
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="text-lg text-ink-300 max-w-2xl mx-auto mb-10 leading-relaxed"
      >
        Its purpose is not to replace human judgment. It is to provide an additional layer
        of situational awareness while the conversation is happening.
      </motion.p>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Link
          to={`/live/${scenarios[0].id}`}
          className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-ink-950 font-semibold text-sm hover:bg-accent-glow transition-all glow-cyan"
        >
          <Radio className="w-5 h-5" />
          Launch Live Session
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 px-8 py-4 rounded-xl glass-light text-ink-100 font-medium text-sm hover:bg-ink-700/60 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  )
}

function SlideHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-base sm:text-lg text-ink-400"
      >
        {subtitle}
      </motion.p>
    </div>
  )
}
