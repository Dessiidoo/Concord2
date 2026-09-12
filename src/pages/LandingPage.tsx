import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Activity, ArrowRight, Radio, Languages, Zap, TrendingUp,
  Shield, Building2, Globe, AlertTriangle, Eye,
  CheckCircle2, Brain, Waves, Target,
} from 'lucide-react'
import { scenarios } from '../lib/scenarios'

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % scenarios.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const domains = [
    { icon: Shield, title: 'Government & Diplomacy', desc: 'International negotiations, diplomatic meetings, crisis dialogue, cross-government coordination.' },
    { icon: Building2, title: 'Enterprise', desc: 'Customer service, sales, executive communications, negotiations, conflict resolution.' },
    { icon: Radio, title: 'Defense & Security', desc: 'Liaison communications, multinational coordination, negotiation environments.' },
    { icon: Globe, title: 'Global Organizations', desc: 'Humanitarian operations, international partnerships, cross-cultural communication.' },
  ]

  const signals = [
    { icon: Target, label: 'Intent', color: 'text-signal-intent', bg: 'bg-signal-intent/10', desc: 'What does each participant appear to be driving toward?' },
    { icon: CheckCircle2, label: 'Alignment', color: 'text-signal-alignment', bg: 'bg-signal-alignment/10', desc: 'Are the parties moving together or apart?' },
    { icon: AlertTriangle, label: 'Friction', color: 'text-signal-friction', bg: 'bg-signal-friction/10', desc: 'Where is resistance building in the interaction?' },
    { icon: Zap, label: 'Urgency', color: 'text-signal-urgency', bg: 'bg-signal-urgency/10', desc: 'Is the pressure to act rising or falling?' },
    { icon: TrendingUp, label: 'Trajectory', color: 'text-signal-trajectory', bg: 'bg-signal-trajectory/10', desc: 'Where is the conversation heading?' },
    { icon: Brain, label: 'Intent Shifts', color: 'text-accent', bg: 'bg-accent/10', desc: 'When does the direction of the interaction change?' },
  ]

  return (
    <div className="grid-bg">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-signal-intent/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-xs font-medium text-ink-300 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Real-time Conversational Intelligence Platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            See the conversation
            <br />
            <span className="gradient-text">change while it happens.</span>
          </h1>
          <p className="text-lg sm:text-xl text-ink-300 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            CONCORD analyzes the evolving dynamics of a conversation in real time —
            surfacing shifts in intent, alignment, friction, and urgency before they become obvious.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link
              to={`/live/${scenarios[0].id}`}
              className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-ink-950 font-semibold text-sm hover:bg-accent-glow transition-all glow-cyan"
            >
              <Radio className="w-4 h-4" />
              Launch Live Session
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/sessions"
              className="flex items-center gap-2 px-6 py-3 rounded-xl glass-light text-ink-100 font-medium text-sm hover:bg-ink-700/60 transition-all"
            >
              View Session Archive
            </Link>
          </div>
        </div>

        {/* Live Waveform Preview */}
        <div className="relative max-w-5xl mx-auto px-6 pb-16">
          <div className="glass rounded-2xl p-8 glow-cyan">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Waves className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-100">Live Waveform</div>
                  <div className="text-xs text-ink-400">Real-time conversational signal</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <span className="w-2 h-2 rounded-full bg-signal-urgency animate-pulse" />
                Monitoring
              </div>
            </div>
            <div className="flex items-end justify-center gap-1 h-24">
              {Array.from({ length: 60 }).map((_, i) => {
                const height = 20 + Math.abs(Math.sin(i * 0.3 + Date.now() / 1000)) * 60 + Math.random() * 15
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-accent/40 to-accent"
                    style={{ height: `${height}%`, transition: 'height 0.3s ease' }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-100 mb-4">The Opportunity</h2>
          <p className="text-lg text-ink-300 leading-relaxed max-w-3xl mx-auto">
            Communication can fail long before the words themselves become obviously confrontational.
            A conversation can shift from cooperation to resistance, from negotiation to concern,
            or from routine interaction to escalation in a matter of seconds.
            In multilingual and high-stakes environments, those changes can be especially difficult to recognize in real time.
          </p>
        </div>
      </section>

      {/* The Concept */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-100 mb-4">The Concept</h2>
          <p className="text-lg text-ink-300 max-w-2xl mx-auto">
            CONCORD provides an analytical layer that helps participants understand where the conversation is moving.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.map((signal, i) => {
            const Icon = signal.icon
            return (
              <div
                key={signal.label}
                className="glass rounded-xl p-6 hover:bg-ink-800/60 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={`w-12 h-12 rounded-xl ${signal.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${signal.color}`} />
                </div>
                <h3 className="text-base font-semibold text-ink-100 mb-2">{signal.label}</h3>
                <p className="text-sm text-ink-300 leading-relaxed">{signal.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-100 mb-4">How It Works</h2>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2">
          {[
            { label: 'Conversation', icon: Radio, desc: 'Conversational input is processed' },
            { label: 'Analysis', icon: Brain, desc: 'Contextual signals are evaluated' },
            { label: 'Signal', icon: Activity, desc: 'Meaningful changes are identified' },
            { label: 'Adaptation', icon: Eye, desc: 'Recommendations are surfaced' },
          ].map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-center gap-2">
                <div className="glass rounded-xl p-6 text-center w-44">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <div className="text-sm font-semibold text-ink-100 mb-1">{step.label}</div>
                  <div className="text-xs text-ink-400">{step.desc}</div>
                </div>
                {i < 3 && <ArrowRight className="w-5 h-5 text-ink-500 hidden sm:block" />}
              </div>
            )
          })}
        </div>
      </section>

      {/* Intent Shift Demo */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-100 mb-4">Intent Shift Detection</h2>
          <p className="text-lg text-ink-300 max-w-2xl mx-auto">
            When the apparent direction of the interaction changes, CONCORD surfaces it immediately.
          </p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {scenarios.map((scenario, i) => {
            const shift = scenario.messages.find((m) => m.intentShift)
            return (
              <div
                key={scenario.id}
                className={`glass rounded-2xl p-6 cursor-pointer transition-all hover:bg-ink-800/60 ${
                  activeDemo === i ? 'ring-2 ring-accent/40 glow-cyan' : ''
                }`}
                onMouseEnter={() => setActiveDemo(i)}
              >
                <div className="text-xs text-ink-400 mb-2">{scenario.domain}</div>
                <h3 className="text-lg font-semibold text-ink-100 mb-4">{scenario.title}</h3>
                {shift && shift.intentShift && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1 rounded-lg bg-signal-intent/15 text-signal-intent font-medium">
                        {shift.intentShift.from}
                      </span>
                      <ArrowRight className="w-4 h-4 text-ink-400" />
                      <span className="px-3 py-1 rounded-lg bg-signal-friction/15 text-signal-friction font-medium">
                        {shift.intentShift.to}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-signal-urgency/8 border border-signal-urgency/20">
                      <AlertTriangle className="w-4 h-4 text-signal-urgency flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-ink-200 leading-relaxed">{shift.intentShift.description}</p>
                    </div>
                    {shift.recommendation && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/8 border border-accent/20">
                        <Eye className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-ink-200 leading-relaxed">{shift.recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
                <Link
                  to={`/live/${scenario.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-glow transition-colors"
                >
                  Run this simulation
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* Multilingual */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="glass rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Languages className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-3xl font-bold text-ink-100 mb-4">Multilingual Intelligence</h2>
          <p className="text-lg text-ink-300 leading-relaxed max-w-2xl mx-auto mb-8">
            Participants may communicate in their own languages while CONCORD provides a shared analytical layer across the interaction.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="glass-light rounded-xl p-6">
              <div className="text-xs text-ink-400 mb-2">Translation answers</div>
              <div className="text-lg font-semibold text-ink-100">What was said?</div>
            </div>
            <div className="glass-light rounded-xl p-6">
              <div className="text-xs text-ink-400 mb-2">CONCORD adds</div>
              <div className="text-lg font-semibold text-accent">What appears to be changing?</div>
            </div>
          </div>
        </div>
      </section>

      {/* Applications */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ink-100 mb-4">Potential Applications</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {domains.map((domain, i) => {
            const Icon = domain.icon
            return (
              <div
                key={domain.title}
                className="glass rounded-xl p-6 hover:bg-ink-800/60 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-base font-semibold text-ink-100 mb-2">{domain.title}</h3>
                <p className="text-sm text-ink-300 leading-relaxed">{domain.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-ink-100 mb-4">
          See the conversation change.
        </h2>
        <p className="text-lg text-ink-300 mb-8">
          Its purpose is not to replace human judgment. It is to provide an additional layer of situational awareness while the conversation is happening.
        </p>
        <Link
          to={`/live/${scenarios[0].id}`}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-accent text-ink-950 font-semibold text-sm hover:bg-accent-glow transition-all glow-cyan"
        >
          <Radio className="w-5 h-5" />
          Launch Live Session
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  )
}
