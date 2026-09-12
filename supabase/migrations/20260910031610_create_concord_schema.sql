/*
# CONCORD — Conversational Intelligence Schema

1. Purpose
   CONCORD is a real-time conversational intelligence platform. This schema stores
   conversation sessions, the messages exchanged, the analytical signals derived
   from those messages, and the intent-shift events that mark meaningful changes
   in conversational direction.

2. New Tables
   - `sessions`: A conversation session (e.g. a negotiation, diplomatic meeting).
     - id (uuid PK)
     - title (text) — human-readable label
     - scenario (text) — the simulation scenario key
     - status (text) — 'active' | 'completed' | 'archived'
     - language_a (text) — primary language of participant A
     - language_b (text) — primary language of participant B
     - participant_a (text) — label for participant A
     - participant_b (text) — label for participant B
     - started_at (timestamptz)
     - ended_at (timestamptz, nullable)
     - created_at (timestamptz)

   - `messages`: Individual conversational turns within a session.
     - id (uuid PK)
     - session_id (uuid FK → sessions)
     - speaker (text) — 'A' or 'B'
     - speaker_label (text) — display name
     - language (text) — language code of the original utterance
     - original_text (text) — what was said in the original language
     - translated_text (text) — English translation
     - sequence (int) — ordering within the session
     - created_at (timestamptz)

   - `signals`: Analytical readings attached to each message.
     - id (uuid PK)
     - session_id (uuid FK → sessions)
     - message_id (uuid FK → messages)
     - intent (text) — current intent classification
     - alignment (int) — 0-100, how aligned the parties are
     - friction (int) — 0-100, level of friction/resistance
     - urgency (int) — 0-100, urgency level
     - trajectory (text) — 'converging' | 'diverging' | 'stable' | 'escalating' | 'de-escalating'
     - sentiment (text) — brief sentiment description
     - recommendation (text, nullable) — suggested response guidance
     - created_at (timestamptz)

   - `intent_shifts`: Records of detected intent changes.
     - id (uuid PK)
     - session_id (uuid FK → sessions)
     - message_id (uuid FK → messages) — the message that triggered the shift
     - from_intent (text) — previous intent
     - to_intent (text) — new intent
     - description (text) — human-readable explanation
     - severity (text) — 'low' | 'medium' | 'high'
     - created_at (timestamptz)

3. Security
   - RLS enabled on all tables.
   - Single-tenant, no-auth prototype: all tables allow anon + authenticated full CRUD
     with USING (true) / WITH CHECK (true) because the data is intentionally shared.

4. Indexes
   - messages: session_id, sequence
   - signals: session_id, message_id
   - intent_shifts: session_id
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  scenario text NOT NULL DEFAULT 'custom',
  status text NOT NULL DEFAULT 'active',
  language_a text NOT NULL DEFAULT 'en',
  language_b text NOT NULL DEFAULT 'en',
  participant_a text NOT NULL DEFAULT 'Participant A',
  participant_b text NOT NULL DEFAULT 'Participant B',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  speaker text NOT NULL,
  speaker_label text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  original_text text NOT NULL,
  translated_text text NOT NULL DEFAULT '',
  sequence int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_session_seq ON messages(session_id, sequence);

CREATE TABLE IF NOT EXISTS signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  intent text NOT NULL DEFAULT 'Information Exchange',
  alignment int NOT NULL DEFAULT 50,
  friction int NOT NULL DEFAULT 10,
  urgency int NOT NULL DEFAULT 20,
  trajectory text NOT NULL DEFAULT 'stable',
  sentiment text NOT NULL DEFAULT 'neutral',
  recommendation text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_signals" ON signals;
CREATE POLICY "anon_select_signals" ON signals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_signals" ON signals;
CREATE POLICY "anon_insert_signals" ON signals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_signals" ON signals;
CREATE POLICY "anon_update_signals" ON signals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_signals" ON signals;
CREATE POLICY "anon_delete_signals" ON signals FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_signals_session ON signals(session_id);
CREATE INDEX IF NOT EXISTS idx_signals_message ON signals(message_id);

CREATE TABLE IF NOT EXISTS intent_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  from_intent text NOT NULL,
  to_intent text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE intent_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_intent_shifts" ON intent_shifts;
CREATE POLICY "anon_select_intent_shifts" ON intent_shifts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_intent_shifts" ON intent_shifts;
CREATE POLICY "anon_insert_intent_shifts" ON intent_shifts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_intent_shifts" ON intent_shifts;
CREATE POLICY "anon_update_intent_shifts" ON intent_shifts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_intent_shifts" ON intent_shifts;
CREATE POLICY "anon_delete_intent_shifts" ON intent_shifts FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_intent_shifts_session ON intent_shifts(session_id);
