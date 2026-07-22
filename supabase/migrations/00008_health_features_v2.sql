-- Health Features v2: Compliance, Vitals, Goals, Consultations

-- =====================
-- MEDICATION DOSES (Compliance Tracking)
-- =====================
CREATE TABLE medication_doses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'snoozed')) DEFAULT 'taken',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medication_doses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own doses"
  ON medication_doses FOR ALL
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- =====================
-- VITAL SIGNS (BP, Blood Sugar, etc.)
-- =====================
CREATE TABLE vital_signs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('blood_pressure_systolic', 'blood_pressure_diastolic', 'blood_sugar', 'heart_rate', 'oxygen_saturation', 'temperature', 'respiratory_rate')),
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'apple_health', 'google_fit', 'device')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vital_signs_patient_type ON vital_signs(patient_id, type);
CREATE INDEX idx_vital_signs_recorded_at ON vital_signs(recorded_at);

ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vitals"
  ON vital_signs FOR ALL
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- =====================
-- CONDITION GOALS (Therapeutic Targets)
-- =====================
CREATE TABLE condition_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  metric TEXT NOT NULL,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL,
  unit TEXT,
  comparison TEXT NOT NULL CHECK (comparison IN ('lt', 'lte', 'gt', 'gte', 'eq')) DEFAULT 'lte',
  achieved BOOLEAN DEFAULT FALSE,
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE condition_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals"
  ON condition_goals FOR ALL
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- =====================
-- CONSULTATIONS (AI symptom check history)
-- =====================
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  symptoms TEXT[] NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  description TEXT,
  urgency TEXT NOT NULL CHECK (urgency IN ('self-care', 'appointment', 'urgent', 'emergency')),
  possible_conditions TEXT[],
  recommendation TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own consultations"
  ON consultations FOR ALL
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- =====================
-- CONSULTATION IMAGES
-- =====================
CREATE TABLE consultation_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  storage_path TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('symptom_photo', 'rash', 'wound', 'other')),
  ai_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consultation_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own consultation images"
  ON consultation_images FOR ALL
  USING (patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
