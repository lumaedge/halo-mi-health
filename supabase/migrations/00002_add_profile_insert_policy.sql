-- Add missing INSERT policy for profiles table
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Also add INSERT policy for providers to create patient profiles
CREATE POLICY "Providers can create patient profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('provider', 'admin')
    )
  );
