-- Medi Records Database Schema
-- Supabase SQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- PROFILES
-- =====================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'provider', 'admin', 'caregiver')) DEFAULT 'patient',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  id_number TEXT,
  medical_scheme TEXT,
  membership_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can view patient profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('provider', 'admin')
    )
  );

-- =====================
-- MEDICAL RECORDS
-- =====================
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN (
    'consultation', 'prescription', 'lab_result', 'imaging',
    'referral', 'vaccination', 'procedure', 'medical_certificate', 'note'
  )),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_approved BOOLEAN DEFAULT FALSE,
  is_handwritten BOOLEAN DEFAULT FALSE,
  original_image_url TEXT,
  enhanced_image_url TEXT,
  ocr_text TEXT,
  ai_summary TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own approved records"
  ON medical_records FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    ) AND is_approved = TRUE
  );

CREATE POLICY "Providers can view and manage records"
  ON medical_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('provider', 'admin')
    )
  );

-- =====================
-- TIMELINE EVENTS
-- =====================
CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  record_id UUID REFERENCES medical_records(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  provider_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own timeline"
  ON timeline_events FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can view patient timelines"
  ON timeline_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('provider', 'admin')
    )
  );

-- =====================
-- MEDICATIONS
-- =====================
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  instructions TEXT,
  prescribed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own medications"
  ON medications FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can manage medications"
  ON medications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('provider', 'admin')
    )
  );

-- =====================
-- ALLERGIES
-- =====================
CREATE TABLE allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  allergen TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  reaction TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own allergies"
  ON allergies FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- =====================
-- CONDITIONS
-- =====================
CREATE TABLE conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  diagnosis_date DATE,
  is_chronic BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own conditions"
  ON conditions FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- =====================
-- SHARE LINKS
-- =====================
CREATE TABLE share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  record_ids UUID[] NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  max_access_count INTEGER DEFAULT -1,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own share links"
  ON share_links FOR ALL
  USING (
    patient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- =====================
-- APPOINTMENTS
-- =====================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can manage appointments"
  ON appointments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('provider', 'admin')
    )
  );

-- =====================
-- AUDIT LOGS
-- =====================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_provider ON medical_records(provider_id);
CREATE INDEX idx_medical_records_date ON medical_records(date DESC);
CREATE INDEX idx_medical_records_approved ON medical_records(is_approved);
CREATE INDEX idx_timeline_events_patient ON timeline_events(patient_id);
CREATE INDEX idx_timeline_events_date ON timeline_events(date DESC);
CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_medications_active ON medications(is_active);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_share_links_token ON share_links(token);

-- =====================
-- TRIGGERS
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
