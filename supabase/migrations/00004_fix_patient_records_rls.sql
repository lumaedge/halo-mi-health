-- Allow patients to see all their own records (not just approved ones)
DROP POLICY IF EXISTS "Patients can view own approved records" ON medical_records;

CREATE POLICY "Patients can view own records"
  ON medical_records FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );
