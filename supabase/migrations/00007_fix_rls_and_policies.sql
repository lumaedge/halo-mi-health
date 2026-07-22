-- Fix RLS: drop recursive provider policies on profiles, add missing patient policies
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Drop recursive policies that cause infinite recursion
DROP POLICY IF EXISTS "Providers can view patient profiles" ON profiles;
DROP POLICY IF EXISTS "Providers can create patient profiles" ON profiles;

-- 2. Re-add non-recursive versions using auth.jwt() claim
--    (or you can omit these if providers don't need to see patient profiles)
CREATE POLICY "Providers can view patient profiles"
  ON profiles FOR SELECT
  USING (
    auth.job() ->> 'role' IN ('provider', 'admin')
    OR
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
      AND raw_user_meta_data ->> 'role' IN ('provider', 'admin')
    )
  );

CREATE POLICY "Providers can create patient profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.job() ->> 'role' IN ('provider', 'admin')
    OR
    EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid()
      AND raw_user_meta_data ->> 'role' IN ('provider', 'admin')
    )
  );

-- 3. Add patient INSERT/UPDATE/DELETE policies for conditions
CREATE POLICY "Patients can insert own conditions"
  ON conditions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update own conditions"
  ON conditions FOR UPDATE
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can delete own conditions"
  ON conditions FOR DELETE
  USING (patient_id = auth.uid());

-- 4. Add patient INSERT/UPDATE/DELETE for medications
CREATE POLICY "Patients can insert own medications"
  ON medications FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update own medications"
  ON medications FOR UPDATE
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can delete own medications"
  ON medications FOR DELETE
  USING (patient_id = auth.uid());

-- 5. Add patient INSERT/UPDATE/DELETE for timeline_events
CREATE POLICY "Patients can insert own timeline events"
  ON timeline_events FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update own timeline events"
  ON timeline_events FOR UPDATE
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can delete own timeline events"
  ON timeline_events FOR DELETE
  USING (patient_id = auth.uid());

-- 6. Add patient INSERT for allergies
CREATE POLICY "Patients can insert own allergies"
  ON allergies FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update own allergies"
  ON allergies FOR UPDATE
  USING (patient_id = auth.uid());

CREATE POLICY "Patients can delete own allergies"
  ON allergies FOR DELETE
  USING (patient_id = auth.uid());

-- 7. Add patient INSERT for medical_records (handwritten note upload etc.)
CREATE POLICY "Patients can insert own records"
  ON medical_records FOR INSERT
  WITH CHECK (patient_id = auth.uid());
