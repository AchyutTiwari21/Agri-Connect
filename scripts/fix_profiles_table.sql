-- Fix Profiles Table - Run this in Supabase SQL Editor if you're getting "table not found" errors
-- This script ensures the profiles table exists and has all necessary functions

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('consumer', 'farmer')),
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create function to handle profile creation securely
CREATE OR REPLACE FUNCTION create_user_profile(
  p_name text,
  p_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the current user ID from JWT
  v_user_id := auth.uid();
  
  -- If no user ID, return error
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create profile';
  END IF;
  
  -- Insert profile, ignoring conflicts (profile might already exist)
  INSERT INTO profiles (id, name, role)
  VALUES (v_user_id, p_name, p_role)
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, role = EXCLUDED.role;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(text, text) TO authenticated;

-- Create function to automatically create profile from user metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_role text;
BEGIN
  -- Extract name and role from user metadata
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'consumer');
  
  -- Only create profile if name is provided
  IF v_name IS NOT NULL AND v_name != '' THEN
    INSERT INTO profiles (id, name, role)
    VALUES (NEW.id, v_name, v_role)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Refresh the schema cache (this helps Supabase recognize the new table)
NOTIFY pgrst, 'reload schema';

