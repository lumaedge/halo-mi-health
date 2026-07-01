-- Halo Mi Health: Add emergency information fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS waist_hip_ratio NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT,
  ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT,
  ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT,
  ADD COLUMN IF NOT EXISTS ambulance_service TEXT,
  ADD COLUMN IF NOT EXISTS ambulance_number TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT;

-- Allow NULL for blood_type constraint to accept text input
ALTER TABLE profiles
  ALTER COLUMN blood_type DROP NOT NULL;
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_blood_type_check;
