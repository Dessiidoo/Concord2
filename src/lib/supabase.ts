import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
})

export type Session = {
  id: string
  title: string
  scenario: string
  status: string
  language_a: string
  language_b: string
  participant_a: string
  participant_b: string
  started_at: string
  ended_at: string | null
  created_at: string
}

export type Message = {
  id: string
  session_id: string
  speaker: string
  speaker_label: string
  language: string
  original_text: string
  translated_text: string
  sequence: number
  created_at: string
}

export type Signal = {
  id: string
  session_id: string
  message_id: string
  intent: string
  alignment: number
  friction: number
  urgency: number
  trajectory: string
  sentiment: string
  recommendation: string | null
  created_at: string
}

export type IntentShift = {
  id: string
  session_id: string
  message_id: string
  from_intent: string
  to_intent: string
  description: string
  severity: string
  created_at: string
}
