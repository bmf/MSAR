-- 0006_admin_functions.sql
-- Add helper functions for admin operations

-- Note: Creating users in Supabase Auth from the client requires admin privileges
-- This migration documents the approach, but actual user creation will need to be
-- handled through Supabase's Management API or Dashboard for security reasons.

-- For now, we'll add a column to track if a profile was created from an account request
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_request_id bigint REFERENCES public.account_requests(id);

-- Add RLS policy to allow admins to insert profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- Update account_requests to add approved_by column
ALTER TABLE public.account_requests ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.account_requests ADD COLUMN IF NOT EXISTS approved_at timestamptz;
