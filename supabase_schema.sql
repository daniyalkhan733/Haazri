-- SQL Schema for Personal Attendance Tracker
-- Paste this script into your Supabase SQL Editor (https://supabase.com) to initialize tables.

-- 1. Create the Profile Table
CREATE TABLE IF NOT EXISTS public.profile (
    id TEXT PRIMARY KEY DEFAULT 'me',
    name TEXT NOT NULL,
    employee_id TEXT,
    email TEXT,
    department TEXT,
    profile_image TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TEXT,
    check_out_time TEXT,
    total_hours DOUBLE PRECISION DEFAULT 0.0,
    total_minutes INTEGER DEFAULT 0,
    overtime DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'Present',
    remarks TEXT,
    gps_in JSONB,
    gps_out JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add Indexes for Fast Filtering
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_date ON public.attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- 4. Enable Row Level Security (Optional - disable if using public access for simplified setups)
-- For a quick start, you can disable RLS or add a simple policy for anonymised read/writes.
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write access to profiles" 
ON public.profile FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read/write access to attendance logs" 
ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed default profile
INSERT INTO public.profile (id, name, employee_id, email, department, profile_image)
VALUES (
    'me',
    'Alex Mercer',
    'EMP-101',
    'alex@company.com',
    'Product Development',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
) ON CONFLICT (id) DO NOTHING;
